/**
 * 🎵 ACADEMIA VALLENATA ONLINE - SERVICIO DE SINCRONIZACIÓN
 * =====================================================
 * Servicio para grabación de secuencias de notas en tiempo real
 * Sincronización con audio para crear patrones de canciones
 * Estilo Guitar Hero para acordeón vallenato
 * =====================================================
 */

import AudioService from './audioService';
import type { NotaTemporizada } from './cancionesService';
import type { EventoAudio } from './audioService';

// =====================================================
// 🎯 TIPOS DE DATOS
// =====================================================

export interface ConfiguracionSincronizacion {
  tolerancia_ms: number;
  auto_cuantizar: boolean;
  usar_metronomo: boolean;
  bpm: number;
  subdivision: number;
  grabar_liberaciones: boolean;
  grabar_acordes: boolean;
  grabar_bajos: boolean;
}

export interface EstadoGrabacion {
  grabando: boolean;
  pausado: boolean;
  tiempo_inicio: number;
  duracion_grabacion: number;
  notas_grabadas: number;
  ultima_nota_ms: number;
}

export interface NotaGrabada {
  timestamp_ms: number;
  timestamp_relativo_ms: number;
  duracion_ms: number;
  nota_id: string;
  nota_nombre: string;
  fuelle_direccion: 'halar' | 'empujar';
  es_acorde: boolean;
  notas_acorde: string[];
  intensidad: 'suave' | 'normal' | 'fuerte';
  tipo_nota: 'melodia' | 'bajo';
  key_code?: string;
  timestamp_liberacion?: number;
}

export interface SesionGrabacion {
  id: string;
  timestamp_inicio: number;
  timestamp_fin?: number;
  duracion_total_ms: number;
  notas_grabadas: NotaGrabada[];
  configuracion: ConfiguracionSincronizacion;
  metadatos: {
    bpm?: number;
    afinacion?: string;
    nombre_cancion?: string;
    url_audio?: string;
  };
}

export interface MarcadorTiempo {
  nombre: string;
  timestamp_ms: number;
  tipo: 'intro' | 'verso' | 'coro' | 'puente' | 'outro' | 'custom';
  descripcion?: string;
}

export interface EventoSincronizacion {
  tipo: 'nota_grabada' | 'nota_liberada' | 'grabacion_iniciada' | 'grabacion_pausada' | 'grabacion_detenida' | 'marcador_agregado' | 'error';
  timestamp_ms: number;
  datos?: any;
}

// =====================================================
// 🎵 SERVICIO DE SINCRONIZACIÓN
// =====================================================

export class SincronizacionService {
  private static instancia: SincronizacionService;
  private audioService: AudioService;
  private metronomo: { iniciar: () => void; detener: () => void } | null = null;
  
  // Estado de grabación
  private estadoGrabacion: EstadoGrabacion = {
    grabando: false,
    pausado: false,
    tiempo_inicio: 0,
    duracion_grabacion: 0,
    notas_grabadas: 0,
    ultima_nota_ms: 0
  };
  
  // Configuración
  private configuracion: ConfiguracionSincronizacion = {
    tolerancia_ms: 150,
    auto_cuantizar: false,
    usar_metronomo: false,
    bpm: 120,
    subdivision: 16,
    grabar_liberaciones: true,
    grabar_acordes: true,
    grabar_bajos: true
  };
  
  // Datos de la sesión
  private sesionActual: SesionGrabacion | null = null;
  private notasTemporales: Map<string, NotaGrabada> = new Map();
  private marcadoresTiempo: MarcadorTiempo[] = [];
  
  // Eventos
  private listeners: { [key: string]: ((evento: EventoSincronizacion) => void)[] } = {};
  
  private constructor() {
    this.audioService = AudioService.obtenerInstancia();
    this.configurarEventosAudio();
  }

  /**
   * 🎯 Singleton - Obtener instancia única
   */
  static obtenerInstancia(): SincronizacionService {
    if (!SincronizacionService.instancia) {
      SincronizacionService.instancia = new SincronizacionService();
    }
    return SincronizacionService.instancia;
  }

  // =====================================================
  // 🚀 CONFIGURACIÓN E INICIALIZACIÓN
  // =====================================================

