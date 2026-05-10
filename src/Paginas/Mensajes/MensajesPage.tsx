import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ListaChats from './ListaChats'
import type { Chat } from './ListaChats'
import ChatVista from './ChatVista'
import { supabase } from '../../servicios/clienteSupabase'
import './mensajes.css'

/**
 * Pagina unica para /mensajes y /mensajes/:chatId.
 * Mobile: muestra lista o chat (uno u otro). Si hay chat abierto, oculta menus globales.
 * Desktop: muestra ambos (sidebar + chat o empty state).
 */
export default function MensajesPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [autenticado, setAutenticado] = useState<boolean | null>(null)
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [chatCargado, setChatCargado] = useState<any>(null)
  const [cargandoChat, setCargandoChat] = useState(false)
  const [errorChat, setErrorChat] = useState('')

  // Body classes:
  // - en-mensajes: siempre que estes en /mensajes (quita padding-bottom global, evita scroll)
  // - modo-chat-abierto: solo cuando hay chat abierto (en mobile oculta menus globales)
  useEffect(() => {
    document.body.classList.add('en-mensajes')
    if (chatId) document.body.classList.add('modo-chat-abierto')
    else document.body.classList.remove('modo-chat-abierto')
    return () => {
      document.body.classList.remove('en-mensajes')
      document.body.classList.remove('modo-chat-abierto')
    }
  }, [chatId])

  // Auth + perfil
  useEffect(() => {
    let activo = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!activo) return
      if (!user) { setAutenticado(false); window.location.href = '/auth/login'; return }
      setAutenticado(true)
      const { data: perfil } = await supabase.rpc('obtener_mi_perfil_completo')
      if (activo) setUsuarioActual(perfil || { id: user.id })
    })()
    return () => { activo = false }
  }, [])

  // Cargar chat por URL
  useEffect(() => {
    if (!chatId || !usuarioActual) { setChatCargado(null); return }
    let activo = true
    ;(async () => {
      setCargandoChat(true); setErrorChat('')
      const { data, error } = await supabase
        .from('chats')
        .select(`*, miembros_chat(*, usuario:perfiles!miembros_chat_usuario_id_fkey(nombre_completo,url_foto_perfil,nombre_usuario,rol))`)
        .eq('id', chatId).eq('activo', true).single()
      if (!activo) return
      if (error || !data) { setErrorChat('No se pudo cargar el chat'); setCargandoChat(false); return }
      const esMiembro = (data.miembros_chat || []).some(
        (m: any) => m.usuario_id === usuarioActual.id && m.estado_miembro === 'activo'
      )
      if (!esMiembro) { setErrorChat('No tienes acceso a este chat'); setCargandoChat(false); return }
      setChatCargado({ ...data, miembros: data.miembros_chat })
      setCargandoChat(false)
    })()
    return () => { activo = false }
  }, [chatId, usuarioActual?.id])

  function seleccionar(chat: Chat) {
    navigate(`/mensajes/${chat.id}`)
  }
  function volverALista() {
    navigate('/mensajes')
  }

  if (autenticado === null) {
    return <div className="msg_loading" style={{ height: '60vh' }}><div className="msg_spinner" /></div>
  }

  return (
    <div className={`msg_layout ${chatId ? 'has-chat' : ''}`}>
      <aside className="msg_sidebar">
        <ListaChats
          chatSeleccionado={chatCargado?.id || null}
          onSeleccionarChat={seleccionar}
          usuarioActual={usuarioActual}
        />
      </aside>

      <main className="msg_view">
        {cargandoChat ? (
          <div className="msg_loading" style={{ height: '100%' }}>
            <div className="msg_spinner" /><p>Cargando chat...</p>
          </div>
        ) : errorChat ? (
          <div className="msg_empty">
            <div className="msg_empty_icon" style={{ background: 'linear-gradient(135deg,#fca5a5,#dc2626)' }}>⚠️</div>
            <h2 className="msg_empty_title">{errorChat}</h2>
            <p className="msg_empty_sub">Lo sentimos, ocurrió un problema al cargar este chat.</p>
            <button onClick={volverALista} className="msg_sb_new" style={{ width: 'auto', padding: '10px 18px', borderRadius: 8, fontSize: '.92rem' }}>
              Volver a Mensajes
            </button>
          </div>
        ) : chatCargado ? (
          <ChatVista chat={chatCargado} usuarioActual={usuarioActual} onRegresar={volverALista} />
        ) : (
          <div className="msg_empty">
            <div className="msg_empty_icon">💬</div>
            <h2 className="msg_empty_title">Tus mensajes</h2>
            <p className="msg_empty_sub">
              Selecciona un chat para empezar, o crea uno nuevo
              para conectarte con la Academia Vallenata.
            </p>
            <div className="msg_empty_features">
              <div>🛡️ Chats privados y grupales</div>
              <div>⚡ Mensajes en tiempo real</div>
              <div>😊 Reacciones y emojis</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
