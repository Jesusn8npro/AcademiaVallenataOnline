import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { GrabacionReplayHero } from './Componentes/tiposReplay';

export function formatearDuracion(ms?: number | null) {
    const totalSegundos = Math.max(0, Math.floor((ms || 0) / 1000));
    const minutos = Math.floor(totalSegundos / 60);
    const segundos = totalSegundos % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

export function formatearFechaRelativa(fecha?: string | null) {
    if (!fecha) return 'Hace un momento';
    try {
        const texto = formatDistanceToNow(new Date(fecha), { addSuffix: true, locale: es });
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    } catch {
        return 'Hace un momento';
    }
}

export function obtenerSubtituloGrabacion(grabacion: GrabacionReplayHero) {
    if (grabacion.modo === 'competencia') {
        return `${grabacion.canciones_hero?.titulo || 'Competencia'}${grabacion.canciones_hero?.autor ? ` · ${grabacion.canciones_hero.autor}` : ''}`;
    }
    return `Practica libre · ${grabacion.bpm} BPM`;
}

export function obtenerMetaGrabacion(grabacion: GrabacionReplayHero) {
    if (grabacion.modo === 'competencia') {
        return [
            grabacion.puntuacion ? `${grabacion.puntuacion.toLocaleString('es-CO')} pts` : null,
            grabacion.notas_totales ? `${grabacion.notas_totales} notas` : null,
            formatearFechaRelativa(grabacion.created_at),
        ].filter(Boolean).join(' · ');
    }
    return [
        `Duracion ${formatearDuracion(grabacion.duracion_ms)}`,
        grabacion.tonalidad || null,
        formatearFechaRelativa(grabacion.created_at),
    ].filter(Boolean).join(' · ');
}

export function obtenerTituloInicialPublicacion(grabacion: GrabacionReplayHero) {
    if (grabacion.modo === 'competencia') {
        const precision = Math.round(grabacion.precision_porcentaje || 0);
        const cancion = grabacion.canciones_hero?.titulo || grabacion.titulo || 'esta cancion';
        return `Logre el ${precision}% en ${cancion}`;
    }
    return grabacion.titulo || 'Comparto esta practica libre';
}

export function obtenerTextoBadge(grabacion: GrabacionReplayHero) {
    if (grabacion.modo === 'competencia') return `${Math.round(grabacion.precision_porcentaje || 0)}%`;
    return formatearDuracion(grabacion.duracion_ms);
}
