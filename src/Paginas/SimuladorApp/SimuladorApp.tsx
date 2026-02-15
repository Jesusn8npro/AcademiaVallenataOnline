import React, { useState, useRef, useEffect, useCallback } from 'react';
import './SimuladorApp.css';
import { motorAudioPro } from './AudioEngine';

// Mapeo detallado de notas para el simulador V-PRO (Halar - Tonalidad FBE)
const FILAS_DATA = [
    [
        { id: '1-1', n: 'Reb', o: 4 }, { id: '1-2', n: 'Sol', o: 3 }, { id: '1-3', n: 'Sib', o: 3 },
        { id: '1-4', n: 'Re', o: 4 }, { id: '1-5', n: 'Mi', o: 4 }, { id: '1-6', n: 'Sol', o: 4 },
        { id: '1-7', n: 'Sib', o: 4 }, { id: '1-8', n: 'Re', o: 5 }, { id: '1-9', n: 'Mi', o: 5 },
        { id: '1-10', n: 'Sol', o: 5 }
    ],
    [
        { id: '2-1', n: 'Solb', o: 4 }, { id: '2-2', n: 'La', o: 3 }, { id: '2-3', n: 'Do', o: 4 },
        { id: '2-4', n: 'Mib', o: 4 }, { id: '2-5', n: 'Sol', o: 4 }, { id: '2-6', n: 'La', o: 4 },
        { id: '2-7', n: 'Do', o: 5 }, { id: '2-8', n: 'Mib', o: 5 }, { id: '2-9', n: 'Sol', o: 5 },
        { id: '2-10', n: 'La', o: 5 }, { id: '2-11', n: 'Do', o: 6 }
    ],
    [
        { id: '3-1', n: 'Si', o: 4 }, { id: '3-2', n: 'Re', o: 4 }, { id: '3-3', n: 'Fa', o: 4 },
        { id: '3-4', n: 'Lab', o: 4 }, { id: '3-5', n: 'Do', o: 5 }, { id: '3-6', n: 'Re', o: 5 },
        { id: '3-7', n: 'Fa', o: 5 }, { id: '3-8', n: 'Lab', o: 5 }, { id: '3-9', n: 'Do', o: 6 },
        { id: '3-10', n: 'Re', o: 6 }
    ]
];

const NOTA_A_FILE: Record<string, string> = {
    'Do': 'C', 'Reb': 'Db', 'Re': 'D', 'Mib': 'Eb', 'Mi': 'E', 'Fa': 'F',
    'Solb': 'Gb', 'Sol': 'G', 'Lab': 'Ab', 'La': 'A', 'Sib': 'Bb', 'Si': 'B'
};

const getFileName = (nota: string, octava: number) => {
    const prefijo = NOTA_A_FILE[nota] || nota;
    return `${prefijo}-${octava}-cm.mp3`;
};

import BarraHerramientasVPRO from './Componentes/BarraHerramientasVPRO';
import MenuOpcionesVPRO from './Componentes/MenuOpcionesVPRO';

