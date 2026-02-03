import React, { useState, useEffect } from 'react'
import {
    Search, Filter, RefreshCw, MessageSquare,
    Users, CheckCircle, Clock, DollarSign,
    ChevronLeft, ChevronRight, X, Phone, Mail,
    MapPin, Calendar, ShoppingBag, Send, AlertCircle
} from 'lucide-react'
import { supabase as clienteSupabase } from '../../../servicios/supabaseCliente'
import './AdminChats.css'

// Interfaces
interface Lead {
    id: string
    nombre: string
    apellido: string
    email: string
    whatsapp: string
    ciudad: string
    direccion: string
    tipo_consulta: string
    estado: string
    created_at: string
    source: string
    converted: boolean
    productos_consultados: string[]
    probabilidad_compra: number
    valor_potencial: number
    notas_adicionales: string
    contexto_inicial: string
    chat_id: string
}

interface Mensaje {
    id: string
    session_id: string
    message: {
        type: string
        data: {
            content: string
        }
    } | any
    created_at: string
}

export default function AdminChats() {
    const [leads, setLeads] = useState<Lead[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filtros
    const [busqueda, setBusqueda] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')
    const [filtroInteres, setFiltroInteres] = useState('todos')

    // Paginación
    const [paginaActual, setPaginaActual] = useState(1)
    const leadsPorPagina = 9

    // Modales
    const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null)
    const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false)
    const [mostrarModalChat, setMostrarModalChat] = useState(false)
    const [mensajesChat, setMensajesChat] = useState<Mensaje[]>([])
    const [cargandoChat, setCargandoChat] = useState(false)

    // Estadísticas
    const [stats, setStats] = useState({
        total: 0,
        nuevos: 0,
        convertidos: 0,
        pendientes: 0,
        tasaConversion: 0,
        valorPotencial: 0
    })

    // Cargar datos
    const cargarLeads = async () => {
        try {
            setLoading(true)
            const { data, error } = await clienteSupabase
                .from('leads_chats_anonimos')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error

            setLeads(data || [])
            calcularEstadisticas(data || [])
        } catch (err: any) {
            console.error('Error cargando leads:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const calcularEstadisticas = (datos: Lead[]) => {
        const total = datos.length
        const convertidos = datos.filter(l => l.converted).length
        const pendientes = datos.filter(l => l.estado === 'pendiente' || l.estado === 'activo').length
        // @ts-ignore - Assuming created_at is string and we check if it's recent (last 24h)
        const nuevos = datos.filter(l => {
            const fecha = new Date(l.created_at)
            const hoy = new Date()
            return (hoy.getTime() - fecha.getTime()) < (24 * 60 * 60 * 1000)
        }).length

        // Sumar valor potencial seguro
        const valor = datos.reduce((acc, curr) => acc + (Number(curr.valor_potencial) || 0), 0)

        setStats({
            total,
            nuevos,
            convertidos,
            pendientes,
            tasaConversion: total > 0 ? Math.round((convertidos / total) * 100) : 0,
            valorPotencial: valor
        })
    }

    useEffect(() => {
        cargarLeads()
    }, [])

    // Cargar conversación
    const cargarConversacion = async (lead: Lead) => {
        try {
            setCargandoChat(true)
            setLeadSeleccionado(lead)
            setMostrarModalChat(true)

            // Usar chat_id del lead para buscar mensajes en chats_envivo_academia
            // La tabla chats_envivo_academia usa 'session_id' que corresponde al 'chat_id' del lead
            const { data, error } = await clienteSupabase
                .from('chats_envivo_academia')
                .select('*')
                .eq('session_id', lead.chat_id)
                .order('created_at', { ascending: true })

            if (error) throw error
            setMensajesChat(data || [])

        } catch (err) {
            console.error('Error cargando chat:', err)
        } finally {
            setCargandoChat(false)
        }
    }

    // Filtrado
    const leadsFiltrados = leads.filter(lead => {
        const cumpleBusqueda =
            lead.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
            lead.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
            lead.ciudad?.toLowerCase().includes(busqueda.toLowerCase())

        const cumpleEstado = filtroEstado === 'todos' || lead.estado === filtroEstado

        // Filtro de interés basado en probabilidad
        let cumpleInteres = true
        if (filtroInteres !== 'todos') {
            const prob = lead.probabilidad_compra || 0
            if (filtroInteres === 'alto') cumpleInteres = prob >= 70
            if (filtroInteres === 'medio') cumpleInteres = prob >= 40 && prob < 70
            if (filtroInteres === 'bajo') cumpleInteres = prob < 40
        }

        return cumpleBusqueda && cumpleEstado && cumpleInteres
    })

    // Paginación Lógica
    const indiceUltimoLead = paginaActual * leadsPorPagina
    const indicePrimerLead = indiceUltimoLead - leadsPorPagina
    const leadsActuales = leadsFiltrados.slice(indicePrimerLead, indiceUltimoLead)
    const totalPaginas = Math.ceil(leadsFiltrados.length / leadsPorPagina)

    const cambiarPagina = (numero: number) => setPaginaActual(numero)

    // Renderizado de mensajes
    const renderizarMensaje = (msg: Mensaje) => {
        let contenido = ''
        let tipo = 'desconocido'
        let esUsuario = false

        // Intentar parsear si es string, o usar directo si es objeto
        let messageBody = msg.message
        if (typeof messageBody === 'string') {
            try {
                messageBody = JSON.parse(messageBody)
            } catch (e) {
                // es un string plano
                contenido = messageBody
            }
        }

        // Estructura LangChain / estandar del proyecto
        if (messageBody?.type === 'human' || messageBody?.type === 'user') {
            esUsuario = true
            contenido = messageBody.content || messageBody.text
        } else if (messageBody?.type === 'ai' || messageBody?.type === 'assistant') {
            esUsuario = false
            contenido = messageBody.content || messageBody.text
        } else if (messageBody?.role) {
            // Estructura OpenAI standard
            esUsuario = messageBody.role === 'user'
            contenido = messageBody.content
        } else {
            // Fallback
            contenido = JSON.stringify(messageBody)
        }

        return (
            <div className={`mensaje-chat-admin ${esUsuario ? 'usuario' : 'bot'}`} key={msg.id}>
                <div className="mensaje-chat-header">
                    <span>{esUsuario ? 'Usuario' : 'Bot'}</span>
                    <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="mensaje-chat-contenido">
                    {contenido}
                </div>
            </div>
        )
    }

    return (
        <div className="admin-chats">
            <header className="header-admin">
                <div className="titulo-seccion">
                    <h1>Gestión de Chats y Leads</h1>
                    <p>Supervisa, analiza y administra las interacciones del chat en vivo</p>
                </div>
                <div className="acciones-header">
                    <button onClick={cargarLeads} className="btn-actualizar" disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="estadisticas-grid">
                <div className="stat-card total">
                    <div className="stat-icon"><MessageSquare /></div>
                    <div className="stat-content">
                        <h3>{stats.total}</h3>
                        <p>Total Conversaciones</p>
                    </div>
                </div>

                <div className="stat-card nuevos">
                    <div className="stat-icon"><Clock /></div>
                    <div className="stat-content">
                        <h3>{stats.nuevos}</h3>
                        <p>Nuevos (24h)</p>
                    </div>
                </div>

                <div className="stat-card convertidos">
                    <div className="stat-icon"><CheckCircle /></div>
                    <div className="stat-content">
                        <h3>{stats.convertidos}</h3>
                        <p>Leads Convertidos</p>
                    </div>
                </div>

                <div className="stat-card conversion">
                    <div className="stat-icon"><TrendingUpIcon /></div>
                    <div className="stat-content">
                        <h3>{stats.tasaConversion}%</h3>
                        <p>Tasa Conversión</p>
                    </div>
                </div>

                {/* <div className="stat-card valor">
          <div className="stat-icon"><DollarSign /></div>
          <div className="stat-content">
            <h3>${stats.valorPotencial.toLocaleString()}</h3>
            <p>Valor Potencial</p>
          </div>
        </div> */}
            </div>

            {/* Filtros */}
            <div className="filtros-panel">
                <div className="busqueda-container">
                    <div className="input-group">
                        <Search className="input-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o ciudad..."
                            value={busqueda}
                            onChange={(e) => {
                                setBusqueda(e.target.value)
                                setPaginaActual(1)
                            }}
                            className="campo-busqueda"
                        />
                    </div>
                </div>

                <div className="filtros-container">
                    <select
                        className="filtro-select"
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                    >
                        <option value="todos">Todos los Estados</option>
                        <option value="activo">Activos</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="cerrado">Cerrados</option>
                    </select>

                    <select
                        className="filtro-select"
                        value={filtroInteres}
                        onChange={(e) => setFiltroInteres(e.target.value)}
                    >
                        <option value="todos">Cualquier Interés</option>
                        <option value="alto">Alto ({'>'}70%)</option>
                        <option value="medio">Medio (40-70%)</option>
                        <option value="bajo">Bajo ({'<'}40%)</option>
                    </select>
                </div>
            </div>

            {/* Grid de Leads */}
            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Cargando leads...</p>
                </div>
            ) : leadsFiltrados.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📭</div>
                    <h3>No se encontraron conversaciones</h3>
                    <p>Intenta ajustar los filtros o tu búsqueda</p>
                </div>
            ) : (
                <>
                    <div className="leads-grid">
                        {leadsActuales.map((lead) => (
                            <div key={lead.id} className="lead-card">
                                <div className="lead-header">
                                    <div>
                                        <h3 className="lead-nombre">{lead.nombre || 'Usuario Anónimo'} {lead.apellido || ''}</h3>
                                        <span className="lead-id">ID: {lead.id.substring(0, 8)}...</span>
                                    </div>
                                    <div className="lead-badges">
                                        <span className={`estado-badge estado-${lead.estado || 'default'}`}>
                                            {lead.estado || 'N/A'}
                                        </span>
                                        {lead.converted && <span className="convertido-badge" title="Lead Convertido">🌟</span>}
                                    </div>
                                </div>

                                <div className="lead-content">
                                    <div className="contacto-info">
                                        {lead.email && (
                                            <div className="contacto-item">
                                                <Mail className="contacto-icon" />
                                                <span className="contacto-texto">{lead.email}</span>
                                            </div>
                                        )}
                                        {lead.whatsapp && (
                                            <div className="contacto-item">
                                                <Phone className="contacto-icon" />
                                                <span className="contacto-texto">{lead.whatsapp}</span>
                                            </div>
                                        )}
                                        {lead.ciudad && (
                                            <div className="contacto-item">
                                                <MapPin className="contacto-icon" />
                                                <span className="contacto-texto">{lead.ciudad}</span>
                                            </div>
                                        )}
                                    </div>

                                    {lead.contexto_inicial && (
                                        <div className="contexto-inicial">
                                            <p>"{lead.contexto_inicial.length > 80 ? lead.contexto_inicial.substring(0, 80) + '...' : lead.contexto_inicial}"</p>
                                        </div>
                                    )}

                                    <div className="metricas-lead">
                                        <div className="metrica">
                                            <span className="metrica-label">Probabilidad</span>
                                            <span className={`metrica-valor ${(lead.probabilidad_compra || 0) > 70 ? 'interes-alto' :
                                                (lead.probabilidad_compra || 0) > 40 ? 'interes-medio' : 'interes-bajo'
                                                }`}>
                                                {lead.probabilidad_compra || 0}%
                                            </span>
                                        </div>
                                        <div className="metrica">
                                            <span className="metrica-label">Interés</span>
                                            <span className="metrica-valor">{lead.tipo_consulta || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="fecha-lead">
                                        <Calendar className="fecha-icon" size={14} />
                                        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="lead-actions">
                                    <button
                                        className="btn-action ver-detalle"
                                        onClick={() => {
                                            setLeadSeleccionado(lead)
                                            setMostrarModalDetalle(true)
                                        }}
                                    >
                                        Ver Detalles
                                    </button>
                                    <button
                                        className="btn-action ver-chat"
                                        onClick={() => cargarConversacion(lead)}
                                    >
                                        Ver Chat
                                    </button>
                                    {lead.whatsapp && (
                                        <button
                                            className="btn-action whatsapp"
                                            onClick={() => window.open(`https://wa.me/${lead.whatsapp}`, '_blank')}
                                        >
                                            <Phone size={14} /> Link
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación */}
                    {totalPaginas > 1 && (
                        <div className="paginacion">
                            <button
                                onClick={() => cambiarPagina(paginaActual - 1)}
                                disabled={paginaActual === 1}
                                className="btn-pagina"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div className="info-pagina">
                                <span>Página {paginaActual} de {totalPaginas}</span>
                                <span className="total-resultados">{leadsFiltrados.length} resultados</span>
                            </div>
                            <button
                                onClick={() => cambiarPagina(paginaActual + 1)}
                                disabled={paginaActual === totalPaginas}
                                className="btn-pagina"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modal Detalles */}
            {mostrarModalDetalle && leadSeleccionado && (
                <div className="modal-overlay" onClick={() => setMostrarModalDetalle(false)}>
                    <div className="modal-content modal-detalle" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Detalles del Lead</h3>
                            <button className="btn-cerrar" onClick={() => setMostrarModalDetalle(false)}>
                                <X />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detalle-grid">
                                <div className="detalle-seccion">
                                    <h4>Información Personal</h4>
                                    <div className="detalle-items">
                                        <div className="detalle-item"><strong>Nombre:</strong> <span>{leadSeleccionado.nombre} {leadSeleccionado.apellido}</span></div>
                                        <div className="detalle-item"><strong>Email:</strong> <span>{leadSeleccionado.email || '-'}</span></div>
                                        <div className="detalle-item"><strong>WhatsApp:</strong> <span>{leadSeleccionado.whatsapp || '-'}</span></div>
                                        <div className="detalle-item"><strong>Ciudad:</strong> <span>{leadSeleccionado.ciudad || '-'}</span></div>
                                    </div>
                                </div>

                                <div className="detalle-seccion">
                                    <h4>Estado & Métricas</h4>
                                    <div className="detalle-items">
                                        <div className="detalle-item">
                                            <strong>Estado:</strong>
                                            <span className={`estado-badge estado-${leadSeleccionado.estado}`}>
                                                {leadSeleccionado.estado}
                                            </span>
                                        </div>
                                        <div className="detalle-item">
                                            <strong>Convertido:</strong>
                                            <span className={leadSeleccionado.converted ? 'convertido-si' : 'convertido-no'}>
                                                {leadSeleccionado.converted ? 'SÍ' : 'NO'}
                                            </span>
                                        </div>
                                        <div className="detalle-item"><strong>Probabilidad:</strong> <span>{leadSeleccionado.probabilidad_compra}%</span></div>
                                        {/* <div className="detalle-item"><strong>Potencial:</strong> <span>${leadSeleccionado.valor_potencial}</span></div> */}
                                    </div>
                                </div>

                                <div className="detalle-seccion full-width">
                                    <h4>Contexto del Chat</h4>
                                    <div className="contexto-box">
                                        "{leadSeleccionado.contexto_inicial || 'Sin contexto inicial'}"
                                    </div>
                                </div>

                                <div className="detalle-seccion full-width">
                                    <h4>Productos Consultados</h4>
                                    <div className="productos-consultados">
                                        {leadSeleccionado.productos_consultados && leadSeleccionado.productos_consultados.length > 0 ? (
                                            leadSeleccionado.productos_consultados.map((prod, idx) => (
                                                <span key={idx} className="producto-item">{prod}</span>
                                            ))
                                        ) : (
                                            <span>No se registraron productos específicos.</span>
                                        )}
                                    </div>
                                </div>

                                {leadSeleccionado.notas_adicionales && (
                                    <div className="detalle-seccion full-width">
                                        <h4>Notas Adicionales</h4>
                                        <div className="notas-box">
                                            {leadSeleccionado.notas_adicionales}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal cerrar" onClick={() => setMostrarModalDetalle(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Chat */}
            {mostrarModalChat && leadSeleccionado && (
                <div className="modal-overlay" onClick={() => setMostrarModalChat(false)}>
                    <div className="modal-content modal-conversaciones" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Conversación con {leadSeleccionado.nombre}</h3>
                            <button className="btn-cerrar" onClick={() => setMostrarModalChat(false)}>
                                <X />
                            </button>
                        </div>
                        <div className="modal-body">
                            {cargandoChat ? (
                                <div className="loading-container">
                                    <div className="loading-spinner"></div>
                                </div>
                            ) : mensajesChat.length === 0 ? (
                                <div className="empty-state">
                                    <p>No hay historial de mensajes para esta sesión.</p>
                                </div>
                            ) : (
                                <div className="conversaciones-container">
                                    {mensajesChat.map(msg => renderizarMensaje(msg))}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal cerrar" onClick={() => setMostrarModalChat(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function TrendingUpIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    )
}
