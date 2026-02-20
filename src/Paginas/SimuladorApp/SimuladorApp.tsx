/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V24.0 (Anti-Lag Nuclear)
 * 
 * CAMBIOS v24.0:
 * 1. 🛑 preventDefault() INMEDIATO al inicio de TODOS los handlers (Critical Fix Android Single-Touch).
 * 2. 🐭 MOUSE KILLER: Matar cualquier evento de mouse emulado para evitar doble disparo.
 * 3. 🔥 AUDIO PRE-HEAT: Iniciar Zombie Mode al primer toque en CUALQUIER lugar.
 * 4. 🧹 GC FRIENDLY: Bucles for optimizados y limpieza agresiva de punteros.
 * 5. 🔒 CSS INLINE: touchAction="none" en todos los elementos críticos.
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
    // 🚀 MOTOR DE INPUT PRO V24.0 (Zero-Lag + Anti-Scroll)
    // =====================================================================
    const activeNotesRef = useRef<Set<string>>(new Set());
    const rectsCache = useRef<Map<string, { left: number; right: number; top: number; bottom: number }>>(new Map());
    const lastTrenPos = useRef<{ left: number; top: number }>({ left: 0, top: 0 });

    // ⚡ BYPASS VISUAL: Referencias directas al DOM para evitar re-render de React al tocar fuelle
    const fuelleRef = useRef<HTMLDivElement>(null);
    const fuelleTextRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const marco = marcoRef.current;
        const tren = trenRef.current;
        if (!marco || !tren) return;

        const actualizarGeometria = () => {
            if (!tren) return;
            const trenRect = tren.getBoundingClientRect();
            const currentX = x.get();
            lastTrenPos.current = { left: trenRect.left - currentX, top: trenRect.top };
            rectsCache.current.clear();
            const botones = tren.querySelectorAll('.pito-boton');
            // Usar for loop clásico optimizado
            for (let i = 0; i < botones.length; i++) {
                const el = botones[i] as HTMLElement;
                const pos = el.dataset.pos;
                if (!pos) continue;
                const r = el.getBoundingClientRect();
                rectsCache.current.set(pos, {
                    left: r.left - (trenRect.left - currentX),
                    right: r.right - (trenRect.left - currentX),
                    top: r.top - trenRect.top,
                    bottom: r.bottom - trenRect.top
                });
            }
        };
        actualizarGeometria();
        window.addEventListener('resize', actualizarGeometria);
        const intervalGeometria = setInterval(actualizarGeometria, 5000);

        const obtenerBotonEnCoordenadas = (clientX: number, clientY: number): string | null => {
            const currentX = x.get();
            const trenLeft = lastTrenPos.current.left + currentX;
            const trenTop = lastTrenPos.current.top;
            const offsetX = clientX - trenLeft;
            const offsetY = clientY - trenTop;
            const MARGEN_ERROR = 15;

            // Iterador optimizado sin generar objetos entries()
            for (const [pos, r] of rectsCache.current) {
                if (offsetX >= r.left - MARGEN_ERROR && offsetX <= r.right + MARGEN_ERROR &&
                    offsetY >= r.top - MARGEN_ERROR && offsetY <= r.bottom + MARGEN_ERROR) {
                    return pos;
                }
            }
            return null;
        };

        const procesarEvento = (e: PointerEvent, tipo: 'down' | 'move' | 'up') => {
            const target = e.target as HTMLElement;

            // FILTROS
            if (target.closest('.barra-herramientas-contenedor')) return;
            if (target.closest('.indicador-fuelle')) {
                if (e.cancelable) e.preventDefault();
                return;
            }

            // 🛑 CRITICAL FIX: MATAR SCROLL INMEDIATAMENTE
            if (e.cancelable) e.preventDefault();

            const pId = e.pointerId;

            if (tipo === 'up') {
                const data = pointersMap.current.get(pId);
                if (data) {
                    if (data.pos) {
                        logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                        actualizarVisualBoton(data.pos, false);
                        activeNotesRef.current.delete(data.musicalId);
                        registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                    }
                    pointersMap.current.delete(pId);
                }
                try { if (target.hasPointerCapture(pId)) target.releasePointerCapture(pId); } catch (_) { }
                return;
            }

            const nuevaPos = obtenerBotonEnCoordenadas(e.clientX, e.clientY) || '';
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

                if (tipo === 'down' && target instanceof Element) {
                    try { target.setPointerCapture(pId); } catch (_) { }
                }

                // 🔥 Pre-Calentar Audio si es el primer toque
                if (activeNotesRef.current.size === 1) {
                    motorAudioPro.activarContexto();
                }
            } else {
                pointersMap.current.set(pId, { pos: '', musicalId: '' });
            }
        };

        // 🔥 HANDLERS AGRESIVOS: e.preventDefault() PRIMERO QUE TODO
        const handleDown = (e: PointerEvent) => {
            if (e.cancelable && !e.target?.['closest']?.('.barra-herramientas-contenedor')) e.preventDefault();
            // 🔊 iOS AUDIO RESUME HACK: Forzar resume() en cada toque sin esperar promesa
            motorAudioPro.contexto.resume().catch(() => { });
            procesarEvento(e, 'down');
        };
        const handleMove = (e: PointerEvent) => {
            if (e.cancelable && !e.target?.['closest']?.('.barra-herramientas-contenedor')) e.preventDefault();
            if (pointersMap.current.has(e.pointerId)) procesarEvento(e, 'move');
        };
        const handleUp = (e: PointerEvent) => {
            if (e.cancelable && !e.target?.['closest']?.('.barra-herramientas-contenedor')) e.preventDefault();
            if (pointersMap.current.has(e.pointerId)) procesarEvento(e, 'up');
        };

        const opts = { capture: true, passive: false };
        document.addEventListener('pointerdown', handleDown, opts);
        document.addEventListener('pointermove', handleMove, opts);
        document.addEventListener('pointerup', handleUp, opts);
        document.addEventListener('pointercancel', handleUp, opts);

        // 🍎 iOS SCROLL CANCELLATION EXTREME (User Request)
        // Específico para Safari: Matar scroll si hay 1 solo dedo
        const preventDefaultIOS = (e: TouchEvent) => {
            if ((e.target as HTMLElement).closest('.barra-herramientas-contenedor')) return;
            // Solo prevenir si es 1 dedo (scroll) - Multitoque suele ser gesto de app
            if (e.touches.length === 1 && e.cancelable) {
                e.preventDefault();
            }
            motorAudioPro.activarContexto();
        };
        // passive: false OBLIGATORIO para iOS
        window.addEventListener('touchstart', preventDefaultIOS, { passive: false });
        window.addEventListener('touchmove', preventDefaultIOS, { passive: false });

        // 🐭 MOUSE KILLER: Matar emulación de mouse para evitar doble disparo en Android
        const mouseKiller = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('.barra-herramientas-contenedor')) return;
            e.preventDefault();
            e.stopPropagation();
        };
        window.addEventListener('mousedown', mouseKiller, true);
        window.addEventListener('mousemove', mouseKiller, true);
        window.addEventListener('mouseup', mouseKiller, true);


        // 🔥 AUDIO & WAKE LOCK MANAGER (TRIPLE CAPA ANTI-LAG)
        const warmUpAudio = async () => {
            // 1. AudioContext Resume
            motorAudioPro.activarContexto().then(() => console.log("🔥 AudioCtx Resume OK"));

            // 2. Wake Lock API (Oficial)
            try {
                if ('wakeLock' in navigator) {
                    await (navigator as any).wakeLock.request('screen');
                    console.log("🔦 Screen Wake Lock ACTIVE");
                }
            } catch (err) {
                console.warn("Wake Lock Error:", err);
            }

            // 3. Fake Audio Playback (Bypass para Safari/Chrome Android Background)
            const audioFake = document.getElementById('silent-audio-loop') as HTMLAudioElement;
            if (audioFake) {
                audioFake.play().then(() => console.log("🔊 Silent Audio Loop STARTED")).catch(e => console.warn("Silent Audio Failed", e));
            }

            window.removeEventListener('pointerdown', warmUpAudio);
            window.removeEventListener('keydown', warmUpAudio);
        };
        window.addEventListener('pointerdown', warmUpAudio);
        window.addEventListener('keydown', warmUpAudio);

        return () => {
            clearInterval(intervalGeometria);
            window.removeEventListener('resize', actualizarGeometria);
            document.removeEventListener('pointerdown', handleDown, opts);
            document.removeEventListener('pointermove', handleMove, opts);
            document.removeEventListener('pointerup', handleUp, opts);
            document.removeEventListener('pointercancel', handleUp, opts);
            window.removeEventListener('touchstart', preventDefaultIOS);
            window.removeEventListener('touchmove', preventDefaultIOS);
            window.removeEventListener('mousedown', mouseKiller, true);
            window.removeEventListener('mousemove', mouseKiller, true);
            window.removeEventListener('mouseup', mouseKiller, true);
            window.removeEventListener('pointerdown', warmUpAudio);
            window.removeEventListener('keydown', warmUpAudio);
            // 🧹 LIMPIEZA DE EMERGENCIA
            pointersMap.current.clear();
            activeNotesRef.current.clear();
        };
    }, []);

    // ⚡ MANEJO OPTIMIZADO DEL FUELLE (Visual Bypass)
    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (nuevaDireccion === logicaRef.current.direccion) return;

        motorAudioPro.activarContexto();

        // Actualizamos estado lógico
        pointersMap.current.forEach((data, pId) => {
            if (data.pos) {
                const nextId = `${data.pos}-${nuevaDireccion}`;
                if (activeNotesRef.current.has(data.musicalId)) {
                    // Intercambio sin notas fantasma
                    logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                    activeNotesRef.current.delete(data.musicalId);

                    logicaRef.current.actualizarBotonActivo(nextId, 'add', null, true);
                    activeNotesRef.current.add(nextId);
                }
                pointersMap.current.set(pId, { ...data, musicalId: nextId });
            }
        });
        logicaRef.current.setDireccion(nuevaDireccion);

        // ⚡ ACTUALIZACIÓN VISUAL INSTANTÁNEA (DOM Directo)
        if (fuelleRef.current && fuelleTextRef.current) {
            if (nuevaDireccion === 'empujar') {
                fuelleRef.current.classList.add('empujar');
                fuelleRef.current.classList.remove('halar');
                fuelleTextRef.current.innerText = 'CERRANDO';
                document.querySelector('.simulador-app-root')?.classList.add('modo-empujar');
                document.querySelector('.simulador-app-root')?.classList.remove('modo-halar');
            } else {
                fuelleRef.current.classList.add('halar');
                fuelleRef.current.classList.remove('empujar');
                fuelleTextRef.current.innerText = 'ABRIENDO';
                document.querySelector('.simulador-app-root')?.classList.add('modo-halar');
                document.querySelector('.simulador-app-root')?.classList.remove('modo-empujar');
            }
        }
    };

    const agrupar = (fila: any[]) => {
        const p: Record<string, { halar: any, empujar: any }> = {};
        if (!fila) return [];
        fila.forEach(n => {
            const [f, c, d] = n.id.split('-');
            const pos = `${f}-${c}`;
            if (!p[pos]) p[pos] = { halar: null, empujar: null };
            if (d === 'halar') p[pos].halar = n; else p[pos].empujar = n;
        });
        return Object.entries(p).sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1]));
    };

    // Configuración de renderizado de etiquetas
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

    const h3 = React.useMemo(() => agrupar(logica.configTonalidad?.terceraFila), [logica.configTonalidad?.terceraFila]);
    const h2 = React.useMemo(() => agrupar(logica.configTonalidad?.segundaFila), [logica.configTonalidad?.segundaFila]);
    const h1 = React.useMemo(() => agrupar(logica.configTonalidad?.primeraFila), [logica.configTonalidad?.primeraFila]);

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

    return (
        <div className={`simulador-app-root modo-${logica.direccion}`} style={{ touchAction: 'none' }}>

            {/* 🔊 FAKE AUDIO LOOP: Truco para mantener el AudioContext vivo en fondo (iOS/Android) */}
            <audio
                id="silent-audio-loop"
                loop
                src="/audio/silence.mp3"
                style={{ display: 'none' }}
            />

            {/* 🪗 FUELLE OPTIMIZADO */}
            <div
                ref={fuelleRef}
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onPointerDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    (e.target as Element).setPointerCapture(e.pointerId);
                    manejarCambioFuelle('empujar');
                }}
                onPointerUp={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try { (e.target as Element).releasePointerCapture(e.pointerId); } catch (_) { }
                    manejarCambioFuelle('halar');
                }}
                onPointerCancel={(e) => {
                    e.preventDefault();
                    manejarCambioFuelle('halar');
                }}
                onContextMenu={(e) => e.preventDefault()}
                style={{ zIndex: 100, touchAction: 'none' }}
            >
                <span ref={fuelleTextRef} className="fuelle-status">
                    {logica.direccion === 'empujar' ? 'CERRANDO' : 'ABRIENDO'}
                </span>
            </div>

            <div className="contenedor-acordeon-completo" style={{ touchAction: 'none' }}>
                <div className="simulador-canvas" style={{ touchAction: 'none' }}>
                    <BarraHerramientas logica={logica} x={x} marcoRef={marcoRef} escala={escala} setEscala={setEscala} distanciaH={distanciaH} setDistanciaH={setDistanciaH} distanciaV={distanciaV} setDistanciaV={setDistanciaV} distanciaHBajos={distanciaHBajos} setDistanciaHBajos={setDistanciaHBajos} distanciaVBajos={distanciaVBajos} setDistanciaVBajos={setDistanciaVBajos} alejarIOS={alejarIOS} setAlejarIOS={setAlejarIOS} modoVista={modoVista} setModoVista={setModoVista} mostrarOctavas={mostrarOctavas} setMostrarOctavas={setMostrarOctavas} tamanoFuente={tamanoFuente} setTamanoFuente={setTamanoFuente} vistaDoble={vistaDoble} setVistaDoble={setVistaDoble} grabando={grabando} toggleGrabacion={toggleGrabacion} />
                    <div className="diapason-marco" ref={marcoRef} style={{ touchAction: 'none' }}>
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            style={{ x, touchAction: 'none' }}
                        >
                            <div className="hilera-pitos hilera-adentro" style={{ touchAction: 'none' }}>
                                {(h3 || []).map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos} style={{ touchAction: 'none' }}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-medio" style={{ touchAction: 'none' }}>
                                {(h2 || []).map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos} style={{ touchAction: 'none' }}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(n.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(n.empujar)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="hilera-pitos hilera-afuera" style={{ touchAction: 'none' }}>
                                {(h1 || []).map(([pos, n]) => (
                                    <div key={pos} className="pito-boton" data-pos={pos} style={{ touchAction: 'none' }}>
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
