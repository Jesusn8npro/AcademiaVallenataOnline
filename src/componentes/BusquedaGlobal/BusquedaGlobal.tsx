import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../servicios/clienteSupabase'
import './BusquedaGlobal.css'

interface Props {
  abierto: boolean
  onCerrar: () => void
}

interface ItemResultado {
  id: string | number
  titulo?: string
  nombre_completo?: string
  nombre_usuario?: string
  descripcion?: string
  slug?: string
}

interface Resultados {
  tutoriales: ItemResultado[]
  cursos: ItemResultado[]
  perfiles: ItemResultado[]
}

const VACIO: Resultados = { tutoriales: [], cursos: [], perfiles: [] }

const BusquedaGlobal: React.FC<Props> = ({ abierto, onCerrar }) => {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [cargando, setCargando] = useState(false)
  const [resultados, setResultados] = useState<Resultados>(VACIO)
  const [buscado, setBuscado] = useState(false)

  useEffect(() => {
    if (abierto) {
      setQuery('')
      setResultados(VACIO)
      setBuscado(false)
      setTimeout(() => inputRef.current?.focus(), 50)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [abierto, onCerrar])

  const buscar = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResultados(VACIO)
      setBuscado(false)
      return
    }
    setCargando(true)
    setBuscado(true)
    try {
      const patron = `%${q}%`
      const [{ data: tutoriales }, { data: cursos }, { data: perfiles }] = await Promise.all([
        supabase
          .from('tutoriales')
          .select('id, titulo, descripcion, slug')
          .or(`titulo.ilike.${patron},descripcion.ilike.${patron}`)
          .limit(5),
        supabase
          .from('cursos')
          .select('id, titulo, descripcion, slug')
          .or(`titulo.ilike.${patron},descripcion.ilike.${patron}`)
          .limit(5),
        supabase
          .from('perfiles')
          .select('id, nombre_completo, nombre_usuario')
          .or(`nombre_completo.ilike.${patron},nombre_usuario.ilike.${patron}`)
          .eq('publico_perfil', true)
          .limit(3),
      ])
      setResultados({
        tutoriales: tutoriales ?? [],
        cursos: cursos ?? [],
        perfiles: perfiles ?? [],
      })
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => buscar(query), 300)
    return () => clearTimeout(t)
  }, [query, buscar])

  const irA = (url: string) => {
    onCerrar()
    navigate(url)
  }

  const total = resultados.tutoriales.length + resultados.cursos.length + resultados.perfiles.length

  if (!abierto) return null

  return (
    <div className="bg-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <div className="bg-modal" role="dialog" aria-modal="true" aria-label="Búsqueda global">
        <div className="bg-input-wrapper">
          <svg className="bg-input-icon" width="20" height="20" fill="none" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            className="bg-input"
            type="search"
            placeholder="Busca tutoriales, cursos y usuarios..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          {cargando && (
            <svg className="bg-spinner" width="18" height="18" fill="none" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 12a8 8 0 0 1 8-8" />
            </svg>
          )}
        </div>

        <div className="bg-body">
          {!query.trim() && (
            <div className="bg-empty">Busca tutoriales, cursos y usuarios...</div>
          )}

          {query.trim() && buscado && !cargando && total === 0 && (
            <div className="bg-no-results">Sin resultados para '<strong>{query}</strong>'</div>
          )}

          {resultados.tutoriales.length > 0 && (
            <div className="bg-group">
              <div className="bg-group-title">🎵 Tutoriales</div>
              {resultados.tutoriales.map((item) => (
                <button key={item.id} className="bg-item" onClick={() => irA(`/tutoriales/${item.slug}`)}>
                  <span className="bg-item-titulo">{item.titulo}</span>
                  {item.descripcion && <span className="bg-item-desc">{item.descripcion}</span>}
                </button>
              ))}
            </div>
          )}

          {resultados.cursos.length > 0 && (
            <div className="bg-group">
              <div className="bg-group-title">🎓 Cursos</div>
              {resultados.cursos.map((item) => (
                <button key={item.id} className="bg-item" onClick={() => irA(`/cursos/${item.slug}`)}>
                  <span className="bg-item-titulo">{item.titulo}</span>
                  {item.descripcion && <span className="bg-item-desc">{item.descripcion}</span>}
                </button>
              ))}
            </div>
          )}

          {resultados.perfiles.length > 0 && (
            <div className="bg-group">
              <div className="bg-group-title">👤 Usuarios</div>
              {resultados.perfiles.map((item) => (
                <button
                  key={item.id}
                  className="bg-item"
                  onClick={() => irA(`/usuarios/${item.nombre_usuario || item.slug}`)}
                >
                  <span className="bg-item-titulo">{item.nombre_completo || item.nombre_usuario}</span>
                  {item.nombre_usuario && item.nombre_completo && (
                    <span className="bg-item-desc">@{item.nombre_usuario}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BusquedaGlobal
