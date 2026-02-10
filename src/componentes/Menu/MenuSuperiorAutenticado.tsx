import React, { useState, useEffect, useRef } from 'react';
import { useUsuario } from '../../contextos/UsuarioContext';
import ModalBusqueda from '../Busqueda/ModalBusqueda';
import MenuLateralResponsive from './MenuLateralResponsive';
import NotificacionesDropdown from '../Notificaciones/NotificacionesDropdown';
import { notificacionesService } from '../../servicios/notificacionesService';
import type { Notificacion } from '../../servicios/notificacionesService';
import './MenuSuperiorAutenticado.css';

// Componente Avatar simple
const Avatar: React.FC<{ src?: string; alt: string; nombreCompleto: string; size: 'medium' | 'large' }> = ({
    src,
    alt,
    nombreCompleto,
    size
}) => {
    const iniciales = nombreCompleto
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const tamaño = size === 'large' ? '50px' : '40px';

    return (
        <div style={{
            width: tamaño,
            height: tamaño,
            borderRadius: '50%',
            backgroundColor: '#667eea', // Fallback
            backgroundImage: src ? `url(${src})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 600,
            fontSize: size === 'large' ? '1.2rem' : '0.9rem'
        }}>
            {!src && iniciales}
        </div>
    );
};

interface MenuSuperiorAutenticadoProps {
    onCerrarSesion?: () => Promise<void>;
}

const MenuSuperiorAutenticado: React.FC<MenuSuperiorAutenticadoProps> = ({ onCerrarSesion }) => {
    const { usuario } = useUsuario();
    // unused: const navigate = useNavigate();
    // unused: const location = useLocation();
    const [nombre, setNombre] = useState('');
    const [mostrarMenu, setMostrarMenu] = useState(false);
    const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false); // [NEW]
    const [conteoNotificaciones, setConteoNotificaciones] = useState(0);       // [NEW]
    const [mostrarModalBusqueda, setMostrarModalBusqueda] = useState(false);
    const [mostrarMenuLateral, setMostrarMenuLateral] = useState(false);
    const [cerrandoSesion, setCerrandoSesion] = useState(false);
    const menuUsuarioRef = useRef<HTMLDivElement>(null);
    const notificacionesRef = useRef<HTMLButtonElement>(null);
    const notificacionesMobileRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);      // [NEW]


    useEffect(() => {
        if (usuario) {
            setNombre(usuario.nombre || '');

            // [NEW] Cargar conteo inicial
            const cargarConteo = async () => {
                const conteo = await notificacionesService.obtenerContadorNoLeidas();
                setConteoNotificaciones(conteo);
            };
            cargarConteo();

            // [NEW] Suscribirse a cambios realtime
            const unsubscribe = notificacionesService.suscribirseAContador((nuevoConteo) => {
                setConteoNotificaciones(nuevoConteo);
            });

            return () => {
                unsubscribe();
            };
        }
    }, [usuario]);


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Cerrar menú usuario
            if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(event.target as Node)) {
                setMostrarMenu(false);
            }
            // [NEW] Cerrar notificaciones si click fuera
            const clicEnBotonNotif =
                (notificacionesRef.current && notificacionesRef.current.contains(event.target as Node)) ||
                (notificacionesMobileRef.current && notificacionesMobileRef.current.contains(event.target as Node));

            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                !clicEnBotonNotif
            ) {
                setMostrarNotificaciones(false);
            }
        };


        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const cerrarSesion = async () => {
        setCerrandoSesion(true);
        if (onCerrarSesion) {
            await onCerrarSesion();
        }
        setCerrandoSesion(false);
    };

    const abrirModalBusqueda = () => {
        setMostrarModalBusqueda(true);
    };

    const cerrarModalBusqueda = () => {
        setMostrarModalBusqueda(false);
    };

    const toggleMenuLateral = () => {
        setMostrarMenuLateral(!mostrarMenuLateral);
    };

    const cerrarMenuLateral = () => {
        setMostrarMenuLateral(false);
    };

    const cerrarMenuUsuario = () => {
        setMostrarMenu(false);
    };

    const esAdmin = usuario?.rol === 'admin';

    return (
        <>
            <nav className="nav-auth-container">
                {/* Lado Izquierdo: Logo + Hamburguesa */}
                <div className="nav-auth-left">
                    <div className="nav-auth-logo">
                        <a href={esAdmin ? '/panel-administracion' : '/panel-estudiante'}>
                            <img src="/imagenes/logo academia vallenata.png" alt="Logo Academia" className="nav-auth-logo-img" />
                        </a>
                    </div>

                    {/* Botón Hamburguesa - Solo Móvil */}
                    <button className="nav-auth-hamburger" onClick={toggleMenuLateral} aria-label="Menú">
                        <div className="nav-auth-hamburger-container">
                            <div className="nav-auth-hamburger-line nav-auth-line-1"></div>
                            <div className="nav-auth-hamburger-line nav-auth-line-2"></div>
                            <div className="nav-auth-hamburger-line nav-auth-line-3"></div>
                        </div>
                        <div className="nav-auth-hamburger-bg"></div>
                    </button>
                </div>

                {/* Menú Central - Solo Desktop */}
                <div className="nav-auth-center">
                    {esAdmin ? (
                        <>
                            {/* MENÚ PARA ADMINISTRADORES */}
                            <a href="/panel-administracion" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="9" />
                                        <rect x="14" y="3" width="7" height="5" />
                                        <rect x="14" y="12" width="7" height="9" />
                                        <rect x="3" y="16" width="7" height="5" />
                                    </svg>
                                </span>
                                <span>Panel Admin</span>
                            </a>
                            <a href="/administrador/crear-contenido" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                </span>
                                <span>Crear Contenido</span>
                            </a>
                            <a href="/administrador/usuarios" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <circle cx="12" cy="7" r="4" />
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    </svg>
                                </span>
                                <span>Usuarios</span>
                            </a>
                            <a href="/administrador/pagos" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="13" rx="2" />
                                        <path d="M2 10h20" />
                                        <circle cx="8" cy="15" r="2" />
                                        <circle cx="16" cy="15" r="2" />
                                    </svg>
                                </span>
                                <span>Pagos</span>
                            </a>
                            <a href="/administrador/paquetes" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                </span>
                                <span>Paquetes</span>
                            </a>
                            <a href="/administrador/eventos" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </span>
                                <span>Eventos</span>
                            </a>
                            <a href="/administrador/blog" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1l1-4z" />
                                    </svg>
                                </span>
                                <span>Blog</span>
                            </a>
                            <a href="/simulador-gaming" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                        <circle cx="7" cy="7" r="1.5" />
                                        <circle cx="17" cy="7" r="1.5" />
                                        <line x1="7" y1="10" x2="7" y2="12" />
                                        <line x1="17" y1="10" x2="17" y2="12" />
                                    </svg>
                                </span>
                                <span>Simulador</span>
                            </a>
                            <a href="/mensajes" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </span>
                                <span>Mensajes</span>
                            </a>
                        </>
                    ) : (
                        <>
                            {/* MENÚ PARA ESTUDIANTES */}
                            <a href="/panel-estudiante" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                        <path d="M6 12v5c3 0 5-1 8-1s5 1 8 1v-5" />
                                    </svg>
                                </span>
                                <span>Mi Panel</span>
                            </a>
                            <a href="/cursos" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <rect x="2" y="7" width="20" height="13" rx="2" />
                                        <path d="M16 3v4M8 3v4" />
                                    </svg>
                                </span>
                                <span>Cursos</span>
                            </a>
                            <a href="/comunidad" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </span>
                                <span>Comunidad</span>
                            </a>
                            <a href="/ranking" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                                        <path d="M4 22h16" />
                                        <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                                        <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                                        <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
                                    </svg>
                                </span>
                                <span>Ranking</span>
                            </a>
                            <a href="/eventos" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </span>
                                <span>Eventos</span>
                            </a>
                            <a href="/blog" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <rect x="3" y="5" width="18" height="14" rx="2" />
                                        <path d="M7 7h10M7 11h10M7 15h6" />
                                    </svg>
                                </span>
                                <span>Blog</span>
                            </a>
                            <a href="/mensajes" className="nav-auth-link">
                                <span className="nav-auth-icon">
                                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#222" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </span>
                                <span>Mensajes</span>
                            </a>
                        </>
                    )}
                </div>

                {/* Área Derecha */}
                <div className="nav-auth-right">
                    {/* Iconos Desktop */}
                    <div className="nav-auth-icons-desktop">
                        <button className="nav-auth-btn-icon" aria-label="Buscar" onClick={abrirModalBusqueda}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </button>

                        {/* Notificaciones - Realtime */}
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
                                {conteoNotificaciones > 0 && (
                                    <span className="nav-auth-badge-num">{conteoNotificaciones}</span>
                                )}
                            </button>

                            {/* Dropdown de Notificaciones */}
                            {mostrarNotificaciones && (
                                <div ref={dropdownRef}>
                                    <NotificacionesDropdown
                                        onCerrar={() => setMostrarNotificaciones(false)}
                                        onNotificacionLeida={() => {
                                            // Actualizar contador visualmente al instante (opcional, el realtime lo hará igual)
                                            if (conteoNotificaciones > 0) setConteoNotificaciones(c => c - 1);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Notificaciones Móvil */}
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
                            {conteoNotificaciones > 0 && (
                                <span className="nav-auth-badge-num-mobile">{conteoNotificaciones}</span>
                            )}
                        </button>

                        {/* [NEW] Dropdown para móvil rendered aquí también para que sea visible en este contexto */}
                        {mostrarNotificaciones && (
                            <div ref={dropdownRef}>
                                <NotificacionesDropdown
                                    onCerrar={() => setMostrarNotificaciones(false)}
                                    onNotificacionLeida={() => {
                                        if (conteoNotificaciones > 0) setConteoNotificaciones(c => c - 1);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Menú Usuario */}
                    <div className="nav-auth-user-menu" ref={menuUsuarioRef}>
                        <button className="nav-auth-user-btn" onClick={() => setMostrarMenu(!mostrarMenu)}>
                            <span className="nav-auth-user-name">{nombre}</span>
                            <div className="nav-auth-avatar">
                                <Avatar
                                    src={usuario?.url_foto_perfil}
                                    alt="Avatar"
                                    nombreCompleto={usuario?.nombre || ''}
                                    size="medium"
                                />
                            </div>
                        </button>

                        {mostrarMenu && (
                            <div className="dropdown-usuario-menu">
                                <div className="dropdown-usuario-header">
                                    <div className="dropdown-usuario-avatar-grande">
                                        <Avatar
                                            src={usuario?.url_foto_perfil}
                                            alt="Avatar"
                                            nombreCompleto={usuario?.nombre || ''}
                                            size="large"
                                        />
                                    </div>
                                    <div className="dropdown-usuario-info">
                                        <div className="dropdown-usuario-nombre">{nombre}</div>
                                        <div className="dropdown-usuario-rol">{esAdmin ? 'Administrador' : 'Estudiante'}</div>
                                    </div>
                                </div>

                                <div className="dropdown-usuario-links">
                                    <a href="/mi-perfil" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        Mi Perfil
                                    </a>
                                    {esAdmin ? (
                                        <>
                                            {/* Opciones específicas para Administradores */}
                                            <a href="/administrador/panel-contenido" className="dropdown-usuario-link">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                    <line x1="16" y1="13" x2="8" y2="13" />
                                                    <line x1="16" y1="17" x2="8" y2="17" />
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
                                            {/* Opciones específicas para Estudiantes */}
                                            <a href="/mis-cursos" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    <line x1="16" y1="2" x2="16" y2="6" />
                                                    <line x1="8" y1="2" x2="8" y2="6" />
                                                </svg>
                                                Mis Cursos
                                            </a>
                                            <a href="/comunidad" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                    <circle cx="9" cy="7" r="4" />
                                                </svg>
                                                Comunidad
                                            </a>
                                            <a href="/membresias" className="dropdown-usuario-link" onClick={cerrarMenuUsuario}>
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                                                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
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
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    {cerrandoSesion ? 'Cerrando...' : 'Cerrar Sesión'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Modal de Búsqueda */}
            {mostrarModalBusqueda && (
                <ModalBusqueda abierto={mostrarModalBusqueda} onCerrar={cerrarModalBusqueda} />
            )}

            {/* Menú Lateral Responsive */}
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
