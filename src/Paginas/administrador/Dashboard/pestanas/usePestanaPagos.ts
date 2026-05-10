import { useState, useEffect } from 'react'
import { supabase } from '../../../../servicios/clienteSupabase'

export interface EstadisticasPagos {
    totalIngresos: number
    ingresosEsteMes: number
    transaccionesExitosas: number
    transaccionesPendientes: number
    transaccionesRechazadas: number
    ticketPromedio: number
    crecimientoMensual: number
    tasaExito: number
}

export interface TransaccionPago {
    id: string
    usuario_nombre: string
    usuario_email: string
    monto: number
    estado: string
    fecha_transaccion: string
    metodo_pago: string
    referencia_pago: string
    paquete_nombre?: string
    moneda: string
}

export function usePestanaPagos() {
    const [cargandoPagos, setCargandoPagos] = useState(false)
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('30d')
    const [transaccionesRecientes, setTransaccionesRecientes] = useState<TransaccionPago[]>([])
    const [ingresosPorMes, setIngresosPorMes] = useState<any[]>([])
    const [estadisticasPagos, setEstadisticasPagos] = useState<EstadisticasPagos>({
        totalIngresos: 0, ingresosEsteMes: 0, transaccionesExitosas: 0,
        transaccionesPendientes: 0, transaccionesRechazadas: 0,
        ticketPromedio: 0, crecimientoMensual: 0, tasaExito: 0
    })

    useEffect(() => {
        cargarDatosPagos()
    }, [])

    async function cargarDatosPagos() {
        try {
            setCargandoPagos(true)
            await Promise.all([cargarEstadisticasPagos(), cargarTransaccionesRecientes(), cargarIngresosPorMes()])
        } catch { } finally {
            setCargandoPagos(false)
        }
    }

    async function cargarEstadisticasPagos() {
        try {
            const hoy = new Date()
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
            const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
            const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0)

            const { data: pagosExitosos } = await supabase
                .from('pagos_epayco').select('monto, created_at').eq('estado', 'exitoso')

            const totalIngresos = pagosExitosos?.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0) || 0
            const transaccionesExitosas = pagosExitosos?.length || 0

            const { data: pagosEsteMes } = await supabase
                .from('pagos_epayco').select('monto').eq('estado', 'exitoso')
                .gte('created_at', inicioMes.toISOString())
            const ingresosEsteMes = pagosEsteMes?.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0) || 0

            const { data: pagosMesAnterior } = await supabase
                .from('pagos_epayco').select('monto').eq('estado', 'exitoso')
                .gte('created_at', inicioMesAnterior.toISOString())
                .lte('created_at', finMesAnterior.toISOString())
            const ingresosMesAnterior = pagosMesAnterior?.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0) || 0

            const [{ count: pendientes }, { count: rechazadas }] = await Promise.all([
                supabase.from('pagos_epayco').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('pagos_epayco').select('*', { count: 'exact', head: true }).eq('estado', 'rechazado')
            ])

            const totalTransacciones = transaccionesExitosas + (pendientes || 0) + (rechazadas || 0)
            setEstadisticasPagos({
                totalIngresos,
                ingresosEsteMes,
                transaccionesExitosas,
                transaccionesPendientes: pendientes || 0,
                transaccionesRechazadas: rechazadas || 0,
                ticketPromedio: transaccionesExitosas > 0 ? totalIngresos / transaccionesExitosas : 0,
                crecimientoMensual: ingresosMesAnterior > 0
                    ? ((ingresosEsteMes - ingresosMesAnterior) / ingresosMesAnterior) * 100 : 0,
                tasaExito: totalTransacciones > 0 ? (transaccionesExitosas / totalTransacciones) * 100 : 0
            })
        } catch { }
    }

    async function cargarTransaccionesRecientes() {
        try {
            const { data: transacciones } = await supabase
                .from('pagos_epayco')
                .select(`
                    id, monto, estado, created_at, metodo_pago, referencia_pago, moneda,
                    usuario_id,
                    paquete_id,
                    paquetes_tutoriales:paquete_id(titulo)
                `)
                .order('created_at', { ascending: false }).limit(20)

            const usuarioIds = Array.from(new Set(((transacciones || []) as any[]).map((t: any) => t.usuario_id).filter(Boolean)));
            let perfilesMap: Record<string, any> = {};
            if (usuarioIds.length > 0) {
                const { data: perfiles } = await supabase.rpc('admin_listar_perfiles_con_pii', { p_ids: usuarioIds });
                if (Array.isArray(perfiles)) {
                    perfilesMap = Object.fromEntries(perfiles.map((p: any) => [p.id, { nombre: p.nombre, apellido: p.apellido, correo_electronico: p.correo_electronico }]));
                }
            }

            setTransaccionesRecientes(transacciones?.map((t: any) => ({
                id: t.id,
                usuario_nombre: perfilesMap[t.usuario_id] ? `${perfilesMap[t.usuario_id].nombre} ${perfilesMap[t.usuario_id].apellido}` : 'Usuario desconocido',
                usuario_email: perfilesMap[t.usuario_id]?.correo_electronico || 'No disponible',
                monto: parseFloat(t.monto) || 0,
                estado: t.estado,
                fecha_transaccion: t.created_at,
                metodo_pago: t.metodo_pago || 'No especificado',
                referencia_pago: t.referencia_pago || '',
                paquete_nombre: t.paquetes_tutoriales?.titulo || 'Sin paquete',
                moneda: t.moneda || 'COP'
            })) || [])
        } catch { }
    }

    async function cargarIngresosPorMes() {
        try {
            const mesesIngresos = []
            for (let i = 5; i >= 0; i--) {
                const fecha = new Date()
                fecha.setMonth(fecha.getMonth() - i)
                const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1)
                const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)

                const { data: pagosMes } = await supabase
                    .from('pagos_epayco').select('monto').eq('estado', 'exitoso')
                    .gte('created_at', inicioMes.toISOString()).lte('created_at', finMes.toISOString())

                mesesIngresos.push({
                    mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
                    ingresos: pagosMes?.reduce((sum, p) => sum + (parseFloat(p.monto) || 0), 0) || 0,
                    transacciones: pagosMes?.length || 0
                })
            }
            setIngresosPorMes(mesesIngresos)
        } catch { }
    }

    function obtenerColorEstado(estado: string): string {
        switch (estado) {
            case 'exitoso': return '#10b981'
            case 'pendiente': return '#f59e0b'
            case 'rechazado': return '#ef4444'
            default: return '#6b7280'
        }
    }

    function formatearMonto(monto: number, moneda: string = 'COP'): string {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: moneda, minimumFractionDigits: 0 }).format(monto)
    }

    function formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    function exportarDatosFinancieros() {
        const datos = { fecha_reporte: new Date().toISOString(), estadisticas: estadisticasPagos, ingresosPorMes, transacciones_recientes: transaccionesRecientes }
        const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `reporte_financiero_${new Date().toISOString().split('T')[0]}.json`
        a.click()
        window.URL.revokeObjectURL(url)
    }

    return {
        cargandoPagos, periodoSeleccionado, setPeriodoSeleccionado,
        transaccionesRecientes, ingresosPorMes, estadisticasPagos,
        cargarDatosPagos, obtenerColorEstado, formatearMonto, formatearFecha,
        exportarDatosFinancieros
    }
}
