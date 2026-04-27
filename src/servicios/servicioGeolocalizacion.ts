/**
 * 🇪🇸 SERVICIO DE GEOLOCALIZACIÓN PROFESIONAL - IPAPI.CO (Versión React)
 * =====================================================
 * 
 * Servicio completamente en español para trabajar con ipapi.co
 * - Plan gratuito: 30,000 solicitudes/mes (1,000/día)
 * - No requiere clave API para uso básico
 * - Manejo inteligente de límites de velocidad y errores
 * - Cache para evitar solicitudes duplicadas
 * - Fallbacks en caso de errores
 */

import { supabase } from './clienteSupabase';

// Interfaces
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

export interface DatosGeolocalizacion {
    ip: string;
    ciudad: string;
    region: string;
    pais: string;
    codigoPais: string;
    latitud: number;
    longitud: number;
    zonaHoraria: string;
    organizacion: string;
    codigoPostal?: string;
    moneda?: string;
    idioma?: string;
    esMovil: boolean;
    esProxy: boolean;
    esVpn: boolean;
    urlBandera: string;
    datosCompletos: any;
}

export interface ErrorGeolocalizacion {
    error: true;
    mensaje: string;
    codigo?: string;
    tipoError: 'RED' | 'API' | 'DATOS' | 'LIMITE';
}

class ServicioGeolocalizacion {
    private static instancia: ServicioGeolocalizacion;
    private readonly URL_BASE_API = 'https://ipapi.co';
    private readonly RETRASO_LIMITE_VELOCIDAD = 150; // ms entre solicitudes
    private cache: Map<string, DatosGeolocalizacion> = new Map();
    private tiempoUltimaSolicitud = 0;

    static obtenerInstancia(): ServicioGeolocalizacion {
        if (!ServicioGeolocalizacion.instancia) {
            ServicioGeolocalizacion.instancia = new ServicioGeolocalizacion();
        }
        return ServicioGeolocalizacion.instancia;
    }

