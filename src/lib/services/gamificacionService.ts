/**
 * 🎮 ACADEMIA VALLENATA ONLINE - SERVICIO DE GAMIFICACIÓN
 * =====================================================
 * Integración completa con sistema existente
 * Manejo de XP, niveles, logros, ranking y notificaciones
 * Estilo gaming de lujo con tracking completo
 * =====================================================
 */

import { supabase } from '../supabase/clienteSupabase';
// import type { Database } from '../types/database.types';

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
  id: string;
  usuario_id: string;
  tipo_ranking: 'general' | 'semanal' | 'mensual' | 'simulador' | 'cursos' | 'precision' | 'constancia' | 'comunidad' | 'especial';
  puntuacion: number;
  posicion: number;
  posicion_anterior: number | null;
  metricas: Record<string, any>;
  periodo_inicio: string;
  periodo_fin: string | null;
  temporada: string | null;
  activo: boolean;
  calculated_at: string;
  created_at: string;
  updated_at: string;
  // Relación con perfiles obtenida del JOIN
  perfiles?: {
    nombre: string | null;
    apellido: string | null;
    url_foto_perfil?: string | null;
  };
}

export interface SesionSimulador {
  id: string;
  usuario_id: string;
  duracion_minutos: number;
  duracion_segundos: number;
  tiempo_inicio: string;
  tiempo_fin: string | null;
  notas_tocadas: number;
  notas_correctas: number;
  notas_incorrectas: number;
  precision_promedio: number;
  bpm_promedio: number;
  escalas_practicadas: string[];
  acordes_practicados: string[];
  canciones_intentadas: string[];
  afinacion_usada: string;
  tipo_practica: 'libre' | 'leccion' | 'cancion' | 'escala' | 'ejercicio';
  xp_ganado: number;
  logros_desbloqueados: string[];
  nivel_antes: number;
  nivel_despues: number;
  datos_sesion: Record<string, any>;
  created_at: string;
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

const XP_VALORES = {
  // Simulador
  sesion_completa: 50,
  nota_correcta: 1,
  precision_bonus: {
    70: 10,
    80: 25,
    90: 50,
    95: 100,
    100: 200
  },
  // Cursos/Tutoriales
  leccion_completada: 100,
  curso_completado: 500,
  tutorial_completado: 200,
  // Comunidad
  publicacion_creada: 25,
  like_recibido: 2,
  comentario_hecho: 5,
  // Logros
  logro_facil: 100,
  logro_medio: 300,
  logro_dificil: 800,
  logro_legendario: 1500,
  // Constancia
  racha_diaria: 50,
  racha_semanal: 200,
  racha_mensual: 1000
};

// =====================================================
// 🎮 CLASE PRINCIPAL DEL SERVICIO
// =====================================================

export class GamificacionService {
  
  // =====================================================
  // 📊 EXPERIENCIA Y NIVELES
  // =====================================================
  
  /**
   * 🎯 Obtener experiencia completa del usuario
   */
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
      
      // Si no existe, crear registro inicial
      if (!data) {
        return await this.inicializarExperienciaUsuario(usuarioId);
      }
      
