import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Send, MessageCircle, Bot } from 'lucide-react'
import { useUsuario } from '../../contextos/UsuarioContext'
import './ChatEnVivo.css'
import { supabase as clienteSupabase } from '../../servicios/supabaseCliente'

// Helper para Session ID (ya que no se importa)
const obtenerSessionId = async () => {
    let id = localStorage.getItem('chat_session_id')
    if (!id) {
        // Generar ID único simple
        id = 'se_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
        localStorage.setItem('chat_session_id', id)
    }
    return id
}

const WEBHOOK_URL = 'https://velostrategix-n8n.lnrubg.easypanel.host/webhook/chat_en_vivo_academia'

const tiposConsulta = [
    { valor: 'general', texto: 'Consulta general' },
    { valor: 'productos', texto: 'Información sobre productos' },
    { valor: 'precios', texto: 'Precios y ofertas' },
    { valor: 'envios', texto: 'Envíos y entregas' },
    { valor: 'devolucion', texto: 'Devoluciones' },
    { valor: 'tecnico', texto: 'Soporte técnico' },
    { valor: 'otro', texto: 'Otro tema' }
]

export default function ChatEnVivo() {
    const { usuario } = useUsuario()
    // const { modalAbierto } = useCarrito(); 

    // Estados principales
    const [chatAbierto, setChatAbierto] = useState(() => {
        const savedState = localStorage.getItem('chat_abierto_estado');
        return savedState === 'true';
    })
    const [mensajes, setMensajes] = useState<any[]>(() => {
        try {
            const saved = localStorage.getItem('chat_historial_msgs');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    })
    const [nuevoMensaje, setNuevoMensaje] = useState('')
    const [escribiendo, setEscribiendo] = useState(false)
    const [chatId, setChatId] = useState('')
    const [contadorNoLeidos, setContadorNoLeidos] = useState(0)
    const [imagenPopup, setImagenPopup] = useState<string | null>(null)

    // Persistir mensajes
    useEffect(() => {
        localStorage.setItem('chat_historial_msgs', JSON.stringify(mensajes));
    }, [mensajes]);

    // Datos usuario
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

    // Persistir estado de chat abierto
    useEffect(() => {
        localStorage.setItem('chat_abierto_estado', chatAbierto.toString());
    }, [chatAbierto]);

    // Utilidades
    const esUrlImagen = (url: string) => {
        if (!url || typeof url !== 'string') return false
        const patronesImagen = [
            /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?.*)?$/i,
            /\/image\//i,
            /cloudinary\.com/i,
            /imgur\.com/i,
            /unsplash\.com/i,
            /supabase\.co.*storage/i
        ]
        return patronesImagen.some(patron => patron.test(url))
    }

    const extraerUrls = (texto: string) => {
        if (!texto) return []
        const urls = texto.match(/(https?:\/\/[^\s]+)/g) || []
        return urls.map(url => ({
            url: url.replace(/[.,;!?)\]}]+$/, ''),
            esImagen: esUrlImagen(url)
        }))
    }

    const limpiarTextoDescriptivo = (texto: string) => {
        if (!texto) return texto
        const patronesDescriptivos = [
            /\*\*Imagen Principal\*\*:?\s*/gi,
            /\*\*Imagen Secundaria \d+\*\*:?\s*/gi,
            /\d+\.\s*\*\*Imagen Secundaria \d+\*\*:?\s*/gi,
            /¡Detalle\s*/gi,
            /Te muestro las fotos:?\s*/gi,
            /Aquí tienes las imágenes:?\s*/gi,
            /\)\s*$/g
        ]

        let textoLimpio = texto
        patronesDescriptivos.forEach(patron => {
            textoLimpio = textoLimpio.replace(patron, '')
        })
        return textoLimpio.trim()
    }

    // Renderizado de contenido con imágenes
    const renderizarContenidoMensaje = (texto: string) => {
        if (!texto) return null

        const textoLimpio = limpiarTextoDescriptivo(texto)
        const urls = extraerUrls(textoLimpio)
        const urlsImagen = urls.filter(u => u.esImagen)

        if (urlsImagen.length === 0) {
            return <span>{textoLimpio}</span>
        }

        const soloImagenes = urlsImagen.length > 0 &&
            textoLimpio.split(/\s+/).every(palabra =>
                urlsImagen.some(u => palabra.includes(u.url)) || palabra.trim() === ''
            )

        if (soloImagenes) {
            return (
                <div>
                    {urlsImagen.map((urlInfo, index) => (
                        <div key={index} className="academia-chat-img-container">
                            <img
                                src={urlInfo.url}
                                alt=""
                                className="academia-chat-img"
                                onClick={() => setImagenPopup(urlInfo.url)}
                                onError={(e: any) => e.target.style.display = 'none'}
                                onLoad={() => {
                                    setTimeout(() => {
                                        if (contenedorMensajesRef.current) {
                                            contenedorMensajesRef.current.scrollTop = contenedorMensajesRef.current.scrollHeight
                                        }
                                    }, 100)
                                }}
                            />
                        </div>
                    ))}
                </div>
            )
        }

        let contenido = textoLimpio
        const elementos: JSX.Element[] = []

        urlsImagen.forEach((urlInfo, index) => {
            const placeholder = `__IMAGEN_${index}__`
            contenido = contenido.replace(urlInfo.url, placeholder)
        })

        const partes = contenido.split(/(__IMAGEN_\d+__)/g)

        partes.forEach((parte, index) => {
            const matchImagen = parte.match(/^__IMAGEN_(\d+)__$/)

            if (matchImagen) {
                const indiceImagen = parseInt(matchImagen[1])
                const urlImagen = urlsImagen[indiceImagen]?.url

                if (urlImagen) {
                    elementos.push(
                        <div key={index} className="academia-chat-img-container">
                            <img
                                src={urlImagen}
                                alt=""
                                className="academia-chat-img"
                                onClick={() => setImagenPopup(urlImagen)}
                                onError={(e: any) => e.target.style.display = 'none'}
                                onLoad={() => {
                                    setTimeout(() => {
                                        if (contenedorMensajesRef.current) {
                                            contenedorMensajesRef.current.scrollTop = contenedorMensajesRef.current.scrollHeight
                                        }
                                    }, 100)
                                }}
                            />
                        </div>
                    )
                }
            } else if (parte.trim() && !urlsImagen.some(u => parte.includes(u.url))) {
                elementos.push(<span key={index}>{parte}</span>)
            }
        })

        return elementos.length > 0 ? elementos : <span>{textoLimpio}</span>
    }

    // Persistencia local
    const guardarDatosLocal = useCallback((datos: any) => {
        try {
            localStorage.setItem('mellevesto_chat_datos', JSON.stringify(datos))
        } catch (error) {
            console.warn('Error guardando datos:', error)
        }
    }, [])

    const cargarDatosLocal = useCallback(() => {
        try {
            const datos = localStorage.getItem('mellevesto_chat_datos')
            return datos ? JSON.parse(datos) : null
        } catch (error) {
            return null
        }
    }, [])

    // Mapeo de datos
    const mapRegistroAMensaje = (registro: any) => {
        try {
            const raw = registro?.message ?? registro?.message_json
            const msg = typeof raw === 'string' ? JSON.parse(raw) : raw
            if (!msg) return null

            const esUsuario = msg.type === 'human' || msg.type === 'user'
            const texto = msg.content ?? msg.text ?? ''
            const ts = msg.timestamp ?? registro.created_at ?? new Date().toISOString()

            return {
                id: `sb_${registro.id}`,
                texto,
                esUsuario,
                timestamp: new Date(ts),
                tipo: msg.tipo || 'texto'
            }
        } catch {
            return null
        }
    }

    // Carga de datos
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
        } catch {
            return []
        }
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
        } catch (error) {
            console.warn('Error registrando lead:', error)
        }
    }

    // Webhook
    const enviarMensajeWebhook = async (mensaje: string, sessionId: string, datos: any) => {
        try {
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

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Error enviando mensaje al webhook:', error)
            throw error
        }
    }

    // Manejo de mensajes
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

            // Extraer respuesta del bot
            let textoRespuesta = null

            if (respuestaWebhook) {
                if (respuestaWebhook.respuesta_final) {
                    textoRespuesta = respuestaWebhook.respuesta_final
                } else if (respuestaWebhook.response) {
                    textoRespuesta = respuestaWebhook.response
                } else if (respuestaWebhook.message) {
                    textoRespuesta = respuestaWebhook.message
                } else if (respuestaWebhook.texto) {
                    textoRespuesta = respuestaWebhook.texto
                } else if (typeof respuestaWebhook === 'string') {
                    textoRespuesta = respuestaWebhook
                } else if (respuestaWebhook.data) {
                    textoRespuesta = respuestaWebhook.data.respuesta_final ||
                        respuestaWebhook.data.response ||
                        respuestaWebhook.data.message
                } else {
                    // Buscar en todas las propiedades
                    const keys = Object.keys(respuestaWebhook)
                    for (const key of keys) {
                        const value = respuestaWebhook[key]
                        if (typeof value === 'string' && value.trim().length > 0) {
                            textoRespuesta = value
                            break
                        }
                    }
                }
            }

            if (textoRespuesta && textoRespuesta.trim()) {
                const mensajeBot = {
                    id: `bot_${Date.now()}`,
                    texto: textoRespuesta.trim(),
                    esUsuario: false,
                    timestamp: new Date(),
                    tipo: 'texto'
                }
                agregarMensaje(mensajeBot)
            } else {
                const mensajeFallback = {
                    id: `bot_${Date.now()}`,
                    texto: 'Disculpa, hubo un problema procesando tu mensaje. ¿Podrías intentar de nuevo?',
                    esUsuario: false,
                    timestamp: new Date(),
                    tipo: 'texto'
                }
                agregarMensaje(mensajeFallback)
            }
        } catch (error) {
            console.error('Error procesando respuesta del webhook:', error)

            const mensajeError = {
                id: `bot_${Date.now()}`,
                texto: 'Lo siento, no pude procesar tu mensaje en este momento. Por favor, inténtalo de nuevo.',
                esUsuario: false,
                timestamp: new Date(),
                tipo: 'texto'
            }
            agregarMensaje(mensajeError)
        } finally {
            setEscribiendo(false)
        }
    }

    // Inicialización
    const inicializarChat = useCallback(async () => {
        try {
            const sessionId = await obtenerSessionId()
            setChatId(sessionId)

            const datosGuardados = cargarDatosLocal()
            if (datosGuardados) {
                setDatosUsuario(datosGuardados)
                setPerfilCompleto(true)
            } else if (usuario?.email) {
                setDatosUsuario(prev => ({
                    ...prev,
                    email: usuario.email || '',
                    nombre: usuario.nombre || ''
                }))
            }

            const historial = await cargarHistorial(sessionId)
            if (historial.length > 0) {
                // Si ya tenemos mensajes locales (del localStorage), no sobrescribimos BRUSCAMENTE
                // para evitar perder los que acabamos de enviar y no han llegado al server.
                // Estrategia simple: Si el local está vacío, llenamos con historial.
                // Si no, podríamos mezclar, pero por ahora priorizamos la continuidad visual inmediata.
                setMensajes(prev => {
                    if (prev.length === 0) return historial;

                    // Opcional: Podríamos intentar fusionar si fuera necesario, 
                    // pero para "no perder el chat al recargar", mantener el estado local es clave.
                    // Si queremos actualizaciones, deberíamos manejar IDs reales devueltos por el webhook.
                    return prev;
                })
            } else if (mensajes.length === 0) { // Solo mostrar bienvenida si está vacío totalmente
                const bienvenida = {
                    id: 'bienvenida',
                    texto: '¡Hola! 👋 Soy tu asistente virtual de ACADEMIAVALLENATAONLINE.COM ¿En qué puedo ayudarte hoy?',
                    esUsuario: false,
                    timestamp: new Date(),
                    tipo: 'sistema'
                }
                setMensajes([bienvenida])
            }
        } catch (error) {
            console.warn('Error inicializando chat:', error)
        }
    }, [usuario, cargarDatosLocal])

    // Scroll automático
    const scrollAlFinal = useCallback(() => {
        if (contenedorMensajesRef.current) {
            contenedorMensajesRef.current.scrollTop = contenedorMensajesRef.current.scrollHeight
        }
    }, [])

    // Efectos
    useEffect(() => {
        if (chatAbierto) {
            inicializarChat()
        }
    }, [chatAbierto, inicializarChat])

    useEffect(() => {
        scrollAlFinal()
    }, [mensajes, scrollAlFinal])

    useEffect(() => {
        if (chatAbierto && inputMensajeRef.current) {
            inputMensajeRef.current.focus()
        }
    }, [chatAbierto])

    // Manejo de modal
    const manejarDatosModal = async (datos: any) => {
        setDatosUsuario(datos)
        setPerfilCompleto(true)
        guardarDatosLocal(datos)
        setMostrarModalDatos(false)

        await registrarLead(datos, chatId)

        const confirmacion = {
            id: `confirmacion_${Date.now()}`,
            texto: `¡Perfecto, ${datos.nombre}! 🎉 Ya tengo tus datos. ¿En qué más puedo ayudarte?`,
            esUsuario: false,
            timestamp: new Date(),
            tipo: 'sistema'
        }
        agregarMensaje(confirmacion)
    }

    const toggleChat = () => {
        setChatAbierto(!chatAbierto)
        if (!chatAbierto) {
            setContadorNoLeidos(0)
        }
    }

    return (
        <>
            <div className={`academia-widget-chat ${chatAbierto ? 'academia-open' : ''}`}>
                {!chatAbierto && (
                    <button
                        onClick={toggleChat}
                        className="academia-chat-toggle"
                        aria-label="Abrir chat"
                    >
                        <MessageCircle size={30} />
                        {contadorNoLeidos > 0 && (
                            <span className="academia-chat-badge">
                                {contadorNoLeidos > 9 ? '9+' : contadorNoLeidos}
                            </span>
                        )}
                    </button>
                )}

                {chatAbierto && (
                    <div className="academia-chat-window">
                        <div className="academia-chat-header">
                            <div className="academia-chat-info">
                                <div className="academia-chat-avatar">
                                    <Bot size={24} />
                                </div>
                                <div className="academia-chat-title">
                                    <h3>Academia Vallenata Online</h3>
                                    <p>Asistente Virtual</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleChat}
                                className="academia-chat-close"
                                aria-label="Cerrar chat"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="academia-chat-messages" ref={contenedorMensajesRef}>
                            {mensajes.length === 0 ? (
                                <div className="academia-msg-content" style={{ textAlign: 'center', background: 'transparent', boxShadow: 'none' }}>
                                    <h3>¡Hola! 👋</h3>
                                    <p>Asistente virtual listo para ayudarte.</p>
                                </div>
                            ) : (
                                mensajes.map((mensaje) => (
                                    <div
                                        key={mensaje.id}
                                        className={`academia-chat-msg ${mensaje.esUsuario ? 'msg-user' : 'msg-bot'}`}
                                    >
                                        <div className="academia-msg-content">
                                            {renderizarContenidoMensaje(mensaje.texto)}
                                        </div>
                                    </div>
                                ))
                            )}

                            {escribiendo && (
                                <div className="academia-chat-typing">
                                    <div className="academia-typing-dot"></div>
                                    <div className="academia-typing-dot"></div>
                                    <div className="academia-typing-dot"></div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={manejarEnvio} className="academia-chat-form">
                            <input
                                ref={inputMensajeRef}
                                type="text"
                                value={nuevoMensaje}
                                onChange={(e) => setNuevoMensaje(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="academia-chat-input"
                                disabled={escribiendo}
                            />
                            <button
                                type="submit"
                                className="academia-chat-send"
                                disabled={!nuevoMensaje.trim() || escribiendo}
                                aria-label="Enviar mensaje"
                            >
                                <Send size={18} />
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Popup de imagen */}
            {imagenPopup && (
                <div className="academia-popup-overlay" onClick={() => setImagenPopup(null)}>
                    <div className="academia-popup-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            className="academia-popup-close"
                            onClick={() => setImagenPopup(null)}
                            aria-label="Cerrar imagen"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={imagenPopup}
                            alt="Imagen ampliada"
                            className="academia-popup-img"
                        />
                    </div>
                </div>
            )}

            {/* Modal de datos de usuario */}
            {mostrarModalDatos && (
                <div className="academia-modal-overlay">
                    <div className="academia-modal-content">
                        <h3>Cuéntanos sobre ti</h3>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            manejarDatosModal(datosUsuario)
                        }}>
                            <div className="academia-input-group">
                                <label>Nombre completo</label>
                                <input
                                    type="text"
                                    value={datosUsuario.nombre}
                                    onChange={(e) => setDatosUsuario(prev => ({ ...prev, nombre: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="academia-input-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={datosUsuario.email}
                                    onChange={(e) => setDatosUsuario(prev => ({ ...prev, email: e.target.value }))}
                                    required
                                />
                            </div>

                            <div className="academia-input-group">
                                <label>WhatsApp</label>
                                <input
                                    type="tel"
                                    value={datosUsuario.whatsapp}
                                    onChange={(e) => setDatosUsuario(prev => ({ ...prev, whatsapp: e.target.value }))}
                                    placeholder="3001234567"
                                    required
                                />
                            </div>

                            <div className="academia-input-group">
                                <label>Tipo de consulta</label>
                                <select
                                    value={datosUsuario.tipoConsulta}
                                    onChange={(e) => setDatosUsuario(prev => ({ ...prev, tipoConsulta: e.target.value }))}
                                    required
                                >
                                    {tiposConsulta.map(tipo => (
                                        <option key={tipo.valor} value={tipo.valor}>
                                            {tipo.texto}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="academia-modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setMostrarModalDatos(false)}
                                    className="academia-btn academia-btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="academia-btn academia-btn-primary"
                                >
                                    Continuar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}