export type { DatosGeolocalizacion, ErrorGeolocalizacion } from './geolocalizacion/tipos';
import { supabase } from './clienteSupabase';
import { obtenerIpPublica, obtenerGeolocalizacion, limpiarCache } from './geolocalizacion/_api';
import { guardarGeolocalizacion } from './geolocalizacion/guardar';

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

export const servicioGeolocalizacion = {
    obtenerIpPublica,
    obtenerGeolocalizacion,
    guardarGeolocalizacion,
    rastreoCompleto,
    limpiarCache
};
