import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import BarraHerramientas from './Componentes/BarraHerramientas';
import './SimuladorApp.css';

const SimuladorApp: React.FC = () => {
    const logica = useLogicaAcordeon();
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const pointersMap = useRef<Map<number, string | null>>(new Map());
    const marcoRef = useRef<HTMLDivElement>(null);
    const [escala, setEscala] = useState(1.0); // 🎯 Escala base

    // 🎨 Estados de Diseño (Nuevos)
    const [distanciaH, setDistanciaH] = useState(2.5); // Distancia Horizontal Pitos (vh)
    const [distanciaV, setDistanciaV] = useState(0.8); // Distancia Vertical Pitos (vh)
    const [distanciaHBajos, setDistanciaHBajos] = useState(2.5); // Distancia H Bajos
    const [distanciaVBajos, setDistanciaVBajos] = useState(0.8); // Distancia V Bajos
    const [alejarIOS, setAlejarIOS] = useState(false); // Toggle iOS bar

    // 👁️ Estados de Vista (Nuevo)
    const [modoVista, setModoVista] = useState<'notas' | 'cifrado' | 'numeros' | 'teclas'>('notas');
    const [mostrarOctavas, setMostrarOctavas] = useState(false);
    const [tamanoFuente, setTamanoFuente] = useState(2.8); // vh
    const [vistaDoble, setVistaDoble] = useState(false);

    // Motion value para el desplazamiento X
    const x = useMotionValue(0);

    // Aplicar escala y distancias a nivel raiz para que el CSS las use
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--escala-acordeon', escala.toString());
        root.style.setProperty('--distancia-h-pitos', `${distanciaH}vh`);
        root.style.setProperty('--distancia-v-pitos', `${distanciaV}vh`);
        root.style.setProperty('--distancia-h-bajos', `${distanciaHBajos}vh`);
        root.style.setProperty('--distancia-v-bajos', `${distanciaVBajos}vh`);
        root.style.setProperty('--offset-ios', alejarIOS ? '10px' : '0px');
        root.style.setProperty('--tamano-fuente-pitos', `${tamanoFuente}vh`);
    }, [escala, distanciaH, distanciaV, distanciaHBajos, distanciaVBajos, alejarIOS, tamanoFuente]);

    // Detección de orientación
    useEffect(() => {
        const handleResize = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 🎼 FORMATEO DE NOTAS (Notas / Cifrado / Octavas)
    const CIFRADO_AMERICANO: Record<string, string> = {
        'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
        'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
    };

    const formatearEtiquetaNota = (notaRaw: any) => {
        if (!notaRaw) return '';
        let nombreVal = notaRaw.nombre || '';

        // Limpiar nombres de bajos (ej: "Do Mayor" -> "Do")
        const soloNota = nombreVal.split(' ')[0];
        const baseNorm = soloNota.charAt(0).toUpperCase() + soloNota.slice(1).toLowerCase();

        let base = baseNorm;
        if (modoVista === 'cifrado') {
            base = CIFRADO_AMERICANO[baseNorm] || baseNorm;
        }

        if (mostrarOctavas) {
            let freq = 0;
            if (Array.isArray(notaRaw.frecuencia)) {
                freq = notaRaw.frecuencia[0]; // Usar la fundamental para bajos
            } else {
                freq = notaRaw.frecuencia;
            }

            if (freq > 0) {
                // Cálculo de octava científica: n = 12 * log2(f / 440) + 69
                const n = 12 * (Math.log(freq / 440) / Math.log(2)) + 69;
                const octava = Math.floor((n + 0.5) / 12) - 1;
                return `${base}${octava}`;
            }
        }
        return base;
    };

    // 🎯 ACTUALIZACIÓN VISUAL ULTRA-RÁPIDA (Bypass React)
    const actualizarVisualBoton = (notaId: string, activo: boolean) => {
        const pitoElement = document.querySelector(`[data-nota-id="${notaId}"]`);
        if (pitoElement) {
            if (activo) pitoElement.classList.add('nota-activa');
            else pitoElement.classList.remove('nota-activa');
        }
    };

    // 🖐️ MOTOR DE GLISSANDO MEJORADO (Multi-touch)
    const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const element = document.elementFromPoint(e.clientX, e.clientY);
        const pitoBoton = element?.closest('.pito-boton') as HTMLElement | null;

        const currentNotaId = pitoBoton?.dataset.notaId || null;
        const previousNotaId = pointersMap.current.get(pointerId);

        if (currentNotaId !== previousNotaId) {
            if (previousNotaId) {
                logica.actualizarBotonActivo(previousNotaId, 'remove', null, true);
                actualizarVisualBoton(previousNotaId, false);
            }
            if (currentNotaId) {
                logica.actualizarBotonActivo(currentNotaId, 'add', null, true);
                actualizarVisualBoton(currentNotaId, true);
                pointersMap.current.set(pointerId, currentNotaId);
            } else {
                pointersMap.current.delete(pointerId);
            }
        }
    }, [logica]);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const lastNotaId = pointersMap.current.get(pointerId);
        if (lastNotaId) {
            logica.actualizarBotonActivo(lastNotaId, 'remove', null, true);
            actualizarVisualBoton(lastNotaId, false);
        }
        pointersMap.current.delete(pointerId);
    }, [logica]);

    useEffect(() => {
        window.addEventListener('pointermove', handleGlobalPointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('pointercancel', handlePointerUp);
        return () => {
            window.removeEventListener('pointermove', handleGlobalPointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
            window.removeEventListener('pointercancel', handlePointerUp);
        };
    }, [handleGlobalPointerMove, handlePointerUp]);


    // Filtrar hileras por dirección actual
    const pitosAfuera = logica.configTonalidad?.primeraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosMedio = logica.configTonalidad?.segundaFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosAdentro = logica.configTonalidad?.terceraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];

    const trenRef = useRef<HTMLDivElement>(null);

    // 🚂 TREN DE BOTONES (Contenedor Móvil con Framer Motion)
    // 🔊 SALVAGUARDA DE SONIDO: Forzar Acordeón si suena otra cosa al inicio
    useEffect(() => {
        const timer = setTimeout(() => {
            if (logica.instrumentoId !== '4e9f2a94-21c0-4029-872e-7cb1c314af69') {
                console.log("🎻 Detectado instrumento no-acordeón, forzando acordeón vallenato...");
                logica.setInstrumentoId('4e9f2a94-21c0-4029-872e-7cb1c314af69');
            }
        }, 1200); // Dar tiempo a que cargue el perfil antes de forzar
        return () => clearTimeout(timer);
    }, [logica.instrumentoId]);

    return (
        <div className={`simulador-app-root capa-blindaje-total modo-${logica.direccion}`}>

            {/* 🌬️ 1. INDICADOR DE FUELLE */}
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onClick={() => logica.setDireccion(logica.direccion === 'halar' ? 'empujar' : 'halar')}
            >
                <span className="fuelle-status">
                    {logica.direccion === 'empujar' ? 'EMPUJAR (CERRANDO)' : 'HALAR (ABRIENDO)'}
                </span>
            </div>

            {/* 🪗 3. CONTENEDOR DEL ACORDEÓN (Pegado abajo) */}
            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    {/* Barra de Herramientas con control remoto */}
                    <BarraHerramientas
                        logica={logica}
                        x={x}
                        marcoRef={marcoRef}
                        escala={escala}
                        setEscala={setEscala}
                        distanciaH={distanciaH}
                        setDistanciaH={setDistanciaH}
                        distanciaV={distanciaV}
                        setDistanciaV={setDistanciaV}
                        distanciaHBajos={distanciaHBajos}
                        setDistanciaHBajos={setDistanciaHBajos}
                        distanciaVBajos={distanciaVBajos}
                        setDistanciaVBajos={setDistanciaVBajos}
                        alejarIOS={alejarIOS}
                        setAlejarIOS={setAlejarIOS}

                        // Props de Vista
                        modoVista={modoVista}
                        setModoVista={setModoVista}
                        mostrarOctavas={mostrarOctavas}
                        setMostrarOctavas={setMostrarOctavas}
                        tamanoFuente={tamanoFuente}
                        setTamanoFuente={setTamanoFuente}
                        vistaDoble={vistaDoble}
                        setVistaDoble={setVistaDoble}
                    />

                    {/* Marco del Diapasón (La ventana fija) */}
                    <div className="diapason-marco" ref={marcoRef}>
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            drag="x"
                            style={{ x }}
                            dragConstraints={marcoRef}
                            dragElastic={0.05}
                        >
                            {/* HILERA 3 - ADENTRO (ARRIBA) */}
                            <div className="hilera-pitos hilera-adentro">
                                {pitosAdentro.map((nota: any) => {
                                    const idHalar = nota.id.replace(logica.direccion, 'halar');
                                    const idEmpujar = nota.id.replace(logica.direccion, 'empujar');
                                    const notaHalar = logica.configTonalidad.terceraFila.find((n: any) => n.id === idHalar);
                                    const notaEmpujar = logica.configTonalidad.terceraFila.find((n: any) => n.id === idEmpujar);

                                    return (
                                        <div
                                            key={nota.id}
                                            className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`}
                                            data-nota-id={nota.id}
                                            onPointerDown={() => {
                                                logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                                actualizarVisualBoton(nota.id, true);
                                            }}
                                        >
                                            {!vistaDoble ? (
                                                <span className="nota-etiqueta">{formatearEtiquetaNota(nota)}</span>
                                            ) : (
                                                <div className="contenedor-nota-doble">
                                                    <span className="nota-halar">{formatearEtiquetaNota(notaHalar)}</span>
                                                    <span className="nota-empujar">{formatearEtiquetaNota(notaEmpujar)}</span>
                                                </div>
                                            )}
                                            {nota.tecla && !vistaDoble && <span className="tecla-computador">{nota.tecla}</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* HILERA 2 - MEDIO */}
                            <div className="hilera-pitos hilera-medio">
                                {pitosMedio.map((nota: any) => {
                                    const idHalar = nota.id.replace(logica.direccion, 'halar');
                                    const idEmpujar = nota.id.replace(logica.direccion, 'empujar');
                                    const notaHalar = logica.configTonalidad.segundaFila.find((n: any) => n.id === idHalar);
                                    const notaEmpujar = logica.configTonalidad.segundaFila.find((n: any) => n.id === idEmpujar);

                                    return (
                                        <div
                                            key={nota.id}
                                            className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`}
                                            data-nota-id={nota.id}
                                            onPointerDown={() => {
                                                logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                                actualizarVisualBoton(nota.id, true);
                                            }}
                                        >
                                            {!vistaDoble ? (
                                                <span className="nota-etiqueta">{formatearEtiquetaNota(nota)}</span>
                                            ) : (
                                                <div className="contenedor-nota-doble">
                                                    <span className="nota-halar">{formatearEtiquetaNota(notaHalar)}</span>
                                                    <span className="nota-empujar">{formatearEtiquetaNota(notaEmpujar)}</span>
                                                </div>
                                            )}
                                            {nota.tecla && !vistaDoble && <span className="tecla-computador">{nota.tecla}</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* HILERA 1 - AFUERA (ABAJO) */}
                            <div className="hilera-pitos hilera-afuera">
                                {pitosAfuera.map((nota: any) => {
                                    const idHalar = nota.id.replace(logica.direccion, 'halar');
                                    const idEmpujar = nota.id.replace(logica.direccion, 'empujar');
                                    const notaHalar = logica.configTonalidad.primeraFila.find((n: any) => n.id === idHalar);
                                    const notaEmpujar = logica.configTonalidad.primeraFila.find((n: any) => n.id === idEmpujar);

                                    return (
                                        <div
                                            key={nota.id}
                                            className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`}
                                            data-nota-id={nota.id}
                                            onPointerDown={() => {
                                                logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                                actualizarVisualBoton(nota.id, true);
                                            }}
                                        >
                                            {!vistaDoble ? (
                                                <span className="nota-etiqueta">{formatearEtiquetaNota(nota)}</span>
                                            ) : (
                                                <div className="contenedor-nota-doble">
                                                    <span className="nota-halar">{formatearEtiquetaNota(notaHalar)}</span>
                                                    <span className="nota-empujar">{formatearEtiquetaNota(notaEmpujar)}</span>
                                                </div>
                                            )}
                                            {nota.tecla && !vistaDoble && <span className="tecla-computador">{nota.tecla}</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Overlay de Orientación */}
            {!isLandscape && (
                <div className="overlay-rotacion">
                    <div className="icono-rotar"><RotateCw size={80} /></div>
                    <h2>GIRA TU DISPOSITIVO</h2>
                    <p>Para una experiencia profesional, usa el acordeón en modo horizontal.</p>
                </div>
            )}
        </div>
    );
};

export default SimuladorApp;
