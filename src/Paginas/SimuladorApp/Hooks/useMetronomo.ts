import { useState, useEffect, useRef, useCallback } from 'react';
import { motorAudioPro } from '../../../Core/audio/AudioEnginePro';
import { pulsoMetronomoStore } from '../store/pulsoMetronomoStore';

type SonidoEfecto = 'Electrónico' | 'Madera' | 'Aplausos' | 'Campana 1' | 'Campana 2' | 'Tono' | 'Silencioso' | 'Baqueta';

export const useMetronomo = (bpmInicial: number) => {
    const [activo, setActivo] = useState(false);
    const [bpm, setBpm] = useState(bpmInicial);
    const [compas, setCompas] = useState(4);
    const [subdivision, setSubdivision] = useState(1);
    const [volumen, setVolumen] = useState(0.5);
    const [pan, setPan] = useState(0); // -1..1 balance L/R stereo
    const [sonidoEfecto, setSonidoEfecto] = useState<SonidoEfecto>('Baqueta');
    // `pulsoActual` vive en un store externo (pulsoMetronomoStore): el scheduler
    // escribia 1-4 Hz via setState y re-renderizaba SimuladorApp.tsx entero.
    // Ahora se escribe al store y solo PanelMetronomoInline (que lo lee via
    // usePulsoMetronomo) se re-renderiza, y solo cuando el modal está abierto.

    const audioCtx = useRef<AudioContext | null>(null);
    const nextNoteTime = useRef(0);
    const timerID = useRef<number | null>(null);
    const pulseCount = useRef(0);
    // StereoPannerNode persistente: cada click se conecta aquí (no a destination
    // directo). Permite controlar el balance L/R desde el panel de efectos.
    const panNodeRef = useRef<StereoPannerNode | null>(null);

    const bpmRef = useRef(bpm);
    const lastBpmRef = useRef(bpm);
    const compasRef = useRef(compas);
    const subdivisionRef = useRef(subdivision);
    const volumenRef = useRef(volumen);
    const sonidoRef = useRef(sonidoEfecto);

    // Sincronizar refs
    useEffect(() => {
        if (activo && audioCtx.current && bpm !== lastBpmRef.current) {
            const ahora = audioCtx.current.currentTime;
            const oldBeatDur = (60.0 / lastBpmRef.current) / subdivisionRef.current;
            const newBeatDur = (60.0 / bpm) / subdivisionRef.current;
            const tiempoRestante = nextNoteTime.current - ahora;
            const porcentajeRestante = Math.max(0, Math.min(1, tiempoRestante / oldBeatDur));
            nextNoteTime.current = ahora + (porcentajeRestante * newBeatDur);
        }
        bpmRef.current = bpm;
        lastBpmRef.current = bpm;
        compasRef.current = compas;
        subdivisionRef.current = subdivision;
        volumenRef.current = volumen;
        sonidoRef.current = sonidoEfecto;
    }, [bpm, compas, subdivision, volumen, sonidoEfecto, activo]);

    const playClick = useCallback((time: number, isFirstBeat: boolean, isSubdivision: boolean) => {
        if (!audioCtx.current || sonidoRef.current === 'Silencioso') return;
        const osc = audioCtx.current.createOscillator();
        const envelope = audioCtx.current.createGain();
        let freq = isFirstBeat ? 1000 : 500;
        let type: OscillatorType = 'sine';
        let decay = 0.04;

        switch (sonidoRef.current) {
            case 'Electrónico': freq = isFirstBeat ? 1200 : 600; type = 'square'; break;
            case 'Madera': freq = isFirstBeat ? 800 : 400; type = 'triangle'; break;
            case 'Baqueta': freq = isFirstBeat ? 1500 : 1000; type = 'sine'; break;
            case 'Tono': freq = isFirstBeat ? 440 : 330; decay = 0.2; break;
            case 'Campana 1': freq = isFirstBeat ? 2000 : 1500; decay = 0.3; break;
            case 'Campana 2': freq = isFirstBeat ? 2600 : 2000; decay = 0.3; break;
            case 'Aplausos':  freq = isFirstBeat ? 800  :  600; type = 'sawtooth'; decay = 0.06; break;
        }

        if (isSubdivision) { freq *= 0.8; decay *= 0.5; }
        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);
        envelope.gain.setValueAtTime(volumenRef.current, time);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + decay);
        osc.connect(envelope);
        // Routing con pan: envelope → panNode → destination. El panNode se
        // crea perezosamente en iniciar() y persiste mientras vive el hook.
        if (panNodeRef.current) {
            envelope.connect(panNodeRef.current);
        } else {
            envelope.connect(audioCtx.current.destination);
        }
        osc.start(time);
        osc.stop(time + decay);
    }, []);

    const scheduler = useCallback(() => {
        while (nextNoteTime.current < audioCtx.current!.currentTime + 0.1) {
            const secondsPerBeat = 60.0 / bpmRef.current;
            const secondsPerClick = secondsPerBeat / subdivisionRef.current;
            const isFirstBeat = (pulseCount.current % (compasRef.current * subdivisionRef.current)) === 0;
            const isSubdivision = (pulseCount.current % subdivisionRef.current) !== 0;
            
            playClick(nextNoteTime.current, isFirstBeat, isSubdivision);

            if (!isSubdivision) {
                const beatInBar = Math.floor(pulseCount.current / subdivisionRef.current) % compasRef.current;
                const delay = (nextNoteTime.current - audioCtx.current!.currentTime) * 1000;
                setTimeout(() => pulsoMetronomoStore.set(beatInBar), Math.max(0, delay));
            }

            nextNoteTime.current += secondsPerClick;
            pulseCount.current++;
        }
    }, [playClick]);

    const iniciar = async () => {
        if (!audioCtx.current) audioCtx.current = motorAudioPro.contextoAudio;
        const ctx = audioCtx.current!;
        if (ctx.state === 'suspended') {
            try { await ctx.resume(); } catch { /* user gesture requerido */ }
        }
        // Crear el panNode una sola vez (persiste entre clicks). Lo conectamos
        // al destination una vez y todos los envelopes futuros pasan por aquí.
        if (!panNodeRef.current) {
            panNodeRef.current = ctx.createStereoPanner();
            panNodeRef.current.pan.value = pan;
            panNodeRef.current.connect(ctx.destination);
        }
        nextNoteTime.current = ctx.currentTime;
        pulseCount.current = 0;
        pulsoMetronomoStore.set(0);
        timerID.current = window.setInterval(scheduler, 25);
        setActivo(true);
    };

    const detener = () => {
        if (timerID.current) { clearInterval(timerID.current); timerID.current = null; }
        setActivo(false);
        pulsoMetronomoStore.set(-1);
    };

    // Pan en vivo via StereoPannerNode (rampa 30ms para evitar zipper noise).
    useEffect(() => {
        const node = panNodeRef.current;
        if (!node || !audioCtx.current) return;
        const valor = Math.max(-1, Math.min(1, pan));
        node.pan.setTargetAtTime(valor, audioCtx.current.currentTime, 0.03);
    }, [pan]);

    return {
        activo, bpm, setBpm, compas, setCompas, subdivision, setSubdivision,
        volumen, setVolumen, pan, setPan, sonidoEfecto, setSonidoEfecto,
        iniciar, detener
    };
};
