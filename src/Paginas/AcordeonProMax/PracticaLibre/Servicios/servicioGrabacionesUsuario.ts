import { supabase } from '../../../../servicios/clienteSupabase';

/**
 * CRUD de las grabaciones que hace el alumno sobre sus propias pistas.
 * Tabla: public.grabaciones_pista_usuario (RLS por user_id).
 */

export interface EventoGrabacion {
  ms: number;
  botonId: string;
  fuelle: 'abriendo' | 'cerrando';
  accion: 'down' | 'up';
}

export interface ConfigGrabacion {
  /** Volumen de la pista de fondo durante la reproducción (0..1). */
  volumenPista?: number;
  /** Volumen del acordeón sintetizado durante la reproducción (0..1). */
  volumenAcordeon?: number;
  /** Tonalidad del acordeón al momento de grabar (ej "F-Bb-Eb"). */
  tonalidad?: string;
  /** Instrumento del acordeón al grabar (id). */
  instrumentoId?: string;
  /** Timbre del acordeón al grabar (ej "Brillante"). */
  timbre?: string;
  /** Velocidad de la pista al momento de grabar. */
  velocidad?: number;
  /** Semitonos aplicados a la pista. */
  semitonos?: number;
}

export interface GrabacionUsuario {
  id: string;
  user_id: string;
  pista_id: string | null;
  titulo: string;
  secuencia_json: EventoGrabacion[];
  duracion_seg: number | null;
  config: ConfigGrabacion;
  mp3_storage_path: string | null;
  created_at: string;
}

export async function listarGrabacionesPorPista(pistaId: string): Promise<GrabacionUsuario[]> {
  const { data, error } = await (supabase
    .from('grabaciones_pista_usuario')
    .select('*')
    .eq('pista_id', pistaId)
    .order('created_at', { ascending: false }) as any);
  if (error) throw error;
  return (data || []) as GrabacionUsuario[];
}

export async function contarGrabacionesUsuario(userId: string): Promise<number> {
  const { count, error } = await (supabase
    .from('grabaciones_pista_usuario')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId) as any);
  if (error) throw error;
  return count || 0;
}

export interface CrearGrabacionInput {
  pista_id: string;
  titulo: string;
  secuencia_json: EventoGrabacion[];
  duracion_seg: number;
  config?: ConfigGrabacion;
}

export async function crearGrabacionUsuario(input: CrearGrabacionInput): Promise<GrabacionUsuario> {
  const { data: sesion, error: errSesion } = await supabase.auth.getUser();
  if (errSesion || !sesion?.user?.id) throw errSesion || new Error('Sin sesión');

  const { data, error } = await (supabase
    .from('grabaciones_pista_usuario')
    .insert({
      user_id: sesion.user.id,
      pista_id: input.pista_id,
      titulo: input.titulo,
      secuencia_json: input.secuencia_json,
      duracion_seg: input.duracion_seg,
      config: input.config ?? {},
    })
    .select('*')
    .single() as any);
  if (error) throw error;
  return data as GrabacionUsuario;
}

export async function eliminarGrabacionUsuario(id: string): Promise<void> {
  const { error } = await (supabase.from('grabaciones_pista_usuario').delete().eq('id', id) as any);
  if (error) throw error;
}

export async function renombrarGrabacionUsuario(id: string, titulo: string): Promise<void> {
  const { error } = await (supabase
    .from('grabaciones_pista_usuario')
    .update({ titulo })
    .eq('id', id) as any);
  if (error) throw error;
}
