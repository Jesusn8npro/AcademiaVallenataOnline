import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CuerpoAcordeon from '../../SimuladorDeAcordeon/Componentes/CuerpoAcordeon';
import PuenteNotas from '../Componentes/PuenteNotas';
import { usePosicionProMax } from '../Hooks/usePosicionProMax';
import type {
  CancionHeroConTonalidad,
  EstadisticasPartida,
  EfectoGolpe
} from '../TiposProMax';
import './ModoCompetitivo.css';

interface ModoCompetitivoProps {
    cancion: CancionHeroConTonalidad;
    tickActual: number;
    botonesActivosMaestro: Record<string, any>;
    direccionMaestro: 'halar' | 'empujar';
    logica: any;
    configTonalidad: any;
    estadisticas: EstadisticasPartida;
    efectosVisuales: EfectoGolpe[];
    notasImpactadas: Set<string>;
    imagenFondo: string;
    actualizarBotonActivo: (id: string, accion: 'add' | 'remove', inst?: any[] | null) => void;
    registrarPosicionGolpe: (x: number, y: number) => void;
}

/**
 * ⚡ MODO COMPETITIVO — Acordeón Pro Max
 * ─────────────────────────────────────────────────────
 * Modo arcade/esports con vida, multiplicador y combo.
 * Paleta: Azul eléctrico + Rojo sangre + Dorado
 */
