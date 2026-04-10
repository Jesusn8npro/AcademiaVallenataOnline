import { supabase } from '$servicios/clienteSupabase';

export interface Membresia {
	id: string;
	nombre: string;
	descripcion: string;
	precio: number; // precio_mensual en centavos
	precio_anual?: number;
	ahorro_anual?: number;
	caracteristicas: string[];
	activa: boolean;
	popular: boolean;
	orden: number;
	limite_cursos?: number;
	limite_tutoriales?: number;
	soporte_prioritario: boolean;
	mentoria_incluida: boolean;
	clases_en_vivo: number;
	certificados_avanzados: boolean;
}

export interface SuscripcionMembresia {
	id: string;
	usuario_id: string;
	membresia_id: string;
	estado: 'activa' | 'pausada' | 'cancelada' | 'expirada';
	fecha_inicio: string;
	fecha_fin?: string;
	fecha_proximo_pago?: string;
	es_anual: boolean;
	precio_pagado: number;
	metodo_pago?: string;
	ref_pago?: string;
	renovacion_automatica: boolean;
}

/**
 * Obtener todas las membresías activas
 */
export async function obtenerMembresias(): Promise<Membresia[]> {
	try {
		const { data, error } = await supabase
			.from('membresias')
			.select('*')
			.eq('activa', true)
			.order('orden', { ascending: true });

		if (error) {
			console.error('❌ Error obteniendo membresías:', error);
			throw error;
		}

		// Mapear datos para que coincidan con la interfaz del frontend
		const membresias: Membresia[] = (data || []).map((m: any) => ({
			id: m.id,
			nombre: m.nombre,
			descripcion: m.descripcion || '',
			precio: m.precio_mensual || 0,
			precio_anual: m.precio_anual || 0,
			ahorro_anual: m.precio_mensual ? (m.precio_mensual * 12) - (m.precio_anual || 0) : 0,
			caracteristicas: Array.isArray(m.caracteristicas) ? m.caracteristicas : [],
			activa: m.activa || false,
			popular: m.popular || false,
			orden: m.orden || 0,
			limite_cursos: m.limite_cursos,
			limite_tutoriales: m.limite_tutoriales,
			soporte_prioritario: m.soporte_prioritario || false,
			mentoria_incluida: m.mentoria_incluida || false,
			clases_en_vivo: m.clases_en_vivo || 0,
			certificados_avanzados: m.certificados_avanzados || false
		}));

		console.log('✅ Membresías obtenidas:', membresias.length);
		return membresias;

	} catch (error) {
		console.error('❌ Error en obtenerMembresias:', error);
		return [];
	}
}

/**
 * Obtener una membresía específica por ID
 */
export async function obtenerMembresiaPorId(id: string): Promise<Membresia | null> {
	try {
		const { data, error } = await supabase
			.from('membresias')
			.select('*')
			.eq('id', id)
			.eq('activa', true)
			.single();

		if (error) {
			console.error('❌ Error obteniendo membresía:', error);
			return null;
		}

		if (!data) {
			console.warn('⚠️ Membresía no encontrada:', id);
			return null;
		}

		return {
			id: data.id,
			nombre: data.nombre,
			descripcion: data.descripcion || '',
			precio: data.precio_mensual || 0,
			precio_anual: data.precio_anual || 0,
			ahorro_anual: data.precio_mensual ? (data.precio_mensual * 12) - (data.precio_anual || 0) : 0,
			caracteristicas: Array.isArray(data.caracteristicas) ? data.caracteristicas : [],
			activa: data.activa || false,
			popular: data.popular || false,
			orden: data.orden || 0,
			limite_cursos: data.limite_cursos,
			limite_tutoriales: data.limite_tutoriales,
			soporte_prioritario: data.soporte_prioritario || false,
			mentoria_incluida: data.mentoria_incluida || false,
			clases_en_vivo: data.clases_en_vivo || 0,
			certificados_avanzados: data.certificados_avanzados || false
		};

	} catch (error) {
		console.error('❌ Error en obtenerMembresiaPorId:', error);
		return null;
	}
}

