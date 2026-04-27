import { supabase } from '$servicios/clienteSupabase';
import { perfilStore } from '$stores/perfilStore';
import { get } from '$utilidades/tiendaReact';

interface DatosGeoReal {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string; // La IP
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
  currency: string;
}

class TrackingGeolocalizacionReal {
  private static instance: TrackingGeolocalizacionReal;
  private ultimoTracking: number = 0;
  private readonly INTERVALO_TRACKING = 10 * 60 * 1000; // 10 minutos

  static getInstance(): TrackingGeolocalizacionReal {
    if (!TrackingGeolocalizacionReal.instance) {
      TrackingGeolocalizacionReal.instance = new TrackingGeolocalizacionReal();
    }
    return TrackingGeolocalizacionReal.instance;
  }

  /**
   * 🌐 Obtiene la IP pública real del usuario usando múltiples servicios
   */
  async obtenerIPReal(): Promise<string> {
    const servicios = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/ip/',
      'https://api.myip.com',
      'https://httpbin.org/ip',
      'https://icanhazip.com'
    ];

    for (const servicio of servicios) {
      try {
        
        const response = await fetch(servicio, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-cache'
        });
        
        if (!response.ok) continue;
        
        let data;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          // Para servicios que devuelven texto plano
          const textData = await response.text();
          data = { ip: textData.trim() };
        }
        
        // Diferentes APIs devuelven la IP en diferentes campos
        const ip = data.ip || data.origin?.split(' ')[0] || data;
        
        if (ip && this.validarIP(ip.toString())) {
          return ip.toString();
        }
        
      } catch (error) {
        continue;
      }
    }

    throw new Error('No se pudo obtener la IP real del usuario');
  }

  /**
   * 🗺️ Consulta información geográfica REAL usando la IP
   */
  async consultarGeolocalizacionReal(ip: string): Promise<DatosGeoReal> {
    const serviciosGeo = [
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,mobile,proxy,hosting,currency,query`,
      `https://ipapi.co/${ip}/json/`,
      `https://ipinfo.io/${ip}/json`
    ];

    for (const servicio of serviciosGeo) {
      try {
        
        const response = await fetch(servicio, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          cache: 'no-cache'
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Verificar que la respuesta sea válida
        if (data.status === 'fail' || data.error) {
          continue;
        }

        // Normalizar datos según el servicio
        const datosNormalizados = this.normalizarDatosGeo(data, ip, servicio);
        
        if (datosNormalizados.country && datosNormalizados.city) {
            ip: datosNormalizados.query,
            pais: datosNormalizados.country,
            ciudad: datosNormalizados.city,
            isp: datosNormalizados.isp
          });
          return datosNormalizados;
        }
        
      } catch (error) {
        continue;
      }
    }

    throw new Error('No se pudo obtener información de geolocalización real');
  }

  /**
   * 📊 Ejecuta el tracking completo y guarda en base de datos
   */
  async ejecutarTrackingCompleto(): Promise<boolean> {
    try {
      // Verificar si el usuario está autenticado
      const storeData = get(perfilStore);
      if (!storeData?.perfil?.id) {
        return false;
      }

      const usuarioId = storeData.perfil.id;

      // Verificar throttling (no trackear tan seguido)
      const ahora = Date.now();
      if (ahora - this.ultimoTracking < this.INTERVALO_TRACKING) {
        return false;
      }


      // 1. Obtener IP real
      const ipReal = await this.obtenerIPReal();
      
      // 2. Consultar geolocalización real
      const datosGeo = await this.consultarGeolocalizacionReal(ipReal);
      
      // 3. Guardar en base de datos
      await this.guardarGeolocalizacion(usuarioId, datosGeo);
      
      this.ultimoTracking = ahora;
      
      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * 💾 Guarda los datos de geolocalización en Supabase
   */
  private async guardarGeolocalizacion(usuarioId: string, datos: DatosGeoReal): Promise<void> {
    try {
      const { data, error } = await supabase.rpc('upsert_geolocalizacion_usuario', {
        p_usuario_id: usuarioId,
        p_ip: datos.query,
        p_datos_geo: datos
      });

      if (error) throw error;


    } catch (error) {
      throw error;
    }
  }

  /**
   * 🔧 Normaliza datos de diferentes APIs de geolocalización
   */
  private normalizarDatosGeo(data: any, ip: string, servicio: string): DatosGeoReal {
    // ip-api.com format (más completo)
    if (servicio.includes('ip-api.com')) {
      return {
        status: data.status || 'success',
        country: data.country || '',
        countryCode: data.countryCode || '',
        region: data.region || '',
        regionName: data.regionName || '',
        city: data.city || '',
        zip: data.zip || '',
        lat: data.lat || 0,
        lon: data.lon || 0,
        timezone: data.timezone || '',
        isp: data.isp || '',
        org: data.org || '',
        as: data.as || '',
        query: data.query || ip,
        mobile: data.mobile || false,
        proxy: data.proxy || false,
        hosting: data.hosting || false,
        currency: data.currency || ''
      };
    }

    // ipapi.co format
    if (servicio.includes('ipapi.co')) {
      return {
        status: 'success',
        country: data.country_name || data.country || '',
        countryCode: data.country_code || '',
        region: data.region_code || '',
        regionName: data.region || '',
        city: data.city || '',
        zip: data.postal || '',
        lat: data.latitude || 0,
        lon: data.longitude || 0,
        timezone: data.timezone || '',
        isp: data.org || '',
        org: data.org || '',
        as: data.asn || '',
        query: data.ip || ip,
        mobile: false, // ipapi.co no proporciona este dato
        proxy: false,
        hosting: false,
        currency: data.currency || ''
      };
    }

    // ipinfo.io format
    if (servicio.includes('ipinfo.io')) {
      const [lat, lon] = (data.loc || '0,0').split(',').map(Number);
      
      return {
        status: 'success',
        country: data.country || '',
        countryCode: data.country || '',
        region: data.region || '',
        regionName: data.region || '',
        city: data.city || '',
        zip: data.postal || '',
        lat: lat || 0,
        lon: lon || 0,
        timezone: data.timezone || '',
        isp: data.org || '',
        org: data.org || '',
        as: '',
        query: data.ip || ip,
        mobile: false,
        proxy: false,
        hosting: false,
        currency: ''
      };
    }

    // Fallback genérico
    return {
      status: 'success',
      country: data.country || '',
      countryCode: data.countryCode || '',
      region: data.region || '',
      regionName: data.regionName || data.region || '',
      city: data.city || '',
      zip: data.zip || '',
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || '',
      isp: data.isp || '',
      org: data.org || '',
      as: data.as || '',
      query: ip,
      mobile: data.mobile || false,
      proxy: data.proxy || false,
      hosting: data.hosting || false,
      currency: data.currency || ''
    };
  }

  /**
   * ✅ Valida formato de IP
   */
  private validarIP(ip: string): boolean {
    // IPv4
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6 (básico)
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * 🏃‍♂️ Ejecuta tracking en background sin bloquear la UI
   */
  async trackingAsincrono(): Promise<void> {
    // Ejecutar en el próximo tick para no bloquear
    setTimeout(async () => {
      try {
        await this.ejecutarTrackingCompleto();
      } catch (error) {
      }
    }, 100);
  }
}

// Instancia singleton
export const trackingGeoReal = TrackingGeolocalizacionReal.getInstance();

// Función de conveniencia
export const iniciarTrackingGeolocalizacion = () => {
  trackingGeoReal.trackingAsincrono();
}; 


