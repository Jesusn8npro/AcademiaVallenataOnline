/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V12.0 (High-Frequency Gaming Engine)
 * 
 * ESTRATEGIA DEFINITIVA:
 * 1. Forced High-Frequency: Se desactiva el throttling de Chrome Android mediante preventDefault() 
 *    en touchstart global (ZONA JUEGO).
 * 2. Precision Hit-Testing: Geometría cacheada y actualizada dinámicamente.
 * 3. Bellows Sync: Pisar = Cerrar (Empujar), Soltar = Abrir (Halar).
 * 4. UI Safety: La barra de herramientas se excluye del bloqueo táctil para que funcione siempre.
 */
import React, { useEffect, useState, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { motorAudioPro } from '../SimuladorDeAcordeon/AudioEnginePro';
import BarraHerramientas from './Componentes/BarraHerramientas';
import './SimuladorApp.css';

const SimuladorApp: React.FC = () => {
    const logica = useLogicaAcordeon();
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
    const marcoRef = useRef<HTMLDivElement>(null);
    const trenRef = useRef<HTMLDivElement>(null);
    const [escala, setEscala] = useState(1.0);

    const [distanciaH, setDistanciaH] = useState(2.5);
    const [distanciaV, setDistanciaV] = useState(0.8);
    const [distanciaHBajos, setDistanciaHBajos] = useState(2.5);
    const [distanciaVBajos, setDistanciaVBajos] = useState(0.8);
    const [alejarIOS, setAlejarIOS] = useState(false);

    const [modoVista, setModoVista] = useState<'notas' | 'cifrado' | 'numeros' | 'teclas'>('notas');
    const [mostrarOctavas, setMostrarOctavas] = useState(false);
    const [tamanoFuente, setTamanoFuente] = useState(2.8);
    const [vistaDoble, setVistaDoble] = useState(false);

    const x = useMotionValue(0);

    // 🗺️ REFS DE ALTO RENDIMIENTO
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string; lastX?: number; lastY?: number }>>(new Map());
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());

    // Sincronización de logica para evitar cierres de React
    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    const [grabando, setGrabando] = useState(false);
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);
    const grabandoRef = useRef(false);
    useEffect(() => { grabandoRef.current = grabando; }, [grabando]);

    const registrarEvento = (tipo: 'nota_on' | 'nota_off' | 'fuelle', data: any) => {
        if (!grabandoRef.current) return;
        secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    };

    const actualizarVisualBoton = (pos: string, activo: boolean) => {
        const el = document.querySelector(`[data-pos="${pos}"]`) as HTMLElement;
        if (el) {
            if (activo) el.classList.add('nota-activa');
            else el.classList.remove('nota-activa');
        }
    };

    // =====================================================================
    // 🖐️ MOTOR DE INPUT V12.0 (HIGH-FREQUENCY)
    // =====================================================================
    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        const actualizarGeometria = () => {
            if (!tren) return;
            const elPitos = tren.querySelectorAll('.pito-boton');
            const trenBase = tren.getBoundingClientRect();
            rectsCache.current.clear();
            elPitos.forEach(el => {
                const pos = (el as HTMLElement).dataset.pos;
                const r = el.getBoundingClientRect();
                if (pos) {
                    rectsCache.current.set(pos, {
                        left: r.left - trenBase.left,
                        right: r.right - trenBase.left,
                        top: r.top - trenBase.top,
                        bottom: r.bottom - trenBase.top
                    });
                }
            });
        };

        const interval = setInterval(actualizarGeometria, 3000);
        window.addEventListener('resize', actualizarGeometria);
        setTimeout(actualizarGeometria, 500);

        const encontrarPosEnPunto = (clientX: number, clientY: number): string | null => {
            const trenBase = tren.getBoundingClientRect();
            const relX = clientX - trenBase.left;
            const relY = clientY - trenBase.top;
            const IMAN = 15;

            const entries = Array.from(rectsCache.current.entries());
            for (let i = entries.length - 1; i >= 0; i--) {
                const [pos, r] = entries[i];
                if (relX >= r.left - IMAN && relX <= r.right + IMAN &&
                    relY >= r.top - IMAN && relY <= r.bottom + IMAN) {
                    return pos;
                }
            }
            return null;
        };

        const onDown = (e: PointerEvent) => {
            // Ignoramos botón derecho de ratón
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            // 🛡️ CAPTURA DE FOCO: Obliga al navegador a darnos prioridad
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            motorAudioPro.activarContexto();

            const pos = encontrarPosEnPunto(e.clientX, e.clientY);
            if (!pos) return;

            const mId = `${pos}-${logicaRef.current.direccion}`;
            pointersMap.current.set(e.pointerId, { pos, musicalId: mId, lastX: e.clientX, lastY: e.clientY });

            logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
            actualizarVisualBoton(pos, true);
            registrarEvento('nota_on', { id: mId, pos });
        };

        const onMove = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;

            // Interpolación de alta frecuencia
            const checkPoints = [{ x: e.clientX, y: e.clientY }];
            if (data.lastX !== undefined && data.lastY !== undefined) {
                const dx = e.clientX - data.lastX;
                const dy = e.clientY - data.lastY;
                const dist = Math.hypot(dx, dy);
                if (dist > 15) {
                    const steps = Math.min(3, Math.floor(dist / 12));
                    for (let i = 1; i <= steps; i++) {
                        checkPoints.unshift({
                            x: data.lastX + (dx * (i / (steps + 1))),
                            y: data.lastY + (dy * (i / (steps + 1)))
                        });
                    }
                }
            }

            for (const pt of checkPoints) {
                const latest = pointersMap.current.get(e.pointerId);
                if (!latest) continue;

                const newPos = encontrarPosEnPunto(pt.x, pt.y);
                if (newPos !== latest.pos) {
                    if (latest.pos) {
                        logicaRef.current.actualizarBotonActivo(latest.musicalId, 'remove', null, true);
                        actualizarVisualBoton(latest.pos, false);
                        registrarEvento('nota_off', { id: latest.musicalId, pos: latest.pos });
                    }
                    if (newPos) {
                        const mId = `${newPos}-${logicaRef.current.direccion}`;
                        pointersMap.current.set(e.pointerId, { pos: newPos, musicalId: mId, lastX: pt.x, lastY: pt.y });
                        logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                        actualizarVisualBoton(newPos, true);
                        registrarEvento('nota_on', { id: mId, pos: newPos });
                    } else {
                        pointersMap.current.set(e.pointerId, { ...latest, pos: '', musicalId: '' });
                    }
                }
            }
            const final = pointersMap.current.get(e.pointerId);
            if (final) pointersMap.current.set(e.pointerId, { ...final, lastX: e.clientX, lastY: e.clientY });
        };

        const onUp = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (data) {
                if (data.pos) {
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                    actualizarVisualBoton(data.pos, false);
                    registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                }
                pointersMap.current.delete(e.pointerId);
            }
            try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); } catch { }
        };

        // 🛡️ BLOQUEO DE SCROLL EN ZONA DE JUEGO (SOLUCIÓN CHROME ANDROID)
        const matarScroll = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            // Si el toque NO es en la barra de herramientas, matamos el comportamiento de sistema
            if (!target.closest('.barra-herramientas-contenedor') &&
                !target.closest('.menu-opciones-panel') &&
                !target.closest('.modal-contenedor')) {
                if (e.cancelable) e.preventDefault();
            }
        };

        tren.addEventListener('pointerdown', onDown as any);
        tren.addEventListener('pointermove', onMove as any);
        tren.addEventListener('pointerup', onUp as any);
        tren.addEventListener('pointercancel', onUp as any);

        // El secreto para desactivar throttling de un solo dedo
        window.addEventListener('touchstart', matarScroll, { passive: false });
        window.addEventListener('touchmove', matarScroll, { passive: false });

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', actualizarGeometria);
            tren.removeEventListener('pointerdown', onDown as any);
            tren.removeEventListener('pointermove', onMove as any);
            tren.removeEventListener('pointerup', onUp as any);
            tren.removeEventListener('pointercancel', onUp as any);
            window.removeEventListener('touchstart', matarScroll);
            window.removeEventListener('touchmove', matarScroll);
        };
    }, []);

    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        motorAudioPro.activarContexto();
        motorAudioPro.detenerTodo(0.012);

        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                const nextId = `${data.pos}-${nuevaDireccion}`;
                logicaRef.current.actualizarBotonActivo(nextId, 'add', null, true);
                pointersMap.current.set(pId, { ...data, musicalId: nextId });
            }
        });
        logicaRef.current.setDireccion(nuevaDireccion);
    };

    const CIFRADO: Record<string, string> = { 'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E', 'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B' };
    const formatearEtiquetaNota = (notaRaw: any) => {
        if (!notaRaw) return '';
        const soloNota = (notaRaw.nombre || '').split(' ')[0];
        const baseNorm = soloNota.charAt(0).toUpperCase() + soloNota.slice(1).toLowerCase();
        const base = modoVista === 'cifrado' ? (CIFRADO[baseNorm] || baseNorm) : baseNorm;
        if (mostrarOctavas) {
            const freq = Array.isArray(notaRaw.frecuencia) ? notaRaw.frecuencia[0] : notaRaw.frecuencia;
            if (freq > 0) {
                const octava = Math.floor((12 * (Math.log(freq / 440) / Math.log(2)) + 69 + 0.5) / 12) - 1;
                return `${base}${octava}`;
            }
        }
        return base;
    };

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

    useEffect(() => {
        const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    const toggleGrabacion = () => {
        if (!grabando) {
            secuenciaRef.current = []; tiempoInicioRef.current = Date.now(); setGrabando(true);
        } else {
            setGrabando(false);
            if (secuenciaRef.current.length > 0) {
                const blob = new Blob([JSON.stringify(secuenciaRef.current)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `secuencia_${Date.now()}.json`;
                a.click();
            }
        }
    };

    const agrupar = (fila: any[]) => {
        const p: Record<string, { halar: any, empujar: any }> = {};
        fila?.forEach(n => {
            const [f, c, d] = n.id.split('-');
            const pos = `${f}-${c}`;
            if (!p[pos]) p[pos] = { halar: null, empujar: null };
            if (d === 'halar') p[pos].halar = n; else p[pos].empujar = n;
        });
        return Object.entries(p).sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1]));
    };

    const h3 = React.useMemo(() => agrupar(logica.configTonalidad?.terceraFila), [logica.configTonalidad?.terceraFila]);
    const h2 = React.useMemo(() => agrupar(logica.configTonalidad?.segundaFila), [logica.configTonalidad?.segundaFila]);
    const h1 = React.useMemo(() => agrupar(logica.configTonalidad?.primeraFila), [logica.configTonalidad?.primeraFila]);

    return (
        <div className={`simulador-app-root modo-${logica.direccion}`}>
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onPointerDown={(e) => { e.preventDefault(); manejarCambioFuelle('empujar'); }}
                onPointerUp={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onPointerLeave={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onContextMenu={(e) => e.preventDefault()}
                style={{ zIndex: 100, touchAction: 'none' }}
            >
                <span className="fuelle-status">{logica.direccion === 'empujar' ? 'CERRANDO' : 'ABRIENDO'}</span>
            </div>

            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    <BarraHerramientas logica={logica} x={x} marcoRef={marcoRef} escala={escala} setEscala={setEscala} distanciaH={distanciaH} setDistanciaH={setDistanciaH} distanciaV={distanciaV} setDistanciaV={setDistanciaV} distanciaHBajos={distanciaHBajos} setDistanciaHBajos={setDistanciaHBajos} distanciaVBajos={distanciaVBajos} setDistanciaVBajos={setDistanciaVBajos} alejarIOS={alejarIOS} setAlejarIOS={setAlejarIOS} modoVista={modoVista} setModoVista={setModoVista} mostrarOctavas={mostrarOctavas} setMostrarOctavas={setMostrarOctavas} tamanoFuente={tamanoFuente} setTamanoFuente={setTamanoFuente} vistaDoble={vistaDoble} setVistaDoble={setVistaDoble} grabando={grabando} toggleGrabacion={toggleGrabacion} />

                    <div className="diapason-marco" ref={marcoRef}>
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            style={{ x, touchAction: 'none' }}
                        >
                            <div className="hilera-pitos hilera-adentro" style={{ pointerEvents: 'none' }}>
                                {h3.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-medio" style={{ pointerEvents: 'none' }}>
                                {h2.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-afuera" style={{ pointerEvents: 'none' }}>
                                {h1.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {!isLandscape && (<div className="overlay-rotacion"><div className="icono-rotar"><RotateCw size={80} /></div><h2>HORIZONTAL</h2></div>)}
        </div>
    );
};

export default SimuladorApp;
