import { supabase, supabaseAdmin } from './_cliente';
import { obtenerTutorialesPaquete } from './consultas';
import { inscribirTutorialesDelPaquete } from './_inscripcionesHelper';
import type { ResultadoOperacion } from '../../tipos/paquetes';

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

export async function inscribirUsuarioEnPaquete(usuarioId: string, paqueteId: string): Promise<ResultadoOperacion> {
    try {
        try {
            const { data: rpcResult, error: rpcError } = await supabaseAdmin
                .rpc('inscribir_usuario_en_paquete_admin', {
                    p_usuario_id: usuarioId,
                    p_paquete_id: paqueteId
                });

            if (!rpcError && rpcResult) {
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

        const { data: paquete, error: errorPaquete } = await supabaseAdmin
            .from('paquetes_tutoriales')
            .select('id, titulo')
            .eq('id', paqueteId)
            .single();

        if (errorPaquete || !paquete) {
            return { success: false, error: 'Paquete no encontrado' };
        }

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

export async function eliminarInscripcionPaquete(usuarioId: string, paqueteId: string): Promise<ResultadoOperacion> {
    try {
        const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteId);

        if (resultadoTutoriales.success && resultadoTutoriales.data) {
            const tutorialesIds = resultadoTutoriales.data.map((item: any) => item.tutoriales?.id).filter(Boolean);

            if (tutorialesIds.length > 0) {
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
