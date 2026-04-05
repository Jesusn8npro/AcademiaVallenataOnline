import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={historial} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="created_at" 
                      tickFormatter={(val) => new Date(val).toLocaleDateString()}
                      stroke="#888" 
                    />
                    <YAxis yAxisId="left" stroke="#3b82f6" />
                    <YAxis yAxisId="right" orientation="right" stroke="#22c55e" />
                    <Tooltip 
                      labelFormatter={(val) => new Date(val).toLocaleString()}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend />
                    <Line yAxisId="left" type="monotone" name="Puntuación" dataKey="puntuacion" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" name="Precisión (%)" dataKey="precision_porcentaje" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
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
