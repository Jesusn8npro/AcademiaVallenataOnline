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
    const [samplesCargados, setSamplesCargados] = useState(0);
    const [estadoAudio, setEstadoAudio] = useState('suspended');
    const [notasActivas, setNotasActivas] = useState<{ [key: string]: boolean }>({});
    const vocesRef = useRef<{ [key: string]: any }>({});
    const bancoId = 'vpro-ultra';

    // 1. PRECARGA DE AUDIOBUFFERS
    useEffect(() => {
        const cargarSamples = async () => {
            let contador = 0;
            const promesas = Object.entries(NOTA_AL_ARCHIVO).map(async ([nota, archivo]) => {
                try {
                    await motorAudioPro.cargarSonidoEnBanco(bancoId, archivo, `/audio/Muestras_Cromaticas/Brillante/${archivo}`);
                    contador++;
                    setSamplesCargados(contador);
                } catch (err) {
                    console.error(`Error cargando ${archivo}:`, err);
                }
            });
            await Promise.all(promesas);
        };
        cargarSamples();

        // Monitorear el estado del audio
        const interval = setInterval(() => {
            setEstadoAudio((motorAudioPro as any).contexto.state);
        }, 500);
        return () => clearInterval(interval);
    }, []);

    // 2. ACTIVACIÓN DEL CONTEXTO (Botón Maestro con Click)
    const activarSistema = async () => {
        console.log("Iniciando activación...");
        await motorAudioPro.activarContexto();
        setSistemaListo(true);
        setEstadoAudio((motorAudioPro as any).contexto.state);
    };

    const iniciarNota = useCallback((id: string, nota: string) => {
        // Si el motor no está corriendo, intentar despertarlo
        if (estadoAudio !== 'running') {
            motorAudioPro.activarContexto();
        }

        setNotasActivas(prev => ({ ...prev, [id]: true }));
        const archivo = NOTA_AL_ARCHIVO[nota];

        if (vocesRef.current[id]) {
            try { vocesRef.current[id].fuente.stop(); } catch (e) { }
        }

        const sonido = motorAudioPro.reproducir(archivo, bancoId, 1.0);
        if (sonido) {
            vocesRef.current[id] = sonido;
        } else {
            console.warn(`No se pudo reproducir: ${archivo}. ¿Está cargado?`);
        }
    }, [estadoAudio]);

    const detenerNota = useCallback((id: string) => {
        setNotasActivas(prev => ({ ...prev, [id]: false }));
        const voz = vocesRef.current[id];
        if (voz) {
            const ahora = motorAudioPro.tiempoActual;
            try {
                voz.ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.05);
                voz.fuente.stop(ahora + 0.1);
            } catch (e) { }
            delete vocesRef.current[id];
        }
    }, []);

    return (
        <div className="simulador-app-container">
            {/* Monitor de Estado (Solo visible para debug/pruebas) */}
            <div className="vpro-debug-bar">
                SAMPLES: {samplesCargados}/{Object.keys(NOTA_AL_ARCHIVO).length} | AUDIO: {estadoAudio.toUpperCase()}
            </div>

            {!sistemaListo && (
                <div className="vpro-initializer">
                    <div className="vpro-card">
                        <h1>V-PRO ACORDEÓN</h1>
                        <p>PRE-CARGA: {samplesCargados === Object.keys(NOTA_AL_ARCHIVO).length ? "COMPLETA ✅" : `CARGANDO... (${samplesCargados})`}</p>
                        <button className="vpro-start-btn" onClick={activarSistema}>
                            ACTIVAR MOTOR
                        </button>
                    </div>
                </div>
            )}

            <div className={`teclado-pitos ${sistemaListo ? 'activo' : 'bloqueado'}`}>
                {FILAS.map((fila, iFila) => (
                    <div key={iFila} className="fila-pitos">
                        {fila.map((nota, iNota) => {
                            const id = `pito-${iFila}-${iNota}`;
                            return (
                                <div
                                    key={id}
                                    className={`boton-pito ${notasActivas[id] ? 'presionado' : ''}`}
                                    onPointerDown={(e) => {
                                        e.preventDefault();
                                        e.currentTarget.setPointerCapture(e.pointerId);
                                        iniciarNota(id, nota);
                                    }}
                                    onPointerUp={(e) => {
                                        e.preventDefault();
                                        detenerNota(id);
                                    }}
                                    onPointerCancel={(e) => {
                                        e.preventDefault();
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
