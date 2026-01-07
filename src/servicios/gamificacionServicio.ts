import { supabase } from './supabaseCliente'

// =====================================================
// 🎯 TIPOS DE DATOS GAMING
// =====================================================

export interface ExperienciaUsuario {
  id: string;
  usuario_id: string;
  nivel: number;
  xp_actual: number;
  xp_total: number;
  xp_siguiente_nivel: number;
  xp_cursos: number;
  xp_simulador: number;
  xp_comunidad: number;
  xp_logros: number;
  racha_dias: number;
  racha_maxima: number;
  ultima_sesion: string;
  created_at: string;
  updated_at: string;
}

export interface LogroSistema {
  id: string;
  nombre: string;
  descripcion: string;
  descripcion_corta: string;
  icono: string;
  categoria: 'constancia' | 'progreso' | 'precision' | 'social' | 'especial' | 'simulador' | 'cursos' | 'comunidad';
  dificultad: 'facil' | 'medio' | 'dificil' | 'legendario';
  xp_recompensa: number;
  monedas_recompensa: number;
  titulo_especial: string | null;
  condiciones: Record<string, any>;
  activo: boolean;
  visible: boolean;
  orden_mostrar: number;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  created_at: string;
  updated_at: string;
}

export interface LogroUsuario {
  id: string;
  usuario_id: string;
  logro_id: string;
  conseguido: boolean;
  progreso_actual: number;
  progreso_objetivo: number;
  porcentaje_progreso: number;
  datos_logro: Record<string, any>;
  conseguido_en: string | null;
  primer_progreso: string;
  ultimo_progreso: string;
  created_at: string;
  updated_at: string;
  logro_sistema?: LogroSistema;
}

export interface RankingGlobal {
  id: string
  usuario_id: string
  tipo_ranking: string
  puntuacion: number
  posicion: number
  perfiles?: { nombre?: string | null; apellido?: string | null; url_foto_perfil?: string | null }
  metricas?: Record<string, any>
  posicion_anterior?: number | null
  periodo_inicio?: string
  periodo_fin?: string | null
  temporada?: string | null
  activo?: boolean
  calculated_at?: string
  created_at?: string
  updated_at?: string
}

export interface EstadisticasUsuario {
  id: string;
  usuario_id: string;
  total_sesiones: number;
  tiempo_total_minutos: number;
  primer_sesion: string | null;
  ultima_sesion: string | null;
  precision_maxima: number;
  precision_promedio: number;
  notas_totales_tocadas: number;
  notas_correctas_totales: number;
  cursos_completados: number;
  tutoriales_completados: number;
  lecciones_completadas: number;
  publicaciones_creadas: number;
  likes_recibidos: number;
  comentarios_hechos: number;
  logros_totales: number;
  logros_faciles: number;
  logros_medios: number;
  logros_dificiles: number;
  logros_legendarios: number;
  racha_actual_dias: number;
  racha_maxima_dias: number;
  dias_activos_total: number;
  mejor_posicion_global: number | null;
  mejor_posicion_semanal: number | null;
  semanas_en_top_10: number;
  calculado_en: string;
  created_at: string;
  updated_at: string;
}

export interface NotificacionGaming {
  id: string;
  usuario_id: string;
  tipo: 'logro_conseguido' | 'subida_nivel' | 'nuevo_ranking' | 'racha_perdida' | 'desafio_completado' | 'monedas_ganadas' | 'evento_especial' | 'meta_alcanzada';
  titulo: string;
  mensaje: string;
  icono: string;
  datos_notificacion: Record<string, any>;
  leida: boolean;
  mostrada: boolean;
  accion_realizada: boolean;
  prioridad: 'baja' | 'normal' | 'alta' | 'critica';
  estilo_visual: 'normal' | 'celebracion' | 'logro' | 'ranking' | 'especial';
  fecha_expiracion: string | null;
  leida_en: string | null;
  mostrada_en: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// 🏆 CONFIGURACIÓN DE NIVELES Y XP
// =====================================================

const CONFIGURACION_NIVELES = {
  base_xp: 1000,
  multiplicador: 1.15,
  nivel_maximo: 100
};

export class GamificacionServicio {

  // =====================================================
  // 📊 EXPERIENCIA Y NIVELES
  // =====================================================

  static async obtenerExperienciaUsuario(usuarioId: string): Promise<ExperienciaUsuario | null> {
    try {
      const { data, error } = await supabase
        .from('experiencia_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo experiencia:', error);
        return null;
      }

      if (!data) {
        return await this.inicializarExperienciaUsuario(usuarioId);
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerExperienciaUsuario:', error);
      return null;
    }
  }

