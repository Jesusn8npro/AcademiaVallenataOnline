import { useCallback, useEffect, useRef, useState } from 'react';
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
 * Reproductor de loops del SimuladorApp.
 *
 * Bug iOS Safari (documentado: github.com/orgs/supabase/discussions/35866):
 * Supabase Storage sirve los MP3 con Content-Type `application/octet-stream`
 * en lugar de `audio/mpeg`. iOS Safari rechaza decodear cualquier audio cuyo
 * Content-Type no sea `audio/*` -> MediaError code 4 (NotSupportedError).
 *
 * Solucion: descargamos el MP3 con fetch(), lo envolvemos en un Blob nuevo
 * con `type: 'audio/mpeg'` forzado, y reproducimos desde una Object URL local.
 * iOS confia en el MIME del blob local, no del servidor.
 *
 * Pre-cargamos los blobs cuando el modal se abre. Por ende el play() en
 * el click del usuario es SINCRONO y dentro del gesto -> sin NotAllowedError.
 */
export function useReproductorLoops() {
    const [pistaActiva, setPistaActiva] = useState<PistaActiva | null>(null);
    const [volumen, setVolumen] = useState(0.85);
    const [velocidad, setVelocidad] = useState(1.0);
    const [errorReproduccion, setErrorReproduccion] = useState<EstadoLoopError | null>(null);
    // Set de URLs pre-descargadas y listas para reproducir. Lo usa la UI para
    // mostrar un loader en cada fila hasta que esta lista.
    const [pistasListas, setPistasListas] = useState<Set<string>>(new Set());

    const audioRef = useRef<HTMLAudioElement | null>(null);
    // Mapa: URL original de Supabase → Object URL del blob local.
    const blobUrlMap = useRef<Map<string, string>>(new Map());
    // URLs en proceso de descarga, para no duplicar fetches.
    const descargandoMap = useRef<Map<string, Promise<void>>>(new Map());

    /**
     * Pre-descarga un MP3 como Blob con Content-Type forzado a 'audio/mpeg'.
     * Es la unica forma confiable de reproducir audio de Supabase Storage en
     * iOS Safari sin tocar la configuracion del bucket.
     */
    const precargarPista = useCallback(async (pista: PistaPracticaLibre): Promise<void> => {
        const url = pista.audioUrl || (pista.capas && pista.capas[0]?.url);
        if (!url) return;
        if (blobUrlMap.current.has(url)) return;

        // Si ya hay una descarga en curso, esperarla.
        const enCurso = descargandoMap.current.get(url);
        if (enCurso) return enCurso;

        const promesa = (async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
                const buffer = await response.arrayBuffer();
                // Forzar Content-Type a audio/mpeg para iOS. Sin esto, iOS
                // recibe application/octet-stream de Supabase y rechaza.
                const blob = new Blob([buffer], { type: 'audio/mpeg' });
                const blobUrl = URL.createObjectURL(blob);
                blobUrlMap.current.set(url, blobUrl);
                setPistasListas(prev => new Set(prev).add(url));
            } catch (e: any) {
                console.error('[Loops] precarga fallo:', url, e?.message || e);
                // No setear errorReproduccion aqui — el banner solo aparece al
                // intentar reproducir. La precarga es silenciosa y se reintenta
                // al hacer click si fallo.
            } finally {
                descargandoMap.current.delete(url);
            }
        })();
        descargandoMap.current.set(url, promesa);
        return promesa;
    }, []);

    /** Pre-descarga una lista entera. Usado al abrir el modal. */
    const precargarPistas = useCallback((pistas: PistaPracticaLibre[]) => {
        pistas.forEach(p => { void precargarPista(p); });
    }, [precargarPista]);

    // Aplicar volumen y velocidad en vivo al audio actual.
    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volumen;
    }, [volumen]);
    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = velocidad;
    }, [velocidad]);

    const detener = useCallback(() => {
        const audio = audioRef.current;
        if (audio) {
            try { audio.pause(); } catch { /* noop */ }
        }
        setPistaActiva(null);
    }, []);

    const reproducir = useCallback((pista: PistaPracticaLibre) => {
        // Toggle: misma pista → para.
        if (pistaActiva && pistaActiva.id === pista.id) {
            detener();
            return;
        }
        const urlOriginal = pista.audioUrl || (pista.capas && pista.capas[0]?.url);
        if (!urlOriginal) return;

        setErrorReproduccion(null);

        // Si la pista no esta pre-descargada todavia, intentamos descargarla
        // en background y avisamos al usuario. Si la URL original se intenta
        // reproducir directo en iOS sin Content-Type correcto -> code 4.
        const blobUrl = blobUrlMap.current.get(urlOriginal);
        if (!blobUrl) {
            void precargarPista(pista);
            setErrorReproduccion({
                name: 'Cargando',
                message: 'Esta pista todavia se esta descargando. Intenta de nuevo en un segundo.',
            });
            return;
        }

        // Descartar audio anterior si tenia otra URL.
        const prev = audioRef.current;
        if (prev && prev.src !== blobUrl) {
            try { prev.pause(); } catch { /* noop */ }
            try { prev.src = ''; } catch { /* noop */ }
            audioRef.current = null;
        }

        // Crear nuevo audio con la blob URL en el constructor. iOS exige el
        // ciclo de carga correcto (URL en constructor, no asignacion post).
        let audio = audioRef.current;
        if (!audio) {
            audio = new Audio(blobUrl);
            audio.preload = 'auto';
            // Sin crossOrigin: el blob es local, no hay cross-origin.
            audio.loop = true;
            audio.playsInline = true;
            audioRef.current = audio;
        }
        audio.volume = volumen;
        audio.playbackRate = velocidad;

        const onErrorAudio = () => {
            const err = audio!.error;
            const codigo = err ? `code ${err.code}` : 'desconocido';
            const msg = err?.message || `MediaError ${codigo}`;
            console.error('[Loops] audio.error:', codigo, msg);
            setErrorReproduccion({ name: `MediaError ${codigo}`, message: msg });
            setPistaActiva(null);
        };
        audio.addEventListener('error', onErrorAudio, { once: true });

        // play() SINCRONO dentro del gesto. La blob URL ya esta cargada en
        // memoria local, asi que el play resuelve practicamente instantaneo.
        const playPromise = audio.play();

        setPistaActiva({
            id: pista.id,
            nombre: pista.nombre,
            url: urlOriginal,
            artista: pista.artista || null,
            bpm: pista.bpm || null,
        });

        playPromise?.catch((e: any) => {
            const name = e?.name || 'Error';
            const message = e?.message || String(e) || 'No se pudo reproducir.';
            console.error('[Loops] audio.play() rechazado:', name, message, e);
            setErrorReproduccion({ name, message });
            setPistaActiva(null);
        });
    }, [pistaActiva, volumen, velocidad, detener, precargarPista]);

    // Cleanup: liberar todos los object URLs al desmontar.
    useEffect(() => {
        return () => {
            const audio = audioRef.current;
            if (audio) {
                try { audio.pause(); } catch { /* noop */ }
                audio.src = '';
                audioRef.current = null;
            }
            blobUrlMap.current.forEach(blobUrl => {
                try { URL.revokeObjectURL(blobUrl); } catch { /* noop */ }
            });
            blobUrlMap.current.clear();
        };
    }, []);

    /**
     * Devuelve la posicion actual del loop en segundos (audio.currentTime).
     * Usado por el grabador para anclar la pista al momento exacto en que
     * se inicio la grabacion → replay seekea a este offset y suena en sync.
     */
    const obtenerPosicion = useCallback(() => {
        const a = audioRef.current;
        if (!a || !isFinite(a.currentTime)) return 0;
        return a.currentTime;
    }, []);

    return {
        pistaActiva,
        volumen,
        velocidad,
        errorReproduccion,
        pistasListas,
        setVolumen,
        setVelocidad,
        reproducir,
        detener,
        obtenerPosicion,
        precargarPistas,
    };
}
