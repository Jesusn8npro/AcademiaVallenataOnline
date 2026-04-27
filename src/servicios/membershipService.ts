import { supabase } from '$servicios/clienteSupabase';
import { calcularIVA, generarReferencia } from './ePaycoService';

export interface Membresia {
	id: string;
	nombre: string;
	descripcion: string;
	precio_mensual: number;
	precio_anual: number;
	permisos: any;
	activa: boolean;
	fecha_creacion: string;
	fecha_actualizacion: string;
}

export interface SuscripcionUsuario {
	id: string;
	usuario_id: string;
	membresia_id: string;
	periodo: 'mensual' | 'anual'; // 🔧 CORREGIDO: tipo_pago → periodo
	estado: 'activa' | 'pausada' | 'cancelada' | 'vencida' | 'pendiente_pago';
	fecha_inicio: string;
	fecha_vencimiento: string;
	fecha_cancelacion?: string;
	precio_pagado: number;
	transaction_id?: string;
	ref_payco?: string;
	auto_renovar: boolean; // 🔧 CORREGIDO: renovacion_automatica → auto_renovar
	membresias?: Membresia;
}

/**
 * Obtener todos los planes de membresía disponibles
 */
export async function obtenerPlanesMembresia(): Promise<{ data: Membresia[] | null; error: any }> {
	try {
		const { data, error } = await supabase
			.from('membresias')
			.select('*')
			.eq('activa', true)
			.order('precio_mensual', { ascending: true });

		return { data, error };
	} catch (error) {
		return { data: null, error };
	}
}

/**
 * Obtener la membresía activa de un usuario
 */
export async function obtenerMembresiaUsuario(usuarioId: string): Promise<{ data: SuscripcionUsuario | null; error: any }> {
	try {
		const { data, error } = await supabase
			.from('suscripciones_usuario')
			.select(`
				*,
				membresias (
					id,
					nombre,
					descripcion,
					precio_mensual,
					precio_anual,
					permisos
				)
			`)
			.eq('usuario_id', usuarioId)
			.eq('estado', 'activa')
			.single();

		return { data, error };
	} catch (error) {
		return { data: null, error };
	}
}

/**
 * Verificar si un usuario tiene una membresía activa
 */
export async function usuarioTieneMembresia(usuarioId: string): Promise<boolean> {
	try {
		const { data } = await obtenerMembresiaUsuario(usuarioId);
		return !!data;
	} catch (error) {
		return false;
	}
}

/**
 * Verificar si un usuario tiene un permiso específico
 */
export async function usuarioTienePermiso(usuarioId: string, permiso: string): Promise<boolean> {
	try {
		const { data: suscripcion } = await obtenerMembresiaUsuario(usuarioId);
		
		if (!suscripcion?.membresias?.permisos) return false;

		const permisos = typeof suscripcion.membresias.permisos === 'string' 
			? JSON.parse(suscripcion.membresias.permisos)
			: suscripcion.membresias.permisos;

		return permisos[permiso] === true;
	} catch (error) {
		return false;
	}
}

/**
 * Obtener historial de suscripciones de un usuario
 */
export async function obtenerHistorialSuscripciones(usuarioId: string): Promise<{ data: SuscripcionUsuario[] | null; error: any }> {
	try {
		const { data, error } = await supabase
			.from('suscripciones_usuario')
			.select(`
				*,
				membresias (
					id,
					nombre,
					descripcion,
					precio_mensual,
					precio_anual
				)
			`)
			.eq('usuario_id', usuarioId)
			.order('fecha_inicio', { ascending: false });

		return { data, error };
	} catch (error) {
		return { data: null, error };
	}
}

/**
 * Generar referencia de pago para membresía
 */
export function generarReferenciaPagoMembresia(membresiaId: string, usuarioId: string, tipoPago: 'mensual' | 'anual'): string {
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	const tipoCode = tipoPago === 'mensual' ? 'MEM' : 'ANU';
	return `${tipoCode}-${membresiaId.toUpperCase()}-${timestamp}-${random}-${usuarioId.slice(-8)}`;
}

/**
 * Preparar datos para pago de membresía
 */
export function prepararDatosPagoMembresia(
	membresia: Membresia, 
	usuario: any, 
	tipoPago: 'mensual' | 'anual',
	datosPago: any
) {
	const precio = tipoPago === 'mensual' ? membresia.precio_mensual : membresia.precio_anual;
	const { base, iva, total } = calcularIVA(precio);
	const referencia = generarReferenciaPagoMembresia(membresia.id, usuario.id, tipoPago);

	return {
		// Datos del producto
		name: `Membresía ${membresia.nombre} - ${tipoPago === 'mensual' ? 'Mensual' : 'Anual'}`,
		description: `Plan ${membresia.nombre} - Academia Vallenata Online`,
		invoice: referencia,
		currency: 'COP',
		amount: total.toString(),
		tax_base: base.toString(),
		tax: iva.toString(),
		country: 'CO',
		lang: 'es',

		// Datos del cliente
		external: 'false',
		extra1: membresia.id,
		extra2: tipoPago,
		extra3: usuario.id,
		
		// Datos de facturación
		name_billing: `${datosPago.nombre} ${datosPago.apellido || ''}`.trim(),
		address_billing: datosPago.direccion,
		type_doc_billing: datosPago.tipo_documento || 'CC',
		mobilephone_billing: datosPago.telefono,
		number_doc_billing: datosPago.numero_documento,
		
		// URLs de respuesta
		response: `${window.location.origin}/pago-confirmacion`,
		confirmation: `${window.location.origin}/api/pagos/confirmar`,
		
		// Metadatos adicionales
		metodoPago: 'subscription',
		tipoPlan: tipoPago,
		membresiaId: membresia.id,
		usuarioId: usuario.id
	};
}