  static async inicializarExperienciaUsuario(usuarioId: string): Promise<ExperienciaUsuario | null> {
    try {
      const { data, error } = await supabase
        .from('experiencia_usuario')
        .insert({
          usuario_id: usuarioId,
          nivel: 1,
          xp_actual: 0,
          xp_total: 0,
          xp_siguiente_nivel: CONFIGURACION_NIVELES.base_xp,
          xp_cursos: 0,
          xp_simulador: 0,
          xp_comunidad: 0,
          xp_logros: 0,
          racha_dias: 0,
          racha_maxima: 0,
          ultima_sesion: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error inicializando experiencia:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en inicializarExperienciaUsuario:', error);
      return null;
    }
  }

  static calcularXPParaNivel(nivel: number): number {
    let totalXP = 0;
    for (let i = 1; i < nivel; i++) {
      totalXP += Math.floor(CONFIGURACION_NIVELES.base_xp * Math.pow(CONFIGURACION_NIVELES.multiplicador, i - 1));
    }
    return totalXP;
  }

  static calcularNivelDesdeXP(xpTotal: number): { nivel: number; xpActual: number; xpSiguienteNivel: number } {
    let nivel = 1;
    let xpAcumulado = 0;

    while (nivel < CONFIGURACION_NIVELES.nivel_maximo) {
      const xpNivel = Math.floor(CONFIGURACION_NIVELES.base_xp * Math.pow(CONFIGURACION_NIVELES.multiplicador, nivel - 1));
      if (xpAcumulado + xpNivel > xpTotal) {
        break;
      }
      xpAcumulado += xpNivel;
      nivel++;
    }

    const xpActual = xpTotal - xpAcumulado;
    const xpSiguienteNivel = Math.floor(CONFIGURACION_NIVELES.base_xp * Math.pow(CONFIGURACION_NIVELES.multiplicador, nivel - 1));

    return { nivel, xpActual, xpSiguienteNivel };
  }

  static async agregarXP(usuarioId: string, cantidad: number, categoria: 'cursos' | 'simulador' | 'comunidad' | 'logros'): Promise<{
    success: boolean;
    nivelAnterior: number;
    nivelNuevo: number;
    subioNivel: boolean;
    experiencia: ExperienciaUsuario | null;
  }> {
    try {
      const experienciaActual = await this.obtenerExperienciaUsuario(usuarioId);
      if (!experienciaActual) {
        return { success: false, nivelAnterior: 1, nivelNuevo: 1, subioNivel: false, experiencia: null };
      }

      const nivelAnterior = experienciaActual.nivel;
      const nuevoXPTotal = experienciaActual.xp_total + cantidad;
      const datosNivel = this.calcularNivelDesdeXP(nuevoXPTotal);

      const actualizacion: any = {
        xp_total: nuevoXPTotal,
        nivel: datosNivel.nivel,
        xp_actual: datosNivel.xpActual,
        xp_siguiente_nivel: datosNivel.xpSiguienteNivel,
        ultima_sesion: new Date().toISOString()
      };

      // Actualizar categoría específica
      actualizacion[`xp_${categoria}`] = (experienciaActual[`xp_${categoria}` as keyof ExperienciaUsuario] as number) + cantidad;

      const { data, error } = await supabase
        .from('experiencia_usuario')
        .update(actualizacion)
        .eq('usuario_id', usuarioId)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando XP:', error);
        return { success: false, nivelAnterior, nivelNuevo: nivelAnterior, subioNivel: false, experiencia: null };
      }

      const subioNivel = datosNivel.nivel > nivelAnterior;

      if (subioNivel) {
        await this.crearNotificacionGaming(usuarioId, {
          tipo: 'subida_nivel',
          titulo: `¡Nivel ${datosNivel.nivel} alcanzado!`,
          mensaje: `¡Felicidades! Has subido al nivel ${datosNivel.nivel}`,
          icono: '🎉',
          datos_notificacion: {
            nivel_anterior: nivelAnterior,
            nivel_nuevo: datosNivel.nivel,
            xp_ganado: cantidad
          },
          prioridad: 'alta',
          estilo_visual: 'celebracion',
          fecha_expiracion: null
        });
      }

      return {
        success: true,
        nivelAnterior,
        nivelNuevo: datosNivel.nivel,
        subioNivel,
        experiencia: data
      };
    } catch (error) {
      console.error('Error en agregarXP:', error);
      return { success: false, nivelAnterior: 1, nivelNuevo: 1, subioNivel: false, experiencia: null };
    }
  }

  // =====================================================
  // 🏆 SISTEMA DE LOGROS
  // =====================================================

  static async obtenerLogrosSistema(): Promise<LogroSistema[]> {
    try {
      const { data, error } = await supabase
        .from('logros_sistema')
        .select('*')
        .eq('activo', true)
        .eq('visible', true)
        .order('orden_mostrar');

      if (error) {
        console.error('Error obteniendo logros del sistema:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en obtenerLogrosSistema:', error);
      return [];
    }
  }

  static async obtenerLogrosUsuario(usuarioId: string): Promise<LogroUsuario[]> {
    try {
      const { data, error } = await supabase
        .from('logros_usuario')
        .select(`
          *,
          logros_sistema (*)
        `)
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error obteniendo logros del usuario:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en obtenerLogrosUsuario:', error);
      return [];
    }
  }

  // =====================================================
  // 🏅 SISTEMA DE RANKING
  // =====================================================

  static async obtenerRanking(tipo: string = 'general', limite: number = 200): Promise<RankingGlobal[]> {
    // Helper timeout local
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout ranking')), 10000));

    try {
      const fetchLogic = async () => {
        const { data, error } = await supabase.rpc('obtener_ranking_hibrido_completo', {
          p_tipo_ranking: tipo,
          p_limite: limite
        })
        if (!error && data?.length) {
          return (data as any[]).map(item => ({
            id: `${item.usuario_id}_${tipo}`,
            usuario_id: item.usuario_id,
            tipo_ranking: tipo,
            puntuacion: item.puntuacion || 0,
            posicion: item.posicion || 0,
            metricas: {
              nivel: item.nivel || 1,
              xp_total: item.xp_total || 0,
              cursos_completados: item.cursos_completados || 0,
              tutoriales_completados: item.tutoriales_completados || 0,
              publicaciones_creadas: item.publicaciones_creadas || 0,
              likes_recibidos: item.likes_recibidos || 0,
              comentarios_hechos: item.comentarios_hechos || 0,
              racha_actual_dias: item.racha_actual_dias || 0,
              logros_conseguidos: item.logros_totales || 0,
              es_gaming: item.es_gaming || false
            },
            perfiles: {
              nombre: item.nombre || 'Usuario',
              apellido: item.apellido || '',
              url_foto_perfil: item.url_foto_perfil || null
            }
          }))
        }
        // Fallback tradicional: ranking_global + perfiles
        const { data: fallback, error: err2 } = await supabase
          .from('ranking_global')
          .select('*, perfiles:perfiles(nombre,apellido,url_foto_perfil)')
          .eq('tipo_ranking', tipo)
          .eq('activo', true)
          .order('puntuacion', { ascending: false })
          .limit(limite)

        if (err2) return []

        return (fallback as any[]).map(item => ({
          id: `${item.usuario_id}_${tipo}`,
          usuario_id: item.usuario_id,
          tipo_ranking: tipo,
          puntuacion: item.puntuacion || 0,
          posicion: item.posicion || 0,
          perfiles: item.perfiles
        }))
      };

      // Race condition con timeout
      const result = await Promise.race([fetchLogic(), timeoutPromise]);
      return result as RankingGlobal[];

    } catch (error) {
      console.error('Error obteniendo ranking:', error);
      return [] // Retornar vacío en error/timeout para no bloquear la UI
    }
  }

  static async obtenerPosicionUsuario(usuarioId: string, tipo: string = 'general'): Promise<RankingGlobal | null> {
    try {
      const { data, error } = await supabase
        .from('ranking_global')
        .select('*, perfiles:perfiles(nombre,apellido,url_foto_perfil)')
        .eq('usuario_id', usuarioId)
        .eq('tipo_ranking', tipo)
        .eq('activo', true)
        .maybeSingle()
      if (error) return null
      return data as any
    } catch { return null }
  }

  // =====================================================
  // 📚 ESTADÍSTICAS
  // =====================================================

  static async obtenerEstadisticasUsuario(usuarioId: string): Promise<EstadisticasUsuario | null> {
    try {
      const { data, error } = await supabase
        .from('estadisticas_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerEstadisticasUsuario:', error);
      return null;
    }
  }

  // =====================================================
  // 🔔 NOTIFICACIONES GAMING
  // =====================================================

  static async crearNotificacionGaming(usuarioId: string, notificacion: Partial<NotificacionGaming>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notificaciones_gaming')
        .insert({
          usuario_id: usuarioId,
          leida: false,
          mostrada: false,
          ...notificacion
        });

      if (error) {
        console.error('Error creando notificación gaming:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en crearNotificacionGaming:', error);
      return false;
    }
  }
}
