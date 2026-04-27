import { supabase } from '../clienteSupabase';
import type { DatosGeolocalizacion } from './tipos';

export async function guardarGeolocalizacion(idUsuario: string, datosGeo: DatosGeolocalizacion): Promise<boolean> {
    try {
        const { data: existente } = await supabase
            .from('geolocalizacion_usuarios')
            .select('id')
            .eq('usuario_id', idUsuario)
            .eq('ip', datosGeo.ip)
            .single();

        if (existente) {
            const { error } = await supabase
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
            return !error;
        }

        const { error } = await supabase
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
        return !error;
    } catch {
        return false;
    }
}
