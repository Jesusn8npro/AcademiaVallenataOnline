import { supabase } from '../../../servicios/clienteSupabase';
import type { CancionV2, NotaHero, SeccionV2 } from './tipos';

const TABLA = 'canciones_hero';

function normalizarSecuencia(raw: any): NotaHero[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((n: any) => n && typeof n.tick === 'number' && typeof n.botonId === 'string')
    .map((n: any) => ({
      tick: Math.max(0, Math.floor(n.tick)),
      botonId: String(n.botonId),
      duracion: Math.max(1, Math.floor(n.duracion ?? 1)),
      fuelle: n.fuelle === 'cerrando' ? 'cerrando' : 'abriendo',
    }))
    .sort((a, b) => a.tick - b.tick);
}

function normalizarSecciones(raw: any): SeccionV2[] {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { return []; }
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s: any) => s && typeof s.tickInicio === 'number' && typeof s.tickFin === 'number')
    .map((s: any, i: number) => ({
      id: String(s.id ?? `sec-${Date.now()}-${i}`),
      nombre: String(s.nombre ?? `Sección ${i + 1}`),
      tickInicio: Math.max(0, Math.floor(s.tickInicio)),
      tickFin: Math.max(1, Math.floor(s.tickFin)),
      monedas: Number(s.monedas ?? 1),
    }))
    .sort((a, b) => a.tickInicio - b.tickInicio);
}

function filaACancionV2(fila: any): CancionV2 {
  return {
    id: fila.id,
    titulo: fila.titulo ?? '',
    autor: fila.autor ?? '',
    bpm: Number(fila.bpm) || 120,
    resolucion: Number(fila.resolucion) || 192,
    audio_fondo_url: fila.audio_fondo_url ?? null,
    secuencia_json: normalizarSecuencia(fila.secuencia_json),
    secciones: normalizarSecciones(fila.secciones),
    duracion_segundos: fila.duracion_segundos ?? null,
    tonalidad: fila.tonalidad ?? null,
    dificultad: fila.dificultad ?? null,
    tipo: fila.tipo ?? null,
    usoMetronomo: !!fila.usoMetronomo,
    creado_en: fila.creado_en,
  };
}

export async function listarCancionesV2(): Promise<CancionV2[]> {
  const { data, error } = await supabase
    .from(TABLA as any)
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(filaACancionV2);
}

export async function obtenerCancionV2(id: string): Promise<CancionV2 | null> {
  const { data, error } = await supabase
    .from(TABLA as any)
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? filaACancionV2(data) : null;
}

export interface DatosCrearCancionV2 {
  titulo: string;
  autor: string;
  bpm: number;
  audio_fondo_url: string | null;
  secuencia_json: NotaHero[];
  secciones: SeccionV2[];
  tonalidad?: string;
  dificultad?: string;
  tipo?: string;
  usoMetronomo?: boolean;
}

export async function crearCancionV2(datos: DatosCrearCancionV2): Promise<CancionV2> {
  const payload: any = {
    titulo: datos.titulo,
    autor: datos.autor || 'Jesus Gonzalez',
    bpm: Math.max(30, Math.min(300, Math.round(datos.bpm))),
    resolucion: 192,
    audio_fondo_url: datos.audio_fondo_url,
    secuencia_json: datos.secuencia_json,
    secciones: datos.secciones,
    tonalidad: datos.tonalidad ?? 'F-Bb-Eb',
    dificultad: datos.dificultad ?? 'basico',
    tipo: datos.tipo ?? 'cancion',
    usoMetronomo: !!datos.usoMetronomo,
  };
  const { data, error } = await supabase
    .from(TABLA as any)
    .insert(payload as any)
    .select('*')
    .single();
  if (error) throw error;
  return filaACancionV2(data);
}

export interface DatosActualizarCancionV2 {
  titulo?: string;
  autor?: string;
  bpm?: number;
  audio_fondo_url?: string | null;
  secuencia_json?: NotaHero[];
  secciones?: SeccionV2[];
  duracion_segundos?: number | null;
  usoMetronomo?: boolean;
  tonalidad?: string;
}

export async function actualizarCancionV2(id: string, cambios: DatosActualizarCancionV2): Promise<CancionV2> {
  const { data, error } = await supabase
    .from(TABLA as any)
    .update(cambios as any)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return filaACancionV2(data);
}

export async function subirAudioFondoV2(file: File, cancionId: string): Promise<string> {
  const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
  const path = `v2/${cancionId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from('pistas_hero').upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from('pistas_hero').getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Mezcla notas grabadas en un punch-in dentro de una secuencia existente.
 * Reemplaza TODAS las notas en [tickInicio, tickFin] con las nuevas notas, deja el resto intacto.
 */
export function mezclarPunchIn(
  secuenciaPrev: NotaHero[],
  notasNuevas: NotaHero[],
  tickInicio: number,
  tickFin: number,
): NotaHero[] {
  const fueraDelRango = secuenciaPrev.filter(n => {
    const finN = n.tick + n.duracion;
    return finN <= tickInicio || n.tick >= tickFin;
  });
  return [...fueraDelRango, ...notasNuevas].sort((a, b) => a.tick - b.tick);
}
