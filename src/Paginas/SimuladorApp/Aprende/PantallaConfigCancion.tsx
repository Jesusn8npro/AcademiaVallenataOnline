import React from 'react';
import { motion } from 'framer-motion';
import { Play, X, Volume2 } from 'lucide-react';
import type { CancionHeroConTonalidad } from '../../AcordeonProMax/TiposProMax';
import { useConfigCancion, type ModoJuego, type ConfigCancion } from './useConfigCancion';
import './PantallaConfigCancion.css';

interface PantallaConfigCancionProps {
    cancion: CancionHeroConTonalidad | null;
    onCerrar: () => void;
    onEmpezar: (config: ConfigCancion) => void;
}

const MODOS: Array<{ id: ModoJuego; titulo: string }> = [
    { id: 'competitivo', titulo: 'Competitivo · Puntos, vida y combo' },
    { id: 'libre', titulo: 'Libre · Sin penalizacion' },
    { id: 'synthesia', titulo: 'Synthesia · Pausa en cada nota' },
    { id: 'maestro_solo', titulo: 'Maestro Solo · Rebobina y practica' },
];

const PantallaConfigCancion: React.FC<PantallaConfigCancionProps> = ({
    cancion, onCerrar, onEmpezar,
}) => {
    const cfg = useConfigCancion();

    if (!cancion) return null;

    const secciones: Array<{ id: string; nombre: string }> = (cancion as any).secciones || [];
    const miniatura = cancion.youtube_id
        ? `https://img.youtube.com/vi/${cancion.youtube_id}/mqdefault.jpg`
        : '/Acordeon PRO MAX.png';

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
                        <label className="config-field">
                            <span className="config-field-label">Modo de juego</span>
                            <select
                                className="config-select"
                                value={cfg.modo}
                                onChange={(e) => cfg.setModo(e.target.value as ModoJuego)}
                            >
                                {MODOS.map((m) => (
                                    <option key={m.id} value={m.id}>{m.titulo}</option>
                                ))}
                            </select>
                        </label>

                        <label className="config-field">
                            <span className="config-field-label">Que parte tocar</span>
                            <select
                                className="config-select"
                                value={cfg.seccionId ?? ''}
                                onChange={(e) => cfg.setSeccionId(e.target.value || null)}
                            >
                                <option value="">Cancion completa</option>
                                {secciones.map((s) => (
                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                ))}
                            </select>
                        </label>

                        <button
                            type="button"
                            className={`config-toggle ${cfg.guiaAudio ? 'on' : ''}`}
                            onClick={() => cfg.setGuiaAudio(!cfg.guiaAudio)}
                        >
                            <Volume2 size={16} />
                            <span>Guia de audio del maestro</span>
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
