import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import CuerpoAcordeon from '../../SimuladorDeAcordeon/Componentes/CuerpoAcordeon';
import PuenteNotas from '../Componentes/PuenteNotas';
import { usePosicionProMax } from '../Hooks/usePosicionProMax';
import type {
  CancionHeroConTonalidad,
  EstadisticasPartida,
  EfectoGolpe
} from '../TiposProMax';
import './ModoLibre.css';

interface ModoLibreProps {
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
 * 🎵 MODO LIBRE — Acordeón Pro Max
 * ─────────────────────────────────────────────────────
 * Modo zen para practicar sin penalizaciones de vida.
 * Paleta: Verde esmeralda + Azul claro
 */
const ModoLibre: React.FC<ModoLibreProps> = ({
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
    const [mostrarBanner, setMostrarBanner] = useState(true);
    const { refMaestro, refAlumno, obtenerPosicionMaestro, obtenerPosicionAlumno } = usePosicionProMax();
    const ajustesDuelo = useMemo(() => ({
        ...logica.ajustes,
        tamano: 'var(--duelo-acordeon-tamano, min(70vh, 32vw))',
        x: 'var(--duelo-acordeon-x, 50%)',
        y: 'var(--duelo-acordeon-y, 50%)',
    }), [logica.ajustes]);

    // Mensaje dinámico según desempeño
    const getMensajeDinamico = () => {
        if (estadisticas.rachaActual >= 10) {
            return "¡Vas excelente! Cuando domines esta canción, prueba el Modo Competitivo 🚀";
        }
        if (estadisticas.rachaActual >= 5) {
            return "¡Muy bien! Mantén la racha, vas en buen camino 🎵";
        }
        if (estadisticas.notasFalladas > 10) {
            return "Sin presión, cada nota cuenta. Sigue practicando 💪";
        }
        return "Practica con tranquilidad, aprendes al ritmo que necesites 🎼";
    };

    return (
        <div className="libre-modo">
            {/* Banner de Bienvenida */}
            <AnimatePresence>
                {mostrarBanner && (
                    <motion.div
                        className="libre-banner-bienvenida"
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        onAnimationComplete={() => {
                            setTimeout(() => setMostrarBanner(false), 8000);
                        }}
                    >
                        <div className="libre-banner-content">
                            <div className="libre-banner-header">
                                <span className="libre-banner-titulo">🎵 Practica sin presión</span>
                                <button
                                    className="libre-banner-close"
                                    onClick={() => setMostrarBanner(false)}
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <p className="libre-banner-texto">
                                Toca la melodía con tranquilidad. No hay vida, no hay penalizaciones.
                                Cuando domines la canción, prueba el <strong>Modo Competitivo</strong> para un desafío real.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HUD Superior: Estadísticas */}
            <motion.div
                className="libre-hud-superior"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <div className="libre-badge-modo">
                    🎵 MODO LIBRE
                </div>

                <div className="libre-estadisticas-container">
                    <div className="libre-stat-item">
                        <span className="stat-label">PERFECTAS</span>
                        <span className="stat-valor perfecto">{estadisticas.notasPerfecto}</span>
                    </div>
                    <div className="libre-stat-item">
                        <span className="stat-label">BIEN</span>
                        <span className="stat-valor bien">{estadisticas.notasBien}</span>
                    </div>
                    <div className="libre-stat-item">
                        <span className="stat-label">FALLADAS</span>
                        <span className="stat-valor fallada">{estadisticas.notasFalladas}</span>
                    </div>
                    <div className="libre-stat-divider" />
                    <div className="libre-stat-item">
                        <span className="stat-label">RACHA</span>
                        <motion.span
                            className="stat-valor racha"
                            key={estadisticas.rachaActual}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                        >
                            {estadisticas.rachaActual}
                        </motion.span>
                    </div>
                    <div className="libre-stat-item">
                        <span className="stat-label">PUNTOS</span>
                        <span className="stat-valor puntos">{estadisticas.puntos}</span>
                    </div>
                </div>

                {/* Mensaje Dinámico */}
                <motion.div
                    className="libre-mensaje-dinamico"
                    key={estadisticas.rachaActual}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    {getMensajeDinamico()}
                </motion.div>
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

export default React.memo(ModoLibre);
