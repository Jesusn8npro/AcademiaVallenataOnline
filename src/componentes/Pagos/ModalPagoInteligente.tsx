import { useState, useEffect } from 'react';
import { useUsuario } from '../../contextos/UsuarioContext';
import { supabase } from '../../servicios/clienteSupabase';
import './ModalPagoInteligente.css';

// Interface para el contenido (paquete, curso, tutorial, etc.)
interface ContenidoCompra {
    id: string | number;
    titulo?: string;
    nombre?: string;
    precio_normal?: number;
    precio_rebajado?: number;
    precio?: number; // Para membresías
    precio_mensual?: number; // Para membresías
    [key: string]: any;
}

interface ModalPagoInteligenteProps {
    mostrar: boolean;
    setMostrar: (mostrar: boolean) => void;
    contenido: ContenidoCompra | null;
    tipoContenido?: 'curso' | 'tutorial' | 'paquete' | 'membresia';
}

interface DatosPago {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    whatsapp: string;
    tipo_documento: string;
    numero_documento: string;
    direccion: string;
    ciudad: string;
    pais: string;
    codigo_postal: string;
    password?: string;
    confirmarPassword?: string;
    fecha_nacimiento?: string;
    profesion?: string;
    como_nos_conocio?: string;
}

// URLs de ePayco - Usar SIEMPRE URLs de producción, incluso en desarrollo local
// ePayco rechaza URLs de localhost
const EPAYCO_RESPONSE_URL = 'https://academiavallenataonline.com/pago-exitoso';
const EPAYCO_CONFIRMATION_URL = 'https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook';

