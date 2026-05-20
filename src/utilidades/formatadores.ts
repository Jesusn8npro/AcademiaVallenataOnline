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

// =====================================================================
// TIEMPO POR TICKS (canciones / acordeon)
// =====================================================================

/**
 * Convierte ticks de cancion a "m:ss" segun bpm y resolucion (PPQ).
 * Resolucion por defecto 192. Devuelve "0:00" si el calculo no es finito
 * o negativo (entrada invalida) — comportamiento seguro para la UI.
 */
export function formatearTiempoTicks(ticks: number, bpm: number, resolucion = 192): string {
    const seg = (ticks / resolucion) * (60 / Math.max(1, bpm));
    if (!isFinite(seg) || seg < 0) return '0:00';
    const m = Math.floor(seg / 60);
    const s = Math.floor(seg % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// =====================================================================
// DURACIÓN (múltiples variantes por tipo de entrada)
// =====================================================================

/** Desde milisegundos → "m:ss". Ej: 75000 → "1:15". */
export function formatearDuracionMs(ms?: number | null): string {
    const totalSeg = Math.max(0, Math.floor((ms || 0) / 1000));
    const min = Math.floor(totalSeg / 60);
    const seg = totalSeg % 60;
    return `${min}:${seg.toString().padStart(2, '0')}`;
}

/** Desde segundos → "m:ss". Ej: 75 → "1:15". */
export function formatearDuracionSeg(segundos: number): string {
    const min = Math.floor(Math.max(0, segundos) / 60);
    const seg = Math.floor(Math.max(0, segundos) % 60);
    return `${min}:${seg.toString().padStart(2, '0')}`;
}

/** Desde minutos → "Xh Ym" o "Ym". Ej: 90 → "1h 30m". */
export function formatearDuracionMin(minutos: number): string {
    const h = Math.floor(Math.max(0, minutos) / 60);
    const m = Math.floor(Math.max(0, minutos) % 60);
    if (h > 0) return `${h}h ${m > 0 ? `${m}m` : ''}`.trim();
    return `${m}m`;
}

// =====================================================================
// FECHAS RELATIVAS
// =====================================================================

/**
 * Fecha relativa compacta → "Hace un momento", "Hace 3h", "Hace 2 días".
 * Acepta string ISO o null. Sin dependencias externas.
 */
export function formatearFechaRelativa(fecha?: string | null): string {
    if (!fecha) return 'Hace un momento';
    try {
        const dif = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60));
        if (dif < 1) return 'Hace un momento';
        if (dif < 60) return `Hace ${dif} minuto${dif > 1 ? 's' : ''}`;
        const h = Math.floor(dif / 60);
        if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`;
        const d = Math.floor(h / 24);
        if (d < 7) return `Hace ${d} día${d > 1 ? 's' : ''}`;
        const sem = Math.floor(d / 7);
        if (sem < 5) return `Hace ${sem} semana${sem > 1 ? 's' : ''}`;
        return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return 'Hace un momento';
    }
}

/**
 * Tiempo relativo compacto manual (sin date-fns) → "Ahora mismo", "Hace 3h", "Hace 2d".
 * Acepta string ISO o null.
 */
export function formatearTiempoRelativo(fecha: string | null | undefined): string {
    if (!fecha) return 'Nunca';
    const dif = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60));
    if (dif < 1) return 'Ahora mismo';
    if (dif < 60) return `Hace ${dif}m`;
    if (dif < 1440) return `Hace ${Math.floor(dif / 60)}h`;
    return `Hace ${Math.floor(dif / 1440)}d`;
}

/**
 * Última actividad en formato humano con horas/días.
 * Acepta objeto Date.
 */
export function formatearUltimaActividad(fecha: Date): string {
    const diff = Date.now() - fecha.getTime();
    const horas = Math.floor(diff / (1000 * 60 * 60));
    const dias = Math.floor(horas / 24);
    if (horas < 1) return 'Hace menos de una hora';
    if (horas < 24) return `Hace ${horas} hora${horas > 1 ? 's' : ''}`;
    if (dias < 7) return `Hace ${dias} día${dias > 1 ? 's' : ''}`;
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
}

// =====================================================================
// PARSEO JSON
// =====================================================================

/**
 * Normaliza un valor que puede ser un array, un string JSON de array, o
 * nulo, a un array. Si no es parseable o no es array, devuelve [].
 * Usado para columnas JSON de Supabase (secciones, notas, etc.).
 */
export function parsearArrayJSON(raw: any): any[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; }
        catch { return []; }
    }
    return [];
}
