/**
 * 🎵 ACADEMIA VALLENATA ONLINE - SERVICIO DE CANCIONES
 * =====================================================
 * Servicio completo para manejo de canciones del simulador
 * Estilo Guitar Hero para acordeón vallenato
 * Integración con sistema de gamificación existente
 * =====================================================
 */

import { supabase } from './clienteSupabase';
// import type { Database } from '../tipos/database.types';

// =====================================================
// 🎯 TIPOS DE DATOS
// =====================================================

export interface CancionAcordeon {
  id: string;
  titulo: string;
  artista: string;
  genero: 'vallenato' | 'cumbia' | 'merengue' | 'paseo' | 'puya' | 'son';
  nivel_dificultad: number;
  duracion_segundos: number;
  bpm?: number;
  afinacion: 'FBE' | 'GCF' | 'ADG' | 'EAD';
  
  // Archivos de audio
  url_audio: string;
  url_audio_backing?: string;
  url_audio_preview?: string;
  
  // Metadatos
  descripcion?: string;
  letra?: string;
  tags?: string[];
  
  // Configuración
  dificultad_tecnica: 'principiante' | 'intermedio' | 'avanzado' | 'experto';
  requiere_cambios_fuelle: boolean;
  requiere_acordes: boolean;
  requiere_bajos: boolean;
  
  // Gamificación
  xp_recompensa: number;
  monedas_recompensa: number;
  puntos_precision: number;
  
  // Juego
  tiempo_maximo_minutos: number;
  precision_minima_requerida: number;
  intentos_maximos: number;
  
  // Estado
  estado: 'borrador' | 'activa' | 'pausada' | 'archivada';
  es_publica: boolean;
  es_premium: boolean;
  orden_mostrar: number;
  
  // Metadata
  creador_id: string;
  created_at: string;
  updated_at: string;
}

export interface NotaTemporizada {
  timestamp_ms: number;
  duracion_ms: number;
  nota_id: string;
  nota_nombre: string;
  fuelle_direccion: 'halar' | 'empujar';
  es_acorde: boolean;
  notas_acorde?: string[];
  intensidad: 'suave' | 'normal' | 'fuerte';
  es_opcional: boolean;
  tipo_nota: 'melodia' | 'bajo';
}

export interface SecuenciaCancion {
  id: string;
  cancion_id: string;
  nombre_secuencia: string;
  descripcion?: string;
  
  // Configuración
  tolerancia_timing_ms: number;
  auto_cuantizar: boolean;
  usar_metronomo: boolean;
  
  // Datos
  notas_secuencia: NotaTemporizada[];
  marcadores_tiempo: {
    intro_hasta_segundo?: number;
    verso_desde_segundo?: number;
    verso_hasta_segundo?: number;
    coro_desde_segundo?: number;
    coro_hasta_segundo?: number;
    outro_desde_segundo?: number;
  };
  
  // Estadísticas
  total_notas: number;
  duracion_total_ms?: number;
  
  // Estado
  es_secuencia_principal: boolean;
  nivel_dificultad: number;
  estado: 'borrador' | 'activa' | 'pausada';
  
  created_at: string;
  updated_at: string;
}

export interface ProgresoCancion {
  id: string;
  usuario_id: string;
  cancion_id: string;
  estado: 'iniciado' | 'en_progreso' | 'completado' | 'perfecto';
  
  // Estadísticas
  mejor_precision: number;
  precision_actual: number;
  intentos_realizados: number;
  tiempo_practicado_minutos: number;
  
  // Métricas
  notas_totales_tocadas: number;
  notas_correctas: number;
  notas_incorrectas: number;
  racha_maxima_notas: number;
  
  // Timing
  promedio_timing_ms: number;
  errores_timing: number;
  cambios_fuelle_correctos: number;
  
  // Progreso por secciones
  progreso_secciones: Record<string, {
    completado: boolean;
    precision: number;
  }>;
  
  // Recompensas
  xp_ganado: number;
  monedas_ganadas: number;
  logros_desbloqueados: string[];
  
  // Fechas
  fecha_inicio: string;
  fecha_ultimo_intento: string;
  fecha_completado?: string;
  fecha_perfecto?: string;
  
  created_at: string;
  updated_at: string;
}

export interface SesionCancion {
  id: string;
  usuario_id: string;
  cancion_id: string;
  
  // Información
  duracion_segundos: number;
  modo_practica: 'completa' | 'por_secciones' | 'solo_dificil';
  
