/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V6.0
 *
 * ARQUITECTURA FINAL basada en las técnicas de pianos virtuales de mayor rendimiento:
 *
 * PROBLEMA IDENTIFICADO: En versiones anteriores, el hit-testing en onMove
 * usaba document.elementFromPoint() que es LENTO y falla con setPointerCapture.
 * Cuando capturamos el puntero, el browser redirige TODOS los eventos a ese elemento,
 * pero elementFromPoint aún devuelve el elemento del DOM debajo, causando inconsistencias.
 *
 * SOLUCIÓN: PRE-CALCULAR y CACHEAR todos los DOMRect de los botones usando getBoundingClientRect()
 * UNA SOLA VEZ cuando el layout se asienta, y luego hacer hit-testing PURO MATEMÁTICO
 * en el movimiento (comparación de números, sin tocar el DOM).
 *
 * Esto es exactamente lo que hacen los motores de piano HTML5 más rápidos.
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

    // =========================================================================
    // 🗺️ REFS DE PERFORMANCE - Toda la lógica caliente vive aquí
    // =========================================================================

    /**
     * pitoRectsCache: El corazón del sistema de hit-testing.
     * Mapa de { pos -> { rect: DOMRect, element: HTMLElement } }
     * Se construye UNA VEZ y se actualiza solo al cambiar el layout.
     * La búsqueda en onMove es pura matemática, sin tocar el DOM.
     */
    const pitoRectsCache = useRef<Map<string, { rect: DOMRect; el: HTMLElement }>>(new Map());

    /**
     * pointersMap: Rastrea cada dedo activo.
     * { pointerId -> { pos, musicalId } }
     */
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string }>>(new Map());

    /**
     * logicaRef: Referencia estable a la lógica para event listeners nativos.
     * Siempre apunta al valor más reciente sin necesidad de recrear listeners.
     */
    const logicaRef = useRef(logica);
    logicaRef.current = logica;

    // --- GRABACIÓN ---
    const [grabando, setGrabando] = useState(false);
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);
    const grabandoRef = useRef(false);
    grabandoRef.current = grabando;

    // =========================================================================
    // 📐 SISTEMA DE CACHÉ DE RECTÁNGULOS
    // =========================================================================

    /**
     * Construye o actualiza la caché de rectángulos de todos los botones.
     * IMPORTANTE: Llamar después de que el DOM esté asentado.
     */
    const reconstruirCache = () => {
        const nuevaCache = new Map<string, { rect: DOMRect; el: HTMLElement }>();
        document.querySelectorAll<HTMLElement>('[data-pos]').forEach((el) => {
            const pos = el.dataset.pos;
            if (pos) {
                nuevaCache.set(pos, { rect: el.getBoundingClientRect(), el });
            }
        });
        pitoRectsCache.current = nuevaCache;
    };

    /**
     * Encuentra el data-pos debajo de las coordenadas usando hit-testing matemático.
     * SIN tocar el DOM. Solo comparación de números. Latencia: ~0.001ms
     */
    const hitTest = (clientX: number, clientY: number): string | null => {
        for (const [pos, { rect }] of pitoRectsCache.current) {
            if (
                clientX >= rect.left &&
                clientX <= rect.right &&
                clientY >= rect.top &&
                clientY <= rect.bottom
            ) {
                return pos;
            }
        }
        return null;
    };

    // =========================================================================
    // 🎯 FUNCIONES AUXILIARES ULTRA-RÁPIDAS
    // =========================================================================

    /** Actualiza clase CSS directamente — sin React, latencia ~0 */
    const setBotonActivo = (pos: string, activo: boolean) => {
        const cached = pitoRectsCache.current.get(pos);
        if (cached?.el) {
            if (activo) cached.el.classList.add('nota-activa');
            else cached.el.classList.remove('nota-activa');
        }
    };

    const registrarEvento = (tipo: 'nota_on' | 'nota_off' | 'fuelle', data: any) => {
        if (!grabandoRef.current) return;
        secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    };

    // =========================================================================
    // 🖐️ MOTOR DE INPUT NATIVO V6 - EVENT DELEGATION + HIT-TESTING MATEMÁTICO
    // =========================================================================
    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        // Construir la caché inicial con delay para que el layout esté asentado
        const timer = setTimeout(reconstruirCache, 300);

        /**
         * ⬇️ POINTERDOWN: El dedo toca la pantalla.
         *
         * CRÍTICO: NO usamos setPointerCapture aquí porque con captura,
         * el browser redirige todos los eventos al elemento capturado,
         * pero NOSOTROS queremos hacer hit-testing libre en el onMove.
         * En cambio, usamos Event Delegation sobre el tren para recibir
         * todos los pointermove aunque el dedo se salga de un botón.
         */
        const onDown = (e: PointerEvent) => {
            e.preventDefault(); // Bloquea scroll, zoom y delay de 300ms en móvil

            motorAudioPro.activarContexto();

            // Hit-test matemático: ¿en qué botón cayó el dedo?
            const pos = hitTest(e.clientX, e.clientY);
            if (!pos) return;

            const musicalId = `${pos}-${logicaRef.current.direccion}`;

            // Si este puntero ya tenía una nota, apagarla primero
            const prev = pointersMap.current.get(e.pointerId);
            if (prev) {
                logicaRef.current.actualizarBotonActivo(prev.musicalId, 'remove', null, true);
                setBotonActivo(prev.pos, false);
            }

            // Registrar el nuevo estado
            pointersMap.current.set(e.pointerId, { pos, musicalId });
            logicaRef.current.actualizarBotonActivo(musicalId, 'add', null, true);
            setBotonActivo(pos, true);
            registrarEvento('nota_on', { id: musicalId, pos });
        };

        /**
         * ↔️ POINTERMOVE: El dedo se desliza (glissando / trino).
         *
         * TÉCNICA CLAVE: Hit-testing matemático puro.
         * No tocamos el DOM. Solo comparamos números.
         * Esto permite detectar cambios de botón a velocidades extremas.
         */
        const onMove = (e: PointerEvent) => {
            e.preventDefault();

            const prev = pointersMap.current.get(e.pointerId);
            if (!prev) return; // Este puntero no está activo

            // Hit-test matemático con las coordenadas actuales del dedo
            const newPos = hitTest(e.clientX, e.clientY);

            // ¿El dedo cambió de botón?
            if (newPos === prev.pos) return;

            // Apagar nota anterior
            logicaRef.current.actualizarBotonActivo(prev.musicalId, 'remove', null, true);
            setBotonActivo(prev.pos, false);
            registrarEvento('nota_off', { id: prev.musicalId, pos: prev.pos });

            if (newPos) {
                // Encender nota nueva con la dirección del fuelle ACTUAL
                const newMusicalId = `${newPos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos: newPos, musicalId: newMusicalId });
                logicaRef.current.actualizarBotonActivo(newMusicalId, 'add', null, true);
                setBotonActivo(newPos, true);
                registrarEvento('nota_on', { id: newMusicalId, pos: newPos });
            } else {
                // El dedo salió del área: limpiar sin activar nada
                pointersMap.current.delete(e.pointerId);
            }
        };

        /**
         * ⬆️ POINTERUP / POINTERCANCEL: El dedo se levanta.
         * pointercancel ocurre cuando el OS interrumpe (llamada, notificación, gesto del sistema)
         */
        const onUp = (e: PointerEvent) => {
            e.preventDefault();

            const data = pointersMap.current.get(e.pointerId);
            if (data) {
                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                setBotonActivo(data.pos, false);
                registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                pointersMap.current.delete(e.pointerId);
            }
        };

        /**
         * ESTRATEGIA DE LISTENERS:
         * - pointerdown/up/cancel en el TREN (delegado de todos los botones)
         * - pointermove en WINDOW para capturar movimientos fuera del tren
         *   (cuando el dedo se mueve muy rápido y sale del tren brevemente)
         *
         * { passive: false } es OBLIGATORIO para poder usar e.preventDefault()
         */
        tren.addEventListener('pointerdown', onDown, { passive: false });
        window.addEventListener('pointermove', onMove, { passive: false });
        window.addEventListener('pointerup', onUp, { passive: false });
        window.addEventListener('pointercancel', onUp, { passive: false });

        return () => {
            clearTimeout(timer);
            tren.removeEventListener('pointerdown', onDown);
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointercancel', onUp);
        };
    }, []); // Se monta UNA sola vez. logicaRef garantiza valores frescos.

    // =========================================================================
    // 🌬️ CAMBIO DE FUELLE - Sincroniza notas activas con nueva dirección
    // =========================================================================
    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        motorAudioPro.activarContexto();
        if (nuevaDireccion === logicaRef.current.direccion) return;

        // Reconectar TODAS las notas activas con la nueva dirección del fuelle
        pointersMap.current.forEach((data, pointerId) => {
            logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
            const newMusicalId = `${data.pos}-${nuevaDireccion}`;
            logicaRef.current.actualizarBotonActivo(newMusicalId, 'add', null, true);
            pointersMap.current.set(pointerId, { pos: data.pos, musicalId: newMusicalId });
        });

        logicaRef.current.setDireccion(nuevaDireccion);
    };

    // =========================================================================
    // ⚙️ EFECTOS DE CSS, ORIENTACIÓN Y CACHÉ
    // =========================================================================
    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--escala-acordeon', escala.toString());
        root.style.setProperty('--distancia-h-pitos', `${distanciaH}vh`);
        root.style.setProperty('--distancia-v-pitos', `${distanciaV}vh`);
        root.style.setProperty('--distancia-h-bajos', `${distanciaHBajos}vh`);
        root.style.setProperty('--distancia-v-bajos', `${distanciaVBajos}vh`);
        root.style.setProperty('--offset-ios', alejarIOS ? '10px' : '0px');
        root.style.setProperty('--tamano-fuente-pitos', `${tamanoFuente}vh`);
        // Reconstruir caché cuando cambia el layout
        setTimeout(reconstruirCache, 300);
    }, [escala, distanciaH, distanciaV, distanciaHBajos, distanciaVBajos, alejarIOS, tamanoFuente]);

    useEffect(() => {
        const onResize = () => {
            setIsLandscape(window.innerWidth > window.innerHeight);
            // Reconstruir caché cuando rota la pantalla
            setTimeout(reconstruirCache, 500);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    // Reconstruir caché también cuando cambia la dirección del fuelle
    // (los botones se re-renderizan con nuevas notas)
    useEffect(() => {
        setTimeout(reconstruirCache, 100);
    }, [logica.direccion]);

    // =========================================================================
    // 🎼 FORMATEO DE NOTAS
    // =========================================================================
    const CIFRADO_AMERICANO: Record<string, string> = {
        'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
        'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab',
        'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
    };

    const formatearEtiquetaNota = (notaRaw: any) => {
        if (!notaRaw) return '';
        const soloNota = (notaRaw.nombre || '').split(' ')[0];
        const baseNorm = soloNota.charAt(0).toUpperCase() + soloNota.slice(1).toLowerCase();
        let base = modoVista === 'cifrado' ? (CIFRADO_AMERICANO[baseNorm] || baseNorm) : baseNorm;
        if (mostrarOctavas) {
            const freq = Array.isArray(notaRaw.frecuencia) ? notaRaw.frecuencia[0] : notaRaw.frecuencia;
            if (freq > 0) {
                const n = 12 * (Math.log(freq / 440) / Math.log(2)) + 69;
                return `${base}${Math.floor((n + 0.5) / 12) - 1}`;
            }
        }
        return base;
    };

    // =========================================================================
    // 🎙️ GRABACIÓN DE SECUENCIAS
    // =========================================================================
    const toggleGrabacion = () => {
        if (!grabando) {
            secuenciaRef.current = [];
            tiempoInicioRef.current = Date.now();
            setGrabando(true);
        } else {
            setGrabando(false);
            const seq = secuenciaRef.current;
            if (seq.length > 0) {
                const blob = new Blob([JSON.stringify(seq)], { type: 'application/json' });
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                a.download = `secuencia_acordeon_${Date.now()}.json`;
                a.click();
                alert('✅ Secuencia guardada.');
            }
        }
    };

    useEffect(() => {
        if (grabando) registrarEvento('fuelle', { direccion: logica.direccion });
    }, [logica.direccion, grabando]);

    // =========================================================================
    // 🎹 DATOS DE LAS HILERAS
    // =========================================================================
    const pitosAfuera = logica.configTonalidad?.primeraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosMedio = logica.configTonalidad?.segundaFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];
    const pitosAdentro = logica.configTonalidad?.terceraFila?.filter((n: any) => n.id.includes(logica.direccion)) || [];

    // =========================================================================
    // 🖥️ RENDER
    // =========================================================================
    return (
        <div className={`simulador-app-root capa-blindaje-total modo-${logica.direccion}`}>

            {/* 🌬️ INDICADOR DE FUELLE */}
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onPointerDown={(e) => { e.preventDefault(); manejarCambioFuelle('empujar'); }}
                onPointerUp={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onPointerLeave={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
                onPointerCancel={(e) => { e.preventDefault(); manejarCambioFuelle('halar'); }}
            >
                <span className="fuelle-status">
                    {logica.direccion === 'empujar' ? 'EMPUJAR (CERRANDO)' : 'HALAR (ABRIENDO)'}
                </span>
            </div>

            {/* 🪗 CONTENEDOR DEL ACORDEÓN */}
            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
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
                        modoVista={modoVista}
                        setModoVista={setModoVista}
                        mostrarOctavas={mostrarOctavas}
                        setMostrarOctavas={setMostrarOctavas}
                        tamanoFuente={tamanoFuente}
                        setTamanoFuente={setTamanoFuente}
                        vistaDoble={vistaDoble}
                        setVistaDoble={setVistaDoble}
                        grabando={grabando}
                        toggleGrabacion={toggleGrabacion}
                    />

                    <div className="diapason-marco" ref={marcoRef}>
                        {/*
                         * 🔑 EL TREN COMO DELEGADO DE EVENTOS
                         * Los listeners nativos en useEffect gestionan todo.
                         * Los botones NO tienen onPointerDown en React.
                         * La caché pitoRectsCache permite hit-testing matemático
                         * de latencia ultra-cero en cada movimiento del dedo.
                         */}
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            style={{ x }}
                        >
                            {/* HILERA 3 - ADENTRO */}
                            <div className="hilera-pitos hilera-adentro">
                                {pitosAdentro.map((nota: any) => {
                                    const idBase = nota.id.split('-').slice(0, 2).join('-');
                                    const notaH = logica.configTonalidad.terceraFila.find((n: any) => n.id === `${idBase}-halar`);
                                    const notaE = logica.configTonalidad.terceraFila.find((n: any) => n.id === `${idBase}-empujar`);
                                    return (
                                        <div key={idBase} className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`} data-pos={idBase}>
                                            {!vistaDoble ? (
                                                <span className="nota-etiqueta">{formatearEtiquetaNota(nota)}</span>
                                            ) : (
                                                <div className="contenedor-nota-doble">
                                                    <span className="nota-halar">{formatearEtiquetaNota(notaH)}</span>
                                                    <span className="nota-empujar">{formatearEtiquetaNota(notaE)}</span>
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
                                    const notaH = logica.configTonalidad.segundaFila.find((n: any) => n.id === `${idBase}-halar`);
                                    const notaE = logica.configTonalidad.segundaFila.find((n: any) => n.id === `${idBase}-empujar`);
                                    return (
                                        <div key={idBase} className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`} data-pos={idBase}>
                                            {!vistaDoble ? (
                                                <span className="nota-etiqueta">{formatearEtiquetaNota(nota)}</span>
                                            ) : (
                                                <div className="contenedor-nota-doble">
                                                    <span className="nota-halar">{formatearEtiquetaNota(notaH)}</span>
                                                    <span className="nota-empujar">{formatearEtiquetaNota(notaE)}</span>
                                                </div>
                                            )}
                                            {nota.tecla && !vistaDoble && <span className="tecla-computador">{nota.tecla}</span>}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* HILERA 1 - AFUERA */}
                            <div className="hilera-pitos hilera-afuera">
                                {pitosAfuera.map((nota: any) => {
                                    const idBase = nota.id.split('-').slice(0, 2).join('-');
                                    const notaH = logica.configTonalidad.primeraFila.find((n: any) => n.id === `${idBase}-halar`);
                                    const notaE = logica.configTonalidad.primeraFila.find((n: any) => n.id === `${idBase}-empujar`);
                                    return (
                                        <div key={idBase} className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`} data-pos={idBase}>
                                            {!vistaDoble ? (
                                                <span className="nota-etiqueta">{formatearEtiquetaNota(nota)}</span>
                                            ) : (
                                                <div className="contenedor-nota-doble">
                                                    <span className="nota-halar">{formatearEtiquetaNota(notaH)}</span>
                                                    <span className="nota-empujar">{formatearEtiquetaNota(notaE)}</span>
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
