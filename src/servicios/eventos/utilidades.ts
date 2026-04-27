export function formatearFechaEvento(fecha: string, esFinalizacion: boolean = false): string {
    const fechaObj = new Date(fecha);
    const ahora = new Date();

    const opciones: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Bogota'
    };

    const fechaFormateada = fechaObj.toLocaleDateString('es-CO', opciones);

    if (esFinalizacion) {
        return `Finaliza: ${fechaFormateada}`;
    }

    if (fechaObj < ahora) {
        return `Finalizó: ${fechaFormateada}`;
    }

    return fechaFormateada;
}

export function obtenerEstadoEvento(fecha_inicio: string, fecha_fin: string | null, estado: string): {
    texto: string;
    clase: string;
    color: string;
} {
    const ahora = new Date();
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = fecha_fin ? new Date(fecha_fin) : null;

    if (estado === 'cancelado') {
        return { texto: 'Cancelado', clase: 'cancelado', color: 'text-red-500' };
    }

    if (fechaFin && ahora > fechaFin) {
        return { texto: 'Finalizado', clase: 'finalizado', color: 'text-gray-500' };
    }

    if (ahora >= fechaInicio && (!fechaFin || ahora <= fechaFin)) {
        return { texto: 'En vivo', clase: 'en-vivo', color: 'text-green-500' };
    }

    if (ahora < fechaInicio) {
        return { texto: 'Próximo', clase: 'proximo', color: 'text-blue-500' };
    }

    return { texto: 'Programado', clase: 'programado', color: 'text-yellow-500' };
}