const ModalPagoInteligente = ({ mostrar, setMostrar, contenido, tipoContenido = 'curso' }: ModalPagoInteligenteProps) => {
    const { usuario } = useUsuario();

    // Estados
    const [pasoActual, setPasoActual] = useState(1);
    const [cargando, setCargando] = useState(false);
    const [procesandoPago, setProcesandoPago] = useState(false);
    const [error, setError] = useState('');
    const [pagoExitoso, setPagoExitoso] = useState(false);
    const [usuarioEstaRegistrado, setUsuarioEstaRegistrado] = useState(false);
    const [ultimoIntentoPago, setUltimoIntentoPago] = useState(0);

    const [datosPago, setDatosPago] = useState<DatosPago>({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        whatsapp: '',
        tipo_documento: 'CC',
        numero_documento: '',
        direccion: '',
        ciudad: '',
        pais: 'Colombia',
        codigo_postal: '',
        password: '',
        confirmarPassword: ''
    });

    const [erroresValidacion, setErroresValidacion] = useState({
        email: '',
        telefono: '',
        documento: '',
        password: ''
    });

    // Variables de entorno (asegúrate de que estén definidas en .env)
    // En Vite usamos import.meta.env, pero checkeamos si existe process (por si acaso)
    const EPAYCO_PUBLIC_KEY = import.meta.env.VITE_EPAYCO_PUBLIC_KEY;

    useEffect(() => {
        if (mostrar) {
            verificarUsuario();
        } else {
            // Reset al cerrar
            setTimeout(() => {
                setPasoActual(1);
                setError('');
                setCargando(false);
                setPagoExitoso(false);
            }, 300);
        }
    }, [mostrar, usuario]);

    const verificarUsuario = () => {
        if (usuario) {
            setUsuarioEstaRegistrado(true);
            setPasoActual(1);
            setDatosPago(prev => ({
                ...prev,
                nombre: usuario.nombre || '',
                apellido: usuario.nombre ? '' : '', // El contexto a veces trae nombre completo
                email: usuario.email || '',
                // @ts-ignore
                telefono: usuario.telefono || '',
                // @ts-ignore
                whatsapp: usuario.telefono || '', // Fallback a telefono si whatsapp no existe
                // @ts-ignore
                ciudad: usuario.ciudad || '',
                // @ts-ignore
                pais: usuario.pais || 'Colombia'
            }));
        } else {
            setUsuarioEstaRegistrado(false);
            setPasoActual(1);
        }
    };

    const cerrarModal = () => {
        setMostrar(false);
    };

    // Validaciones
    const validarEmail = (email: string) => {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!email) {
            setErroresValidacion(prev => ({ ...prev, email: '' }));
        } else if (!emailRegex.test(email.trim())) {
            setErroresValidacion(prev => ({ ...prev, email: 'Email inválido' }));
        } else {
            setErroresValidacion(prev => ({ ...prev, email: '' }));
        }
    };

    const validarTelefono = (telefono: string) => {
        const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
        if (!telefono) {
            setErroresValidacion(prev => ({ ...prev, telefono: '' }));
        } else if (!/^\d{7,15}$/.test(telefonoLimpio)) {
            setErroresValidacion(prev => ({ ...prev, telefono: 'Teléfono debe tener 7-15 dígitos' }));
        } else {
            setErroresValidacion(prev => ({ ...prev, telefono: '' }));
        }
    };

    const validarDocumento = (documento: string, tipo: string) => {
        const docLimpio = documento.replace(/[\s\-\.]/g, '');
        if (!documento) {
            setErroresValidacion(prev => ({ ...prev, documento: '' }));
        } else if (tipo === 'CC' && (docLimpio.length < 6 || docLimpio.length > 10)) {
            setErroresValidacion(prev => ({ ...prev, documento: 'Cédula: 6-10 dígitos' }));
        } else if (tipo === 'NIT' && (docLimpio.length < 9 || docLimpio.length > 12)) {
            setErroresValidacion(prev => ({ ...prev, documento: 'NIT: 9-12 dígitos' }));
        } else {
            setErroresValidacion(prev => ({ ...prev, documento: '' }));
        }
    };

    const validarPassword = (password: string | undefined) => {
        if (!password) return;
        if (password.length < 8) {
            setErroresValidacion(prev => ({ ...prev, password: 'Mínimo 8 caracteres' }));
        } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
            setErroresValidacion(prev => ({ ...prev, password: 'Debe tener letra y número' }));
        } else {
            setErroresValidacion(prev => ({ ...prev, password: '' }));
        }
    };

    const validarDatosPago = (): boolean => {
        // Validar campos requeridos básicos
        if (!datosPago.nombre || !datosPago.email || !datosPago.telefono) {
            setError('Por favor completa nombre, email y teléfono');
            return false;
        }

        // Validar documento y dirección si estamos en paso 2
        if (!datosPago.numero_documento || !datosPago.direccion || !datosPago.ciudad) {
            setError('Por favor completa los datos de facturación');
            return false;
        }

        // Validar password si es usuario nuevo
        if (!usuarioEstaRegistrado) {
            if (!datosPago.password || datosPago.password.length < 8) {
                setError('La contraseña es inválida');
                return false;
            }
            if (datosPago.password !== datosPago.confirmarPassword) {
                setError('Las contraseñas no coinciden');
                return false;
            }
        }

        // Chequear errores de validación en tiempo real
        if (erroresValidacion.email || erroresValidacion.telefono || erroresValidacion.documento || erroresValidacion.password) {
            setError('Corrige los errores marcados en rojo');
            return false;
        }

        return true;
    };

    const loadEpaycoScript = (): Promise<boolean> => {
        return new Promise((resolve, reject) => {
            if ((window as any).ePayco && document.querySelector('script[src="https://checkout.epayco.co/checkout.js"]')) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.epayco.co/checkout.js';
            script.async = true;
            script.onload = () => {
                if ((window as any).ePayco) {
                    resolve(true);
                } else {
                    setTimeout(() => {
                        if ((window as any).ePayco) resolve(true);
                        else reject(new Error('ePayco no inicializado'));
                    }, 1000);
                }
            };
            script.onerror = () => reject(new Error('Error cargando ePayco'));
            document.head.appendChild(script);
        });
    };

    // Crear usuario en Supabase Auth si es nuevo y obtener su ID
    const crearOObtenerUsuario = async (): Promise<string | null> => {
        // Si ya está registrado, retornar su ID
        if (usuario?.id) {
            return usuario.id;
        }

        try {
            // Intentar signUp
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: datosPago.email,
                password: datosPago.password,
                options: {
                    data: {
                        nombre: datosPago.nombre,
                        apellido: datosPago.apellido
                    }
                }
            });

            if (signUpError) {
                // Si el error es que el usuario ya existe, intentar signIn
                if (signUpError.message?.includes('already registered') || signUpError.message?.includes('User already exists')) {
                    console.log('📧 Email ya registrado, intentando signIn...');
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: datosPago.email,
                        password: datosPago.password
                    });

                    if (signInError) {
                        throw new Error('El email ya existe pero la contraseña es incorrecta');
                    }

                    return signInData?.user?.id || null;
                } else {
                    throw signUpError;
                }
            }

            return authData?.user?.id || null;

        } catch (error: any) {
            console.error('Error creando/obteniendo usuario:', error);
            throw new Error(error.message || 'Error al registrar usuario');
        }
    };

    const procesarPago = async () => {
        const ahora = Date.now();
        if (procesandoPago || ahora - ultimoIntentoPago < 3000) return;

        setProcesandoPago(true);
        setUltimoIntentoPago(ahora);
        setCargando(true);
        setError('');

        try {
            // 1️⃣ Si es usuario nuevo, crear cuenta en Supabase Auth primero
            let usuarioId: string | null = null;

            if (!usuarioEstaRegistrado) {
                console.log('👤 Creando usuario nuevo en Supabase Auth...');
                usuarioId = await crearOObtenerUsuario();

                if (!usuarioId) {
                    throw new Error('No se pudo obtener ID de usuario');
                }
                console.log('✅ Usuario creado/obtenido:', usuarioId);
            } else {
                usuarioId = usuario?.id || null;
            }

            await loadEpaycoScript();

            // Preparar datos para pago
            const precio = obtenerPrecio(contenido);
            if (precio <= 0) {
                // Lógica gratuito
                setPagoExitoso(true);
                setCargando(false);
                setProcesandoPago(false);
                return;
            }

            const epaycoData = {
                key: EPAYCO_PUBLIC_KEY || '491d6a0b6e992cf924edd8d3d088aff1',
                test: import.meta.env.VITE_EPAYCO_TEST_MODE === 'true'
            };

            if ((window as any).ePayco) {
                const handler = (window as any).ePayco.checkout.configure({
                    key: epaycoData.key,
                    test: epaycoData.test
                });

                const dataPago = {
                    name: obtenerTitulo(contenido),
                    description: obtenerTitulo(contenido),
                    invoice: 'ORD-' + Date.now(),
                    currency: 'cop',
                    amount: precio.toString(),
                    tax_base: '0',
                    tax: '0',
                    country: 'co',
                    lang: 'es',

                    // Atributos del cliente
                    name_billing: datosPago.nombre + ' ' + datosPago.apellido,
                    address_billing: datosPago.direccion,
                    type_doc_billing: datosPago.tipo_documento,
                    mobilephone_billing: datosPago.telefono,
                    number_doc_billing: datosPago.numero_documento,
                    email_billing: datosPago.email,

                    // Funciones de callback
                    response: EPAYCO_RESPONSE_URL,
                    confirmation: EPAYCO_CONFIRMATION_URL,

                    method: 'GET'
                };

                // 2️⃣ CERRAR MODAL antes de abrir ePayco
                setMostrar(false);

                // 3️⃣ Abrir checkout
                handler.open(dataPago);

                // 4️⃣ Detectar si el usuario cierra ePayco sin pagar (después de 30 segundos, volver a mostrar modal)
                const timeoutHandle = setTimeout(() => {
                    // Si el modal sigue cerrado después de 30s, probablemente cerró ePayco sin pagar
                    // Volver a mostrar el modal
                    setMostrar(true);
                    setError('');
                    setCargando(false);
                    setProcesandoPago(false);
                }, 30000);

                setCargando(false);
                setProcesandoPago(false);

                // Limpiar timeout si el usuario completa el pago (redirige a pago-exitoso)
                return () => clearTimeout(timeoutHandle);

            } else {
                throw new Error('Epayco no disponible');
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Error procesando el pago');
            setCargando(false);
            setProcesandoPago(false);
        }
    };

    const handleSiguiente = () => {
        if (pasoActual === 1) {
            if (!usuarioEstaRegistrado) {
                setPasoActual(2);
            } else {
                // Si faltan datos, ir al 2
                if (!datosPago.numero_documento || !datosPago.direccion) {
                    setPasoActual(2);
                } else {
                    procesarPago();
                }
            }
        } else if (pasoActual === 2) {
            if (validarDatosPago()) {
                procesarPago();
            }
        }
    };

    const obtenerPrecio = (item: any) => {
        if (!item) return 0;
        if (tipoContenido === 'membresia') return item.precio || item.precio_mensual || 0;
        return item.precio_rebajado || item.precio_normal || 0;
    };

    const obtenerTitulo = (item: any) => {
        if (!item) return 'Contenido';
        if (tipoContenido === 'membresia') return item.nombre || 'Membresía';
        return item.titulo || 'Producto';
    };

    if (!mostrar) return null;

    return (
        <div className="mpi-modal-overlay" onClick={cerrarModal}>
            <div className="mpi-modal-content" onClick={e => e.stopPropagation()}>
                <button className="mpi-close-btn" onClick={cerrarModal}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                <div className="mpi-modal-body">
                    {pasoActual !== 4 && (
                        <h2 className="mpi-title">
                            {pasoActual === 1 ? (usuarioEstaRegistrado ? 'Confirmar Compra' : 'Completar Compra') : 'Datos de Facturación'}
                        </h2>
                    )}

                    {/* Resumen Producto */}
                    {contenido && pasoActual !== 4 && (
                        <div className="mpi-product-summary">
                            <div className="mpi-summary-flex">
                                <div>
                                    <h3 className="mpi-product-title">{obtenerTitulo(contenido)}</h3>
                                    <p className="mpi-product-subtitle">
                                        {tipoContenido === 'curso' ? '🎓 Curso completo' : (tipoContenido === 'paquete' ? '📦 Paquete completo' : '🎵 Tutorial individual')}
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
                        <div className="mpi-alert mpi-alert-error">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Paso 1 */}
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

                    {/* Paso 2: Formulario */}
                    {pasoActual === 2 && (
                        <div className="space-y-4">
                            {/* Datos Personales */}
                            <div className="mpi-form-section">
                                <h4 className="mpi-section-title">👤 Datos Personales</h4>
                                <div className="mpi-grid-2">
                                    <input
                                        type="text"
                                        className="mpi-input"
                                        placeholder="Nombres"
                                        value={datosPago.nombre}
                                        onChange={e => setDatosPago({ ...datosPago, nombre: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        className="mpi-input"
                                        placeholder="Apellidos"
                                        value={datosPago.apellido}
                                        onChange={e => setDatosPago({ ...datosPago, apellido: e.target.value })}
                                    />
                                </div>
                                <div className="mpi-grid-2" style={{ marginTop: '0.5rem' }}>
                                    <div>
                                        <input
                                            type="email"
                                            className={`mpi-input ${erroresValidacion.email ? 'mpi-input-error' : ''}`}
                                            placeholder="tu@email.com"
                                            value={datosPago.email}
                                            onChange={e => {
                                                setDatosPago({ ...datosPago, email: e.target.value });
                                                validarEmail(e.target.value);
                                            }}
                                        />
                                        {erroresValidacion.email && <p className="mpi-error-text">{erroresValidacion.email}</p>}
                                    </div>
                                    <div>
                                        <input
                                            type="tel"
                                            className={`mpi-input ${erroresValidacion.telefono ? 'mpi-input-error' : ''}`}
                                            placeholder="+57 300 123 4567"
                                            value={datosPago.telefono}
                                            onChange={e => {
                                                setDatosPago({ ...datosPago, telefono: e.target.value });
                                                validarTelefono(e.target.value);
                                            }}
                                        />
                                        {erroresValidacion.telefono && <p className="mpi-error-text">{erroresValidacion.telefono}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Facturación */}
                            <div className="mpi-form-section">
                                <h4 className="mpi-section-title">📄 Identificación y Facturación</h4>
                                <div className="mpi-grid-3">
                                    <div>
                                        <select
                                            className="mpi-input"
                                            value={datosPago.tipo_documento}
                                            onChange={e => setDatosPago({ ...datosPago, tipo_documento: e.target.value })}
                                        >
                                            <option value="CC">CC</option>
                                            <option value="CE">CE</option>
                                            <option value="Pasaporte">Pasaporte</option>
                                            <option value="NIT">NIT</option>
                                        </select>
                                    </div>
                                    <div className="mpi-col-span-2">
                                        <input
                                            type="text"
                                            className={`mpi-input ${erroresValidacion.documento ? 'mpi-input-error' : ''}`}
                                            placeholder="Número de documento"
                                            value={datosPago.numero_documento}
                                            onChange={e => {
                                                setDatosPago({ ...datosPago, numero_documento: e.target.value });
                                                validarDocumento(e.target.value, datosPago.tipo_documento);
                                            }}
                                        />
                                        {erroresValidacion.documento && <p className="mpi-error-text">{erroresValidacion.documento}</p>}
                                    </div>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="mpi-input"
                                        placeholder="Dirección completa"
                                        value={datosPago.direccion}
                                        onChange={e => setDatosPago({ ...datosPago, direccion: e.target.value })}
                                    />
                                </div>
                                <div className="mpi-grid-3" style={{ marginTop: '0.5rem' }}>
                                    <input
                                        type="text"
                                        className="mpi-input"
                                        placeholder="Ciudad"
                                        value={datosPago.ciudad}
                                        onChange={e => setDatosPago({ ...datosPago, ciudad: e.target.value })}
                                    />
                                    <select
                                        className="mpi-input"
                                        value={datosPago.pais}
                                        onChange={e => setDatosPago({ ...datosPago, pais: e.target.value })}
                                    >
                                        <option value="Colombia">Colombia</option>
                                        <option value="Mexico">México</option>
                                        <option value="USA">USA</option>
                                        <option value="Otro">Otro</option>
                                    </select>
                                    <input
                                        type="text"
                                        className="mpi-input"
                                        placeholder="Cod. Postal"
                                        value={datosPago.codigo_postal}
                                        onChange={e => setDatosPago({ ...datosPago, codigo_postal: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Password si es nuevo */}
                            {!usuarioEstaRegistrado && (
                                <div className="mpi-alert mpi-alert-success mpi-form-section" style={{ borderColor: 'rgba(34, 197, 94, 0.5)' }}>
                                    <h4 className="mpi-section-title" style={{ color: '#86efac' }}>🔐 Crear tu Cuenta</h4>
                                    <div className="mpi-grid-2">
                                        <div>
                                            <input
                                                type="password"
                                                className={`mpi-input ${erroresValidacion.password ? 'mpi-input-error' : ''}`}
                                                placeholder="Contraseña (min. 8)"
                                                value={datosPago.password}
                                                onChange={e => {
                                                    setDatosPago({ ...datosPago, password: e.target.value });
                                                    validarPassword(e.target.value);
                                                }}
                                            />
                                            {erroresValidacion.password && <p className="mpi-error-text">{erroresValidacion.password}</p>}
                                        </div>
                                        <div>
                                            <input
                                                type="password"
                                                className="mpi-input"
                                                placeholder="Confirmar contraseña"
                                                value={datosPago.confirmarPassword}
                                                onChange={e => setDatosPago({ ...datosPago, confirmarPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Paso 4: Loading */}
                    {cargando && (
                        <div className="text-center py-8">
                            <div className="mpi-spinner-lg mx-auto mpi-spinner">
                                <svg fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p className="font-semibold text-lg">Conectando con ePayco...</p>
                            <p className="text-gray-400">Por favor espera un momento.</p>
                        </div>
                    )}

                    {/* Paso 5: Éxito */}
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

                {/* Footer Buttons */}
                {!cargando && !pagoExitoso && (
                    <div className="mpi-footer">
                        {pasoActual === 2 ? (
                            <button className="mpi-btn-back" onClick={() => setPasoActual(1)}>
                                &larr; Atrás
                            </button>
                        ) : <div></div>}

                        <button
                            className="mpi-btn-primary"
                            onClick={handleSiguiente}
                            disabled={procesandoPago || !contenido}
                        >
                            {procesandoPago ? 'Procesando...' : (
                                pasoActual === 1 ? `💳 Pagar $${obtenerPrecio(contenido).toLocaleString('es-CO')}` : '💳 Procesar Pago'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ModalPagoInteligente;
