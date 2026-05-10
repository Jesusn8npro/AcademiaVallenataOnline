import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
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
    usuario_id?: string
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

function tiempoCorto(iso?: string): string {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    const ahora = new Date()
    const sameDay =
      d.getFullYear() === ahora.getFullYear() &&
      d.getMonth() === ahora.getMonth() &&
      d.getDate() === ahora.getDate()

    if (sameDay) {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    }
    const ayer = new Date(ahora)
    ayer.setDate(ahora.getDate() - 1)
    if (
      d.getFullYear() === ayer.getFullYear() &&
      d.getMonth() === ayer.getMonth() &&
      d.getDate() === ayer.getDate()
    ) {
      return 'Ayer'
    }
    const diff = (ahora.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
    if (diff < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' })
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  } catch {
    return ''
  }
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
  const chatSeleccionadoRef = useRef<string | null>(chatSeleccionado)

  useEffect(() => { chatSeleccionadoRef.current = chatSeleccionado }, [chatSeleccionado])

  // Cargar chats
  useEffect(() => {
    let activo = true
      ; (async () => {
        setCargando(true)
        const { data: { user } } = await supabase.auth.getUser()
        setUsuarioId(user?.id || null)
        if (!user) { setChats([]); setCargando(false); return }

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
          ultimo_mensaje:mensajes!chats_ultimo_mensaje_id_fkey(id,contenido,creado_en,usuario_id,usuario:perfiles(nombre_completo))
        `)
          .in('id', chatIds)
          .eq('activo', true)
          .order('actualizado_en', { ascending: false })

        if (error) { setChats([]); setCargando(false); return }

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

  // Realtime: actualizar lista cuando llega mensaje en cualquiera de mis chats
  useEffect(() => {
    if (!usuarioId) return
    const channel = supabase
      .channel(`lista_chats_${usuarioId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        (payload: any) => {
          const nuevo = payload.new
          if (!nuevo) return
          setChats(prev => {
            const indice = prev.findIndex(c => c.id === nuevo.chat_id)
            if (indice === -1) return prev // no es uno de mis chats
            const chatPrev = prev[indice]
            const incrementar = nuevo.usuario_id !== usuarioId && chatSeleccionadoRef.current !== nuevo.chat_id
            const actualizado: Chat = {
              ...chatPrev,
              ultimo_mensaje: {
                contenido: nuevo.contenido,
                creado_en: nuevo.creado_en,
                usuario_id: nuevo.usuario_id,
              },
              actualizado_en: nuevo.creado_en,
              mensajes_no_leidos: incrementar ? (chatPrev.mensajes_no_leidos || 0) + 1 : chatPrev.mensajes_no_leidos
            }
            const restantes = prev.filter((_, i) => i !== indice)
            return [actualizado, ...restantes]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [usuarioId])

  // Limpiar contador al seleccionar
  useEffect(() => {
    if (!chatSeleccionado) return
    setChats(prev => prev.map(c => c.id === chatSeleccionado ? { ...c, mensajes_no_leidos: 0 } : c))
  }, [chatSeleccionado])

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
    return chats.filter(c => {
      if ((c.nombre || '').toLowerCase().includes(t)) return true
      const partner = (c.miembros || []).find((m: any) => m.usuario_id !== usuarioId)
      const nombrePartner = partner?.usuario?.nombre_completo || ''
      return nombrePartner.toLowerCase().includes(t)
    })
  }, [termino, chats, usuarioId])

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
            <button className="msg_new_chat_btn" onClick={() => setModalAbierto(true)} title="Nuevo chat" aria-label="Crear nuevo chat">+</button>
          </div>
        </div>
        <div className="msg_search_container" style={{ padding: 0 }}>
          <input
            className="msg_search_input"
            value={termino}
            onChange={e => setTermino(e.target.value)}
            placeholder="Buscar chats"
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {cargando ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div className="spinner" />
          </div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#667781' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💭</div>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              {termino ? 'No se encontraron chats' : 'Aún no tienes chats. Crea uno con el botón +'}
            </p>
          </div>
        ) : (
          filtrados.map((c) => {
            const partner = (c.miembros || []).find((m: any) => m.usuario_id !== usuarioId)
            const avatar = partner?.usuario?.url_foto_perfil || c.imagen_url || '/images/default-user.png'
            const nombre = c.es_grupal
              ? (c.nombre || 'Grupo')
              : (partner?.usuario?.nombre_completo || c.nombre || 'Chat')
            const ultimoTexto = c.ultimo_mensaje
              ? ((c.ultimo_mensaje.usuario_id === usuarioId) ? `Tú: ${c.ultimo_mensaje.contenido}` : c.ultimo_mensaje.contenido)
              : 'Sin mensajes aún'
            const tiempo = tiempoCorto(c.ultimo_mensaje?.creado_en || c.actualizado_en)

            return (
              <div
                key={c.id}
                className={`msg_chat_item ${chatSeleccionado === c.id ? 'msg_active' : ''}`}
                onClick={() => { onSeleccionarChat(c); navigate(`/mensajes/${c.id}`) }}
                onContextMenu={(e) => { e.preventDefault(); setMenuVisible(true); setMenuPos({ x: e.clientX, y: e.clientY }); setChatSeleccionadoMenu(c) }}
              >
                <div className="msg_chat_avatar_container">
                  <img
                    className="msg_chat_avatar"
                    src={avatar}
                    alt={nombre}
                    onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-user.png' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <div className="msg_chat_name" title={nombre}>{nombre}</div>
                    {tiempo && (
                      <div style={{ fontSize: '0.72rem', color: c.mensajes_no_leidos ? '#128c7e' : '#8696a0', fontWeight: c.mensajes_no_leidos ? 600 : 400, flexShrink: 0 }}>
                        {tiempo}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div className="msg_chat_last_msg">{ultimoTexto}</div>
                    {c.mensajes_no_leidos ? (
                      <div className="msg_unread_badge">{c.mensajes_no_leidos}</div>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {menuVisible && chatSeleccionadoMenu && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setMenuVisible(false)}
          />
          <div className="msg_context_menu" style={{ left: menuPos.x, top: menuPos.y }}>
            <div className="msg_context_option msg_danger" onClick={() => salirDelChat(chatSeleccionadoMenu!)}>Salir del chat</div>
            <div className="msg_context_option" onClick={() => setMenuVisible(false)}>Cancelar</div>
          </div>
        </>
      )}
      <ModalNuevoChat
        abierto={modalAbierto}
        onCerrar={() => setModalAbierto(false)}
        onCreado={(chat) => setChats(prev => [chat as any, ...prev])}
      />
    </div>
  )
}
