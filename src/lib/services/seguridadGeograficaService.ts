/**
 * 🛡️ SERVICIO DE SEGURIDAD GEOGRÁFICA AVANZADA
 * =============================================
 * 
 * Funcionalidades de seguridad para geolocalización:
 * - Detección de cuentas compartidas
 * - Alertas de ubicaciones sospechosas  
 * - Identificación de data centers y proxies
 * - Historial de cambios de ubicación
 * - Analytics geográficos en tiempo real
 */

import { supabase } from '$lib/supabase/clienteSupabase';

// Interfaces para tipado seguro
interface AlertaSeguridad {
  id: string;
  usuario_id: string;
  tipo_alerta: 'UBICACION_MULTIPLE' | 'CAMBIO_RAPIDO' | 'DATACENTER' | 'PROXY_SOSPECHOSO' | 'PAIS_RESTRINGIDO';
  descripcion: string;
  ubicacion_anterior?: string;
  ubicacion_actual: string;
  distancia_km?: number;
  tiempo_cambio_minutos?: number;
  nivel_riesgo: 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO';
  fecha_deteccion: string;
  resuelto: boolean;
  ip_origen: string;
  datos_adicionales: any;
}

interface AnalyticsGeografico {
  total_paises: number;
  total_ciudades: number;
  distribucion_por_pais: { pais: string; usuarios: number; porcentaje: number }[];
  ubicaciones_activas_simultaneas: number;
  alertas_seguridad_hoy: number;
  conexiones_sospechosas: number;
  patrones_horarios: { zona_horaria: string; usuarios_activos: number }[];
}

interface HistorialUbicacion {
  usuario_id: string;
  ip: string;
  pais: string;
  ciudad: string;
  latitud: number;
  longitud: number;
  fecha_deteccion: string;
  es_sospechoso: boolean;
  motivo_sospecha?: string;
}

class SeguridadGeograficaService {
  private static instancia: SeguridadGeograficaService;
  
  // Listas de data centers y proxies conocidos (básico)
  private readonly DATACENTER_KEYWORDS = [
    'amazon', 'aws', 'google cloud', 'microsoft azure', 'digitalocean', 
    'cloudflare', 'heroku', 'vultr', 'linode', 'ovh', 'hetzner'
  ];
  
  private readonly PROXY_KEYWORDS = [
    'vpn', 'proxy', 'tor', 'tunnel', 'anonymous', 'hide', 'mask'
  ];

  // Países con restricciones (ejemplo)
  private readonly PAISES_RESTRINGIDOS = ['CN', 'KP', 'IR', 'SY'];

  static obtenerInstancia(): SeguridadGeograficaService {
    if (!SeguridadGeograficaService.instancia) {
      SeguridadGeograficaService.instancia = new SeguridadGeograficaService();
    }
    return SeguridadGeograficaService.instancia;
  }

