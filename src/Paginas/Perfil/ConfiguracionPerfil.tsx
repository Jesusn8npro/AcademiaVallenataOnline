'use client';
import { Link } from '@/compat/router';

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

    const ESTADO_BADGE: Record<string, [string, string]> = {
        aceptada: ['Pagado', 'cp-badge-ok'],
        pendiente: ['Pendiente', 'cp-badge-pend'],
        rechazada: ['Rechazado', 'cp-badge-bad'],
        fallida: ['Fallido', 'cp-badge-bad'],
        reembolsada: ['Reembolsado', 'cp-badge-pend'],
    };
    const METODO_LABEL: Record<string, string> = { cupon: '🎟️ Cupón', gratis: '🎁 Gratis', epayco: '💳 Tarjeta' };
    const labelMetodo = (m?: string) => (m ? METODO_LABEL[m] || m : '💳 Tarjeta');

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
                                            <span>Documento:</span>
                                            <span>{datosPersonales.documento_numero ? `${datosPersonales.documento_tipo || 'CC'} ${datosPersonales.documento_numero}` : 'No especificado'}</span>
                                        </div>
                                        <div className="campo">
                                            <span>Dirección:</span>
                                            <span>{datosPersonales.direccion_completa || 'No especificado'}</span>
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
                                    <label>Ciudad</label>
                                    <input
                                        type="text"
                                        value={datosEditados.ciudad}
                                        onChange={e => setDatosEditados({ ...datosEditados, ciudad: e.target.value })}
                                        placeholder="Tu ciudad"
                                    />

                                    <h4 style={{ marginTop: '8px' }}>🧾 Datos de facturación</h4>
                                    <div className="cp-grid-2">
                                        <div>
                                            <label>Tipo doc.</label>
                                            <select
                                                className="cp-select"
                                                value={datosEditados.documento_tipo}
                                                onChange={e => setDatosEditados({ ...datosEditados, documento_tipo: e.target.value })}
                                            >
                                                <option value="CC">CC</option>
                                                <option value="CE">CE</option>
                                                <option value="Pasaporte">Pasaporte</option>
                                                <option value="NIT">NIT</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label>N° documento</label>
                                            <input
                                                type="text"
                                                value={datosEditados.documento_numero}
                                                onChange={e => setDatosEditados({ ...datosEditados, documento_numero: e.target.value })}
                                                placeholder="Número de documento"
                                            />
                                        </div>
                                    </div>
                                    <label>Dirección completa</label>
                                    <input
                                        type="text"
                                        value={datosEditados.direccion_completa}
                                        onChange={e => setDatosEditados({ ...datosEditados, direccion_completa: e.target.value })}
                                        placeholder="Calle, número, barrio"
                                    />
                                    <div className="cp-grid-2">
                                        <div>
                                            <label>País</label>
                                            <input
                                                type="text"
                                                value={datosEditados.pais}
                                                onChange={e => setDatosEditados({ ...datosEditados, pais: e.target.value })}
                                                placeholder="País"
                                            />
                                        </div>
                                        <div>
                                            <label>Cód. postal</label>
                                            <input
                                                type="text"
                                                value={datosEditados.codigo_postal}
                                                onChange={e => setDatosEditados({ ...datosEditados, codigo_postal: e.target.value })}
                                                placeholder="Código postal"
                                            />
                                        </div>
                                    </div>

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
                            <Link href="/membresias" className="boton-principal">
                                {membresiaActual ? '🔄 Cambiar plan' : '⬆️ Mejorar plan'}
                            </Link>
                        </div>

                        <div className="seccion">
                            <h2>🧾 Historial de compras</h2>
                            {historialPagos.length > 0 ? (
                                <div className="lista-pagos">
                                    {historialPagos.map(pago => {
                                        const [txt, cls] = ESTADO_BADGE[pago.estado] || [pago.estado, 'cp-badge-pend'];
                                        return (
                                            <div key={pago.id} className="pago">
                                                <div className="pago-info">
                                                    <span className="producto">{pago.nombre_producto || 'Compra'}</span>
                                                    <span className="fecha">{formatearFecha(pago.created_at)} · {labelMetodo(pago.metodo_pago)}</span>
                                                </div>
                                                <div className="pago-derecha">
                                                    <span className="precio">{formatearPrecio(pago.valor)}</span>
                                                    <span className={`cp-badge ${cls}`}>{txt}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="cp-vacio">
                                    <span className="cp-vacio-ico">🧾</span>
                                    <p>Aún no tienes compras registradas.</p>
                                    <Link href="/cursos" className="boton-secundario">Ver cursos y tutoriales</Link>
                                </div>
                            )}
                        </div>

                        <div className="seccion">
                            <h2>💳 Medios de pago</h2>
                            <div className="cp-info-box">
                                <p>Tus pagos se procesan de forma segura con <strong>ePayco</strong>. Por tu seguridad, <strong>no almacenamos los datos de tu tarjeta</strong>: los ingresas directamente en la pasarela en cada compra.</p>
                                <p style={{ marginTop: '8px' }}>Lo que sí puedes mantener actualizado son tus <strong>datos de facturación</strong> (documento y dirección), que se usan en tus recibos. Edítalos en la tarjeta <strong>“Cuenta”</strong>.</p>
                            </div>
                        </div>

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
