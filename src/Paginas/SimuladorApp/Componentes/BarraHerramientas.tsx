import React, { useRef, useState } from 'react';
import {
    BookOpen,
    Circle,
    Music,
    Languages,
    ShoppingCart,
    Move,
    Sliders,
    Clock,
    MoreVertical,
    Star,
    Download,
    Eye,
    Timer,
    X
} from 'lucide-react';
import { motion, MotionValue } from 'framer-motion';
import MenuOpciones from './MenuOpciones';
import ModalContacto from './ModalContacto';
import ModalTonalidades from './ModalTonalidades';
import ModalVista from './ModalVista';
import ModalMetronomo from './ModalMetronomo';
import ModalInstrumentos from './ModalInstrumentos';
import './BarraHerramientas.css';

interface BarraHerramientasProps {
    logica: any;
    x?: MotionValue<number>;
    marcoRef?: React.RefObject<HTMLDivElement>;
    escala: number;
    setEscala: React.Dispatch<React.SetStateAction<number>>;
    distanciaH: number;
    setDistanciaH: React.Dispatch<React.SetStateAction<number>>;
    distanciaV: number;
    setDistanciaV: React.Dispatch<React.SetStateAction<number>>;
    distanciaHBajos: number;
    setDistanciaHBajos: React.Dispatch<React.SetStateAction<number>>;
    distanciaVBajos: number;
    setDistanciaVBajos: React.Dispatch<React.SetStateAction<number>>;
    alejarIOS: boolean;
    setAlejarIOS: React.Dispatch<React.SetStateAction<boolean>>;

    // Props de Vista
    modoVista: 'notas' | 'cifrado' | 'numeros' | 'teclas';
    setModoVista: (modo: 'notas' | 'cifrado' | 'numeros' | 'teclas') => void;
    mostrarOctavas: boolean;
    setMostrarOctavas: (mostrar: boolean) => void;
    tamanoFuente: number;
    setTamanoFuente: (tamano: number) => void;
    vistaDoble: boolean;
    setVistaDoble: (doble: boolean) => void;

    // Props de Grabación
    grabando: boolean;
    toggleGrabacion: () => void;
}