  /**
   * 🚨 DETECCIÓN DE UBICACIONES MÚLTIPLES SIMULTÁNEAS
   */
  async detectarCuentasCompartidas(): Promise<any[]> {
    try {
      console.log('🔍 [SEGURIDAD] Detectando cuentas compartidas...');

      const ahora = new Date();
      const hace30min = new Date(ahora.getTime() - 30 * 60 * 1000);

      // Buscar usuarios con múltiples ubicaciones en los últimos 30 minutos
      const { data: ubicacionesRecientes, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('usuario_id, ip, pais, ciudad, ultima_visita, perfiles(nombre, apellido, email)')
        .gte('ultima_visita', hace30min.toISOString())
        .order('ultima_visita', { ascending: false });

      if (error) throw error;

             // Agrupar por usuario y detectar múltiples ubicaciones
       const usuariosPorId = new Map<string, any[]>();
       ubicacionesRecientes?.forEach((ub: any) => {
         if (!usuariosPorId.has(ub.usuario_id)) {
           usuariosPorId.set(ub.usuario_id, []);
         }
         usuariosPorId.get(ub.usuario_id)?.push(ub);
       });

       const cuentasSospechosas: any[] = [];
      usuariosPorId.forEach((ubicaciones, usuarioId) => {
        if (ubicaciones.length > 1) {
          // Verificar si son ubicaciones diferentes
          const ipsUnicas = new Set(ubicaciones.map((u: any) => u.ip));
          const paisesUnicos = new Set(ubicaciones.map((u: any) => u.pais));
          
          if (ipsUnicas.size > 1 || paisesUnicos.size > 1) {
            cuentasSospechosas.push({
              usuario: ubicaciones[0].perfiles,
              usuario_id: usuarioId,
              ubicaciones_simultaneas: ubicaciones.length,
              paises_diferentes: paisesUnicos.size,
              ips_diferentes: ipsUnicas.size,
              ubicaciones: ubicaciones,
              nivel_riesgo: paisesUnicos.size > 1 ? 'ALTO' : 'MEDIO',
              ultima_deteccion: ubicaciones[0].ultima_visita
            });
          }
        }
      });

      console.log(`✅ [SEGURIDAD] Detectadas ${cuentasSospechosas.length} cuentas sospechosas`);
      return cuentasSospechosas;

    } catch (error) {
      console.error('❌ [SEGURIDAD] Error detectando cuentas compartidas:', error);
      return [];
    }
  }

  /**
   * 📍 DETECCIÓN DE CAMBIOS DE UBICACIÓN SOSPECHOSOS
   */
  async detectarCambiosUbicacionSospechosos(): Promise<any[]> {
    try {
      console.log('🔍 [SEGURIDAD] Detectando cambios de ubicación sospechosos...');

      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Obtener historiales de ubicación recientes
      const { data: historial, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('usuario_id, ip, pais, ciudad, latitud, longitud, ultima_visita, perfiles(nombre, apellido, email)')
        .gte('ultima_visita', hace24h.toISOString())
        .order('usuario_id, ultima_visita', { ascending: true });

      if (error) throw error;

             const cambiosSospechosos: any[] = [];
       const usuariosProcesados = new Map<string, any>();

       historial?.forEach((ubicacion: any) => {
        const usuarioId = ubicacion.usuario_id;
        
        if (usuariosProcesados.has(usuarioId)) {
          const ubicacionAnterior = usuariosProcesados.get(usuarioId);
          
          // Calcular distancia entre ubicaciones
          const distancia = this.calcularDistancia(
            ubicacionAnterior.latitud, ubicacionAnterior.longitud,
            ubicacion.latitud, ubicacion.longitud
          );
          
          // Calcular tiempo entre cambios
          const tiempoAnterior = new Date(ubicacionAnterior.ultima_visita);
          const tiempoActual = new Date(ubicacion.ultima_visita);
          const tiempoMinutos = (tiempoActual.getTime() - tiempoAnterior.getTime()) / (1000 * 60);
          
          // Detectar cambios imposibles (>500km en <1 hora)
          const velocidad = distancia / (tiempoMinutos / 60); // km/h
          
          if (distancia > 500 && tiempoMinutos < 60) {
            cambiosSospechosos.push({
              usuario: ubicacion.perfiles,
              usuario_id: usuarioId,
              ubicacion_anterior: `${ubicacionAnterior.ciudad}, ${ubicacionAnterior.pais}`,
              ubicacion_actual: `${ubicacion.ciudad}, ${ubicacion.pais}`,
              distancia_km: Math.round(distancia),
              tiempo_minutos: Math.round(tiempoMinutos),
              velocidad_teorica: Math.round(velocidad),
              nivel_riesgo: velocidad > 1000 ? 'CRITICO' : 'ALTO',
              fecha_deteccion: ubicacion.ultima_visita
            });
          }
        }
        
        usuariosProcesados.set(usuarioId, ubicacion);
      });

      console.log(`✅ [SEGURIDAD] Detectados ${cambiosSospechosos.length} cambios sospechosos`);
      return cambiosSospechosos;

    } catch (error) {
      console.error('❌ [SEGURIDAD] Error detectando cambios sospechosos:', error);
      return [];
    }
  }

  /**
   * 🏭 DETECCIÓN DE DATA CENTERS Y PROXIES
   */
  async detectarDatacentersYProxies(): Promise<any[]> {
    try {
      console.log('🔍 [SEGURIDAD] Detectando data centers y proxies...');

      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: ubicaciones, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('usuario_id, ip, organizacion, es_vpn, es_proxy, pais, ciudad, ultima_visita, perfiles(nombre, apellido, email)')
        .gte('ultima_visita', hace24h.toISOString());

      if (error) throw error;

             const conexionesSospechosas: any[] = [];

       ubicaciones?.forEach((ub: any) => {
        let esSospechoso = false;
        let motivos = [];

        // Verificar VPN/Proxy explícito
        if (ub.es_vpn || ub.es_proxy) {
          esSospechoso = true;
          motivos.push(ub.es_vpn ? 'VPN detectada' : 'Proxy detectado');
        }

        // Verificar organización (ISP)
        const orgLower = (ub.organizacion || '').toLowerCase();
        const esDatacenter = this.DATACENTER_KEYWORDS.some(keyword => orgLower.includes(keyword));
        const esProxy = this.PROXY_KEYWORDS.some(keyword => orgLower.includes(keyword));

        if (esDatacenter) {
          esSospechoso = true;
          motivos.push('Data center detectado');
        }

        if (esProxy) {
          esSospechoso = true;
          motivos.push('Servicio proxy detectado');
        }

        // Verificar países restringidos
        if (this.PAISES_RESTRINGIDOS.includes(ub.pais)) {
          esSospechoso = true;
          motivos.push('País restringido');
        }

        if (esSospechoso) {
          conexionesSospechosas.push({
            usuario: ub.perfiles,
            usuario_id: ub.usuario_id,
            ip: ub.ip,
            ubicacion: `${ub.ciudad}, ${ub.pais}`,
            organizacion: ub.organizacion,
            motivos_sospecha: motivos,
            nivel_riesgo: motivos.length > 2 ? 'ALTO' : 'MEDIO',
            fecha_deteccion: ub.ultima_visita
          });
        }
      });

      console.log(`✅ [SEGURIDAD] Detectadas ${conexionesSospechosas.length} conexiones sospechosas`);
      return conexionesSospechosas;

    } catch (error) {
      console.error('❌ [SEGURIDAD] Error detectando data centers:', error);
      return [];
    }
  }

  /**
   * 📊 OBTENER ANALYTICS GEOGRÁFICOS COMPLETOS
   */
  async obtenerAnalyticsGeograficos(): Promise<AnalyticsGeografico> {
    try {
      console.log('📊 [ANALYTICS] Obteniendo analytics geográficos...');

      // Estadísticas básicas
      const { data: estadisticas, error: errorStats } = await supabase.rpc('obtener_estadisticas_geograficas_espanol');
      
      // Ubicaciones activas últimas 24h
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const { data: ubicacionesActivas, error: errorActivas } = await supabase
        .from('geolocalizacion_usuarios')
        .select('pais, ciudad, timezone')
        .gte('ultima_visita', hace24h.toISOString());

      // Alertas de seguridad hoy
      const hoy = new Date().toISOString().split('T')[0];
      const alertasHoy = (await this.detectarCuentasCompartidas()).length + 
                        (await this.detectarCambiosUbicacionSospechosos()).length +
                        (await this.detectarDatacentersYProxies()).length;

             const totalPaises = new Set(ubicacionesActivas?.map((u: any) => u.pais) || []).size;
             const totalCiudades = new Set(ubicacionesActivas?.map((u: any) => u.ciudad) || []).size;

      // Distribución por país
      const distribucionPaises = this.calcularDistribucionPaises(ubicacionesActivas || []);

      // Patrones horarios por zona
      const patronesHorarios = this.calcularPatronesHorarios(ubicacionesActivas || []);

      const analytics: AnalyticsGeografico = {
        total_paises: totalPaises,
        total_ciudades: totalCiudades,
        distribucion_por_pais: distribucionPaises,
        ubicaciones_activas_simultaneas: ubicacionesActivas?.length || 0,
        alertas_seguridad_hoy: alertasHoy,
        conexiones_sospechosas: (await this.detectarDatacentersYProxies()).length,
        patrones_horarios: patronesHorarios
      };

      console.log('✅ [ANALYTICS] Analytics geográficos obtenidos');
      return analytics;

    } catch (error) {
      console.error('❌ [ANALYTICS] Error obteniendo analytics:', error);
      return {
        total_paises: 0,
        total_ciudades: 0,
        distribucion_por_pais: [],
        ubicaciones_activas_simultaneas: 0,
        alertas_seguridad_hoy: 0,
        conexiones_sospechosas: 0,
        patrones_horarios: []
      };
    }
  }

  /**
   * 🗺️ OBTENER DATOS PARA MAPA MUNDIAL
   */
  async obtenerDatosMapaMundial(): Promise<any[]> {
    try {
      const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: ubicaciones, error } = await supabase
        .from('geolocalizacion_usuarios')
        .select('pais, ciudad, latitud, longitud, COUNT(*) as usuarios')
        .gte('ultima_visita', hace24h.toISOString())
        .group('pais, ciudad, latitud, longitud');

      if (error) throw error;

             return ubicaciones?.map((ub: any) => ({
        pais: ub.pais,
        ciudad: ub.ciudad,
        coordenadas: [ub.longitud, ub.latitud],
        usuarios: ub.usuarios,
        size: Math.min(Math.max(ub.usuarios * 10, 5), 50) // Tamaño para el mapa
      })) || [];

    } catch (error) {
      console.error('❌ [MAPA] Error obteniendo datos del mapa:', error);
      return [];
    }
  }

  // MÉTODOS AUXILIARES PRIVADOS

  private calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }

