import { useEffect, useState } from 'react'
import './nuestra-academia.css'

const testimonios = [
  { nombre: 'Carlos Mendoza', ciudad: 'Valledupar, Cesar', tiempo: '6 meses', texto: 'El simulador es increíble, siento que tengo al maestro Jesús aquí conmigo. Jamás pensé aprender tan rápido.', nivel: 'Principiante a Intermedio' },
  { nombre: 'María González', ciudad: 'Barranquilla, Atlántico', tiempo: '1 año', texto: 'La metodología es única. En un año ya toco canciones completas y mi familia no lo puede creer.', nivel: 'Avanzada' },
  { nombre: 'Luis Restrepo', ciudad: 'Medellín, Antioquia', tiempo: '8 meses', texto: 'Desde Medellín siguiendo las clases. El acordeón virtual es una genialidad, mejor que clases presenciales.', nivel: 'Intermedio' }
]

const cronologia = [
  { año: '2020', titulo: 'Los Inicios', descripcion: 'Jesús González inicia su carrera profesional acompañando a Orlando Acosta, adquiriendo experiencia invaluable en el vallenato auténtico.', imagen: '/images/NuestraAcademia/Jesus-Gonzalez,-Orlando-Acosta-y-Felipe-Pelaez.jpg', color: '#ff6600' },
  { año: '2021', titulo: 'Nace la Academia', descripcion: 'Se funda Academia Vallenata Online, revolucionando la enseñanza del acordeón con metodología efectiva y resultados comprobados.', imagen: '/images/NuestraAcademia/Bienvenido--Academia-Vallenata-ONLINE.jpg', color: '#ff8c42' },
  { año: '2022', titulo: 'Consolidación', descripcion: 'Consolidación como acordeonista profesional, perfeccionando técnicas que luego transmite a miles de estudiantes en línea.', imagen: '/images/Home/Foto maestro oficial JESUS GONZALEZ.jpg', color: '#ffb366' },
  { año: '2023-2024', titulo: 'Giras Internacionales', descripcion: 'Recorre Colombia y el mundo acompañando a Poncho Zuleta, llevando el vallenato auténtico a nuevos territorios.', imagen: '/images/NuestraAcademia/Jesus-Gonzalez--BANNER.jpg', color: '#ffd699' },
  { año: '2025', titulo: 'Revolución Digital', descripcion: 'Lanzamiento del Acordeón Interactivo estilo videojuego. Aprender teoría musical, canciones y técnicas nunca fue tan efectivo.', imagen: '/images/Acordeon PRO MAX.png', color: '#ff6600' }
]

