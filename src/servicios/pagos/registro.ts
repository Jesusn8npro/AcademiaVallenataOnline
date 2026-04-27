import { supabase } from '../clienteSupabase';
import type { ResultadoOperacion } from '../../tipos/pagos';

export async function crearRegistroPago(datos: any): Promise<ResultadoOperacion> {
    try {
        const registroPago = {
            usuario_id: datos.usuario_id,
            curso_id: datos.curso_id || null,
            tutorial_id: datos.tutorial_id || null,
            paquete_id: datos.paquete_id || null,
            membresia_id: datos.membresia_id || null,
            nombre_producto: datos.nombre_producto,
            descripcion: datos.descripcion || null,
            valor: datos.valor,
            iva: datos.iva || 0,
            ico: datos.ico || 0,
            base_iva: datos.base_iva || 0,
            moneda: datos.moneda || 'COP',
            ref_payco: datos.ref_payco,
            factura: datos.factura || null,
            estado: 'pendiente',
            datos_adicionales: {
                datos_personales: {
                    nombre: datos.nombre,
                    apellido: datos.apellido,
                    email: datos.email,
                    telefono: datos.telefono,
                    whatsapp: datos.whatsapp,
                    fecha_nacimiento: datos.fecha_nacimiento,
                    profesion: datos.profesion
                },
                identificacion: {
                    documento_tipo: datos.documento_tipo || 'CC',
                    documento_numero: datos.documento_numero
                },
                direccion: {
                    direccion_completa: datos.direccion_completa,
                    ciudad: datos.ciudad,
                    pais: datos.pais || 'Colombia',
                    codigo_postal: datos.codigo_postal
                },
                marketing: {
                    como_nos_conocio: datos.como_nos_conocio
                },
                tecnico: {
                    ip_cliente: datos.ip_cliente,
                    user_agent: datos.user_agent,
                    timestamp_creacion: new Date().toISOString()
                }
            }
        };

        const { data, error } = await supabase
            .from('pagos_epayco')
            .insert([registroPago])
            .select('*')
            .single();

        if (error) {
            return {
                success: false,
                error: error.message,
                message: 'Error al guardar el pago en la base de datos: ' + error.message
            };
        }

        return {
            success: true,
            data,
            message: 'Registro de pago creado exitosamente'
        };

    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            message: 'Error inesperado al crear el registro de pago: ' + error.message
        };
    }
}

export async function obtenerPagoPorReferencia(refPayco: string): Promise<ResultadoOperacion> {
    try {
        const { data, error } = await supabase
            .from('pagos_epayco')
            .select(`
                *,
                perfiles:usuario_id (
                    nombre,
                    apellido,
                    correo_electronico
                ),
                cursos:curso_id (
                    titulo
                ),
                tutoriales:tutorial_id (
                    titulo
                ),
                membresias:membresia_id (
                    nombre,
                    precio_mensual,
                    precio_anual
                )
            `)
            .eq('ref_payco', refPayco)
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        if (!data) {
            return { success: false, error: 'Pago no encontrado' };
        }

        return { success: true, data };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}

export async function actualizarEstadoPago(
    refPayco: string,
    nuevoEstado: string,
    datosAdicionales?: any
): Promise<ResultadoOperacion> {
    try {
        const datosActualizacion: any = {
            estado: nuevoEstado,
            updated_at: new Date().toISOString()
        };

        if (datosAdicionales) {
            if (datosAdicionales.cod_respuesta) datosActualizacion.cod_respuesta = datosAdicionales.cod_respuesta;
            if (datosAdicionales.respuesta) datosActualizacion.respuesta = datosAdicionales.respuesta;
            if (datosAdicionales.metodo_pago) datosActualizacion.metodo_pago = datosAdicionales.metodo_pago;
            if (datosAdicionales.fecha_transaccion) datosActualizacion.fecha_transaccion = datosAdicionales.fecha_transaccion;
        }

        const { data, error } = await supabase
            .from('pagos_epayco')
            .update(datosActualizacion)
            .eq('ref_payco', refPayco)
            .select('*')
            .single();

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true, data };

    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        };
    }
}
