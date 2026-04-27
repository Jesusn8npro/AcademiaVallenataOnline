import { useState, useEffect, useRef, useCallback } from 'react'
import { useUsuario } from '../../contextos/UsuarioContext'
import { supabase as clienteSupabase } from '../../servicios/clienteSupabase'

const WEBHOOK_URL = 'https://velostrategix-n8n.lnrubg.easypanel.host/webhook/chat_en_vivo_academia'

const obtenerSessionId = async () => {
  let id = localStorage.getItem('chat_session_id')
  if (!id) {
    id = 'se_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    localStorage.setItem('chat_session_id', id)
  }
  return id
}

export function useChatEnVivo() {
  const { usuario } = useUsuario()

  const [chatAbierto, setChatAbierto] = useState(() => {
    const savedState = localStorage.getItem('chat_abierto_estado')
    return savedState === 'true'
  })
  const [mensajes, setMensajes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('chat_historial_msgs')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [chatId, setChatId] = useState('')
  const [contadorNoLeidos, setContadorNoLeidos] = useState(0)
  const [imagenPopup, setImagenPopup] = useState<string | null>(null)
  const [datosUsuario, setDatosUsuario] = useState({
    nombre: '',
    email: '',
    whatsapp: '',
    tipoConsulta: 'general'
  })
  const [mostrarModalDatos, setMostrarModalDatos] = useState(false)
  const [perfilCompleto, setPerfilCompleto] = useState(false)

  const contenedorMensajesRef = useRef<HTMLDivElement>(null)
  const inputMensajeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    localStorage.setItem('chat_historial_msgs', JSON.stringify(mensajes))
  }, [mensajes])

  useEffect(() => {
    localStorage.setItem('chat_abierto_estado', chatAbierto.toString())
  }, [chatAbierto])

  const guardarDatosLocal = useCallback((datos: any) => {
    try {
      localStorage.setItem('mellevesto_chat_datos', JSON.stringify(datos))
    } catch {
      // ignore storage errors
    }
  }, [])

  const cargarDatosLocal = useCallback(() => {
    try {
      const datos = localStorage.getItem('mellevesto_chat_datos')
      return datos ? JSON.parse(datos) : null
    } catch { return null }
  }, [])

  const mapRegistroAMensaje = (registro: any) => {
    try {
      const raw = registro?.message ?? registro?.message_json
      const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
      if (!msg) return null
      const esUsuario = msg.type === 'human' || msg.type === 'user'
      const texto = msg.content ?? msg.text ?? ''
      const ts = msg.timestamp ?? registro.created_at ?? new Date().toISOString()
      return { id: `sb_${registro.id}`, texto, esUsuario, timestamp: new Date(ts), tipo: msg.tipo || 'texto' }
    } catch { return null }
  }

  const cargarHistorial = async (sessionId: string) => {
    try {
      if (!sessionId) return []
      const { data, error } = await clienteSupabase
        .from('chats_de_la_web')
        .select('id, session_id, message, message_json, created_at')
        .eq('session_id', sessionId)
        .order('id', { ascending: true })
        .limit(100)
      if (error || !data) return []
      return data.map(mapRegistroAMensaje).filter(Boolean)
    } catch { return [] }
  }

  const registrarLead = async (datos: any, sessionId: string) => {
    try {
      await clienteSupabase
        .from('leadschat')
        .upsert({
          chat_id: sessionId,
          nombre: datos.nombre,
          email: datos.email,
          whatsapp: datos.whatsapp,
          tipo_consulta: datos.tipoConsulta,
          updated_at: new Date().toISOString()
        }, { onConflict: 'email' })
    } catch {
      // ignore lead registration errors
    }
  }

  const enviarMensajeWebhook = async (mensaje: string, sessionId: string, datos: any) => {
    const datosCompletos = datos || datosUsuario
    const payload = {
      chat_id: sessionId,
      mensaje_del_usuario: mensaje,
      email_usuario: datosCompletos.email || usuario?.email || '',
      nombre: datosCompletos.nombre || usuario?.nombre || '',
      apellido: '',
      whatsapp: datosCompletos.whatsapp || '',
      ciudad: '',
      direccion: '',
      pagina_origen: window.location.href,
      timestamp: new Date().toISOString(),
      autenticado: !!usuario
    }

    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    return await response.json()
  }

  const agregarMensaje = useCallback((mensaje: any) => {
    setMensajes(prev => {
      const existe = prev.some(m => m.id === mensaje.id)
      if (existe) return prev
      return [...prev, mensaje]
    })
  }, [])

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return

    const mensaje = {
      id: `user_${Date.now()}`,
      texto: nuevoMensaje.trim(),
      esUsuario: true,
      timestamp: new Date(),
      tipo: 'texto'
    }

    agregarMensaje(mensaje)
    setNuevoMensaje('')
    setEscribiendo(true)

    try {
      const respuestaWebhook = await enviarMensajeWebhook(mensaje.texto, chatId, datosUsuario)
      let textoRespuesta = null

      if (respuestaWebhook) {
        if (respuestaWebhook.respuesta_final) textoRespuesta = respuestaWebhook.respuesta_final
        else if (respuestaWebhook.response) textoRespuesta = respuestaWebhook.response
        else if (respuestaWebhook.message) textoRespuesta = respuestaWebhook.message
        else if (respuestaWebhook.texto) textoRespuesta = respuestaWebhook.texto
        else if (typeof respuestaWebhook === 'string') textoRespuesta = respuestaWebhook
        else if (respuestaWebhook.data) {
          textoRespuesta = respuestaWebhook.data.respuesta_final || respuestaWebhook.data.response || respuestaWebhook.data.message
        } else {
          for (const key of Object.keys(respuestaWebhook)) {
            const value = respuestaWebhook[key]
            if (typeof value === 'string' && value.trim().length > 0) { textoRespuesta = value; break }
          }
        }
      }

      if (textoRespuesta && textoRespuesta.trim()) {
        agregarMensaje({ id: `bot_${Date.now()}`, texto: textoRespuesta.trim(), esUsuario: false, timestamp: new Date(), tipo: 'texto' })
      } else {
        agregarMensaje({ id: `bot_${Date.now()}`, texto: 'Disculpa, hubo un problema procesando tu mensaje. ¿Podrías intentar de nuevo?', esUsuario: false, timestamp: new Date(), tipo: 'texto' })
      }
    } catch {
      agregarMensaje({ id: `bot_${Date.now()}`, texto: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.', esUsuario: false, timestamp: new Date(), tipo: 'texto' })
    } finally {
      setEscribiendo(false)
    }
  }

  const scrollAlFinal = useCallback(() => {
    if (contenedorMensajesRef.current) {
      contenedorMensajesRef.current.scrollTop = contenedorMensajesRef.current.scrollHeight
    }
  }, [])

  const inicializarChat = useCallback(async () => {
    try {
      const sessionId = await obtenerSessionId()
      setChatId(sessionId)

      const datosGuardados = cargarDatosLocal()
      if (datosGuardados) {
        setDatosUsuario(datosGuardados)
        setPerfilCompleto(true)
      } else if (usuario?.email) {
        setDatosUsuario(prev => ({ ...prev, email: usuario.email || '', nombre: usuario.nombre || '' }))
      }

      if (mensajes.length === 0) {
        const historial = await cargarHistorial(sessionId)
        if (historial.length > 0) {
          setMensajes(historial)
        } else {
          setMensajes([{
            id: 'bienvenida',
            texto: '¡Hola! 👋 Soy tu asistente virtual de ACADEMIAVALLENATAONLINE.COM ¿En qué puedo ayudarte hoy?',
            esUsuario: false,
            timestamp: new Date(),
            tipo: 'sistema'
          }])
        }
      }
    } catch {
      // ignore initialization errors
    }
  }, [usuario, cargarDatosLocal])

  useEffect(() => {
    if (chatAbierto) inicializarChat()
  }, [chatAbierto, inicializarChat])

  useEffect(() => { scrollAlFinal() }, [mensajes, scrollAlFinal])

  useEffect(() => {
    if (chatAbierto && inputMensajeRef.current) inputMensajeRef.current.focus()
  }, [chatAbierto])

  const manejarDatosModal = async (datos: any) => {
    setDatosUsuario(datos)
    setPerfilCompleto(true)
    guardarDatosLocal(datos)
    setMostrarModalDatos(false)
    await registrarLead(datos, chatId)
    agregarMensaje({
      id: `confirmacion_${Date.now()}`,
      texto: `¡Perfecto, ${datos.nombre}! 🎉 Ya tengo tus datos. ¿En qué más puedo ayudarte?`,
      esUsuario: false,
      timestamp: new Date(),
      tipo: 'sistema'
    })
  }

  const toggleChat = () => {
    setChatAbierto(!chatAbierto)
    if (!chatAbierto) setContadorNoLeidos(0)
  }

  return {
    chatAbierto, mensajes, nuevoMensaje, setNuevoMensaje,
    escribiendo, contadorNoLeidos, imagenPopup, setImagenPopup,
    datosUsuario, setDatosUsuario, mostrarModalDatos, setMostrarModalDatos,
    perfilCompleto,
    contenedorMensajesRef, inputMensajeRef,
    manejarEnvio, manejarDatosModal, toggleChat, scrollAlFinal
  }
}
