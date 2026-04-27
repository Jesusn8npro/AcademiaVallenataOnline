import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCalendarioEventos } from './useCalendarioEventos';
import FiltrosCalendario from './FiltrosCalendario';
import EventosDisplay from './EventosDisplay';
import './CalendarioEventos.css';

interface CalendarioEventosProps {
  vistaInicial?: 'grid' | 'lista';
  mostrarFiltros?: boolean;
  eventosPorPagina?: number;
}

const CalendarioEventos: React.FC<CalendarioEventosProps> = ({
  vistaInicial = 'grid', mostrarFiltros = true, eventosPorPagina = 12,
}) => {
  const navigate = useNavigate();
  const {
    vista, setVista, eventos, loading, error, paginaActual, setPaginaActual,
    totalPaginas, filtros, handleFiltroChange, limpiarFiltros, cargarEventos,
  } = useCalendarioEventos(eventosPorPagina, vistaInicial);

  return (
    <div className="evt-cal-container">
      <div className="evt-cal-header">
        <div className="evt-cal-title-section">
          <h1 className="evt-cal-title">📅 Calendario de Eventos</h1>
          <p className="evt-cal-subtitle">Descubre masterclasses, workshops y eventos especiales de acordeón</p>
        </div>
        <div className="evt-cal-view-toggle">
          <button className={`evt-cal-view-btn ${vista === 'grid' ? 'active' : ''}`} onClick={() => setVista('grid')}>
            <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            Grid
          </button>
          <button className={`evt-cal-view-btn ${vista === 'lista' ? 'active' : ''}`} onClick={() => setVista('lista')}>
            <svg fill="currentColor" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
            Lista
          </button>
        </div>
      </div>

      {mostrarFiltros && (
        <FiltrosCalendario filtros={filtros} onChange={handleFiltroChange} onLimpiar={limpiarFiltros} />
      )}

      {loading ? (
        <div className="evt-cal-loading"><div className="evt-cal-spinner" /></div>
      ) : error ? (
        <div className="evt-cal-error-container">
          <div>❌ Error cargando eventos</div>
          <p>{error}</p>
          <button className="evt-cal-page-btn" onClick={cargarEventos} style={{ marginTop: '1rem' }}>Reintentar</button>
        </div>
      ) : (
        <>
          {eventos.length === 0 ? (
            <div className="evt-cal-empty">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem', color: '#9ca3af' }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <h3 className="evt-cal-title" style={{ fontSize: '1.25rem' }}>No hay eventos</h3>
              <p className="evt-cal-subtitle">No se encontraron eventos con los filtros seleccionados.</p>
            </div>
          ) : (
            <EventosDisplay eventos={eventos} vista={vista} onNavegar={(slug) => navigate(`/eventos/${slug}`)} />
          )}

          {totalPaginas > 1 && (
            <div className="evt-cal-pagination">
              <button className="evt-cal-page-btn" disabled={paginaActual === 0} onClick={() => setPaginaActual(p => p - 1)}>Anterior</button>
              {Array.from({ length: totalPaginas }).map((_, i) => (
                (i === 0 || i === totalPaginas - 1 || (i >= paginaActual - 1 && i <= paginaActual + 1)) ? (
                  <button key={i} className={`evt-cal-page-btn ${i === paginaActual ? 'active' : ''}`} onClick={() => setPaginaActual(i)}>{i + 1}</button>
                ) : (
                  (i === paginaActual - 2 || i === paginaActual + 2) && <span key={i}>...</span>
                )
              ))}
              <button className="evt-cal-page-btn" disabled={paginaActual === totalPaginas - 1} onClick={() => setPaginaActual(p => p + 1)}>Siguiente</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarioEventos;
