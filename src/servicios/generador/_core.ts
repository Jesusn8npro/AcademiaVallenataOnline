import { supabase } from '../clienteSupabase';
import { CONFIGURACION_NOTIFICACIONES } from './_config';
import type { TipoEvento } from './_config';

export async function crearNotificacion(params: {
    tipo: TipoEvento;
    usuario_id?: string;
    usuarios_ids?: string[];
    mensaje: string;
    url_accion?: string;
    entidad_id?: string;
    entidad_tipo?: string;
    datos_adicionales?: any;
    solo_roles?: ('admin' | 'user')[];
    excluir_usuario?: string;
}) {
    // @ts-ignore
    const config = CONFIGURACION_NOTIFICACIONES[params.tipo];

    if (!config) {
        return { exito: false, error: 'Tipo de notificación no válido' };
    }

    try {
        let destinatarios: string[] = [];

        if (params.usuario_id) {
            destinatarios = [params.usuario_id];
        } else if (params.usuarios_ids) {
            destinatarios = params.usuarios_ids;
        } else {
            const { data: usuarios, error: errorUsuarios } = await supabase
                .from('perfiles')
                .select('id, rol')
                .eq('eliminado', false);

            if (errorUsuarios) {
                return { exito: false, error: errorUsuarios.message };
            }

            destinatarios = usuarios
                ?.filter(u => {
                    if (params.solo_roles && !params.solo_roles.includes(u.rol)) {
                        return false;
                    }
                    if (params.excluir_usuario && u.id === params.excluir_usuario) {
                        return false;
                    }
                    return true;
                })
                .map(u => u.id) || [];
        }

        const fechaExpiracion = new Date();
        fechaExpiracion.setDate(fechaExpiracion.getDate() + config.dias_expiracion);

        const notificaciones = destinatarios.map(usuarioId => {
            const notificacion: any = {
                usuario_id: usuarioId,
                tipo: params.tipo,
                titulo: config.titulo,
                mensaje: params.mensaje,
                icono: config.icono,
                categoria: config.categoria,
                prioridad: config.prioridad,
                leida: false,
                archivada: false,
                url_accion: params.url_accion,
                entidad_tipo: params.entidad_tipo,
                datos_adicionales: params.datos_adicionales || {},
                fecha_expiracion: fechaExpiracion.toISOString()
            };

            if (params.entidad_id) {
                notificacion.entidad_id = params.entidad_id;
            }

            return notificacion;
        });

        const TAMANO_LOTE = 50;
        const resultados = [];

        for (let i = 0; i < notificaciones.length; i += TAMANO_LOTE) {
            const lote = notificaciones.slice(i, i + TAMANO_LOTE);

            const { data, error } = await supabase
                .from('notificaciones')
                .insert(lote)
                .select('id, usuario_id');

            if (error) {
                return { exito: false, error: error.message };
            }

            resultados.push(...(data || []));
        }

        return {
            exito: true,
            notificaciones_creadas: resultados.length,
            ids_creados: resultados.map(r => r.id)
        };

    } catch (error) {
        return { exito: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
}
