import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * 🎙️ HOOK DE GRABACIÓN DE ALTA FIDELIDAD (Español Latino)
 * Captura audio sin compresión y sin procesos de fondo.
 * Optimizado para evitar cortes por bloqueo del hilo principal.
 */
export const useGrabadoraAudio = (onFinalizar: (blob: Blob) => void) => {
    const [estaGrabando, setEstaGrabando] = useState(false);
    const [segundosRestantes, setSegundosRestantes] = useState(0);
    const [conteoAtras, setConteoAtras] = useState(0);
    const [intensidad, setIntensidad] = useState(0);
    const [historialIntensidad, setHistorialIntensidad] = useState<number[]>([]);
    const [urlPreview, setUrlPreview] = useState<string | null>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const samplesRef = useRef<Float32Array[]>([]);
    const estaGrabandoRef = useRef(false);

    // Limpieza profunda de recursos
    const limpiarAudio = useCallback(() => {
        estaGrabandoRef.current = false;
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.onaudioprocess = null;
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
    }, []);

    // Loop de visualización (Separado del hilo de audio para evitar cortes)
    useEffect(() => {
        let frameId: number;
        const actualizarVisualizacion = () => {
            if (analyserRef.current) {
                const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
                analyserRef.current.getByteTimeDomainData(dataArray);

                let max = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const v = Math.abs(dataArray[i] - 128);
                    if (v > max) max = v;
                }
                const nivel = Math.min(100, (max / 128) * 100);
                setIntensidad(nivel);

                if (estaGrabandoRef.current) {
                    setHistorialIntensidad(prev => [...prev.slice(-100), nivel]);
                }
            }
            frameId = requestAnimationFrame(actualizarVisualizacion);
        };
        frameId = requestAnimationFrame(actualizarVisualizacion);
        return () => cancelAnimationFrame(frameId);
    }, []);

    const iniciarGrabacion = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                }
            });
            streamRef.current = stream;

            // Reset de estados
            if (urlPreview) URL.revokeObjectURL(urlPreview);
            setUrlPreview(null);
            setHistorialIntensidad([]);
            samplesRef.current = [];

            const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
            const context = new AudioCtor({ sampleRate: 44100 });
            audioContextRef.current = context;

            const source = context.createMediaStreamSource(stream);
            const analyser = context.createAnalyser();
            analyser.fftSize = 512;
            source.connect(analyser);
            analyserRef.current = analyser;

            // Usamos un buffer más grande (8192) para dar más margen al CPU y evitar cortes
            const scriptProcessor = context.createScriptProcessor(8192, 1, 1);
            source.connect(scriptProcessor);
            scriptProcessor.connect(context.destination);
            scriptProcessorRef.current = scriptProcessor;

            scriptProcessor.onaudioprocess = (e) => {
                if (estaGrabandoRef.current) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    // IMPORTANTE: Clonamos los datos inmediatamente
                    samplesRef.current.push(new Float32Array(inputData));
                }
            };

            setConteoAtras(3);
            const timerConteo = setInterval(() => {
                setConteoAtras((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerConteo);
                        estaGrabandoRef.current = true;
                        setEstaGrabando(true);
                        setSegundosRestantes(4);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            console.error('Error micrófono:', error);
            alert('❌ No se pudo activar el micrófono. Revisa los permisos.');
        }
    }, [onFinalizar, urlPreview]);

    useEffect(() => {
        let timer: any;
        if (estaGrabando) {
            timer = setInterval(() => {
                setSegundosRestantes((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        detenerYProcesar();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
    }, [estaGrabando]);

    const detenerYProcesar = () => {
        estaGrabandoRef.current = false;
        setEstaGrabando(false);

        if (samplesRef.current.length === 0) {
            limpiarAudio();
            return;
        }

        // Unificar todos los pedazos de audio
        const totalLength = samplesRef.current.reduce((acc, curr) => acc + curr.length, 0);
        const finalBuffer = new Float32Array(totalLength);
        let offset = 0;
        for (const chunk of samplesRef.current) {
            finalBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        const wavBlob = audioBufferToWav(finalBuffer, 44100);
        const url = URL.createObjectURL(wavBlob);
        setUrlPreview(url);
        onFinalizar(wavBlob);
        limpiarAudio();
    };

    function audioBufferToWav(samples: Float32Array, sampleRate: number): Blob {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeString = (s: string, o: number) => {
            for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i));
        };

        writeString('RIFF', 0);
        view.setUint32(4, 36 + samples.length * 2, true);
        writeString('WAVE', 8);
        writeString('fmt ', 12);
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM
        view.setUint16(22, 1, true); // Mono
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString('data', 36);
        view.setUint32(40, samples.length * 2, true);

        let index = 44;
        for (let i = 0; i < samples.length; i++) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(index, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            index += 2;
        }
        return new Blob([buffer], { type: 'audio/wav' });
    }

    const detenerGrabacionManual = () => {
        if (estaGrabando) detenerYProcesar();
    };

    const limpiarPreview = useCallback(() => {
        if (urlPreview) URL.revokeObjectURL(urlPreview);
        setUrlPreview(null);
        setHistorialIntensidad([]);
        samplesRef.current = [];
    }, [urlPreview]);

    useEffect(() => {
        return () => limpiarAudio();
    }, [limpiarAudio]);

    return {
        iniciarGrabacion,
        detenerGrabacionManual,
        limpiarPreview,
        estaGrabando,
        segundosRestantes,
        conteoAtras,
        intensidad,
        historialIntensidad,
        urlPreview
    };
};