/**
 * Obtener la suscripción activa de un usuario
 */
export async function obtenerSuscripcionActiva(usuarioId: string): Promise<SuscripcionMembresia | null> {
	try {
		const { data, error } = await supabase
			.from('suscripciones_membresias')
			.select('*')
			.eq('usuario_id', usuarioId)
			.eq('estado', 'activa')
			.order('created_at', { ascending: false })
			.limit(1)
			.single();

		if (error || !data) {
			console.log('ℹ️ Usuario sin suscripción activa:', usuarioId);
			return null;
		}

		return {
			id: data.id,
			usuario_id: data.usuario_id,
			membresia_id: data.membresia_id,
			estado: data.estado,
			fecha_inicio: data.fecha_inicio,
			fecha_fin: data.fecha_fin,
			fecha_proximo_pago: data.fecha_proximo_pago,
			es_anual: data.es_anual || false,
			precio_pagado: data.precio_pagado || 0,
			metodo_pago: data.metodo_pago,
			ref_pago: data.ref_pago,
			renovacion_automatica: data.renovacion_automatica || false
		};

	} catch (error) {
		console.error('❌ Error en obtenerSuscripcionActiva:', error);
		return null;
	}
}

/**
 * Crear una nueva suscripción de membresía
 */
export async function crearSuscripcion(datos: {
	usuario_id: string;
	membresia_id: string;
	es_anual: boolean;
	precio_pagado: number;
	metodo_pago?: string;
	ref_pago?: string;
}): Promise<SuscripcionMembresia | null> {
	try {
		// Cancelar suscripciones activas previas
		await cancelarSuscripcionesActivas(datos.usuario_id);

		// Calcular fechas
		const fechaInicio = new Date();
		const fechaFin = new Date();
		if (datos.es_anual) {
			fechaFin.setFullYear(fechaFin.getFullYear() + 1);
		} else {
			fechaFin.setMonth(fechaFin.getMonth() + 1);
		}

		const fechaProximoPago = new Date(fechaFin);

		const { data, error } = await supabase
			.from('suscripciones_membresias')
			.insert({
				usuario_id: datos.usuario_id,
				membresia_id: datos.membresia_id,
				estado: 'activa',
				fecha_inicio: fechaInicio.toISOString(),
				fecha_fin: fechaFin.toISOString(),
				fecha_proximo_pago: fechaProximoPago.toISOString(),
				es_anual: datos.es_anual,
				precio_pagado: datos.precio_pagado,
				metodo_pago: datos.metodo_pago || 'ePayco',
				ref_pago: datos.ref_pago,
				renovacion_automatica: true
			})
			.select()
			.single();

		if (error) {
			console.error('❌ Error creando suscripción:', error);
			throw error;
		}

		console.log('✅ Suscripción creada exitosamente:', data.id);
		
		return {
			id: data.id,
			usuario_id: data.usuario_id,
			membresia_id: data.membresia_id,
			estado: data.estado,
			fecha_inicio: data.fecha_inicio,
			fecha_fin: data.fecha_fin,
			fecha_proximo_pago: data.fecha_proximo_pago,
			es_anual: data.es_anual,
			precio_pagado: data.precio_pagado,
			metodo_pago: data.metodo_pago,
			ref_pago: data.ref_pago,
			renovacion_automatica: data.renovacion_automatica
		};

	} catch (error) {
		console.error('❌ Error en crearSuscripcion:', error);
		throw error;
	}
}

/**
 * Cancelar todas las suscripciones activas de un usuario
 */
