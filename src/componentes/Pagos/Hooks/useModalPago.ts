import { useState, useEffect } from 'react';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { supabase } from '../../../servicios/clienteSupabase';
import { crearRegistroPago } from '../../../servicios/pagoService';

export interface ContenidoCompra {
    id: string | number;
    titulo?: string;
    nombre?: string;
    precio_normal?: number;
    precio_rebajado?: number;
    precio?: number;
    precio_mensual?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
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

const EPAYCO_RESPONSE_URL = 'https://academiavallenataonline.com/pago-exitoso';
const EPAYCO_CONFIRMATION_URL = 'https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook';

const DATOS_INICIALES: DatosPago = {
    nombre: '', apellido: '', email: '', telefono: '', whatsapp: '',
    tipo_documento: 'CC', numero_documento: '', direccion: '',
    ciudad: '', pais: 'Colombia', codigo_postal: '', password: '', confirmarPassword: '',
};

interface Params {
    mostrar: boolean;
    setMostrar: (v: boolean) => void;
    contenido: ContenidoCompra | null;
    tipoContenido: 'curso' | 'tutorial' | 'paquete' | 'membresia';
}

export function useModalPago({ mostrar, setMostrar, contenido, tipoContenido }: Params) {
    const { usuario } = useUsuario();
    const EPAYCO_PUBLIC_KEY = import.meta.env.VITE_EPAYCO_PUBLIC_KEY;

    const [pasoActual, setPasoActual] = useState(1);
    const [cargando, setCargando] = useState(false);
    const [procesandoPago, setProcesandoPago] = useState(false);
    const [error, setError] = useState('');
    const [pagoExitoso, setPagoExitoso] = useState(false);
    const [usuarioEstaRegistrado, setUsuarioEstaRegistrado] = useState(false);
    const [ultimoIntentoPago, setUltimoIntentoPago] = useState(0);
    const [datosPago, setDatosPago] = useState<DatosPago>(DATOS_INICIALES);
    const [erroresValidacion, setErroresValidacion] = useState({
        email: '', telefono: '', documento: '', password: '',
    });

    useEffect(() => {
        if (mostrar) {
            verificarUsuario();
        } else {
            setTimeout(() => {
                setPasoActual(1);
                setError('');
                setCargando(false);
                setPagoExitoso(false);
            }, 300);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mostrar, usuario]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fallbackCtx = () => setDatosPago(prev => ({
        ...prev,
        nombre: usuario?.nombre || '',
        email: usuario?.email || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        telefono: (usuario as any)?.telefono || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        whatsapp: (usuario as any)?.telefono || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ciudad: (usuario as any)?.ciudad || '',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pais: (usuario as any)?.pais || 'Colombia',
    }));

    const verificarUsuario = async () => {
        if (!usuario) { setUsuarioEstaRegistrado(false); setPasoActual(1); return; }
        setUsuarioEstaRegistrado(true);
        setPasoActual(1);
        try {
            const { data: perfil, error } = await supabase
                .from('perfiles')
                .select('nombre, apellido, correo_electronico, whatsapp, documento_tipo, documento_numero, direccion_completa, ciudad, pais, codigo_postal')
                .eq('id', usuario.id)
                .single();
            if (error || !perfil) { fallbackCtx(); return; }
            setDatosPago(prev => ({
                ...prev,
                nombre: perfil.nombre || '',
                apellido: perfil.apellido || '',
                email: perfil.correo_electronico || usuario.email || '',
                telefono: perfil.whatsapp || '',
                whatsapp: perfil.whatsapp || '',
                tipo_documento: perfil.documento_tipo || 'CC',
                numero_documento: perfil.documento_numero || '',
                direccion: perfil.direccion_completa || '',
                ciudad: perfil.ciudad || '',
                pais: perfil.pais || 'Colombia',
                codigo_postal: perfil.codigo_postal || '',
            }));
        } catch { fallbackCtx(); }
    };

    const limpiarTelefono = (tel: string): string =>
        tel ? tel.replace(/^\+\d{1,3}/, '').replace(/\s/g, '').trim() : '';

    const guardarPerfilUsuario = async (usuarioId: string) => {
        try {
            const datos: Record<string, string | null> = {};
            if (datosPago.nombre) datos.nombre = datosPago.nombre;
            if (datosPago.apellido) datos.apellido = datosPago.apellido;
            if (datosPago.nombre && datosPago.apellido)
                datos.nombre_completo = `${datosPago.nombre} ${datosPago.apellido}`;
            if (datosPago.email) datos.correo_electronico = datosPago.email;
            const tel = limpiarTelefono(datosPago.telefono || datosPago.whatsapp);
            if (tel) datos.whatsapp = tel;
            if (datosPago.tipo_documento) datos.documento_tipo = datosPago.tipo_documento;
            if (datosPago.numero_documento) datos.documento_numero = datosPago.numero_documento;
            if (datosPago.direccion) datos.direccion_completa = datosPago.direccion;
            if (datosPago.ciudad) datos.ciudad = datosPago.ciudad;
            if (datosPago.pais) datos.pais = datosPago.pais;
            if (datosPago.codigo_postal) datos.codigo_postal = datosPago.codigo_postal;
            if (Object.keys(datos).length > 0)
                await supabase.from('perfiles').update(datos).eq('id', usuarioId);
        } catch { /* non-fatal */ }
    };

    const cerrarModal = () => setMostrar(false);

    const validarEmail = (email: string) => {
        const ok = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim());
        setErroresValidacion(prev => ({ ...prev, email: email && !ok ? 'Email inválido' : '' }));
    };

    const validarTelefono = (telefono: string) => {
        const ok = /^\d{7,15}$/.test(telefono.replace(/[\s\-\(\)]/g, ''));
        setErroresValidacion(prev => ({ ...prev, telefono: telefono && !ok ? 'Teléfono debe tener 7-15 dígitos' : '' }));
    };

    const validarDocumento = (documento: string, tipo: string) => {
        const doc = documento.replace(/[\s\-\.]/g, '');
        let msg = '';
        if (documento) {
            if (tipo === 'CC' && (doc.length < 6 || doc.length > 10)) msg = 'Cédula: 6-10 dígitos';
            else if (tipo === 'NIT' && (doc.length < 9 || doc.length > 12)) msg = 'NIT: 9-12 dígitos';
        }
        setErroresValidacion(prev => ({ ...prev, documento: msg }));
    };

    const validarPassword = (password: string | undefined) => {
        if (!password) return;
        let msg = '';
        if (password.length < 8) msg = 'Mínimo 8 caracteres';
        else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) msg = 'Debe tener letra y número';
        setErroresValidacion(prev => ({ ...prev, password: msg }));
    };

    const validarDatosPago = (): boolean => {
        if (!datosPago.nombre || !datosPago.email || !datosPago.telefono) {
            setError('Por favor completa nombre, email y teléfono'); return false;
        }
        if (!datosPago.numero_documento || !datosPago.direccion || !datosPago.ciudad) {
            setError('Por favor completa los datos de facturación'); return false;
        }
        if (!usuarioEstaRegistrado) {
            if (!datosPago.password || datosPago.password.length < 8) {
                setError('La contraseña es inválida'); return false;
            }
            if (datosPago.password !== datosPago.confirmarPassword) {
                setError('Las contraseñas no coinciden'); return false;
            }
        }
        if (erroresValidacion.email || erroresValidacion.telefono || erroresValidacion.documento || erroresValidacion.password) {
            setError('Corrige los errores marcados en rojo'); return false;
        }
        return true;
    };

    const loadEpaycoScript = (): Promise<boolean> => new Promise((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).ePayco && document.querySelector('script[src="https://checkout.epayco.co/checkout.js"]')) {
            resolve(true); return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.epayco.co/checkout.js';
        script.async = true;
        script.onload = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).ePayco) resolve(true);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            else setTimeout(() => (window as any).ePayco ? resolve(true) : reject(new Error('ePayco no inicializado')), 1000);
        };
        script.onerror = () => reject(new Error('Error cargando ePayco'));
        document.head.appendChild(script);
    });

    const crearOObtenerUsuario = async (): Promise<string | null> => {
        if (usuario?.id) return usuario.id;
        try {
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: datosPago.email,
                password: datosPago.password,
                options: { data: { nombre: datosPago.nombre, apellido: datosPago.apellido } },
            });
            if (signUpError) {
                if (signUpError.message?.includes('already registered') || signUpError.message?.includes('User already exists')) {
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                        email: datosPago.email, password: datosPago.password,
                    });
                    if (signInError) throw new Error('El email ya existe pero la contraseña es incorrecta');
                    if (signInData?.session)
                        await supabase.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });
                    return signInData?.user?.id || null;
                }
                throw signUpError;
            }
            if (authData?.session)
                await supabase.auth.setSession({ access_token: authData.session.access_token, refresh_token: authData.session.refresh_token });
            return authData?.user?.id || null;
        } catch (err: unknown) {
            throw new Error((err as Error).message || 'Error al registrar usuario');
        }
    };

    const obtenerPrecio = (item: ContenidoCompra | null) => {
        if (!item) return 0;
        return tipoContenido === 'membresia'
            ? (item.precio || item.precio_mensual || 0)
            : (item.precio_rebajado || item.precio_normal || 0);
    };

    const obtenerTitulo = (item: ContenidoCompra | null) => {
        if (!item) return 'Contenido';
        return tipoContenido === 'membresia' ? (item.nombre || 'Membresía') : (item.titulo || 'Producto');
    };

    const obtenerLabelTipo = () =>
        ({ curso: 'Curso', tutorial: 'Tutorial', paquete: 'Paquete', membresia: 'Membresía' }[tipoContenido] || 'Membresía');

    const calcularIVA = (valor: number) => {
        const iva = Math.round(valor * 0.19);
        return { base: valor - iva, iva, total: valor };
    };

    const generarRefPaycoReal = () => {
        const prefijo = ({ curso: 'CUR', tutorial: 'TUT', paquete: 'PAQ', membresia: 'MEM' }[tipoContenido] || 'MEM');
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const idSanitizado = String(contenido?.id ?? 'ITEM').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const maxId = Math.max(1, 32 - prefijo.length - timestamp.length - random.length - 3);
        return `${prefijo}-${(idSanitizado || 'ITEM').substring(0, maxId)}-${timestamp}-${random}`.substring(0, 32);
    };

    const procesarPago = async () => {
        const ahora = Date.now();
        if (procesandoPago || ahora - ultimoIntentoPago < 3000) return;
        setProcesandoPago(true);
        setUltimoIntentoPago(ahora);
        setCargando(true);
        setError('');
        try {
            const usuarioId = usuarioEstaRegistrado ? (usuario?.id || null) : await crearOObtenerUsuario();
            if (!usuarioId) throw new Error('No se pudo obtener ID de usuario');

            await loadEpaycoScript();

            const precio = obtenerPrecio(contenido);
            if (precio <= 0) {
                setPagoExitoso(true); setCargando(false); setProcesandoPago(false); return;
            }

            const refPayco = generarRefPaycoReal();
            const { base, iva, total } = calcularIVA(precio);

            const resultado = await crearRegistroPago({
                usuario_id: usuarioId,
                curso_id: tipoContenido === 'curso' ? String(contenido?.id || '') : undefined,
                tutorial_id: tipoContenido === 'tutorial' ? String(contenido?.id || '') : undefined,
                paquete_id: tipoContenido === 'paquete' ? String(contenido?.id || '') : undefined,
                membresia_id: tipoContenido === 'membresia' ? String(contenido?.id || '') : undefined,
                nombre_producto: obtenerTitulo(contenido),
                descripcion: `${obtenerLabelTipo()}: ${obtenerTitulo(contenido)}`,
                valor: total, iva, base_iva: base, moneda: 'COP',
                ref_payco: refPayco, factura: refPayco,
                nombre: datosPago.nombre, apellido: datosPago.apellido,
                email: datosPago.email, telefono: datosPago.telefono, whatsapp: datosPago.whatsapp,
                fecha_nacimiento: datosPago.fecha_nacimiento, profesion: datosPago.profesion,
                documento_tipo: datosPago.tipo_documento, documento_numero: datosPago.numero_documento,
                direccion_completa: datosPago.direccion, ciudad: datosPago.ciudad,
                pais: datosPago.pais, codigo_postal: datosPago.codigo_postal,
                como_nos_conocio: datosPago.como_nos_conocio, user_agent: navigator.userAgent,
            });

            if (!resultado.success) throw new Error(resultado.message || 'Error al registrar el pago');

            await guardarPerfilUsuario(usuarioId);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (!(window as any).ePayco) throw new Error('Epayco no disponible');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const handler = (window as any).ePayco.checkout.configure({
                key: EPAYCO_PUBLIC_KEY || '491d6a0b6e992cf924edd8d3d088aff1',
                test: import.meta.env.VITE_EPAYCO_TEST_MODE === 'true',
            });

            handler.open({
                name: obtenerTitulo(contenido),
                description: obtenerTitulo(contenido),
                invoice: refPayco,
                currency: 'cop',
                amount: total.toString(),
                tax_base: base.toString(),
                tax: iva.toString(),
                country: 'co',
                lang: 'es',
                name_billing: `${datosPago.nombre} ${datosPago.apellido}`,
                address_billing: datosPago.direccion,
                type_doc_billing: datosPago.tipo_documento,
                mobilephone_billing: limpiarTelefono(datosPago.telefono || datosPago.whatsapp),
                number_doc_billing: datosPago.numero_documento,
                email_billing: datosPago.email,
                response: `${EPAYCO_RESPONSE_URL}?invoice=${refPayco}`,
                url_response: `${EPAYCO_RESPONSE_URL}?invoice=${refPayco}`,
                confirmation: EPAYCO_CONFIRMATION_URL,
                method: 'GET',
            });

            setMostrar(false);
            const t = setTimeout(() => { setMostrar(true); setError(''); setCargando(false); setProcesandoPago(false); }, 30000);
            setCargando(false);
            setProcesandoPago(false);
            return () => clearTimeout(t);

        } catch (err: unknown) {
            setError((err as Error).message || 'Error procesando el pago');
            setCargando(false);
            setProcesandoPago(false);
        }
    };

    const handleSiguiente = () => {
        if (pasoActual === 1) {
            if (!usuarioEstaRegistrado || !datosPago.numero_documento || !datosPago.direccion) {
                setPasoActual(2);
            } else {
                procesarPago();
            }
        } else if (pasoActual === 2 && validarDatosPago()) {
            procesarPago();
        }
    };

    return {
        usuario,
        pasoActual, setPasoActual,
        cargando, procesandoPago, error, pagoExitoso,
        usuarioEstaRegistrado,
        datosPago, setDatosPago,
        erroresValidacion,
        validarEmail, validarTelefono, validarDocumento, validarPassword,
        handleSiguiente, cerrarModal,
        obtenerPrecio, obtenerTitulo, obtenerLabelTipo,
    };
}
