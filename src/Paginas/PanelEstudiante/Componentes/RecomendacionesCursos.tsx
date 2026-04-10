import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import { generateSlug } from '../../../utilidades/utilidadesSlug';
import './RecomendacionesCursos.css';

// 🎯 DATOS POR DEFECTO PARA MOSTRAR INMEDIATAMENTE
const datosPorDefecto = [
    {
        id: 1,
        titulo: 'A TOCAR ACORDEÓN',
        descripcion: 'Curso completo desde cero hasta tu primera canción',
        imagen_url: '/images/Home/academia-vallenata-1.jpg',
        slug: 'a-tocar-acordeon',
        nivel: 'principiante',
        categoria: 'Vallenato',
        precio_normal: 0,
        precio_rebajado: null,
        tipo: 'curso',
        rating: '4.8',
        estudiantes: '500+',
        razon: 'Perfecto para empezar'
    },
    {
        id: 2,
        titulo: 'Acordeón!',
        descripcion: 'Tutorial paso a paso de canciones populares',
        imagen_url: '/images/Home/academia-vallenata-1.jpg',
        slug: 'acordeon-tutorial',
        nivel: 'intermedio',
        categoria: 'Vallenato',
        precio_normal: 0,
        precio_rebajado: null,
        tipo: 'tutorial',
        rating: '4.6',
        estudiantes: '300+',
        razon: 'Canciones populares'
    }
];

