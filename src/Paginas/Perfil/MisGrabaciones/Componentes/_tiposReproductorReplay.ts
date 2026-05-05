import type { GrabacionReplayHero } from './tiposReplay';

export interface LogicaAcordeon {
    disenoCargado: boolean;
    cargando: boolean;
    tonalidadSeleccionada: string;
    instrumentoId: string;
    ajustes: any;
    setTonalidadSeleccionada: (t: string) => void;
    setInstrumentoId: (id: string) => void;
    setAjustes: (updater: any) => void;
    setModoVista: (modo: any) => void;
    obtenerRutasAudio: (botonId: string) => string[];
}

export interface ReproductorHero {
    tickActual: number;
    totalTicks: number;
    reproduciendo: boolean;
    pausado: boolean;
    reproducirSecuencia: (cancion: any) => void;
    buscarTick: (tick: number) => void;
    alternarPausa: () => void;
    detenerReproduccion: () => void;
}

export interface UseReproductorReplayParams {
    abierta: boolean;
    grabacion: GrabacionReplayHero | null;
    logica: LogicaAcordeon;
    reproductor: ReproductorHero;
    bpm: number;
    setBpm: (bpm: number) => void;
}

export function convertirTicksASegundos(ticks: number, bpm: number, resolucion: number) {
    return (ticks / Math.max(1, resolucion)) * (60 / Math.max(1, bpm));
}

export function limitarPlaybackRate(valor: number) {
    return Math.min(4, Math.max(0.1, valor));
}

// Lead-in que `useLogicaProMax` aplica al arrancar competencia con sección no-intro:
// el MP3 arranca 3s antes del `tickInicio` para dar visual preview al alumno.
// Mantener sincronizado con `LEADIN_SEGUNDOS_SECCION` en useLogicaProMax.
const LEADIN_SEGUNDOS_SECCION_GRABACION = 3;

export function construirCancionReplay(grabacion: GrabacionReplayHero | null) {
    if (!grabacion) return null;
    let secuencia = grabacion.secuencia_grabada || [];
    // Compensación de grabaciones VIEJAS (anteriores al fix del recorder) que guardaban ticks
    // RELATIVOS al inicio de grabación en vez de absolutos del song. Si la metadata dice que la
    // grabación fue de una sección a partir de tick X, pero el primer tick capturado es muy
    // anterior a X, los ticks son relativos → los shifteamos a posición absoluta sumando X.
    const secInicio = Number((grabacion.metadata as any)?.seccion_tick_inicio) || 0;
    if (secInicio > 0 && secuencia.length > 0) {
        const primerTick = Math.min(...secuencia.map((n: any) => Number(n.tick) || 0));
        if (primerTick < secInicio - 500) {
            secuencia = secuencia.map((n: any) => ({
                ...n,
                tick: (Number(n.tick) || 0) + secInicio,
            }));
        }
    }

    // Compensación del lead-in de competencia. Bug del grabador: cuando hay sección con lead-in,
    // `useGrabadorHero.iniciarGrabacion` ancla `audioStartTime = audio.currentTime` (= sectionStartSeg − 3s)
    // pero `checkpointTicks = sectionTickInicio` — esos dos valores DEBERÍAN representar el mismo punto
    // pero están desalineados por 3s × factor. Resultado: cada captured_tick = audio_musical_tick + 3s × factor.
    // Para que el replay quede sample-accurate (RAF y audio.currentTime en el mismo espacio temporal),
    // restamos ese offset constante de TODOS los ticks → ticks pasan a ser audio musical ticks puros.
    const reso = grabacion.resolucion || 192;
    const bpmOrig = Number(grabacion.canciones_hero?.bpm) || Number((grabacion.metadata as any)?.bpm_original) || grabacion.bpm || 120;
    const tieneLeadIn = grabacion.modo === 'competencia' && secInicio > 0;
    if (tieneLeadIn && secuencia.length > 0) {
        const leadInTicks = Math.floor(LEADIN_SEGUNDOS_SECCION_GRABACION * (bpmOrig / 60) * reso);
        if (leadInTicks > 0) {
            secuencia = secuencia.map((n: any) => ({
                ...n,
                tick: Math.max(0, (Number(n.tick) || 0) - leadInTicks),
            }));
        }
    }

    return {
        titulo: grabacion.titulo || grabacion.canciones_hero?.titulo || 'Replay Hero',
        autor: grabacion.canciones_hero?.autor || (grabacion.modo === 'competencia' ? 'Modo competencia' : 'Practica libre'),
        bpm: grabacion.bpm || 120,
        resolucion: grabacion.resolucion || 192,
        secuencia,
        dificultad: 'basico' as const,
        tipo: 'secuencia' as const,
        tonalidad: grabacion.tonalidad || undefined,
    };
}

export function calcularBpmPistaOriginal(grabacion: GrabacionReplayHero | null, bpm: number): number {
    if (!grabacion) return bpm;
    const bpmDesdeCancion = Number(grabacion.canciones_hero?.bpm);
    const bpmDesdeMetadata = Number(
        grabacion.metadata?.bpm_original
        ?? grabacion.metadata?.cancion_bpm
        ?? grabacion.metadata?.bpm_cancion
        ?? grabacion.metadata?.bpm
    );
    if (Number.isFinite(bpmDesdeCancion) && bpmDesdeCancion > 0) return bpmDesdeCancion;
    if (Number.isFinite(bpmDesdeMetadata) && bpmDesdeMetadata > 0) return bpmDesdeMetadata;
    return grabacion.bpm || 120;
}

// Helpers de sync legacy (`invocarSincronizacionConPista` + `registrarSyncCuandoSuene`)
// removidos: el replay ahora usa `setAudioSync` del useReproductorHero, que vive en el mismo
// clock que el ReproductorMP3 → cero drift sin ese mecanismo viejo de window globals.
