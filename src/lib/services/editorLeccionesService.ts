/**
 * 🎹 SERVICIO SIMPLIFICADO PARA EDITOR DE LECCIONES
 * ================================================
 * Servicio específico para crear lecciones desde el editor
 * Maneja la estructura real de la base de datos
 */

import { supabase } from '$lib/supabase/clienteSupabase';

export interface LeccionEditor {
  titulo: string;
  descripcion: string;
  objetivo: string;
  categoria: 'basico' | 'escalas' | 'ritmos' | 'acordes' | 'canciones' | 'tecnica';
  nivel: number;
  dificultad: 'principiante' | 'intermedio' | 'avanzado' | 'experto';
  duracion_minutos: number;
  secuencia_notas: string[];
  status: 'borrador' | 'activa' | 'archivada';
  creador_id: string;
}

export interface CriteriosEditor {
  precision_minima: number;
  tiempo_maximo_segundos: number;
  intentos_maximos: number;
  bonus_precision: number;
  bonus_velocidad: number;
  penalizacion_error: number;
}

class EditorLeccionesService {
  
  /**
   * Crear una nueva lección con criterios
   */
  async crearLeccion(leccion: LeccionEditor, criterios: CriteriosEditor): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      console.log('🔄 Iniciando creación de lección:', { leccion, criterios });
      
      // 1. Crear la lección principal
      const { data: nuevaLeccion, error: errorLeccion } = await supabase
        .from('lecciones_acordeon')
        .insert([{
          titulo: leccion.titulo,
          descripcion: leccion.descripcion,
          objetivo: leccion.objetivo,
          categoria: leccion.categoria,
          nivel: leccion.nivel,
          dificultad: leccion.dificultad,
          duracion_minutos: leccion.duracion_minutos,
          secuencia_notas: leccion.secuencia_notas,
          status: leccion.status,
          creador_id: leccion.creador_id
        }])
        .select()
        .single();

      if (errorLeccion) {
        console.error('❌ Error creando lección:', errorLeccion);
        return {
          success: false,
          message: `Error al crear lección: ${errorLeccion.message}`,
          data: errorLeccion
        };
      }

      console.log('✅ Lección creada exitosamente:', nuevaLeccion);

      // 2. Crear los criterios
      const { data: nuevosCriterios, error: errorCriterios } = await supabase
        .from('lecciones_criterios')
        .insert([{
          leccion_id: nuevaLeccion.id,
          precision_minima: criterios.precision_minima,
          tiempo_maximo_segundos: criterios.tiempo_maximo_segundos,
          intentos_maximos: criterios.intentos_maximos,
          bonus_precision: criterios.bonus_precision,
          bonus_velocidad: criterios.bonus_velocidad,
          penalizacion_error: criterios.penalizacion_error
        }])
        .select()
        .single();

      if (errorCriterios) {
        console.error('❌ Error creando criterios:', errorCriterios);
        
        // Intentar limpiar la lección creada
        await supabase
          .from('lecciones_acordeon')
          .delete()
          .eq('id', nuevaLeccion.id);

        return {
          success: false,
          message: `Error al crear criterios: ${errorCriterios.message}`,
          data: errorCriterios
        };
      }

      console.log('✅ Criterios creados exitosamente:', nuevosCriterios);

      return {
        success: true,
        message: 'Lección creada exitosamente',
        data: {
          leccion: nuevaLeccion,
          criterios: nuevosCriterios
        }
      };

    } catch (error) {
      console.error('💥 Error inesperado:', error);
      return {
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        data: error
      };
    }
  }

  /**
   * Obtener todas las lecciones del usuario
   */
  async obtenerLecciones(creadorId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { data: lecciones, error } = await supabase
        .from('lecciones_acordeon')
        .select(`
          *,
          criterios:lecciones_criterios(*)
        `)
        .eq('creador_id', creadorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error obteniendo lecciones:', error);
        return {
          success: false,
          message: `Error al obtener lecciones: ${error.message}`,
          data: error
        };
      }

      return {
        success: true,
        message: 'Lecciones obtenidas exitosamente',
        data: lecciones.map((leccion: any) => ({
          ...leccion,
          criterios: leccion.criterios?.[0] || null
        }))
      };

    } catch (error) {
      console.error('💥 Error inesperado:', error);
      return {
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        data: error
      };
    }
  }

  /**
   * Verificar si las tablas existen
   */
  async verificarTablas(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      // Probar consulta simple a las tablas
      const { data: testLecciones, error: errorLecciones } = await supabase
        .from('lecciones_acordeon')
        .select('id')
        .limit(1);

      if (errorLecciones) {
        return {
          success: false,
          message: `Tabla lecciones_acordeon no existe: ${errorLecciones.message}`,
          data: errorLecciones
        };
      }

      const { data: testCriterios, error: errorCriterios } = await supabase
        .from('lecciones_criterios')
        .select('id')
        .limit(1);

      if (errorCriterios) {
        return {
          success: false,
          message: `Tabla lecciones_criterios no existe: ${errorCriterios.message}`,
          data: errorCriterios
        };
      }

      return {
        success: true,
        message: 'Todas las tablas existen',
        data: { lecciones: testLecciones, criterios: testCriterios }
      };

    } catch (error) {
      return {
        success: false,
        message: `Error verificando tablas: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        data: error
      };
    }
  }

  /**
   * Eliminar una lección
   */
  async eliminarLeccion(leccionId: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const { error } = await supabase
        .from('lecciones_acordeon')
        .delete()
        .eq('id', leccionId);

      if (error) {
        console.error('❌ Error eliminando lección:', error);
        return {
          success: false,
          message: `Error al eliminar lección: ${error.message}`,
          data: error
        };
      }

      return {
        success: true,
        message: 'Lección eliminada exitosamente',
        data: null
      };

    } catch (error) {
      console.error('💥 Error inesperado:', error);
      return {
        success: false,
        message: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        data: error
      };
    }
  }
}

export default new EditorLeccionesService(); 