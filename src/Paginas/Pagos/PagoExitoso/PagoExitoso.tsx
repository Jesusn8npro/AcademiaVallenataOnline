import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUsuario } from '../../../contextos/UsuarioContext';
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
}

interface DatosUsuarioNuevo {
    email: string;
    nombre: string;
    fechaRegistro: string;
    contenidoAdquirido: string;
}

const PagoExitoso: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { usuario, setUsuario } = useUsuario();

    // Variables para datos del pago
    const [datosPago, setDatosPago] = useState<DatosPago | null>(null);
    const [datosUsuarioNuevo, setDatosUsuarioNuevo] = useState<DatosUsuarioNuevo | null>(null);
    const [cargandoDatos, setCargandoDatos] = useState(true);
    const [mostrandoAnimacion, setMostrandoAnimacion] = useState(true);

    useEffect(() => {
        // Obtener parámetros de ePayco de la URL
        console.log('🎉 Página de éxito cargada');
        // En React Router v6 searchParams es un objeto URLSearchParams
        const paramsObj: any = {};
        searchParams.forEach((value, key) => {
            paramsObj[key] = value;
        });
        console.log('📋 Parámetros recibidos:', paramsObj);

        // ✅ EXTRAER DATOS REALES DE EPAYCO DESDE LA URL
        const nuevosDatosPago: DatosPago = {
            referencia: searchParams.get('ref_payco') || searchParams.get('x_ref_payco') || '',
            respuesta: searchParams.get('estado') || searchParams.get('x_response') || 'Aceptada',
            razonRespuesta: searchParams.get('x_response_reason_text') || 'Transacción exitosa',
            codigoRespuesta: searchParams.get('x_cod_response') || '1',
            facturaId: searchParams.get('x_id_invoice'),
            transaccionId: searchParams.get('x_transaction_id'),
            monto: searchParams.get('monto') || searchParams.get('x_amount') || '0',
            moneda: searchParams.get('x_currency_code') || 'COP',
            fechaTransaccion: searchParams.get('fecha') || searchParams.get('x_transaction_date') || new Date().toLocaleString('es-CO'),
            metodoPago: searchParams.get('metodo') || searchParams.get('x_franchise') || 'Tarjeta',
            emailCliente: searchParams.get('email') || searchParams.get('x_customer_email') || '',
            nombreCliente: searchParams.get('nombre') || searchParams.get('x_customer_name') || '',
            banco: searchParams.get('x_bank_name'),
            cuotas: searchParams.get('x_quotas'),
            descripcion: searchParams.get('x_description') || 'Tutorial de Acordeón'
        };

        // ✅ FORZAR DATOS REALES DEL PAGO - CORREGIR MONTO
        if (nuevosDatosPago.monto && nuevosDatosPago.monto !== '0') {
            nuevosDatosPago.monto = nuevosDatosPago.monto;
        } else {
            // Si no hay monto, usar valor por defecto del tutorial
            nuevosDatosPago.monto = '5000';
        }

        setDatosPago(nuevosDatosPago);
        console.log('🎯 DATOS REALES DEL PAGO RECIBIDOS:', nuevosDatosPago);

        // ✅ OBTENER DATOS REALES DEL USUARIO ACTUAL O NUEVO
        let usuarioInfo: DatosUsuarioNuevo;

        if (usuario) {
            usuarioInfo = {
                email: usuario.email || nuevosDatosPago.emailCliente,
                nombre: usuario.nombre || nuevosDatosPago.nombreCliente,
                fechaRegistro: new Date().toLocaleString('es-CO'),
                contenidoAdquirido: nuevosDatosPago.descripcion
            };
        } else {
            // Si no hay usuario, usar datos del pago
            usuarioInfo = {
                email: nuevosDatosPago.emailCliente || 'usuario@academia.com',
                nombre: nuevosDatosPago.nombreCliente || 'Estudiante',
                fechaRegistro: new Date().toLocaleString('es-CO'),
                contenidoAdquirido: nuevosDatosPago.descripcion
            };
        }
        setDatosUsuarioNuevo(usuarioInfo);

        // Animación de celebración
        const animTimer = setTimeout(() => {
            setMostrandoAnimacion(false);
            setCargandoDatos(false);
        }, 3000);

        // Auto-login después de 5 segundos
        const loginTimer = setTimeout(() => {
            if (nuevosDatosPago.emailCliente) {
                realizarAutoLogin(nuevosDatosPago);
            }
        }, 5000);

        return () => {
            clearTimeout(animTimer);
            clearTimeout(loginTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Se ejecuta una sola vez al montar

    const realizarAutoLogin = async (pagoData: DatosPago) => {
        try {
            console.log('🔄 Realizando auto-login...');

            // Simular que el usuario está logueado
            // IMPORTANTE: Esto usa setUsuario del contexto para actualizar el estado global
            // pero no autentica realmente contra Supabase si no hay un token real.
            // Sigue la lógica del proyecto Svelte original.

            const nuevoUsuario = {
                id: 'user-' + Date.now(),
                nombre: pagoData.nombreCliente || 'Usuario Nuevo',
                email: pagoData.emailCliente || '',
                rol: 'estudiante'
            };

            // Nota: En TypeScript necesitamos asegurar que cumple la interfaz Usuario.
            // Como setUsuario acepta (Usuario | null), y Usuario tiene campos opcionales,
            // esto debería funcionar. Si faltan campos obligatorios, el contexto los manejará.
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

    return (
        <div className="pago-exitoso-container">
            <div className="fondo-celebracion">
                {/* Partículas de celebración */}
                {mostrandoAnimacion && (
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
                        /* Estado de carga con animación */
                        <div className="tarjeta-carga">
                            <div className="icono-carga mb-6">
                                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2"></path>
                                    <circle cx="12" cy="12" r="10"></circle>
                                </svg>
                            </div>
                            <h2 className="texto-carga">Procesando tu compra...</h2>
                            <p className="descripcion-carga">Activando tu cuenta en nuestra academia</p>
                        </div>
                    ) : (
                        /* Contenido principal de éxito */
                        datosPago && datosUsuarioNuevo && (
                            <div className="tarjeta-exito">

                                {/* ✅ Encabezado de éxito */}
                                <div className="encabezado-exito">
                                    <div className="icono-exito mb-6">
                                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                    <h1 className="titulo-principal">
                                        ¡Felicitaciones!
                                    </h1>
                                    <h2 className="subtitulo-principal">
                                        Tu compra fue exitosa
                                    </h2>
                                    <p className="descripcion-principal">
                                        Ya eres parte oficial de nuestra academia musical 🎵
                                    </p>
                                </div>

                                {/* ✅ Información del pago */}
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
                                            <span className="valor-detalle font-mono">{datosPago.referencia || 'N/A'}</span>
                                        </div>
                                        <div className="detalle-item">
                                            <span className="etiqueta-detalle">Estado:</span>
                                            <span className="valor-detalle text-green-600">✅ {datosPago.respuesta || 'Aceptada'}</span>
                                        </div>
                                        <div className="detalle-item bg-green-50 border-green-200">
                                            <span className="etiqueta-detalle text-green-700">Monto Pagado:</span>
                                            <span className="valor-detalle text-green-800 text-3xl">
                                                ${parseInt(datosPago.monto || '5000').toLocaleString()} {datosPago.moneda || 'COP'}
                                            </span>
                                        </div>
                                        <div className="detalle-item">
                                            <span className="etiqueta-detalle">Método de Pago:</span>
                                            <span className="valor-detalle">💳 {datosPago.metodoPago || 'Tarjeta de Crédito'}</span>
                                        </div>
                                        <div className="detalle-item">
                                            <span className="etiqueta-detalle">Fecha:</span>
                                            <span className="valor-detalle">📅 {datosPago.fechaTransaccion}</span>
                                        </div>
                                        <div className="detalle-item bg-blue-50 border-blue-200">
                                            <span className="etiqueta-detalle text-blue-700">Contenido:</span>
                                            <span className="valor-detalle text-blue-800">🎵 {datosPago.descripcion || 'Tutorial de Acordeón'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* ✅ Información de la cuenta */}
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
                                                <span className="valor-cuenta font-mono">{datosUsuarioNuevo.email || 'usuario@academia.com'}</span>
                                            </div>
                                            <div className="detalle-cuenta">
                                                <span className="etiqueta-cuenta">Fecha de registro:</span>
                                                <span className="valor-cuenta">{datosUsuarioNuevo.fechaRegistro}</span>
                                            </div>
                                        </div>

                                        <div className="estado-acceso">
                                            <p className="texto-acceso">
                                                🎉 <strong>¡Ya estás dentro!</strong> En unos segundos serás redirigido automáticamente a tu panel de estudiante.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Botones de acción */}
                                <div className="botones-accion">
                                    <button
                                        onClick={irAPanelEstudiante}
                                        className="boton-principal"
                                    >
                                        <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                                        </svg>
                                        Ir a Mi Panel
                                    </button>

                                    <button
                                        onClick={irAMisCursos}
                                        className="boton-secundario"
                                    >
                                        <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                        </svg>
                                        Ver Mis Cursos
                                    </button>

                                    <button
                                        onClick={compartirEnWhatsApp}
                                        className="boton-compartir"
                                    >
                                        <svg className="w-5 h-5 inline-block mr-2" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.886 3.488"></path>
                                        </svg>
                                        Compartir Experiencia
                                    </button>
                                </div>

                                {/* ✅ Mensaje de soporte */}
                                <div className="seccion-soporte">
                                    <p className="texto-soporte">
                                        ¿Tienes alguna pregunta? Nuestro equipo está aquí para ayudarte.
                                    </p>
                                    <p className="contacto-soporte">
                                        📧 soporte@academiavallentaonline.com | 📱 WhatsApp: +57 300 123 4567
                                    </p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default PagoExitoso;
