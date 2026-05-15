import React, { useState } from 'react';
import { Search, RefreshCw, MessageSquare, Clock, CheckCircle, ChevronLeft, ChevronRight, X, Settings } from 'lucide-react';
import { useAdminChats, type Mensaje } from './useAdminChats';
import TarjetaLead from './TarjetaLead';
import ModalDetalleLead from './ModalDetalleLead';
import SeccionConfigAgente from './SeccionConfigAgente';
import './AdminChats.css';

function TrendingUpIcon(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
        </svg>
    );
}

function renderizarMensaje(msg: Mensaje) {
    let contenido = '';
    let esUsuario = false;
    let messageBody = msg.message;
    if (typeof messageBody === 'string') {
        try { messageBody = JSON.parse(messageBody); } catch { contenido = messageBody; }
    }
    if (messageBody?.type === 'human' || messageBody?.type === 'user') {
        esUsuario = true; contenido = messageBody.content || messageBody.text;
    } else if (messageBody?.type === 'ai' || messageBody?.type === 'assistant') {
        esUsuario = false; contenido = messageBody.content || messageBody.text;
    } else if (messageBody?.role) {
        esUsuario = messageBody.role === 'user'; contenido = messageBody.content;
    } else {
        contenido = JSON.stringify(messageBody);
    }
    return (
        <div className={`mensaje-chat-admin ${esUsuario ? 'usuario' : 'bot'}`} key={msg.id}>
            <div className="mensaje-chat-header">
                <span>{esUsuario ? 'Usuario' : 'Bot'}</span>
                <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
            </div>
            <div className="mensaje-chat-contenido">{contenido}</div>
        </div>
    );
}

export default function AdminChats() {
    const [tabActivo, setTabActivo] = useState<'leads' | 'config'>('leads');
    const {
        loading, error, stats,
        busqueda, setBusqueda,
        filtroEstado, setFiltroEstado,
        filtroInteres, setFiltroInteres,
        paginaActual, setPaginaActual,
        leadSeleccionado, setLeadSeleccionado,
        mostrarModalDetalle, setMostrarModalDetalle,
        mostrarModalChat, setMostrarModalChat,
        mensajesChat, cargandoChat,
        leadsFiltrados, leadsActuales, totalPaginas,
        cargarLeads, cargarConversacion
    } = useAdminChats();

    return (
        <div className="admin-chats">
            <header className="header-admin">
                <div className="titulo-seccion">
                    <h1>Gestión de Chats y Leads</h1>
                    <p>Supervisa, analiza y administra las interacciones del chat en vivo</p>
                </div>
                <div className="acciones-header">
                    {tabActivo === 'leads' && (
                        <button onClick={cargarLeads} className="btn-actualizar" disabled={loading}>
                            <RefreshCw size={18} className={loading ? 'spin' : ''} /> Actualizar
                        </button>
                    )}
                </div>
            </header>

            <div className="admin-tabs">
                <button className={`admin-tab ${tabActivo === 'leads' ? 'tab-activo' : ''}`} onClick={() => setTabActivo('leads')}>
                    <MessageSquare size={16} /> Conversaciones y Leads
                </button>
                <button className={`admin-tab ${tabActivo === 'config' ? 'tab-activo' : ''}`} onClick={() => setTabActivo('config')}>
                    <Settings size={16} /> Configuración del Agente
                </button>
            </div>

            {tabActivo === 'config' && <SeccionConfigAgente />}

            {tabActivo === 'leads' && (
              <>
                <div className="estadisticas-grid">
                    <div className="stat-card total"><div className="stat-icon"><MessageSquare /></div><div className="stat-content"><h3>{stats.total}</h3><p>Total Conversaciones</p></div></div>
                    <div className="stat-card nuevos"><div className="stat-icon"><Clock /></div><div className="stat-content"><h3>{stats.nuevos}</h3><p>Nuevos (24h)</p></div></div>
                    <div className="stat-card convertidos"><div className="stat-icon"><CheckCircle /></div><div className="stat-content"><h3>{stats.convertidos}</h3><p>Leads Convertidos</p></div></div>
                    <div className="stat-card conversion"><div className="stat-icon"><TrendingUpIcon /></div><div className="stat-content"><h3>{stats.tasaConversion}%</h3><p>Tasa Conversión</p></div></div>
                </div>

                <div className="filtros-panel">
                    <div className="busqueda-container">
                        <div className="input-group">
                            <Search className="input-icon" />
                            <input type="text" placeholder="Buscar por nombre, email o ciudad..." value={busqueda} onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} className="campo-busqueda" />
                        </div>
                    </div>
                    <div className="filtros-container">
                        <select className="filtro-select" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                            <option value="todos">Todos los Estados</option>
                            <option value="activo">Activos</option>
                            <option value="pendiente">Pendientes</option>
                            <option value="cerrado">Cerrados</option>
                        </select>
                        <select className="filtro-select" value={filtroInteres} onChange={(e) => setFiltroInteres(e.target.value)}>
                            <option value="todos">Cualquier Interés</option>
                            <option value="alto">Alto ({'>'}70%)</option>
                            <option value="medio">Medio (40-70%)</option>
                            <option value="bajo">Bajo ({'<'}40%)</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container"><div className="loading-spinner"></div><p>Cargando leads...</p></div>
                ) : leadsFiltrados.length === 0 ? (
                    <div className="empty-state"><div className="empty-icon">📭</div><h3>No se encontraron conversaciones</h3><p>Intenta ajustar los filtros o tu búsqueda</p></div>
                ) : (
                    <>
                        <div className="leads-grid">
                            {leadsActuales.map((lead) => (
                                <TarjetaLead
                                    key={lead.id}
                                    lead={lead}
                                    onVerDetalle={(l) => { setLeadSeleccionado(l); setMostrarModalDetalle(true); }}
                                    onVerChat={cargarConversacion}
                                />
                            ))}
                        </div>
                        {totalPaginas > 1 && (
                            <div className="paginacion">
                                <button onClick={() => setPaginaActual(paginaActual - 1)} disabled={paginaActual === 1} className="btn-pagina"><ChevronLeft size={20} /></button>
                                <div className="info-pagina">
                                    <span>Página {paginaActual} de {totalPaginas}</span>
                                    <span className="total-resultados">{leadsFiltrados.length} resultados</span>
                                </div>
                                <button onClick={() => setPaginaActual(paginaActual + 1)} disabled={paginaActual === totalPaginas} className="btn-pagina"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </>
                )}
              </>
            )}

            {mostrarModalDetalle && leadSeleccionado && (
                <ModalDetalleLead leadSeleccionado={leadSeleccionado} onCerrar={() => setMostrarModalDetalle(false)} />
            )}

            {mostrarModalChat && leadSeleccionado && (
                <div className="modal-overlay" onClick={() => setMostrarModalChat(false)}>
                    <div className="modal-content modal-conversaciones" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Conversación con {leadSeleccionado.nombre}</h3>
                            <button className="btn-cerrar" onClick={() => setMostrarModalChat(false)}><X /></button>
                        </div>
                        <div className="modal-body">
                            {cargandoChat ? (
                                <div className="loading-container"><div className="loading-spinner"></div></div>
                            ) : mensajesChat.length === 0 ? (
                                <div className="empty-state"><p>No hay historial de mensajes para esta sesión.</p></div>
                            ) : (
                                <div className="conversaciones-container">{mensajesChat.map(msg => renderizarMensaje(msg))}</div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-modal cerrar" onClick={() => setMostrarModalChat(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
