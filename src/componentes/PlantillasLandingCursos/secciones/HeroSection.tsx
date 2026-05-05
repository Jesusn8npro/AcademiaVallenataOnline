import type { Contenido } from '../../../Paginas/Cursos/tipos';
import imgJesusAvatar from '../../../assets/images/Home/Jesus-Gonzalez--Profesor-de-acordeon.jpg';
import imgCursosAvatar from '../../../assets/images/Home/Cursos-Acordeon.jpg';
import imgFallbackHero from '../../../assets/images/Home/Aprende a tocar el acordeon con los mejores cursos.jpg';

interface Props {
    contenido: Contenido;
    estaInscrito: boolean;
    tipoContenido: 'curso' | 'tutorial';
    objetivos: string[];
    cargando: boolean;
    onComprar: () => void;
    verContenido: () => void;
}

const CHECK_CIRCLE = 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z';
const STAR_PATH = 'M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z';
const IMG_FALLBACK = imgFallbackHero;

const HeroSection = ({ contenido, estaInscrito, tipoContenido, objetivos, cargando, onComprar, verContenido }: Props) => (
    <div className="vista-premium-hero">
        <div className="vista-premium-hero-espaciador" />
        <div className="vista-premium-hero-fondo">
            <div className="vista-premium-hero-gradiente" />
            <div className="vista-premium-hero-overflow">
                <div className="vista-premium-hero-svg-container">
                    <svg className="vista-premium-hero-svg" viewBox="0 0 500 500">
                        <defs>
                            <linearGradient id="grad-premium" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#4338CA" />
                            </linearGradient>
                        </defs>
                        <path d="M250,50 C388.07,50 500,161.93 500,300 C500,438.07 388.07,550 250,550 C111.93,550 0,438.07 0,300 C0,161.93 111.93,50 250,50 Z" fill="url(#grad-premium)" />
                    </svg>
                </div>
            </div>
        </div>

        <div className="vista-premium-hero-contenido">
            <div className="vista-premium-hero-grid">

                {/* Columna izquierda */}
                <div className="vista-premium-hero-izquierda">
                    <div className="vista-premium-hero-badges">
                        <span className="vista-premium-categoria">
                            {contenido.categoria || contenido.nivel || (tipoContenido === 'curso' ? 'Curso' : 'Tutorial')}
                        </span>
                        <div className="vista-premium-estudiantes-container">
                            <div className="vista-premium-avatares">
                                <img className="vista-premium-avatar" src={imgJesusAvatar} alt="Estudiante" />
                                <img className="vista-premium-avatar" src={imgCursosAvatar} alt="Estudiante" />
                            </div>
                            <span className="vista-premium-estudiantes-texto">+{contenido.estudiantes_inscritos || '300'} estudiantes</span>
                        </div>
                    </div>

                    <h1 className="vista-premium-titulo">{contenido.titulo || 'Domina este contenido exclusivo'}</h1>
                    <p className="vista-premium-descripcion">
                        {contenido.descripcion_corta || 'Aprende habilidades avanzadas con este contenido exclusivo, diseñado para llevarte al siguiente nivel con metodología probada.'}
                    </p>

                    <div className="vista-premium-objetivos-grid">
                        {objetivos.map((obj, i) => (
                            <div key={i} className="vista-premium-objetivo" style={{ animationDelay: `${i * 100}ms` }}>
                                <svg className="vista-premium-objetivo-icono" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d={CHECK_CIRCLE} clipRule="evenodd" />
                                </svg>
                                <span className="vista-premium-objetivo-texto">{obj}</span>
                            </div>
                        ))}
                    </div>

                    <div className="vista-premium-cta-container">
                        {!estaInscrito ? (
                            <>
                                <div className="vista-premium-precio-container">
                                    {contenido.precio_rebajado || contenido.fecha_expiracion ? (
                                        <div className="vista-premium-precio-flex">
                                            {contenido.precio_normal && contenido.precio_rebajado && contenido.precio_normal > contenido.precio_rebajado ? (
                                                <>
                                                    <span className="vista-premium-precio-tachado">${contenido.precio_normal.toLocaleString()}</span>
                                                    <span className="vista-premium-precio-rebajado">${contenido.precio_rebajado.toLocaleString()}</span>
                                                </>
                                            ) : (
                                                <span className="vista-premium-precio-rebajado">
                                                    ${(contenido.precio_normal || contenido.precio_rebajado || 0).toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    ) : contenido.tipo_acceso === 'gratuito' ? (
                                        <span className="vista-premium-precio-gratis">GRATIS</span>
                                    ) : (
                                        <span className="vista-premium-precio-premium">Premium</span>
                                    )}
                                    <p className="vista-premium-precio-detalle">✓ Pago único - Acceso de por vida</p>
                                </div>

                                <div className="vista-premium-botones-container">
                                    <button className="vista-premium-btn-principal" onClick={onComprar} disabled={cargando}>
                                        {cargando ? (
                                            <>
                                                <svg className="vista-premium-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="vista-premium-spinner-circulo" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                    <path className="vista-premium-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                </svg>
                                                Procesando...
                                            </>
                                        ) : (tipoContenido === 'curso' ? 'Comprar curso' : 'Comprar tutorial')}
                                    </button>
                                    <button className="vista-premium-btn-secundario" onClick={() => document.getElementById('detalles')?.scrollIntoView({ behavior: 'smooth' })}>
                                        Ver más detalles
                                    </button>
                                </div>

                                {contenido.tipo_acceso === 'pago' && (
                                    <div className="vista-premium-garantia">
                                        <svg className="vista-premium-garantia-icono" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span>Garantía de satisfacción 30 días o te devolvemos tu dinero</span>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button className="vista-premium-btn-continuar" onClick={verContenido}>
                                {tipoContenido === 'curso' ? 'Continuar curso' : 'Continuar tutorial'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Columna derecha */}
                <div className="vista-premium-hero-derecha">
                    <div className="vista-premium-video-card">
                        <div className="vista-premium-video-preview">
                            <img
                                src={contenido.imagen_url || IMG_FALLBACK}
                                alt={contenido.titulo || 'Imagen del curso'}
                                className="vista-premium-video-imagen"
                                // Guard anti-loop: si IMG_FALLBACK también falla, dataset.fallbackApplied
                                // queda en true → onError no vuelve a setear src → no se re-dispara infinito.
                                onError={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    if (img.dataset.fallbackApplied === 'true') return;
                                    img.dataset.fallbackApplied = 'true';
                                    img.src = IMG_FALLBACK;
                                }}
                            />
                            <div className="vista-premium-play-overlay">
                                <div className="vista-premium-play-btn">
                                    <svg className="vista-premium-play-icono" viewBox="0 0 24 24" fill="none">
                                        <path d="M8 5.14v14l11-7-11-7z" fill="currentColor" />
                                    </svg>
                                </div>
                            </div>
                            <div className="vista-premium-preview-badge">Vista previa</div>
                        </div>

                        <div className="vista-premium-rating-card">
                            <div className="vista-premium-rating-fondo" />
                            <div className="vista-premium-rating-contenido">
                                <div className="vista-premium-rating-header">
                                    <div className="vista-premium-estrellas">
                                        {[...Array(5)].map((_, i) => (
                                            <svg key={i} className="vista-premium-estrella" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d={STAR_PATH} />
                                            </svg>
                                        ))}
                                    </div>
                                    <div className="vista-premium-rating-texto">
                                        <span className="vista-premium-rating-numero">4.9/5</span>
                                        <span className="vista-premium-rating-estudiantes"> - {contenido.estudiantes_inscritos || '300'}+ estudiantes</span>
                                    </div>
                                </div>
                                <p className="vista-premium-testimonio">
                                    "{contenido.testimonio || 'Este curso superó mis expectativas. El contenido es claro y la metodología increíble. Recomendado 100%.'}"
                                    <span className="vista-premium-testimonio-autor">- {contenido.autor_testimonio || 'Carlos M.'}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
);

export default HeroSection;
