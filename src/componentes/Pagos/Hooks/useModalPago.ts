import { useState, useEffect } from 'react';
import { useUsuario } from '../../../contextos/UsuarioContext';
import { supabase } from '../../../servicios/clienteSupabase';
import { crearRegistroPago } from '../../../servicios/pagoService';
import {
    type ContenidoCompra, type DatosPago,
    EPAYCO_RESPONSE_URL, EPAYCO_CONFIRMATION_URL, DATOS_INICIALES,
    limpiarTelefono, calcularIVA, obtenerPrecio, obtenerTitulo, obtenerLabelTipo,
    generarRefPaycoReal, loadEpaycoScript, guardarPerfilUsuario
} from './_utilidadesPago';
export type { ContenidoCompra } from './_utilidadesPago';

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
            setTimeout(() => { setPasoActual(1); setError(''); setCargando(false); setPagoExitoso(false); }, 300);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mostrar, usuario]);

    const fallbackCtx = () => setDatosPago(prev => ({
        ...prev,
        nombre: usuario?.nombre || '',
        email: usuario?.email || '',
        telefono: (usuario as any)?.telefono || '',
        whatsapp: (usuario as any)?.telefono || '',
        ciudad: (usuario as any)?.ciudad || '',
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
            if (!datosPago.password || datosPago.password.length < 8) { setError('La contraseña es inválida'); return false; }
            if (datosPago.password !== datosPago.confirmarPassword) { setError('Las contraseñas no coinciden'); return false; }
        }
        if (erroresValidacion.email || erroresValidacion.telefono || erroresValidacion.documento || erroresValidacion.password) {
            setError('Corrige los errores marcados en rojo'); return false;
        }
        return true;
    };

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
                    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email: datosPago.email, password: datosPago.password });
                    if (signInError) throw new Error('El email ya existe pero la contraseña es incorrecta');
                    if (signInData?.session) await supabase.auth.setSession({ access_token: signInData.session.access_token, refresh_token: signInData.session.refresh_token });
                    return signInData?.user?.id || null;
                }
                throw signUpError;
            }
            if (authData?.session) await supabase.auth.setSession({ access_token: authData.session.access_token, refresh_token: authData.session.refresh_token });
            return authData?.user?.id || null;
        } catch (err: unknown) {
            throw new Error((err as Error).message || 'Error al registrar usuario');
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
            const usuarioId = usuarioEstaRegistrado ? (usuario?.id || null) : await crearOObtenerUsuario();
            if (!usuarioId) throw new Error('No se pudo obtener ID de usuario');

            await loadEpaycoScript();

            const precio = obtenerPrecio(contenido, tipoContenido);
            if (precio <= 0) { setPagoExitoso(true); setCargando(false); setProcesandoPago(false); return; }

            const refPayco = generarRefPaycoReal(tipoContenido, contenido?.id);
            const { base, iva, total } = calcularIVA(precio);

            const resultado = await crearRegistroPago({
                usuario_id: usuarioId,
                curso_id: tipoContenido === 'curso' ? String(contenido?.id || '') : undefined,
                tutorial_id: tipoContenido === 'tutorial' ? String(contenido?.id || '') : undefined,
                paquete_id: tipoContenido === 'paquete' ? String(contenido?.id || '') : undefined,
                membresia_id: tipoContenido === 'membresia' ? String(contenido?.id || '') : undefined,
                nombre_producto: obtenerTitulo(contenido, tipoContenido),
                descripcion: `${obtenerLabelTipo(tipoContenido)}: ${obtenerTitulo(contenido, tipoContenido)}`,
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

            await guardarPerfilUsuario(usuarioId, datosPago);

            if (!(window as any).ePayco) throw new Error('Epayco no disponible');

            const handler = (window as any).ePayco.checkout.configure({
                key: EPAYCO_PUBLIC_KEY || '491d6a0b6e992cf924edd8d3d088aff1',
                test: import.meta.env.VITE_EPAYCO_TEST_MODE === 'true',
            });

            handler.open({
                name: obtenerTitulo(contenido, tipoContenido),
                description: obtenerTitulo(contenido, tipoContenido),
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
            if (!usuarioEstaRegistrado || !datosPago.numero_documento || !datosPago.direccion) setPasoActual(2);
            else procesarPago();
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
        obtenerPrecio: (item: ContenidoCompra | null) => obtenerPrecio(item, tipoContenido),
        obtenerTitulo: (item: ContenidoCompra | null) => obtenerTitulo(item, tipoContenido),
        obtenerLabelTipo: () => obtenerLabelTipo(tipoContenido),
    };
}
