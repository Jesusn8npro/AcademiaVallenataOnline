import { supabase } from '$lib/supabase/clienteSupabase';

// ===========================================
// 🎵 TIPOS DE DATOS PARA EL JUEGO
// ===========================================

export interface NotaCancion {
  timestamp_ms: number;
  duracion_ms: number;
  nota_id: string;
  nota_nombre: string;
  fuelle_direccion: 'halar' | 'empujar';
  es_acorde: boolean;
  notas_acorde: string[];
  intensidad: 'suave' | 'normal' | 'fuerte';
  es_opcional: boolean;
  tipo_nota: 'melodia' | 'bajo';
}

export interface MarcadoresTiempo {
  intro_hasta_segundo?: number;
  verso_desde_segundo?: number;
  verso_hasta_segundo?: number;
  coro_desde_segundo?: number;
  coro_hasta_segundo?: number;
  outro_desde_segundo?: number;
}

export interface SecuenciaCancion {
  id: string;
  cancion_id: string;
  nombre_secuencia: string;
  descripcion: string;
  tolerancia_timing_ms: number;
  notas_secuencia: NotaCancion[];
  marcadores_tiempo: MarcadoresTiempo;
  total_notas: number;
  duracion_total_ms: number;
  nivel_dificultad: number;
  estado: 'borrador' | 'activa' | 'pausada';
}

export interface CancionSimulador {
  id: string;
  titulo: string;
  artista: string;
  genero: string;
  nivel_dificultad: number;
  duracion_segundos: number;
  bpm: number;
  afinacion: string;
  url_audio: string;
  url_audio_backing?: string;
  url_audio_preview?: string;
  descripcion?: string;
  letra?: string;
  tags: string[];
  dificultad_tecnica: 'principiante' | 'intermedio' | 'avanzado' | 'experto';
  requiere_cambios_fuelle: boolean;
  requiere_acordes: boolean;
  requiere_bajos: boolean;
  xp_recompensa: number;
  monedas_recompensa: number;
  estado: 'borrador' | 'activa' | 'pausada' | 'archivada';
  es_publica: boolean;
  es_premium: boolean;
}

export interface CancionCompleta extends CancionSimulador {
  secuencias: SecuenciaCancion[];
}

// ===========================================
// 🎮 SERVICIO DE CANCIONES PARA JUEGO
// ===========================================

class CancionesJuegoService {
  
