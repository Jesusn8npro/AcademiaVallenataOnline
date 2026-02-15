import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    const [sistemaListo, setSistemaListo] = useState(false);
    const [notasActivas, setNotasActivas] = useState<{ [key: string]: boolean }>({});
    const vocesRef = useRef<{ [key: string]: any }>({});
    const bancoId = 'vpro-ultra';

    // 1. PRECARGA DE AUDIOBUFFERS (No HTML5 Audio)
    useEffect(() => {
        const cargarSamples = async () => {
            const promesas = Object.entries(NOTA_AL_ARCHIVO).map(([nota, archivo]) => {
                return motorAudioPro.cargarSonidoEnBanco(bancoId, archivo, `/audio/Muestras_Cromaticas/Brillante/${archivo}`);
            });
            await Promise.all(promesas);
            console.log("✅ Samples cargados en RAM como AudioBuffers");
        };
        cargarSamples();
    }, []);

    // 2. ACTIVACIÓN DEL CONTEXTO (Maestro)
    const activarSistema = async () => {
        await motorAudioPro.activarContexto();
        setSistemaListo(true);
        console.log("🔊 AudioContext RUNNING");
    };

    const iniciarNota = useCallback((id: string, nota: string) => {
        // Forzar estado running en cada interacción (seguridad para móviles)
        if (motorAudioPro.tiempoActual === 0 || !sistemaListo) {
            motorAudioPro.activarContexto().then(() => setSistemaListo(true));
        }

        setNotasActivas(prev => ({ ...prev, [id]: true }));
        const archivo = NOTA_AL_ARCHIVO[nota];

        // Detener instancia previa para evitar latencia de superposición
        if (vocesRef.current[id]) {
            try { vocesRef.current[id].fuente.stop(); } catch (e) { }
        }

        // Reproducir directamente desde AudioBufferSourceNode
        const sonido = motorAudioPro.reproducir(archivo, bancoId, 1.0);
        if (sonido) vocesRef.current[id] = sonido;
    }, [sistemaListo]);

    const detenerNota = useCallback((id: string) => {
        setNotasActivas(prev => ({ ...prev, [id]: false }));
        const voz = vocesRef.current[id];
        if (voz) {
            const ahora = motorAudioPro.tiempoActual;
            try {
                // Fade out ultra-rápido para evitar "pop"
                voz.ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.03);
                voz.fuente.stop(ahora + 0.04);
            } catch (e) { }
            delete vocesRef.current[id];
        }
    }, []);

    return (
        <div className="simulador-app-container">
            {!sistemaListo && (
                <div className="vpro-initializer" onPointerDown={activarSistema}>
                    <div className="vpro-card">
                        <h1>V-PRO ACORDEÓN</h1>
                        <p>LATENCIA CERO OPTIMIZADA</p>
                        <button className="vpro-start-btn">ACTIVAR MOTOR</button>
                    </div>
                </div>
            )}

            <div className="teclado-pitos">
                {FILAS.map((fila, iFila) => (
                    <div key={iFila} className="fila-pitos">
                        {fila.map((nota, iNota) => {
                            const id = `pito-${iFila}-${iNota}`;
                            return (
                                <div
                                    key={id}
                                    className={`boton-pito ${notasActivas[id] ? 'presionado' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault(); // 🛡️ Bloquea scroll/zoom
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                        iniciarNota(id, nota);
                                    }}
                                    onPointerUp={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                        detenerNota(id);
                                    }}
                                    onPointerCancel={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.releasePointerCapture(e.pointerId);
                                        detenerNota(id);
                                    }}
                                >
                                    <span>{nota}</span>
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
