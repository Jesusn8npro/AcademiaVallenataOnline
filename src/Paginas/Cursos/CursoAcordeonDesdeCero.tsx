import React, { useState, useEffect, useRef } from 'react'
import BannerOfertaCurso from './BannerOfertaCurso'
import ModalPagoInteligente from '../../componentes/Pagos/ModalPagoInteligente'
import imgHeroBanner from '../../assets/images/Jesus-Gonzalez--BANNER.jpg'
import imgMaestroSolucion from '../../assets/images/aprende-a-tocar-acordeon-desde-0--curso-definitivo.jpg'
import imgArtistasFamosos from '../../assets/images/Jesus-Gonzalez,-Orlando-Acosta-y-Felipe-Pelaez.jpg'
import imgMetodosPago from '../../assets/images/Metodos-de-pago.jpg'
import imgTestimonio from '../../assets/images/Testimonio-Alumno-Academia-Vallenata-ONLINE.jpg'
import imgFallback from '../../assets/images/Foto maestro oficial JESUS GONZALEZ.jpg'
import './CursoAcordeonDesdeCero.css'

const cursoAcordeon = {
  id: 'd30e46d9-7598-45f9-aa82-7ddb70b7e4a6',
  titulo: 'Curso de Acordeón desde Cero',
  precio_normal: 379000,
  precio_rebajado: 289000,
  descripcion: 'Aprende a tocar acordeón vallenato desde cero absoluto hasta tocar como un profesional',
}

const PROBLEMAS = [
  {
    emoji: '😔',
    titulo: 'La vergüenza en las reuniones',
    texto: 'Cuando sacan el acordeón y todos esperan que toques algo... pero solo te quedas callado viendo a otros brillar.',
  },
  {
    emoji: '😤',
    titulo: 'Años de "algún día lo haré"',
    texto: 'Ya perdiste la cuenta de cuántas veces dijiste "este año sí aprendo"... pero nunca sabes por dónde empezar.',
  },
  {
    emoji: '🤷‍♂️',
    titulo: 'Intentos fallidos sin guía',
    texto: 'Has probado videos de YouTube, apps, hasta un primo que "te enseñó"... pero terminas en lo mismo: ruido sin sentido.',
  },
  {
    emoji: '😰',
    titulo: '"Es muy difícil para mí"',
    texto: 'Crees que no tienes "el don" o que empezaste "muy tarde"... mientras ves a niños de 8 años tocar mejor que tú.',
  },
]

const TITULOS_HERO = [
  'Deja de ser EL QUE OBSERVA y conviértete en EL QUE TODOS APLAUDEN',
  'Aprende a combinar pitos y bajos en 7 DÍAS, aunque NUNCA hayas tocado',
  'El método que transformó a +500 principiantes en ACORDEONISTAS REALES',
  'Deja de SOÑAR con tocar acordeón. Empieza a TOCARLO DE VERDAD HOY',
]

const NUEVAS_CLASES = [
  'Técnicas avanzadas de digitación',
  'Secretos de acordeonistas profesionales',
  'Clases EXCLUSIVAS de acompañamiento',
  'Masterclass de improvisación vallenata',
]

const TESTIMONIOS = [
  {
    texto: 'En solo 2 semanas ya estaba tocando "La Gota Fría" completa. Mi familia no lo podía creer. ¡Ahora soy el alma de la fiesta!',
    autor: 'Carlos Mendoza',
    ciudad: 'Barranquilla, Colombia',
  },
  {
    texto: 'Tengo 58 años y pensé que era muy tarde para aprender. Jesús me demostró que nunca es tarde para cumplir un sueño. ¡Ya toco 15 canciones!',
    autor: 'María Elena Vega',
    ciudad: 'Medellín, Colombia',
  },
  {
    texto: 'Mi hijo de 12 años y yo aprendemos juntos. Es increíble cómo Jesús hace que algo tan complejo se vea tan fácil.',
    autor: 'Roberto Jiménez',
    ciudad: 'Cali, Colombia',
  },
]

