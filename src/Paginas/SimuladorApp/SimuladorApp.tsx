/**
 * 🎹 SIMULADOR DE ACORDEÓN PRO - V19.2 (Optimizado)
 */
import React, { useEffect, useState, useRef } from 'react';
import { RotateCw } from 'lucide-react';
import { motion, useMotionValue } from 'framer-motion';

// Hooks de Lógica
import { useLogicaAcordeon } from '../SimuladorDeAcordeon/Hooks/useLogicaAcordeon';
import { motorAudioPro } from '../SimuladorDeAcordeon/AudioEnginePro';
import { usePointerAcordeon } from './Hooks/usePointerAcordeon';

// Componentes UI
import BarraHerramientas from './Componentes/BarraHerramientas';
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
        onNotaPresionada: (data) => actualizarVisualBoton(data.idBoton.split('-').slice(0, 2).join('-'), true),
        onNotaLiberada: (data) => actualizarVisualBoton(data.idBoton.split('-').slice(0, 2).join('-'), false)
    });

    // 2. Estados de UI y Configuración
    const [escala, setEscala] = useState(1.0);
    const [config, setConfig] = useState({
        modoVista: 'notas' as 'notas' | 'cifrado' | 'numeros' | 'teclas',
        mostrarOctavas: false,
        vistaDoble: false
    });

    const [modales, setModales] = useState({ menu: false, tonalidades: false, vista: false, metronomo: false, instrumentos: false, contacto: false });
    const [bpmMetronomo, setBpmMetronomo] = useState(80);
    const [grabando, setGrabando] = useState(false);
    const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

    // 3. Refs y MotionValues
    const x = useMotionValue(0);
    const trenRef = useRef<HTMLDivElement>(null);
    const refsModales = { menu: useRef(null), tonalidades: useRef(null), metronomo: useRef(null), instrumentos: useRef(null), vista: useRef(null) };
    const secuenciaRef = useRef<any[]>([]);
    const tiempoInicioRef = useRef<number>(0);

    // 4. Utilidades
    const actualizarVisualBoton = (pos: string, activo: boolean) => {
        const el = document.querySelector(`[data-pos="${pos}"]`) as HTMLElement;
        if (el) activo ? el.classList.add('nota-activa') : el.classList.remove('nota-activa');
    };

    const registrarEvento = (tipo: string, data: any) => {
        if (grabando) secuenciaRef.current.push({ t: Date.now() - tiempoInicioRef.current, tipo, ...data });
    };

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

    // 5. Hook de Entrada (PointerEvents Engine)
    const { manejarCambioFuelle } = usePointerAcordeon({ 
        x, 
        logica, 
        actualizarVisualBoton, 
        registrarEvento, 
        trenRef,
        desactivarAudio: Object.values(modales).some(v => v)
    });

    // 6. Efectos
    useEffect(() => {
        // 🔄 TODO VIENE DEL CSS - SIN SOBRESCRITURAS DE JAVASCRIPT
        // Los estilos se controlan ÚNICAMENTE desde SimuladorApp.css (:root)
        // Nota: localStorage ya no sobrescribe los valores del CSS

        const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
        window.addEventListener('resize', check);
        document.body.classList.add('bloquear-scroll-simulador');
        return () => {
            window.removeEventListener('resize', check);
            document.body.classList.remove('bloquear-scroll-simulador');
        };
    }, []);

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
            {/* FUELLE */}
            <div
                className={`indicador-fuelle ${logica.direccion === 'empujar' ? 'empujar' : 'halar'}`}
                onPointerDown={(e) => { e.preventDefault(); manejarCambioFuelle('empujar', motorAudioPro); }}
                onPointerUp={(e) => { e.preventDefault(); manejarCambioFuelle('halar', motorAudioPro); }}
                style={{ zIndex: 100, touchAction: 'none' }}
            >
                <span className="fuelle-status">{logica.direccion === 'empujar' ? 'CERRANDO' : 'ABRIENDO'}</span>
            </div>

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

                    {/* RENDERS DE MODALES */}
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

                    <div className="diapason-marco" style={{ touchAction: 'none' }}>
                        <motion.div ref={trenRef} className="tren-botones-deslizable" style={{ x, touchAction: 'none' }}>
                            <div className="hilera-pitos hilera-adentro">{renderHilera(logica.configTonalidad?.terceraFila)}</div>
                            <div className="hilera-pitos hilera-medio">{renderHilera(logica.configTonalidad?.segundaFila)}</div>
                            <div className="hilera-pitos hilera-afuera">{renderHilera(logica.configTonalidad?.primeraFila)}</div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {!isLandscape && (<div className="overlay-rotacion"><div className="icono-rotar"><RotateCw size={80} /></div><h2>HORIZONTAL</h2></div>)}
        </div>
    );
};

export default SimuladorApp;
