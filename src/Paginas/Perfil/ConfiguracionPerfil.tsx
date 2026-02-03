import React, { useState, useEffect } from 'react'
import { supabase } from '../../servicios/supabaseCliente'
import { useUsuario } from '../../contextos/UsuarioContext'
import { usePerfilStore } from '../../stores/perfilStore'
import { useNavigate } from 'react-router-dom'
import './ConfiguracionPerfil.css'

export default function ConfiguracionPerfil() {
    const { usuario, cerrarSesion: cerrarSesionContext } = useUsuario()
    const { perfil, actualizarPerfil, resetear: resetearPerfil } = usePerfilStore()
    const navigate = useNavigate()

    const [cargando, setCargando] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [membresiaActual, setMembresiaActual] = useState<any>(null)
    const [historialPagos, setHistorialPagos] = useState<any[]>([])

    const [configuraciones, setConfiguraciones] = useState({
        notificaciones_email: true,
        notificaciones_push: true,
        publico_perfil: true
    })

    const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false)
    const [mostrarFormularioContrasena, setMostrarFormularioContrasena] = useState(false)
    const [correoRecuperar, setCorreoRecuperar] = useState('')
    const [cargandoRecuperar, setCargandoRecuperar] = useState(false)
    const [mensajeRecuperar, setMensajeRecuperar] = useState('')
    const [confirmacionEliminar, setConfirmacionEliminar] = useState('')

    const [datosPersonales, setDatosPersonales] = useState({
        nombre_completo: '',
        correo_electronico: '',
        whatsapp: '',
        ciudad: '',
        fecha_creacion: ''
    })

    useEffect(() => {
        cargarDatosUsuario()
    }, [usuario])

    async function cargarDatosUsuario() {
        if (!usuario?.id) return

        try {
            setCargando(true)

            // Obtener perfil actualizado
            const { data: perfilData, error: errorPerfil } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', usuario.id)
                .single()

            if (errorPerfil) throw errorPerfil

            if (perfilData?.suscripcion && perfilData.suscripcion !== 'free') {
                const { data: membresia } = await supabase
                    .from('membresias')
                    .select('*')
                    .eq('nombre', perfilData.suscripcion)
                    .single()
                setMembresiaActual(membresia)
            }

            const { data: pagos } = await supabase
                .from('pagos_epayco')
                .select('*')
                .eq('usuario_id', usuario.id)
                .eq('estado', 'Aceptada')
                .order('created_at', { ascending: false })
                .limit(3)

            setHistorialPagos(pagos || [])

            setConfiguraciones({
                notificaciones_email: perfilData.notificaciones_email ?? true,
                notificaciones_push: perfilData.notificaciones_push ?? true,
                publico_perfil: perfilData.publico_perfil ?? true
            })

            setDatosPersonales({
                nombre_completo: perfilData.nombre_completo || '',
                correo_electronico: perfilData.correo_electronico || '',
                whatsapp: perfilData.whatsapp || '',
                ciudad: perfilData.ciudad || perfilData.pais || '',
                fecha_creacion: new Date(perfilData.fecha_creacion).toLocaleDateString('es-ES')
            })

            setCorreoRecuperar(perfilData.correo_electronico || '')

        } catch (error) {
            console.error('Error cargando datos:', error)
            setMensaje('Error cargando la configuración')
        } finally {
            setCargando(false)
        }
    }

    async function guardarConfiguracion() {
        if (!usuario?.id) return

        setGuardando(true)

        try {
            const { error } = await supabase
                .from('perfiles')
                .update(configuraciones)
                .eq('id', usuario.id)

            if (error) throw error

            setMensaje('¡Configuración guardada exitosamente!')
            actualizarPerfil(configuraciones)
        } catch (error: any) {
            setMensaje('Error al guardar configuración: ' + error.message)
        } finally {
            setGuardando(false)
            setTimeout(() => setMensaje(''), 3000)
        }
    }

    async function enviarRecuperacionContrasena() {
        if (!correoRecuperar) return

        setCargandoRecuperar(true)
        setMensajeRecuperar('')

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(correoRecuperar, {
                redirectTo: window.location.origin + '/recuperar-contrasena'
            })

            if (error) throw error

            setMensajeRecuperar('¡Revisa tu correo para restablecer la contraseña!')
            setMostrarFormularioContrasena(false)
        } catch (error: any) {
            setMensajeRecuperar('Error: ' + error.message)
        } finally {
            setCargandoRecuperar(false)
        }
    }

    async function eliminarCuenta() {
        if (confirmacionEliminar !== 'ELIMINAR MI CUENTA') {
            setMensaje('Debes escribir exactamente "ELIMINAR MI CUENTA" para confirmar')
            return
        }

        if (!usuario?.id) return

        try {
            const { error } = await supabase
                .from('perfiles')
                .update({ eliminado: true })
                .eq('id', usuario.id)

            if (error) throw error

            await cerrarSesionContext()
            resetearPerfil()
            navigate('/sesion_cerrada')
        } catch (error: any) {
            setMensaje('Error al eliminar cuenta: ' + error.message)
        }
    }

    async function cerrarSesion() {
        await cerrarSesionContext()
        resetearPerfil()
        navigate('/sesion_cerrada')
    }

    function formatearPrecio(precio: number): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(precio)
    }

    function formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    return (
        <div className="contenido-configuracion">
            {cargando ? (
                <div className="estado-carga">
                    <div className="spinner"></div>
                    <p>Cargando configuración...</p>
                </div>
            ) : (
                <>
                    <div className="header">
                        <h1>⚙️ Configuración</h1>
                        <p>Administra tu cuenta y preferencias</p>
                    </div>

                    <div className="grid">
                        {/* Información de cuenta */}
                        <div className="seccion">
                            <h2>👤 Mi cuenta</h2>
                            <div className="info">
                                <div className="campo">
                                    <span>Nombre:</span>
                                    <span>{datosPersonales.nombre_completo || 'No especificado'}</span>
                                </div>
                                <div className="campo">
                                    <span>Email:</span>
                                    <span>{datosPersonales.correo_electronico || 'No especificado'}</span>
                                </div>
                                <div className="campo">
                                    <span>WhatsApp:</span>
                                    <span>{datosPersonales.whatsapp || 'No especificado'}</span>
                                </div>
                                <div className="campo">
                                    <span>Ubicación:</span>
                                    <span>{datosPersonales.ciudad || 'No especificado'}</span>
                                </div>
                                <div className="campo">
                                    <span>Miembro desde:</span>
                                    <span>{datosPersonales.fecha_creacion}</span>
                                </div>
                            </div>
                            <a href="/mi-perfil" className="boton-secundario">✏️ Editar información</a>
                        </div>

                        {/* Membresía */}
                        <div className="seccion">
                            <h2>💎 Mi membresía</h2>
                            {membresiaActual ? (
                                <div className="tarjeta-membresia" style={{ borderColor: membresiaActual.color_hex }}>
                                    <div className="icono" style={{ background: membresiaActual.color_hex }}>
                                        {membresiaActual.icono}
                                    </div>
                                    <div>
                                        <h3>{membresiaActual.nombre}</h3>
                                        <p>{membresiaActual.descripcion}</p>
                                        <div className="precio">{formatearPrecio(membresiaActual.precio_mensual)}/mes</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="membresia-gratuita">
                                    <div className="icono">🎵</div>
                                    <div>
                                        <h3>Plan Gratuito</h3>
                                        <p>Acceso limitado a contenido gratuito</p>
                                    </div>
                                </div>
                            )}
                            <a href="/membresias" className="boton-principal">
                                {membresiaActual ? '🔄 Cambiar plan' : '⬆️ Mejorar plan'}
                            </a>
                        </div>

                        {/* Historial de pagos */}
                        {historialPagos.length > 0 && (
                            <div className="seccion">
                                <h2>💳 Pagos recientes</h2>
                                <div className="lista-pagos">
                                    {historialPagos.map(pago => (
                                        <div key={pago.id} className="pago">
                                            <div>
                                                <span className="producto">{pago.nombre_producto}</span>
                                                <span className="fecha">{formatearFecha(pago.created_at)}</span>
                                            </div>
                                            <span className="precio">{formatearPrecio(pago.valor)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notificaciones */}
                        <div className="seccion">
                            <h2>🔔 Notificaciones</h2>
                            <div className="opciones">
                                <label className="toggle-opcion">
                                    <input
                                        type="checkbox"
                                        checked={configuraciones.notificaciones_email}
                                        onChange={(e) => setConfiguraciones({ ...configuraciones, notificaciones_email: e.target.checked })}
                                    />
                                    <span className="toggle"></span>
                                    <div>
                                        <span className="titulo">Notificaciones por email</span>
                                        <span className="desc">Recibe actualizaciones importantes</span>
                                    </div>
                                </label>

                                <label className="toggle-opcion">
                                    <input
                                        type="checkbox"
                                        checked={configuraciones.notificaciones_push}
                                        onChange={(e) => setConfiguraciones({ ...configuraciones, notificaciones_push: e.target.checked })}
                                    />
                                    <span className="toggle"></span>
                                    <div>
                                        <span className="titulo">Notificaciones push</span>
                                        <span className="desc">Notificaciones en tiempo real</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Privacidad */}
                        <div className="seccion">
                            <h2>🔒 Privacidad</h2>
                            <div className="opciones">
                                <label className="toggle-opcion">
                                    <input
                                        type="checkbox"
                                        checked={configuraciones.publico_perfil}
                                        onChange={(e) => setConfiguraciones({ ...configuraciones, publico_perfil: e.target.checked })}
                                    />
                                    <span className="toggle"></span>
                                    <div>
                                        <span className="titulo">Perfil público</span>
                                        <span className="desc">Otros usuarios pueden ver tu perfil</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Seguridad */}
                        <div className="seccion">
                            <h2>🔐 Seguridad</h2>
                            <div className="opciones">
                                {!mostrarFormularioContrasena ? (
                                    <button className="boton-secundario" onClick={() => setMostrarFormularioContrasena(true)}>
                                        🔑 Restablecer contraseña
                                    </button>
                                ) : (
                                    <div className="formulario">
                                        <h4>Restablecer contraseña</h4>
                                        <p>Te enviaremos un enlace para cambiar tu contraseña</p>
                                        <input
                                            type="email"
                                            value={correoRecuperar}
                                            onChange={(e) => setCorreoRecuperar(e.target.value)}
                                            placeholder="Confirma tu email"
                                        />
                                        <div className="botones">
                                            <button className="boton-principal" onClick={enviarRecuperacionContrasena} disabled={cargandoRecuperar}>
                                                {cargandoRecuperar ? 'Enviando...' : 'Enviar enlace'}
                                            </button>
                                            <button className="boton-cancelar" onClick={() => {
                                                setMostrarFormularioContrasena(false)
                                                setMensajeRecuperar('')
                                            }}>
                                                Cancelar
                                            </button>
                                        </div>
                                        {mensajeRecuperar && (
                                            <div className={`mensaje-recuperar ${mensajeRecuperar.includes('Revisa') ? 'exito' : ''}`}>
                                                {mensajeRecuperar}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Acciones */}
                        <div className="seccion">
                            <h2>⚙️ Acciones</h2>
                            <div className="acciones">
                                <button className="boton-warning" onClick={cerrarSesion}>🚪 Cerrar sesión</button>
                                <button className="boton-danger" onClick={() => setMostrarModalEliminar(true)}>🗑️ Eliminar cuenta</button>
                            </div>
                        </div>
                    </div>

                    {/* Botón guardar */}
                    <div className="acciones-principales">
                        <button className="boton-guardar" onClick={guardarConfiguracion} disabled={guardando}>
                            {guardando ? 'Guardando...' : '💾 Guardar configuración'}
                        </button>
                    </div>

                    {/* Mensajes */}
                    {mensaje && (
                        <div className={`mensaje ${mensaje.includes('exitosamente') ? 'exito' : 'error'}`}>
                            {mensaje}
                        </div>
                    )}
                </>
            )}

            {/* Modal eliminar cuenta */}
            {mostrarModalEliminar && (
                <div className="modal-fondo" onClick={() => setMostrarModalEliminar(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>⚠️ Eliminar cuenta</h3>
                        <p>Esta acción <strong>NO se puede deshacer</strong>. Perderás acceso a todos tus cursos y datos.</p>

                        <div className="campo-confirmacion">
                            <label>Para confirmar, escribe: <strong>ELIMINAR MI CUENTA</strong></label>
                            <input
                                type="text"
                                value={confirmacionEliminar}
                                onChange={(e) => setConfirmacionEliminar(e.target.value)}
                                placeholder="Escribe: ELIMINAR MI CUENTA"
                            />
                        </div>

                        <div className="botones">
                            <button className="boton-cancelar" onClick={() => setMostrarModalEliminar(false)}>Cancelar</button>
                            <button
                                className="boton-danger"
                                onClick={eliminarCuenta}
                                disabled={confirmacionEliminar !== 'ELIMINAR MI CUENTA'}
                            >
                                Eliminar cuenta
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
