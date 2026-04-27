import { useState, useEffect } from 'react'
import { supabase } from '../../../../servicios/clienteSupabase'

interface ReporteMetricas {
    crecimientoUsuarios: number
    tasaCompletitud: number
    ingresosPotenciales: number
    cursosPopulares: string
    retenciionPromedio: number
    satisfaccionGeneral: number
}

export function usePestanaReportes() {
    const [cargandoReporte, setCargandoReporte] = useState(false)
    const [reportesSemana, setReportesSemana] = useState<any[]>([])
    const [reporteMetricas, setReporteMetricas] = useState<ReporteMetricas>({
        crecimientoUsuarios: 0, tasaCompletitud: 0, ingresosPotenciales: 0,
        cursosPopulares: '', retenciionPromedio: 0, satisfaccionGeneral: 0
    })

    useEffect(() => {
        cargarReportes()
    }, [])

    async function cargarReportes() {
        try {
            setCargandoReporte(true)
            await Promise.all([calcularMetricasNegocio(), generarReporteSemanal()])
        } catch { } finally {
            setCargandoReporte(false)
        }
    }

    async function calcularMetricasNegocio() {
        try {
            const hoy = new Date()
            const hace30Dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000)
            const hace60Dias = new Date(hoy.getTime() - 60 * 24 * 60 * 60 * 1000)

            const { count: usuariosUltimos30 } = await supabase.from('perfiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', hace30Dias.toISOString()).eq('eliminado', false)

            const { count: usuariosAnteriores30 } = await supabase.from('perfiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', hace60Dias.toISOString())
                .lt('created_at', hace30Dias.toISOString()).eq('eliminado', false)

            const crecimientoUsuarios = (usuariosAnteriores30 || 0) > 0
                ? Math.round((((usuariosUltimos30 || 0) - (usuariosAnteriores30 || 0)) / (usuariosAnteriores30 || 1)) * 100) : 0

            let tasaCompletitud = 0
            let cursosPopulares = 'N/A'

            try {
                const { data: inscripciones } = await supabase.from('inscripciones').select('completado')
                tasaCompletitud = inscripciones && inscripciones.length > 0
                    ? Math.round((inscripciones.filter((i: any) => i.completado).length / inscripciones.length) * 100) : 0
            } catch { }

            try {
                const { data: cursosData } = await supabase.from('inscripciones')
                    .select('paquete_id, paquetes_tutoriales(titulo)').limit(100)
                if (cursosData && cursosData.length > 0) {
                    const conteo: { [key: string]: number } = {}
                    cursosData.forEach((i: any) => {
                        const titulo = i.paquetes_tutoriales?.titulo || 'Sin título'
                        conteo[titulo] = (conteo[titulo] || 0) + 1
                    })
                    const masPopular = Object.entries(conteo).sort(([, a], [, b]) => b - a)[0]
                    cursosPopulares = masPopular ? masPopular[0] : 'N/A'
                }
            } catch { }

            const { count: totalUsuarios } = await supabase.from('perfiles')
                .select('*', { count: 'exact', head: true }).eq('eliminado', false)

            const { count: activosUltimos30 } = await supabase.from('sesiones_usuario')
                .select('usuario_id', { count: 'exact', head: true })
                .gte('ultima_actividad', hace30Dias.toISOString())

            setReporteMetricas({
                crecimientoUsuarios,
                tasaCompletitud,
                ingresosPotenciales: (usuariosUltimos30 || 0) * 50000,
                cursosPopulares,
                retenciionPromedio: (totalUsuarios || 0) > 0
                    ? Math.round(((activosUltimos30 || 0) / (totalUsuarios || 1)) * 100) : 0,
                satisfaccionGeneral: 85
            })
        } catch {
            setReporteMetricas({
                crecimientoUsuarios: 0, tasaCompletitud: 0, ingresosPotenciales: 0,
                cursosPopulares: 'N/A', retenciionPromedio: 0, satisfaccionGeneral: 85
            })
        }
    }

    async function generarReporteSemanal() {
        const ultimosSieteDias = []
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date()
            fecha.setDate(fecha.getDate() - i)
            const fechaStr = fecha.toISOString().split('T')[0]

            const { count: usuariosActivos } = await supabase.from('sesiones_usuario')
                .select('usuario_id', { count: 'exact', head: true }).eq('fecha', fechaStr)

            const { count: nuevosRegistros } = await supabase.from('perfiles')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', fechaStr + 'T00:00:00.000Z')
                .lte('created_at', fechaStr + 'T23:59:59.999Z').eq('eliminado', false)

            const { data: sesionesDelDia } = await supabase.from('sesiones_usuario')
                .select('tiempo_total_minutos').eq('fecha', fechaStr)
                .not('tiempo_total_minutos', 'is', null)

            let tiempoPromedio = 0
            if (sesionesDelDia && sesionesDelDia.length > 0) {
                tiempoPromedio = Math.round(
                    sesionesDelDia.reduce((sum: number, s: any) => sum + (s.tiempo_total_minutos || 0), 0) / sesionesDelDia.length
                )
            }

            ultimosSieteDias.push({
                fecha: fechaStr,
                fechaFormateada: fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }),
                usuariosActivos: usuariosActivos || 0,
                nuevosRegistros: nuevosRegistros || 0,
                tiempoPromedio,
                engagement: (usuariosActivos || 0) > 0 ? Math.round((tiempoPromedio / 60) * 100) : 0
            })
        }
        setReportesSemana(ultimosSieteDias)
    }

    function exportarReporteCSV() {
        const headers = ['Fecha', 'Usuarios Activos', 'Nuevos Registros', 'Tiempo Promedio (min)', 'Engagement Score']
        const rows = reportesSemana.map(dia => [dia.fecha, dia.usuariosActivos, dia.nuevosRegistros, dia.tiempoPromedio, dia.engagement])
        const blob = new Blob([[headers, ...rows].map(r => r.join(',')).join('\n')], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_academia_${new Date().toISOString().split('T')[0]}.csv`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    function exportarReportePDF() {
        let contenido = 'REPORTE ACADEMIA VALLENATA ONLINE\nFecha: ' + new Date().toLocaleDateString('es-ES') + '\n\n'
        contenido += '=== METRICAS PRINCIPALES ===\n'
        contenido += `• Crecimiento usuarios: ${reporteMetricas.crecimientoUsuarios}%\n`
        contenido += `• Tasa completitud: ${reporteMetricas.tasaCompletitud}%\n`
        contenido += `• Retención promedio: ${reporteMetricas.retenciionPromedio}%\n`
        contenido += `• Curso más popular: ${reporteMetricas.cursosPopulares}\n\n`
        contenido += '=== ACTIVIDAD SEMANAL ===\n'
        reportesSemana.forEach(dia => {
            contenido += `${dia.fechaFormateada}: ${dia.usuariosActivos} usuarios activos, ${dia.nuevosRegistros} nuevos registros\n`
        })
        contenido += '\n=== RECOMENDACIONES ===\n'
        contenido += '• Enfocar marketing en días de menor actividad\n'
        contenido += '• Promover curso más popular para aumentar retención\n'
        contenido += '• Implementar estrategias para usuarios inactivos\n\n'
        contenido += 'Generado automáticamente por el Panel de Administración'
        const blob = new Blob([contenido], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_completo_${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    function compartirReporteWhatsApp() {
        const resumen = `🎓 *Reporte Academia Vallenata Online*\n\n📈 Crecimiento: ${reporteMetricas.crecimientoUsuarios}%\n✅ Completitud: ${reporteMetricas.tasaCompletitud}%\n👥 Retención: ${reporteMetricas.retenciionPromedio}%\n🔥 Curso popular: ${reporteMetricas.cursosPopulares}\n\nUsuarios activos hoy: ${reportesSemana[reportesSemana.length - 1]?.usuariosActivos || 0}`
        window.open(`https://wa.me/?text=${encodeURIComponent(resumen)}`, '_blank')
    }

    function obtenerColorMetrica(valor: number, esPositivo: boolean = true): string {
        if (esPositivo) {
            if (valor > 20) return '#10b981'
            if (valor > 0) return '#f59e0b'
            return '#ef4444'
        } else {
            if (valor < 10) return '#ef4444'
            if (valor < 30) return '#f59e0b'
            return '#10b981'
        }
    }

    return {
        cargandoReporte, reportesSemana, reporteMetricas,
        cargarReportes, exportarReporteCSV, exportarReportePDF,
        compartirReporteWhatsApp, obtenerColorMetrica
    }
}
