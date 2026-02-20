import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../../servicios/supabaseCliente'
import { useUsuario } from '../../contextos/UsuarioContext'
import { usePerfilStore } from '../../stores/perfilStore'
import './encabezado-perfil.css'
import ModalVisorImagenPerfil from './ModalVisorImagenPerfil'

interface Props {
  urlPortada?: string | null
  urlAvatar?: string | null
  nombreCompleto: string
  posicionPortadaY?: number
  userId?: string | null
  stats?: { publicaciones: number; cursos: number; tutoriales: number; ranking: number }
  nivelUsuario?: number
  rolUsuario?: string
  suscripcionUsuario?: string
  esPerfilPublico?: boolean
  fechaCreacion?: string | null
  slugUsuario?: string | null
  onModalStateChange?: (abierto: boolean) => void
}

export default function EncabezadoPerfil({ urlPortada, urlAvatar, nombreCompleto, posicionPortadaY = 50, userId, stats = { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 }, nivelUsuario = 1, rolUsuario = 'Estudiante', suscripcionUsuario = 'Free', esPerfilPublico = false, fechaCreacion = null, slugUsuario = null, onModalStateChange }: Props) {
  const [vistaPortadaTemporal, setVistaPortadaTemporal] = useState<string | null>(null)
  const [vistaAvatarTemporal, setVistaAvatarTemporal] = useState<string | null>(null)
  const [archivoTemporal, setArchivoTemporal] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState<'portada' | 'avatar' | 'posicion' | null>(null)
  const [modoEdicion, setModoEdicion] = useState<'portada' | 'avatar' | null>(null)
  const [reposicionandoPortada, setReposicionandoPortada] = useState(false)
  const [mostrarMenuPortada, setMostrarMenuPortada] = useState(false)
  const [mostrarMenuAvatar, setMostrarMenuAvatar] = useState(false)
  const refMenuPortada = useRef<HTMLDivElement | null>(null)
  const refMenuAvatar = useRef<HTMLDivElement | null>(null)
  const refInputPortada = useRef<HTMLInputElement | null>(null)
  const refInputAvatar = useRef<HTMLInputElement | null>(null)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [imagenModalUrl, setImagenModalUrl] = useState('')
  const [imagenModalId, setImagenModalId] = useState<string | null>(null)
  const [tipoImagenModal, setTipoImagenModal] = useState<'avatar' | 'portada' | null>(null)

  // Hooks para actualización de estado global y local
  const { actualizarUsuario, usuario } = useUsuario()
  const { cargarDatosPerfil } = usePerfilStore()

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (refMenuPortada.current && !refMenuPortada.current.contains(e.target as Node)) setMostrarMenuPortada(false) }
    if (mostrarMenuPortada) { window.addEventListener('mousedown', handler) } else { window.removeEventListener('mousedown', handler) }
    return () => window.removeEventListener('mousedown', handler)
  }, [mostrarMenuPortada])

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (refMenuAvatar.current && !refMenuAvatar.current.contains(e.target as Node)) setMostrarMenuAvatar(false) }
    if (mostrarMenuAvatar) { window.addEventListener('mousedown', handler) } else { window.removeEventListener('mousedown', handler) }
    return () => window.removeEventListener('mousedown', handler)
  }, [mostrarMenuAvatar])

  function seleccionarArchivo(e: React.ChangeEvent<HTMLInputElement>, tipo: 'portada' | 'avatar') {
    const archivo = e.target.files?.[0]
    if (!archivo) return
    setArchivoTemporal(archivo)
    setModoEdicion(tipo)
    const reader = new FileReader()
    reader.onload = () => {
      if (tipo === 'portada') setVistaPortadaTemporal(reader.result as string)
      else setVistaAvatarTemporal(reader.result as string)
    }
    reader.readAsDataURL(archivo)
  }

  async function guardarCambios() {
    if (!archivoTemporal || !userId || !modoEdicion) return
    setSubiendo(true)
    const bucket = modoEdicion === 'portada' ? 'fotoportada' : 'avatars'
    const extension = archivoTemporal.name.split('.').pop()
    const nombreArchivo = `${modoEdicion}-${userId}-${Date.now()}.${extension}`
    const { error: errorSubida } = await supabase.storage.from(bucket).upload(nombreArchivo, archivoTemporal, { upsert: true })
    if (errorSubida) { mostrarMensaje('Error al subir: ' + errorSubida.message, modoEdicion); setSubiendo(false); return }
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(nombreArchivo)
    const nuevaUrl = urlData.publicUrl + '?t=' + Date.now()
    const campoUpdate = modoEdicion === 'portada' ? { portada_url: nuevaUrl } : { url_foto_perfil: nuevaUrl }
    await supabase.from('perfiles').update(campoUpdate).eq('id', userId!)
    const { data: imagenData } = await supabase.from('usuario_imagenes').insert({ usuario_id: userId, url_imagen: nuevaUrl, tipo: modoEdicion, fecha_subida: new Date().toISOString(), es_actual: true }).select().single()
    if (imagenData) { await supabase.from('usuario_imagenes').update({ es_actual: false }).eq('usuario_id', userId).eq('tipo', modoEdicion).neq('id', imagenData.id) }

    // Actualizar estado local (override temporal visual)
    if (modoEdicion === 'portada') {
      urlPortada = nuevaUrl;
      setVistaPortadaTemporal(null)
    } else {
      urlAvatar = nuevaUrl;
      setVistaAvatarTemporal(null)
    }

    // 🔄 ACTUALIZACIÓN DE ESTADO GLOBAL Y STORE (CRÍTICO)
    // Si el perfil editado es el del usuario actual, actualizamos el contexto global (Navbar, etc.)
    if (userId === usuario?.id) {
      if (modoEdicion === 'avatar') {
        actualizarUsuario({ url_foto_perfil: nuevaUrl })
      }
      // También podemos actualizar portada si el contexto la soportara
    }

    // Recargar datos en el store local de la página de perfil
    await cargarDatosPerfil(true)

    mostrarMensaje('¡Actualizado exitosamente!', modoEdicion)
    limpiarSeleccion()
    setSubiendo(false)
  }

  function limpiarSeleccion() { setArchivoTemporal(null); setModoEdicion(null); setVistaPortadaTemporal(null); setVistaAvatarTemporal(null) }

  function manejarDragPortada(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if (!reposicionandoPortada) return
    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY
    const y = clientY - rect.top
    posicionPortadaY = Math.max(0, Math.min(100, (y / rect.height) * 100))
  }

  async function guardarPosicionPortada() { if (!userId) return; await supabase.from('perfiles').update({ posicion_img_portada: String(posicionPortadaY) }).eq('id', userId); setReposicionandoPortada(false); mostrarMensaje('¡Posición guardada!', 'posicion') }
  function mostrarMensaje(texto: string, tipo: 'portada' | 'avatar' | 'posicion') { setMensaje(texto); setTipoMensaje(tipo); setTimeout(() => { setMensaje(''); setTipoMensaje(null) }, 3000) }

  async function abrirModalImagen(tipo: 'avatar' | 'portada') {
    if (!userId) return
    const { data: imagenData, error } = await supabase.from('usuario_imagenes').select('*').eq('usuario_id', userId).eq('tipo', tipo).eq('es_actual', true).single()
    let url = tipo === 'avatar' ? (urlAvatar || '') : (urlPortada || '')
    let id: string | null = null
    if (error || !imagenData) {
      if (!url) return
      const { data: nuevaImagen } = await supabase.from('usuario_imagenes').insert({ usuario_id: userId, url_imagen: url, tipo, fecha_subida: new Date().toISOString(), es_actual: true }).select().single()
      id = nuevaImagen?.id || null
    } else { id = imagenData.id; url = imagenData.url_imagen }
    setImagenModalId(id); setImagenModalUrl(url); setTipoImagenModal(tipo); setModalAbierto(true); onModalStateChange?.(true); setMostrarMenuAvatar(false); setMostrarMenuPortada(false)
  }
  function cerrarModal() { setModalAbierto(false); onModalStateChange?.(false) }
  function verFotoPortada() { abrirModalImagen('portada') }
  function verFotoAvatar() { abrirModalImagen('avatar') }
  function subirFotoPortada() { refInputPortada.current?.click(); setMostrarMenuPortada(false); setModoEdicion('portada') }
  function subirFotoAvatar() { refInputAvatar.current?.click(); setMostrarMenuAvatar(false); setModoEdicion('avatar') }
  function moverPortada() { setReposicionandoPortada(true); setMostrarMenuPortada(false) }

  function formatearFechaRegistro(fecha: string | null): string { if (!fecha) return `Miembro desde ${new Date().getFullYear()}`; const d = new Date(fecha); const mes = d.toLocaleDateString('es-ES', { month: 'long' }); const año = d.getFullYear(); return `Miembro desde ${mes} ${año}` }

  const mostrarIniciales = !urlAvatar && !!nombreCompleto
  const iniciales = nombreCompleto.split(' ').slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('')

  async function iniciarChatPrivado() {
    try {
      setEnviandoMensaje(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !userId || user.id === userId) { window.location.href = '/mensajes'; setEnviandoMensaje(false); return }
      const { data: mis } = await supabase.from('miembros_chat').select('chat_id').eq('usuario_id', user.id).eq('estado_miembro', 'activo')
      const chatIds = (mis || []).map((m: any) => m.chat_id)
      if (chatIds.length > 0) {
        const { data: comunes } = await supabase.from('miembros_chat').select('chat_id').in('chat_id', chatIds).eq('usuario_id', userId).eq('estado_miembro', 'activo')
        const existente = (comunes || [])[0]
        if (existente?.chat_id) { window.location.href = `/mensajes/${existente.chat_id}`; setEnviandoMensaje(false); return }
      }
      const { data: nuevoChat } = await supabase.from('chats').insert({ es_grupal: false, activo: true, creado_por: user.id }).select().single()
      if (!nuevoChat?.id) { setEnviandoMensaje(false); return }
      await supabase.from('miembros_chat').insert([
        { chat_id: nuevoChat.id, usuario_id: user.id, estado_miembro: 'activo' },
        { chat_id: nuevoChat.id, usuario_id: userId, estado_miembro: 'activo' }
      ])
      window.location.href = `/mensajes/${nuevoChat.id}`
      setEnviandoMensaje(false)
    } catch {
      setEnviandoMensaje(false)
    }
  }

  return (
    <>
      <div className="ep-contenedor-portada" onMouseMove={manejarDragPortada as any} onTouchMove={manejarDragPortada as any}>
        <img
          src={vistaPortadaTemporal || urlPortada || '/images/perfil-portada/Imagen de portada.png'}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevenir bucle infinito
            target.src = '/images/perfil-portada/Imagen de portada.png';
          }}
          alt="Portada de perfil"
          className={`ep-imagen-portada ${reposicionandoPortada ? 'ep-reposicionando' : ''}`}
          style={{ objectPosition: `50% ${posicionPortadaY}%`, cursor: !reposicionandoPortada && !vistaPortadaTemporal ? 'pointer' : 'default' }}
          onClick={() => !reposicionandoPortada && !vistaPortadaTemporal && verFotoPortada()}
        />

        {mostrarMenuPortada && (
          <div className="ep-menu-flotante-portada" ref={refMenuPortada}>
            {urlPortada && (<button onClick={verFotoPortada}>Ver foto de portada</button>)}
            <button onClick={subirFotoPortada}>Subir foto nueva</button>
            <button onClick={moverPortada}>Mover</button>
          </div>
        )}

        {(vistaPortadaTemporal || modoEdicion === 'portada') && (
          <div className="ep-controles-portada">
            <button className="ep-boton-control" onClick={guardarCambios} disabled={subiendo}>{subiendo ? 'Guardando...' : 'Guardar'}</button>
            <button className="ep-boton-control ep-secundario" onClick={limpiarSeleccion} disabled={subiendo}>Cancelar</button>
          </div>
        )}

        <span className="ep-icono-camara-portada" onClick={(e) => { e.stopPropagation(); setMostrarMenuPortada(true) }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
          <span className="ep-texto-cambiar-portada">Cambiar portada</span>
        </span>
        <input type="file" className="ep-input-oculto" ref={refInputPortada} onChange={(e) => seleccionarArchivo(e, 'portada')} />

        <div className="ep-contenedor-avatar">
          <div className="ep-avatar-interactivo">
            {mostrarIniciales ? (
              // Si no hay avatar, usamos la imagen por defecto en lugar de iniciales (según petición usuario)
              <img
                src={'/images/perfil-portada/Imagen perfil 1.jpg'}
                alt="Avatar Default"
                className="ep-imagen-avatar"
                onClick={verFotoAvatar}
                style={{ cursor: 'pointer' }}
              />
            ) : (
              <img
                src={vistaAvatarTemporal || urlAvatar || '/images/perfil-portada/Imagen perfil 1.jpg'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/images/perfil-portada/Imagen perfil 1.jpg';
                }}
                alt="Avatar"
                className="ep-imagen-avatar"
                onClick={verFotoAvatar}
                style={{ cursor: 'pointer' }}
              />
            )}
            <span className="ep-icono-camara-avatar" onClick={(e) => { e.stopPropagation(); setMostrarMenuAvatar(true) }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </span>
          </div>
          <input type="file" className="ep-input-oculto" ref={refInputAvatar} onChange={(e) => seleccionarArchivo(e, 'avatar')} />
          {modoEdicion === 'avatar' && (
            <div className="ep-controles-avatar">
              <button className="ep-boton-guardar-avatar" onClick={guardarCambios} disabled={subiendo}>{subiendo ? 'Guardando...' : 'Guardar'}</button>
              <button className="ep-boton-cancelar-avatar" onClick={limpiarSeleccion} disabled={subiendo}>Cancelar</button>
            </div>
          )}
          {mostrarMenuAvatar && (
            <div className="ep-menu-flotante-avatar" ref={refMenuAvatar}>
              {urlAvatar && (<button onClick={verFotoAvatar}>Ver foto del perfil</button>)}
              <button onClick={subirFotoAvatar}>Elegir foto del perfil</button>
            </div>
          )}
        </div>

        {mensaje && (<div className={`ep-mensaje-flotante ${tipoMensaje === 'avatar' ? 'ep-avatar' : ''}`}>{mensaje}</div>)}
      </div>

      <div className="ep-info-usuario">
        <div className="ep-seccion-estadisticas">
          <div className="ep-estadistica"><div className="ep-icono-estadistica ep-publicacion">📝</div><div className="ep-valor">{stats.publicaciones}</div><div className="ep-etiqueta">Publicaciones</div></div>
          <div className="ep-estadistica"><div className="ep-icono-estadistica ep-curso">📚</div><div className="ep-valor">{stats.cursos}</div><div className="ep-etiqueta">Cursos</div></div>
          <div className="ep-estadistica"><div className="ep-icono-estadistica ep-tutorial">🎓</div><div className="ep-valor">{stats.tutoriales}</div><div className="ep-etiqueta">Tutoriales</div></div>
          <div className="ep-estadistica"><div className="ep-icono-estadistica ep-ranking">🏆</div><div className="ep-valor">#{stats.ranking || '--'}</div><div className="ep-etiqueta">Ranking</div></div>
        </div>
        <div className="ep-separador-vertical" />
        <div className="ep-seccion-central">
          <div className="ep-info-usuario-principal">
            <div className="ep-nombre-usuario">{nombreCompleto}</div>
            <div className="ep-estrellas-rating"><div className="ep-estrellas">{'★'.repeat(4)}{'☆'.repeat(1)}</div><div className="ep-nivel-usuario">Nivel {nivelUsuario}</div></div>
          </div>
          <div className="ep-badges-usuario"><span className="ep-badge ep-badge-rol">{rolUsuario}</span><span className="ep-badge ep-badge-suscripcion">{suscripcionUsuario}</span></div>
        </div>
        <div className="ep-seccion-accion">
          {esPerfilPublico ? (
            <>
              <div className="ep-info-perfil-publico"><div className="ep-fecha-registro">{formatearFechaRegistro(fechaCreacion)}</div></div>
              <div className="ep-acciones-perfil-publico">
                <button className="ep-boton-mensaje" onClick={iniciarChatPrivado} disabled={enviandoMensaje}>{enviandoMensaje ? <>Enviando...</> : <>✉️ Mensaje</>}</button>
                <button className="ep-boton-seguir" onClick={() => alert('Función de seguir próximamente')}>➕ Seguir</button>
                <button className="ep-boton-publicaciones" onClick={() => slugUsuario && (window.location.href = `/usuarios/${slugUsuario}/publicaciones`)}>📝 Publicaciones</button>
              </div>
            </>
          ) : (
            <>
              <div className="ep-saludo-accion">¡Sigue así, {nombreCompleto ? nombreCompleto.split(' ')[0] : 'crack'}!</div>
              <button className="ep-boton-accion-principal" onClick={() => window.location.href = '/mis-cursos'}>🎹 Ir a mi aprendizaje</button>
            </>
          )}
        </div>
      </div>

      <ModalVisorImagenPerfil abierto={modalAbierto} imagenUrl={imagenModalUrl} imagenId={imagenModalId} tipoImagen={tipoImagenModal} usuarioPropietario={{ id: userId || '', nombre: nombreCompleto, avatar: urlAvatar || '' }} onCerrar={() => { cerrarModal() }} />
    </>
  )
}