     private calcularDistribucionPaises(ubicaciones: any[]): any[] {
     const conteo = new Map<string, number>();
     ubicaciones.forEach((ub: any) => {
       conteo.set(ub.pais, (conteo.get(ub.pais) || 0) + 1);
     });

    const total = ubicaciones.length;
    return Array.from(conteo.entries())
      .map(([pais, usuarios]) => ({
        pais,
        usuarios,
        porcentaje: Math.round((usuarios / total) * 100)
      }))
      .sort((a, b) => b.usuarios - a.usuarios)
      .slice(0, 10);
  }

     private calcularPatronesHorarios(ubicaciones: any[]): any[] {
     const patrones = new Map<string, number>();
     ubicaciones.forEach((ub: any) => {
       if (ub.timezone) {
         patrones.set(ub.timezone, (patrones.get(ub.timezone) || 0) + 1);
       }
     });

    return Array.from(patrones.entries())
      .map(([zona_horaria, usuarios_activos]) => ({
        zona_horaria,
        usuarios_activos
      }))
      .sort((a, b) => b.usuarios_activos - a.usuarios_activos);
  }
}

// Exportar instancia singleton
export const seguridadGeoService = SeguridadGeograficaService.obtenerInstancia();

// Funciones de conveniencia
export const detectarCuentasCompartidas = () => seguridadGeoService.detectarCuentasCompartidas();
export const detectarUbicacionesSospechosas = () => seguridadGeoService.detectarCambiosUbicacionSospechosos();
export const obtenerAnalyticsGeograficos = () => seguridadGeoService.obtenerAnalyticsGeograficos();

// Exportar tipos
export type { AlertaSeguridad, AnalyticsGeografico, HistorialUbicacion }; 