/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V7.0 (Zero-Lag & Absolute Tracking)
 * 
 * Basado en tecnología de motores de juego:
 * - Local Coordinate Space: Hit-testing inmune al scroll/movimiento del acordeón.
 * - Global Safety Cleanup: Evita que las notas se queden pegadas al soltar fuera.
 * - Multi-Sample Interpolation: Garantiza que ningún trino "atraviese" un botón sin sonar.
 * - Gesture Armor: Bloqueo total de pull-to-refresh, zoom y menús de sistema.
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

    // 🎨 Estados de Diseño (Sincronizados vía CSS Vars)
    const [distanciaH, setDistanciaH] = useState(2.5);
    const [distanciaV, setDistanciaV] = useState(0.8);
    const [distanciaHBajos, setDistanciaHBajos] = useState(2.5);
    const [distanciaVBajos, setDistanciaVBajos] = useState(0.8);
    const [alejarIOS, setAlejarIOS] = useState(false);

    // 👁️ Estados de Vista
    const [modoVista, setModoVista] = useState<'notas' | 'cifrado' | 'numeros' | 'teclas'>('notas');
    const [mostrarOctavas, setMostrarOctavas] = useState(false);
    const [tamanoFuente, setTamanoFuente] = useState(2.8);
    const [vistaDoble, setVistaDoble] = useState(false);

    const x = useMotionValue(0);

    // 🗺️ REFS ESTRUCTURALES (MÁXIMA VELOCIDAD)
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string; lastX?: number; lastY?: number }>>(new Map());
    /** 🎯 CACHÉ GEOMÉTRICO LOCAL: Rectángulos relativos al contenedor 'tren' */
    const localRectsRef = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
    const pitoElementsRef = useRef<Map<string, HTMLElement>>(new Map());
    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    const [grabando, setGrabando] = useState(false);
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);
    const grabandoRef = useRef(false);
    useEffect(() => { grabandoRef.current = grabando; }, [grabando]);

    /** Sincroniza visuales fuera de React para latencia 0 */
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

    const registrarEvento = (tipo: 'nota_on' | 'nota_off' | 'fuelle', data: any) => {
        if (!grabandoRef.current) return;
        secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    };

    // =====================================================================
    // 🖐️ MOTOR DE INPUT V7.0 (LOCAL COORDINATES)
    // =====================================================================
    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        /** Genera geometría relativa para que el hit-testing sea inmune al scroll/movimiento */
        const actualizarGeometriaLocal = () => {
            const elPitos = tren.querySelectorAll('.pito-boton');
            const trenBase = tren.getBoundingClientRect();
            localRectsRef.current.clear();
            pitoElementsRef.current.clear();

            elPitos.forEach(el => {
                const pos = (el as HTMLElement).dataset.pos;
                const rect = el.getBoundingClientRect();
                if (pos) {
                    pitoElementsRef.current.set(pos, el as HTMLElement);
                    localRectsRef.current.set(pos, {
                        left: rect.left - trenBase.left,
                        right: rect.right - trenBase.left,
                        top: rect.top - trenBase.top,
                        bottom: rect.bottom - trenBase.top
                    });
                }
            });
        };

        // Recalcular geometría si cambia la escala o el tamaño
        const interval = setInterval(actualizarGeometriaLocal, 3000);
        window.addEventListener('resize', actualizarGeometriaLocal);
        setTimeout(actualizarGeometriaLocal, 500);

        /** Detección matemática en espacio local */
        const detectarEnPuntoLocal = (clientX: number, clientY: number): string | null => {
            const trenRect = tren.getBoundingClientRect();
            const relX = clientX - trenRect.left;
            const relY = clientY - trenRect.top;
            const IMAN = 15; // "Imán" de sensibilidad para trinos y dedos gruesos

            const entries = Array.from(localRectsRef.current.entries());
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
            if (e.pointerType === 'mouse' && !e.isPrimary) return;
            e.preventDefault();
            motorAudioPro.activarContexto();

            const pos = detectarEnPuntoLocal(e.clientX, e.clientY);
            if (!pos) return;

            try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch (err) { }

            const musicalId = `${pos}-${logicaRef.current.direccion}`;
            pointersMap.current.set(e.pointerId, { pos, musicalId, lastX: e.clientX, lastY: e.clientY });

            logicaRef.current.actualizarBotonActivo(musicalId, 'add', null, true);
            actualizarVisualBoton(pos, true);
            registrarEvento('nota_on', { id: musicalId, pos });
        };

        const onMove = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;

            // 🛡️ BLOQUEO DE INTERFERENCIA: Evitamos que el navegador intente hacer scroll
            if (e.cancelable) e.preventDefault();

            const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];
            for (const ev of events) {
                const checkPoints = [{ x: ev.clientX, y: ev.clientY }];

                // 💎 INTERPOLACIÓN AGRESIVA (Anti-saltos)
                if (data.lastX !== undefined && data.lastY !== undefined) {
                    const dx = ev.clientX - data.lastX;
                    const dy = ev.clientY - data.lastY;
                    const dist = Math.hypot(dx, dy);
                    if (dist > 15) { // Si el dedo vuela, rellenamos con muestras intermedias
                        const steps = Math.min(4, Math.floor(dist / 12));
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

                    const newPos = detectarEnPuntoLocal(pt.x, pt.y);
                    if (newPos !== latest.pos) {
                        // OFF
                        if (latest.pos) {
                            logicaRef.current.actualizarBotonActivo(latest.musicalId, 'remove', null, true);
                            actualizarVisualBoton(latest.pos, false);
                            registrarEvento('nota_off', { id: latest.musicalId, pos: latest.pos });
                        }
                        // ON
                        if (newPos) {
                            const newMusicalId = `${newPos}-${logicaRef.current.direccion}`;
                            pointersMap.current.set(e.pointerId, { pos: newPos, musicalId: newMusicalId, lastX: pt.x, lastY: pt.y });
                            logicaRef.current.actualizarBotonActivo(newMusicalId, 'add', null, true);
                            actualizarVisualBoton(newPos, true);
                            registrarEvento('nota_on', { id: newMusicalId, pos: newPos });
                        } else {
                            pointersMap.current.set(e.pointerId, { ...latest, pos: '', musicalId: '' });
                        }
                    }
                }
                const final = pointersMap.current.get(e.pointerId);
                if (final) pointersMap.current.set(e.pointerId, { ...final, lastX: ev.clientX, lastY: ev.clientY });
            }
        };

        const onUp = (e: PointerEvent) => {
            if (e.cancelable) e.preventDefault();
            const d = pointersMap.current.get(e.pointerId);
            if (d) {
                if (d.pos) {
                    logicaRef.current.actualizarBotonActivo(d.musicalId, 'remove', null, true);
                    actualizarVisualBoton(d.pos, false);
                    registrarEvento('nota_off', { id: d.musicalId, pos: d.pos });
                }
                pointersMap.current.delete(e.pointerId);
            }
        };

        const onWindowUp = (e: PointerEvent) => {
            // Limpieza de seguridad si el pointerup no llega al elemento (ej. soltar fuera de ventana)
            if (pointersMap.current.has(e.pointerId)) onUp(e);
        };

        // 🛡️ BLINDAJE SELECTIVO: No bloqueamos clics en la barra o menús
        const evitarScroll = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            // Si tocamos la barra de herramientas o cualquier modal/menú, permitimos el evento
            if (target.closest('.barra-herramientas-contenedor') ||
                target.closest('.menu-opciones-panel') ||
                target.closest('.modal-contenedor')) {
                return;
            }
            if (e.cancelable) e.preventDefault();
        };

        tren.addEventListener('pointerdown', onDown, { passive: false });
        tren.addEventListener('pointermove', onMove, { passive: false });
        tren.addEventListener('pointerup', onUp, { passive: false });
        tren.addEventListener('pointercancel', onUp, { passive: false });

        // Matamos el touchmove y touchstart para que el navegador no intente hacer pull-to-refresh
        window.addEventListener('touchstart', evitarScroll as any, { passive: false });
        window.addEventListener('touchmove', evitarScroll as any, { passive: false });
        window.addEventListener('pointerup', onWindowUp);
        window.addEventListener('pointercancel', onWindowUp);

        const block = (e: Event) => e.preventDefault();
        window.addEventListener('contextmenu', block);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', actualizarGeometriaLocal);
            tren.removeEventListener('pointerdown', onDown);
            tren.removeEventListener('pointermove', onMove);
            tren.removeEventListener('pointerup', onUp);
            tren.removeEventListener('pointercancel', onUp);
            window.removeEventListener('touchstart', evitarScroll as any);
            window.removeEventListener('touchmove', evitarScroll as any);
            window.removeEventListener('pointerup', onWindowUp);
            window.removeEventListener('pointercancel', onWindowUp);
            window.removeEventListener('contextmenu', block);
        };
    }, []);

    // --- ACCIONES DE FUELLE (OPTIMIZADO) ---
    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        motorAudioPro.activarContexto();

        const root = document.querySelector('.simulador-app-root');
        if (root) {
            root.classList.remove('modo-halar', 'modo-empujar');
            root.classList.add(`modo-${nuevaDireccion}`);
        }

        // 🧹 SILENCIO INSTANTÁNEO Y TRANSICIÓN
        motorAudioPro.detenerTodo(0.015);

        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                const nextId = `${data.pos}-${nuevaDireccion}`;
                logicaRef.current.actualizarBotonActivo(nextId, 'add', null, true);
                pointersMap.current.set(pId, { ...data, musicalId: nextId });
            }
        });

        logicaRef.current.setDireccion(nuevaDireccion);
    };

    // --- FORMATEO ---
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
        <div className={`simulador-app-root capa-blindaje-total modo-${logica.direccion}`}>
            {/* 🌬️ INDICADOR DE FUELLE (Fijado y sin gestos) */}
            <div
                className={`indicador-fuelle ${logica.direccion === 'halar' ? 'halar' : 'empujar'}`}
                onPointerDown={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onPointerUp={(e) => { e.preventDefault(); manejarCambioFuelle('empujar'); }}
                onPointerLeave={(e) => { e.preventDefault(); manejarCambioFuelle('empujar'); }}
                style={{ touchAction: 'none' }}
            >
                <span className="fuelle-status">{logica.direccion === 'halar' ? 'ABRIENDO' : 'CERRANDO'}</span>
            </div>

            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    <BarraHerramientas logica={logica} x={x} marcoRef={marcoRef} escala={escala} setEscala={setEscala} distanciaH={distanciaH} setDistanciaH={setDistanciaH} distanciaV={distanciaV} setDistanciaV={setDistanciaV} distanciaHBajos={distanciaHBajos} setDistanciaHBajos={setDistanciaHBajos} distanciaVBajos={distanciaVBajos} setDistanciaVBajos={setDistanciaVBajos} alejarIOS={alejarIOS} setAlejarIOS={setAlejarIOS} modoVista={modoVista} setModoVista={setModoVista} mostrarOctavas={mostrarOctavas} setMostrarOctavas={setMostrarOctavas} tamanoFuente={tamanoFuente} setTamanoFuente={setTamanoFuente} vistaDoble={vistaDoble} setVistaDoble={setVistaDoble} grabando={grabando} toggleGrabacion={toggleGrabacion} />

                    <div className="diapason-marco" ref={marcoRef}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x }}>
                            {/* HILERAS CON EVENTOS BLOQUEADOS (Manejo por delegado en useEffect) */}
                            <div className="hilera-pitos hilera-adentro">
                                {h3.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos} style={{ pointerEvents: 'none' }}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-medio">
                                {h2.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos} style={{ pointerEvents: 'none' }}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-afuera">
                                {h1.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos} style={{ pointerEvents: 'none' }}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {!isLandscape && (
                <div className="overlay-rotacion">
                    <div className="icono-rotar"><RotateCw size={80} /></div>
                    <h2>HORIZONTAL</h2>
                </div>
            )}
        </div>
    );
};

export default SimuladorApp;
