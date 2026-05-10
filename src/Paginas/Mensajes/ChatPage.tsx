import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MensajesLayout from './MensajesLayout'
import ChatVista from './ChatVista'
import './mensajes-v2.css'
import { supabase } from '../../servicios/clienteSupabase'

export default function ChatPage() {
  const { chatId } = useParams()
  const navigate = useNavigate()
  const [chat, setChat] = useState<any>(null)
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.body.classList.add('modo-chat-abierto')
    return () => { document.body.classList.remove('modo-chat-abierto') }
  }, [])

  useEffect(() => {
    let activo = true
      ; (async () => {
        if (!chatId) return
        setCargando(true)
        setError('')

        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) { setError('No autenticado'); setCargando(false); return }

        const { data: perfil } = await supabase.rpc('obtener_mi_perfil_completo')
        if (activo) setUsuarioActual(perfil || { id: auth.user.id, email: auth.user.email })

        const { data, error: err } = await supabase
          .from('chats')
          .select(`*, miembros_chat(*, usuario:perfiles!miembros_chat_usuario_id_fkey(nombre_completo,url_foto_perfil,nombre_usuario,rol))`)
          .eq('id', chatId)
          .eq('activo', true)
          .single()

        if (!activo) return
        if (err || !data) { setError('No se pudo cargar el chat'); setCargando(false); return }

        const esMiembro = (data.miembros_chat || []).some(
          (m: any) => m.usuario_id === auth.user.id && m.estado_miembro === 'activo'
        )
        if (!esMiembro) { setError('No tienes acceso a este chat'); setCargando(false); return }

        setChat({ ...data, miembros: data.miembros_chat })
        setCargando(false)
      })()
    return () => { activo = false }
  }, [chatId])

  const volver = () => navigate('/mensajes')

  return (
    <MensajesLayout>
      <div className="msg_layout_container msg_layout_solo">
        <div className="msg_view_container">
          {cargando ? (
            <div className="cargando" style={{ height: '100%' }}>
              <div className="spinner" />
              <p>Cargando chat...</p>
            </div>
          ) : error ? (
            <div className="msg_empty_state">
              <div className="msg_empty_icon" style={{ background: 'linear-gradient(135deg, #fca5a5 0%, #dc2626 100%)' }}>⚠️</div>
              <h2 className="msg_empty_title">{error}</h2>
              <p className="msg_empty_subtitle">Lo sentimos, ocurrió un problema al cargar este chat.</p>
              <button
                onClick={volver}
                style={{
                  background: 'var(--mv-green)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.92rem',
                }}
              >
                Volver a Mensajes
              </button>
            </div>
          ) : chat ? (
            <ChatVista chat={chat} usuarioActual={usuarioActual} onRegresar={volver} />
          ) : null}
        </div>
      </div>
    </MensajesLayout>
  )
}
