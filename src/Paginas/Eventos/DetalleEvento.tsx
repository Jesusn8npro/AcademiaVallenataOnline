import React from 'react';
import { useDetalleEvento } from './useDetalleEvento';
import HeroEvento from './Componentes/HeroEvento';
import { sanitizarTextoConSaltos } from '../../utilidades/sanitizar';
import './DetalleEvento.css';

function formatearFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatearHora(fecha: string) {
  return new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function obtenerModalidadTexto(modalidad: string) {
  const modalidades: Record<string, string> = { online: 'Online', presencial: 'Presencial', hibrido: 'Híbrido' };
  return modalidades[modalidad] || modalidad;
}

const DetalleEvento: React.FC = () => {
  const {
    usuario, navigate, evento, comentarios, materiales, cargando, error,
    inscrito, procesandoInscripcion, nuevoComentario, setNuevoComentario,
    enviandoComentario, tabActivo, setTabActivo, mensajeInscripcion, mensajeComentario,
    confirmandoCancelacion, setConfirmandoCancelacion, estadoEvento, puedeInscribirse,
    inscribirseEvento, iniciarCancelacion, confirmarCancelacion, enviarComentario,
  } = useDetalleEvento();

  if (cargando) {
    return (
      <div className="evt-det-loading">
        <div className="evt-det-spinner"></div>
        <p style={{ marginTop: '1rem', color: '#4b5563' }}>Cargando evento...</p>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="evt-det-error">
        <div className="evt-det-error-icon">⚠️</div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Error</h1>
        <p style={{ color: '#4b5563', marginBottom: '1rem' }}>{error}</p>
        <button onClick={() => navigate('/eventos')} className="evt-det-btn-back">Volver a Eventos</button>
      </div>
    );
  }

  return (
    <main className="evt-det-page">
      <HeroEvento
        evento={evento} estadoEvento={estadoEvento} inscrito={inscrito}
        puedeInscribirse={puedeInscribirse} procesandoInscripcion={procesandoInscripcion}
        usuario={usuario} confirmandoCancelacion={confirmandoCancelacion}
        mensajeInscripcion={mensajeInscripcion}
        onInscribirse={inscribirseEvento} onIniciarCancelacion={iniciarCancelacion}
        onConfirmarCancelacion={confirmarCancelacion}
        onCancelarConfirmacion={() => setConfirmandoCancelacion(false)}
        onNavegar={navigate}
      />

      <div className="evt-det-content-wrapper">
        <div className="evt-det-tabs-nav">
          <button className={`evt-det-tab-btn ${tabActivo === 'descripcion' ? 'active' : ''}`} onClick={() => setTabActivo('descripcion')}>Descripción</button>
          <button className={`evt-det-tab-btn ${tabActivo === 'comentarios' ? 'active' : ''}`} onClick={() => setTabActivo('comentarios')}>Comentarios ({comentarios.length})</button>
          <button className={`evt-det-tab-btn ${tabActivo === 'materiales' ? 'active' : ''}`} onClick={() => setTabActivo('materiales')}>Materiales ({materiales.length})</button>
        </div>

        <div className="evt-det-main-grid">
          <div>
            {tabActivo === 'descripcion' && (
              <div className="evt-det-card">
                <h2 className="evt-det-section-title">Sobre este evento</h2>
                <div className="evt-det-prose">
                  {evento.descripcion
                    ? <div dangerouslySetInnerHTML={{ __html: sanitizarTextoConSaltos(evento.descripcion) }} />
                    : <p style={{ color: '#4b5563' }}>No hay descripción disponible para este evento.</p>}
                </div>
                {evento.tags && evento.tags.length > 0 && (
                  <div style={{ marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Etiquetas</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {evento.tags.map((tag: string) => (
                        <span key={tag} className="evt-det-badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>#{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tabActivo === 'comentarios' && (
              <div className="evt-det-card">
                <h2 className="evt-det-section-title">Comentarios</h2>
                {usuario ? (
                  <div className="evt-det-comment-form">
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ flexShrink: 0 }}>
                        <div className="evt-det-avatar">{usuario.nombre?.charAt(0) || usuario.email?.charAt(0) || 'U'}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <textarea value={nuevoComentario} onChange={(e) => setNuevoComentario(e.target.value)}
                          placeholder="Comparte tus pensamientos sobre este evento..." className="evt-det-textarea" rows={3} />
                        <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <button onClick={enviarComentario} disabled={!nuevoComentario.trim() || enviandoComentario}
                            className="evt-det-btn-primary" style={{ width: 'auto' }}>
                            {enviandoComentario ? 'Enviando...' : 'Comentar'}
                          </button>
                        </div>
                        {mensajeComentario && (
                          <p style={{ color: mensajeComentario.startsWith('Error') ? '#fca5a5' : '#86efac', fontSize: '0.875rem', marginTop: '0.5rem' }}>{mensajeComentario}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', marginBottom: '2rem' }}>
                    <p style={{ color: '#4b5563' }}>Debes iniciar sesión para ver y escribir comentarios</p>
                  </div>
                )}
                <div className="evt-det-comment-list">
                  {comentarios.length > 0 ? (
                    comentarios.map((comentario: any, index: number) => (
                      <div key={index} className="evt-det-comment-item">
                        <div style={{ flexShrink: 0 }}>
                          <div className="evt-det-avatar" style={{ backgroundColor: '#d1d5db', color: '#4b5563' }}>{comentario.usuario?.nombre?.charAt(0) || 'U'}</div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <h4 className="evt-det-comment-name">{comentario.usuario?.nombre || 'Usuario'}</h4>
                            <span className="evt-det-comment-date">{new Date(comentario.created_at).toLocaleDateString('es-ES')}</span>
                          </div>
                          <p className="evt-det-comment-text">{comentario.mensaje}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                      <p style={{ color: '#9ca3af' }}>Aún no hay comentarios. ¡Sé el primero!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tabActivo === 'materiales' && (
              <div className="evt-det-card">
                <h2 className="evt-det-section-title">Materiales del Evento</h2>
                {materiales.length > 0 ? (
                  <div>
                    {materiales.map((material: any, index: number) => (
                      <div key={index} className="evt-det-material-item">
                        <div>
                          <h3 className="evt-det-material-title">{material.titulo}</h3>
                          {material.descripcion && <p style={{ fontSize: '0.875rem', color: '#4b5563', marginBottom: '0.25rem' }}>{material.descripcion}</p>}
                          <span className="evt-det-badge" style={{ backgroundColor: '#f3f4f6', color: '#4b5563', fontSize: '0.75rem' }}>{material.tipo}</span>
                        </div>
                        {material.url && (
                          <a href={material.url} target="_blank" rel="noopener noreferrer"
                            className="evt-det-btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                            Descargar
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <p style={{ color: '#9ca3af' }}>No hay materiales disponibles.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="evt-det-sidebar-card">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Detalles del Evento</h3>
              <div className="evt-det-sidebar-list">
                <div><dt className="evt-det-dt">Fecha</dt><dd className="evt-det-dd">{formatearFecha(evento.fecha_inicio)}</dd></div>
                <div><dt className="evt-det-dt">Hora</dt><dd className="evt-det-dd">{formatearHora(evento.fecha_inicio)}</dd></div>
                {evento.fecha_fin && <div><dt className="evt-det-dt">Finaliza</dt><dd className="evt-det-dd">{formatearHora(evento.fecha_fin)}</dd></div>}
                <div><dt className="evt-det-dt">Modalidad</dt><dd className="evt-det-dd">{obtenerModalidadTexto(evento.modalidad)}</dd></div>
                {evento.nivel_dificultad && <div><dt className="evt-det-dt">Nivel</dt><dd className="evt-det-dd" style={{ textTransform: 'capitalize' }}>{evento.nivel_dificultad}</dd></div>}
                {evento.categoria && <div><dt className="evt-det-dt">Categoría</dt><dd className="evt-det-dd" style={{ textTransform: 'capitalize' }}>{evento.categoria}</dd></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DetalleEvento;
