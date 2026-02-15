import React, { useState, useRef, useEffect } from 'react';
import './SimuladorApp.css';
import { motorAudioPro } from './AudioEngine';

const NOTA_AL_ARCHIVO: Record<string, string> = {
    'Do': 'C-5-cm.mp3', 'Reb': 'Db-5-cm.mp3', 'Re': 'D-5-cm.mp3', 'Mib': 'Eb-5-cm.mp3', 'Mi': 'E-5-cm.mp3',
    'Fa': 'F-5-cm.mp3', 'Solb': 'Gb-5-cm.mp3', 'Sol': 'G-5-cm.mp3', 'Lab': 'Ab-5-cm.mp3', 'La': 'A-5-cm.mp3',
    'Sib': 'Bb-5-cm.mp3', 'Si': 'B-4-cm.mp3'
};

// Configuración de pitos (3 filas reales de un acordeón 5 letras)
const FILAS = [
    ['Reb', 'Sol', 'Sib', 'Re', 'Mi', 'Sol', 'Sib', 'Re', 'Mi', 'Sol'],
    ['Solb', 'La', 'Do', 'Mib', 'Sol', 'La', 'Do', 'Mib', 'Sol', 'La', 'Do'],
    ['Si', 'Re', 'Fa', 'Lab', 'Do', 'Re', 'Fa', 'Lab', 'Do', 'Re']
];

const SimuladorApp: React.FC = () => {
    const [audioListo, setAudioListo] = useState(false);
    const [notasActivas, setNotasActivas] = useState<{ [key: string]: boolean }>({});
    const vocesActivas = useRef<{ [key: string]: { fuente: AudioBufferSourceNode, ganancia: GainNode } }>({});

    // Cargar sonidos inmediatamente en segundo plano
    const inicializarAudio = async () => {
        if (audioListo) return;
        await motorAudioPro.activarContexto();

        Object.entries(NOTA_AL_ARCHIVO).forEach(([nota, archivo]) => {
            motorAudioPro.cargarSonidoEnBanco('vpro-mobile', archivo, `/audio/Muestras_Cromaticas/Brillante/${archivo}`);
        });
        setAudioListo(true);
    };

    const iniciarNota = (id: string, nota: string) => {
        if (!audioListo) inicializarAudio();

        setNotasActivas(prev => ({ ...prev, [id]: true }));
        const archivo = NOTA_AL_ARCHIVO[nota];
        if (!archivo) return;

        detenerNota(id);
        const sonido = motorAudioPro.reproducir(archivo, 'vpro-mobile', 0.8);
        if (sonido) vocesActivas.current[id] = sonido;
    };

    const detenerNota = (id: string) => {
        setNotasActivas(prev => ({ ...prev, [id]: false }));
        const voz = vocesActivas.current[id];
        if (voz) {
            const ahora = motorAudioPro.tiempoActual;
            try {
                voz.ganancia.gain.cancelScheduledValues(ahora);
                voz.ganancia.gain.setValueAtTime(voz.ganancia.gain.value, ahora);
                voz.ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.05);
                voz.fuente.stop(ahora + 0.06);
            } catch (e) { }
            delete vocesActivas.current[id];
        }
    };

    // Bloquear scroll y zoom a nivel de JS como refuerzo
    useEffect(() => {
        const handleTouch = (e: TouchEvent) => {
            if (e.touches.length > 1) e.preventDefault();
        };
        // Opciones de evento pasivos: false es crucial para poder usar preventDefault
        document.addEventListener('touchstart', handleTouch, { passive: false });
        return () => {
            document.removeEventListener('touchstart', handleTouch);
        };
    }, []);

    return (
        <div className="simulador-app-container">
            <div className="teclado-pitos">
                {FILAS.map((fila, iFila) => (
                    <div key={iFila} className={`fila-pitos fila-${iFila + 1}`}>
                        {fila.map((nota, iNota) => {
                            const id = `pito-${iFila}-${iNota}`;
                            return (
                                <div
                                    key={id}
                                    className={`boton-pito ${notasActivas[id] ? 'presionado' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault(); // 🛡️ CRITICO PARA MÓVIL
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                        iniciarNota(id, nota);
                                    }}
                                    onPointerUp={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                        detenerNota(id);
                                    }}
                                    onPointerCancel={(e) => {
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                        detenerNota(id);
                                    }}
                                    onPointerLeave={() => detenerNota(id)}
                                >
                                    <span className="nota-label">{nota}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>

            <style>{`
                .overlay-inicio {
                    position: fixed; inset: 0; background: rgba(0,0,0,0.9);
                    display: flex; align-items: center; justify-content: center; z-index: 100;
                }
                .card-inicio {
                    text-align: center; color: white; background: #111; padding: 40px;
                    border: 1px solid #333; border-radius: 20px; box-shadow: 0 0 50px rgba(249,115,22,0.2);
                }
                .btn-activar {
                    background: #f97316; border: none; padding: 15px 30px; border-radius: 10px;
                    color: white; font-weight: bold; margin-top: 20px; cursor: pointer;
                }
                .teclado-pitos { display: flex; flex-direction: column; gap: 15px; }
                .fila-pitos { display: flex; gap: 10px; justify-content: center; }
                .nota-label { pointer-events: none; }
                /* Escalar para que quepa en horizontal */
                @media (orientation: portrait) {
                    .simulador-app-container::after {
                        content: 'GIRA TU MÓVIL (HORIZONTAL)';
                        position: fixed; inset: 0; background: #000; color: #f97316;
                        display: flex; align-items: center; justify-content: center;
                        font-weight: bold; z-index: 1000;
                    }
                }
            `}</style>
        </div>
    );
};

export default SimuladorApp;
