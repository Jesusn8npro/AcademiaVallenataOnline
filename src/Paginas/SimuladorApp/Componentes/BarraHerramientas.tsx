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
    Download
} from 'lucide-react';
import { motion, MotionValue } from 'framer-motion';
import MenuOpciones from './MenuOpciones';
import './BarraHerramientas.css';

interface BarraHerramientasProps {
    x?: MotionValue<number>;
    marcoRef?: React.RefObject<HTMLDivElement>;
    escala: number;
    setEscala: React.Dispatch<React.SetStateAction<number>>;
}

const BarraHerramientas: React.FC<BarraHerramientasProps> = ({ x, marcoRef, escala, setEscala }) => {
    const [menuVisible, setMenuVisible] = React.useState(false);
    const botonMenuRef = React.useRef<HTMLDivElement>(null);
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

                <div className="boton-herramienta">
                    <Music size={20} />
                </div>

                <div className="boton-herramienta">
                    <Circle size={20} strokeWidth={3} />
                </div>

                <div className="boton-herramienta">
                    <div className="icono-acordeon-pequeno">🪗</div>
                </div>

                <div className="boton-herramienta">
                    <Languages size={20} />
                    <span>G/C/F</span>
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

                <div className="boton-herramienta">
                    <div className="grupo-notas-p">
                        <span style={{ fontSize: '9px', fontWeight: 'bold' }}>C Re</span><br />
                        <span style={{ fontSize: '9px', fontWeight: 'bold' }}>E Fa</span>
                    </div>
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

                {/* 📢 BUZÓN DE AVISO (Para instrucciones del usuario) */}
                <div className="boton-herramienta boton-aviso">
                    <Clock size={20} />
                    <span className="badge-aviso">AVISO</span>
                </div>

                <div
                    ref={botonMenuRef}
                    className="boton-herramienta"
                    onClick={() => setMenuVisible(!menuVisible)}
                >
                    <MoreVertical size={20} />
                </div>
            </div>

            <MenuOpciones
                visible={menuVisible}
                onCerrar={() => setMenuVisible(false)}
                botonRef={botonMenuRef}
            />

        </div>
    );
};

export default BarraHerramientas;
