import React from 'react'
import { RefreshCw, Eye, EyeOff, User, MessageCircle } from 'lucide-react'
import './DetectorRetencion.css'
import { useDetectorRetencion } from './useDetectorRetencion'
import type { UsuarioEnRiesgo } from './useDetectorRetencion'

const DetectorRetencion = () => {
    const {
        usuariosEnRiesgo, cargando, mostrarDetalle, estadisticas,
        detectarUsuariosEnRiesgo, obtenerColorRiesgo, obtenerNivelRiesgo,
        toggleDetalle, contactarUsuario, verPerfilCompleto
    } = useDetectorRetencion()

    return (
        <div className="detector-retencion">
            <div className="detector-header">
                <div className="header-info">
                    <h3>🎯 Detector de Retención</h3>
                    <p>Usuarios en riesgo de abandono</p>
                </div>
                <div className="header-actions">
                    <button className="btn-refresh" onClick={detectarUsuariosEnRiesgo} disabled={cargando}>
                        <RefreshCw size={14} className={cargando ? 'girando' : ''} />
                    </button>
                    <button className="btn-toggle-detalle" onClick={toggleDetalle}>
                        {mostrarDetalle ? <EyeOff size={14} style={{ marginRight: '0.5rem' }} /> : <Eye size={14} style={{ marginRight: '0.5rem' }} />}
                        {mostrarDetalle ? 'Ocultar' : 'Ver Todos'}
                    </button>
                </div>
            </div>

            <div className="estadisticas-riesgo">
                <div className="stat-riesgo total">
                    <span className="stat-numero">{estadisticas.totalEnRiesgo}</span>
                    <span className="stat-label">Total en Riesgo</span>
                </div>
                <div className="stat-riesgo alto">
                    <span className="stat-numero">{estadisticas.riesgoAlto}</span>
                    <span className="stat-label">Riesgo Alto</span>
                </div>
                <div className="stat-riesgo medio">
                    <span className="stat-numero">{estadisticas.riesgoMedio}</span>
                    <span className="stat-label">Riesgo Medio</span>
                </div>
                <div className="stat-riesgo bajo">
                    <span className="stat-numero">{estadisticas.riesgoBajo}</span>
                    <span className="stat-label">Riesgo Bajo</span>
                </div>
            </div>

            {cargando ? (
                <div className="loading-detectando">
                    <div className="spinner-retencion"></div>
                    <p>Analizando patrones de riesgo...</p>
                </div>
            ) : usuariosEnRiesgo.length === 0 ? (
                <div className="sin-riesgo">✅ ¡Excelente! No se detectaron usuarios en riesgo alto</div>
            ) : (
                <>
                    {!mostrarDetalle ? (
                        <div className="usuarios-compactos">
                            {usuariosEnRiesgo.slice(0, 5).map((usuario: UsuarioEnRiesgo) => (
                                <div key={usuario.id} className="usuario-compacto" style={{ borderLeftColor: obtenerColorRiesgo(usuario.puntuacionRiesgo) }}>
                                    <div className="usuario-info-compacto">
                                        <div className="foto-y-nombre">
                                            {usuario.url_foto_perfil ? (
                                                <img src={usuario.url_foto_perfil} alt={usuario.nombre} className="foto-mini" />
                                            ) : (
                                                <div className="avatar-mini"><User size={14} /></div>
                                            )}
                                            <div>
                                                <strong style={{ display: 'block' }}>{usuario.nombre} {usuario.apellido}</strong>
                                                <div className="nivel-riesgo" style={{ color: obtenerColorRiesgo(usuario.puntuacionRiesgo) }}>
                                                    {obtenerNivelRiesgo(usuario.puntuacionRiesgo)} ({usuario.puntuacionRiesgo}%)
                                                </div>
                                            </div>
                                        </div>
                                        <div className="acciones-rapidas">
                                            <button className="btn-accion-mini" onClick={() => contactarUsuario(usuario)}>
                                                <MessageCircle size={14} />
                                            </button>
                                            <button className="btn-accion-mini" onClick={() => verPerfilCompleto(usuario.id)}>
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="motivos-mini">
                                        {usuario.motivos[0]} {usuario.motivos.length > 1 ? `+${usuario.motivos.length - 1} más` : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="usuarios-detalle">
                            {usuariosEnRiesgo.map((usuario: UsuarioEnRiesgo) => (
                                <div key={usuario.id} className="usuario-detalle">
                                    <div className="usuario-header">
                                        <div className="usuario-foto-info">
                                            {usuario.url_foto_perfil ? (
                                                <img src={usuario.url_foto_perfil} alt={usuario.nombre} className="foto-perfil" />
                                            ) : (
                                                <div className="avatar-default"><User size={24} /></div>
                                            )}
                                            <div className="usuario-datos">
                                                <h4>{usuario.nombre} {usuario.apellido}</h4>
                                                <p className="email">{usuario.correo_electronico}</p>
                                                <div className="badges">
                                                    <span className={`badge-suscripcion ${usuario.suscripcion}`}>
                                                        {usuario.suscripcion?.toUpperCase()}
                                                    </span>
                                                    <span className="badge-riesgo" style={{ backgroundColor: `${obtenerColorRiesgo(usuario.puntuacionRiesgo)}20`, color: obtenerColorRiesgo(usuario.puntuacionRiesgo) }}>
                                                        {obtenerNivelRiesgo(usuario.puntuacionRiesgo)} {usuario.puntuacionRiesgo}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="usuario-acciones">
                                            <button className="btn-contactar" onClick={() => contactarUsuario(usuario)}>
                                                <MessageCircle size={14} style={{ marginRight: '0.25rem' }} />
                                                Contactar
                                            </button>
                                            <button className="btn-ver-perfil" onClick={() => verPerfilCompleto(usuario.id)}>
                                                <User size={14} style={{ marginRight: '0.25rem' }} />
                                                Ver Perfil
                                            </button>
                                        </div>
                                    </div>
                                    <div className="usuario-metricas">
                                        <div className="metrica">
                                            <span className="metrica-label">Días Inactivo:</span>
                                            <span className="metrica-valor">{usuario.diasInactivo}</span>
                                        </div>
                                        <div className="metrica">
                                            <span className="metrica-label">Cursos Completados:</span>
                                            <span className="metrica-valor">{usuario.cursosCompletados}</span>
                                        </div>
                                        <div className="metrica">
                                            <span className="metrica-label">Progreso Promedio:</span>
                                            <span className="metrica-valor">{usuario.progresoPromedio}%</span>
                                        </div>
                                    </div>
                                    <div className="motivos-riesgo">
                                        <strong>Motivos de riesgo:</strong>
                                        <ul>
                                            {usuario.motivos.map((motivo, idx) => (
                                                <li key={idx}>{motivo}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default DetectorRetencion
