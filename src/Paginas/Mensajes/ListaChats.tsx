import React, { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../servicios/supabaseCliente'
import './mensajes-v2.css'
import ModalNuevoChat from './ModalNuevoChat'
import { useNavigate } from 'react-router-dom'

export interface Chat {
  id: string
  nombre?: string
  descripcion?: string
  imagen_url?: string
  es_grupal: boolean
  creado_en: string
  actualizado_en: string
  creado_por: string
  ultimo_mensaje?: {
    contenido?: string
    creado_en?: string
    usuario?: { nombre_completo?: string }
  } | null
  miembros?: any[]
  mensajes_no_leidos?: number
}

interface Props {
  chatSeleccionado: string | null
  onSeleccionarChat: (chat: Chat) => void
  usuarioActual: any
}

export default function ListaChats({ chatSeleccionado, onSeleccionarChat, usuarioActual }: Props) {
  const [chats, setChats] = useState<Chat[]>([])
  const [cargando, setCargando] = useState(true)
  const [termino, setTermino] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const navigate = useNavigate()
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [chatSeleccionadoMenu, setChatSeleccionadoMenu] = useState<Chat | null>(null)

  useEffect(() => {
    let activo = true
      ; (async () => {
        setCargando(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUsuarioId(user?.id || null)
        if (!user) { setChats([]); setCargando(false); return }

        // Obtener los chat_ids en los que el usuario es miembro ACTIVO
        const { data: misMiembros, error: errM } = await supabase
          .from('miembros_chat')
          .select('chat_id')
          .eq('usuario_id', user.id)
          .eq('estado_miembro', 'activo')
        if (errM) { setChats([]); setCargando(false); return }
        const chatIds = (misMiembros || []).map((m: any) => m.chat_id)
        if (chatIds.length === 0) { setChats([]); setCargando(false); return }

        const { data, error } = await supabase
          .from('chats')
          .select(`
          *,
          miembros_chat(*, usuario:perfiles!miembros_chat_usuario_id_fkey(id,nombre_completo,url_foto_perfil,nombre_usuario)),
          ultimo_mensaje:mensajes!chats_ultimo_mensaje_id_fkey(id,contenido,creado_en,usuario:perfiles(nombre_completo),usuario_id)
        `)
          .in('id', chatIds)
          .eq('activo', true)
          .order('actualizado_en', { ascending: false })

        if (error) { setChats([]); setCargando(false); return }

        // Enriquecer y obtener último mensaje real cuando el FK no está poblado
        const baseEnriquecidos: Chat[] = (data || []).map((c: any) => {
          const miembroActual = (c.miembros_chat || []).find((m: any) => m.usuario_id === user.id)
          return {
            ...c,
            miembros: c.miembros_chat,
            mensajes_no_leidos: miembroActual?.mensajes_no_leidos || 0,
            ultimo_mensaje: c.ultimo_mensaje || null
          }
        })

        const idsParaUltimo = baseEnriquecidos.filter(c => !c.ultimo_mensaje).map(c => c.id)
        if (idsParaUltimo.length) {
          const ultimos = await Promise.all(idsParaUltimo.map(async (id) => {
            const { data: msg } = await supabase
              .from('mensajes')
              .select('id, contenido, creado_en, usuario_id, usuario:perfiles(nombre_completo)')
              .eq('chat_id', id)
              .eq('eliminado', false)
              .order('creado_en', { ascending: false })
              .limit(1)
              .maybeSingle()
            return { id, msg }
          }))
          const mapaUltimos = new Map<string, any>()
          ultimos.forEach(({ id, msg }) => { if (msg) mapaUltimos.set(id, msg) })
          baseEnriquecidos.forEach(c => { if (!c.ultimo_mensaje && mapaUltimos.has(c.id)) c.ultimo_mensaje = mapaUltimos.get(c.id) })
        }
        const enriquecidos = baseEnriquecidos

        // Agrupar para mostrar solo un chat privado por usuario
        const mapa = new Map<string, Chat>()
        for (const c of enriquecidos) {
          const clave = c.es_grupal ? `grupo-${c.id}` : (() => {
            const partner = (c.miembros || []).find((m: any) => m.usuario_id !== user.id)
            return `privado-${partner?.usuario_id || c.id}`
          })()
          if (!mapa.has(clave)) {
            mapa.set(clave, c)
          } else {
            const existente = mapa.get(clave)!
            const fechaA = c.ultimo_mensaje?.creado_en || c.actualizado_en
            const fechaB = existente.ultimo_mensaje?.creado_en || existente.actualizado_en
            if ((fechaA || '') > (fechaB || '')) {
              mapa.set(clave, c)
            }
          }
        }
        const deduplicados = Array.from(mapa.values())
        if (!activo) return
        setChats(deduplicados)
        setCargando(false)
      })()
    return () => { activo = false }
  }, [])

  async function salirDelChat(chat: Chat) {
    if (!usuarioId) return
    await supabase
      .from('miembros_chat')
      .update({ estado_miembro: 'salido' })
      .eq('chat_id', chat.id)
      .eq('usuario_id', usuarioId)
    setChats(prev => prev.filter(c => c.id !== chat.id))
    setMenuVisible(false)
  }

  const filtrados = useMemo(() => {
    const t = termino.trim().toLowerCase()
    if (!t) return chats
    return chats.filter(c => (c.nombre || '').toLowerCase().includes(t))
  }, [termino, chats])

  return (
    <div className="msg_sidebar_inner">
      <div className="msg_sidebar_header">
        <div className="msg_header_row_top">
          <div className="msg_header_left">
            <div className="msg_header_icon">💬</div>
            <div>
              <div className="msg_header_title">Mensajes</div>
              <div className="msg_header_subtitle">Mantente conectado</div>
            </div>
          </div>
          <div className="acciones">
            <button className="msg_new_chat_btn" onClick={() => setModalAbierto(true)}>+</button>
          </div>
        </div>
      </div>
      <div className="msg_search_container">
        <input className="msg_search_input" value={termino} onChange={e => setTermino(e.target.value)} placeholder="Buscar chats" />
      </div>
      {cargando ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ width: 24, height: 24, border: '3px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        filtrados.map((c) => (
          <div
            key={c.id}
            className={`msg_chat_item ${chatSeleccionado === c.id ? 'msg_active' : ''}`}
            onClick={() => { onSeleccionarChat(c); navigate(`/mensajes/${c.id}`) }}
            onContextMenu={(e) => { e.preventDefault(); setMenuVisible(true); setMenuPos({ x: e.clientX, y: e.clientY }); setChatSeleccionadoMenu(c) }}
          >
            {(() => {
              const partner = (c.miembros || []).find((m: any) => m.usuario_id !== usuarioId)
              const avatar = partner?.usuario?.url_foto_perfil || c.imagen_url || '/images/default-curso.jpg'
              return (
                <div className="msg_chat_avatar_container">
                  <img className="msg_chat_avatar" src={avatar} alt="chat" />
                  <span className="msg_status_dot" />
                </div>
              )
            })()}
            <div style={{ flex: 1, minWidth: 0 }}>
              {(() => {
                const partner = (c.miembros || []).find((m: any) => m.usuario_id !== usuarioId)
                const nombre = partner?.usuario?.nombre_completo || c.nombre || 'Chat Privado'
                return <div className="msg_chat_name" title={nombre}>{nombre}</div>
              })()}
              <div className="msg_chat_last_msg">{c.ultimo_mensaje ? ((c.ultimo_mensaje.usuario_id === usuarioId) ? `Tú: ${c.ultimo_mensaje.contenido}` : c.ultimo_mensaje.contenido) : 'Sin mensajes aún'}</div>
            </div>
            {c.mensajes_no_leidos ? (
              <div className="msg_unread_badge">{c.mensajes_no_leidos}</div>
            ) : null}
          </div>
        ))
      )}
      {menuVisible && chatSeleccionadoMenu && (
        <div className="msg_context_menu" style={{ left: menuPos.x, top: menuPos.y }}>
          <div className="msg_context_option msg_danger" onClick={() => salirDelChat(chatSeleccionadoMenu!)}>Salir del chat</div>
          <div className="msg_context_option" onClick={() => setMenuVisible(false)}>Cancelar</div>
        </div>
      )}
      <ModalNuevoChat
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={(chat) => setChats(prev => [chat as any, ...prev])}
      />
    </div>
  )
}
