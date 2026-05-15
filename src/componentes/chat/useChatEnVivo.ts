import { useState, useEffect, useRef, useCallback } from 'react'
import { useUsuario } from '../../contextos/UsuarioContext'
import { supabase as clienteSupabase } from '../../servicios/clienteSupabase'

const obtenerSessionId = (): string => {
  let id = localStorage.getItem('chat_session_id')
  if (!id) {
    id = 'ac_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
    localStorage.setItem('chat_session_id', id)
  }
  return id
}

// Beep de notificación tipo teléfono — usa Web Audio API, falla silencioso si bloqueado
function playRingSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const beep = (t: number, freq: number, dur: number, vol = 0.12) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, t)
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(vol, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
      osc.start(t)
      osc.stop(t + dur)
    }
    const n = ctx.currentTime
    // Dos tonos tipo timbrado de teléfono
    beep(n,       880, 0.18)
    beep(n + 0.05, 1100, 0.18)
    beep(n + 0.5,  880, 0.18)
    beep(n + 0.55, 1100, 0.18)
  } catch { /* bloqueado por el browser — ignorar */ }
}

export function useChatEnVivo() {
  const { usuario } = useUsuario()

  const [chatAbierto, setChatAbierto] = useState(() => localStorage.getItem('chat_abierto_estado') === 'true')
  const [mensajes, setMensajes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('chat_historial_msgs')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [nuevoMensaje, setNuevoMensaje] = useState('')
  const [escribiendo, setEscribiendo] = useState(false)
  const [chatId] = useState<string>(obtenerSessionId)
  const [contadorNoLeidos, setContadorNoLeidos] = useState(0)
  const [imagenPopup, setImagenPopup] = useState<string | null>(null)
  const [datosUsuario, setDatosUsuario] = useState({ nombre: '', email: '', whatsapp: '', tipoConsulta: 'general' })
  const [mostrarModalDatos, setMostrarModalDatos] = useState(false)
  const [perfilCompleto, setPerfilCompleto] = useState(false)
  const [ringActivo, setRingActivo] = useState(false)

  const contenedorMensajesRef = useRef<HTMLDivElement>(null)
  const inputMensajeRef = useRef<HTMLInputElement>(null)
  const historialCargadoRef = useRef(false)
  const usuarioInteractuoRef = useRef(false)

  // Persistencia local
  useEffect(() => {
    localStorage.setItem('chat_historial_msgs', JSON.stringify(mensajes))
  }, [mensajes])

  useEffect(() => {
    localStorage.setItem('chat_abierto_estado', chatAbierto.toString())
  }, [chatAbierto])

  // Detectar primera interacción del usuario con la página (necesaria para AudioContext)
  useEffect(() => {
    const marcar = () => { usuarioInteractuoRef.current = true }
    document.addEventListener('click', marcar, { once: true })
    document.addEventListener('scroll', marcar, { once: true })
    document.addEventListener('keydown', marcar, { once: true })
    return () => {
      document.removeEventListener('click', marcar)
      document.removeEventListener('scroll', marcar)
      document.removeEventListener('keydown', marcar)
    }
  }, [])

  // Ring automático: 8 segundos después de cargar, si el chat no está abierto
  useEffect(() => {
    if (chatAbierto || sessionStorage.getItem('chat_ring_hecho')) return
    const timer = setTimeout(() => {
      if (chatAbierto) return
      sessionStorage.setItem('chat_ring_hecho', '1')
      setRingActivo(true)
      if (usuarioInteractuoRef.current) playRingSound()
      setTimeout(() => setRingActivo(false), 2000)
    }, 8000)
    return () => clearTimeout(timer)
  }, []) // Solo al montar

  const agregarMensaje = useCallback((mensaje: any) => {
    setMensajes(prev => prev.some(m => m.id === mensaje.id) ? prev : [...prev, mensaje])
  }, [])

  const scrollAlFinal = useCallback(() => {
    // requestAnimationFrame garantiza que el DOM ya pintó el nuevo mensaje
    requestAnimationFrame(() => {
      const el = contenedorMensajesRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }, [])

  const cargarHistorial = async (sessionId: string) => {
    try {
      const { data, error } = await clienteSupabase
        .from('chats_envivo_academia')
        .select('id, message, created_at')
        .eq('session_id', sessionId)
        .order('id', { ascending: true })
        .limit(50)
      if (error || !data) return []
      return data.map((r: any) => {
        const m = r.message
        if (!m?.content) return null
        return {
          id: `db_${r.id}`,
          texto: m.content,
          esUsuario: m.role === 'user' || m.type === 'human',
          timestamp: new Date(m.timestamp || r.created_at),
          tipo: 'texto'
        }
      }).filter(Boolean)
    } catch { return [] }
  }

  // Inicialización cuando el chat se abre
  useEffect(() => {
    if (!chatAbierto) return

    if (usuario?.email) {
      setDatosUsuario(prev => ({
        ...prev,
        email: prev.email || usuario.email || '',
        nombre: prev.nombre || usuario.nombre || ''
      }))
      setPerfilCompleto(true)
    }

    if (historialCargadoRef.current) return
    historialCargadoRef.current = true

    cargarHistorial(chatId).then(historial => {
      if (historial.length > 0) {
        setMensajes(historial)
      } else {
        setMensajes(prev => {
          if (prev.length > 0) return prev
          const saludo = usuario?.nombre
            ? `¡Hola, ${usuario.nombre}! 👋 Soy Juancho, tu asistente de Academia Vallenata Online. ¿En qué puedo ayudarte hoy?`
            : '¡Hola! 👋 Soy Juancho, el asistente virtual de Academia Vallenata Online. ¿Quieres aprender acordeón o tienes alguna pregunta?'
          return [{ id: 'bienvenida', texto: saludo, esUsuario: false, timestamp: new Date(), tipo: 'sistema' }]
        })
      }
    })
  }, [chatAbierto, chatId, usuario?.email, usuario?.nombre])

  // Scroll al fondo cada vez que cambian los mensajes o el estado de escritura
  useEffect(() => { scrollAlFinal() }, [mensajes, escribiendo, scrollAlFinal])

  // Focus en el input al abrir
  useEffect(() => {
    if (chatAbierto && inputMensajeRef.current) {
      setTimeout(() => inputMensajeRef.current?.focus(), 100)
    }
  }, [chatAbierto])

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoMensaje.trim()) return

    const textoEnviado = nuevoMensaje.trim()
    agregarMensaje({ id: `user_${Date.now()}`, texto: textoEnviado, esUsuario: true, timestamp: new Date(), tipo: 'texto' })
    setNuevoMensaje('')
    setEscribiendo(true)

    try {
      const { data, error } = await clienteSupabase.functions.invoke('chat-academia', {
        body: {
          chat_id: chatId,
          mensaje: textoEnviado,
          usuario_id: usuario?.id || null,
          pagina_origen: window.location.pathname
        }
      })

      if (error) throw error
      agregarMensaje({
        id: `bot_${Date.now()}`,
        texto: data?.respuesta || 'Disculpa, no pude procesar tu mensaje. ¿Puedes intentarlo de nuevo?',
        esUsuario: false,
        timestamp: new Date(),
        tipo: 'texto'
      })
    } catch {
      agregarMensaje({
        id: `bot_${Date.now()}`,
        texto: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor intenta de nuevo.',
        esUsuario: false,
        timestamp: new Date(),
        tipo: 'texto'
      })
    } finally {
      setEscribiendo(false)
    }
  }

  const manejarDatosModal = (datos: any) => {
    setDatosUsuario(datos)
    setPerfilCompleto(true)
    try { localStorage.setItem('chat_datos', JSON.stringify(datos)) } catch { /* ignore */ }
    setMostrarModalDatos(false)
    agregarMensaje({
      id: `confirm_${Date.now()}`,
      texto: `¡Perfecto, ${datos.nombre || 'estudiante'}! 🎉 Ya tengo tus datos. ¿En qué más puedo ayudarte?`,
      esUsuario: false,
      timestamp: new Date(),
      tipo: 'sistema'
    })
  }

  const toggleChat = () => {
    setChatAbierto(prev => {
      if (prev) return false
      setContadorNoLeidos(0)
      return true
    })
  }

  return {
    chatAbierto, mensajes, nuevoMensaje, setNuevoMensaje,
    escribiendo, contadorNoLeidos, imagenPopup, setImagenPopup,
    datosUsuario, setDatosUsuario, mostrarModalDatos, setMostrarModalDatos,
    perfilCompleto, ringActivo,
    contenedorMensajesRef, inputMensajeRef,
    manejarEnvio, manejarDatosModal, toggleChat, scrollAlFinal
  }
}
