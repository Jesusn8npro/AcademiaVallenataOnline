import React, { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
import ModalNuevoChat from './ModalNuevoChat'

export interface Chat {
  id: string
  nombre?: string
  imagen_url?: string
  es_grupal: boolean
  creado_en: string
  actualizado_en: string
  creado_por: string
  ultimo_mensaje?: { contenido?: string; creado_en?: string; usuario_id?: string } | null
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
    if (d.toDateString() === ahora.toDateString())
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    const ayer = new Date(ahora); ayer.setDate(ahora.getDate() - 1)
    if (d.toDateString() === ayer.toDateString()) return 'Ayer'
    const dias = (ahora.getTime() - d.getTime()) / 86400000
    if (dias < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' })
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
  } catch { return '' }
}

export default function ListaChats({ chatSeleccionado, onSeleccionarChat, usuarioActual }: Props) {
  const [chats, setChats] = useState<Chat[]>([])
  const [cargando, setCargando] = useState(true)
  const [termino, setTermino] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [usuarioId, setUsuarioId] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number; chat: Chat } | null>(null)
  const seleccionadoRef = useRef<string | null>(chatSeleccionado)

  useEffect(() => { seleccionadoRef.current = chatSeleccionado }, [chatSeleccionado])

  // Carga inicial
  useEffect(() => {
    let activo = true
    ;(async () => {
      setCargando(true)
      const { data: { user } } = await supabase.auth.getUser()
      setUsuarioId(user?.id || null)
      if (!user) { setChats([]); setCargando(false); return }

      const { data: misMiembros } = await supabase
        .from('miembros_chat').select('chat_id')
        .eq('usuario_id', user.id).eq('estado_miembro', 'activo')
      const chatIds = (misMiembros || []).map((m: any) => m.chat_id)
      if (chatIds.length === 0) { setChats([]); setCargando(false); return }

      const { data } = await supabase
        .from('chats')
        .select(`*, miembros_chat(*, usuario:perfiles!miembros_chat_usuario_id_fkey(id,nombre_completo,url_foto_perfil,nombre_usuario)), ultimo_mensaje:mensajes!chats_ultimo_mensaje_id_fkey(id,contenido,creado_en,usuario_id)`)
        .in('id', chatIds).eq('activo', true)
        .order('actualizado_en', { ascending: false })

      const enriquecidos: Chat[] = (data || []).map((c: any) => {
        const m = (c.miembros_chat || []).find((x: any) => x.usuario_id === user.id)
        return { ...c, miembros: c.miembros_chat, mensajes_no_leidos: m?.mensajes_no_leidos || 0, ultimo_mensaje: c.ultimo_mensaje || null }
      })

      // Fallback: traer último mensaje si no vino del FK
      const sinUltimo = enriquecidos.filter(c => !c.ultimo_mensaje).map(c => c.id)
      if (sinUltimo.length) {
        const ultimos = await Promise.all(sinUltimo.map(async (id) => {
          const { data: msg } = await supabase
            .from('mensajes').select('id, contenido, creado_en, usuario_id')
            .eq('chat_id', id).eq('eliminado', false)
            .order('creado_en', { ascending: false }).limit(1).maybeSingle()
          return { id, msg }
        }))
        const mapa = new Map(ultimos.filter(u => u.msg).map(u => [u.id, u.msg]))
        enriquecidos.forEach(c => { if (!c.ultimo_mensaje && mapa.has(c.id)) c.ultimo_mensaje = mapa.get(c.id) as any })
      }

      // Dedupe por partner
      const dedup = new Map<string, Chat>()
      for (const c of enriquecidos) {
        const partner = (c.miembros || []).find((m: any) => m.usuario_id !== user.id)
        const clave = c.es_grupal ? `g-${c.id}` : `p-${partner?.usuario_id || c.id}`
        const existente = dedup.get(clave)
        if (!existente || ((c.ultimo_mensaje?.creado_en || c.actualizado_en) > (existente.ultimo_mensaje?.creado_en || existente.actualizado_en))) {
          dedup.set(clave, c)
        }
      }
      if (activo) { setChats([...dedup.values()]); setCargando(false) }
    })()
    return () => { activo = false }
  }, [])

  // Realtime: nuevos mensajes -> actualizar lista
  useEffect(() => {
    if (!usuarioId) return
    const channel = supabase
      .channel(`lista_chats_${usuarioId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes' }, (payload: any) => {
        const nuevo = payload.new
        if (!nuevo) return
        setChats(prev => {
          const i = prev.findIndex(c => c.id === nuevo.chat_id)
          if (i === -1) return prev
          const incrementar = nuevo.usuario_id !== usuarioId && seleccionadoRef.current !== nuevo.chat_id
          const actualizado: Chat = {
            ...prev[i],
            ultimo_mensaje: { contenido: nuevo.contenido, creado_en: nuevo.creado_en, usuario_id: nuevo.usuario_id },
            actualizado_en: nuevo.creado_en,
            mensajes_no_leidos: incrementar ? (prev[i].mensajes_no_leidos || 0) + 1 : prev[i].mensajes_no_leidos
          }
          return [actualizado, ...prev.filter((_, j) => j !== i)]
        })
      })
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
    await supabase.from('miembros_chat').update({ estado_miembro: 'salido' })
      .eq('chat_id', chat.id).eq('usuario_id', usuarioId)
    setChats(prev => prev.filter(c => c.id !== chat.id))
    setMenu(null)
  }

  const filtrados = useMemo(() => {
    const t = termino.trim().toLowerCase()
    if (!t) return chats
    return chats.filter(c => {
      if ((c.nombre || '').toLowerCase().includes(t)) return true
      const partner = (c.miembros || []).find((m: any) => m.usuario_id !== usuarioId)
      return (partner?.usuario?.nombre_completo || '').toLowerCase().includes(t)
    })
  }, [termino, chats, usuarioId])

  return (
    <div className="msg_sb_inner">
      <div className="msg_sb_header">
        <div className="msg_sb_titlebar">
          <div className="msg_sb_left">
            <div className="msg_sb_icon">💬</div>
            <div>
              <div className="msg_sb_title">Mensajes</div>
              <div className="msg_sb_sub">Mantente conectado</div>
            </div>
          </div>
          <button className="msg_sb_new" onClick={() => setModalAbierto(true)} aria-label="Nuevo chat">+</button>
        </div>
        <input className="msg_search" value={termino} onChange={e => setTermino(e.target.value)} placeholder="Buscar chats" />
      </div>

      <div className="msg_sb_list">
        {cargando ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><div className="msg_spinner" /></div>
        ) : filtrados.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--mv-text-soft)' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>💭</div>
            <p style={{ margin: 0, fontSize: '.9rem' }}>{termino ? 'No se encontraron chats' : 'Aún no tienes chats. Crea uno con el botón +'}</p>
          </div>
        ) : filtrados.map((c) => {
          const partner = (c.miembros || []).find((m: any) => m.usuario_id !== usuarioId)
          const avatar = partner?.usuario?.url_foto_perfil || c.imagen_url || '/images/default-user.png'
          const nombre = c.es_grupal ? (c.nombre || 'Grupo') : (partner?.usuario?.nombre_completo || c.nombre || 'Chat')
          const preview = c.ultimo_mensaje
            ? (c.ultimo_mensaje.usuario_id === usuarioId ? `Tú: ${c.ultimo_mensaje.contenido}` : c.ultimo_mensaje.contenido)
            : 'Sin mensajes aún'
          const tiempo = tiempoCorto(c.ultimo_mensaje?.creado_en || c.actualizado_en)

          return (
            <div
              key={c.id}
              className={`msg_chat_item ${chatSeleccionado === c.id ? 'is-active' : ''}`}
              onClick={() => onSeleccionarChat(c)}
              onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, chat: c }) }}
            >
              <img className="msg_chat_avatar" src={avatar} alt={nombre}
                onError={(e) => { (e.target as HTMLImageElement).src = '/images/default-user.png' }} />
              <div className="msg_chat_body">
                <div className="msg_chat_row">
                  <div className="msg_chat_name" title={nombre}>{nombre}</div>
                  {tiempo && <div className={`msg_chat_time ${c.mensajes_no_leidos ? 'has-unread' : ''}`}>{tiempo}</div>}
                </div>
                <div className="msg_chat_preview_row">
                  <div className="msg_chat_preview">{preview}</div>
                  {c.mensajes_no_leidos ? <div className="msg_unread">{c.mensajes_no_leidos}</div> : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {menu && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setMenu(null)} />
          <div className="msg_ctx_menu" style={{ left: menu.x, top: menu.y }}>
            <div className="msg_ctx_opt is-danger" onClick={() => salirDelChat(menu.chat)}>Salir del chat</div>
            <div className="msg_ctx_opt" onClick={() => setMenu(null)}>Cancelar</div>
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