async function cancelarSuscripcionesActivas(usuarioId: string): Promise<void> {
	try {
		await supabase
			.from('suscripciones_membresias')
			.update({ 
				estado: 'cancelada',
				updated_at: new Date().toISOString()
			})
			.eq('usuario_id', usuarioId)
			.eq('estado', 'activa');

		console.log('✅ Suscripciones previas canceladas para usuario:', usuarioId);
	} catch (error) {
		console.error('❌ Error cancelando suscripciones previas:', error);
		// No lanzamos error para no bloquear la creación de la nueva
	}
}

/**
 * Verificar si un usuario tiene acceso a una funcionalidad específica
 */
export async function verificarAcceso(usuarioId: string, funcionalidad: string): Promise<boolean> {
	try {
		const suscripcion = await obtenerSuscripcionActiva(usuarioId);
		if (!suscripcion) {
			return false; // Sin suscripción = sin acceso
		}

		const membresia = await obtenerMembresiaPorId(suscripcion.membresia_id);
		if (!membresia) {
			return false;
		}

		// Lógica de acceso según funcionalidad y membresía
		switch (funcionalidad) {
			case 'cursos_ilimitados':
				return !membresia.limite_cursos;
			case 'tutoriales_ilimitados':
				return !membresia.limite_tutoriales;
			case 'soporte_prioritario':
				return membresia.soporte_prioritario;
			case 'mentoria':
				return membresia.mentoria_incluida;
			case 'clases_en_vivo':
				return membresia.clases_en_vivo > 0;
			case 'certificados_avanzados':
				return membresia.certificados_avanzados;
			default:
				return true; // Acceso básico
		}

	} catch (error) {
		console.error('❌ Error verificando acceso:', error);
		return false;
	}
}

/**
 * Obtener estadísticas de membresías para administradores
 */
export async function obtenerEstadisticasMembresias() {
	try {
		const { data: suscripciones, error } = await supabase
			.from('suscripciones_membresias')
			.select(`
				membresia_id,
				estado,
				es_anual,
				precio_pagado,
				membresias(nombre)
			`);

		if (error) {
			console.error('❌ Error obteniendo estadísticas:', error);
			return null;
		}

		// Procesar estadísticas
		const stats = {
			total_suscripciones: suscripciones?.length || 0,
			activas: suscripciones?.filter((s: any) => s.estado === 'activa').length || 0,
			canceladas: suscripciones?.filter((s: any) => s.estado === 'cancelada').length || 0,
			ingresos_totales: suscripciones?.reduce((sum: number, s: any) => sum + (s.precio_pagado || 0), 0) || 0,
			por_membresia: {} as Record<string, any>
		};

		// Agrupar por membresía
		suscripciones?.forEach((s: any) => {
			const nombre = (s.membresias as any)?.nombre || s.membresia_id;
			if (!stats.por_membresia[nombre]) {
				stats.por_membresia[nombre] = {
					total: 0,
					activas: 0,
					ingresos: 0
				};
			}
			stats.por_membresia[nombre].total++;
			if (s.estado === 'activa') {
				stats.por_membresia[nombre].activas++;
			}
			stats.por_membresia[nombre].ingresos += s.precio_pagado || 0;
		});

		return stats;

	} catch (error) {
		console.error('❌ Error en obtenerEstadisticasMembresias:', error);
		return null;
	}
}

/**
 * Generar datos de membresías por defecto si no existen en la base de datos
 */
