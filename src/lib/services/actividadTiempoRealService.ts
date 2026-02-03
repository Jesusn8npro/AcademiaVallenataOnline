// ==========================================
// 🎯 SERVICIO DE ACTIVIDAD EN TIEMPO REAL
// ==========================================

import { supabase } from '../supabase/clienteSupabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface EventoActividad {
  usuario_id: string;
  tipo_evento: 'navegacion' | 'click' | 'estudio' | 'simulador' | 'leccion' | 'ejercicio';
  pagina?: string;
  duracion_minutos?: number;
  detalles?: any;
}

interface SesionUsuario {
  id: string;
  usuario_id: string;
  fecha: string;
  tiempo_total_minutos: number;
  sesiones_totales: number;
  ultima_actividad: string;
  pagina_actual?: string;
  esta_activo: boolean;
  tiempo_sesion_actual: number;
  perfiles?: {
    id: string;
    nombre: string;
    apellido: string;
    url_foto_perfil?: string;
    rol: string;
    suscripcion?: string;
    nivel_habilidad?: string;
  };
}

class ActividadTiempoRealService {
  private canal: RealtimeChannel | null = null;
  private intervaloActividad: NodeJS.Timeout | null = null;
  private usuarioActualId: string | null = null;
  private paginaActual: string = '';
  private tiempoInicioSesion: Date = new Date();
  private callbacks: ((sesiones: SesionUsuario[]) => void)[] = [];

  // 🎯 INICIALIZAR TRACKING PARA UN USUARIO
  async inicializarTracking(usuarioId: string, paginaInicial: string = '/'): Promise<void> {
    console.log('🚀 [ACTIVIDAD REAL] Inicializando tracking para usuario:', usuarioId);
    
    this.usuarioActualId = usuarioId;
    this.paginaActual = paginaInicial;
    this.tiempoInicioSesion = new Date();

    // Registrar evento de inicio de sesión
    await this.registrarEvento({
      usuario_id: usuarioId,
      tipo_evento: 'navegacion',
      pagina: paginaInicial,
      duracion_minutos: 1
    });

    // Iniciar tracking automático cada minuto
    this.iniciarTrackingAutomatico();

    // Configurar listeners de eventos del navegador
    this.configurarListeners();

    console.log('✅ [ACTIVIDAD REAL] Tracking iniciado correctamente');
  }

  // 📝 REGISTRAR EVENTO DE ACTIVIDAD
  async registrarEvento(evento: EventoActividad): Promise<void> {
    try {
      console.log('📝 [EVENTO ACTIVIDAD]', evento);

      // Llamar función de Supabase para actualizar actividad
      const { error } = await supabase.rpc('actualizar_actividad_usuario', {
        p_usuario_id: evento.usuario_id,
        p_tipo_evento: evento.tipo_evento,
        p_pagina: evento.pagina || this.paginaActual,
        p_duracion_minutos: evento.duracion_minutos || 1
      });

      if (error) {
        console.error('❌ [EVENTO ACTIVIDAD] Error:', error);
      } else {
        console.log('✅ [EVENTO ACTIVIDAD] Registrado correctamente');
      }
    } catch (error) {
      console.error('❌ [EVENTO ACTIVIDAD] Error al registrar:', error);
    }
  }

  // ⏱️ TRACKING AUTOMÁTICO CADA MINUTO
  private iniciarTrackingAutomatico(): void {
    // Limpiar intervalo anterior si existe
    if (this.intervaloActividad) {
      clearInterval(this.intervaloActividad);
    }

    // Registrar actividad cada minuto
    this.intervaloActividad = setInterval(async () => {
      if (this.usuarioActualId) {
        await this.registrarEvento({
          usuario_id: this.usuarioActualId,
          tipo_evento: 'navegacion',
          pagina: this.paginaActual,
          duracion_minutos: 1
        });
      }
    }, 60000); // Cada minuto

    console.log('⏱️ [TRACKING AUTO] Iniciado - cada 60 segundos');
  }

