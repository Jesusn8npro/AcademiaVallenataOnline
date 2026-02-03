import { createClient } from '@supabase/supabase-js';
import { calcularIVA, generarReferencia } from './ePaycoService';
import { crearRegistroPago, actualizarEstadoPago } from './pagoService';
import { activarSuscripcion, obtenerMembresiaUsuario, crearSuscripcionPendiente } from './membershipService';

// Cliente admin para operaciones del servidor
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

export interface DatosPagoMembresia {
	usuarioId: string;
	membresiaId: string;
	planId: string;
	esAnual: boolean;
	email: string;
	nombre: string;
	telefono?: string;
	ip_cliente?: string;
}

export interface ResultadoPagoMembresia {
	success: boolean;
	data?: any;
	error?: string;
	message?: string;
	epaycoData?: any;
}

/**
 * Generar referencia específica para membresías
 */
export function generarReferenciaMemberesia(planId: string, usuarioId: string, esAnual: boolean): string {
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	const tipoCode = esAnual ? 'MEM-A' : 'MEM-M'; // MEM-A = Membresía Anual, MEM-M = Membresía Mensual
	return `${tipoCode}-${planId.toUpperCase()}-${timestamp}-${random}-${usuarioId.slice(-8)}`;
}

/**
 * Crear pago de membresía
 */
export async function crearPagoMembresia(datos: DatosPagoMembresia): Promise<ResultadoPagoMembresia> {
	try {
		console.log('🎯 === CREANDO PAGO DE MEMBRESÍA ===');
		console.log('📝 Datos recibidos:', datos);

		// 1. Obtener información de la membresía
		const { data: membresia, error: errorMembresia } = await supabaseAdmin
			.from('membresias')
			.select('*')
			.eq('id', datos.membresiaId)
			.single();

		if (errorMembresia || !membresia) {
			console.error('❌ Error obteniendo membresía:', errorMembresia);
			return {
				success: false,
				error: 'Membresía no encontrada',
				message: 'La membresía seleccionada no existe'
			};
		}

		// 2. Calcular precio y datos del pago
		const precio = datos.esAnual ? membresia.precio_anual : membresia.precio_mensual;
		const { base, iva, total } = calcularIVA(precio);
		
		const nombreProducto = `Membresía ${membresia.nombre} - ${datos.esAnual ? 'Anual' : 'Mensual'}`;
		const descripcion = `Suscripción ${datos.esAnual ? 'anual' : 'mensual'} a ${membresia.nombre} - Academia Vallenata Online`;

		// 3. Generar referencia única
		const refPayco = generarReferenciaMemberesia(membresia.nombre, datos.usuarioId, datos.esAnual);

		// 4. Verificar que no exista una suscripción activa del mismo nivel o superior
		const membresiaActual = await obtenerMembresiaUsuario(datos.usuarioId);
		if (membresiaActual.data && membresiaActual.data.membresias) {
			const nivelActual = obtenerNivelPlan(membresiaActual.data.membresias.nombre);
			const nivelNuevo = obtenerNivelPlan(membresia.nombre);
			
			if (nivelNuevo <= nivelActual) {
				return {
					success: false,
					error: 'Ya tienes un plan igual o superior',
					message: `Ya tienes una membresía ${membresiaActual.data.membresias.nombre} activa`
				};
			}
		}

		// 5. Preparar datos para registro en BD
		const datosRegistro = {
			usuario_id: datos.usuarioId,
			membresia_id: datos.membresiaId,
			nombre_producto: nombreProducto,
			descripcion: descripcion,
			valor: total,
			iva: iva,
			base_iva: base,
			ico: 0,
			moneda: 'COP',
			ref_payco: refPayco,
			estado: 'pendiente',
			ip_cliente: datos.ip_cliente || '',
			
			// Datos adicionales específicos de membresía
			datos_adicionales: {
				membresia: {
					plan_id: datos.planId,
					nombre_plan: membresia.nombre,
					es_anual: datos.esAnual,
					precio_original: precio,
					descuento_anual: datos.esAnual ? Math.round(((membresia.precio_mensual * 12 - membresia.precio_anual) / (membresia.precio_mensual * 12)) * 100) : 0
				},
				datos_personales: {
					email: datos.email,
					nombre: datos.nombre,
					telefono: datos.telefono || ''
				},
				tecnico: {
					ip_cliente: datos.ip_cliente,
					timestamp_creacion: new Date().toISOString(),
					user_agent: 'membership-selector'
				}
			}
		};

		// 6. Crear registro en BD
		const resultadoRegistro = await crearRegistroPago(datosRegistro);
		if (!resultadoRegistro.success) {
			console.error('❌ Error creando registro de pago:', resultadoRegistro.error);
			return {
				success: false,
				error: resultadoRegistro.error,
				message: 'Error guardando información del pago'
			};
		}

		// 6.5. Crear suscripción pendiente
		const tipoPago = datos.esAnual ? 'anual' : 'mensual';
		const resultadoSuscripcion = await crearSuscripcionPendiente(
			datos.usuarioId, 
			datos.membresiaId, 
			tipoPago as 'mensual' | 'anual',
			total, 
			refPayco
		);

		if (resultadoSuscripcion.error) {
			console.error('❌ Error creando suscripción pendiente:', resultadoSuscripcion.error);
			return {
				success: false,
				error: resultadoSuscripcion.error.message,
				message: 'Error creando suscripción pendiente'
			};
		}

		console.log('✅ Suscripción pendiente creada exitosamente');

		// 7. Preparar datos para ePayco
		const epaycoData = {
			// Configuración básica de ePayco
			key: import.meta.env.VITE_EPAYCO_PUBLIC_KEY,
			test: import.meta.env.VITE_EPAYCO_TEST_MODE === 'true',
			external: 'false',
			
			// Información del producto
			name: nombreProducto,
			description: descripcion,
			currency: 'cop',
			amount: total.toString(),
			tax_base: base.toString(),
			tax: iva.toString(),
			country: 'co',
			lang: 'es',
			
			// Información del cliente
			invoice: refPayco,
			email_billing: datos.email,
			name_billing: datos.nombre,
			type_doc_billing: 'cc',
			mobilephone_billing: datos.telefono || '',
			
			// URLs de respuesta
			response: `${import.meta.env.VITE_APP_URL}/api/pagos/respuesta`,
			confirmation: `${import.meta.env.VITE_APP_URL}/api/pagos/confirmar`,
			
			// URLs de redirección
			url_response: `${import.meta.env.VITE_APP_URL}/pago-confirmacion?ref=${refPayco}`,
			url_confirmation: `${import.meta.env.VITE_APP_URL}/api/pagos/webhook`,
			
			// Configuración adicional
			autoclick: 'false',
			p_cust_id_cliente: datos.usuarioId,
			p_customer_email: datos.email
		};

		console.log('✅ Pago de membresía preparado exitosamente');
		console.log('🎯 === FIN CREACIÓN PAGO MEMBRESÍA ===');

		return {
			success: true,
			data: resultadoRegistro.data,
			epaycoData: epaycoData,
			message: 'Pago de membresía preparado correctamente'
		};

	} catch (error: any) {
		console.error('💥 Error en crearPagoMembresia:', error);
		return {
			success: false,
			error: error.message,
			message: 'Error inesperado creando pago de membresía: ' + error.message
		};
	}
}

