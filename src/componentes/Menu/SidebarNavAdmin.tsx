import React from 'react';
import type { EstadisticasAdmin } from './useSidebarAdmin';

interface Props {
  esRutaActiva: (ruta: string) => boolean;
  colapsado: boolean;
  estadisticasAdmin: EstadisticasAdmin;
}

export default function SidebarNavAdmin({ esRutaActiva, colapsado, estadisticasAdmin }: Props) {
  return (
    <>
      <div className="sidebar-admin-nav-section">
        {!colapsado && <div className="sidebar-admin-section-title">Principal</div>}

        <a href="/administrador" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" /><rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" /><rect x="3" y="16" width="7" height="5" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Dashboard</span>
              {estadisticasAdmin.notificacionesPendientes > 0 && (
                <div className="sidebar-admin-nav-badge sidebar-admin-badge-activo">{estadisticasAdmin.notificacionesPendientes}</div>
              )}
            </>
          )}
        </a>

        <a href="/administrador/objetivos" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/objetivos') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Tareas Pendientes</span>}
        </a>

        <a href="/administrador/usuarios" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/usuarios') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Usuarios</span>}
        </a>

        <a href="/administrador/pagos" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/pagos') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Pagos</span>}
        </a>

        <a href="/administrador/notificaciones" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/notificaciones') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Notificaciones</span>}
        </a>

        <a href="/administrador/chats" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/chats') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Chats Soporte</span>}
        </a>

        <a href="/administrador/panel-contenido" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/panel-contenido') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Gestionar Contenido</span>}
        </a>

        <a href="/administrador/paquetes" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/paquetes') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Paquetes</span>}
        </a>

        <a href="/administrador/crear-contenido" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/crear-contenido') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14,2 14,8 20,8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Crear Contenido</span>
              <div className="sidebar-admin-nav-badge sidebar-admin-badge-nuevo">Nuevo</div>
            </>
          )}
        </a>
      </div>

      <div className="sidebar-admin-nav-section">
        {!colapsado && <div className="sidebar-admin-section-title">Contenido</div>}

        <a href="/cursos" className={`sidebar-admin-nav-item ${esRutaActiva('/cursos') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Cursos & Tutoriales</span>}
        </a>

        <a href="/administrador/blog" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/blog') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1l1-4z" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Blog</span>}
        </a>

        <a href="/administrador/validaciones" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/validaciones') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {!colapsado && <span className="sidebar-admin-nav-text">Validaciones</span>}
        </a>

        <a href="/administrador/eventos" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/eventos') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" /><rect x="8" y="14" width="8" height="4" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Eventos</span>
              <div className="sidebar-admin-nav-badge sidebar-admin-badge-nuevo">Nuevo</div>
            </>
          )}
        </a>
      </div>

      <div className="sidebar-admin-nav-section">
        {!colapsado && <div className="sidebar-admin-section-title">Herramientas</div>}

        <a href="/simulador-gaming" className={`sidebar-admin-nav-item ${esRutaActiva('/simulador-gaming') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Simulador Gaming</span>
              <div className="sidebar-admin-nav-badge sidebar-admin-badge-nuevo">PRO</div>
            </>
          )}
        </a>

        <a href="/acordeon-pro-max" className={`sidebar-admin-nav-item ${esRutaActiva('/acordeon-pro-max') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Acordeon Pro Max</span>
              <div className="sidebar-admin-nav-badge sidebar-admin-badge-nuevo">PRO</div>
            </>
          )}
        </a>

        <a href="/simulador-app" className={`sidebar-admin-nav-item ${esRutaActiva('/simulador-app') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Simulador App</span>
              <div className="sidebar-admin-nav-badge sidebar-admin-badge-nuevo">MÓVIL</div>
            </>
          )}
        </a>

        <a href="/comunidad" className={`sidebar-admin-nav-item ${esRutaActiva('/comunidad') ? 'sidebar-admin-destacado' : ''}`}>
          <div className="sidebar-admin-nav-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          {!colapsado && (
            <>
              <span className="sidebar-admin-nav-text">Comunidad</span>
              <div className="sidebar-admin-nav-badge">{estadisticasAdmin.usuariosComunidad}</div>
            </>
          )}
        </a>
      </div>
    </>
  );
}