  /**
   * 🔧 Configurar sincronización
   */
  configurar(configuracion: Partial<ConfiguracionSincronizacion>): void {
    this.configuracion = { ...this.configuracion, ...configuracion };
    
    // Actualizar metrónomo si está activo
    if (this.metronomo && this.configuracion.usar_metronomo) {
      this.metronomo.detener();
      this.metronomo = this.audioService.crearMetronomo(this.configuracion.bpm);
      if (this.estadoGrabacion.grabando) {
        this.metronomo.iniciar();
      }
    }
    
    console.log('🔧 Configuración de sincronización actualizada:', this.configuracion);
  }

  /**
   * 🎵 Configurar eventos de audio
   */
  private configurarEventosAudio(): void {
    this.audioService.suscribirseA('play', (evento: EventoAudio) => {
      if (this.estadoGrabacion.grabando) {
        this.reanudarGrabacion();
      }
    });
    
    this.audioService.suscribirseA('pause', (evento: EventoAudio) => {
      if (this.estadoGrabacion.grabando) {
        this.pausarGrabacion();
      }
    });
    
    this.audioService.suscribirseA('stop', (evento: EventoAudio) => {
      if (this.estadoGrabacion.grabando) {
        this.detenerGrabacion();
      }
    });
  }

  /**
   * 📊 Obtener estado actual
   */
  obtenerEstado(): EstadoGrabacion {
    return { ...this.estadoGrabacion };
  }

  /**
   * 🔧 Obtener configuración actual
   */
  obtenerConfiguracion(): ConfiguracionSincronizacion {
    return { ...this.configuracion };
  }

  // =====================================================
  // 🎮 CONTROL DE GRABACIÓN
  // =====================================================

  /**
   * 🔴 Iniciar grabación
   */
  iniciarGrabacion(metadatos: SesionGrabacion['metadatos'] = {}): boolean {
    try {
      if (this.estadoGrabacion.grabando) {
        console.warn('Ya hay una grabación en curso');
        return false;
      }

      // Crear nueva sesión
      this.sesionActual = {
        id: `sesion_${Date.now()}`,
        timestamp_inicio: performance.now(),
        duracion_total_ms: 0,
        notas_grabadas: [],
        configuracion: { ...this.configuracion },
        metadatos
      };

      // Actualizar estado
      this.estadoGrabacion = {
        grabando: true,
        pausado: false,
        tiempo_inicio: performance.now(),
        duracion_grabacion: 0,
        notas_grabadas: 0,
        ultima_nota_ms: 0
      };

      // Iniciar metrónomo si está configurado
      if (this.configuracion.usar_metronomo) {
        this.metronomo = this.audioService.crearMetronomo(this.configuracion.bpm);
        this.metronomo.iniciar();
      }

      // Limpiar datos temporales
      this.notasTemporales.clear();
      this.marcadoresTiempo = [];

      console.log('🔴 Grabación iniciada:', this.sesionActual.id);
      this.emitirEvento('grabacion_iniciada', { sesion: this.sesionActual });
      return true;
    } catch (error) {
      console.error('❌ Error iniciando grabación:', error);
      this.emitirEvento('error', { error });
      return false;
    }
  }

  /**
   * ⏸️ Pausar grabación
   */
  pausarGrabacion(): void {
    if (!this.estadoGrabacion.grabando || this.estadoGrabacion.pausado) return;

    this.estadoGrabacion.pausado = true;
    this.estadoGrabacion.duracion_grabacion = performance.now() - this.estadoGrabacion.tiempo_inicio;

    // Pausar metrónomo
    if (this.metronomo) {
      this.metronomo.detener();
    }

    console.log('⏸️ Grabación pausada');
    this.emitirEvento('grabacion_pausada', { duracion: this.estadoGrabacion.duracion_grabacion });
  }

  /**
   * ▶️ Reanudar grabación
   */
  reanudarGrabacion(): void {
    if (!this.estadoGrabacion.grabando || !this.estadoGrabacion.pausado) return;

    this.estadoGrabacion.pausado = false;
    this.estadoGrabacion.tiempo_inicio = performance.now() - this.estadoGrabacion.duracion_grabacion;

    // Reanudar metrónomo
    if (this.metronomo && this.configuracion.usar_metronomo) {
      this.metronomo.iniciar();
    }

    console.log('▶️ Grabación reanudada');
    this.emitirEvento('grabacion_iniciada', { reanudada: true });
  }

