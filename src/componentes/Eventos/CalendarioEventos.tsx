import React from 'react'
import './calendario-eventos.css'
import { useCalendarioEventos } from './useCalendarioEventos'
import FiltrosEventosPanel from './FiltrosEventosPanel'

interface Props {
  vista: 'calendario' | 'grid' | 'lista'
  onVistaChange: (vista: 'calendario' | 'grid' | 'lista') => void
  mostrarFiltros?: boolean
  eventosPorPagina?: number
}

const CalendarioEventos: React.FC<Props> = ({
  vista,
  onVistaChange,
  mostrarFiltros = true,
  eventosPorPagina = 12
}) => {
  const {
    eventos, loading, error,
    paginaActual, totalPaginas,
    filtros, setFiltros,
    formatearFecha, formatearHora, formatearPrecio,
    obtenerColorTipo, obtenerColorNivel,
    cargarEventos, aplicarFiltros, limpiarFiltros,
    cambiarPagina, irAEvento
  } = useCalendarioEventos({ eventosPorPagina })

  return (
    <div className="calendario-contenedor">
      <div className="calendario-header">
        <div className="calendario-titulos">
          <h1>📅 Calendario de Eventos</h1>
          <p>Descubre masterclasses, workshops y eventos especiales de acordeón</p>
        </div>
        <div className="vista-selector">
          <button className={`boton-vista ${vista === 'grid' ? 'activo' : ''}`} onClick={() => onVistaChange('grid')}>
            <span>Grid</span>
          </button>
          <button className={`boton-vista ${vista === 'lista' ? 'activo' : ''}`} onClick={() => onVistaChange('lista')}>
            <span>Lista</span>
          </button>
        </div>
      </div>

      {mostrarFiltros && (
        <FiltrosEventosPanel
          filtros={filtros}
          setFiltros={setFiltros}
          aplicarFiltros={aplicarFiltros}
          limpiarFiltros={limpiarFiltros}
        />
      )}

      {loading ? (
        <div className="cargando">
          <div><div className="spinner"></div><p>Cargando eventos...</p></div>
        </div>
      ) : error ? (
        <div className="error">
          <div>⚠️ Error</div>
          <p>{error}</p>
          <button onClick={cargarEventos}>Reintentar</button>
        </div>
      ) : eventos.length === 0 ? (
        <div className="vacio">
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📅</div>
          <h3>No hay eventos disponibles</h3>
          <p>No se encontraron eventos que coincidan con tus filtros.</p>
          <button onClick={limpiarFiltros}>Limpiar filtros</button>
        </div>
      ) : (
        <>
          {vista === 'grid' && (
            <div className="grid-eventos">
              {eventos.map((evento) => (
                <div key={evento.id} className="card-evento" onClick={() => irAEvento(evento.slug)}>
                  <div className="card-imagen">
                    {evento.imagen_portada ? (
                      <img src={evento.imagen_portada} alt={evento.titulo} />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', fontSize: '32px' }}>📅</div>
                    )}
                    <div className="badges">
                      <span className={obtenerColorTipo(evento.tipo_evento)}>{evento.tipo_evento}</span>
                      {evento.es_gratuito && <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>Gratis</span>}
                    </div>
                    <div className={obtenerColorNivel(evento.nivel_dificultad)}></div>
                  </div>
                  <div className="card-contenido">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 className="card-titulo">{evento.titulo}</h3>
                        <p className="card-descripcion">{evento.descripcion}</p>
                      </div>
                    </div>
                    <div className="meta">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {formatearFecha(evento.fecha_inicio)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
                        </svg>
                        {formatearHora(evento.fecha_inicio)}
                      </div>
                    </div>
                    <div className="footer">
                      <div className="inscritos">{evento.participantes_inscritos} inscritos</div>
                      <div className="precio">{evento.es_gratuito ? 'Gratis' : formatearPrecio(evento.precio)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {vista === 'lista' && (
            <div className="lista-eventos">
              {eventos.map((evento) => (
                <div key={evento.id} className="item-evento" onClick={() => irAEvento(evento.slug)}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div className="item-imagen">
                      {evento.imagen_portada ? (
                        <img src={evento.imagen_portada} alt={evento.titulo} />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', fontSize: '20px' }}>📅</div>
                      )}
                    </div>
                    <div className="item-contenido">
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                          <h3 className="item-titulo">{evento.titulo}</h3>
                          <p className="item-descripcion">{evento.descripcion}</p>
                          <div className="item-info">
                            <span className={obtenerColorTipo(evento.tipo_evento)}>{evento.tipo_evento}</span>
                            {evento.es_gratuito && <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>Gratis</span>}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6b7280' }}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {formatearFecha(evento.fecha_inicio)} - {formatearHora(evento.fecha_inicio)}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div className="item-precio">{evento.es_gratuito ? 'Gratis' : formatearPrecio(evento.precio)}</div>
                          <div className="inscritos">{evento.participantes_inscritos} inscritos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPaginas > 1 && (
            <div className="paginacion">
              <button onClick={() => cambiarPagina(paginaActual - 1)} disabled={paginaActual === 0}>Anterior</button>
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button key={i} onClick={() => cambiarPagina(i)} className={i === paginaActual ? 'activo' : ''}>{i + 1}</button>
              ))}
              <button onClick={() => cambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas - 1}>Siguiente</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CalendarioEventos
