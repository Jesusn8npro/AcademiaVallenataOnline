import { supabase } from './clienteSupabase';
import { createClient } from '@supabase/supabase-js';
import { generarReferencia } from './ePaycoService';
import { generateSlug } from '$lib/utilidades/utilidadesSlug';

// Cliente admin para operaciones que requieren bypass de RLS
const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Tipos
export interface TutorialPaqueteItem {
    id: string;
    paquete_id: string;
    tutorial_id: string;
    orden: number;
    incluido: boolean;
    tutoriales?: {
        id: string;
        titulo: string;
        descripcion_corta?: string;
        imagen_url?: string;
        duracion_estimada?: number;
        precio_normal?: number;
        nivel?: string;
        categoria?: string;
        artista?: string;
        tonalidad?: string;
    };
}

export interface PaqueteTutorial {
    id?: string;
    titulo: string;
    descripcion?: string;
    descripcion_corta?: string;
    imagen_url?: string;
    precio_normal: number;
    precio_rebajado?: number;
    descuento_porcentaje?: number;
    estado: 'borrador' | 'publicado' | 'archivado';
    categoria?: string;
    nivel: 'principiante' | 'intermedio' | 'avanzado';
    destacado?: boolean;
    total_tutoriales?: number;
    duracion_total_estimada?: number;
    instructor_id?: string;
    tipo_acceso: 'gratuito' | 'premium' | 'vip';
    fecha_expiracion?: string;
    objetivos?: string;
    requisitos?: string;
    incluye?: string;
    ventajas?: string;
    slug?: string;
    meta_titulo?: string;
    meta_descripcion?: string;
    tags?: string[];
    orden_mostrar?: number;
    visible?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface PaqueteItem {
    id?: string;
    paquete_id: string;
    tutorial_id: string;
    orden: number;
    incluido: boolean;
    precio_individual_referencia?: number;
    notas?: string;
}

export interface ProgresoPaquete {
    id?: string;
    usuario_id: string;
    paquete_id: string;
    tutoriales_completados: number;
    tutoriales_totales: number;
    porcentaje_completado: number;
    ultimo_tutorial_id?: string;
    ultima_actividad: string;
    completado: boolean;
    fecha_completado?: string;
    tiempo_total_visto: number;
}

export interface ResultadoOperacion {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
}

export interface TutorialResumen {
    id: string;
    titulo: string;
    imagen_url: string | null;
    categoria: string | null;
    nivel: string | null;
    precio_normal?: number;
    precio_rebajado?: number;
}

export interface TutorialResumen {
    id: string;
    titulo: string;
    imagen_url: string | null;
    categoria: string | null;
    nivel: string | null;
    precio_normal?: number;
    precio_rebajado?: number;
}

// ===========================================
// FUNCIONES DE PAQUETES
// ===========================================

/**
 * Obtener todos los paquetes (para admin)
 */
export async function obtenerTodosPaquetes(): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabaseAdmin
            .from('vista_paquetes_completos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener paquetes publicados (para usuarios)
 */
export async function obtenerPaquetesPublicados(): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('vista_paquetes_completos')
            .select('*')
            .eq('estado', 'publicado')
            .eq('visible', true)
            .order('destacado', { ascending: false })
            .order('orden_mostrar', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener paquete por ID
 */
export async function obtenerPaquetePorId(id: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener paquete por slug
 */
export async function obtenerPaquetePorSlug(slug: string): Promise<ResultadoOperacion> {
    try {

        // Primero buscar por slug exacto usando la tabla directa
        let { data, error } = await supabase
            .from('paquetes_tutoriales')
            .select('*')
            .eq('slug', slug)
            .eq('estado', 'publicado')
            .single();


        // Si no se encuentra por slug, buscar por título generando slug o por ID
        if (error && error.code === 'PGRST116') {

            // Primero intentar buscar por ID si el slug parece ser un ID
            if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                const { data: paquetePorId, error: errorId } = await supabase
                    .from('paquetes_tutoriales')
                    .select('*')
                    .eq('id', slug)
                    .eq('estado', 'publicado')
                    .single();

                if (!errorId && paquetePorId) {
                    data = paquetePorId;
                    error = null;
                    return { success: true, data };
                }
            }

            // Si no es ID, buscar por título
            const { data: paquetes, error: errorPaquetes } = await supabase
                .from('paquetes_tutoriales')
                .select('*')
                .eq('estado', 'publicado');


            if (!errorPaquetes && paquetes) {
                // Buscar el paquete cuyo título genere el slug buscado
                const paqueteEncontrado = paquetes.find((p: any) => {
                    const slugGenerado = generateSlug(p.titulo);
                    return slugGenerado === slug;
                });


                if (paqueteEncontrado) {
                    data = paqueteEncontrado;
                    error = null;

                    // Actualizar el slug en la base de datos si no lo tiene
                    if (!paqueteEncontrado.slug) {
                        await supabaseAdmin
                            .from('paquetes_tutoriales')
                            .update({ slug: generateSlug(paqueteEncontrado.titulo) })
                            .eq('id', paqueteEncontrado.id);
                    }
                }
            }
        }

        if (error) {
            return { success: false, error: 'Paquete no encontrado' };
        }

        return { success: true, data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Crear nuevo paquete
 */
export async function crearPaquete(paquete: PaqueteTutorial): Promise<ResultadoOperacion> {
    try {
        // Generar slug automáticamente si no existe
        const paqueteConSlug = {
            ...paquete,
            slug: paquete.slug || generateSlug(paquete.titulo),
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .insert([paqueteConSlug])
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data,
            message: 'Paquete creado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Actualizar paquete
 */
export async function actualizarPaquete(id: string, paquete: Partial<PaqueteTutorial>): Promise<ResultadoOperacion> {
    try {
        // Generar slug automáticamente si se actualiza el título
        const paqueteConSlug = {
            ...paquete,
            updated_at: new Date().toISOString()
        };

        // Si se actualiza el título y no se proporciona slug, generar uno nuevo
        if (paquete.titulo && !paquete.slug) {
            paqueteConSlug.slug = generateSlug(paquete.titulo);
        }

        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .update(paqueteConSlug)
            .eq('id', id)
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data,
            message: 'Paquete actualizado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Eliminar paquete
 */
export async function eliminarPaquete(id: string): Promise<ResultadoOperacion> {
    try {
        const { error } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .delete()
            .eq('id', id);

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            message: 'Paquete eliminado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===========================================
// FUNCIONES DE ITEMS DE PAQUETES
// ===========================================

/**
 * Obtener tutoriales de un paquete
 */
export async function obtenerTutorialesPaquete(paqueteId: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('paquetes_tutoriales_items')
            .select(`
                *,
                tutoriales:tutorial_id (
                    id,
                    titulo,
                    descripcion_corta,
                    imagen_url,
                    duracion_estimada,
                    precio_normal,
                    nivel,
                    categoria,
                    artista,
                    tonalidad
                )
            `)
            .eq('paquete_id', paqueteId)
            .eq('incluido', true)
            .order('orden', { ascending: true });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Agregar tutorial a paquete
 */
export async function agregarTutorialAPaquete(item: PaqueteItem): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabaseAdmin
            .from('paquetes_tutoriales_items')
            .insert([item])
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            data,
            message: 'Tutorial agregado al paquete exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Remover tutorial de paquete
 */
export async function removerTutorialDePaquete(paqueteId: string, tutorialId: string): Promise<ResultadoOperacion> {
    try {
        const { error } = await supabaseAdmin
            .from('paquetes_tutoriales_items')
            .delete()
            .eq('paquete_id', paqueteId)
            .eq('tutorial_id', tutorialId);

        if (error) {
            return { success: false, error: error.message };
        }

        return {
            success: true,
            message: 'Tutorial removido del paquete exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Actualizar orden de tutoriales en paquete
 */
export async function actualizarOrdenTutoriales(items: { id: string; orden: number }[]): Promise<ResultadoOperacion> {
    try {
        const updates = items.map(item =>
            supabaseAdmin
                .from('paquetes_tutoriales_items')
                .update({ orden: item.orden })
                .eq('id', item.id)
        );

        const results = await Promise.all(updates);

        const errores = results.filter(result => result.error);
        if (errores.length > 0) {
            return { success: false, error: 'Error actualizando orden de tutoriales' };
        }

        return {
            success: true,
            message: 'Orden actualizado exitosamente'
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===========================================
// FUNCIONES DE PROGRESO
// ===========================================

/**
 * Obtener progreso de usuario en paquetes
 */
export async function obtenerProgresoUsuarioPaquetes(usuarioId: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('vista_progreso_usuario_paquetes')
            .select('*')
            .eq('usuario_id', usuarioId)
            .order('ultima_actividad', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Inscribir usuario en paquete y sus tutoriales
 */
export async function inscribirUsuarioEnPaquete(usuarioId: string, paqueteId: string): Promise<ResultadoOperacion> {
    try {

        // MÉTODO 1: Intentar con RPC function (más seguro)
        try {
            const { data: rpcResult, error: rpcError } = await supabaseAdmin
                .rpc('inscribir_usuario_en_paquete_admin', {
                    p_usuario_id: usuarioId,
                    p_paquete_id: paqueteId
                });

            if (!rpcError && rpcResult) {
                // Inscribir tutoriales automáticamente
                try {
                    await inscribirTutorialesDelPaquete(usuarioId, paqueteId);
                } catch (errorTutoriales) {
                }
                return {
                    success: true,
                    data: rpcResult,
                    message: 'Usuario inscrito en paquete exitosamente'
                };
            }
        } catch (rpcError) {
        }

        // MÉTODO 2: Inserción directa (fallback)

        // Primero verificar si ya está inscrito
        const { data: existeInscripcion } = await supabaseAdmin
            .from('inscripciones')
            .select('id')
            .eq('usuario_id', usuarioId)
            .eq('paquete_id', paqueteId)
            .maybeSingle();

        if (existeInscripcion) {
            return {
                success: false,
                error: 'El usuario ya está inscrito en este paquete'
            };
        }

        // Obtener información del paquete
        const { data: paquete, error: errorPaquete } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .select('id, titulo')
            .eq('id', paqueteId)
            .single();

        if (errorPaquete || !paquete) {
            return { success: false, error: 'Paquete no encontrado' };
        }


        // MÉTODO 3: Usar cliente regular (sin service role)
        const { data, error } = await supabase
            .from('inscripciones')
            .insert({
                usuario_id: usuarioId,
                paquete_id: paqueteId,
                fecha_inscripcion: new Date().toISOString(),
                porcentaje_completado: 0,
                completado: false,
                estado: 'activo',
                progreso: 0,
                ultima_actividad: new Date().toISOString()
            })
            .select();

        if (error) {

            // MÉTODO 4: Forzar con service role
            const { data: adminData, error: adminError } = await supabaseAdmin
                .from('inscripciones')
                .insert({
                    usuario_id: usuarioId,
                    paquete_id: paqueteId,
                    fecha_inscripcion: new Date().toISOString(),
                    porcentaje_completado: 0,
                    completado: false,
                    estado: 'activo',
                    progreso: 0,
                    ultima_actividad: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select();

            if (adminError) {
                return {
                    success: false,
                    error: `Error de inscripción: ${adminError.message}. Ejecutar script SQL urgente.`
                };
            }

            // Inscribir tutoriales automáticamente
            try {
                await inscribirTutorialesDelPaquete(usuarioId, paqueteId);
            } catch (errorTutoriales) {
            }
            return {
                success: true,
                data: adminData,
                message: `Usuario inscrito en paquete "${paquete.titulo}" exitosamente`
            };
        }

        // Inscribir tutoriales automáticamente
        try {
            await inscribirTutorialesDelPaquete(usuarioId, paqueteId);
        } catch (errorTutoriales) {
        }
        return {
            success: true,
            data: data,
            message: `Usuario inscrito en paquete "${paquete.titulo}" exitosamente`
        };
    } catch (error: any) {
        return { success: false, error: `Error inesperado: ${error.message}` };
    }
}

/**
 * Inscribir automáticamente todos los tutoriales de un paquete
 */
async function inscribirTutorialesDelPaquete(usuarioId: string, paqueteId: string): Promise<void> {
    try {

        // PASO 1: Obtener todos los tutoriales del paquete
        const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteId);

        if (!resultadoTutoriales.success || !resultadoTutoriales.data) {
            return;
        }

        const tutoriales = resultadoTutoriales.data;

        // PASO 2: Verificar estructura de datos
        const tutorialesValidos = tutoriales.filter((item: any) => {
            const tieneId = item.tutoriales?.id;
            const tieneTitulo = item.tutoriales?.titulo;
            return tieneId;
        });


        if (tutorialesValidos.length === 0) {
            return;
        }

        // PASO 3: Verificar qué tutoriales ya están inscritos
        const { data: inscripcionesExistentes, error: errorExistentes } = await supabaseAdmin
            .from('inscripciones')
            .select('tutorial_id')
            .eq('usuario_id', usuarioId)
            .not('tutorial_id', 'is', null);

        if (errorExistentes) {
        }

        const tutorialesInscritos = inscripcionesExistentes?.map(i => i.tutorial_id) || [];

        // PASO 4: Filtrar tutoriales que no están inscritos
        const tutorialesParaInscribir = tutorialesValidos.filter((item: any) => {
            const tutorialId = item.tutoriales?.id;
            const yaInscrito = tutorialesInscritos.includes(tutorialId);
            return tutorialId && !yaInscrito;
        });


        if (tutorialesParaInscribir.length === 0) {
            return;
        }

        // PASO 5: Preparar inscripciones
        const inscripciones = tutorialesParaInscribir.map((item: any) => {
            const inscripcion = {
                usuario_id: usuarioId,
                tutorial_id: item.tutoriales.id,
                fecha_inscripcion: new Date().toISOString(),
                porcentaje_completado: 0,
                completado: false,
                estado: 'activo',
                progreso: 0,
                ultima_actividad: new Date().toISOString()
                // Removido created_at y updated_at para evitar problemas
            };
            return inscripcion;
        });

        // PASO 6: Guardar en base de datos

        // MÉTODO 1: Intentar con cliente admin - insertar una por una
        let exitosas = 0;
        let fallidas = 0;

        for (const inscripcion of inscripciones) {
            try {
                const { data, error } = await supabaseAdmin
                    .from('inscripciones')
                    .insert([inscripcion])
                    .select();

                if (error) {
                    fallidas++;
                } else {
                    exitosas++;
                }
            } catch (error) {
                fallidas++;
            }
        }


        // MÉTODO 2: Si falló con admin, intentar con cliente regular
        if (fallidas > 0) {
            let exitosasRegular = 0;
            let fallidasRegular = 0;

            for (const inscripcion of inscripciones) {
                try {
                    const { data, error } = await supabase
                        .from('inscripciones')
                        .insert([inscripcion])
                        .select();

                    if (error) {
                        fallidasRegular++;
                    } else {
                        exitosasRegular++;
                    }
                } catch (error) {
                    fallidasRegular++;
                }
            }

        }

        // MÉTODO 3: Inserción en lote como último recurso
        if (inscripciones.length > 0) {
            try {
                const { data, error } = await supabaseAdmin
                    .from('inscripciones')
                    .insert(inscripciones)
                    .select();

                if (error) {
                } else {
                }
            } catch (error) {
            }
        }

        // PASO 7: Verificación final
        const { data: verificacion, error: errorVerificacion } = await supabaseAdmin
            .from('inscripciones')
            .select('*')
            .eq('usuario_id', usuarioId)
            .not('tutorial_id', 'is', null)
            .in('tutorial_id', tutorialesParaInscribir.map((item: any) => item.tutoriales.id));

        if (errorVerificacion) {
        } else {
        }

    } catch (error) {
    }
}

/**
 * Eliminar inscripción de paquete y todos sus tutoriales
 */
export async function eliminarInscripcionPaquete(usuarioId: string, paqueteId: string): Promise<ResultadoOperacion> {
    try {

        // 1. Obtener tutoriales del paquete
        const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteId);

        if (resultadoTutoriales.success && resultadoTutoriales.data) {
            const tutorialesIds = resultadoTutoriales.data.map((item: any) => item.tutoriales?.id).filter(Boolean);

            if (tutorialesIds.length > 0) {

                // 2. Eliminar inscripciones de tutoriales individuales
                const { error: errorTutoriales } = await supabase
                    .from('inscripciones')
                    .delete()
                    .eq('usuario_id', usuarioId)
                    .in('tutorial_id', tutorialesIds);

                if (errorTutoriales) {
                    return { success: false, error: `Error eliminando tutoriales: ${errorTutoriales.message}` };
                }

            }
        }

        // 3. Eliminar inscripción del paquete
        const { error: errorPaquete } = await supabase
            .from('inscripciones')
            .delete()
            .eq('usuario_id', usuarioId)
            .eq('paquete_id', paqueteId);

        if (errorPaquete) {
            return { success: false, error: `Error eliminando paquete: ${errorPaquete.message}` };
        }

        return { success: true, message: 'Paquete y todos sus tutoriales eliminados exitosamente' };
    } catch (error: any) {
        return { success: false, error: `Error inesperado: ${error.message}` };
    }
}

/**
 * Calcular descuento de paquete
 */
export async function calcularDescuentoPaquete(paqueteId: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .rpc('calcular_descuento_paquete', {
                p_paquete_id: paqueteId
            });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] || null };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===========================================
// FUNCIONES DE BÚSQUEDA Y FILTROS
// ===========================================

/**
 * Buscar paquetes
 */
export async function buscarPaquetes(
    termino: string,
    filtros?: {
        categoria?: string;
        nivel?: string;
        precio_min?: number;
        precio_max?: number;
    }
): Promise<ResultadoOperacion> {
    try {
        let query = supabase
            .from('vista_paquetes_completos')
            .select('*')
            .eq('estado', 'publicado')
            .eq('visible', true);

        // Búsqueda por texto
        if (termino) {
            query = query.or(`titulo.ilike.%${termino}%,descripcion.ilike.%${termino}%,categoria.ilike.%${termino}%`);
        }

        // Aplicar filtros
        if (filtros?.categoria) {
            query = query.eq('categoria', filtros.categoria);
        }
        if (filtros?.nivel) {
            query = query.eq('nivel', filtros.nivel);
        }
        if (filtros?.precio_min) {
            query = query.gte('precio_normal', filtros.precio_min);
        }
        if (filtros?.precio_max) {
            query = query.lte('precio_normal', filtros.precio_max);
        }

        const { data, error } = await query
            .order('destacado', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

/**
 * Obtener categorías de paquetes
 */
export async function obtenerCategoriasPaquetes(): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('paquetes_tutoriales')
            .select('categoria')
            .eq('estado', 'publicado')
            .not('categoria', 'is', null);

        if (error) {
            return { success: false, error: error.message };
        }

        const categorias = [...new Set(data?.map((item: any) => item.categoria).filter(Boolean))];
        return { success: true, data: categorias };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// ===========================================
// UTILIDADES
// ===========================================

/**
 * Validar datos de paquete
 */
export function validarPaquete(paquete: Partial<PaqueteTutorial>): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!paquete.titulo?.trim()) {
        errores.push('El título es requerido');
    }

    if (!paquete.precio_normal || paquete.precio_normal <= 0) {
        errores.push('El precio normal debe ser mayor a 0');
    }

    if (paquete.precio_rebajado && paquete.precio_rebajado >= paquete.precio_normal!) {
        errores.push('El precio rebajado debe ser menor al precio normal');
    }

    if (!paquete.nivel) {
        errores.push('El nivel es requerido');
    }

    if (!paquete.tipo_acceso) {
        errores.push('El tipo de acceso es requerido');
    }

    return {
        valido: errores.length === 0,
        errores
    };
}

/**
 * Formatear precio
 */
export function formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(precio);
}

/**
 * Calcular porcentaje de descuento
 */
export function calcularPorcentajeDescuento(precioNormal: number, precioRebajado: number): number {
    if (precioNormal <= 0 || precioRebajado >= precioNormal) return 0;
    return Math.round(((precioNormal - precioRebajado) / precioNormal) * 100);
}

/**
 * Obtener todos los tutoriales disponibles para un paquete
 */
export async function obtenerTutorialesDisponibles(): Promise<ResultadoOperacion<TutorialResumen[]>> {
    try {
        const { data, error } = await supabase
            .from('tutoriales')
            .select('id, titulo, imagen_url, categoria, nivel, precio_normal, precio_rebajado')
            .order('titulo', { ascending: true });

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Obtener los IDs de los tutoriales de un paquete
 */
export async function obtenerItemsPaquete(paqueteId: string): Promise<ResultadoOperacion<string[]>> {
    try {
        const { data, error } = await supabase
            .from('paquetes_tutoriales_items')
            .select('tutorial_id')
            .eq('paquete_id', paqueteId)
            .eq('incluido', true);

        if (error) throw error;
        return { success: true, data: data?.map(d => d.tutorial_id) || [] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Guardar items de un paquete (insertar nuevos, marcar como no incluidos los que ya no están)
 */
export async function guardarItemsPaquete(paqueteId: string, tutorialIds: string[]): Promise<ResultadoOperacion> {
    try {
        // Marcar todo como incluido=false
        await supabaseAdmin
            .from('paquetes_tutoriales_items')
            .update({ incluido: false })
            .eq('paquete_id', paqueteId);

        if (tutorialIds.length > 0) {
            for (let i = 0; i < tutorialIds.length; i++) {
                const tutorialId = tutorialIds[i];
                const { data: existe } = await supabaseAdmin
                    .from('paquetes_tutoriales_items')
                    .select('id')
                    .eq('paquete_id', paqueteId)
                    .eq('tutorial_id', tutorialId)
                    .maybeSingle();

                if (existe) {
                    await supabaseAdmin
                        .from('paquetes_tutoriales_items')
                        .update({ incluido: true, orden: i + 1 })
                        .eq('id', (existe as any).id);
                } else {
                    await supabaseAdmin
                        .from('paquetes_tutoriales_items')
                        .insert({
                            paquete_id: paqueteId,
                            tutorial_id: tutorialId,
                            incluido: true,
                            orden: i + 1
                        });
                }
            }
        }

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
