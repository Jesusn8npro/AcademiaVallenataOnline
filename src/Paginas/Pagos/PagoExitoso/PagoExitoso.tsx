import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { supabaseAnonimo } from '../../../servicios/clienteSupabase';
import './PagoExitoso.css';

interface DatosPago {
    referencia: string;
    respuesta: string;
    razonRespuesta: string;
    codigoRespuesta: string;
    facturaId: string | null;
    transaccionId: string | null;
    monto: string;
    moneda: string;
    fechaTransaccion: string;
    metodoPago: string;
    emailCliente: string;
    nombreCliente: string;
    banco: string | null;
    cuotas: string | null;
    descripcion: string;
    nombreProducto?: string;
}

interface DatosUsuarioNuevo {
    email: string;
    nombre: string;
    fechaRegistro: string;
    contenidoAdquirido: string;
}

interface PagoEnBD {
    estado: 'aceptada' | 'pendiente' | 'rechazada' | 'fallida';
    nombre_producto: string;
    valor: number;
}

type EstadoPago = 'aceptada' | 'pendiente' | 'rechazada' | 'fallida' | 'no_encontrada' | 'cargando';

const PagoExitoso: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { usuario, setUsuario } = useUsuario();

    // Variables para datos del pago
    const [datosPago, setDatosPago] = useState<DatosPago | null>(null);
    const [datosUsuarioNuevo, setDatosUsuarioNuevo] = useState<DatosUsuarioNuevo | null>(null);
    const [estadoPago, setEstadoPago] = useState<EstadoPago>('cargando');
    const [cargandoDatos, setCargandoDatos] = useState(true);
    const [mostrandoAnimacion, setMostrandoAnimacion] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');

    useEffect(() => {
        const inicializar = async () => {
            try {
                console.log('🎉 Página de éxito cargada');

                // Convertir URLSearchParams a objeto
                const paramsObj: any = {};
                searchParams.forEach((value, key) => {
                    paramsObj[key] = value;
                });
                console.log('📋 ===== PARÁMETROS RECIBIDOS DE EPAYCO =====');
                console.log('Objeto completo:', JSON.stringify(paramsObj, null, 2));
                console.log('Todas las claves:', Object.keys(paramsObj));

                // Loguear cada parámetro que ePayco envía
                console.log('--- Parámetros individuales ---');
                console.log('ref_payco:', searchParams.get('ref_payco'));
                console.log('x_ref_payco:', searchParams.get('x_ref_payco'));
                console.log('x_id_invoice:', searchParams.get('x_id_invoice'));
                console.log('invoice:', searchParams.get('invoice'));
                console.log('x_transaction_id:', searchParams.get('x_transaction_id'));
                console.log('x_cod_response:', searchParams.get('x_cod_response'));
                console.log('estado:', searchParams.get('estado'));
                console.log('x_response:', searchParams.get('x_response'));
                console.log('='.repeat(45));

                // 1️⃣ EXTRAER ref_payco DE LA URL
                // Buscar con prioridad:
                // 1. 'invoice' - nuestro parámetro personalizado en la URL de respuesta
                // 2. 'x_id_invoice' - fallback
                // 3. 'ref_payco' - fallback de ePayco
                // 4. 'x_ref_payco' - fallback
                const refPayco = searchParams.get('invoice') ||
                               searchParams.get('x_id_invoice') ||
                               searchParams.get('ref_payco') ||
                               searchParams.get('x_ref_payco') ||
                               '';
                console.log('🔍 Referencia de pago encontrada:', refPayco);

                // 2️⃣ CONSULTAR SUPABASE PARA VERIFICAR ESTADO REAL
                if (!refPayco) {
                    console.warn('⚠️ No se encontró referencia de pago en URL');
                    setEstadoPago('no_encontrada');
                    setErrorCarga('No se encontró información de referencia de pago.');
                    setCargandoDatos(false);
                    return;
                }

                console.log('📡 Consultando Supabase con ref_payco:', refPayco);
                const { data, error } = await supabaseAnonimo
                    .from('pagos_epayco')
                    .select('estado, nombre_producto, valor')
                    .eq('ref_payco', refPayco)
                    .single();

                if (error) {
                    console.error('❌ Error consultando Supabase:', error);
                    // Si no encuentra el registro, se considera no encontrado
                    if (error.code === 'PGRST116') {
                        setEstadoPago('no_encontrada');
                        setErrorCarga('No se encontró el registro de pago en nuestra base de datos.');
                    } else {
                        setEstadoPago('no_encontrada');
                        setErrorCarga('Error al verificar el estado del pago.');
                    }
                    setCargandoDatos(false);
                    return;
                }

                // 3️⃣ PROCESAR DATOS DEL PAGO SEGÚN ESTADO
                const pagoEnBD = data as PagoEnBD;
                console.log('✅ Pago encontrado en BD:', pagoEnBD);
                setEstadoPago(pagoEnBD.estado);

                // Construir datos del pago con info de Supabase + URL params
                const nuevosDatosPago: DatosPago = {
                    referencia: refPayco,
                    respuesta: pagoEnBD.estado === 'aceptada' ? 'Aceptada' :
                               pagoEnBD.estado === 'pendiente' ? 'Pendiente' :
                               pagoEnBD.estado === 'rechazada' ? 'Rechazada' : 'Fallida',
                    razonRespuesta:
                        pagoEnBD.estado === 'aceptada' ? 'Transacción exitosa' :
                        pagoEnBD.estado === 'pendiente' ? 'Pago en proceso de verificación' :
                        pagoEnBD.estado === 'rechazada' ? 'La transacción fue rechazada' : 'Error en la transacción',
                    codigoRespuesta: pagoEnBD.estado === 'aceptada' ? '1' : '0',
                    facturaId: searchParams.get('x_id_invoice'),
                    transaccionId: searchParams.get('x_transaction_id'),
                    monto: String(pagoEnBD.valor || 0),
                    moneda: searchParams.get('x_currency_code') || 'COP',
                    fechaTransaccion: searchParams.get('x_transaction_date') || new Date().toLocaleString('es-CO'),
                    metodoPago: searchParams.get('x_franchise') || 'Tarjeta',
                    emailCliente: searchParams.get('x_customer_email') || '',
                    nombreCliente: searchParams.get('x_customer_name') || '',
                    banco: searchParams.get('x_bank_name'),
                    cuotas: searchParams.get('x_quotas'),
                    descripcion: pagoEnBD.nombre_producto || searchParams.get('x_description') || 'Contenido',
                    nombreProducto: pagoEnBD.nombre_producto
                };

                setDatosPago(nuevosDatosPago);
                console.log('🎯 Datos del pago procesados:', nuevosDatosPago);

                // 4️⃣ PREPARAR DATOS DEL USUARIO
                let usuarioInfo: DatosUsuarioNuevo;

                if (usuario) {
                    usuarioInfo = {
                        email: usuario.email || nuevosDatosPago.emailCliente,
                        nombre: usuario.nombre || nuevosDatosPago.nombreCliente,
                        fechaRegistro: new Date().toLocaleString('es-CO'),
                        contenidoAdquirido: nuevosDatosPago.descripcion
                    };
                } else {
                    usuarioInfo = {
                        email: nuevosDatosPago.emailCliente || 'usuario@academia.com',
                        nombre: nuevosDatosPago.nombreCliente || 'Estudiante',
                        fechaRegistro: new Date().toLocaleString('es-CO'),
                        contenidoAdquirido: nuevosDatosPago.descripcion
                    };
                }
                setDatosUsuarioNuevo(usuarioInfo);

                // 5️⃣ ANIMACIÓN Y REDIRECCIONES SEGÚN ESTADO
                const animTimer = setTimeout(() => {
                    setMostrandoAnimacion(false);
                    setCargandoDatos(false);
                }, pagoEnBD.estado === 'aceptada' ? 3000 : 2000);

                // Auto-login solo si es aceptada
                let loginTimer: NodeJS.Timeout | null = null;
                if (pagoEnBD.estado === 'aceptada' && nuevosDatosPago.emailCliente) {
                    loginTimer = setTimeout(() => {
                        realizarAutoLogin(nuevosDatosPago);
                    }, 5000);
                }

                return () => {
                    clearTimeout(animTimer);
                    if (loginTimer) clearTimeout(loginTimer);
                };
            } catch (err: any) {
                console.error('❌ Error en inicialización:', err);
                setErrorCarga('Error procesando la información del pago.');
                setEstadoPago('no_encontrada');
                setCargandoDatos(false);
            }
        };

        inicializar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const realizarAutoLogin = async (pagoData: DatosPago) => {
        try {
            console.log('🔄 Realizando auto-login...');
            const nuevoUsuario = {
                id: 'user-' + Date.now(),
                nombre: pagoData.nombreCliente || 'Usuario Nuevo',
                email: pagoData.emailCliente || '',
                rol: 'estudiante'
            };
            setUsuario(nuevoUsuario as any);
            console.log('✅ Auto-login exitoso');
        } catch (error) {
            console.error('❌ Error en auto-login:', error);
        }
    };

    const irAPanelEstudiante = () => {
        navigate('/panel-estudiante');
    };

    const irAMisCursos = () => {
        navigate('/mis-cursos');
    };

    const compartirEnWhatsApp = () => {
        if (!datosPago) return;
        const mensaje = `¡Acabo de adquirir "${datosPago.descripcion}" en Academia Vallenata Online! 🎵 Una experiencia increíble para aprender acordeón vallenato. ¡Te recomiendo visitarlos!`;
        const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
        window.open(url, '_blank');
    };

    const intentarDeNuevo = () => {
        window.history.back();
    };

    // Determinar clases CSS según estado
    const getEstadoClase = () => {
        switch (estadoPago) {
            case 'aceptada': return 'estado-aceptada';
            case 'pendiente': return 'estado-pendiente';
            case 'rechazada':
            case 'fallida': return 'estado-rechazada';
            default: return 'estado-neutral';
        }
    };

    return (
        <div className={`pago-exitoso-container ${getEstadoClase()}`}>
            <div className="fondo-celebracion">
                {/* Partículas de celebración - solo para aceptada */}
                {mostrandoAnimacion && estadoPago === 'aceptada' && (
                    <div className="particulas-celebracion">
                        {Array.from({ length: 50 }).map((_, i) => (
                            <div
                                key={i}
                                className="particula"
                                style={{
                                    left: `${Math.random() * 100}%`,
                                    top: `${Math.random() * 100}%`,
                                    animationDelay: `${Math.random() * 2}s`
                                }}
                            ></div>
                        ))}
                    </div>
                )}

                <div className="contenedor-principal">
                    {cargandoDatos ? (
                        /* Estado de carga */
                        <div className="tarjeta-carga">
                            <div className="icono-carga mb-6">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"></path>
                                    <circle cx="12" cy="12" r="10"></circle>
                                </svg>
                            </div>
                            <h2 className="texto-carga">Verificando tu compra...</h2>
                            <p className="descripcion-carga">Consultando estado del pago en nuestro sistema</p>
                        </div>
                    ) : (
                        <>
                            {/* ✅ ESTADO: ACEPTADA */}
                            {estadoPago === 'aceptada' && datosPago && datosUsuarioNuevo && (
                                <div className="tarjeta-exito tarjeta-aceptada">
                                    <div className="encabezado-exito">
                                        <div className="icono-exito mb-6">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <h1 className="titulo-principal">¡Felicitaciones!</h1>
                                        <h2 className="subtitulo-principal">Tu compra fue exitosa</h2>
                                        <p className="descripcion-principal">Ya eres parte oficial de nuestra academia musical 🎵</p>
                                    </div>

                                    <div className="seccion-pago">
                                        <h3 className="titulo-seccion">
                                            <svg className="w-8 h-8 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            Detalles de tu Transacción
                                        </h3>

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
                                                <span className="valor-detalle text-green-800 text-3xl">
                                                    ${parseInt(datosPago.monto || '0').toLocaleString()} {datosPago.moneda}
                                                </span>
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
                                        <h3 className="titulo-seccion text-blue-800">
                                            <svg className="w-8 h-8 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                            </svg>
                                            Tu Cuenta en Academia Vallenata
                                        </h3>

                                        <div className="informacion-cuenta space-y-4">
                                            <div className="mensaje-bienvenida">
                                                <p className="texto-bienvenida">
                                                    ¡Hola <strong className="text-blue-700">{datosUsuarioNuevo.nombre}</strong>!
                                                    Tu cuenta ha sido <strong className="text-green-600">activada automáticamente</strong>
                                                    y ya tienes acceso completo a tu contenido.
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
                                                <p className="texto-acceso">
                                                    🎉 <strong>¡Ya estás dentro!</strong> En unos segundos serás redirigido automáticamente a tu panel de estudiante.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={irAPanelEstudiante} className="boton-principal">
                                            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                                            </svg>
                                            Ir a Mi Panel
                                        </button>
                                        <button onClick={irAMisCursos} className="boton-secundario">
                                            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                            </svg>
                                            Ver Mis Cursos
                                        </button>
                                        <button onClick={compartirEnWhatsApp} className="boton-compartir">
                                            <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.488"></path>
                                            </svg>
                                            Compartir Experiencia
                                        </button>
                                    </div>

                                    <div className="seccion-soporte">
                                        <p className="texto-soporte">¿Tienes alguna pregunta? Nuestro equipo está aquí para ayudarte.</p>
                                        <p className="contacto-soporte">📧 soporte@academiavallenataonline.com | 📱 WhatsApp: +57 300 123 4567</p>
                                    </div>
                                </div>
                            )}

                            {/* ⏳ ESTADO: PENDIENTE */}
                            {estadoPago === 'pendiente' && datosPago && (
                                <div className="tarjeta-exito tarjeta-pendiente">
                                    <div className="encabezado-exito">
                                        <div className="icono-pendiente mb-6">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <h1 className="titulo-principal text-amber-600">Pago en Verificación</h1>
                                        <h2 className="subtitulo-principal">Estamos confirmando tu transacción</h2>
                                        <p className="descripcion-principal">Esto puede tomar unos minutos. Te notificaremos cuando se confirme.</p>
                                    </div>

                                    <div className="seccion-pago">
                                        <h3 className="titulo-seccion">
                                            <svg className="w-8 h-8 mr-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 2m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            Información del Pago
                                        </h3>

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
                                                <span className="valor-detalle text-amber-800 text-3xl">
                                                    ${parseInt(datosPago.monto || '0').toLocaleString()} {datosPago.moneda}
                                                </span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Producto:</span>
                                                <span className="valor-detalle">🎵 {datosPago.descripcion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="seccion-aviso">
                                        <p className="texto-aviso">
                                            📧 Enviaremos un email a <strong>{datosPago.emailCliente || 'tu correo'}</strong> cuando el pago sea confirmado.
                                        </p>
                                        <p className="texto-aviso" style={{ marginTop: '1rem' }}>
                                            Si tienes problemas, contacta a nuestro equipo de soporte.
                                        </p>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={() => navigate('/')} className="boton-secundario">
                                            ← Volver al Inicio
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ❌ ESTADO: RECHAZADA O FALLIDA */}
                            {(estadoPago === 'rechazada' || estadoPago === 'fallida') && datosPago && (
                                <div className="tarjeta-exito tarjeta-rechazada">
                                    <div className="encabezado-exito">
                                        <div className="icono-error mb-6">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <h1 className="titulo-principal text-red-600">Pago No Procesado</h1>
                                        <h2 className="subtitulo-principal">
                                            {estadoPago === 'rechazada' ? 'Tu transacción fue rechazada' : 'Error en la transacción'}
                                        </h2>
                                        <p className="descripcion-principal">Por favor intenta de nuevo o usa otro método de pago.</p>
                                    </div>

                                    <div className="seccion-pago">
                                        <h3 className="titulo-seccion">
                                            <svg className="w-8 h-8 mr-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                            Detalles del Error
                                        </h3>

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
                                                <span className="valor-detalle text-red-800 text-3xl">
                                                    ${parseInt(datosPago.monto || '0').toLocaleString()} {datosPago.moneda}
                                                </span>
                                            </div>
                                            <div className="detalle-item">
                                                <span className="etiqueta-detalle">Producto:</span>
                                                <span className="valor-detalle">🎵 {datosPago.descripcion}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="seccion-aviso">
                                        <p className="texto-aviso">
                                            💡 <strong>Sugerencias:</strong>
                                        </p>
                                        <ul style={{ paddingLeft: '2rem', marginTop: '0.5rem' }}>
                                            <li>Verifica que tus datos de tarjeta sean correctos</li>
                                            <li>Intenta con otro método de pago</li>
                                            <li>Contacta a tu banco para desbloquear la transacción</li>
                                        </ul>
                                        <p className="texto-aviso" style={{ marginTop: '1rem' }}>
                                            📧 Para más ayuda: soporte@academiavallenataonline.com
                                        </p>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={intentarDeNuevo} className="boton-principal">
                                            🔄 Intentar de Nuevo
                                        </button>
                                        <button onClick={() => navigate('/')} className="boton-secundario">
                                            ← Volver al Inicio
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* ❓ ESTADO: NO ENCONTRADO */}
                            {estadoPago === 'no_encontrada' && (
                                <div className="tarjeta-exito tarjeta-no-encontrada">
                                    <div className="encabezado-exito">
                                        <div className="icono-info mb-6">
                                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </div>
                                        <h1 className="titulo-principal text-gray-600">No Se Encontró Información</h1>
                                        <h2 className="subtitulo-principal">No tenemos registro de este pago</h2>
                                        <p className="descripcion-principal">{errorCarga || 'No se pudo localizar los datos de tu transacción'}</p>
                                    </div>

                                    <div className="seccion-aviso">
                                        <p className="texto-aviso">
                                            Esto puede ocurrir si:
                                        </p>
                                        <ul style={{ paddingLeft: '2rem', marginTop: '0.5rem' }}>
                                            <li>El URL está incompleto o modificado</li>
                                            <li>La sesión expiró (intenta nuevamente desde el carrito)</li>
                                            <li>Hay un problema temporal en nuestro sistema</li>
                                        </ul>
                                        <p className="texto-aviso" style={{ marginTop: '1rem' }}>
                                            📧 Si el problema persiste, contáctanos: soporte@academiavallenataonline.com
                                        </p>
                                    </div>

                                    <div className="botones-accion">
                                        <button onClick={() => navigate('/')} className="boton-principal">
                                            🏠 Ir al Inicio
                                        </button>
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
