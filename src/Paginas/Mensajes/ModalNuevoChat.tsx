import React, { useEffect, useState, useRef } from 'react'
import { mensajeriaService } from '../../servicios/mensajeriaService'
import { X, Search, MessageSquare, UserPlus, Users } from 'lucide-react'
import './ModalNuevoChat.css'

interface Props {
  abierto: boolean
  onCerrar: () => void
  onCreado?: (chat: any) => void
}

export default function ModalNuevoChat({ abierto, onCerrar, onCreado }: Props) {
  const [esGrupal, setEsGrupal] = useState(false)
  const [termino, setTermino] = useState('')
  const [resultados, setResultados] = useState<any[]>([])
  const [seleccionados, setSeleccionados] = useState<any[]>([])
  const [nombreGrupo, setNombreGrupo] = useState('')
  const [descripcionGrupo, setDescripcionGrupo] = useState('')
  const [cargando, setCargando] = useState(false)
  const [buscando, setBuscando] = useState(false)

  // Referencias (para posibles usos futuros, aunque overlay maneja cierre)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) {
      // Resetear estados al cerrar
      setTermino('')
      setResultados([])
      setSeleccionados([])
      setNombreGrupo('')
      setDescripcionGrupo('')
      setEsGrupal(false)
    }
  }, [abierto])

  async function handleBuscar(t: string) {
    setTermino(t)
    if (t.length < 2) {
      setResultados([])
      return
    }

    setBuscando(true)
    const { usuarios, error } = await mensajeriaService.buscarUsuarios(t)

    if (!error && usuarios) {
      // Filtrar usuarios ya seleccionados
      setResultados(usuarios.filter((u: any) => !seleccionados.some(s => s.id === u.id)))
    }
    setBuscando(false)
  }

  function agregarUsuario(usuario: any) {
    setSeleccionados([...seleccionados, usuario])
    setResultados(resultados.filter(r => r.id !== usuario.id))
    setTermino('')
  }

  function removerUsuario(usuario: any) {
    setSeleccionados(seleccionados.filter(s => s.id !== usuario.id))
  }

  async function crear() {
    if (cargando) return
    if (seleccionados.length === 0) return
    if (esGrupal && !nombreGrupo.trim()) return

    setCargando(true)

    const { chat, error } = await mensajeriaService.crearChat({
      es_grupal: esGrupal,
      nombre: esGrupal ? nombreGrupo : undefined,
      descripcion: descripcionGrupo,
      miembros_ids: seleccionados.map(s => s.id)
    })

    if (error || !chat) {
      alert('Error al crear el chat: ' + error)
      setCargando(false)
      return
    }

    if (onCreado) onCreado(chat)
    setCargando(false)
    onCerrar()
  }

  if (!abierto) return null

  return (
    <div className="mnc-overlay">
      <div className="mnc-container" ref={modalRef}>

        {/* Header */}
        <div className="mnc-header">
          <div className="mnc-title-wrapper">
            <div className="mnc-icon-box">
              <MessageSquare size={20} />
            </div>
            <h3 className="mnc-title">Nuevo Chat</h3>
          </div>
          <button className="mnc-close-btn" onClick={onCerrar}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="mnc-body">

          {/* Toggle Grupo */}
          <div className="mnc-group-toggle">
            <label className="mnc-toggle-label">
              <div className={`mnc-toggle-switch ${esGrupal ? 'active' : ''}`}>
                <div className="mnc-toggle-thumb" />
              </div>
              <input
                type="checkbox"
                checked={esGrupal}
                onChange={e => setEsGrupal(e.target.checked)}
                className="hidden"
              />
              <span className="mnc-toggle-text">Crear grupo de conversación</span>
            </label>
          </div>

          {/* Campos de Grupo */}
          {esGrupal && (
            <div className="mnc-input-group animate-in fade-in slide-in-from-top-2">
              <div>
                <label className="mnc-label">Nombre del grupo</label>
                <input
                  className="mnc-input"
                  placeholder="Ej: Proyecto Final"
                  value={nombreGrupo}
                  onChange={e => setNombreGrupo(e.target.value)}
                />
              </div>
              <div>
                <label className="mnc-label">Descripción (opcional)</label>
                <textarea
                  className="mnc-input"
                  placeholder="¿De qué trata este grupo?"
                  rows={2}
                  style={{ resize: 'none' }}
                  value={descripcionGrupo}
                  onChange={e => setDescripcionGrupo(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Búsqueda */}
          <div className="mnc-input-group">
            <label className="mnc-label">Agregar participantes</label>
            <div className="mnc-search-box">
              <Search className="mnc-search-icon" size={18} />
              <input
                className="mnc-input has-icon"
                placeholder="Ingresa el correo exacto del usuario..."
                value={termino}
                onChange={e => handleBuscar(e.target.value)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              *Por privacidad, debes ingresar el correo exacto del usuario.
            </p>
          </div>

          {/* Resultados y Seleccionados */}
          <div>
            {/* Chips de Seleccionados */}
            {seleccionados.length > 0 && (
              <div className="mnc-chips-container">
                {seleccionados.map(u => (
                  <div key={u.id} className="mnc-chip">
                    <span>{u.nombre_completo || u.nombre_usuario}</span>
                    <button className="mnc-chip-remove" onClick={() => removerUsuario(u)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Lista de Resultados */}
            <div className="mnc-results-list custom-scrollbar">
              {buscando && (
                <div className="text-center py-4 text-gray-500">Buscando usuarios...</div>
              )}

              {!buscando && resultados.length === 0 && termino.length >= 2 && (
                <div className="text-center py-4 text-gray-500">No se encontraron usuarios</div>
              )}

              {resultados.map(u => (
                <div
                  key={u.id}
                  onClick={() => agregarUsuario(u)}
                  className="mnc-user-item group"
                >
                  <img
                    src={u.url_foto_perfil || '/images/default-curso.jpg'}
                    alt="avatar"
                    className="mnc-avatar"
                  />
                  <div className="mnc-user-info">
                    <div className="mnc-user-name">{u.nombre_usuario}</div>
                    {/* Nombre completo oculto por seguridad */}
                  </div>
                  <div className="mnc-add-icon">
                    <UserPlus size={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mnc-footer">
          <button className="mnc-btn mnc-btn-cancel" onClick={onCerrar}>
            Cancelar
          </button>
          <button
            className="mnc-btn mnc-btn-primary"
            onClick={crear}
            disabled={cargando || seleccionados.length === 0 || (esGrupal && !nombreGrupo.trim())}
          >
            {cargando ? 'Creando...' : (esGrupal ? 'Crear Grupo' : 'Crear Chat')}
          </button>
        </div>
      </div>
    </div>
  )
}
