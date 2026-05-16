import React, { useEffect, useState } from 'react';
import { Pause, Play, X, AudioLines, Loader, AlertTriangle } from 'lucide-react';
import { listarPistasPracticaLibre } from '../../AcordeonProMax/PracticaLibre/Servicios/servicioPistasPracticaLibre';
import type { PistaPracticaLibre } from '../../AcordeonProMax/PracticaLibre/TiposPracticaLibre';
import type { EstadoLoopError } from '../Hooks/useReproductorLoops';
import './ModalLoops.css';

interface Props {
    visible: boolean;
    onCerrar: () => void;
    pistaActivaId: string | null;
    volumen: number;
    velocidad: number;
    onVolumenChange: (v: number) => void;
    onVelocidadChange: (v: number) => void;
    onSeleccionarPista: (pista: PistaPracticaLibre) => void;
    velocidadBloqueada?: boolean;  // True durante grabacion: la velocidad queda fija.
    errorReproduccion?: EstadoLoopError | null;
    pistasListas?: Set<string>;  // URLs de pistas pre-descargadas y listas para play.
    onPrecargarPistas?: (pistas: PistaPracticaLibre[]) => void;
}

/**
 * Modal "Loops" — viewer puro: lista de pistas + sliders. El estado real
 * (audio que esta sonando, velocidad, volumen) vive en useReproductorLoops
 * en el padre, asi al cerrar el modal el loop sigue sonando.
 */
const ModalLoops: React.FC<Props> = ({
    visible, onCerrar,
    pistaActivaId, volumen, velocidad,
    onVolumenChange, onVelocidadChange, onSeleccionarPista,
    velocidadBloqueada = false,
    errorReproduccion = null,
    pistasListas,
    onPrecargarPistas,
}) => {
    const [pistas, setPistas] = useState<PistaPracticaLibre[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!visible || pistas.length > 0) return;
        let cancelado = false;
        setCargando(true);
        setError(null);
        listarPistasPracticaLibre()
            .then((datos) => { if (!cancelado) setPistas(datos || []); })
            .catch((err) => {
                if (cancelado) return;
                setError('No se pudieron cargar las pistas.');
            })
            .finally(() => { if (!cancelado) setCargando(false); });
        return () => { cancelado = true; };
    }, [visible, pistas.length]);

    // Pre-descarga de blobs ni bien tenemos la lista. Sin esto, la primera
    // reproduccion en iOS falla con MediaError code 4 (Supabase sirve los MP3
    // con Content-Type incorrecto que iOS rechaza).
    useEffect(() => {
        if (!visible || pistas.length === 0) return;
        onPrecargarPistas?.(pistas);
    }, [visible, pistas, onPrecargarPistas]);

    if (!visible) return null;

    return (
        <div className="sim-loops-overlay" onClick={onCerrar}>
            <div className="sim-loops" onClick={(e) => e.stopPropagation()}>
                <div className="sim-loops-head">
                    <h3>Loops</h3>
                    <button className="sim-loops-cerrar" onClick={onCerrar} aria-label="Cerrar">
                        <X size={16} />
                    </button>
                </div>

                {errorReproduccion && (
                    <div className="sim-loops-error-banner" role="alert">
                        <AlertTriangle size={16} />
                        <div className="sim-loops-error-textos">
                            <strong>{errorReproduccion.name}</strong>
                            <span>{errorReproduccion.message}</span>
                        </div>
                    </div>
                )}

                <div className="sim-loops-cuerpo">
                    {cargando && (
                        <div className="sim-loops-estado">
                            <Loader size={18} className="sim-loops-spinner" />
                            <span>Cargando pistas…</span>
                        </div>
                    )}
                    {!cargando && error && (
                        <div className="sim-loops-estado error">{error}</div>
                    )}
                    {!cargando && !error && pistas.length === 0 && (
                        <div className="sim-loops-estado">
                            No hay pistas disponibles.
                        </div>
                    )}
                    {!cargando && !error && pistas.map((p) => {
                        const activa = p.id === pistaActivaId;
                        const url = p.audioUrl || (p.capas && p.capas[0]?.url) || '';
                        const lista = !pistasListas || pistasListas.has(url);
                        return (
                            <div
                                key={p.id}
                                className={`sim-loops-item ${activa ? 'activa' : ''}`}
                            >
                                <span className="sim-loops-icono" aria-hidden="true">
                                    <AudioLines size={18} />
                                </span>
                                <span className="sim-loops-textos">
                                    <span className="sim-loops-titulo">{p.nombre}</span>
                                    <span className="sim-loops-meta">
                                        {p.artista || 'Sin artista'}
                                        {p.bpm ? ` · ${p.bpm} BPM` : ''}
                                        {!lista && ' · descargando…'}
                                    </span>
                                </span>
                                {activa && (
                                    <span className="sim-loops-pulso" aria-hidden="true">
                                        <span /><span /><span />
                                    </span>
                                )}
                                <button
                                    type="button"
                                    className={`sim-loops-play ${activa ? 'activa' : ''} ${!lista ? 'cargando' : ''}`}
                                    onClick={() => onSeleccionarPista(p)}
                                    aria-label={activa ? 'Pausar' : (lista ? 'Reproducir' : 'Descargando…')}
                                >
                                    {!lista
                                        ? <Loader size={18} className="sim-loops-spinner" />
                                        : activa
                                            ? <Pause size={20} fill="currentColor" />
                                            : <Play size={20} fill="currentColor" />}
                                </button>
                            </div>
                        );
                    })}
                </div>

                <div className="sim-loops-controles">
                    <label className="sim-loops-control">
                        <span>Volumen</span>
                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={volumen}
                            onChange={(e) => onVolumenChange(parseFloat(e.target.value))}
                        />
                    </label>
                    <label className={`sim-loops-control ${velocidadBloqueada ? 'bloqueado' : ''}`}>
                        <span>
                            Velocidad <em>{velocidad.toFixed(2)}x</em>
                            {velocidadBloqueada && <span className="sim-loops-control-lock">🔒 Grabando</span>}
                        </span>
                        <input
                            type="range"
                            min={0.5}
                            max={1.5}
                            step={0.05}
                            value={velocidad}
                            onChange={(e) => onVelocidadChange(parseFloat(e.target.value))}
                            disabled={velocidadBloqueada}
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ModalLoops);
