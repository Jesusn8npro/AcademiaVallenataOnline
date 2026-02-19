/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V10.0 (Ghost Capture Engine)
 * 
 * ESTRATEGIA DE GRADO MILITAR CONTRA EL LAG DE CHROME:
 * 1. Global Touch Sentinel: Captura de baja latencia en la fase más temprana del navegador.
 * 2. Multi-Touch Emulation Logic: El sistema trata cada toque como prioritario.
 * 3. Bellows Sync: Restauración de lógica Pisar = Cerrar.
 * 4. RAF Sync: Sincronización de visuales a la tasa de refresco del hardware (60/120Hz).
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

    // 🗺️ REFS ESTRUCTURALES
    const touchesMap = useRef<Map<number, { pos: string; musicalId: string; lastX?: number; lastY?: number }>>(new Map());
    const localRectsRef = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
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
    // 🖐️ MOTOR DE INPUT V10.0 (GHOST CAPTURE ENGINE)
    // =====================================================================
    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

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

        const interval = setInterval(actualizarGeometriaLocal, 3000);
        window.addEventListener('resize', actualizarGeometriaLocal);
        setTimeout(actualizarGeometriaLocal, 500);

        const detectarEnPuntoLocal = (clientX: number, clientY: number): string | null => {
            const trenBase = tren.getBoundingClientRect();
            const relX = clientX - trenBase.left;
            const relY = clientY - trenBase.top;
            const IMAN = 18; // Sensibilidad ultra-optimizada

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

        // 🛡️ EL SECRETO: Listener de "Captura Temprana" en la ventana
        const handleGlobalTouch = (e: TouchEvent) => {
            const target = e.target as HTMLElement;
            // Solo intervenimos si es área de juego
            if (target.closest('.barra-herramientas-contenedor') ||
                target.closest('.menu-opciones-panel') ||
                target.closest('.modal-contenedor')) {
                return;
            }

            // ⛔ MATAMOS EL "DESEO" DE CHROME DE HACER OVERSCROLL O ESPERAR
            if (e.cancelable) e.preventDefault();

            if (e.type === 'touchstart' || e.type === 'touchmove') {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    const pos = detectarEnPuntoLocal(touch.clientX, touch.clientY);
                    const data = touchesMap.current.get(touch.identifier);

                    if (e.type === 'touchstart') {
                        motorAudioPro.activarContexto();
                        if (pos) {
                            const musicalId = `${pos}-${logicaRef.current.direccion}`;
                            touchesMap.current.set(touch.identifier, { pos, musicalId, lastX: touch.clientX, lastY: touch.clientY });
                            logicaRef.current.actualizarBotonActivo(musicalId, 'add', null, true);
                            actualizarVisualBoton(pos, true);
                            registrarEvento('nota_on', { id: musicalId, pos });
                        }
                    } else if (e.type === 'touchmove') {
                        if (!data) continue;

                        const newPos = detectarEnPuntoLocal(touch.clientX, touch.clientY);
                        if (newPos !== data.pos) {
                            if (data.pos) {
                                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                                actualizarVisualBoton(data.pos, false);
                                registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                            }
                            if (newPos) {
                                const newMusicalId = `${newPos}-${logicaRef.current.direccion}`;
                                touchesMap.current.set(touch.identifier, { pos: newPos, musicalId: newMusicalId, lastX: touch.clientX, lastY: touch.clientY });
                                logicaRef.current.actualizarBotonActivo(newMusicalId, 'add', null, true);
                                actualizarVisualBoton(newPos, true);
                                registrarEvento('nota_on', { id: newMusicalId, pos: newPos });
                            } else {
                                touchesMap.current.set(touch.identifier, { ...data, pos: '', musicalId: '' });
                            }
                        }
                    }
                }
            } else if (e.type === 'touchend' || e.type === 'touchcancel') {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    const data = touchesMap.current.get(touch.identifier);
                    if (data) {
                        if (data.pos) {
                            logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                            actualizarVisualBoton(data.pos, false);
                            registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                        }
                        touchesMap.current.delete(touch.identifier);
                    }
                }
            }
        };

        // 🛡️ REGISTRO DE ALTO NIVEL (Capture Phase)
        window.addEventListener('touchstart', handleGlobalTouch, { passive: false, capture: true });
        window.addEventListener('touchmove', handleGlobalTouch, { passive: false, capture: true });
        window.addEventListener('touchend', handleGlobalTouch, { passive: false, capture: true });
        window.addEventListener('touchcancel', handleGlobalTouch, { passive: false, capture: true });

        const block = (e: Event) => e.preventDefault();
        window.addEventListener('contextmenu', block);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', actualizarGeometriaLocal);
            window.removeEventListener('touchstart', handleGlobalTouch, { capture: true });
            window.removeEventListener('touchmove', handleGlobalTouch, { capture: true });
            window.removeEventListener('touchend', handleGlobalTouch, { capture: true });
            window.removeEventListener('touchcancel', handleGlobalTouch, { capture: true });
            window.removeEventListener('contextmenu', block);
        };
    }, []);

    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (nuevaDireccion === logicaRef.current.direccion) return;
        motorAudioPro.activarContexto();
        const root = document.querySelector('.simulador-app-root');
        if (root) {
            root.classList.remove('modo-halar', 'modo-empujar');
            root.classList.add(`modo-${nuevaDireccion}`);
        }
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
        <div className={`simulador-app-root capa-blindaje-total modo-${logica.direccion}`}>
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onPointerDown={(e) => { e.preventDefault(); manejarCambioFuelle('empujar'); }}
                onPointerUp={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onPointerLeave={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                style={{ touchAction: 'none' }}
            >
                <span className="fuelle-status">{logica.direccion === 'empujar' ? 'CERRANDO' : 'ABRIENDO'}</span>
            </div>

            <div className="contenedor-acordeon-completo" style={{ pointerEvents: 'none' }}>
                <div className="simulador-canvas" style={{ pointerEvents: 'none' }}>
                    <BarraHerramientas logica={logica} x={x} marcoRef={marcoRef} escala={escala} setEscala={setEscala} distanciaH={distanciaH} setDistanciaH={setDistanciaH} distanciaV={distanciaV} setDistanciaV={setDistanciaV} distanciaHBajos={distanciaHBajos} setDistanciaHBajos={setDistanciaHBajos} distanciaVBajos={distanciaVBajos} setDistanciaVBajos={setDistanciaVBajos} alejarIOS={alejarIOS} setAlejarIOS={setAlejarIOS} modoVista={modoVista} setModoVista={setModoVista} mostrarOctavas={mostrarOctavas} setMostrarOctavas={setMostrarOctavas} tamanoFuente={tamanoFuente} setTamanoFuente={setTamanoFuente} vistaDoble={vistaDoble} setVistaDoble={setVistaDoble} grabando={grabando} toggleGrabacion={toggleGrabacion} />
                    <div className="diapason-marco" ref={marcoRef} style={{ pointerEvents: 'none' }}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x, pointerEvents: 'none' }}>
                            <div className="hilera-pitos hilera-adentro" style={{ pointerEvents: 'none' }}>{h3.map(([pos, n]) => (<div key={pos} className="pito-boton" data-pos={pos} style={{ pointerEvents: 'none' }}><span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span><span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span></div>))}</div>
                            <div className="hilera-pitos hilera-medio" style={{ pointerEvents: 'none' }}>{h2.map(([pos, n]) => (<div key={pos} className="pito-boton" data-pos={pos} style={{ pointerEvents: 'none' }}><span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span><span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span></div>))}</div>
                            <div className="hilera-pitos hilera-afuera" style={{ pointerEvents: 'none' }}>{h1.map(([pos, n]) => (<div key={pos} className="pito-boton" data-pos={pos} style={{ pointerEvents: 'none' }}><span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span><span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span></div>))}</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {!isLandscape && (<div className="overlay-rotacion"><div className="icono-rotar"><RotateCw size={80} /></div><h2>HORIZONTAL</h2></div>)}
        </div>
    );
};

export default SimuladorApp;
