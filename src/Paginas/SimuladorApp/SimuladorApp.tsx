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
    const [sistemaListo, setSistemaListo] = useState(false);
    const [muestrasCargadas, setMuestrasCargadas] = useState(0);
    const [notasActivas, setNotasActivas] = useState<{ [key: string]: boolean }>({});
    const vocesRef = useRef<{ [key: string]: any }>({});
    const totalNotas = Object.keys(NOTA_AL_ARCHIVO).length;

    // 1. CARGA INMEDIATA AL ENTRAR
    useEffect(() => {
        const cargar = async () => {
            let contador = 0;
            for (const [nota, archivo] of Object.entries(NOTA_AL_ARCHIVO)) {
                try {
                    await motorAudioPro.cargarSonidoEnBanco('vpro', archivo, `/audio/Muestras_Cromaticas/Brillante/${archivo}`);
                    contador++;
                    setMuestrasCargadas(contador);
                } catch (e) {
                    console.error("Fallo nota:", nota);
                }
            }
        };
        cargar();
    }, []);

    const desbloquearYSonar = async () => {
        await motorAudioPro.activarContexto();
        setSistemaListo(true);
        // Pequeño sonido de confirmación (opcional)
        console.log("🔊 SISTEMA V-PRO DESBLOQUEADO");
    };

    const handlePress = (id: string, nota: string) => {
        if (!sistemaListo) return;

        setNotasActivas(prev => ({ ...prev, [id]: true }));
        const archivo = NOTA_AL_ARCHIVO[nota];

        // Parar antes de sonar
        if (vocesRef.current[id]) {
            try {
                vocesRef.current[id].fuente.stop();
            } catch (e) { }
        }

        const sonido = motorAudioPro.reproducir(archivo, 'vpro', 1.0);
        if (sonido) vocesRef.current[id] = sonido;
    };

    const handleRelease = (id: string) => {
        setNotasActivas(prev => ({ ...prev, [id]: false }));
        const voz = vocesRef.current[id];
        if (voz) {
            const ahora = motorAudioPro.tiempoActual;
            voz.ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + 0.05);
            voz.fuente.stop(ahora + 0.06);
            delete vocesRef.current[id];
        }
    };

    return (
        <div className="simulador-app-container">
            {/* OVERLAY DE DESBLOQUEO (OBLIGATORIO PARA MÓVIL) */}
            {!sistemaListo && (
                <div className="overlay-vpro" onTouchStart={desbloquearYSonar} onClick={desbloquearYSonar}>
                    <div className="vpro-loader">
                        <h2>ACADEMIA V-PRO</h2>
                        <p>Cargando: {muestrasCargadas} / {totalNotas}</p>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: `${(muestrasCargadas / totalNotas) * 100}%` }}></div>
                        </div>
                        <button className="btn-vpro">TOCA PARA EMPEZAR</button>
                    </div>
                </div>
            )}

            <div className={`teclado-pitos ${sistemaListo ? 'ready' : ''}`}>
                {FILAS.map((fila, iFila) => (
                    <div key={iFila} className="fila-pitos">
                        {fila.map((nota, iNota) => {
                            const id = `pito-${iFila}-${iNota}`;
                            return (
                                <div
                                    key={id}
                                    className={`boton-pito ${notasActivas[id] ? 'presionado' : ''}`}
                                    onTouchStart={(e) => { e.preventDefault(); handlePress(id, nota); }}
                                    onTouchEnd={(e) => { e.preventDefault(); handleRelease(id); }}
                                    onMouseDown={() => handlePress(id, nota)}
                                    onMouseUp={() => handleRelease(id)}
                                    onMouseLeave={() => handleRelease(id)}
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
