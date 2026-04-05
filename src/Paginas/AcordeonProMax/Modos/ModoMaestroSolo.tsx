import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Crosshair, AlertCircle } from 'lucide-react';
import CuerpoAcordeon from '../../SimuladorDeAcordeon/Componentes/CuerpoAcordeon';
import BarraTransporte from './BarraTransporte';
import './ModoMaestroSolo.css';

interface ModoMaestroSoloProps {
    estadoJuego: string;
    tickActual: number;
    totalTicks: number;
    reproduciendo: boolean;
    pausado: boolean;
    botonesActivosMaestro: Record<string, any>;
    direccionMaestro: 'halar' | 'empujar';
    logica: any;
    buscarTick: (tick: number) => void;
    alternarPausa: () => void;
    maestroSuena: boolean;
    setMaestroSuena: (v: boolean) => void;
    mp3Silenciado: boolean;
    setMp3Silenciado: (v: boolean) => void;
    modoGuiado: boolean;
    setModoGuiado: (v: boolean) => void;
    bpm: number;
    cambiarBpm: (bpm: number | ((prev: number) => number)) => void;
    loopAB: { start: number; end: number; activo: boolean; hasStart: boolean; hasEnd: boolean };
    marcarLoopInicio: () => void;
    marcarLoopFin: () => void;
    actualizarLoopInicioTick: (tick: number) => void;
    actualizarLoopFinTick: (tick: number) => void;
    alternarLoopAB: () => void;
    limpiarLoopAB: () => void;
}

