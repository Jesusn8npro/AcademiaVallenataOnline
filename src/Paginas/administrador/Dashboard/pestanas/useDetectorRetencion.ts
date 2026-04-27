import { useState, useEffect } from 'react'
import { supabase } from '../../../../servicios/clienteSupabase'

export interface UsuarioEnRiesgo {
    id: string
    nombre: string
    apellido: string
    correo_electronico: string
    suscripcion: string
    puntuacionRiesgo: number
    motivos: string[]
    ultimaActividad: string
    diasInactivo: number
    cursosCompletados: number
    progresoPromedio: number
    url_foto_perfil?: string
}

export function useDetectorRetencion() {
    const [usuariosEnRiesgo, setUsuariosEnRiesgo] = useState<UsuarioEnRiesgo[]>([])
    const [cargando, setCargando] = useState(false)
    const [mostrarDetalle, setMostrarDetalle] = useState(false)
    const [estadisticas, setEstadisticas] = useState({
        totalEnRiesgo: 0, riesgoAlto: 0, riesgoMedio: 0, riesgoBajo: 0
    })

    useEffect(() => {
        detectarUsuariosEnRiesgo()
    }, [])

    const detectarUsuariosEnRiesgo = async () => {
        try {
            setCargando(true)
            const { data: usuarios } = await supabase
                .from('perfiles')
                .select('id, nombre, apellido, correo_electronico, suscripcion, url_foto_perfil, created_at')
                .eq('rol', 'estudiante').eq('eliminado', false)

            if (!usuarios) return

            const usuariosConRiesgo: UsuarioEnRiesgo[] = []
            for (const usuario of usuarios) {
                const riesgoData = await calcularRiesgoUsuario(usuario)
                if (riesgoData.puntuacionRiesgo >= 30) usuariosConRiesgo.push(riesgoData)
            }

            const ordenados = usuariosConRiesgo.sort((a, b) => b.puntuacionRiesgo - a.puntuacionRiesgo).slice(0, 20)
            setUsuariosEnRiesgo(ordenados)
            calcularEstadisticas(ordenados)
        } catch { } finally {
            setCargando(false)
        }
    }

    const calcularRiesgoUsuario = async (usuario: any): Promise<UsuarioEnRiesgo> => {
        let puntuacionRiesgo = 0
        const motivos: string[] = []

        const { data: sesionReciente } = await supabase
            .from('sesiones_usuario')
            .select('ultima_actividad, tiempo_total_minutos, sesiones_totales')
            .eq('usuario_id', usuario.id)
            .order('ultima_actividad', { ascending: false })
            .limit(1).single()

        const ultimaActividad = sesionReciente?.ultima_actividad || usuario.created_at
        const diasInactivo = Math.floor((Date.now() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24))

        if (diasInactivo > 14) { puntuacionRiesgo += 40; motivos.push(`${diasInactivo} días sin actividad`) }
        else if (diasInactivo > 7) { puntuacionRiesgo += 25; motivos.push(`${diasInactivo} días inactivo`) }
        else if (diasInactivo > 3) { puntuacionRiesgo += 15; motivos.push(`${diasInactivo} días sin entrar`) }

        const tiempoTotal = sesionReciente?.tiempo_total_minutos || 0
        if (tiempoTotal < 30) { puntuacionRiesgo += 25; motivos.push('Muy poco tiempo en plataforma') }
        else if (tiempoTotal < 120) { puntuacionRiesgo += 15; motivos.push('Bajo tiempo de uso') }

        const { data: inscripciones } = await supabase
            .from('inscripciones').select('porcentaje_completado, completado').eq('usuario_id', usuario.id)

        let cursosCompletados = 0
        let progresoPromedio = 0

        if (inscripciones && inscripciones.length > 0) {
            cursosCompletados = inscripciones.filter((i: any) => i.completado).length
            progresoPromedio = Math.round(
                inscripciones.reduce((sum: number, i: any) => sum + (i.porcentaje_completado || 0), 0) / inscripciones.length
            )
            if (cursosCompletados === 0) { puntuacionRiesgo += 20; motivos.push('No ha completado ningún curso') }
            if (progresoPromedio < 10) { puntuacionRiesgo += 15; motivos.push('Progreso muy bajo en cursos') }
        } else {
            puntuacionRiesgo += 30; motivos.push('No está inscrito en ningún curso')
        }

        const diasRegistrado = Math.floor((Date.now() - new Date(usuario.created_at).getTime()) / (1000 * 60 * 60 * 24))
        if (diasRegistrado < 7 && (sesionReciente?.sesiones_totales || 0) <= 1) {
            puntuacionRiesgo += 20; motivos.push('Usuario nuevo sin engagement')
        }

        if (usuario.suscripcion === 'premium' && puntuacionRiesgo > 20) {
            puntuacionRiesgo += 10; motivos.push('Cliente premium en riesgo')
        }

        return {
            id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido,
            correo_electronico: usuario.correo_electronico, suscripcion: usuario.suscripcion,
            puntuacionRiesgo: Math.min(puntuacionRiesgo, 100), motivos,
            ultimaActividad, diasInactivo, cursosCompletados, progresoPromedio,
            url_foto_perfil: usuario.url_foto_perfil
        }
    }

    const calcularEstadisticas = (usuarios: UsuarioEnRiesgo[]) => {
        setEstadisticas({
            totalEnRiesgo: usuarios.length,
            riesgoAlto: usuarios.filter(u => u.puntuacionRiesgo >= 70).length,
            riesgoMedio: usuarios.filter(u => u.puntuacionRiesgo >= 50 && u.puntuacionRiesgo < 70).length,
            riesgoBajo: usuarios.filter(u => u.puntuacionRiesgo < 50).length
        })
    }

    const obtenerColorRiesgo = (puntuacion: number) => {
        if (puntuacion >= 70) return '#ef4444'
        if (puntuacion >= 50) return '#f59e0b'
        return '#6b7280'
    }

    const obtenerNivelRiesgo = (puntuacion: number) => {
        if (puntuacion >= 70) return 'ALTO'
        if (puntuacion >= 50) return 'MEDIO'
        return 'BAJO'
    }

    const toggleDetalle = () => setMostrarDetalle(!mostrarDetalle)

    const contactarUsuario = (usuario: UsuarioEnRiesgo) => {
        const mensaje = `Hola ${usuario.nombre}, hemos notado que llevas ${usuario.diasInactivo} días sin conectarte. ¿Te podemos ayudar con algo?`
        window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank')
    }

    const verPerfilCompleto = (_usuarioId: string) => {}

    return {
        usuariosEnRiesgo, cargando, mostrarDetalle, estadisticas,
        detectarUsuariosEnRiesgo, obtenerColorRiesgo, obtenerNivelRiesgo,
        toggleDetalle, contactarUsuario, verPerfilCompleto
    }
}
