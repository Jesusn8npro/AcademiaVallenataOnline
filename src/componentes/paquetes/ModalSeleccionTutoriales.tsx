import { useEffect, useMemo, useState } from 'react'
import { obtenerTutorialesDisponibles } from '../../servicios/paquetesService'
import './ModalSeleccionTutoriales.css'

interface TutorialItem {
  id: string
  titulo: string
  imagen_url?: string
  categoria?: string
  nivel?: string
  estado?: string
  slug?: string
  precio_normal?: number
  precio_rebajado?: number
  artista?: string
}

interface Props {
  abierto: boolean
  tutoriales: TutorialItem[]
  seleccionadosInicial: Set<string>
  onCerrar: () => void
  onConfirmar: (ids: string[]) => void
}

export default function ModalSeleccionTutoriales({ abierto, tutoriales, seleccionadosInicial, onCerrar, onConfirmar }: Props) {
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set(seleccionadosInicial))
  const [busqueda, setBusqueda] = useState('')
  const [cat, setCat] = useState('')
  const [nivel, setNivel] = useState('')
  const [pagina, setPagina] = useState(1)
  const porPagina = 9
  const [localTuts, setLocalTuts] = useState<TutorialItem[]>(tutoriales || [])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setSeleccion(new Set(seleccionadosInicial)) }, [seleccionadosInicial, abierto])
  useEffect(() => { if (abierto) setPagina(1) }, [abierto])
  useEffect(() => {
    async function cargar() {
      if (!abierto) return
      if ((tutoriales || []).length > 0) { setLocalTuts(tutoriales); return }
      setCargando(true)
      const res = await obtenerTutorialesDisponibles()
      if (res.success) { setLocalTuts(res.data as any); setError('') }
      else { setError(res.error || 'No se pudieron cargar los tutoriales'); setLocalTuts([]) }
      setCargando(false)
    }
    cargar()
  }, [abierto, tutoriales])

  const categorias = useMemo(() => Array.from(new Set((localTuts || []).map(t => t.categoria).filter(Boolean))).sort(), [localTuts])
  const niveles = useMemo(() => Array.from(new Set((localTuts || []).map(t => t.nivel).filter(Boolean))).sort(), [localTuts])

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let items = localTuts.filter(t => !seleccionadosInicial.has(t.id))
    if (q) items = items.filter(t => (t.titulo || '').toLowerCase().includes(q) || (t.categoria || '').toLowerCase().includes(q) || (t.nivel || '').toLowerCase().includes(q))
    if (cat) items = items.filter(t => (t.categoria || '') === cat)
    if (nivel) items = items.filter(t => (t.nivel || '') === nivel)
    return items
  }, [localTuts, busqueda, cat, nivel, seleccionadosInicial])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina))
  const inicio = (pagina - 1) * porPagina
  const paginaItems = filtrados.slice(inicio, inicio + porPagina)

  function toggle(id: string) { setSeleccion(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n }) }

  function fmt(n?: number) { return typeof n === 'number' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) : '–' }

  if (!abierto) return null

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Seleccionar Tutoriales</div>
          <div className="modal-count">{seleccion.size} seleccionados</div>
          <button className="btn-cerrar" onClick={onCerrar}>✖</button>
        </div>
        <div className="modal-filtros">
          <input className="input" placeholder="Buscar..." value={busqueda} onChange={e => { setBusqueda(e.target.value); setPagina(1) }} />
          <select className="input" value={cat} onChange={e => { setCat(e.target.value); setPagina(1) }}>
            <option value="">Todas las categorías</option>
            {categorias.map(c => (<option key={c} value={c!}>{c}</option>))}
          </select>
          <select className="input" value={nivel} onChange={e => { setNivel(e.target.value); setPagina(1) }}>
            <option value="">Todos los niveles</option>
            {niveles.map(n => (<option key={n} value={n!}>{n}</option>))}
          </select>
          <button className="btn-clear" onClick={() => { setBusqueda(''); setCat(''); setNivel(''); setPagina(1) }}>Limpiar</button>
        </div>
        <div className="modal-count-row">{filtrados.length} tutoriales</div>
        <div className="modal-lista">
          {cargando && (<div className="estado">Cargando tutoriales...</div>)}
          {error && !cargando && (<div className="estado">{error}</div>)}
          {!cargando && paginaItems.length === 0 && (
            <div className="estado">No se encontraron tutoriales</div>
          )}
          {paginaItems.map(t => (
            <div key={t.id} className={`row ${seleccion.has(t.id) ? 'sel' : ''}`} onClick={() => toggle(t.id)}>
              <div className="thumb">{t.imagen_url ? <img src={t.imagen_url} alt={t.titulo} /> : <div className="thumb-ph">🎵</div>}</div>
              <div className="info">
                <div className="titulo">{t.titulo}</div>
                <div className="badges">
                  {t.categoria && (<span className="badge">{t.categoria}</span>)}
                  {t.nivel && (<span className="badge">{t.nivel}</span>)}
                </div>
                {t.artista && (<div className="artista">{t.artista}</div>)}
              </div>
              <div className="precio">{fmt(t.precio_rebajado || t.precio_normal || 0)}</div>
              <div className="check"><input type="checkbox" checked={seleccion.has(t.id)} readOnly /></div>
            </div>
          ))}
        </div>
        <div className="modal-paginacion">
          <button className="btn" disabled={pagina <= 1} onClick={() => setPagina(p => Math.max(1, p - 1))}>Anterior</button>
          <div className="page-info">Página {pagina} de {totalPaginas}</div>
          <button className="btn" disabled={pagina >= totalPaginas} onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}>Siguiente</button>
        </div>
        <div className="modal-actions">
          <button className="btn-sec" onClick={onCerrar}>Cancelar</button>
          <button className="btn-ok" onClick={() => onConfirmar(Array.from(seleccion))}>Agregar ({seleccion.size})</button>
        </div>
      </div>
    </div>
  )
}
