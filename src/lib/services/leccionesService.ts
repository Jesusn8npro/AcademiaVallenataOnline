/**
 * 🎓 SERVICIO DE LECCIONES ESTRUCTURADAS
 * ====================================
 * Maneja todas las operaciones CRUD para las lecciones
 * estilo Yousician/Duolingo del simulador de acordeón
 */

import { supabase } from '$lib/supabase/clienteSupabase';

// Tipos para las lecciones
export interface Leccion {
  id: string;
  titulo: string;
  descripcion: string;
  objetivo: string;
  categoria: 'basico' | 'escalas' | 'ritmos' | 'acordes' | 'canciones' | 'tecnica';
  nivel: number;
  duracion_minutos: number;
  dificultad: 'principiante' | 'intermedio' | 'avanzado' | 'experto';
  status: 'borrador' | 'activa' | 'archivada';
  secuencia_notas: string[];
  creador_id: string;
  created_at: string;
  updated_at: string;
  criterios?: CriteriosLeccion;
  estadisticas?: EstadisticasLeccion;
  progreso_usuario?: ProgresoUsuario;
}

export interface CriteriosLeccion {
  id: string;
  leccion_id: string;
  precision_minima: number;
  tiempo_maximo_segundos: number;
  intentos_maximos: number;
  bonus_precision: number;
  bonus_velocidad: number;
  penalizacion_error: number;
}

export interface ProgresoUsuario {
  id: string;
  usuario_id: string;
  leccion_id: string;
  estado: 'no_iniciada' | 'en_progreso' | 'completada' | 'fallida';
  intentos_realizados: number;
  mejor_precision: number;
  mejor_tiempo: number;
  fecha_completada?: string;
  xp_obtenido: number;
  datos_sesion: any;
}

export interface SesionLeccion {
  id: string;
  usuario_id: string;
  leccion_id: string;
  progreso_id: string;
  intento_numero: number;
  duracion_segundos: number;
  notas_tocadas: number;
  notas_correctas: number;
  precision_final: number;
  completada: boolean;
  criterios_cumplidos: any;
  notas_detalle: any;
}

export interface EstadisticasLeccion {
  leccion_id: string;
  total_usuarios_intentaron: number;
  total_usuarios_completaron: number;
  precision_promedio: number;
  tiempo_promedio_segundos: number;
  rating_promedio: number;
}

export interface FiltrosLecciones {
  categoria?: string;
  nivel_min?: number;
  nivel_max?: number;
  dificultad?: string;
  status?: string;
  creador_id?: string;
  busqueda?: string;
}

class LeccionesService {
  
  // ================================
  // 📚 GESTIÓN DE LECCIONES (ADMIN)
  // ================================
  
  /**
   * Crear una nueva lección
   */
  async crearLeccion(leccion: Omit<Leccion, 'id' | 'created_at' | 'updated_at'>, criterios: Omit<CriteriosLeccion, 'id' | 'leccion_id'>): Promise<Leccion> {
    try {
      // 1. Crear la lección
      const { data: nuevaLeccion, error: errorLeccion } = await supabase
        .from('lecciones_acordeon')
        .insert([leccion])
        .select()
        .single();

      if (errorLeccion) throw errorLeccion;

      // 2. Crear los criterios
      const { data: nuevosCriterios, error: errorCriterios } = await supabase
        .from('lecciones_criterios')
        .insert([{ ...criterios, leccion_id: nuevaLeccion.id }])
        .select()
        .single();

      if (errorCriterios) throw errorCriterios;

      return {
        ...nuevaLeccion,
        criterios: nuevosCriterios
      };
    } catch (error) {
      console.error('Error creando lección:', error);
      throw error;
    }
  }

