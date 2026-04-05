import { supabase } from './clienteSupabase';
import type { NotaHero } from '../Paginas/SimuladorDeAcordeon/videojuego_acordeon/tipos_Hero';

export type ModoGrabacionHero = 'practica_libre' | 'competencia';

export interface GrabacionEstudianteHero {
    id: string;
    usuario_id: string;
    cancion_id: string | null;
    modo: ModoGrabacionHero;
    origen: string;
    titulo: string | null;
    descripcion: string | null;
    secuencia_grabada: NotaHero[];
    bpm: number;
    resolucion: number;
    tonalidad: string | null;
    duracion_ms: number | null;
    precision_porcentaje: number | null;
    puntuacion: number | null;
    notas_totales: number | null;
    notas_correctas: number | null;
    es_publica: boolean;
    publicacion_id: string | null;
    metadata: Record<string, any>;
    created_at: string;
    updated_at: string;
}

export interface DatosGuardarGrabacionHero {
    cancion_id?: string | null;
    modo: ModoGrabacionHero;
    titulo?: string;
    descripcion?: string | null;
    secuencia_grabada: NotaHero[];
    bpm: number;
    resolucion?: number;
    tonalidad?: string | null;
    duracion_ms?: number | null;
    precision_porcentaje?: number | null;
    puntuacion?: number | null;
    notas_totales?: number | null;
    notas_correctas?: number | null;
    metadata?: Record<string, any>;
}

interface OpcionesConsultaGrabacionesHero {
    modo?: ModoGrabacionHero;
    soloPublicas?: boolean;
}

interface DatosPublicarGrabacionHero {
    tituloPublicacion: string;
    descripcionPublicacion?: string | null;
}

const TABLA_GRABACIONES_HERO = 'grabaciones_estudiantes_hero';

async function obtenerUsuarioAutenticado() {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
        throw error;
    }

    if (!data.user) {
        throw new Error('Debes iniciar sesion para guardar tus grabaciones.');
    }

    return data.user;
}

async function obtenerPerfilBasicoUsuario(usuarioId: string) {
    const { data, error } = await supabase
        .from('perfiles')
        .select('nombre,nombre_completo,url_foto_perfil')
        .eq('id', usuarioId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}

async function validarPublicacionesActivasDeGrabaciones(grabaciones: any[], usuarioId: string) {
    const publicacionesIds = Array.from(new Set(
        grabaciones
            .map((grabacion) => grabacion.publicacion_id)
            .filter(Boolean)
    ));

    if (publicacionesIds.length === 0) {
        return grabaciones;
    }

    const { data, error } = await supabase
        .from('comunidad_publicaciones' as any)
        .select('id')
        .in('id', publicacionesIds as string[]);

    if (error) {
        throw error;
    }

    const publicacionesActivas = new Set((data || []).map((publicacion: any) => publicacion.id));
    const grabacionesConPublicacionEliminada = grabaciones.filter(
        (grabacion) => grabacion.publicacion_id && !publicacionesActivas.has(grabacion.publicacion_id)
    );

    if (grabacionesConPublicacionEliminada.length === 0) {
        return grabaciones;
    }

    const idsGrabaciones = grabacionesConPublicacionEliminada.map((grabacion) => grabacion.id);
    const tablaGrabaciones: any = supabase.from(TABLA_GRABACIONES_HERO as any);

    const { error: errorActualizacion } = await tablaGrabaciones
        .update({ publicacion_id: null })
        .in('id', idsGrabaciones)
        .eq('usuario_id', usuarioId);

    if (errorActualizacion) {
        throw errorActualizacion;
    }

    return grabaciones.map((grabacion) => (
        idsGrabaciones.includes(grabacion.id)
            ? { ...grabacion, publicacion_id: null }
            : grabacion
    ));
}

export async function guardarGrabacion(datos: DatosGuardarGrabacionHero): Promise<GrabacionEstudianteHero> {
    const usuario = await obtenerUsuarioAutenticado();

    const payload = {
        usuario_id: usuario.id,
        cancion_id: datos.cancion_id || null,
        modo: datos.modo,
        titulo: datos.titulo?.trim() || null,
        descripcion: datos.descripcion?.trim() || null,
        secuencia_grabada: datos.secuencia_grabada,
        bpm: datos.bpm,
        resolucion: datos.resolucion ?? 192,
        tonalidad: datos.tonalidad || null,
        duracion_ms: datos.duracion_ms ?? 0,
        precision_porcentaje: datos.precision_porcentaje ?? null,
        puntuacion: datos.puntuacion ?? null,
        notas_totales: datos.notas_totales ?? datos.secuencia_grabada.length,
        notas_correctas: datos.notas_correctas ?? null,
        metadata: datos.metadata ?? {}
    };

    const { data, error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .insert(payload as any)
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return data as GrabacionEstudianteHero;
}

export async function obtenerMisGrabaciones(usuarioId: string, modo?: ModoGrabacionHero) {
    return obtenerGrabacionesUsuario(usuarioId, { modo });
}

export async function obtenerGrabacionesUsuario(usuarioId: string, opciones: OpcionesConsultaGrabacionesHero = {}) {
    let query = supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .select(`
            *,
            canciones_hero (
                titulo,
                autor,
                slug,
                bpm,
                audio_fondo_url
            )
        `)
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });

    if (opciones.modo) {
        query = query.eq('modo', opciones.modo);
    }

    if (opciones.soloPublicas) {
        query = query.eq('es_publica', true);
    }

    const { data, error } = await query;

    if (error) {
        throw error;
    }

    return validarPublicacionesActivasDeGrabaciones(data || [], usuarioId);
}