    /**
     * Obtener IP pública del usuario
     */
    async obtenerIpPublica(): Promise<string | null> {
        try {
            await this.respetarLimiteVelocidad();

            const controlador = new AbortController();
            const timeoutId = setTimeout(() => controlador.abort(), 10000);

            const respuesta = await fetch(`https://ipapi.co/ip`, {
                signal: controlador.signal,
                method: 'GET',
                headers: {
                    'Accept': 'text/plain',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            clearTimeout(timeoutId);

            if (!respuesta.ok) {
                throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
            }

            const ip = await respuesta.text();
            const ipLimpia = ip.trim();

            if (!ipLimpia || ipLimpia.length < 7) {
                throw new Error('IP inválida recibida');
            }

            return ipLimpia;

        } catch (error: any) {
            // FALLBACK: Usar servicio alternativo
            try {
                const respuestaFallback = await fetch('https://api.ipify.org?format=text', {
                    headers: {
                        'Accept': 'text/plain'
                    }
                });

                if (respuestaFallback.ok) {
                    const ipFallback = await respuestaFallback.text();
                    return ipFallback.trim();
                }
            } catch (fallbackError) {
                // Ignorar error de fallback
            }

            return null;
        }
    }

    /**
     * Obtener geolocalización completa de una IP usando ipapi.co REAL
     */
    async obtenerGeolocalizacion(ip?: string): Promise<DatosGeolocalizacion | ErrorGeolocalizacion> {
        try {
            // Verificar cache primero
            if (ip && this.cache.has(ip)) {
                return this.cache.get(ip)!;
            }

            await this.respetarLimiteVelocidad();

            // Si no se proporciona IP, obtener la IP actual del usuario
            if (!ip) {
                const ipObtenida = await this.obtenerIpPublica();
                if (!ipObtenida) {
                    return {
                        error: true,
                        mensaje: 'No se pudo obtener la IP pública',
                        tipoError: 'RED'
                    };
                }
                ip = ipObtenida;
            }

            const controlador = new AbortController();
            const timeoutId = setTimeout(() => controlador.abort(), 15000);

            const respuesta = await fetch(`https://ipapi.co/${ip}/json/`, {
                signal: controlador.signal,
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            clearTimeout(timeoutId);

            if (!respuesta.ok) {
                if (respuesta.status === 429) {
                    return await this.obtenerGeolocalizacionFallback(ip);
                }
                throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
            }

            const datosRaw: RespuestaIpapi = await respuesta.json();

            if (datosRaw.error) {
                return await this.obtenerGeolocalizacionFallback(ip);
            }

            if (!datosRaw.country_name || !datosRaw.city) {
                return await this.obtenerGeolocalizacionFallback(ip);
            }

            const datosEspanol: DatosGeolocalizacion = {
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

            if (datosEspanol.ip) {
                this.cache.set(datosEspanol.ip, datosEspanol);
            }

            return datosEspanol;

        } catch (error: any) {

            if (error.name === 'AbortError') {
                return {
                    error: true,
                    mensaje: 'Tiempo de espera agotado al consultar ipapi.co',
                    tipoError: 'RED'
                };
            }

            if (ip) {
                return await this.obtenerGeolocalizacionFallback(ip);
            }

            return {
                error: true,
                mensaje: `Error de red con ipapi.co: ${error.message}`,
                tipoError: 'RED'
            };
        }
    }

    /**
     * Método fallback usando ip-api.com
     */
    private async obtenerGeolocalizacionFallback(ip: string): Promise<DatosGeolocalizacion | ErrorGeolocalizacion> {
        try {

            // Usar HTTP explícitamente para ip-api.com (la versión gratuita no soporta HTTPS)
            // Ojo: Esto podría fallar en entornos HTTPS estrictos (Mixed Content).
            // Pero es lo que tiene la versión gratuita.
            const respuesta = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,query`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!respuesta.ok) {
                throw new Error(`Error en API fallback: ${respuesta.status}`);
            }

            const data = await respuesta.json();

            if (data.status === 'fail') {
                throw new Error(`API fallback falló: ${data.message}`);
            }

            const datosEspanol: DatosGeolocalizacion = {
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

            return datosEspanol;

        } catch (error: any) {
            return {
                error: true,
                mensaje: `Error en todas las APIs de geolocalización: ${error.message}`,
                tipoError: 'API'
            };
        }
    }

    /**
     * Guardar geolocalización en Supabase
     */
    async guardarGeolocalizacion(idUsuario: string, datosGeo: DatosGeolocalizacion): Promise<boolean> {
        try {

            const { data: existente } = await supabase
                .from('geolocalizacion_usuarios')
                .select('id')
                .eq('usuario_id', idUsuario)
                .eq('ip', datosGeo.ip)
                .single();

            if (existente) {
                const { error: errorUpdate } = await supabase
                    .from('geolocalizacion_usuarios')
                    .update({
                        ultima_visita: new Date().toISOString(),
                        pais: datosGeo.pais,
                        ciudad: datosGeo.ciudad,
                        region: datosGeo.region,
                        latitud: datosGeo.latitud,
                        longitud: datosGeo.longitud,
                        timezone: datosGeo.zonaHoraria,
                        organizacion: datosGeo.organizacion,
                        bandera_url: datosGeo.urlBandera,
                        es_movil: datosGeo.esMovil,
                        es_proxy: datosGeo.esProxy,
                        es_vpn: datosGeo.esVpn,
                        datos_completos_raw: datosGeo.datosCompletos,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existente.id);

                if (errorUpdate) {
                    return false;
                }
                return true;

            } else {
                const { error: errorInsert } = await supabase
                    .from('geolocalizacion_usuarios')
                    .insert({
                        usuario_id: idUsuario,
                        ip: datosGeo.ip,
                        pais: datosGeo.pais,
                        ciudad: datosGeo.ciudad,
                        region: datosGeo.region,
                        codigo_postal: datosGeo.codigoPostal,
                        latitud: datosGeo.latitud,
                        longitud: datosGeo.longitud,
                        timezone: datosGeo.zonaHoraria,
                        moneda: datosGeo.moneda,
                        idiomas: datosGeo.idioma,
                        proveedor: datosGeo.organizacion,
                        es_movil: datosGeo.esMovil,
                        es_proxy: datosGeo.esProxy,
                        es_vpn: datosGeo.esVpn,
                        organizacion: datosGeo.organizacion,
                        bandera_url: datosGeo.urlBandera,
                        datos_completos_raw: datosGeo.datosCompletos,
                        primera_visita: new Date().toISOString(),
                        ultima_visita: new Date().toISOString(),
                        visitas_totales: 1
                    });

                if (errorInsert) {
                    return false;
                }
                return true;
            }

        } catch (error: any) {
            return false;
        }
    }

    /**
     * Proceso completo de tracking de geolocalización
     */
    async rastreoCompleto(idUsuario?: string): Promise<boolean> {
        try {

            let usuarioActual = idUsuario;
            if (!usuarioActual) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    return false;
                }
                usuarioActual = user.id;
            }

            const ipPublica = await this.obtenerIpPublica();
            if (!ipPublica) {
                return false;
            }

            const resultadoGeo = await this.obtenerGeolocalizacion(ipPublica);
            if ('error' in resultadoGeo) {
                return false;
            }

            const guardadoExitoso = await this.guardarGeolocalizacion(usuarioActual!, resultadoGeo);
            if (!guardadoExitoso) {
                return false;
            }

            return true;

        } catch (error: any) {
            return false;
        }
    }

    private async respetarLimiteVelocidad(): Promise<void> {
        const tiempoActual = Date.now();
        const tiempoTranscurrido = tiempoActual - this.tiempoUltimaSolicitud;

        if (tiempoTranscurrido < this.RETRASO_LIMITE_VELOCIDAD) {
            const tiempoEspera = this.RETRASO_LIMITE_VELOCIDAD - tiempoTranscurrido;
            await new Promise(resolve => setTimeout(resolve, tiempoEspera));
        }

        this.tiempoUltimaSolicitud = Date.now();
    }

    limpiarCache(): void {
        this.cache.clear();
    }
}

export const servicioGeolocalizacion = ServicioGeolocalizacion.obtenerInstancia();