  // 👂 CONFIGURAR LISTENERS DE EVENTOS
  private configurarListeners(): void {
    // Cambio de página/ruta
    const registrarNavegacion = () => {
      const nuevaPagina = window.location.pathname;
      if (nuevaPagina !== this.paginaActual) {
        this.paginaActual = nuevaPagina;
        if (this.usuarioActualId) {
          this.registrarEvento({
            usuario_id: this.usuarioActualId,
            tipo_evento: 'navegacion',
            pagina: nuevaPagina,
            duracion_minutos: 1
          });
        }
      }
    };

    // Detectar cambios de URL (SPA)
    let paginaAnterior = window.location.pathname;
    setInterval(() => {
      if (window.location.pathname !== paginaAnterior) {
        paginaAnterior = window.location.pathname;
        registrarNavegacion();
      }
    }, 1000);

    // Clicks importantes
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      const esElementoImportante = target.closest('button, a, .clickeable, [data-actividad="true"]');
      
      if (esElementoImportante && this.usuarioActualId) {
        this.registrarEvento({
          usuario_id: this.usuarioActualId,
          tipo_evento: 'click',
          pagina: this.paginaActual,
          duracion_minutos: 1,
          detalles: {
            elemento: target.tagName,
            texto: target.textContent?.substring(0, 50)
          }
        });
      }
    });

    // Al salir de la página
    window.addEventListener('beforeunload', () => {
      this.finalizarSesion();
    });

    // Al perder foco (cambiar de pestaña)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pausarTracking();
      } else {
        this.reanudarTracking();
      }
    });

    console.log('👂 [LISTENERS] Configurados correctamente');
  }

  // ⏸️ PAUSAR TRACKING
  private async pausarTracking(): Promise<void> {
    if (this.usuarioActualId) {
      const { error } = await supabase.rpc('marcar_usuario_inactivo', {
        p_usuario_id: this.usuarioActualId
      });
      
      if (!error) {
        console.log('⏸️ [TRACKING] Usuario marcado como inactivo');
      }
    }
  }

  // ▶️ REANUDAR TRACKING
  private async reanudarTracking(): Promise<void> {
    if (this.usuarioActualId) {
      await this.registrarEvento({
        usuario_id: this.usuarioActualId,
        tipo_evento: 'navegacion',
        pagina: this.paginaActual,
        duracion_minutos: 1
      });
      console.log('▶️ [TRACKING] Reanudado');
    }
  }

  // 🛑 FINALIZAR SESIÓN
  async finalizarSesion(): Promise<void> {
    if (this.usuarioActualId) {
      // Calcular tiempo total de la sesión
      const tiempoSesionMinutos = Math.ceil(
        (new Date().getTime() - this.tiempoInicioSesion.getTime()) / (1000 * 60)
      );

      await this.registrarEvento({
        usuario_id: this.usuarioActualId,
        tipo_evento: 'navegacion',
        pagina: 'session_end',
        duracion_minutos: tiempoSesionMinutos
      });

      await this.pausarTracking();
    }

    // Limpiar intervalos
    if (this.intervaloActividad) {
      clearInterval(this.intervaloActividad);
      this.intervaloActividad = null;
    }

    // Desconectar canal tiempo real
    if (this.canal) {
      await supabase.removeChannel(this.canal);
      this.canal = null;
    }

    console.log('🛑 [TRACKING] Sesión finalizada');
  }

  // 📊 OBTENER USUARIOS ACTIVOS EN TIEMPO REAL
  async obtenerUsuariosActivos(limiteTiempoMinutos: number = 30): Promise<SesionUsuario[]> {
    try {
      const fechaLimite = new Date();
      fechaLimite.setMinutes(fechaLimite.getMinutes() - limiteTiempoMinutos);

      const { data, error } = await supabase
        .from('sesiones_usuario')
        .select(`
          *,
          perfiles:usuario_id (
            id,
            nombre,
            apellido,
            url_foto_perfil,
            rol,
            suscripcion,
            nivel_habilidad
          )
        `)
        .eq('fecha', new Date().toISOString().split('T')[0])
        .eq('esta_activo', true)
        .gte('ultima_actividad', fechaLimite.toISOString())
        .order('ultima_actividad', { ascending: false })
        .limit(20);

      if (error) {
        console.error('❌ [USUARIOS ACTIVOS] Error:', error);
        return [];
      }

      console.log('👥 [USUARIOS ACTIVOS] Encontrados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ [USUARIOS ACTIVOS] Error:', error);
      return [];
    }
  }

  // 🏆 OBTENER ALUMNOS MÁS ACTIVOS
  async obtenerAlumnosMasActivos(limite: number = 10): Promise<SesionUsuario[]> {
    try {
      const { data, error } = await supabase
        .from('sesiones_usuario')
        .select(`
          *,
          perfiles:usuario_id (
            id,
            nombre,
            apellido,
            url_foto_perfil,
            rol,
            suscripcion,
            nivel_habilidad
          )
        `)
        .eq('fecha', new Date().toISOString().split('T')[0])
        .gt('tiempo_total_minutos', 0)
        .order('tiempo_total_minutos', { ascending: false })
        .limit(limite);

      if (error) {
        console.error('❌ [ALUMNOS ACTIVOS] Error:', error);
        return [];
      }

             // Marcar como datos reales
       const sesionesReales = (data || []).map((sesion: any) => ({
        ...sesion,
        es_datos_reales: true,
        fuente_datos: 'DATOS_REALES_sesiones_usuario'
      }));

      console.log('🏆 [ALUMNOS ACTIVOS] Datos REALES encontrados:', sesionesReales.length);
      return sesionesReales;
    } catch (error) {
      console.error('❌ [ALUMNOS ACTIVOS] Error:', error);
      return [];
    }
  }

  // 🔔 SUSCRIBIRSE A CAMBIOS EN TIEMPO REAL
  suscribirseACambios(callback: (sesiones: SesionUsuario[]) => void): void {
    this.callbacks.push(callback);

    if (!this.canal) {
      this.canal = supabase
        .channel('actividad-tiempo-real')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sesiones_usuario'
          },
                     async (payload: any) => {
            console.log('🔔 [TIEMPO REAL] Cambio detectado:', payload);
            
            // Obtener datos actualizados
            const usuariosActivos = await this.obtenerUsuariosActivos();
            const alumnosActivos = await this.obtenerAlumnosMasActivos();
            
            // Notificar a todos los callbacks
            this.callbacks.forEach(cb => {
              cb(usuariosActivos);
            });
          }
        )
        .subscribe();
      
      console.log('🔔 [TIEMPO REAL] Suscripción activada');
    }
  }

  // 🔇 DESUSCRIBIRSE DE CAMBIOS
  desuscribirseDecambios(): void {
    this.callbacks = [];
    if (this.canal) {
      supabase.removeChannel(this.canal);
      this.canal = null;
      console.log('🔇 [TIEMPO REAL] Desuscrito');
    }
  }

  // 📚 MÉTODOS ESPECÍFICOS POR TIPO DE ACTIVIDAD

  async registrarEstudio(usuarioId: string, leccionId?: string, tiempoMinutos: number = 1): Promise<void> {
    await this.registrarEvento({
      usuario_id: usuarioId,
      tipo_evento: 'estudio',
      pagina: this.paginaActual,
      duracion_minutos: tiempoMinutos,
      detalles: { leccion_id: leccionId }
    });
  }

  async registrarSimulador(usuarioId: string, cancion?: string, tiempoMinutos: number = 1): Promise<void> {
    await this.registrarEvento({
      usuario_id: usuarioId,
      tipo_evento: 'simulador',
      pagina: '/simulador-de-acordeon',
      duracion_minutos: tiempoMinutos,
      detalles: { cancion }
    });
  }

  async registrarEjercicio(usuarioId: string, ejercicioId: string, completado: boolean = false): Promise<void> {
    await this.registrarEvento({
      usuario_id: usuarioId,
      tipo_evento: 'ejercicio',
      pagina: this.paginaActual,
      duracion_minutos: completado ? 5 : 1,
      detalles: { ejercicio_id: ejercicioId, completado }
    });
  }
}

// 🎯 INSTANCIA SINGLETON
export const actividadService = new ActividadTiempoRealService();

// 🚀 FUNCIÓN PARA INICIALIZAR EN LA APP
export async function inicializarActividadTiempoReal(usuarioId: string): Promise<void> {
  console.log('🚀 [INIT] Inicializando sistema de actividad tiempo real');
  await actividadService.inicializarTracking(usuarioId, window.location.pathname);
}

// 🛑 FUNCIÓN PARA FINALIZAR AL SALIR
export async function finalizarActividadTiempoReal(): Promise<void> {
  console.log('🛑 [FINISH] Finalizando actividad tiempo real');
  await actividadService.finalizarSesion();
}

// 📊 EXPORTAR TIPOS
export type { SesionUsuario, EventoActividad }; 