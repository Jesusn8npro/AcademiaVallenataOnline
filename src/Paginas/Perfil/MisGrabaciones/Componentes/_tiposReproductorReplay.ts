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

export function construirCancionReplay(grabacion: GrabacionReplayHero | null) {
    if (!grabacion) return null;
    return {
        titulo: grabacion.titulo || grabacion.canciones_hero?.titulo || 'Replay Hero',
        autor: grabacion.canciones_hero?.autor || (grabacion.modo === 'competencia' ? 'Modo competencia' : 'Practica libre'),
        bpm: grabacion.bpm || 120,
        resolucion: grabacion.resolucion || 192,
        secuencia: grabacion.secuencia_grabada || [],
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

export function invocarSincronizacionConPista() {
    if (typeof (window as any).sincronizarRelojConPista === 'function') {
        (window as any).sincronizarRelojConPista();
    }
}

export function registrarSyncCuandoSuene(audio: HTMLAudioElement) {
    audio.onplaying = () => { invocarSincronizacionConPista(); audio.onplaying = null; };
}