  // Métricas
  notas_tocadas: number;
  notas_correctas: number;
  precision_promedio: number;
  
  // Timing
  errores_timing: number;
  cambios_fuelle: number;
  tempo_promedio: number;
  
  // Estado
  completado: boolean;
  abandono_temprano: boolean;
  razon_abandono?: string;
  
  // Datos específicos
  datos_sesion: Record<string, any>;
  
  // Gamificación
  xp_ganado: number;
  monedas_ganadas: number;
  
  created_at: string;
  updated_at: string;
}

export interface FiltrosCanciones {
  busqueda?: string;
  genero?: string;
  nivel_dificultad?: number;
  dificultad_tecnica?: string;
  estado?: string;
  creador_id?: string;
  es_publica?: boolean;
  es_premium?: boolean;
  tags?: string[];
  afinacion?: string;
}

export interface EstadisticasCancion {
  total_usuarios: number;
  usuarios_completaron: number;
  precision_promedio: number;
  intentos_promedio: number;
  tiempo_promedio_minutos: number;
}

export interface CancionRecomendada {
  cancion_id: string;
  titulo: string;
  artista: string;
  nivel_dificultad: number;
  razon_recomendacion: string;
}

// =====================================================
// 🚀 SERVICIO PRINCIPAL
// =====================================================

export class CancionesService {

  // =====================================================
  // 🎶 GESTIÓN DE CANCIONES
  // =====================================================

