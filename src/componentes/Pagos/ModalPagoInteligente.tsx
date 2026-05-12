import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { useModalPago } from './Hooks/useModalPago';
import type { ContenidoCompra } from './Hooks/useModalPago';
import './ModalPagoInteligente.css';

interface ModalPagoInteligenteProps {
    mostrar: boolean;
    setMostrar: (mostrar: boolean) => void;
    contenido: ContenidoCompra | null;
    tipoContenido?: 'curso' | 'tutorial' | 'paquete' | 'membresia';
}

const ModalPagoInteligente = ({ mostrar, setMostrar, contenido, tipoContenido = 'curso' }: ModalPagoInteligenteProps) => {
    const {
        usuario, pasoActual, setPasoActual, cargando, procesandoPago,
        error, pagoExitoso, usuarioEstaRegistrado,
        datosPago, setDatosPago, erroresValidacion,
        validarEmail, validarTelefono, validarDocumento, validarPassword,
        handleSiguiente, cerrarModal, obtenerPrecio, obtenerTitulo, obtenerLabelTipo,
    } = useModalPago({ mostrar, setMostrar, contenido, tipoContenido });

    const [mostrarPassword, setMostrarPassword] = useState(false);
    const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);

    if (!mostrar) return null;

    return (
        <div className="mpi-modal-overlay" onClick={cerrarModal}>
            <div className="mpi-modal-content" onClick={e => e.stopPropagation()}>
                <button className="mpi-close-btn" onClick={cerrarModal}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="mpi-modal-body">
                    {pasoActual !== 4 && (
                        <h2 className="mpi-title">
                            {pasoActual === 1
                                ? (usuarioEstaRegistrado ? 'Confirmar Compra' : 'Completar Compra')
                                : 'Datos de Facturación'}
                        </h2>
                    )}

                    {contenido && pasoActual !== 4 && (
                        <div className="mpi-product-summary">
                            <div className="mpi-summary-flex">
                                <div>
                                    <h3 className="mpi-product-title">{obtenerTitulo(contenido)}</h3>
                                    <p className="mpi-product-subtitle">
                                        {tipoContenido === 'curso'
                                            ? '🎓 Curso completo'
                                            : tipoContenido === 'paquete'
                                                ? '📦 Paquete completo'
                                                : `🎵 ${obtenerLabelTipo()} individual`}
                                    </p>
                                </div>
                                <div>
                                    <p className="mpi-product-price">${obtenerPrecio(contenido).toLocaleString('es-CO')}</p>
                                    <p className="mpi-currency">COP</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mpi-alert mpi-alert-error"><p>{error}</p></div>
                    )}

                    {pasoActual === 1 && (
                        usuarioEstaRegistrado ? (
                            <div className="text-center">
                                <div className="mpi-alert mpi-alert-success">
                                    <p>✅ Sesión activa como: <strong>{usuario?.nombre}</strong></p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>{usuario?.email}</p>
                                </div>
                                <p className="mb-4 text-gray-300">Puedes proceder directamente con tu compra.</p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="mpi-alert mpi-alert-info">
                                    <p>🆕 Crear tu cuenta es fácil y rápido</p>
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>Completa tus datos y tendrás acceso inmediato</p>
                                </div>
                            </div>
                        )
                    )}

                    {pasoActual === 2 && (
                        <div className="space-y-4">
                            <div className="mpi-form-section">
                                <h4 className="mpi-section-title">👤 Datos Personales</h4>
                                <div className="mpi-grid-2">
                                    <input type="text" className="mpi-input" placeholder="Nombres"
                                        value={datosPago.nombre}
                                        onChange={e => setDatosPago({ ...datosPago, nombre: e.target.value })} />
                                    <input type="text" className="mpi-input" placeholder="Apellidos"
                                        value={datosPago.apellido}
                                        onChange={e => setDatosPago({ ...datosPago, apellido: e.target.value })} />
                                </div>
                                <div className="mpi-grid-2" style={{ marginTop: '0.5rem' }}>
                                    <div>
                                        <input type="email"
                                            className={`mpi-input ${erroresValidacion.email ? 'mpi-input-error' : ''}`}
                                            placeholder="tu@email.com"
                                            value={datosPago.email}
                                            onChange={e => { setDatosPago({ ...datosPago, email: e.target.value }); validarEmail(e.target.value); }} />
                                        {erroresValidacion.email && <p className="mpi-error-text">{erroresValidacion.email}</p>}
                                    </div>
                                    <div className="mpi-phone-wrapper">
                                        <PhoneInput
                                            defaultCountry="co"
                                            value={datosPago.telefono}
                                            onChange={(phone) => {
                                                setDatosPago({ ...datosPago, telefono: phone });
                                                validarTelefono(phone);
                                            }}
                                            inputClassName={`mpi-input mpi-phone-input ${erroresValidacion.telefono ? 'mpi-input-error' : ''}`}
                                            countrySelectorStyleProps={{
                                                buttonClassName: 'mpi-phone-country-btn',
                                                dropdownStyleProps: { className: 'mpi-phone-dropdown' },
                                            }}
                                            placeholder="300 123 4567"
                                        />
                                        {erroresValidacion.telefono && <p className="mpi-error-text">{erroresValidacion.telefono}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="mpi-form-section">
                                <h4 className="mpi-section-title">📄 Identificación y Facturación</h4>
                                <div className="mpi-grid-3">
                                    <div>
                                        <select className="mpi-input" value={datosPago.tipo_documento}
                                            onChange={e => setDatosPago({ ...datosPago, tipo_documento: e.target.value })}>
                                            <option value="CC">CC</option>
                                            <option value="CE">CE</option>
                                            <option value="Pasaporte">Pasaporte</option>
                                            <option value="NIT">NIT</option>
                                        </select>
                                    </div>
                                    <div className="mpi-col-span-2">
                                        <input type="text"
                                            className={`mpi-input ${erroresValidacion.documento ? 'mpi-input-error' : ''}`}
                                            placeholder="Número de documento"
                                            value={datosPago.numero_documento}
                                            onChange={e => { setDatosPago({ ...datosPago, numero_documento: e.target.value }); validarDocumento(e.target.value, datosPago.tipo_documento); }} />
                                        {erroresValidacion.documento && <p className="mpi-error-text">{erroresValidacion.documento}</p>}
                                    </div>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <input type="text" className="mpi-input" placeholder="Dirección completa"
                                        value={datosPago.direccion}
                                        onChange={e => setDatosPago({ ...datosPago, direccion: e.target.value })} />
                                </div>
                                <div className="mpi-grid-3" style={{ marginTop: '0.5rem' }}>
                                    <input type="text" className="mpi-input" placeholder="Ciudad"
                                        value={datosPago.ciudad}
                                        onChange={e => setDatosPago({ ...datosPago, ciudad: e.target.value })} />
                                    <select className="mpi-input" value={datosPago.pais}
                                        onChange={e => setDatosPago({ ...datosPago, pais: e.target.value })}>
                                        <option value="Colombia">Colombia</option>
                                        <option value="Mexico">México</option>
                                        <option value="USA">USA</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    <input type="text" className="mpi-input" placeholder="Cod. Postal"
                                        value={datosPago.codigo_postal}
                                        onChange={e => setDatosPago({ ...datosPago, codigo_postal: e.target.value })} />
                                </div>
                            </div>

                            {!usuarioEstaRegistrado && (
                                <div className="mpi-alert mpi-alert-success mpi-form-section" style={{ borderColor: 'rgba(34, 197, 94, 0.5)' }}>
                                    <h4 className="mpi-section-title" style={{ color: '#86efac' }}>🔐 Crear tu Cuenta</h4>
                                    <div className="mpi-grid-2">
                                        <div>
                                            <div className="mpi-password-wrapper">
                                                <input type={mostrarPassword ? 'text' : 'password'}
                                                    className={`mpi-input mpi-input-password ${erroresValidacion.password ? 'mpi-input-error' : ''}`}
                                                    placeholder="Contraseña (min. 8)"
                                                    value={datosPago.password}
                                                    onChange={e => { setDatosPago({ ...datosPago, password: e.target.value }); validarPassword(e.target.value); }} />
                                                <button type="button" className="mpi-password-toggle"
                                                    onClick={() => setMostrarPassword(v => !v)}
                                                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                                    {mostrarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                            {erroresValidacion.password && <p className="mpi-error-text">{erroresValidacion.password}</p>}
                                        </div>
                                        <div>
                                            <div className="mpi-password-wrapper">
                                                <input type={mostrarConfirmarPassword ? 'text' : 'password'}
                                                    className="mpi-input mpi-input-password"
                                                    placeholder="Confirmar contraseña"
                                                    value={datosPago.confirmarPassword}
                                                    onChange={e => setDatosPago({ ...datosPago, confirmarPassword: e.target.value })} />
                                                <button type="button" className="mpi-password-toggle"
                                                    onClick={() => setMostrarConfirmarPassword(v => !v)}
                                                    aria-label={mostrarConfirmarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                                    {mostrarConfirmarPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {cargando && (
                        <div className="text-center py-8">
                            <div className="mpi-spinner-lg mx-auto mpi-spinner">
                                <svg fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            </div>
                            <p className="font-semibold text-lg">Conectando con ePayco...</p>
                            <p className="text-gray-400">Por favor espera un momento.</p>
                        </div>
                    )}

                    {pagoExitoso && (
                        <div className="text-center py-8">
                            <h2 className="text-2xl font-bold mb-2 text-green-500">¡Pago Exitoso!</h2>
                            <p className="text-gray-300">Gracias por tu compra.</p>
                            <button className="mpi-btn-primary" onClick={cerrarModal} style={{ margin: '1rem auto' }}>
                                Cerrar
                            </button>
                        </div>
                    )}
                </div>

                {!cargando && !pagoExitoso && (
                    <div className="mpi-footer">
                        {pasoActual === 2
                            ? <button className="mpi-btn-back" onClick={() => setPasoActual(1)}>&larr; Atrás</button>
                            : <div />}
                        <button
                            className="mpi-btn-primary"
                            onClick={handleSiguiente}
                            disabled={procesandoPago || !contenido}
                        >
                            {procesandoPago
                                ? 'Procesando...'
                                : pasoActual === 1
                                    ? `💳 Pagar $${obtenerPrecio(contenido).toLocaleString('es-CO')}`
                                    : '💳 Procesar Pago'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalPagoInteligente;
