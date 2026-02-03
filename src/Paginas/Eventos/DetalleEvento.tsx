import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUsuario } from '../../contextos/UsuarioContext';
import { eventosService } from '../../servicios/eventosService';
import './DetalleEvento.css';

const DetalleEvento: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { usuario } = useUsuario();

    // Estado
    const [evento, setEvento] = useState<any>(null);
    const [comentarios, setComentarios] = useState<any[]>([]);
    const [materiales, setMateriales] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [inscrito, setInscrito] = useState(false);
    const [procesandoInscripcion, setProcesandoInscripcion] = useState(false);
    const [nuevoComentario, setNuevoComentario] = useState('');
    const [enviandoComentario, setEnviandoComentario] = useState(false);
    const [tabActivo, setTabActivo] = useState<'descripcion' | 'comentarios' | 'materiales'>('descripcion');

    useEffect(() => {
        if (slug) {
            cargarEvento();
        }
    }, [slug]);

    useEffect(() => {
        if (usuario && evento) {
            verificarInscripcion();
        }
    }, [usuario, evento]);

    const cargarEvento = async () => {
        try {
            setCargando(true);
            setError('');

            // @ts-ignore
            const resultado = await eventosService.obtenerEventoPorSlug(slug);

            if (resultado.error) {
                setError(resultado.error);
                return;
            }

            if (!resultado.evento) {
                setError('Evento no encontrado');
                return;
            }

            setEvento(resultado.evento);

            // Cargar datos adicionales
            await Promise.all([
                cargarComentarios(resultado.evento.id),
                cargarMateriales(resultado.evento.id)
            ]);

        } catch (err: any) {
            console.error('Error cargando evento:', err);
            setError('Error al cargar el evento');
        } finally {
            setCargando(false);
        }
    };

    const cargarComentarios = async (eventoId: string) => {
        try {
            // @ts-ignore
            const resultado = await eventosService.obtenerComentariosEvento(eventoId);
            if (!resultado.error) {
                setComentarios(resultado.comentarios || []);
            }
        } catch (err) {
            console.error('Error cargando comentarios:', err);
        }
    };

    const cargarMateriales = async (eventoId: string) => {
        try {
            // @ts-ignore
            const resultado = await eventosService.obtenerMaterialesEvento(eventoId);
            if (!resultado.error) {
                setMateriales(resultado.materiales || []);
            }
        } catch (err) {
            console.error('Error cargando materiales:', err);
        }
    };

    const verificarInscripcion = async () => {
        try {
            if (!usuario || !evento) return;
            // @ts-ignore
            const resultado = await eventosService.verificarInscripcion(evento.id, usuario.id);
            if (!resultado.error) {
                setInscrito(resultado.inscrito || false);
            }
        } catch (err) {
            console.error('Error verificando inscripción:', err);
        }
    };

    const inscribirseEvento = async () => {
        if (!usuario) {
            navigate('/login');
            return;
        }

        try {
            setProcesandoInscripcion(true);
            setError('');

            // @ts-ignore
            const resultado = await eventosService.inscribirseEvento(evento.id, usuario.id);

            if (resultado.inscripcion) {
                setInscrito(true);
                setEvento((prev: any) => ({
                    ...prev,
                    participantes_inscritos: (prev.participantes_inscritos || 0) + 1
                }));
                alert('¡Te has inscrito exitosamente al evento!');
            } else {
                setError(resultado.error || 'Error al inscribirse al evento');
            }
        } catch (err: any) {
            console.error('Error en inscripción:', err);
            setError('Error al procesar la inscripción');
        } finally {
            setProcesandoInscripcion(false);
        }
    };

    const cancelarInscripcion = async () => {
        if (!usuario || !inscrito) return;

        if (!window.confirm('¿Estás seguro de que quieres cancelar tu inscripción?')) return;

        try {
            setProcesandoInscripcion(true);
            setError('');

            // @ts-ignore
            const resultado = await eventosService.cancelarInscripcion(evento.id, usuario.id);

            if (resultado.success) {
                setInscrito(false);
                setEvento((prev: any) => ({
                    ...prev,
                    participantes_inscritos: Math.max((prev.participantes_inscritos || 0) - 1, 0)
                }));
                alert('Tu inscripción ha sido cancelada');
            } else {
                setError(resultado.error || 'Error al cancelar la inscripción');
            }
        } catch (err: any) {
            console.error('Error cancelando inscripción:', err);
            setError('Error al cancelar la inscripción');
        } finally {
            setProcesandoInscripcion(false);
        }
    };

    const enviarComentario = async () => {
        if (!nuevoComentario.trim() || !usuario) {
            alert('Debes iniciar sesión para comentar');
            return;
        }

        try {
            setEnviandoComentario(true);

            // @ts-ignore
            const resultado = await eventosService.agregarComentario(evento.id, usuario.id, nuevoComentario.trim());

            if (resultado.error) {
                alert('Error al enviar el comentario: ' + resultado.error);
                return;
            }

            await cargarComentarios(evento.id);
            setNuevoComentario('');
            alert('Comentario enviado correctamente');

        } catch (err: any) {
            console.error('Error enviando comentario:', err);
            alert('Error al enviar el comentario: ' + err.message);
        } finally {
            setEnviandoComentario(false);
        }
    };

    // Helpers
    const formatearFecha = (fecha: string) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearHora = (fecha: string) => {
        return new Date(fecha).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const obtenerEstadoEvento = () => {
        if (!evento) return 'programado';

        const ahora = new Date();
        const inicio = new Date(evento.fecha_inicio);
        const fin = evento.fecha_fin ? new Date(evento.fecha_fin) : null;

        if (evento.estado === 'cancelado') return 'cancelado';
        if (evento.estado === 'pospuesto') return 'pospuesto';
        if (ahora > inicio && (!fin || ahora < fin)) return 'en_vivo';
        if (fin && ahora > fin) return 'finalizado';
        if (ahora < inicio) return 'programado';

        return evento.estado || 'programado';
    };

    const obtenerTipoEventoTexto = (tipo: string) => {
        const tipos: Record<string, string> = {
            'masterclass': 'Masterclass',
            'workshop': 'Workshop',
            'concierto': 'Concierto',
            'concurso': 'Concurso',
            'webinar': 'Webinar',
            'reunion': 'Reunión'
        };
        return tipos[tipo] || tipo;
    };

    const obtenerModalidadTexto = (modalidad: string) => {
        const modalidades: Record<string, string> = {
            'online': 'Online',
            'presencial': 'Presencial',
            'hibrido': 'Híbrido'
        };
        return modalidades[modalidad] || modalidad;
    };

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
                <button
                    onClick={() => navigate('/eventos')}
                    className="evt-det-btn-back"
                >
                    Volver a Eventos
                </button>
            </div>
        );
    }

    const estadoEvento = obtenerEstadoEvento();
    const puedeInscribirse = estadoEvento === 'programado' && evento?.requiere_inscripcion && !inscrito;

    return (
        <main className="evt-det-page">
            {/* Hero del evento */}
            <div className="evt-det-hero">
                {(evento.imagen_banner || evento.imagen_portada) && (
                    <div className="evt-det-hero-bg">
                        <img
                            src={evento.imagen_banner || evento.imagen_portada}
                            alt={evento.titulo}
                            className="evt-det-hero-img"
                        />
                    </div>
                )}

                <div className="evt-det-hero-content">
                    <div className="evt-det-hero-grid">
                        {/* Información del evento */}
                        <div>
                            <div className="evt-det-badges">
                                <span className="evt-det-badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                    {obtenerTipoEventoTexto(evento.tipo_evento)}
                                </span>
                                <span className="evt-det-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                                    {obtenerModalidadTexto(evento.modalidad)}
                                </span>
                                {estadoEvento === 'en_vivo' ? (
                                    <span className="evt-det-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                                        🔴 En Vivo
                                    </span>
                                ) : estadoEvento === 'finalizado' ? (
                                    <span className="evt-det-badge" style={{ backgroundColor: '#f3f4f6', color: '#1f2937' }}>
                                        ✅ Finalizado
                                    </span>
                                ) : estadoEvento === 'cancelado' && (
                                    <span className="evt-det-badge" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>
                                        ❌ Cancelado
                                    </span>
                                )}
                            </div>

                            <h1 className="evt-det-title">{evento.titulo}</h1>

                            {evento.descripcion_corta && (
                                <p className="evt-det-desc-short">{evento.descripcion_corta}</p>
                            )}

                            <div className="evt-det-key-info">
                                <div className="evt-det-info-item">
                                    <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                        <line x1="16" y1="2" x2="16" y2="6" />
                                        <line x1="8" y1="2" x2="8" y2="6" />
                                        <line x1="3" y1="10" x2="21" y2="10" />
                                    </svg>
                                    <div>
                                        <p className="evt-det-label">Fecha</p>
                                        <p className="evt-det-value">{formatearFecha(evento.fecha_inicio)}</p>
                                    </div>
                                </div>

                                <div className="evt-det-info-item">
                                    <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12,6 12,12 16,14" />
                                    </svg>
                                    <div>
                                        <p className="evt-det-label">Hora</p>
                                        <p className="evt-det-value">{formatearHora(evento.fecha_inicio)}</p>
                                    </div>
                                </div>

                                {evento.instructor_nombre && (
                                    <div className="evt-det-info-item">
                                        <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                            <circle cx="12" cy="7" r="4" />
                                        </svg>
                                        <div>
                                            <p className="evt-det-label">Instructor</p>
                                            <p className="evt-det-value">{evento.instructor_nombre}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="evt-det-info-item">
                                    <svg className="evt-det-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <div>
                                        <p className="evt-det-label">Participantes</p>
                                        <p className="evt-det-value">
                                            {evento.participantes_inscritos || 0}
                                            {evento.capacidad_maxima && ` / ${evento.capacidad_maxima}`}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Precio */}
                            <div className="evt-det-price-section">
                                {evento.precio > 0 ? (
                                    <div>
                                        <span className="evt-det-price-main">
                                            ${(evento.precio_rebajado || evento.precio).toLocaleString('es-CO')}
                                        </span>
                                        <span className="evt-det-price-currency">{evento.moneda || 'COP'}</span>
                                        {evento.precio_rebajado && evento.precio_rebajado < evento.precio && (
                                            <div className="evt-det-price-old">
                                                ${evento.precio.toLocaleString('es-CO')} {evento.moneda || 'COP'}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="evt-det-price-main" style={{ color: '#86efac' }}>¡GRATIS!</span>
                                )}
                            </div>
                        </div>

                        {/* Área de acción */}
                        <div className="evt-det-action-card">
                            {!usuario ? (
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ color: '#bfdbfe', marginBottom: '1rem' }}>Inicia sesión para inscribirte al evento</p>
                                    <button
                                        onClick={() => navigate('/login')}
                                        className="evt-det-btn-primary"
                                    >
                                        Iniciar Sesión
                                    </button>
                                </div>
                            ) : inscrito ? (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#86efac', marginBottom: '1rem' }}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.5rem' }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span style={{ fontWeight: 600 }}>Ya estás inscrito</span>
                                    </div>

                                    {estadoEvento === 'en_vivo' && evento.link_transmision ? (
                                        <a
                                            href={evento.link_transmision}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="evt-det-btn-red"
                                            style={{ marginBottom: '0.75rem', display: 'flex' }}
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}>
                                                <polygon points="5,3 19,12 5,21" />
                                            </svg>
                                            Unirse al Evento
                                        </a>
                                    ) : estadoEvento === 'programado' && (
                                        <div className="evt-det-btn-primary" style={{ cursor: 'default', marginBottom: '0.75rem' }}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}>
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12,6 12,12 16,14" />
                                            </svg>
                                            Evento Próximo
                                        </div>
                                    )}

                                    <button
                                        onClick={cancelarInscripcion}
                                        disabled={procesandoInscripcion}
                                        className="evt-det-btn-secondary"
                                    >
                                        {procesandoInscripcion ? 'Cancelando...' : 'Cancelar Inscripción'}
                                    </button>
                                </div>
                            ) : puedeInscribirse ? (
                                <div style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={inscribirseEvento}
                                        disabled={procesandoInscripcion}
                                        className="evt-det-btn-green"
                                    >
                                        {procesandoInscripcion ? (
                                            <span className="evt-det-spinner" style={{ width: '1.25rem', height: '1.25rem', borderBottomColor: 'white' }}></span>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}>
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
                                    {estadoEvento === 'finalizado' ? (
                                        <div style={{ color: '#d1d5db' }}>
                                            <p>Este evento ha finalizado</p>
                                        </div>
                                    ) : estadoEvento === 'cancelado' ? (
                                        <div style={{ color: '#fca5a5' }}>
                                            <p>Este evento ha sido cancelado</p>
                                        </div>
                                    ) : (
                                        <div style={{ color: '#fde047' }}>
                                            <p>No disponible para inscripción</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="evt-det-content-wrapper">
                <div className="evt-det-tabs-nav">
                    <button
                        className={`evt-det-tab-btn ${tabActivo === 'descripcion' ? 'active' : ''}`}
                        onClick={() => setTabActivo('descripcion')}
                    >
                        Descripción
                    </button>
                    <button
                        className={`evt-det-tab-btn ${tabActivo === 'comentarios' ? 'active' : ''}`}
                        onClick={() => setTabActivo('comentarios')}
                    >
                        Comentarios ({comentarios.length})
                    </button>
                    <button
                        className={`evt-det-tab-btn ${tabActivo === 'materiales' ? 'active' : ''}`}
                        onClick={() => setTabActivo('materiales')}
                    >
                        Materiales ({materiales.length})
                    </button>
                </div>

                <div className="evt-det-main-grid">
                    {/* Columna Principal */}
                    <div>
                        {tabActivo === 'descripcion' && (
                            <div className="evt-det-card">
                                <h2 className="evt-det-section-title">Sobre este evento</h2>
                                <div className="evt-det-prose">
                                    {evento.descripcion ? (
                                        // TODO: Sanitizar HTML en producción
                                        <div dangerouslySetInnerHTML={{ __html: evento.descripcion.replace(/\n/g, '<br>') }} />
                                    ) : (
                                        <p style={{ color: '#4b5563' }}>No hay descripción disponible para este evento.</p>
                                    )}
                                </div>

                                {evento.tags && evento.tags.length > 0 && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem' }}>Etiquetas</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                            {evento.tags.map((tag: string) => (
                                                <span key={tag} className="evt-det-badge" style={{ backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                                    #{tag}
                                                </span>
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
                                                <div className="evt-det-avatar">
                                                    {usuario.nombre?.charAt(0) || usuario.email?.charAt(0) || 'U'}
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <textarea
                                                    value={nuevoComentario}
                                                    onChange={(e) => setNuevoComentario(e.target.value)}
                                                    placeholder="Comparte tus pensamientos sobre este evento..."
                                                    className="evt-det-textarea"
                                                    rows={3}
                                                ></textarea>
                                                <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <button
                                                        onClick={enviarComentario}
                                                        disabled={!nuevoComentario.trim() || enviandoComentario}
                                                        className="evt-det-btn-primary"
                                                        style={{ width: 'auto' }}
                                                    >
                                                        {enviandoComentario ? 'Enviando...' : 'Comentar'}
                                                    </button>
                                                </div>
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
                                                    <div className="evt-det-avatar" style={{ backgroundColor: '#d1d5db', color: '#4b5563' }}>
                                                        {comentario.usuario?.nombre?.charAt(0) || 'U'}
                                                    </div>
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
                                                    <a
                                                        href={material.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="evt-det-btn-primary"
                                                        style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                                                    >
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

                    {/* Sidebar */}
                    <div>
                        <div className="evt-det-sidebar-card">
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>Detalles del Evento</h3>
                            <div className="evt-det-sidebar-list">
                                <div>
                                    <dt className="evt-det-dt">Fecha</dt>
                                    <dd className="evt-det-dd">{formatearFecha(evento.fecha_inicio)}</dd>
                                </div>
                                <div>
                                    <dt className="evt-det-dt">Hora</dt>
                                    <dd className="evt-det-dd">{formatearHora(evento.fecha_inicio)}</dd>
                                </div>
                                {evento.fecha_fin && (
                                    <div>
                                        <dt className="evt-det-dt">Finaliza</dt>
                                        <dd className="evt-det-dd">{formatearHora(evento.fecha_fin)}</dd>
                                    </div>
                                )}
                                <div>
                                    <dt className="evt-det-dt">Modalidad</dt>
                                    <dd className="evt-det-dd">{obtenerModalidadTexto(evento.modalidad)}</dd>
                                </div>
                                {evento.nivel_dificultad && (
                                    <div>
                                        <dt className="evt-det-dt">Nivel</dt>
                                        <dd className="evt-det-dd" style={{ textTransform: 'capitalize' }}>{evento.nivel_dificultad}</dd>
                                    </div>
                                )}
                                {evento.categoria && (
                                    <div>
                                        <dt className="evt-det-dt">Categoría</dt>
                                        <dd className="evt-det-dd" style={{ textTransform: 'capitalize' }}>{evento.categoria}</dd>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default DetalleEvento;
