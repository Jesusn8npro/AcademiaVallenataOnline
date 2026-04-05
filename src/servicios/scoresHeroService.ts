import { supabase } from './clienteSupabase';

export interface DatosScore {
  usuario_id: string;
  cancion_id: string;
  puntuacion: number;
  precision_porcentaje: number;
  notas_totales: number;
  notas_correctas: number;
  notas_falladas: number;
  racha_maxima: number;
  multiplicador_maximo: number;
  modo: string; // 'competencia' | 'libre' | 'synthesia'
  tonalidad: string;
  duracion_ms: number;
  abandono: boolean;
  porcentaje_completado: number;
}

export interface ScoreRespuesta {
  xp_ganado: number;
  xp_acumulado_cancion: number;
  es_mejor_personal: boolean;
  score_id?: string;
  es_nuevo: boolean;
  monedas_ganadas: number;
  saldo_monedas: number;
}

export const scoresHeroService = {
  /**
   * Guarda una nueva puntuación y devuelve la cantidad de XP generada y si es récord personal.
   */
  guardarScoreGame: async (datos: DatosScore): Promise<ScoreRespuesta | null> => {
    try {
      // 1. Obtener el máximo score anterior para ver si es mejor personal
      const { data: maxScoreData } = await supabase
        .from('scores_hero')
        .select('puntuacion')
        .eq('usuario_id', datos.usuario_id)
        .eq('cancion_id', datos.cancion_id)
        .order('puntuacion', { ascending: false })
        .limit(1)
        .single();

      const recordAnterior = maxScoreData?.puntuacion || 0;
      const es_mejor_personal = datos.puntuacion > recordAnterior;

      // 2. Hacer el INSERT (dejamos que el trigger calcule su propio XP basado en abandono y precisión)
      const insertData = {
        usuario_id: datos.usuario_id,
        cancion_id: datos.cancion_id,
        puntuacion: datos.puntuacion,
        precision_porcentaje: datos.precision_porcentaje,
        notas_totales: datos.notas_totales,
        notas_correctas: datos.notas_correctas,
        notas_falladas: datos.notas_falladas,
        racha_maxima: datos.racha_maxima,
        multiplicador_maximo: datos.multiplicador_maximo,
        modo: datos.modo === 'ninguno' ? 'competencia' : datos.modo,
        tonalidad: datos.tonalidad,
        duracion_ms: datos.duracion_ms,
        es_mejor_personal,
        abandono: datos.abandono,
        porcentaje_completado: datos.porcentaje_completado,
        xp_ganado: 0 // placeholder, el trigger lo sobrescribe con las reglas
      };

      const { data: scoreGuardado, error: insertError } = await supabase
        .from('scores_hero')
        .insert(insertData as any)
        .select('*')
        .single();

      if (insertError) {
        console.error('Error insertando score en scores_hero:', insertError);
        return null;
      }

      // 3. Obtener si ganó monedas en esta transacción (trigger las inserta en monedas_transacciones)
      // Buscamos las transacciones de los últimos 5 segundos para este usuario
      let monedas_ganadas = 0;
      const hace5segundos = new Date(Date.now() - 5000).toISOString();
      const { data: transacciones } = await supabase
        .from('monedas_transacciones')
        .select('monto')
        .eq('usuario_id', datos.usuario_id)
        .gte('created_at', hace5segundos);

      if (transacciones && transacciones.length > 0) {
        monedas_ganadas = transacciones.reduce((acc, curr: any) => acc + (curr.monto > 0 ? curr.monto : 0), 0);
      }

      // 4. Obtener saldo actualizado
      const { data: saldoData } = await supabase
        .from('monedas_usuario')
        .select('saldo')
        .eq('usuario_id', datos.usuario_id)
        .single();

      // 5. Obtener xp_acumulado real de la tabla xp_cancion_usuario
      const { data: cancionXpData } = await supabase
        .from('xp_cancion_usuario')
        .select('xp_acumulado')
        .eq('usuario_id', datos.usuario_id)
        .eq('cancion_id', datos.cancion_id)
        .single();

      return {
        xp_ganado: scoreGuardado?.xp_ganado || 0,
        xp_acumulado_cancion: cancionXpData?.xp_acumulado || 0,
        es_mejor_personal,
        score_id: scoreGuardado?.id,
        es_nuevo: recordAnterior === 0,
        monedas_ganadas,
        saldo_monedas: saldoData?.saldo || 0
      };

    } catch (err) {
      console.error('Error en scoresHeroService.guardarScoreGame:', err);
      return null;
    }
  },

  /**
   * Obtiene las ultimas 10 partidas de una canción para un usuario
   */
  obtenerHistorialCancion: async (usuario_id: string, cancion_id: string) => {
    try {
      const { data, error } = await supabase
        .from('scores_hero')
        .select('*')
        .eq('usuario_id', usuario_id)
        .eq('cancion_id', cancion_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Obtener el récord absoluto para destacarlo
      const maxScore = data && data.length > 0 
        ? Math.max(...data.map((d: any) => d.puntuacion)) 
        : 0;

      return {
        historial: data || [],
        mejorPuntuacion: maxScore
      };
    } catch (err) {
      console.error('Error obteniendo historial:', err);
      return { historial: [], mejorPuntuacion: 0 };
    }
  },

  /**
   * Obtiene la experiencia de un usuario (para el Perfil)
   */
  obtenerExperienciaUsuario: async (usuario_id: string) => {
    try {
      const { data, error } = await supabase
        .from('experiencia_usuario')
        .select('*')
        .eq('usuario_id', usuario_id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found, the trigger might create it later or user has 0 xp.
          return {
            xp_simulador: 0,
            xp_cursos: 0,
            xp_comunidad: 0,
            xp_logros: 0,
            xp_total: 0,
            nivel: 1
          };
        }
        throw error;
      }
      return data;
    } catch (err) {
      console.error('Error en obtenerExperienciaUsuario:', err);
      return {
        xp_simulador: 0,
        xp_cursos: 0,
        xp_comunidad: 0,
        xp_logros: 0,
        xp_total: 0,
        nivel: 1
      };
    }
  }
};
