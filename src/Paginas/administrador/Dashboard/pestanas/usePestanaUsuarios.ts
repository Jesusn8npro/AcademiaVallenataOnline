import { useState, useEffect } from 'react'
import { supabase } from '../../../../servicios/clienteSupabase'
import { useNavigate } from 'react-router-dom'

interface EstadisticasUsuarios {
    totalUsuarios: number
    nuevosEsteMes: number
    activosUltimos7Dias: number
    estudiantesActivos: number
    administradores: number
    usuariosConCursos: number
    promedioTiempoPlataforma: number
    tasaRetencion: number
}

export function usePestanaUsuarios() {
    const navigate = useNavigate()
    const [cargando, setCargando] = useState(false)
    const [usuariosRecientes, setUsuariosRecientes] = useState<any[]>([])
    const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios>({
        totalUsuarios: 0,
        nuevosEsteMes: 0,
        activosUltimos7Dias: 0,
        estudiantesActivos: 0,
        administradores: 0,
        usuariosConCursos: 0,
        promedioTiempoPlataforma: 0,
        tasaRetencion: 0
    })

    useEffect(() => {
        cargarEstadisticasUsuarios()
    }, [])

    async function cargarEstadisticasUsuarios() {
        try {
            setCargando(true)
            await Promise.all([cargarEstadisticasGenerales(), cargarUsuariosRecientes()])
        } catch { } finally {
            setCargando(false)
        }
    }

    async function cargarEstadisticasGenerales() {
        const { count: totalUsuarios } = await supabase
            .from('perfiles').select('*', { count: 'exact', head: true }).eq('eliminado', false)

        const inicioMes = new Date()
        inicioMes.setDate(1)
        const { count: nuevosEsteMes } = await supabase
            .from('perfiles').select('*', { count: 'exact', head: true })
            .gte('created_at', inicioMes.toISOString()).eq('eliminado', false)

        const hace7Dias = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { count: activosUltimos7Dias } = await supabase
            .from('sesiones_usuario').select('usuario_id', { count: 'exact', head: true })
            .gte('ultima_actividad', hace7Dias)

        const { count: estudiantesActivos } = await supabase
            .from('perfiles').select('*', { count: 'exact', head: true })
            .eq('rol', 'estudiante').eq('eliminado', false)

        const { count: administradores } = await supabase
            .from('perfiles').select('*', { count: 'exact', head: true })
            .eq('rol', 'administrador').eq('eliminado', false)

        const { count: usuariosConCursos } = await supabase
            .from('inscripciones').select('usuario_id', { count: 'exact', head: true })

        const { data: tiemposSesiones } = await supabase
            .from('sesiones_usuario').select('tiempo_total_minutos')
            .not('tiempo_total_minutos', 'is', null)

        let promedioTiempoPlataforma = 0
        if (tiemposSesiones && tiemposSesiones.length > 0) {
            const tiempoTotal = tiemposSesiones.reduce((sum, s) => sum + (s.tiempo_total_minutos || 0), 0)
            promedioTiempoPlataforma = Math.round(tiempoTotal / tiemposSesiones.length)
        }

        const hace30Dias = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        const { count: activosUltimos30Dias } = await supabase
            .from('sesiones_usuario').select('usuario_id', { count: 'exact', head: true })
            .gte('ultima_actividad', hace30Dias)

        const tasaRetencion = (totalUsuarios ?? 0) > 0
            ? Math.round(((activosUltimos30Dias ?? 0) / (totalUsuarios ?? 1)) * 100) : 0

        setEstadisticas({
            totalUsuarios: totalUsuarios || 0,
            nuevosEsteMes: nuevosEsteMes || 0,
            activosUltimos7Dias: activosUltimos7Dias || 0,
            estudiantesActivos: estudiantesActivos || 0,
            administradores: administradores || 0,
            usuariosConCursos: usuariosConCursos || 0,
            promedioTiempoPlataforma,
            tasaRetencion
        })
    }

    async function cargarUsuariosRecientes() {
        const { data: usuarios } = await supabase
            .from('perfiles')
            .select(`
                id, nombre, apellido, correo_electronico, rol, created_at, url_foto_perfil,
                sesiones_usuario!left(ultima_actividad, esta_activo)
            `)
            .eq('eliminado', false)
            .order('created_at', { ascending: false })
            .limit(8)
        setUsuariosRecientes(usuarios || [])
    }

    function irAGestionCompleta() {
        navigate('/administrador/usuarios')
    }

    function irAUsuarioEspecifico(usuarioId: string) {
        window.open(`/administrador/usuarios?usuario=${usuarioId}&pestana=actividad`, '_blank')
    }

    function formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    }

    function formatearTiempo(minutos: number): string {
        if (minutos < 60) return `${minutos}m`
        return `${Math.floor(minutos / 60)}h ${minutos % 60}m`
    }

    function obtenerEstadoUsuario(usuario: any): { texto: string; color: string } {
        if (!usuario.sesiones_usuario || usuario.sesiones_usuario.length === 0) {
            return { texto: 'Sin actividad', color: '#6b7280' }
        }
        const sesion = Array.isArray(usuario.sesiones_usuario)
            ? usuario.sesiones_usuario[0] : usuario.sesiones_usuario
        if (!sesion) return { texto: 'Sin actividad', color: '#6b7280' }
        if (sesion.esta_activo) return { texto: 'En línea', color: '#10b981' }
        const horas = (Date.now() - new Date(sesion.ultima_actividad).getTime()) / (1000 * 60 * 60)
        if (horas < 1) return { texto: 'Hace poco', color: '#f59e0b' }
        if (horas < 24) return { texto: 'Hoy', color: '#3b82f6' }
        return { texto: 'Inactivo', color: '#6b7280' }
    }

    return {
        cargando, usuariosRecientes, estadisticas,
        irAGestionCompleta, irAUsuarioEspecifico,
        formatearFecha, formatearTiempo, obtenerEstadoUsuario,
        navigate
    }
}
