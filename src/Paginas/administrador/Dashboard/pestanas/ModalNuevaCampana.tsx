import React, { useState } from 'react'
import { X } from 'lucide-react'

interface CampañaComunicacion {
    id: string
    titulo: string
    tipo: 'email' | 'whatsapp' | 'notificacion'
    estado: 'borrador' | 'programada' | 'enviada'
    destinatarios: number
    fecha_creacion: string
    fecha_programada?: string
    fecha_enviada?: string
    tasa_apertura?: number
    tasa_respuesta?: number
}

interface Props {
    usuariosDisponibles: any[]
    onCreada: (campaña: CampañaComunicacion) => void
    onCerrar: () => void
}

const plantillasEmail = [
    { nombre: 'Bienvenida', asunto: '¡Bienvenido a Academia Vallenata Online! 🎵', contenido: '¡Hola [NOMBRE]!\n\n¡Bienvenido a nuestra academia! Estamos emocionados de tenerte con nosotros.\n\n🎵 ¿Qué puedes hacer ahora?\n• Explora nuestros cursos de acordeón\n• Prueba el simulador interactivo\n• Únete a nuestra comunidad\n\n¡Empecemos tu viaje musical!\n\nSaludos,\n    Equipo Academia Vallenata' },
    { nombre: 'Recordatorio Curso', asunto: '¡No olvides continuar tu curso! 📚', contenido: '¡Hola [NOMBRE]!\n\nNotamos que no has visitado tu curso en unos días.\n\n🎯 Tu progreso:\n• Curso: [CURSO]\n• Progreso: [PROGRESO]%\n• Última lección: [LECCION]\n\n¡Continúa aprendiendo y no pierdas el ritmo!\n\n[ENLACE_CURSO]' },
    { nombre: 'Nuevo Contenido', asunto: '🎉 Nuevo contenido disponible en tu curso', contenido: '¡Hola [NOMBRE]!\n\n¡Tenemos nuevo contenido para ti!\n\n🆕 Novedades:\n• [NUEVO_CONTENIDO]\n• Ejercicios prácticos\n• Partituras descargables\n\n¡No te lo pierdas!\n\nVer ahora: [ENLACE]' }
]

const plantillasWhatsApp = [
    { nombre: 'Recordatorio Amigable', contenido: '¡Hola [NOMBRE]! 👋\n\n¿Cómo vas con el acordeón? Recuerda que tienes contenido nuevo esperándote en la academia.\n\n¡Sigue practicando! 🎵' },
    { nombre: 'Motivacional', contenido: '¡[NOMBRE], no te rindas! 💪\n\nCada gran acordeonista empezó como principiante. Tu constancia es la clave del éxito.\n\n¡Vamos, continúa con tu siguiente lección! 🎶' }
]

