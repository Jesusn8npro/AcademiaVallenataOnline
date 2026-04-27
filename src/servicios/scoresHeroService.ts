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

      // 2. Obtener saldo antes del INSERT
      const { data: saldoAnteriorData } = await supabase
        .from('monedas_usuario')
        .select('saldo')
        .eq('usuario_id', datos.usuario_id)
        .single();
      const saldoAnterior = saldoAnteriorData?.saldo || 0;

      // 5. Obtener xp_acumulado real de la tabla xp_cancion_usuario antes
      const { data: cancionXpAnteriorData } = await supabase
        .from('xp_cancion_usuario')
        .select('xp_acumulado')
        .eq('usuario_id', datos.usuario_id)
        .eq('cancion_id', datos.cancion_id)
        .single();
      const xpAcumuladoAnterior = cancionXpAnteriorData?.xp_acumulado || 0;

      // 6. Hacer el INSERT 
      // Según precisión exacta (XP es insertado directo)
      let xpCalculado = 0;
      const precision = datos.precision_porcentaje;
      if (precision === 100) xpCalculado = 100; // llega al techo de una
      else if (precision >= 90) xpCalculado = 50;
      else if (precision >= 70) xpCalculado = 20;
      else if (precision >= 50) xpCalculado = 5;
      else xpCalculado = 0; // el trigger aplica penalización

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
        xp_ganado: xpCalculado
      };

      const { data: scoreGuardado, error: insertError } = await supabase
        .from('scores_hero')
        .insert(insertData as any)
        .select('*')
        .single();
        
      if (insertError) {
        return null;
      }

      // Obtener saldo actualizado después del trigger
      const { data: saldoData } = await supabase
        .from('monedas_usuario')
        .select('saldo')
        .eq('usuario_id', datos.usuario_id)
        .single();
        
      const saldoNuevo = saldoData?.saldo || 0;
      const monedas_ganadas = Math.max(0, saldoNuevo - saldoAnterior);

      // 7. Obtener xp_acumulado real DESPUES de transaccion
      const { data: cancionXpData } = await supabase
        .from('xp_cancion_usuario')
        .select('xp_acumulado')
        .eq('usuario_id', datos.usuario_id)
        .eq('cancion_id', datos.cancion_id)
        .single();
        
      const xpAcumuladoNuevo = cancionXpData?.xp_acumulado || 0;
      
      // La verdadera ganancia garantizada
      const xpGanadoReal = Math.max(0, xpAcumuladoNuevo - xpAcumuladoAnterior);

      return {
        xp_ganado: xpGanadoReal,
        xp_acumulado_cancion: xpAcumuladoNuevo,
        es_mejor_personal,
        score_id: scoreGuardado?.id,
        es_nuevo: recordAnterior === 0,
        monedas_ganadas,
        saldo_monedas: saldoNuevo
      };

    } catch (err) {
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
      return {
        xp_simulador: 0,
        xp_cursos: 0,
        xp_comunidad: 0,
        xp_logros: 0,
        xp_total: 0,
        nivel: 1
      };
    }
  },

  /**
   * Crea una nueva canción en la librería profesional (canciones_hero) 
   * a partir de una captura de Admin.
   */
  crearCancionHeroDesdeGrabacion: async (datos: {
    titulo: string;
    autor: string;
    descripcion: string;
    youtube_id: string;
    tipo: string;
    dificultad: string;
    secuencia: any[];
    bpm: number;
    tonalidad: string;
    audio_fondo_url: string | null;
  }) => {
    try {
      const { data, error } = await supabase
        .from('canciones_hero')
        .insert({
          titulo: datos.titulo,
          autor: datos.autor,
          descripcion: datos.descripcion,
          youtube_id: datos.youtube_id,
          tipo: datos.tipo,
          dificultad: datos.dificultad,
          secuencia: JSON.stringify(datos.secuencia),
          bpm: datos.bpm,
          tonalidad: datos.tonalidad,
          audio_fondo_url: datos.audio_fondo_url,
          estado: 'activo'
        })
        .select('*')
        .single();

      return { data, error };
    } catch (err: any) {
      return { data: null, error: err };
    }
  }
};
