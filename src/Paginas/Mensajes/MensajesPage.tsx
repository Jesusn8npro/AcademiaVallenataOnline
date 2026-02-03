import React, { useEffect, useState } from 'react'
import MensajesLayout from './MensajesLayout'
import ListaChats from './ListaChats'
import type { Chat } from './ListaChats'
import ChatVista from './ChatVista'
import './mensajes-v2.css'

export default function MensajesPage() {
  const [chatSeleccionado, setChatSeleccionado] = useState<Chat | null>(null)
  const [mostrarLista, setMostrarLista] = useState(true)
  const [usuarioActual, setUsuarioActual] = useState<any>(null)

  useEffect(() => {
    let activo = true
      ; (async () => {
        const { data: { user } } = await (await import('../../servicios/supabaseCliente')).supabase.auth.getUser()
        if (!user || !activo) return
        const { supabase } = await import('../../servicios/supabaseCliente')
        const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
        if (!activo) return
        setUsuarioActual(data)
      })()
    return () => { activo = false }
  }, [])

  function seleccionar(chat: Chat) {
    setChatSeleccionado(chat)
    if (window.innerWidth < 768) setMostrarLista(false)
  }
  function volverALista() { setMostrarLista(true); setChatSeleccionado(null) }

  return (
    <MensajesLayout>
      <div className="msg_layout_container">
        <div className={`msg_sidebar_container ${mostrarLista ? 'msg_visible' : 'msg_hidden'}`}>
          <ListaChats chatSeleccionado={chatSeleccionado?.id || null} onSeleccionarChat={seleccionar} usuarioActual={usuarioActual} />
        </div>
        <div className="msg_view_container">
          {chatSeleccionado ? (
            <ChatVista chat={chatSeleccionado} onRegresar={volverALista} usuarioActual={usuarioActual} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', background: '#f8fafc', height: '100%' }}>
              <div style={{ textAlign: 'center', maxWidth: 480, padding: '1.5rem' }}>
                <div style={{ width: 64, height: 64, borderRadius: 32, background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>💬</div>
                <h2 style={{ fontWeight: 800, fontSize: '1.1rem', margin: '0 0 8px' }}>¡Bienvenido a Mensajes!</h2>
                <p style={{ color: '#64748b', marginBottom: 10 }}>Selecciona un chat de la lista para comenzar a conversar, o crea uno nuevo para conectarte con otros miembros de la Academia.</p>
                <div style={{ display: 'grid', gridAutoRows: 'minmax(20px,auto)', gap: 6, color: '#64748b', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>🛡️ <span>Chats privados y grupales</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>🖼️ <span>Compartir imágenes y archivos</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>😊 <span>Reacciones con emojis</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MensajesLayout>
  )
}
