import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, X, Volume2, Trophy, Music2, Pause, GraduationCap, CheckCircle2, Lock, Coins } from 'lucide-react';
import type { CancionHeroConTonalidad } from '../../../AcordeonProMax/TiposProMax';
import { useConfigCancion, type ModoJuego, type ConfigCancion } from '../Hooks/useConfigCancion';
import { useProgresoSecciones, seccionesConEstado } from '../../../AcordeonProMax/Hooks/useProgresoSecciones';
import './PantallaConfigCancion.css';

interface PantallaConfigCancionProps {
    cancion: CancionHeroConTonalidad | null;
    onCerrar: () => void;
    onEmpezar: (config: ConfigCancion) => void;
}

const MODOS: Array<{
    id: ModoJuego;
    titulo: string;
    descripcion: string;
    Icono: React.ComponentType<{ size?: number }>;
}> = [
    { id: 'competitivo', titulo: 'Competitivo', descripcion: 'Puntos, vida y combo',  Icono: Trophy },
    { id: 'libre',       titulo: 'Libre',       descripcion: 'Sin penalización',     Icono: Music2 },
    { id: 'synthesia',   titulo: 'Synthesia',   descripcion: 'Pausa en cada nota',   Icono: Pause },
    { id: 'maestro_solo',titulo: 'Maestro',     descripcion: 'Rebobina y practica',  Icono: GraduationCap },
];

