import * as React from 'react';
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic';

const GraficoHistorial = dynamic(() => import('./GraficoHistorial'), {
  ssr: false,
  loading: () => <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>Cargando gráfico...</div>,
})
import { scoresHeroService } from '../../../servicios/scoresHeroService';
import type { CancionHeroConTonalidad } from '../TiposProMax';
import './ModalHistorialHero.css';

interface Props {
  cancion: CancionHeroConTonalidad;
  usuarioId: string;
  onCerrar: () => void;
}

const ModalHistorialHero: React.FC<Props> = ({ cancion, usuarioId, onCerrar }) => {
  const [historial, setHistorial] = useState<any[]>([]);
  const [mejorPuntuacion, setMejorPuntuacion] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      const res = await scoresHeroService.obtenerHistorialCancion(usuarioId, cancion.id!);
      
      // Recharts dibuja de izquierda a derecha, invertimos para que el más viejo vaya primero en el chart
      setHistorial(res.historial.reverse());
      setMejorPuntuacion(res.mejorPuntuacion);
      setCargando(false);
    };
    cargar();
  }, [cancion.id, usuarioId]);

  return (
    <div className="hero-historial-overlay" onClick={onCerrar}>
      <div className="hero-historial-modal" onClick={e => e.stopPropagation()}>
        <div className="hero-historial-header">
          <h3>Historial: {cancion.titulo}</h3>
          <button className="hero-historial-close" onClick={onCerrar}>×</button>
        </div>

        {cargando ? (
          <div className="hero-historial-loading">Cargando...</div>
        ) : (
          <div className="hero-historial-content">
            <div className="hero-historial-top">
              <div className="hero-historial-stat">
                <span>Récord Personal</span>
                <strong>{mejorPuntuacion.toLocaleString('es-CO')} pts</strong>
              </div>
            </div>

            <div className="hero-historial-chart">
              <h4>Evolución de Rendimiento</h4>
              {historial.length > 0 ? (
                <GraficoHistorial historial={historial} />
              ) : (
                <p className="hero-historial-empty">No hay datos suficientes para graficar.</p>
              )}
            </div>

            <div className="hero-historial-table-container">
              <h4>Últimas Partidas</h4>
              <table className="hero-historial-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Modo</th>
                    <th>Precisión</th>
                    <th>Puntuación</th>
                  </tr>
                </thead>
                <tbody>
                  {[...historial].reverse().map(item => (
                    <tr key={item.id} className={item.puntuacion === mejorPuntuacion && mejorPuntuacion > 0 ? 'row-record' : ''}>
                      <td>{new Date(item.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}</td>
                      <td style={{ textTransform: 'capitalize' }}>{item.modo}</td>
                      <td>{item.precision_porcentaje}%</td>
                      <td>{item.puntuacion.toLocaleString('es-CO')}</td>
                    </tr>
                  ))}
                  {historial.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center' }}>No has jugado esta canción aún.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModalHistorialHero;
