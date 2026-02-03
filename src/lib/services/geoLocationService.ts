import { supabase } from '$lib/supabase/clienteSupabase';

export interface DatosGeolocalizacion {
  ip: string;
  pais: string;
  pais_codigo: string;
  region: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  zona_horaria: string;
  isp: string;
  organizacion: string;
  tipo_conexion: string;
  es_movil: boolean;
  es_proxy: boolean;
  es_vpn: boolean;
  moneda: string;
  idioma: string;
  bandera_url: string;
  fecha_registro: string;
}

export interface RespuestaGeoAPI {
  status: string;
  message?: string; // Campo opcional para errores
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
  query: string;
  mobile: boolean;
  proxy: boolean;
  hosting: boolean;
  currency: string;
}

class GeoLocationService {
  private static instance: GeoLocationService;
  private datosCache: DatosGeolocalizacion | null = null;
  private ultimaActualizacion: number = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

  static getInstance(): GeoLocationService {
    if (!GeoLocationService.instance) {
      GeoLocationService.instance = new GeoLocationService();
    }
    return GeoLocationService.instance;
  }

  /**
   * Obtiene la IP pública del usuario usando múltiples servicios como fallback
   */
  async obtenerIPPublica(): Promise<string> {
    const servicios = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/ip/',
      'https://api.myip.com',
      'https://httpbin.org/ip'
    ];

