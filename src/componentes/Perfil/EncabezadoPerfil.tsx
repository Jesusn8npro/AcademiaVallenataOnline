import { useState } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
import { useUsuario } from '../../contextos/UsuarioContext'
import { usePerfilStore } from '../../stores/perfilStore'
import './encabezado-perfil.css'
import ModalVisorImagenPerfil from './ModalVisorImagenPerfil'
import AvatarEditable from './AvatarEditable'
import PortadaEditable from './PortadaEditable'

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

export default function EncabezadoPerfil({
  urlPortada, urlAvatar, nombreCompleto, posicionPortadaY = 50, userId,
  stats = { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 },
  nivelUsuario = 1, rolUsuario = 'Estudiante', suscripcionUsuario = 'Free',
  esPerfilPublico = false, fechaCreacion = null, slugUsuario = null, onModalStateChange
}: Props) {
  const [mensaje, setMensaje] = useState('')
  const [tipoMensaje, setTipoMensaje] = useState<'portada' | 'avatar' | 'posicion' | null>(null)
  const [enviandoMensaje, setEnviandoMensaje] = useState(false)
  const [mostrarProximamente, setMostrarProximamente] = useState(false)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [imagenModalUrl, setImagenModalUrl] = useState('')
  const [imagenModalId, setImagenModalId] = useState<string | null>(null)
  const [tipoImagenModal, setTipoImagenModal] = useState<'avatar' | 'portada' | null>(null)
  const [urlAvatarLocal, setUrlAvatarLocal] = useState(urlAvatar)
  const [urlPortadaLocal, setUrlPortadaLocal] = useState(urlPortada)

  const { actualizarUsuario, usuario } = useUsuario()
  const { cargarDatosPerfil } = usePerfilStore()

  function mostrarMensajeFn(texto: string, tipo: 'portada' | 'avatar' | 'posicion') {
    setMensaje(texto)
    setTipoMensaje(tipo)
    setTimeout(() => { setMensaje(''); setTipoMensaje(null) }, 3000)
  }

  async function abrirModalImagen(tipo: 'avatar' | 'portada') {
    if (!userId) return
    const urlActual = tipo === 'avatar' ? urlAvatarLocal : urlPortadaLocal
    const { data: imagenData, error } = await supabase.from('usuario_imagenes').select('*').eq('usuario_id', userId).eq('tipo', tipo).eq('es_actual', true).single()
    let url = urlActual || ''
    let id: string | null = null
    if (error || !imagenData) {
      if (!url) return
      const { data: nuevaImagen } = await supabase.from('usuario_imagenes').insert({ usuario_id: userId, url_imagen: url, tipo, fecha_subida: new Date().toISOString(), es_actual: true }).select().single()
      id = nuevaImagen?.id || null
    } else { id = imagenData.id; url = imagenData.url_imagen }
    setImagenModalId(id); setImagenModalUrl(url); setTipoImagenModal(tipo); setModalAbierto(true); onModalStateChange?.(true)
  }

  async function iniciarChatPrivado() {
    try {
      setEnviandoMensaje(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !userId || user.id === userId) { window.location.href = '/mensajes'; setEnviandoMensaje(false); return }
      const { data: mis } = await supabase.from('miembros_chat').select('chat_id').eq('usuario_id', user.id).eq('estado_miembro', 'activo')
      const chatIds = (mis || []).map((m: { chat_id: string }) => m.chat_id)
      if (chatIds.length > 0) {
        const { data: comunes } = await supabase.from('miembros_chat').select('chat_id').in('chat_id', chatIds).eq('usuario_id', userId).eq('estado_miembro', 'activo')
        const existente = (comunes || [])[0] as { chat_id: string } | undefined
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
    } catch { setEnviandoMensaje(false) }
  }

  function formatearFechaRegistro(fecha: string | null): string {
    if (!fecha) return `Miembro desde ${new Date().getFullYear()}`
    const d = new Date(fecha)
    return `Miembro desde ${d.toLocaleDateString('es-ES', { month: 'long' })} ${d.getFullYear()}`
  }

  async function handleAvatarCambiado(nuevaUrl: string) {
    setUrlAvatarLocal(nuevaUrl)
    if (userId === usuario?.id) actualizarUsuario({ url_foto_perfil: nuevaUrl })
    await cargarDatosPerfil(true)
    mostrarMensajeFn('¡Avatar actualizado!', 'avatar')
  }

  async function handlePortadaCambiada(nuevaUrl: string) {
    setUrlPortadaLocal(nuevaUrl)
    await cargarDatosPerfil(true)
  }

  return (
    <>
      <PortadaEditable
        urlPortada={urlPortadaLocal}
        posicionPortadaY={posicionPortadaY}
        userId={userId}
        onCambiarPortada={handlePortadaCambiada}
        onVerFoto={() => abrirModalImagen('portada')}
        onMensaje={mostrarMensajeFn}
      >
        <AvatarEditable
          urlFoto={urlAvatarLocal}
          nombreUsuario={nombreCompleto}
          userId={userId}
          onCambiarFoto={handleAvatarCambiado}
          onVerFoto={() => abrirModalImagen('avatar')}
        />
        {mensaje && (
          <div className={`ep-mensaje-flotante${tipoMensaje === 'avatar' ? ' ep-avatar' : ''}`}>{mensaje}</div>
        )}
      </PortadaEditable>

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
            <div className="ep-estrellas-rating">
              <div className="ep-estrellas">{'★'.repeat(4)}{'☆'.repeat(1)}</div>
              <div className="ep-nivel-usuario">Nivel {nivelUsuario}</div>
            </div>
          </div>
          <div className="ep-badges-usuario">
            <span className="ep-badge ep-badge-rol">{rolUsuario}</span>
            <span className="ep-badge ep-badge-suscripcion">{suscripcionUsuario}</span>
          </div>
        </div>
        <div className="ep-seccion-accion">
          {esPerfilPublico ? (
            <>
              <div className="ep-info-perfil-publico">
                <div className="ep-fecha-registro">{formatearFechaRegistro(fechaCreacion)}</div>
              </div>
              <div className="ep-acciones-perfil-publico">
                <button className="ep-boton-mensaje" onClick={iniciarChatPrivado} disabled={enviandoMensaje}>{enviandoMensaje ? 'Enviando...' : '✉️ Mensaje'}</button>
                <button className="ep-boton-seguir" onClick={() => { setMostrarProximamente(true); setTimeout(() => setMostrarProximamente(false), 2000) }}>{mostrarProximamente ? 'Próximamente' : '➕ Seguir'}</button>
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

      <ModalVisorImagenPerfil
        abierto={modalAbierto}
        imagenUrl={imagenModalUrl}
        imagenId={imagenModalId}
        tipoImagen={tipoImagenModal}
        usuarioPropietario={{ id: userId || '', nombre: nombreCompleto, avatar: urlAvatarLocal || '' }}
        onCerrar={() => { setModalAbierto(false); onModalStateChange?.(false) }}
      />
    </>
  )
}
