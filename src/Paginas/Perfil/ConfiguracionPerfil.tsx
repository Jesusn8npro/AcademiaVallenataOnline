import { useConfiguracionPerfil } from './Hooks/useConfiguracionPerfil';
import { formatearPrecio, formatearFecha } from './utils/formatadores';
import ModalEliminarCuenta from './ModalEliminarCuenta';
import './ConfiguracionPerfil.css';

export default function ConfiguracionPerfil() {
    const {
        cargando, guardando, mensaje, membresiaActual, historialPagos,
        configuraciones, setConfiguraciones,
        mostrarModalEliminar, setMostrarModalEliminar,
        mostrarFormularioContrasena, setMostrarFormularioContrasena,
        correoRecuperar, setCorreoRecuperar,
        cargandoRecuperar, mensajeRecuperar,
        confirmacionEliminar, setConfirmacionEliminar,
        datosPersonales,
        editandoCuenta, datosEditados, setDatosEditados, guardandoCuenta,
        iniciarEdicionCuenta, guardarDatosPersonales, cancelarEdicionCuenta,
        guardarConfiguracion, enviarRecuperacionContrasena, cancelarRecuperacion, eliminarCuenta, cerrarSesion
    } = useConfiguracionPerfil();

    return (
        <div className="contenido-configuracion">
          <div className="cp-inner">
            {cargando ? (
                <div className="estado-carga">
                    <div className="spinner"></div>
                    <p>Cargando configuración...</p>
                </div>
            ) : (
                <>
                    <div className="cp-cabecera">
                        <h1>⚙️ Configuración</h1>
                        <p>Administra tu cuenta y preferencias</p>
                    </div>

                    <div className="grid">
                        <div className="seccion">
                            <h2>👤 Cuenta</h2>
                            {!editandoCuenta ? (
                                <>
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
                                    <button className="boton-secundario" onClick={iniciarEdicionCuenta}>✏️ Editar datos</button>
                                </>
                            ) : (
                                <div className="formulario">
                                    <h4>Editar datos personales</h4>
                                    <label>Nombre completo</label>
                                    <input
                                        type="text"
                                        value={datosEditados.nombre_completo}
                                        onChange={e => setDatosEditados({ ...datosEditados, nombre_completo: e.target.value })}
                                        placeholder="Tu nombre completo"
                                    />
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={datosEditados.correo_electronico}
                                        onChange={e => setDatosEditados({ ...datosEditados, correo_electronico: e.target.value })}
                                        placeholder="tu@correo.com"
                                    />
                                    <label>WhatsApp</label>
                                    <input
                                        type="text"
                                        value={datosEditados.whatsapp}
                                        onChange={e => setDatosEditados({ ...datosEditados, whatsapp: e.target.value })}
                                        placeholder="+57 300 000 0000"
                                    />
                                    <label>Ciudad / País</label>
                                    <input
                                        type="text"
                                        value={datosEditados.ciudad}
                                        onChange={e => setDatosEditados({ ...datosEditados, ciudad: e.target.value })}
                                        placeholder="Tu ciudad"
                                    />
                                    <div className="botones" style={{ marginTop: '1rem' }}>
                                        <button className="boton-principal" onClick={guardarDatosPersonales} disabled={guardandoCuenta}>
                                            {guardandoCuenta ? 'Guardando...' : '💾 Guardar'}
                                        </button>
                                        <button className="boton-cancelar" onClick={cancelarEdicionCuenta} disabled={guardandoCuenta}>
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="seccion">
                            <h2>💎 Mi Plan</h2>
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

                        <div className="seccion">
                            <h2>🔒 Privacidad</h2>
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
                                            <button className="boton-cancelar" onClick={cancelarRecuperacion}>
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
                                <div className="acciones">
                                    <button className="boton-warning" onClick={cerrarSesion}>🚪 Cerrar sesión</button>
                                    <button className="boton-danger" onClick={() => setMostrarModalEliminar(true)}>🗑️ Eliminar cuenta</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="acciones-principales">
                        <button className="boton-guardar" onClick={guardarConfiguracion} disabled={guardando}>
                            {guardando ? 'Guardando...' : '💾 Guardar configuración'}
                        </button>
                    </div>

                    {mensaje && (
                        <div className={`mensaje ${mensaje.includes('exitosamente') ? 'exito' : 'error'}`}>
                            {mensaje}
                        </div>
                    )}
                </>
            )}

            <ModalEliminarCuenta
                visible={mostrarModalEliminar}
                confirmacion={confirmacionEliminar}
                onConfirmacionChange={setConfirmacionEliminar}
                onCerrar={() => setMostrarModalEliminar(false)}
                onEliminar={eliminarCuenta}
            />
          </div>
        </div>
    );
}