/**
 * Confirmar pago de membresía y activar suscripción
 */
export async function confirmarPagoMembresia(refPayco: string, datosConfirmacion: any): Promise<ResultadoPagoMembresia> {
	try {
		console.log('✅ === CONFIRMANDO PAGO DE MEMBRESÍA ===');
		console.log('📝 Referencia:', refPayco);
		console.log('📝 Datos confirmación:', datosConfirmacion);

		// 1. Obtener información del pago
		const { data: pago, error: errorPago } = await supabaseAdmin
			.from('pagos_epayco')
			.select(`
				*,
				membresias:membresia_id (*)
			`)
			.eq('ref_payco', refPayco)
			.single();

		if (errorPago || !pago) {
			console.error('❌ Pago no encontrado:', errorPago);
			return {
				success: false,
				error: 'Pago no encontrado',
				message: 'No se encontró el pago con esa referencia'
			};
		}

		// 2. Verificar que el pago sea exitoso
		if (datosConfirmacion.x_cod_response !== '1') {
			console.log('❌ Pago no exitoso, código:', datosConfirmacion.x_cod_response);
			
			// Actualizar estado a fallido
			await actualizarEstadoPago(refPayco, 'fallido', {
				cod_respuesta: datosConfirmacion.x_cod_response,
				respuesta: datosConfirmacion.x_response,
				motivo: datosConfirmacion.x_response_reason_text
			});

			return {
				success: false,
				error: 'Pago no exitoso',
				message: `Pago fallido: ${datosConfirmacion.x_response_reason_text}`
			};
		}

		// 3. Actualizar estado del pago a exitoso
		const resultadoActualizacion = await actualizarEstadoPago(refPayco, 'exitoso', {
			cod_respuesta: datosConfirmacion.x_cod_response,
			respuesta: datosConfirmacion.x_response,
			metodo_pago: datosConfirmacion.x_franchise,
			fecha_transaccion: new Date().toISOString(),
			transaction_id: datosConfirmacion.x_transaction_id,
			bank_name: datosConfirmacion.x_bank_name
		});

		if (!resultadoActualizacion.success) {
			console.error('❌ Error actualizando pago:', resultadoActualizacion.error);
			return {
				success: false,
				error: 'Error actualizando pago',
				message: 'Error al actualizar el estado del pago'
			};
		}

		// 4. Activar suscripción de membresía
		const transactionId = datosConfirmacion.x_transaction_id || '';
		
		const resultadoActivacion = await activarSuscripcion(refPayco, transactionId);

		if (!resultadoActivacion.success) {
			console.error('❌ Error activando suscripción:', resultadoActivacion.error);
			return {
				success: false,
				error: 'Error activando membresía',
				message: 'El pago fue exitoso pero no se pudo activar la membresía automáticamente'
			};
		}

		console.log('✅ Membresía activada exitosamente');
		console.log('✅ === FIN CONFIRMACIÓN PAGO MEMBRESÍA ===');

		return {
			success: true,
			data: {
				pago: pago,
				activacion: resultadoActivacion
			},
			message: 'Membresía activada exitosamente'
		};

	} catch (error: any) {
		console.error('💥 Error en confirmarPagoMembresia:', error);
		return {
			success: false,
			error: error.message,
			message: 'Error inesperado confirmando pago de membresía: ' + error.message
		};
	}
}

/**
 * Helper para obtener nivel numérico del plan
 */
function obtenerNivelPlan(planId: string): number {
	const niveles = {
		'basica': 1,
		'intermedia': 2,
		'avanzada': 3,
		'premium': 4
	};
	return niveles[planId as keyof typeof niveles] || 0;
} 