import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CuerpoAcordeon from '../../../Core/componentes/CuerpoAcordeon';
import PuenteNotas from '../Componentes/PuenteNotas';
import JuicioOverlay from '../Componentes/JuicioOverlay';
import { usePosicionProMax } from '../Hooks/usePosicionProMax';
import type {
  CancionHeroConTonalidad,
  EstadisticasPartida,
  EfectoGolpe
} from '../TiposProMax';
import './ModoSynthesia.css';

interface ModoSynthesiaProps {
    cancion: CancionHeroConTonalidad;
    tickActual: number;
    botonesActivosMaestro: Record<string, any>;
    direccionMaestro: 'halar' | 'empujar';
    logica: any;
    configTonalidad: any;
    estadisticas: EstadisticasPartida;
    efectosVisuales: EfectoGolpe[];
    notasEsperando: any[];
    botonesGuiaAlumno: Record<string, true>;
    notasImpactadas: Set<string>;
    imagenFondo: string;
    actualizarBotonActivo: (id: string, accion: 'add' | 'remove', inst?: any[] | null) => void;
    registrarPosicionGolpe: (x: number, y: number) => void;
    mensajeMotivacional?: string;
    feedbackFuelle?: string;
}

/**
 * ⚡ MODO SYNTHESIA — Acordeón Pro Max
 * ─────────────────────────────────────────────────────
 * Modo educativo: pausa en cada nota, guía visual de acordes.
 * Paleta: Dorado/Ámbar + Violeta
 */
