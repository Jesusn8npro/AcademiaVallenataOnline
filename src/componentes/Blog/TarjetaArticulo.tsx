import React, { useState } from 'react'

interface TarjetaArticuloProps {
  titulo?: string
  resumen?: string
  contenido?: string
  autor?: string
  creado_en?: string
  imagen_url?: string
  slug?: string
  categoria?: string
  lecturas?: number
  lectura_min?: number
}

const TarjetaArticulo: React.FC<TarjetaArticuloProps> = ({
  titulo = 'Título del artículo', resumen = 'Resumen breve del artículo.', contenido = '', autor = '', creado_en = '', imagen_url = '', slug = '', categoria = 'General', lecturas = 0, lectura_min
}) => {
  const [imagenCargada, setImagenCargada] = useState(false)
  // Fallback estricto de autor
  const autorFinal = (!autor || autor.length > 20) ? 'Maestro Jesus Gonzalez' : autor;

  const calcularTiempoLectura = (texto: string): number => { const palabras = texto.replace(/<[^>]*>/g, '').split(/\s+/).length; return Math.ceil(palabras / 200) }

  // Usar lectura_min directo de BD si existe, sino calcular
  const tiempo_lectura = lectura_min || calcularTiempoLectura(contenido)

  const fechaFormateada = creado_en ? new Date(creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
  const resumenOptimizado = resumen && resumen.length > 120 ? resumen.slice(0, 120).replace(/\s+\S*$/, '...') : resumen
  const imagenFinal = imagen_url || 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80'
  const lecturasFormateadas = lecturas > 1000 ? `${(lecturas / 1000).toFixed(1)}k` : lecturas
  const irAlArticulo = () => { if (slug) window.location.href = `/blog/${slug}` }
  const manejarErrorImagen = (event: React.SyntheticEvent<HTMLImageElement>) => { (event.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&w=800&q=80' }
  const manejarKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') irAlArticulo() }

  const styles = {
    tarjetaArticulo: { display: 'flex', flexDirection: 'column' as const, background: '#ffffff', borderRadius: '24px', boxShadow: '0 10px 35px rgba(0,0,0,0.05), 0 2px 10px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)', position: 'relative' as const },
    cabeceraTargeta: { position: 'relative' as const, height: '210px', overflow: 'hidden' },
    imagenFondo: { width: '100%', height: '100%', objectFit: 'cover' as const, transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)', opacity: imagenCargada ? 1 : 0, filter: imagenCargada ? 'blur(0)' : 'blur(10px)' },
    overlayGradiente: { position: 'absolute' as const, inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)' },
    infoSuperpuesta: { position: 'absolute' as const, top: '1rem', left: '1rem', right: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 600, color: 'white' },
    etiqueta: { display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem', borderRadius: '99px', background: 'rgba(20,20,20,0.5)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', textShadow: '0 1px 2px rgba(0,0,0,0.2)' },
    cuerpoTargeta: { padding: '1.5rem', display: 'flex', flexDirection: 'column' as const, flexGrow: 1, gap: '1rem' },
    titulo: { fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.3, margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden', transition: 'color 0.3s ease' },
    infoAutor: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
    avatar: { width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    infoTexto: { display: 'flex', flexDirection: 'column' as const },
    nombreAutor: { fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' },
    fecha: { fontSize: '0.85rem', color: '#64748b' },
    resumen: { fontSize: '1rem', color: '#64748b', lineHeight: 1.6, margin: 0, flexGrow: 1 },
    pieTargeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #f1f5f9' },
    estadisticas: { display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 },
    stat: { display: 'flex', alignItems: 'center', gap: '0.3rem' },
    iconoStat: { filter: 'grayscale(1)', opacity: 0.7 },
    botonAccion: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#3b82f6', color: 'white', fontWeight: 700, fontSize: '0.9rem', border: 'none', borderRadius: '12px', padding: '0.7rem 1.2rem', cursor: 'pointer', transition: 'all 0.3s ease' }
  }

  return (
    <>
      <article style={styles.tarjetaArticulo} onClick={irAlArticulo} onKeyDown={manejarKeyDown} tabIndex={0} role="button" aria-label={`Leer artículo: ${titulo}`} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(59,130,246,0.15), 0 8px 15px rgba(139,92,246,0.1)'; const imagen = e.currentTarget.querySelector('.imagen-fondo') as HTMLElement; if (imagen) imagen.style.transform = 'scale(1.1)'; const t = e.currentTarget.querySelector('.titulo') as HTMLElement; if (t) t.style.color = '#3b82f6' }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 10px 35px rgba(0,0,0,0.05), 0 2px 10px rgba(0,0,0,0.05)'; const imagen = e.currentTarget.querySelector('.imagen-fondo') as HTMLElement; if (imagen) imagen.style.transform = 'scale(1)'; const t = e.currentTarget.querySelector('.titulo') as HTMLElement; if (t) t.style.color = '#1e293b' }}>
        <header style={styles.cabeceraTargeta}>
          <img className="imagen-fondo" src={imagenFinal} alt={`Imagen para ${titulo}`} style={styles.imagenFondo} onLoad={() => setImagenCargada(true)} onError={manejarErrorImagen} loading="lazy" />
          <div style={styles.overlayGradiente} />
          <div style={styles.infoSuperpuesta}><span style={styles.etiqueta}><span>🏷️</span>{categoria}</span><span style={styles.etiqueta}><span>⏱️</span>{tiempo_lectura} min de lectura</span></div>
        </header>
        <div style={styles.cuerpoTargeta}>
          <h2 className="titulo" style={styles.titulo}>{titulo}</h2>
          <div style={styles.infoAutor}><div style={styles.avatar}>JG</div><div style={styles.infoTexto}><span style={styles.nombreAutor}>Escrito por {autorFinal}</span><span style={styles.fecha}>{fechaFormateada}</span></div></div>
          <p style={styles.resumen}>{resumenOptimizado}</p>
        </div>
        <footer style={styles.pieTargeta}><div style={styles.estadisticas}>{lecturas > 0 && (<span style={styles.stat}><span style={styles.iconoStat}>👁️</span>{lecturasFormateadas} Vistas</span>)}<span style={styles.stat}><span style={styles.iconoStat}>⭐</span>4.8 Rating</span></div><button style={styles.botonAccion} onClick={(e) => { e.stopPropagation(); irAlArticulo() }} onMouseEnter={(e) => { e.currentTarget.style.background = '#8b5cf6'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(139,92,246,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={(e) => { e.currentTarget.style.background = '#3b82f6'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)' }} aria-label="Leer este artículo"><span>Leer Artículo</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'transform 0.3s ease' }}><path d="m9 18 6-6-6-6" /></svg></button></footer>
      </article>
    </>
  )
}

export default TarjetaArticulo
