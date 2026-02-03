/**
 * 🎵 SIMULADOR DE ACORDEÓN GAMIFICADO - SERVICIO
 * =====================================================
 * Servicio completo para el simulador de acordeón
 * Integración con sistema XP y gamificación existente
 * =====================================================
 */

import { supabase } from '../supabase/clienteSupabase';
import { GamificacionService } from './gamificacionService';

// Tipos de datos
export interface SesionSimuladorAcordeon {
  id: string;
  usuario_id: string;
  duracion_minutos: number;
  tipo_sesion: 'practica_libre' | 'leccion' | 'desafio' | 'cancion' | 'evaluacion';
  notas_tocadas: number;
  notas_correctas: number;
  precision_promedio: number;
  cambios_fuelle: number;
  acordes_tocados: number;
  errores_timing: number;
  xp_ganado: number;
  monedas_ganadas: number;
  datos_sesion: any;
}

export interface LeccionAcordeon {
  id: string;
  titulo: string;
  descripcion: string;
  nivel_dificultad: 'principiante' | 'intermedio' | 'avanzado';
  categoria: 'fundamentos' | 'ritmo' | 'melodia' | 'acordes' | 'vallenato' | 'tecnica';
  orden_leccion: number;
  objetivos: string[];
  instrucciones: string;
  ejercicios: any[];
  xp_completar: number;
  monedas_completar: number;
  activa: boolean;
}

export interface CancionVallenata {
  id: string;
  titulo: string;
  artista: string;
  aire_vallenato: 'son' | 'paseo' | 'merengue' | 'puya';
  tonalidad: string;
  dificultad: 'principiante' | 'intermedio' | 'avanzado' | 'experto';
  tempo_bpm: number;
  partes: any[];
  puntos_completar: number;
  xp_dominar: number;
  rating_promedio: number;
  region_origen: string;
}

export interface DesafioDiario {
  id: string;
  titulo: string;
  descripcion: string;
  tipo_desafio: 'calentamiento' | 'precision' | 'ritmo' | 'velocidad' | 'memoria' | 'creatividad';
  dificultad: 'facil' | 'medio' | 'dificil';
  duracion_minutos: number;
  objetivo_principal: string;
  metricas_exito: any;
  xp_completar: number;
  monedas_completar: number;
  fecha_disponible: string;
}

export interface EstadisticasAcordeon {
  total_sesiones: number;
  tiempo_total_minutos: number;
  precision_promedio: number;
  mejor_precision: number;
  lecciones_completadas: number;
  canciones_dominadas: number;
  desafios_completados: number;
  racha_actual_dias: number;
  racha_maxima_dias: number;
}

export class SimuladorAcordeonService {
  
