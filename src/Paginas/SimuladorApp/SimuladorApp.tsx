import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';

import { useLogicaAcordeon } from '../../Core/hooks/useLogicaAcordeon';
import { motorAudioPro } from '../../Core/audio/AudioEnginePro';
import { usePointerAcordeon } from './Hooks/usePointerAcordeon';

import BarraHerramientas from './Componentes/BarraHerramientas/BarraHerramientas';
import ContenedorBajos from './Componentes/ContenedorBajos';

import MenuOpciones from './Componentes/BarraHerramientas/MenuOpciones';
import ModalContacto from './Componentes/BarraHerramientas/ModalContacto';
import ModalTonalidades from './Componentes/BarraHerramientas/ModalTonalidades';
import ModalVista from './Componentes/BarraHerramientas/ModalVista';
import ModalMetronomo from './Componentes/BarraHerramientas/ModalMetronomo';
import ModalInstrumentos from './Componentes/BarraHerramientas/ModalInstrumentos';

import './SimuladorApp.css';

const SimuladorApp: React.FC = () => {
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

    const x = useMotionValue(0);
    const trenRef = useRef<HTMLDivElement>(null);
    const audioContextIniciadoRef = useRef(false);
    const [audioListo, setAudioListo] = useState(false);
    const [statsLatencia, setStatsLatencia] = useState('');
    const refsModales = {
        menu: useRef(null),
        tonalidades: useRef(null),
        metronomo: useRef(null),
        instrumentos: useRef(null),
        vista: useRef(null)
    };
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);

    const elementosCache = useRef<Map<string, { pito: Element | null; bajo: Element | null }>>(new Map());

    const actualizarVisualBoton = useCallback((pos: string, activo: boolean, esBajo: boolean) => {
        let cached = elementosCache.current.get(pos);

        if (!cached) {
            const pito = document.querySelector(`.pito-boton[data-pos="${pos}"]`);
            const bajo = document.querySelector(`.boton-bajo-contenedor[data-pos="${pos}"]`);
            cached = { pito, bajo };
            elementosCache.current.set(pos, cached);
        }

        if (esBajo && cached.bajo) {
            activo ? cached.bajo.classList.add('activo') : cached.bajo.classList.remove('activo');
        } else if (!esBajo && cached.pito) {
            activo ? cached.pito.classList.add('nota-activa') : cached.pito.classList.remove('nota-activa');
        }
    }, []);

    const registrarEvento = useCallback((tipo: string, data: any) => {
        if (grabando) secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    }, [grabando]);

    const formatearNombreNota = (notaObj: any, modo: string, mostrarOctavas: boolean) => {
        if (!notaObj) return '';

        let nombre = notaObj.nombre || '';
        const partes = nombre.split(' ');
        let notaBase = partes[0];
        const octava = partes[1] || '';

        if (modo === 'cifrado') {
            const MAPA_CIFRADO: Record<string, string> = {
                'Do': 'C', 'Do#': 'C#', 'Reb': 'Db', 'Re': 'D', 'Re#': 'D#', 'Mib': 'Eb', 'Mi': 'E',
                'Fa': 'F', 'Fa#': 'F#', 'Solb': 'Gb', 'Sol': 'G', 'Sol#': 'G#', 'Lab': 'Ab', 'La': 'A', 'La#': 'A#', 'Sib': 'Bb', 'Si': 'B'
            };
            notaBase = MAPA_CIFRADO[notaBase] || notaBase;
        }

        return mostrarOctavas ? `${notaBase}${octava}` : notaBase;
    };

    const desactivarAudio = useMemo(() => Object.values(modales).some(v => v), [modales]);

    const { manejarCambioFuelle, limpiarGeometria, actualizarGeometria } = usePointerAcordeon({
        x,
        logica,
        actualizarVisualBoton,
        registrarEvento,
        trenRef,
        desactivarAudio
    });

    useEffect(() => {
        const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', check);
        document.body.classList.add('bloquear-scroll-simulador');
        return () => {
            window.removeEventListener('resize', check);
            document.body.classList.remove('bloquear-scroll-simulador');
        };
    }, []);

    useEffect(() => {
        const inicializarAudio = () => {
            if (audioContextIniciadoRef.current) return;
            audioContextIniciadoRef.current = true;
            motorAudioPro.activarContexto();
            actualizarGeometria();
            setAudioListo(true);

            // Diagnostico: muestra stats de latencia en overlay para reportar desde mobile.
            setTimeout(() => {
                try {
                    const ctx: any = motorAudioPro.contextoAudio;
                    const baseMs = ((ctx.baseLatency || 0) * 1000).toFixed(1);
                    const outputMs = ((ctx.outputLatency || 0) * 1000).toFixed(1);
                    const ua = navigator.userAgent.match(/Android|iPhone|iPad/i)?.[0] || 'Other';
                    setStatsLatencia(`${ua} | SR:${ctx.sampleRate} | base:${baseMs}ms | out:${outputMs}ms | ${ctx.state}`);
                } catch (_) { setStatsLatencia('latencia: no disponible'); }
            }, 200);

            document.removeEventListener('pointerdown', inicializarAudio, { capture: true });
        };
        document.addEventListener('pointerdown', inicializarAudio, { capture: true });
        return () => {
            document.removeEventListener('pointerdown', inicializarAudio, { capture: true });
        };
    }, [actualizarGeometria]);

    // Fullscreen en Android: requestFullscreen requiere user activation valida.
    // Lo disparamos en touchend/mouseup (no en pointerdown) porque el preventDefault
    // que aplicamos en touchstart consume la activation y Chrome Android rechaza
    // requestFullscreen llamado desde pointerdown. touchend no tiene preventDefault
    // y el browser aun considera el gesto valido.
    useEffect(() => {
        const esMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
        if (!esMobile) return;

        const intentarFullscreen = () => {
            const noEsPWA = !window.matchMedia('(display-mode: standalone)').matches;
            const yaEnFullscreen = !!document.fullscreenElement;
            const esAndroid = /android/i.test(navigator.userAgent);
            if (esAndroid && noEsPWA && !yaEnFullscreen) {
                document.documentElement.requestFullscreen?.().catch(() => { /* fallback silencioso */ });
            }
            document.removeEventListener('touchend', intentarFullscreen);
            document.removeEventListener('mouseup', intentarFullscreen);
        };

        document.addEventListener('touchend', intentarFullscreen);
        document.addEventListener('mouseup', intentarFullscreen);
        return () => {
            document.removeEventListener('touchend', intentarFullscreen);
            document.removeEventListener('mouseup', intentarFullscreen);
        };
    }, []);

    useEffect(() => {
        elementosCache.current.clear();
        limpiarGeometria();
    }, [logica.tonalidadSeleccionada, config.modoVista, config.vistaDoble, config.mostrarOctavas]);

    useEffect(() => {
        document.documentElement.style.setProperty('--escala-acordeon', escala.toString());
        // Esperar a que termine la transición CSS (200ms) antes de recalcular geometría
        const id = setTimeout(() => limpiarGeometria(), 250);
        return () => clearTimeout(id);
    }, [escala, limpiarGeometria]);

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
            <ContenedorBajos
                visible={bajosVisible}
                onOpen={() => setBajosVisible(true)}
                onClose={() => setBajosVisible(false)}
                logica={logica}
                escala={escala}
                manejarCambioFuelle={manejarCambioFuelle}
                desactivarAudio={desactivarAudio}
                vistaDoble={config.vistaDoble}
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

                    <div className="diapason-marco" style={{ touchAction: 'manipulation' }}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x, touchAction: 'manipulation' }}>
                            <div className="hilera-pitos hilera-adentro">{renderHilera(logica.configTonalidad?.terceraFila)}</div>
                            <div className="hilera-pitos hilera-medio">{renderHilera(logica.configTonalidad?.segundaFila)}</div>
                            <div className="hilera-pitos hilera-afuera">{renderHilera(logica.configTonalidad?.primeraFila)}</div>
                        </motion.div>
                    </div>
                </div>
            </div>

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

            {statsLatencia && (
                <div
                    onClick={() => setStatsLatencia('')}
                    style={{
                        position: 'fixed',
                        top: 4,
                        left: 4,
                        zIndex: 99999,
                        background: 'rgba(0, 0, 0, 0.85)',
                        color: '#0f0',
                        padding: '5px 9px',
                        fontSize: '10px',
                        fontFamily: 'ui-monospace, Menlo, monospace',
                        fontWeight: 700,
                        borderRadius: 4,
                        border: '1px solid #0f0',
                        letterSpacing: '0.3px',
                        maxWidth: '70vw',
                        wordBreak: 'break-all',
                        cursor: 'pointer'
                    }}
                >
                    {statsLatencia} <span style={{ opacity: 0.6 }}>· tap para cerrar</span>
                </div>
            )}
        </div>
    );
};

export default SimuladorApp;
