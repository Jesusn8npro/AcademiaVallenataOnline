import { supabase } from '../clienteSupabase';
import type { ResultadoOperacion } from '../../tipos/pagos';

// Las columnas `curso_id`/`tutorial_id`/`paquete_id`/`membresia_id` son UUID en Supabase.
// Si el caller manda un slug por error (ej. landing pages con id hardcodeado), Postgres
// rechaza el insert con "invalid input syntax for type uuid" y el alumno ve error al pagar.
// Esta función filtra: devuelve el valor solo si parece UUID, sino null. Si el valor era
// no-UUID lo guardamos en datos_adicionales para no perder la info.
const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function uuidOnNull(valor: any): string | null {
    if (typeof valor !== 'string') return null;
    return REGEX_UUID.test(valor) ? valor : null;
}

export async function crearRegistroPago(datos: any): Promise<ResultadoOperacion> {
    try {
        const cursoIdValido = uuidOnNull(datos.curso_id);
        const tutorialIdValido = uuidOnNull(datos.tutorial_id);
        const paqueteIdValido = uuidOnNull(datos.paquete_id);
        const membresiaIdValido = uuidOnNull(datos.membresia_id);

        // Si llegó un identificador no-UUID, lo logueamos en consola y lo conservamos en
        // datos_adicionales para que el equipo pueda matchearlo manualmente si hace falta.
        const identificadoresOriginales: Record<string, any> = {};
        if (datos.curso_id && !cursoIdValido) identificadoresOriginales.curso_id_original = datos.curso_id;
        if (datos.tutorial_id && !tutorialIdValido) identificadoresOriginales.tutorial_id_original = datos.tutorial_id;
        if (datos.paquete_id && !paqueteIdValido) identificadoresOriginales.paquete_id_original = datos.paquete_id;
        if (datos.membresia_id && !membresiaIdValido) identificadoresOriginales.membresia_id_original = datos.membresia_id;
        // identificadoresOriginales se conservan en datos_adicionales (ver abajo)

        const registroPago = {
            usuario_id: datos.usuario_id,
            curso_id: cursoIdValido,
            tutorial_id: tutorialIdValido,
            paquete_id: paqueteIdValido,
            membresia_id: membresiaIdValido,
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
                },
                ...(Object.keys(identificadoresOriginales).length > 0 ? { identificadores_originales: identificadoresOriginales } : {})
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

        // Cargar perfil del pago: admin si lo es, propio si es el dueno del pago
        let perfilUsuario: any = null;
        if (data.usuario_id) {
            const adminRes = await supabase.rpc('admin_obtener_perfil_completo', { p_id: data.usuario_id });
            if (adminRes.data) {
                perfilUsuario = adminRes.data;
            } else {
                const propio = await supabase.rpc('obtener_mi_perfil_completo');
                if (propio.data && (propio.data as any).id === data.usuario_id) {
                    perfilUsuario = propio.data;
                }
            }
        }
        const dataConPerfil: any = {
            ...data,
            perfiles: perfilUsuario
                ? { nombre: perfilUsuario.nombre, apellido: perfilUsuario.apellido, correo_electronico: perfilUsuario.correo_electronico }
                : null,
        };

        return { success: true, data: dataConPerfil };

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
