import React, { useEffect, useState, useCallback, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { motorAudioPro } from '../SimuladorDeAcordeon/AudioEnginePro';
import BarraHerramientas from './Componentes/BarraHerramientas';
import './SimuladorApp.css';

const SimuladorApp: React.FC = () => {
    const logica = useLogicaAcordeon();
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const pointersMap = useRef<Map<number, { pos: string, musicalId: string } | null>>(new Map());
    const marcoRef = useRef<HTMLDivElement>(null);
    const [escala, setEscala] = useState(1.0); // 🎯 Escala base

    // 🎨 Estados de Diseño (Nuevos)
    const [distanciaH, setDistanciaH] = useState(2.5); // Distancia Horizontal Pitos (vh)
    const [distanciaV, setDistanciaV] = useState(0.8); // Distancia Vertical Pitos (vh)
    const [distanciaHBajos, setDistanciaHBajos] = useState(2.5); // Distancia H Bajos
    const [distanciaVBajos, setDistanciaVBajos] = useState(0.8); // Distancia V Bajos
    const [alejarIOS, setAlejarIOS] = useState(false); // Toggle iOS bar
    const pitoRectsRef = useRef<Map<string, DOMRect>>(new Map()); // 🚀 Caché de posiciones para Hit-Testing

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

    // Detección de orientación y actualización de caché de posiciones
    useEffect(() => {
        const actualizarRects = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
            // Pequeño delay para dejar que el layout se asiente antes de medir
            setTimeout(() => {
                const rects = new Map<string, DOMRect>();
                document.querySelectorAll('.pito-boton').forEach((el) => {
                    const pos = (el as HTMLElement).dataset.pos;
                    if (pos) rects.set(pos, el.getBoundingClientRect());
                });
                pitoRectsRef.current = rects;
            }, 500);
        };
        window.addEventListener('resize', actualizarRects);
        actualizarRects();
        return () => window.removeEventListener('resize', actualizarRects);
    }, [escala, distanciaH, distanciaV]); // Recalcular si cambian las escalas

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
    const actualizarVisualBoton = (pos: string, activo: boolean) => {
        let el = pitoElementsRef.current.get(pos);
        if (!el) {
            el = document.querySelector(`[data-pos="${pos}"]`) as HTMLElement;
            if (el) pitoElementsRef.current.set(pos, el);
        }

        if (el) {
            if (activo) el.classList.add('nota-activa');
            else el.classList.remove('nota-activa');
        }
    };

    // 🖐️ MOTOR DE INTERACCIÓN MAESTRO (Coalesced Events + Audio Bypass)
    const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
        // 🚀 RECUPERAR EVENTOS COALESCIDOS: Captura notas intermedias en movimientos ultra-rápidos
        const eventos = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];

        for (const ev of eventos) {
            const pointerId = ev.pointerId;
            const x = ev.clientX;
            const y = ev.clientY;

            // 🚀 HIT-TESTING MATEMÁTICO ULTRA-VELOZ
            let currentPos: string | null = null;
            for (const [pos, rect] of pitoRectsRef.current.entries()) {
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    currentPos = pos;
                    break;
                }
            }

            const previousData = pointersMap.current.get(pointerId);
            const previousPos = previousData?.pos || null;

            if (currentPos !== previousPos) {
                // ⚡️ BYPASS TOTAL: Disparar audio antes de cualquier otra lógica
                motorAudioPro.activarContexto();

                if (previousData) {
                    logica.actualizarBotonActivo(previousData.musicalId, 'remove', null, true);
                    actualizarVisualBoton(previousPos!, false);
                    registrarEvento('nota_off', { id: previousData.musicalId, pos: previousPos });
                }
                if (currentPos) {
                    const musicalId = `${currentPos}-${logica.direccion}${currentPos.includes('bajo') ? '-bajo' : ''}`;
                    // 🎹 REPRODUCCIÓN DIRECTA
                    logica.actualizarBotonActivo(musicalId, 'add', null, true);
                    actualizarVisualBoton(currentPos, true);
                    pointersMap.current.set(pointerId, { pos: currentPos, musicalId });
                    registrarEvento('nota_on', { id: musicalId, pos: currentPos });
                } else {
                    pointersMap.current.delete(pointerId);
                }
            }
        }
    }, [logica]);

    const handlePointerUp = useCallback((e: PointerEvent) => {
        const pointerId = e.pointerId;
        const data = pointersMap.current.get(pointerId);
        if (data) {
            logica.actualizarBotonActivo(data.musicalId, 'remove', null, true);
            actualizarVisualBoton(data.pos, false);
            registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
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


    // --- 🎙️ MOTOR DE GRABACIÓN DE SECUENCIAS (DEBUG) ---
    const [grabando, setGrabando] = useState(false);
    const secuenciaRef = useRef<any[]>([]); // 🚀 USAMOS REF PARA EVITAR RE-RENDERS
    const tiempoInicioRef = useRef<number>(0);
    const pitoElementsRef = useRef<Map<string, HTMLElement>>(new Map()); // 🚀 CACHÉ DE ELEMENTOS DOM

    const toggleGrabacion = () => {
        if (!grabando) {
            secuenciaRef.current = [];
            tiempoInicioRef.current = Date.now();
            setGrabando(true);
            console.log("🔴 Grabación iniciada...");
        } else {
            setGrabando(false);
            const finalSecuencia = secuenciaRef.current;
            console.log("⏹️ Grabación terminada. Eventos:", finalSecuencia.length);

            if (finalSecuencia.length > 0) {
                const data = JSON.stringify(finalSecuencia);
                const blob = new Blob([data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `secuencia_acordeon_${Date.now()}.json`;
                a.click();
                alert("✅ Secuencia guardada. Por favor, envíame el archivo JSON.");
            }
        }
    };

    const registrarEvento = (tipo: 'nota_on' | 'nota_off' | 'fuelle', data: any) => {
        if (!grabando) return;
        secuenciaRef.current.push({
            t: Date.now() - tiempoInicioRef.current,
            tipo,
            ...data
        });
    };

    // Registrar cambios de fuelle en la secuencia
    useEffect(() => {
        if (grabando) {
            registrarEvento('fuelle', { direccion: logica.direccion });
        }
    }, [logica.direccion, grabando]);

    // Filtrar hileras por dirección actual
    const pitosAfuera = logica.configTonalidad?.primeraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosMedio = logica.configTonalidad?.segundaFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosAdentro = logica.configTonalidad?.terceraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];

    const trenRef = useRef<HTMLDivElement>(null);

    // 🚂 TREN DE BOTONES (Contenedor Móvil con Framer Motion)

    return (
        <div className={`simulador-app-root capa-blindaje-total modo-${logica.direccion}`}>

            {/* 🌬️ 1. INDICADOR DE FUELLE REACTIVO */}
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onPointerDown={() => {
                    motorAudioPro.activarContexto();
                    logica.setDireccion('empujar');
                }}
                onPointerUp={() => logica.setDireccion('halar')}
                onPointerLeave={() => logica.setDireccion('halar')}
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

                        // Props de Grabación
                        grabando={grabando}
                        toggleGrabacion={toggleGrabacion}
                    />

                    {/* Marco del Diapasón (La ventana fija) */}
                    <div className="diapason-marco" ref={marcoRef}>
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            style={{ x }}
                        // drag="x" removido por petición del usuario para usar solo el control de la barra
                        >
                            {/* HILERA 3 - ADENTRO (ARRIBA) */}
                            <div className="hilera-pitos hilera-adentro">
                                {pitosAdentro.map((nota: any) => {
                                    const idBase = nota.id.split('-').slice(0, 2).join('-');
                                    const idHalar = `${idBase}-halar`;
                                    const idEmpujar = `${idBase}-empujar`;
                                    const notaHalar = logica.configTonalidad.terceraFila.find((n: any) => n.id === idHalar);
                                    const notaEmpujar = logica.configTonalidad.terceraFila.find((n: any) => n.id === idEmpujar);

                                    return (
                                        <div
                                            key={idBase} // Key estable para evitar re-renders innecesarios
                                            className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`}
                                            data-pos={idBase} // Posición física estable
                                            onPointerDown={(e) => {
                                                motorAudioPro.activarContexto();
                                                pointersMap.current.set(e.pointerId, { pos: idBase, musicalId: nota.id });
                                                logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                                actualizarVisualBoton(idBase, true);
                                                registrarEvento('nota_on', { id: nota.id, pos: idBase });
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
                                    const idBase = nota.id.split('-').slice(0, 2).join('-');
                                    const idHalar = `${idBase}-halar`;
                                    const idEmpujar = `${idBase}-empujar`;
                                    const notaHalar = logica.configTonalidad.segundaFila.find((n: any) => n.id === idHalar);
                                    const notaEmpujar = logica.configTonalidad.segundaFila.find((n: any) => n.id === idEmpujar);

                                    return (
                                        <div
                                            key={idBase}
                                            className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`}
                                            data-pos={idBase}
                                            onPointerDown={(e) => {
                                                motorAudioPro.activarContexto();
                                                pointersMap.current.set(e.pointerId, { pos: idBase, musicalId: nota.id });
                                                logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                                actualizarVisualBoton(idBase, true);
                                                registrarEvento('nota_on', { id: nota.id, pos: idBase });
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
                                    const idBase = nota.id.split('-').slice(0, 2).join('-');
                                    const idHalar = `${idBase}-halar`;
                                    const idEmpujar = `${idBase}-empujar`;
                                    const notaHalar = logica.configTonalidad.primeraFila.find((n: any) => n.id === idHalar);
                                    const notaEmpujar = logica.configTonalidad.primeraFila.find((n: any) => n.id === idEmpujar);

                                    return (
                                        <div
                                            key={idBase}
                                            className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`}
                                            data-pos={idBase}
                                            onPointerDown={(e) => {
                                                motorAudioPro.activarContexto();
                                                pointersMap.current.set(e.pointerId, { pos: idBase, musicalId: nota.id });
                                                logica.actualizarBotonActivo(nota.id, 'add', null, true);
                                                actualizarVisualBoton(idBase, true);
                                                registrarEvento('nota_on', { id: nota.id, pos: idBase });
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
