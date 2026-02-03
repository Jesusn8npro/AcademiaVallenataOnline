import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import MensajesLayout from './MensajesLayout'
import ChatVista from './ChatVista'
import './mensajes.css'
import { supabase } from '../../servicios/supabaseCliente'

export default function ChatPage() {
  const { chatId } = useParams()
  const [chat, setChat] = useState<any>(null)
  const [usuarioActual, setUsuarioActual] = useState<any>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  // Agregar clase 'modo-chat-abierto' al body para ocultar menús en móvil
  useEffect(() => {
    document.body.classList.add('modo-chat-abierto');
    return () => {
      document.body.classList.remove('modo-chat-abierto');
    };
  }, []);

  useEffect(() => {
    let activo = true
      ; (async () => {
        if (!chatId) return
        setCargando(true)

        // 1. Obtener usuario actual
        const { data: auth } = await supabase.auth.getUser()
        if (!auth.user) { setError('No autenticado'); setCargando(false); return }

        // Cargar perfil completo para pasar a ChatVista
        const { data: perfil } = await supabase.from('perfiles').select('*').eq('id', auth.user.id).single()
        if (activo) setUsuarioActual(perfil || { id: auth.user.id, email: auth.user.email }) // Fallback minima

        // 2. Obtener chat
        const { data, error } = await supabase
          .from('chats')
          .select(`*, miembros_chat(*, usuario:perfiles!miembros_chat_usuario_id_fkey(nombre_completo,url_foto_perfil,nombre_usuario,rol))`)
          .eq('id', chatId)
          .eq('activo', true)
          .single()

        if (!activo) return
        if (error || !data) { setError('No se pudo cargar el chat'); setCargando(false); return }

        const esMiembro = (data.miembros_chat || []).some((m: any) => m.usuario_id === auth.user.id && m.estado_miembro === 'activo')
        if (!esMiembro) { setError('No tienes acceso a este chat'); setCargando(false); return }

        setChat({ ...data, miembros: data.miembros_chat })
        setCargando(false)
      })()
    return () => { activo = false }
  }, [chatId])

  function volver() { window.location.href = '/mensajes' }

  return (
    <MensajesLayout>
      {cargando ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ width: 32, height: 32, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <div style={{ width: 64, height: 64, background: '#fee2e2', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>⚠️</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>{error}</h2>
            <p style={{ color: '#64748b', marginBottom: 12 }}>Lo sentimos, ocurrió un problema al cargar este chat.</p>
            <button onClick={volver} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 12px', fontWeight: 700 }}>Volver a Mensajes</button>
          </div>
        </div>
      ) : chat ? (
        <div className="contenedor-mensajes">
          <div className="vista-chat">
            <ChatVista
              chat={chat}
              usuarioActual={usuarioActual}
              onRegresar={volver}
            />
          </div>
        </div>
      ) : null}
    </MensajesLayout>
  )
}

