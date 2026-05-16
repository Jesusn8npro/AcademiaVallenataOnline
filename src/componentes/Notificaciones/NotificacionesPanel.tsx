import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificaciones } from '../../hooks/useNotificaciones';
import { notificacionesService } from '../../servicios/notificacionesService';
import './NotificacionesPanel.css';

const ICONOS_TIPO: Record<string, string> = {
  like: '❤️',
  comentario: '💬',
  mencion: '📣',
  sistema: '🔔',
  nuevo_curso: '🎓',
};

function iconoPorTipo(tipo: string): string {
  return ICONOS_TIPO[tipo] ?? notificacionesService.obtenerIconoPorTipo(tipo);
}

interface Props {
  onCerrar: () => void;
}

const NotificacionesPanel: React.FC<Props> = ({ onCerrar }) => {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const { notificaciones, noLeidas, marcarLeida, marcarTodasLeidas, cargando } = useNotificaciones();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onCerrar();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onCerrar]);

  const handleClick = (id: string, urlDestino?: string, leida?: boolean) => {
    if (urlDestino) {
      const actual = window.location.pathname + window.location.search;
      if (urlDestino === actual) {
        navigate(urlDestino, { replace: true, state: { ts: Date.now() } });
      } else {
        navigate(urlDestino);
      }
    }
    onCerrar();
    if (!leida) marcarLeida(id);
  };

  return (
    <div className="np-panel" ref={panelRef}>
      <div className="np-header">
        <span className="np-titulo">
          Notificaciones
          {noLeidas > 0 && <span className="np-badge">{noLeidas}</span>}
        </span>
        <button
          className="np-btn-marcar-todas"
          onClick={marcarTodasLeidas}
          disabled={noLeidas === 0}
        >
          ✓ Marcar leídas
        </button>
      </div>

      <div className="np-lista">
        {cargando ? (
          <div className="np-vacio">
            <div className="np-spinner" />
            <p>Cargando...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="np-vacio">
            <span className="np-vacio-icono">🔕</span>
            <p>No tienes notificaciones aún</p>
          </div>
        ) : (
          notificaciones.map(n => (
            <div
              key={n.id}
              className={`np-item${!n.leida ? ' np-item--nueva' : ''}`}
              onClick={() => handleClick(n.id, n.url_accion, n.leida)}
            >
              <span className="np-item-icono">{n.icono || iconoPorTipo(n.tipo)}</span>
              <div className="np-item-body">
                <div className="np-item-top">
                  <span className="np-item-titulo">{n.titulo}</span>
                  <span className="np-item-tiempo">
                    {notificacionesService.formatearTiempoTranscurrido(n.fecha_creacion)}
                  </span>
                </div>
                <p className="np-item-mensaje">{n.mensaje}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificacionesPanel;