export async function obtenerGrabacionesPublicasUsuario(usuarioId: string, modo?: ModoGrabacionHero) {
    return obtenerGrabacionesUsuario(usuarioId, {
        modo,
        soloPublicas: true
    });
}

export async function obtenerGrabacion(id: string) {
    const { data, error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .select(`
            *,
            canciones_hero (
                titulo,
                autor,
                slug,
                bpm,
                tonalidad,
                audio_fondo_url
            )
        `)
        .eq('id', id)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function obtenerGrabacionPublica(id: string) {
    const { data, error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .select(`
            *,
            canciones_hero (
                titulo,
                autor,
                slug,
                bpm,
                tonalidad,
                audio_fondo_url
            )
        `)
        .eq('id', id)
        .eq('es_publica', true)
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function actualizarTitulo(id: string, titulo: string, descripcion?: string | null) {
    const tablaGrabaciones: any = supabase.from(TABLA_GRABACIONES_HERO as any);

    const { data, error } = await tablaGrabaciones
        .update({
            titulo: titulo.trim(),
            descripcion: descripcion?.trim() || null
        })
        .eq('id', id)
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function eliminarGrabacion(id: string) {
    const { error } = await supabase
        .from(TABLA_GRABACIONES_HERO as any)
        .delete()
        .eq('id', id);

    if (error) {
        throw error;
    }
}

export async function actualizarVisibilidadGrabacion(grabacionId: string, esPublica: boolean): Promise<GrabacionEstudianteHero> {
    const usuario = await obtenerUsuarioAutenticado();
    const grabacion: any = await obtenerGrabacion(grabacionId);

    if (!grabacion || grabacion.usuario_id !== usuario.id) {
        throw new Error('Solo puedes editar la visibilidad de tus propias grabaciones.');
    }

    if (!esPublica && grabacion.publicacion_id) {
        const { error: errorEliminarPublicacion } = await supabase
            .from('comunidad_publicaciones' as any)
            .delete()
            .eq('id', grabacion.publicacion_id)
            .eq('usuario_id', usuario.id);

        if (errorEliminarPublicacion) {
            throw errorEliminarPublicacion;
        }
    }

    const tablaGrabaciones: any = supabase.from(TABLA_GRABACIONES_HERO as any);
    const { data, error } = await tablaGrabaciones
        .update({
            es_publica: esPublica,
            publicacion_id: esPublica ? grabacion.publicacion_id || null : null
        })
        .eq('id', grabacionId)
        .eq('usuario_id', usuario.id)
        .select('*')
        .single();

    if (error) {
        throw error;
    }

    return data as GrabacionEstudianteHero;
}

export async function publicarGrabacionEnComunidad(grabacionId: string, datos: DatosPublicarGrabacionHero) {
    const usuario = await obtenerUsuarioAutenticado();
    const grabacion: any = await obtenerGrabacion(grabacionId);

    if (!grabacion || grabacion.usuario_id !== usuario.id) {
        throw new Error('Solo puedes publicar tus propias grabaciones.');
    }

    if (grabacion.publicacion_id) {
        const publicacionIdActiva = grabacion.publicacion_id as string;
        const { data: publicacionActiva, error: errorPublicacionActiva } = await supabase
            .from('comunidad_publicaciones' as any)
            .select('id')
            .eq('id', publicacionIdActiva)
            .maybeSingle();

        if (errorPublicacionActiva) {
            throw errorPublicacionActiva;
        }

        const publicacionActivaId = (publicacionActiva as any)?.id;

        if (publicacionActivaId) {
            return {
                publicacionId: publicacionIdActiva,
                grabacionId: grabacion.id,
                yaPublicada: true
            };
        }

        const tablaGrabacionesLimpieza: any = supabase.from(TABLA_GRABACIONES_HERO as any);
        const { error: errorLimpieza } = await tablaGrabacionesLimpieza
            .update({ publicacion_id: null })
            .eq('id', grabacion.id)
            .eq('usuario_id', usuario.id);

        if (errorLimpieza) {
            throw errorLimpieza;
        }
    }

    const tituloPublicacion = datos.tituloPublicacion.trim();
    if (!tituloPublicacion) {
        throw new Error('Debes escribir un titulo para la publicacion.');
    }

    const perfil: any = await obtenerPerfilBasicoUsuario(usuario.id);
    const nombreVisible = perfil?.nombre_completo || perfil?.nombre || 'Usuario';
    const resumenGrabacion = {
        grabacion_id: grabacion.id,
        titulo_grabacion: grabacion.titulo,
        modo: grabacion.modo,
        precision_porcentaje: grabacion.precision_porcentaje,
        puntuacion: grabacion.puntuacion,
        duracion_ms: grabacion.duracion_ms,
        bpm: grabacion.bpm,
        tonalidad: grabacion.tonalidad,
        cancion_titulo: grabacion.canciones_hero?.titulo || grabacion.metadata?.cancion_titulo || null,
        cancion_autor: grabacion.canciones_hero?.autor || grabacion.metadata?.cancion_autor || null
    };

    const { data: publicacion, error: errorPublicacion } = await supabase
        .from('comunidad_publicaciones' as any)
        .insert({
            usuario_id: usuario.id,
            usuario_nombre: nombreVisible,
            usuario_avatar: perfil?.url_foto_perfil || null,
            titulo: tituloPublicacion,
            descripcion: datos.descripcionPublicacion?.trim() || '',
            tipo: 'grabacion_hero',
            encuesta: resumenGrabacion,
            fecha_creacion: new Date().toISOString()
        } as any)
        .select('id')
        .single();

    if (errorPublicacion) {
        throw errorPublicacion;
    }

    const tablaGrabaciones: any = supabase.from(TABLA_GRABACIONES_HERO as any);
    const publicacionCreada: any = publicacion;
    const { error: errorGrabacion } = await tablaGrabaciones
        .update({
            es_publica: true,
            publicacion_id: publicacionCreada.id
        })
        .eq('id', grabacionId)
        .eq('usuario_id', usuario.id);

    if (errorGrabacion) {
        throw errorGrabacion;
    }

    return {
        publicacionId: publicacionCreada.id,
        grabacionId,
        yaPublicada: false
    };
}
