
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { obtenerPaquetePorSlug, obtenerTutorialesPaquete, formatearPrecio, type PaqueteTutorial } from '../../servicios/paquetesService';
import ModalPagoInteligente from '../../componentes/Pagos/ModalPagoInteligente';
import './DetallePaquete.css';

const DetallePaquete: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [paquete, setPaquete] = useState<PaqueteTutorial | null>(null);
    const [tutoriales, setTutoriales] = useState<any[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mostrarModalPago, setMostrarModalPago] = useState(false);

    useEffect(() => {
        cargarPaquete();
    }, [slug]);

    const cargarPaquete = async () => {
        try {
            if (!slug) {
                setError('Slug del paquete no encontrado');
                setCargando(false);
                return;
            }
            console.log('🔍 Buscando paquete con slug:', slug);
            let resultado = await obtenerPaquetePorSlug(slug);
            console.log('📦 Resultado obtenerPaquetePorSlug:', resultado);

            if (resultado.success && resultado.data) {
                const paqueteData = resultado.data;
                setPaquete(paqueteData);

                // Use id safely
                if (paqueteData.id) {
                    const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteData.id);
                    if (resultadoTutoriales.success) {
                        setTutoriales(resultadoTutoriales.data.map((item: any) => ({
                            ...item.tutoriales,
                            orden: item.orden
                        })).sort((a: any, b: any) => a.orden - b.orden));
                    }
                }
            } else {
                console.error('❌ Error obteniendo paquete:', resultado.error);
                setError('Paquete no encontrado');
            }
        } catch (err: any) {
            console.error('❌ Error cargando paquete:', err);
            setError('Error cargando el paquete');
        } finally {
            setCargando(false);
        }
    };

    const calcularDescuento = () => {
        if (paquete?.precio_normal && paquete?.precio_rebajado) {
            return Math.round(((paquete.precio_normal - paquete.precio_rebajado) / paquete.precio_normal) * 100);
        }
        return 0;
    };

    const calcularAhorroTotal = () => {
        const totalIndividual = tutoriales.reduce((sum, t) => sum + (t.precio_normal || 0), 0);
        const precioFinal = paquete?.precio_rebajado || paquete?.precio_normal || 0;
        return totalIndividual - precioFinal;
    };

    const comprarPaquete = () => {
        console.log('🛒 Comprando paquete:', paquete?.titulo);
        setMostrarModalPago(true);
    };

    if (cargando) {
        return (
            <div className="paq-det-loading">
                <div className="paq-det-spinner"></div>
                <p>Cargando paquete...</p>
            </div>
        );
    }

    if (error || !paquete) {
        return (
            <div className="paq-det-error-page">
                <h1>❌ {error || 'Paquete no encontrado'}</h1>
                <p>El paquete que buscas no está disponible.</p>
                <div className="paq-det-error-actions">
                    <button className="paq-det-btn" onClick={() => navigate('/')}>Ir al inicio</button>
                </div>
                {slug && (
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#666' }}>
                        URL actual: <code className="paq-det-code">{slug}</code>
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="paq-det-container">
            {/* Hero */}
            <header className="paq-det-hero">
                <div className="paq-det-hero-content">
                    <div className="paq-det-hero-text">
                        {paquete.destacado && (
                            <span className="paq-det-badge">⭐ Destacado</span>
                        )}
                        <h1>{paquete.titulo}</h1>
                        <p>{paquete.descripcion}</p>

                        <div className="paq-det-stats">
                            <div className="paq-det-stat">
                                <strong>{tutoriales.length}</strong>
                                <span>Tutoriales</span>
                            </div>
                            <div className="paq-det-stat">
                                <strong>{paquete.nivel}</strong>
                                <span>Nivel</span>
                            </div>
                            {paquete.categoria && (
                                <div className="paq-det-stat">
                                    <strong>{paquete.categoria}</strong>
                                    <span>Categoría</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="paq-det-hero-image">
                        {paquete.imagen_url ? (
                            <img src={paquete.imagen_url} alt={paquete.titulo} loading="lazy" />
                        ) : (
                            <div className="paq-det-placeholder">🎵</div>
                        )}
                    </div>
                </div>
            </header>

            <div className="paq-det-main-grid">
                {/* Contenido */}
                <main className="paq-det-content">
                    <section className="paq-det-tutorials">
                        <h2>📚 Tutoriales Incluidos</h2>

                        {tutoriales.length > 0 ? (
                            <div className="paq-det-tutorial-list">
                                {tutoriales.map((tutorial, index) => (
                                    <div key={tutorial.id || index} className="paq-det-tutorial-card">
                                        <div className="paq-det-tutorial-number">{index + 1}</div>
                                        <div className="paq-det-tutorial-info">
                                            <h3>{tutorial.titulo}</h3>
                                            <p>{tutorial.descripcion_corta || tutorial.descripcion || 'Tutorial de acordeón'}</p>
                                            <span className="paq-det-price">Individual: {formatearPrecio(tutorial.precio_normal || 0)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p>No hay tutoriales disponibles.</p>
                        )}
                    </section>
                </main>

                {/* Sidebar de compra */}
                <aside className="paq-det-sidebar">
                    <div className="paq-det-price-card">
                        <div className="paq-det-prices">
                            {paquete.precio_rebajado && paquete.precio_normal && paquete.precio_rebajado < paquete.precio_normal ? (
                                <>
                                    <div className="paq-det-price-current">{formatearPrecio(paquete.precio_rebajado)}</div>
                                    <div className="paq-det-price-original">{formatearPrecio(paquete.precio_normal)}</div>
                                    <div className="paq-det-discount">{calcularDescuento()}% OFF</div>
                                </>
                            ) : (
                                <div className="paq-det-price-current">{formatearPrecio(paquete.precio_normal)}</div>
                            )}
                        </div>

                        {tutoriales.length > 0 && (
                            <div className="paq-det-savings">
                                <div className="paq-det-savings-row">
                                    <span>Total individual:</span>
                                    <span>{formatearPrecio(tutoriales.reduce((sum, t) => sum + (t.precio_normal || 0), 0))}</span>
                                </div>
                                <div className="paq-det-savings-row paq-det-total">
                                    <span>Tu ahorro:</span>
                                    <span className="paq-det-amount">💰 {formatearPrecio(calcularAhorroTotal())}</span>
                                </div>
                            </div>
                        )}

                        <button className="paq-det-btn-purchase" onClick={comprarPaquete}>
                            🛒 Comprar Paquete
                        </button>

                        <div className="paq-det-features">
                            <div className="paq-det-feature">✅ Acceso inmediato</div>
                            <div className="paq-det-feature">✅ Sin límite de tiempo</div>
                            <div className="paq-det-feature">✅ Soporte incluido</div>
                        </div>
                    </div>

                    <div className="paq-det-info-card">
                        <h3>📊 Información</h3>
                        <div className="paq-det-info-list">
                            <div className="paq-det-info-row">
                                <span>Tutoriales:</span>
                                <span>{tutoriales.length}</span>
                            </div>
                            <div className="paq-det-info-row">
                                <span>Nivel:</span>
                                <span>{paquete.nivel}</span>
                            </div>
                            {paquete.categoria && (
                                <div className="paq-det-info-row">
                                    <span>Categoría:</span>
                                    <span>{paquete.categoria}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {/* Modal de Pago Inteligente */}
            <ModalPagoInteligente
                mostrar={mostrarModalPago}
                setMostrar={setMostrarModalPago}
                contenido={paquete as any}
                tipoContenido="paquete"
            />
        </div>
    );
};

export default DetallePaquete;
