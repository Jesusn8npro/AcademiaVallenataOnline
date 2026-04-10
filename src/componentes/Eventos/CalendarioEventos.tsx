import React, { useState, useEffect } from 'react';
import eventosService, { type EventoCompleto, type FiltrosEventos } from '../../servicios/eventosServicio';
import './calendario-eventos.css';

interface Props {
  vista: 'calendario' | 'grid' | 'lista';
  onVistaChange: (vista: 'calendario' | 'grid' | 'lista') => void;
  mostrarFiltros?: boolean;
  eventosPorPagina?: number;
}

const CalendarioEventos: React.FC<Props> = ({ 
  vista, 
  onVistaChange, 
  mostrarFiltros = true, 
  eventosPorPagina = 12 
}) => {
  // Estado del componente
  const [eventos, setEventos] = useState<EventoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalEventos, setTotalEventos] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);

  // Filtros
  const [filtros, setFiltros] = useState<FiltrosEventos>({
    categoria: '',
    tipo_evento: '',
    nivel_dificultad: '',
    es_gratuito: undefined,
    busqueda: '',
    fecha_desde: '',
    fecha_hasta: ''
  });

  // Opciones para filtros
  const categorias = [
    { value: '', label: 'Todas las categorías' },
    { value: 'tecnica', label: 'Técnica' },
    { value: 'teoria', label: 'Teoría' },
    { value: 'repertorio', label: 'Repertorio' },
    { value: 'historia', label: 'Historia' }
  ];

  const tiposEvento = [
    { value: '', label: 'Todos los tipos' },
    { value: 'masterclass', label: 'Masterclass' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'concierto', label: 'Concierto' },
    { value: 'concurso', label: 'Concurso' },
    { value: 'webinar', label: 'Webinar' },
    { value: 'reunion', label: 'Reunión' }
  ];

  const nivelesEvento = [
    { value: '', label: 'Todos los niveles' },
    { value: 'principiante', label: 'Principiante' },
    { value: 'intermedio', label: 'Intermedio' },
    { value: 'avanzado', label: 'Avanzado' },
    { value: 'profesional', label: 'Profesional' }
  ];

  // Funciones de utilidad
  const formatearFecha = (fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (fecha: string): string => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatearPrecio = (precio: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const obtenerColorTipo = (tipo: string): string => {
    const clases: Record<string, string> = {
      masterclass: 'badge badge-tipo masterclass',
      workshop: 'badge badge-tipo workshop',
      concierto: 'badge badge-tipo concierto',
      concurso: 'badge badge-tipo concurso',
      webinar: 'badge badge-tipo webinar',
      reunion: 'badge badge-tipo reunion'
    };
    return clases[tipo] || 'badge badge-tipo reunion';
  };

  const obtenerColorNivel = (nivel: string | null): string => {
    if (!nivel) return 'nivel nivel-dot';
    const clases: Record<string, string> = {
      principiante: 'nivel nivel-dot principiante',
      intermedio: 'nivel nivel-dot intermedio',
      avanzado: 'nivel nivel-dot avanzado',
      profesional: 'nivel nivel-dot profesional'
    };
    return clases[nivel] || 'nivel nivel-dot';
  };

  // Cargar eventos
  const cargarEventos = async (): Promise<void> => {
    try {
    setLoading(true);
    setError(null);

      const resultado = await eventosService.obtenerEventos({
        ...filtros,
        limit: eventosPorPagina,
        offset: paginaActual * eventosPorPagina
      });

      setEventos(resultado.eventos);
      setTotalEventos(resultado.total);
      setTotalPaginas(Math.ceil(resultado.total / eventosPorPagina));
    } catch (err) {
      console.error('Error al cargar eventos:', err);
      setError('Error al cargar los eventos. Por favor, intenta de nuevo.');
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  // Aplicar filtros
  const aplicarFiltros = (): void => {
    setPaginaActual(0);
    cargarEventos();
  };

  // Limpiar filtros
  const limpiarFiltros = (): void => {
    setFiltros({
      categoria: '',
      tipo_evento: '',
      nivel_dificultad: '',
      es_gratuito: undefined,
      busqueda: '',
      fecha_desde: '',
      fecha_hasta: ''
    });
    setPaginaActual(0);
  };

  const cambiarPagina = (nuevaPagina: number): void => {
    setPaginaActual(nuevaPagina);
  };

  const irAEvento = (slug: string | null): void => {
    if (slug) {
    window.location.href = `/eventos/${slug}`;
    }
  };

  // Cargar eventos al montar el componente
  useEffect(() => {
    cargarEventos();
  }, [paginaActual]);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    cargarEventos();
  }, [filtros]);

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

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="filtros">
          <div className="filtros-top">
            <h3>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3"/>
              </svg>
              Filtros
            </h3>
            <button onClick={limpiarFiltros}>
              Limpiar filtros
            </button>
          </div>

          <div className="filtros-grid">
            {/* Búsqueda */}
            <div className="campo xl:col-span-2">
              <label>
                Buscar eventos
              </label>
              <input
                type="text"
                placeholder="Busca por título o descripción..."
                value={filtros.busqueda}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, busqueda: e.target.value }));
                  aplicarFiltros();
                }}
              />
            </div>

            {/* Categoría */}
            <div className="campo">
              <label>Categoría</label>
              <select
                value={filtros.categoria}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, categoria: e.target.value }));
                  aplicarFiltros();
                }}
              >
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* Tipo */}
            <div className="campo">
              <label>Tipo</label>
              <select
                value={filtros.tipo_evento}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, tipo_evento: e.target.value }));
                  aplicarFiltros();
                }}
              >
                {tiposEvento.map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>

            {/* Nivel */}
            <div className="campo">
              <label>Nivel</label>
              <select
                value={filtros.nivel_dificultad}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, nivel_dificultad: e.target.value }));
                  aplicarFiltros();
                }}
              >
                {nivelesEvento.map(nivel => (
                  <option key={nivel.value} value={nivel.value}>{nivel.label}</option>
                ))}
              </select>
            </div>

            {/* Checkbox Solo gratuitos */}
            <div className="checkbox-linea">
              <input
                type="checkbox"
                id="solo-gratuitos"
                checked={filtros.es_gratuito === true}
                onChange={(e) => {
                  setFiltros(prev => ({ 
                    ...prev, 
                    es_gratuito: e.target.checked ? true : undefined 
                  }));
                  aplicarFiltros();
                }}
              />
              <label htmlFor="solo-gratuitos">
                Solo eventos gratuitos
              </label>
            </div>

            {/* Fecha desde */}
            <div className="campo">
              <label>Desde</label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => {
                  setFiltros(prev => ({ ...prev, fecha_desde: e.target.value }));
                  aplicarFiltros();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {loading ? (
        <div className="cargando">
          <div>
            <div className="spinner"></div>
            <p>Cargando eventos...</p>
          </div>
        </div>
      ) : error ? (
        <div className="error">
          <div>⚠️ Error</div>
          <p>{error}</p>
          <button onClick={cargarEventos}>Reintentar</button>
        </div>
      ) : eventos.length === 0 ? (
        <div className="vacio">
          <div style={{fontSize:'48px',marginBottom:'12px'}}>📅</div>
          <h3>No hay eventos disponibles</h3>
          <p>No se encontraron eventos que coincidan con tus filtros.</p>
          <button onClick={limpiarFiltros}>Limpiar filtros</button>
        </div>
      ) : (
        <>
          {/* Vista Grid */}
          {vista === 'grid' && (
            <div className="grid-eventos">
                  {eventos.map((evento) => (
                    <div 
                      key={evento.id} 
                  className="card-evento"
                      onClick={() => irAEvento(evento.slug)}
                    >
                  {/* Imagen */}
                  <div className="card-imagen">
                        {evento.imagen_portada ? (
                          <img
                            src={evento.imagen_portada}
                            alt={evento.titulo}
                          />
                        ) : (
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#fff',fontSize:'32px'}}>
                        📅
                          </div>
                        )}

                    {/* Badges */}
                    <div className="badges">
                          <span className={obtenerColorTipo(evento.tipo_evento)}>
                            {evento.tipo_evento}
                          </span>
                          {evento.es_gratuito && (
                        <span className="badge" style={{background:'#dcfce7',color:'#166534'}}>
                          Gratis
                            </span>
                          )}
                        </div>

                    {/* Nivel */}
                          <div className={obtenerColorNivel(evento.nivel_dificultad)}></div>
                      </div>

                  {/* Contenido */}
                      <div className="card-contenido">
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                      <div style={{flex:1}}>
                        <h3 className="card-titulo">
                          {evento.titulo}
                        </h3>
                        <p className="card-descripcion">
                          {evento.descripcion}
                          </p>
                      </div>
                    </div>

                    {/* Fecha y hora */}
                    <div className="meta">
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                              <line x1="16" y1="2" x2="16" y2="6"/>
                              <line x1="8" y1="2" x2="8" y2="6"/>
                              <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                        {formatearFecha(evento.fecha_inicio)}
                          </div>
                      <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12,6 12,12 16,14"/>
                            </svg>
                              {formatearHora(evento.fecha_inicio)}
                          </div>
                          </div>

                    {/* Footer */}
                    <div className="footer">
                      <div className="inscritos">
                        {evento.participantes_inscritos} inscritos
                            </div>
                      <div className="precio">
                        {evento.es_gratuito ? 'Gratis' : formatearPrecio(evento.precio)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          )}

          {/* Vista Lista */}
          {vista === 'lista' && (
            <div className="lista-eventos">
              {eventos.map((evento) => (
                <div 
                  key={evento.id}
                  className="item-evento"
                  onClick={() => irAEvento(evento.slug)}
                >
                  <div style={{display:'flex',gap:'16px',alignItems:'flex-start'}}>
                    {/* Imagen pequeña */}
                    <div className="item-imagen">
                      {evento.imagen_portada ? (
                        <img
                          src={evento.imagen_portada}
                          alt={evento.titulo}
                        />
                      ) : (
                        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',color:'#fff',fontSize:'20px'}}>
                          📅
                        </div>
                      )}
                    </div>

                    {/* Contenido */}
                    <div className="item-contenido">
                      <div style={{display:'flex',justifyContent:'space-between'}}>
                        <div style={{flex:1}}>
                          <h3 className="item-titulo">
                            {evento.titulo}
                          </h3>
                          <p className="item-descripcion">
                            {evento.descripcion}
                          </p>

                          {/* Badges y fecha */}
                          <div className="item-info">
                            <span className={obtenerColorTipo(evento.tipo_evento)}>
                              {evento.tipo_evento}
                            </span>
                            {evento.es_gratuito && (
                              <span className="badge" style={{background:'#dcfce7',color:'#166534'}}>
                                Gratis
                              </span>
                            )}
                            <div style={{display:'flex',alignItems:'center',gap:'6px',color:'#6b7280'}}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                              </svg>
                              {formatearFecha(evento.fecha_inicio)} - {formatearHora(evento.fecha_inicio)}
                            </div>
                          </div>
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div className="item-precio">
                            {evento.es_gratuito ? 'Gratis' : formatearPrecio(evento.precio)}
                          </div>
                          <div className="inscritos">
                            {evento.participantes_inscritos} inscritos
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="paginacion">
              <button
                onClick={() => cambiarPagina(paginaActual - 1)}
                disabled={paginaActual === 0}
              >
                Anterior
              </button>
              
              {Array.from({ length: totalPaginas }, (_, i) => (
                <button
                  key={i}
                  onClick={() => cambiarPagina(i)}
                  className={i === paginaActual ? 'activo' : ''}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => cambiarPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas - 1}
              >
                Siguiente
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CalendarioEventos; 