  /**
   * 🎯 Iniciar nueva sesión de práctica
   */
  static async iniciarSesion(usuarioId: string, tipoSesion: string, configuracion: any = {}): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('sesiones_simulador_acordeon')
        .insert({
          usuario_id: usuarioId,
          tipo_sesion: tipoSesion,
          duracion_minutos: 0,
          notas_tocadas: 0,
          notas_correctas: 0,
          precision_promedio: 0,
          datos_sesion: configuracion
        })
        .select()
        .single();
      
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error iniciando sesión:', error);
      throw error;
    }
  }
  
  /**
   * 🎯 Finalizar sesión y calcular recompensas
   */
  static async finalizarSesion(
    sesionId: string,
    datosFinales: {
      duracion_minutos: number;
      notas_tocadas: number;
      notas_correctas: number;
      cambios_fuelle: number;
      acordes_tocados: number;
      errores_timing: number;
      datos_sesion: any;
    }
  ): Promise<{ xp_ganado: number; monedas_ganadas: number; logros_nuevos: any[] }> {
    try {
      const precision = datosFinales.notas_tocadas > 0 
        ? (datosFinales.notas_correctas / datosFinales.notas_tocadas) * 100 
        : 0;
      
      const xpBase = Math.floor(datosFinales.duracion_minutos * 10);
      const xpPrecision = Math.floor(precision * 2);
      const xpNotas = datosFinales.notas_correctas;
      const xpTotal = xpBase + xpPrecision + xpNotas;
      
      const monedasTotal = Math.floor(xpTotal * 0.5);
      
      const { error: updateError } = await supabase
        .from('sesiones_simulador_acordeon')
        .update({
          duracion_minutos: datosFinales.duracion_minutos,
          notas_tocadas: datosFinales.notas_tocadas,
          notas_correctas: datosFinales.notas_correctas,
          precision_promedio: precision,
          cambios_fuelle: datosFinales.cambios_fuelle,
          acordes_tocados: datosFinales.acordes_tocados,
          errores_timing: datosFinales.errores_timing,
          xp_ganado: xpTotal,
          monedas_ganadas: monedasTotal,
          datos_sesion: datosFinales.datos_sesion
        })
        .eq('id', sesionId);
      
      if (updateError) throw updateError;
      
      const { data: sesion, error: sesionError } = await supabase
        .from('sesiones_simulador_acordeon')
        .select('usuario_id')
        .eq('id', sesionId)
        .single();
      
      if (sesionError) throw sesionError;
      
      await GamificacionService.agregarXP(sesion.usuario_id, xpTotal, 'simulador');
      await this.actualizarEstadisticas(sesion.usuario_id);
      
      const logrosNuevos = await this.verificarLogrosAcordeon(sesion.usuario_id);
      
      return {
        xp_ganado: xpTotal,
        monedas_ganadas: monedasTotal,
        logros_nuevos: logrosNuevos
      };
      
    } catch (error) {
      console.error('Error finalizando sesión:', error);
      throw error;
    }
  }
  
  /**
   * 📚 Obtener lecciones disponibles
   */
  static async obtenerLecciones(nivelDificultad?: string): Promise<LeccionAcordeon[]> {
    try {
      let query = supabase
        .from('lecciones_acordeon')
        .select('*')
        .eq('activa', true)
        .order('orden_leccion');
      
      if (nivelDificultad) {
        query = query.eq('nivel_dificultad', nivelDificultad);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo lecciones:', error);
      throw error;
    }
  }
  
  /**
   * 📈 Obtener progreso del usuario en lecciones
   */
  static async obtenerProgresoLecciones(usuarioId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('progreso_lecciones_acordeon')
        .select(`
          *,
          lecciones_acordeon (
            titulo,
            descripcion,
            nivel_dificultad
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo progreso lecciones:', error);
      throw error;
    }
  }
  
  /**
   * ✅ Completar lección
   */
  static async completarLeccion(usuarioId: string, leccionId: string, metricas: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('progreso_lecciones_acordeon')
        .upsert({
          usuario_id: usuarioId,
          leccion_id: leccionId,
          estado: 'completada',
          porcentaje_completado: 100,
          precision_obtenida: metricas.precision || 0,
          tiempo_completado: metricas.duracion || 0,
          fecha_completado: new Date().toISOString()
        });
      
      if (error) throw error;
      
      const { data: leccion } = await supabase
        .from('lecciones_acordeon')
        .select('xp_completar, monedas_completar')
        .eq('id', leccionId)
        .single();
      
      if (leccion) {
        await GamificacionService.agregarXP(usuarioId, leccion.xp_completar, 'simulador');
      }
      
      await this.actualizarEstadisticas(usuarioId);
    } catch (error) {
      console.error('Error completando lección:', error);
      throw error;
    }
  }
  
  /**
   * 🎵 Obtener canciones vallenatas
   */
  static async obtenerCanciones(filtros: any = {}): Promise<CancionVallenata[]> {
    try {
      let query = supabase
        .from('canciones_vallenatas')
        .select('*')
        .order('rating_promedio', { ascending: false });
      
      if (filtros.dificultad) {
        query = query.eq('dificultad', filtros.dificultad);
      }
      
      if (filtros.aire_vallenato) {
        query = query.eq('aire_vallenato', filtros.aire_vallenato);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo canciones:', error);
      throw error;
    }
  }
  
  /**
   * 📈 Obtener progreso en canciones
   */
  static async obtenerProgresoCanciones(usuarioId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('progreso_canciones_vallenatas')
        .select(`
          *,
          canciones_vallenatas (
            titulo,
            artista,
            dificultad
          )
        `)
        .eq('usuario_id', usuarioId)
        .order('fecha_inicio', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo progreso canciones:', error);
      throw error;
    }
  }
  
  /**
   * ⚡ Obtener desafíos diarios disponibles
   */
  static async obtenerDesafiosDisponibles(): Promise<DesafioDiario[]> {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('desafios_diarios')
        .select('*')
        .eq('fecha_disponible', hoy)
        .order('dificultad');
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo desafíos:', error);
      throw error;
    }
  }
  
  /**
   * ✅ Completar desafío diario
   */
  static async completarDesafio(usuarioId: string, desafioId: string, resultados: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('progreso_desafios_diarios')
        .insert({
          usuario_id: usuarioId,
          desafio_id: desafioId,
          estado: 'completado',
          precision_obtenida: resultados.precision || 0,
          tiempo_completado: resultados.tiempo || 0,
          errores_cometidos: resultados.errores || 0,
          puntuacion_final: resultados.puntuacion || 0
        });
      
      if (error) throw error;
      
      const { data: desafio } = await supabase
        .from('desafios_diarios')
        .select('xp_completar, monedas_completar')
        .eq('id', desafioId)
        .single();
      
      if (desafio) {
        await GamificacionService.agregarXP(usuarioId, desafio.xp_completar, 'simulador');
      }
      
      await this.actualizarEstadisticas(usuarioId);
    } catch (error) {
      console.error('Error completando desafío:', error);
      throw error;
    }
  }
  
  /**
   * 📊 Obtener estadísticas del usuario
   */
  static async obtenerEstadisticas(usuarioId: string): Promise<EstadisticasAcordeon | null> {
    try {
      const { data, error } = await supabase
        .from('estadisticas_acordeon')
        .select('*')
        .eq('usuario_id', usuarioId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  }
  
  /**
   * 🔄 Actualizar estadísticas del usuario
   */
  static async actualizarEstadisticas(usuarioId: string): Promise<void> {
    try {
      const [sesiones, lecciones, canciones, desafios] = await Promise.all([
        supabase
          .from('sesiones_simulador_acordeon')
          .select('duracion_minutos, precision_promedio')
          .eq('usuario_id', usuarioId),
        supabase
          .from('progreso_lecciones_acordeon')
          .select('*')
          .eq('usuario_id', usuarioId)
          .eq('estado', 'completada'),
        supabase
          .from('progreso_canciones_vallenatas')
          .select('*')
          .eq('usuario_id', usuarioId)
          .eq('estado', 'dominada'),
        supabase
          .from('progreso_desafios_diarios')
          .select('*')
          .eq('usuario_id', usuarioId)
          .eq('estado', 'completado')
      ]);
      
      const totalSesiones = sesiones.data?.length || 0;
      const tiempoTotal = sesiones.data?.reduce((sum: number, s: any) => sum + s.duracion_minutos, 0) || 0;
      const precisionPromedio = sesiones.data?.length > 0 
        ? sesiones.data.reduce((sum: number, s: any) => sum + s.precision_promedio, 0) / sesiones.data.length 
        : 0;
      const mejorPrecision = sesiones.data?.length > 0 
        ? Math.max(...sesiones.data.map((s: any) => s.precision_promedio)) 
        : 0;
      
      const estadisticas = {
        usuario_id: usuarioId,
        total_sesiones: totalSesiones,
        tiempo_total_minutos: tiempoTotal,
        precision_promedio: precisionPromedio,
        mejor_precision: mejorPrecision,
        lecciones_completadas: lecciones.data?.length || 0,
        canciones_dominadas: canciones.data?.length || 0,
        desafios_completados: desafios.data?.length || 0,
        racha_actual_dias: 0,
        racha_maxima_dias: 0
      };
      
      await supabase
        .from('estadisticas_acordeon')
        .upsert(estadisticas);
        
    } catch (error) {
      console.error('Error actualizando estadísticas:', error);
      throw error;
    }
  }
  
  /**
   * 🏆 Verificar logros del acordeón
   */
  static async verificarLogrosAcordeon(usuarioId: string): Promise<any[]> {
    try {
      const estadisticas = await this.obtenerEstadisticas(usuarioId);
      if (!estadisticas) return [];
      
      const logrosNuevos = [];
      
      const logrosAcordeon = [
        {
          id: 'primera_nota',
          condicion: () => estadisticas.total_sesiones >= 1,
          titulo: 'Primera Nota',
          descripcion: 'Toca tu primera nota en el acordeón',
          xp_recompensa: 100
        },
        {
          id: 'maestro_fuelle',
          condicion: () => estadisticas.total_sesiones >= 10,
          titulo: 'Maestro del Fuelle',
          descripcion: 'Completa 10 sesiones de práctica',
          xp_recompensa: 250
        },
        {
          id: 'acorde_perfecto',
          condicion: () => estadisticas.mejor_precision >= 95,
          titulo: 'Acorde Perfecto',
          descripcion: 'Alcanza 95% de precisión en una sesión',
          xp_recompensa: 500
        }
      ];
      
      for (const logro of logrosAcordeon) {
        if (logro.condicion()) {
          const { data: existente } = await supabase
            .from('logros_sistema')
            .select('id')
            .eq('usuario_id', usuarioId)
            .eq('logro_id', logro.id)
            .single();
          
          if (!existente) {
            await supabase
              .from('logros_sistema')
              .insert({
                usuario_id: usuarioId,
                logro_id: logro.id,
                titulo: logro.titulo,
                descripcion: logro.descripcion,
                xp_recompensa: logro.xp_recompensa,
                fecha_obtenido: new Date().toISOString()
              });
            
            logrosNuevos.push(logro);
          }
        }
      }
      
      return logrosNuevos;
    } catch (error) {
      console.error('Error verificando logros:', error);
      throw error;
    }
  }
  
  /**
   * 📊 Calcular nivel recomendado
   */
  static calcularNivelRecomendado(estadisticas: EstadisticasAcordeon): 'principiante' | 'intermedio' | 'avanzado' {
    if (estadisticas.total_sesiones < 5 || estadisticas.precision_promedio < 60) {
      return 'principiante';
    } else if (estadisticas.total_sesiones < 20 || estadisticas.precision_promedio < 80) {
      return 'intermedio';
    } else {
      return 'avanzado';
    }
  }
  
  /**
   * 💡 Obtener recomendaciones personalizadas
   */
  static async obtenerRecomendaciones(usuarioId: string): Promise<any> {
    try {
      const estadisticas = await this.obtenerEstadisticas(usuarioId);
      if (!estadisticas) {
        return {
          nivel: 'principiante',
          lecciones: [],
          canciones: [],
          desafios: []
        };
      }
      
      const nivelRecomendado = this.calcularNivelRecomendado(estadisticas);
      
      const [lecciones, canciones, desafios] = await Promise.all([
        this.obtenerLecciones(nivelRecomendado),
        this.obtenerCanciones({ dificultad: nivelRecomendado }),
        this.obtenerDesafiosDisponibles()
      ]);
      
      return {
        nivel: nivelRecomendado,
        lecciones: lecciones.slice(0, 3),
        canciones: canciones.slice(0, 3),
        desafios: desafios.slice(0, 2)
      };
    } catch (error) {
      console.error('Error obteniendo recomendaciones:', error);
      throw error;
    }
  }
}

export default SimuladorAcordeonService; 