const ModoSynthesia: React.FC<ModoSynthesiaProps> = ({
    cancion,
    tickActual,
    botonesActivosMaestro,
    direccionMaestro,
    logica,
    configTonalidad,
    estadisticas,
    efectosVisuales,
    notasEsperando,
    botonesGuiaAlumno,
    notasImpactadas,
    imagenFondo,
    actualizarBotonActivo,
    registrarPosicionGolpe,
    mensajeMotivacional,
    feedbackFuelle,
}) => {
    const { refMaestro, refAlumno, obtenerPosicionMaestro, obtenerPosicionAlumno } = usePosicionProMax();
    const ajustesDuelo = useMemo(() => ({
        ...logica.ajustes,
        tamano: 'var(--duelo-acordeon-tamano, min(70vh, 32vw))',
        x: 'var(--duelo-acordeon-x, 50%)',
        y: 'var(--duelo-acordeon-y, 50%)',
    }), [logica.ajustes]);
    const botonesAlumno = useMemo(() => ({ ...botonesGuiaAlumno, ...logica.botonesActivos }), [botonesGuiaAlumno, logica.botonesActivos]);
    const fraseMano = useMemo(() => {
        if (notasEsperando.length === 0) return 'Tu mano manda la siguiente nota';
        const frases = [
            'Tu mano tiene la respuesta',
            'Pon la mano en la nota azul',
            'Tu turno: marca la nota correcta',
            'Responde con la mano derecha',
            'Sigue la guia con tu mano'
        ];
        const tickBase = notasEsperando[0]?.tick ?? 0;
        return frases[tickBase % frases.length];
    }, [notasEsperando]);
    const fraseRespuesta = notasEsperando.length > 0
        ? `🫳 ${fraseMano}`
        : '🫳 Preparate para la siguiente respuesta';

    const totalAcordes = useMemo(
        () => new Set(cancion.secuencia.map(nota => nota.tick)).size,
        [cancion.secuencia]
    );
    const ticksPendientes = useMemo(
        () => new Set(notasEsperando.map(nota => nota.tick)),
        [notasEsperando]
    );
    const ticksImpactados = useMemo(() => {
        const ticks = new Set<number>();
        cancion.secuencia.forEach(nota => {
            if (notasImpactadas.has(`${nota.tick}-${nota.botonId}`)) ticks.add(nota.tick);
        });
        return ticks;
    }, [cancion.secuencia, notasImpactadas]);
    const acordesCompletados = Math.max(0, ticksImpactados.size - ticksPendientes.size);
    const acordesTotales = Math.max(1, totalAcordes);

    return (
        <div className="synthesia-modo">
            {/* HUD Synthesia: Progreso + Info */}
            <motion.div
                className="synthesia-hud-superior"
                initial={{ opacity: 0, y: -40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="synthesia-badge-modo">
                    🎹 SYNTHESIA
                </div>

                <div className="synthesia-progreso-container">
                    <span className="synthesia-progreso-label">ACORDES COMPLETADOS</span>
                    <div className="synthesia-progreso-bar">
                        <div
                            className="synthesia-progreso-fill"
                            style={{ width: `${(acordesCompletados / acordesTotales) * 100}%` }}
                        />
                        <span className="synthesia-progreso-texto">
                            {acordesCompletados} / {acordesTotales}
                        </span>
                    </div>
                </div>
            </motion.div>

            {/* Panel de Espera: Botones a tocar */}
            <div className="synthesia-espera-panel">
                <AnimatePresence mode="wait">
                    {notasEsperando.length > 0 ? (
                        <motion.div
                            key="synthesia-waiting"
                            initial={{ opacity: 0, y: 30, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="synthesia-espera-content"
                        >
                            {/* Icono principal */}
                            <div className="synthesia-icono-grande">🎹</div>

                            {/* Mensaje motivacional */}
                            <motion.div
                                className="synthesia-mensaje"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                <strong>{mensajeMotivacional?.toUpperCase() || 'TOCA EL ACORDE'}</strong>
                                <span>{fraseRespuesta}</span>
                            </motion.div>

                            {/* Badge de Fuelle */}
                            {feedbackFuelle && (
                                <motion.div
                                    className={`synthesia-badge-fuelle ${
                                        feedbackFuelle.toLowerCase().includes('jala') ? 'abriendo' : 'cerrando'
                                    }`}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 200 }}
                                >
                                    {feedbackFuelle === 'Jala el fuelle' ? '↑ JALA' : '↓ EMPUJA'}
                                </motion.div>
                            )}

                            {/* Lista de Botones a Tocar */}
                            <div className="synthesia-botones-lista">
                                {(() => {
                                    const botonesUnicos = Array.from(new Set(notasEsperando.map(n => n.botonId)));
                                    return botonesUnicos.map((bid, idx) => {
                                        const notaData = notasEsperando.find(n => n.botonId === bid);
                                        const numeroBoton = bid.split('-')[1];
                                        const esAbriendo = notaData?.fuelle === 'abriendo';
                                        return (
                                            <motion.div
                                                key={bid}
                                                initial={{ opacity: 0, scale: 0.5 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`synthesia-boton-item ${esAbriendo ? 'abriendo' : 'cerrando'}`}
                                            >
                                                <span className="synthesia-boton-dot" />
                                                <span className="synthesia-boton-numero">Botón {numeroBoton}</span>
                                            </motion.div>
                                        );
                                    });
                                })()}
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="synthesia-motivation"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="synthesia-espera-content motivation-only"
                        >
                            <div className="synthesia-icono-grande">🫳</div>
                            <motion.div
                                className="synthesia-mensaje"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                <strong>{mensajeMotivacional?.toUpperCase() || '¡MUY BIEN!'}</strong>
                                <span>{fraseRespuesta}</span>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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
                    className={`hero-acordeon-wrap alumno ${notasEsperando.length > 0 ? 'guia-visible' : ''}`}
                    ref={refAlumno}
                    onPointerMove={(e) => registrarPosicionGolpe(e.clientX, e.clientY)}
                >
                    <span className="hero-acordeon-label">Alumno</span>
                    {notasEsperando.length > 0 && (
                        <div className="synthesia-guia-alumno">PISALO AQUI</div>
                    )}
                    {logica.disenoCargado && (
                        <CuerpoAcordeon
                            imagenFondo={imagenFondo}
                            ajustes={ajustesDuelo}
                            direccion={logica.direccion}
                            configTonalidad={configTonalidad}
                            botonesActivos={botonesAlumno}
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

            <JuicioOverlay estadisticas={estadisticas} efectosVisuales={efectosVisuales} />
        </div>
    );
};

export default React.memo(ModoSynthesia);
