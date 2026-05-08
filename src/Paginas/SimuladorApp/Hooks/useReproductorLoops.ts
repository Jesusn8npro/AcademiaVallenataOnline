import { useCallback, useEffect, useRef, useState } from 'react';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
import type { PistaPracticaLibre } from '../../AcordeonProMax/PracticaLibre/TiposPracticaLibre';

export interface PistaActiva {
    id: string;
    nombre: string;
    url: string;
    artista?: string | null;
    bpm?: number | null;
}

export interface EstadoLoopError {
    name: string;
    message: string;
}

/**
 * Reproductor de loops del SimuladorApp — implementacion Web Audio API.
 *
 * Bug iOS Safari + HTMLAudio + Supabase Storage:
 * Probamos varios approaches con HTMLAudioElement (URL directa, Blob URL con
 * Content-Type forzado, crossOrigin) y TODOS fallaron en iPhone real con
 * NotSupportedError / MediaError code 4. iOS Safari WebKit es estricto con
 * HTMLAudio en formas que no podemos saltar desde el cliente.
 *
 * Solucion: bypassear HTMLAudio entero y usar Web Audio API directo.
 *   1. fetch() del MP3 -> ArrayBuffer.
 *   2. AudioContext.decodeAudioData(arrayBuf) -> AudioBuffer.
 *   3. AudioBufferSourceNode con loop=true, conectado a GainNode -> destination.
 *
 * El AudioContext es el mismo que el del acordeon (motorAudioPro.contextoAudio),
 * que ya esta running en iOS porque el alumno toco un pito antes. Web Audio
 * API en iOS no tiene los problemas de MIME/CORS de HTMLAudio porque trabajamos
 * con bytes crudos y los decodificamos nosotros.
 *
 * Pre-decodificamos los buffers cuando el modal se abre. El play() en click
 * es sincrono e inmediato (ya tenemos el AudioBuffer en memoria).
 */
