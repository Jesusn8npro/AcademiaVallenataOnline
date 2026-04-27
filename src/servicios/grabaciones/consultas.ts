import { supabase } from '../clienteSupabase';
import type { GrabacionEstudianteHero, DatosGuardarGrabacionHero, ModoGrabacionHero } from './_tipos';
import { TABLA_GRABACIONES_HERO, normalizarGrabacionHero, obtenerUsuarioAutenticado, validarPublicacionesActivasDeGrabaciones } from './_internos';

interface OpcionesConsultaGrabacionesHero {
    modo?: ModoGrabacionHero;
    soloPublicas?: boolean;
}

export async function guardarGrabacion(datos: DatosGuardarGrabacionHero): Promise<GrabacionEstudianteHero> {
    const usuario = await obtenerUsuarioAutenticado();
    const secuencia = datos.secuencia_grabada || datos.secuencia || [];

    const payload = {
        usuario_id: usuario.id,
        cancion_id: datos.cancion_id || null,
        modo: datos.modo,
        origen: datos.origen || 'practica_libre',
        titulo: datos.titulo?.trim() || null,
        descripcion: datos.descripcion?.trim() || null,
        secuencia_grabada: secuencia,
        bpm: datos.bpm,
        resolucion: datos.resolucion ?? 192,
        tonalidad: datos.tonalidad || null,
        duracion_ms: datos.duracion_ms ?? 0,
        precision_porcentaje: datos.precision_porcentaje ?? null,
        puntuacion: datos.puntuacion ?? null,
        notas_totales: datos.notas_totales ?? secuencia.length,
        notas_correctas: datos.notas_correctas ?? null,
        es_publica: false,
        publicacion_id: null,
        metadata: datos.metadata ?? {}
    };

    const { data, error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .insert(payload as any)
        .select('*')
        .single();

    if (error) throw error;
    return normalizarGrabacionHero(data as any) as GrabacionEstudianteHero;
}

export async function obtenerMisGrabaciones(usuarioId: string, modo?: ModoGrabacionHero) {
    return obtenerGrabacionesUsuario(usuarioId, { modo });
}

export async function obtenerGrabacionesUsuario(usuarioId: string, opciones: OpcionesConsultaGrabacionesHero = {}) {
    let query = supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .select(`*, canciones_hero (titulo, autor, slug, bpm, audio_fondo_url)`)
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });

    if (opciones.modo) query = query.eq('modo', opciones.modo);
    if (opciones.soloPublicas) query = query.eq('es_publica', true);

    const { data, error } = await query;
    if (error) throw error;

    const validadas = await validarPublicacionesActivasDeGrabaciones(data || [], usuarioId);
    return (validadas || []).map((g: any) => normalizarGrabacionHero(g));
}

export async function obtenerGrabacionesPublicasUsuario(usuarioId: string, modo?: ModoGrabacionHero) {
    return obtenerGrabacionesUsuario(usuarioId, { modo, soloPublicas: true });
}

export async function obtenerGrabacion(id: string) {
    const { data, error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .select(`*, canciones_hero (titulo, autor, slug, bpm, tonalidad, audio_fondo_url)`)
        .eq('id', id)
        .single();

    if (error) throw error;
    return normalizarGrabacionHero(data as any);
}

export async function obtenerGrabacionPublica(id: string) {
    const { data, error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .select(`*, canciones_hero (titulo, autor, slug, bpm, tonalidad, audio_fondo_url)`)
        .eq('id', id)
        .eq('es_publica', true)
        .single();

    if (error) throw error;
    return normalizarGrabacionHero(data as any);
}
