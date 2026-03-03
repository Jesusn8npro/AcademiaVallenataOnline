/**
 * 🌍 SERVICIO DE GEOLOCALIZACIÓN PROFESIONAL - IPAPI.CO
 * =====================================================
 * 
 * Servicio optimizado para trabajar con ipapi.co
 * - Plan gratuito: 30,000 requests/mes (1,000/día)
 * - No requiere API key para uso básico
 * - Manejo inteligente de rate limits y errores
 * - Cache para evitar requests duplicados
 * - Fallbacks en caso de errores
 */

import { supabase } from '$servicios/clienteSupabase';

// Interfaces para tipado seguro
interface IpapiResponse {
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
  error?: boolean;
  reason?: string;
}

interface GeoLocationData {
  ip: string;
  ciudad: string;
  region: string;
  pais: string;
  paisCodigo: string;
  latitud: number;
  longitud: number;
  zonaHoraria: string;
  isp: string;
  codigoPostal?: string;
  moneda?: string;
  idioma?: string;
  banderaUrl: string;
  datosCompletos: IpapiResponse;
}

interface GeoLocationError {
  error: true;
  message: string;
  code: string;
}

class IpapiGeoLocationService {
  private static instance: IpapiGeoLocationService;
  private readonly API_BASE_URL = 'https://ipapi.co';
  private readonly RATE_LIMIT_DELAY = 100; // ms entre requests
  private readonly MAX_RETRIES = 3;
  private cache: Map<string, GeoLocationData> = new Map();
  private lastRequestTime = 0;

  static getInstance(): IpapiGeoLocationService {
    if (!IpapiGeoLocationService.instance) {
      IpapiGeoLocationService.instance = new IpapiGeoLocationService();
    }
    return IpapiGeoLocationService.instance;
  }

  /**
   * 🌐 Obtener IP pública del usuario
   */
  async obtenerIPPublica(): Promise<string | null> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      
      if (data.ip) {
        console.log('✅ [IPAPI] IP pública obtenida:', data.ip);
        return data.ip;
      }
      
