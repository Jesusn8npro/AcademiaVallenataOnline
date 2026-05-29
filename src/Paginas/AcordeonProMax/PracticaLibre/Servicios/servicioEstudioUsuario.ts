import { supabase } from '../../../../servicios/clienteSupabase';
import type { NotaHero, SeccionV2 } from '../../GrabadorV2/tipos';
import {
  listarPistasUsuario, obtenerUrlFirmada, subirArchivoPistaUsuario,
  crearPistaUsuario, actualizarPistaUsuario, eliminarPistaUsuario,
  type PistaUsuario,
} from './servicioPistasUsuario';
import { comprimirAMp3 } from '../Utilidades/compresorMP3';

/**
 * Servicio de la pestaña ESTUDIO (versión usuario del grabador admin GrabadorV2).
 *
 * MISMAS TABLAS que ya usaba Práctica Libre — sin migraciones:
 *   - `pistas_usuario`        → la "canción" del alumno (audio + secciones + bpm + config).
 *   - `grabaciones_pista_usuario` → la secuencia de notas grabada (formato NotaHero, igual que admin).
 *
 * Modelo (paridad con admin `canciones_hero`): una pista del alumno = una canción con UNA
 * secuencia de estudio editable. La secuencia vive en una fila de `grabaciones_pista_usuario`
 * marcada con `config.formato = 'estudio'`; las secciones y el bpm viven en la pista.
 *
 * Aislado a propósito: hace sus propias llamadas a Supabase para la grabación de estudio y NO
 * toca el servicio viejo (servicioGrabacionesUsuario, formato ms) para no romper Mis Pistas.
 */

const TABLA_GRAB = 'grabaciones_pista_usuario';
const FORMATO_ESTUDIO = 'estudio';

/** Canción de estudio del alumno — superset de CancionV2 (lo que EditorCancion/ListaCancionesV2 leen). */
export interface CancionEstudio {
  id: string;                 // = pista_usuario.id
  titulo: string;
  autor: string;
  bpm: number;
  resolucion: number;
  audio_fondo_url: string | null; // signed URL (temporal)
  secuencia_json: NotaHero[];
  secciones: SeccionV2[];
  duracion_segundos: number | null;
  tonalidad: string | null;
  dificultad: string | null;
  tipo: string | null;
  usoMetronomo: boolean;
  // Extra para guardar de vuelta:
  storage_path: string;
  grabacionId: string | null; // fila de estudio en grabaciones_pista_usuario (null = aún no existe)
  creado_en?: string;
}

function normalizarSecuencia(raw: any): NotaHero[] {
  if (!raw) return [];
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return []; } }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n: any) => n && typeof n.tick === 'number' && typeof n.botonId === 'string')
    .map((n: any) => ({
      tick: Math.max(0, Math.floor(n.tick)),
      botonId: String(n.botonId),
      duracion: Math.max(1, Math.floor(n.duracion ?? 1)),
      fuelle: (n.fuelle === 'cerrando' ? 'cerrando' : 'abriendo') as 'cerrando' | 'abriendo',
    }))
    .sort((a, b) => a.tick - b.tick);
}

function normalizarSecciones(raw: any): SeccionV2[] {
  if (!raw) return [];
  if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { return []; } }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: any) => s && typeof s.tickInicio === 'number' && typeof s.tickFin === 'number')
    .map((s: any, i: number) => ({
      id: String(s.id ?? `sec-${Date.now()}-${i}`),
      nombre: String(s.nombre ?? `Sección ${i + 1}`),
      tickInicio: Math.max(0, Math.floor(s.tickInicio)),
      tickFin: Math.max(1, Math.floor(s.tickFin)),
      monedas: Number(s.monedas ?? 0),
    }))
    .sort((a, b) => a.tickInicio - b.tickInicio);
}

function pistaACancion(p: PistaUsuario, secuencia: NotaHero[], grabacionId: string | null): CancionEstudio {
  const cfg = (p.config || {}) as any;
  return {
    id: p.id,
    titulo: p.titulo,
    autor: '',
    bpm: Number(p.bpm) || Number(cfg.bpm) || 120,
    resolucion: Number(cfg.resolucion) || 192,
    audio_fondo_url: null,
    secuencia_json: secuencia,
    secciones: normalizarSecciones(p.secciones),
    duracion_segundos: p.duracion_seg ?? null,
    tonalidad: cfg.tonalidad ?? null,
    dificultad: 'basico',
    tipo: 'cancion',
    usoMetronomo: !!cfg.usoMetronomo,
    storage_path: p.storage_path,
    grabacionId,
    creado_en: p.created_at,
  };
}

/** Lista las canciones (pistas) del alumno para la vista lista. Secuencia vacía (se carga al abrir). */
export async function listarCancionesEstudio(): Promise<CancionEstudio[]> {
  const pistas = await listarPistasUsuario();
  return pistas.map((p) => pistaACancion(p, [], null));
}

