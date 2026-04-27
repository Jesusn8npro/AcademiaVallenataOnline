import { useState, useEffect } from 'react'
import { supabase } from '../../../../servicios/clienteSupabase'
import React from 'react'
import { Mail, MessageCircle, Bell } from 'lucide-react'

export interface CampañaComunicacion {
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

interface EstadisticasComunicacion {
    totalCampañas: number
    emailsEnviados: number
    whatsappsEnviados: number
    notificacionesEnviadas: number
    tasaAperturaPromedio: number
    tasaRespuestaPromedio: number
}

export function usePestanaComunicaciones() {
    const [cargando, setCargando] = useState(false)
    const [modalNuevaCampaña, setModalNuevaCampaña] = useState(false)
    const [campañas, setCampañas] = useState<CampañaComunicacion[]>([])
    const [usuariosDisponibles, setUsuariosDisponibles] = useState<any[]>([])
    const [estadisticasComunicacion, setEstadisticasComunicacion] = useState<EstadisticasComunicacion>({
        totalCampañas: 0, emailsEnviados: 0, whatsappsEnviados: 0,
        notificacionesEnviadas: 0, tasaAperturaPromedio: 0, tasaRespuestaPromedio: 0
    })

    useEffect(() => {
        cargarDatosComunicacion()
    }, [])

    useEffect(() => {
        if (campañas.length > 0) calcularEstadisticas()
    }, [campañas])

    async function cargarDatosComunicacion() {
        try {
            setCargando(true)
            await Promise.all([cargarUsuariosDisponibles(), cargarCampañasExistentes()])
        } catch { } finally {
            setCargando(false)
        }
    }

    async function cargarUsuariosDisponibles() {
        const { data: usuarios } = await supabase
            .from('perfiles')
            .select('id, nombre, apellido, correo_electronico, whatsapp, rol, created_at, sesiones_usuario!left(ultima_actividad, esta_activo)')
            .eq('eliminado', false).eq('rol', 'estudiante')

        setUsuariosDisponibles(usuarios?.map((u: any) => ({
            ...u,
            nombre_completo: `${u.nombre} ${u.apellido}`,
            estado: u.sesiones_usuario?.[0]?.esta_activo ? 'activo' : 'inactivo',
            dias_registro: Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24))
        })) || [])
    }

    async function cargarCampañasExistentes() {
        setCampañas([
            { id: '1', titulo: 'Bienvenida Nuevos Estudiantes', tipo: 'email', estado: 'enviada', destinatarios: 45, fecha_creacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), fecha_enviada: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), tasa_apertura: 78.5, tasa_respuesta: 12.3 },
            { id: '2', titulo: 'Recordatorio Práctica Semanal', tipo: 'whatsapp', estado: 'programada', destinatarios: 89, fecha_creacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), fecha_programada: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString() },
            { id: '3', titulo: 'Nuevo Curso Disponible', tipo: 'notificacion', estado: 'borrador', destinatarios: 156, fecha_creacion: new Date().toISOString() }
        ])
    }

    function calcularEstadisticas() {
        setEstadisticasComunicacion({
            totalCampañas: campañas.length,
            emailsEnviados: campañas.filter(c => c.tipo === 'email' && c.estado === 'enviada').reduce((s, c) => s + c.destinatarios, 0),
            whatsappsEnviados: campañas.filter(c => c.tipo === 'whatsapp' && c.estado === 'enviada').reduce((s, c) => s + c.destinatarios, 0),
            notificacionesEnviadas: campañas.filter(c => c.tipo === 'notificacion' && c.estado === 'enviada').reduce((s, c) => s + c.destinatarios, 0),
            tasaAperturaPromedio: campañas.filter(c => c.tasa_apertura).reduce((s, c) => s + (c.tasa_apertura || 0), 0) / (campañas.filter(c => c.tasa_apertura).length || 1),
            tasaRespuestaPromedio: campañas.filter(c => c.tasa_respuesta).reduce((s, c) => s + (c.tasa_respuesta || 0), 0) / (campañas.filter(c => c.tasa_respuesta).length || 1)
        })
    }

    function exportarListaUsuarios() {
        const csv = ['Nombre,Email,WhatsApp,Estado,Días Registro']
            .concat(usuariosDisponibles.map(u => `"${u.nombre_completo}","${u.correo_electronico}","${u.whatsapp || 'N/A'}","${u.estado}",${u.dias_registro}`))
            .join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `usuarios_comunicacion_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    function obtenerIconoTipo(tipo: string) {
        switch (tipo) {
            case 'email': return React.createElement(Mail, { size: 16 })
            case 'whatsapp': return React.createElement(MessageCircle, { size: 16 })
            case 'notificacion': return React.createElement(Bell, { size: 16 })
            default: return React.createElement(Mail, { size: 16 })
        }
    }

    function obtenerColorEstado(estado: string): string {
        switch (estado) {
            case 'enviada': return '#10b981'
            case 'programada': return '#f59e0b'
            default: return '#6b7280'
        }
    }

    function formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }

    return {
        cargando, modalNuevaCampaña, setModalNuevaCampaña,
        campañas, setCampañas, usuariosDisponibles,
        estadisticasComunicacion, cargarDatosComunicacion,
        exportarListaUsuarios, obtenerIconoTipo, obtenerColorEstado, formatearFecha
    }
}