const PantallaConfigCancion: React.FC<PantallaConfigCancionProps> = ({
    cancion, onCerrar, onEmpezar,
}) => {
    const cfg = useConfigCancion();
    // Long-press / hover sobre una card muestra su descripcion sin seleccionarla.
    // En reposo la descripcion visible es la del modo actualmente seleccionado.
    const [previsualizandoModo, setPrevisualizandoModo] = useState<ModoJuego | null>(null);
    const longPressRef = useRef<number | null>(null);

    const iniciarLongPress = (id: ModoJuego) => {
        if (longPressRef.current) window.clearTimeout(longPressRef.current);
        longPressRef.current = window.setTimeout(() => setPrevisualizandoModo(id), 380);
    };
    const cancelarLongPress = () => {
        if (longPressRef.current) {
            window.clearTimeout(longPressRef.current);
            longPressRef.current = null;
        }
        setPrevisualizandoModo(null);
    };

    // Hook fuera del early-return: las reglas de hooks exigen orden estable.
    // Si cancion es null, pasamos null al hook (safe-guarded internamente).
    const seccionesCancion = useMemo(() => {
        let secs = (cancion as any)?.secciones || [];
        if (typeof secs === 'string') {
            try { secs = JSON.parse(secs); } catch { secs = []; }
        }
        return Array.isArray(secs)
            ? secs.filter((s: any) => s && typeof s.id === 'string' && s.id.length > 0)
            : [];
    }, [cancion]);

    const desbloqueoSecuencial = (cancion as any)?.desbloqueo_secuencial !== false;
    const intentosParaMoneda = typeof (cancion as any)?.intentos_para_moneda === 'number'
        ? (cancion as any).intentos_para_moneda : 3;

    const { progreso } = useProgresoSecciones((cancion as any)?.id || null);
    const seccionesEstado = useMemo(
        () => seccionesConEstado(seccionesCancion, progreso, desbloqueoSecuencial, intentosParaMoneda),
        [seccionesCancion, progreso, desbloqueoSecuencial, intentosParaMoneda],
    );
    const todasCompletadas = seccionesEstado.length > 0 && seccionesEstado.every(s => s.completada);
    const cancionCompletaPermitida = !desbloqueoSecuencial || todasCompletadas;

    if (!cancion) return null;

    const miniatura = cancion.youtube_id
        ? `https://img.youtube.com/vi/${cancion.youtube_id}/mqdefault.jpg`
        : '/Acordeon PRO MAX.webp';

    const modoVisible = previsualizandoModo ?? cfg.modo;
    const descripcionVisible = MODOS.find(m => m.id === modoVisible)?.descripcion ?? '';

    return (
        <motion.div
            className="config-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={onCerrar}
        >
            <motion.div
                className="config-panel"
                initial={{ scale: 0.94, y: 16, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 22, stiffness: 280 }}
                onClick={(e) => e.stopPropagation()}
            >
                    <header className="config-header">
                        <div className="config-miniatura">
                            <img
                                src={miniatura}
                                alt={cancion.titulo}
                                onError={(e) => {
                                    const el = e.currentTarget as HTMLImageElement;
                                    if (!el.src.endsWith('/Acordeon PRO MAX.webp')) {
                                        el.src = '/Acordeon PRO MAX.webp';
                                    }
                                }}
                            />
                        </div>
                        <div className="config-header-info">
                            <h2 className="config-titulo">{cancion.titulo}</h2>
                            <p className="config-autor">{cancion.autor}</p>
                            <span className="config-tono">TONO · {(cancion as any).tonalidad || 'GDC'}</span>
                        </div>
                    </header>

                    <div className="config-body">
                        <div className="config-field">
                            <span className="config-field-label">Modo de juego</span>
                            <div className="config-grid-modos">
                                {MODOS.map(({ id, titulo, descripcion, Icono }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        className={`config-card-modo ${cfg.modo === id ? 'activo' : ''} ${previsualizandoModo === id ? 'previsualizando' : ''}`}
                                        onClick={() => { cancelarLongPress(); cfg.setModo(id); }}
                                        onPointerDown={() => iniciarLongPress(id)}
                                        onPointerUp={cancelarLongPress}
                                        onPointerLeave={cancelarLongPress}
                                        onPointerCancel={cancelarLongPress}
                                        onMouseEnter={() => setPrevisualizandoModo(id)}
                                        onMouseLeave={() => setPrevisualizandoModo(null)}
                                        aria-pressed={cfg.modo === id}
                                        aria-label={`${titulo}: ${descripcion}`}
                                    >
                                        <span className="config-card-icono"><Icono size={16} /></span>
                                        <span className="config-card-titulo">{titulo}</span>
                                        {previsualizandoModo === id && (
                                            <span className="config-card-tooltip">{descripcion}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <span className="config-modo-descripcion" role="status">
                                {descripcionVisible}
                            </span>
                        </div>

                        <div className="config-field">
                            <span className="config-field-label">Qué parte tocar</span>
                            <div className="config-secciones-grid">
                                {seccionesEstado.map((s) => {
                                    const seleccionada = cfg.seccionId === s.id;
                                    const bloqueada = !s.disponible;
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            className={`config-seccion-card ${seleccionada ? 'activo' : ''} ${bloqueada ? 'bloqueada' : ''} ${s.completada ? 'completada' : ''}`}
                                            onClick={() => !bloqueada && cfg.setSeccionId(s.id)}
                                            disabled={bloqueada}
                                            aria-pressed={seleccionada}
                                            title={bloqueada ? 'Completa la sección anterior para desbloquear' : ''}
                                        >
                                            <span className="config-seccion-nombre">{s.nombre}</span>
                                            <span className="config-seccion-estado">
                                                {bloqueada ? (
                                                    <span className="config-seccion-tag bloqueada">
                                                        <Lock size={10} /> Bloqueada
                                                    </span>
                                                ) : s.completada ? (
                                                    <span className="config-seccion-tag exito">
                                                        <CheckCircle2 size={10} /> Completada
                                                    </span>
                                                ) : (
                                                    <span className="config-seccion-tag disponible">Disponible</span>
                                                )}

                                                {s.monedasGanadas > 0 ? (
                                                    <span className="config-seccion-tag monedas">
                                                        <Coins size={10} /> +{s.monedasGanadas}
                                                    </span>
                                                ) : (s.monedas > 0 && !s.completada && !bloqueada && s.intentosRestantesParaMoneda > 0) ? (
                                                    <span className="config-seccion-tag premio">
                                                        <Coins size={10} /> {s.monedas} · {s.intentosRestantesParaMoneda} int.
                                                    </span>
                                                ) : null}

                                                {s.mejorPrecision > 0 && (
                                                    <span className="config-seccion-tag precision">Mejor {s.mejorPrecision}%</span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}

                                <button
                                    type="button"
                                    className={`config-seccion-card cancion-completa ${cfg.seccionId === null ? 'activo' : ''} ${!cancionCompletaPermitida ? 'bloqueada' : ''}`}
                                    onClick={() => cancionCompletaPermitida && cfg.setSeccionId(null)}
                                    disabled={!cancionCompletaPermitida}
                                    aria-pressed={cfg.seccionId === null}
                                    title={!cancionCompletaPermitida ? 'Completa todas las secciones para desbloquear' : ''}
                                >
                                    <span className="config-seccion-nombre">🎵 Canción completa</span>
                                    <span className="config-seccion-estado">
                                        {!cancionCompletaPermitida ? (
                                            <span className="config-seccion-tag bloqueada">
                                                <Lock size={10} /> Bloqueada
                                            </span>
                                        ) : (
                                            <span className="config-seccion-tag disponible">Toda la pista</span>
                                        )}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="button"
                            className={`config-toggle ${cfg.guiaAudio ? 'on' : ''}`}
                            onClick={() => cfg.setGuiaAudio(!cfg.guiaAudio)}
                        >
                            <Volume2 size={16} />
                            <span>Guía de audio del maestro</span>
                            <span className="config-toggle-switch" aria-hidden="true">
                                <span className="config-toggle-knob" />
                            </span>
                        </button>
                    </div>

                    <footer className="config-footer">
                        <button className="config-btn config-btn-volver" onClick={onCerrar}>
                            <X size={16} /> Volver
                        </button>
                        <button
                            className="config-btn config-btn-empezar"
                            onClick={() => onEmpezar(cfg.construirConfig(cancion))}
                        >
                            <Play size={16} fill="#fff" /> EMPEZAR
                        </button>
                    </footer>
            </motion.div>
        </motion.div>
    );
};

export default PantallaConfigCancion;