const formatearCOP = (n: number) => `$${n.toLocaleString('es-CO')} COP`

const CursoAcordeonDesdeCero: React.FC = () => {
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [tituloIdx, setTituloIdx] = useState(0)
  const [tituloVisible, setTituloVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.classList.add('cadc-landing-activa')
    return () => {
      document.body.classList.remove('cadc-landing-activa')
    }
  }, [])

  // Rotación de títulos del hero con crossfade
  useEffect(() => {
    const id = setInterval(() => {
      setTituloVisible(false)
      setTimeout(() => {
        setTituloIdx((prev) => (prev + 1) % TITULOS_HERO.length)
        setTituloVisible(true)
      }, 380)
    }, 5500)
    return () => clearInterval(id)
  }, [])

  // Animaciones reveal al hacer scroll
  useEffect(() => {
    if (!rootRef.current) return
    const elementos = rootRef.current.querySelectorAll('.cadc-reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('cadc-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    )
    elementos.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const comprarAhora = () => setMostrarModalPago(true)

  const onImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    if (img.dataset.fb === '1') return
    img.dataset.fb = '1'
    img.src = imgFallback
  }

  return (
    <>
      <title>Aprende a Tocar Acordeón Desde Cero - Curso Completo | Academia Vallenata</title>
      <meta
        name="description"
        content="¡Deja de soñar y empieza a tocar! El único curso paso a paso que te lleva de CERO a tocar acordeón como un profesional. Con Jesús González, el maestro más reconocido de Colombia."
      />

      <div ref={rootRef} className="cadc-root">
        <BannerOfertaCurso descuento={24} onCTA={comprarAhora} />

        {/* HERO */}
        <section
          className="cadc-hero"
          style={{ ['--cadc-hero-bg' as string]: `url(${imgHeroBanner})` }}
        >
          <div className="cadc-container">
            <div className="cadc-hero-grid">
              <div className="cadc-hero-info cadc-reveal">
                <div className="cadc-badges-row">
                  <span className="cadc-badge cadc-badge-fuego">🔥 Curso Estrella</span>
                  <span className="cadc-badge cadc-badge-actualizado">⚡ Recién actualizado +50%</span>
                </div>

                <span className="cadc-titulo-dolor">
                  ¿Llevas <strong>años soñando</strong> con tocar acordeón pero nunca sabes por dónde empezar?
                </span>

                <h1 className={`cadc-titulo-principal ${tituloVisible ? '' : 'cadc-titulo-fade'}`}>
                  {TITULOS_HERO[tituloIdx]}
                </h1>

                <div className="cadc-beneficios-quick">
                  <div className="cadc-beneficio-quick">
                    <span className="cadc-beneficio-quick-icono">✓</span>
                    <span>Desde cero absoluto - Sin experiencia previa</span>
                  </div>
                  <div className="cadc-beneficio-quick">
                    <span className="cadc-beneficio-quick-icono">✓</span>
                    <span>Tu primera canción en menos de 7 días</span>
                  </div>
                  <div className="cadc-beneficio-quick">
                    <span className="cadc-beneficio-quick-icono">✓</span>
                    <span>Método del Maestro Jesús González</span>
                  </div>
                </div>

                <button className="cadc-cta-primaria" onClick={comprarAhora}>
                  🚀 ¡Sí, quiero aprender ya!
                </button>

                <div className="cadc-precios-row">
                  <span className="cadc-precio-antes">{formatearCOP(cursoAcordeon.precio_normal)}</span>
                  <span className="cadc-precio-ahora">{formatearCOP(cursoAcordeon.precio_rebajado)}</span>
                  <span className="cadc-precio-ahorro">Ahorras $90.000</span>
                </div>

                <div className="cadc-social-proof">
                  <div className="cadc-social-item">
                    <span className="cadc-social-numero">+500</span>
                    <span className="cadc-social-label">estudiantes felices</span>
                  </div>
                  <div className="cadc-social-item">
                    <span className="cadc-stars-row">★★★★★</span>
                    <span className="cadc-social-label">4.9 / 5 (847 reseñas)</span>
                  </div>
                </div>
              </div>

              <div className="cadc-hero-video-wrapper cadc-reveal">
                <div className="cadc-hero-video-glow" />
                <div className="cadc-hero-video-card">
                  <iframe
                    src="https://iframe.mediadelivery.net/embed/296804/dfc4d85e-c010-4ed8-96ad-ba6bbb264fcd?autoplay=false&loop=false&muted=false&preload=true&responsive=true"
                    title="Aprende a tocar acordeón desde cero"
                    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEMAS */}
        <section className="cadc-problemas">
          <div className="cadc-container">
            <h2 className="cadc-section-titulo cadc-reveal">¿Te identificas con alguna de estas situaciones?</h2>
            <p className="cadc-section-subtitulo cadc-reveal">
              Sabemos exactamente lo que estás sintiendo. Lo hemos visto en miles de estudiantes.
            </p>
            <div className="cadc-problemas-grid">
              {PROBLEMAS.map((p, i) => (
                <div key={i} className="cadc-problema-card cadc-reveal">
                  <span className="cadc-problema-emoji">{p.emoji}</span>
                  <h3 className="cadc-problema-titulo">{p.titulo}</h3>
                  <p className="cadc-problema-texto">{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SOLUCIÓN */}
        <section className="cadc-solucion">
          <div className="cadc-container">
            <div className="cadc-solucion-grid">
              <div className="cadc-solucion-imagen-wrapper cadc-reveal" style={{ position: 'relative' }}>
                <div className="cadc-solucion-glow" />
                <div className="cadc-solucion-imagen">
                  <img src={imgMaestroSolucion} alt="Aprende a tocar acordeón desde cero" onError={onImgError} />
                </div>
              </div>

              <div className="cadc-reveal">
                <h2 className="cadc-solucion-titulo">¡Pero todo eso cambia HOY!</h2>
                <p className="cadc-solucion-subtitulo">
                  El método paso a paso que ha transformado a más de <strong>5,000 personas</strong> en acordeonistas reales.
                </p>

                <div className="cadc-curso-card">
                  <span className="cadc-curso-card-badge">🚀 Recién actualizado</span>
                  <h3 className="cadc-curso-card-titulo">Aprende a Tocar Acordeón Desde Cero</h3>
                  <p className="cadc-curso-card-desc">
                    El único curso que te lleva de tu primera nota hasta tocar como un profesional, sin importar tu edad o experiencia previa.
                  </p>
                  <div className="cadc-nuevas-clases">
                    <div className="cadc-nuevas-clases-label">🎯 Nuevas clases incluidas</div>
                    <ul className="cadc-nuevas-clases-lista">
                      {NUEVAS_CLASES.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="cadc-instructor-card">
                  <h4 className="cadc-instructor-titulo">Tu instructor: Jesús González</h4>
                  <p className="cadc-instructor-bio">
                    He acompañado con mi acordeón a grandes intérpretes del vallenato como Felipe Peláez, Orlando Acosta y muchos más. Con +20 años de experiencia musical, sé exactamente qué necesitas para dominar este hermoso instrumento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CREDIBILIDAD */}
        <section className="cadc-credibilidad">
          <div className="cadc-container">
            <div className="cadc-credibilidad-grid">
              <div className="cadc-credibilidad-info cadc-reveal">
                <h2>
                  Aprende del maestro que ha tocado con <span>las leyendas del vallenato</span>
                </h2>
                <p>
                  Jesús González ha compartido escenario y grabaciones con artistas que marcaron la historia de la música vallenata. Esa experiencia auténtica, cultural y técnica es la que vas a recibir en cada clase del curso.
                </p>
              </div>
              <div className="cadc-credibilidad-imagen cadc-reveal">
                <img src={imgArtistasFamosos} alt="Jesús González con Orlando Acosta y Felipe Peláez" onError={onImgError} />
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIOS */}
        <section className="cadc-testimonios">
          <div className="cadc-container">
            <h2 className="cadc-section-titulo cadc-reveal">Resultados reales de estudiantes</h2>
            <p className="cadc-section-subtitulo cadc-reveal">
              No son promesas vacías. Estos son testimonios verificados de personas como tú.
            </p>
            <div className="cadc-testimonios-grid">
              {TESTIMONIOS.map((t, i) => (
                <div key={i} className="cadc-testimonio-card cadc-reveal">
                  <div className="cadc-testimonio-quote">"</div>
                  <p className="cadc-testimonio-texto">{t.texto}</p>
                  <div className="cadc-testimonio-stars">★★★★★</div>
                  <div className="cadc-testimonio-autor">{t.autor} · {t.ciudad}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* OFERTA FINAL */}
        <section className="cadc-oferta" id="seccion-oferta">
          <div className="cadc-container">
            <div className="cadc-oferta-warning cadc-reveal">⚠ Atención: Esta oferta desaparece pronto</div>
            <h2 className="cadc-oferta-titulo cadc-reveal">
              Tu acceso completo por <span>{formatearCOP(cursoAcordeon.precio_rebajado)}</span>
            </h2>

            <div className="cadc-precios-comparacion cadc-reveal">
              <div className="cadc-precio-bloque cadc-precio-bloque-normal">
                <div className="cadc-precio-label">Precio normal</div>
                <p className="cadc-precio-valor">{formatearCOP(cursoAcordeon.precio_normal)}</p>
              </div>
              <div className="cadc-precio-bloque cadc-precio-bloque-oferta">
                <div className="cadc-precio-label">Solo hoy</div>
                <p className="cadc-precio-valor">{formatearCOP(cursoAcordeon.precio_rebajado)}</p>
              </div>
            </div>

            <div className="cadc-cupos-row cadc-reveal">
              <span className="cadc-cupos-numero">23</span>
              <span>cupos disponibles con precio especial</span>
            </div>

            <div className="cadc-oferta-cta-wrapper cadc-reveal">
              <button className="cadc-cta-mega" onClick={comprarAhora}>
                🚀 ¡Quiero acceso inmediato!
                <small>✅ Garantía de 30 días · ✅ Acceso de por vida</small>
              </button>

              <div className="cadc-garantia-row">
                <span className="cadc-garantia-icono">🛡️</span>
                <div className="cadc-garantia-texto">
                  <strong>Garantía de 30 días</strong>
                  Si no estás 100% satisfecho, te devolvemos tu dinero sin preguntas.
                </div>
              </div>

              <div className="cadc-metodos">
                <img src={imgMetodosPago} alt="Métodos de pago" onError={onImgError} />
                <p>💳 Paga seguro con tarjeta, PSE o efectivo</p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="cadc-footer">
          <div className="cadc-container">
            <p>© 2025 Academia Vallenata Online. Todos los derechos reservados.</p>
            <p>Este sitio no está afiliado con Facebook ni ninguna otra entidad.</p>
          </div>
        </footer>

        {/* STICKY CTA - solo mobile */}
        <div className="cadc-sticky-cta">
          <button onClick={comprarAhora}>🚀 Inscribirme por {formatearCOP(cursoAcordeon.precio_rebajado)}</button>
        </div>

        <ModalPagoInteligente
          mostrar={mostrarModalPago}
          setMostrar={setMostrarModalPago}
          contenido={cursoAcordeon}
          tipoContenido="curso"
        />
      </div>

      {/* Imagen oculta usada solo para precachear el testimonio si lo querés rotar a futuro */}
      <img src={imgTestimonio} alt="" style={{ display: 'none' }} aria-hidden="true" />
    </>
  )
}

export default CursoAcordeonDesdeCero