  /**
   * Obtiene todas las canciones activas y públicas
   */
  async obtenerCancionesDisponibles(): Promise<CancionSimulador[]> {
    try {
      const { data, error } = await supabase
        .from('canciones_simulador_acordeon')
        .select('*')
        .eq('estado', 'activa')
        .eq('es_publica', true)
        .order('orden_mostrar', { ascending: true });

      if (error) {
        console.error('Error obteniendo canciones:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en obtenerCancionesDisponibles:', error);
      throw error;
    }
  }

  /**
   * Obtiene una canción específica por ID
   */
  async obtenerCancionPorId(cancionId: string): Promise<CancionSimulador | null> {
    try {
      const { data, error } = await supabase
        .from('canciones_simulador_acordeon')
        .select('*')
        .eq('id', cancionId)
        .single();

      if (error) {
        console.error('Error obteniendo canción:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerCancionPorId:', error);
      throw error;
    }
  }

  /**
   * Obtiene las secuencias de una canción específica
   */
  async obtenerSecuenciasCancion(cancionId: string): Promise<SecuenciaCancion[]> {
    try {
      const { data, error } = await supabase
        .from('secuencias_canciones_acordeon')
        .select('*')
        .eq('cancion_id', cancionId)
        .eq('estado', 'activa')
        .order('es_secuencia_principal', { ascending: false });

      if (error) {
        console.error('Error obteniendo secuencias:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en obtenerSecuenciasCancion:', error);
      throw error;
    }
  }

  /**
   * Obtiene una canción completa con sus secuencias
   */
  async obtenerCancionCompleta(cancionId: string): Promise<CancionCompleta | null> {
    try {
      const cancion = await this.obtenerCancionPorId(cancionId);
      if (!cancion) return null;

      const secuencias = await this.obtenerSecuenciasCancion(cancionId);

      return {
        ...cancion,
        secuencias
      };
    } catch (error) {
      console.error('Error en obtenerCancionCompleta:', error);
      throw error;
    }
  }

  /**
   * Obtiene la secuencia principal de una canción
   */
  async obtenerSecuenciaPrincipal(cancionId: string): Promise<SecuenciaCancion | null> {
    try {
      const { data, error } = await supabase
        .from('secuencias_canciones_acordeon')
        .select('*')
        .eq('cancion_id', cancionId)
        .eq('estado', 'activa')
        .eq('es_secuencia_principal', true)
        .single();

      if (error) {
        console.error('Error obteniendo secuencia principal:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en obtenerSecuenciaPrincipal:', error);
      throw error;
    }
  }

  /**
   * Parsea y valida las notas de una secuencia
   */
  parseNotasSecuencia(secuencia: SecuenciaCancion): NotaCancion[] {
    try {
      if (!secuencia.notas_secuencia || !Array.isArray(secuencia.notas_secuencia)) {
        console.warn('Secuencia sin notas válidas:', secuencia.id);
        return [];
      }

      return secuencia.notas_secuencia.map((nota: any) => ({
        timestamp_ms: nota.timestamp_ms || 0,
        duracion_ms: nota.duracion_ms || 500,
        nota_id: nota.nota_id || '',
        nota_nombre: nota.nota_nombre || '',
        fuelle_direccion: nota.fuelle_direccion || 'halar',
        es_acorde: nota.es_acorde || false,
        notas_acorde: nota.notas_acorde || [],
        intensidad: nota.intensidad || 'normal',
        es_opcional: nota.es_opcional || false,
        tipo_nota: nota.tipo_nota || 'melodia'
      }));
    } catch (error) {
      console.error('Error parseando notas:', error);
      return [];
    }
  }

  /**
   * Filtra notas por tipo (melodía o bajo)
   */
  filtrarNotasPorTipo(notas: NotaCancion[], tipo: 'melodia' | 'bajo'): NotaCancion[] {
    return notas.filter(nota => nota.tipo_nota === tipo);
  }

  /**
   * Obtiene las notas en un rango de tiempo específico
   */
  obtenerNotasEnRango(notas: NotaCancion[], tiempoInicio: number, tiempoFin: number): NotaCancion[] {
    return notas.filter(nota => 
      nota.timestamp_ms >= tiempoInicio && 
      nota.timestamp_ms <= tiempoFin
    );
  }

  /**
   * Calcula estadísticas básicas de una secuencia
   */
  calcularEstadisticas(notas: NotaCancion[]) {
    const notasMelodia = this.filtrarNotasPorTipo(notas, 'melodia');
    const notasBajo = this.filtrarNotasPorTipo(notas, 'bajo');
    
    return {
      totalNotas: notas.length,
      notasMelodia: notasMelodia.length,
      notasBajo: notasBajo.length,
      duracionTotal: Math.max(...notas.map(n => n.timestamp_ms + n.duracion_ms)),
      tiempoInicio: Math.min(...notas.map(n => n.timestamp_ms)),
      notasAcordes: notas.filter(n => n.es_acorde).length,
      cambiosFuelle: this.contarCambiosFuelle(notas)
    };
  }

  /**
   * Cuenta los cambios de fuelle en una secuencia
   */
  private contarCambiosFuelle(notas: NotaCancion[]): number {
    let cambios = 0;
    let ultimaDireccion = '';
    
    for (const nota of notas) {
      if (ultimaDireccion && ultimaDireccion !== nota.fuelle_direccion) {
        cambios++;
      }
      ultimaDireccion = nota.fuelle_direccion;
    }
    
    return cambios;
  }
}

// Exportar instancia única del servicio
export const cancionesJuegoService = new CancionesJuegoService(); 