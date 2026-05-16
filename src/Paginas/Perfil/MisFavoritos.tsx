import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../servicios/clienteSupabase'
import { useFavoritos } from '../../hooks/useFavoritos'
import { generarSlug } from '../../utilidades/slug'
import './MisFavoritos.css'

interface ItemFavorito {
  id: string
  titulo: string
  descripcion?: string
  imagen_url?: string
  tipo: 'curso' | 'tutorial'
  nivel?: string
  precio_normal?: number | null
  slug?: string | null
}

export default function MisFavoritos() {
  const { favoritos, toggleFavorito, cargando: cargandoFavs } = useFavoritos()
  const navigate = useNavigate()
  const [cursos, setCursos] = useState<ItemFavorito[]>([])
  const [tutoriales, setTutoriales] = useState<ItemFavorito[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (cargandoFavs) return
    if (!favoritos.length) { setCursos([]); setTutoriales([]); return }

    setCargando(true)

    async function cargar() {
      const [{ data: cursosData }, { data: tutsData }] = await Promise.all([
        supabase
          .from('cursos')
          .select('id, titulo, descripcion, imagen_url, nivel, precio_normal, slug')
          .in('id', favoritos),
        supabase
          .from('tutoriales')
          .select('id, titulo, descripcion, imagen_url, nivel, precio_normal, slug')
          .in('id', favoritos),
      ])
      setCursos((cursosData || []).map((c: any) => ({ ...c, tipo: 'curso' as const })))
      setTutoriales((tutsData || []).map((t: any) => ({ ...t, tipo: 'tutorial' as const })))
      setCargando(false)
    }

    cargar()
  }, [favoritos, cargandoFavs])

  const verItem = (item: ItemFavorito) => {
    const slug = item.slug || generarSlug(item.titulo)
    navigate(item.tipo === 'curso' ? `/cursos/${slug}` : `/tutoriales/${slug}`)
  }

  if (cargandoFavs || cargando) {
    return (
      <div className="mf-contenedor">
        <div className="mf-spinner-wrap">
          <div className="mf-spinner" />
        </div>
      </div>
    )
  }

  const sinFavoritos = cursos.length === 0 && tutoriales.length === 0

  return (
    <div className="mf-contenedor">
      <h1 className="mf-titulo">Guardados</h1>

      {sinFavoritos ? (
        <div className="mf-vacio">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <p>Aún no guardaste ningún contenido. Explora el catálogo ❤️</p>
          <button className="mf-btn-explorar" onClick={() => navigate('/tutoriales-de-acordeon')}>
            Explorar catálogo
          </button>
        </div>
      ) : (
        <>
          {cursos.length > 0 && (
            <section className="mf-seccion">
              <h2 className="mf-subtitulo">Cursos guardados</h2>
              <div className="mf-grid">
                {cursos.map(item => (
                  <TarjetaFavorito
                    key={item.id}
                    item={item}
                    onVer={() => verItem(item)}
                    onQuitar={() => toggleFavorito(item.id, item.tipo)}
                  />
                ))}
              </div>
            </section>
          )}

          {tutoriales.length > 0 && (
            <section className="mf-seccion">
              <h2 className="mf-subtitulo">Tutoriales guardados</h2>
              <div className="mf-grid">
                {tutoriales.map(item => (
                  <TarjetaFavorito
                    key={item.id}
                    item={item}
                    onVer={() => verItem(item)}
                    onQuitar={() => toggleFavorito(item.id, item.tipo)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

interface TarjetaProps {
  item: ItemFavorito
  onVer: () => void
  onQuitar: () => void
}

function TarjetaFavorito({ item, onVer, onQuitar }: TarjetaProps) {
  return (
    <div className="mf-tarjeta" onClick={onVer} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onVer()}>
      <div className="mf-img-wrap">
        <img src={item.imagen_url || '/images/default-curso.jpg'} alt={item.titulo} className="mf-img" loading="lazy" />
        <span className={`mf-badge ${item.tipo}`}>
          {item.tipo === 'curso' ? '🎓 CURSO' : '🎵 TUTORIAL'}
        </span>
      </div>
      <div className="mf-info">
        <h3 className="mf-nombre">{item.titulo}</h3>
        {item.descripcion && <p className="mf-desc">{item.descripcion.slice(0, 90)}{item.descripcion.length > 90 ? '…' : ''}</p>}
        <div className="mf-acciones">
          <button
            className="mf-btn-quitar"
            onClick={(e) => { e.stopPropagation(); onQuitar() }}
            aria-label="Quitar de favoritos"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#e53e3e" stroke="#e53e3e" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Quitar
          </button>
        </div>
      </div>
    </div>
  )
}
