/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V18.0 (PointerEvents)
 * 
 * MIGRACIÓN CRÍTICA (V17→V18):
 * CAUSA RAÍZ DEL LAG: Chrome Android usa «Throttled Async Touchmove» para 1 solo dedo.
 * Los TouchEvents de 1 solo dedo son procesados como posibles gestos de scroll (200ms delay).
 * SOLUCIÓN: Migrar de TouchEvents → PointerEvents.
 * Los PointerEvents van por el pipeline del Compositor de Chrome y NO tienen throttling.
 * setPointerCapture(): Cada dedo «captura» su elemento para tracking sin perder eventos.
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

    // 🗺️ REFS Y CACHE DE GEOMETRÍA (Nivel Hardware)
    // 🖐️ V18.0: Mapa de PUNTEROS (PointerEvents), no de touches
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string }>>(new Map());
    // Cache de geometría eliminada en V20.0 (elementFromPoint es superior)

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
    // 🚀 MOTOR DE INPUT PRO V20.0 (Zero-Lag + Coalesced Events)
    // =====================================================================
    // Estado mutable fuera de React para rendimiento máximo (60/120 FPS)
    const activeNotesRef = useRef<Set<string>>(new Set());
    // =====================================================================
    // 🚀 MOTOR DE INPUT PRO V21.0 (RectCache + TouchBlocking + Inertia)
    // =====================================================================
    // Volvemos a caché de geometría para máxima velocidad (solicitud explícita)
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
    const lastTrenPos = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

    useEffect(() => {
        const marco = marcoRef.current;
        const tren = trenRef.current;
        if (!marco || !tren) return;

        // 1. CACHÉ DE GEOMETRÍA (10x más rápido que elementFromPoint en loop)
        const actualizarGeometria = () => {
            if (!tren) return;
            const trenRect = tren.getBoundingClientRect();
            // Guardamos la posición base del tren para restar el scroll (x)
            // x.get() nos da el desplazamiento actual del framer-motion
            const currentX = x.get();

            // La posición "cero" del tren (sin desplazamiento)
            lastTrenPos.current = {
                left: trenRect.left - currentX,
                top: trenRect.top
            };

            rectsCache.current.clear();
            const botones = tren.querySelectorAll('.pito-boton');
            botones.forEach(b => {
                const el = b as HTMLElement;
                const pos = el.dataset.pos;
                if (!pos) return;
                const r = el.getBoundingClientRect();
                // Guardamos coordenadas relativas al "cero" del tren
                rectsCache.current.set(pos, {
                    left: r.left - (trenRect.left - currentX), // Relativo al inicio del tren
                    right: r.right - (trenRect.left - currentX),
                    top: r.top - trenRect.top, // Relativo al top del tren
                    bottom: r.bottom - trenRect.top
                });
            });
        };

        // Actualizar geometría al inicio y al redimensionar
        actualizarGeometria();
        window.addEventListener('resize', actualizarGeometria);
        const intervalGeometria = setInterval(actualizarGeometria, 2000); // Check periódico por si acaso

        // 2. HIT-TESTING MATEMÁTICO PURO (CPU Bound, O(N))
        const obtenerBotonEnCoordenadas = (clientX: number, clientY: number): string | null => {
            // Calcular posición relativa al tren desplazado
            const currentX = x.get();
            const trenLeft = lastTrenPos.current.left + currentX;
            const trenTop = lastTrenPos.current.top;

            const relX = clientX; // Coordenadas absolutas de pantalla vs rects absolutos cacheados?
            // Espera, rectsCache guardó offsets relativos al tren "cero".
            // Para comparar, necesitamos transformar el click a espacio local del tren o transformar los rects a pantalla.
            // Mejor: Rects cacheados son "Left relativo a Tren[0]".
            // ClickX - TrenLeftActual = OffsetX dentro del tren.

            const offsetX = clientX - trenLeft;
            const offsetY = clientY - trenTop;
            const MARGEN_ERROR = 15; // Hitbox más generoso

            // Iterar mapa es muy rápido para < 100 elementos
            for (const [pos, r] of rectsCache.current.entries()) {
                if (offsetX >= r.left - MARGEN_ERROR && offsetX <= r.right + MARGEN_ERROR &&
                    offsetY >= r.top - MARGEN_ERROR && offsetY <= r.bottom + MARGEN_ERROR) {
                    return pos;
                }
            }
            return null;
        };

        const procesarEvento = (e: PointerEvent, tipo: 'down' | 'move' | 'up') => {
            const target = e.target as HTMLElement;

            // 🚫 FILTRO CRÍTICO: Si tocamos la barra de herramientas, NO HACER NADA
            if (target.closest('.barra-herramientas-contenedor')) return;
            // 🚫 El fuelle tiene sus propios listeners, ignorar aquí para no duplicar lógica
            if (target.closest('.indicador-fuelle')) {
                // Si es fuelle, solo prevenimos default para evitar scroll, pero no procesamos notas
                if (e.cancelable) e.preventDefault();
                return;
            }

            // Bloquear scroll nativo en el área de juego
            if (e.cancelable) e.preventDefault();

            const eventos = (tipo === 'move' && e.getCoalescedEvents)
                ? e.getCoalescedEvents()
                : [e];

            eventos.forEach(ev => {
                const pId = ev.pointerId;

                if (tipo === 'up') {
                    const data = pointersMap.current.get(pId);
                    if (data && data.pos) {
                        logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                        actualizarVisualBoton(data.pos, false);
                        activeNotesRef.current.delete(data.musicalId);
                        registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                    }
                    pointersMap.current.delete(pId);
                    return;
                }

                const nuevaPos = obtenerBotonEnCoordenadas(ev.clientX, ev.clientY) || '';
                const dataPrev = pointersMap.current.get(pId);
                const posAnterior = dataPrev?.pos || '';

                if (nuevaPos === posAnterior) return;

                // Cambio de botón
                if (posAnterior && dataPrev) {
                    logicaRef.current.actualizarBotonActivo(dataPrev.musicalId, 'remove', null, true);
                    actualizarVisualBoton(posAnterior, false);
                    activeNotesRef.current.delete(dataPrev.musicalId);
                    registrarEvento('nota_off', { id: dataPrev.musicalId, pos: posAnterior });
                }

                if (nuevaPos) {
                    const newMId = `${nuevaPos}-${logicaRef.current.direccion}`;
                    if (!activeNotesRef.current.has(newMId)) {
                        motorAudioPro.activarContexto();
                        logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
                        actualizarVisualBoton(nuevaPos, true);
                        activeNotesRef.current.add(newMId);
                        registrarEvento('nota_on', { id: newMId, pos: nuevaPos });
                    }
                    pointersMap.current.set(pId, { pos: nuevaPos, musicalId: newMId });

                    // Captura solo si es DOWN y sobre un elemento válido (aunque sea el document, captura el puntero lógico)
                    if (tipo === 'down' && e.target instanceof Element) {
                        try { (e.target as Element).setPointerCapture(pId); } catch (_) { }
                    }
                } else {
                    pointersMap.current.set(pId, { pos: '', musicalId: '' });
                }
            });
        };

        const handleDown = (e: PointerEvent) => procesarEvento(e, 'down');
        const handleMove = (e: PointerEvent) => {
            if (pointersMap.current.has(e.pointerId)) procesarEvento(e, 'move');
        };
        const handleUp = (e: PointerEvent) => {
            if (pointersMap.current.has(e.pointerId)) procesarEvento(e, 'up');
        };

        // Listeners en DOCUMENT con capture: true para máxima prioridad
        const opts = { capture: true, passive: false };
        document.addEventListener('pointerdown', handleDown, opts);
        document.addEventListener('pointermove', handleMove, opts);
        document.addEventListener('pointerup', handleUp, opts);
        document.addEventListener('pointercancel', handleUp, opts);

        // 🛑 TOUCH CHOKING (Anti-Scroll Extremo 1 dedo)
        const bloquearTouch = (e: TouchEvent) => {
            // Si tocamos la barra de herramientas, permitir la interacción nativa (clicks)
            if ((e.target as HTMLElement).closest('.barra-herramientas-contenedor')) return;

            // Para todo lo demás (área de juego), matar el evento nativo
            if (e.cancelable) e.preventDefault();
        };
        // passive: false es obligatorio para poder hacer preventDefault
        window.addEventListener('touchstart', bloquearTouch, { passive: false });
        window.addEventListener('touchmove', bloquearTouch, { passive: false });

        // Inyecciones CSS de emergencia
        document.body.style.overscrollBehavior = 'none';
        document.body.style.userSelect = 'none';
        (document.body.style as any).webkitUserSelect = 'none';
        document.body.style.touchAction = 'none';

        return () => {
            clearInterval(intervalGeometria);
            window.removeEventListener('resize', actualizarGeometria);
            document.removeEventListener('pointerdown', handleDown, opts);
            document.removeEventListener('pointermove', handleMove, opts);
            document.removeEventListener('pointerup', handleUp, opts);
            document.removeEventListener('pointercancel', handleUp, opts);
            window.removeEventListener('touchstart', bloquearTouch);
            window.removeEventListener('touchmove', bloquearTouch);

            // Limpieza CSS
            document.body.style.overscrollBehavior = '';
            document.body.style.userSelect = '';
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

            {/* 🪗 FUELLE: Migrado a PointerEvents para coherencia con el motor V18 */}
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onPointerDown={(e) => { e.preventDefault(); manejarCambioFuelle('empujar'); }}
                onPointerUp={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onPointerCancel={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onContextMenu={(e) => e.preventDefault()}
                style={{ zIndex: 100, touchAction: 'none' }}
            >
                <span className="fuelle-status">{logica.direccion === 'empujar' ? 'CERRANDO' : 'ABRIENDO'}</span>
            </div>

            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    <BarraHerramientas logica={logica} x={x} marcoRef={marcoRef} escala={escala} setEscala={setEscala} distanciaH={distanciaH} setDistanciaH={setDistanciaH} distanciaV={distanciaV} setDistanciaV={setDistanciaV} distanciaHBajos={distanciaHBajos} setDistanciaHBajos={setDistanciaHBajos} distanciaVBajos={distanciaVBajos} setDistanciaVBajos={setDistanciaVBajos} alejarIOS={alejarIOS} setAlejarIOS={setAlejarIOS} modoVista={modoVista} setModoVista={setModoVista} mostrarOctavas={mostrarOctavas} setMostrarOctavas={setMostrarOctavas} tamanoFuente={tamanoFuente} setTamanoFuente={setTamanoFuente} vistaDoble={vistaDoble} setVistaDoble={setVistaDoble} grabando={grabando} toggleGrabacion={toggleGrabacion} />
                    <div className="diapason-marco" ref={marcoRef} style={{ touchAction: 'none' }}>
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            style={{ x, touchAction: 'none' }}
                        >
                            <div className="hilera-pitos hilera-adentro">
                                {h3.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-medio">
                                {h2.map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-afuera">
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
