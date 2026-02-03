import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUsuario } from '../../contextos/UsuarioContext';
import './MenuInferiorResponsivo.css';

interface MenuInferiorResponsivoProps {
    // Props opcionales si se necesitan en el futuro
}

const MenuInferiorResponsivo: React.FC<MenuInferiorResponsivoProps> = () => {
    const { usuario } = useUsuario();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuVisible, setMenuVisible] = useState(true);
    const [timeoutInactividad, setTimeoutInactividad] = useState<NodeJS.Timeout | null>(null);
    const [ultimaActividad, setUltimaActividad] = useState(Date.now());

    const TIEMPO_INACTIVIDAD = 2000; // 2 segundos de inactividad

    // Determinar el tipo de usuario y ruta actual
    const tipoUsuario = usuario?.rol === 'admin' ? 'admin' : 'estudiante';
    const rutaActual = location.pathname;

    // Detectar si estamos en página de clase/lección
    const esPaginaClase = rutaActual.includes('/clase/') || rutaActual.includes('/leccion/');

    // Navegación para administradores
    const menuAdmin = [
        {
            id: 'dashboard',
            icono: 'dashboard',
            texto: 'Panel',
            ruta: '/administrador',
            badge: '3'
        },
        {
            id: 'contenido',
            icono: 'contenido',
            texto: 'Contenido',
            ruta: '/administrador/panel-contenido',
            badge: null
        },
        {
            id: 'mensajes',
            icono: 'mensajes',
            texto: 'Mensajes',
            ruta: '/mensajes',
            badge: '5'
        },
        {
            id: 'comunidad',
            icono: 'comunidad',
            texto: 'Comunidad',
            ruta: '/comunidad',
            badge: '12'
        },
        {
            id: 'perfil',
            icono: 'perfil',
            texto: 'Perfil',
            ruta: '/mi-perfil',
            badge: null
        }
    ];

    // Navegación para estudiantes
    const menuEstudiante = [
        {
            id: 'panel',
            icono: 'dashboard',
            texto: 'Inicio',
            ruta: '/panel-estudiante',
            badge: null
        },
        {
            id: 'comunidad',
            icono: 'comunidad',
            texto: 'Comunidad',
            ruta: '/comunidad',
            badge: '5'
        },
        {
            id: 'cursos',
            icono: 'cursos',
            texto: 'Mis Cursos',
            ruta: '/mis-cursos',
            badge: null
        },
        {
            id: 'blog',
            icono: 'blog',
            texto: 'Blog',
            ruta: '/blog',
            badge: null
        },
        {
            id: 'perfil',
            icono: 'perfil',
            texto: 'Perfil',
            ruta: '/mi-perfil',
            badge: null
        }
    ];

    const menuItems = tipoUsuario === 'admin' ? menuAdmin : menuEstudiante;

    // Verificar si una ruta está activa
    const esRutaActiva = (ruta: string): boolean => {
        // Para la ruta base de admin, solo marcar activa si es exactamente esa o subrutas que NO tienen su propia entrada en el menú
        if (ruta === '/administrador') {
            return rutaActual === '/administrador' ||
                (rutaActual.startsWith('/administrador/') && !rutaActual.includes('panel-contenido'));
        }

        // Para las demás rutas
        return rutaActual === ruta || rutaActual.startsWith(ruta + '/');
    };

    // Navegación
    const navegarA = (ruta: string) => {
        console.log('Navegando a:', ruta);
        navigate(ruta);
    };

    // Detectar actividad del usuario
    const detectarActividad = () => {
        if (!esPaginaClase) return; // Solo en páginas de clases

        setUltimaActividad(Date.now());
        if (!menuVisible) {
            mostrarMenu();
        }
        reiniciarTimeoutInactividad();
    };

    const ocultarMenu = () => {
        if (!esPaginaClase) return; // Solo en páginas de clases

        setMenuVisible(false);
        console.log('📱 [MENU] Ocultando menú por inactividad');
    };

    const mostrarMenu = () => {
        if (!esPaginaClase) return; // Solo en páginas de clases

        setMenuVisible(true);
        console.log('📱 [MENU] Mostrando menú por actividad');
    };

    const reiniciarTimeoutInactividad = () => {
        if (!esPaginaClase) return; // Solo en páginas de clases

        if (timeoutInactividad) {
            clearTimeout(timeoutInactividad);
        }

        const nuevoTimeout = setTimeout(() => {
            if (Date.now() - ultimaActividad >= TIEMPO_INACTIVIDAD) {
                ocultarMenu();
            }
        }, TIEMPO_INACTIVIDAD);

        setTimeoutInactividad(nuevoTimeout);
    };

    // Configurar detectores de actividad
    useEffect(() => {
        if (!esPaginaClase) {
            setMenuVisible(true); // Siempre visible fuera de páginas de clases
            return;
        }

        console.log('🚀 [MENU] Configurando detectores de actividad para página de clase...');

        const eventos = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        eventos.forEach(evento => {
            document.addEventListener(evento, detectarActividad, { passive: true } as any);
        });

        // Detección de video con delay seguro
        const videoTimeout = setTimeout(() => {
            const videos = document.querySelectorAll('video, iframe');
            videos.forEach((video) => {
                video.addEventListener('play', detectarActividad);
                video.addEventListener('pause', detectarActividad);
                video.addEventListener('seeking', detectarActividad);
            });
        }, 1000);

        return () => {
            console.log('❌ [MENU] Limpiando detectores de actividad');
            if (timeoutInactividad) {
                clearTimeout(timeoutInactividad);
            }
            clearTimeout(videoTimeout);

            eventos.forEach(evento => {
                document.removeEventListener(evento, detectarActividad);
            });
        };
    }, [esPaginaClase, ultimaActividad]);

    // Obtener ícono SVG por tipo
    const obtenerIcono = (tipo: string) => {
        const iconos: { [key: string]: React.ReactElement } = {
            dashboard: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" />
                    <rect x="3" y="16" width="7" height="5" />
                </svg>
            ),
            contenido: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
            ),
            cursos: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                </svg>
            ),
            comunidad: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            perfil: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                </svg>
            ),
            mensajes: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
            ),
            blog: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <path d="M10 9h4" />
                </svg>
            )
        };
        return iconos[tipo] || iconos.dashboard;
    };

    // Solo mostrar para usuarios logueados
    if (!usuario) return null;

    return (
        <nav className={`menu-inferior-responsivo ${menuVisible ? 'visible' : ''}`}>
            <div className="menu-container">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        className={`menu-item cursor-hover ${esRutaActiva(item.ruta) ? 'activo' : ''}`}
                        onClick={() => navegarA(item.ruta)}
                        aria-label={item.texto}
                    >
                        <div className="item-icon">
                            {obtenerIcono(item.icono)}
                        </div>
                        <span className="item-text">{item.texto}</span>
                        {item.badge && (
                            <div className={`item-badge ${item.badge.includes('%') ? 'progreso' : item.badge === 'Nuevo' ? 'nuevo' : ''}`}>
                                {item.badge}
                            </div>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default MenuInferiorResponsivo;
