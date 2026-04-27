import React from 'react'
import { X, Send, MessageCircle, Bot } from 'lucide-react'
import { useChatEnVivo } from './useChatEnVivo'
import MensajeChat from './MensajeChat'
import './ChatEnVivo.css'

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
  const {
    chatAbierto, mensajes, nuevoMensaje, setNuevoMensaje,
    escribiendo, contadorNoLeidos, imagenPopup, setImagenPopup,
    datosUsuario, setDatosUsuario, mostrarModalDatos, setMostrarModalDatos,
    contenedorMensajesRef, inputMensajeRef,
    manejarEnvio, manejarDatosModal, toggleChat
  } = useChatEnVivo()

  return (
    <>
      <div className={`academia-widget-chat ${chatAbierto ? 'academia-open' : ''}`}>
        {!chatAbierto && (
          <button onClick={toggleChat} className="academia-chat-toggle" aria-label="Abrir chat">
            <MessageCircle size={30} />
            {contadorNoLeidos > 0 && (
              <span className="academia-chat-badge">{contadorNoLeidos > 9 ? '9+' : contadorNoLeidos}</span>
            )}
          </button>
        )}

        {chatAbierto && (
          <div className="academia-chat-window">
            <div className="academia-chat-header">
              <div className="academia-chat-info">
                <div className="academia-chat-avatar"><Bot size={24} /></div>
                <div className="academia-chat-title">
                  <h3>Academia Vallenata Online</h3>
                  <p>Asistente Virtual</p>
                </div>
              </div>
              <button onClick={toggleChat} className="academia-chat-close" aria-label="Cerrar chat">
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
                  <div key={mensaje.id} className={`academia-chat-msg ${mensaje.esUsuario ? 'msg-user' : 'msg-bot'}`}>
                    <div className="academia-msg-content">
                      <MensajeChat
                        texto={mensaje.texto}
                        onImageClick={(url) => setImagenPopup(url)}
                        onImageLoad={() => {}}
                      />
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
              <button type="submit" className="academia-chat-send" disabled={!nuevoMensaje.trim() || escribiendo} aria-label="Enviar mensaje">
                <Send size={18} />
              </button>
            </form>
          </div>
        )}
      </div>

      {imagenPopup && (
        <div className="academia-popup-overlay" onClick={() => setImagenPopup(null)}>
          <div className="academia-popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="academia-popup-close" onClick={() => setImagenPopup(null)} aria-label="Cerrar imagen">
              <X size={24} />
            </button>
            <img src={imagenPopup} alt="Imagen ampliada" className="academia-popup-img" />
          </div>
        </div>
      )}

      {mostrarModalDatos && (
        <div className="academia-modal-overlay">
          <div className="academia-modal-content">
            <h3>Cuéntanos sobre ti</h3>
            <form onSubmit={(e) => { e.preventDefault(); manejarDatosModal(datosUsuario); }}>
              <div className="academia-input-group">
                <label>Nombre completo</label>
                <input type="text" value={datosUsuario.nombre} onChange={(e) => setDatosUsuario(prev => ({ ...prev, nombre: e.target.value }))} required />
              </div>
              <div className="academia-input-group">
                <label>Email</label>
                <input type="email" value={datosUsuario.email} onChange={(e) => setDatosUsuario(prev => ({ ...prev, email: e.target.value }))} required />
              </div>
              <div className="academia-input-group">
                <label>WhatsApp</label>
                <input type="tel" value={datosUsuario.whatsapp} onChange={(e) => setDatosUsuario(prev => ({ ...prev, whatsapp: e.target.value }))} placeholder="3001234567" required />
              </div>
              <div className="academia-input-group">
                <label>Tipo de consulta</label>
                <select value={datosUsuario.tipoConsulta} onChange={(e) => setDatosUsuario(prev => ({ ...prev, tipoConsulta: e.target.value }))} required>
                  {tiposConsulta.map(tipo => (
                    <option key={tipo.valor} value={tipo.valor}>{tipo.texto}</option>
                  ))}
                </select>
              </div>
              <div className="academia-modal-actions">
                <button type="button" onClick={() => setMostrarModalDatos(false)} className="academia-btn academia-btn-secondary">Cancelar</button>
                <button type="submit" className="academia-btn academia-btn-primary">Continuar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