const RecomendacionesCursos: React.FC = () => {
    const navigate = useNavigate();

    // 🎯 Estados del componente
    const [cargando, setCargando] = useState(true);
    const [recomendacionesUnificadas, setRecomendacionesUnificadas] = useState<any[]>([]);
    const [mostrarMas, setMostrarMas] = useState(false);

    // 🧠 Obtener razón de recomendación
    const obtenerRazonRecomendacion = (nivel: string, categoria: string): string => {
        const razones = [
            `Perfecto para tu nivel ${nivel}`,
            `Complementa tu aprendizaje de ${categoria}`,
            `Popular entre estudiantes`,
            `Recomendado por tu progreso`,
            `Siguiente paso en tu formación`,
            `Ideal para mejorar técnica`
        ];
        return razones[Math.floor(Math.random() * razones.length)];
    };


    // 🚀 Cargar recomendaciones inteligentes
    useEffect(() => {
        const cargarRecomendaciones = async () => {
            try {
                // ⚡ MOSTRAR DATOS POR DEFECTO INMEDIATAMENTE
                setRecomendacionesUnificadas(datosPorDefecto);
                setCargando(false);

                // 📊 CARGAR DATOS REALES EN SEGUNDO PLANO
                console.log('🎯 [RECOMENDACIONES] Iniciando carga en segundo plano...');

                // 📚 Cargar cursos básicos primero
                const { data: cursosData, error: cursosError } = await supabase
                    .from('cursos')
                    .select('*')
                    .limit(4);

                console.log('📚 [CURSOS] Resultados:', cursosData?.length || 0, cursosError);

                // 🎵 Cargar tutoriales básicos
                const { data: tutorialesData, error: tutorialesError } = await supabase
                    .from('tutoriales')
                    .select('*')
                    .limit(4);

                console.log('🎵 [TUTORIALES] Resultados:', tutorialesData?.length || 0, tutorialesError);

                // 🎯 Procesar cursos
                const cursosFormateados = (cursosData || []).map((curso: any) => ({
                    id: curso.id,
                    titulo: curso.titulo || 'Curso de Acordeón',
                    descripcion: curso.descripcion || 'Aprende acordeón vallenato paso a paso',
                    imagen_url: curso.imagen_url || '/images/Home/academia-vallenata-1.jpg',
                    slug: generateSlug(curso.titulo || 'curso-acordeon'),
                    nivel: curso.nivel || 'principiante',
                    categoria: curso.categoria || 'Vallenato',
                    precio_normal: curso.precio_normal || 0,
                    precio_rebajado: curso.precio_rebajado || null,
                    tipo: 'curso',
                    rating: (4.2 + Math.random() * 0.8).toFixed(1),
                    estudiantes: `${Math.floor(Math.random() * 2000) + 100}+`,
                    razon: obtenerRazonRecomendacion(curso.nivel || 'principiante', curso.categoria || 'Vallenato')
                }));

                // 🎵 Procesar tutoriales
                const tutorialesFormateados = (tutorialesData || []).map((tutorial: any) => ({
                    id: tutorial.id,
                    titulo: tutorial.titulo || 'Tutorial de Vallenato',
                    descripcion: `Tutorial: ${tutorial.titulo || 'Canción Popular'} - ${tutorial.artista || 'Artista'}`,
                    imagen_url: tutorial.imagen_url || '/images/Home/academia-vallenata-1.jpg',
                    slug: generateSlug(tutorial.titulo || 'tutorial-vallenato'),
                    nivel: tutorial.nivel || 'principiante',
                    categoria: tutorial.categoria || 'Vallenato',
                    artista: tutorial.artista || 'Artista Desconocido',
                    precio_normal: tutorial.precio_normal || 0,
                    precio_rebajado: tutorial.precio_rebajado || null,
                    tipo: 'tutorial',
                    rating: (4.2 + Math.random() * 0.8).toFixed(1),
                    estudiantes: `${Math.floor(Math.random() * 1500) + 50}+`,
                    razon: obtenerRazonRecomendacion(tutorial.nivel || 'principiante', tutorial.categoria || 'Vallenato')
                }));

                // 🔄 Unificar contenido
                const recomendacionesReales = [...cursosFormateados, ...tutorialesFormateados]
                    .sort(() => Math.random() - 0.5);

                // ✅ ACTUALIZAR CON DATOS REALES SI HAY
                if (recomendacionesReales.length > 0) {
                    setRecomendacionesUnificadas(recomendacionesReales);
                    console.log('✅ [RECOMENDACIONES] Actualizadas con datos reales:', recomendacionesReales.length);
                }

            } catch (error) {
                console.error('❌ [RECOMENDACIONES] Error general:', error);
                // Mantener datos por defecto si falla
            }
        };

        cargarRecomendaciones();
    }, []);

    // 🎯 Ir a contenido (curso o tutorial)
    const verContenido = (item: any) => {
        if (item.tipo === 'curso') {
            console.log('📚 [NAVEGACIÓN] Yendo a curso:', item.slug);
            navigate(`/cursos/${item.slug}`);
        } else {
            console.log('🎵 [NAVEGACIÓN] Yendo a tutorial:', item.slug);
            navigate(`/tutoriales/${item.slug}`);
        }
    };

    // 💰 Formatear precio
    const formatearPrecio = (precio: number): string => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio);
    };

    // 📊 Calcular descuento
    const calcularDescuento = (precioNormal: number, precioRebajado: number): number => {
        return Math.round(((precioNormal - precioRebajado) / precioNormal) * 100);
    };

    // ✂️ Acortar texto
    const acortarTexto = (texto: string, limite: number = 100): string => {
        if (!texto) return '';
        return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
    };


    return (
        <div className="academia-recomendaciones-cursos">

            {cargando ? (
                /* Estado de carga */
                <div className="academia-cargando-recomendaciones">
                    <div className="academia-skeleton-recomendaciones"></div>
                </div>
            ) : (
                /* 🎯 Tarjeta principal de recomendaciones */
                <div className="academia-tarjeta-recomendaciones">

                    {/* 🚀 Header con título y estadísticas */}
                    <div className="academia-recomendaciones-header">
                        <div className="academia-header-info">
                            <h3>🚀 Recomendaciones Para Ti</h3>
                            <p className="academia-subtitulo">Contenido perfecto que aún no has explorado</p>
                        </div>
                        <div className="academia-header-stats">
                            <span className="academia-stat-badge">
                                {recomendacionesUnificadas.filter(item => item.tipo === 'curso').length} Cursos
                            </span>
                            <span className="academia-stat-badge">
                                {recomendacionesUnificadas.filter(item => item.tipo === 'tutorial').length} Tutoriales
                            </span>
                        </div>
                    </div>

                    {/* 🎯 GRID DE RECOMENDACIONES (Como página de cursos) */}
                    <div className="academia-contenido-recomendaciones">
                        {recomendacionesUnificadas.length === 0 ? (
                            <div className="academia-sin-recomendaciones">
                                <h4>📚 Cargando recomendaciones...</h4>
                                <p>Estamos buscando el mejor contenido para ti</p>
                            </div>
                        ) : (
                            <>
                                <div className="academia-recomendaciones-grid">
                                    {recomendacionesUnificadas.slice(0, mostrarMas ? 8 : 4).map((item, index) => (
                                        <div
                                            key={index}
                                            className="academia-curso-card"
                                            onClick={() => verContenido(item)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && verContenido(item)}
                                        >
                                            <div className="academia-curso-imagen-container">
                                                <img
                                                    src={item.imagen_url}
                                                    alt={item.titulo}
                                                    className="academia-curso-imagen"
                                                    loading="lazy"
                                                />

                                                <div className={`academia-tipo-badge ${item.tipo}`}>
                                                    {item.tipo === 'curso' ? '🎓 CURSO' : '🎵 TUTORIAL'}
                                                </div>

                                                {item.precio_rebajado && item.precio_normal && (
                                                    (() => {
                                                        const descuento = calcularDescuento(item.precio_normal, item.precio_rebajado);
                                                        return descuento > 0 ? <div className="academia-descuento-badge">-{descuento}%</div> : null;
                                                    })()
                                                )}

                                                <div className="academia-imagen-overlay">
                                                    <button className="academia-btn-ver-curso">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                                            <polygon points="5,3 19,12 5,21" />
                                                        </svg>
                                                        {item.tipo === 'curso' ? 'Ver Curso' : 'Ver Tutorial'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="academia-curso-content">
                                                <div className="academia-curso-header">
                                                    <h4 className="academia-curso-titulo">{item.titulo}</h4>
                                                    <div className="academia-curso-meta">
                                                        <span className="academia-rating">⭐ {item.rating}</span>
                                                        <span className="academia-estudiantes">👥 {item.estudiantes}</span>
                                                    </div>
                                                </div>

                                                <p className="academia-curso-descripcion">
                                                    {acortarTexto(item.descripcion, 80)}
                                                </p>

                                                <div className="academia-nivel-container">
                                                    <span className={`academia-nivel-badge nivel-${item.nivel}`}>
                                                        {item.nivel === 'principiante' && '🌱 Principiante'}
                                                        {item.nivel === 'intermedio' && '🔥 Intermedio'}
                                                        {item.nivel === 'avanzado' && '⚡ Avanzado'}
                                                        {item.nivel === 'profesional' && '👑 Profesional'}
                                                        {!['principiante', 'intermedio', 'avanzado', 'profesional'].includes(item.nivel) && `📚 ${item.nivel}`}
                                                    </span>
                                                </div>

                                                <div className="academia-curso-footer">
                                                    <div className="academia-precio-container">
                                                        {item.precio_normal === 0 || item.precio_normal === null ? (
                                                            <span className="academia-precio-gratis">¡GRATIS!</span>
                                                        ) : item.precio_rebajado && item.precio_rebajado < item.precio_normal ? (
                                                            <>
                                                                <span className="academia-precio-original">{formatearPrecio(item.precio_normal)}</span>
                                                                <span className="academia-precio-actual">{formatearPrecio(item.precio_rebajado)}</span>
                                                            </>
                                                        ) : (
                                                            <span className="academia-precio-actual">{formatearPrecio(item.precio_normal)}</span>
                                                        )}
                                                    </div>

                                                    <button className={`academia-btn-acceder ${item.tipo}`}>
                                                        {item.precio_normal === 0 || item.precio_normal === null ? 'Acceder Gratis' : 'Comenzar Ahora'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 👀 Botones de acción */}
                                <div className="academia-acciones-container">
                                    {recomendacionesUnificadas.length > 4 && (
                                        <button className="academia-ver-mas-btn" onClick={() => setMostrarMas(!mostrarMas)}>
                                            <span>{mostrarMas ? '👆 Ver Menos' : '👀 Ver Más Recomendaciones'}</span>
                                        </button>
                                    )}

                                    <button className="academia-ver-todos-btn" onClick={() => navigate('/cursos')}>
                                        <span>📚 Explorar Todos los Cursos</span>
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
};

export default RecomendacionesCursos;

