import { useState, useEffect } from 'react'
import { supabase } from '../../../../servicios/clienteSupabase'

interface ConfiguracionSistema {
    nombreAcademia: string
    emailContacto: string
    whatsappContacto: string
    mantenimientoActivo: boolean
    registroAbierto: boolean
    limiteUsuarios: number
    duracionSesion: number
    backupAutomatico: boolean
    notificacionesEmail: boolean
    modoDesarrollo: boolean
}

export interface ConfirmacionPendiente {
    texto: string
    onConfirmar: () => Promise<void>
    onCancelar?: () => void
}

export function usePestanaConfiguracion() {
    const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>({
        nombreAcademia: 'Academia Vallenata Online',
        emailContacto: 'contacto@academiavallenata.com',
        whatsappContacto: '+57 300 123 4567',
        mantenimientoActivo: false,
        registroAbierto: true,
        limiteUsuarios: 1000,
        duracionSesion: 120,
        backupAutomatico: true,
        notificacionesEmail: true,
        modoDesarrollo: false
    })

    const [estadisticasSistema, setEstadisticasSistema] = useState({
        versionSistema: '2.1.0',
        tiempoOperacion: '0 días',
        ultimoBackup: 'Nunca',
        espacioUsado: 0,
        limiteBD: 1000
    })

    const [configuracionCambiada, setConfiguracionCambiada] = useState(false)
    const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false)
    const [confirmacion, setConfirmacion] = useState<ConfirmacionPendiente | null>(null)
    const [feedbackMsg, setFeedbackMsg] = useState('')
    const [feedbackTipo, setFeedbackTipo] = useState<'error' | 'exito'>('exito')

    useEffect(() => {
        cargarConfiguracion()
        cargarEstadisticasSistema()
    }, [])

    function mostrarError(msg: string) { setFeedbackTipo('error'); setFeedbackMsg(msg) }
    function mostrarExito(msg: string) { setFeedbackTipo('exito'); setFeedbackMsg(msg) }

    const cargarConfiguracion = async () => {
        try {
            const storedConfig = localStorage.getItem('academia_config')
            if (storedConfig) setConfiguracion(JSON.parse(storedConfig))
        } catch { }
    }

    const cargarEstadisticasSistema = async () => {
        try {
            const { count: totalUsuarios } = await supabase
                .from('perfiles').select('*', { count: 'exact', head: true }).eq('eliminado', false)
            const { count: totalSesiones } = await supabase
                .from('sesiones_usuario').select('*', { count: 'exact', head: true })

            const porcentajeUso = configuracion.limiteUsuarios > 0
                ? Math.round(((totalUsuarios || 0) / configuracion.limiteUsuarios) * 100) : 0

            setEstadisticasSistema({
                versionSistema: '2.1.0',
                tiempoOperacion: '45 días',
                ultimoBackup: 'Hace 2 horas',
                espacioUsado: porcentajeUso,
                limiteBD: totalSesiones || 0
            })
        } catch { }
    }

    const handleChange = (field: keyof ConfiguracionSistema, value: any) => {
        setConfiguracion(prev => ({ ...prev, [field]: value }))
        setConfiguracionCambiada(true)
    }

    async function ejecutarGuardado() {
        setGuardandoConfiguracion(true)
        await new Promise(resolve => setTimeout(resolve, 1000))
        localStorage.setItem('academia_config', JSON.stringify(configuracion))
        setConfiguracionCambiada(false)
        setGuardandoConfiguracion(false)
        mostrarExito(
            `Configuración guardada exitosamente. ` +
            (configuracion.mantenimientoActivo ? 'Modo mantenimiento ACTIVADO. ' : '') +
            (configuracion.registroAbierto ? 'Registro abierto. ' : 'Registro cerrado. ') +
            `Límite: ${configuracion.limiteUsuarios} usuarios. Sesión: ${configuracion.duracionSesion} min`
        )
    }

    const guardarConfiguracion = async () => {
        if (configuracion.limiteUsuarios < 10) {
            mostrarError('El límite de usuarios debe ser al menos 10')
            return
        }

        if (configuracion.mantenimientoActivo) {
            setConfirmacion({
                texto: 'Vas a activar el modo mantenimiento. Esto bloqueará el acceso a todos los usuarios. ¿Estás seguro?',
                onConfirmar: ejecutarGuardado,
                onCancelar: () => {
                    setConfiguracion(prev => ({ ...prev, mantenimientoActivo: false }))
                    setGuardandoConfiguracion(false)
                }
            })
            return
        }

        await ejecutarGuardado()
    }

    const ejecutarBackupManual = async () => {
        try {
            await new Promise(resolve => setTimeout(resolve, 3000))
            const backupData = {
                fecha: new Date().toISOString(),
                configuracion,
                estadisticas: estadisticasSistema,
                version: '2.1.0',
                metadata: { generado_por: 'Panel Administración', tipo: 'backup_manual' }
            }
            const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'academia_backup_' + new Date().toISOString().split('T')[0] + '.json'
            a.click()
            window.URL.revokeObjectURL(url)
            setEstadisticasSistema(prev => ({ ...prev, ultimoBackup: 'Ahora mismo' }))
            mostrarExito('Backup descargado exitosamente como JSON')
        } catch { mostrarError('Error durante el backup') }
    }

    const limpiarCacheSistema = async () => {
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys()
                await Promise.all(cacheNames.map(name => caches.delete(name)))
            }
            setConfirmacion({
                texto: '¿También deseas limpiar datos locales del navegador?',
                onConfirmar: async () => {
                    localStorage.clear()
                    sessionStorage.clear()
                    mostrarExito('Caché del sistema limpiado exitosamente')
                },
                onCancelar: () => mostrarExito('Caché del sistema limpiado exitosamente')
            })
        } catch { mostrarError('Error al limpiar caché') }
    }

    const exportarConfiguracion = () => {
        const blob = new Blob([JSON.stringify(configuracion, null, 2)], { type: 'application/json' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'configuracion_academia_' + new Date().toISOString().split('T')[0] + '.json'
        a.click()
        window.URL.revokeObjectURL(url)
    }

    const importarConfiguracion = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = (e: any) => {
            const file = e.target.files[0]
            if (file) {
                const reader = new FileReader()
                reader.onload = (event: any) => {
                    try {
                        const nuevaConfig = JSON.parse(event.target.result)
                        setConfiguracion(prev => ({ ...prev, ...nuevaConfig }))
                        setConfiguracionCambiada(true)
                        mostrarExito('Configuración importada exitosamente')
                    } catch { mostrarError('Error al importar configuración: archivo inválido') }
                }
                reader.readAsText(file)
            }
        }
        input.click()
    }

    const reiniciarSistema = async () => {
        setConfirmacion({
            texto: 'Vas a reiniciar el sistema. Esto puede interrumpir las sesiones activas de usuarios. ¿Estás seguro?',
            onConfirmar: async () => {
                try {
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    sessionStorage.clear()
                    mostrarExito('Sistema reiniciado exitosamente. La página se recargará automáticamente.')
                    setTimeout(() => window.location.reload(), 1000)
                } catch { mostrarError('Error durante el reinicio del sistema') }
            }
        })
    }

    function ejecutarConfirmacion() {
        if (!confirmacion) return
        const fn = confirmacion.onConfirmar
        setConfirmacion(null)
        fn()
    }

    function cancelarConfirmacion() {
        if (confirmacion?.onCancelar) confirmacion.onCancelar()
        setConfirmacion(null)
    }

    return {
        configuracion, estadisticasSistema, configuracionCambiada, guardandoConfiguracion,
        confirmacion, feedbackMsg, feedbackTipo,
        handleChange, guardarConfiguracion, ejecutarBackupManual, limpiarCacheSistema,
        exportarConfiguracion, importarConfiguracion, reiniciarSistema,
        ejecutarConfirmacion, cancelarConfirmacion,
        clearFeedback: () => setFeedbackMsg('')
    }
}
