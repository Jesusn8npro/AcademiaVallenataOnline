import React from 'react';
import { usePagoExitoso } from './Hooks/usePagoExitoso';
import './PagoExitoso.css';

const IcoCheck = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IcoClock = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
        <circle cx="12" cy="12" r="10" />
    </svg>
);

const IcoWarn = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const PagoExitoso: React.FC = () => {
    const {
        datosPago, datosUsuarioNuevo, estadoPago,
        cargandoDatos, mostrandoAnimacion, errorCarga,
        montoFmt, compartirEnWhatsApp, getEstadoClase,
        irAPanelEstudiante, irAMisCursos, irAInicio, intentarDeNuevo,
    } = usePagoExitoso();

    return (
        <div className={`pago-exitoso-container ${getEstadoClase()}`}>
            <div className="fondo-celebracion">

                {mostrandoAnimacion && estadoPago === 'aceptada' && (
                    <div className="particulas-celebracion">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div key={i} className="particula" style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                            }} />
                        ))}
                    </div>
                )}

                <div className="contenedor-principal">
                    {cargandoDatos ? (
                        <div className="tarjeta-carga">
                            <div className="icono-carga mb-6"><IcoClock /></div>
                            <h2 className="texto-carga">Verificando tu compra...</h2>
                            <p className="descripcion-carga">Consultando estado del pago en nuestro sistema</p>
                        </div>
                    ) : (
                        <>
                            {estadoPago === 'aceptada' && datosPago && datosUsuarioNuevo && (
                                <div className="tarjeta-exito tarjeta-aceptada">
                                    <div className="encabezado-exito">
                                        <div className="icono-exito mb-6"><IcoCheck /></div>
                                        <h1 className="titulo-principal">¡Felicitaciones!</h1>
                                        <h2 className="subtitulo-principal">Tu compra fue exitosa</h2>
                                        <p className="descripcion-principal">Ya eres parte oficial de nuestra academia musical 🎵</p>
                                    </div>

                                    <div className="seccion-pago">
                                        <h3 className="titulo-seccion">Detalles de tu Transacción</h3>
                                        <div className="detalles-pago">
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Referencia:</span>
                                                <span className="valor-detalle font-mono">{datosPago.referencia}</span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Estado:</span>
                                                <span className="valor-detalle text-green-600">✅ Aceptada</span>
                                            </div>
                                            <div className="detalle-item bg-green-50 border-green-200">
                                                <span className="etiqueta-detalle text-green-700">Monto Pagado:</span>
                                                <span className="valor-detalle text-green-800 text-3xl">{montoFmt(datosPago.monto)} {datosPago.moneda}</span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Producto:</span>
                                                <span className="valor-detalle">🎵 {datosPago.descripcion}</span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Fecha:</span>
                                                <span className="valor-detalle">📅 {datosPago.fechaTransaccion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="seccion-cuenta">
                                        <h3 className="titulo-seccion text-blue-800">Tu Cuenta en Academia Vallenata</h3>
                                        <div className="informacion-cuenta space-y-4">
                                            <div className="mensaje-bienvenida">
                                                <p className="texto-bienvenida">
                                                    ¡Hola <strong className="text-blue-700">{datosUsuarioNuevo.nombre}</strong>!
                                                    Tu cuenta ha sido <strong className="text-green-600">activada automáticamente</strong> y ya tienes acceso completo a tu contenido.
                                                </p>
                                            </div>
                                            <div className="detalles-cuenta">
                                                <div className="detalle-cuenta">
                                                    <span className="etiqueta-cuenta">Email registrado:</span>
                                                    <span className="valor-cuenta font-mono">{datosUsuarioNuevo.email}</span>
                                                </div>
                                                <div className="detalle-cuenta">
                                                    <span className="etiqueta-cuenta">Acceso a:</span>
                                                    <span className="valor-cuenta">{datosUsuarioNuevo.contenidoAdquirido}</span>
                                                </div>
                                            </div>
                                            <div className="estado-acceso">
                                                <p className="texto-acceso">🎉 <strong>¡Ya estás dentro!</strong> En unos segundos serás redirigido automáticamente a tu panel de estudiante.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={irAPanelEstudiante} className="boton-principal">Ir a Mi Panel</button>
                                        <button onClick={irAMisCursos} className="boton-secundario">Ver Mis Cursos</button>
                                        <button onClick={compartirEnWhatsApp} className="boton-compartir">Compartir Experiencia</button>
                                    </div>

                                    <div className="seccion-soporte">
                                        <p className="texto-soporte">¿Tienes alguna pregunta? Nuestro equipo está aquí para ayudarte.</p>
                                        <p className="contacto-soporte">📧 soporte@academiavallenataonline.com</p>
                                    </div>
                                </div>
                            )}

                            {estadoPago === 'pendiente' && datosPago && (
                                <div className="tarjeta-exito tarjeta-pendiente">
                                    <div className="encabezado-exito">
                                        <div className="icono-pendiente mb-6">
                                            <div className="spinner-pendiente"><IcoClock /></div>
                                        </div>
                                        <h1 className="titulo-principal text-amber-600">Pago en Verificación</h1>
                                        <h2 className="subtitulo-principal">Confirmando tu transacción automáticamente</h2>
                                        <p className="descripcion-principal">No cierres esta página. Verificamos cada 3 segundos por hasta 2 minutos.</p>
                                    </div>

                                    <div className="seccion-pago">
                                        <h3 className="titulo-seccion">Información del Pago</h3>
                                        <div className="detalles-pago">
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Referencia:</span>
                                                <span className="valor-detalle font-mono">{datosPago.referencia}</span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Estado:</span>
                                                <span className="valor-detalle text-amber-600">⏳ En proceso de verificación</span>
                                            </div>
                                            <div className="detalle-item bg-amber-50 border-amber-200">
                                                <span className="etiqueta-detalle text-amber-700">Monto:</span>
                                                <span className="valor-detalle text-amber-800 text-3xl">{montoFmt(datosPago.monto)} {datosPago.moneda}</span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Producto:</span>
                                                <span className="valor-detalle">🎵 {datosPago.descripcion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="seccion-aviso">
                                        <p className="texto-aviso">📧 Te notificaremos a <strong>{datosPago.emailCliente || 'tu correo'}</strong> cuando se confirme el pago.</p>
                                    </div>

                                    <div className="progreso-pendiente">
                                        <div className="puntos-progreso">
                                            <span className="punto" /><span className="punto" /><span className="punto" />
                                        </div>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={irAInicio} className="boton-secundario">← Volver al Inicio</button>
                                    </div>
                                </div>
                            )}

                            {(estadoPago === 'rechazada' || estadoPago === 'fallida') && datosPago && (
                                <div className="tarjeta-exito tarjeta-rechazada">
                                    <div className="encabezado-exito">
                                        <div className="icono-error mb-6"><IcoWarn /></div>
                                        <h1 className="titulo-principal text-red-600">Pago No Procesado</h1>
                                        <h2 className="subtitulo-principal">
                                            {estadoPago === 'rechazada' ? 'Tu transacción fue rechazada' : 'Error en la transacción'}
                                        </h2>
                                        <p className="descripcion-principal">Por favor intenta de nuevo o usa otro método de pago.</p>
                                    </div>

                                    <div className="seccion-pago">
                                        <h3 className="titulo-seccion">Detalles del Error</h3>
                                        <div className="detalles-pago">
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Referencia:</span>
                                                <span className="valor-detalle font-mono">{datosPago.referencia}</span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Estado:</span>
                                                <span className="valor-detalle text-red-600">❌ {datosPago.respuesta}</span>
                                            </div>
                                            <div className="detalle-item bg-red-50 border-red-200">
                                                <span className="etiqueta-detalle text-red-700">Monto Intentado:</span>
                                                <span className="valor-detalle text-red-800 text-3xl">{montoFmt(datosPago.monto)} {datosPago.moneda}</span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Producto:</span>
                                                <span className="valor-detalle">🎵 {datosPago.descripcion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="seccion-aviso">
                                        <p className="texto-aviso">💡 Verifica los datos de tu tarjeta, intenta con otro método de pago o contacta a tu banco.</p>
                                        <p className="texto-aviso" style={{ marginTop: '1rem' }}>📧 soporte@academiavallenataonline.com</p>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={intentarDeNuevo} className="boton-principal">🔄 Intentar de Nuevo</button>
                                        <button onClick={irAInicio} className="boton-secundario">← Volver al Inicio</button>
                                    </div>
                                </div>
                            )}

                            {estadoPago === 'no_encontrada' && (
                                <div className="tarjeta-exito tarjeta-no-encontrada">
                                    <div className="encabezado-exito">
                                        <div className="icono-info mb-6">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h1 className="titulo-principal text-gray-600">No Se Encontró Información</h1>
                                        <h2 className="subtitulo-principal">No tenemos registro de este pago</h2>
                                        <p className="descripcion-principal">{errorCarga || 'No se pudo localizar los datos de tu transacción'}</p>
                                    </div>

                                    <div className="seccion-aviso">
                                        <p className="texto-aviso">Esto puede ocurrir si el URL está incompleto, la sesión expiró, o hay un problema temporal. Contáctanos si el problema persiste.</p>
                                        <p className="texto-aviso" style={{ marginTop: '1rem' }}>📧 soporte@academiavallenataonline.com</p>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={irAInicio} className="boton-principal">🏠 Ir al Inicio</button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PagoExitoso;