  /**
   * 🎮 Obtener canciones activas (para el juego)
   */
  static async obtenerCancionesActivas(): Promise<CancionAcordeon[]> {
    try {
      const { data, error } = await supabase
        .from('canciones_simulador_acordeon')
        .select('*')
        .eq('estado', 'activa')
        .eq('es_publica', true)
        .order('orden_mostrar', { ascending: true });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  /**
   * 🔢 Contar total de canciones
   */
  static async contarCanciones(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('canciones_simulador_acordeon')
        .select('*', { count: 'exact', head: true });

      if (error) {
        return 0;
      }

      return count || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 📋 Obtener lista de canciones con filtros
   */
  static async obtenerCanciones(filtros: FiltrosCanciones = {}): Promise<CancionAcordeon[]> {
    try {
      let query = supabase
        .from('canciones_simulador_acordeon')
        .select('*')
        .order('orden_mostrar', { ascending: true })
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtros.busqueda) {
        query = query.or(`titulo.ilike.%${filtros.busqueda}%,artista.ilike.%${filtros.busqueda}%`);
      }
      
      if (filtros.genero) {
        query = query.eq('genero', filtros.genero);
      }
      
      if (filtros.nivel_dificultad) {
        query = query.eq('nivel_dificultad', filtros.nivel_dificultad);
      }
      
      if (filtros.dificultad_tecnica) {
        query = query.eq('dificultad_tecnica', filtros.dificultad_tecnica);
      }
      
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }
      
      if (filtros.creador_id) {
        query = query.eq('creador_id', filtros.creador_id);
      }
      
      if (filtros.es_publica !== undefined) {
        query = query.eq('es_publica', filtros.es_publica);
      }
      
      if (filtros.es_premium !== undefined) {
        query = query.eq('es_premium', filtros.es_premium);
      }
      
      if (filtros.afinacion) {
        query = query.eq('afinacion', filtros.afinacion);
      }
      
      if (filtros.tags && filtros.tags.length > 0) {
        query = query.contains('tags', filtros.tags);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🎵 Obtener canción por ID
   */
  static async obtenerCancionPorId(id: string): Promise<CancionAcordeon | null> {
    try {
      const { data, error } = await supabase
        .from('canciones_simulador_acordeon')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * ✨ Crear nueva canción
   */
  static async crearCancion(datosCancion: Omit<CancionAcordeon, 'id' | 'created_at' | 'updated_at'>): Promise<CancionAcordeon | null> {
    try {
      const { data, error } = await supabase
        .from('canciones_simulador_acordeon')
        .insert([datosCancion])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 📝 Actualizar canción existente
   */
  static async actualizarCancion(id: string, datosCancion: Partial<CancionAcordeon>): Promise<CancionAcordeon | null> {
    try {
      const { data, error } = await supabase
        .from('canciones_simulador_acordeon')
        .update(datosCancion)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar canción
   */
  static async eliminarCancion(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('canciones_simulador_acordeon')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // 🎼 GESTIÓN DE SECUENCIAS
  // =====================================================

  /**
   * 📋 Obtener secuencias de una canción
   */
  static async obtenerSecuenciasCancion(cancionId: string): Promise<SecuenciaCancion[]> {
    try {
      const { data, error } = await supabase
        .from('secuencias_canciones_acordeon')
        .select('*')
        .eq('cancion_id', cancionId)
        .order('es_secuencia_principal', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🎵 Obtener secuencia principal de una canción
   */
  static async obtenerSecuenciaPrincipal(cancionId: string): Promise<SecuenciaCancion | null> {
    try {
      const { data, error } = await supabase
        .from('secuencias_canciones_acordeon')
        .select('*')
        .eq('cancion_id', cancionId)
        .eq('es_secuencia_principal', true)
        .single();

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * ✨ Crear nueva secuencia
   */
  static async crearSecuencia(datosSecuencia: Omit<SecuenciaCancion, 'id' | 'total_notas' | 'created_at' | 'updated_at'>): Promise<SecuenciaCancion | null> {
    try {
      const { data, error } = await supabase
        .from('secuencias_canciones_acordeon')
        .insert([datosSecuencia])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 📝 Actualizar secuencia existente
   */
  static async actualizarSecuencia(id: string, datosSecuencia: Partial<SecuenciaCancion>): Promise<SecuenciaCancion | null> {
    try {
      const { data, error } = await supabase
        .from('secuencias_canciones_acordeon')
        .update(datosSecuencia)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🗑️ Eliminar secuencia
   */
  static async eliminarSecuencia(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('secuencias_canciones_acordeon')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // 📈 GESTIÓN DE PROGRESO
  // =====================================================

  /**
   * 📊 Obtener progreso de usuario en una canción
   */
  static async obtenerProgresoCancion(usuarioId: string, cancionId: string): Promise<ProgresoCancion | null> {
    try {
      const { data, error } = await supabase
        .from('progreso_canciones_acordeon')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('cancion_id', cancionId)
        .single();

      if (error) {
        // Si no existe progreso, devolver null (no es error)
        if (error.code === 'PGRST116') {
          return null;
        }
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * ✨ Inicializar progreso de usuario
   */
  static async inicializarProgreso(usuarioId: string, cancionId: string): Promise<ProgresoCancion | null> {
    try {
      const datosProgreso = {
        usuario_id: usuarioId,
        cancion_id: cancionId,
        estado: 'iniciado' as const,
        mejor_precision: 0,
        precision_actual: 0,
        intentos_realizados: 0,
        tiempo_practicado_minutos: 0,
        notas_totales_tocadas: 0,
        notas_correctas: 0,
        notas_incorrectas: 0,
        racha_maxima_notas: 0,
        promedio_timing_ms: 0,
        errores_timing: 0,
        cambios_fuelle_correctos: 0,
        progreso_secciones: {},
        xp_ganado: 0,
        monedas_ganadas: 0,
        logros_desbloqueados: [],
        fecha_inicio: new Date().toISOString(),
        fecha_ultimo_intento: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('progreso_canciones_acordeon')
        .insert([datosProgreso])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 📝 Actualizar progreso de usuario
   */
  static async actualizarProgreso(usuarioId: string, cancionId: string, datosProgreso: Partial<ProgresoCancion>): Promise<ProgresoCancion | null> {
    try {
      const { data, error } = await supabase
        .from('progreso_canciones_acordeon')
        .update({
          ...datosProgreso,
          fecha_ultimo_intento: new Date().toISOString()
        })
        .eq('usuario_id', usuarioId)
        .eq('cancion_id', cancionId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // 🎮 GESTIÓN DE SESIONES
  // =====================================================

  /**
   * 📊 Registrar sesión de práctica
   */
  static async registrarSesionCancion(datosSesion: Omit<SesionCancion, 'id' | 'created_at' | 'updated_at'>): Promise<SesionCancion | null> {
    try {
      const { data, error } = await supabase
        .from('sesiones_canciones_acordeon')
        .insert([datosSesion])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 📋 Obtener historial de sesiones
   */
  static async obtenerHistorialSesiones(usuarioId: string, cancionId?: string): Promise<SesionCancion[]> {
    try {
      let query = supabase
        .from('sesiones_canciones_acordeon')
        .select('*')
        .eq('usuario_id', usuarioId)
        .order('created_at', { ascending: false });

      if (cancionId) {
        query = query.eq('cancion_id', cancionId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  }

  // =====================================================
  // 📊 ESTADÍSTICAS Y RECOMENDACIONES
  // =====================================================

  /**
   * 📈 Obtener estadísticas de una canción
   */
  static async obtenerEstadisticasCancion(cancionId: string): Promise<EstadisticasCancion | null> {
    try {
      const { data, error } = await supabase
        .rpc('calcular_estadisticas_cancion', { p_cancion_id: cancionId });

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }

  /**
   * 🎯 Obtener canciones recomendadas para un usuario
   */
  static async obtenerCancionesRecomendadas(usuarioId: string, limite: number = 5): Promise<CancionRecomendada[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_canciones_recomendadas', { 
          p_usuario_id: usuarioId, 
          p_limite: limite 
        });

      if (error) {
        return [];
      }

      return data || [];
    } catch (error) {
      return [];
    }
  }

  // =====================================================
  // 🎯 UTILIDADES
  // =====================================================

  /**
   * 🔄 Duplicar canción
   */
  static async duplicarCancion(cancionId: string): Promise<CancionAcordeon | null> {
    try {
      // Obtener canción original
      const cancionOriginal = await this.obtenerCancionPorId(cancionId);
      if (!cancionOriginal) {
        throw new Error('Canción no encontrada');
      }

      // Crear copia
      const cancionCopia = {
        ...cancionOriginal,
        titulo: `${cancionOriginal.titulo} (Copia)`,
        estado: 'borrador' as const
      };

      // Remover campos únicos
      delete (cancionCopia as any).id;
      delete (cancionCopia as any).created_at;
      delete (cancionCopia as any).updated_at;

      return await this.crearCancion(cancionCopia);
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🎵 Validar estructura de secuencia
   */
  static validarSecuencia(notas: NotaTemporizada[]): { esValida: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!Array.isArray(notas)) {
      errores.push('La secuencia debe ser un array');
      return { esValida: false, errores };
    }

    if (notas.length === 0) {
      errores.push('La secuencia no puede estar vacía');
      return { esValida: false, errores };
    }

    // Validar cada nota
    notas.forEach((nota, index) => {
      if (!nota.timestamp_ms || nota.timestamp_ms < 0) {
        errores.push(`Nota ${index + 1}: timestamp_ms inválido`);
      }

      if (!nota.duracion_ms || nota.duracion_ms < 0) {
        errores.push(`Nota ${index + 1}: duracion_ms inválido`);
      }

      if (!nota.nota_id || typeof nota.nota_id !== 'string') {
        errores.push(`Nota ${index + 1}: nota_id inválido`);
      }

      if (!nota.fuelle_direccion || !['halar', 'empujar'].includes(nota.fuelle_direccion)) {
        errores.push(`Nota ${index + 1}: fuelle_direccion inválido`);
      }
    });

    // Validar orden cronológico
    for (let i = 1; i < notas.length; i++) {
      if (notas[i].timestamp_ms < notas[i - 1].timestamp_ms) {
        errores.push(`Las notas deben estar ordenadas cronológicamente (error en posición ${i + 1})`);
        break;
      }
    }

    return { esValida: errores.length === 0, errores };
  }

  /**
   * 📊 Calcular métricas de sesión
   */
  static calcularMetricasSesion(notasEsperadas: NotaTemporizada[], notasTocadas: any[]): {
    precision: number;
    notasCorrectas: number;
    erroresTiming: number;
    rachMaxima: number;
  } {
    let notasCorrectas = 0;
    let erroresTiming = 0;
    let rachaActual = 0;
    let rachaMaxima = 0;

    // Comparar notas esperadas vs tocadas
    notasEsperadas.forEach((notaEsperada, index) => {
      const notaTocada = notasTocadas[index];
      
      if (notaTocada) {
        // Verificar si la nota es correcta
        if (notaTocada.nota_id === notaEsperada.nota_id) {
          notasCorrectas++;
          rachaActual++;
          rachaMaxima = Math.max(rachaMaxima, rachaActual);
        } else {
          rachaActual = 0;
        }

        // Verificar timing
        const diferenciaMs = Math.abs(notaTocada.timestamp_ms - notaEsperada.timestamp_ms);
        if (diferenciaMs > 150) { // Tolerancia de 150ms
          erroresTiming++;
        }
      }
    });

    const precision = notasEsperadas.length > 0 ? 
      (notasCorrectas / notasEsperadas.length) * 100 : 0;

    return {
      precision: Math.round(precision * 100) / 100,
      notasCorrectas,
      erroresTiming,
      rachMaxima: rachaMaxima
    };
  }
}

export default CancionesService; 
