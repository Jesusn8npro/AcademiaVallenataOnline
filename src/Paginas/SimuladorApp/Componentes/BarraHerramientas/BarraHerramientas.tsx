import React from 'react';
import {
    Music,
    ShoppingCart,
    Move,
    MoreVertical,
    Timer,
    GraduationCap,
    SlidersHorizontal
} from 'lucide-react';
import { motion, MotionValue, animate } from 'framer-motion';
import BannerEcosistemaHero from '../BannerEcosistemaHero';
import './BarraHerramientas.css';

// Mini-grid 2x2 que indica los modos de vista disponibles (cifrado y notas
// mezclados). Reemplaza el ícono genérico de ojo por algo que comunica QUÉ
// abre el botón: el modal de selección de vista (notas / cifrado / números / teclas).
const IconoVistas: React.FC = () => (
    <div className="icono-vistas-mini" aria-hidden="true">
        <span>C</span>
        <span>Re</span>
        <span>E</span>
        <span>Fa</span>
    </div>
);

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
    onToggleAprende: () => void;
    onToggleLoops?: () => void;
    onToggleEfectos?: () => void;
    loopActivo?: boolean;
    refs?: {
        menu?: React.RefObject<HTMLDivElement>;
        tonalidades?: React.RefObject<HTMLDivElement>;
        metronomo?: React.RefObject<HTMLDivElement>;
        instrumentos?: React.RefObject<HTMLDivElement>;
        vista?: React.RefObject<HTMLDivElement>;
        aprende?: React.RefObject<HTMLDivElement>;
        loops?: React.RefObject<HTMLDivElement>;
        efectos?: React.RefObject<HTMLDivElement>;
    };
    modalesVisibles: {
        menu?: boolean;
        tonalidades?: boolean;
        metronomo?: boolean;
        instrumentos?: boolean;
        vista?: boolean;
        aprende?: boolean;
        loops?: boolean;
        efectos?: boolean;
    };
    bpmMetronomo: number;
}