  /**
   * ⏹️ Detener grabación
   */
  detenerGrabacion(): SesionGrabacion | null {
    if (!this.estadoGrabacion.grabando) return null;

    try {
      // Finalizar sesión
      if (this.sesionActual) {
        this.sesionActual.timestamp_fin = performance.now();
        this.sesionActual.duracion_total_ms = this.sesionActual.timestamp_fin - this.sesionActual.timestamp_inicio;
        
        // Procesar notas temporales pendientes
        this.procesarNotasTemporales();
        
        // Ordenar notas por timestamp
        this.sesionActual.notas_grabadas.sort((a, b) => a.timestamp_ms - b.timestamp_ms);
      }

      // Detener metrónomo
      if (this.metronomo) {
        this.metronomo.detener();
        this.metronomo = null;
      }

      // Resetear estado
      this.estadoGrabacion = {
        grabando: false,
        pausado: false,
        tiempo_inicio: 0,
        duracion_grabacion: 0,
        notas_grabadas: 0,
        ultima_nota_ms: 0
      };

      const sesionCompleta = this.sesionActual;
      this.sesionActual = null;

      console.log('⏹️ Grabación detenida:', sesionCompleta?.id);
      this.emitirEvento('grabacion_detenida', { sesion: sesionCompleta });
      return sesionCompleta;
    } catch (error) {
      console.error('❌ Error deteniendo grabación:', error);
      this.emitirEvento('error', { error });
      return null;
    }
  }

  // =====================================================
  // 🎵 GRABACIÓN DE NOTAS
  // =====================================================

  /**
   * 🎵 Grabar nota presionada
   */
  grabarNotaPresionada(nota: {
    nota_id: string;
    nota_nombre: string;
    fuelle_direccion: 'halar' | 'empujar';
    es_acorde: boolean;
    notas_acorde?: string[];
    tipo_nota: 'melodia' | 'bajo';
    key_code?: string;
    intensidad?: 'suave' | 'normal' | 'fuerte';
  }): boolean {
    if (!this.estadoGrabacion.grabando || this.estadoGrabacion.pausado) return false;

    try {
      // Filtrar si no se deben grabar ciertos tipos
      if (nota.tipo_nota === 'bajo' && !this.configuracion.grabar_bajos) return false;
      if (nota.es_acorde && !this.configuracion.grabar_acordes) return false;

      const ahora = performance.now();
      const tiempoRelativo = ahora - this.estadoGrabacion.tiempo_inicio;

      // Crear nota grabada
      const notaGrabada: NotaGrabada = {
        timestamp_ms: ahora,
        timestamp_relativo_ms: tiempoRelativo,
        duracion_ms: 0, // Se calculará al liberar
        nota_id: nota.nota_id,
        nota_nombre: nota.nota_nombre,
        fuelle_direccion: nota.fuelle_direccion,
        es_acorde: nota.es_acorde,
        notas_acorde: nota.notas_acorde || [],
        intensidad: nota.intensidad || 'normal',
        tipo_nota: nota.tipo_nota,
        key_code: nota.key_code
      };

      // Cuantizar si está configurado
      if (this.configuracion.auto_cuantizar) {
        notaGrabada.timestamp_relativo_ms = AudioService.cuantizarTimestamp(
          notaGrabada.timestamp_relativo_ms,
          this.configuracion.bpm,
          this.configuracion.subdivision
        );
      }

      // Almacenar temporalmente (para calcular duración)
      this.notasTemporales.set(nota.nota_id, notaGrabada);

      // Actualizar estadísticas
      this.estadoGrabacion.notas_grabadas++;
      this.estadoGrabacion.ultima_nota_ms = tiempoRelativo;

      console.log('🎵 Nota grabada:', notaGrabada.nota_nombre, 'en', tiempoRelativo + 'ms');
      this.emitirEvento('nota_grabada', { nota: notaGrabada });
      return true;
    } catch (error) {
      console.error('❌ Error grabando nota:', error);
      this.emitirEvento('error', { error });
      return false;
    }
  }

