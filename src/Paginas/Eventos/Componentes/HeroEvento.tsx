import React from 'react';
import { formatearFechaLarga as formatearFecha, formatearHora } from '../../../utilidades/formatadores';

interface HeroEventoProps {
  evento: any;
  estadoEvento: string;
  inscrito: boolean;
  puedeInscribirse: boolean;
  procesandoInscripcion: boolean;
  usuario: any;
  confirmandoCancelacion: boolean;
  mensajeInscripcion: string;
  onInscribirse: () => void;
  onIniciarCancelacion: () => void;
  onConfirmarCancelacion: () => void;
  onCancelarConfirmacion: () => void;
  onNavegar: (ruta: string) => void;
}

function obtenerTipoEventoTexto(tipo: string) {
  const tipos: Record<string, string> = {
    masterclass: 'Masterclass', workshop: 'Workshop', concierto: 'Concierto',
    concurso: 'Concurso', webinar: 'Webinar', reunion: 'Reunión',
  };
  return tipos[tipo] || tipo;
}

function obtenerModalidadTexto(modalidad: string) {
  const modalidades: Record<string, string> = { online: 'Online', presencial: 'Presencial', hibrido: 'Híbrido' };
  return modalidades[modalidad] || modalidad;
}

const HeroEvento: React.FC<HeroEventoProps> = ({
  evento, estadoEvento, inscrito, puedeInscribirse, procesandoInscripcion,
  usuario, confirmandoCancelacion, mensajeInscripcion,
  onInscribirse, onIniciarCancelacion, onConfirmarCancelacion, onCancelarConfirmacion, onNavegar,
}) => (
  <div className="evt-det-hero">
    {(evento.imagen_banner || evento.imagen_portada) && (
      <div className="evt-det-hero-bg">
        <img src={evento.imagen_banner || evento.imagen_portada} alt={evento.titulo} className="evt-det-hero-img" />
      </div>
    )}
    <div className="evt-det-hero-content">
      <div className="evt-det-hero-grid">
        <div>
          <div className="evt-det-badges">
            <span className="evt-det-badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>{obtenerTipoEventoTexto(evento.tipo_evento)}</span>
            <span className="evt-det-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>{obtenerModalidadTexto(evento.modalidad)}</span>
            {estadoEvento === 'en_vivo' ? (
              <span className="evt-det-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>🔴 En Vivo</span>
            ) : estadoEvento === 'finalizado' ? (
              <span className="evt-det-badge" style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}>✅ Finalizado</span>
            ) : estadoEvento === 'cancelado' && (
              <span className="evt-det-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>❌ Cancelado</span>
            )}
          </div>
          <h1 className="evt-det-title">{evento.titulo}</h1>
          {evento.descripcion_corta && <p className="evt-det-desc-short">{evento.descripcion_corta}</p>}
          <div className="evt-det-key-info">
            <div className="evt-det-info-item">
              <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div><p className="evt-det-label">Fecha</p><p className="evt-det-value">{formatearFecha(evento.fecha_inicio)}</p></div>
            </div>
            <div className="evt-det-info-item">
              <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" />
              </svg>
              <div><p className="evt-det-label">Hora</p><p className="evt-det-value">{formatearHora(evento.fecha_inicio)}</p></div>
            </div>
            {evento.instructor_nombre && (
              <div className="evt-det-info-item">
                <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <div><p className="evt-det-label">Instructor</p><p className="evt-det-value">{evento.instructor_nombre}</p></div>
              </div>
            )}
            <div className="evt-det-info-item">
              <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <div>
                <p className="evt-det-label">Participantes</p>
                <p className="evt-det-value">{evento.participantes_inscritos || 0}{evento.capacidad_maxima && ` / ${evento.capacidad_maxima}`}</p>
              </div>
            </div>
          </div>
          <div className="evt-det-price-section">
            {evento.precio > 0 ? (
              <div>
                <span className="evt-det-price-main">${(evento.precio_rebajado || evento.precio).toLocaleString('es-CO')}</span>
                <span className="evt-det-price-currency">{evento.moneda || 'COP'}</span>
                {evento.precio_rebajado && evento.precio_rebajado < evento.precio && (
                  <div className="evt-det-price-old">${evento.precio.toLocaleString('es-CO')} {evento.moneda || 'COP'}</div>
                )}
              </div>
            ) : (
              <span className="evt-det-price-main" style={{ color: '#86efac' }}>¡GRATIS!</span>
            )}
          </div>
        </div>

        <div className="evt-det-action-card">
          {!usuario ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: '#bfdbfe', marginBottom: '1rem' }}>Inicia sesión para inscribirte al evento</p>
              <button onClick={() => onNavegar('/login')} className="evt-det-btn-primary">Iniciar Sesión</button>
            </div>
          ) : inscrito ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#86efac', marginBottom: '1rem' }}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.5rem' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span style={{ fontWeight: 600 }}>Ya estás inscrito</span>
              </div>
              {estadoEvento === 'en_vivo' && evento.link_transmision ? (
                <a href={evento.link_transmision} target="_blank" rel="noopener noreferrer" className="evt-det-btn-red" style={{ marginBottom: '0.75rem', display: 'flex' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}><polygon points="5,3 19,12 5,21" /></svg>
                  Unirse al Evento
                </a>
              ) : estadoEvento === 'programado' && (
                <div className="evt-det-btn-primary" style={{ cursor: 'default', marginBottom: '0.75rem' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                  Evento Próximo
                </div>
              )}
              {confirmandoCancelacion ? (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginBottom: '0.5rem' }}>¿Confirmar cancelación?</p>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={onConfirmarCancelacion} className="evt-det-btn-secondary">Sí, cancelar</button>
                    <button onClick={onCancelarConfirmacion} className="evt-det-btn-primary" style={{ width: 'auto' }}>No</button>
                  </div>
                </div>
              ) : (
                <button onClick={onIniciarCancelacion} disabled={procesandoInscripcion} className="evt-det-btn-secondary">
                  {procesandoInscripcion ? 'Cancelando...' : 'Cancelar Inscripción'}
                </button>
              )}
            </div>
          ) : puedeInscribirse ? (
            <div style={{ textAlign: 'center' }}>
              <button onClick={onInscribirse} disabled={procesandoInscripcion} className="evt-det-btn-green">
                {procesandoInscripcion ? (
                  <span className="evt-det-spinner" style={{ width: '1.25rem', height: '1.25rem', borderBottomColor: 'white' }}></span>
                ) : (
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {procesandoInscripcion ? ' Inscribiendo...' : ' Inscribirse al Evento'}
              </button>
              {evento.capacidad_maxima && evento.participantes_inscritos >= evento.capacidad_maxima && (
                <p style={{ color: '#fca5a5', fontSize: '0.875rem', marginTop: '0.5rem' }}>⚠️ Evento lleno</p>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              {estadoEvento === 'finalizado' ? <p style={{ color: '#d1d5db' }}>Este evento ha finalizado</p>
                : estadoEvento === 'cancelado' ? <p style={{ color: '#fca5a5' }}>Este evento ha sido cancelado</p>
                : <p style={{ color: '#fde047' }}>No disponible para inscripción</p>}
            </div>
          )}
          {mensajeInscripcion && (
            <p style={{ color: '#86efac', fontSize: '0.875rem', marginTop: '0.75rem', textAlign: 'center' }}>{mensajeInscripcion}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default HeroEvento;
