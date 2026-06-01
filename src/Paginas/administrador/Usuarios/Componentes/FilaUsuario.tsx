import * as React from 'react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import type { Usuario } from '../useGestionUsuarios';
import { formatearTiempoRelativo } from '../../../../utilidades/formatadores';

interface Props {
  usuario: Usuario;
  seleccionado: boolean;
  onToggleSeleccion: (id: string) => void;
  onSeleccionar: (u: Usuario) => void;
  onContextMenu: (e: React.MouseEvent, id: string) => void;
}

function formatearTiempo(min?: number | null): string {
  const m = min || 0;
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

/** Etiqueta para usuarios SIN membresía activa, según el contenido suelto que tengan. */
function etiquetaContenido(u: Usuario): { texto: string; cls: string } {
  const cursos = u.total_cursos || 0, tut = u.total_tutoriales || 0, paq = u.total_paquetes || 0;
  const total = u.total_contenido || 0;
  if (total === 0) return { texto: 'Sin membresía', cls: 'gu-badge-sin' };
  if (cursos > 0 && tut === 0 && paq === 0) return { texto: cursos === 1 ? 'Solo curso' : 'Solo cursos', cls: 'gu-badge-curso' };
  if (tut > 0 && cursos === 0 && paq === 0) return { texto: 'Solo tutoriales', cls: 'gu-badge-tutoriales' };
  if (paq > 0 && cursos === 0 && tut === 0) return { texto: paq === 1 ? 'Paquete' : 'Paquetes', cls: 'gu-badge-paquete' };
  return { texto: 'Contenido mixto', cls: 'gu-badge-tutoriales' };
}

const FilaUsuario: React.FC<Props> = ({ usuario: u, seleccionado, onToggleSeleccion, onSeleccionar, onContextMenu }) => {
  const [avatarError, setAvatarError] = useState(false);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const celdaRef = useRef<HTMLDivElement>(null);

  const tieneMembresia = !!u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa';
  const dias = u.membresia_dias_restantes;
  const porVencer = tieneMembresia && dias != null && dias <= 7;
  const refActividad = u.ultima_sesion || u.ultima_actividad;
  const contenido = u.contenido || [];
  const etqContenido = etiquetaContenido(u);

  const abrirHover = () => {
    const r = celdaRef.current?.getBoundingClientRect();
    if (r) setHoverPos({ x: r.left, y: r.bottom + 6 });
  };

  return (
    <tr
      className={`gestion-usuarios-fila-usuario ${u.eliminado ? 'eliminado' : ''} ${seleccionado ? 'seleccionado' : ''}`}
      onContextMenu={(e) => onContextMenu(e, u.id)}
    >
      <td className="gestion-usuarios-celda-checkbox">
        <input type="checkbox" checked={seleccionado} onChange={(e) => { e.stopPropagation(); onToggleSeleccion(u.id); }} className="gestion-usuarios-checkbox-usuario" />
      </td>

      <td className="gestion-usuarios-celda-usuario">
        <div
          ref={celdaRef}
          className="gestion-usuarios-info-usuario"
          onClick={() => onSeleccionar(u)}
          onMouseEnter={abrirHover}
          onMouseLeave={() => setHoverPos(null)}
          style={{ cursor: 'pointer' }}
        >
          {u.url_foto_perfil && !avatarError ? (
            <Image src={u.url_foto_perfil} alt={u.nombre_completo} width={40} height={40} style={{ objectFit: 'cover' }} className="gestion-usuarios-avatar" onError={() => setAvatarError(true)} />
          ) : (
            <div className="gestion-usuarios-avatar-placeholder">{u.nombre?.charAt(0) || ''}{u.apellido?.charAt(0) || ''}</div>
          )}
          <div className="gestion-usuarios-datos-usuario">
            <span className="gestion-usuarios-nombre">{u.nombre_completo || `${u.nombre || ''} ${u.apellido || ''}`.trim()}</span>
            <span className="gestion-usuarios-ubicacion">{u.ciudad ? `${u.ciudad}, ${u.pais}` : u.pais || ''}</span>
          </div>
        </div>

        {hoverPos && createPortal(
          <div className="gu-hover-card" style={{ left: hoverPos.x, top: hoverPos.y }}>
            <div className="gu-hover-stats">
              <span>🎯 {u.total_contenido || 0} contenidos</span>
              <span>📅 {u.dias_activos || 0} días activos</span>
              <span>⏱️ {formatearTiempo(u.tiempo_total_min)}</span>
              <span>🔁 {u.sesiones_total || 0} sesiones</span>
            </div>
            <div className="gu-hover-titulo">Contenido del usuario</div>
            {contenido.length === 0 ? (
              <div className="gu-hover-vacio">Sin contenido adquirido</div>
            ) : (
              <ul className="gu-hover-lista">
                {contenido.slice(0, 14).map((c, i) => (
                  <li key={i}>
                    <span className={`gu-hover-tipo gu-hover-tipo-${c.tipo}`}>{c.tipo}</span>
                    <span className="gu-hover-item-titulo">{c.titulo || 'Sin título'}</span>
                  </li>
                ))}
                {contenido.length > 14 && <li className="gu-hover-mas">+{contenido.length - 14} más…</li>}
              </ul>
            )}
          </div>,
          document.body
        )}
      </td>

      <td className="gu-col-correo">{u.correo_electronico}</td>

      <td>
        {tieneMembresia ? (
          <div className="gu-membresia-cell">
            <span className="gestion-usuarios-badge" style={{ background: u.membresia_color || '#7c3aed', color: '#fff' }}>{u.membresia_nombre}</span>
            <span className={`gu-membresia-vence ${porVencer ? 'por-vencer' : ''}`}>
              {dias != null ? (dias < 0 ? 'Vencida' : porVencer ? `Vence en ${dias}d` : `${dias}d restantes`) : 'Activa'}
            </span>
          </div>
        ) : (
          <span className={`gestion-usuarios-badge ${etqContenido.cls}`}>{etqContenido.texto}</span>
        )}
      </td>

      <td>
        {u.en_linea ? (
          <span className="gu-conectado"><span className="gu-conectado-dot" />CONECTADO</span>
        ) : (
          <span className={`gu-ultima-actividad ${!refActividad ? 'nunca' : ''}`}>
            {refActividad ? formatearTiempoRelativo(refActividad) : 'Nunca'}
          </span>
        )}
      </td>

      <td>
        <div className="gu-frecuencia">
          <span>{u.dias_activos || 0} días</span>
          <small>{formatearTiempo(u.tiempo_total_min)}</small>
        </div>
      </td>

      <td>
        {u.ult_ciudad || u.ult_pais ? (
          <div className="gu-ubicacion-real">
            <span>📍 {[u.ult_ciudad, u.ult_pais].filter(Boolean).join(', ')}</span>
            <small>
              {u.ult_es_movil != null ? (u.ult_es_movil ? '📱 Móvil' : '💻 PC') : ''}
              {u.ult_ip ? `${u.ult_es_movil != null ? ' · ' : ''}${u.ult_ip}` : ''}
            </small>
          </div>
        ) : (
          <span className="gu-ultima-actividad nunca">Sin registro</span>
        )}
      </td>

      <td>{new Date(u.fecha_creacion).toLocaleDateString('es-ES')}</td>

      <td>
        <span className={`gestion-usuarios-estado ${u.eliminado ? 'inactivo' : 'activo'}`}>{u.eliminado ? 'Eliminado' : 'Activo'}</span>
      </td>

      <td className="gestion-usuarios-celda-acciones">
        <button className="gestion-usuarios-btn-accion" onClick={(e) => { e.stopPropagation(); onSeleccionar(u); }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      </td>
    </tr>
  );
};

export default FilaUsuario;
