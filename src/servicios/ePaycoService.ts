// Configuración de ePayco usando variables de entorno
// ⚠️ IMPORTANTE: La private key NUNCA se incluye en el frontend
// La private key está segura en la Edge Function de Supabase como secret
const EPAYCO_CONFIG = {
	apiKey: import.meta.env.VITE_EPAYCO_PUBLIC_KEY,
	customerId: import.meta.env.VITE_EPAYCO_CUSTOMER_ID,
	test: import.meta.env.VITE_EPAYCO_TEST_MODE === 'true',
	lang: 'es'
};

// Validar que las variables de entorno de ePayco estén configuradas
if (!EPAYCO_CONFIG.apiKey || !EPAYCO_CONFIG.customerId) {
	throw new Error('❌ Variables de entorno de ePayco no configuradas. Revisa tu archivo .env');
}

console.log('🔧 ePayco configurado en modo:', EPAYCO_CONFIG.test ? 'SANDBOX' : 'PRODUCCIÓN');

/**
 * Calcular IVA (19%)
 */
export function calcularIVA(valor: number): { base: number; iva: number; total: number } {
	const iva = Math.round(valor * 0.19);
	const base = valor - iva;
	return {
		base,
		iva,
		total: valor
	};
}

/**
 * Generar referencia única para el pago
 */
export function generarReferencia(tipo: 'curso' | 'tutorial' | 'paquete', id: string, usuarioId: string): string {
	const timestamp = Date.now().toString().slice(-6);
	const random = Math.random().toString(36).substring(2, 6).toUpperCase();
	const tipoCode = tipo === 'curso' ? 'CUR' : tipo === 'tutorial' ? 'TUT' : 'PAQ';
	return `${tipoCode}-${id.padStart(6, '0')}-${timestamp}-${random}-${usuarioId.slice(-8)}`;
}

/**
 * Verificar pago con ePayco (funcionalidad básica)
 */
export async function verificarPago(refPayco: string) {
	try {
		console.log('🔍 Verificando pago:', refPayco);
		// Aquí iría la lógica de verificación real con ePayco
		// Por ahora retornamos un resultado básico
		return {
			success: true,
			verificado: true,
			ref_payco: refPayco
		};
	} catch (error) {
		console.error('❌ Error verificando pago:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Error desconocido'
		};
	}
} 