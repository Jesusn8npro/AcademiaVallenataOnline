import React, { useEffect, useState } from 'react';
import { X, Trophy, TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { scoresHeroService } from '../../../../servicios/scoresHeroService';
import type { CancionHeroConTonalidad } from '../../../AcordeonProMax/TiposProMax';
import './ModalHistorialSimulador.css';

interface Props {
    cancion: CancionHeroConTonalidad;
    usuarioId: string;
    onCerrar: () => void;
}

interface Intento {
    id: string;
    created_at: string;
    modo: string;
    puntuacion: number;
    precision_porcentaje: number;
}

const formatFecha = (iso: string) => {
    const d = new Date(iso);
    const ahora = new Date();
    const dif = (ahora.getTime() - d.getTime()) / 1000;
    if (dif < 60) return 'Hace un momento';
    if (dif < 3600) return `Hace ${Math.floor(dif / 60)} min`;
    if (dif < 86400) return `Hace ${Math.floor(dif / 3600)} h`;
    if (dif < 604800) return `Hace ${Math.floor(dif / 86400)} días`;
    return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ModalHistorialSimulador: React.FC<Props> = ({ cancion, usuarioId, onCerrar }) => {
    const [historial, setHistorial] = useState<Intento[]>([]);
    const [mejorPuntuacion, setMejorPuntuacion] = useState(0);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargar = async () => {
            setCargando(true);
            try {
                const res = await scoresHeroService.obtenerHistorialCancion(usuarioId, cancion.id!);
                setHistorial(res.historial || []);
                setMejorPuntuacion(res.mejorPuntuacion || 0);
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [cancion.id, usuarioId]);

    const totalIntentos = historial.length;
    const mejorPrecision = historial.length > 0
        ? Math.max(...historial.map(h => h.precision_porcentaje || 0))
        : 0;
    const ultimaPrecision = historial.length > 0
        ? historial[0].precision_porcentaje
        : 0;
    const tendencia = historial.length >= 2
        ? ultimaPrecision - (historial[1].precision_porcentaje || 0)
        : 0;

    return (
        <div className="sim-hist-overlay" onClick={onCerrar}>
            <div className="sim-hist-panel" onClick={(e) => e.stopPropagation()}>
                <header className="sim-hist-header">
                    <button
                        className="sim-hist-cerrar"
                        onClick={onCerrar}
                        aria-label="Cerrar"
                    ><X size={18} /></button>
                    <div className="sim-hist-titulo-bloque">
                        <span className="sim-hist-eyebrow">Historial</span>
                        <h2>{cancion.titulo}</h2>
                    </div>
                </header>

                {cargando ? (
                    <div className="sim-hist-cargando">
                        <div className="sim-hist-spinner" />
                        <span>Cargando historial…</span>
                    </div>
                ) : totalIntentos === 0 ? (
                    <div className="sim-hist-vacio">
                        <Target size={36} strokeWidth={1.5} />
                        <p><strong>Aún no has jugado esta canción.</strong></p>
                        <span>¡Tu primer intento aparecerá aquí!</span>
                    </div>
                ) : (
                    <>
                        {/* Resumen — 4 stat cards compactas */}
                        <div className="sim-hist-resumen">
                            <div className="sim-hist-stat record">
                                <Trophy size={14} />
                                <span className="sim-hist-stat-label">Récord</span>
                                <span className="sim-hist-stat-valor">{mejorPuntuacion.toLocaleString('es-CO')}</span>
                            </div>
                            <div className="sim-hist-stat precision">
                                <Target size={14} />
                                <span className="sim-hist-stat-label">Mejor precisión</span>
                                <span className="sim-hist-stat-valor">{mejorPrecision}%</span>
                            </div>
                            <div className="sim-hist-stat intentos">
                                <Zap size={14} />
                                <span className="sim-hist-stat-label">Intentos</span>
                                <span className="sim-hist-stat-valor">{totalIntentos}</span>
                            </div>
                            <div className={`sim-hist-stat tendencia ${tendencia >= 0 ? 'positiva' : 'negativa'}`}>
                                <TrendingUp size={14} style={{ transform: tendencia < 0 ? 'rotate(180deg)' : undefined }} />
                                <span className="sim-hist-stat-label">Tendencia</span>
                                <span className="sim-hist-stat-valor">
                                    {tendencia > 0 ? '+' : ''}{tendencia}%
                                </span>
                            </div>
                        </div>

                        {/* Lista — cards de intento, scroll vertical */}
                        <div className="sim-hist-lista-wrap">
                            <h3 className="sim-hist-lista-titulo">
                                <Calendar size={13} /> Últimos intentos
                            </h3>
                            <ul className="sim-hist-lista">
                                {historial.map((item) => {
                                    const esRecord = item.puntuacion === mejorPuntuacion && mejorPuntuacion > 0;
                                    return (
                                        <li
                                            key={item.id}
                                            className={`sim-hist-item ${esRecord ? 'record' : ''}`}
                                        >
                                            <div className="sim-hist-item-fila">
                                                <span className="sim-hist-item-fecha">
                                                    {formatFecha(item.created_at)}
                                                </span>
                                                {esRecord && (
                                                    <span className="sim-hist-item-record">
                                                        <Trophy size={10} /> Récord
                                                    </span>
                                                )}
                                                <span className="sim-hist-item-modo">{item.modo}</span>
                                            </div>
                                            <div className="sim-hist-item-fila">
                                                <div className="sim-hist-item-precision">
                                                    <span className="sim-hist-item-precision-num">{item.precision_porcentaje}%</span>
                                                    <div className="sim-hist-item-barra">
                                                        <div
                                                            className="sim-hist-item-barra-fill"
                                                            style={{ width: `${item.precision_porcentaje}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="sim-hist-item-puntos">
                                                    {item.puntuacion.toLocaleString('es-CO')}<small>pts</small>
                                                </span>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ModalHistorialSimulador;
