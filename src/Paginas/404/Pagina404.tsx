import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalBusqueda from '../../componentes/Busqueda/ModalBusqueda';
import { useParticulasFlotantes } from './Hooks/useParticulasFlotantes';
import './Pagina404.css';

const Pagina404: React.FC = () => {
    const navigate = useNavigate();
    const [modalBusquedaAbierto, setModalBusquedaAbierto] = useState(false);
    const errorStatus = 404; // Default to 404

    // Enlaces rápidos útiles
    const enlacesRapidos = [
        {
            titulo: 'Cursos de Acordeón',
            descripcion: 'Explora nuestros cursos completos',
            icono: '📚',
            url: '/cursos',
            color: 'from-blue-500 to-blue-700'
        },
        {
            titulo: 'Tutoriales Gratis',
            descripcion: 'Aprende canciones paso a paso',
            icono: '🎵',
            url: '/tutoriales',
            color: 'from-green-500 to-green-700'
        },
        {
            titulo: 'Simulador Virtual',
            descripcion: 'Practica sin instrumento físico',
            icono: '🎮',
            url: '/simulador-de-acordeon',
            color: 'from-purple-500 to-purple-700'
        },
        {
            titulo: 'Comunidad',
            descripcion: 'Conecta con otros estudiantes',
            icono: '👥',
            url: '/comunidad',
            color: 'from-teal-500 to-teal-700'
        }
    ];

    const getSugerenciasInteligentes = (status: number) => {
        switch (status) {
            case 404:
                return [
                    '🔍 La página que buscas podría haber cambiado de ubicación',
                    '📱 Verifica que la URL esté escrita correctamente',
                    '🏠 Puedes regresar al inicio y explorar desde allí',
                    '🔎 Usa nuestro buscador para encontrar contenido específico'
                ];
            case 500:
                return [
                    '⚙️ Estamos experimentando problemas técnicos temporales',
                    '🔄 Intenta recargar la página en unos momentos',
                    '📞 Si el problema persiste, contáctanos',
                    '🏠 Mientras tanto, puedes explorar otras secciones'
                ];
            default:
                return [
                    '🤔 Algo inesperado ha ocurrido',
                    '🔄 Intenta recargar la página',
                    '🏠 Regresa al inicio para continuar navegando',
                    '💬 Contáctanos si necesitas ayuda'
                ];
        }
    };

    const sugerenciasInteligentes = getSugerenciasInteligentes(errorStatus);

    const abrirModalBusqueda = () => setModalBusquedaAbierto(true);
    const cerrarModalBusqueda = () => setModalBusquedaAbierto(false);
    const irAInicio = () => navigate('/');
    const irAContacto = () => navigate('/contacto');

    useParticulasFlotantes();

    return (
        <>
            {/* Partículas flotantes de fondo */}
            <div className="academia-particulas-container"></div>

            <div className="academia-error-page">
                {/* Hero Section */}
                <div className="academia-hero-section">
                    <div className="academia-error-content">
                        {/* Número del error con efecto 3D */}
                        <div className="academia-error-number">
                            <span className="academia-numero-3d">{errorStatus}</span>
                            <div className="academia-numero-sombra">{errorStatus}</div>
                        </div>

                        {/* Mensaje principal */}
                        <div className="academia-mensaje-principal">
                            <h1 className="academia-titulo-error">
                                {errorStatus === 404 ? '¡Oops! Esta página se fue de parranda' :
                                    errorStatus === 500 ? '¡Ups! Nuestros servidores están afinando' :
                                        '¡Algo inesperado ocurrió!'}
                            </h1>

                            <p className="academia-descripcion-error">
                                {errorStatus === 404 ? 'La página que buscas no está aquí, pero tenemos muchísimo contenido increíble esperándote' :
                                    errorStatus === 500 ? 'Estamos trabajando para solucionar esto. Mientras tanto, explora nuestras otras secciones' :
                                        'No te preocupes, esto puede pasar. Vamos a ayudarte a encontrar lo que necesitas'}
                            </p>
                        </div>

                        {/* Botones de acción principales */}
                        <div className="academia-botones-principales">
                            <button
                                className="academia-boton-principal academia-boton-busqueda"
                                onClick={abrirModalBusqueda}
                            >
                                <svg className="academia-icono-busqueda" viewBox="0 0 24 24" fill="none">
                                    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
                                    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Buscar en la Academia
                            </button>

                            <button
                                className="academia-boton-secundario academia-boton-inicio"
                                onClick={irAInicio}
                            >
                                <svg className="academia-icono-home" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" />
                                    <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Ir al Inicio
                            </button>
                        </div>
                    </div>
                </div>

                {/* Sección de enlaces rápidos */}
                <div className="academia-enlaces-rapidos-section">
                    <h2 className="academia-titulo-seccion-error">✨ Contenido Popular</h2>
                    <div className="academia-grid-enlaces">
                        {enlacesRapidos.map((enlace, index) => (
                            <a
                                key={index}
                                href={enlace.url}
                                className={`academia-tarjeta-enlace bg-gradient-to-br ${enlace.color}`}
                            >
                                <div className="academia-icono-enlace">{enlace.icono}</div>
                                <h3 className="academia-titulo-enlace">{enlace.titulo}</h3>
                                <p className="academia-descripcion-enlace">{enlace.descripcion}</p>
                                <div className="academia-flecha-enlace">→</div>
                            </a>
                        ))}
                    </div>
                </div>

                {/* Sección de sugerencias */}
                <div className="academia-sugerencias-section">
                    <h2 className="academia-titulo-seccion-error">💡 Sugerencias Útiles</h2>
                    <div className="academia-lista-sugerencias">
                        {sugerenciasInteligentes.map((sugerencia, index) => (
                            <div key={index} className="academia-sugerencia-item">
                                <div className="academia-punto-sugerencia"></div>
                                <span className="academia-texto-sugerencia">{sugerencia}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sección de ayuda */}
                <div className="academia-ayuda-section">
                    <div className="academia-ayuda-contenido">
                        <h3 className="academia-titulo-ayuda">¿Necesitas ayuda personalizada?</h3>
                        <p className="academia-descripcion-ayuda">
                            Nuestro equipo está aquí para ayudarte. Contáctanos y resolveremos cualquier duda sobre nuestros cursos de acordeón.
                        </p>
                        <button
                            className="academia-boton-contacto"
                            onClick={irAContacto}
                        >
                            📞 Contactar Soporte
                        </button>
                    </div>
                </div>

                {/* Footer minimalista */}
                <div className="academia-footer-error">
                    <p>© 2025 Academia Vallenata Online - La mejor forma de aprender acordeón</p>
                </div>
            </div>

            {/* Modal de búsqueda */}
            <ModalBusqueda
                abierto={modalBusquedaAbierto}
                onCerrar={cerrarModalBusqueda}
            />
        </>
    );
};

export default Pagina404;