      return data;
    } catch (error) {
      console.error('Error en obtenerExperienciaUsuario:', error);
      return null;
    }
  }
  
  /**
   * 🎯 Inicializar experiencia para nuevo usuario
   */
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
  
  /**
   * 🎯 Calcular XP necesario para nivel específico
   */
  static calcularXPParaNivel(nivel: number): number {
    let totalXP = 0;
    for (let i = 1; i < nivel; i++) {
      totalXP += Math.floor(CONFIGURACION_NIVELES.base_xp * Math.pow(CONFIGURACION_NIVELES.multiplicador, i - 1));
    }
    return totalXP;
  }
  
  /**
   * 🎯 Calcular nivel desde XP total
   */
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
  
  /**
   * 🎯 Agregar XP al usuario
   */
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
      
      // Si subió de nivel, crear notificación
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
  
  /**
   * 🏆 Obtener todos los logros del sistema
   */
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
      console.error('Error en obtenerLogrosSystem:', error);
      return [];
    }
  }
  
  /**
   * 🏆 Obtener logros del usuario
   */
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
  
  /**
   * 🏆 Verificar y otorgar logros
   */
  static async verificarLogros(usuarioId: string): Promise<LogroUsuario[]> {
    try {
      const logrosConseguidos: LogroUsuario[] = [];
      
      // Obtener logros del sistema y del usuario
      const [logrosSystem, logrosUsuario, estadisticas] = await Promise.all([
        this.obtenerLogrosSistema(),
        this.obtenerLogrosUsuario(usuarioId),
        this.obtenerEstadisticasUsuario(usuarioId)
      ]);
      
      if (!estadisticas) return [];
      
      // Verificar cada logro
      for (const logro of logrosSystem) {
        const logroUsuario = logrosUsuario.find(lu => lu.logro_id === logro.id);
        
        // Si ya lo tiene, continuar
        if (logroUsuario && logroUsuario.conseguido) continue;
        
        // Verificar condiciones
        const cumpleCondiciones = await this.verificarCondicionesLogro(logro, estadisticas);
        
        if (cumpleCondiciones) {
          const nuevoLogro = await this.otorgarLogro(usuarioId, logro.id);
          if (nuevoLogro) {
            logrosConseguidos.push(nuevoLogro);
          }
        }
      }
      
      return logrosConseguidos;
    } catch (error) {
      console.error('Error en verificarLogros:', error);
      return [];
    }
  }
  
  /**
   * 🏆 Verificar condiciones de un logro
   */
  static async verificarCondicionesLogro(logro: LogroSistema, estadisticas: EstadisticasUsuario): Promise<boolean> {
    try {
      const condiciones = logro.condiciones;
      
      // Verificar cada condición
      for (const [clave, valor] of Object.entries(condiciones)) {
        switch (clave) {
          case 'sesiones_completadas':
            if (estadisticas.total_sesiones < valor) return false;
            break;
          case 'racha_dias':
            if (estadisticas.racha_actual_dias < valor) return false;
            break;
          case 'precision_minima':
            if (estadisticas.precision_maxima < valor) return false;
            break;
          case 'cursos_completados':
            if (estadisticas.cursos_completados < valor) return false;
            break;
          case 'tutoriales_completados':
            if (estadisticas.tutoriales_completados < valor) return false;
            break;
          case 'nivel_minimo':
            const experiencia = await this.obtenerExperienciaUsuario(estadisticas.usuario_id);
            if (!experiencia || experiencia.nivel < valor) return false;
            break;
          case 'publicaciones_creadas':
            if (estadisticas.publicaciones_creadas < valor) return false;
            break;
          case 'likes_recibidos':
            if (estadisticas.likes_recibidos < valor) return false;
            break;
          default:
            console.warn(`Condición no reconocida: ${clave}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error verificando condiciones:', error);
      return false;
    }
  }
  
  /**
   * 🏆 Otorgar logro a usuario
   */
  static async otorgarLogro(usuarioId: string, logroId: string): Promise<LogroUsuario | null> {
    try {
      const { data, error } = await supabase
        .from('logros_usuario')
        .upsert({
          usuario_id: usuarioId,
          logro_id: logroId,
          conseguido: true,
          progreso_actual: 100,
          progreso_objetivo: 100,
          conseguido_en: new Date().toISOString(),
          ultimo_progreso: new Date().toISOString()
        })
        .select(`
          *,
          logros_sistema (*)
        `)
        .single();
      
      if (error) {
        console.error('Error otorgando logro:', error);
        return null;
      }
      
      // Obtener detalles del logro para recompensas
      const logro = data.logros_sistema as LogroSistema;
      
      // Agregar XP por logro
      if (logro.xp_recompensa > 0) {
        await this.agregarXP(usuarioId, logro.xp_recompensa, 'logros');
      }
      
      // Crear notificación
      await this.crearNotificacionGaming(usuarioId, {
        tipo: 'logro_conseguido',
        titulo: `¡Logro desbloqueado!`,
        mensaje: `Has conseguido: ${logro.nombre}`,
        icono: logro.icono,
        datos_notificacion: {
          logro_id: logro.id,
          nombre: logro.nombre,
          categoria: logro.categoria,
          xp_ganado: logro.xp_recompensa,
          monedas_ganadas: logro.monedas_recompensa
        },
        prioridad: logro.dificultad === 'legendario' ? 'critica' : 'alta',
        estilo_visual: 'logro',
        fecha_expiracion: null
      });
      
      return data;
    } catch (error) {
      console.error('Error en otorgarLogro:', error);
      return null;
    }
  }
  
  // =====================================================
  // 🏅 SISTEMA DE RANKING
  // =====================================================
  
  /**
   * 🏅 Obtener ranking global híbrido con TODOS los usuarios
   */
  static async obtenerRanking(tipo: string = 'general', limite: number = 1000): Promise<RankingGlobal[]> {
    try {
      // Usar la nueva función híbrida que muestra TODOS los usuarios
      const { data, error } = await supabase.rpc('obtener_ranking_hibrido_completo', {
        p_tipo_ranking: tipo,
        p_limite: limite
      });
      
      if (error) {
        console.error('Error obteniendo ranking híbrido:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log('No hay datos de ranking híbrido, usando método tradicional...');
        return await this.obtenerRankingTradicional(tipo, limite);
      }

      // Mapear los datos al formato RankingGlobal
      return data.map((item: any) => ({
        id: `${item.usuario_id}_${tipo}`,
        usuario_id: item.usuario_id,
        tipo_ranking: tipo,
        puntuacion: item.puntuacion || 0,
        posicion: item.posicion || 0,
        posicion_anterior: null,
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
        periodo_inicio: new Date().toISOString(),
        periodo_fin: null,
        temporada: null,
        activo: true,
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Relación con perfiles
        perfiles: {
          nombre: item.nombre || 'Usuario',
          apellido: item.apellido || '',
          url_foto_perfil: item.url_foto_perfil || null
        }
      }));
      
    } catch (error) {
      console.error('Error en obtenerRanking:', error);
      return await this.obtenerRankingTradicional(tipo, limite);
    }
  }

  /**
   * 🏆 Obtener ranking con paginación para scroll infinito
   */
  static async obtenerRankingPaginado(tipo: string = 'general', limite: number = 20, offset: number = 0): Promise<RankingGlobal[]> {
    try {
      console.log(`📊 Obteniendo ranking paginado: tipo=${tipo}, limite=${limite}, offset=${offset}`);
      
      // Usar la nueva función híbrida con paginación
      const { data, error } = await supabase.rpc('obtener_ranking_hibrido_paginado', {
        p_tipo_ranking: tipo,
        p_limite: limite,
        p_offset: offset
      });
      
      if (error) {
        console.error('Error obteniendo ranking paginado:', error);
        // Fallback a método tradicional con paginación
        return await this.obtenerRankingTradicionalPaginado(tipo, limite, offset);
      }
      
      if (!data || data.length === 0) {
        console.log('No hay datos de ranking paginado, usando método tradicional...');
        return await this.obtenerRankingTradicionalPaginado(tipo, limite, offset);
      }

      // Mapear los datos al formato RankingGlobal
      const resultado = data.map((item: any) => ({
        id: `${item.usuario_id}_${tipo}`,
        usuario_id: item.usuario_id,
        tipo_ranking: tipo,
        puntuacion: item.puntuacion || 0,
        posicion: item.posicion || 0,
        posicion_anterior: null,
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
          es_gaming: item.es_gaming || false,
          total_sesiones: item.total_sesiones || 0,
          tiempo_total_minutos: item.tiempo_total_minutos || 0,
          precision_promedio: item.precision_promedio || 0,
          racha_maxima: item.racha_maxima || 0
        },
        periodo_inicio: new Date().toISOString(),
        periodo_fin: null,
        temporada: null,
        activo: true,
        calculated_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Relación con perfiles
        perfiles: {
          nombre: item.nombre || 'Usuario',
          apellido: item.apellido || '',
          url_foto_perfil: item.url_foto_perfil || null
        }
      }));
      
      console.log(`✅ Ranking paginado obtenido: ${resultado.length} usuarios`);
      return resultado;
      
    } catch (error) {
      console.error('Error en obtenerRankingPaginado:', error);
      return await this.obtenerRankingTradicionalPaginado(tipo, limite, offset);
    }
  }

  /**
   * 🏅 Método de respaldo para ranking tradicional
   */
  static async obtenerRankingTradicional(tipo: string = 'general', limite: number = 50): Promise<RankingGlobal[]> {
    try {
      const query = supabase
        .from('ranking_global')
        .select(`
          *,
          perfiles (nombre, apellido, url_foto_perfil)
        `)
        .eq('tipo_ranking', tipo)
        .eq('activo', true)
        .order('posicion')
        .limit(limite);
        
      const { data, error } = await query;
      
      if (error) {
        console.error('Error obteniendo ranking tradicional:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error en obtenerRankingTradicional:', error);
      return [];
    }
  }

  /**
   * 🏅 Método de respaldo para ranking tradicional con paginación
   */
  static async obtenerRankingTradicionalPaginado(tipo: string = 'general', limite: number = 20, offset: number = 0): Promise<RankingGlobal[]> {
    try {
      console.log(`📊 Fallback: ranking tradicional paginado - tipo=${tipo}, limite=${limite}, offset=${offset}`);
      
      const query = supabase
        .from('ranking_global')
        .select(`
          *,
          perfiles (nombre, apellido, url_foto_perfil)
        `)
        .eq('tipo_ranking', tipo)
        .eq('activo', true)
        .order('posicion')
        .range(offset, offset + limite - 1);
        
      const { data, error } = await query;
      
      if (error) {
        console.error('Error obteniendo ranking tradicional paginado:', error);
        return [];
      }
      
      console.log(`✅ Fallback exitoso: ${data?.length || 0} usuarios obtenidos`);
      return data || [];
    } catch (error) {
      console.error('Error en obtenerRankingTradicionalPaginado:', error);
      return [];
    }
  }
  
  /**
   * 🏅 Obtener posición de usuario en ranking
   */
  static async obtenerPosicionUsuario(usuarioId: string, tipo: string = 'general'): Promise<RankingGlobal | null> {
    try {
      const { data, error } = await supabase
        .from('ranking_global')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('tipo_ranking', tipo)
        .eq('activo', true)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo posición:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error en obtenerPosicionUsuario:', error);
      return null;
    }
  }
  
  /**
   * 🏅 Actualizar ranking de usuario
   */
  static async actualizarRanking(usuarioId: string, tipo: string, puntuacion: number, metricas: Record<string, any> = {}): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ranking_global')
        .upsert({
          usuario_id: usuarioId,
          tipo_ranking: tipo,
          puntuacion,
          metricas,
          periodo_inicio: new Date().toISOString().split('T')[0],
          calculated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error actualizando ranking:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error en actualizarRanking:', error);
      return false;
    }
  }
  
  // =====================================================
  // 🎵 TRACKING DE SIMULADOR
  // =====================================================
  
  /**
   * 🎵 Registrar sesión del simulador
   */
  static async registrarSesionSimulador(datosSession: Omit<SesionSimulador, 'id' | 'created_at'>): Promise<SesionSimulador | null> {
    try {
      const { data, error } = await supabase
        .from('sesiones_simulador')
        .insert(datosSession)
        .select()
        .single();
      
      if (error) {
        console.error('Error registrando sesión:', error);
        return null;
      }
      
      // Procesar XP y logros después de la sesión
      await this.procesarPostSesion(datosSession.usuario_id, data);
      
      return data;
    } catch (error) {
      console.error('Error en registrarSesionSimulador:', error);
      return null;
    }
  }
  
  /**
   * 🎵 Procesar acciones post-sesión
   */
  static async procesarPostSesion(usuarioId: string, sesion: SesionSimulador): Promise<void> {
    try {
      // Calcular XP base de la sesión
      let xpGanado = XP_VALORES.sesion_completa;
      
      // Bonus por precisión
      if (sesion.precision_promedio >= 100) {
        xpGanado += XP_VALORES.precision_bonus[100];
      } else if (sesion.precision_promedio >= 95) {
        xpGanado += XP_VALORES.precision_bonus[95];
      } else if (sesion.precision_promedio >= 90) {
        xpGanado += XP_VALORES.precision_bonus[90];
      } else if (sesion.precision_promedio >= 80) {
        xpGanado += XP_VALORES.precision_bonus[80];
      } else if (sesion.precision_promedio >= 70) {
        xpGanado += XP_VALORES.precision_bonus[70];
      }
      
      // Bonus por notas correctas
      xpGanado += sesion.notas_correctas * XP_VALORES.nota_correcta;
      
      // Agregar XP
      await this.agregarXP(usuarioId, xpGanado, 'simulador');
      
      // Actualizar estadísticas
      await this.actualizarEstadisticasUsuario(usuarioId);
      
      // Verificar logros
      await this.verificarLogros(usuarioId);
      
      // Actualizar ranking
      await this.actualizarRankingSimulador(usuarioId);
      
    } catch (error) {
      console.error('Error en procesarPostSesion:', error);
    }
  }
  
  /**
   * 🎵 Actualizar ranking del simulador
   */
  static async actualizarRankingSimulador(usuarioId: string): Promise<void> {
    try {
      const estadisticas = await this.obtenerEstadisticasUsuario(usuarioId);
      if (!estadisticas) return;
      
      const puntuacion = Math.floor(
        (estadisticas.precision_promedio * 10) + 
        (estadisticas.total_sesiones * 5) + 
        (estadisticas.tiempo_total_minutos * 2)
      );
      
      const metricas = {
        precision_promedio: estadisticas.precision_promedio,
        total_sesiones: estadisticas.total_sesiones,
        tiempo_total_minutos: estadisticas.tiempo_total_minutos,
        notas_correctas: estadisticas.notas_correctas_totales
      };
      
      await this.actualizarRanking(usuarioId, 'simulador', puntuacion, metricas);
    } catch (error) {
      console.error('Error actualizando ranking simulador:', error);
    }
  }
  
  // =====================================================
  // 📊 ESTADÍSTICAS
  // =====================================================
  
  /**
   * 📊 Obtener estadísticas del usuario
   */
  static async obtenerEstadisticasUsuario(usuarioId: string): Promise<EstadisticasUsuario | null> {
    try {
      const { data, error } = await supabase
        .from('estadisticas_usuario')
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error obteniendo estadísticas:', error);
        return null;
      }
      
      // Si no existe, crear registro inicial
      if (!data) {
        return await this.inicializarEstadisticasUsuario(usuarioId);
      }
      
      return data;
    } catch (error) {
      console.error('Error en obtenerEstadisticasUsuario:', error);
      return null;
    }
  }
  
  /**
   * 📊 Inicializar estadísticas para nuevo usuario
   */
  static async inicializarEstadisticasUsuario(usuarioId: string): Promise<EstadisticasUsuario | null> {
    try {
      const { data, error } = await supabase
        .from('estadisticas_usuario')
        .insert({
          usuario_id: usuarioId,
          calculado_en: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error inicializando estadísticas:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error en inicializarEstadisticasUsuario:', error);
      return null;
    }
  }
  
  /**
   * 📊 Actualizar estadísticas del usuario
   */
  static async actualizarEstadisticasUsuario(usuarioId: string): Promise<boolean> {
    try {
      // Obtener datos de diferentes tablas
      const [sesiones, logros, publicaciones] = await Promise.all([
        this.obtenerSesionesUsuario(usuarioId),
        this.obtenerLogrosUsuario(usuarioId),
        this.obtenerPublicacionesUsuario(usuarioId)
      ]);
      
      // Calcular estadísticas
      const estadisticas = this.calcularEstadisticas(sesiones, logros, publicaciones);
      
      // Actualizar en base de datos
      const { error } = await supabase
        .from('estadisticas_usuario')
        .upsert({
          usuario_id: usuarioId,
          ...estadisticas,
          calculado_en: new Date().toISOString()
        });
      
      if (error) {
        console.error('Error actualizando estadísticas:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error en actualizarEstadisticasUsuario:', error);
      return false;
    }
  }
  
  /**
   * 📊 Calcular estadísticas a partir de datos
   */
  static calcularEstadisticas(sesiones: SesionSimulador[], logros: LogroUsuario[], publicaciones: any[]): Partial<EstadisticasUsuario> {
    const estadisticas: Partial<EstadisticasUsuario> = {};
    
    // Estadísticas de sesiones
    estadisticas.total_sesiones = sesiones.length;
    estadisticas.tiempo_total_minutos = sesiones.reduce((sum, s) => sum + s.duracion_minutos, 0);
    estadisticas.precision_maxima = Math.max(...sesiones.map(s => s.precision_promedio), 0);
    estadisticas.precision_promedio = sesiones.length > 0 ? 
      sesiones.reduce((sum, s) => sum + s.precision_promedio, 0) / sesiones.length : 0;
    estadisticas.notas_totales_tocadas = sesiones.reduce((sum, s) => sum + s.notas_tocadas, 0);
    estadisticas.notas_correctas_totales = sesiones.reduce((sum, s) => sum + s.notas_correctas, 0);
    
    if (sesiones.length > 0) {
      estadisticas.primer_sesion = sesiones[sesiones.length - 1].created_at;
      estadisticas.ultima_sesion = sesiones[0].created_at;
    }
    
    // Estadísticas de logros
    const logrosConseguidos = logros.filter(l => l.conseguido);
    estadisticas.logros_totales = logrosConseguidos.length;
    estadisticas.logros_faciles = logrosConseguidos.filter(l => l.logro_sistema?.dificultad === 'facil').length;
    estadisticas.logros_medios = logrosConseguidos.filter(l => l.logro_sistema?.dificultad === 'medio').length;
    estadisticas.logros_dificiles = logrosConseguidos.filter(l => l.logro_sistema?.dificultad === 'dificil').length;
    estadisticas.logros_legendarios = logrosConseguidos.filter(l => l.logro_sistema?.dificultad === 'legendario').length;
    
    // Estadísticas sociales
    estadisticas.publicaciones_creadas = publicaciones.length;
    estadisticas.likes_recibidos = publicaciones.reduce((sum, p) => sum + (p.likes || 0), 0);
    
    return estadisticas;
  }
  
  // =====================================================
  // 🔔 NOTIFICACIONES GAMING
  // =====================================================
  
  /**
   * 🔔 Crear notificación gaming
   */
  static async crearNotificacionGaming(usuarioId: string, notificacion: Omit<NotificacionGaming, 'id' | 'usuario_id' | 'leida' | 'mostrada' | 'accion_realizada' | 'leida_en' | 'mostrada_en' | 'created_at' | 'updated_at'>): Promise<NotificacionGaming | null> {
    try {
      const { data, error } = await supabase
        .from('notificaciones_gaming')
        .insert({
          usuario_id: usuarioId,
          ...notificacion,
          leida: false,
          mostrada: false,
          accion_realizada: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('Error creando notificación:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error en crearNotificacionGaming:', error);
      return null;
    }
  }
  
  /**
   * 🔔 Obtener notificaciones del usuario
   */
  static async obtenerNotificacionesUsuario(usuarioId: string, limite: number = 20): Promise<NotificacionGaming[]> {
    try {
      const { data, error } = await supabase
        .from('notificaciones_gaming')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false })
        .limit(limite);
      
      if (error) {
        console.error('Error obteniendo notificaciones:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error en obtenerNotificacionesUsuario:', error);
      return [];
    }
  }
  
  // =====================================================
  // 🔧 FUNCIONES AUXILIARES
  // =====================================================
  
  /**
   * 🔧 Obtener sesiones del usuario
   */
  static async obtenerSesionesUsuario(usuarioId: string): Promise<SesionSimulador[]> {
    try {
      const { data, error } = await supabase
        .from('sesiones_simulador')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error obteniendo sesiones:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error en obtenerSesionesUsuario:', error);
      return [];
    }
  }
  
  /**
   * 🔧 Obtener publicaciones del usuario
   */
  static async obtenerPublicacionesUsuario(usuarioId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('comunidad_publicaciones')
        .select('*')
        .eq('usuario_id', usuarioId);
      
      if (error) {
        console.error('Error obteniendo publicaciones:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error en obtenerPublicacionesUsuario:', error);
      return [];
    }
  }
  
  /**
   * 🔧 Procesar progreso de lección (integración con sistema existente)
   */
  static async procesarProgresoLeccion(usuarioId: string, leccionId: string, calificacion: number): Promise<void> {
    try {
      // Agregar XP por lección completada
      await this.agregarXP(usuarioId, XP_VALORES.leccion_completada, 'cursos');
      
      // Actualizar estadísticas
      await this.actualizarEstadisticasUsuario(usuarioId);
      
      // Verificar logros
      await this.verificarLogros(usuarioId);
      
      // Actualizar ranking de cursos
      await this.actualizarRankingCursos(usuarioId);
      
    } catch (error) {
      console.error('Error procesando progreso de lección:', error);
    }
  }
  
  /**
   * 🔧 Actualizar ranking de cursos
   */
  static async actualizarRankingCursos(usuarioId: string): Promise<void> {
    try {
      const estadisticas = await this.obtenerEstadisticasUsuario(usuarioId);
      if (!estadisticas) return;
      
      const puntuacion = (estadisticas.lecciones_completadas * 10) + 
                        (estadisticas.cursos_completados * 100) + 
                        (estadisticas.tutoriales_completados * 50);
      
      const metricas = {
        lecciones_completadas: estadisticas.lecciones_completadas,
        cursos_completados: estadisticas.cursos_completados,
        tutoriales_completados: estadisticas.tutoriales_completados
      };
      
      await this.actualizarRanking(usuarioId, 'cursos', puntuacion, metricas);
    } catch (error) {
      console.error('Error actualizando ranking cursos:', error);
    }
  }

  // =====================================================
  // 🔄 INTEGRACIÓN CON SISTEMA EXISTENTE
  // =====================================================

  /**
   * 🔄 Sincronizar datos reales con sistema gaming
   */
  static async sincronizarDatosReales(usuarioId: string): Promise<void> {
    try {
      // Obtener datos reales del usuario
      const datosReales = await this.obtenerDatosReales(usuarioId);
      
      if (!datosReales) {
        console.error('No se pudieron obtener datos reales del usuario');
        return;
      }

      // Calcular XP basado en actividades reales
      const xpCalculado = this.calcularXPDeActividades(datosReales);
      
      // Actualizar experiencia del usuario
      await this.actualizarExperienciaPorActividades(usuarioId, xpCalculado);
      
      // Actualizar estadísticas con datos reales
      await this.actualizarEstadisticasReales(usuarioId, datosReales);
      
      // Verificar logros basados en datos reales
      await this.verificarLogros(usuarioId);
      
      // Actualizar todos los rankings
      await this.actualizarTodosLosRankings(usuarioId);
      
    } catch (error) {
      console.error('Error sincronizando datos reales:', error);
    }
  }

  /**
   * 🔄 Obtener datos reales del usuario desde las tablas existentes
   */
  static async obtenerDatosReales(usuarioId: string): Promise<{
    publicaciones: number;
    comentarios: number;
    likes_recibidos: number;
    cursos_completados: number;
    tutoriales_completados: number;
    lecciones_completadas: number;
    tiempo_total_cursos: number;
    tiempo_total_tutoriales: number;
    progreso_promedio: number;
    dias_activos: number;
    racha_actual: number;
  } | null> {
    try {
      // Obtener publicaciones del usuario
      const { data: publicaciones, error: errorPublicaciones } = await supabase
        .from('comunidad_publicaciones')
        .select('id, fecha_creacion')
        .eq('usuario_id', usuarioId)
        .eq('estado', 'activo');

      if (errorPublicaciones) {
        console.error('Error obteniendo publicaciones:', errorPublicaciones);
        return null;
      }

      // Obtener comentarios del usuario
      const { data: comentarios, error: errorComentarios } = await supabase
        .from('comunidad_comentarios')
        .select('id, fecha_creacion')
        .eq('usuario_id', usuarioId);

      if (errorComentarios) {
        console.error('Error obteniendo comentarios:', errorComentarios);
        return null;
      }

      // Obtener likes recibidos por el usuario
      const { data: likesRecibidos, error: errorLikes } = await supabase
        .from('comunidad_publicaciones_likes')
        .select('id')
        .in('publicacion_id', publicaciones?.map((p: any) => p.id) || []);

      if (errorLikes) {
        console.error('Error obteniendo likes:', errorLikes);
        return null;
      }

      // Obtener inscripciones a cursos
      const { data: inscripcionesCursos, error: errorInscripciones } = await supabase
        .from('inscripciones')
        .select('id, progreso, completado, curso_id, tutorial_id, created_at, updated_at')
        .eq('usuario_id', usuarioId);

      if (errorInscripciones) {
        console.error('Error obteniendo inscripciones:', errorInscripciones);
        return null;
      }

      // Obtener progreso de lecciones
      const { data: progresoLecciones, error: errorProgreso } = await supabase
        .from('progreso_lecciones')
        .select('id, estado, porcentaje_completado, tiempo_total, calificacion, created_at, updated_at')
        .eq('usuario_id', usuarioId);

      if (errorProgreso) {
        console.error('Error obteniendo progreso lecciones:', errorProgreso);
        return null;
      }

      // Calcular métricas
      const cursosCompletados = inscripcionesCursos?.filter((i: any) => i.completado && i.curso_id) || [];
      const tutorialesCompletados = inscripcionesCursos?.filter((i: any) => i.completado && i.tutorial_id) || [];
      const leccionesCompletadas = progresoLecciones?.filter((p: any) => p.estado === 'completada') || [];
      
      const tiempoTotalCursos = progresoLecciones?.reduce((sum: number, p: any) => sum + (p.tiempo_total || 0), 0) || 0;
      const tiempoTotalTutoriales = tutorialesCompletados.length * 30; // Asumiendo 30 min promedio
      
      const progresoPromedio = inscripcionesCursos?.length > 0 ? 
        inscripcionesCursos.reduce((sum: number, i: any) => sum + (i.progreso || 0), 0) / inscripcionesCursos.length : 0;

      // Calcular días activos y racha
      const fechasActividad = [
        ...publicaciones?.map((p: any) => p.fecha_creacion) || [],
        ...comentarios?.map((c: any) => c.fecha_creacion) || [],
        ...progresoLecciones?.map((p: any) => p.updated_at) || []
      ].filter(Boolean);

      const diasUnicos = new Set(fechasActividad.map((f: string) => f.split('T')[0]));
      const diasActivos = diasUnicos.size;
      
      // Calcular racha actual (días consecutivos con actividad)
      const rachaActual = this.calcularRachaActual(Array.from(diasUnicos));

      return {
        publicaciones: publicaciones?.length || 0,
        comentarios: comentarios?.length || 0,
        likes_recibidos: likesRecibidos?.length || 0,
        cursos_completados: cursosCompletados.length,
        tutoriales_completados: tutorialesCompletados.length,
        lecciones_completadas: leccionesCompletadas.length,
        tiempo_total_cursos: tiempoTotalCursos,
        tiempo_total_tutoriales: tiempoTotalTutoriales,
        progreso_promedio: progresoPromedio,
        dias_activos: diasActivos,
        racha_actual: rachaActual
      };

    } catch (error) {
      console.error('Error en obtenerDatosReales:', error);
      return null;
    }
  }

  /**
   * 🔄 Calcular XP basado en actividades reales
   */
  static calcularXPDeActividades(datos: any): {
    xp_comunidad: number;
    xp_cursos: number;
    xp_total: number;
  } {
    const xp_comunidad = 
      (datos.publicaciones * 50) +     // 50 XP por publicación
      (datos.comentarios * 20) +      // 20 XP por comentario
      (datos.likes_recibidos * 5);    // 5 XP por like recibido

    const xp_cursos = 
      (datos.cursos_completados * 500) +      // 500 XP por curso completado
      (datos.tutoriales_completados * 200) + // 200 XP por tutorial completado
      (datos.lecciones_completadas * 100) +  // 100 XP por lección completada
      Math.floor(datos.tiempo_total_cursos / 10); // 1 XP por cada 10 minutos de estudio

    const xp_total = xp_comunidad + xp_cursos;

    return { xp_comunidad, xp_cursos, xp_total };
  }

  /**
   * 🔄 Actualizar experiencia del usuario por actividades
   */
  static async actualizarExperienciaPorActividades(usuarioId: string, xpCalculado: any): Promise<void> {
    try {
      const experienciaActual = await this.obtenerExperienciaUsuario(usuarioId);
      
      if (!experienciaActual) {
        await this.inicializarExperienciaUsuario(usuarioId);
        return;
      }

      // Calcular nuevo XP total
      const nuevoXpTotal = xpCalculado.xp_total;
      const datosNivel = this.calcularNivelDesdeXP(nuevoXpTotal);

      // Actualizar experiencia
      const { error } = await supabase
        .from('experiencia_usuario')
        .update({
          xp_total: nuevoXpTotal,
          xp_actual: datosNivel.xpActual,
          nivel: datosNivel.nivel,
          xp_siguiente_nivel: datosNivel.xpSiguienteNivel,
          xp_comunidad: xpCalculado.xp_comunidad,
          xp_cursos: xpCalculado.xp_cursos,
          ultima_sesion: new Date().toISOString()
        })
        .eq('usuario_id', usuarioId);

      if (error) {
        console.error('Error actualizando experiencia:', error);
      }

    } catch (error) {
      console.error('Error en actualizarExperienciaPorActividades:', error);
    }
  }

  /**
   * 🔄 Actualizar estadísticas con datos reales
   */
  static async actualizarEstadisticasReales(usuarioId: string, datosReales: any): Promise<void> {
    try {
      const estadisticasActuales = await this.obtenerEstadisticasUsuario(usuarioId);
      
      if (!estadisticasActuales) {
        await this.inicializarEstadisticasUsuario(usuarioId);
        return;
      }

      // Actualizar estadísticas con datos reales
      const { error } = await supabase
        .from('estadisticas_usuario')
        .update({
          cursos_completados: datosReales.cursos_completados,
          tutoriales_completados: datosReales.tutoriales_completados,
          lecciones_completadas: datosReales.lecciones_completadas,
          publicaciones_creadas: datosReales.publicaciones,
          likes_recibidos: datosReales.likes_recibidos,
          comentarios_hechos: datosReales.comentarios,
          tiempo_total_minutos: datosReales.tiempo_total_cursos + datosReales.tiempo_total_tutoriales,
          precision_promedio: datosReales.progreso_promedio,
          dias_activos_total: datosReales.dias_activos,
          racha_actual_dias: datosReales.racha_actual,
          calculado_en: new Date().toISOString()
        })
        .eq('usuario_id', usuarioId);

      if (error) {
        console.error('Error actualizando estadísticas:', error);
      }

    } catch (error) {
      console.error('Error en actualizarEstadisticasReales:', error);
    }
  }

  /**
   * 🔄 Calcular racha actual de días consecutivos
   */
  static calcularRachaActual(diasUnicos: string[]): number {
    if (diasUnicos.length === 0) return 0;
    
    const diasOrdenados = diasUnicos.sort().reverse(); // Más reciente primero
    const hoy = new Date().toISOString().split('T')[0];
    
    let racha = 0;
    let fechaActual = new Date(hoy);
    
    for (const dia of diasOrdenados) {
      const fechaDia = new Date(dia);
      const diferenciaDias = Math.floor((fechaActual.getTime() - fechaDia.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diferenciaDias === racha) {
        racha++;
        fechaActual = fechaDia;
      } else if (diferenciaDias > racha) {
        break;
      }
    }
    
    return racha;
  }

  /**
   * 🔄 Actualizar todos los rankings del usuario
   */
  static async actualizarTodosLosRankings(usuarioId: string): Promise<void> {
    try {
      const estadisticas = await this.obtenerEstadisticasUsuario(usuarioId);
      if (!estadisticas) return;

      // Obtener experiencia para el nivel
      const experiencia = await this.obtenerExperienciaUsuario(usuarioId);
      const nivel = experiencia?.nivel || 1;

      // Actualizar ranking general
      const puntuacionGeneral = 
        (estadisticas.cursos_completados * 100) + 
        (estadisticas.tutoriales_completados * 50) + 
        (estadisticas.publicaciones_creadas * 25) + 
        (estadisticas.likes_recibidos * 5) + 
        (estadisticas.comentarios_hechos * 10);

      await this.actualizarRanking(usuarioId, 'general', puntuacionGeneral, {
        cursos_completados: estadisticas.cursos_completados,
        tutoriales_completados: estadisticas.tutoriales_completados,
        publicaciones_creadas: estadisticas.publicaciones_creadas,
        likes_recibidos: estadisticas.likes_recibidos,
        comentarios_hechos: estadisticas.comentarios_hechos,
        nivel: nivel,
        precision_promedio: estadisticas.precision_promedio || 0,
        total_sesiones: estadisticas.total_sesiones || 0,
        tiempo_total_minutos: estadisticas.tiempo_total_minutos || 0,
        logros_conseguidos: estadisticas.logros_totales || 0,
        racha_maxima: estadisticas.racha_maxima_dias || 0
      });

      // Actualizar ranking de cursos
      await this.actualizarRankingCursos(usuarioId);

      // Actualizar ranking de comunidad
      const puntuacionComunidad = 
        (estadisticas.publicaciones_creadas * 50) + 
        (estadisticas.likes_recibidos * 10) + 
        (estadisticas.comentarios_hechos * 20);

      await this.actualizarRanking(usuarioId, 'comunidad', puntuacionComunidad, {
        publicaciones_creadas: estadisticas.publicaciones_creadas,
        likes_recibidos: estadisticas.likes_recibidos,
        comentarios_hechos: estadisticas.comentarios_hechos
      });

      // Actualizar ranking de constancia
      const puntuacionConstancia = 
        (estadisticas.racha_actual_dias * 20) + 
        (estadisticas.dias_activos_total * 5);

      await this.actualizarRanking(usuarioId, 'constancia', puntuacionConstancia, {
        racha_actual_dias: estadisticas.racha_actual_dias,
        dias_activos_total: estadisticas.dias_activos_total,
        racha_maxima: estadisticas.racha_maxima_dias
      });

    } catch (error) {
      console.error('Error actualizando rankings:', error);
    }
  }

  /**
   * 🔄 Procesar actividad del usuario (llamar desde triggers)
   */
  static async procesarActividad(usuarioId: string, tipoActividad: string, datosActividad: any = {}): Promise<void> {
    try {
      // Sincronizar datos reales
      await this.sincronizarDatosReales(usuarioId);
      
      // Crear notificación según el tipo de actividad
      await this.crearNotificacionActividad(usuarioId, tipoActividad, datosActividad);
      
    } catch (error) {
      console.error('Error procesando actividad:', error);
    }
  }

  /**
   * 🔄 Crear notificación por actividad
   */
  static async crearNotificacionActividad(usuarioId: string, tipo: string, datos: any = {}): Promise<void> {
    try {
      let notificacion: any = {};

      switch (tipo) {
        case 'curso_completado':
          notificacion = {
            tipo: 'meta_alcanzada',
            titulo: '🎓 ¡Curso Completado!',
            mensaje: `¡Felicidades! Has completado el curso "${datos.titulo || 'sin título'}"`,
            icono: '🎓',
            prioridad: 'alta',
            estilo_visual: 'celebracion'
          };
          break;

        case 'tutorial_completado':
          notificacion = {
            tipo: 'meta_alcanzada',
            titulo: '📚 ¡Tutorial Completado!',
            mensaje: `¡Excelente! Has completado el tutorial "${datos.titulo || 'sin título'}"`,
            icono: '📚',
            prioridad: 'normal',
            estilo_visual: 'logro'
          };
          break;

        case 'leccion_completada':
          notificacion = {
            tipo: 'meta_alcanzada',
            titulo: '✅ ¡Lección Completada!',
            mensaje: `¡Muy bien! Has completado una lección`,
            icono: '✅',
            prioridad: 'normal',
            estilo_visual: 'logro'
          };
          break;

        case 'publicacion_creada':
          notificacion = {
            tipo: 'evento_especial',
            titulo: '📝 Nueva Publicación',
            mensaje: '¡Has creado una nueva publicación en la comunidad!',
            icono: '📝',
            prioridad: 'normal',
            estilo_visual: 'normal'
          };
          break;

        case 'like_recibido':
          notificacion = {
            tipo: 'evento_especial',
            titulo: '❤️ ¡Like Recibido!',
            mensaje: 'Tu publicación ha recibido un like',
            icono: '❤️',
            prioridad: 'baja',
            estilo_visual: 'normal'
          };
          break;

        case 'comentario_creado':
          notificacion = {
            tipo: 'evento_especial',
            titulo: '💬 Nuevo Comentario',
            mensaje: '¡Has creado un nuevo comentario!',
            icono: '💬',
            prioridad: 'baja',
            estilo_visual: 'normal'
          };
          break;

        default:
          return;
      }

      notificacion.datos_notificacion = datos;
      notificacion.fecha_expiracion = null;

      await this.crearNotificacionGaming(usuarioId, notificacion);

    } catch (error) {
      console.error('Error creando notificación de actividad:', error);
    }
  }

  // =====================================================
  // 🔄 PROCESAMIENTO DE ACTIVIDADES PENDIENTES
  // =====================================================

  /**
   * 🔄 Obtener actividades pendientes del usuario
   */
  static async obtenerActividadesPendientes(usuarioId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('obtener_actividades_pendientes', {
        p_usuario_id: usuarioId
      });

      if (error) {
        console.error('Error obteniendo actividades pendientes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error en obtenerActividadesPendientes:', error);
      return [];
    }
  }

  /**
   * 🔄 Marcar actividad como procesada
   */
  static async marcarActividadProcesada(actividadId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('marcar_actividad_procesada', {
        p_actividad_id: actividadId
      });

      if (error) {
        console.error('Error marcando actividad como procesada:', error);
      }
    } catch (error) {
      console.error('Error en marcarActividadProcesada:', error);
    }
  }

  /**
   * 🔄 Procesar todas las actividades pendientes del usuario
   */
  static async procesarActividadesPendientes(usuarioId: string): Promise<void> {
    try {
      const actividadesPendientes = await this.obtenerActividadesPendientes(usuarioId);

      if (actividadesPendientes.length === 0) {
        return;
      }

      console.log(`Procesando ${actividadesPendientes.length} actividades pendientes...`);

      // Procesar cada actividad
      for (const actividad of actividadesPendientes) {
        try {
          // Procesar la actividad
          await this.procesarActividad(usuarioId, actividad.tipo_actividad, actividad.datos_actividad);

          // Marcar como procesada
          await this.marcarActividadProcesada(actividad.id);

        } catch (error) {
          console.error(`Error procesando actividad ${actividad.id}:`, error);
        }
      }

      console.log('Actividades pendientes procesadas exitosamente');

    } catch (error) {
      console.error('Error en procesarActividadesPendientes:', error);
    }
  }

  /**
   * 🔄 Inicializar procesamiento automático (llamar en onMount)
   */
  static async inicializarProcesamientoAutomatico(usuarioId: string): Promise<void> {
    try {
      // Procesar actividades pendientes al iniciar
      await this.procesarActividadesPendientes(usuarioId);

      // Sincronizar datos reales
      await this.sincronizarDatosReales(usuarioId);

    } catch (error) {
      console.error('Error inicializando procesamiento automático:', error);
    }
  }

  /**
   * 🔄 Forzar sincronización completa (usar con botón manual)
   */
  static async forzarSincronizacionCompleta(usuarioId: string): Promise<void> {
    try {
      console.log('Iniciando sincronización completa...');

      // 1. Procesar actividades pendientes
      await this.procesarActividadesPendientes(usuarioId);

      // 2. Sincronizar datos reales
      await this.sincronizarDatosReales(usuarioId);

      // 3. Recalcular estadísticas
      await this.actualizarEstadisticasUsuario(usuarioId);

      // 4. Verificar logros
      await this.verificarLogros(usuarioId);

      console.log('Sincronización completa finalizada');

    } catch (error) {
      console.error('Error en forzarSincronizacionCompleta:', error);
    }
  }

  // =====================================================
  // 🏆 LOGROS BASADOS EN PROGRESO REAL
  // =====================================================

  /**
   * 🏆 Verificar logros específicos basados en datos reales
   */
  static async verificarLogrosProgresoReal(usuarioId: string): Promise<LogroUsuario[]> {
    try {
      const datosReales = await this.obtenerDatosReales(usuarioId);
      const estadisticas = await this.obtenerEstadisticasUsuario(usuarioId);
      
      if (!datosReales || !estadisticas) {
        console.error('No se pudieron obtener datos para verificar logros');
        return [];
      }

      const logrosObtenidos: LogroUsuario[] = [];

      // Verificar logros de cursos
      const logrosCursos = await this.verificarLogrosCursos(usuarioId, datosReales);
      logrosObtenidos.push(...logrosCursos);

      // Verificar logros de tutoriales
      const logrosTutoriales = await this.verificarLogrosTutoriales(usuarioId, datosReales);
      logrosObtenidos.push(...logrosTutoriales);

      // Verificar logros de comunidad
      const logrosComunidad = await this.verificarLogrosComunidad(usuarioId, datosReales);
      logrosObtenidos.push(...logrosComunidad);

      // Verificar logros de constancia
      const logrosConstancia = await this.verificarLogrosConstancia(usuarioId, datosReales);
      logrosObtenidos.push(...logrosConstancia);

      return logrosObtenidos;

    } catch (error) {
      console.error('Error verificando logros de progreso real:', error);
      return [];
    }
  }

  /**
   * 🏆 Verificar logros específicos de cursos
   */
  static async verificarLogrosCursos(usuarioId: string, datosReales: any): Promise<LogroUsuario[]> {
    const logrosObtenidos: LogroUsuario[] = [];

    try {
      // Logro: Primer curso completado
      if (datosReales.cursos_completados >= 1) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'primer_curso_completado');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 3 cursos completados
      if (datosReales.cursos_completados >= 3) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'tres_cursos_completados');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 5 cursos completados
      if (datosReales.cursos_completados >= 5) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'cinco_cursos_completados');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 10 cursos completados
      if (datosReales.cursos_completados >= 10) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'diez_cursos_completados');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Estudiante dedicado (más de 10 horas de estudio)
      if (datosReales.tiempo_total_cursos >= 600) { // 10 horas = 600 minutos
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'estudiante_dedicado');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Maratonista del conocimiento (más de 50 horas)
      if (datosReales.tiempo_total_cursos >= 3000) { // 50 horas = 3000 minutos
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'maratonista_conocimiento');
        if (logro) logrosObtenidos.push(logro);
      }

    } catch (error) {
      console.error('Error verificando logros de cursos:', error);
    }

    return logrosObtenidos;
  }

  /**
   * 🏆 Verificar logros específicos de tutoriales
   */
  static async verificarLogrosTutoriales(usuarioId: string, datosReales: any): Promise<LogroUsuario[]> {
    const logrosObtenidos: LogroUsuario[] = [];

    try {
      // Logro: Primer tutorial completado
      if (datosReales.tutoriales_completados >= 1) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'primer_tutorial_completado');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 5 tutoriales completados
      if (datosReales.tutoriales_completados >= 5) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'cinco_tutoriales_completados');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 10 tutoriales completados
      if (datosReales.tutoriales_completados >= 10) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'diez_tutoriales_completados');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 25 tutoriales completados
      if (datosReales.tutoriales_completados >= 25) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'veinticinco_tutoriales_completados');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Maestro del acordeón (50 tutoriales)
      if (datosReales.tutoriales_completados >= 50) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'maestro_acordeon');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Progreso excelente (promedio alto)
      if (datosReales.progreso_promedio >= 90) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'progreso_excelente');
        if (logro) logrosObtenidos.push(logro);
      }

    } catch (error) {
      console.error('Error verificando logros de tutoriales:', error);
    }

    return logrosObtenidos;
  }

  /**
   * 🏆 Verificar logros específicos de comunidad
   */
  static async verificarLogrosComunidad(usuarioId: string, datosReales: any): Promise<LogroUsuario[]> {
    const logrosObtenidos: LogroUsuario[] = [];

    try {
      // Logro: Primera publicación
      if (datosReales.publicaciones >= 1) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'primera_publicacion');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 5 publicaciones
      if (datosReales.publicaciones >= 5) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'cinco_publicaciones');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: 10 publicaciones
      if (datosReales.publicaciones >= 10) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'diez_publicaciones');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Comentarista activo (20 comentarios)
      if (datosReales.comentarios >= 20) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'comentarista_activo');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Popular (50 likes recibidos)
      if (datosReales.likes_recibidos >= 50) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'popular');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Influencer (100 likes recibidos)
      if (datosReales.likes_recibidos >= 100) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'influencer');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Miembro activo (combinación de actividades)
      const actividadTotal = datosReales.publicaciones + datosReales.comentarios + Math.floor(datosReales.likes_recibidos / 10);
      if (actividadTotal >= 50) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'miembro_activo');
        if (logro) logrosObtenidos.push(logro);
      }

    } catch (error) {
      console.error('Error verificando logros de comunidad:', error);
    }

    return logrosObtenidos;
  }

  /**
   * 🏆 Verificar logros específicos de constancia
   */
  static async verificarLogrosConstancia(usuarioId: string, datosReales: any): Promise<LogroUsuario[]> {
    const logrosObtenidos: LogroUsuario[] = [];

    try {
      // Logro: Racha de 3 días
      if (datosReales.racha_actual >= 3) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'racha_tres_dias');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Racha de 7 días
      if (datosReales.racha_actual >= 7) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'racha_siete_dias');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Racha de 30 días
      if (datosReales.racha_actual >= 30) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'racha_treinta_dias');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Miembro veterano (30 días activos)
      if (datosReales.dias_activos >= 30) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'miembro_veterano');
        if (logro) logrosObtenidos.push(logro);
      }

      // Logro: Miembro legendario (100 días activos)
      if (datosReales.dias_activos >= 100) {
        const logro = await this.otorgarLogroSiNoTiene(usuarioId, 'miembro_legendario');
        if (logro) logrosObtenidos.push(logro);
      }

    } catch (error) {
      console.error('Error verificando logros de constancia:', error);
    }

    return logrosObtenidos;
  }

  /**
   * 🏆 Otorgar logro solo si el usuario no lo tiene
   */
  static async otorgarLogroSiNoTiene(usuarioId: string, logroId: string): Promise<LogroUsuario | null> {
    try {
      // Verificar si el usuario ya tiene el logro
      const { data: logroExistente, error } = await supabase
        .from('logros_usuario')
        .select('id')
        .eq('usuario_id', usuarioId)
        .eq('logro_id', logroId)
        .eq('conseguido', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = No rows returned
        console.error('Error verificando logro existente:', error);
        return null;
      }

      if (logroExistente) {
        // El usuario ya tiene el logro
        return null;
      }

      // Otorgar el logro
      return await this.otorgarLogro(usuarioId, logroId);

    } catch (error) {
      console.error('Error en otorgarLogroSiNoTiene:', error);
      return null;
    }
  }

  /**
   * 🏆 Procesar evento específico de progreso
   */
  static async procesarEventoProgreso(usuarioId: string, tipoEvento: string, datos: any = {}): Promise<void> {
    try {
      // Sincronizar datos primero
      await this.sincronizarDatosReales(usuarioId);

      // Verificar logros específicos del evento
      await this.verificarLogrosProgresoReal(usuarioId);

      // Crear notificación específica
      await this.crearNotificacionProgreso(usuarioId, tipoEvento, datos);

    } catch (error) {
      console.error('Error procesando evento de progreso:', error);
    }
  }

  /**
   * 🏆 Crear notificación de progreso
   */
  static async crearNotificacionProgreso(usuarioId: string, tipoEvento: string, datos: any = {}): Promise<void> {
    try {
      let notificacion: any = {};

      switch (tipoEvento) {
        case 'curso_completado':
          notificacion = {
            tipo: 'meta_alcanzada',
            titulo: '🎓 ¡Curso Completado!',
            mensaje: `¡Felicidades! Has completado el curso "${datos.titulo || 'sin título'}". ¡Sigue así!`,
            icono: '🎓',
            prioridad: 'alta',
            estilo_visual: 'celebracion'
          };
          break;

        case 'tutorial_completado':
          notificacion = {
            tipo: 'meta_alcanzada',
            titulo: '📚 ¡Tutorial Completado!',
            mensaje: `¡Excelente trabajo! Has completado el tutorial "${datos.titulo || 'sin título'}"`,
            icono: '📚',
            prioridad: 'normal',
            estilo_visual: 'logro'
          };
          break;

        case 'racha_extendida':
          notificacion = {
            tipo: 'evento_especial',
            titulo: '🔥 ¡Racha Extendida!',
            mensaje: `¡Increíble! Llevas ${datos.racha || 0} días consecutivos activo`,
            icono: '🔥',
            prioridad: 'alta',
            estilo_visual: 'celebracion'
          };
          break;

        case 'nivel_subido':
          notificacion = {
            tipo: 'subida_nivel',
            titulo: '⬆️ ¡Nivel Subido!',
            mensaje: `¡Fantástico! Has alcanzado el nivel ${datos.nuevoNivel || 0}`,
            icono: '⬆️',
            prioridad: 'alta',
            estilo_visual: 'celebracion'
          };
          break;

        default:
          return;
      }

      notificacion.datos_notificacion = datos;
      notificacion.fecha_expiracion = null;

      await this.crearNotificacionGaming(usuarioId, notificacion);

    } catch (error) {
      console.error('Error creando notificación de progreso:', error);
    }
  }
}

// =====================================================
// 📤 EXPORTACIONES
// =====================================================

export default GamificacionService;

// Exportar configuraciones
export { XP_VALORES, CONFIGURACION_NIVELES }; 