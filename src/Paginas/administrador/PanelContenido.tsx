import MostradorCursosTutoriales from './panel-contenido/componentes/MostradorCursosTutoriales';
import SidebarResumenAdmin from './panel-contenido/componentes/SidebarResumenAdmin';
import { usePanelContenido } from './panel-contenido/usePanelContenido';
import './PanelContenido.css';

const PanelContenido = () => {
    const {
        cargando,
        textoBusqueda,
        setTextoBusqueda,
        filtroEstado,
        setFiltroEstado,
        filtroTipo,
        setFiltroTipo,
        modoVista,
        setModoVista,
        itemsFiltrados,
        stats,
        cargarContenido,
        limpiarFiltros,
        navegarACrearCurso,
        navegarACrearTutorial
    } = usePanelContenido();

    if (cargando) {
        return (
            <div className="panel-contenido-loading">
                <div className="panel-contenido-spinner"></div>
                <p>Cargando panel de contenido...</p>
            </div>
        );
    }

    return (
        <div className="panel-contenido-container">
            <header className="panel-contenido-header">
                <div className="panel-contenido-header-content">
                    <div className="panel-contenido-header-info">
                        <h1>📚 Panel de Contenido</h1>
                        <p>Gestiona tus cursos y tutoriales</p>
                        <div className="panel-contenido-stats">
                            <span className="panel-contenido-stat-item">📊 {stats.total} total</span>
                            <span className="panel-contenido-stat-item">✅ {stats.publicados} publicados</span>
                            <span className={`panel-contenido-stat-item ${stats.filtrados !== stats.total ? 'panel-contenido-stat-filtrado' : ''}`}>
                                🎯 {stats.filtrados} mostrando
                            </span>
                        </div>
                        {(textoBusqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos') && (
                            <div className="panel-contenido-filtros-activos">
                                <span className="panel-contenido-filtros-label">Filtros activos:</span>
                                {textoBusqueda && <span className="panel-contenido-filtro-tag">🔍 "{textoBusqueda}"</span>}
                                {filtroTipo !== 'todos' && <span className="panel-contenido-filtro-tag">📁 {filtroTipo === 'curso' ? 'Cursos' : 'Tutoriales'}</span>}
                                {filtroEstado !== 'todos' && <span className="panel-contenido-filtro-tag">📌 {filtroEstado === 'publicado' ? 'Publicados' : 'Borradores'}</span>}
                            </div>
                        )}
                    </div>
                    <div className="panel-contenido-header-actions">
                        <button className="panel-contenido-btn-create panel-contenido-btn-curso" onClick={navegarACrearCurso}>📚 Crear Curso</button>
                        <button className="panel-contenido-btn-create panel-contenido-btn-tutorial" onClick={navegarACrearTutorial}>🎥 Crear Tutorial</button>
                    </div>
                </div>
            </header>

            <section className="panel-contenido-filters">
                <div className="panel-contenido-filters-content">
                    <div className="panel-contenido-search-box">
                        <div className="panel-contenido-search-input-container">
                            <svg className="panel-contenido-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar por título, descripción, artista, tonalidad..."
                                value={textoBusqueda}
                                onChange={(e) => setTextoBusqueda(e.target.value)}
                                className="panel-contenido-search-input"
                            />
                            {textoBusqueda && (
                                <button className="panel-contenido-clear-search" onClick={() => setTextoBusqueda('')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="panel-contenido-filter-controls">
                        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)} className="panel-contenido-filter-select">
                            <option value="todos">🎯 Todos</option>
                            <option value="curso">📚 Cursos</option>
                            <option value="tutorial">🎥 Tutoriales</option>
                        </select>
                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as any)} className="panel-contenido-filter-select">
                            <option value="todos">🔄 Todos</option>
                            <option value="publicado">✅ Publicados</option>
                            <option value="borrador">📝 Borradores</option>
                        </select>
                        <button className="panel-contenido-btn-limpiar" onClick={limpiarFiltros}>🔄 Limpiar</button>
                        <div className="panel-contenido-view-toggle">
                            <button className={`panel-contenido-view-btn ${modoVista === 'cuadricula' ? 'panel-contenido-view-btn-active' : ''}`} onClick={() => setModoVista('cuadricula')} title="Vista de cuadrícula">⊞</button>
                            <button className={`panel-contenido-view-btn ${modoVista === 'lista' ? 'panel-contenido-view-btn-active' : ''}`} onClick={() => setModoVista('lista')} title="Vista de lista">☰</button>
                        </div>
                    </div>
                </div>
            </section>

            <main className="panel-contenido-main">
                <div className="panel-contenido-content-area">
                    {itemsFiltrados.length === 0 && (textoBusqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos') ? (
                        <div className="panel-contenido-estado-vacio">
                            <div className="panel-contenido-icono-vacio">🔍</div>
                            <h3>No se encontraron resultados</h3>
                            <p>Intenta ajustar los filtros o buscar con términos diferentes</p>
                            <button className="panel-contenido-btn-limpiar-vacio" onClick={limpiarFiltros}>🔄 Limpiar filtros</button>
                        </div>
                    ) : itemsFiltrados.length === 0 ? (
                        <div className="panel-contenido-estado-vacio">
                            <div className="panel-contenido-icono-vacio">📚</div>
                            <h3>¡Empieza creando contenido!</h3>
                            <p>Aún no tienes cursos o tutoriales creados</p>
                            <div className="panel-contenido-acciones-rapidas">
                                <button className="panel-contenido-btn-create panel-contenido-btn-curso" onClick={navegarACrearCurso}>📚 Crear Primer Curso</button>
                                <button className="panel-contenido-btn-create panel-contenido-btn-tutorial" onClick={navegarACrearTutorial}>🎥 Crear Primer Tutorial</button>
                            </div>
                        </div>
                    ) : (
                        <MostradorCursosTutoriales
                            cursos={itemsFiltrados.filter(item => item.tipo === 'curso')}
                            tutoriales={itemsFiltrados.filter(item => item.tipo === 'tutorial')}
                            modoVista={modoVista}
                            onUpdate={cargarContenido}
                        />
                    )}
                </div>
                <aside className="panel-contenido-sidebar">
                    <SidebarResumenAdmin />
                </aside>
            </main>
        </div>
    );
};

export default PanelContenido;
