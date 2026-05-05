import { supabase } from '../../../servicios/clienteSupabase';

/**
 * CRUD para la tabla `sim_pistas_practica_libre` — el catálogo de pistas que ven los
 * estudiantes en la pestaña Pistas de Práctica Libre. La lectura del lado estudiante
 * vive en `PracticaLibre/Servicios/servicioPistasPracticaLibre.ts`; este módulo es la
 * contraparte admin (alta/edición/baja + upload del MP3 al bucket).
 */

export interface PistaAdmin {
    id: string;
    nombre: string;
    descripcion: string | null;
    bpm: number | null;
    audio_url: string;
    created_at?: string;
}

export interface PistaAdminInput {
    nombre: string;
    descripcion?: string | null;
    bpm?: number | null;
    audio_url: string;
}

export async function listarPistasAdmin(): Promise<PistaAdmin[]> {
    const { data, error } = await (supabase
        .from('sim_pistas_practica_libre')
        .select('id,nombre,descripcion,bpm,audio_url,created_at')
        .order('created_at', { ascending: false }) as any);
    if (error) throw error;
    return (data || []) as PistaAdmin[];
}

export async function crearPistaAdmin(input: PistaAdminInput): Promise<PistaAdmin> {
    const { data, error } = await (supabase
        .from('sim_pistas_practica_libre')
        .insert({
            nombre: input.nombre,
            descripcion: input.descripcion ?? null,
            bpm: input.bpm ?? null,
            audio_url: input.audio_url,
        })
        .select('*')
        .single() as any);
    if (error) throw error;
    return data as PistaAdmin;
}

export async function actualizarPistaAdmin(id: string, cambios: Partial<PistaAdminInput>): Promise<PistaAdmin> {
    const { data, error } = await (supabase
        .from('sim_pistas_practica_libre')
        .update(cambios as any)
        .eq('id', id)
        .select('*')
        .single() as any);
    if (error) throw error;
    return data as PistaAdmin;
}

export async function eliminarPistaAdmin(id: string): Promise<void> {
    const { error } = await (supabase
        .from('sim_pistas_practica_libre')
        .delete()
        .eq('id', id) as any);
    if (error) throw error;
}

/** Sube un MP3 al bucket `pistas_hero` y devuelve la URL pública. Reusa el bucket que
 *  ya usa GrabadorV2 para audios de fondo — no hace falta crear infra nueva. */
export async function subirAudioPistaAdmin(file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'mp3').toLowerCase();
    const path = `pistas_libres/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('pistas_hero').upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from('pistas_hero').getPublicUrl(path);
    return data.publicUrl;
}
