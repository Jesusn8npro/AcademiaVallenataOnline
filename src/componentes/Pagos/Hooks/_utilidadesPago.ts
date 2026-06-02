import { supabase } from '../../../servicios/clienteSupabase';

export interface ContenidoCompra {
    id: string | number;
    titulo?: string;
    nombre?: string;
    precio_normal?: number;
    precio_rebajado?: number;
    precio?: number;
    precio_mensual?: number;
    [key: string]: any;
}

export interface DatosPago {
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    whatsapp: string;
    callingCode: string;
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

export const EPAYCO_RESPONSE_URL = 'https://academiavallenataonline.com/pago-exitoso';
export const EPAYCO_CONFIRMATION_URL = 'https://tbijzvtyyewhtwgakgka.supabase.co/functions/v1/epayco-webhook';

export const DATOS_INICIALES: DatosPago = {
    nombre: '', apellido: '', email: '', telefono: '', whatsapp: '', callingCode: '+57',
    tipo_documento: 'CC', numero_documento: '', direccion: '',
    ciudad: '', pais: 'Colombia', codigo_postal: '', password: '', confirmarPassword: '',
};

// Quita el código de país de un teléfono E.164 ("+573001234567" -> "3001234567").
// Importante: recorta EXACTAMENTE el código de país (callingCode), no un \d{1,3}
// greedy — ese bug se comía el primer dígito real del número y ePayco recibía el
// teléfono incompleto.
export function limpiarTelefono(tel: string, callingCode?: string): string {
    if (!tel) return '';
    let s = tel.replace(/[\s\-()]/g, '').replace(/^\+/, '');
    const cc = (callingCode || '').replace(/[^\d]/g, '');
    if (cc && s.startsWith(cc)) s = s.slice(cc.length);
    return s.trim();
}

// Asegura formato E.164 para alimentar al PhoneInput. Si el número no trae '+'
// (ej. viene del perfil como nacional "3123790071"), antepone el callingCode
// (por defecto +57 Colombia). Sin esto, react-international-phone adivina mal el
// país a partir de los dígitos (p.ej. "31..." -> Holanda +31).
export function aE164(tel: string, callingCode = '+57'): string {
    if (!tel) return '';
    const t = tel.trim();
    if (t.startsWith('+')) return t.replace(/[\s\-()]/g, '');
    const cc = callingCode.startsWith('+') ? callingCode : '+' + callingCode;
    return cc + t.replace(/[^\d]/g, '');
}

export function calcularIVA(valor: number) {
    const iva = Math.round(valor * 0.19);
    return { base: valor - iva, iva, total: valor };
}

export function obtenerPrecio(item: ContenidoCompra | null, tipoContenido: string): number {
    if (!item) return 0;
    return tipoContenido === 'membresia'
        ? (item.precio || item.precio_mensual || 0)
        : (item.precio_rebajado || item.precio_normal || 0);
}

export function obtenerTitulo(item: ContenidoCompra | null, tipoContenido: string): string {
    if (!item) return 'Contenido';
    return tipoContenido === 'membresia' ? (item.nombre || 'Membresía') : (item.titulo || 'Producto');
}

export function obtenerLabelTipo(tipoContenido: string): string {
    return ({ curso: 'Curso', tutorial: 'Tutorial', paquete: 'Paquete', membresia: 'Membresía' } as Record<string, string>)[tipoContenido] || 'Membresía';
}

export function generarRefPaycoReal(tipoContenido: string, contenidoId: string | number | undefined): string {
    const prefijo = ({ curso: 'CUR', tutorial: 'TUT', paquete: 'PAQ', membresia: 'MEM' } as Record<string, string>)[tipoContenido] || 'MEM';
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const idSanitizado = String(contenidoId ?? 'ITEM').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const maxId = Math.max(1, 32 - prefijo.length - timestamp.length - random.length - 3);
    return `${prefijo}-${(idSanitizado || 'ITEM').substring(0, maxId)}-${timestamp}-${random}`.substring(0, 32);
}

// SDK v2 de Epayco. El viejo (checkout.js) abre iframe a new-checkout.epayco.co
// que envia X-Frame-Options: DENY -> modal vacio. El v2 usa sessionId server-side
// y soporta modal onpage real (external:false).
const EPAYCO_SDK_URL = 'https://checkout.epayco.co/checkout-v2.js';

export function loadEpaycoScript(): Promise<boolean> {
    return new Promise((resolve, reject) => {
        if ((window as any).ePayco && document.querySelector(`script[src="${EPAYCO_SDK_URL}"]`)) {
            resolve(true); return;
        }
        const script = document.createElement('script');
        script.src = EPAYCO_SDK_URL;
        script.async = true;
        script.onload = () => {
            if ((window as any).ePayco) resolve(true);
            else setTimeout(() => (window as any).ePayco ? resolve(true) : reject(new Error('ePayco no inicializado')), 1000);
        };
        script.onerror = () => reject(new Error('Error cargando ePayco'));
        document.head.appendChild(script);
    });
}

// Llama a la Edge Function epayco-crear-sesion para obtener un sessionId
// server-side (usando PRIVATE_KEY que vive solo en Supabase). El SDK v2
// luego consume ese sessionId con .configure({sessionId, external:false}).
export interface CrearSesionEpaycoDatos {
    refPayco: string;
    nombreProducto: string;
    descripcion?: string;
    total: number;
    base: number;
    iva: number;
    nombre: string;
    apellido?: string;
    email: string;
    telefono: string;
    callingCode?: string;
    direccion?: string;
    tipoDocumento: string;
    numeroDocumento: string;
    ciudad?: string;
    pais?: string;
    responseUrl: string;
}

// Separa un telefono en formato E.164 ("+523001234567") en codigo de pais
// y numero local. Si no es E.164 (no empieza con +), asume Colombia.
export function parsearTelefonoE164(e164: string): { callingCode: string; numero: string } {
    if (!e164) return { callingCode: '+57', numero: '' };
    const match = e164.match(/^\+(\d{1,4})(\d{6,})$/);
    if (match) return { callingCode: '+' + match[1], numero: match[2] };
    return { callingCode: '+57', numero: e164.replace(/\D/g, '') };
}

export async function crearSesionEpayco(datos: CrearSesionEpaycoDatos): Promise<string> {
    const { data: sesion } = await supabase.auth.getSession();
    const token = sesion?.session?.access_token;
    if (!token) throw new Error('Usuario no autenticado');

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${baseUrl}/functions/v1/epayco-crear-sesion`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(datos),
    });

    const result = await response.json();
    if (!response.ok || !result?.sessionId) {
        throw new Error(result?.error || `Error creando sesion Epayco (${response.status})`);
    }
    return result.sessionId;
}

export async function guardarPerfilUsuario(usuarioId: string, datosPago: DatosPago): Promise<void> {
    try {
        const datos: Record<string, string | null> = {};
        if (datosPago.nombre) datos.nombre = datosPago.nombre;
        if (datosPago.apellido) datos.apellido = datosPago.apellido;
        if (datosPago.nombre && datosPago.apellido) datos.nombre_completo = `${datosPago.nombre} ${datosPago.apellido}`;
        if (datosPago.email) datos.correo_electronico = datosPago.email;
        const tel = limpiarTelefono(datosPago.telefono || datosPago.whatsapp, datosPago.callingCode);
        if (tel) datos.whatsapp = tel;
        if (datosPago.tipo_documento) datos.documento_tipo = datosPago.tipo_documento;
        if (datosPago.numero_documento) datos.documento_numero = datosPago.numero_documento;
        if (datosPago.direccion) datos.direccion_completa = datosPago.direccion;
        if (datosPago.ciudad) datos.ciudad = datosPago.ciudad;
        if (datosPago.pais) datos.pais = datosPago.pais;
        if (datosPago.codigo_postal) datos.codigo_postal = datosPago.codigo_postal;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (Object.keys(datos).length > 0) await supabase.from('perfiles').update(datos as any).eq('id', usuarioId);
    } catch { /* non-fatal */ }
}

// Activa una compra cuyo total quedó en $0 por un cupón. Llama a la Edge Function
// activar-compra-gratis, que registra el pago, da acceso y consume el cupón
// server-side (re-validando precio y cupón). Sin esto, una compra gratis solo
// mostraría "pago exitoso" sin entregar el contenido.
export async function activarCompraGratis(params: {
    tipo: string;
    contenidoId: string | number | undefined;
    cuponCodigo: string;
    datos: DatosPago;
}): Promise<{ ok: boolean; ref_payco?: string; ya_activo?: boolean }> {
    const { data: sesion } = await supabase.auth.getSession();
    const token = sesion?.session?.access_token;
    if (!token) throw new Error('Usuario no autenticado');

    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${baseUrl}/functions/v1/activar-compra-gratis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
            tipo: params.tipo,
            contenido_id: String(params.contenidoId ?? ''),
            cupon_codigo: params.cuponCodigo,
            datos: {
                nombre: params.datos.nombre,
                apellido: params.datos.apellido,
                telefono: limpiarTelefono(params.datos.telefono || params.datos.whatsapp, params.datos.callingCode),
                tipo_documento: params.datos.tipo_documento,
                numero_documento: params.datos.numero_documento,
                direccion: params.datos.direccion,
                ciudad: params.datos.ciudad,
                pais: params.datos.pais,
                codigo_postal: params.datos.codigo_postal,
            },
        }),
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.ok) {
        throw new Error(result?.error || `Error activando la compra (${response.status})`);
    }
    return result;
}
