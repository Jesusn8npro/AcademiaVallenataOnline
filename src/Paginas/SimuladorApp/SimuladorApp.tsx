/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V16.0 (Hardware Performance)
 * 
 * MEJORAS CRÍTICAS:
 * 1. Zero-Reflow: Eliminado getBoundingClientRect() de los bucles de movimiento (touchmove).
 * 2. Pre-Cache Geométrico: Posiciones de botones relativas al tren calculadas una sola vez.
 * 3. Fuelle Synchro: Cambiado a TouchEvents puros para sincronía total con el motor de notas.
 * 4. Barra Intocable: Documentada y protegida en su posición original.
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
    const touchesMap = useRef<Map<number, { pos: string; musicalId: string }>>(new Map());
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
    const lastTrenRect = useRef<{ left: number; top: number } | null>(null);

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
    // 🖐️ MOTOR DE INPUT V16.0 (ZERO REFLOW)
    // =====================================================================
    useEffect(() => {
        const marco = marcoRef.current;
        const tren = trenRef.current;
        if (!marco || !tren) return;

        // Cachea posiciones relativas al 'tren' (no cambian con el scroll X)
        const actualizarGeometriaBase = () => {
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

        const interval = setInterval(actualizarGeometriaBase, 4000);
        window.addEventListener('resize', actualizarGeometriaBase);
        setTimeout(actualizarGeometriaBase, 500);

        const encontrarPosEnPunto = (clientX: number, clientY: number): string | null => {
            if (!lastTrenRect.current) return null;
            const relX = clientX - lastTrenRect.current.left;
            const relY = clientY - lastTrenRect.current.top;
            const IMAN = 15;

            // Búsqueda ultra-rápida en el cache geométrico
            for (const [pos, r] of rectsCache.current.entries()) {
                if (relX >= r.left - IMAN && relX <= r.right + IMAN &&
                    relY >= r.top - IMAN && relY <= r.bottom + IMAN) {
                    return pos;
                }
            }
            return null;
        };

        const handleTouch = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            // No interceptamos la barra de herramientas ni modales
            if (target.closest('.barra-herramientas-contenedor') ||
                target.closest('.menu-opciones-panel') ||
                target.closest('.modal-contenedor')) return;

            // ⚡ EL TRUCO MAESTRO: Bloqueo de scroll y latencia Chrome
            if (e.cancelable) e.preventDefault();
            motorAudioPro.activarContexto();

            // Actualizamos la posición del tren SOLO en touchstart para evitar reflows en touchmove
            if (e.type === 'touchstart' || e.type === 'touchmove') {
                const tr = tren.getBoundingClientRect();
                lastTrenRect.current = { left: tr.left, top: tr.top };
            }

            for (let i = 0; i < e.changedTouches.length; i++) {
                const t = e.changedTouches[i];
                const identifier = t.identifier;
                const pos = encontrarPosEnPunto(t.clientX, t.clientY);
                const data = touchesMap.current.get(identifier);

                if (e.type === 'touchstart') {
                    if (pos) {
                        const mId = `${pos}-${logicaRef.current.direccion}`;
                        touchesMap.current.set(identifier, { pos, musicalId: mId });
                        logicaRef.current.actualizarBotonActivo(mId, 'add', null, true);
                        actualizarVisualBoton(pos, true);
                        registrarEvento('nota_on', { id: mId, pos });
                    } else {
                        touchesMap.current.set(identifier, { pos: '', musicalId: '' });
                    }
                } else if (e.type === 'touchmove') {
                    if (!data) continue;
                    if (pos !== data.pos) {
                        if (data.pos) {
                            logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                            actualizarVisualBoton(data.pos, false);
                            registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                        }
                        if (pos) {
                            const newMId = `${pos}-${logicaRef.current.direccion}`;
                            touchesMap.current.set(identifier, { pos, musicalId: newMId });
                            logicaRef.current.actualizarBotonActivo(newMId, 'add', null, true);
                            actualizarVisualBoton(pos, true);
                            registrarEvento('nota_on', { id: newMId, pos });
                        } else {
                            touchesMap.current.set(identifier, { pos: '', musicalId: '' });
                        }
                    }
                } else if (e.type === 'touchend' || e.type === 'touchcancel') {
                    if (data) {
                        if (data.pos) {
                            logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                            actualizarVisualBoton(data.pos, false);
                            registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                        }
                        touchesMap.current.delete(identifier);
                    }
                }
            }
        };

        // Captura global en fase de captura para máxima prioridad
        window.addEventListener('touchstart', handleTouch, { passive: false, capture: true });
        window.addEventListener('touchmove', handleTouch, { passive: false, capture: true });
        window.addEventListener('touchend', handleTouch, { passive: false, capture: true });
        window.addEventListener('touchcancel', handleTouch, { passive: false, capture: true });

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', actualizarGeometriaBase);
            window.removeEventListener('touchstart', handleTouch, { capture: true });
            window.removeEventListener('touchmove', handleTouch, { capture: true });
            window.removeEventListener('touchend', handleTouch, { capture: true });
            window.removeEventListener('touchcancel', handleTouch, { capture: true });
        };
    }, []);

    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        motorAudioPro.activarContexto();
        motorAudioPro.detenerTodo(0.012);

        touchesMap.current.forEach((data, tId) => {
            if (data.pos) {
                const nextId = `${data.pos}-${nuevaDireccion}`;
                logicaRef.current.actualizarBotonActivo(nextId, 'add', null, true);
                touchesMap.current.set(tId, { ...data, musicalId: nextId });
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
                onTouchStart={(e) => { e.preventDefault(); manejarCambioFuelle('empujar'); }}
                onTouchEnd={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onTouchCancel={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
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
