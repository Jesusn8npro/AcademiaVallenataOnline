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
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
    const lastTrenRect = useRef<{ left: number; top: number } | null>(null);

    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    // 🔒 BLOQUEO DE SCROLL SCROLL SOLO EN SIMULADOR
    useEffect(() => {
        // Bloquear scroll al entrar
        document.body.classList.add('bloquear-scroll-simulador');
        document.documentElement.classList.add('bloquear-scroll-simulador');
        document.getElementById('root')?.classList.add('bloquear-scroll-simulador');

        return () => {
            // Desbloquear scroll al salir
            document.body.classList.remove('bloquear-scroll-simulador');
            document.documentElement.classList.remove('bloquear-scroll-simulador');
            document.getElementById('root')?.classList.remove('bloquear-scroll-simulador');
        };
    }, []);

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
    // 🚀 MOTOR DE INPUT PRO V18.0 (PointerEvents + setPointerCapture)
    // =====================================================================
    useEffect(() => {
        const marco = marcoRef.current;
        const tren = trenRef.current;
        if (!marco || !tren) return;

        /**
         * 🗺️ CACHÉ ATÓMICA DE GEOMETRÍA
         * Se ejecuta solo al montar, redimensionar o cuando cambian distancias.
         */
        const actualizarGeometriaBase = () => {
            if (!tren) return;
            const elPitos = tren.querySelectorAll('.pito-boton');
            const currentX = x.get();
            const trenBase = tren.getBoundingClientRect();

            // Calculamos donde estaría el tren si el scroll fuera 0
            lastTrenRect.current = {
                left: trenBase.left - currentX,
                top: trenBase.top
            };

            rectsCache.current.clear();
            elPitos.forEach(el => {
                const pos = (el as HTMLElement).dataset.pos;
                const r = el.getBoundingClientRect();
                if (pos) {
                    // Guardamos la posición relativa al tren (punto 0 del scroll)
                    rectsCache.current.set(pos, {
                        left: r.left - trenBase.left,
                        right: r.right - trenBase.left,
                        top: r.top - trenBase.top,
                        bottom: r.bottom - trenBase.top
                    });
                }
            });
            console.log("📍 Geometría Atómica Recalculada:", rectsCache.current.size, "pitos");
        };

        const interval = setInterval(actualizarGeometriaBase, 10000);
        window.addEventListener('resize', actualizarGeometriaBase);
        // Pequeño delay para que React termine el layout
        setTimeout(actualizarGeometriaBase, 1000);

        /**
         * 🎯 HIT-TESTING MATEMÁTICO (Zero DOM access)
         */
        const encontrarPosEnPunto = (clientX: number, clientY: number): string | null => {
            if (!lastTrenRect.current) return null;

            // Calculamos posición real del tren usando el MotionValue (Sin Reflow!)
            const currentX = x.get();
            const realTrenLeft = lastTrenRect.current.left + currentX;
            const realTrenTop = lastTrenRect.current.top;

            const relX = clientX - realTrenLeft;
            const relY = clientY - realTrenTop;
            const IMAN = 15; // Margen de error para dedos grandes

            for (const [pos, r] of rectsCache.current.entries()) {
                if (relX >= r.left - IMAN && relX <= r.right + IMAN &&
                    relY >= r.top - IMAN && relY <= r.bottom + IMAN) {
                    return pos;
                }
            }
            return null;
        };

        /**
         * 🚀 MOTOR V19.0: PointerEvents CORREGIDO
         * 
         * BUG RAÍZ ENCONTRADO (V18 → V19):
         * 1. `.diapason-marco` tiene `pointer-events: none` en CSS → el marco NUNCA recibe
         *    el pointerdown directamente. Los eventos burbujean desde los hijos (.pito-boton).
         * 2. `setPointerCapture(e.currentTarget)` fallaba silenciosamente porque currentTarget
         *    (el marco) no tenía un puntero activo — el puntero nació en el hijo (el pito).
         * 3. Con pointer-events:none en el marco, la captura nunca se establecía →
         *    Chrome mantenía sus heurísticas de scroll para el dedo solitario.
         *
         * SOLUCIÓN DEFINITIVA:
         * - Listeners en `document` fase de CAPTURA: se disparan ANTES que Chrome procese eventos.
         * - `setPointerCapture` sobre `e.target` (el elemento que RECIBIÓ el toque real).
         * - Filtro por marcoRect: verificamos coordenadas vs bounding box del marco, evitando
         *   costosas llamadas a `.closest()` en el hot path táctil.
         */
        let marcoRect = marco.getBoundingClientRect();
        const actualizarMarcoRect = () => { marcoRect = marco.getBoundingClientRect(); };
        window.addEventListener('resize', actualizarMarcoRect);
        setTimeout(actualizarMarcoRect, 500);

        const handlePointerDown = (e: PointerEvent) => {
            // 🎯 FILTRO DE ZONA: Solo procesamos toques dentro del área del acordeón
            // Esto reemplaza .closest() (lento) con una simple comparación de coordenadas
            if (e.clientX < marcoRect.left || e.clientX > marcoRect.right ||
                e.clientY < marcoRect.top || e.clientY > marcoRect.bottom) return;

            const target = e.target as HTMLElement;
            // Filtrar fuelle y controles UI (tienen su propio manejo)
            if (target.closest('.indicador-fuelle') ||
                target.closest('.barra-herramientas-contenedor')) return;

            // ⚡ BUG FIX CRÍTICO: setPointerCapture sobre el TARGET (quien recibió el toque),
            // NO sobre currentTarget. El target es el .pito-boton que SÍ tiene pointer-events:auto.
            // Esto es lo que hace que Chrome entre en "modo gaming" para 1 solo dedo.
            try { target.setPointerCapture(e.pointerId); } catch (_) { }

            if (e.cancelable) e.preventDefault();
            motorAudioPro.activarContexto();

            const pos = encontrarPosEnPunto(e.clientX, e.clientY);
            if (pos) {
                const mId = `${pos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos, musicalId: mId });
                logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                actualizarVisualBoton(pos, true);
                registrarEvento('nota_on', { id: mId, pos });
            } else {
                pointersMap.current.set(e.pointerId, { pos: '', musicalId: '' });
            }
        };

        const handlePointerMove = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;

            if (e.cancelable) e.preventDefault();

            const pos = encontrarPosEnPunto(e.clientX, e.clientY);
            if (pos !== data.pos) {
                if (data.pos) {
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                    actualizarVisualBoton(data.pos, false);
                    registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                }
                if (pos) {
                    const newMId = `${pos}-${logicaRef.current.direccion}`;
                    pointersMap.current.set(e.pointerId, { pos, musicalId: newMId });
                    logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
                    actualizarVisualBoton(pos, true);
                    registrarEvento('nota_on', { id: newMId, pos });
                } else {
                    pointersMap.current.set(e.pointerId, { pos: '', musicalId: '' });
                }
            }
        };

        const handlePointerUp = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;

            if (data.pos) {
                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                actualizarVisualBoton(data.pos, false);
                registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
            }
            pointersMap.current.delete(e.pointerId);
        };

        // 🎯 LISTENERS EN DOCUMENT - FASE DE CAPTURA
        // Usar capture:true garantiza que nuestro handler corre ANTES que Chrome
        // decida si es un gesto de scroll. Esto es equivalente a interceptar la
        // señal antes del sistema operativo.
        document.addEventListener('pointerdown', handlePointerDown, { capture: true, passive: false });
        document.addEventListener('pointermove', handlePointerMove, { capture: true, passive: false });
        document.addEventListener('pointerup', handlePointerUp, { capture: true });
        document.addEventListener('pointercancel', handlePointerUp, { capture: true });

        // 🚫 Bloquear gestos residuales del sistema
        const blockGesture = (e: Event) => { if (e.cancelable) e.preventDefault(); };
        window.addEventListener('contextmenu', blockGesture);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', actualizarGeometriaBase);
            window.removeEventListener('resize', actualizarMarcoRect);
            document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
            document.removeEventListener('pointermove', handlePointerMove, { capture: true });
            document.removeEventListener('pointerup', handlePointerUp, { capture: true });
            document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
            window.removeEventListener('contextmenu', blockGesture);
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