export default function ModalNuevaCampana({ usuariosDisponibles, onCreada, onCerrar }: Props) {
    const [nuevaCampaña, setNuevaCampaña] = useState({
        titulo: '',
        tipo: 'email' as 'email' | 'whatsapp' | 'notificacion',
        mensaje: '',
        asunto: '',
        destinatarios: [] as string[],
        filtroDestinatarios: 'todos' as 'todos' | 'activos' | 'inactivos' | 'nuevos' | 'personalizado',
        fechaProgramada: '',
        horaEnvio: '09:00'
    })
    const [errorMsg, setErrorMsg] = useState('')

    function filtrarUsuarios() {
        switch (nuevaCampaña.filtroDestinatarios) {
            case 'activos': return usuariosDisponibles.filter(u => u.estado === 'activo')
            case 'inactivos': return usuariosDisponibles.filter(u => u.estado === 'inactivo')
            case 'nuevos': return usuariosDisponibles.filter(u => u.dias_registro <= 7)
            case 'personalizado': return usuariosDisponibles.filter(u => nuevaCampaña.destinatarios.includes(u.id))
            default: return usuariosDisponibles
        }
    }

    function aplicarPlantilla(plantilla: any) {
        setNuevaCampaña(prev => ({ ...prev, asunto: plantilla.asunto || prev.asunto, mensaje: plantilla.contenido }))
    }

    function enviarCampaña() {
        const destinatariosFiltrados = filtrarUsuarios()
        if (destinatariosFiltrados.length === 0) { setErrorMsg('No hay destinatarios válidos para esta campaña'); return }
        if (!nuevaCampaña.titulo.trim()) { setErrorMsg('El título es obligatorio'); return }
        if (!nuevaCampaña.mensaje.trim()) { setErrorMsg('El mensaje es obligatorio'); return }
        if (nuevaCampaña.tipo === 'email' && !nuevaCampaña.asunto.trim()) { setErrorMsg('El asunto es obligatorio para emails'); return }

        const campañaCreada: CampañaComunicacion = {
            id: Date.now().toString(),
            titulo: nuevaCampaña.titulo,
            tipo: nuevaCampaña.tipo,
            estado: nuevaCampaña.fechaProgramada ? 'programada' : 'enviada',
            destinatarios: destinatariosFiltrados.length,
            fecha_creacion: new Date().toISOString(),
            fecha_programada: nuevaCampaña.fechaProgramada
                ? new Date(nuevaCampaña.fechaProgramada + 'T' + nuevaCampaña.horaEnvio).toISOString() : undefined,
            fecha_enviada: !nuevaCampaña.fechaProgramada ? new Date().toISOString() : undefined,
            tasa_apertura: !nuevaCampaña.fechaProgramada ? Math.random() * 30 + 60 : undefined,
            tasa_respuesta: !nuevaCampaña.fechaProgramada ? Math.random() * 20 + 5 : undefined
        }
        onCreada(campañaCreada)
        onCerrar()
    }

    return (
        <div className="pc-modal-overlay" onClick={onCerrar}>
            <div className="pc-modal-content" onClick={e => e.stopPropagation()}>
                <div className="pc-modal-header">
                    <h3>📢 Nueva Campaña de Comunicación</h3>
                    <button className="pc-btn-close" onClick={onCerrar}><X size={20} /></button>
                </div>
                <div className="pc-modal-body">
                    {errorMsg && (
                        <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem', borderRadius: 8, marginBottom: '1rem' }}>
                            ❌ {errorMsg}
                        </div>
                    )}
                    <div className="pc-form-section">
                        <h4>📋 Configuración Básica</h4>
                        <div className="pc-form-group">
                            <label htmlFor="titulo">Título de la Campaña</label>
                            <input id="titulo" type="text" className="pc-form-control"
                                value={nuevaCampaña.titulo}
                                onChange={e => setNuevaCampaña({ ...nuevaCampaña, titulo: e.target.value })}
                                placeholder="Ej: Bienvenida nuevos estudiantes" />
                        </div>
                        <div className="pc-form-group">
                            <label htmlFor="tipo">Tipo de Comunicación</label>
                            <select id="tipo" className="pc-form-control"
                                value={nuevaCampaña.tipo}
                                onChange={e => setNuevaCampaña({ ...nuevaCampaña, tipo: e.target.value as any })}>
                                <option value="email">📧 Email</option>
                                <option value="whatsapp">💬 WhatsApp</option>
                                <option value="notificacion">🔔 Notificación</option>
                            </select>
                        </div>
                        {nuevaCampaña.tipo === 'email' && (
                            <div className="pc-form-group">
                                <label htmlFor="asunto">Asunto del Email</label>
                                <input id="asunto" type="text" className="pc-form-control"
                                    value={nuevaCampaña.asunto}
                                    onChange={e => setNuevaCampaña({ ...nuevaCampaña, asunto: e.target.value })}
                                    placeholder="Ej: ¡Bienvenido a Academia Vallenata!" />
                            </div>
                        )}
                    </div>
                    <div className="pc-form-section">
                        <h4>👥 Destinatarios ({filtrarUsuarios().length} usuarios)</h4>
                        <div className="pc-form-group">
                            <label htmlFor="filtro">Filtrar Destinatarios</label>
                            <select id="filtro" className="pc-form-control"
                                value={nuevaCampaña.filtroDestinatarios}
                                onChange={e => setNuevaCampaña({ ...nuevaCampaña, filtroDestinatarios: e.target.value as any })}>
                                <option value="todos">Todos los usuarios ({usuariosDisponibles.length})</option>
                                <option value="activos">Solo usuarios activos ({usuariosDisponibles.filter(u => u.estado === 'activo').length})</option>
                                <option value="inactivos">Solo usuarios inactivos ({usuariosDisponibles.filter(u => u.estado === 'inactivo').length})</option>
                                <option value="nuevos">Usuarios nuevos (últimos 7 días) ({usuariosDisponibles.filter(u => u.dias_registro <= 7).length})</option>
                            </select>
                        </div>
                    </div>
                    <div className="pc-form-section">
                        <h4>📝 Plantillas Rápidas</h4>
                        <div className="pc-templates-list">
                            {nuevaCampaña.tipo === 'email'
                                ? plantillasEmail.map((p, i) => <button key={i} className="pc-btn-template" onClick={() => aplicarPlantilla(p)}>{p.nombre}</button>)
                                : nuevaCampaña.tipo === 'whatsapp'
                                    ? plantillasWhatsApp.map((p, i) => <button key={i} className="pc-btn-template" onClick={() => aplicarPlantilla(p)}>{p.nombre}</button>)
                                    : null}
                        </div>
                    </div>
                    <div className="pc-form-section">
                        <h4>✍️ Contenido del Mensaje</h4>
                        <div className="pc-form-group">
                            <label htmlFor="mensaje">Mensaje</label>
                            <textarea id="mensaje" className="pc-form-control"
                                value={nuevaCampaña.mensaje}
                                onChange={e => setNuevaCampaña({ ...nuevaCampaña, mensaje: e.target.value })}
                                rows={8}
                                placeholder="Escribe tu mensaje aquí... Puedes usar [NOMBRE] para personalizar" />
                            <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Variables disponibles: [NOMBRE], [CURSO], [PROGRESO], [LECCION]</small>
                        </div>
                    </div>
                    <div className="pc-form-section">
                        <h4>⏰ Programación (Opcional)</h4>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <div className="pc-form-group" style={{ flex: 1 }}>
                                <label htmlFor="fecha">Fecha de Envío</label>
                                <input id="fecha" type="date" className="pc-form-control"
                                    value={nuevaCampaña.fechaProgramada}
                                    onChange={e => setNuevaCampaña({ ...nuevaCampaña, fechaProgramada: e.target.value })} />
                            </div>
                            <div className="pc-form-group" style={{ flex: 1 }}>
                                <label htmlFor="hora">Hora de Envío</label>
                                <input id="hora" type="time" className="pc-form-control"
                                    value={nuevaCampaña.horaEnvio}
                                    onChange={e => setNuevaCampaña({ ...nuevaCampaña, horaEnvio: e.target.value })} />
                            </div>
                        </div>
                        <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Déjalo vacío para enviar inmediatamente</small>
                    </div>
                </div>
                <div className="pc-modal-footer">
                    <button className="pc-btn-cancel" onClick={onCerrar}>Cancelar</button>
                    <button className="pc-btn-submit" onClick={enviarCampaña}>
                        {nuevaCampaña.fechaProgramada ? '⏰ Programar' : '🚀 Enviar Ahora'}
                    </button>
                </div>
            </div>
        </div>
    )
}
