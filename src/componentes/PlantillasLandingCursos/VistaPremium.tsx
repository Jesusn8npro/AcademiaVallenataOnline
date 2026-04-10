import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DatosVista } from '../../Paginas/Cursos/LandingCurso';
import './VistaPremium.css';
import ModalPagoInteligente from '../Pagos/ModalPagoInteligente';

interface Props {
    data: DatosVista;
    handleInscripcion: () => Promise<void>;
    verContenido: () => void;
    irAPrimeraClase: () => void;
}

interface TiempoRestante {
    dias: number;
    horas: number;
    minutos: number;
    segundos: number;
}

const VistaPremium = ({ data, verContenido }: Props) => {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(false);
    const [tiempoRestante, setTiempoRestante] = useState<TiempoRestante>({
        dias: 0,
        horas: 0,
        minutos: 0,
        segundos: 0
    });
    const [mostrarModalPago, setMostrarModalPago] = useState(false);

    const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Extraer datos
    const contenido = data.contenido;
    const estaInscrito = data.estaInscrito;
    const tipoContenido = contenido.tipo;

    // Referencia para la fecha de fin, mutable para el efecto "evergreen"
    const fechaFinRef = useRef<Date | null>(null);

    // Inicializar fecha fin solo una vez o cuando cambie el contenido
    useEffect(() => {
        if (contenido.fecha_expiracion) {
            fechaFinRef.current = new Date(contenido.fecha_expiracion);
        } else if (!fechaFinRef.current) {
            // Si no hay fecha, iniciamos con 12 horas por defecto para generar urgencia inmediata
            fechaFinRef.current = new Date(Date.now() + 12 * 60 * 60 * 1000);
        }
    }, [contenido.fecha_expiracion]);

    // Función para obtener nuevo tiempo random (entre 4hs y 3 días)
    const reiniciarContador = () => {
        const ahora = new Date();
        const opciones = [
            4 * 60 * 60 * 1000,   // 4 horas (Oferta Flash)
            12 * 60 * 60 * 1000,  // 12 horas
            24 * 60 * 60 * 1000,  // 1 día
            2 * 24 * 60 * 60 * 1000, // 2 días
            3 * 24 * 60 * 60 * 1000  // 3 días
        ];
        // Elegir una opción aleatoria
        const tiempoExtra = opciones[Math.floor(Math.random() * opciones.length)];
        fechaFinRef.current = new Date(ahora.getTime() + tiempoExtra);
    };

    // Calcular tiempo restante
    const calcularTiempoRestante = () => {
        if (!fechaFinRef.current) return;

        const ahora = new Date();
        const diferencia = fechaFinRef.current.getTime() - ahora.getTime();

        if (diferencia <= 0) {
            // Si el tiempo terminó, reiniciamos automáticamente con un nuevo valor
            reiniciarContador();
            // Llamamos recursivamente para mostrar el nuevo tiempo inmediatamente
            calcularTiempoRestante();
            return;
        }

        setTiempoRestante({
            dias: Math.floor(diferencia / (1000 * 60 * 60 * 24)),
            horas: Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutos: Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60)),
            segundos: Math.floor((diferencia % (1000 * 60)) / 1000)
        });
    };

    // Calcular descuento
    const calcularDescuento = (): number => {
        const precioNormal = contenido?.precio_normal || 0;
        const precioRebajado = contenido?.precio_rebajado || 0;

        if (precioNormal <= 0 || precioRebajado <= 0 || precioRebajado >= precioNormal) return 0;
        return Math.round((1 - precioRebajado / precioNormal) * 100);
    };

    // Función para volver
    const volver = () => {
        if (window.history.length > 1) {
            window.history.back();
        } else {
            navigate('/cursos');
        }
    };

    // Procesar objetivos
    const procesarObjetivos = (): string[] => {
        let resultados: string[] = [];

        if (Array.isArray(contenido.objetivos) && contenido.objetivos.length > 0) {
            resultados = contenido.objetivos
                .filter((obj: any) => {
                    if (typeof obj === 'object' && obj.texto) {
                        return obj.texto.trim() !== '';
                    }
                    return typeof obj === 'string' && obj.trim() !== '';
                })
                .map((obj: any) => {
                    return typeof obj === 'object' && obj.texto ? obj.texto : obj;
                });
        } else if (typeof contenido.objetivos === 'string' && contenido.objetivos.trim() !== '') {
            // Intentar separar por saltos de línea primero
            const porLineas = contenido.objetivos
                .split(/\r?\n/)
                .map((o: string) => o.trim())
                .filter((o: string) => o !== '');

            // Si solo hay 1 línea, intentar separar por comas (formato legacy o input simple)
            if (porLineas.length === 1 && porLineas[0].includes(',')) {
                resultados = porLineas[0]
                    .split(',')
                    .map((o: string) => o.trim())
                    .filter((o: string) => o !== '');
            } else {
                resultados = porLineas;
            }
        } else {
            // Fallback
            resultados = [
                'Técnicas avanzadas',
                'Contenido exclusivo',
                'Soporte personalizado',
                'Acceso de por vida'
            ];
        }

        // Limpieza final: Eliminar comas o puntos y coma al final de cada objetivo
        return resultados.map(r => r.replace(/[,;]+$/, ''));
    };

    const objetivosFinales = procesarObjetivos();

    // Manejar inscripción con loading
    const manejarInscripcionLocal = async () => {
        // En vez de llamar handleInscripcion directamente, mostramos el modal
        setMostrarModalPago(true);
    };

    // Inicialización
    useEffect(() => {
        // Ocultar navegación
        document.body.classList.add('vista-premium-activa');

        // Iniciar contador
        calcularTiempoRestante();
        intervaloRef.current = setInterval(calcularTiempoRestante, 1000);

        return () => {
            if (intervaloRef.current) {
                clearInterval(intervaloRef.current);
            }
            document.body.classList.remove('vista-premium-activa');
        };
    }, []);

    return (
        <div className="vista-premium-container">
            {/* Banner de oferta */}
            {(contenido.precio_rebajado || contenido.fecha_expiracion) && (
                <>
                    <div className="vista-premium-banner-oferta">
                        <div className="vista-premium-banner-contenido">
                            <div className="vista-premium-banner-izquierda">
                                <button className="vista-premium-btn-volver" onClick={volver}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="vista-premium-icono-volver" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                                    </svg>
                                    <span>Volver</span>
                                </button>
                                <div className="vista-premium-badge-oferta">
                                    <svg className="vista-premium-icono-reloj" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    <span className="vista-premium-texto-oferta">¡OFERTA EXCLUSIVA!</span>
                                </div>
                                {calcularDescuento() > 0 && (
                                    <span className="vista-premium-badge-descuento">
                                        -{calcularDescuento()}%
                                    </span>
                                )}
                            </div>

                            <div className="vista-premium-contador-container">
                                <div className="vista-premium-contador-label">La oferta termina en:</div>
                                <div className="vista-premium-contador-grid">
                                    <div className="vista-premium-contador-item">
                                        <div className="vista-premium-contador-valor">{tiempoRestante.dias}</div>
                                        <div className="vista-premium-contador-unidad">Días</div>
                                    </div>
                                    <div className="vista-premium-contador-item">
                                        <div className="vista-premium-contador-valor">{tiempoRestante.horas}</div>
                                        <div className="vista-premium-contador-unidad">Horas</div>
                                    </div>
                                    <div className="vista-premium-contador-item">
                                        <div className="vista-premium-contador-valor">{tiempoRestante.minutos}</div>
                                        <div className="vista-premium-contador-unidad">Min</div>
                                    </div>
                                    <div className="vista-premium-contador-item">
                                        <div className="vista-premium-contador-valor">{tiempoRestante.segundos}</div>
                                        <div className="vista-premium-contador-unidad">Seg</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Espaciador */}
                    <div className="vista-premium-espaciador"></div>
                </>
            )}

            {/* Sección Hero Principal */}
            <div className="vista-premium-hero">
                {/* Espaciador superior */}
                <div className="vista-premium-hero-espaciador"></div>

                {/* Fondo animado */}
                <div className="vista-premium-hero-fondo">
                    <div className="vista-premium-hero-gradiente"></div>
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
                            {/* Categoría y estudiantes */}
                            <div className="vista-premium-hero-badges">
                                <span className="vista-premium-categoria">
                                    {contenido.categoria || contenido.nivel || (tipoContenido === 'curso' ? 'Curso' : 'Tutorial')}
                                </span>
                                <div className="vista-premium-estudiantes-container">
                                    <div className="vista-premium-avatares">
                                        <img className="vista-premium-avatar" src="/images/Home/Jesus-Gonzalez--Profesor-de-acordeon.jpg" alt="Estudiante" />
                                        <img className="vista-premium-avatar" src="/images/Home/Cursos-Acordeon.jpg" alt="Estudiante" />
                                    </div>
                                    <span className="vista-premium-estudiantes-texto">
                                        +{contenido.estudiantes_inscritos || '300'} estudiantes
                                    </span>
                                </div>
                            </div>

                            {/* Título */}
                            <h1 className="vista-premium-titulo">
                                {contenido.titulo || 'Domina este contenido exclusivo'}
                            </h1>

                            {/* Descripción */}
                            <p className="vista-premium-descripcion">
                                {contenido.descripcion_corta || 'Aprende habilidades avanzadas con este contenido exclusivo, diseñado para llevarte al siguiente nivel con metodología probada.'}
                            </p>

                            {/* Objetivos */}
                            <div className="vista-premium-objetivos-grid">
                                {objetivosFinales.map((objetivo, i) => (
                                    <div key={i} className="vista-premium-objetivo" style={{ animationDelay: `${i * 100}ms` }}>
                                        <svg className="vista-premium-objetivo-icono" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        <span className="vista-premium-objetivo-texto">{objetivo}</span>
                                    </div>
                                ))}
                            </div>

                            {/* CTA y Precio */}
                            <div className="vista-premium-cta-container">
                                {!estaInscrito ? (
                                    <>
                                        {/* Precio */}
                                        <div className="vista-premium-precio-container">
                                            {contenido.precio_rebajado || contenido.fecha_expiracion ? (
                                                <div className="vista-premium-precio-flex">
                                                    {contenido.precio_normal && contenido.precio_rebajado && contenido.precio_normal > contenido.precio_rebajado ? (
                                                        <>
                                                            <span className="vista-premium-precio-tachado">
                                                                ${contenido.precio_normal.toLocaleString()}
                                                            </span>
                                                            <span className="vista-premium-precio-rebajado">
                                                                ${contenido.precio_rebajado.toLocaleString()}
                                                            </span>
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

                                        {/* Botones */}
                                        <div className="vista-premium-botones-container">
                                            <button
                                                className="vista-premium-btn-principal"
                                                onClick={manejarInscripcionLocal}
                                                disabled={cargando}
                                            >
                                                {cargando ? (
                                                    <>
                                                        <svg className="vista-premium-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="vista-premium-spinner-circulo" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="vista-premium-spinner-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Procesando...
                                                    </>
                                                ) : (
                                                    tipoContenido === 'curso' ? 'Comprar curso' : 'Comprar tutorial'
                                                )}
                                            </button>

                                            <button
                                                className="vista-premium-btn-secundario"
                                                onClick={() => {
                                                    const elemento = document.getElementById('detalles');
                                                    if (elemento) {
                                                        elemento.scrollIntoView({ behavior: 'smooth' });
                                                    }
                                                }}
                                            >
                                                Ver más detalles
                                            </button>
                                        </div>

                                        {/* Garantía */}
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
                                    <button
                                        className="vista-premium-btn-continuar"
                                        onClick={verContenido}
                                    >
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
                                        src={contenido.imagen_url || '/images/Home/Aprende a tocar el acordeon con los mejores cursos.jpg'}
                                        alt={contenido.titulo || 'Imagen del curso'}
                                        className="vista-premium-video-imagen"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/Home/Aprende a tocar el acordeon con los mejores cursos.jpg';
                                        }}
                                    />

                                    {/* Botón play */}
                                    <div className="vista-premium-play-overlay">
                                        <div className="vista-premium-play-btn">
                                            <svg className="vista-premium-play-icono" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M8 5.14v14l11-7-11-7z" fill="currentColor" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Badge */}
                                    <div className="vista-premium-preview-badge">
                                        Vista previa
                                    </div>
                                </div>

                                {/* Valoraciones */}
                                <div className="vista-premium-rating-card">
                                    <div className="vista-premium-rating-fondo"></div>
                                    <div className="vista-premium-rating-contenido">
                                        <div className="vista-premium-rating-header">
                                            <div className="vista-premium-estrellas">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg key={i} className="vista-premium-estrella" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
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

            {/* Sección de Ventajas y Características */}
            <div className="vista-premium-ventajas" id="detalles">
                <div className="vista-premium-ventajas-contenedor">
                    {/* Encabezado */}
                    <div className="vista-premium-ventajas-header">
                        <h2 className="vista-premium-ventajas-titulo">¿Por qué elegir nuestros cursos de acordeón?</h2>
                        <p className="vista-premium-ventajas-subtitulo">
                            Descubre por qué más de 10,000 estudiantes confían en nuestra metodología exclusiva para dominar el acordeón vallenato
                        </p>
                    </div>

                    {/* Grid de características */}
                    <div className="vista-premium-ventajas-grid">
                        {/* Característica 1 */}
                        <div className="vista-premium-ventaja-card vista-premium-ventaja-morado">
                            <div className="vista-premium-ventaja-icono">
                                <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                                </svg>
                            </div>
                            <h3 className="vista-premium-ventaja-titulo">Metodología Exclusiva</h3>
                            <p className="vista-premium-ventaja-descripcion">
                                Nuestro método de enseñanza paso a paso ha sido perfeccionado durante más de 15 años, garantizando resultados rápidos incluso si nunca has tocado un acordeón.
                            </p>
                            <ul className="vista-premium-ventaja-lista">
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Técnicas pedagógicas comprobadas</span>
                                </li>
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Progresión lógica y fluida</span>
                                </li>
                            </ul>
                        </div>

                        {/* Característica 2 */}
                        <div className="vista-premium-ventaja-card vista-premium-ventaja-azul">
                            <div className="vista-premium-ventaja-icono">
                                <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <h3 className="vista-premium-ventaja-titulo">Acceso de por Vida</h3>
                            <p className="vista-premium-ventaja-descripcion">
                                Una vez que te inscribes, tendrás acceso ilimitado a todo el material, actualizaciones y nuevos contenidos que se añadan en el futuro.
                            </p>
                            <ul className="vista-premium-ventaja-lista">
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Sin suscripciones mensuales</span>
                                </li>
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Actualizaciones gratuitas</span>
                                </li>
                            </ul>
                        </div>

                        {/* Característica 3 */}
                        <div className="vista-premium-ventaja-card vista-premium-ventaja-ambar">
                            <div className="vista-premium-ventaja-icono">
                                <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                            </div>
                            <h3 className="vista-premium-ventaja-titulo">Comunidad Exclusiva</h3>
                            <p className="vista-premium-ventaja-descripcion">
                                Únete a una comunidad activa de estudiantes y profesionales donde podrás compartir tus avances, resolver dudas y recibir feedback.
                            </p>
                            <ul className="vista-premium-ventaja-lista">
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Grupos exclusivos de WhatsApp</span>
                                </li>
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Eventos virtuales con expertos</span>
                                </li>
                            </ul>
                        </div>

                        {/* Característica 4 */}
                        <div className="vista-premium-ventaja-card vista-premium-ventaja-verde">
                            <div className="vista-premium-ventaja-icono">
                                <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                </svg>
                            </div>
                            <h3 className="vista-premium-ventaja-titulo">Garantía de Satisfacción</h3>
                            <p className="vista-premium-ventaja-descripcion">
                                Estamos tan seguros de la calidad de nuestros cursos que ofrecemos una garantía de devolución de 30 días sin preguntas.
                            </p>
                            <ul className="vista-premium-ventaja-lista">
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>30 días para probar sin riesgo</span>
                                </li>
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Devolución completa del 100%</span>
                                </li>
                            </ul>
                        </div>

                        {/* Característica 5 */}
                        <div className="vista-premium-ventaja-card vista-premium-ventaja-rosa">
                            <div className="vista-premium-ventaja-icono">
                                <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"></path>
                                </svg>
                            </div>
                            <h3 className="vista-premium-ventaja-titulo">Contenido Premium HD</h3>
                            <p className="vista-premium-ventaja-descripcion">
                                Todas nuestras lecciones están grabadas con equipos profesionales para garantizar la mejor calidad de audio y video.
                            </p>
                            <ul className="vista-premium-ventaja-lista">
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Vídeos en alta definición (4K)</span>
                                </li>
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Audio profesional de estudio</span>
                                </li>
                            </ul>
                        </div>

                        {/* Característica 6 */}
                        <div className="vista-premium-ventaja-card vista-premium-ventaja-indigo">
                            <div className="vista-premium-ventaja-icono">
                                <svg className="vista-premium-ventaja-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                </svg>
                            </div>
                            <h3 className="vista-premium-ventaja-titulo">Aprende a Tu Ritmo</h3>
                            <p className="vista-premium-ventaja-descripcion">
                                Nuestros cursos están diseñados para que avances a tu propio paso, sin presiones ni fechas límite. Estudia cuando y donde quieras.
                            </p>
                            <ul className="vista-premium-ventaja-lista">
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Acceso desde cualquier dispositivo</span>
                                </li>
                                <li className="vista-premium-ventaja-item">
                                    <svg className="vista-premium-ventaja-check" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                    <span>Descarga las lecciones para ver offline</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* CTA final */}
                    {!estaInscrito && (
                        <div className="vista-premium-ventajas-cta">
                            <p className="vista-premium-ventajas-cta-texto">
                                ¡No esperes más para iniciar tu camino hacia el dominio del acordeón!
                            </p>
                            <p className="vista-premium-ventajas-cta-garantia">
                                Oferta por tiempo limitado. <span className="vista-premium-ventajas-cta-destacado">Garantía de 30 días de devolución</span> del dinero.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sección de Precios */}
            <div className="vista-premium-precios">
                <div className="vista-premium-precios-contenedor">
                    <div className="vista-premium-precios-header">
                        <p className="vista-premium-precios-mensaje">No pierdas esta oportunidad,</p>
                        <p className="vista-premium-precios-mensaje">
                            ¡garantiza hoy <span className="vista-premium-precios-destacado">tu participación!</span>
                        </p>
                    </div>

                    {/* Tarjeta de precios */}
                    <div className="vista-premium-precios-card">
                        <div className="vista-premium-precios-card-contenido">
                            {/* Título */}
                            <div className="vista-premium-precios-titulo-container">
                                <p className="vista-premium-precios-titulo">{contenido.titulo || 'Curso/Tutorial'}</p>
                                <p className="vista-premium-precios-descripcion">
                                    {contenido.descripcion_corta || 'Accede a contenido premium y exclusivo.'}
                                </p>
                            </div>

                            {/* Objetivos */}
                            <div className="vista-premium-precios-objetivos">
                                {objetivosFinales.map((objetivo, i) => (
                                    <div key={i} className="vista-premium-precios-objetivo">
                                        <span className="vista-premium-precios-check">✓</span>
                                        <p className="vista-premium-precios-objetivo-texto">{objetivo}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Módulos/Lecciones */}
                            {contenido.modulos_preview && contenido.modulos_preview.length > 0 && (
                                <div className="vista-premium-precios-modulos">
                                    <h2 className="vista-premium-precios-modulos-titulo">Lecciones y módulos</h2>
                                    <div className="vista-premium-precios-modulos-lista">
                                        {contenido.modulos_preview.map((modulo, i) => (
                                            <div key={i} className="vista-premium-precios-modulo">
                                                <div className="vista-premium-precios-modulo-header">
                                                    <h3 className="vista-premium-precios-modulo-titulo">
                                                        Módulo {i + 1}: {modulo.titulo}
                                                    </h3>
                                                </div>
                                                {modulo.descripcion && (
                                                    <p className="vista-premium-precios-modulo-descripcion">{modulo.descripcion}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Divisor */}
                            <div className="vista-premium-precios-divisor"></div>

                            {/* Precio */}
                            <div className="vista-premium-precios-precio-container">
                                {contenido.precio_normal && contenido.precio_rebajado && contenido.precio_normal > contenido.precio_rebajado ? (
                                    <>
                                        <p className="vista-premium-precios-precio-antes">De: ${contenido.precio_normal.toLocaleString()}</p>
                                        <div className="vista-premium-precios-precio-flex">
                                            <span className="vista-premium-precios-precio-final">${contenido.precio_rebajado.toLocaleString()}</span>
                                            <span className="vista-premium-precios-descuento-badge">
                                                -{Math.round((1 - contenido.precio_rebajado / contenido.precio_normal) * 100)}%
                                            </span>
                                        </div>
                                        <p className="vista-premium-precios-detalle">Pago único - Acceso de por vida</p>
                                    </>
                                ) : contenido.precio_normal ? (
                                    <>
                                        <p className="vista-premium-precios-precio-label">Precio:</p>
                                        <span className="vista-premium-precios-precio-final">${contenido.precio_normal.toLocaleString()}</span>
                                        <p className="vista-premium-precios-detalle">Pago único - Acceso de por vida</p>
                                    </>
                                ) : (
                                    <>
                                        <span className="vista-premium-precios-precio-gratis">GRATIS</span>
                                        <p className="vista-premium-precios-detalle">Contenido 100% gratuito</p>
                                    </>
                                )}
                            </div>

                            {/* Botón CTA */}
                            <button
                                className="vista-premium-precios-btn"
                                onClick={manejarInscripcionLocal}
                                disabled={cargando}
                            >
                                ¡QUIERO APROVECHAR ESTA PROMOCIÓN!
                            </button>

                            {/* Métodos de pago */}
                            <div className="vista-premium-precios-metodos">
                                <div className="vista-premium-precios-metodo">PayPal</div>
                                <div className="vista-premium-precios-metodo">Visa</div>
                                <div className="vista-premium-precios-metodo">Mastercard</div>
                                <div className="vista-premium-precios-metodo">AmEx</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sección de Mentor */}
            <div className="vista-premium-mentor">
                <div className="vista-premium-mentor-contenedor">
                    <div className="vista-premium-mentor-grid">
                        {/* Imagen del mentor */}
                        <div className="vista-premium-mentor-imagen-container">
                            <div className="vista-premium-mentor-imagen-fondo"></div>
                            <div className="vista-premium-mentor-imagen-wrapper">
                                <img
                                    src="/images/Foto-maestro-oficial-JESUS-GONZALEZ.jpg"
                                    alt="Jesús González - Maestro de Acordeón"
                                    className="vista-premium-mentor-imagen"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/Home/Jesus-Gonzalez--Profesor-de-acordeon.jpg';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Información del mentor */}
                        <div className="vista-premium-mentor-info">
                            <div>
                                <h2 className="vista-premium-mentor-nombre">JESÚS GONZÁLEZ</h2>
                                <h3 className="vista-premium-mentor-titulo">¿Quién será tu mentor?</h3>
                            </div>

                            <p className="vista-premium-mentor-descripcion">
                                Clases con un Maestro experto y de larga trayectoria en la música vallenata.
                                Jesús González ha compartido escenario con las más grandes estrellas del vallenato como
                                Jorge Celedón, Felipe Peláez y muchos más.
                            </p>

                            <div className="vista-premium-mentor-logros">
                                <div className="vista-premium-mentor-logro">
                                    <svg className="vista-premium-mentor-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p>Más de 15 años de experiencia enseñando acordeón vallenato</p>
                                </div>
                                <div className="vista-premium-mentor-logro">
                                    <svg className="vista-premium-mentor-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p>Metodología exclusiva paso a paso para principiantes y avanzados</p>
                                </div>
                                <div className="vista-premium-mentor-logro">
                                    <svg className="vista-premium-mentor-check" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <p>Más de 10,000 estudiantes satisfechos en todo el mundo</p>
                                </div>
                            </div>

                            {/* Botón CTA */}
                            <button
                                className="vista-premium-mentor-btn"
                                onClick={manejarInscripcionLocal}
                                disabled={cargando}
                            >
                                ¡GARANTIZA TU CUPO AHORA!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal de Pago */}
            <ModalPagoInteligente
                mostrar={mostrarModalPago}
                setMostrar={setMostrarModalPago}
                contenido={contenido as any}
                tipoContenido={tipoContenido === 'curso' ? 'curso' : 'tutorial'}
            />
        </div >
    );
};

export default VistaPremium;