    for (const servicio of servicios) {
      try {
        console.log(`🌐 [GEO] Intentando obtener IP desde: ${servicio}`);
        
        const response = await fetch(servicio, { 
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Diferentes APIs devuelven la IP en diferentes campos
        const ip = data.ip || data.origin?.split(' ')[0] || data;
        
        if (ip && this.validarIP(ip)) {
          console.log(`✅ [GEO] IP obtenida: ${ip}`);
          return ip;
        }
        
      } catch (error) {
        console.warn(`⚠️ [GEO] Error con servicio ${servicio}:`, error);
        continue;
      }
    }

    throw new Error('No se pudo obtener la IP pública');
  }

  /**
   * Obtiene datos completos de geolocalización usando ip-api.com (gratuito)
   */
  async obtenerDatosGeolocalizacion(ip?: string): Promise<DatosGeolocalizacion> {
    try {
      // Verificar caché primero
      if (this.datosCache && (Date.now() - this.ultimaActualizacion) < this.CACHE_DURATION) {
        console.log('📋 [GEO] Usando datos de caché');
        return this.datosCache;
      }

      // Obtener IP si no se proporciona
      if (!ip) {
        ip = await this.obtenerIPPublica();
      }

      console.log(`🌍 [GEO] Obteniendo geolocalización para IP: ${ip}`);

      // Usar ip-api.com (gratuito, 1000 requests/hora)
      const response = await fetch(
        `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting,currency`, 
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' }
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: RespuestaGeoAPI = await response.json();

      if (data.status === 'fail') {
        throw new Error(`Error de API: ${data.message || 'Respuesta inválida'}`);
      }

      // Detectar idioma basado en país
      const idioma = this.detectarIdioma(data.countryCode);

      // Crear objeto de datos estructurado
      const datosGeo: DatosGeolocalizacion = {
        ip: data.query,
        pais: data.country || 'Desconocido',
        pais_codigo: data.countryCode || 'XX',
        region: data.regionName || data.region || 'Desconocido',
        ciudad: data.city || 'Desconocido',
        latitud: data.lat || 0,
        longitud: data.lon || 0,
        zona_horaria: data.timezone || 'UTC',
        isp: data.isp || 'Desconocido',
        organizacion: data.org || data.as || 'Desconocido',
        tipo_conexion: data.mobile ? 'Móvil' : 'Fija',
        es_movil: data.mobile || false,
        es_proxy: data.proxy || false,
        es_vpn: data.hosting || false, // hosting suele indicar VPN/proxy
        moneda: data.currency || 'USD',
        idioma: idioma,
        bandera_url: `https://flagcdn.com/32x24/${data.countryCode.toLowerCase()}.png`,
        fecha_registro: new Date().toISOString()
      };

      // Guardar en caché
      this.datosCache = datosGeo;
      this.ultimaActualizacion = Date.now();

      console.log('✅ [GEO] Datos de geolocalización obtenidos:', datosGeo);
      return datosGeo;

    } catch (error) {
      console.error('❌ [GEO] Error obteniendo geolocalización:', error);
      
      // Devolver datos por defecto en caso de error
      return this.obtenerDatosPorDefecto(ip || 'Desconocido');
    }
  }

  /**
   * Almacena los datos de geolocalización en Supabase
   */
  async almacenarDatosGeolocalizacion(usuarioId: string, datos: DatosGeolocalizacion): Promise<boolean> {
    try {
      console.log(`💾 [GEO] Almacenando datos para usuario: ${usuarioId}`);

      // Verificar si ya existe un registro para este usuario e IP
      const { data: existente } = await supabase
        .from('geolocalizacion_usuarios')
        .select('id')
        .eq('usuario_id', usuarioId)
        .eq('ip', datos.ip)
        .single();

      if (existente) {
        // Actualizar registro existente
        const { error } = await supabase
          .from('geolocalizacion_usuarios')
          .update({
            ultima_visita: new Date().toISOString(),
            visitas_totales: supabase.rpc('increment_visitas', { id: existente.id })
          })
          .eq('id', existente.id);

        if (error) throw error;
        console.log('🔄 [GEO] Registro actualizado');
      } else {
        // Crear nuevo registro
        const { error } = await supabase
          .from('geolocalizacion_usuarios')
          .insert({
            usuario_id: usuarioId,
            ip: datos.ip,
            pais: datos.pais,
            pais_codigo: datos.pais_codigo,
            region: datos.region,
            ciudad: datos.ciudad,
            latitud: datos.latitud,
            longitud: datos.longitud,
            zona_horaria: datos.zona_horaria,
            isp: datos.isp,
            organizacion: datos.organizacion,
            tipo_conexion: datos.tipo_conexion,
            es_movil: datos.es_movil,
            es_proxy: datos.es_proxy,
            es_vpn: datos.es_vpn,
            moneda: datos.moneda,
            idioma: datos.idioma,
            bandera_url: datos.bandera_url,
            primera_visita: datos.fecha_registro,
            ultima_visita: datos.fecha_registro,
            visitas_totales: 1
          });

        if (error) throw error;
        console.log('➕ [GEO] Nuevo registro creado');
      }

      return true;
    } catch (error) {
      console.error('❌ [GEO] Error almacenando datos:', error);
      return false;
    }
  }

  /**
   * Obtiene el historial de ubicaciones de un usuario
   */
  async obtenerHistorialUsuario(usuarioId: string): Promise<DatosGeolocalizacion[]> {
    try {
      const { data, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('ultima_visita', { ascending: false });

      if (error) throw error;

      return data.map((registro: any) => ({
        ip: registro.ip,
        pais: registro.pais,
        pais_codigo: registro.pais_codigo,
        region: registro.region,
        ciudad: registro.ciudad,
        latitud: registro.latitud,
        longitud: registro.longitud,
        zona_horaria: registro.zona_horaria,
        isp: registro.isp,
        organizacion: registro.organizacion,
        tipo_conexion: registro.tipo_conexion,
        es_movil: registro.es_movil,
        es_proxy: registro.es_proxy,
        es_vpn: registro.es_vpn,
        moneda: registro.moneda,
        idioma: registro.idioma,
        bandera_url: registro.bandera_url,
        fecha_registro: registro.primera_visita
      }));
    } catch (error) {
      console.error('❌ [GEO] Error obteniendo historial:', error);
      return [];
    }
  }

  /**
   * 📊 Obtiene estadísticas geográficas usando la función SQL optimizada
   */
  async obtenerEstadisticasGeograficas(): Promise<any> {
    try {
      console.log('📊 [GEO] Obteniendo estadísticas con función SQL optimizada...');
      
      // ✅ USAR TU FUNCIÓN SQL PROFESIONAL
      const { data: statsSQL, error: errorStats } = await supabase
        .rpc('obtener_estadisticas_geograficas');

      if (errorStats) {
        console.warn('⚠️ [GEO] Función SQL no disponible, usando método alternativo:', errorStats);
        // Fallback al método anterior si la función SQL no está disponible
        const { data, error } = await supabase
          .from('geolocalizacion_usuarios')
          .select('pais, pais_codigo, ciudad, es_movil, es_vpn, visitas_totales, usuario_id');

        if (error) throw error;

        const estadisticas = {
          totalUsuarios: [...new Set(data.map((r: any) => r.usuario_id))].length,
          paisesUnicos: [...new Set(data.map((r: any) => r.pais))].length,
          ciudadesUnicas: [...new Set(data.map((r: any) => r.ciudad))].length,
          usuariosMoviles: data.filter((r: any) => r.es_movil).length,
          usuariosVPN: data.filter((r: any) => r.es_vpn).length,
          paisesMasVisitados: this.contarPorCampo(data, 'pais').slice(0, 10),
          ciudadesMasVisitadas: this.contarPorCampo(data, 'ciudad').slice(0, 10),
          totalVisitas: data.reduce((sum: number, r: any) => sum + (r.visitas_totales || 0), 0)
        };
        return estadisticas;
      }

      // ✅ PROCESAR DATOS DE LA FUNCIÓN SQL OPTIMIZADA
      const estadisticas = {
        totalUsuarios: statsSQL?.reduce((sum: number, r: any) => sum + (r.total_usuarios || 0), 0) || 0,
        paisesUnicos: statsSQL?.length || 0,
        ciudadesUnicas: 0, // Se calculará en consulta complementaria
        usuariosMoviles: statsSQL?.reduce((sum: number, r: any) => sum + (r.usuarios_moviles || 0), 0) || 0,
        usuariosVPN: statsSQL?.reduce((sum: number, r: any) => sum + (r.usuarios_vpn || 0), 0) || 0,
        paisesMasVisitados: statsSQL?.map((r: any) => ({ 
          nombre: r.pais, 
          count: parseInt(r.total_usuarios) 
        })).slice(0, 10) || [],
        ciudadesMasVisitadas: [], // Se calculará en consulta complementaria
        totalVisitas: statsSQL?.reduce((sum: number, r: any) => sum + (r.total_visitas || 0), 0) || 0
      };

      console.log('🎯 [GEO] Estadísticas optimizadas obtenidas:', estadisticas);
      return estadisticas;

    } catch (error) {
      console.error('❌ [GEO] Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Procesa los datos cuando un usuario inicia sesión
   */
  async procesarInicioSesion(usuarioId: string): Promise<DatosGeolocalizacion | null> {
    try {
      const datos = await this.obtenerDatosGeolocalizacion();
      await this.almacenarDatosGeolocalizacion(usuarioId, datos);
      return datos;
    } catch (error) {
      console.error('❌ [GEO] Error procesando inicio de sesión:', error);
      return null;
    }
  }

  // MÉTODOS AUXILIARES PRIVADOS

  private validarIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}$/i;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  private detectarIdioma(paisCodigo: string): string {
    const idiomas: { [key: string]: string } = {
      'US': 'en', 'GB': 'en', 'CA': 'en', 'AU': 'en',
      'ES': 'es', 'MX': 'es', 'AR': 'es', 'CO': 'es', 'PE': 'es', 'VE': 'es',
      'BR': 'pt', 'PT': 'pt',
      'FR': 'fr', 'BE': 'fr', 'CH': 'fr',
      'DE': 'de', 'AT': 'de',
      'IT': 'it',
      'RU': 'ru',
      'CN': 'zh', 'TW': 'zh',
      'JP': 'ja',
      'KR': 'ko'
    };
    return idiomas[paisCodigo] || 'es'; // Por defecto español para academia vallenata
  }

  private obtenerDatosPorDefecto(ip: string): DatosGeolocalizacion {
    return {
      ip: ip,
      pais: 'Desconocido',
      pais_codigo: 'XX',
      region: 'Desconocido',
      ciudad: 'Desconocido',
      latitud: 0,
      longitud: 0,
      zona_horaria: 'UTC',
      isp: 'Desconocido',
      organizacion: 'Desconocido',
      tipo_conexion: 'Desconocido',
      es_movil: false,
      es_proxy: false,
      es_vpn: false,
      moneda: 'USD',
      idioma: 'es',
      bandera_url: '',
      fecha_registro: new Date().toISOString()
    };
  }

  private contarPorCampo(data: any[], campo: string): Array<{nombre: string, count: number}> {
    const conteo: { [key: string]: number } = {};
    data.forEach(item => {
      const valor = item[campo];
      conteo[valor] = (conteo[valor] || 0) + 1;
    });
    
    return Object.entries(conteo)
      .map(([nombre, count]) => ({ nombre, count }))
      .sort((a, b) => b.count - a.count);
  }
}

// Exportar instancia singleton
export const geoLocationService = GeoLocationService.getInstance();

// Función helper para uso rápido
export async function trackearUbicacionUsuario(usuarioId: string): Promise<DatosGeolocalizacion | null> {
  return geoLocationService.procesarInicioSesion(usuarioId);
} 