import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUsuario } from '../../contextos/UsuarioContext';
import { supabase } from '../../servicios/supabaseCliente';
import './SidebarAdmin.css';

// Interfaces
interface EstadisticasAdmin {
    totalEstudiantes: number;
    totalCursos: number;
    objetivoMensual: number;
    porcentajeObjetivo: number;
    notificacionesPendientes: number;
    usuariosComunidad: number;
}

interface ProgresoEstudiante {
    cursosCompletados: number;
    cursosEnProgreso: number;
    porcentajeProgreso: number;
    miembrosComunidad: number;
    leccionesCompletadas: number;
    tutorialesCompletados: number;
    totalTutoriales: number;
    puntos: number;
    racha: number;
}

const SidebarAdmin = () => {
    const { usuario, cerrarSesion } = useUsuario();
    const navigate = useNavigate();
    const location = useLocation();

    // Estados
    const [colapsado, setColapsado] = useState(false);
    const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false);
    const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);

    // Estados de datos
    const [estadisticasAdmin, setEstadisticasAdmin] = useState<EstadisticasAdmin>({
        totalEstudiantes: 0,
        totalCursos: 0,
        objetivoMensual: 100,
        porcentajeObjetivo: 0,
        notificacionesPendientes: 0,
        usuariosComunidad: 0
    });

    const [progresoEstudiante, setProgresoEstudiante] = useState<ProgresoEstudiante>({
        cursosCompletados: 0,
        cursosEnProgreso: 0,
        porcentajeProgreso: 0,
        miembrosComunidad: 0,
        leccionesCompletadas: 0,
        tutorialesCompletados: 0,
        totalTutoriales: 0,
        puntos: 0,
        racha: 0
    });

    const [mensajeMotivacional, setMensajeMotivacional] = useState('');

    // Referencias
    const perfilRef = useRef<HTMLDivElement>(null);

    // Determinar tipo de usuario
    const tipoUsuario = usuario?.rol === 'admin' ? 'admin' : 'estudiante';
    const nombreUsuario = usuario?.nombre || 'Usuario';

    // Mensajes motivacionales
    const mensajesMotivacionales = [
        "¡Sigue así! Cada día es un paso hacia el éxito 🎵",
        "Tu dedicación te llevará lejos ⭐",
        "El acordeón es tu pasión, ¡persíguela! 🎶",
        "Cada nota que aprendes te hace mejor músico 🎼",
        "La práctica hace al maestro 🎯",
        "¡Tu talento brilla cada día más! ✨",
        "Cada lección te acerca a tu sueño 🚀",
        "El ritmo está en tu sangre 💪",
        "¡Eres capaz de grandes cosas! 🌟",
        "Tu esfuerzo hoy será tu éxito mañana 🎉"
    ];

    // Función para verificar si una ruta está activa
    const esRutaActiva = (ruta: string): boolean => {
        // Caso especial para la ruta base de administrador
        if (ruta === '/administrador') {
            const rutasPrincipales = [
                '/administrador/objetivos',
                '/administrador/usuarios',
                '/administrador/pagos',
                '/administrador/notificaciones',
                '/administrador/chats',
                '/administrador/panel-contenido',
                '/administrador/paquetes',
                '/administrador/crear-contenido',
                '/administrador/blog',
                '/administrador/eventos'
            ];

            // Solo marcar activa si es la ruta exacta /administrador
            // o una subruta que NO pertence a las otras secciones principales
            const esSubrutaDeOtra = rutasPrincipales.some(r => location.pathname.startsWith(r));
            return location.pathname === ruta || (location.pathname.startsWith(ruta + '/') && !esSubrutaDeOtra);
        }

        return location.pathname === ruta || location.pathname.startsWith(ruta + '/');
    };

    // Cargar estadísticas de admin
    const cargarEstadisticasAdmin = async () => {
        if (!usuario || tipoUsuario !== 'admin') return;

        try {
            // Obtener número total de estudiantes
            const { count: estudiantes } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .eq('rol', 'estudiante');

            // Obtener número total de cursos
            const { count: cursos } = await supabase
                .from('cursos')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'publicado');

            // Obtener usuarios activos en comunidad (últimos 30 días)
            const { count: usuariosComunidad } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .gte('updated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

            setEstadisticasAdmin({
                totalEstudiantes: estudiantes || 0,
                totalCursos: cursos || 0,
                objetivoMensual: 100,
                porcentajeObjetivo: Math.round(((estudiantes || 0) / 100) * 100),
                notificacionesPendientes: 0,
                usuariosComunidad: usuariosComunidad || 0
            });
        } catch (error) {
            console.warn('Error cargando estadísticas admin:', error);
        }
    };

    // Cargar progreso de estudiante
    const cargarProgresoEstudiante = async () => {
        if (!usuario || tipoUsuario !== 'estudiante') return;

        try {
            // Ejecutar todas las consultas en paralelo
            const [
                inscripcionesResult,
                progresoLeccionesResult,
                progresoTutorialesResult,
                rankingResult,
                sesionesResult
            ] = await Promise.all([
                supabase
                    .from('inscripciones')
                    .select('*, cursos(titulo)')
                    .eq('usuario_id', usuario.id),

                supabase
                    .from('progreso_lecciones')
                    .select('porcentaje_completado, estado')
                    .eq('usuario_id', usuario.id),

                supabase
                    .from('progreso_tutorial')
                    .select('completado, ultimo_acceso')
                    .eq('usuario_id', usuario.id),

                supabase
                    .from('ranking_global')
                    .select('puntuacion, posicion')
                    .eq('usuario_id', usuario.id)
                    .single(),

                supabase
                    .from('sesiones_usuario')
                    .select('created_at')
                    .eq('usuario_id', usuario.id)
                    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                    .order('created_at', { ascending: false })
            ]);

            // Procesar datos
            const inscripciones = inscripcionesResult.data || [];
            const progresoLecciones = progresoLeccionesResult.data || [];
            const progresoTutoriales = progresoTutorialesResult.data || [];
            const ranking = rankingResult.data;
            const sesiones = sesionesResult.data || [];

            // Calcular estadísticas
            const cursosActivos = inscripciones.filter((i: any) => !i.completado).length;
            const cursosCompletados = inscripciones.filter((i: any) => i.completado).length;
            const totalCursos = inscripciones.length;

            const leccionesCompletadas = progresoLecciones.filter((p: any) =>
                p.estado === 'completado' || p.porcentaje_completado === 100
            ).length;

            const tutorialesCompletados = progresoTutoriales.filter((t: any) => t.completado).length;
            const totalTutoriales = progresoTutoriales.length;

            const totalActividadesCompletadas = leccionesCompletadas + tutorialesCompletados;
            const puntos = ranking?.puntuacion || 0;

            // Calcular racha
            let racha = 0;
            if (sesiones.length > 0) {
                const hoy = new Date();
                let diasConsecutivos = 0;
                let fechaActual = new Date(hoy);

                for (let i = 0; i < 7; i++) {
                    const fechaStr = fechaActual.toISOString().split('T')[0];
                    const tieneActividad = sesiones.some((s: any) =>
                        s.created_at.startsWith(fechaStr)
                    );

                    if (tieneActividad) {
                        diasConsecutivos++;
                        fechaActual.setDate(fechaActual.getDate() - 1);
                    } else {
                        break;
                    }
                }
                racha = diasConsecutivos;
            }

            const porcentajeProgreso = totalCursos > 0 ?
                Math.round((cursosCompletados / totalCursos) * 100) : 0;

            setProgresoEstudiante({
                cursosCompletados,
                cursosEnProgreso: cursosActivos,
                porcentajeProgreso,
                miembrosComunidad: 0,
                leccionesCompletadas: totalActividadesCompletadas,
                tutorialesCompletados,
                totalTutoriales,
                puntos,
                racha
            });

            console.log('✅ [SIDEBAR] Datos del estudiante cargados:', progresoEstudiante);

        } catch (error) {
            console.warn('⚠️ Error cargando progreso estudiante:', error);
        }
    };

    // Seleccionar mensaje motivacional aleatorio
    const seleccionarMensajeMotivacional = () => {
        const indiceAleatorio = Math.floor(Math.random() * mensajesMotivacionales.length);
        setMensajeMotivacional(mensajesMotivacionales[indiceAleatorio]);
    };

    // Funciones de navegación
    const alternarBarraLateral = () => {
        setColapsado(!colapsado);
    };

    const alternarMenuPerfil = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuPerfilAbierto(!menuPerfilAbierto);
    };

    const cerrarSesionCompleta = async () => {
        await cerrarSesion();
        navigate('/');
    };

    const irAPerfil = () => {
        setMenuPerfilAbierto(false);
        navigate('/mi-perfil');
    };

    const irACursos = () => {
        setMenuPerfilAbierto(false);
        navigate(tipoUsuario === 'admin' ? '/cursos' : '/mis-cursos');
    };

    const abrirModalBusqueda = () => {
        setModalBusquedaAbierto(true);
    };

    // Efectos
    useEffect(() => {
        const manejarClicFuera = (evento: MouseEvent) => {
            if (perfilRef.current && !perfilRef.current.contains(evento.target as Node) && menuPerfilAbierto) {
                setMenuPerfilAbierto(false);
            }
        };

        document.addEventListener('click', manejarClicFuera);
        return () => document.removeEventListener('click', manejarClicFuera);
    }, [menuPerfilAbierto]);

    // Efecto para manejar la clase del body cuando el sidebar se colapsa/expande
    useEffect(() => {
        if (colapsado) {
            document.body.classList.remove('con-sidebar');
            document.body.classList.add('con-sidebar-colapsado');
        } else {
            document.body.classList.remove('con-sidebar-colapsado');
            document.body.classList.add('con-sidebar');
        }
    }, [colapsado]);

    useEffect(() => {
        if (tipoUsuario === 'admin') {
            cargarEstadisticasAdmin();
        } else if (tipoUsuario === 'estudiante') {
            cargarProgresoEstudiante();
            seleccionarMensajeMotivacional();
        }
    }, [usuario, tipoUsuario]);

    return (
        <div className={`sidebar-admin-moderno ${colapsado ? 'sidebar-admin-colapsado' : ''}`}>
            {/* Header con Ícono de Sidebar */}
            <div className="sidebar-admin-header">
                <div className="sidebar-admin-icon-container">
                    <div className="sidebar-admin-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <line x1="9" y1="3" x2="9" y2="21" />
                        </svg>
                    </div>
                    {!colapsado && (
                        <span className="sidebar-admin-label">Menú</span>
                    )}
                </div>

                <button
                    className="sidebar-admin-btn-toggle"
                    aria-label={colapsado ? 'Expandir menú' : 'Contraer menú'}
                    onClick={alternarBarraLateral}
                >
                    <div className={`sidebar-admin-toggle-icon ${colapsado ? 'sidebar-admin-rotado' : ''}`}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </div>
                </button>
            </div>

            {/* Buscador Moderno */}
            <div className="sidebar-admin-search-container">
                <button
                    className={`sidebar-admin-search-btn ${colapsado ? 'sidebar-admin-search-colapsado' : ''}`}
                    onClick={abrirModalBusqueda}
                    aria-label="Abrir búsqueda"
                >
                    <div className="sidebar-admin-search-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </div>
                    {!colapsado && (
                        <>
                            <span className="sidebar-admin-search-text">Buscar contenido...</span>
                            <div className="sidebar-admin-search-shortcut">⌘K</div>
                        </>
                    )}
                </button>
            </div>

            {/* Navegación Principal */}
            <nav className="sidebar-admin-navegacion">
                {tipoUsuario === 'admin' ? (
                    <>
                        {/* MENÚ PARA ADMINISTRADORES */}

                        {/* Sección Principal */}
                        <div className="sidebar-admin-nav-section">
                            {!colapsado && (
                                <div className="sidebar-admin-section-title">Principal</div>
                            )}

                            <a href="/administrador" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="9" />
                                        <rect x="14" y="3" width="7" height="5" />
                                        <rect x="14" y="12" width="7" height="9" />
                                        <rect x="3" y="16" width="7" height="5" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <>
                                        <span className="sidebar-admin-nav-text">Dashboard</span>
                                        {estadisticasAdmin.notificacionesPendientes > 0 && (
                                            <div className="sidebar-admin-nav-badge sidebar-admin-badge-activo">
                                                {estadisticasAdmin.notificacionesPendientes}
                                            </div>
                                        )}
                                    </>
                                )}
                            </a>

                            <a href="/administrador/objetivos" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/objetivos') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 20h9" />
                                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Tareas Pendientes</span>
                                )}
                            </a>

                            <a href="/administrador/usuarios" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/usuarios') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Usuarios</span>
                                )}
                            </a>

                            <a href="/administrador/pagos" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/pagos') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="5" width="20" height="14" rx="2" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Pagos</span>
                                )}
                            </a>

                            <a href="/administrador/notificaciones" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/notificaciones') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Notificaciones</span>
                                )}
                            </a>

                            <a href="/administrador/chats" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/chats') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Chats Soporte</span>
                                )}
                            </a>

                            <a href="/administrador/panel-contenido" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/panel-contenido') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14,2 14,8 20,8" />
                                        <line x1="16" y1="13" x2="8" y2="13" />
                                        <line x1="16" y1="17" x2="8" y2="17" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Gestionar Contenido</span>
                                )}
                            </a>

                            <a href="/administrador/paquetes" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/paquetes') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Paquetes</span>
                                )}
                            </a>

                            <a href="/administrador/crear-contenido" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/crear-contenido') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                        <polyline points="14,2 14,8 20,8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
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

                        {/* Sección Contenido */}
                        <div className="sidebar-admin-nav-section">
                            {!colapsado && (
                                <div className="sidebar-admin-section-title">Contenido</div>
                            )}

                            <a href="/cursos" className={`sidebar-admin-nav-item ${esRutaActiva('/cursos') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Cursos & Tutoriales</span>
                                )}
                            </a>

                            <a href="/administrador/blog" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/blog') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1l1-4z" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Blog</span>
                                )}
                            </a>

                            <a href="/administrador/eventos" className={`sidebar-admin-nav-item ${esRutaActiva('/administrador/eventos') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                        <rect x="8" y="14" width="8" height="4" />
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

                        {/* Sección Herramientas */}
                        <div className="sidebar-admin-nav-section">
                            {!colapsado && (
                                <div className="sidebar-admin-section-title">Herramientas</div>
                            )}

                            <a href="/simulador-gaming" className={`sidebar-admin-nav-item ${esRutaActiva('/simulador-gaming') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" />
                                        <line x1="12" y1="17" x2="12" y2="21" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <>
                                        <span className="sidebar-admin-nav-text">Simulador Gaming</span>
                                        <div className="sidebar-admin-nav-badge sidebar-admin-badge-nuevo">PRO</div>
                                    </>
                                )}
                            </a>

                            <a href="/comunidad" className={`sidebar-admin-nav-item ${esRutaActiva('/comunidad') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
                ) : (
                    <>
                        {/* MENÚ PARA ESTUDIANTES */}

                        {/* Sección Principal */}
                        <div className="sidebar-admin-nav-section">
                            {!colapsado && (
                                <div className="sidebar-admin-section-title">Mi Aprendizaje</div>
                            )}

                            <a href="/panel-estudiante" className={`sidebar-admin-nav-item ${esRutaActiva('/panel-estudiante') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="9" />
                                        <rect x="14" y="3" width="7" height="5" />
                                        <rect x="14" y="12" width="7" height="9" />
                                        <rect x="3" y="16" width="7" height="5" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Mi Panel</span>
                                )}
                            </a>

                            <a href="/mis-cursos" className={`sidebar-admin-nav-item ${esRutaActiva('/mis-cursos') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <>
                                        <span className="sidebar-admin-nav-text">Mis Cursos</span>
                                        <div className="sidebar-admin-nav-badge sidebar-admin-badge-progreso">
                                            {progresoEstudiante.porcentajeProgreso}%
                                        </div>
                                    </>
                                )}
                            </a>

                            <a href="/cursos" className={`sidebar-admin-nav-item ${esRutaActiva('/cursos') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polygon points="23 7 16 12 23 17 23 7" />
                                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Cursos & Tutoriales</span>
                                )}
                            </a>
                        </div>

                        {/* Sección Práctica */}
                        <div className="sidebar-admin-nav-section">
                            {!colapsado && (
                                <div className="sidebar-admin-section-title">Práctica</div>
                            )}

                            <a href="/comunidad" className={`sidebar-admin-nav-item ${esRutaActiva('/comunidad') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <>
                                        <span className="sidebar-admin-nav-text">Comunidad</span>
                                        <div className="sidebar-admin-nav-badge">{progresoEstudiante.miembrosComunidad}</div>
                                    </>
                                )}
                            </a>

                            <a href="/ranking" className={`sidebar-admin-nav-item ${esRutaActiva('/ranking') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M16 16v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10c0-1.1.9-2 2-2h2l3-3 3 3h2a2 2 0 0 1 2 2v4M8 12l2 2 4-4" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Ranking</span>
                                )}
                            </a>

                            <a href="/eventos" className={`sidebar-admin-nav-item ${esRutaActiva('/eventos') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Eventos</span>
                                )}
                            </a>

                            <a href="/mensajes" className={`sidebar-admin-nav-item ${esRutaActiva('/mensajes') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Mensajes</span>
                                )}
                            </a>
                        </div>

                        {/* Sección Configuración */}
                        <div className="sidebar-admin-nav-section">
                            {!colapsado && (
                                <div className="sidebar-admin-section-title">Configuración</div>
                            )}

                            <a href="/mi-perfil" className={`sidebar-admin-nav-item ${esRutaActiva('/mi-perfil') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Mi Perfil</span>
                                )}
                            </a>

                            <a href="/configuracion" className={`sidebar-admin-nav-item ${esRutaActiva('/configuracion') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="3" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Configuración</span>
                                )}
                            </a>

                            <a href="/grabaciones" className={`sidebar-admin-nav-item ${esRutaActiva('/grabaciones') ? 'sidebar-admin-destacado' : ''}`}>
                                <div className="sidebar-admin-nav-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                                        <line x1="12" x2="12" y1="19" y2="23" />
                                        <line x1="8" x2="8" y1="23" y2="23" />
                                        <line x1="16" x2="16" y1="23" y2="23" />
                                    </svg>
                                </div>
                                {!colapsado && (
                                    <span className="sidebar-admin-nav-text">Grabaciones</span>
                                )}
                            </a>
                        </div>
                    </>
                )}
            </nav>

            {/* Stats Card - Solo para admins cuando no está colapsado */}
            {!colapsado && tipoUsuario === 'admin' && (
                <div className="sidebar-admin-stats-card">
                    <div className="sidebar-admin-stats-header">
                        <div className="sidebar-admin-stats-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 3v18h18" />
                                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                            </svg>
                        </div>
                        <div className="sidebar-admin-stats-title">Estadísticas</div>
                    </div>
                    <div className="sidebar-admin-stats-content">
                        <div className="sidebar-admin-stat-item">
                            <div className="sidebar-admin-stat-value">{estadisticasAdmin.totalEstudiantes.toLocaleString()}</div>
                            <div className="sidebar-admin-stat-label">Estudiantes</div>
                        </div>
                        <div className="sidebar-admin-stat-item">
                            <div className="sidebar-admin-stat-value">{estadisticasAdmin.totalCursos}</div>
                            <div className="sidebar-admin-stat-label">Cursos</div>
                        </div>
                    </div>
                    <div className="sidebar-admin-stats-progress">
                        <div className="sidebar-admin-progress-bar">
                            <div className="sidebar-admin-progress-fill" style={{ width: `${estadisticasAdmin.porcentajeObjetivo}%` }}></div>
                        </div>
                        <div className="sidebar-admin-progress-text">{estadisticasAdmin.porcentajeObjetivo}% del objetivo mensual</div>
                    </div>
                </div>
            )}

            {/* Progress Card - Solo para estudiantes cuando no está colapsado */}
            {!colapsado && tipoUsuario === 'estudiante' && (
                <>
                    <div className="sidebar-admin-motivational-card">
                        <div className="sidebar-admin-motivational-header">
                            <div className="sidebar-admin-motivational-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                </svg>
                            </div>
                            <div className="sidebar-admin-motivational-title">¡Motivación Diaria!</div>
                        </div>
                        <div className="sidebar-admin-motivational-content">
                            <p className="sidebar-admin-motivational-message">{mensajeMotivacional}</p>
                        </div>
                    </div>

                    <div className="sidebar-admin-stats-card-student">
                        <div className="sidebar-admin-stats-header-student">
                            <div className="sidebar-admin-stats-icon-student">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 3v18h18" />
                                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                                </svg>
                            </div>
                            <div className="sidebar-admin-stats-title-student">⭐ Estadísticas Clave</div>
                        </div>
                        <div className="sidebar-admin-stats-content-student">
                            <div className="sidebar-admin-stat-item-student">
                                <span className="sidebar-admin-stat-icon-emoji">💎</span>
                                <div className="sidebar-admin-stat-info">
                                    <div className="sidebar-admin-stat-value-student">{progresoEstudiante.puntos}</div>
                                    <div className="sidebar-admin-stat-label-student">Puntos</div>
                                </div>
                            </div>
                            <div className="sidebar-admin-stat-item-student">
                                <span className="sidebar-admin-stat-icon-emoji">📚</span>
                                <div className="sidebar-admin-stat-info">
                                    <div className="sidebar-admin-stat-value-student">{progresoEstudiante.leccionesCompletadas}</div>
                                    <div className="sidebar-admin-stat-label-student">Lecciones</div>
                                </div>
                            </div>
                            <div className="sidebar-admin-stat-item-student">
                                <span className="sidebar-admin-stat-icon-emoji">🔥</span>
                                <div className="sidebar-admin-stat-info">
                                    <div className="sidebar-admin-stat-value-student">{progresoEstudiante.racha}</div>
                                    <div className="sidebar-admin-stat-label-student">Días</div>
                                </div>
                            </div>
                        </div>

                        <div className="sidebar-admin-stats-buttons">
                            <button className="sidebar-admin-stats-btn-left" onClick={() => navigate('/mi-perfil')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                                Mi Perfil
                            </button>
                            <button className="sidebar-admin-stats-btn-right" onClick={() => navigate('/mis-cursos')}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                                Mis Cursos
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Perfil Usuario */}
            <div className="sidebar-admin-perfil-usuario" ref={perfilRef}>
                <div
                    className={`sidebar-admin-perfil-btn ${colapsado ? 'sidebar-admin-perfil-colapsado' : ''}`}
                    onClick={alternarMenuPerfil}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && alternarMenuPerfil(e as any)}
                >
                    <div className="sidebar-admin-avatar-container">
                        <div className="sidebar-admin-avatar">
                            {usuario?.url_foto_perfil ? (
                                <img src={usuario.url_foto_perfil} alt="Avatar" />
                            ) : (
                                <div className="sidebar-admin-avatar-placeholder">
                                    {nombreUsuario.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="sidebar-admin-status-indicator"></div>
                    </div>
                    {!colapsado && (
                        <>
                            <div className="sidebar-admin-perfil-info">
                                <div className="sidebar-admin-perfil-nombre">{nombreUsuario}</div>
                                <div className="sidebar-admin-perfil-rol">{tipoUsuario === 'admin' ? 'Administrador' : 'Estudiante'}</div>
                            </div>
                            <div className="sidebar-admin-perfil-chevron">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6,9 12,15 18,9" />
                                </svg>
                            </div>
                        </>
                    )}
                </div>

                {menuPerfilAbierto && (
                    <div className="sidebar-admin-menu-perfil" onClick={(e) => e.stopPropagation()}>
                        {/* Header del perfil */}
                        <div className="sidebar-admin-perfil-header">
                            <div className="sidebar-admin-avatar-header">
                                {usuario?.url_foto_perfil ? (
                                    <img src={usuario.url_foto_perfil} alt="Avatar" />
                                ) : (
                                    <div className="sidebar-admin-avatar-placeholder-large">
                                        {nombreUsuario.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="sidebar-admin-status-indicator-header"></div>
                            </div>
                            <div className="sidebar-admin-info-header">
                                <div className="sidebar-admin-nombre-header">{nombreUsuario}</div>
                                <div className="sidebar-admin-correo-header">{usuario?.email || 'usuario@email.com'}</div>
                            </div>
                        </div>

                        {/* Opciones del menú */}
                        <div className="sidebar-admin-menu-opciones">
                            <button className="sidebar-admin-opcion" onClick={irAPerfil}>
                                <div className="sidebar-admin-opcion-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </div>
                                <span className="sidebar-admin-opcion-text">Mi Perfil</span>
                            </button>

                            <button className="sidebar-admin-opcion" onClick={irACursos}>
                                <div className="sidebar-admin-opcion-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                                    </svg>
                                </div>
                                <span className="sidebar-admin-opcion-text">{tipoUsuario === 'admin' ? 'Cursos' : 'Mis Cursos'}</span>
                            </button>

                            <div className="sidebar-admin-menu-divider"></div>

                            <button className="sidebar-admin-opcion sidebar-admin-logout" onClick={cerrarSesionCompleta}>
                                <div className="sidebar-admin-opcion-icon">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </div>
                                <span className="sidebar-admin-opcion-text">Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SidebarAdmin;
