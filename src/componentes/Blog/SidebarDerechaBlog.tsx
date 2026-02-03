import React, { useState } from 'react'

const SidebarDerechaBlog: React.FC = () => {
  const [emailSuscripcion, setEmailSuscripcion] = useState('')
  const [mensajeSuscripcion, setMensajeSuscripcion] = useState('')

  const manejarSuscripcion = async (e: React.FormEvent) => {
    e.preventDefault()
    const mensaje = !emailSuscripcion.includes('@') ? 'Por favor ingresa un email válido' : '¡Gracias por suscribirte! 🎵'
    setMensajeSuscripcion(mensaje)
    if (mensaje.includes('Gracias')) setEmailSuscripcion('')
    setTimeout(() => setMensajeSuscripcion(''), 3000)
  }

  const styles = {
    sidebarAcademia: { position: 'sticky' as const, top: '80px', alignSelf: 'start' as const, width: '100%', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' as const, gap: '1.5rem' },
    seccion: { paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' },
    seccionUltima: { borderBottom: 'none', paddingBottom: 0 },
    seccionPrimera: { textAlign: 'center' as const },
    h4: { fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' },
    iconoNewsletter: { fontSize: '2.5rem', marginBottom: '0.5rem' },
    formularioSuscripcion: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', margin: '1rem 0' },
    input: { padding: '0.8rem', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem' },
    button: { background: '#10b981', color: 'white', border: 'none', padding: '0.8rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' },
    mensajeSuscripcion: { fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', background: '#fee2e2', color: '#dc2626' },
    mensajeExito: { background: '#d1fae5', color: '#059669' },
    beneficiosSuscripcion: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', textAlign: 'left' as const, marginTop: '1rem' },
    beneficio: { display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' },
    cursoMini: { display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '1rem' },
    cursoImg: { width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' as const },
    cursoInfo: { flex: 1 },
    cursoTitulo: { fontSize: '0.9rem', fontWeight: 600, margin: 0 },
    rating: { fontSize: '0.8rem', color: '#64748b' },
    precioRebajado: { fontWeight: 700, color: '#10b981', fontSize: '0.9rem', marginRight: '0.5rem' },
    precioOriginal: { fontSize: '0.8rem', textDecoration: 'line-through', color: '#64748b' },
    botonVerTodos: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#3b82f6', padding: '0.8rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', marginTop: '1.5rem', fontSize: '1rem' },
    testimonio: { background: '#f8fafc', borderRadius: '12px', borderLeft: '3px solid #3b82f6', padding: '1rem', marginBottom: '1rem' },
    testimonioP: { fontSize: '0.9rem', lineHeight: 1.4, margin: '0 0 1rem 0', fontStyle: 'italic' },
    autorTestimonio: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
    avatarTestimonio: { width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 },
    infoAutor: { fontSize: '0.85rem' },
    nombreAutor: { fontWeight: 600, display: 'block' },
    ubicacion: { color: '#64748b' },
    redesContainer: { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem' },
    redSocial: { display: 'flex', alignItems: 'center', padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', textDecoration: 'none', color: '#1e293b', transition: 'all 0.2s ease' },
    redSocialTexto: { flexGrow: 1, margin: '0 0.5rem', fontWeight: 500 },
    seguidores: { fontSize: '0.8rem', color: '#64748b' }
  }

  return (
    <>
      <aside style={styles.sidebarAcademia}>
        <div style={{...styles.seccion, ...styles.seccionPrimera}}>
          <div style={styles.iconoNewsletter}>📧</div>
          <h4 style={styles.h4}>Tips Exclusivos Semanales</h4>
          <p>Recibe técnicas avanzadas, tabs exclusivas y descuentos especiales</p>
          <form onSubmit={manejarSuscripcion} style={styles.formularioSuscripcion}>
            <input type="email" placeholder="tu@email.com" value={emailSuscripcion} onChange={(e)=>setEmailSuscripcion(e.target.value)} style={styles.input} />
            <button type="submit" style={styles.button} onMouseEnter={(e)=>{e.currentTarget.style.background='#059669'}} onMouseLeave={(e)=>{e.currentTarget.style.background='#10b981'}}>Suscribirme</button>
          </form>
          {mensajeSuscripcion && (
            <div style={{...styles.mensajeSuscripcion, ...(mensajeSuscripcion.includes('Gracias') ? styles.mensajeExito : {})}}>{mensajeSuscripcion}</div>
          )}
          <div style={styles.beneficiosSuscripcion}>
            <div style={styles.beneficio}><span>🎼</span> Tabs exclusivas semanales</div>
            <div style={styles.beneficio}><span>💰</span> Descuentos especiales</div>
            <div style={styles.beneficio}><span>🏆</span> Tips de profesionales</div>
          </div>
        </div>
        <div style={styles.seccion}>
          <h4 style={styles.h4}>🏆 Cursos Más Populares</h4>
          <div style={styles.cursoMini}><img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=200&q=80" alt="Curso Básico" style={styles.cursoImg} /><div style={styles.cursoInfo}><h5 style={styles.cursoTitulo}>Acordeón Básico</h5><div style={styles.rating}>⭐⭐⭐⭐⭐ 4.9</div><div><span style={styles.precioRebajado}>$79</span><span style={styles.precioOriginal}>$159</span></div></div></div>
          <div style={styles.cursoMini}><img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=200&q=80" alt="Curso Avanzado" style={styles.cursoImg} /><div style={styles.cursoInfo}><h5 style={styles.cursoTitulo}>Técnicas Avanzadas</h5><div style={styles.rating}>⭐⭐⭐⭐⭐ 4.8</div><div><span style={styles.precioRebajado}>$99</span><span style={styles.precioOriginal}>$199</span></div></div></div>
          <button style={styles.botonVerTodos} onClick={()=>window.location.href='/cursos'} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.background='#e2e8f0'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.background='#f8fafc'}}>Ver Todos los Cursos</button>
        </div>
        <div style={styles.seccion}>
          <h4 style={styles.h4}>💬 Lo que Dicen Nuestros Estudiantes</h4>
          <div style={styles.testimonio}><p style={styles.testimonioP}>"Jesús es un excelente maestro. Sus explicaciones son claras y he mejorado muchísimo mi técnica."</p><div style={styles.autorTestimonio}><div style={styles.avatarTestimonio}>MC</div><div style={styles.infoAutor}><span style={styles.nombreAutor}>María Carmen</span><span style={styles.ubicacion}>Valledupar</span></div></div></div>
          <div style={{...styles.testimonio, marginBottom: 0}}><p style={styles.testimonioP}>"Los tutoriales son increíbles. Pude aprender mis canciones favoritas rápidamente."</p><div style={styles.autorTestimonio}><div style={styles.avatarTestimonio}>AR</div><div style={styles.infoAutor}><span style={styles.nombreAutor}>Andrés Rodríguez</span><span style={styles.ubicacion}>Barranquilla</span></div></div></div>
        </div>
        <div style={styles.seccionUltima}>
          <h4 style={styles.h4}>🌟 Síguenos</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            <a href="#" style={styles.redSocial} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.background='#e2e8f0'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.background='#f8fafc'}}><span>📸</span><span style={styles.redSocialTexto}>Instagram</span><span style={styles.seguidores}>12K</span></a>
            <a href="#" style={styles.redSocial} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.background='#e2e8f0'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.background='#f8fafc'}}><span>🎥</span><span style={styles.redSocialTexto}>YouTube</span><span style={styles.seguidores}>8.5K</span></a>
            <a href="#" style={styles.redSocial} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateX(4px)';e.currentTarget.style.background='#e2e8f0'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateX(0)';e.currentTarget.style.background='#f8fafc'}}><span>👥</span><span style={styles.redSocialTexto}>Facebook</span><span style={styles.seguidores}>15K</span></a>
          </div>
        </div>
      </aside>
    </>
  )
}

export default SidebarDerechaBlog
