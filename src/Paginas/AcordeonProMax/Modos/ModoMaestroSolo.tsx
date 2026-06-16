import * as React from 'react';
import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Crosshair, AlertCircle } from 'lucide-react';
import CuerpoAcordeon from '../../../Core/componentes/CuerpoAcordeon';
import BarraTransporte from './BarraTransporte';
import AcordeonModo3D, { SKIN_ALUMNO } from './acordeon3dCompartido';
import { usePersonaje3DGuardado } from '../PracticaLibre/Servicios/usePersonaje3DGuardado';
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

    // ── Acordeón 3D (por defecto) ↔ imagen. El acordeón único usa la PIEL que el usuario eligió. ──
    const { skin } = usePersonaje3DGuardado(SKIN_ALUMNO);
    const [use3D, setUse3D] = useState(true);
    useEffect(() => { setUse3D(localStorage.getItem('maestro:use3D') !== '0'); }, []);
    const toggle3D = useCallback(() => {
        setUse3D((v) => { const n = !v; localStorage.setItem('maestro:use3D', n ? '1' : '0'); return n; });
    }, []);
    // Fuelle del 3D: dirección = la del maestro; actividad = cuántas notas suenan (maestro + alumno).
    const botones3D = { ...botonesActivosMaestro, ...logica.botonesActivos };
    const fuelleDirRef = useRef(false);
    const fuelleActRef = useRef(0);
    fuelleDirRef.current = direccionMaestro === 'empujar';
    fuelleActRef.current = Math.min(Object.values(botones3D).filter(Boolean).length / 2, 1);

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

                        {/* Toggle acordeón 3D ↔ imagen */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                            <button
                                type="button"
                                onClick={toggle3D}
                                title="Cambiar entre acordeón 3D y de imagen"
                                style={{
                                    background: 'rgba(0,0,0,0.55)', color: '#fff', border: '1px solid rgba(255,255,255,0.18)',
                                    padding: '6px 12px', borderRadius: 18, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                                }}
                            >
                                {use3D ? '🪗 Acordeón 3D' : '🖼️ Imágenes'}
                            </button>
                        </div>

                        <div className="hero-maestro-solo-acordeon">
                            {use3D ? (
                                // El stage 3D es position:absolute inset:0 → necesita un padre relativo con tamaño.
                                <div style={{ position: 'relative', width: '100%', height: 'clamp(380px, 54vh, 560px)' }}>
                                    <AcordeonModo3D
                                        skin={skin}
                                        botonesActivos={botones3D}
                                        direccion={direccionMaestro}
                                        fuelleCerrandoRef={fuelleDirRef}
                                        fuelleActividadRef={fuelleActRef}
                                        onTocarBoton={(id, accion) => logica.actualizarBotonActivo(id, accion === 'down' ? 'add' : 'remove')}
                                        // Acordeón ÚNICO centrado a ancho completo → fill bajo (el del juego, 1.23, es
                                        // para los recuadros de 48% lado a lado). Centrado (offset X=0).
                                        fill={0.62}
                                        offsetRelX={0}
                                        offsetRelY={0.02}
                                    />
                                </div>
                            ) : logica.disenoCargado ? (
                                <CuerpoAcordeon
                                    imagenFondo={'/Acordeon Jugador.webp'}
                                    ajustes={ajustesMaestroSolo}
                                    direccion={direccionMaestro}
                                    configTonalidad={logica.configTonalidad}
                                    botonesActivos={botones3D}
                                    modoAjuste={false}
                                    botonSeleccionado={null}
                                    modoVista={logica.modoVista}
                                    vistaDoble={false}
                                    setBotonSeleccionado={() => {}}
                                    actualizarBotonActivo={logica.actualizarBotonActivo}
                                    listo={true}
                                />
                            ) : null}
                        </div>
                    </div>

                    <div className="hero-maestro-transporte-wrapper">
                        <BarraTransporte
                            reproduciendo={reproduciendo}
                            pausado={pausado}
                            onAlternarPausa={alternarPausa}
                            onDetener={() => {}}
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
