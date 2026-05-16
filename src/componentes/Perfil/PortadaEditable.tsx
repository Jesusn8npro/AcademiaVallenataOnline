import React, { useRef, useState } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
import imgPortadaDefault from '../../assets/images/perfil-portada/Imagen de portada.webp'

interface Props {
  urlPortada: string | null | undefined
  posicionPortadaY: number
  userId: string | null | undefined
  onCambiarPortada: (nuevaUrl: string) => void
  onVerFoto: () => void
  onMensaje: (texto: string, tipo: 'portada' | 'posicion') => void
  children?: React.ReactNode
}

export default function PortadaEditable({ urlPortada, posicionPortadaY: posicionInicial, userId, onCambiarPortada, onVerFoto, onMensaje, children }: Props) {
  const [vistaPortadaTemporal, setVistaPortadaTemporal] = useState<string | null>(null)
  const [archivoTemporal, setArchivoTemporal] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mostrarMenu, setMostrarMenu] = useState(false)
  const [reposicionando, setReposicionando] = useState(false)
  const [posicionY, setPosicionY] = useState(posicionInicial)
  const refMenu = useRef<HTMLDivElement | null>(null)
  const refInput = useRef<HTMLInputElement | null>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (refMenu.current && !refMenu.current.contains(e.target as Node)) setMostrarMenu(false)
    }
    if (mostrarMenu) window.addEventListener('mousedown', handler)
    else window.removeEventListener('mousedown', handler)
    return () => window.removeEventListener('mousedown', handler)
  }, [mostrarMenu])

  function seleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setArchivoTemporal(archivo)
    const reader = new FileReader()
    reader.onload = () => setVistaPortadaTemporal(reader.result as string)
    reader.readAsDataURL(archivo)
    setMostrarMenu(false)
  }

  async function guardar() {
    if (!archivoTemporal || !userId) return
    setSubiendo(true)
    const extension = archivoTemporal.name.split('.').pop()
    const nombreArchivo = `portada-${userId}-${Date.now()}.${extension}`
    const { error } = await supabase.storage.from('fotoportada').upload(nombreArchivo, archivoTemporal, { upsert: true })
    if (error) { onMensaje('Error al subir: ' + error.message, 'portada'); setSubiendo(false); return }
    const { data: urlData } = supabase.storage.from('fotoportada').getPublicUrl(nombreArchivo)
    const nuevaUrl = urlData.publicUrl + '?t=' + Date.now()
    await supabase.from('perfiles').update({ portada_url: nuevaUrl }).eq('id', userId)
    const { data: imagenData } = await supabase.from('usuario_imagenes').insert({ usuario_id: userId, url_imagen: nuevaUrl, tipo: 'portada', fecha_subida: new Date().toISOString(), es_actual: true }).select().single()
    if (imagenData) await supabase.from('usuario_imagenes').update({ es_actual: false }).eq('usuario_id', userId).eq('tipo', 'portada').neq('id', imagenData.id)
    onCambiarPortada(nuevaUrl)
    cancelar()
    onMensaje('¡Portada actualizada!', 'portada')
    setSubiendo(false)
  }

  function cancelar() {
    setArchivoTemporal(null)
    setVistaPortadaTemporal(null)
  }

  function manejarDrag(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if (!reposicionando) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const y = clientY - rect.top
    setPosicionY(Math.max(0, Math.min(100, (y / rect.height) * 100)))
  }

  async function guardarPosicion() {
    if (!userId) return
    await supabase.from('perfiles').update({ posicion_img_portada: String(posicionY) }).eq('id', userId)
    setReposicionando(false)
    onMensaje('¡Posición guardada!', 'posicion')
  }

  return (
    <div
      className="ep-contenedor-portada"
      onMouseMove={manejarDrag as React.MouseEventHandler<HTMLDivElement>}
      onTouchMove={manejarDrag as React.TouchEventHandler<HTMLDivElement>}
    >
      <img
        src={vistaPortadaTemporal || urlPortada || imgPortadaDefault}
        onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = imgPortadaDefault }}
        alt="Portada de perfil"
        className={`ep-imagen-portada${reposicionando ? ' ep-reposicionando' : ''}`}
        style={{ objectPosition: `50% ${posicionY}%`, cursor: !reposicionando && !vistaPortadaTemporal ? 'pointer' : 'default' }}
        onClick={() => !reposicionando && !vistaPortadaTemporal && onVerFoto()}
      />

      {mostrarMenu && (
        <div className="ep-menu-flotante-portada" ref={refMenu}>
          {urlPortada && <button onClick={() => { onVerFoto(); setMostrarMenu(false) }}>Ver foto de portada</button>}
          <button onClick={() => { refInput.current?.click(); setMostrarMenu(false) }}>Subir foto nueva</button>
          <button onClick={() => { setReposicionando(true); setMostrarMenu(false) }}>Mover</button>
        </div>
      )}

      {(vistaPortadaTemporal || archivoTemporal) && (
        <div className="ep-controles-portada">
          <button className="ep-boton-control" onClick={guardar} disabled={subiendo}>{subiendo ? 'Guardando...' : 'Guardar'}</button>
          <button className="ep-boton-control ep-secundario" onClick={cancelar} disabled={subiendo}>Cancelar</button>
        </div>
      )}

      {reposicionando && (
        <div className="ep-controles-portada">
          <button className="ep-boton-control" onClick={guardarPosicion}>Guardar posición</button>
          <button className="ep-boton-control ep-secundario" onClick={() => setReposicionando(false)}>Cancelar</button>
        </div>
      )}

      <span className="ep-icono-camara-portada" onClick={(e) => { e.stopPropagation(); setMostrarMenu(true) }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <span className="ep-texto-cambiar-portada">Cambiar portada</span>
      </span>

      <input type="file" className="ep-input-oculto" ref={refInput} onChange={seleccionarArchivo} accept="image/*" />

      {children}
    </div>
  )
}
