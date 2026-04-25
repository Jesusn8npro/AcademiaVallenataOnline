interface Props {
    estaInscrito: boolean;
}

const IcoCheck = () => (
    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
);

const VentajasSection = ({ estaInscrito }: Props) => (
    <div className="vista-premium-ventajas" id="detalles">
        <div className="vista-premium-ventajas-contenedor">
            <div className="vista-premium-ventajas-header">
                <h2 className="vista-premium-ventajas-titulo">¿Por qué elegir nuestros cursos de acordeón?</h2>
                <p className="vista-premium-ventajas-subtitulo">
                    Descubre por qué más de 10,000 estudiantes confían en nuestra metodología exclusiva para dominar el acordeón vallenato
                </p>
            </div>

            <div className="vista-premium-ventajas-grid">
                <div className="vista-premium-ventaja-card vista-premium-ventaja-morado">
                    <div className="vista-premium-ventaja-icono">
                        <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <h3 className="vista-premium-ventaja-titulo">Metodología Exclusiva</h3>
                    <p className="vista-premium-ventaja-descripcion">Nuestro método de enseñanza paso a paso ha sido perfeccionado durante más de 15 años, garantizando resultados rápidos incluso si nunca has tocado un acordeón.</p>
                    <ul className="vista-premium-ventaja-lista">
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Técnicas pedagógicas comprobadas</span></li>
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Progresión lógica y fluida</span></li>
                    </ul>
                </div>

                <div className="vista-premium-ventaja-card vista-premium-ventaja-azul">
                    <div className="vista-premium-ventaja-icono">
                        <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="vista-premium-ventaja-titulo">Acceso de por Vida</h3>
                    <p className="vista-premium-ventaja-descripcion">Una vez que te inscribes, tendrás acceso ilimitado a todo el material, actualizaciones y nuevos contenidos que se añadan en el futuro.</p>
                    <ul className="vista-premium-ventaja-lista">
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Sin suscripciones mensuales</span></li>
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Actualizaciones gratuitas</span></li>
                    </ul>
                </div>

                <div className="vista-premium-ventaja-card vista-premium-ventaja-ambar">
                    <div className="vista-premium-ventaja-icono">
                        <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="vista-premium-ventaja-titulo">Comunidad Exclusiva</h3>
                    <p className="vista-premium-ventaja-descripcion">Únete a una comunidad activa de estudiantes y profesionales donde podrás compartir tus avances, resolver dudas y recibir feedback.</p>
                    <ul className="vista-premium-ventaja-lista">
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Grupos exclusivos de WhatsApp</span></li>
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Eventos virtuales con expertos</span></li>
                    </ul>
                </div>

                <div className="vista-premium-ventaja-card vista-premium-ventaja-verde">
                    <div className="vista-premium-ventaja-icono">
                        <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="vista-premium-ventaja-titulo">Garantía de Satisfacción</h3>
                    <p className="vista-premium-ventaja-descripcion">Estamos tan seguros de la calidad de nuestros cursos que ofrecemos una garantía de devolución de 30 días sin preguntas.</p>
                    <ul className="vista-premium-ventaja-lista">
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>30 días para probar sin riesgo</span></li>
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Devolución completa del 100%</span></li>
                    </ul>
                </div>

                <div className="vista-premium-ventaja-card vista-premium-ventaja-rosa">
                    <div className="vista-premium-ventaja-icono">
                        <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <h3 className="vista-premium-ventaja-titulo">Contenido Premium HD</h3>
                    <p className="vista-premium-ventaja-descripcion">Todas nuestras lecciones están grabadas con equipos profesionales para garantizar la mejor calidad de audio y video.</p>
                    <ul className="vista-premium-ventaja-lista">
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Vídeos en alta definición (4K)</span></li>
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Audio profesional de estudio</span></li>
                    </ul>
                </div>

                <div className="vista-premium-ventaja-card vista-premium-ventaja-indigo">
                    <div className="vista-premium-ventaja-icono">
                        <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="vista-premium-ventaja-titulo">Aprende a Tu Ritmo</h3>
                    <p className="vista-premium-ventaja-descripcion">Nuestros cursos están diseñados para que avances a tu propio paso, sin presiones ni fechas límite. Estudia cuando y donde quieras.</p>
                    <ul className="vista-premium-ventaja-lista">
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Acceso desde cualquier dispositivo</span></li>
                        <li className="vista-premium-ventaja-item"><IcoCheck /><span>Descarga las lecciones para ver offline</span></li>
                    </ul>
                </div>
            </div>

            {!estaInscrito && (
                <div className="vista-premium-ventajas-cta">
                    <p className="vista-premium-ventajas-cta-texto">¡No esperes más para iniciar tu camino hacia el dominio del acordeón!</p>
                    <p className="vista-premium-ventajas-cta-garantia">
                        Oferta por tiempo limitado. <span className="vista-premium-ventajas-cta-destacado">Garantía de 30 días de devolución</span> del dinero.
                    </p>
                </div>
            )}
        </div>
    </div>
);

export default VentajasSection;
