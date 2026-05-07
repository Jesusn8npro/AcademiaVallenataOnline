import { useMemo } from 'react';

// Ventana de pre-highlight: solo los ultimos 40 ticks antes del impacto.
// El boton se enciende JUSTO cuando la nota esta visualmente cerca del pito.
const VENTANA_OBJETIVO = 40;
// Notas dentro de este rango de ticks se consideran ACORDE (deben pisarse
// simultaneamente). Mas amplio que el UMBRAL_ACORDE del motor (15) para
// que la GUIA visual capture acordes con notas un poco desfasadas.
const UMBRAL_ACORDE = 30;

const matchPos = (botonId: string): string | null => {
    const m = botonId.match(/^([A-Z])-?(\d+)/) || botonId.match(/^(\d+)-(\d+)/);
    return m ? `${m[1]}-${m[2]}` : null;
};

export interface GuiaPitoResultado {
    guia: Map<string, 'halar' | 'empujar'>;
    sosteniendo: Set<string>;
}

interface Args {
    cancion: any;
    tickActual: number;
    notasImpactadas: Set<string>;
    notasImpactadasSize: number;
    botonesActivosMaestro: Record<string, any>;
}

// Calcula que pitos resaltar en cada frame: notas inminentes (acordes
// agrupados), sostenidos en curso, after-glow tras impacto, y el resaltado
// del maestro para modos synthesia/maestro_solo.
export const useGuiaPitoObjetivo = ({
    cancion, tickActual, notasImpactadas, notasImpactadasSize, botonesActivosMaestro,
}: Args) => {
    const objetivosMap = useMemo<GuiaPitoResultado>(() => {
        const guia = new Map<string, 'halar' | 'empujar'>();
        const sosteniendo = new Set<string>();
        const seq = cancion?.secuencia;
        if (!Array.isArray(seq)) return { guia, sosteniendo };

        // 1) Encontrar el tick de la nota mas proxima (no impactada, no pasada)
        let minTick: number | null = null;
        for (const nota of seq) {
            if (String(nota.botonId).includes('-bajo')) continue;
            const ticksHastaImpacto = nota.tick - tickActual;
            if (ticksHastaImpacto < -5 || ticksHastaImpacto > VENTANA_OBJETIVO) continue;
            if (notasImpactadas.has(`${nota.tick}-${nota.botonId}`)) continue;
            if (minTick === null || nota.tick < minTick) minTick = nota.tick;
        }

        // 2) Agrupar TODAS las notas dentro de UMBRAL_ACORDE de la mas proxima.
        if (minTick !== null) {
            for (const nota of seq) {
                if (String(nota.botonId).includes('-bajo')) continue;
                if (Math.abs(nota.tick - minTick) > UMBRAL_ACORDE) continue;
                if (notasImpactadas.has(`${nota.tick}-${nota.botonId}`)) continue;
                const pos = matchPos(nota.botonId);
                if (!pos) continue;
                guia.set(pos, nota.fuelle === 'abriendo' ? 'halar' : 'empujar');
            }
        }

        // 3) Sostenidos + after-glow de notas impactadas.
        for (const nota of seq) {
            if (String(nota.botonId).includes('-bajo')) continue;
            if (!notasImpactadas.has(`${nota.tick}-${nota.botonId}`)) continue;
            const dur = Number(nota.duracion) || 0;
            const esSostenida = dur >= 15;
            const tickFin = esSostenida ? nota.tick + dur + 12 : nota.tick + 20;
            if (tickActual >= tickFin || tickActual < nota.tick - 5) continue;
            const pos = matchPos(nota.botonId);
            if (!pos) continue;
            guia.set(pos, nota.fuelle === 'abriendo' ? 'halar' : 'empujar');
            if (esSostenida) sosteniendo.add(pos);
        }

        return { guia, sosteniendo };
    // notasImpactadas se MUTA sin cambiar referencia: el .size como dep adicional
    // fuerza re-calculo cuando se anade una nota impactada (Bug A).
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cancion, tickActual, notasImpactadasSize]);

    const posicionesObjetivoMaestro = useMemo<Set<string>>(() => {
        const set = new Set<string>();
        Object.keys(botonesActivosMaestro).forEach((botonId) => {
            const pos = matchPos(botonId);
            if (pos) set.add(pos);
        });
        return set;
    }, [botonesActivosMaestro]);

    return { objetivosMap, posicionesObjetivoMaestro };
};
