import { supabase } from './supabaseCliente';

// Tipos
export interface AlertaSeguridad {
    tipo: 'CUENTA_COMPARTIDA' | 'CAMBIO_UBICACION' | 'CONEXION_SOSPECHOSA';
    nivel_riesgo: 'CRITICO' | 'ALTO' | 'MEDIO' | 'BAJO';
    usuario?: {
        id: string;
        nombre: string;
        apellido: string;
        email: string;
    };
    detalles: any;
    fecha: string;
}

export const servicioSeguridad = {
    // 1. Detectar cuentas compartidas (Múltiples IPs/Países en corto tiempo)
    async detectarCuentasCompartidas() {
        try {
            // En una implementación real, esto usaría una RPC de Supabase o una Edge Function
            // Simularemos la lógica básica consultando logs recientes
            const { data: logs } = await supabase
                .from('geolocalizacion_usuarios')
                .select(`
          usuario_id, ip, pais, created_at,
          perfiles:usuario_id (nombre, apellido, email)
        `)
                .order('created_at', { ascending: false })
                .limit(100);

            const mapUsuarios: Record<string, any[]> = {};

            logs?.forEach((log: any) => {
                if (!mapUsuarios[log.usuario_id]) mapUsuarios[log.usuario_id] = [];
                mapUsuarios[log.usuario_id].push(log);
            });

            const cuentasCompartidas: any[] = [];

            Object.entries(mapUsuarios).forEach(([userId, accesos]) => {
                const uniqueIPs = new Set(accesos.map(a => a.ip)).size;
                const uniquePaises = new Set(accesos.map(a => a.pais)).size;

                if (uniqueIPs > 3 || uniquePaises > 2) {
                    cuentasCompartidas.push({
                        usuario: accesos[0].perfiles,
                        nivel_riesgo: uniquePaises > 2 ? 'CRITICO' : 'ALTO',
                        ubicaciones_simultaneas: uniqueIPs,
                        paises_diferentes: uniquePaises,
                        ips_diferentes: uniqueIPs
                    });
                }
            });

            return cuentasCompartidas;
        } catch (error) {
            console.error('Error detectando cuentas compartidas:', error);
            return [];
        }
    },

    // 2. Detectar cambios de ubicación sospechosos (Velocidad imposible)
    async detectarCambiosUbicacionSospechosos() {
        try {
            const { data: logs } = await supabase
                .from('geolocalizacion_usuarios')
                .select(`
            usuario_id, latitud, longitud, created_at, ciudad, pais,
            perfiles:usuario_id (nombre, apellido, email)
        `)
                .order('created_at', { ascending: false })
                .limit(200); // Analizar últimos 200 accesos

            const mapUsuarios: Record<string, any[]> = {};
            logs?.forEach((log: any) => {
                if (!mapUsuarios[log.usuario_id]) mapUsuarios[log.usuario_id] = [];
                mapUsuarios[log.usuario_id].push(log);
            });

            const cambiosSospechosos: any[] = [];

            Object.entries(mapUsuarios).forEach(([userId, accesos]) => {
                // Orden cronológico
                const accesosOrdenados = accesos.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                for (let i = 1; i < accesosOrdenados.length; i++) {
                    const actual = accesosOrdenados[i];
                    const anterior = accesosOrdenados[i - 1];

                    // Calcular distancia Haversine
                    const d = calcularDistancia(anterior.latitud, anterior.longitud, actual.latitud, actual.longitud);

                    if (d > 100) { // Solo analizar si se movió más de 100km
                        const tiempoHoras = (new Date(actual.created_at).getTime() - new Date(anterior.created_at).getTime()) / (1000 * 60 * 60);
                        const velocidad = d / tiempoHoras;

                        if (velocidad > 900) { // Más rápido que un avión comercial (aprox)
                            cambiosSospechosos.push({
                                usuario: actual.perfiles,
                                nivel_riesgo: 'ALTO',
                                ubicacion_anterior: `${anterior.ciudad}, ${anterior.pais}`,
                                ubicacion_actual: `${actual.ciudad}, ${actual.pais}`,
                                distancia_km: Math.round(d),
                                tiempo_minutos: Math.round(tiempoHoras * 60),
                                velocidad_teorica: Math.round(velocidad)
                            });
                        }
                    }
                }
            });

            return cambiosSospechosos;
        } catch (error) {
            console.error('Error detectando cambios sospechosos:', error);
            return [];
        }
    },

    // 3. Detectar Datacenters/Proxies (Mock para demo, en real usaría servicio de IP Intelligence)
    async detectarDatacentersYProxies() {
        // Simulamos detección basada en organizaciones conocidas (esto sería más complejo en prod)
        return [];
    },

    async obtenerAnalyticsGeograficos() {
        try {
            const { data: logs } = await supabase
                .from('geolocalizacion_usuarios')
                .select('*');

            const total_paises = new Set(logs?.map((l: any) => l.pais)).size;
            const total_ciudades = new Set(logs?.map((l: any) => l.ciudad)).size;

            // Distribución por país
            const paisesCount: Record<string, number> = {};
            logs?.forEach((l: any) => {
                paisesCount[l.pais] = (paisesCount[l.pais] || 0) + 1;
            });

            const total = logs?.length || 1;
            const distribucion_por_pais = Object.entries(paisesCount)
                .map(([pais, count]) => ({
                    pais,
                    usuarios: count,
                    porcentaje: Math.round((count / total) * 100)
                }))
                .sort((a, b) => b.usuarios - a.usuarios);

            // Patrones
            const zonasCount: Record<string, number> = {};
            logs?.forEach((l: any) => {
                const zona = l.timezone || 'Desconocida';
                zonasCount[zona] = (zonasCount[zona] || 0) + 1;
            });
            const patrones_horarios = Object.entries(zonasCount)
                .map(([zona, count]) => ({ zona_horaria: zona, usuarios_activos: count }))
                .sort((a, b) => b.usuarios_activos - a.usuarios_activos);

            return {
                total_paises,
                total_ciudades,
                distribucion_por_pais,
                ubicaciones_activas_simultaneas: logs?.length || 0, // Simplificación
                alertas_seguridad_hoy: 0, // Se llenaría con llamadas a alertas
                conexiones_sospechosas: 0,
                patrones_horarios
            };
        } catch (error) {
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
    },

    async obtenerDatosMapaMundial() {
        // Agrupar por ciudad/coordenadas para el mapa
        try {
            const { data: logs } = await supabase
                .from('geolocalizacion_usuarios')
                .select('ciudad, pais, latitud, longitud');

            if (!logs) return [];

            const mapLocs: Record<string, any> = {};
            logs.forEach((l: any) => {
                const key = `${l.ciudad}-${l.pais}`;
                if (!mapLocs[key]) {
                    mapLocs[key] = { ciudad: l.ciudad, pais: l.pais, lat: l.latitud, lng: l.longitud, usuarios: 0 };
                }
                mapLocs[key].usuarios++;
            });

            return Object.values(mapLocs).sort((a: any, b: any) => b.usuarios - a.usuarios);
        } catch {
            return [];
        }
    }
};

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radio de la tierra km
    const dLat = gradToRad(lat2 - lat1);
    const dLon = gradToRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(gradToRad(lat1)) * Math.cos(gradToRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function gradToRad(deg: number) {
    return deg * (Math.PI / 180);
}
