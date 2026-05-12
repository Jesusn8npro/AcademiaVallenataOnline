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
    nombre: '', apellido: '', email: '', telefono: '', whatsapp: '',
    tipo_documento: 'CC', numero_documento: '', direccion: '',
    ciudad: '', pais: 'Colombia', codigo_postal: '', password: '', confirmarPassword: '',
};

export function limpiarTelefono(tel: string): string {
    return tel ? tel.replace(/^\+\d{1,3}/, '').replace(/\s/g, '').trim() : '';
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
    direccion?: string;
    tipoDocumento: string;
    numeroDocumento: string;
    ciudad?: string;
    pais?: string;
    responseUrl: string;
}

export async function crearSesionEpayco(datos: CrearSesionEpaycoDatos): Promise<string> {
    const { data: sesion } = await supabase.auth.getSession();
    const token = sesion?.session?.access_token;
    if (!token) throw new Error('Usuario no autenticado');

    const baseUrl = import.meta.env.VITE_SUPABASE_URL;
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
        const tel = limpiarTelefono(datosPago.telefono || datosPago.whatsapp);
        if (tel) datos.whatsapp = tel;
        if (datosPago.tipo_documento) datos.documento_tipo = datosPago.tipo_documento;
        if (datosPago.numero_documento) datos.documento_numero = datosPago.numero_documento;
        if (datosPago.direccion) datos.direccion_completa = datosPago.direccion;
        if (datosPago.ciudad) datos.ciudad = datosPago.ciudad;
        if (datosPago.pais) datos.pais = datosPago.pais;
        if (datosPago.codigo_postal) datos.codigo_postal = datosPago.codigo_postal;
        if (Object.keys(datos).length > 0) await supabase.from('perfiles').update(datos).eq('id', usuarioId);
    } catch { /* non-fatal */ }
}
