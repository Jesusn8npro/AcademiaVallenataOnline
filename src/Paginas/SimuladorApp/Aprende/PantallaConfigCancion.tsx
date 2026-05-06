import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, X, Volume2, Trophy, Music2, Pause, GraduationCap } from 'lucide-react';
import type { CancionHeroConTonalidad } from '../../AcordeonProMax/TiposProMax';
import { useConfigCancion, type ModoJuego, type ConfigCancion } from './useConfigCancion';
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

    if (!cancion) return null;

    const secciones: Array<{ id: string; nombre: string }> = (cancion as any).secciones || [];
    const miniatura = cancion.youtube_id
        ? `https://img.youtube.com/vi/${cancion.youtube_id}/mqdefault.jpg`
        : '/Acordeon PRO MAX.png';

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
                                    if (!el.src.endsWith('/Acordeon PRO MAX.png')) {
                                        el.src = '/Acordeon PRO MAX.png';
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
                            <span className="config-field-label">Que parte tocar</span>
                            <div className="config-chips-secciones">
                                <button
                                    type="button"
                                    className={`config-chip-seccion ${cfg.seccionId === null ? 'activo' : ''}`}
                                    onClick={() => cfg.setSeccionId(null)}
                                    aria-pressed={cfg.seccionId === null}
                                >Canción completa</button>
                                {secciones.map((s) => (
                                    <button
                                        key={s.id}
                                        type="button"
                                        className={`config-chip-seccion ${cfg.seccionId === s.id ? 'activo' : ''}`}
                                        onClick={() => cfg.setSeccionId(s.id)}
                                        aria-pressed={cfg.seccionId === s.id}
                                    >{s.nombre}</button>
                                ))}
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
