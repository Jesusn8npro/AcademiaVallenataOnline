import React, { useState } from 'react'
import { supabase } from '../../servicios/clienteSupabase'
import './ModalCompletarEmail.css'

interface ModalCompletarEmailProps {
    mostrar: boolean
    setMostrar: (mostrar: boolean) => void
    usuarioId: string
    onEmailGuardado?: () => void
}

export default function ModalCompletarEmail({ mostrar, setMostrar, usuarioId, onEmailGuardado }: ModalCompletarEmailProps) {
    const [email, setEmail] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [error, setError] = useState('')
    const [exito, setExito] = useState(false)

    const validarEmail = (correo: string) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
        return regex.test(correo)
    }

    const guardarEmail = async () => {
        setError('')
        setExito(false)

        // Validar email
        if (!email.trim()) {
            setError('Por favor ingresa tu email')
            return
        }

        if (!validarEmail(email)) {
            setError('Email inválido. Por favor verifica')
            return
        }

        setGuardando(true)

        try {
            // 1. Actualizar auth.users
            const { error: errorAuth } = await supabase.auth.updateUser({ email })

            if (errorAuth) {
                throw new Error(errorAuth.message || 'Error al actualizar email en autenticación')
            }

            // 2. Actualizar tabla perfiles
            const { error: errorPerfil } = await supabase
                .from('perfiles')
                .update({ correo_electronico: email })
                .eq('id', usuarioId)

            if (errorPerfil) {
                throw new Error(errorPerfil.message || 'Error al guardar email en perfil')
            }

            // Éxito
            setExito(true)
            setEmail('')

            // Cerrar modal después de 1.5 segundos
            setTimeout(() => {
                setMostrar(false)
                onEmailGuardado?.()
            }, 1500)

        } catch (err: any) {
            setError(err.message || 'Error al guardar email. Intenta de nuevo')
        } finally {
            setGuardando(false)
        }
    }

    const cerrar = () => {
        setMostrar(false)
        setError('')
        setEmail('')
        setExito(false)
    }

    if (!mostrar) return null

    return (
        <div className="mce-modal-fondo" onClick={cerrar}>
            <div className="mce-modal-contenedor" onClick={(e) => e.stopPropagation()}>
                {/* Botón cerrar */}
                <button className="mce-boton-cerrar" onClick={cerrar}>
                    ✕
                </button>

                {exito ? (
                    // Pantalla de éxito
                    <div className="mce-contenido-exito">
                        <div className="mce-icono-exito">✓</div>
                        <h2>¡Email guardado!</h2>
                        <p>Tu email ha sido actualizado correctamente.</p>
                        <p className="mce-subtexto">Ahora podrás acceder con email y contraseña.</p>
                    </div>
                ) : (
                    // Formulario
                    <div className="mce-contenido">
                        <h2>Completa tu registro</h2>
                        <p className="mce-descripcion">
                            Para mayor seguridad, agrega tu email. Esto te permitirá acceder también con email y contraseña en el futuro.
                        </p>

                        <div className="mce-campo">
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && guardarEmail()}
                                placeholder="tu@email.com"
                                className="mce-input"
                                disabled={guardando}
                            />
                            {error && <span className="mce-error">{error}</span>}
                        </div>

                        <div className="mce-botones">
                            <button
                                className="mce-boton-primario"
                                onClick={guardarEmail}
                                disabled={guardando || !email.trim()}
                            >
                                {guardando ? 'Guardando...' : '💾 Guardar email'}
                            </button>
                            <button
                                className="mce-boton-secundario"
                                onClick={cerrar}
                                disabled={guardando}
                            >
                                Completar después
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
