/**
 * Formatadores unificados.
 *
 * Cada funcion describe EXPLICITAMENTE el formato de salida y el locale.
 * NO unifica firmas incompatibles (ej: formatearTiempo en ms vs minutos).
 * En su lugar provee variantes nombradas: formatearTiempoDesdeMinutos,
 * formatearTiempoDesdeMS, etc.
 *
 * Sirve como destino unico para migrar duplicados copy-paste del codebase.
 */

// =====================================================================
// FECHAS
// =====================================================================

/**
 * Formato largo: "lunes, 15 de enero de 2024".
 * Locale: es-ES. Usado en paginas de eventos.
 */
export function formatearFechaLarga(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Formato medio: "15 de enero de 2024".
 * Locale: es-ES. Usado en pestanas administrador.
 */
export function formatearFechaMedia(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

/**
 * Formato corto: "15 ene 2024".
 * Locale: es-ES. Mes abreviado.
 */
export function formatearFechaCorta(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Formato hora: "14:30". Locale: es-ES.
 */
export function formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

// =====================================================================
// MONEDA / PRECIO
// =====================================================================

/**
 * Moneda COP locale es-CO sin decimales (min y max 0). "$ 25.000".
 * Variante mas estricta — fuerza no decimales en redondeo.
 */
export function formatearMonedaCOP(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(valor);
}

/**
 * Precio COP locale es-CO con minimo 0 decimales (Intl puede aniadir
 * decimales si la moneda lo requiere). Equivalente al uso historico
 * de formatearPrecio en servicios/paquetes y Perfil/utils.
 */
export function formatearPrecioCOP(precio: number): string {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(precio);
}
