// 🔥 SERVICIO DE TRACKING REAL DE ACTIVIDAD
// Registra automáticamente cuando los usuarios navegan por la plataforma

import { supabase } from '$lib/supabase/clienteSupabase';
import { browser } from '$app/environment';

class TrackingActividadReal {
  private usuarioActual: any = null;
  private tiempoInicioPagina: Date | null = null;
  private paginaActual: string = '';
  private intervalId: NodeJS.Timeout | null = null;
  private trackingActivo: boolean = false;

  /**
   * 🚀 Inicializar tracking para un usuario
   */
  async inicializar(usuario: any) {
    if (!browser || !usuario) return;
    
    this.usuarioActual = usuario;
    this.trackingActivo = true;
    
    console.log('🔥 [TRACKING REAL] Iniciado para:', usuario.nombre);
    
    // Registrar sesión inicial
    await this.registrarSesion();
    
    // Iniciar heartbeat cada 30 segundos
    this.iniciarHeartbeat();
    
    // Listeners de navegador
    this.configurarListeners();
  }

  /**
   * ⚡ Registrar cambio de página
   */
  async cambiarPagina(nuevaPagina: string) {
    if (!this.trackingActivo || !this.usuarioActual) return;
    
    // Guardar tiempo de página anterior
    if (this.tiempoInicioPagina && this.paginaActual) {
      const tiempoEnPagina = Math.round((Date.now() - this.tiempoInicioPagina.getTime()) / 60000); // minutos
      console.log(`📊 [TRACKING] ${this.paginaActual}: ${tiempoEnPagina} min`);
    }
    
    // Actualizar página actual
    this.paginaActual = nuevaPagina;
    this.tiempoInicioPagina = new Date();
    
    // Registrar actividad
    await this.registrarActividad();
  }

  /**
   * 💓 Heartbeat - mantener sesión activa
   */
  private iniciarHeartbeat() {
    if (this.intervalId) clearInterval(this.intervalId);
    
    this.intervalId = setInterval(async () => {
      if (this.trackingActivo) {
        await this.registrarActividad();
      }
    }, 30000); // Cada 30 segundos
  }

  /**
   * 📝 Registrar sesión en base de datos
   */
  private async registrarSesion() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('sesiones_usuario')
        .upsert({
          usuario_id: this.usuarioActual.id,
          fecha: today,
          tiempo_total_minutos: 0,
          sesiones_totales: 1,
          ultima_actividad: new Date().toISOString(),
          pagina_actual: this.paginaActual || window.location.pathname,
          esta_activo: true,
          tiempo_sesion_actual: 0
        }, {
          onConflict: 'usuario_id,fecha'
        });
        
      console.log('✅ [TRACKING] Sesión registrada');
    } catch (error) {
      console.warn('⚠️ [TRACKING] Error registrando sesión:', error);
    }
  }

  /**
   * 🔄 Actualizar actividad
   */
  private async registrarActividad() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const ahora = new Date().toISOString();
      
      // Calcular tiempo total de la sesión actual
      const tiempoSesionActual = this.tiempoInicioPagina 
        ? Math.round((Date.now() - this.tiempoInicioPagina.getTime()) / 60000)
        : 0;
      
      // Obtener datos actuales para incrementar tiempo total
      const { data: sesionActual } = await supabase
        .from('sesiones_usuario')
        .select('tiempo_total_minutos, sesiones_totales')
        .eq('usuario_id', this.usuarioActual.id)
        .eq('fecha', today)
        .single();
      
      // ✅ CORRECCIÓN: NO incrementar tiempo por heartbeat, solo mantener sesión activa
      // 🎯 RAZÓN: El tiempo debe calcularse basado en actividad REAL, no en heartbeats
      const tiempoTotalActualizado = sesionActual?.tiempo_total_minutos || 0; // ✅ Mantener tiempo existente
      
      await supabase
        .from('sesiones_usuario')
        .upsert({
          usuario_id: this.usuarioActual.id,
          fecha: today,
          tiempo_total_minutos: tiempoTotalActualizado, // ✅ Sin incremento automático
          sesiones_totales: sesionActual?.sesiones_totales || 1,
          ultima_actividad: ahora,
          pagina_actual: this.paginaActual || window.location.pathname,
          esta_activo: true,
          tiempo_sesion_actual: tiempoSesionActual
        }, {
          onConflict: 'usuario_id,fecha'
        });
        
      // Registrar evento de actividad
      await supabase
        .from('eventos_actividad')
        .insert({
          usuario_id: this.usuarioActual.id,
          tipo_evento: 'heartbeat',
          pagina: this.paginaActual || window.location.pathname,
          datos_adicionales: {
            tiempo_sesion_actual: tiempoSesionActual,
            dispositivo: this.detectarDispositivo()
          }
        });
        
    } catch (error) {
      console.warn('⚠️ [TRACKING] Error actualizando actividad:', error);
    }
  }

  /**
   * 🔚 Finalizar sesión
   */
  async finalizar() {
    if (!this.trackingActivo) return;
    
    this.trackingActivo = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    // Marcar como inactivo
    try {
      const today = new Date().toISOString().split('T')[0];
      
      await supabase
        .from('sesiones_usuario')
        .update({
          esta_activo: false,
          tiempo_sesion_actual: 0
        })
        .eq('usuario_id', this.usuarioActual.id)
        .eq('fecha', today);
        
      console.log('🔚 [TRACKING] Sesión finalizada');
    } catch (error) {
      console.warn('⚠️ [TRACKING] Error finalizando sesión:', error);
    }
  }

  /**
   * 🎧 Configurar listeners del navegador
   */
  private configurarListeners() {
    if (!browser) return;
    
    // Cuando la página se oculta/cierra
    window.addEventListener('beforeunload', () => this.finalizar());
    window.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.finalizar();
      } else if (this.usuarioActual) {
        this.inicializar(this.usuarioActual);
      }
    });
  }

  /**
   * 📱 Detectar tipo de dispositivo
   */
  private detectarDispositivo(): string {
    if (!browser) return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('mobile')) return 'mobile';
    if (userAgent.includes('tablet')) return 'tablet';
    return 'desktop';
  }
}

// Instancia singleton
export const trackingRealService = new TrackingActividadReal(); 