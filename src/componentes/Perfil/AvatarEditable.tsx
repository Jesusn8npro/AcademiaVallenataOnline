import React, { useRef, useState } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
import imgAvatarDefault from '../../assets/images/perfil-portada/Imagen perfil 1.jpg'

interface Props {
  urlFoto: string | null | undefined
  nombreUsuario: string
  userId: string | null | undefined
  onCambiarFoto: (nuevaUrl: string) => void
  onVerFoto: () => void
}

export default function AvatarEditable({ urlFoto, nombreUsuario, userId, onCambiarFoto, onVerFoto }: Props) {
  const [vistaAvatarTemporal, setVistaAvatarTemporal] = useState<string | null>(null)
  const [archivoTemporal, setArchivoTemporal] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mostrarMenu, setMostrarMenu] = useState(false)
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
    reader.onload = () => setVistaAvatarTemporal(reader.result as string)
    reader.readAsDataURL(archivo)
    setMostrarMenu(false)
  }

  async function guardar() {
    if (!archivoTemporal || !userId) return
    setSubiendo(true)
    const extension = archivoTemporal.name.split('.').pop()
    const nombreArchivo = `avatar-${userId}-${Date.now()}.${extension}`
    const { error } = await supabase.storage.from('avatars').upload(nombreArchivo, archivoTemporal, { upsert: true })
    if (error) { setSubiendo(false); return }
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(nombreArchivo)
    const nuevaUrl = urlData.publicUrl + '?t=' + Date.now()
    await supabase.from('perfiles').update({ url_foto_perfil: nuevaUrl }).eq('id', userId)
    const { data: imagenData } = await supabase.from('usuario_imagenes').insert({ usuario_id: userId, url_imagen: nuevaUrl, tipo: 'avatar', fecha_subida: new Date().toISOString(), es_actual: true }).select().single()
    if (imagenData) await supabase.from('usuario_imagenes').update({ es_actual: false }).eq('usuario_id', userId).eq('tipo', 'avatar').neq('id', imagenData.id)
    onCambiarFoto(nuevaUrl)
    cancelar()
    setSubiendo(false)
  }

  function cancelar() {
    setArchivoTemporal(null)
    setVistaAvatarTemporal(null)
  }

  const tieneAvatar = !!urlFoto

  return (
    <div className="ep-contenedor-avatar">
      <div className="ep-avatar-interactivo">
        <img
          src={vistaAvatarTemporal || urlFoto || imgAvatarDefault}
          onError={(e) => { const t = e.target as HTMLImageElement; t.onerror = null; t.src = imgAvatarDefault }}
          alt="Avatar"
          className="ep-imagen-avatar"
          onClick={onVerFoto}
          style={{ cursor: 'pointer' }}
        />
        <span className="ep-icono-camara-avatar" onClick={(e) => { e.stopPropagation(); setMostrarMenu(true) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </span>
      </div>

      <input type="file" className="ep-input-oculto" ref={refInput} onChange={seleccionarArchivo} accept="image/*" />

      {archivoTemporal && (
        <div className="ep-controles-avatar">
          <button className="ep-boton-guardar-avatar" onClick={guardar} disabled={subiendo}>{subiendo ? 'Guardando...' : 'Guardar'}</button>
          <button className="ep-boton-cancelar-avatar" onClick={cancelar} disabled={subiendo}>Cancelar</button>
        </div>
      )}

      {mostrarMenu && (
        <div className="ep-menu-flotante-avatar" ref={refMenu}>
          {tieneAvatar && <button onClick={() => { onVerFoto(); setMostrarMenu(false) }}>Ver foto del perfil</button>}
          <button onClick={() => { refInput.current?.click(); setMostrarMenu(false) }}>Elegir foto del perfil</button>
        </div>
      )}
    </div>
  )
}