const ModoMaestroSolo: React.FC<ModoMaestroSoloProps> = ({
    estadoJuego,
    tickActual,
    totalTicks,
    reproduciendo,
    pausado,
    botonesActivosMaestro,
    direccionMaestro,
    logica,
    buscarTick,
    alternarPausa,
    maestroSuena,
    setMaestroSuena,
    mp3Silenciado,
    setMp3Silenciado,
    modoGuiado,
    setModoGuiado,
    bpm,
    cambiarBpm,
    loopAB,
    marcarLoopInicio,
    marcarLoopFin,
    actualizarLoopInicioTick,
    actualizarLoopFinTick,
    alternarLoopAB,
    limpiarLoopAB,
}) => {
    const [mostrarBanner, setMostrarBanner] = useState(true);
    const { ajustes } = logica;

    useEffect(() => {
        if (!mostrarBanner) return;
        const timer = setTimeout(() => setMostrarBanner(false), 8000);
        return () => clearTimeout(timer);
    }, [mostrarBanner]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
            if (estadoJuego !== 'jugando') return;

            if (e.code === 'Space' || e.key === ' ') {
                e.preventDefault();
                alternarPausa();
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                buscarTick(Math.max(0, tickActual - 500));
                return;
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                buscarTick(Math.min(totalTicks, tickActual + 500));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [alternarPausa, buscarTick, estadoJuego, tickActual, totalTicks]);

    const ajustesMaestroSolo = {
        ...ajustes,
        tamano: 'var(--maestro-acordeon-tamano, min(74vh, 36vw, 640px))',
        x: 'var(--maestro-acordeon-x, 50%)',
        y: 'var(--maestro-acordeon-y, 50%)'
    };

    return (
        <div className="hero-maestro-solo-wrap">
            <div className="maestro-solo-layout">
                <aside className="maestro-sidebar maestro-sidebar-left">
                    <AnimatePresence>
                        {mostrarBanner && (
                            <motion.div
                                className="maestro-card maestro-banner-info"
                                initial={{ opacity: 0, y: -16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -16 }}
                            >
                                <div className="banner-icon">
                                    <AlertCircle size={18} />
                                </div>
                                <div className="banner-texto">
                                    <strong>MODO ESTUDIO</strong>
                                    <p>Rebobina, baja la velocidad y activa el guiado sin tapar el acordeon.</p>
                                </div>
                                <button
                                    className="banner-cerrar"
                                    onClick={() => setMostrarBanner(false)}
                                >
                                    x
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="maestro-card maestro-resumen-card">
                        <span className="hero-maestro-kicker">Maestro Solo</span>
                        <strong>Escucha y estudia la ejecucion del maestro</strong>
                        <p>Dejamos todo el apoyo visual a los lados para que el acordeon quede centrado y limpio.</p>
                    </div>

                    <motion.div
                        className="maestro-card maestro-panel-controles"
                        initial={{ opacity: 0, y: -18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.08 }}
                    >
                        <div className="control-item bpm-control">
                            <label className="control-label">Velocidad</label>
                            <div className="bpm-display">{bpm} BPM</div>
                            <input
                                type="range"
                                min={40}
                                max={200}
                                value={bpm}
                                onChange={(e) => cambiarBpm(parseInt(e.target.value))}
                                className="control-slider"
                            />
                            <div className="control-hint">[- / +] para ajustar rapido</div>
                        </div>

                        <div className="control-item">
                            <label className="control-label">
                                <Volume2 size={16} /> Escuchar
                            </label>
                            <button
                                className={`control-toggle ${maestroSuena ? 'on' : 'off'}`}
                                onClick={() => setMaestroSuena(!maestroSuena)}
                            >
                                {maestroSuena ? 'Maestro activo' : 'Maestro muteado'}
                            </button>
                        </div>

                        <div className="control-item">
                            <label className="control-label">
                                <Crosshair size={16} /> Guiado
                            </label>
                            <button
                                className={`control-toggle ${modoGuiado ? 'on' : 'off'}`}
                                onClick={() => setModoGuiado(!modoGuiado)}
                            >
                                {modoGuiado ? 'Practica guiada' : 'Solo demostracion'}
                            </button>
                        </div>

                        <div className="control-item">
                            <label className="control-label">MP3 de fondo</label>
                            <button
                                className={`control-toggle ${mp3Silenciado ? 'off' : 'on'}`}
                                onClick={() => setMp3Silenciado(!mp3Silenciado)}
                            >
                                {mp3Silenciado ? 'MP3 silenciado' : 'MP3 activo'}
                            </button>
                        </div>
                    </motion.div>
                </aside>

                <section className="maestro-center-column">
                    <div className="maestro-card maestro-stage-card">
                        <div className="hero-maestro-label-top">
                            <span className="hero-maestro-kicker">Escenario limpio</span>
                            <strong>El acordeon queda centrado y libre</strong>
                        </div>

                        <div className="hero-maestro-solo-acordeon">
                            {logica.disenoCargado && (
                                <CuerpoAcordeon
                                    imagenFondo={'/Acordeon Jugador.png'}
                                    ajustes={ajustesMaestroSolo}
                                    direccion={direccionMaestro}
                                    configTonalidad={logica.configTonalidad}
                                    botonesActivos={{ ...botonesActivosMaestro, ...logica.botonesActivos }}
                                    modoAjuste={false}
                                    botonSeleccionado={null}
                                    modoVista={logica.modoVista}
                                    vistaDoble={false}
                                    setBotonSeleccionado={() => {}}
                                    actualizarBotonActivo={logica.actualizarBotonActivo}
                                    listo={true}
                                />
                            )}
                        </div>
                    </div>

                    <div className="hero-maestro-transporte-wrapper">
                        <BarraTransporte
                            reproduciendo={reproduciendo}
                            pausado={pausado}
                            onAlternarPausa={alternarPausa}
                            tickActual={tickActual}
                            totalTicks={totalTicks}
                            onBuscarTick={buscarTick}
                            bpm={bpm}
                            loopAB={loopAB}
                            onMarcarLoopInicio={marcarLoopInicio}
                            onMarcarLoopFin={marcarLoopFin}
                            onActualizarLoopInicio={actualizarLoopInicioTick}
                            onActualizarLoopFin={actualizarLoopFinTick}
                            onAlternarLoop={alternarLoopAB}
                            onLimpiarLoop={limpiarLoopAB}
                            onCambiarBpm={cambiarBpm}
                        />
                    </div>
                </section>

                <aside className="maestro-sidebar maestro-sidebar-right">
                    <div className="maestro-card maestro-lateral-card">
                        <span className="hero-maestro-kicker">Referencia</span>
                        <strong>Direccion del fuelle</strong>
                        <p>Mira esta columna para confirmar si la frase va abriendo o cerrando sin tapar el instrumento.</p>
                    </div>

                    <div className="maestro-card hero-maestro-indicadores-fuelle">
                        <button
                            className={`fuelle-badge halar ${direccionMaestro === 'halar' ? 'activo' : ''}`}
                            onClick={() => logica.setDireccion('halar')}
                        >
                            <span className="dot"></span> Halar (abriendo)
                        </button>
                        <button
                            className={`fuelle-badge empujar ${direccionMaestro === 'empujar' ? 'activo' : ''}`}
                            onClick={() => logica.setDireccion('empujar')}
                        >
                            <span className="dot"></span> Empujar (cerrando)
                        </button>
                    </div>

                    <div className="maestro-card maestro-lateral-card maestro-atajos-card">
                        <span className="hero-maestro-kicker">Atajos</span>
                        <strong>Control rapido</strong>
                        <div className="maestro-atajos-teclado">
                            <kbd>Izq</kbd>
                            <span>retrocede 5s</span>
                            <kbd>Der</kbd>
                            <span>avanza 5s</span>
                            <kbd>Espacio</kbd>
                            <span>play o pausa</span>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default ModoMaestroSolo;