      throw new Error('No se pudo obtener IP');
    } catch (error) {
      console.error('❌ [IPAPI] Error obteniendo IP pública:', error);
      return null;
    }
  }

  /**
   * 🌍 Obtener geolocalización usando ipapi.co
   */
  async obtenerGeolocalizacion(ip?: string): Promise<GeoLocationData | GeoLocationError> {
    try {
      // Si no se proporciona IP, obtener la pública del usuario
      if (!ip) {
        const ipObtenida = await this.obtenerIPPublica();
        if (!ipObtenida) {
          return {
            error: true,
            message: 'No se pudo obtener IP pública',
            code: 'IP_NOT_FOUND'
          };
        }
        ip = ipObtenida;
      }

      // Verificar cache
      if (this.cache.has(ip)) {
        const cached = this.cache.get(ip)!;
        console.log('💾 [IPAPI] Datos obtenidos del cache para:', ip);
        return cached;
      }

      // Rate limiting
      await this.respetarRateLimit();

      // Hacer request a ipapi.co
      const url = `${this.API_BASE_URL}/${ip}/json/`;
      console.log('🌍 [IPAPI] Consultando:', url);

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Academia-Vallenata-Online/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const rawData: IpapiResponse = await response.json();

      // Verificar si hay error en la respuesta
      if (rawData.error) {
        return {
          error: true,
          message: rawData.reason || 'Error en API de geolocalización',
          code: 'API_ERROR'
        };
      }

      // Validar que tengamos datos mínimos
      if (!rawData.country_name || !rawData.city) {
        return {
          error: true,
          message: 'Datos de geolocalización incompletos',
          code: 'INCOMPLETE_DATA'
        };
      }

      // Procesar datos
      const geoData: GeoLocationData = {
        ip: rawData.ip,
        ciudad: rawData.city,
        region: rawData.region || '',
        pais: rawData.country_name,
        paisCodigo: rawData.country_code.toLowerCase(),
        latitud: rawData.latitude,
        longitud: rawData.longitude,
        zonaHoraria: rawData.timezone,
        isp: rawData.org || 'Desconocido',
        codigoPostal: rawData.postal,
        moneda: rawData.currency,
        idioma: rawData.language || 'es',
        banderaUrl: `https://flagcdn.com/32x24/${rawData.country_code.toLowerCase()}.png`,
        datosCompletos: rawData
      };

      // Guardar en cache
      this.cache.set(ip, geoData);

      console.log('✅ [IPAPI] Geolocalización exitosa:', geoData.ciudad, geoData.pais);
      return geoData;

    } catch (error) {
      console.error('❌ [IPAPI] Error en geolocalización:', error);
      return {
        error: true,
        message: error instanceof Error ? error.message : 'Error desconocido',
        code: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * 💾 Guardar geolocalización en Supabase
   */
  async guardarGeolocalizacion(usuarioId: string, geoData: GeoLocationData): Promise<boolean> {
    try {
      console.log('💾 [IPAPI] Guardando en Supabase:', geoData.ciudad, geoData.pais);

      const { data, error } = await supabase.rpc('upsert_geolocalizacion_usuario', {
        p_usuario_id: usuarioId,
        p_ip: geoData.ip,
        p_datos_geo: geoData.datosCompletos
      });

      if (error) {
        console.error('❌ [IPAPI] Error guardando en Supabase:', error);
        return false;
      }

      console.log('✅ [IPAPI] Datos guardados exitosamente:', data);
      return true;

    } catch (error) {
      console.error('❌ [IPAPI] Error general guardando:', error);
      return false;
    }
  }

  /**
   * 🔄 Tracking completo: obtener geolocalización y guardar en BD
   */
  async trackingCompleto(usuarioId?: string): Promise<boolean> {
    try {
      // Verificar usuario
      if (!usuarioId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ [IPAPI] No hay usuario autenticado');
          return false;
        }
        usuarioId = user.id;
      }

      console.log('🚀 [IPAPI] Iniciando tracking completo para usuario:', usuarioId);

      // Obtener geolocalización
      const resultado = await this.obtenerGeolocalizacion();

      if ('error' in resultado) {
        console.error('❌ [IPAPI] Error en geolocalización:', resultado.message);
        return false;
      }

      // Guardar en base de datos
      const guardado = await this.guardarGeolocalizacion(usuarioId!, resultado);

      if (guardado) {
        console.log('🎉 [IPAPI] Tracking completo exitoso!');
        return true;
      } else {
        console.error('❌ [IPAPI] Error guardando datos');
        return false;
      }

    } catch (error) {
      console.error('❌ [IPAPI] Error en tracking completo:', error);
      return false;
    }
  }

  /**
   * 📊 Obtener estadísticas de geolocalización
   */
  async obtenerEstadisticas(): Promise<any> {
    try {
      console.log('📊 [IPAPI] Obteniendo estadísticas...');

      const { data, error } = await supabase
        .rpc('obtener_estadisticas_geograficas');

      if (error) {
        console.error('❌ [IPAPI] Error en estadísticas:', error);
        return null;
      }

      return data;

    } catch (error) {
      console.error('❌ [IPAPI] Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * ⏱️ Respetar rate limits de ipapi.co
   */
  private async respetarRateLimit(): Promise<void> {
    const ahora = Date.now();
    const tiempoTranscurrido = ahora - this.lastRequestTime;

    if (tiempoTranscurrido < this.RATE_LIMIT_DELAY) {
      const esperar = this.RATE_LIMIT_DELAY - tiempoTranscurrido;
      console.log(`⏱️ [IPAPI] Esperando ${esperar}ms para respetar rate limit`);
      await new Promise(resolve => setTimeout(resolve, esperar));
    }

    this.lastRequestTime = Date.now();
  }

  /**
   * 🧹 Limpiar cache
   */
  limpiarCache(): void {
    this.cache.clear();
    console.log('🧹 [IPAPI] Cache limpiado');
  }

  /**
   * 📋 Obtener información del cache
   */
  obtenerInfoCache(): { entradas: number; ips: string[] } {
    return {
      entradas: this.cache.size,
      ips: Array.from(this.cache.keys())
    };
  }
}

// Exportar instancia singleton
export const ipapiGeoService = IpapiGeoLocationService.getInstance();

// Función de conveniencia para tracking automático
export const iniciarTrackingGeolocalizacion = () => {
  return ipapiGeoService.trackingCompleto();
};

// Exportar tipos
export type { GeoLocationData, GeoLocationError, IpapiResponse }; 