/**
 * Crear suscripción pendiente antes del pago
 */
export async function crearSuscripcionPendiente(
	usuarioId: string,
	membresiaId: string,
	tipoPago: 'mensual' | 'anual',
	precioPagedo: number,
	referencia: string
): Promise<{ data: SuscripcionUsuario | null; error: any }> {
	try {
		// Calcular fecha de vencimiento
		const fechaInicio = new Date();
		const fechaVencimiento = new Date();
		
		if (tipoPago === 'mensual') {
			fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
		} else {
			fechaVencimiento.setFullYear(fechaVencimiento.getFullYear() + 1);
		}

		const nuevaSuscripcion = {
			usuario_id: usuarioId,
			membresia_id: membresiaId,
			periodo: tipoPago, // 🔧 CORREGIDO: tipo_pago → periodo
			estado: 'pendiente_pago' as const,
			fecha_inicio: fechaInicio.toISOString(),
			fecha_vencimiento: fechaVencimiento.toISOString(),
			precio_pagado: precioPagedo,
			ref_payco: referencia,
			auto_renovar: true // 🔧 CORREGIDO: renovacion_automatica → auto_renovar
		};

		const { data, error } = await supabase
			.from('suscripciones_usuario')
			.insert(nuevaSuscripcion)
			.select()
			.single();

		return { data, error };
	} catch (error) {
		return { data: null, error };
	}
}

/**
 * Activar suscripción tras confirmación de pago
 */
export async function activarSuscripcion(refPayco: string, transactionId: string): Promise<{ success: boolean; error?: any }> {
	try {
		// Cancelar cualquier suscripción activa previa
		await supabase
			.from('suscripciones_usuario')
			.update({ 
				estado: 'cancelada',
				fecha_cancelacion: new Date().toISOString()
			})
			.eq('estado', 'activa')
			.neq('ref_payco', refPayco);

		// Activar la nueva suscripción
		const { error } = await supabase
			.from('suscripciones_usuario')
			.update({
				estado: 'activa',
				transaction_id: transactionId
				// 🔧 NOTA: updated_at se actualiza automáticamente con el trigger
			})
			.eq('ref_payco', refPayco);

		if (error) throw error;

		return { success: true };
	} catch (error) {
		return { success: false, error };
	}
}

/**
 * Cancelar suscripción
 */
export async function cancelarSuscripcion(usuarioId: string): Promise<{ success: boolean; error?: any }> {
	try {
		const { error } = await supabase
			.from('suscripciones_usuario')
			.update({
				estado: 'cancelada',
				fecha_cancelacion: new Date().toISOString(),
				auto_renovar: false // 🔧 CORREGIDO: renovacion_automatica → auto_renovar
			})
			.eq('usuario_id', usuarioId)
			.eq('estado', 'activa');

		if (error) throw error;

		return { success: true };
	} catch (error) {
		return { success: false, error };
	}
}

/**
 * Verificar si es hora de renovar suscripciones
 */
export async function verificarRenovaciones(): Promise<{ procesadas: number; errores: number }> {
	try {
		const { data: suscripciones } = await supabase
			.from('suscripciones_usuario')
			.select('*')
			.eq('estado', 'activa')
			.eq('auto_renovar', true) // 🔧 CORREGIDO: renovacion_automatica → auto_renovar
			.lt('fecha_vencimiento', new Date().toISOString());

		let procesadas = 0;
		let errores = 0;

		for (const suscripcion of suscripciones || []) {
			try {
				// Marcar como vencida
				await supabase
					.from('suscripciones_usuario')
					.update({ estado: 'vencida' })
					.eq('id', suscripcion.id);

				procesadas++;
			} catch (error) {
				errores++;
			}
		}

		return { procesadas, errores };
	} catch (error) {
		return { procesadas: 0, errores: 1 };
	}
}

/**
 * Obtener estadísticas de membresías (para admin)
 */
export async function obtenerEstadisticasMembresias(): Promise<{ data: any | null; error: any }> {
	try {
		const { data, error } = await supabase
			.from('vista_estadisticas_membresias')
			.select('*');

		return { data, error };
	} catch (error) {
		return { data: null, error };
	}
} 
