import { supabase } from '../../../../servicios/clienteSupabase';

/**
 * CRUD de las pistas que el alumno sube a su biblioteca personal en Práctica Libre.
 * - Tabla: public.pistas_usuario (RLS por user_id).
 * - Bucket privado: storage.buckets.pistas-usuario (signed URLs).
 * - Convención del path: <user_id>/<uuid>.mp3 (la RLS del bucket lo exige).
 */

const BUCKET = 'pistas-usuario';
const SIGNED_URL_TTL = 60 * 60; // 1h — suficiente para una sesión de práctica

export interface SeccionPistaUsuario {
  id: string;
  nombre: string;
  tickInicio: number;
  tickFin: number;
}

export interface ConfigPistaUsuario {
  velocidad?: number;       // 0.5 .. 1.5
  semitonos?: number;       // -12 .. +12
  loopActivo?: boolean;
  ultimaSeccionId?: string | null;
  bpm?: number;
  /** Tonalidad detectada al subir (ej "G mayor"). El usuario puede editarla manualmente. */
  tonalidad?: string;
  /** Confianza 0..1 del detector. <0.5 = poco confiable. */
  tonalidadConfianza?: number;
}

export interface PistaUsuario {
  id: string;
  user_id: string;
  titulo: string;
  storage_path: string;
  duracion_seg: number | null;
  tamano_bytes: number | null;
  bpm: number | null;
  secciones: SeccionPistaUsuario[];
  config: ConfigPistaUsuario;
  created_at: string;
}

export interface PistaUsuarioConUrl extends PistaUsuario {
  signedUrl: string;
}

/** Lista todas las pistas del usuario autenticado. No incluye signed URL (la pide bajo demanda). */
export async function listarPistasUsuario(): Promise<PistaUsuario[]> {
  const { data, error } = await (supabase
    .from('pistas_usuario')
    .select('id,user_id,titulo,storage_path,duracion_seg,tamano_bytes,bpm,secciones,config,created_at')
    .order('created_at', { ascending: false }) as any);
  if (error) throw error;
  return (data || []) as PistaUsuario[];
}

/** Devuelve cuántas pistas tiene el usuario (para mostrar el contador X/N). */
export async function contarPistasUsuario(userId: string): Promise<number> {
  const { count, error } = await (supabase
    .from('pistas_usuario')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId) as any);
  if (error) throw error;
  return count || 0;
}

/** Pide una URL firmada temporal para reproducir el MP3 del bucket privado. */
export async function obtenerUrlFirmada(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) throw error || new Error('No se pudo firmar URL');
  return data.signedUrl;
}

/** Sube el archivo comprimido al bucket. El path se arma con el userId obligatoriamente. */
export async function subirArchivoPistaUsuario(userId: string, archivo: Blob, nombreArchivo: string): Promise<string> {
  const ext = (nombreArchivo.split('.').pop() || 'mp3').toLowerCase();
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, archivo, {
    upsert: false,
    contentType: 'audio/mpeg',
  });
  if (error) throw error;
  return path;
}

export interface CrearPistaUsuarioInput {
  titulo: string;
  storage_path: string;
  duracion_seg?: number | null;
  tamano_bytes?: number | null;
  bpm?: number | null;
  config?: ConfigPistaUsuario;
}

export async function crearPistaUsuario(input: CrearPistaUsuarioInput): Promise<PistaUsuario> {
  // user_id es obligatorio para la RLS policy "with check (auth.uid() = user_id)".
  // Lo leemos de la sesión actual en lugar de exigírselo al caller.
  const { data: sesion, error: errSesion } = await supabase.auth.getUser();
  if (errSesion || !sesion?.user?.id) throw errSesion || new Error('Sin sesión');

  const { data, error } = await (supabase
    .from('pistas_usuario')
    .insert({
      user_id: sesion.user.id,
      titulo: input.titulo,
      storage_path: input.storage_path,
      duracion_seg: input.duracion_seg ?? null,
      tamano_bytes: input.tamano_bytes ?? null,
      bpm: input.bpm ?? null,
      secciones: [],
      config: input.config ?? {},
    })
    .select('*')
    .single() as any);
  if (error) throw error;
  return data as PistaUsuario;
}

export async function actualizarPistaUsuario(
  id: string,
  cambios: Partial<Pick<PistaUsuario, 'titulo' | 'bpm' | 'secciones' | 'config'>>,
): Promise<void> {
  const { error } = await (supabase
    .from('pistas_usuario')
    .update(cambios as any)
    .eq('id', id) as any);
  if (error) throw error;
}

export async function eliminarPistaUsuario(pista: Pick<PistaUsuario, 'id' | 'storage_path'>): Promise<void> {
  // Storage primero: si falla la fila queda pero el huérfano se limpia manual; si fallara la fila
  // y borráramos storage primero, el alumno vería la pista "rota". Orden actual = degradación segura.
  const { error } = await (supabase.from('pistas_usuario').delete().eq('id', pista.id) as any);
  if (error) throw error;
  try { await supabase.storage.from(BUCKET).remove([pista.storage_path]); } catch (_) {}
}
