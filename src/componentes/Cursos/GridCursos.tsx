import React from 'react'
import './GridCursos.css'
import { generarSlug } from '../../utilidades/slug'
import { useNavigate } from 'react-router-dom'

interface Item {
  id: string
  titulo: string
  descripcion?: string
  imagen_url?: string
  tipo: 'curso' | 'tutorial'
  nivel?: 'principiante' | 'intermedio' | 'avanzado' | 'profesional' | string
  precio_normal?: number | null
  precio_rebajado?: number | null
  rating?: string
  estudiantes?: string
  slug?: string | null
  created_at?: string
}

interface Props {
  items: Item[]
  cargando: boolean
  error: string
  paginaActual: number
  itemsPorPagina: number
  totalItems: number
  onPaginaChange: (nueva: number) => void
}

function calcularDescuento(precioNormal?: number | null, precioRebajado?: number | null) {
  if (!precioNormal || !precioRebajado) return 0
  return Math.round(((precioNormal - precioRebajado) / precioNormal) * 100)
}

function formatearPrecio(precio: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(precio)
}

function acortarTexto(texto?: string, maxLength = 100) {
  if (!texto) return '';
  return texto.length > maxLength ? texto.slice(0, maxLength) + '...' : texto;
}

export default function GridCursos({ items, cargando, error, paginaActual, itemsPorPagina, totalItems, onPaginaChange }: Props) {
  const navigate = useNavigate()
  const totalPaginas = Math.ceil(totalItems / itemsPorPagina)
  const inicioRango = (paginaActual - 1) * itemsPorPagina + 1
  const finRango = Math.min(paginaActual * itemsPorPagina, totalItems)

  const verContenido = (item: Item) => {
    const slug = item.slug || generarSlug(item.titulo)
    navigate(item.tipo === 'curso' ? `/cursos/${slug}` : `/tutoriales/${slug}`)
  }

  const generarPaginas = () => {
    const paginas: number[] = []
    const max = 5
    let inicio = Math.max(1, paginaActual - Math.floor(max / 2))
    let fin = Math.min(totalPaginas, inicio + max - 1)
    if (fin - inicio < max - 1) inicio = Math.max(1, fin - max + 1)
    for (let i = inicio; i <= fin; i++) paginas.push(i)
    return paginas
  }
  const paginasVisibles = generarPaginas()

  const scrollAlTop = () => {
    const el = document.getElementById('grid-cursos')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const cambiarPagina = (pag: number) => {
    if (pag >= 1 && pag <= totalPaginas) {
      onPaginaChange(pag)
      scrollAlTop()
    }
  }

  return (
    <div id="grid-cursos" className="gc-grid-container">
      {cargando ? (
        <div className="gc-loading-container">
          <div className="gc-loading-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="gc-skeleton-card" key={i}>
                <div className="gc-skeleton-image" />
                <div className="gc-skeleton-content">
                  <div className="gc-skeleton-line gc-skeleton-title" />
                  <div className="gc-skeleton-line gc-skeleton-subtitle" />
                  <div className="gc-skeleton-line gc-skeleton-price" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="gc-error-container">
          <div className="gc-error-content">
            <svg className="gc-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <h3>¡Oops! Algo salió mal</h3>
            <p>{error}</p>
            <button className="gc-btn-retry" onClick={() => window.location.reload()}>
              Intentar de Nuevo
            </button>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="gc-empty-container">
          <div className="gc-empty-content">
            <svg className="gc-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <h3>No encontramos resultados</h3>
            <p>Intenta ajustar tus filtros o buscar algo diferente</p>
          </div>
        </div>
      ) : (
        <>
          <div className="gc-cursos-grid">
            {items.map((item) => {
              const descuento = calcularDescuento(item.precio_normal, item.precio_rebajado)
              const esGratis = !item.precio_normal || item.precio_normal === 0

              return (
                <div
                  className="gc-card"
                  key={item.id}
                  onClick={() => verContenido(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && verContenido(item)}
                >
                  <div className="gc-image-container">
                    <img
                      src={item.imagen_url || '/images/default-curso.jpg'}
                      alt={item.titulo}
                      className="gc-card-image"
                      loading="lazy"
                    />

                    <div className={`gc-badge-tipo ${item.tipo}`}>
                      {item.tipo === 'curso' ? '🎓 CURSO' : '🎵 TUTORIAL'}
                    </div>

                    {descuento > 0 && item.precio_normal && item.precio_rebajado && (
                      <div className="gc-badge-descuento">-{descuento}%</div>
                    )}

                    <div className="gc-overlay">
                      <button className="gc-btn-ver">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                        {item.tipo === 'curso' ? 'Ver Curso' : 'Ver Tutorial'}
                      </button>
                    </div>
                  </div>

                  <div className="gc-content">
                    <div className="gc-header">
                      <h3 className="gc-title">{item.titulo}</h3>
                      {(item.rating || item.estudiantes) && (
                        <div className="gc-meta">
                          {item.rating && <span className="gc-rating">⭐ {item.rating}</span>}
                          {item.estudiantes && <span className="gc-estudiantes">👥 {item.estudiantes}</span>}
                        </div>
                      )}
                    </div>

                    <p className="gc-description">
                      {acortarTexto(item.descripcion || 'Contenido educativo de alta calidad para aprender acordeón vallenato')}
                    </p>

                    {item.nivel && (
                      <div className="gc-nivel-container">
                        <span className={`gc-nivel-badge ${item.nivel === 'principiante' ? 'gc-nivel-principiante' :
                            item.nivel === 'intermedio' ? 'gc-nivel-intermedio' :
                              item.nivel === 'avanzado' ? 'gc-nivel-avanzado' :
                                item.nivel === 'profesional' ? 'gc-nivel-profesional' : 'gc-nivel-default'
                          }`}>
                          {item.nivel === 'principiante' ? '🌱 Principiante' :
                            item.nivel === 'intermedio' ? '🔥 Intermedio' :
                              item.nivel === 'avanzado' ? '⚡ Avanzado' :
                                item.nivel === 'profesional' ? '👑 Profesional' :
                                  `📚 ${item.nivel}`}
                        </span>
                      </div>
                    )}

                    <div className="gc-footer">
                      <div className="gc-precio-container">
                        {esGratis ? (
                          <span className="gc-precio-gratis">¡GRATIS!</span>
                        ) : item.precio_rebajado && item.precio_normal && item.precio_rebajado < item.precio_normal ? (
                          <>
                            <span className="gc-precio-original">{formatearPrecio(item.precio_normal)}</span>
                            <span className="gc-precio-actual">{formatearPrecio(item.precio_rebajado)}</span>
                          </>
                        ) : (
                          <span className="gc-precio-actual">{formatearPrecio(item.precio_normal || 0)}</span>
                        )}
                      </div>

                      <button className={`gc-btn-acceder ${item.tipo}`}>
                        {esGratis ? 'Acceder Gratis' : 'Comenzar Ahora'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="gc-paginacion-container">
              <div className="gc-paginacion-info">
                Mostrando {inicioRango}-{finRango} de {totalItems} resultados
              </div>

              <div className="gc-paginacion">
                <button
                  className="gc-pag-btn"
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  Anterior
                </button>

                {paginasVisibles[0] > 1 && (
                  <>
                    <button className="gc-pag-num" onClick={() => cambiarPagina(1)}>1</button>
                    {paginasVisibles[0] > 2 && <span className="gc-dots">...</span>}
                  </>
                )}

                {paginasVisibles.map(p => (
                  <button
                    key={p}
                    className={`gc-pag-num ${p === paginaActual ? 'activa' : ''}`}
                    onClick={() => cambiarPagina(p)}
                  >
                    {p}
                  </button>
                ))}

                {paginasVisibles[paginasVisibles.length - 1] < totalPaginas && (
                  <>
                    {paginasVisibles[paginasVisibles.length - 1] < totalPaginas - 1 && <span className="gc-dots">...</span>}
                    <button className="gc-pag-num" onClick={() => cambiarPagina(totalPaginas)}>{totalPaginas}</button>
                  </>
                )}

                <button
                  className="gc-pag-btn"
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                >
                  Siguiente
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
