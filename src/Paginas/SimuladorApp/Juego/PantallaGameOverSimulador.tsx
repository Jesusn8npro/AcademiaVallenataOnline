import React from 'react';
import { RotateCcw, ArrowLeft, X, Skull } from 'lucide-react';
import type { EstadisticasPartida, CancionHeroConTonalidad } from '../../AcordeonProMax/TiposProMax';
import { calcularPrecision } from '../../AcordeonProMax/TiposProMax';
import './PantallaGameOverSimulador.css';

interface Props {
    estadisticas: EstadisticasPartida;
    cancion: CancionHeroConTonalidad;
    onReintentar: () => void;
    onVolverSeleccion: () => void;
}

const PantallaGameOverSimulador: React.FC<Props> = ({
    estadisticas, cancion, onReintentar, onVolverSeleccion,
}) => {
    const { notasPerfecto, notasBien, notasFalladas, notasPerdidas, puntos, rachaMasLarga } = estadisticas;
    const precision = calcularPrecision(notasPerfecto, notasBien, notasFalladas, notasPerdidas);
    const totalNotas = notasPerfecto + notasBien + notasFalladas + notasPerdidas;

    return (
        <div className="sim-go-overlay">
            <div className="sim-go-panel">
                <header className="sim-go-header">
                    <button className="sim-go-cerrar" onClick={onVolverSeleccion} aria-label="Salir">
                        <X size={18} />
                    </button>
                    <div className="sim-go-titulo-bloque">
                        <div className="sim-go-eyebrow">
                            <Skull size={13} /> Game Over
                        </div>
                        <h2>{cancion.titulo}</h2>
                        <p>{cancion.autor}</p>
                    </div>
                </header>

                <div className="sim-go-mensaje">
                    Se acabó la vida · ¡no te rindas, vuelve a intentarlo!
                </div>

                <div className="sim-go-stats">
                    <div className="sim-go-stat perfectas">
                        <span className="sim-go-stat-label">PERFECTAS</span>
                        <span className="sim-go-stat-valor">{notasPerfecto}</span>
                    </div>
                    <div className="sim-go-stat bien">
                        <span className="sim-go-stat-label">BIEN</span>
                        <span className="sim-go-stat-valor">{notasBien}</span>
                    </div>
                    <div className="sim-go-stat falladas">
                        <span className="sim-go-stat-label">FALLIDAS</span>
                        <span className="sim-go-stat-valor">{notasFalladas}</span>
                    </div>
                    <div className="sim-go-stat perdidas">
                        <span className="sim-go-stat-label">PERDIDAS</span>
                        <span className="sim-go-stat-valor">{notasPerdidas}</span>
                    </div>
                </div>

                <div className="sim-go-precision-fila">
                    <div className="sim-go-precision-info">
                        <span className="sim-go-meta-label">Precisión</span>
                        <span className="sim-go-precision-valor">{precision}%</span>
                    </div>
                    <div className="sim-go-precision-barra" aria-hidden="true">
                        <div className="sim-go-precision-relleno" style={{ width: `${precision}%` }} />
                    </div>
                    <div className="sim-go-precision-meta">
                        <span>×{rachaMasLarga} racha</span>
                        <span>·</span>
                        <span>{totalNotas} notas</span>
                    </div>
                </div>

                <div className="sim-go-puntos-bloque">
                    <span className="sim-go-puntos-label">Puntos</span>
                    <span className="sim-go-puntos-valor">{puntos.toLocaleString('es-CO')}</span>
                </div>

                <footer className="sim-go-acciones">
                    <button className="sim-go-btn sim-go-btn-secundario" onClick={onVolverSeleccion}>
                        <ArrowLeft size={14} /> Elegir canción
                    </button>
                    <button className="sim-go-btn sim-go-btn-primario" onClick={onReintentar}>
                        <RotateCcw size={14} /> Reintentar
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default PantallaGameOverSimulador;
