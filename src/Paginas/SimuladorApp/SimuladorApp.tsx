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

    // Referencias para el motor de Glissando
    const vocesRef = useRef<{ [key: string]: any }>({});
    const punterosActivos = useRef<{ [key: number]: string }>({}); // pointerId -> buttonId
    const bancoId = 'vpro-ultra';

    // 1. PRECARGA
    useEffect(() => {
        const cargarSamples = async () => {
            let contador = 0;
            const promesas = Object.entries(NOTA_AL_ARCHIVO).map(async ([nota, archivo]) => {
                try {
                    await motorAudioPro.cargarSonidoEnBanco(bancoId, archivo, `/audio/Muestras_Cromaticas/Brillante/${archivo}`);
                    contador++;
                    setSamplesCargados(contador);
                } catch (err) { }
            });
            await Promise.all(promesas);
        };
        cargarSamples();

        const interval = setInterval(() => {
            setEstadoAudio((motorAudioPro as any).contexto.state);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const activarSistema = async () => {
        await motorAudioPro.activarContexto();
        setSistemaListo(true);
        setEstadoAudio((motorAudioPro as any).contexto.state);
    };

    const iniciarSonido = (id: string, nota: string) => {
        if (estadoAudio !== 'running') motorAudioPro.activarContexto();

        setNotasActivas(prev => ({ ...prev, [id]: true }));
        const archivo = NOTA_AL_ARCHIVO[nota];

        // Detener si ya estaba sonando por otro dedo (limpieza)
        if (vocesRef.current[id]) {
            try { vocesRef.current[id].fuente.stop(); } catch (e) { }
        }

        const sonido = motorAudioPro.reproducir(archivo, bancoId, 1.0);
        if (sonido) vocesRef.current[id] = sonido;
    };

    const detenerSonido = (id: string) => {
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
    };

    // 🎹 MOTOR DE GLISSANDO: Detecta cambios de botón al deslizar
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!sistemaListo) return;

        // Buscamos qué hay bajo las coordenadas del dedo
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const botonElement = element?.closest('.boton-pito') as HTMLElement;
        const nuevoId = botonElement?.dataset.id;
        const nota = botonElement?.dataset.nota;

        const idAnterior = punterosActivos.current[e.pointerId];

        // Si el dedo se movió a un botón diferente
        if (nuevoId !== idAnterior) {
            // Apagar el anterior si existía para este dedo
            if (idAnterior) detenerSonido(idAnterior);

            // Encender el nuevo
            if (nuevoId && nota) {
                iniciarSonido(nuevoId, nota);
                punterosActivos.current[e.pointerId] = nuevoId;
            } else {
                delete punterosActivos.current[e.pointerId];
            }
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!sistemaListo) {
            activarSistema();
            return;
        }
        e.preventDefault();
        const botonElement = (e.target as HTMLElement).closest('.boton-pito') as HTMLElement;
        if (botonElement) {
            const { id, nota } = botonElement.dataset;
            if (id && nota) {
                iniciarSonido(id, nota);
                punterosActivos.current[e.pointerId] = id;
            }
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        const idAnterior = punterosActivos.current[e.pointerId];
        if (idAnterior) {
            detenerSonido(idAnterior);
            delete punterosActivos.current[e.pointerId];
        }
    };

    return (
        <div
            className="simulador-app-container"
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ touchAction: 'none' }}
        >
            <div className="vpro-debug-bar">
                SAMPLES: {samplesCargados}/{Object.keys(NOTA_AL_ARCHIVO).length} | AUDIO: {estadoAudio.toUpperCase()}
            </div>

            {!sistemaListo && (
                <div className="vpro-initializer">
                    <div className="vpro-card" onClick={activarSistema}>
                        <h1>V-PRO ACORDEÓN</h1>
                        <p>MODO GLISSANDO ACTIVADO</p>
                        <button className="vpro-start-btn">EMPEZAR</button>
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
                                    data-id={id}
                                    data-nota={nota}
                                    className={`boton-pito ${notasActivas[id] ? 'presionado' : ''}`}
                                    onPointerDown={handlePointerDown}
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
