export type { DatosGeolocalizacion, ErrorGeolocalizacion } from './geolocalizacion/tipos';
export { obtenerHistorialUsuario, obtenerEstadisticasUsuario, detectarRiesgo, colorRiesgo } from './geolocalizacion/historial';

import { supabase } from './clienteSupabase';
import { obtenerIpPublica, obtenerGeolocalizacion, limpiarCache } from './geolocalizacion/_api';
import { guardarGeolocalizacion } from './geolocalizacion/guardar';
import { obtenerHistorialUsuario, obtenerEstadisticasUsuario, detectarRiesgo, colorRiesgo } from './geolocalizacion/historial';

async function rastreoCompleto(idUsuario?: string): Promise<boolean> {
    try {
        let usuarioActual = idUsuario;
        if (!usuarioActual) {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return false;
            usuarioActual = user.id;
        }
        const ipPublica = await obtenerIpPublica();
        if (!ipPublica) return false;
        const resultadoGeo = await obtenerGeolocalizacion(ipPublica);
        if ('error' in resultadoGeo) return false;
        return guardarGeolocalizacion(usuarioActual!, resultadoGeo);
    } catch {
        return false;
    }
}

// Alias de compatibilidad con nombres del servicio anterior
export const obtenerIPPublica = obtenerIpPublica;
export const obtenerDatosGeolocalizacion = obtenerGeolocalizacion;
export const guardarGeolocalizacionUsuario = (usuarioId: string, datos: any) =>
    guardarGeolocalizacion(usuarioId, datos);

export const servicioGeolocalizacion = {
    obtenerIpPublica,
    obtenerGeolocalizacion,
    guardarGeolocalizacion,
    rastreoCompleto,
    limpiarCache,
    obtenerHistorialUsuario,
    obtenerEstadisticasUsuario,
    detectarRiesgo,
    colorRiesgo,
};
