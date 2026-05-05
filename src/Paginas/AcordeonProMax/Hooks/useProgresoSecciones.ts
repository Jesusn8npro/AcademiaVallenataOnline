import { useCallback, useEffect, useState } from 'react';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { cargarProgresoSecciones } from '../../../servicios/seccionesProgresoService';
import type { EstadoSeccionUsuario, SeccionConEstado } from '../TiposProMax';
import type { Seccion } from '../tiposSecciones';

/**
 * Carga el progreso por sección del usuario actual para una canción.
 * Devuelve helpers para renderizar la lista con su estado (disponible/completada/etc).
 *
 * @param version  contador externo: cuando cambia, fuerza recarga del progreso
 *                 (útil tras un intento de sección o al volver a selección).
 */
export function useProgresoSecciones(cancionId: string | null | undefined, version = 0) {
    const { usuario } = useUsuario();
    const [progreso, setProgreso] = useState<Record<string, EstadoSeccionUsuario>>({});
    const [cargando, setCargando] = useState(false);

    const recargar = useCallback(async () => {
        if (!usuario?.id || !cancionId) {
            setProgreso({});
            return;
        }
        setCargando(true);
        try {
            const data = await cargarProgresoSecciones(usuario.id, cancionId);
            setProgreso(data);
        } finally {
            setCargando(false);
        }
    }, [usuario?.id, cancionId]);

    useEffect(() => {
        recargar();
    }, [recargar, version]);

    return { progreso, cargando, recargar };
}

/**
 * Combina la lista de secciones de una canción con el progreso del usuario,
 * y aplica la lógica de desbloqueo (secuencial o todo abierto).
 */
export function seccionesConEstado(
    secciones: Seccion[],
    progreso: Record<string, EstadoSeccionUsuario>,
    desbloqueoSecuencial: boolean,
    intentosParaMoneda: number,
): SeccionConEstado[] {
    const ordenadas = [...secciones].sort((a, b) => a.tickInicio - b.tickInicio);
    let bloqueoActivo = false;

    return ordenadas.map((s) => {
        const estado = progreso[s.id];
        const completada = !!estado?.completada;
        const intentos = estado?.intentos ?? 0;
        const monedasGanadas = Number(estado?.monedas_ganadas ?? 0);
        const mejorPrecision = Number(estado?.mejor_precision ?? 0);
        const intentosRestantes = Math.max(0, intentosParaMoneda - intentos);

        // Disponibilidad
        let disponible: boolean;
        if (!desbloqueoSecuencial) {
            disponible = true;
        } else {
            disponible = !bloqueoActivo;
            if (!completada) bloqueoActivo = true;
        }

        return {
            id: s.id,
            nombre: s.nombre,
            tickInicio: s.tickInicio,
            tickFin: s.tickFin,
            tipo: s.tipo,
            monedas: s.monedas ?? 0,
            disponible,
            completada,
            intentos,
            mejorPrecision,
            monedasGanadas,
            intentosRestantesParaMoneda: intentosRestantes,
            primerCompletadoEn: estado?.primer_completado_en ?? null,
        };
    });
}
