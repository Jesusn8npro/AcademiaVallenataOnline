import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventosService, type EventoCompleto } from '../../../servicios/eventosService';
import './CalendarioEventos.css';

// Usamos el tipo del servicio
type Evento = EventoCompleto;

interface CalendarioEventosProps {
    vistaInicial?: 'grid' | 'lista';
    mostrarFiltros?: boolean;
    eventosPorPagina?: number;
}

const CalendarioEventos: React.FC<CalendarioEventosProps> = ({
    vistaInicial = 'grid',
    mostrarFiltros = true,
    eventosPorPagina = 12
}) => {
    const navigate = useNavigate();
    const [vista, setVista] = useState<'grid' | 'lista'>(vistaInicial);
    const [eventos, setEventos] = useState<Evento[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [paginaActual, setPaginaActual] = useState(0);
    const [totalPaginas, setTotalPaginas] = useState(0);

    // Filtros
    const [filtros, setFiltros] = useState({
        categoria: '',
        tipo_evento: '',
        nivel_dificultad: '',
        es_gratuito: undefined as boolean | undefined,
        busqueda: '',
        fecha_desde: '',
        fecha_hasta: ''
    });

    const categorias = [
        { value: '', label: 'Todas las categorías' },
        { value: 'tecnica', label: 'Técnica' },
        { value: 'teoria', label: 'Teoría' },
        { value: 'repertorio', label: 'Repertorio' },
        { value: 'historia', label: 'Historia' }
    ];

    const tiposEvento = [
        { value: '', label: 'Todos los tipos' },
        { value: 'masterclass', label: 'Masterclass' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'concierto', label: 'Concierto' },
        { value: 'concurso', label: 'Concurso' },
        { value: 'webinar', label: 'Webinar' },
        { value: 'reunion', label: 'Reunión' }
    ];

    const nivelesEvento = [
        { value: '', label: 'Todos los niveles' },
        { value: 'principiante', label: 'Principiante' },
        { value: 'intermedio', label: 'Intermedio' },
        { value: 'avanzado', label: 'Avanzado' },
        { value: 'profesional', label: 'Profesional' }
    ];

    const cargarEventos = async () => {
        setLoading(true);
        setError(null);
        try {
            // @ts-ignore - Asumimos compatibilidad con el servicio existente
            const { eventos: eventosData, total, error: errorData } = await eventosService.obtenerEventos({
                ...filtros,
                estado: 'programado',
                limit: eventosPorPagina,
                offset: paginaActual * eventosPorPagina
            });

            if (errorData) {
                setError(errorData);
                return;
            }

            setEventos(eventosData || []);
            // setTotalEventos(total || 0); // Unused
            setTotalPaginas(Math.ceil((total || 0) / eventosPorPagina));
        } catch (err: any) {
            setError(err.message || 'Error desconocido');
            console.error('Error cargando eventos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarEventos();
    }, [paginaActual, filtros]);
    // Nota: en React, agregar filtros aquí dispara la recarga. 
    // En Svelte se llamaba aplicarFiltros explícitamente. 
    // Aquí usamos el efecto para reactividad automática.

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFiltros(prev => ({ ...prev, [name]: checked ? true : undefined }));
        } else {
            setFiltros(prev => ({ ...prev, [name]: value }));
        }
        setPaginaActual(0); // Reset página al filtrar
    };

    const limpiarFiltros = () => {
        setFiltros({
            categoria: '',
            tipo_evento: '',
            nivel_dificultad: '',
            es_gratuito: undefined,
            busqueda: '',
            fecha_desde: '',
            fecha_hasta: ''
        });
        setPaginaActual(0);
    };

    const formatearFecha = (fecha: string): string => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatearHora = (fecha: string): string => {
        return new Date(fecha).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatearPrecio = (precio: number): string => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(precio);
    };

    const obtenerColorTipo = (tipo: string): string => {
        // Mapeo manual a estilos inline para simplificar la migración de colores dynamic
        const colorMap: Record<string, string> = {
            masterclass: '#dbeafe #1e40af', // bg-blue-100 text-blue-800
            workshop: '#dcfce7 #166534',
            concierto: '#f3e8ff #6b21a8',
            concurso: '#ffedd5 #9a3412',
            webinar: '#e0e7ff #3730a3',
            reunion: '#f3f4f6 #1f2937'
        };
        return colorMap[tipo] || '#f3f4f6 #1f2937';
    };

    const getBadgeStyle = (tipo: string) => {
        const styles = obtenerColorTipo(tipo).split(' ');
        return { backgroundColor: styles[0], color: styles[1] };
    };

    const obtenerColorNivel = (nivel: string): string => {
        const colores: Record<string, string> = {
            principiante: '#22c55e',
            intermedio: '#eab308',
            avanzado: '#f97316',
            profesional: '#ef4444'
        };
        return colores[nivel] || '#6b7280';
    };

    return (
        <div className="evt-cal-container">
            {/* Header */}
            <div className="evt-cal-header">
                <div className="evt-cal-title-section">
                    <h1 className="evt-cal-title">📅 Calendario de Eventos</h1>
                    <p className="evt-cal-subtitle">Descubre masterclasses, workshops y eventos especiales de acordeón</p>
                </div>

                <div className="evt-cal-view-toggle">
                    <button
                        className={`evt-cal-view-btn ${vista === 'grid' ? 'active' : ''}`}
                        onClick={() => setVista('grid')}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                        </svg>
                        Grid
                    </button>
                    <button
                        className={`evt-cal-view-btn ${vista === 'lista' ? 'active' : ''}`}
                        onClick={() => setVista('lista')}
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" style={{ width: '1rem', height: '1rem' }}>
                            <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"></path>
                        </svg>
                        Lista
                    </button>
                </div>
            </div>

            {/* Filtros */}
            {mostrarFiltros && (
                <div className="evt-cal-filters-container">
                    <div className="evt-cal-filters-header">
                        <h3 className="evt-cal-filters-title">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '1.25rem' }}>
                                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46 22,3" />
                            </svg>
                            Filtros
                        </h3>
                        <button className="evt-cal-clear-filters" onClick={limpiarFiltros}>
                            Limpiar filtros
                        </button>
                    </div>

                    <div className="evt-cal-filters-grid">
                        <div className="evt-cal-filter-group-wide">
                            <label className="evt-cal-label">Buscar eventos</label>
                            <input
                                type="text"
                                name="busqueda"
                                placeholder="Busca por título o descripción..."
                                className="evt-cal-input"
                                value={filtros.busqueda}
                                onChange={handleFiltroChange}
                            />
                        </div>

                        <div>
                            <label className="evt-cal-label">Categoría</label>
                            <select
                                name="categoria"
                                className="evt-cal-select"
                                value={filtros.categoria}
                                onChange={handleFiltroChange}
                            >
                                {categorias.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="evt-cal-label">Tipo</label>
                            <select
                                name="tipo_evento"
                                className="evt-cal-select"
                                value={filtros.tipo_evento}
                                onChange={handleFiltroChange}
                            >
                                {tiposEvento.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="evt-cal-label">Nivel</label>
                            <select
                                name="nivel_dificultad"
                                className="evt-cal-select"
                                value={filtros.nivel_dificultad}
                                onChange={handleFiltroChange}
                            >
                                {nivelesEvento.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </select>
                        </div>

                        <div className="evt-cal-checkbox-group">
                            <input
                                type="checkbox"
                                name="es_gratuito"
                                id="solo-gratuitos"
                                className="evt-cal-checkbox"
                                checked={filtros.es_gratuito === true}
                                onChange={handleFiltroChange}
                            />
                            <label htmlFor="solo-gratuitos" className="evt-cal-checkbox-label">
                                Solo eventos gratuitos
                            </label>
                        </div>

                        <div>
                            <label className="evt-cal-label">Desde</label>
                            <input
                                type="date"
                                name="fecha_desde"
                                className="evt-cal-input"
                                value={filtros.fecha_desde}
                                onChange={handleFiltroChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Loading */}
            {loading ? (
                <div className="evt-cal-loading">
                    <div className="evt-cal-spinner"></div>
                </div>
            ) : error ? (
                <div className="evt-cal-error-container">
                    <div>❌ Error cargando eventos</div>
                    <p>{error}</p>
                    <button className="evt-cal-page-btn" onClick={cargarEventos} style={{ marginTop: '1rem' }}>
                        Reintentar
                    </button>
                </div>
            ) : (
                <>
                    {eventos.length === 0 ? (
                        <div className="evt-cal-empty">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem', color: '#9ca3af' }}>
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            <h3 className="evt-cal-title" style={{ fontSize: '1.25rem' }}>No hay eventos</h3>
                            <p className="evt-cal-subtitle">No se encontraron eventos con los filtros seleccionados.</p>
                        </div>
                    ) : (
                        vista === 'grid' ? (
                            <div className="evt-cal-grid-layout">
                                {eventos.map(evento => (
                                    <div
                                        key={evento.id}
                                        className="evt-cal-card"
                                        onClick={() => navigate(`/eventos/${evento.slug}`)}
                                    >
                                        <div className="evt-cal-card-img-container">
                                            {evento.imagen_portada ? (
                                                <img src={evento.imagen_portada} alt={evento.titulo} className="evt-cal-card-img" />
                                            ) : (
                                                <div className="evt-cal-card-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '4rem' }}>
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                    </svg>
                                                </div>
                                            )}

                                            <div className="evt-cal-badges">
                                                <span className="evt-cal-badge" style={getBadgeStyle(evento.tipo_evento)}>
                                                    {evento.tipo_evento}
                                                </span>
                                                {evento.es_gratuito && (
                                                    <span className="evt-cal-badge-free">GRATIS</span>
                                                )}
                                                {evento.es_destacado && (
                                                    <span className="evt-cal-badge-featured">
                                                        ★ Destacado
                                                    </span>
                                                )}
                                            </div>

                                            {evento.nivel_dificultad && (
                                                <div className="evt-cal-level-indicator" style={{ backgroundColor: obtenerColorNivel(evento.nivel_dificultad) }}></div>
                                            )}
                                        </div>

                                        <div className="evt-cal-card-body">
                                            <h3 className="evt-cal-card-title">{evento.titulo}</h3>
                                            {evento.descripcion_corta && (
                                                <p className="evt-cal-card-desc">{evento.descripcion_corta}</p>
                                            )}

                                            <div className="evt-cal-card-info">
                                                <div className="evt-cal-info-item">
                                                    <span>📅 {formatearFecha(evento.fecha_inicio)}</span>
                                                </div>
                                                <div className="evt-cal-info-item">
                                                    <span>⏰ {formatearHora(evento.fecha_inicio)}</span>
                                                </div>
                                                <div className="evt-cal-info-item">
                                                    <span>📍 {evento.modalidad === 'online' ? 'En línea' : 'Presencial'}</span>
                                                </div>
                                            </div>

                                            <div className="evt-cal-card-footer">
                                                <div>
                                                    {evento.es_gratuito ? (
                                                        <span className="evt-cal-price-free">Gratis</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            {evento.precio_rebajado && evento.precio_rebajado < evento.precio ? (
                                                                <>
                                                                    <span className="evt-cal-price-original">{formatearPrecio(evento.precio)}</span>
                                                                    <span className="evt-cal-price">{formatearPrecio(evento.precio_rebajado)}</span>
                                                                </>
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
                        ) : (
                            <div className="evt-cal-list-container">
                                {/* IMPLEMENTAR LISTA SI ES NECESARIO, POR AHORA USAR CARD SIMPLIFICADA O REUTILIZAR ESTRUCTURA */}
                                {eventos.map(evento => (
                                    <div
                                        key={evento.id}
                                        className="evt-cal-list-card"
                                        onClick={() => navigate(`/eventos/${evento.slug}`)}
                                    >
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
                        )
                    )}

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                        <div className="evt-cal-pagination">
                            <button
                                className="evt-cal-page-btn"
                                disabled={paginaActual === 0}
                                onClick={() => setPaginaActual(p => p - 1)}
                            >
                                Anterior
                            </button>

                            {Array.from({ length: totalPaginas }).map((_, i) => (
                                (i === 0 || i === totalPaginas - 1 || (i >= paginaActual - 1 && i <= paginaActual + 1)) ? (
                                    <button
                                        key={i}
                                        className={`evt-cal-page-btn ${i === paginaActual ? 'active' : ''}`}
                                        onClick={() => setPaginaActual(i)}
                                    >
                                        {i + 1}
                                    </button>
                                ) : (
                                    (i === paginaActual - 2 || i === paginaActual + 2) && <span key={i}>...</span>
                                )
                            ))}

                            <button
                                className="evt-cal-page-btn"
                                disabled={paginaActual === totalPaginas - 1}
                                onClick={() => setPaginaActual(p => p + 1)}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default CalendarioEventos;
