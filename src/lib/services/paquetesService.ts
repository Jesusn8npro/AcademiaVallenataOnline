import { supabase } from '$lib/supabase/clienteSupabase';
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
            console.error('Error obteniendo paquetes:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error('Error en obtenerTodosPaquetes:', error);
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
            console.error('Error obteniendo paquetes publicados:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error('Error en obtenerPaquetesPublicados:', error);
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
            console.error('Error obteniendo paquete:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error: any) {
        console.error('Error en obtenerPaquetePorId:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Obtener paquete por slug
 */
export async function obtenerPaquetePorSlug(slug: string): Promise<ResultadoOperacion> {
    try {
        console.log('🔍 Buscando paquete con slug:', slug);
        
        // Primero buscar por slug exacto usando la tabla directa
        let { data, error } = await supabase
            .from('paquetes_tutoriales')
            .select('*')
            .eq('slug', slug)
            .eq('estado', 'publicado')
            .single();

        console.log('📦 Resultado búsqueda por slug:', { data, error });

        // Si no se encuentra por slug, buscar por título generando slug o por ID
        if (error && error.code === 'PGRST116') {
            console.log('🔄 No encontrado por slug, buscando alternativas...');
            
            // Primero intentar buscar por ID si el slug parece ser un ID
            if (slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
                console.log('🔍 Slug parece ser un ID, buscando por ID...');
                const { data: paquetePorId, error: errorId } = await supabase
                    .from('paquetes_tutoriales')
                    .select('*')
                    .eq('id', slug)
                    .eq('estado', 'publicado')
                    .single();
                
                if (!errorId && paquetePorId) {
                    console.log('✅ Paquete encontrado por ID:', paquetePorId);
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

            console.log('📦 Todos los paquetes:', paquetes?.length, 'paquetes encontrados');

            if (!errorPaquetes && paquetes) {
                // Buscar el paquete cuyo título genere el slug buscado
                const paqueteEncontrado = paquetes.find((p: any) => {
                    const slugGenerado = generateSlug(p.titulo);
                    console.log(`🔍 Comparando: "${slugGenerado}" === "${slug}" (${p.titulo})`);
                    return slugGenerado === slug;
                });
                
                console.log('🎯 Paquete encontrado por título:', paqueteEncontrado);
                
                if (paqueteEncontrado) {
                    data = paqueteEncontrado;
                    error = null;
                    
                    // Actualizar el slug en la base de datos si no lo tiene
                    if (!paqueteEncontrado.slug) {
                        console.log('🔧 Actualizando slug en BD...');
                        await supabaseAdmin
                            .from('paquetes_tutoriales')
                            .update({ slug: generateSlug(paqueteEncontrado.titulo) })
                            .eq('id', paqueteEncontrado.id);
                    }
                }
            }
        }

        if (error) {
            console.error('❌ Error obteniendo paquete por slug:', error);
            return { success: false, error: 'Paquete no encontrado' };
        }

        console.log('✅ Paquete encontrado:', data);
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Error en obtenerPaquetePorSlug:', error);
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
            console.error('Error creando paquete:', error);
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            data, 
            message: 'Paquete creado exitosamente' 
        };
    } catch (error: any) {
        console.error('Error en crearPaquete:', error);
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
            console.error('Error actualizando paquete:', error);
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            data, 
            message: 'Paquete actualizado exitosamente' 
        };
    } catch (error: any) {
        console.error('Error en actualizarPaquete:', error);
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
            console.error('Error eliminando paquete:', error);
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            message: 'Paquete eliminado exitosamente' 
        };
    } catch (error: any) {
        console.error('Error en eliminarPaquete:', error);
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
            console.error('Error obteniendo tutoriales del paquete:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error('Error en obtenerTutorialesPaquete:', error);
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
            console.error('Error agregando tutorial a paquete:', error);
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            data, 
            message: 'Tutorial agregado al paquete exitosamente' 
        };
    } catch (error: any) {
        console.error('Error en agregarTutorialAPaquete:', error);
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
            console.error('Error removiendo tutorial del paquete:', error);
            return { success: false, error: error.message };
        }

        return { 
            success: true, 
            message: 'Tutorial removido del paquete exitosamente' 
        };
    } catch (error: any) {
        console.error('Error en removerTutorialDePaquete:', error);
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
            console.error('Errores actualizando orden:', errores);
            return { success: false, error: 'Error actualizando orden de tutoriales' };
        }

        return { 
            success: true, 
            message: 'Orden actualizado exitosamente' 
        };
    } catch (error: any) {
        console.error('Error en actualizarOrdenTutoriales:', error);
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
            console.error('Error obteniendo progreso de paquetes:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error('Error en obtenerProgresoUsuarioPaquetes:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Inscribir usuario en paquete y sus tutoriales
 */
export async function inscribirUsuarioEnPaquete(usuarioId: string, paqueteId: string): Promise<ResultadoOperacion> {
    try {
        console.log('🔍 Inscribiendo usuario en paquete:', { usuarioId, paqueteId });
        
        // MÉTODO 1: Intentar con RPC function (más seguro)
        try {
            const { data: rpcResult, error: rpcError } = await supabaseAdmin
                .rpc('inscribir_usuario_en_paquete_admin', {
                p_usuario_id: usuarioId,
                p_paquete_id: paqueteId
            });

            if (!rpcError && rpcResult) {
                console.log('✅ Inscripción exitosa via RPC:', rpcResult);
                // Inscribir tutoriales automáticamente
                console.log('🔄 Iniciando inscripción automática de tutoriales (RPC)...');
                try {
                    await inscribirTutorialesDelPaquete(usuarioId, paqueteId);
                    console.log('✅ Inscripción de tutoriales completada (RPC)');
                } catch (errorTutoriales) {
                    console.error('❌ Error inscribiendo tutoriales (RPC):', errorTutoriales);
                }
                return { 
                    success: true, 
                    data: rpcResult, 
                    message: 'Usuario inscrito en paquete exitosamente' 
                };
            }
        } catch (rpcError) {
            console.log('⚠️ RPC no disponible, usando método directo...');
        }

        // MÉTODO 2: Inserción directa (fallback)
        console.log('🔄 Usando método directo...');
        
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
            console.error('Error obteniendo paquete:', errorPaquete);
            return { success: false, error: 'Paquete no encontrado' };
        }

        console.log('📦 Paquete encontrado:', paquete);

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
            console.error('❌ Error con cliente regular, intentando con admin...');
            
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
                console.error('❌ Error final:', adminError);
                return { 
                    success: false, 
                    error: `Error de inscripción: ${adminError.message}. Ejecutar script SQL urgente.` 
                };
            }

            console.log('✅ Inscripción exitosa con admin:', adminData);
            // Inscribir tutoriales automáticamente
            console.log('🔄 Iniciando inscripción automática de tutoriales (admin)...');
            try {
                await inscribirTutorialesDelPaquete(usuarioId, paqueteId);
                console.log('✅ Inscripción de tutoriales completada (admin)');
            } catch (errorTutoriales) {
                console.error('❌ Error inscribiendo tutoriales (admin):', errorTutoriales);
            }
            return { 
                success: true, 
                data: adminData, 
                message: `Usuario inscrito en paquete "${paquete.titulo}" exitosamente` 
            };
        }

        console.log('✅ Usuario inscrito exitosamente:', data);
        // Inscribir tutoriales automáticamente
        console.log('🔄 Iniciando inscripción automática de tutoriales...');
        try {
            await inscribirTutorialesDelPaquete(usuarioId, paqueteId);
            console.log('✅ Inscripción de tutoriales completada');
        } catch (errorTutoriales) {
            console.error('❌ Error inscribiendo tutoriales:', errorTutoriales);
        }
        return { 
            success: true, 
            data: data, 
            message: `Usuario inscrito en paquete "${paquete.titulo}" exitosamente` 
        };
    } catch (error: any) {
        console.error('❌ Error inesperado en inscribirUsuarioEnPaquete:', error);
        return { success: false, error: `Error inesperado: ${error.message}` };
    }
}

/**
 * Inscribir automáticamente todos los tutoriales de un paquete
 */
async function inscribirTutorialesDelPaquete(usuarioId: string, paqueteId: string): Promise<void> {
    try {
        console.log('🎯 [INICIO] Inscribiendo tutoriales del paquete:', { usuarioId, paqueteId });
        
        // PASO 1: Obtener todos los tutoriales del paquete
        console.log('📋 Paso 1: Obteniendo tutoriales del paquete...');
        const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteId);
        
        if (!resultadoTutoriales.success || !resultadoTutoriales.data) {
            console.error('❌ Error obteniendo tutoriales del paquete:', resultadoTutoriales.error);
            return;
        }

        const tutoriales = resultadoTutoriales.data;
        console.log('📚 Tutoriales encontrados:', tutoriales.length);
        console.log('📋 Estructura completa de tutoriales:', JSON.stringify(tutoriales, null, 2));

        // PASO 2: Verificar estructura de datos
        console.log('📋 Paso 2: Verificando estructura de datos...');
        const tutorialesValidos = tutoriales.filter((item: any) => {
            const tieneId = item.tutoriales?.id;
            const tieneTitulo = item.tutoriales?.titulo;
            console.log('🔍 Item tutorial:', {
                item: item,
                tieneId: tieneId,
                tieneTitulo: tieneTitulo,
                tutorial: item.tutoriales
            });
            return tieneId;
        });

        console.log(`📊 Tutoriales válidos: ${tutorialesValidos.length} de ${tutoriales.length}`);

        if (tutorialesValidos.length === 0) {
            console.error('❌ No hay tutoriales válidos para inscribir');
            return;
        }

        // PASO 3: Verificar qué tutoriales ya están inscritos
        console.log('📋 Paso 3: Verificando inscripciones existentes...');
        const { data: inscripcionesExistentes, error: errorExistentes } = await supabaseAdmin
            .from('inscripciones')
            .select('tutorial_id')
            .eq('usuario_id', usuarioId)
            .not('tutorial_id', 'is', null);

        if (errorExistentes) {
            console.error('❌ Error consultando inscripciones existentes:', errorExistentes);
        }

        const tutorialesInscritos = inscripcionesExistentes?.map(i => i.tutorial_id) || [];
        console.log('📝 Tutoriales ya inscritos:', tutorialesInscritos);

        // PASO 4: Filtrar tutoriales que no están inscritos
        console.log('📋 Paso 4: Filtrando tutoriales por inscribir...');
        const tutorialesParaInscribir = tutorialesValidos.filter((item: any) => {
            const tutorialId = item.tutoriales?.id;
            const yaInscrito = tutorialesInscritos.includes(tutorialId);
            console.log('🔍 Verificando tutorial:', {
                id: tutorialId,
                titulo: item.tutoriales?.titulo,
                yaInscrito: yaInscrito
            });
            return tutorialId && !yaInscrito;
        });

        console.log(`📝 Tutoriales para inscribir: ${tutorialesParaInscribir.length}`);

        if (tutorialesParaInscribir.length === 0) {
            console.log('✅ No hay tutoriales nuevos para inscribir');
            return;
        }

        // PASO 5: Preparar inscripciones
        console.log('📋 Paso 5: Preparando inscripciones...');
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
            console.log('📋 Preparando inscripción:', inscripcion);
            return inscripcion;
        });

        // PASO 6: Guardar en base de datos
        console.log('💾 Paso 6: Guardando inscripciones en BD...');
        console.log('📊 Total de inscripciones a guardar:', inscripciones.length);
        
        // MÉTODO 1: Intentar con cliente admin - insertar una por una
        let exitosas = 0;
        let fallidas = 0;
        
        for (const inscripcion of inscripciones) {
            try {
                console.log('📝 Insertando inscripción (Admin):', inscripcion);
                const { data, error } = await supabaseAdmin
                    .from('inscripciones')
                    .insert([inscripcion])
                    .select();
                
                if (error) {
                    console.error('❌ Error insertando inscripción individual (Admin):', error);
                    console.error('📋 Datos que fallaron:', inscripcion);
                    fallidas++;
                } else {
                    console.log('✅ Inscripción insertada exitosamente (Admin):', data);
                    exitosas++;
                }
            } catch (error) {
                console.error('❌ Error en inscripción individual (Admin):', error);
                fallidas++;
            }
        }
        
        console.log(`📊 Resumen Admin: ${exitosas} exitosas, ${fallidas} fallidas`);
        
        // MÉTODO 2: Si falló con admin, intentar con cliente regular
        if (fallidas > 0) {
            console.log('🔄 Intentando con cliente regular...');
            let exitosasRegular = 0;
            let fallidasRegular = 0;
            
            for (const inscripcion of inscripciones) {
                try {
                    console.log('📝 Insertando inscripción (Regular):', inscripcion);
                    const { data, error } = await supabase
                        .from('inscripciones')
                        .insert([inscripcion])
                        .select();
                    
                    if (error) {
                        console.error('❌ Error insertando inscripción individual (Regular):', error);
                        console.error('📋 Datos que fallaron:', inscripcion);
                        fallidasRegular++;
                    } else {
                        console.log('✅ Inscripción insertada exitosamente (Regular):', data);
                        exitosasRegular++;
                    }
                } catch (error) {
                    console.error('❌ Error en inscripción individual (Regular):', error);
                    fallidasRegular++;
                }
            }
            
            console.log(`📊 Resumen Regular: ${exitosasRegular} exitosas, ${fallidasRegular} fallidas`);
        }
        
        // MÉTODO 3: Inserción en lote como último recurso
        if (inscripciones.length > 0) {
            console.log('🔄 Intentando inserción en lote como respaldo...');
            try {
                const { data, error } = await supabaseAdmin
                    .from('inscripciones')
                    .insert(inscripciones)
                    .select();

                if (error) {
                    console.error('❌ Error en inserción en lote:', error);
                    console.error('📋 Detalles del error:', error.details);
                    console.error('📋 Mensaje del error:', error.message);
                } else {
                    console.log('✅ Inserción en lote exitosa:', data?.length || 0);
                    console.log('📋 Datos insertados en lote:', data);
                }
            } catch (error) {
                console.error('❌ Error en inserción en lote:', error);
            }
        }

        // PASO 7: Verificación final
        console.log('📋 Paso 7: Verificación final...');
        const { data: verificacion, error: errorVerificacion } = await supabaseAdmin
            .from('inscripciones')
            .select('*')
            .eq('usuario_id', usuarioId)
            .not('tutorial_id', 'is', null)
            .in('tutorial_id', tutorialesParaInscribir.map((item: any) => item.tutoriales.id));

        if (errorVerificacion) {
            console.error('❌ Error en verificación:', errorVerificacion);
        } else {
            console.log('✅ Verificación exitosa. Tutoriales en BD:', verificacion?.length || 0);
        }

    } catch (error) {
        console.error('❌ Error inscribiendo tutoriales del paquete:', error);
    }
}

