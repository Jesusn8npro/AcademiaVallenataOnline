import React from 'react';
import type { Evento } from './useCalendarioEventos';
import {
  formatearFechaLarga as formatearFecha,
  formatearHora,
  formatearPrecioCOP as formatearPrecio,
} from '../../../utilidades/formatadores';

function getBadgeStyle(tipo: string) {
  const colorMap: Record<string, [string, string]> = {
    masterclass: ['#dbeafe', '#1e40af'], workshop: ['#dcfce7', '#166534'],
    concierto: ['#f3e8ff', '#6b21a8'], concurso: ['#ffedd5', '#9a3412'],
    webinar: ['#e0e7ff', '#3730a3'], reunion: ['#f3f4f6', '#1f2937'],
  };
  const [bg, color] = colorMap[tipo] || ['#f3f4f6', '#1f2937'];
  return { backgroundColor: bg, color };
}

function obtenerColorNivel(nivel: string) {
  const colores: Record<string, string> = {
    principiante: '#22c55e', intermedio: '#eab308', avanzado: '#f97316', profesional: '#ef4444',
  };
  return colores[nivel] || '#6b7280';
}

interface EventosDisplayProps {
  eventos: Evento[];
  vista: 'grid' | 'lista';
  onNavegar: (slug: string) => void;
}

const EventosDisplay: React.FC<EventosDisplayProps> = ({ eventos, vista, onNavegar }) => {
  if (vista === 'grid') {
    return (
      <div className="evt-cal-grid-layout">
        {eventos.map(evento => (
          <div key={evento.id} className="evt-cal-card" onClick={() => onNavegar(evento.slug)}>
            <div className="evt-cal-card-img-container">
              {evento.imagen_portada ? (
                <img src={evento.imagen_portada} alt={evento.titulo} className="evt-cal-card-img" />
              ) : (
                <div className="evt-cal-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  </svg>
                </div>
              )}
              <div className="evt-cal-badges">
                <span className="evt-cal-badge" style={getBadgeStyle(evento.tipo_evento)}>{evento.tipo_evento}</span>
                {evento.es_gratuito && <span className="evt-cal-badge-free">GRATIS</span>}
                {evento.es_destacado && <span className="evt-cal-badge-featured">★ Destacado</span>}
              </div>
              {evento.nivel_dificultad && (
                <div className="evt-cal-level-indicator" style={{ backgroundColor: obtenerColorNivel(evento.nivel_dificultad) }} />
              )}
            </div>
            <div className="evt-cal-card-body">
              <h3 className="evt-cal-card-title">{evento.titulo}</h3>
              {evento.descripcion_corta && <p className="evt-cal-card-desc">{evento.descripcion_corta}</p>}
              <div className="evt-cal-card-info">
                <div className="evt-cal-info-item"><span>📅 {formatearFecha(evento.fecha_inicio)}</span></div>
                <div className="evt-cal-info-item"><span>⏰ {formatearHora(evento.fecha_inicio)}</span></div>
                <div className="evt-cal-info-item"><span>📍 {evento.modalidad === 'online' ? 'En línea' : 'Presencial'}</span></div>
              </div>
              <div className="evt-cal-card-footer">
                <div>
                  {evento.es_gratuito ? (
                    <span className="evt-cal-price-free">Gratis</span>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {evento.precio_rebajado && evento.precio_rebajado < evento.precio ? (
                        <><span className="evt-cal-price-original">{formatearPrecio(evento.precio)}</span><span className="evt-cal-price">{formatearPrecio(evento.precio_rebajado)}</span></>
                      ) : (
                        <span className="evt-cal-price">{formatearPrecio(evento.precio)}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="evt-cal-stats">
                  <span>👥 {evento.participantes_inscritos}</span>
                  {evento.calificacion_promedio > 0 && <span>⭐ {evento.calificacion_promedio.toFixed(1)}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="evt-cal-list-container">
      {eventos.map(evento => (
        <div key={evento.id} className="evt-cal-list-card" onClick={() => onNavegar(evento.slug)}>
          <div className="evt-cal-list-body">
            <div className="evt-cal-list-flex">
              <div className="evt-cal-list-img">
                {evento.imagen_portada && <img src={evento.imagen_portada} alt={evento.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <div className="evt-cal-list-content">
                <h3 className="evt-cal-card-title" style={{ fontSize: '1.25rem' }}>{evento.titulo}</h3>
                <p className="evt-cal-subtitle" style={{ marginBottom: '0.5rem' }}>{evento.descripcion_corta}</p>
                <div className="evt-cal-info-item">
                  <span>📅 {formatearFecha(evento.fecha_inicio)} • ⏰ {formatearHora(evento.fecha_inicio)} • {evento.modalidad}</span>
                </div>
              </div>
              <div className="evt-cal-list-sidebar">
                <span className="evt-cal-badge" style={getBadgeStyle(evento.tipo_evento)}>{evento.tipo_evento}</span>
                {evento.es_gratuito ? <span className="evt-cal-price-free">Gratis</span> : <span className="evt-cal-price">{formatearPrecio(evento.precio)}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventosDisplay;