const BarraHerramientas: React.FC<BarraHerramientasProps> = ({
    logica,
    x, marcoRef, escala, setEscala,
    distanciaH, setDistanciaH,
    distanciaV, setDistanciaV,
    distanciaHBajos, setDistanciaHBajos,
    distanciaVBajos, setDistanciaVBajos,
    alejarIOS, setAlejarIOS,
    modoVista, setModoVista,
    mostrarOctavas, setMostrarOctavas,
    tamanoFuente, setTamanoFuente,
    vistaDoble, setVistaDoble,
    grabando, toggleGrabacion
}) => {
    const [menuVisible, setMenuVisible] = React.useState(false);
    const [contactoVisible, setContactoVisible] = React.useState(false);
    const [selectorInstrumentoVisible, setSelectorInstrumentoVisible] = React.useState(false);
    const [tonalidadesVisible, setTonalidadesVisible] = React.useState(false);
    const [vistaVisible, setVistaVisible] = React.useState(false);
    const [metronomoVisible, setMetronomoVisible] = React.useState(false);
    const [instrumentosVisible, setInstrumentosVisible] = React.useState(false);
    const [bpmMetronomo, setBpmMetronomo] = React.useState(80);

    const botonMenuRef = React.useRef<HTMLDivElement>(null);
    const botonTonalidadesRef = React.useRef<HTMLDivElement>(null);
    const botonVistaRef = React.useRef<HTMLDivElement>(null);
    const botonMetronomoRef = React.useRef<HTMLDivElement>(null);
    const controlDragRef = useRef<HTMLDivElement>(null);

    // 🎯 Sincronizar el arrastre del icono pequeño con el tren de botones grande
    const handleDrag = (_: any, info: { delta: { x: number } }) => {
        if (x) {
            const factor = 8 / escala; // Ajustar factor según escala
            const nuevoX = x.get() + (info.delta.x * factor);
            x.set(nuevoX);
        }
    };

    // 🎯 Funciones para ajustar el tamaño (TAM)
    const aumentarTam = () => {
        setEscala(prev => Math.min(prev + 0.05, 1.4)); // Límite máximo 1.4
    };

    const disminuirTam = () => {
        setEscala(prev => Math.max(prev - 0.05, 0.7)); // Límite mínimo 0.7
    };

    return (
        <div className="barra-herramientas-contenedor">

            {/* 🛑 SECCIÓN IZQUIERDA: APRENDE Y CONFIG */}
            <div className="seccion-barra seccion-izquierda">
                <div className="boton-herramienta boton-aprende">
                    <BookOpen size={20} />
                    <span>APRENDE</span>
                </div>

                <div
                    className={`boton-herramienta ${instrumentosVisible ? 'activo' : ''}`}
                    onClick={() => {
                        setInstrumentosVisible(!instrumentosVisible);
                        setTonalidadesVisible(false);
                        setMetronomoVisible(false);
                        setVistaVisible(false);
                    }}
                >
                    <div className="icono-acordeon-pequeno" style={{ fontSize: '20px' }}>🪗</div>
                    {/* Feedback visual de carga */}
                    {logica.cargandoCloud && <div className="loader-mini"></div>}
                </div>

                <div
                    ref={botonTonalidadesRef}
                    className={`boton-herramienta ${tonalidadesVisible ? 'activo' : ''}`}
                    onClick={() => {
                        setTonalidadesVisible(!tonalidadesVisible);
                        setSelectorInstrumentoVisible(false); // Cerrar el otro si está abierto
                    }}
                >
                    <Music size={20} />
                    <span>{logica.tonalidadSeleccionada}</span>
                </div>

                <div
                    className={`boton-herramienta boton-grabadora ${grabando ? 'grabando' : ''}`}
                    onClick={toggleGrabacion}
                    title={grabando ? "Detener Grabación" : "Grabar Secuencia (Macro)"}
                >
                    <Circle size={20} fill={grabando ? "#ef4444" : "none"} color={grabando ? "#ef4444" : "currentColor"} />
                    <span style={{ color: grabando ? "#ef4444" : "inherit" }}>{grabando ? 'REC' : 'GRABAR'}</span>
                </div>
            </div>

            {/* 🛑 SECCIÓN CENTRAL: ANUNCIO / INSTALAR */}
            <div className="bloque-anuncio-centro">
                <div className="miniatura-acordeon"></div>
                <div className="info-anuncio">
                    <h4>Acordeón Cromático Cassoto</h4>
                    <div className="estrellas">
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                        <Star size={8} fill="currentColor" />
                    </div>
                    <p className="texto-descarga">Descarga el mejor app de Acordeón...</p>
                </div>
                <div className="boton-icono-instalar">
                    <Download size={18} />
                </div>
            </div>

            {/* 🛑 SECCIÓN DERECHA: AJUSTES Y MENÚ */}
            <div className="seccion-barra seccion-derecha">

                <div className="contenedor-oferta">
                    <div className="oferta-tag">-40%</div>
                    <div className="boton-herramienta">
                        <ShoppingCart size={20} />
                    </div>
                </div>

                {/* 🎯 BOTÓN DE CONTROL REMOTO (MOVER BOTONES) */}
                <div className="boton-herramienta contenedor-control-drag" ref={controlDragRef}>
                    <div className="label-botones">BOTONES</div>
                    <motion.div
                        className="icono-drag-handle"
                        drag="x"
                        dragConstraints={controlDragRef}
                        dragElastic={0}
                        dragMomentum={false}
                        onDrag={handleDrag}
                        whileTap={{ scale: 0.7, cursor: 'grabbing' }}
                    >
                        <Move size={18} />
                    </motion.div>
                </div>

                <div
                    ref={botonVistaRef}
                    className={`boton-herramienta ${vistaVisible ? 'activo' : ''}`}
                    onClick={() => {
                        setVistaVisible(!vistaVisible);
                        setSelectorInstrumentoVisible(false);
                        setTonalidadesVisible(false);
                        setMenuVisible(false);
                    }}
                >
                    <Eye size={20} />
                </div>

                {/* 🎯 CONTROL DE TAMAÑO (TAM) + INDICADOR */}
                <div className="grupo-tamano">
                    <div className="label-tam-contenedor">
                        <span className="label-tam">TAM</span>
                        <span className="valor-tam">{(escala * 100).toFixed(0)}%</span>
                    </div>
                    <div className="tam-controles">
                        <button className="tam-btn" onClick={disminuirTam}>−</button>
                        <button className="tam-btn" onClick={aumentarTam}>+</button>
                    </div>
                </div>

                <div
                    ref={botonMetronomoRef}
                    className={`boton-herramienta metronomo-btn-barra ${metronomoVisible ? 'activo' : ''}`}
                    onClick={() => {
                        setMetronomoVisible(!metronomoVisible);
                        setVistaVisible(false);
                        setSelectorInstrumentoVisible(false);
                        setTonalidadesVisible(false);
                        setMenuVisible(false);
                    }}
                >
                    <Timer size={20} />
                    <span className="label-metronomo-mini">BPM: {bpmMetronomo}</span>
                </div>

                <div
                    ref={botonMenuRef}
                    className="boton-herramienta"
                    onClick={() => {
                        setMenuVisible(!menuVisible);
                        setMetronomoVisible(false);
                        setVistaVisible(false);
                    }}
                >
                    <MoreVertical size={20} />
                </div>
            </div>

            <MenuOpciones
                visible={menuVisible}
                onCerrar={() => setMenuVisible(false)}
                botonRef={botonMenuRef}
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
                onAbrirContacto={() => {
                    setMenuVisible(false);
                    setContactoVisible(true);
                }}
            />

            <ModalContacto
                visible={contactoVisible}
                onCerrar={() => setContactoVisible(false)}
            />

            <ModalTonalidades
                visible={tonalidadesVisible}
                onCerrar={() => setTonalidadesVisible(false)}
                botonRef={botonTonalidadesRef}
                tonalidadSeleccionada={logica.tonalidadSeleccionada}
                onSeleccionarTonalidad={logica.setTonalidadSeleccionada}
                listaTonalidades={logica.listaTonalidades}
            />

            <ModalVista
                visible={vistaVisible}
                onCerrar={() => setVistaVisible(false)}
                botonRef={botonVistaRef}
                modoVista={modoVista}
                setModoVista={setModoVista}
                mostrarOctavas={mostrarOctavas}
                setMostrarOctavas={setMostrarOctavas}
                tamanoFuente={tamanoFuente}
                setTamanoFuente={setTamanoFuente}
                vistaDoble={vistaDoble}
                setVistaDoble={setVistaDoble}
            />

            <ModalMetronomo
                visible={metronomoVisible}
                onCerrar={() => setMetronomoVisible(false)}
                botonRef={botonMetronomoRef}
                bpm={bpmMetronomo}
                setBpm={setBpmMetronomo}
            />

            <ModalInstrumentos
                visible={instrumentosVisible}
                onCerrar={() => setInstrumentosVisible(false)}
                botonRef={botonMetronomoRef} // Usamos un ref auxiliar o el mismo de la barra
                listaInstrumentos={logica.listaInstrumentos}
                instrumentoId={logica.instrumentoId}
                onSeleccionarInstrumento={logica.setInstrumentoId}
                cargando={logica.cargandoCloud}
            />

        </div>
    );
};

export default BarraHerramientas;
