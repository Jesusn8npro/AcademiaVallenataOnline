import React from 'react';
import { formatearPrecio } from '../../servicios/paquetesService';
import { usePaquetes } from './Hooks/usePaquetes';
import SEO from '../../componentes/common/SEO';
import './Paquetes.css';

const Paquetes: React.FC = () => {
    const {
        paquetes, cargando, error, busqueda, setBusqueda,
        filtroCategoria, setFiltroCategoria, filtroNivel, setFiltroNivel,
        categorias, stats, cargarPaquetes, limpiarFiltros,
        calcularDescuento, verPaquete, irAlInicio
    } = usePaquetes();

    return (
        <div className="paq-main-container">
            <SEO
                title="Paquetes de Tutoriales Vallenatos | Ahorra Aprendiendo"
                description="Compra paquetes de canciones y tutoriales de acordeón a precios especiales. Packs por nivel y por ritmo vallenato."
            />
            <header className="paq-main-hero">
                <div className="paq-main-hero-content">
                    <h1>🎁 Paquetes de Tutoriales</h1>
                    <p>Aprende vallenato de forma organizada y ahorra comprando nuestros paquetes especiales</p>
                </div>
            </header>

            <section className="paq-main-filters">
                <div className="paq-main-filters-header">
                    <h2>Encuentra tu paquete ideal</h2>
                    <div className="paq-main-stats-summary">
                        <span className="paq-main-stat-item"><strong>{stats.total}</strong> paquetes disponibles</span>
                        <span className="paq-main-stat-item"><strong>{stats.principiante}</strong> principiante</span>
                        <span className="paq-main-stat-item"><strong>{stats.intermedio}</strong> intermedio</span>
                        <span className="paq-main-stat-item"><strong>{stats.avanzado}</strong> avanzado</span>
                    </div>
                </div>

                <div className="paq-main-search-bar">
                    <div className="paq-main-search-input-wrapper">
                        <svg className="paq-main-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Buscar paquetes por título, categoría..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                        {busqueda && (
                            <button className="paq-main-clear-search" onClick={() => setBusqueda('')}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                <div className="paq-main-filter-controls">
                    <div className="paq-main-filter-group">
                        <label>Categoría:</label>
                        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                            <option value="">Todas las categorías</option>
                            {categorias.map((categoria) => (
                                <option key={categoria} value={categoria}>{categoria}</option>
                            ))}
                        </select>
                    </div>

                    <div className="paq-main-filter-group">
                        <label>Nivel:</label>
                        <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)}>
                            <option value="">Todos los niveles</option>
                            <option value="principiante">🟢 Principiante</option>
                            <option value="intermedio">🟡 Intermedio</option>
                            <option value="avanzado">🔴 Avanzado</option>
                        </select>
                    </div>

                    <button className="paq-main-btn-clear" onClick={limpiarFiltros}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        Limpiar filtros
                    </button>
                </div>
            </section>

            <main className="paq-main-content">
                {cargando ? (
                    <div className="paq-main-loading">
                        <div className="paq-main-spinner"></div>
                        <p>Cargando paquetes...</p>
                    </div>
                ) : error ? (
                    <div className="paq-main-error">
                        <h2>❌ {error}</h2>
                        <p>No pudimos cargar los paquetes en este momento.</p>
                        <button className="paq-main-btn" onClick={cargarPaquetes}>Reintentar</button>
                    </div>
                ) : paquetes.length === 0 ? (
                    <div className="paq-main-empty">
                        <h2>📦 No hay paquetes disponibles</h2>
                        <p>Próximamente tendremos paquetes increíbles para ti.</p>
                        <button className="paq-main-btn" onClick={irAlInicio}>Ir al inicio</button>
                    </div>
                ) : (
                    <div className="paq-main-packages-grid">
                        {paquetes.map((paquete) => (
                            <article key={paquete.id} className="paq-main-package-card" onClick={() => verPaquete(paquete.slug)}>
                                <div className="paq-main-card-image">
                                    {paquete.imagen_url ? (
                                        <img src={paquete.imagen_url} alt={paquete.titulo} loading="lazy" />
                                    ) : (
                                        <div className="paq-main-placeholder">🎵</div>
                                    )}
                                    {paquete.destacado && (
                                        <div className="paq-main-featured-badge">⭐ Destacado</div>
                                    )}
                                </div>

                                <div className="paq-main-card-content">
                                    <div className="paq-main-card-header">
                                        <h3>{paquete.titulo}</h3>
                                        {paquete.categoria && (
                                            <span className="paq-main-category">{paquete.categoria}</span>
                                        )}
                                    </div>
                                    <p className="paq-main-description">{paquete.descripcion || 'Paquete de tutoriales de acordeón'}</p>
                                    <div className="paq-main-card-meta">
                                        <div className="paq-main-stats">
                                            <span className="paq-main-stat">
                                                <div className="paq-main-stat-icon">🎵</div>
                                                <div className="paq-main-stat-info">
                                                    <strong>{(paquete as any).total_tutoriales || 0}</strong>
                                                    <span>Tutoriales</span>
                                                </div>
                                            </span>
                                            <span className="paq-main-stat">
                                                <div className="paq-main-stat-icon">
                                                    {paquete.nivel === 'principiante' ? '🟢' :
                                                        paquete.nivel === 'intermedio' ? '🟡' : '🔴'}
                                                </div>
                                                <div className="paq-main-stat-info">
                                                    <strong>{paquete.nivel}</strong>
                                                    <span>Nivel</span>
                                                </div>
                                            </span>
                                            {(paquete as any).duracion_total_estimada && (
                                                <span className="paq-main-stat">
                                                    <div className="paq-main-stat-icon">⏱️</div>
                                                    <div className="paq-main-stat-info">
                                                        <strong>{Math.round((paquete as any).duracion_total_estimada / 60)}</strong>
                                                        <span>Horas</span>
                                                    </div>
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="paq-main-card-footer">
                                    <div className="paq-main-pricing">
                                        {paquete.precio_rebajado && paquete.precio_normal && paquete.precio_rebajado < paquete.precio_normal ? (
                                            <>
                                                <div className="paq-main-price-current">{formatearPrecio(paquete.precio_rebajado)}</div>
                                                <div className="paq-main-price-original">{formatearPrecio(paquete.precio_normal)}</div>
                                                <div className="paq-main-discount">{calcularDescuento(paquete.precio_normal, paquete.precio_rebajado)}% OFF</div>
                                            </>
                                        ) : (
                                            <div className="paq-main-price-current">{formatearPrecio(paquete.precio_normal)}</div>
                                        )}
                                    </div>
                                    <button className="paq-main-btn-buy">Ver Paquete</button>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Paquetes;
