import React, { useState, useRef, useEffect } from 'react';
import './SimuladorApp.css';
import { motorAudioPro } from './AudioEngine';

const NOTA_AL_ARCHIVO: Record<string, string> = {
    'Do': 'C-5-cm.mp3', 'Reb': 'Db-5-cm.mp3', 'Re': 'D-5-cm.mp3', 'Mib': 'Eb-5-cm.mp3', 'Mi': 'E-5-cm.mp3',
    'Fa': 'F-5-cm.mp3', 'Solb': 'Gb-5-cm.mp3', 'Sol': 'G-5-cm.mp3', 'Lab': 'Ab-5-cm.mp3', 'La': 'A-5-cm.mp3',
    'Sib': 'Bb-5-cm.mp3', 'Si': 'B-4-cm.mp3'
};

const FILAS = [
    ['Reb', 'Sol', 'Sib', 'Re', 'Mi', 'Sol', 'Sib', 'Re', 'Mi', 'Sol'],
    ['Solb', 'La', 'Do', 'Mib', 'Sol', 'La', 'Do', 'Mib', 'Sol', 'La', 'Do'],
    ['Si', 'Re', 'Fa', 'Lab', 'Do', 'Re', 'Fa', 'Lab', 'Do', 'Re']
];

const SimuladorApp: React.FC = () => {
    const [audioListo, setAudioListo] = useState(false);
    const [notasActivas, setNotasActivas] = useState<{ [key: string]: boolean }>({});
    const vocesActivas = useRef<{ [key: string]: { fuente: AudioBufferSourceNode, ganancia: GainNode } }>({});

    useEffect(() => {
        // Pre-carga silenciosa
        Object.entries(NOTA_AL_ARCHIVO).forEach(([nota, archivo]) => {
            motorAudioPro.cargarSonidoEnBanco('vpro-mobile', archivo, `/audio/Muestras_Cromaticas/Brillante/${archivo}`);
        });

        const despertar = async () => {
            await motorAudioPro.activarContexto();
            setAudioListo(true);
        };
        window.addEventListener('touchstart', despertar, { once: true });
        window.addEventListener('mousedown', despertar, { once: true });
        return () => {
            window.removeEventListener('touchstart', despertar);
            window.removeEventListener('mousedown', despertar);
        };
    }, []);

    const iniciarNota = (id: string, nota: string) => {
        // Desbloqueo forzado en cada toque por si el móvil se duerme
        if (!audioListo) motorAudioPro.activarContexto().then(() => setAudioListo(true));

        setNotasActivas(prev => ({ ...prev, [id]: true }));
        const archivo = NOTA_AL_ARCHIVO[nota];
        if (!archivo) return;

        detenerNota(id);
        const sonido = motorAudioPro.reproducir(archivo, 'vpro-mobile', 1.0); // Volumen al máximo
        if (sonido) vocesActivas.current[id] = sonido;
    };

    const detenerNota = (id: string) => {
        setNotasActivas(prev => ({ ...prev, [id]: false }));
        const voz = vocesActivas.current[id];
        if (voz) {
            const ahora = motorAudioPro.tiempoActual;
            try {
                voz.ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.05);
                voz.fuente.stop(ahora + 0.1);
            } catch (e) { }
            delete vocesActivas.current[id];
        }
    };

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
                                    style={{ touchAction: 'none' }} // 🛡️ CRITICO: Bloquea scroll en el botón
                                    onPointerDown={(e) => {
                                        // No hacemos preventDefault aquí para permitir que el sistema capture el puntero
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                        iniciarNota(id, nota);
                                    }}
                                    onPointerUp={(e) => {
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                        detenerNota(id);
                                    }}
                                    onPointerCancel={(e) => {
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                        detenerNota(id);
                                    }}
                                    // Soporte para deslizar el dedo (Glissando)
                                    onPointerEnter={(e) => {
                                        if (e.buttons === 1) iniciarNota(id, nota);
                                    }}
                                    onPointerLeave={() => {
                                        detenerNota(id);
                                    }}
                                >
                                    <span className="nota-label">{nota}</span>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SimuladorApp;
