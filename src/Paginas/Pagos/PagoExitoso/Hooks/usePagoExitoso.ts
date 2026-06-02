'use client';

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from '@/compat/router';
import { useUsuario } from '../../../../contextos/UsuarioContext';
import { supabase } from '../../../../servicios/clienteSupabase';

export interface DatosPago {
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

export interface DatosUsuarioNuevo {
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

export type EstadoPago = 'aceptada' | 'pendiente' | 'rechazada' | 'fallida' | 'no_encontrada' | 'cargando';

export function usePagoExitoso() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { usuario } = useUsuario();

    const [datosPago, setDatosPago] = useState<DatosPago | null>(null);
    const [datosUsuarioNuevo, setDatosUsuarioNuevo] = useState<DatosUsuarioNuevo | null>(null);
    const [estadoPago, setEstadoPago] = useState<EstadoPago>('cargando');
    const [cargandoDatos, setCargandoDatos] = useState(true);
    const [mostrandoAnimacion, setMostrandoAnimacion] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [segundosRedireccion, setSegundosRedireccion] = useState(8);

    useEffect(() => {
        const inicializar = async () => {
            try {
                const refPayco =
                    searchParams.get('invoice') ||
                    searchParams.get('x_id_invoice') ||
                    searchParams.get('ref_payco') ||
                    searchParams.get('x_ref_payco') ||
                    '';

                if (!refPayco) {
                    setEstadoPago('no_encontrada');
                    setErrorCarga('No se encontró información de referencia de pago.');
                    setCargandoDatos(false);
                    return;
                }

                // Verificación autoritativa con ePayco: la URL trae el ref_payco
                // HEXADECIMAL de ePayco. Con él consultamos su API pública (sin
                // depender del webhook ni del P_KEY) y actualizamos/activamos el
                // pago en la BD ANTES de leerlo. Idempotente y best-effort.
                const refPaycoHex = searchParams.get('ref_payco') || searchParams.get('x_ref_payco') || '';
                if (refPaycoHex) {
                    try {
                        await supabase.functions.invoke('verificar-pago-epayco', {
                            body: { ref_payco: refPaycoHex },
                        });
                    } catch { /* no fatal: seguimos con lo que haya en BD */ }
                }

                const { data, error } = await supabase
                    .from('pagos_epayco')
                    .select('estado, nombre_producto, valor')
                    .eq('ref_payco', refPayco)
                    .single();

                if (error) {
                    setEstadoPago('no_encontrada');
                    setErrorCarga(
                        error.code === 'PGRST116'
                            ? 'No se encontró el registro de pago en nuestra base de datos.'
                            : 'Error al verificar el estado del pago.'
                    );
                    setCargandoDatos(false);
                    return;
                }

                const pagoEnBD = data as PagoEnBD;
                setEstadoPago(pagoEnBD.estado);

                const nuevosDatosPago: DatosPago = {
                    referencia: refPayco,
                    respuesta:
                        pagoEnBD.estado === 'aceptada' ? 'Aceptada' :
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
                    nombreProducto: pagoEnBD.nombre_producto,
                };

                setDatosPago(nuevosDatosPago);

                setDatosUsuarioNuevo({
                    email: usuario?.email || nuevosDatosPago.emailCliente || 'usuario@academia.com',
                    nombre: usuario?.nombre || nuevosDatosPago.nombreCliente || 'Estudiante',
                    fechaRegistro: new Date().toLocaleString('es-CO'),
                    contenidoAdquirido: nuevosDatosPago.descripcion,
                });

                const animTimer = setTimeout(() => {
                    setMostrandoAnimacion(false);
                    setCargandoDatos(false);
                }, pagoEnBD.estado === 'aceptada' ? 3000 : 2000);

                return () => clearTimeout(animTimer);
            } catch {
                setErrorCarga('Error procesando la información del pago.');
                setEstadoPago('no_encontrada');
                setCargandoDatos(false);
            }
        };

        inicializar();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (estadoPago !== 'pendiente' || !datosPago?.referencia) return;

        let intentos = 0;
        const MAX_INTENTOS = 40;

        const polling = setInterval(async () => {
            intentos++;
            try {
                const { data } = await supabase
                    .from('pagos_epayco')
                    .select('estado, cod_respuesta, respuesta')
                    .eq('ref_payco', datosPago.referencia)
                    .single();

                if (data && data.estado !== 'pendiente') {
                    setEstadoPago(data.estado as any);
                    setDatosPago(prev => prev ? { ...prev, ...data } : null);
                    clearInterval(polling);
                    return;
                }

                if (intentos >= MAX_INTENTOS) clearInterval(polling);
            } catch {
                // error de polling no fatal
            }
        }, 3000);

        return () => clearInterval(polling);
    }, [estadoPago, datosPago?.referencia]);

    // Contador visible: al confirmarse el pago, cuenta atrás. El navigate NO va dentro
    // del updater de setState (eso dispara un update del Router durante el render); se
    // hace en un efecto aparte cuando llega a 0.
    useEffect(() => {
        if (estadoPago !== 'aceptada') return;
        setSegundosRedireccion(8);
        const id = setInterval(() => {
            setSegundosRedireccion(s => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(id);
    }, [estadoPago]);

    useEffect(() => {
        if (estadoPago === 'aceptada' && segundosRedireccion === 0) navigate('/mis-cursos');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estadoPago, segundosRedireccion]);

    const montoFmt = (monto: string) =>
        `$${parseInt(monto || '0').toLocaleString('es-CO')}`;

    const compartirEnWhatsApp = () => {
        if (!datosPago) return;
        const msg = `¡Acabo de adquirir "${datosPago.descripcion}" en Academia Vallenata Online! 🎵 ¡Te recomiendo visitarlos!`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const getEstadoClase = () => {
        if (estadoPago === 'aceptada') return 'estado-aceptada';
        if (estadoPago === 'pendiente') return 'estado-pendiente';
        if (estadoPago === 'rechazada' || estadoPago === 'fallida') return 'estado-rechazada';
        return 'estado-neutral';
    };

    return {
        datosPago,
        datosUsuarioNuevo,
        estadoPago,
        cargandoDatos,
        mostrandoAnimacion,
        errorCarga,
        segundosRedireccion,
        montoFmt,
        compartirEnWhatsApp,
        getEstadoClase,
        irAPanelEstudiante: () => navigate('/panel-estudiante'),
        irAMisCursos: () => navigate('/mis-cursos'),
        irAInicio: () => navigate('/'),
        intentarDeNuevo: () => window.history.back(),
    };
}
