import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Volume2, Music, Play, Square, Settings2, Sliders } from 'lucide-react';
import './ModalMetronomo.css';

interface ModalMetronomoProps {
    visible: boolean;
    onCerrar: () => void;
    botonRef: React.RefObject<HTMLDivElement>;
    bpm: number;
    setBpm: React.Dispatch<React.SetStateAction<number>>;
}

type SonidoEfecto = 'Electrónico' | 'Madera' | 'Aplausos' | 'Campana 1' | 'Campana 2' | 'Tono' | 'Silencioso' | 'Baqueta';

const ModalMetronomo: React.FC<ModalMetronomoProps> = ({ visible, onCerrar, botonRef, bpm, setBpm }) => {
    // --- ESTADOS ---
    const [activo, setActivo] = useState(false);
    // bpm viene de props
    const [compas, setCompas] = useState(4);
    const [subdivision, setSubdivision] = useState(1);
    const [volumen, setVolumen] = useState(0.5);
    const [sonidoEfecto, setSonidoEfecto] = useState<SonidoEfecto>('Baqueta');
    const [mostrarSelectorSonido, setMostrarSelectorSonido] = useState(false);

    // Estado para el indicador visual (pulso actual)
    const [pulsoActual, setPulsoActual] = useState(0);

    // --- REFS PARA EL MOTOR DE AUDIO ---
    const audioCtx = useRef<AudioContext | null>(null);
    const nextNoteTime = useRef(0);
    const timerID = useRef<number | null>(null);
    const pulseCount = useRef(0); // Cuenta los clics (incluyendo subdivisiones)

    const bpmRef = useRef(bpm);
    const compasRef = useRef(compas);
    const subdivisionRef = useRef(subdivision);
    const volumenRef = useRef(volumen);
    const sonidoRef = useRef(sonidoEfecto);

    // Sincronizar refs
    useEffect(() => {
        bpmRef.current = bpm;
        compasRef.current = compas;
        subdivisionRef.current = subdivision;
        volumenRef.current = volumen;
        sonidoRef.current = sonidoEfecto;
    }, [bpm, compas, subdivision, volumen, sonidoEfecto]);

    // --- SÍNTESIS DE SONIDO ---
    const playClick = useCallback((time: number, isFirstBeat: boolean, isSubdivision: boolean) => {
        if (!audioCtx.current || sonidoRef.current === 'Silencioso') return;

        const osc = audioCtx.current.createOscillator();
        const envelope = audioCtx.current.createGain();

        // Configuración básica según el efecto
        let freq = isFirstBeat ? 1000 : 500;
        let type: OscillatorType = 'sine';
        let decay = 0.1;

        switch (sonidoRef.current) {
            case 'Electrónico':
                freq = isFirstBeat ? 1200 : 600;
                type = 'square';
                decay = 0.05;
                break;
            case 'Madera':
                freq = isFirstBeat ? 800 : 400;
                type = 'triangle';
                decay = 0.08;
                break;
            case 'Baqueta':
                freq = isFirstBeat ? 1500 : 1000;
                type = 'sine';
                decay = 0.04;
                break;
            case 'Tono':
                freq = isFirstBeat ? 440 : 330;
                type = 'sine';
                decay = 0.2;
                break;
            case 'Campana 1':
                freq = isFirstBeat ? 2000 : 1500;
                type = 'sine';
                decay = 0.3;
                break;
            default:
                freq = isFirstBeat ? 1000 : 500;
        }

        if (isSubdivision) {
            freq *= 0.8;
            decay *= 0.5;
        }

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        envelope.gain.setValueAtTime(volumenRef.current, time);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + decay);

        osc.connect(envelope);
        envelope.connect(audioCtx.current.destination);

        osc.start(time);
        osc.stop(time + decay);
    }, []);

    // --- MOTOR DE SCHEDULING ---
    const scheduler = useCallback(() => {
        while (nextNoteTime.current < audioCtx.current!.currentTime + 0.1) {
            const secondsPerBeat = 60.0 / bpmRef.current;
            const secondsPerClick = secondsPerBeat / subdivisionRef.current;

            // ¿Es el primer pulso del compás?
            const isFirstBeat = (pulseCount.current % (compasRef.current * subdivisionRef.current)) === 0;
            // ¿Es una subdivisión (no el pulso principal)?
            const isSubdivision = (pulseCount.current % subdivisionRef.current) !== 0;

            // Programar sonido
            playClick(nextNoteTime.current, isFirstBeat, isSubdivision);

            // Actualizar indicador visual (solo en el pulso principal)
            if (!isSubdivision) {
                const beatInBar = Math.floor(pulseCount.current / subdivisionRef.current) % compasRef.current;
                // Usamos un pequeño delay para que la visual coincida con el audio
                const delay = (nextNoteTime.current - audioCtx.current!.currentTime) * 1000;
                setTimeout(() => setPulsoActual(beatInBar), Math.max(0, delay));
            }

            nextNoteTime.current += secondsPerClick;
            pulseCount.current++;
        }
    }, [playClick]);

    const iniciarMetronomo = () => {
        if (!audioCtx.current) {
            audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioCtx.current.state === 'suspended') {
            audioCtx.current.resume();
        }

        nextNoteTime.current = audioCtx.current.currentTime + 0.05;
        pulseCount.current = 0;
        setPulsoActual(0);

        timerID.current = window.setInterval(scheduler, 25);
        setActivo(true);
    };

    const detenerMetronomo = () => {
        if (timerID.current) {
            clearInterval(timerID.current);
            timerID.current = null;
        }
        setActivo(false);
        setPulsoActual(-1); // Resetea visual
    };

    // Cerrar al desmontar
    useEffect(() => {
        return () => {
            if (timerID.current) clearInterval(timerID.current);
        };
    }, []);

    if (!visible) return null;

    return (
        <>
            <div className="modal-metronomo-overlay" onClick={onCerrar} />
            <div className="modal-metronomo-contenedor">

                {/* VISTA PRINCIPAL */}
                {!mostrarSelectorSonido ? (
                    <>
                        <div className="modal-metronomo-cabecera">
                            <h3 className="modal-metronomo-titulo">Metrónomo</h3>
                            <button className="btn-cerrar-metronomo" onClick={onCerrar}>
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-metronomo-cuerpo">
                            {/* BOTÓN INICIAR/DETENER */}
                            <button
                                className={`btn-control-principal ${activo ? 'detener' : 'iniciar'}`}
                                onClick={activo ? detenerMetronomo : iniciarMetronomo}
                            >
                                {activo ? 'DETENER' : 'INICIAR'}
                            </button>

                            {/* INDICADOR VISUAL DE PULSOS */}
                            <div className="indicador-pulsos-row">
                                {Array.from({ length: compas }).map((_, i) => (
                                    <div
                                        key={i}
                                        className={`pulso-circulo ${pulsoActual === i ? 'activo' : ''} ${i === 0 ? 'acento' : ''}`}
                                    />
                                ))}
                            </div>

                            {/* AJUSTE VELOCIDAD (BPM) */}
                            <div className="ajuste-fila">
                                <div className="ajuste-info">
                                    <span className="ajuste-label">Velocidad</span>
                                    <span className="ajuste-sublabel">Tempo en BPM</span>
                                </div>
                                <div className="control-inc-dec">
                                    <button onClick={() => setBpm(b => Math.max(20, b - 1))}><ChevronLeft size={20} /></button>
                                    <span className="valor-display">{bpm}</span>
                                    <button onClick={() => setBpm(b => Math.min(300, b + 1))}><ChevronRight size={20} /></button>
                                </div>
                            </div>

                            {/* AJUSTE COMPÁS (PULSOS POR COMPÁS) */}
                            <div className="ajuste-fila">
                                <div className="ajuste-info">
                                    <span className="ajuste-label">Tempo</span>
                                    <span className="ajuste-sublabel">Pulso por compás</span>
                                </div>
                                <div className="control-inc-dec">
                                    <button onClick={() => setCompas(c => Math.max(1, c - 1))}><ChevronLeft size={20} /></button>
                                    <span className="valor-display">{compas}</span>
                                    <button onClick={() => setCompas(c => Math.min(12, c + 1))}><ChevronRight size={20} /></button>
                                </div>
                            </div>

                            {/* AJUSTE SUBDIVISIÓN */}
                            <div className="ajuste-fila">
                                <div className="ajuste-info">
                                    <span className="ajuste-label">Subdivisión</span>
                                    <span className="ajuste-sublabel">Clics por pulso</span>
                                </div>
                                <div className="control-inc-dec">
                                    <button onClick={() => setSubdivision(s => Math.max(1, s - 1))}><ChevronLeft size={20} /></button>
                                    <span className="valor-display">{subdivision}</span>
                                    <button onClick={() => setSubdivision(s => Math.min(4, s + 1))}><ChevronRight size={20} /></button>
                                </div>
                            </div>

                            {/* SELECCIÓN DE SONIDO */}
                            <div className="ajuste-fila clickable" onClick={() => setMostrarSelectorSonido(true)}>
                                <span className="ajuste-label">Efecto de Sonido</span>
                                <div className="valor-con-flecha">
                                    <span>{sonidoEfecto}</span>
                                    <ChevronRight size={18} />
                                </div>
                            </div>

                            {/* VOLUMEN */}
                            <div className="ajuste-fila vertical">
                                <span className="ajuste-label">Volumen del Metrónomo</span>
                                <div className="volumen-control-container">
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.01"
                                        value={volumen}
                                        onChange={(e) => setVolumen(parseFloat(e.target.value))}
                                        className="slider-premium-met"
                                    />
                                    <Sliders size={18} className="icono-vol" />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* VISTA SELECTOR DE SONIDO */
                    <>
                        <div className="modal-metronomo-cabecera">
                            <button className="btn-atras" onClick={() => setMostrarSelectorSonido(false)}>
                                <ChevronLeft size={20} />
                            </button>
                            <h3 className="modal-metronomo-titulo">Efecto de Sonido</h3>
                            <div style={{ width: 20 }} />
                        </div>
                        <div className="lista-sonidos">
                            {(['Electrónico', 'Madera', 'Aplausos', 'Campana 1', 'Campana 2', 'Tono', 'Silencioso', 'Baqueta'] as SonidoEfecto[]).map(sonido => (
                                <div
                                    key={sonido}
                                    className={`item-sonido ${sonidoEfecto === sonido ? 'activo' : ''}`}
                                    onClick={() => {
                                        setSonidoEfecto(sonido);
                                        setMostrarSelectorSonido(false);
                                    }}
                                >
                                    <div className="nombre-con-icono">
                                        <Music size={16} />
                                        <span>{sonido}</span>
                                    </div>
                                    {sonidoEfecto === sonido && <div className="check-mark">✓</div>}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                <div className="modal-metronomo-footer">
                    <p>Precisión rítmica profesional</p>
                </div>
            </div>
        </>
    );
};

export default ModalMetronomo;
