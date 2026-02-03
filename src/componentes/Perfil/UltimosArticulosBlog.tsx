import React, { useEffect, useState } from 'react'
import { supabase, supabaseAnon } from '../../servicios/supabaseCliente'
import './UltimosArticulosBlog.css'

export default function UltimosArticulosBlog() {
  const [articulos, setArticulos] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarArticulos()
  }, [])

  async function cargarArticulos() {
    setCargando(true)
    setError(null)
    try {
      const { data, error: queryError } = await supabaseAnon
        .from('blog_articulos')
        .select('id, titulo, resumen, imagen_url, creado_en, slug')
        .eq('estado', 'publicado')
        .order('creado_en', { ascending: false })
        .limit(3)

      if (queryError) throw queryError
      setArticulos(data || [])
    } catch (err: any) {
      console.error('Error cargando artículos:', err)
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  function irAlBlog() {
    window.location.href = '/blog'
  }

  function formatearFecha(fecha: string) {
    const fechaObj = new Date(fecha)
    return fechaObj.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  function truncarTexto(texto: string, limite: number = 80) {
    if (!texto) return ''
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto
  }

  return (
    <div className="banner-articulos">
      <div className="header-banner">
        <h3 className="titulo-banner">📝 Últimos del Blog</h3>
        <button className="btn-ver-todo" onClick={irAlBlog}>
          Ver todo
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {cargando ? (
        <div className="skeleton">
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
          <div className="skeleton-item"></div>
        </div>
      ) : error ? (
        <div className="error-estado">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="icono-error">
            <circle cx="24" cy="24" r="20" stroke="#ef4444" strokeWidth="2" />
            <path d="M16 16L32 32M32 16L16 32" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="mensaje-error">{error}</p>
          <button className="btn-reintentar" onClick={cargarArticulos}>
            Reintentar
          </button>
        </div>
      ) : articulos.length > 0 ? (
        <div className="lista-articulos">
          {articulos.map((articulo) => (
            <a
              key={articulo.id}
              href={`/blog/${articulo.slug}`}
              className="articulo-item"
            >
              <div className="contenido-articulo">
                <h4 className="titulo-articulo">{truncarTexto(articulo.titulo, 55)}</h4>
                <div className="meta-articulo">
                  <span className="fecha">{formatearFecha(articulo.creado_en)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      ) : (
        <div className="sin-articulos">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="icono-vacio">
            <path d="M8 8H40L38 40H10L8 8Z" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 20V24" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 20V24" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
            <path d="M32 20V24" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p>No hay artículos publicados todavía.</p>
          <button className="btn-ir-blog" onClick={irAlBlog}>Explorar Blog</button>
        </div>
      )}
    </div>
  )
}