const BarraHerramientas: React.FC<BarraHerramientasProps> = ({
    logica,
    x, escala, setEscala,
    grabando, toggleGrabacion,
    onToggleMenu, onToggleTonalidades, onToggleMetronomo, onToggleInstrumentos, onToggleVista, onToggleAprende,
    onToggleLoops, onToggleEfectos, loopActivo,
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
        if (!x) return;
        // Factor suavizado (antes 8) para que el desplazamiento siga al cursor
        // sin saltos abruptos al mover lento.
        const factor = 4 / escala;
        // Límite duro: el acordeón nunca se desplaza más de ~35% del viewport en
        // cada lado. Sin esto el alumno arrastra y los botones se salen completos
        // de la pantalla; con esto siempre queda al menos la mitad visible.
        const limite = window.innerWidth * 0.35;
        const propuesto = x.get() + info.delta.x * factor;
        const nuevoX = Math.max(-limite, Math.min(limite, propuesto));
        x.set(nuevoX);
    };

    // Doble clic en el handle: regresa el acordeón a la posición inicial (centro)
    // con una animación suave de 300ms. Atajo cómodo para deshacer un mal arrastre.
    const resetearPosicion = () => {
        if (!x) return;
        animate(x, 0, { duration: 0.3, ease: 'easeOut' });
    };

    const aumentarTam = () => setEscala(prev => Math.min(prev + 0.10, 1.8));
    const disminuirTam = () => setEscala(prev => Math.max(prev - 0.10, 0.5));

    return (
        <div className="barra-herramientas-contenedor">

            {/* Orden estratégico izquierda: aprender → instrumento → tono →
                pistas → efectos. Es el flujo natural del alumno: primero
                "qué aprender", después "con qué timbre", "en qué tono", "con
                qué fondo musical" y finalmente "con qué efecto". */}
            <div className="seccion-barra seccion-izquierda">
                <div
                    ref={refs?.aprende}
                    className={`boton-herramienta boton-aprende ${modalesVisibles.aprende ? 'activo' : ''}`}
                    onClick={onToggleAprende}
                    title="Tutoriales y lecciones"
                >
                    <GraduationCap size={20} />
                    <span>TUTORIALES</span>
                </div>

                <div
                    ref={refs?.instrumentos}
                    className={`boton-herramienta ${modalesVisibles.instrumentos ? 'activo' : ''}`}
                    onClick={onToggleInstrumentos}
                    title="Cambiar instrumento / timbre"
                >
                    <div style={{ fontSize: '20px' }}>🪗</div>
                    {logica.cargandoCloud && <div className="loader-mini"></div>}
                </div>

                <div
                    ref={refs?.tonalidades}
                    className={`boton-herramienta ${modalesVisibles.tonalidades ? 'activo' : ''}`}
                    onClick={onToggleTonalidades}
                    title="Cambiar tonalidad"
                >
                    <Music size={20} />
                    <span>Tono</span>
                </div>

                {onToggleLoops && (
                    <div
                        ref={refs?.loops}
                        className={`boton-herramienta ${modalesVisibles.loops ? 'activo' : ''} ${loopActivo ? 'loop-sonando' : ''}`}
                        onClick={onToggleLoops}
                        title="Pistas musicales de fondo"
                    >
                        <span style={{ fontSize: '20px', lineHeight: 1, position: 'relative' }}>
                            🥁
                            {loopActivo && <span className="loop-indicador-punto" aria-hidden="true" />}
                        </span>
                        <span>PISTAS</span>
                    </div>
                )}

                {onToggleEfectos && (
                    <div
                        ref={refs?.efectos}
                        className={`boton-herramienta ${modalesVisibles.efectos ? 'activo' : ''}`}
                        onClick={onToggleEfectos}
                        title="Efectos de audio"
                    >
                        <SlidersHorizontal size={20} />
                        <span>FX</span>
                    </div>
                )}

                {/* Boton GRABAR removido — se movio a la barra flotante de la
                    esquina superior derecha (BarraGrabacionFlotante). */}
            </div>

            <div className="bloque-anuncio-centro">
                <BannerEcosistemaHero />
            </div>

            {/* Orden estratégico derecha (controles del simulador): mover/ver
                → tamaño → metrónomo → oferta → menú. Lo más usado primero,
                lo "secundario" (oferta) cerca del menú al final. */}
            <div className="seccion-barra seccion-derecha">
                <div className="boton-herramienta contenedor-control-drag" title="Doble clic para centrar">
                    <div className="label-botones">BOTONES</div>
                    <motion.div
                        className="icono-drag-handle"
                        drag="x"
                        // Contenedor 60px / ícono 28px ⇒ 16px libres en total. Limito a ±8px
                        // por lado dejando 1-2px de respiro contra el borde. dragElastic=0
                        // detiene el handle EN SECO al llegar al límite (sin estirarse fuera).
                        // dragSnapToOrigin lo devuelve al centro al soltar.
                        dragConstraints={{ left: -8, right: 8 }}
                        dragElastic={0}
                        dragSnapToOrigin
                        onDrag={handleDrag}
                        onDoubleClick={resetearPosicion}
                        whileTap={{ scale: 0.85, cursor: 'grabbing' }}
                    >
                        <Move size={18} />
                    </motion.div>
                </div>

                <div
                    ref={refs?.vista}
                    className={`boton-herramienta ${modalesVisibles.vista ? 'activo' : ''}`}
                    onClick={onToggleVista}
                    title="Modo de vista (notas / cifrado / números / teclas)"
                >
                    <IconoVistas />
                </div>

                <div className="grupo-tamano">
                    <div className="label-tam-contenedor">
                        <span className="label-tam">Tamaño</span>
                        <span className="valor-tam">{(escala * 100).toFixed(0)}%</span>
                    </div>
                    <div className="tam-controles">
                        <button
                            type="button"
                            className="tam-btn"
                            onClick={disminuirTam}
                            aria-label="Reducir tamaño del acordeón"
                            title="Reducir tamaño"
                        >−</button>
                        <button
                            type="button"
                            className="tam-btn"
                            onClick={aumentarTam}
                            aria-label="Aumentar tamaño del acordeón"
                            title="Aumentar tamaño"
                        >+</button>
                    </div>
                </div>

                <div
                    ref={refs?.metronomo}
                    className={`boton-herramienta metronomo-btn-barra ${modalesVisibles.metronomo ? 'activo' : ''}`}
                    onClick={onToggleMetronomo}
                    title="Metrónomo"
                >
                    <Timer size={20} />
                    <span className="label-metronomo-mini">BPM: {bpmMetronomo}</span>
                </div>

                <div className="contenedor-oferta" title="Ofertas">
                    <div className="oferta-tag">-40%</div>
                    <div className="boton-herramienta">
                        <ShoppingCart size={20} />
                    </div>
                </div>

                <div
                    ref={refs?.menu}
                    className={`boton-herramienta ${modalesVisibles.menu ? 'activo' : ''}`}
                    onClick={onToggleMenu}
                    title="Más opciones"
                >
                    <MoreVertical size={20} />
                </div>
            </div>
        </div>
    );
};

export default BarraHerramientas;
