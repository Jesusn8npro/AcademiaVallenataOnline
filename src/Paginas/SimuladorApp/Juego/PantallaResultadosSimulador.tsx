import React from 'react';
import { RotateCcw, X, ArrowRight, Star } from 'lucide-react';
import { usePantallaResultados } from '../../AcordeonProMax/Componentes/usePantallaResultados';
import type { EstadisticasPartida, CancionHeroConTonalidad } from '../../AcordeonProMax/TiposProMax';
import type { Seccion } from '../../AcordeonProMax/tiposSecciones';
import './PantallaResultadosSimulador.css';

interface Props {
    estadisticas: EstadisticasPartida;
    cancion: CancionHeroConTonalidad;
    modo: string;
    mostrarGuardado: boolean;
    tituloSugeridoGrabacion: string;
    tituloGrabacionGuardada?: string | null;
    onGuardarGrabacion: (titulo: string, descripcion: string) => Promise<boolean> | boolean;
    onJugarDeNuevo: () => void;
    onVolverSeleccion: () => void;
    seccionSeleccionada?: Seccion | null;
    onJugarSiguienteSeccion?: (seccion: Seccion) => void;
}

/**
 * Pantalla de resultados — landscape mobile first.
 * Reutiliza usePantallaResultados (mismo guardado de score que ProMax) pero
 * con layout horizontal compacto: stats en columnas, todo cabe sin scroll.
 */
const PantallaResultadosSimulador: React.FC<Props> = ({
    estadisticas, cancion, modo, mostrarGuardado, tituloSugeridoGrabacion,
    tituloGrabacionGuardada, onGuardarGrabacion, onJugarDeNuevo, onVolverSeleccion,
    seccionSeleccionada, onJugarSiguienteSeccion,
}) => {
    const r = usePantallaResultados({
        estadisticas, cancion, modo, mostrarGuardado, tituloSugeridoGrabacion,
        tituloGrabacionGuardada, onGuardarGrabacion, seccionSeleccionada,
    });

    const siguiente = r.siguienteSeccion;

    return (
        <div className="hero-resultados-overlay sim-resultados-overlay">
            <div className="sim-resultados-panel">
                <header className="sim-res-header">
                    <button
                        className="sim-res-cerrar"
                        onClick={onVolverSeleccion}
                        aria-label="Volver"
                    ><X size={18} /></button>
                    <div className="sim-res-titulo-bloque">
                        <h2>{cancion.titulo}</h2>
                        <p>{cancion.autor}{seccionSeleccionada && ` · ${seccionSeleccionada.nombre}`}</p>
                    </div>
                    <div className="sim-res-estrellas" aria-label={`${r.estrellas} estrellas`}>
                        {[1, 2, 3].map((i) => (
                            <Star key={i} size={16} fill={i <= r.estrellas ? '#fbbf24' : 'none'} stroke={i <= r.estrellas ? '#fbbf24' : '#525252'} />
                        ))}
                    </div>
                </header>

                <div className="sim-res-stats">
                    <div className="sim-res-stat perfectas">
                        <span className="sim-res-stat-label">PERFECTAS</span>
                        <span className="sim-res-stat-valor">{r.notasPerfecto}</span>
                    </div>
                    <div className="sim-res-stat bien">
                        <span className="sim-res-stat-label">BIEN</span>
                        <span className="sim-res-stat-valor">{r.notasBien}</span>
                    </div>
                    <div className="sim-res-stat falladas">
                        <span className="sim-res-stat-label">FALLIDAS</span>
                        <span className="sim-res-stat-valor">{r.notasFalladas}</span>
                    </div>
                    <div className="sim-res-stat perdidas">
                        <span className="sim-res-stat-label">PERDIDAS</span>
                        <span className="sim-res-stat-valor">{r.notasPerdidas}</span>
                    </div>
                </div>

                <div className="sim-res-meta">
                    <div className="sim-res-meta-item">
                        <span className="sim-res-meta-label">Precisión</span>
                        <span className="sim-res-meta-valor sim-res-precision">{r.precision}%</span>
                    </div>
                    <div className="sim-res-meta-item">
                        <span className="sim-res-meta-label">Racha máx</span>
                        <span className="sim-res-meta-valor">×{r.rachaMasLarga}</span>
                    </div>
                    <div className="sim-res-meta-item sim-res-puntos-bloque">
                        <span className="sim-res-meta-label">Puntos</span>
                        <span className="sim-res-meta-valor sim-res-puntos">{r.puntos.toLocaleString()}</span>
                    </div>
                </div>

                <footer className="sim-res-acciones">
                    <button className="sim-res-btn sim-res-btn-secundario" onClick={onVolverSeleccion}>
                        <X size={16} /> Salir
                    </button>
                    {siguiente && onJugarSiguienteSeccion && (
                        <button
                            className="sim-res-btn sim-res-btn-secundario"
                            onClick={() => onJugarSiguienteSeccion(siguiente)}
                        >
                            Siguiente <ArrowRight size={16} />
                        </button>
                    )}
                    <button className="sim-res-btn sim-res-btn-primario" onClick={onJugarDeNuevo}>
                        <RotateCcw size={16} /> Otra vez
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PantallaResultadosSimulador;
