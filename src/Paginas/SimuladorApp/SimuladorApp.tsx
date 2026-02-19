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

    useEffect(() => {
        const marco = marcoRef.current;
        if (!marco) return;

        /**
         * 🎯 HIT-TESTING NATIVO (DOM elementFromPoint)
         * Mucho más preciso y rápido que cálculos matemáticos manuales,
         * especialmente con transformaciones CSS (scale, rotate).
         */
        const obtenerBotonBajoPuntero = (clientX: number, clientY: number): { pos: string, id: string } | null => {
            const el = document.elementFromPoint(clientX, clientY);
            if (!el) return null;
            const boton = el.closest('.pito-boton') as HTMLElement;
            if (boton && boton.dataset.pos) {
                return { pos: boton.dataset.pos, id: boton.id }; // id no usado, solo pos
            }
            return null;
        };

        const procesarEventoPuntero = (e: PointerEvent, tipo: 'down' | 'move' | 'up') => {
            if (e.cancelable) e.preventDefault();

            // Si es move, usamos coalesced events para capturar trazos rápidos
            const eventos = (tipo === 'move' && e.getCoalescedEvents)
                ? e.getCoalescedEvents()
                : [e];

            eventos.forEach(ev => {
                const pointerId = ev.pointerId;

                // En UP/CANCEL, limpiar todo
                if (tipo === 'up') {
                    const data = pointersMap.current.get(pointerId);
                    if (data && data.pos) {

                        // Apagar nota
                        logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                        actualizarVisualBoton(data.pos, false);
                        activeNotesRef.current.delete(data.musicalId);
                        registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                    }
                    pointersMap.current.delete(pointerId);
                    return;
                }

                // En DOWN/MOVE
                const hit = obtenerBotonBajoPuntero(ev.clientX, ev.clientY);
                const nuevaPos = hit ? hit.pos : '';

                // Recuperar estado anterior de este puntero
                const dataPrev = pointersMap.current.get(pointerId);
                const posAnterior = dataPrev?.pos || '';

                // Si no hay cambio de posición, no hacer nada (optimización)
                if (nuevaPos === posAnterior) return;

                // 1. Apagar nota anterior si existía
                if (posAnterior && dataPrev?.musicalId) {
                    // Solo apagar si el nuevo botón es diferente
                    logicaRef.current.actualizarBotonActivo(dataPrev.musicalId, 'remove', null, true);
                    actualizarVisualBoton(posAnterior, false);
                    activeNotesRef.current.delete(dataPrev.musicalId);
                    registrarEvento('nota_off', { id: dataPrev.musicalId, pos: posAnterior });
                }

                // 2. Encender nueva nota si hay botón y no está ya activa
                if (nuevaPos) {
                    const newMId = `${nuevaPos}-${logicaRef.current.direccion}`;

                    // Evitar re-disparar si ya está sonando (por otro dedo, p.ej.)
                    // Aunque en acordeón real puedes poner dos dedos en el mismo botón,
                    // digitalmente es la misma nota.
                    if (!activeNotesRef.current.has(newMId)) {
                        motorAudioPro.activarContexto();
                        logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
                        actualizarVisualBoton(nuevaPos, true);
                        activeNotesRef.current.add(newMId);
                        registrarEvento('nota_on', { id: newMId, pos: nuevaPos });
                    }

                    // Actualizar mapa de punteros
                    pointersMap.current.set(pointerId, { pos: nuevaPos, musicalId: newMId });

                    // CAPTURA DE PUNTERO: Crucial para que el navegador siga enviando eventos
                    // incluso si el dedo sale del elemento inicial.
                    if (tipo === 'down' && e.target instanceof Element) {
                        try { (e.target as Element).setPointerCapture(pointerId); } catch (_) { }
                    }
                } else {
                    // El dedo está en 'nada' (fuera de botones)
                    pointersMap.current.set(pointerId, { pos: '', musicalId: '' });
                }
            });
        };

        // Listeners Globales (Document) con { passive: false, capture: true }
        // Capture phase asegura que interceptamos el evento antes que el browser decida hacer scroll.
        const handleDown = (e: PointerEvent) => {
            // Solo procesar si tocamos dentro del área del simulador (o arrastramos desde ella)
            // Pero los listeners globales capturan todo. Filtramos por target inicial o zona?
            // Mejor: si no estamos en 'simulador-app-root', ignorar.
            if (!(e.target as HTMLElement).closest('.simulador-app-root')) return;
            procesarEventoPuntero(e, 'down');
        };

        const handleMove = (e: PointerEvent) => {
            if (!pointersMap.current.has(e.pointerId)) return; // Solo seguir punteros conocidos
            procesarEventoPuntero(e, 'move');
        };

        const handleUp = (e: PointerEvent) => {
            if (!pointersMap.current.has(e.pointerId)) return;
            procesarEventoPuntero(e, 'up');
        };

        const opciones = { capture: true, passive: false };

        document.addEventListener('pointerdown', handleDown, opciones);
        document.addEventListener('pointermove', handleMove, opciones);
        document.addEventListener('pointerup', handleUp, opciones);
        document.addEventListener('pointercancel', handleUp, opciones);

        const preventDefault = (e: Event) => e.preventDefault();
        window.addEventListener('contextmenu', preventDefault);
        window.addEventListener('touchstart', preventDefault, { passive: false }); // Bloqueo extra para iOS

        return () => {
            document.removeEventListener('pointerdown', handleDown, opciones);
            document.removeEventListener('pointermove', handleMove, opciones);
            document.removeEventListener('pointerup', handleUp, opciones);
            document.removeEventListener('pointercancel', handleUp, opciones);
            window.removeEventListener('contextmenu', preventDefault);
            window.removeEventListener('touchstart', preventDefault);
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