/**
 * Eliminar inscripción de paquete y todos sus tutoriales
 */
export async function eliminarInscripcionPaquete(usuarioId: string, paqueteId: string): Promise<ResultadoOperacion> {
    try {
        console.log('🗑️ Eliminando inscripción de paquete:', { usuarioId, paqueteId });
        
        // 1. Obtener tutoriales del paquete
        const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteId);
        
        if (resultadoTutoriales.success && resultadoTutoriales.data) {
            const tutorialesIds = resultadoTutoriales.data.map((item: any) => item.tutoriales?.id).filter(Boolean);
            
            if (tutorialesIds.length > 0) {
                console.log('🎯 Eliminando tutoriales:', tutorialesIds);
                
                // 2. Eliminar inscripciones de tutoriales individuales
                const { error: errorTutoriales } = await supabase
                    .from('inscripciones')
                    .delete()
                    .eq('usuario_id', usuarioId)
                    .in('tutorial_id', tutorialesIds);
                
                if (errorTutoriales) {
                    console.error('❌ Error eliminando tutoriales:', errorTutoriales);
                    return { success: false, error: `Error eliminando tutoriales: ${errorTutoriales.message}` };
                }
                
                console.log('✅ Tutoriales eliminados exitosamente');
            }
        }
        
        // 3. Eliminar inscripción del paquete
        const { error: errorPaquete } = await supabase
            .from('inscripciones')
            .delete()
            .eq('usuario_id', usuarioId)
            .eq('paquete_id', paqueteId);
        
        if (errorPaquete) {
            console.error('❌ Error eliminando paquete:', errorPaquete);
            return { success: false, error: `Error eliminando paquete: ${errorPaquete.message}` };
        }
        
        console.log('✅ Inscripción de paquete eliminada exitosamente');
        return { success: true, message: 'Paquete y todos sus tutoriales eliminados exitosamente' };
    } catch (error: any) {
        console.error('❌ Error eliminando inscripción de paquete:', error);
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
            console.error('Error calculando descuento:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data?.[0] || null };
    } catch (error: any) {
        console.error('Error en calcularDescuentoPaquete:', error);
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
            console.error('Error buscando paquetes:', error);
            return { success: false, error: error.message };
        }

        return { success: true, data: data || [] };
    } catch (error: any) {
        console.error('Error en buscarPaquetes:', error);
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
            console.error('Error obteniendo categorías:', error);
            return { success: false, error: error.message };
        }

                 const categorias = [...new Set(data?.map((item: any) => item.categoria).filter(Boolean))];
        return { success: true, data: categorias };
    } catch (error: any) {
        console.error('Error en obtenerCategoriasPaquetes:', error);
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