  /**
   * Obtener todas las lecciones con filtros
   */
  async obtenerLecciones(filtros: FiltrosLecciones = {}): Promise<Leccion[]> {
    try {
      let query = supabase
        .from('lecciones_acordeon')
        .select(`
          *,
          criterios:lecciones_criterios(*),
          estadisticas:lecciones_estadisticas(*)
        `);

      // Aplicar filtros
      if (filtros.categoria && filtros.categoria !== 'todas') {
        query = query.eq('categoria', filtros.categoria);
      }

      if (filtros.nivel_min) {
        query = query.gte('nivel', filtros.nivel_min);
      }

      if (filtros.nivel_max) {
        query = query.lte('nivel', filtros.nivel_max);
      }

      if (filtros.dificultad && filtros.dificultad !== 'todos') {
        query = query.eq('dificultad', filtros.dificultad);
      }

      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros.creador_id) {
        query = query.eq('creador_id', filtros.creador_id);
      }

      if (filtros.busqueda) {
        query = query.or(`titulo.ilike.%${filtros.busqueda}%,descripcion.ilike.%${filtros.busqueda}%`);
      }

      const { data, error } = await query.order('nivel', { ascending: true });

      if (error) throw error;

      return data.map((leccion: any) => ({
        ...leccion,
        criterios: leccion.criterios?.[0] || null,
        estadisticas: leccion.estadisticas?.[0] || null
      }));
    } catch (error) {
      console.error('Error obteniendo lecciones:', error);
      throw error;
    }
  }

  /**
   * Obtener una lección específica
   */
  async obtenerLeccion(id: string): Promise<Leccion | null> {
    try {
      const { data, error } = await supabase
        .from('lecciones_acordeon')
        .select(`
          *,
          criterios:lecciones_criterios(*),
          estadisticas:lecciones_estadisticas(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        criterios: data.criterios?.[0] || null,
        estadisticas: data.estadisticas?.[0] || null
      };
    } catch (error) {
      console.error('Error obteniendo lección:', error);
      return null;
    }
  }

  /**
   * Actualizar una lección
   */
  async actualizarLeccion(id: string, datosLeccion: Partial<Leccion>, criterios?: Partial<CriteriosLeccion>): Promise<Leccion> {
    try {
      // 1. Actualizar la lección
      const { data: leccionActualizada, error: errorLeccion } = await supabase
        .from('lecciones_acordeon')
        .update(datosLeccion)
        .eq('id', id)
        .select()
        .single();

      if (errorLeccion) throw errorLeccion;

      // 2. Actualizar criterios si se proporcionan
      if (criterios) {
        const { error: errorCriterios } = await supabase
          .from('lecciones_criterios')
          .update(criterios)
          .eq('leccion_id', id);

        if (errorCriterios) throw errorCriterios;
      }

      return await this.obtenerLeccion(id) as Leccion;
    } catch (error) {
      console.error('Error actualizando lección:', error);
      throw error;
    }
  }

  /**
   * Eliminar una lección
   */
  async eliminarLeccion(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('lecciones_acordeon')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando lección:', error);
      throw error;
    }
  }

  /**
   * Duplicar una lección
   */
  async duplicarLeccion(id: string): Promise<Leccion> {
    try {
      const leccionOriginal = await this.obtenerLeccion(id);
      if (!leccionOriginal) throw new Error('Lección no encontrada');

      const nuevaLeccion = {
        ...leccionOriginal,
        titulo: `${leccionOriginal.titulo} (Copia)`,
        status: 'borrador' as const,
        created_at: undefined,
        updated_at: undefined,
        id: undefined
      };

      return await this.crearLeccion(nuevaLeccion, leccionOriginal.criterios!);
    } catch (error) {
      console.error('Error duplicando lección:', error);
      throw error;
    }
  }

  // ================================
  // 🎮 EXPERIENCIA DEL ESTUDIANTE
  // ================================

  /**
   * Obtener lecciones recomendadas para un usuario
   */
  async obtenerLeccionesRecomendadas(usuarioId: string, limite: number = 5): Promise<Leccion[]> {
    try {
      const { data, error } = await supabase
        .rpc('obtener_lecciones_recomendadas', {
          usuario_uuid: usuarioId,
          limite: limite
        });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo lecciones recomendadas:', error);
      return [];
    }
  }

  /**
   * Obtener progreso del usuario en las lecciones
   */
  async obtenerProgresoUsuario(usuarioId: string, leccionId?: string): Promise<ProgresoUsuario[]> {
    try {
      let query = supabase
        .from('lecciones_progreso')
        .select(`
          *,
          leccion:lecciones_acordeon(titulo, descripcion, categoria, nivel)
        `)
        .eq('usuario_id', usuarioId);

      if (leccionId) {
        query = query.eq('leccion_id', leccionId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error obteniendo progreso:', error);
      return [];
    }
  }

  /**
   * Iniciar una sesión de lección
   */
  async iniciarSesionLeccion(usuarioId: string, leccionId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('iniciar_sesion_leccion', {
          usuario_uuid: usuarioId,
          leccion_uuid: leccionId
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error iniciando sesión de lección:', error);
      throw error;
    }
  }

  /**
   * Finalizar una sesión de lección
   */
  async finalizarSesionLeccion(
    sesionId: string,
    duracionSegundos: number,
    notasTocadas: number,
    notasCorrectas: number,
    precisionFinal: number,
    completada: boolean = false,
    criteriosCumplidos: any = {},
    notasDetalle: any = {}
  ): Promise<any> {
    try {
      const { data, error } = await supabase
        .rpc('finalizar_sesion_leccion', {
          sesion_uuid: sesionId,
          duracion_segundos: duracionSegundos,
          notas_tocadas: notasTocadas,
          notas_correctas: notasCorrectas,
          precision_final: precisionFinal,
          completada: completada,
          criterios_cumplidos: criteriosCumplidos,
          notas_detalle: notasDetalle
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finalizando sesión de lección:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de una lección
   */
  async obtenerEstadisticasLeccion(leccionId: string): Promise<EstadisticasLeccion | null> {
    try {
      const { data, error } = await supabase
        .from('lecciones_estadisticas')
        .select('*')
        .eq('leccion_id', leccionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  // ================================
  // 🎵 UTILIDADES
  // ================================

  /**
   * Validar secuencia de notas
   */
  validarSecuenciaNotas(secuencia: string[]): boolean {
    const notasValidas = ['Do', 'Do#', 'Re', 'Re#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];
    return secuencia.every(nota => notasValidas.includes(nota));
  }

  /**
   * Calcular dificultad estimada basada en secuencia
   */
  calcularDificultadEstimada(secuencia: string[]): 'principiante' | 'intermedio' | 'avanzado' | 'experto' {
    const notasUnicas = [...new Set(secuencia)].length;
    const longitud = secuencia.length;
    
    if (notasUnicas <= 3 && longitud <= 5) return 'principiante';
    if (notasUnicas <= 5 && longitud <= 8) return 'intermedio';
    if (notasUnicas <= 8 && longitud <= 12) return 'avanzado';
    return 'experto';
  }

  /**
   * Generar patrones predefinidos
   */
  obtenerPatronesPredefinidos(): { [key: string]: string[] } {
    return {
      'escala-do': ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'],
      'acorde-do': ['Do', 'Mi', 'Sol', 'Do'],
      'vallenato-basico': ['Do', 'Mi', 'Sol', 'Mi', 'Fa', 'La', 'Fa', 'Sol'],
      'arpegio-do': ['Do', 'Mi', 'Sol', 'Do', 'Sol', 'Mi', 'Do'],
      'escala-sol': ['Sol', 'La', 'Si', 'Do', 'Re', 'Mi', 'Fa#', 'Sol'],
      'merengue-basico': ['Do', 'Sol', 'Do', 'Sol', 'Fa', 'Do', 'Fa', 'Do'],
      'cumbia-clasica': ['Sol', 'Do', 'Re', 'Sol', 'Fa', 'Do', 'Sol', 'Do']
    };
  }

  /**
   * Crear lecciones de ejemplo
   */
  async crearLeccionesEjemplo(creadorId: string): Promise<void> {
    const leccionesEjemplo = [
      {
        titulo: 'Primeras Notas - Do Re Mi',
        descripcion: 'Aprende las primeras 3 notas del acordeón vallenato. Perfecta para principiantes que nunca han tocado.',
        objetivo: 'Tocar Do-Re-Mi con 85% de precisión en menos de 45 segundos',
        categoria: 'basico' as const,
        nivel: 1,
        duracion_minutos: 3,
        dificultad: 'principiante' as const,
        status: 'activa' as const,
        secuencia_notas: ['Do', 'Re', 'Mi', 'Re', 'Do'],
        creador_id: creadorId,
        criterios: {
          precision_minima: 85,
          tiempo_maximo_segundos: 45,
          intentos_maximos: 5,
          bonus_precision: 20,
          bonus_velocidad: 10,
          penalizacion_error: 5
        }
      },
      {
        titulo: 'Escala Completa de Do',
        descripcion: 'Domina la escala completa de Do Mayor. Base fundamental para tocar vallenato.',
        objetivo: 'Ejecutar la escala ascendente y descendente fluidamente',
        categoria: 'escalas' as const,
        nivel: 2,
        duracion_minutos: 5,
        dificultad: 'intermedio' as const,
        status: 'activa' as const,
        secuencia_notas: ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do', 'Si', 'La', 'Sol', 'Fa', 'Mi', 'Re', 'Do'],
        creador_id: creadorId,
        criterios: {
          precision_minima: 80,
          tiempo_maximo_segundos: 75,
          intentos_maximos: 4,
          bonus_precision: 25,
          bonus_velocidad: 15,
          penalizacion_error: 3
        }
      },
      {
        titulo: 'Patrón Vallenato Clásico',
        descripcion: 'Aprende el patrón rítmico fundamental del vallenato tradicional.',
        objetivo: 'Mantener el patrón rítmico por 45 segundos sin errores',
        categoria: 'ritmos' as const,
        nivel: 3,
        duracion_minutos: 8,
        dificultad: 'intermedio' as const,
        status: 'activa' as const,
        secuencia_notas: ['Do', 'Mi', 'Sol', 'Mi', 'Fa', 'La', 'Fa', 'Sol', 'Do', 'Mi', 'Sol', 'Mi'],
        creador_id: creadorId,
        criterios: {
          precision_minima: 75,
          tiempo_maximo_segundos: 90,
          intentos_maximos: 6,
          bonus_precision: 30,
          bonus_velocidad: 20,
          penalizacion_error: 2
        }
      },
      {
        titulo: 'Acordes Básicos - Triadas',
        descripcion: 'Construye y toca los acordes básicos del vallenato usando triadas.',
        objetivo: 'Tocar acordes de Do, Fa y Sol con transiciones suaves',
        categoria: 'acordes' as const,
        nivel: 4,
        duracion_minutos: 10,
        dificultad: 'avanzado' as const,
        status: 'activa' as const,
        secuencia_notas: ['Do', 'Mi', 'Sol', 'Fa', 'La', 'Do', 'Sol', 'Si', 'Re', 'Do', 'Mi', 'Sol'],
        creador_id: creadorId,
        criterios: {
          precision_minima: 70,
          tiempo_maximo_segundos: 120,
          intentos_maximos: 8,
          bonus_precision: 35,
          bonus_velocidad: 25,
          penalizacion_error: 1
        }
      }
    ];

    try {
      for (const leccionData of leccionesEjemplo) {
        const { criterios, ...leccion } = leccionData;
        await this.crearLeccion(leccion, criterios);
      }
      console.log('✅ Lecciones de ejemplo creadas exitosamente');
    } catch (error) {
      console.error('❌ Error creando lecciones de ejemplo:', error);
    }
  }
}

export default new LeccionesService(); 