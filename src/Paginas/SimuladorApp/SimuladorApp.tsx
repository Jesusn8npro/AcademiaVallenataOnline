/**
 * 🎹 SIMULADOR DE ACORDEÓN PRO - V19.2 (Optimizado)
 */
import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';

// Hooks de Lógica
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { motorAudioPro } from '../SimuladorDeAcordeon/AudioEnginePro';
import { usePointerAcordeon } from './Hooks/usePointerAcordeon';

// Componentes UI
import BarraHerramientas from './Componentes/BarraHerramientas';
import ContenedorBajos from './Componentes/ContenedorBajos';

import MenuOpciones from './Componentes/MenuOpciones';
import ModalContacto from './Componentes/ModalContacto';
import ModalTonalidades from './Componentes/ModalTonalidades';
import ModalVista from './Componentes/ModalVista';
import ModalMetronomo from './Componentes/ModalMetronomo';
import ModalInstrumentos from './Componentes/ModalInstrumentos';

import './SimuladorApp.css';

const SimuladorApp: React.FC = () => {
    // 1. Estado de la Lógica Musical
    const logica = useLogicaAcordeon({
        onNotaPresionada: (data) => {
            const esBajo = data.idBoton.includes('-bajo');
            const pos = data.idBoton.split('-').slice(0, 2).join('-');
            actualizarVisualBoton(pos, true, esBajo);
        },
        onNotaLiberada: (data) => {
            const esBajo = data.idBoton.includes('-bajo');
            const pos = data.idBoton.split('-').slice(0, 2).join('-');
            actualizarVisualBoton(pos, false, esBajo);
        }
    });

    // 2. Estados de UI y Configuración
    const [escala, setEscala] = useState(1.0);
    const [config, setConfig] = useState({
        modoVista: 'notas' as 'notas' | 'cifrado' | 'numeros' | 'teclas',
        mostrarOctavas: false,
        vistaDoble: false
    });

    const [modales, setModales] = useState({
        menu: false,
        tonalidades: false,
        vista: false,
        metronomo: false,
        instrumentos: false,
        contacto: false
    });

    const [bajosVisible, setBajosVisible] = useState(false);
    const [bpmMetronomo, setBpmMetronomo] = useState(80);
    const [grabando, setGrabando] = useState(false);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    // 3. Refs y MotionValues
    const x = useMotionValue(0);
    const trenRef = useRef<HTMLDivElement>(null);
    const audioContextIniciadoRef = useRef(false);
    const [audioListo, setAudioListo] = useState(false);
    const refsModales = {
        menu: useRef(null),
        tonalidades: useRef(null),
        metronomo: useRef(null),
        instrumentos: useRef(null),
        vista: useRef(null)
    };
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);

    // 4. Caché de elementos DOM para evitar querySelectorAll en cada toque
    const elementosCache = useRef<Map<string, { pito: Element | null; bajo: Element | null }>>(new Map());

    // ⚡ Utilidades optimizadas con useCallback
    const actualizarVisualBoton = useCallback((pos: string, activo: boolean, esBajo: boolean) => {
        let cached = elementosCache.current.get(pos);

        // Primera búsqueda: cachear los elementos
        if (!cached) {
            const pito = document.querySelector(`.pito-boton[data-pos="${pos}"]`);
            const bajo = document.querySelector(`.boton-bajo-contenedor[data-pos="${pos}"]`);
            cached = { pito, bajo };
            elementosCache.current.set(pos, cached);
        }

        // Actualizar clases (muy rápido porque ya tenemos el ref)
        if (esBajo && cached.bajo) {
            activo ? cached.bajo.classList.add('activo') : cached.bajo.classList.remove('activo');
        } else if (!esBajo && cached.pito) {
            activo ? cached.pito.classList.add('nota-activa') : cached.pito.classList.remove('nota-activa');
        }
    }, []);

    const registrarEvento = useCallback((tipo: string, data: any) => {
        if (grabando) secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    }, [grabando]);

    // 🌟 FUNCIÓN PARA FORMATEAR EL NOMBRE DE LA NOTA SEGÚN EL MODO
    const formatearNombreNota = (notaObj: any, modo: string, mostrarOctavas: boolean) => {
        if (!notaObj) return '';

        let nombre = notaObj.nombre || ''; // "Do 4", "La# 5", etc.
        const partes = nombre.split(' ');
        let notaBase = partes[0];
        const octava = partes[1] || '';

        // 1. MODO CIFRADO (C, D, E...)
        if (modo === 'cifrado') {
            const MAPA_CIFRADO: Record<string, string> = {
                'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
                'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
            };
            notaBase = MAPA_CIFRADO[notaBase] || notaBase;
        }

        return mostrarOctavas ? `${notaBase}${octava}` : notaBase;
    };

    // ⚡ Memoizar si está desactivado audio (evitar recalcular en cada render)
    const desactivarAudio = useMemo(() => Object.values(modales).some(v => v), [modales]);

    // 5. Hook de Entrada (PointerEvents Engine)
    const { manejarCambioFuelle, limpiarGeometria } = usePointerAcordeon({
        x,
        logica,
        actualizarVisualBoton,
        registrarEvento,
        trenRef,
        desactivarAudio
    });

    // 6. Efectos
    useEffect(() => {
        const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', check);
        document.body.classList.add('bloquear-scroll-simulador');
        return () => {
            window.removeEventListener('resize', check);
            document.body.classList.remove('bloquear-scroll-simulador');
        };
    }, []);

    // Inicializar AudioContext en el primer toque del usuario (requisito iOS)
    useEffect(() => {
        const inicializarAudio = () => {
            if (audioContextIniciadoRef.current) return;
            audioContextIniciadoRef.current = true;
            motorAudioPro.activarContexto();
            setAudioListo(true);
            document.removeEventListener('pointerdown', inicializarAudio, { capture: true });
        };
        document.addEventListener('pointerdown', inicializarAudio, { capture: true });
        return () => {
            document.removeEventListener('pointerdown', inicializarAudio, { capture: true });
        };
    }, []);

    // ⚡ Limpiar caché de elementos y geometría cuando cambia la tonalidad
    useEffect(() => {
        elementosCache.current.clear();
        limpiarGeometria();
    }, [logica.tonalidadSeleccionada]);

    useEffect(() => {
        document.documentElement.style.setProperty('--escala-acordeon', escala.toString());
    }, [escala]);

    // 7. Handlers
    const toggleModal = (nombre: keyof typeof modales) => {
        setModales(prev => ({ menu: false, tonalidades: false, vista: false, metronomo: false, instrumentos: false, contacto: false, [nombre]: !prev[nombre] }));
    };

    const handleToggleGrabacion = () => {
        if (!grabando) { secuenciaRef.current = []; tiempoInicioRef.current = Date.now(); setGrabando(true); }
        else setGrabando(false);
    };

    const renderHilera = (fila: any[]) => {
        const p: Record<string, any> = {};
        fila?.forEach(n => {
            const pos = n.id.split('-').slice(0, 2).join('-');
            if (!p[pos]) p[pos] = { halar: null, empujar: null };
            n.id.includes('halar') ? p[pos].halar = n : p[pos].empujar = n;
        });

        return Object.entries(p).sort((a, b) => parseInt(a[0].split('-')[1]) - parseInt(b[0].split('-')[1])).map(([pos, n]) => {
            const labelHalar = formatearNombreNota(n.halar, config.modoVista, config.mostrarOctavas);
            const labelEmpujar = formatearNombreNota(n.empujar, config.modoVista, config.mostrarOctavas);
            const esDoble = config.vistaDoble;
            const esHalar = logica.direccion === 'halar';

            return (
                <div key={pos} className={`pito-boton ${esDoble ? 'vista-doble' : ''}`} data-pos={pos}>
                    {(esDoble || esHalar) && <span className="nota-etiqueta label-halar">{labelHalar}</span>}
                    {(esDoble || !esHalar) && <span className="nota-etiqueta label-empujar">{labelEmpujar}</span>}
                </div>
            );
        });
    };

    return (
        <div className={`simulador-app-root modo-${logica.direccion}`}>
            {/* 🎹 CONTENEDOR DE BAJOS - Ahora maneja tanto el fondo, el botón de apertura como el panel interactivo */}
            <ContenedorBajos
                visible={bajosVisible}
                onOpen={() => setBajosVisible(true)}
                onClose={() => setBajosVisible(false)}
                logica={logica}
                escala={escala}
                manejarCambioFuelle={manejarCambioFuelle}
                desactivarAudio={desactivarAudio}
                vistaDoble={config.vistaDoble} // 👈 CONECTADO
            />



            <div className="contenedor-acordeon-completo">
                <div className="simulador-canvas">
                    <BarraHerramientas
                        logica={logica} x={x} escala={escala} setEscala={setEscala}
                        modoVista={config.modoVista} grabando={grabando} toggleGrabacion={handleToggleGrabacion}
                        bpmMetronomo={bpmMetronomo} modalesVisibles={modales}
                        onToggleMenu={() => toggleModal('menu')} onToggleTonalidades={() => toggleModal('tonalidades')}
                        onToggleMetronomo={() => toggleModal('metronomo')} onToggleInstrumentos={() => toggleModal('instrumentos')}
                        onToggleVista={() => toggleModal('vista')} refs={refsModales as any}
                    />

                    <div className="diapason-marco" style={{ touchAction: 'none' }}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x, touchAction: 'none' }}>
                            <div className="hilera-pitos hilera-adentro">{renderHilera(logica.configTonalidad?.terceraFila)}</div>
                            <div className="hilera-pitos hilera-medio">{renderHilera(logica.configTonalidad?.segundaFila)}</div>
                            <div className="hilera-pitos hilera-afuera">{renderHilera(logica.configTonalidad?.primeraFila)}</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* 🛸 MODALES - Fuera de todo para ganar el z-index 10000 */}
            <MenuOpciones 
                visible={modales.menu} 
                onCerrar={() => toggleModal('menu')} 
                botonRef={refsModales.menu as any}
                onAbrirContacto={() => toggleModal('contacto')}
            />

            <ModalTonalidades visible={modales.tonalidades} onCerrar={() => toggleModal('tonalidades')} tonalidadSeleccionada={logica.tonalidadSeleccionada} onSeleccionarTonalidad={logica.setTonalidadSeleccionada} listaTonalidades={logica.listaTonalidades} botonRef={refsModales.tonalidades as any} />

            <ModalVista 
                visible={modales.vista} 
                onCerrar={() => toggleModal('vista')} 
                modoVista={config.modoVista} 
                setModoVista={(v) => setConfig(c => ({ ...c, modoVista: v }))} 
                mostrarOctavas={config.mostrarOctavas} 
                setMostrarOctavas={(v) => setConfig(c => ({ ...c, mostrarOctavas: v }))} 
                vistaDoble={config.vistaDoble} 
                setVistaDoble={(v) => setConfig(c => ({ ...c, vistaDoble: v }))} 
                botonRef={refsModales.vista as any} 
            />

            <ModalMetronomo visible={modales.metronomo} onCerrar={() => toggleModal('metronomo')} bpm={bpmMetronomo} setBpm={setBpmMetronomo} />

            <ModalInstrumentos visible={modales.instrumentos} onCerrar={() => toggleModal('instrumentos')} listaInstrumentos={logica.listaInstrumentos} instrumentoId={logica.instrumentoId} onSeleccionarInstrumento={logica.setInstrumentoId} cargando={logica.cargandoCloud} botonRef={refsModales.instrumentos as any} />

            <ModalContacto visible={modales.contacto} onCerrar={() => toggleModal('contacto')} />

            {!isLandscape && (<div className="overlay-rotacion"><div className="icono-rotar"><RotateCw size={80} /></div><h2>HORIZONTAL</h2></div>)}

            {!audioListo && (
                <div className="overlay-audio-inicio" aria-hidden="true">
                    Toca para comenzar
                </div>
            )}
        </div>
    );
};

export default SimuladorApp;
