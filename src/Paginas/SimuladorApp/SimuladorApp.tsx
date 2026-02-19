/**
 * 🎹 SIMULADOR DE ACORDEÓN - MOTOR DE INPUT PRO V5.0
 *
 * Arquitectura basada en las mejores prácticas de pianos profesionales del navegador:
 * - Event Delegation: Un único listener en el contenedor padre gestiona TODOS los dedos.
 * - setPointerCapture: Garantiza tracking de cada dedo aunque salga del botón.
 * - Native DOM Events: Sin overhead de React por cada botón. Latencia ~0ms.
 * - touch-action: none en CSS: Elimina el delay de 300ms y el robo de gestos del browser.
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

    // Motion value para desplazamiento X
    const x = useMotionValue(0);

    // 🗺️ REFS CLAVE - Sin estado React para velocidad máxima
    /**
     * pointersMap: Rastrea cada dedo activo.
     * Clave: pointerId (número único por dedo)
     * Valor: { pos: idFísico del botón, musicalId: id con dirección del fuelle }
     */
    const pointersMap = useRef<Map<number, { pos: string; musicalId: string }>>(new Map());
    /** pitoElementsRef: Caché de elementos DOM para evitar querySelector en caliente */
    const pitoElementsRef = useRef<Map<string, HTMLElement>>(new Map());
    /** logicaRef: Ref estable a la lógica para usarla en event listeners nativos sin closures viejas */
    const logicaRef = useRef(logica);
    logicaRef.current = logica; // Actualizar en cada render sin re-crear listeners

    // --- GRABACIÓN ---
    const [grabando, setGrabando] = useState(false);
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);
    const grabandoRef = useRef(false);
    grabandoRef.current = grabando;

    // =====================================================================
    // 🎯 FUNCIONES AUXILIARES ULTRA-RÁPIDAS
    // =====================================================================

    /** Actualiza clase CSS directamente en el DOM - sin React, latencia ~0 */
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

    /** Obtiene el data-pos del elemento tocado, buscando hacia arriba en el árbol */
    const getPosFromEvent = (e: PointerEvent): string | null => {
        // e.target puede ser el span de texto interior, subimos con composedPath
        const path = e.composedPath() as HTMLElement[];
        for (const el of path) {
            if (el.dataset?.pos) return el.dataset.pos;
        }
        return null;
    };

    const registrarEvento = (tipo: 'nota_on' | 'nota_off' | 'fuelle', data: any) => {
        if (!grabandoRef.current) return;
        secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    };

    // =====================================================================
    // 🖐️ MOTOR DE INPUT NATIVO - EVENT DELEGATION EN EL TREN
    // =====================================================================
    useEffect(() => {
        const tren = trenRef.current;
        if (!tren) return;

        // 🚀 PRE-CACHÉ DE ELEMENTOS: Evita búsquedas en el DOM durante la ejecución
        const precargarPitos = () => {
            const elPitos = tren.querySelectorAll('.pito-boton');
            elPitos.forEach(el => {
                const pos = (el as HTMLElement).dataset.pos;
                if (pos) pitoElementsRef.current.set(pos, el as HTMLElement);
            });
        };
        // Un pequeño timeout para asegurar que React ya pintó los botones
        setTimeout(precargarPitos, 100);

        /**
         * POINTERDOWN: El dedo toca un botón.
         * - Activamos el audio context (por política de autoplay del browser)
         * - Capturamos el puntero (setPointerCapture) para seguirlo aunque salga del elemento
         * - Registramos en pointersMap y reproducimos nota
         */
        const onDown = (e: PointerEvent) => {
            e.preventDefault(); // 🛡️ Evita scroll, zoom, y el delay de 300ms del móvil
            motorAudioPro.activarContexto();

            const pos = getPosFromEvent(e);
            if (!pos) return;

            // Capturar el puntero: garantiza que TODOS los eventos futuros de este dedo
            // lleguen a este elemento, aunque el dedo se mueva fuera
            try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch { }

            const musicalId = `${pos}-${logicaRef.current.direccion}`;

            // Si ya había una nota activa para este puntero, la silenciamos primero
            const prev = pointersMap.current.get(e.pointerId);
            if (prev) {
                logicaRef.current.actualizarBotonActivo(prev.musicalId, 'remove', null, true);
                actualizarVisualBoton(prev.pos, false);
            }

            pointersMap.current.set(e.pointerId, { pos, musicalId });
            logicaRef.current.actualizarBotonActivo(musicalId, 'add', null, true);
            actualizarVisualBoton(pos, true);
            registrarEvento('nota_on', { id: musicalId, pos });
        };

        /**
         * POINTERMOVE: El dedo se mueve (glissando / trino).
         * - Comparamos la nueva posición con la anterior
         * - Si cambió de botón: apagamos el anterior, encendemos el nuevo
         * - CLAVE: Como el puntero está capturado, siempre recibimos este evento
         */
        const onMove = (e: PointerEvent) => {
            e.preventDefault();

            const prev = pointersMap.current.get(e.pointerId);
            if (!prev) return; // Este puntero no está activo en el tren

            // Obtenemos el elemento debajo del dedo usando el punto exacto de contacto
            // Necesitamos soltar temporalmente la captura para que elementFromPoint funcione
            // PERO eso causa parpadeo, así que usamos el hit-testing con elementFromPoint
            // sobre el documento completo (rápido porque ya tenemos coordenadas)
            const elBajo = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
            let newPos: string | null = null;
            if (elBajo) {
                // Buscar data-pos en el elemento o sus ancestros (el dedo puede estar sobre el texto)
                let el: HTMLElement | null = elBajo;
                while (el && el !== tren.parentElement) {
                    if (el.dataset?.pos) { newPos = el.dataset.pos; break; }
                    el = el.parentElement;
                }
            }

            if (newPos === prev.pos) return; // No cambió de botón, nada que hacer

            // Apagar nota anterior
            logicaRef.current.actualizarBotonActivo(prev.musicalId, 'remove', null, true);
            actualizarVisualBoton(prev.pos, false);
            registrarEvento('nota_off', { id: prev.musicalId, pos: prev.pos });

            if (newPos) {
                // Encender nota nueva con la dirección del fuelle ACTUAL
                const newMusicalId = `${newPos}-${logicaRef.current.direccion}`;
                pointersMap.current.set(e.pointerId, { pos: newPos, musicalId: newMusicalId });
                logicaRef.current.actualizarBotonActivo(newMusicalId, 'add', null, true);
                actualizarVisualBoton(newPos, true);
                registrarEvento('nota_on', { id: newMusicalId, pos: newPos });
            } else {
                // El dedo salió del área del tren
                pointersMap.current.delete(e.pointerId);
            }
        };

        /**
         * POINTERUP / POINTERCANCEL: El dedo se levanta o es cancelado por el sistema.
         * - Apagamos la nota y limpiamos el mapa
         * - pointercancel puede ocurrir cuando el sistema operativo interrumpe (llamada, notificación)
         */
        const onUp = (e: PointerEvent) => {
            e.preventDefault();
            const data = pointersMap.current.get(e.pointerId);
            if (data) {
                logicaRef.current.actualizarBotonActivo(data.musicalId, 'remove', null, true);
                actualizarVisualBoton(data.pos, false);
                registrarEvento('nota_off', { id: data.musicalId, pos: data.pos });
                pointersMap.current.delete(e.pointerId);
            }
        };

        // 🔑 CRÍTICO: Usamos el tren (contenedor) como delegado.
        // Un solo set de listeners maneja absolutamente todos los dedos.
        // { passive: false } es OBLIGATORIO para poder llamar preventDefault()
        tren.addEventListener('pointerdown', onDown, { passive: false });
        tren.addEventListener('pointermove', onMove, { passive: false });
        tren.addEventListener('pointerup', onUp, { passive: false });
        tren.addEventListener('pointercancel', onUp, { passive: false });

        return () => {
            tren.removeEventListener('pointerdown', onDown);
            tren.removeEventListener('pointermove', onMove);
            tren.removeEventListener('pointerup', onUp);
            tren.removeEventListener('pointercancel', onUp);
        };
    }, []); // Sin dependencias: se monta UNA sola vez. logicaRef asegura valores frescos.

    // =====================================================================
    // 🌬️ CAMBIO DE FUELLE - Sincroniza notas activas con nueva dirección
    // =====================================================================
    /**
     * CRÍTICO: Cuando cambia el fuelle mientras hay dedos presionados,
     * necesitamos actualizar los musicalIds de TODOS los dedos activos.
     */
    const manejarCambioFuelle = (nuevaDireccion: 'halar' | 'empujar') => {
        if (nuevaDireccion === logicaRef.current.direccion) return;

        motorAudioPro.activarContexto();

        // 🚀 CAMBIO DE CLASE INSTANTÁNEO EN EL DOM (Sin esperar a React)
        const root = document.querySelector('.simulador-app-root');
        if (root) {
            root.classList.remove('modo-halar', 'modo-empujar');
            root.classList.add(`modo-${nuevaDireccion}`);
        }

        // 🧹 LIMPIEZA SÓNICA: Detener todas las voces en curso
        motorAudioPro.detenerTodo(0.015);

        // Actualizar musicalIds de dedos activos
        pointersMap.current.forEach((data, pointerId) => {
            const newMusicalId = `${data.pos}-${nuevaDireccion}`;
            logicaRef.current.actualizarBotonActivo(newMusicalId, 'add', null, true);
            pointersMap.current.set(pointerId, { pos: data.pos, musicalId: newMusicalId });
        });

        logicaRef.current.setDireccion(nuevaDireccion);
    };

    // =====================================================================
    // 🎼 FORMATEO DE NOTAS
    // =====================================================================
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
                const octava = Math.floor((n + 0.5) / 12) - 1;
                return `${base}${octava}`;
            }
        }
        return base;
    };

    // =====================================================================
    // ⚙️ EFECTOS DE CSS Y ORIENTACIÓN
    // =====================================================================
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

    // =====================================================================
    // 🎙️ GRABACIÓN DE SECUENCIAS
    // =====================================================================
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

    // 🛡️ LIMPIEZA DE SEGURIDAD: Si cambiamos de instrumento o tonalidad, reseteamos todo
    useEffect(() => {
        motorAudioPro.detenerTodo(0.01);
        pointersMap.current.clear();
        pitoElementsRef.current.forEach(el => el.classList.remove('nota-activa'));
    }, [logica.instrumentoId, logica.tonalidadSeleccionada]);

    // =====================================================================
    // 🎹 DATOS DE LAS HILERAS (Agrupados por posición física)
    // =====================================================================
    const agruparNotas = (fila: any[]) => {
        const porPos: Record<string, { halar: any, empujar: any }> = {};
        fila?.forEach(nota => {
            const [f, c, dir] = nota.id.split('-');
            const pos = `${f}-${c}`;
            if (!porPos[pos]) porPos[pos] = { halar: null, empujar: null };
            if (dir === 'halar') porPos[pos].halar = nota;
            else if (dir === 'empujar') porPos[pos].empujar = nota;
        });
        return Object.entries(porPos).sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1]));
    };

    const h3 = React.useMemo(() => agruparNotas(logica.configTonalidad?.terceraFila), [logica.configTonalidad?.terceraFila]);
    const h2 = React.useMemo(() => agruparNotas(logica.configTonalidad?.segundaFila), [logica.configTonalidad?.segundaFila]);
    const h1 = React.useMemo(() => agruparNotas(logica.configTonalidad?.primeraFila), [logica.configTonalidad?.primeraFila]);

    // =====================================================================
    // 🖥️ RENDER
    // =====================================================================
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
                         * 🔑 EL TREN ES EL DELEGADO DE EVENTOS.
                         * NO hay onPointerDown en los botones individuales.
                         * Los listeners nativos (useEffect de arriba) manejan todo.
                         * Esto elimina el overhead de React por botón y garantiza
                         * latencia mínima para trinos profesionales.
                         */}
                        <motion.div
                            ref={trenRef}
                            className="tren-botones-deslizable"
                            style={{ x }}
                        >
                            {/* HILERA 3 - ADENTRO */}
                            <div className="hilera-pitos hilera-adentro">
                                {h3.map(([pos, notas]) => (
                                    <div key={pos} className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`} data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(notas.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(notas.empujar)}</span>
                                        {vistaDoble && (
                                            <div className="contenedor-nota-doble">
                                                <span className="nota-halar">{formatearEtiquetaNota(notas.halar)}</span>
                                                <span className="nota-empujar">{formatearEtiquetaNota(notas.empujar)}</span>
                                            </div>
                                        )}
                                        {notas.halar?.tecla && !vistaDoble && <span className="tecla-computador">{notas.halar.tecla}</span>}
                                    </div>
                                ))}
                            </div>

                            {/* HILERA 2 - MEDIO */}
                            <div className="hilera-pitos hilera-medio">
                                {h2.map(([pos, notas]) => (
                                    <div key={pos} className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`} data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(notas.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(notas.empujar)}</span>
                                        {vistaDoble && (
                                            <div className="contenedor-nota-doble">
                                                <span className="nota-halar">{formatearEtiquetaNota(notas.halar)}</span>
                                                <span className="nota-empujar">{formatearEtiquetaNota(notas.empujar)}</span>
                                            </div>
                                        )}
                                        {notas.halar?.tecla && !vistaDoble && <span className="tecla-computador">{notas.halar.tecla}</span>}
                                    </div>
                                ))}
                            </div>

                            {/* HILERA 1 - AFUERA */}
                            <div className="hilera-pitos hilera-afuera">
                                {h1.map(([pos, notas]) => (
                                    <div key={pos} className={`pito-boton ${vistaDoble ? 'vista-doble' : ''}`} data-pos={pos}>
                                        <span className="nota-etiqueta label-halar">{formatearEtiquetaNota(notas.halar)}</span>
                                        <span className="nota-etiqueta label-empujar">{formatearEtiquetaNota(notas.empujar)}</span>
                                        {vistaDoble && (
                                            <div className="contenedor-nota-doble">
                                                <span className="nota-halar">{formatearEtiquetaNota(notas.halar)}</span>
                                                <span className="nota-empujar">{formatearEtiquetaNota(notas.empujar)}</span>
                                            </div>
                                        )}
                                        {notas.halar?.tecla && !vistaDoble && <span className="tecla-computador">{notas.halar.tecla}</span>}
                                    </div>
                                ))}
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
