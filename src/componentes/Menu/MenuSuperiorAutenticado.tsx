import React, { useState } from 'react';
import ModalBusqueda from '../Busqueda/ModalBusqueda';
import MenuLateralResponsive from './MenuLateralResponsive';
import NotificacionesDropdown from '../Notificaciones/NotificacionesDropdown';
import NavCentralAutenticado from './NavCentralAutenticado';
import { useMenuSuperiorAutenticado } from './useMenuSuperiorAutenticado';
import './MenuSuperiorAutenticado.css';

const Avatar: React.FC<{ src?: string; alt: string; nombreCompleto: string; size: 'medium' | 'large' }> = ({ src, alt, size }) => {
    const [imgError, setImgError] = useState(false);
    const imagenFinal = !src || imgError ? '/images/perfil-portada/Imagen perfil 1.jpg' : src;
    const tamaño = size === 'large' ? '50px' : '40px';
    return (
        <div style={{ width: tamaño, height: tamaño, borderRadius: '50%', backgroundColor: '#f3f4f6', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src={imagenFinal} alt={alt} onError={() => setImgError(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
    );
};

interface MenuSuperiorAutenticadoProps {
    onCerrarSesion?: () => Promise<void>;
}

const MenuSuperiorAutenticado: React.FC<MenuSuperiorAutenticadoProps> = ({ onCerrarSesion }) => {
    const {
        usuario, nombre, esAdmin,
        mostrarMenu, setMostrarMenu,
        mostrarNotificaciones, setMostrarNotificaciones,
        conteoNotificaciones, setConteoNotificaciones,
        mostrarModalBusqueda, mostrarMenuLateral,
        cerrandoSesion,
        menuUsuarioRef, notificacionesRef, notificacionesMobileRef, dropdownRef,
        cerrarSesion, abrirModalBusqueda, cerrarModalBusqueda,
        toggleMenuLateral, cerrarMenuLateral, cerrarMenuUsuario
    } = useMenuSuperiorAutenticado({ onCerrarSesion });

    return (
        <>
            <nav className="nav-auth-container">
                <div className="nav-auth-left">
                    <div className="nav-auth-logo">
                        <a href={esAdmin ? '/panel-administracion' : '/panel-estudiante'}>
                            <img src="/logo-175.webp" alt="Logo Academia" className="nav-auth-logo-img" width="175" height="113" fetchPriority="high" decoding="async" />
                        </a>
                    </div>
                    <button className="nav-auth-hamburger" onClick={toggleMenuLateral} aria-label="Menú">
                        <div className="nav-auth-hamburger-container">
                            <div className="nav-auth-hamburger-line nav-auth-line-1"></div>
                            <div className="nav-auth-hamburger-line nav-auth-line-2"></div>
                            <div className="nav-auth-hamburger-line nav-auth-line-3"></div>
                        </div>
                        <div className="nav-auth-hamburger-bg"></div>
                    </button>
                </div>

                <NavCentralAutenticado esAdmin={esAdmin} />

                <div className="nav-auth-right">
                    <div className="nav-auth-icons-desktop">
                        <button className="nav-auth-btn-icon" aria-label="Buscar" onClick={abrirModalBusqueda}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                        </button>
                        <div style={{ position: 'relative' }}>
                            <button
                                ref={notificacionesRef}
                                className={`nav-auth-btn-icon nav-auth-badge ${mostrarNotificaciones ? 'active' : ''}`}
                                aria-label="Notificaciones"
                                onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                </svg>
                                {conteoNotificaciones > 0 && <span className="nav-auth-badge-num">{conteoNotificaciones}</span>}
                            </button>
                            {mostrarNotificaciones && (
                                <div ref={dropdownRef}>
                                    <NotificacionesDropdown
                                        onCerrar={() => setMostrarNotificaciones(false)}
                                        onNotificacionLeida={() => { if (conteoNotificaciones > 0) setConteoNotificaciones(c => c - 1) }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="nav-auth-notif-mobile-container" style={{ position: 'relative' }}>
                        <button
                            ref={notificacionesMobileRef}
                            className="nav-auth-btn-icon-mobile nav-auth-badge"
                            aria-label="Notificaciones"
                            onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {conteoNotificaciones > 0 && <span className="nav-auth-badge-num-mobile">{conteoNotificaciones}</span>}
                        </button>
                        {mostrarNotificaciones && (
                            <div ref={dropdownRef}>
                                <NotificacionesDropdown
                                    onCerrar={() => setMostrarNotificaciones(false)}
                                    onNotificacionLeida={() => { if (conteoNotificaciones > 0) setConteoNotificaciones(c => c - 1) }}
                                />
                            </div>
                        )}
                    </div>

                    <div className="nav-auth-user-menu" ref={menuUsuarioRef}>
                        <button className="nav-auth-user-btn" onClick={() => setMostrarMenu(!mostrarMenu)}>
                            <span className="nav-auth-user-name">{nombre}</span>
                            <div className="nav-auth-avatar">
                                <Avatar src={usuario?.url_foto_perfil} alt="Avatar" nombreCompleto={usuario?.nombre || ''} size="medium" />
                            </div>
                        </button>

                        {mostrarMenu && (
                            <div className="dropdown-usuario-menu">
                                <div className="dropdown-usuario-header">
                                    <div className="dropdown-usuario-avatar-grande">
                                        <Avatar src={usuario?.url_foto_perfil} alt="Avatar" nombreCompleto={usuario?.nombre || ''} size="large" />
                                    </div>
                                    <div className="dropdown-usuario-info">
                                        <div className="dropdown-usuario-nombre">{nombre}</div>
                                        <div className="dropdown-usuario-rol">{esAdmin ? 'Administrador' : 'Estudiante'}</div>
                                    </div>
                                </div>
                                <div className="dropdown-usuario-links">
                                    <a href="/mi-perfil" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                        </svg>
                                        Mi Perfil
                                    </a>
                                    {esAdmin ? (
                                        <>
                                            <a href="/administrador/panel-contenido" className="dropdown-usuario-link">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                                                </svg>
                                                Gestión de Contenido
                                            </a>
                                            <a href="/administrador/notificaciones" className="dropdown-usuario-link">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>
                                                Notificaciones Sistema
                                            </a>
                                        </>
                                    ) : (
                                        <>
                                            <a href="/mis-cursos" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                                                </svg>
                                                Mis Cursos
                                            </a>
                                            <a href="/comunidad" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                                </svg>
                                                Comunidad
                                            </a>
                                            <a href="/membresias" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                                    <path d="M4 22h16" />
                                                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                                                </svg>
                                                Membresías
                                            </a>
                                        </>
                                    )}
                                    <a href="/configuracion" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V6a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                        </svg>
                                        Configuración
                                    </a>
                                </div>
                                <div className="dropdown-usuario-separador"></div>
                                <button className="dropdown-usuario-boton-salir" onMouseDown={cerrarSesion} disabled={cerrandoSesion}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    {cerrandoSesion ? 'Cerrando...' : 'Cerrar Sesión'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {mostrarModalBusqueda && (
                <ModalBusqueda abierto={mostrarModalBusqueda} onCerrar={cerrarModalBusqueda} />
            )}

            <MenuLateralResponsive
                abierto={mostrarMenuLateral}
                usuario={usuario}
                onCerrar={cerrarMenuLateral}
                cerrarSesion={cerrarSesion}
                cerrandoSesion={cerrandoSesion}
            />
        </>
    );
};

export default MenuSuperiorAutenticado;
