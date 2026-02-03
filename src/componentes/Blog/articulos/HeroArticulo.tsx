import React from 'react'

interface HeroArticuloProps {
  titulo?: string
  autor?: string
  fecha?: string
  imagen_url?: string
  resumen?: string
  contenidoHtml?: string
  slug?: string
}

const HeroArticulo: React.FC<HeroArticuloProps> = ({ titulo = 'Título del artículo', autor = 'Jesús González', fecha = '', imagen_url = '', resumen = '', contenidoHtml = '', slug = '' }) => {
  const calcularTiempoLectura = (contenido: string): number => { const palabras = contenido.replace(/<[^>]*>/g, '').split(/\s+/).length; return Math.ceil(palabras / 200) }
  const tiempoEstimadoLectura = calcularTiempoLectura(contenidoHtml)
  const fechaFormateada = fecha ? new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  const styles = {
    heroArticulo: { marginBottom: '2rem' },
    heroImagen: { display:'block', width:'100%', height:'400px', borderRadius:'22px 22px 20px 20px', objectFit:'cover' as const, boxShadow:'0 4px 18px rgba(44,85,48,0.13)', marginBottom:'2rem' },
    heroContenido: { padding:'36px 32px 22px 32px' },
    titulo: { fontSize:'2.2rem', fontFamily:"'Montserrat','Segoe UI',Arial,sans-serif", marginBottom:'12px', color:'#2c5530', fontWeight:800 },
    metaAutor: { fontSize:'1.02rem', color:'#7a7a7a', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px', flexWrap:'wrap' as const },
    tiempoLectura: { color:'#ff6b35', fontWeight:600, background:'linear-gradient(135deg,#fff3e0,#ffefd1)', padding:'4px 12px', borderRadius:'12px', fontSize:'0.9rem', border:'1px solid #ffcc80' },
    resumenPreview: { background:'linear-gradient(135deg,#f8fff3,#e8f5e8)', borderRadius:'16px', padding:'20px', margin:'20px 0', border:'1px solid #b6e7a0', boxShadow:'0 4px 12px rgba(19,182,122,0.1)' },
    resumenTitulo: { fontSize:'1.2rem', fontWeight:700, color:'#2c5530', marginBottom:'12px', display:'flex', alignItems:'center', gap:'8px' },
    resumenTexto: { fontSize:'1rem', lineHeight:1.6, color:'#3a5c3c', margin:0 },
    botonesSociales: { display:'flex', gap:'12px', margin:'20px 0', flexWrap:'wrap' as const },
    botonSocial: { display:'inline-flex', alignItems:'center', gap:'8px', padding:'8px 16px', borderRadius:'20px', textDecoration:'none', fontSize:'0.9rem', fontWeight:600, transition:'all 0.3s ease', border:'none', cursor:'pointer' },
    botonTwitter: { background:'#1da1f2', color:'white' },
    botonFacebook: { background:'#4267b2', color:'white' },
    botonWhatsapp: { background:'#25d366', color:'white' },
    botonCopiar: { background:'#6c757d', color:'white' }
  }

  const compartirEnTwitter = () => { const url = encodeURIComponent(window.location.href); const texto = encodeURIComponent(`${titulo} - Academia Vallenata Online`); window.open(`https://twitter.com/intent/tweet?url=${url}&text=${texto}`, '_blank') }
  const compartirEnFacebook = () => { const url = encodeURIComponent(window.location.href); window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank') }
  const compartirEnWhatsapp = () => { const url = encodeURIComponent(window.location.href); const texto = encodeURIComponent(`${titulo} - Academia Vallenata Online`); window.open(`https://wa.me/?text=${texto}%20${url}`, '_blank') }
  const copiarEnlace = async () => { try { await navigator.clipboard.writeText(window.location.href); alert('¡Enlace copiado al portapapeles!') } catch (err) { console.error('Error al copiar:', err) } }

  return (
    <>
      <section style={styles.heroArticulo}>
        {imagen_url && (<img style={styles.heroImagen} src={imagen_url} alt={titulo} loading="eager" />)}
        <div style={styles.heroContenido}>
          <h1 style={styles.titulo}>{titulo}</h1>
          <div style={styles.metaAutor}><span>{autor}</span>{fechaFormateada && <span>· {fechaFormateada}</span>}{tiempoEstimadoLectura>0 && (<span style={styles.tiempoLectura}>· {tiempoEstimadoLectura} min de lectura</span> )}</div>
          {resumen && (<div style={styles.resumenPreview}><h3 style={styles.resumenTitulo}><span>📖</span>Resumen del artículo</h3><p style={styles.resumenTexto}>{resumen}</p></div>)}
          <div style={styles.botonesSociales}>
            <button style={{...styles.botonSocial, ...styles.botonTwitter}} onClick={compartirEnTwitter} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(29,161,242,0.3)'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>🐦 Twitter</button>
            <button style={{...styles.botonSocial, ...styles.botonFacebook}} onClick={compartirEnFacebook} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(66,103,178,0.3)'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>📘 Facebook</button>
            <button style={{...styles.botonSocial, ...styles.botonWhatsapp}} onClick={compartirEnWhatsapp} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(37,211,102,0.3)'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>📱 WhatsApp</button>
            <button style={{...styles.botonSocial, ...styles.botonCopiar}} onClick={copiarEnlace} onMouseEnter={(e)=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(108,117,125,0.3)'}} onMouseLeave={(e)=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>🔗 Copiar enlace</button>
          </div>
        </div>
      </section>
      <style>{`
        @media (max-width:700px){.hero-contenido{padding:18px 5px 5px 5px !important}.hero-contenido h1{font-size:1.3rem !important}.hero-imagen{min-height:120px !important}.resumen-preview{padding:15px !important;border-radius:12px !important}.botones-sociales{justify-content:center}.boton-social{font-size:.8rem !important;padding:6px 12px !important}}
      `}</style>
    </>
  )
}

export default HeroArticulo
