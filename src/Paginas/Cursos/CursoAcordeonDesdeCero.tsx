import React, { useState, useEffect } from 'react'
import ContadorOferta from '../../componentes/ComponentesLanding/ContadorOferta'
import ModalPagoInteligente from '../../componentes/Pagos/ModalPagoInteligente'

const CursoAcordeonDesdeCero: React.FC = () => {
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const cursoAcordeion = { id: 'curso-acordeon-desde-cero', titulo: 'Curso de Acordeón desde Cero', precio_normal: 379000, precio_rebajado: 289000, descripcion: 'Aprende a tocar acordeón vallenato desde cero absoluto hasta tocar como un profesional' }

  useEffect(() => {
    const ocultar = () => {
      const selectores = ['.banner-notificaciones', '.menu-superior', '.barra-superior-negra', '.barra-principal-navegacion', '.banner-permisos-notificacion', '.sidebar-moderno', '.menu-publico', '.navbar']
      selectores.forEach(sel => { document.querySelectorAll(sel).forEach(el => { if (el instanceof HTMLElement) el.style.display = 'none' }) })
      document.body.style.paddingTop = '0'; document.body.style.margin = '0'
    }
    ocultar(); setTimeout(ocultar, 100)
    const handlePageShow = (e: PageTransitionEvent) => { if (e.persisted) { setTimeout(ocultar, 0); setTimeout(ocultar, 100); setTimeout(ocultar, 500) } }
    const handleVisibilityChange = () => { if (!document.hidden) setTimeout(ocultar, 50) }
    window.addEventListener('pageshow', handlePageShow); document.addEventListener('visibilitychange', handleVisibilityChange)
    const observer = new MutationObserver(() => ocultar()); observer.observe(document.body, { childList: true, subtree: true })
    return () => { window.removeEventListener('pageshow', handlePageShow); document.removeEventListener('visibilitychange', handleVisibilityChange); observer.disconnect(); const mostrarSel = ['.banner-notificaciones', '.menu-superior', '.barra-superior-negra', '.barra-principal-navegacion', '.banner-permisos-notificacion', '.sidebar-moderno', '.menu-publico', '.navbar']; mostrarSel.forEach(sel => { document.querySelectorAll(sel).forEach(el => { if (el instanceof HTMLElement) el.style.display = '' }) }); document.body.style.paddingTop = ''; document.body.style.margin = '' }
  }, [])

  const comprarAhora = () => { setMostrarModalPago(true) }

  const styles: any = {
    landingContainer: { width: '100%', minHeight: '100vh', background: '#fff', position: 'relative', zIndex: 1 },
    contenedor: { maxWidth: '1200px', margin: '0 auto', padding: '0 20px' },
    heroe: { background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #111827 100%)', color: 'white', padding: '60px 0', position: 'relative', overflow: 'hidden' },
    heroeAntes: { content: '""', position: 'absolute', inset: 0, background: 'url("/imagenes/Jesus-Gonzalez--BANNER.jpg") center/cover', opacity: .1, zIndex: 1 },
    heroeContenido: { position: 'relative', zIndex: 2, maxWidth: '800px', margin: '0 auto', textAlign: 'center' },
    insignia: { display: 'inline-block', color: 'white', padding: '10px 20px', borderRadius: '30px', fontWeight: 600, margin: '10px auto', width: 'fit-content' },
    insigniaFuego: { background: '#dc2626', padding: '12px 25px', borderRadius: '50px', fontWeight: 'bold', animation: 'pulse 2s infinite' },
    insigniaActualizado: { background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '.9rem', boxShadow: '0 4px 15px rgba(16,185,129,.3)', animation: 'glow 2s infinite' },
    tituloPrincipal: { margin: '30px 0' },
    dolor: { display: 'block', fontSize: '1.1rem', fontWeight: 400, marginBottom: '15px', opacity: .9 },
    solucionTexto: { display: 'block', fontSize: '2.2rem', fontWeight: 900, lineHeight: 1.2, margin: '30px 0', color: '#fbbf24', textShadow: '2px 2px 4px rgba(0,0,0,.3)' },
    beneficios: { margin: '30px 0' },
    beneficio: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '15px', fontSize: '1.05rem' },
    video: { position: 'relative', width: '100%', maxWidth: '600px', height: '350px', margin: '30px auto', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,.3)' },
    videoIframe: { position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' },
    botonPrincipal: { background: 'linear-gradient(135deg, #e6a800 0%, #ff8c00 100%)', color: 'white', border: 'none', padding: '20px 40px', borderRadius: '12px', fontSize: '1.2rem', fontWeight: 900, cursor: 'pointer', width: '100%', margin: '20px 0', transition: 'all .3s ease', boxShadow: '0 8px 25px rgba(230,168,0,.4)', textTransform: 'uppercase' },
    precios: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', margin: '20px 0' },
    precioAntes: { fontSize: '1.2rem', textDecoration: 'line-through', opacity: .7 },
    precioAhora: { fontSize: '2.5rem', fontWeight: 900, color: '#e6a800' },
    ahorro: { fontSize: '1rem', color: '#059669', fontWeight: 600 },
    metodosPago: { margin: '25px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
    metodosImg: { maxWidth: '400px', width: '100%', borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,.3)', marginBottom: '12px', display: 'block', marginLeft: 'auto', marginRight: 'auto' },
    social: { display: 'flex', justifyContent: 'space-between', marginTop: '30px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,.3)' },
    numero: { fontSize: '1.3rem', fontWeight: 900, color: '#e6a800' },
    problemas: { padding: '60px 0', background: '#f8fafc' },
    solucion: { padding: '60px 0', background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', color: 'white' },
    testimonios: { padding: '60px 0', background: '#f8fafc' },
    oferta: { padding: '60px 0', background: 'linear-gradient(135deg, #dc2626, #991b1b)', color: 'white' },
    titulo: { fontSize: '2.2rem', textAlign: 'center', marginBottom: '50px', fontWeight: 800 },
    subtitulo: { fontSize: '1.3rem', color: '#e2e8f0', marginBottom: '25px', fontWeight: 600 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '30px' },
    gridDos: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '50px', alignItems: 'center' },
    gridTres: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '25px' },
    tarjeta: { background: 'white', padding: '25px', borderRadius: '15px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.1)', transition: 'transform .3s ease' },
    emoji: { fontSize: '2.5rem', marginBottom: '15px' },
    foto: { width: '100%', height: '400px', objectFit: 'cover', borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,.2)' },
    cursoInfo: { background: 'rgba(16,185,129,.1)', padding: '25px', borderRadius: '15px', marginBottom: '25px', borderLeft: '5px solid #10b981' },
    badge: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', padding: '6px 15px', borderRadius: '20px', fontSize: '.8rem', fontWeight: 700, marginBottom: '15px', display: 'inline-block', animation: 'pulse 2s infinite' },
    nuevasClases: { marginTop: '20px', padding: '15px', background: 'rgba(16,185,129,.05)', borderLeft: '4px solid #10b981', borderRadius: '8px' },
    instructor: { background: 'rgba(230,168,0,.15)', padding: '20px', borderRadius: '15px', borderLeft: '5px solid #e6a800' },
    preciosComparacion: { display: 'flex', justifyContent: 'center', gap: '50px', margin: '40px 0' },
    precioNormal: { textAlign: 'center', padding: '25px', borderRadius: '15px', background: 'rgba(0,0,0,.2)' },
    precioOferta: { textAlign: 'center', padding: '25px', borderRadius: '15px', background: 'rgba(255,255,255,.1)', border: '3px solid #e6a800' },
    label: { fontSize: '1.1rem', fontWeight: 600, marginBottom: '5px' },
    valor: { fontSize: '2.5rem', fontWeight: 900, margin: '10px 0' },
    especial: { color: '#e6a800' },
    urgencia: { textAlign: 'center', margin: '30px 0', background: 'rgba(0,0,0,.1)', padding: '25px', borderRadius: '15px' },
    cupos: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', margin: '20px 0' },
    cuposNumero: { background: 'white', color: '#dc2626', padding: '10px 20px', borderRadius: '50px', fontWeight: 900, fontSize: '1.4rem' },
    garantia: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', background: 'rgba(255,255,255,.1)', padding: '20px 30px', borderRadius: '15px', marginTop: '30px' },
    icono: { fontSize: '1.8rem' },
    footer: { background: '#1e293b', color: 'white', padding: '30px 0', textAlign: 'center' }
  }

  return (
    <>
      <title>Aprende a Tocar Acordeón Desde Cero - Curso Completo | Academia Vallenata</title>
      <meta name="description" content="¡Deja de soñar y empieza a tocar! El único curso paso a paso que te lleva de CERO a tocar acordeón como un profesional en tiempo récord. Con Jesús González, el maestro más reconocido de Colombia." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      <main style={styles.landingContainer}>
        <ContadorOferta />
        <section style={styles.heroe}><div style={styles.heroeAntes}></div><div style={styles.contenedor}><div style={styles.heroeContenido}><div style={{ ...styles.insignia, ...styles.insigniaFuego }}>🔥 ¡CURSO ESTRELLA! 🔥</div><div style={{ ...styles.insignia, ...styles.insigniaActualizado }}>⚡ ¡CURSO ACTUALIZADO! Ahora incluye 50% MÁS contenido y nuevas clases exclusivas</div><h1 className="titulo-principal" style={styles.tituloPrincipal}><span className="dolor" style={styles.dolor}>¿Llevas AÑOS soñando con tocar acordeón pero nunca sabes por dónde empezar?</span><span className="solucion-texto" style={styles.solucionTexto}>¡Deja de ser EL QUE OBSERVA y conviértete en EL QUE TODOS APLAUDEN!</span></h1><div style={styles.beneficios}><div style={styles.beneficio}>✅ Desde cero absoluto - No necesitas experiencia previa</div><div style={styles.beneficio}>✅ Primera canción en menos de 7 días</div><div style={styles.beneficio}>✅ Método del maestro Jesús González</div></div><div className="video" style={styles.video}><iframe style={styles.videoIframe} src="https://iframe.mediadelivery.net/embed/296804/dfc4d85e-c010-4ed8-96ad-ba6bbb264fcd?autoplay=false&loop=false&muted=false&preload=true&responsive=true" title="Aprende a tocar acordeón desde cero"></iframe></div><button style={styles.botonPrincipal} onClick={comprarAhora} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(230, 168, 0, 0.6)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(230, 168, 0, 0.4)' }}>🚀 ¡SÍ, QUIERO APRENDER YA!</button><div style={styles.precios}><div style={styles.precioAntes}>$379.000 COP</div><div style={styles.precioAhora}>$289.000 COP</div><div style={styles.ahorro}>¡Ahorras $90.000 pesos hoy!</div></div><div className="metodos-pago" style={styles.metodosPago}><img src="/imagenes/Metodos-de-pago.jpg" alt="Métodos de pago" style={styles.metodosImg} /><p style={{ color: '#e2e8f0', fontWeight: 500, opacity: .9 }}>💳 Paga seguro con tarjeta, PSE o efectivo</p></div><div style={styles.social}><div><span style={styles.numero}>+5,000</span> Estudiantes felices</div><div>★★★★★ 4.9/5 (847 reseñas)</div></div></div></div></section>
        <section style={styles.problemas}><div style={styles.contenedor}><h2 style={styles.titulo}>¿Te identificas con alguna de estas situaciones?</h2><div style={styles.grid}><div style={styles.tarjeta}><div style={styles.emoji}>😔</div><h3 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 700 }}>La vergüenza en las reuniones</h3><p style={{ color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '15px' }}>Cuando sacan el acordeón y todos esperan que toques algo... pero solo te quedas callado viendo a otros brillar.</p></div><div style={styles.tarjeta}><div style={styles.emoji}>😤</div><h3 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 700 }}>Años de "algún día lo haré"</h3><p style={{ color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '15px' }}>Ya perdiste la cuenta de cuántas veces dijiste "este año sí aprendo acordeón"... pero nunca sabes por dónde empezar.</p></div><div style={styles.tarjeta}><div style={styles.emoji}>🤷‍♂️</div><h3 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 700 }}>Intentos fallidos sin guía</h3><p style={{ color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '15px' }}>Has probado videos de YouTube, aplicaciones, incluso un primo te "enseñó"... pero siempre te quedas en lo mismo: ruido sin sentido.</p></div><div style={styles.tarjeta}><div style={styles.emoji}>😰</div><h3 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 700 }}>`Es muy difícil para mí`</h3><p style={{ color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '15px' }}>Crees que no tienes "el don" o que empezaste "muy tarde"... mientras ves a niños de 8 años tocar mejor que tú.</p></div></div></div></section>
        <section style={styles.solucion}><div style={styles.contenedor}><div style={styles.gridDos}><img src="/imagenes/aprende-a-tocar-acordeon-desde-0--curso-definitivo.jpg" alt="Jesús González" style={styles.foto} /><div><h2 style={{ ...styles.titulo, color: '#10b981', fontWeight: 900, marginBottom: '15px' }}>¡Pero todo eso cambia HOY!</h2><h3 style={styles.subtitulo}>El método que ha transformado a +5,000 personas</h3><div style={styles.cursoInfo}><span style={styles.badge}>🚀 RECIÉN ACTUALIZADO</span><h4 style={{ marginBottom: '15px', fontSize: '1.2rem', fontWeight: 700 }}>`Aprende a Tocar Acordeón Desde Cero`</h4><p style={{ marginBottom: '20px', lineHeight: 1.6 }}>El único curso paso a paso que te lleva de tu primera nota hasta tocar como un profesional, sin importar tu edad o experiencia.</p><div style={styles.nuevasClases}><strong style={{ color: '#10b981', display: 'block', marginBottom: '10px' }}>🎯 NUEVAS CLASES INCLUIDAS:</strong><ul style={{ marginLeft: '20px' }}><li style={{ marginBottom: '8px', lineHeight: 1.5 }}>✨ Técnicas avanzadas de digitación</li><li style={{ marginBottom: '8px', lineHeight: 1.5 }}>✨ Secretos de acordeonistas profesionales</li><li style={{ marginBottom: '8px', lineHeight: 1.5 }}>✨ Clases EXCLUSIVAS de acompañamiento</li></ul></div></div><div style={styles.instructor}><h4 style={{ color: '#e6a800', fontWeight: 700, marginBottom: '15px' }}>Tu instructor: Jesús González</h4><p style={{ lineHeight: 1.6 }}>He tenido el honor de acompañar con mi acordeón a grandes intérpretes de la música vallenata como Felipe Peláez y Orlando Acosta. Con más de 20 años de experiencia musical, sé exactamente qué necesitas para dominar este hermoso instrumento.</p></div></div></div></div></section>
        <section style={styles.testimonios}><div style={styles.contenedor}><h2 style={styles.titulo}>Resultados reales de estudiantes:</h2><div style={styles.gridTres}><div style={styles.tarjeta}><p style={{ color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '15px' }}>`En solo 2 semanas ya estaba tocando 'La Gota Fría' completa. Mi familia no lo podía creer. ¡Ahora soy el alma de la fiesta!`</p><div style={{ fontWeight: 600, color: '#64748b', fontSize: '.9rem' }}>Carlos Mendoza - Barranquilla, Colombia</div><div style={{ color: '#e6a800', fontSize: '1.1rem', marginBottom: '10px' }}>★★★★★</div></div><div style={styles.tarjeta}><p style={{ color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '15px' }}>`Tengo 58 años y pensé que era muy tarde para aprender. Jesús me demostró que nunca es tarde para cumplir un sueño. ¡Ya toco 15 canciones!`</p><div style={{ fontWeight: 600, color: '#64748b', fontSize: '.9rem' }}>María Elena Vega - Medellín, Colombia</div><div style={{ color: '#e6a800', fontSize: '1.1rem', marginBottom: '10px' }}>★★★★★</div></div><div style={styles.tarjeta}><p style={{ color: '#64748b', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '15px' }}>`Mi hijo de 12 años y yo aprendemos juntos. Es increíble cómo Jesús hace que algo tan complejo se vea tan fácil.`</p><div style={{ fontWeight: 600, color: '#64748b', fontSize: '.9rem' }}>Roberto Jiménez - Cali, Colombia</div><div style={{ color: '#e6a800', fontSize: '1.1rem', marginBottom: '10px' }}>★★★★★</div></div></div></div></section>
        <section style={styles.oferta} id="seccion-oferta"><div style={styles.contenedor}><h2 style={styles.titulo}>⚠️ ATENCIÓN: Esta oferta desaparece en pocas horas</h2><div style={styles.preciosComparacion}><div style={styles.precioNormal}><div style={styles.label}>Precio Normal</div><div style={styles.valor}>$379.000 COP</div></div><div style={styles.precioOferta}><div style={styles.label}>¡HOY SOLO!</div><div style={{ ...styles.valor, ...styles.especial }}>$289.000 COP</div></div></div><div style={styles.urgencia}><p style={{ marginBottom: '20px', lineHeight: 1.6 }}><strong>¿Por qué esta oferta especial?</strong> Porque sé lo frustrante que es soñar con tocar acordeón y no saber cómo empezar. He decidido abrir solo <strong>100 cupos</strong> con precio especial para personas que, como tú, están listas para hacer realidad su sueño.</p><div style={styles.cupos}><span style={styles.cuposNumero}>23</span><span>cupos disponibles</span></div></div><button style={{ ...styles.botonPrincipal, flexDirection: 'column', gap: '8px', fontSize: '1.3rem', padding: '25px 50px' }} onClick={comprarAhora} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 35px rgba(230, 168, 0, 0.6)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(230, 168, 0, 0.4)' }}>🚀 ¡QUIERO ACCESO INMEDIATO!<small style={{ fontSize: '.9rem', fontWeight: 400 }}>✅ Garantía de 30 días • ✅ Acceso de por vida</small></button><div style={styles.garantia}><div style={styles.icono}>🛡️</div><div><strong>Garantía de 30 días</strong><br />Si no estás 100% satisfecho, te devolvemos tu dinero sin preguntas</div></div></div></section>
        <footer style={styles.footer}><div style={styles.contenedor}><p style={{ opacity: .8 }}>© 2025 Academia Vallenata Online. Todos los derechos reservados.</p><p style={{ opacity: .8 }}>Este sitio no está afiliado con Facebook o ninguna entidad de Facebook.</p></div></footer>
        <ModalPagoInteligente mostrar={mostrarModalPago} setMostrar={setMostrarModalPago} contenido={cursoAcordeion} tipoContenido="curso" />
      </main>

      <style>{`
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
        @keyframes glow{0%,100%{box-shadow:0 4px 15px rgba(16,185,129,.3)}50%{box-shadow:0 4px 20px rgba(16,185,129,.6),0 0 30px rgba(16,185,129,.3)}}
        @media (max-width:768px){.grid,.grid-tres{grid-template-columns:1fr!important}.grid-dos{grid-template-columns:1fr!important;gap:30px!important}.precios-comparacion{flex-direction:column!important;gap:20px!important;align-items:center!important}.titulo-principal .solucion-texto{font-size:1.8rem!important;line-height:1.3!important}.titulo-principal .dolor{font-size:1rem!important;margin-bottom:10px!important}.video{height:250px!important;max-width:100%!important}.metodos-pago img{max-width:300px!important}.precio-ahora{font-size:2rem!important}.contenedor{padding:0 15px!important}.titulo{font-size:1.8rem!important}.insignia.actualizado{font-size:.8rem!important;padding:8px 15px!important}}
        .banner-notificaciones,.menu-superior,.sidebar-moderno,.menu-publico,.barra-superior-negra,.barra-principal-navegacion,.banner-permisos-notificacion{display:none!important}
        body{margin:0!important;padding:0!important;overflow-x:hidden}
      `}</style>
    </>
  )
}

export default CursoAcordeonDesdeCero