/** Busca la fila de grabación de estudio (la más reciente) de una pista. */
async function obtenerGrabacionEstudio(pistaId: string): Promise<{ id: string; secuencia: NotaHero[] } | null> {
  const { data, error } = await (supabase
    .from(TABLA_GRAB)
    .select('id, secuencia_json, config')
    .eq('pista_id', pistaId)
    .order('created_at', { ascending: false }) as any);
  if (error) throw error;
  const fila = (data || []).find((g: any) => (g.config || {}).formato === FORMATO_ESTUDIO) || null;
  if (!fila) return null;
  return { id: fila.id, secuencia: normalizarSecuencia(fila.secuencia_json) };
}

/** Carga una canción completa para el editor: pista + signed URL + secuencia de estudio. */
export async function cargarCancionEstudio(pistaId: string): Promise<CancionEstudio | null> {
  const pistas = await listarPistasUsuario();
  const p = pistas.find((x) => x.id === pistaId);
  if (!p) return null;
  const grab = await obtenerGrabacionEstudio(pistaId);
  const cancion = pistaACancion(p, grab?.secuencia ?? [], grab?.id ?? null);
  try { cancion.audio_fondo_url = await obtenerUrlFirmada(p.storage_path); } catch (_) { /* sin audio */ }
  return cancion;
}

/** Sube un MP3/WAV, lo comprime y crea la pista (canción) vacía. Devuelve la canción lista para editar. */
export async function crearCancionEstudioDesdeArchivo(
  archivo: File,
  onProgreso?: (fase: string, pct: number) => void,
): Promise<CancionEstudio> {
  const { data: sesion, error: errSesion } = await supabase.auth.getUser();
  if (errSesion || !sesion?.user?.id) throw errSesion || new Error('Sin sesión');

  onProgreso?.('comprimiendo', 0);
  const comprimido = await comprimirAMp3(archivo, { onProgreso: (pct) => onProgreso?.('comprimiendo', pct) });

  onProgreso?.('subiendo', 0);
  const storagePath = await subirArchivoPistaUsuario(sesion.user.id, comprimido.blob, archivo.name);

  onProgreso?.('guardando', 0);
  const titulo = archivo.name.replace(/\.[^.]+$/, '');
  const pista = await crearPistaUsuario({
    titulo,
    storage_path: storagePath,
    duracion_seg: comprimido.duracionSeg,
    tamano_bytes: comprimido.tamanoBytes,
    bpm: 120,
    config: {},
  });
  const cancion = pistaACancion(pista, [], null);
  try { cancion.audio_fondo_url = await obtenerUrlFirmada(storagePath); } catch (_) {}
  return cancion;
}

export interface GuardarCancionEstudioInput {
  pistaId: string;
  grabacionId: string | null;
  titulo: string;
  bpm: number;
  resolucion: number;
  tonalidad: string | null;
  usoMetronomo: boolean;
  secuencia: NotaHero[];
  secciones: SeccionV2[];
  duracionSeg: number | null;
}

/**
 * Guarda la canción: secciones + bpm + config en la pista; secuencia (NotaHero) en una fila
 * de grabaciones_pista_usuario marcada formato='estudio' (crea o actualiza). Devuelve el id de
 * la fila de grabación para futuros updates.
 */
export async function guardarCancionEstudio(input: GuardarCancionEstudioInput): Promise<{ grabacionId: string }> {
  // 1) Pista (canción): título, bpm, secciones, config.
  await actualizarPistaUsuario(input.pistaId, {
    titulo: input.titulo,
    bpm: Math.max(30, Math.min(300, Math.round(input.bpm))),
    secciones: input.secciones as any,
    config: {
      bpm: input.bpm,
      resolucion: input.resolucion,
      tonalidad: input.tonalidad ?? undefined,
      usoMetronomo: input.usoMetronomo,
    } as any,
  });

  // 2) Secuencia de estudio en grabaciones_pista_usuario.
  const config = {
    formato: FORMATO_ESTUDIO,
    bpm: input.bpm,
    resolucion: input.resolucion,
    tonalidad: input.tonalidad ?? undefined,
    usoMetronomo: input.usoMetronomo,
  };
  if (input.grabacionId) {
    const { error } = await (supabase
      .from(TABLA_GRAB)
      .update({
        titulo: input.titulo,
        secuencia_json: input.secuencia,
        duracion_seg: input.duracionSeg,
        config,
      })
      .eq('id', input.grabacionId) as any);
    if (error) throw error;
    return { grabacionId: input.grabacionId };
  }

  const { data: sesion, error: errSesion } = await supabase.auth.getUser();
  if (errSesion || !sesion?.user?.id) throw errSesion || new Error('Sin sesión');
  const { data, error } = await (supabase
    .from(TABLA_GRAB)
    .insert({
      user_id: sesion.user.id,
      pista_id: input.pistaId,
      titulo: input.titulo,
      secuencia_json: input.secuencia,
      duracion_seg: input.duracionSeg,
      config,
    })
    .select('id')
    .single() as any);
  if (error) throw error;
  return { grabacionId: data.id };
}

/** Elimina la canción (pista) + sus grabaciones de estudio + el archivo de audio. */
export async function eliminarCancionEstudio(cancion: Pick<CancionEstudio, 'id' | 'storage_path'>): Promise<void> {
  await (supabase.from(TABLA_GRAB).delete().eq('pista_id', cancion.id) as any);
  await eliminarPistaUsuario({ id: cancion.id, storage_path: cancion.storage_path });
}