const ModoCompetitivo: React.FC<ModoCompetitivoProps> = ({
    cancion,
    tickActual,
    botonesActivosMaestro,
    direccionMaestro,
    logica,
    configTonalidad,
    estadisticas,
    efectosVisuales,
    notasImpactadas,
    imagenFondo,
    actualizarBotonActivo,
    registrarPosicionGolpe,
}) => {
    const vidaPorcentaje = estadisticas.vida;
    const vidaPreviaRef = useRef(estadisticas.vida);
    const [mostrarFlash, setMostrarFlash] = React.useState(false);
    const { refMaestro, refAlumno, obtenerPosicionMaestro, obtenerPosicionAlumno } = usePosicionProMax();
    const ajustesDuelo = useMemo(() => ({
        ...logica.ajustes,
        tamano: 'var(--duelo-acordeon-tamano, min(70vh, 32vw))',
        x: 'var(--duelo-acordeon-x, 50%)',
        y: 'var(--duelo-acordeon-y, 50%)',
    }), [logica.ajustes]);

    // Detectar cuando la vida baja para mostrar flash de daño
    useEffect(() => {
        if (estadisticas.vida < vidaPreviaRef.current) {
            setMostrarFlash(true);
            setTimeout(() => setMostrarFlash(false), 600);
        }
        vidaPreviaRef.current = estadisticas.vida;
    }, [estadisticas.vida]);

    // Determinar color de la barra de vida
    const getColorVida = () => {
        if (vidaPorcentaje > 60) return 'verde';
        if (vidaPorcentaje > 30) return 'amarillo';
        return 'rojo';
    };

    return (
        <div className="competitivo-modo">
            {/* HUD Superior Compacto: Vida + Multiplicador + Puntos */}
            <motion.div
                className="competitivo-hud-superior"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                {/* Contenedor principal del HUD */}
                <div className={`competitivo-hud-container ${mostrarFlash ? 'dano-flash' : ''}`}>
                    {/* Sección de Vida */}
                    <div className="competitivo-vida-section">
                        <span className="competitivo-label">VIDA</span>
                        <div className={`competitivo-health-bar ${getColorVida()}`}>
                            <div
                                className="competitivo-health-fill"
                                style={{ width: `${vidaPorcentaje}%` }}
                            />
                        </div>
                        <span className="competitivo-vida-porcentaje">{Math.ceil(vidaPorcentaje)}%</span>
                    </div>

                    {/* Divisor */}
                    <div className="competitivo-divider" />

                    {/* Sección de Puntos */}
                    <div className="competitivo-puntos-section">
                        <span className="competitivo-label">PUNTOS</span>
                        <motion.span
                            className="competitivo-puntos-valor"
                            key={estadisticas.puntos}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.2 }}
                        >
                            {estadisticas.puntos}
                        </motion.span>
                    </div>

                    {/* Divisor */}
                    <div className="competitivo-divider" />

                    {/* Sección de Multiplicador (solo si >= 2) */}
                    <AnimatePresence>
                        {estadisticas.multiplicador >= 2 && (
                            <motion.div
                                className="competitivo-multiplicador-section"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                <span className="competitivo-label">MULTI</span>
                                <div className={`competitivo-multi-badge multi-${estadisticas.multiplicador}`}>
                                    ×{estadisticas.multiplicador}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sección de Racha (solo si >= 5) */}
                    <AnimatePresence>
                        {estadisticas.rachaActual >= 5 && (
                            <motion.div
                                className="competitivo-racha-section"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                            >
                                <span className="competitivo-label">RACHA</span>
                                <motion.span
                                    className="competitivo-racha-valor"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 0.6, repeat: Infinity }}
                                >
                                    {estadisticas.rachaActual}
                                </motion.span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <div className="hero-escenario">
                <div className="hero-acordeon-wrap maestro" ref={refMaestro}>
                    <span className="hero-acordeon-label">Maestro</span>
                    {logica.disenoCargado && (
                        <CuerpoAcordeon
                            imagenFondo={'/Acordeon Jugador.png'}
                            ajustes={ajustesDuelo}
                            direccion={direccionMaestro}
                            configTonalidad={configTonalidad}
                            botonesActivos={botonesActivosMaestro}
                            modoAjuste={false}
                            botonSeleccionado={null}
                            modoVista={logica.modoVista}
                            vistaDoble={false}
                            setBotonSeleccionado={() => {}}
                            actualizarBotonActivo={() => {}}
                            listo={true}
                        />
                    )}
                </div>

                <div
                    className="hero-acordeon-wrap alumno"
                    ref={refAlumno}
                    onPointerMove={(e) => registrarPosicionGolpe(e.clientX, e.clientY)}
                >
                    <span className="hero-acordeon-label">Alumno</span>
                    {logica.disenoCargado && (
                        <CuerpoAcordeon
                            imagenFondo={imagenFondo}
                            ajustes={ajustesDuelo}
                            direccion={logica.direccion}
                            configTonalidad={configTonalidad}
                            botonesActivos={logica.botonesActivos}
                            modoAjuste={false}
                            botonSeleccionado={null}
                            modoVista={logica.modoVista}
                            vistaDoble={false}
                            setBotonSeleccionado={() => {}}
                            actualizarBotonActivo={actualizarBotonActivo}
                            listo={true}
                        />
                    )}
                </div>
            </div>

            <PuenteNotas
                cancion={cancion}
                tickActual={tickActual}
                obtenerPosicionMaestro={obtenerPosicionMaestro}
                obtenerPosicionAlumno={obtenerPosicionAlumno}
                modoVista={logica.modoVista}
                configTonalidad={configTonalidad}
                notasImpactadas={notasImpactadas}
            />

            <div className="hero-pro-judgment-overlay">
                <AnimatePresence mode="wait">
                    {estadisticas.rachaActual >= 5 && (
                        <motion.div
                            key={`combo-${estadisticas.rachaActual}`}
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 1.5, opacity: 0 }}
                            className="hero-pro-combo"
                        >
                            <span className="combo-label">COMBO</span>
                            <span className="combo-num">{estadisticas.rachaActual}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    {efectosVisuales.length > 0 && efectosVisuales[efectosVisuales.length - 1].creado > Date.now() - 800 && (
                        <motion.div
                            key={efectosVisuales[efectosVisuales.length - 1].id}
                            initial={{ y: 20, opacity: 0, scale: 0.8 }}
                            animate={{ y: 0, opacity: 1, scale: 1.1 }}
                            exit={{ y: -20, opacity: 0, scale: 1.3 }}
                            className={`hero-pro-label ${efectosVisuales[efectosVisuales.length - 1].resultado}`}
                        >
                            {efectosVisuales[efectosVisuales.length - 1].resultado.toUpperCase()}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default React.memo(ModoCompetitivo);
