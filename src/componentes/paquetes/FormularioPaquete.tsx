import { useEffect, useMemo, useState } from 'react'
import { generateSlug } from '../../utils/utilidadesSlug'
import { supabase } from '../../servicios/supabaseCliente'
import {
  crearPaquete,
  actualizarPaquete,
  obtenerPaquetePorId,
  obtenerTutorialesDisponibles,
  obtenerItemsPaquete,
  guardarItemsPaquete,
  type PaqueteTutorial,
  type TutorialResumen
} from '../../servicios/paquetesService'
import './FormularioPaquete.css'

interface Props {
  paqueteId?: string
  onGuardado?: (p: PaqueteTutorial) => void
  onError?: (e: string) => void
}

export default function FormularioPaquete({ paqueteId, onGuardado, onError }: Props) {
  const [form, setForm] = useState<PaqueteTutorial>({ titulo: '', descripcion: '', descripcion_corta: '', categoria: 'Acordeón', nivel: '', precio_normal: 0, precio_rebajado: 0, imagen_url: '', estado: 'borrador', destacado: false })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [preview, setPreview] = useState<string | undefined>(undefined)
  const [tutoriales, setTutoriales] = useState<TutorialResumen[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [filtroIncluidos, setFiltroIncluidos] = useState<'todos' | 'incluidos' | 'no_incluidos'>('todos')
  const totalIndividual = useMemo(() => {
    const mapa = new Map(tutoriales.map(t => [t.id, t]))
    let total = 0
    seleccionados.forEach(id => {
      const t = mapa.get(id)
      const pn = (t as any)?.precio_normal || 0
      total += pn
    })
    return total
  }, [seleccionados, tutoriales])

  function sugerirPrecios() {
    if (!totalIndividual || totalIndividual <= 0) return
    const precioNormal = totalIndividual
    const precioRebajado = Math.round(precioNormal * 0.52)
    setForm(prev => ({ ...prev, precio_normal: precioNormal, precio_rebajado: precioRebajado }))
  }

  function fmt(n?: number) { return typeof n === 'number' ? new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n) : '–' }
  const pctOff = useMemo(() => {
    const pn = form.precio_normal || 0
    const pr = form.precio_rebajado || 0
    if (!pn || !pr || pr >= pn) return 0
    return Math.round(((pn - pr) / pn) * 100)
  }, [form.precio_normal, form.precio_rebajado])

  useEffect(() => { if (paqueteId) cargar() }, [paqueteId])
  useEffect(() => { cargarTutoriales() }, [])

  async function cargar() {
    setCargando(true); setError('')
    const res = await obtenerPaquetePorId(paqueteId!)
    if (res.success && res.data) setForm(res.data)
    else setError(res.error || 'Error cargando paquete')
    try {
      const items = await obtenerItemsPaquete(paqueteId!)
      if (items.success) setSeleccionados(new Set(items.data))
    } catch { }
    setCargando(false)
  }

  async function cargarTutoriales() {
    const res = await obtenerTutorialesDisponibles()
    if (res.success) setTutoriales(res.data)
  }

  function cambiar<K extends keyof PaqueteTutorial>(campo: K, valor: PaqueteTutorial[K]) { setForm(prev => ({ ...prev, [campo]: valor })) }

  async function guardar() {
    setCargando(true); setError('')
    try {
      const payload: PaqueteTutorial = { ...form, slug: form.slug || generateSlug(form.titulo) }
      const res = paqueteId ? await actualizarPaquete(paqueteId!, payload) : await crearPaquete(payload)
      if (!res.success || !res.data) throw new Error(res.error || 'Error guardando paquete')
      const idPaquete = res.data.id || paqueteId!
      await guardarItemsPaquete(idPaquete, Array.from(seleccionados))
      onGuardado?.(res.data)
    } catch (e: any) { setError(e.message); onError?.(e.message) } finally { setCargando(false) }
  }

  async function subirImagenSeleccionada(f: File) {
    setSubiendo(true); setProgreso(10)
    try {
      const nombre = `${Date.now()}-${(f.name || 'paquete').replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const ruta = `public/${nombre}`
      const interval = setInterval(() => setProgreso(p => Math.min(90, p + 5)), 150)
      const { data, error } = await supabase.storage.from('imagenes-paquetes').upload(ruta, f, { upsert: false })
      clearInterval(interval)
      setProgreso(100)
      if (error) throw error
      const { data: url } = supabase.storage.from('imagenes-paquetes').getPublicUrl(data.path)
      setForm(prev => ({ ...prev, imagen_url: url.publicUrl }))
      setPreview(url.publicUrl)
    } catch (e: any) { setError(e.message) } finally { setSubiendo(false) }
  }

  function onFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] || null
    setArchivo(f)
    if (f) { setPreview(URL.createObjectURL(f)); subirImagenSeleccionada(f) }
  }

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) { setArchivo(f); setPreview(URL.createObjectURL(f)); subirImagenSeleccionada(f) }
  }

  function toggleTutorial(id: string) {
    setSeleccionados(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const tutorialesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    let base = tutoriales
    if (filtroIncluidos === 'incluidos') base = base.filter(t => seleccionados.has(t.id))
    else if (filtroIncluidos === 'no_incluidos') base = base.filter(t => !seleccionados.has(t.id))
    if (!q) return base
    return base.filter(t => (t.titulo || '').toLowerCase().includes(q) || (t.categoria || '').toLowerCase().includes(q) || (t.nivel || '').toLowerCase().includes(q))
  }, [busqueda, tutoriales, filtroIncluidos, seleccionados])

  return (
    <div className="form-paquete">
      {error && <div className="alert-error">{error}</div>}

      <section className="card">
        <div className="card-header">
          <div className="card-title">Información Básica</div>
        </div>
        <div className="card-body">
          <div className="grid2">
            <div className="field">
              <label>Título *</label>
              <input value={form.titulo} onChange={e => cambiar('titulo', e.target.value)} placeholder="Título del paquete" />
            </div>
            <div className="field">
              <label>Descripción</label>
              <textarea value={form.descripcion || ''} onChange={e => cambiar('descripcion', e.target.value)} placeholder="Descripción del paquete" />
            </div>
          </div>

          <div className="upload-zone">
            <label className="drop-area" onDrop={onDrop} onDragOver={(e) => e.preventDefault()}>
              <div className="drop-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M20 16.58A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 4 16.25" strokeWidth="2" />
                  <path d="M12 12v6M9 15l3-3 3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="drop-text">Arrastra una imagen aquí o haz clic para seleccionar</div>
                <div className="drop-sub">Formatos soportados: JPG, PNG, WebP, GIF (máx. 10MB)</div>
                <input type="file" accept="image/*" onChange={onFileSelect} />
                <button type="button" className="btn-upload">Seleccionar imagen</button>
              </div>
            </label>
            {(preview || form.imagen_url) && (
              <div className="preview-img"><img src={preview || form.imagen_url} alt="Imagen paquete" /></div>
            )}
            {subiendo && (
              <div className="progress"><div className="bar" style={{ width: `${progreso}%` }}></div></div>
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header"><div className="card-title">Configuración</div></div>
        <div className="card-body">
          <div className="grid3">
            <div className="field"><label>Categoría</label><input value={form.categoria || ''} onChange={e => cambiar('categoria', e.target.value)} placeholder="Ej: Acordeón" /></div>
            <div className="field"><label>Nivel</label><input value={form.nivel || ''} onChange={e => cambiar('nivel', e.target.value)} placeholder="Ej: Principiante" /></div>
            <div className="field"><label>Estado</label><select value={form.estado || 'borrador'} onChange={e => cambiar('estado', e.target.value as any)}><option value="borrador">Borrador</option><option value="publicado">Publicado</option><option value="archivado">Archivado</option></select></div>
          </div>
          <div className="field checkbox"><label><input type="checkbox" checked={!!form.destacado} onChange={e => cambiar('destacado', e.target.checked)} /> Destacado</label></div>
        </div>
      </section>

      <section className="card">
        <div className="card-header"><div className="card-title">Precios</div></div>
        <div className="card-body">
          <div className="grid2">
            <div className="field"><label>Precio normal</label><input type="number" value={form.precio_normal || 0} onChange={e => cambiar('precio_normal', Number(e.target.value))} /></div>
            <div className="field"><label>Precio rebajado</label><input type="number" value={form.precio_rebajado || 0} onChange={e => cambiar('precio_rebajado', Number(e.target.value))} /></div>
          </div>
          <div className="precio-panel">
            <div className="precio-total">Total individual: {fmt(totalIndividual)}</div>
            <button type="button" className="btn-sugerir" onClick={sugerirPrecios}>Calcular precios sugeridos</button>
            <div className="precio-preview">
              <div className="precio-actual">{fmt(form.precio_rebajado || form.precio_normal)}</div>
              {form.precio_rebajado && form.precio_normal && form.precio_rebajado < form.precio_normal && (
                <>
                  <div className="precio-original">{fmt(form.precio_normal)}</div>
                  <div className="badge-off">{pctOff}% OFF</div>
                  <div className="precio-ahorro">Ahorro: {fmt((form.precio_normal || 0) - (form.precio_rebajado || 0))}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-header"><div className="card-title">Tutoriales Incluidos</div></div>
        <div className="card-body">
          <div className="tutoriales-toolbar">
            <input className="search" placeholder="Buscar por título, categoría o nivel" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <select className="filter" value={filtroIncluidos} onChange={e => setFiltroIncluidos(e.target.value as any)}>
              <option value="todos">Todos</option>
              <option value="incluidos">Incluidos</option>
              <option value="no_incluidos">No incluidos</option>
            </select>
            <div className="count">Seleccionados: {seleccionados.size}</div>
          </div>
          <div className="grid-tutoriales">
            {tutorialesFiltrados.map(t => (
              <div key={t.id} className={`tutorial-card ${seleccionados.has(t.id) ? 'sel' : ''}`} onClick={() => toggleTutorial(t.id)}>
                <div className="thumb">{t.imagen_url ? <img src={t.imagen_url} alt={t.titulo} /> : <div className="thumb-ph">🎵</div>}</div>
                <div className="t-info">
                  <div className="t-title">{t.titulo}</div>
                  <div className="t-meta">{t.categoria || ''} {t.nivel ? `• ${t.nivel}` : ''}</div>
                  <div className="t-precio">{fmt((t as any).precio_rebajado || (t as any).precio_normal || 0)}</div>
                </div>
                <div className="t-check"><input type="checkbox" checked={seleccionados.has(t.id)} readOnly /></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="acciones"><button className="btn-primario" onClick={guardar} disabled={cargando || !form.titulo}>{cargando ? 'Guardando...' : 'Guardar'}</button></div>
    </div>
  )
}