  /**
   * 🎵 Grabar nota liberada
   */
  grabarNotaLiberada(nota_id: string): boolean {
    if (!this.estadoGrabacion.grabando || this.estadoGrabacion.pausado) return false;
    if (!this.configuracion.grabar_liberaciones) return false;

    try {
      const notaTemporal = this.notasTemporales.get(nota_id);
      if (!notaTemporal) return false;

      const ahora = performance.now();
      const tiempoRelativo = ahora - this.estadoGrabacion.tiempo_inicio;

      // Calcular duración
      notaTemporal.duracion_ms = tiempoRelativo - notaTemporal.timestamp_relativo_ms;
      notaTemporal.timestamp_liberacion = ahora;

      // Validar duración mínima
      if (notaTemporal.duracion_ms < 50) {
        notaTemporal.duracion_ms = 50; // Duración mínima
      }

      // Mover a notas grabadas
      if (this.sesionActual) {
        this.sesionActual.notas_grabadas.push(notaTemporal);
      }
      this.notasTemporales.delete(nota_id);

      console.log('🎵 Nota liberada:', notaTemporal.nota_nombre, 'duración:', notaTemporal.duracion_ms + 'ms');
      this.emitirEvento('nota_liberada', { nota: notaTemporal });
      return true;
    } catch (error) {
      console.error('❌ Error grabando liberación:', error);
      this.emitirEvento('error', { error });
      return false;
    }
  }

  /**
   * 🎯 Procesar notas temporales pendientes
   */
  private procesarNotasTemporales(): void {
    if (this.notasTemporales.size === 0) return;

    const tiempoFinal = performance.now();
    const tiempoRelativoFinal = tiempoFinal - this.estadoGrabacion.tiempo_inicio;

    // Procesar notas que no se liberaron
    for (const [nota_id, nota] of this.notasTemporales) {
      // Calcular duración hasta el final
      nota.duracion_ms = tiempoRelativoFinal - nota.timestamp_relativo_ms;
      nota.timestamp_liberacion = tiempoFinal;

      // Validar duración mínima
      if (nota.duracion_ms < 100) {
        nota.duracion_ms = 100;
      }

      // Agregar a sesión
      if (this.sesionActual) {
        this.sesionActual.notas_grabadas.push(nota);
      }
    }

    this.notasTemporales.clear();
    console.log('🎯 Procesadas notas temporales pendientes');
  }

  // =====================================================
  // 🎯 MARCADORES DE TIEMPO
  // =====================================================

  /**
   * 📍 Agregar marcador de tiempo
   */
  agregarMarcador(marcador: Omit<MarcadorTiempo, 'timestamp_ms'>): boolean {
    if (!this.estadoGrabacion.grabando) return false;

    try {
      const tiempoRelativo = performance.now() - this.estadoGrabacion.tiempo_inicio;
      
      const nuevoMarcador: MarcadorTiempo = {
        ...marcador,
        timestamp_ms: tiempoRelativo
      };

      this.marcadoresTiempo.push(nuevoMarcador);
      this.marcadoresTiempo.sort((a, b) => a.timestamp_ms - b.timestamp_ms);

      console.log('📍 Marcador agregado:', nuevoMarcador.nombre, 'en', tiempoRelativo + 'ms');
      this.emitirEvento('marcador_agregado', { marcador: nuevoMarcador });
      return true;
    } catch (error) {
      console.error('❌ Error agregando marcador:', error);
      this.emitirEvento('error', { error });
      return false;
    }
  }

  /**
   * 📍 Obtener marcadores de tiempo
   */
  obtenerMarcadores(): MarcadorTiempo[] {
    return [...this.marcadoresTiempo];
  }

  // =====================================================
  // 🔄 CONVERSIÓN Y PROCESAMIENTO
  // =====================================================

  /**
   * 🔄 Convertir sesión a secuencia de notas
   */
  convertirSesionASecuencia(sesion: SesionGrabacion): NotaTemporizada[] {
    return sesion.notas_grabadas.map(nota => ({
      timestamp_ms: nota.timestamp_relativo_ms,
      duracion_ms: nota.duracion_ms,
      nota_id: nota.nota_id,
      nota_nombre: nota.nota_nombre,
      fuelle_direccion: nota.fuelle_direccion,
      es_acorde: nota.es_acorde,
      notas_acorde: nota.notas_acorde,
      intensidad: nota.intensidad,
      es_opcional: false,
      tipo_nota: nota.tipo_nota
    }));
  }