export function obtenerMembresiasPorDefecto(): Membresia[] {
	return [
		{
			id: 'basico',
			nombre: 'Plan Básico',
			precio: 29900,
			precio_anual: 299000,
			ahorro_anual: 59800,
			popular: false,
			descripcion: 'Perfecto para empezar a aprender acordeón vallenato desde cero',
			caracteristicas: [
				'✅ Acceso a 5 cursos básicos',
				'✅ 20 tutoriales exclusivos', 
				'✅ Soporte por email',
				'✅ Comunidad de estudiantes',
				'✅ Certificados básicos',
				'✅ Acceso móvil y escritorio',
				'❌ Clases en vivo',
				'❌ Mentoría personalizada',
				'❌ Contenido premium',
				'❌ Simulador gaming avanzado',
				'❌ Soporte prioritario',
				'❌ Masterclass exclusivas'
			],
			activa: true,
			orden: 1,
			limite_cursos: 5,
			limite_tutoriales: 20,
			soporte_prioritario: false,
			mentoria_incluida: false,
			clases_en_vivo: 0,
			certificados_avanzados: false
		},
		{
			id: 'intermedio',
			nombre: 'Plan Intermedio',
			precio: 49900,
			precio_anual: 499000,
			ahorro_anual: 99800,
			popular: true,
			descripcion: 'La opción más popular - Acceso completo a tutoriales y simulador avanzado',
			caracteristicas: [
				'✅ TODO del Plan Básico',
				'✅ Acceso a TODOS los cursos (ilimitado)',
				'✅ +100 tutoriales exclusivos',
				'✅ Soporte prioritario 24/7',
				'✅ Comunidad VIP exclusiva',
				'✅ Certificados avanzados',
				'✅ 2 clases en vivo al mes',
				'✅ Simulador gaming premium',
				'✅ Descarga de contenido offline',
				'❌ Mentoría personalizada 1:1',
				'❌ Clases privadas',
				'❌ Acceso anticipado a contenido'
			],
			activa: true,
			orden: 2,
			limite_cursos: undefined,
			limite_tutoriales: undefined,
			soporte_prioritario: true,
			mentoria_incluida: false,
			clases_en_vivo: 2,
			certificados_avanzados: true
		},
		{
			id: 'premium',
			nombre: 'Plan Premium',
			precio: 79900,
			precio_anual: 799000,
			ahorro_anual: 159800,
			popular: false,
			descripcion: 'Para músicos serios - Acceso a cursos completos y eventos en vivo',
			caracteristicas: [
				'✅ TODO del Plan Intermedio',
				'✅ 4 clases en vivo al mes',
				'✅ Acceso anticipado a contenido nuevo',
				'✅ Análisis personalizado de progreso',
				'✅ Grabaciones exclusivas del maestro',
				'✅ Feedback directo en tus videos',
				'✅ Certificación profesional',
				'✅ Grupo exclusivo de WhatsApp',
				'✅ Acceso a eventos especiales',
				'❌ Acceso a eventos VIP presenciales',
				'❌ Red de contactos profesionales',
				'❌ Manager musical personal'
			],
			activa: true,
			orden: 3,
			limite_cursos: undefined,
			limite_tutoriales: undefined,
			soporte_prioritario: true,
			mentoria_incluida: false,
			clases_en_vivo: 4,
			certificados_avanzados: true
		},
		{
			id: 'elite',
			nombre: 'Plan Élite',
			precio: 129900,
			precio_anual: 1299000,
			ahorro_anual: 259800,
			popular: false,
			descripcion: '🏆 La experiencia más exclusiva - Solo para verdaderos profesionales',
			caracteristicas: [
				'✅ TODO del Plan Premium',
				'✅ 8 clases en vivo al mes',
				'✅ Masterclass privadas exclusivas',
				'✅ Acceso a eventos VIP presenciales',
				'✅ Red de contactos profesionales',
				'✅ Oportunidades de trabajo reales',
				'✅ Promoción en redes sociales',
				'✅ Acceso prioritario a nuevos lanzamientos',
				'✅ Llamadas directas con Jesús González',
				'✅ Certificación profesional avanzada',
				'✅ Soporte técnico premium 24/7',
				'✅ Acceso de por vida garantizado'
			],
			activa: true,
			orden: 4,
			limite_cursos: undefined,
			limite_tutoriales: undefined,
			soporte_prioritario: true,
			mentoria_incluida: false,
			clases_en_vivo: 8,
			certificados_avanzados: true
		}
	];
} 
