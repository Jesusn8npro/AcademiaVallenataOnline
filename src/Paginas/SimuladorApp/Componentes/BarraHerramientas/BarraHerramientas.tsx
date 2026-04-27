import React from 'react';
import {
    Circle,
    Music,
    ShoppingCart,
    Move,
    MoreVertical,
    Star,
    Eye,
    Timer
} from 'lucide-react';
import { motion, MotionValue } from 'framer-motion';
import './BarraHerramientas.css';

interface BarraHerramientasProps {
    logica: any;
    x?: MotionValue<number>;
    escala: number;
    setEscala: React.Dispatch<React.SetStateAction<number>>;
    modoVista: 'notas' | 'cifrado' | 'numeros' | 'teclas';
    grabando: boolean;
    toggleGrabacion: () => void;
    onToggleMenu: () => void;
    onToggleTonalidades: () => void;
    onToggleMetronomo: () => void;
    onToggleInstrumentos: () => void;
    onToggleVista: () => void;
    refs?: {
        menu?: React.RefObject<HTMLDivElement>;
        tonalidades?: React.RefObject<HTMLDivElement>;
        metronomo?: React.RefObject<HTMLDivElement>;
        instrumentos?: React.RefObject<HTMLDivElement>;
        vista?: React.RefObject<HTMLDivElement>;
    };
    modalesVisibles: {
        menu?: boolean;
        tonalidades?: boolean;
        metronomo?: boolean;
        instrumentos?: boolean;
        vista?: boolean;
    };
    bpmMetronomo: number;
}

const BarraHerramientas: React.FC<BarraHerramientasProps> = ({
    logica,
    x, escala, setEscala,
    grabando, toggleGrabacion,
    onToggleMenu, onToggleTonalidades, onToggleMetronomo, onToggleInstrumentos, onToggleVista,
    modalesVisibles,
    bpmMetronomo,
    refs
}) => {
    React.useEffect(() => {
        const actualizarPosicionFlecha = () => {
            const botonActivo = document.querySelector('.boton-herramienta.activo') as HTMLElement;
            if (!botonActivo) return;

            const rect = botonActivo.getBoundingClientRect();
            const flechaLeft = rect.left + rect.width / 2;
            const flechaTop = rect.bottom + 8;

            document.documentElement.style.setProperty('--flecha-left', `${flechaLeft}px`);
            document.documentElement.style.setProperty('--flecha-top', `${flechaTop}px`);
        };

        actualizarPosicionFlecha();
        window.addEventListener('resize', actualizarPosicionFlecha);

        const timeout = setTimeout(actualizarPosicionFlecha, 100);

        return () => {
            window.removeEventListener('resize', actualizarPosicionFlecha);
            clearTimeout(timeout);
        };
    }, [modalesVisibles]);

    const handleDrag = (_: any, info: { delta: { x: number } }) => {
        if (x) {
            const factor = 8 / escala;
            const nuevoX = x.get() + (info.delta.x * factor);
            x.set(nuevoX);
        }
    };

    const aumentarTam = () => setEscala(prev => Math.min(prev + 0.10, 1.8));
    const disminuirTam = () => setEscala(prev => Math.max(prev - 0.10, 0.5));

    return (
        <div className="barra-herramientas-contenedor">

            <div className="seccion-barra seccion-izquierda">
                <div
                    ref={refs?.instrumentos}
                    className={`boton-herramienta ${modalesVisibles.instrumentos ? 'activo' : ''}`}
                    onClick={onToggleInstrumentos}
                >
                    <div style={{ fontSize: '20px' }}>🪗</div>
                    {logica.cargandoCloud && <div className="loader-mini"></div>}
                </div>

                <div
                    ref={refs?.tonalidades}
                    className={`boton-herramienta ${modalesVisibles.tonalidades ? 'activo' : ''}`}
                    onClick={onToggleTonalidades}
                >
                    <Music size={20} />
                    <span>{logica.tonalidadSeleccionada}</span>
                </div>

                <div
                    className={`boton-herramienta boton-grabadora ${grabando ? 'grabando' : ''}`}
                    onClick={toggleGrabacion}
                >
                    <Circle size={20} fill={grabando ? "#ef4444" : "none"} color={grabando ? "#ef4444" : "currentColor"} />
                    <span>{grabando ? 'REC' : 'GRABAR'}</span>
                </div>
            </div>

            <div className="bloque-anuncio-centro">
                <div className="miniatura-acordeon-pro">
                    <img
                        src="https://acordeonvirtual.com/wp-content/uploads/acordium-prod-av-nov-24/img/blanca.JPG"
                        alt="Icono Acordeón"
                        className="img-miniatura-anuncio"
                    />
                </div>
                <div className="info-anuncio-pro">
                    <h4 className="anuncio-titulo-pro">Acordeón Piano Cassotto</h4>
                    <div className="anuncio-meta-flex">
                        <div className="estrellas-flex">
                            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={8} fill="#fbbf24" color="#fbbf24" />)}
                        </div>
                        <p className="anuncio-desc-premium">Descarga el app de Acordeón más Real...</p>
                    </div>
                </div>
                <button className="boton-instalar-premium" onClick={() => window.open('https://academiavallenataonline.com', '_blank')}>
                    INSTALAR
                </button>
            </div>

            <div className="seccion-barra seccion-derecha">
                <div className="contenedor-oferta">
                    <div className="oferta-tag">-40%</div>
                    <div className="boton-herramienta">
                        <ShoppingCart size={20} />
                    </div>
                </div>

                <div className="boton-herramienta contenedor-control-drag">
                    <div className="label-botones">BOTONES</div>
                    <motion.div
                        className="icono-drag-handle"
                        drag="x"
                        dragElastic={0}
                        dragMomentum={false}
                        onDrag={handleDrag}
                        whileTap={{ scale: 0.7, cursor: 'grabbing' }}
                    >
                        <Move size={18} />
                    </motion.div>
                </div>

                <div
                    ref={refs?.vista}
                    className={`boton-herramienta ${modalesVisibles.vista ? 'activo' : ''}`}
                    onClick={onToggleVista}
                >
                    <Eye size={20} />
                </div>

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
                    ref={refs?.metronomo}
                    className={`boton-herramienta metronomo-btn-barra ${modalesVisibles.metronomo ? 'activo' : ''}`}
                    onClick={onToggleMetronomo}
                >
                    <Timer size={20} />
                    <span className="label-metronomo-mini">BPM: {bpmMetronomo}</span>
                </div>

                <div
                    ref={refs?.menu}
                    className={`boton-herramienta ${modalesVisibles.menu ? 'activo' : ''}`}
                    onClick={onToggleMenu}
                >
                    <MoreVertical size={20} />
                </div>
            </div>
        </div>
    );
};

export default BarraHerramientas;
