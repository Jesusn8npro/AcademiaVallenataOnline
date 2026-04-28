import React from 'react';
import { Lock, CheckCircle2, Coins, PlayCircle, RotateCcw } from 'lucide-react';
import type { SeccionConEstado } from '../TiposProMax';
import './SelectorSeccion.css';

interface SelectorSeccionProps {
    secciones: SeccionConEstado[];
    desbloqueoSecuencial: boolean;
    seccionSeleccionadaId: string | null; // null = canción completa
    onSeleccionar: (seccionId: string | null) => void;
}

const SelectorSeccion: React.FC<SelectorSeccionProps> = ({
    secciones,
    desbloqueoSecuencial,
    seccionSeleccionadaId,
    onSeleccionar,
}) => {
    if (secciones.length === 0) return null;

    const todasCompletadas = secciones.every(s => s.completada);
    const cancionCompletaDisponible = !desbloqueoSecuencial || todasCompletadas;

    return (
        <div className="selector-seccion-panel">
            <div className="selector-seccion-titulo">📍 ¿Qué parte quieres practicar?</div>

            <div className="selector-seccion-lista">
                {secciones.map((s) => {
                    const seleccionada = seccionSeleccionadaId === s.id;
                    const bloqueada = !s.disponible;

                    let badge: React.ReactNode = null;
                    if (bloqueada) badge = <span className="seccion-badge bloqueada"><Lock size={11} /> Bloqueada</span>;
                    else if (s.completada) badge = <span className="seccion-badge completada"><CheckCircle2 size={11} /> Completada · <RotateCcw size={10} /> Tocar otra vez</span>;
                    else badge = <span className="seccion-badge disponible"><PlayCircle size={11} /> Disponible</span>;

                    let monedasInfo: React.ReactNode = null;
                    if (s.monedasGanadas > 0) {
                        monedasInfo = <span className="seccion-monedas-tag ganada"><Coins size={11} /> +{s.monedasGanadas} ganadas</span>;
                    } else if (s.monedas > 0 && s.intentosRestantesParaMoneda > 0 && !s.completada) {
                        monedasInfo = (
                            <span className="seccion-monedas-tag pendiente">
                                <Coins size={11} /> {s.monedas} · {s.intentosRestantesParaMoneda} intento{s.intentosRestantesParaMoneda !== 1 ? 's' : ''}
                            </span>
                        );
                    } else if (s.monedas > 0 && s.intentosRestantesParaMoneda === 0 && !s.completada) {
                        monedasInfo = <span className="seccion-monedas-tag agotada"><Coins size={11} /> Sin premio</span>;
                    } else if (s.monedas > 0) {
                        monedasInfo = <span className="seccion-monedas-tag pendiente"><Coins size={11} /> {s.monedas}</span>;
                    }

                    return (
                        <button
                            key={s.id}
                            className={`selector-seccion-card ${seleccionada ? 'seleccionada' : ''} ${bloqueada ? 'bloqueada' : ''}`}
                            disabled={bloqueada}
                            onClick={() => onSeleccionar(s.id)}
                            title={bloqueada ? 'Completa la sección anterior para desbloquear' : ''}
                        >
                            <div className="selector-seccion-cabecera">
                                <strong>{s.nombre}</strong>
                                {badge}
                            </div>
                            <div className="selector-seccion-meta">
                                {monedasInfo}
                                {s.mejorPrecision > 0 && (
                                    <span className="seccion-precision-tag">Mejor: {s.mejorPrecision}%</span>
                                )}
                            </div>
                        </button>
                    );
                })}

                <button
                    className={`selector-seccion-card cancion-completa ${seccionSeleccionadaId === null ? 'seleccionada' : ''} ${!cancionCompletaDisponible ? 'bloqueada' : ''}`}
                    disabled={!cancionCompletaDisponible}
                    onClick={() => onSeleccionar(null)}
                    title={!cancionCompletaDisponible ? 'Completa todas las secciones para desbloquear la canción completa' : ''}
                >
                    <div className="selector-seccion-cabecera">
                        <strong>🎵 Canción completa</strong>
                        {!cancionCompletaDisponible
                            ? <span className="seccion-badge bloqueada"><Lock size={11} /> Bloqueada</span>
                            : <span className="seccion-badge disponible"><PlayCircle size={11} /> Disponible</span>}
                    </div>
                    <div className="selector-seccion-meta">
                        <span className="seccion-precision-tag">Toda la pista de inicio a fin</span>
                    </div>
                </button>
            </div>
        </div>
    );
};

export default SelectorSeccion;