const SimuladorApp: React.FC = () => {
    const [samplesCargados, setSamplesCargados] = useState(0);
    const [sistemaListo, setSistemaListo] = useState(false);
    const [notasActivas, setNotasActivas] = useState<Record<string, boolean>>({});
    const [menuOpcionesAbierto, setMenuOpcionesAbierto] = useState(false);
    const vocesRef = useRef<Record<string, any>>({});
    const gestosRef = useRef<Record<number, string>>({}); // pointerId -> buttonId
    const bancoId = 'vpro-mobile';

    // 1. CARGA INICIAL (AudioBuffers)
    useEffect(() => {
        const totalNotas: string[] = [];
        FILAS_DATA.forEach(fila => fila.forEach(b => {
            totalNotas.push(getFileName(b.n, b.o));
        }));
        const unicas = Array.from(new Set(totalNotas));

        const cargar = async () => {
            let count = 0;
            const promesas = unicas.map(async (file) => {
                await motorAudioPro.cargarSonidoEnBanco(bancoId, file, `/audio/Muestras_Cromaticas/Brillante/${file}`);
                count++;
                setSamplesCargados(count);
            });
            await Promise.all(promesas);
        };
        cargar();
    }, []);

    const activarAudio = async () => {
        await motorAudioPro.activarContexto();
        setSistemaListo(true);
    };

    const playNote = (id: string, fileName: string) => {
        setNotasActivas(prev => ({ ...prev, [id]: true }));

        // Stop current if exists
        stopNote(id);

        const sonido = motorAudioPro.reproducir(fileName, bancoId, 1.0);
        if (sonido) vocesRef.current[id] = sonido;
    };

    const stopNote = (id: string) => {
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

    // 🚀 LÓGICA DE GLISSANDO MEJORADA
    const handlePointerMove = (e: React.PointerEvent) => {
        if (!sistemaListo) return;

        const el = document.elementFromPoint(e.clientX, e.clientY);
        const btn = el?.closest('.boton-pito') as HTMLElement;
        const nuevoId = btn?.dataset.id;
        const fileName = btn?.dataset.file;

        const idPrevio = gestosRef.current[e.pointerId];

        if (nuevoId !== idPrevio) {
            // Apagar anterior
            if (idPrevio) stopNote(idPrevio);

            // Encender nuevo
            if (nuevoId && fileName) {
                playNote(nuevoId, fileName);
                gestosRef.current[e.pointerId] = nuevoId;
            } else {
                delete gestosRef.current[e.pointerId];
            }
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!sistemaListo) {
            activarAudio();
            return;
        }
        e.preventDefault();
        // Forzamos captura en el contenedor para que Move funcione fuera del botón inicial
        e.currentTarget.setPointerCapture(e.pointerId);

        const btn = (e.target as HTMLElement).closest('.boton-pito') as HTMLElement;
        const id = btn?.dataset.id;
        const fileName = btn?.dataset.file;

        if (id && fileName) {
            playNote(id, fileName);
            gestosRef.current[e.pointerId] = id;
        }
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        e.currentTarget.releasePointerCapture(e.pointerId);
        const id = gestosRef.current[e.pointerId];
        if (id) {
            stopNote(id);
            delete gestosRef.current[e.pointerId];
        }
    };

    const totalSamples = 34; // Número aproximado de archivos únicos en el sistema real

    return (
        <div
            className="simulador-app-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            {!sistemaListo && (
                <div className="vpro-initializer">
                    <div className="vpro-card" onClick={activarAudio}>
                        <h1>V-PRO ACORDEÓN</h1>
                        <p>Cargando sonidos: {samplesCargados} / 34</p>
                        <button className="vpro-start-btn">EMPEZAR</button>
                    </div>
                </div>
            )}

            <BarraHerramientasVPRO
                alAlternarMenu={() => setMenuOpcionesAbierto(!menuOpcionesAbierto)}
                menuAbierto={menuOpcionesAbierto}
            />

            <div className={`teclado-pitos ${sistemaListo ? 'activo' : 'bloqueado'}`}>
                {FILAS_DATA.map((fila, iFila) => (
                    <div key={iFila} className={`fila-pitos fila-${iFila + 1}`}>
                        {fila.map((b) => {
                            const fileName = getFileName(b.n, b.o);
                            return (
                                <div
                                    key={b.id}
                                    data-id={b.id}
                                    data-file={fileName}
                                    className={`boton-pito ${notasActivas[b.id] ? 'presionado' : ''}`}
                                >
                                    <span>{b.n}</span>
                                    <small>{b.o}</small>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
            <MenuOpcionesVPRO
                estaAbierto={menuOpcionesAbierto}
                alCerrar={() => setMenuOpcionesAbierto(false)}
            />
        </div>
    );
};

export default SimuladorApp;
