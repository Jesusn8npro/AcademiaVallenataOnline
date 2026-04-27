// ==========================================
// 🔥 REGISTRAR ACTIVIDAD INMEDIATA
// ==========================================

import { supabase } from './clienteSupabase';

/**
 * 🔥 REGISTRA ACTIVIDAD INMEDIATA DEL USUARIO ACTUAL
 * Úsalo cuando sepas que alguien está navegando AHORA
 */
export async function registrarActividadInmediata(): Promise<boolean> {
  try {

    // Obtener usuario actual
    const { data: { user }, error: errorUser } = await supabase.auth.getUser();
    
    if (errorUser || !user) {
      return false;
    }


    // Registrar actividad usando función SQL
    const { error: errorActividad } = await supabase.rpc('actualizar_actividad_usuario', {
      p_usuario_id: user.id,
      p_tipo_evento: 'navegacion',
      p_pagina: window.location.pathname,
      p_duracion_minutos: 5
    });

    if (errorActividad) {
      return false;
    }


    // Verificar que se registró
    const { data: verificacion, error: errorVerif } = await supabase
      .from('sesiones_usuario')
      .select('ultima_actividad, esta_activo, tiempo_sesion_actual')
      .eq('usuario_id', user.id)
      .eq('fecha', new Date().toISOString().split('T')[0])
      .single();

    if (!errorVerif && verificacion) {
        ultima_actividad: verificacion.ultima_actividad,
        esta_activo: verificacion.esta_activo,
        tiempo_sesion: verificacion.tiempo_sesion_actual
      });
      return true;
    } else {
      return false;
    }

  } catch (error) {
    return false;
  }
}

/**
 * 🔄 MANTENER ACTIVIDAD ACTIVA
 * Llama esto cada minuto para mantener al usuario como "activo"
 */
export function mantenerActividadActiva(): () => void {

  const interval = setInterval(async () => {
    const exito = await registrarActividadInmediata();
  }, 60000); // Cada minuto

  // Retornar función para limpiar
  return () => {
    clearInterval(interval);
  };
}

/**
 * 📊 VERIFICAR ACTIVIDAD ACTUAL
 * Para debugging - ver qué usuarios están activos ahora
 */
export async function verificarActividadActual(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('sesiones_usuario')
      .select(`
        usuario_id,
        ultima_actividad,
        esta_activo,
        tiempo_sesion_actual,
        pagina_actual,
        perfiles:usuario_id (
          nombre,
          apellido,
          rol
        )
      `)
      .eq('fecha', new Date().toISOString().split('T')[0])
      .eq('esta_activo', true)
      .gte('ultima_actividad', new Date(Date.now() - 30 * 60 * 1000).toISOString()) // Últimos 30 min
      .order('ultima_actividad', { ascending: false });

    if (error) {
      return [];
    }

    data?.forEach((usuario: any, index: number) => {
    });

    return data || [];
  } catch (error) {
    return [];
  }
} 
