import type { DatosGeolocalizacion, ErrorGeolocalizacion } from './tipos';

interface RespuestaIpapi {
    ip: string;
    city: string;
    region: string;
    country_name: string;
    country_code: string;
    latitude: number;
    longitude: number;
    timezone: string;
    org: string;
    postal?: string;
    currency?: string;
    language?: string;
    is_mobile?: boolean;
    is_proxy?: boolean;
    is_vpn?: boolean;
    error?: boolean;
    reason?: string;
}

const URL_BASE_API = 'https://ipapi.co';
const RETRASO_LIMITE_VELOCIDAD = 150;
const cache = new Map<string, DatosGeolocalizacion>();
let tiempoUltimaSolicitud = 0;

async function respetarLimiteVelocidad(): Promise<void> {
    const tiempoActual = Date.now();
    const tiempoTranscurrido = tiempoActual - tiempoUltimaSolicitud;
    if (tiempoTranscurrido < RETRASO_LIMITE_VELOCIDAD) {
        await new Promise(resolve => setTimeout(resolve, RETRASO_LIMITE_VELOCIDAD - tiempoTranscurrido));
    }
    tiempoUltimaSolicitud = Date.now();
}

export async function obtenerIpPublica(): Promise<string | null> {
    try {
        await respetarLimiteVelocidad();
        const controlador = new AbortController();
        const timeoutId = setTimeout(() => controlador.abort(), 10000);
        const respuesta = await fetch(`${URL_BASE_API}/ip`, {
            signal: controlador.signal,
            method: 'GET',
            headers: { 'Accept': 'text/plain', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        clearTimeout(timeoutId);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
        const ip = (await respuesta.text()).trim();
        if (!ip || ip.length < 7) throw new Error('IP inválida recibida');
        return ip;
    } catch {
        try {
            const fb = await fetch('https://api.ipify.org?format=text', { headers: { 'Accept': 'text/plain' } });
            if (fb.ok) return (await fb.text()).trim();
        } catch { /* ignorar */ }
        return null;
    }
}

async function obtenerGeolocalizacionFallback(ip: string): Promise<DatosGeolocalizacion | ErrorGeolocalizacion> {
    try {
        const respuesta = await fetch(
            `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,query`,
            { headers: { 'Accept': 'application/json' } }
        );
        if (!respuesta.ok) throw new Error(`Error en API fallback: ${respuesta.status}`);
        const data = await respuesta.json();
        if (data.status === 'fail') throw new Error(`API fallback falló: ${data.message}`);
        return {
            ip: data.query,
            ciudad: data.city || 'Desconocida',
            region: data.regionName || data.region || 'Desconocida',
            pais: data.country,
            codigoPais: data.countryCode.toLowerCase(),
            latitud: data.lat || 0,
            longitud: data.lon || 0,
            zonaHoraria: data.timezone || 'UTC',
            organizacion: data.org || data.isp || 'Desconocida',
            codigoPostal: data.zip,
            moneda: undefined,
            idioma: 'es',
            esMovil: false,
            esProxy: false,
            esVpn: false,
            urlBandera: `https://flagcdn.com/32x24/${data.countryCode.toLowerCase()}.png`,
            datosCompletos: data
        };
    } catch (error: any) {
        return { error: true, mensaje: `Error en todas las APIs de geolocalización: ${error.message}`, tipoError: 'API' };
    }
}

export async function obtenerGeolocalizacion(ip?: string): Promise<DatosGeolocalizacion | ErrorGeolocalizacion> {
    try {
        if (ip && cache.has(ip)) return cache.get(ip)!;
        await respetarLimiteVelocidad();
        if (!ip) {
            const ipObtenida = await obtenerIpPublica();
            if (!ipObtenida) return { error: true, mensaje: 'No se pudo obtener la IP pública', tipoError: 'RED' };
            ip = ipObtenida;
        }
        const controlador = new AbortController();
        const timeoutId = setTimeout(() => controlador.abort(), 15000);
        const respuesta = await fetch(`${URL_BASE_API}/${ip}/json/`, {
            signal: controlador.signal,
            method: 'GET',
            headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        clearTimeout(timeoutId);
        if (!respuesta.ok) {
            if (respuesta.status === 429) return obtenerGeolocalizacionFallback(ip);
            throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
        }
        const datosRaw: RespuestaIpapi = await respuesta.json();
        if (datosRaw.error || !datosRaw.country_name || !datosRaw.city) {
            return obtenerGeolocalizacionFallback(ip);
        }
        const datos: DatosGeolocalizacion = {
            ip: datosRaw.ip,
            ciudad: datosRaw.city,
            region: datosRaw.region || 'Desconocida',
            pais: datosRaw.country_name,
            codigoPais: datosRaw.country_code.toLowerCase(),
            latitud: datosRaw.latitude,
            longitud: datosRaw.longitude,
            zonaHoraria: datosRaw.timezone,
            organizacion: datosRaw.org || 'Desconocida',
            codigoPostal: datosRaw.postal,
            moneda: datosRaw.currency,
            idioma: datosRaw.language || 'es',
            esMovil: datosRaw.is_mobile || false,
            esProxy: datosRaw.is_proxy || false,
            esVpn: datosRaw.is_vpn || false,
            urlBandera: `https://flagcdn.com/32x24/${datosRaw.country_code.toLowerCase()}.png`,
            datosCompletos: datosRaw
        };
        if (datos.ip) cache.set(datos.ip, datos);
        return datos;
    } catch (error: any) {
        if (error.name === 'AbortError') return { error: true, mensaje: 'Tiempo de espera agotado al consultar ipapi.co', tipoError: 'RED' };
        if (ip) return obtenerGeolocalizacionFallback(ip);
        return { error: true, mensaje: `Error de red con ipapi.co: ${error.message}`, tipoError: 'RED' };
    }
}

export function limpiarCache(): void {
    cache.clear();
}
