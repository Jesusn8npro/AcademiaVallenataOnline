import React, { useState, useEffect } from 'react'

interface HeroBlogProps {
  titulo?: string
  descripcion?: string
  ctaTexto?: string
  onCta?: () => void
}

const HeroBlog: React.FC<HeroBlogProps> = ({
  titulo = 'Descubre el Mundo del Acordeón',
  descripcion = 'Historias inspiradoras, técnicas profesionales y la comunidad más apasionada del acordeón vallenato. Únete a miles de músicos que ya están transformando su música.',
  ctaTexto = 'Explorar Artículos',
  onCta = () => { window.location.href = '#articulos' }
}) => {
  const [tituloAnimado, setTituloAnimado] = useState('')
  const [mostrarContenido, setMostrarContenido] = useState(false)
  const [mouseX, setMouseX] = useState(0)
  const [mouseY, setMouseY] = useState(0)

  useEffect(() => {
    setTimeout(() => setMostrarContenido(true), 300)
    let index = 0
    const efectoTyping = setInterval(() => {
      if (index < titulo.length) { setTituloAnimado(prev => prev + titulo[index]); index++ } else { clearInterval(efectoTyping) }
    }, 60)
    const manejarMovimientoMouse = (e: MouseEvent) => { setMouseX((e.clientX / window.innerWidth) * 100); setMouseY((e.clientY / window.innerHeight) * 100) }
    window.addEventListener('mousemove', manejarMovimientoMouse)
    return () => { clearInterval(efectoTyping); window.removeEventListener('mousemove', manejarMovimientoMouse) }
  }, [titulo])

  const styles = {
    heroBlog: {
      position: 'relative' as const, width: '100%', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)', '--mouse-x': `${mouseX}%`, '--mouse-y': `${mouseY}%`
    } as React.CSSProperties,
    capaFondo: { position: 'absolute' as const, inset: 0, opacity: 0.7, transition: 'transform 0.3s ease' },
    fondoPrimario: { background: `radial-gradient(circle at calc(${mouseX}% * 0.5) calc(${mouseY}% * 0.5), #3b82f6 0%, #2563eb 30%, transparent 60%)`, transform: `translate(calc(${mouseX}% * -0.02px), calc(${mouseY}% * -0.02px))` },
    fondoSecundario: { background: `radial-gradient(circle at calc(${mouseX}% * 0.8) calc(${mouseY}% * 0.8), #8b5cf6 0%, #7c3aed 25%, transparent 50%)`, transform: `translate(calc(${mouseX}% * -0.01px), calc(${mouseY}% * -0.01px))` },
    fondoAcento: { background: `radial-gradient(circle at calc(${mouseX}% * 1.2) calc(${mouseY}% * 1.2), #10b981 0%, #059669 20%, transparent 40%)`, transform: `translate(calc(${mouseX}% * -0.005px), calc(${mouseY}% * -0.005px))` },
    particulas: { position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const },
    particula: { position: 'absolute' as const, width: '3px', height: '3px', background: 'radial-gradient(circle, rgba(255,255,255,0.8), transparent)', borderRadius: '50%', opacity: 0.4, animation: 'flotar 5s infinite ease-in-out' },
    contenidoHero: { position: 'relative' as const, zIndex: 10, textAlign: 'center' as const, color: 'white', maxWidth: '900px', padding: '2rem', opacity: mostrarContenido ? 1 : 0, transform: mostrarContenido ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' },
    tituloHero: { fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 40%, #3b82f6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1.1, letterSpacing: '-0.02em' },
    cursor: { animation: 'parpadear 1s infinite', color: '#a855f7' },
    subtituloHero: { fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)', lineHeight: 1.6, marginBottom: '3rem', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 400, maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' },
    grillaEstadisticas: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginBottom: '3rem', padding: '2rem 0' },
    itemEstadistica: { textAlign: 'center' as const },
    numeroEstadistica: { display: 'block', fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 900, background: 'linear-gradient(135deg, #10b981, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' },
    etiquetaEstadistica: { fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' as const, letterSpacing: '1px', fontWeight: 500 },
    botonCta: { position: 'relative' as const, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4)', border: 'none', borderRadius: '50px', padding: '1rem 2.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'white', cursor: 'pointer', overflow: 'hidden', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.3s ease', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)' },
    brilloCta: { position: 'absolute' as const, inset: 0, background: 'linear-gradient(135deg, transparent, rgba(255, 255, 255, 0.3), transparent)', transform: 'translateX(-100%)', transition: 'transform 0.6s ease' },
    iconoCta: { transition: 'transform 0.3s ease' },
    notasMusicales: { position: 'absolute' as const, inset: 0, pointerEvents: 'none' as const },
    notaMusical: { position: 'absolute' as const, fontSize: '1.8rem', color: 'rgba(255, 255, 255, 0.2)', animation: 'flotarMusica 8s infinite ease-in-out' },
    indicadorScroll: { position: 'absolute' as const, bottom: '1rem', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' as const, color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem', zIndex: 20 },
    flechaScroll: { fontSize: '1.5rem', animation: 'rebotar 2s infinite', marginTop: '0.5rem' }
  }

  return (
    <>
      <section style={styles.heroBlog}>
        <div style={{...styles.capaFondo, ...styles.fondoPrimario}}></div>
        <div style={{...styles.capaFondo, ...styles.fondoSecundario}}></div>
        <div style={{...styles.capaFondo, ...styles.fondoAcento}}></div>
        <div style={styles.particulas}>
          {Array(15).fill(0).map((_, i) => (
            <div key={i} style={{...styles.particula, animationDelay: `${i * 0.4}s`, animationDuration: `${5 + i * 0.3}s`, left: `calc(${mouseX}% * 1%)`, top: `calc(${mouseY}% * 1%)`}}></div>
          ))}
        </div>
        <div style={styles.contenidoHero}>
          <h1 style={styles.tituloHero}><span>{tituloAnimado}</span><span style={styles.cursor}>|</span></h1>
          <p style={styles.subtituloHero}>{descripcion}</p>
          <div style={styles.grillaEstadisticas}>
            <div style={styles.itemEstadistica}><span style={styles.numeroEstadistica}>500+</span><span style={styles.etiquetaEstadistica}>Artículos</span></div>
            <div style={styles.itemEstadistica}><span style={styles.numeroEstadistica}>15K+</span><span style={styles.etiquetaEstadistica}>Lectores</span></div>
            <div style={styles.itemEstadistica}><span style={styles.numeroEstadistica}>50+</span><span style={styles.etiquetaEstadistica}>Expertos</span></div>
          </div>
          <button style={styles.botonCta} onClick={onCta} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow='0 20px 40px rgba(59,130,246,0.4)';const b=e.currentTarget.querySelector('.brillo-cta') as HTMLElement;if(b) b.style.transform='translateX(100%)';const i=e.currentTarget.querySelector('.icono-cta') as HTMLElement;if(i) i.style.transform='translateX(5px)'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='0 10px 30px rgba(59,130,246,0.3)';const b=e.currentTarget.querySelector('.brillo-cta') as HTMLElement;if(b) b.style.transform='translateX(-100%)';const i=e.currentTarget.querySelector('.icono-cta') as HTMLElement;if(i) i.style.transform='translateX(0)'}}>
            <span>{ctaTexto}</span>
            <span className="icono-cta" style={styles.iconoCta}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7V17"/></svg></span>
            <div className="brillo-cta" style={styles.brilloCta}></div>
          </button>
          <div style={styles.notasMusicales}>
            <span style={{...styles.notaMusical, top: '15%', left: '8%', animationDelay: '0s'}}>♪</span>
            <span style={{...styles.notaMusical, top: '65%', right: '12%', animationDelay: '1.5s'}}>♫</span>
            <span style={{...styles.notaMusical, bottom: '25%', left: '15%', animationDelay: '3s'}}>♪</span>
            <span style={{...styles.notaMusical, top: '35%', right: '20%', animationDelay: '0.8s'}}>♬</span>
          </div>
        </div>
        <div style={styles.indicadorScroll}><span>Desliza para explorar</span><div style={styles.flechaScroll}>↓</div></div>
      </section>
      <style>{`
        @keyframes flotar {0%,100%{transform:translateY(0) translateX(0) scale(1);opacity:.4}50%{transform:translateY(-30px) translateX(10px) scale(1.2);opacity:.8}}
        @keyframes parpadear {0%,50%{opacity:1}51%,100%{opacity:0}}
        @keyframes flotarMusica {0%,100%{transform:translateY(0) rotate(0deg);opacity:.2}50%{transform:translateY(-20px) rotate(10deg);opacity:.6}}
        @keyframes rebotar {0%,20%,50%,80%,100%{transform:translateY(0)}40%{transform:translateY(-8px)}60%{transform:translateY(-4px)}}
        @media (max-width:768px){.contenido-hero{padding:1.5rem !important}.grilla-estadisticas{grid-template-columns:1fr !important;gap:1.5rem !important;margin-bottom:2rem !important}.boton-cta{padding:.9rem 2rem !important;font-size:1rem !important}.nota-musical{font-size:1.4rem !important}}
      `}</style>
    </>
  )
}

export default HeroBlog
