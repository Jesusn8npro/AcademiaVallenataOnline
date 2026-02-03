// ==========================================
// 🎯 UTILIDADES DE ACTIVIDAD GLOBAL
// ==========================================

import { actividadService } from '$lib/services/actividadTiempoRealService';
import { supabase } from '../supabase/clienteSupabase';

let trackingInicializado = false;

/**
 * 🚀 INICIALIZAR TRACKING GLOBAL
 * Debe llamarse en el layout principal o cuando el usuario se autentique
 */
export async function inicializarTrackingGlobal(): Promise<void> {
  if (trackingInicializado) {
    console.log('⚠️ [TRACKING GLOBAL] Ya está inicializado');
    return;
  }

  try {
    // Verificar si hay usuario autenticado
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      console.log('📝 [TRACKING GLOBAL] Usuario no autenticado - skip tracking');
      return;
    }

    // Inicializar tracking para el usuario
    console.log('🚀 [TRACKING GLOBAL] Inicializando para usuario:', user.id);
    await actividadService.inicializarTracking(user.id, window.location.pathname);
    
    trackingInicializado = true;
    console.log('✅ [TRACKING GLOBAL] Activado correctamente');

    // Configurar eventos específicos de la aplicación
    configurarEventosEspecificos(user.id);

  } catch (error) {
    console.error('❌ [TRACKING GLOBAL] Error al inicializar:', error);
  }
}

/**
 * 🎯 CONFIGURAR EVENTOS ESPECÍFICOS DE LA ACADEMIA
 */
function configurarEventosEspecificos(usuarioId: string): void {
  // Detectar cuando alguien empieza una lección
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    
    // Click en botón de "Empezar Lección" o similar
    if (target.matches('[data-accion="empezar-leccion"]') || 
        target.closest('[data-accion="empezar-leccion"]')) {
             actividadService.registrarEstudio(usuarioId, target.dataset.leccionId || '', 5);
    }
    
    // Click en simulador de acordeón
    if (target.matches('[data-accion="abrir-simulador"]') || 
        target.closest('[data-accion="abrir-simulador"]') ||
        window.location.pathname.includes('/simulador')) {
             actividadService.registrarSimulador(usuarioId, target.dataset.cancion || '', 3);
    }
    
    // Click en ejercicios completados
    if (target.matches('[data-accion="completar-ejercicio"]') || 
        target.closest('[data-accion="completar-ejercicio"]')) {
             actividadService.registrarEjercicio(usuarioId, target.dataset.ejercicioId || '', true);
    }
  });

  console.log('🎯 [EVENTOS ESPECÍFICOS] Configurados para academia de acordeón');
}

/**
 * 🛑 FINALIZAR TRACKING GLOBAL
 * Debe llamarse al cerrar sesión o al salir de la aplicación
 */
export async function finalizarTrackingGlobal(): Promise<void> {
  if (!trackingInicializado) {
    return;
  }

  console.log('🛑 [TRACKING GLOBAL] Finalizando...');
  await actividadService.finalizarSesion();
  trackingInicializado = false;
  console.log('✅ [TRACKING GLOBAL] Finalizado correctamente');
}

/**
 * 📊 HELPERS PARA REGISTRAR ACTIVIDADES ESPECÍFICAS
 */
export const registrarActividad = {
  async estudio(leccionId?: string, tiempoMinutos: number = 1): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await actividadService.registrarEstudio(user.id, leccionId, tiempoMinutos);
    }
  },

  async simulador(cancion?: string, tiempoMinutos: number = 1): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await actividadService.registrarSimulador(user.id, cancion, tiempoMinutos);
    }
  },

  async ejercicio(ejercicioId: string, completado: boolean = false): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await actividadService.registrarEjercicio(user.id, ejercicioId, completado);
    }
  },

  async navegacion(pagina?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await actividadService.registrarEvento({
        usuario_id: user.id,
        tipo_evento: 'navegacion',
        pagina: pagina || window.location.pathname,
        duracion_minutos: 1
      });
    }
  }
};

/**
 * 🔍 VERIFICAR SI EL TRACKING ESTÁ ACTIVO
 */
export function estaTrackingActivo(): boolean {
  return trackingInicializado;
} 