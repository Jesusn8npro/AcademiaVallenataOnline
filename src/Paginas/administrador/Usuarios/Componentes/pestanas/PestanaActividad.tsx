import React from 'react';
import type { UsuarioAdmin } from '../../../../../servicios/usuariosAdminService';
import './PestanaActividad.css';
import { usePestanaActividad, formatearTiempo, formatearTiempoRelativo, formatearFecha } from './usePestanaActividad';

interface PestanaActividadProps {
  usuario: UsuarioAdmin;
}

const PestanaActividad: React.FC<PestanaActividadProps> = ({ usuario }) => {
  const { cargandoActividad, datosActividad } = usePestanaActividad(usuario);

  return (
    <div className="pestana-actividad">
      {cargandoActividad ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando actividad real del usuario...</p>
        </div>
      ) : (
        <>
          <div className="metricas-principales">
            <div className="metrica-card tiempo-total">
              <div className="metrica-valor">{formatearTiempo(datosActividad.tiempoTotal)}</div>
              <div className="metrica-label">Tiempo Total</div>
              <div className="metrica-detalle">{datosActividad.diasActivos} días activos</div>
            </div>

            <div className="metrica-card sesiones-hoy">
              <div className="metrica-valor">{datosActividad.sesionesHoy}</div>
              <div className="metrica-label">Sesiones Hoy</div>
              <div className="metrica-detalle">Promedio: {formatearTiempo(datosActividad.promedioSesionDiaria)}/día</div>
            </div>

            <div className="metrica-card ultima-actividad">
              <div className="metrica-valor">
                {datosActividad.ultimaActividad ? formatearTiempoRelativo(datosActividad.ultimaActividad) : 'Nunca'}
              </div>
              <div className="metrica-label">Última Actividad</div>
              <div className="metrica-detalle">Racha: {datosActividad.racha} días</div>
            </div>
          </div>

          <div className="actividad-chart">
            <h4>Actividad Últimos 14 Días</h4>
            <div className="chart-bars">
              {datosActividad.actividadPorDia.map((dia, index) => (
                <div key={index} className="chart-day">
                  <div
                    className="chart-bar"
                    style={{ height: `${Math.max(4, (dia.tiempo / 120) * 100)}px` }}
                    title={`${dia.fecha_formateada}: ${formatearTiempo(dia.tiempo)}`}
                  ></div>
                  <span className="chart-label">{dia.fecha_formateada}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sesiones-recientes">
            <h4> Sesiones Recientes</h4>
            <div className="sesiones-lista">
              {datosActividad.sesionesRecientes.map((sesion, index) => (
                <div key={index} className="sesion-item">
                  <div className="sesion-fecha">{formatearFecha(sesion.ultima_actividad)}</div>
                  <div className="sesion-tiempo">{sesion.tiempo_formateado}</div>
                  <div className="sesion-pagina">{sesion.pagina_actual || 'N/A'}</div>
                  <div className={`sesion-estado ${sesion.esta_activo ? 'activo' : ''}`}>
                    {sesion.esta_activo ? 'Activo' : 'Finalizada'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="paginas-favoritas">
            <h4>Páginas Más Visitadas</h4>
            <div className="paginas-lista">
              {datosActividad.paginasFavoritas.map((pagina, index) => (
                <div key={index} className="pagina-item">
                  <span className="pagina-nombre">{pagina.pagina}</span>
                  <div className="pagina-stats">
                    <span className="pagina-visitas">{pagina.visitas} visitas</span>
                    <span className="pagina-tiempo">{formatearTiempo(pagina.tiempo_total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {datosActividad.cursosProgreso.length > 0 && (
            <div className="cursos-progreso">
              <h4>📚 Progreso en Cursos</h4>
              <div className="cursos-grid">
                {datosActividad.cursosProgreso.map((curso, index) => (
                  <div key={index} className="curso-card">
                    <img src={curso.imagen} alt={curso.nombre} className="curso-imagen" />
                    <div className="curso-info">
                      <h5>{curso.nombre}</h5>
                      <div className="progreso-bar">
                        <div className="progreso-fill" style={{ width: `${curso.porcentaje_completado || 0}%` }}></div>
                      </div>
                      <span className="progreso-texto">{curso.progreso_texto}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PestanaActividad;
