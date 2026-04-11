import React, { useState, useEffect } from 'react'
import { useUsuario } from '../../contextos/UsuarioContext'
import { supabase } from '../../servicios/clienteSupabase'
import ModalCompletarEmail from './ModalCompletarEmail'
import BannerCompletarPerfil from './BannerCompletarPerfil'

export default function EmailCompletarWrapper() {
    const { usuario, estaAutenticado } = useUsuario()
    const [mostrarModal, setMostrarModal] = useState(false)
    const [mostrarBanner, setMostrarBanner] = useState(false)
    const [correoEsNull, setCorreoEsNull] = useState(false)
    const [cargando, setCargando] = useState(true)
    const [yaMostradoEnEstaSesion, setYaMostradoEnEstaSesion] = useState(false)

    // Verificar si el usuario tiene correo null
    useEffect(() => {
        if (!estaAutenticado || !usuario?.id) {
            setCargando(false)
            return
        }

        verificarCorreoUsuario()
    }, [estaAutenticado, usuario?.id])

    const verificarCorreoUsuario = async () => {
        try {
            setCargando(true)

            const { data: perfil, error } = await supabase
                .from('perfiles')
                .select('correo_electronico')
                .eq('id', usuario?.id)
                .single()

            if (error) {
                console.warn('Error verificando correo:', error)
                setCargando(false)
                return
            }

            // Verificar si correo es null o vacío
            const correoFaltante = !perfil?.correo_electronico || perfil.correo_electronico.trim() === ''

            if (correoFaltante && !yaMostradoEnEstaSesion) {
                setCorreoEsNull(true)
                setMostrarModal(true)
                setMostrarBanner(true)
                // Marcar que ya mostró el modal en esta sesión
                setYaMostradoEnEstaSesion(true)
            } else {
                setCorreoEsNull(false)
                setMostrarModal(false)
                setMostrarBanner(false)
            }
        } catch (err) {
            console.error('Error en verificarCorreoUsuario:', err)
        } finally {
            setCargando(false)
        }
    }

    const handleEmailGuardado = () => {
        // Cuando el usuario guarda el email
        setMostrarModal(false)
        setMostrarBanner(false)
        setCorreoEsNull(false)
    }

    const handleCerrarModal = () => {
        setMostrarModal(false)
        // El banner sigue mostrándose si el usuario cierra sin completar
    }

    // No mostrar nada si no está autenticado o está cargando
    if (!estaAutenticado || cargando) {
        return null
    }

    return (
        <>
            {/* Modal para completar email */}
            <ModalCompletarEmail
                mostrar={mostrarModal}
                setMostrar={handleCerrarModal}
                usuarioId={usuario?.id || ''}
                onEmailGuardado={handleEmailGuardado}
            />

            {/* Banner persistente */}
            <BannerCompletarPerfil mostrar={mostrarBanner} />
        </>
    )
}
