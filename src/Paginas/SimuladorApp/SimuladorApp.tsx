/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V6.1 (Ultra-Performance)
 * 
 * Arquitectura de alto rendimiento para músicos profesionales:
 * - Mathematical Hit-Testing: Detección instantánea sin consultas al DOM.
 * - Multi-Step Interpolation: Evita saltos en trinos y glissandos de alta velocidad.
 * - Coalesced Events: Aprovecha la máxima tasa de muestreo de los sensores táctiles.
 * - Magnetic Sensitivity: Imanes matemáticos que compensan el tamaño del dedo en móvil.
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

    // 🎨 Estados de Diseño
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

    // 🗺️ REFS ESTRUCTURALES (ALTA VELOCIDAD)
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string; lastX?: number; lastY?: number }>>(new Map());
    const rectsCache = useRef<Map<string, DOMRect>>(new Map());
    const pitoElementsRef = useRef<Map<string, HTMLElement>>(new Map());
    const logicaRef = useRef(logica);
    useEffect(() => { logicaRef.current = logica; }, [logica]);

    const [grabando, setGrabando] = useState(false);
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);
    const grabandoRef = useRef(false);
    useEffect(() => { grabandoRef.current = grabando; }, [grabando]);

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
    // 🖐️ MOTOR DE INPUT PRO V6.1
    // =====================================================================
    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        const actualizarMapaColisiones = () => {
            const elPitos = tren.querySelectorAll('.pito-boton');
            rectsCache.current.clear();
            pitoElementsRef.current.clear();
            elPitos.forEach(el => {
                const pos = (el as HTMLElement).dataset.pos;
                if (pos) {
                    pitoElementsRef.current.set(pos, el as HTMLElement);
                    rectsCache.current.set(pos, el.getBoundingClientRect());
                }
            });
        };

        const interval = setInterval(actualizarMapaColisiones, 2000);
        window.addEventListener('resize', actualizarMapaColisiones);
        setTimeout(actualizarMapaColisiones, 500);

        const encontrarBotonEnPunto = (clientX: number, clientY: number): string | null => {
            const IMAN = 12; // Sensibilidad aumentada para móvil
            const list = Array.from(rectsCache.current.entries());
            // Buscamos de atrás hacia adelante (prioridad a los últimos en ser pintados)
            for (let i = list.length - 1; i >= 0; i--) {
                const [pos, rect] = list[i];
                if (clientX >= rect.left - IMAN && clientX <= rect.right + IMAN &&
                    clientY >= rect.top - IMAN && clientY <= rect.bottom + IMAN) {
                    return pos;
                }
            }
            return null;
        };

        const onDown = (e: PointerEvent) => {
            if (e.pointerType === 'mouse' && !e.isPrimary) return;
            e.preventDefault();
            motorAudioPro.activarContexto();

            const pos = encontrarBotonEnPunto(e.clientX, e.clientY);
            if (!pos) return;

            try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch (err) { console.debug("Pointer capture failed", err); }

            const musicalId = `${pos}-${logicaRef.current.direccion}`;
            pointersMap.current.set(e.pointerId, { pos, musicalId, lastX: e.clientX, lastY: e.clientY });

            logicaRef.current.actualizarBotonActivo(musicalId, 'add', null, true);
            actualizarVisualBoton(pos, true);
            registrarEvento('nota_on', { id: musicalId, pos });
        };

        const onMove = (e: PointerEvent) => {
            const data = pointersMap.current.get(e.pointerId);
            if (!data) return;

            const events = (e as any).getCoalescedEvents ? (e as any).getCoalescedEvents() : [e];

            for (const ev of events) {
                const checkPoints = [{ x: ev.clientX, y: ev.clientY }];

                // 💎 INTERPOLACIÓN MULTI-SEGMENTO (Anti-saltos)
                if (data.lastX !== undefined && data.lastY !== undefined) {
                    const dx = ev.clientX - data.lastX;
                    const dy = ev.clientY - data.lastY;
                    const d = Math.hypot(dx, dy);
                    if (d > 20) {
                        const steps = Math.min(3, Math.floor(d / 15));
                        for (let i = 1; i <= steps; i++) {
                            checkPoints.unshift({ x: data.lastX + (dx * (i / (steps + 1))), y: data.lastY + (dy * (i / (steps + 1))) });
                        }
                    }
                }

                for (const pt of checkPoints) {
                    const latest = pointersMap.current.get(e.pointerId);
                    if (!latest) continue;

                    const newPos = encontrarBotonEnPunto(pt.x, pt.y);
                    if (newPos !== latest.pos) {
                        if (latest.pos) {
                            logicaRef.current.actualizarBotonActivo(latest.musicalId, 'remove', null, true);
                            actualizarVisualBoton(latest.pos, false);
                            registrarEvento('nota_off', { id: latest.musicalId, pos: latest.pos });
                        }
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
                const fin = pointersMap.current.get(e.pointerId);
                if (fin) pointersMap.current.set(e.pointerId, { ...fin, lastX: ev.clientX, lastY: ev.clientY });
            }
        };

        const onUp = (e: PointerEvent) => {
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

        tren.addEventListener('pointerdown', onDown, { passive: false });
        tren.addEventListener('pointermove', onMove, { passive: false });
        tren.addEventListener('pointerup', onUp, { passive: false });
        tren.addEventListener('pointercancel', onUp, { passive: false });

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', actualizarMapaColisiones);
            tren.removeEventListener('pointerdown', onDown);
            tren.removeEventListener('pointermove', onMove);
            tren.removeEventListener('pointerup', onUp);
            tren.removeEventListener('pointercancel', onUp);
        };
    }, []);

    // --- FUELLE ---
    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        motorAudioPro.activarContexto();
        const root = document.querySelector('.simulador-app-root');
        if (root) {
            root.classList.remove('modo-halar', 'modo-empujar');
            root.classList.add(`modo-${nuevaDireccion}`);
        }
        motorAudioPro.detenerTodo(0.01);
        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                const nMusicalId = `${data.pos}-${nuevaDireccion}`;
                logicaRef.current.actualizarBotonActivo(nMusicalId, 'add', null, true);
                pointersMap.current.set(pId, { ...data, musicalId: nMusicalId });
            }
        });
        logicaRef.current.setDireccion(nuevaDireccion);
    };

    // --- FORMATEO Y ESTILOS ---
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
        const r = document.documentElement;
        r.style.setProperty('--escala-acordeon', escala.toString());
        r.style.setProperty('--distancia-h-pitos', `${distanciaH}vh`);
        r.style.setProperty('--distancia-v-pitos', `${distanciaV}vh`);
        r.style.setProperty('--distancia-h-bajos', `${distanciaHBajos}vh`);
        r.style.setProperty('--distancia-v-bajos', `${distanciaVBajos}vh`);
        r.style.setProperty('--offset-ios', alejarIOS ? '10px' : '0px');
        r.style.setProperty('--tamano-fuente-pitos', `${tamanoFuente}vh`);
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
            <div className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`} onPointerDown={() => manejarCambioFuelle('empujar')} onPointerUp={() => manejarCambioFuelle('halar')}>
                <span className="fuelle-status">{logica.direccion === 'empujar' ? 'CERRANDO' : 'ABRIENDO'}</span>
            </div>
            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    <BarraHerramientas logica={logica} x={x} marcoRef={marcoRef} escala={escala} setEscala={setEscala} distanciaH={distanciaH} setDistanciaH={setDistanciaH} distanciaV={distanciaV} setDistanciaV={setDistanciaV} distanciaHBajos={distanciaHBajos} setDistanciaHBajos={setDistanciaHBajos} distanciaVBajos={distanciaVBajos} setDistanciaVBajos={setDistanciaVBajos} alejarIOS={alejarIOS} setAlejarIOS={setAlejarIOS} modoVista={modoVista} setModoVista={setModoVista} mostrarOctavas={mostrarOctavas} setMostrarOctavas={setMostrarOctavas} tamanoFuente={tamanoFuente} setTamanoFuente={setTamanoFuente} vistaDoble={vistaDoble} setVistaDoble={setVistaDoble} grabando={grabando} toggleGrabacion={toggleGrabacion} />
                    <div className="diapason-marco" ref={marcoRef}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x }}>
                            <div className="hilera-pitos hilera-adentro">{h3.map(([pos, n]) => (<div key={pos} className="pito-boton" data-pos={pos}><span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span><span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span></div>))}</div>
                            <div className="hilera-pitos hilera-medio">{h2.map(([pos, n]) => (<div key={pos} className="pito-boton" data-pos={pos}><span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span><span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span></div>))}</div>
                            <div className="hilera-pitos hilera-afuera">{h1.map(([pos, n]) => (<div key={pos} className="pito-boton" data-pos={pos}><span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span><span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span></div>))}</div>
                        </motion.div>
                    </div>
                </div>
            </div>
            {!isLandscape && (<div className="overlay-rotacion"><div className="icono-rotar"><RotateCw size={80} /></div><h2>MODO HORIZONTAL</h2></div>)}
        </div>
    );
};

export default SimuladorApp;