export function useReproductorLoops() {
    const [pistaActiva, setPistaActiva] = useState<PistaActiva | null>(null);
    const [volumen, setVolumen] = useState(0.85);
    const [velocidad, setVelocidad] = useState(1.0);
    const [pan, setPan] = useState(0); // -1..1: balance L/R stereo
    const [errorReproduccion, setErrorReproduccion] = useState<EstadoLoopError | null>(null);
    const [pistasListas, setPistasListas] = useState<Set<string>>(new Set());

    // Cache: URL original → AudioBuffer ya decodificado.
    const bufferMap = useRef<Map<string, AudioBuffer>>(new Map());
    const descargandoMap = useRef<Map<string, Promise<void>>>(new Map());

    // Estado de la reproduccion en curso.
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);
    const gainRef = useRef<GainNode | null>(null);
    const panNodeRef = useRef<StereoPannerNode | null>(null);
    const startTimeRef = useRef(0);  // contexto.currentTime cuando arranco la fuente

    /**
     * Pre-descarga + decodifica un MP3. Lo deja en bufferMap listo para play.
     * Si falla, lo loguea pero no setea errorReproduccion (la precarga es
     * silenciosa; el banner solo aparece si el usuario intenta reproducir).
     */
    const precargarPista = useCallback(async (pista: PistaPracticaLibre): Promise<void> => {
        const url = pista.audioUrl || (pista.capas && pista.capas[0]?.url);
        if (!url) return;
        if (bufferMap.current.has(url)) return;

        const enCurso = descargandoMap.current.get(url);
        if (enCurso) return enCurso;

        const promesa = (async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
                const arrayBuf = await response.arrayBuffer();
                if (arrayBuf.byteLength === 0) throw new Error('Respuesta vacia');
                // decodeAudioData: iOS Safari soporta MP3, AAC, M4A. Si llega
                // otra cosa rechaza con DOMException EncodingError.
                const ctx = motorAudioPro.contextoAudio;
                const audioBuf = await ctx.decodeAudioData(arrayBuf);
                bufferMap.current.set(url, audioBuf);
                setPistasListas(prev => {
                    const next = new Set(prev);
                    next.add(url);
                    return next;
                });
            } catch (e: any) {
                console.error('[Loops] precarga fallo:', url, e?.name, e?.message || e);
            } finally {
                descargandoMap.current.delete(url);
            }
        })();
        descargandoMap.current.set(url, promesa);
        return promesa;
    }, []);

    const precargarPistas = useCallback((pistas: PistaPracticaLibre[]) => {
        pistas.forEach(p => { void precargarPista(p); });
    }, [precargarPista]);

    const detener = useCallback(() => {
        const source = sourceRef.current;
        if (source) {
            try { source.stop(); } catch { /* noop si nunca arranco */ }
            try { source.disconnect(); } catch { /* noop */ }
        }
        sourceRef.current = null;
        setPistaActiva(null);
    }, []);

    const reproducir = useCallback((pista: PistaPracticaLibre) => {
        if (pistaActiva && pistaActiva.id === pista.id) {
            detener();
            return;
        }
        const url = pista.audioUrl || (pista.capas && pista.capas[0]?.url);
        if (!url) return;

        setErrorReproduccion(null);

        const buffer = bufferMap.current.get(url);
        if (!buffer) {
            void precargarPista(pista);
            setErrorReproduccion({
                name: 'Cargando',
                message: 'Esta pista todavia se esta descargando. Intenta de nuevo en un segundo.',
            });
            return;
        }

        // Detener la reproduccion anterior (si la habia).
        const prev = sourceRef.current;
        if (prev) {
            try { prev.stop(); } catch { /* noop */ }
            try { prev.disconnect(); } catch { /* noop */ }
            sourceRef.current = null;
        }

        const ctx = motorAudioPro.contextoAudio;

        // Resume del contexto fire-and-forget (el gesto del click cuenta).
        if (ctx.state === 'suspended') {
            ctx.resume().catch((e) => console.warn('[Loops] resume fallo:', e));
        }

        // GainNode + StereoPannerNode persistentes (los reusamos entre pistas).
        // Routing: source → gain → pan → destination. Sin pan stereo el slider
        // PAN del panel de efectos no podía afectar la pista de loops.
        let gain = gainRef.current;
        if (!gain) {
            gain = ctx.createGain();
            const panNode = ctx.createStereoPanner();
            gain.connect(panNode);
            panNode.connect(ctx.destination);
            gainRef.current = gain;
            panNodeRef.current = panNode;
        }
        gain.gain.value = volumen;
        if (panNodeRef.current) panNodeRef.current.pan.value = pan;

        // AudioBufferSourceNode: nuevo cada vez (no se pueden reusar tras stop).
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.playbackRate.value = velocidad;
        source.connect(gain);

        try {
            source.start(0, 0);
            startTimeRef.current = ctx.currentTime;
            sourceRef.current = source;
        } catch (e: any) {
            const name = e?.name || 'Error';
            const message = e?.message || 'No se pudo iniciar la pista.';
            console.error('[Loops] source.start fallo:', name, message, e);
            setErrorReproduccion({ name, message });
            return;
        }

        setPistaActiva({
            id: pista.id,
            nombre: pista.nombre,
            url,
            artista: pista.artista || null,
            bpm: pista.bpm || null,
        });
    }, [pistaActiva, volumen, velocidad, detener, precargarPista]);

    // Volumen en vivo via GainNode.
    useEffect(() => {
        if (gainRef.current) gainRef.current.gain.value = volumen;
    }, [volumen]);

    // Pan en vivo via StereoPannerNode con rampa para evitar zipper noise.
    useEffect(() => {
        const node = panNodeRef.current;
        if (!node) return;
        const ctx = motorAudioPro.contextoAudio;
        node.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime, 0.03);
    }, [pan]);

    // Velocidad en vivo via AudioParam de la fuente.
    useEffect(() => {
        const source = sourceRef.current;
        if (source) source.playbackRate.value = velocidad;
    }, [velocidad]);

    // Cleanup al desmontar.
    useEffect(() => {
        return () => {
            const source = sourceRef.current;
            if (source) {
                try { source.stop(); } catch { /* noop */ }
                try { source.disconnect(); } catch { /* noop */ }
            }
            sourceRef.current = null;
            const gain = gainRef.current;
            if (gain) {
                try { gain.disconnect(); } catch { /* noop */ }
            }
            gainRef.current = null;
            bufferMap.current.clear();
        };
    }, []);

    /**
     * Posicion en segundos dentro del buffer (para anclar grabaciones).
     * Loop: modulo de la duracion del buffer.
     */
    const obtenerPosicion = useCallback(() => {
        const source = sourceRef.current;
        if (!source || !source.buffer) return 0;
        const ctx = motorAudioPro.contextoAudio;
        const elapsed = (ctx.currentTime - startTimeRef.current) * velocidad;
        const dur = source.buffer.duration;
        if (!isFinite(dur) || dur <= 0) return 0;
        return elapsed % dur;
    }, [velocidad]);

    return {
        pistaActiva,
        volumen,
        velocidad,
        pan,
        errorReproduccion,
        pistasListas,
        setVolumen,
        setVelocidad,
        setPan,
        reproducir,
        detener,
        obtenerPosicion,
        precargarPistas,
    };
}