export default function NuestraAcademia() {
  const [montado, setMontado] = useState(false)
  const [actualTestimonio, setActualTestimonio] = useState(0)

  useEffect(() => {
    setMontado(true)
    const id = setInterval(() => {
      setActualTestimonio(v => (v + 1) % testimonios.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  return (
    <>
      <title>Nuestra Academia - Academia Vallenata Online</title>
      <meta name="description" content="Conoce la historia de la Academia Vallenata Online y por qué somos la mejor opción para aprender acordeón vallenato con el maestro Jesús González." />

      {/* HERO */}
      <section className="hero-academia">
        <div className="hero-content">
          <div className={`hero-text ${montado ? 'visible' : ''}`}>
            <h1>15 Años Formando <span className="text-gradient">Acordeoneros Auténticos</span></h1>
            <p className="hero-subtitle">De acompañar a las leyendas del vallenato a crear la metodología más efectiva para aprender acordeón desde casa</p>
            <div className="stats-grid">
              <div className="stat-item"><span className="stat-number">5,000+</span><span className="stat-label">Estudiantes Activos</span></div>
              <div className="stat-item"><span className="stat-number">200+</span><span className="stat-label">Horas de Contenido</span></div>
              <div className="stat-item"><span className="stat-number">95%</span><span className="stat-label">Satisfacción</span></div>
            </div>
          </div>
          <div className={`hero-image ${montado ? 'visible' : ''}`}>
            <img src="/images/Home/Foto maestro oficial JESUS GONZALEZ.jpg" alt="Maestro Jesús González" className="maestro-img" />
            <div className="glow-effect" />
          </div>
        </div>
      </section>

      {/* DIFERENCIAS */}
      <section className="section-diferencias">
        <div className="container">
          <h2 className="section-title text-center">¿Por Qué Elegir Academia Vallenata Online?</h2>
          <p className="section-subtitle text-center">Resolvemos los 3 problemas más grandes que tienen los estudiantes de acordeón</p>
          <div className="diferencias-grid">
            <div className={`diferencia-card ${montado ? 'visible' : ''}`}>
              <div className="card-icon">🎯</div>
              <h3>Sin Profesor Cerca</h3>
              <p><strong>Problema:</strong> No hay maestros de acordeón vallenato en tu ciudad</p>
              <p><strong>Solución:</strong> Clases en vivo y simulador interactivo 24/7</p>
              <img src="/images/NuestraAcademia/Clases-de-acordeon-virtuales.jpg" alt="Clases virtuales" className="card-img" />
            </div>
            <div className={`diferencia-card ${montado ? 'visible' : ''}`}>
              <div className="card-icon">💰</div>
              <h3>Clases Muy Costosas</h3>
              <p><strong>Problema:</strong> Clases presenciales cuestan $50,000+ por hora</p>
              <p><strong>Solución:</strong> Acceso ilimitado por menos de $30,000 al mes</p>
              <img src="/images/NuestraAcademia/Cursos-de-acordeon.jpg" alt="Cursos económicos" className="card-img" />
            </div>
            <div className={`diferencia-card ${montado ? 'visible' : ''}`}>
              <div className="card-icon">⏰</div>
              <h3>Horarios Rígidos</h3>
              <p><strong>Problema:</strong> Horarios fijos que no se adaptan a tu vida</p>
              <p><strong>Solución:</strong> Aprende a tu ritmo, cuando quieras, donde quieras</p>
              <img src="/images/NuestraAcademia/Clases-Personalizadas-de-acordeón.jpg" alt="Horarios flexibles" className="card-img" />
            </div>
          </div>
        </div>
      </section>

      {/* HISTORIA */}
      <section className="section-historia">
        <div className="container">
          <h2 className="section-title text-center">Nuestra Historia</h2>
          <p className="historia-intro text-center">De tocar con las leyendas del vallenato a revolucionar la educación musical online</p>
          <div className="cronologia">
            {cronologia.map((evento, index) => (
              <div key={index} className={`cronologia-item ${montado ? 'visible' : ''}`} style={{ ['--delay' as any]: `${index * 0.2}s` }}>
                <div className="cronologia-fecha" style={{ background: evento.color }}>{evento.año}</div>
                <div className="cronologia-content">
                  <div className="cronologia-imagen"><img src={evento.imagen} alt={evento.titulo} loading="lazy" /></div>
                  <div className="cronologia-texto"><h3>{evento.titulo}</h3><p>{evento.descripcion}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULADOR */}
      <section className="section-simulador">
        <div className="container">
          <div className="simulador-content">
            <div className="simulador-text">
              <h2>Acordeón Interactivo <span className="text-gradient">Estilo Videojuego</span></h2>
              <p>La primera plataforma que combina gamificación con aprendizaje musical real. Aprende teoría, técnicas y canciones de forma divertida y efectiva.</p>
              <div className="simulador-features">
                <div className="feature"><span className="feature-icon">🎮</span><span>Experiencia de videojuego</span></div>
                <div className="feature"><span className="feature-icon">🎵</span><span>Teoría musical interactiva</span></div>
                <div className="feature"><span className="feature-icon">🏆</span><span>Sistema de logros y ranking</span></div>
              </div>
              <button className="btn-simulador" onClick={() => (window.location.href = '/simulador-gaming')}>Probar Simulador Gratis</button>
            </div>
            <div className="simulador-imagen">
              <img src="/images/Acordeon PRO MAX.png" alt="Acordeón Interactivo" className="acordeon-img" />
              <div className="simulador-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="section-testimonios">
        <div className="container">
          <h2 className="section-title text-center">Lo Que Dicen Nuestros Estudiantes</h2>
          <div className="testimonios-container">
            {testimonios.map((t, index) => (
              <div key={index} className={`testimonio-card ${actualTestimonio === index ? 'active' : ''}`}>
                <div className="testimonio-content">
                  <p>"{t.texto}"</p>
                  <div className="testimonio-author">
                    <strong>{t.nombre}</strong>
                    <span>{t.ciudad}</span>
                    <span className="nivel">Nivel: {t.nivel}</span>
                    <span className="tiempo">Tiempo estudiando: {t.tiempo}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="testimonios-dots">
              {testimonios.map((_, index) => (
                <button key={index} className={`dot ${actualTestimonio === index ? 'active' : ''}`} onClick={() => setActualTestimonio(index)} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section-cta">
        <div className="container">
          <div className="cta-content">
            <h2>¿Listo Para Convertirte en <span className="text-gradient">Acordeonero Profesional</span>?</h2>
            <p>Únete a los 5,000+ estudiantes que ya están tocando sus canciones favoritas</p>
            <div className="cta-buttons">
              <button className="btn-primary" onClick={() => (window.location.href = '/cursos')}>Ver Nuestros Cursos</button>
              <button className="btn-secondary" onClick={() => (window.location.href = '/simulador-gaming')}>Probar Simulador Gratis</button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

