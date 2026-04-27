export function formatearFecha(fecha: string): string {
    const ahora = new Date();
    const fechaPublicacion = new Date(fecha);
    const diferencia = ahora.getTime() - fechaPublicacion.getTime();

    const minutos = Math.floor(diferencia / (1000 * 60));
    const horas = Math.floor(diferencia / (1000 * 60 * 60));
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));

    if (minutos < 1) {
        return 'Ahora';
    } else if (minutos < 60) {
        return `${minutos}m`;
    } else if (horas < 24) {
        return `${horas}h`;
    } else if (dias < 7) {
        return `${dias}d`;
    } else {
        return fechaPublicacion.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short'
        });
    }
}

export function validarPublicacion(contenido: string): string | null {
    if (!contenido || contenido.trim().length === 0) {
        return 'El contenido no puede estar vacío';
    }
    if (contenido.length > 500) {
        return 'El contenido no puede tener más de 500 caracteres';
    }
    return null;
}

export function validarComentario(contenido: string): string | null {
    if (!contenido || contenido.trim().length === 0) {
        return 'El comentario no puede estar vacío';
    }
    if (contenido.length > 200) {
        return 'El comentario no puede tener más de 200 caracteres';
    }
    return null;
}