  /**
   * 🔄 Convertir marcadores a JSON
   */
  convertirMarcadoresAJSON(): Record<string, any> {
    const marcadores: Record<string, any> = {};
    
    this.marcadoresTiempo.forEach(marcador => {
      const key = `${marcador.tipo}_${marcador.nombre.toLowerCase().replace(/\s+/g, '_')}`;
      marcadores[key] = marcador.timestamp_ms / 1000; // Convertir a segundos
    });

    return marcadores;
  }

  /**
   * 🎵 Optimizar secuencia
   */
  optimizarSecuencia(notas: NotaTemporizada[]): NotaTemporizada[] {
    // Eliminar notas duplicadas
    const notasUnicas = new Map<string, NotaTemporizada>();
    
    notas.forEach(nota => {
      const key = `${nota.timestamp_ms}-${nota.nota_id}`;
      if (!notasUnicas.has(key) || notasUnicas.get(key)!.duracion_ms < nota.duracion_ms) {
        notasUnicas.set(key, nota);
      }
    });

    // Eliminar notas muy cortas
    const notasFiltradas = Array.from(notasUnicas.values())
      .filter(nota => nota.duracion_ms >= 50);

    // Ordenar por timestamp
    return notasFiltradas.sort((a, b) => a.timestamp_ms - b.timestamp_ms);
  }

  // =====================================================
  // 🎯 GESTIÓN DE EVENTOS
  // =====================================================

  /**
   * 📡 Suscribirse a eventos
   */
  suscribirseA(evento: string, callback: (evento: EventoSincronizacion) => void): void {
    if (!this.listeners[evento]) {
      this.listeners[evento] = [];
    }
    this.listeners[evento].push(callback);
  }

  /**
   * 📡 Desuscribirse de eventos
   */
  desuscribirseDe(evento: string, callback: (evento: EventoSincronizacion) => void): void {
    if (this.listeners[evento]) {
      this.listeners[evento] = this.listeners[evento].filter(cb => cb !== callback);
    }
  }

  /**
   * 📡 Emitir evento
   */
  private emitirEvento(tipo: EventoSincronizacion['tipo'], datos: any = {}): void {
    const evento: EventoSincronizacion = {
      tipo,
      timestamp_ms: performance.now(),
      datos
    };

    if (this.listeners[tipo]) {
      this.listeners[tipo].forEach(callback => {
        try {
          callback(evento);
        } catch (error) {
          console.error('Error ejecutando callback de evento:', error);
        }
      });
    }
  }

  // =====================================================
  // 🎯 UTILIDADES
  // =====================================================

  /**
   * 📊 Obtener estadísticas de la sesión
   */
  obtenerEstadisticasSesion(sesion: SesionGrabacion): {
    duracion_total_segundos: number;
    total_notas: number;
    notas_por_segundo: number;
    tipos_notas: Record<string, number>;
    duracion_promedio_notas: number;
    coverage_temporal: number;
  } {
    const duracionSegundos = sesion.duracion_total_ms / 1000;
    const totalNotas = sesion.notas_grabadas.length;
    
    const tiposNotas: Record<string, number> = {};
    let duracionTotalNotas = 0;
    
    sesion.notas_grabadas.forEach(nota => {
      tiposNotas[nota.tipo_nota] = (tiposNotas[nota.tipo_nota] || 0) + 1;
      duracionTotalNotas += nota.duracion_ms;
    });

    return {
      duracion_total_segundos: duracionSegundos,
      total_notas: totalNotas,
      notas_por_segundo: duracionSegundos > 0 ? totalNotas / duracionSegundos : 0,
      tipos_notas: tiposNotas,
      duracion_promedio_notas: totalNotas > 0 ? duracionTotalNotas / totalNotas : 0,
      coverage_temporal: duracionSegundos > 0 ? (duracionTotalNotas / 1000) / duracionSegundos : 0
    };
  }

  /**
   * 🧹 Limpiar datos
   */
  limpiar(): void {
    this.detenerGrabacion();
    this.notasTemporales.clear();
    this.marcadoresTiempo = [];
    this.listeners = {};
    
    console.log('🧹 Servicio de sincronización limpiado');
  }
}

export default SincronizacionService; 