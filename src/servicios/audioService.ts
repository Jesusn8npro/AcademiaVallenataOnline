/**
 * 🎵 ACADEMIA VALLENATA ONLINE - SERVICIO DE AUDIO
 * =====================================================
 * Servicio para manejo de audio en el simulador
 * Reproducción, grabación y sincronización de audio
 * Integración con Web Audio API
 * =====================================================
 */

// =====================================================
// 🎯 TIPOS DE DATOS
// =====================================================

export interface ConfiguracionAudio {
  volumen: number;
  tolerancia_timing_ms: number;
  usar_metronomo: boolean;
  auto_cuantizar: boolean;
  buffer_size: number;
  sample_rate: number;
}

export interface EstadoReproduccion {
  reproduciendo: boolean;
  pausado: boolean;
  tiempo_actual_ms: number;
  duracion_total_ms: number;
  posicion_porcentaje: number;
}

export interface EventoAudio {
  tipo: 'play' | 'pause' | 'stop' | 'time_update' | 'ended' | 'error' | 'loaded';
  tiempo_ms: number;
  datos?: any;
}

export interface ArchivoAudio {
  url: string;
  buffer: AudioBuffer | null;
  duracion_segundos: number;
  cargado: boolean;
}

// =====================================================
// 🎵 SERVICIO DE AUDIO
// =====================================================

export class AudioService {
  private static instancia: AudioService;
  private contextoAudio: AudioContext | null = null;
  private nodoVolumen: GainNode | null = null;
  private nodoDestino: AudioDestinationNode | null = null;
  
  // Control de reproducción
  private fuenteAudio: AudioBufferSourceNode | null = null;
  private archivoActual: ArchivoAudio | null = null;
  private inicioReproduccion: number = 0;
  private tiempoOffset: number = 0;
  private intervalId: number | null = null;
  
  // Configuración
  private configuracion: ConfiguracionAudio = {
    volumen: 0.8,
    tolerancia_timing_ms: 150,
    usar_metronomo: false,
    auto_cuantizar: false,
    buffer_size: 4096,
    sample_rate: 44100
  };
  
  // Estado
  private estado: EstadoReproduccion = {
    reproduciendo: false,
    pausado: false,
    tiempo_actual_ms: 0,
    duracion_total_ms: 0,
    posicion_porcentaje: 0
  };
  
  // Eventos
  private listeners: { [key: string]: ((evento: EventoAudio) => void)[] } = {};

  private constructor() {}

  /**
   * 🎯 Singleton - Obtener instancia única
   */
  static obtenerInstancia(): AudioService {
    if (!AudioService.instancia) {
      AudioService.instancia = new AudioService();
    }
    return AudioService.instancia;
  }

  // =====================================================
  // 🚀 INICIALIZACIÓN
  // =====================================================

  /**
   * 🎵 Inicializar contexto de audio
   */
  async inicializar(): Promise<boolean> {
    try {
      // Verificar compatibilidad
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        return false;
      }

      // Crear contexto de audio
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.contextoAudio = new AudioContextClass();
      
      // Configurar nodos
      this.nodoVolumen = this.contextoAudio.createGain();
      this.nodoVolumen.gain.value = this.configuracion.volumen;
      
      this.nodoDestino = this.contextoAudio.destination;
      this.nodoVolumen.connect(this.nodoDestino);
      
      // Activar contexto si está suspendido
      if (this.contextoAudio.state === 'suspended') {
        await this.contextoAudio.resume();
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 🔧 Configurar audio
   */
  configurarAudio(configuracion: Partial<ConfiguracionAudio>): void {
    this.configuracion = { ...this.configuracion, ...configuracion };
    
    // Aplicar volumen
    if (this.nodoVolumen && configuracion.volumen !== undefined) {
      this.nodoVolumen.gain.value = configuracion.volumen;
    }
    
  }

  /**
   * 📊 Obtener estado actual
   */
  obtenerEstado(): EstadoReproduccion {
    return { ...this.estado };
  }

  // =====================================================
  // 🎵 GESTIÓN DE ARCHIVOS
  // =====================================================

  /**
   * 📂 Cargar archivo de audio
   */
  async cargarAudio(url: string): Promise<ArchivoAudio | null> {
    try {
      
      if (!this.contextoAudio) {
        await this.inicializar();
      }

      // Fetch del archivo
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Error cargando archivo: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.contextoAudio!.decodeAudioData(arrayBuffer);

      const archivo: ArchivoAudio = {
        url,
        buffer: audioBuffer,
        duracion_segundos: audioBuffer.duration,
        cargado: true
      };

      this.archivoActual = archivo;
      this.estado.duracion_total_ms = audioBuffer.duration * 1000;

        duracion: archivo.duracion_segundos,
        canales: audioBuffer.numberOfChannels,
        sample_rate: audioBuffer.sampleRate
      });

      this.emitirEvento('loaded', { archivo });
      return archivo;
    } catch (error) {
      this.emitirEvento('error', { error });
      return null;
    }
  }

  /**
   * 🔄 Precargar múltiples archivos
   */
  async precargarArchivos(urls: string[]): Promise<ArchivoAudio[]> {
    const archivos: ArchivoAudio[] = [];
    
    for (const url of urls) {
      const archivo = await this.cargarAudio(url);
      if (archivo) {
        archivos.push(archivo);
      }
    }
    
    return archivos;
  }

  // =====================================================
  // 🎮 CONTROL DE REPRODUCCIÓN
  // =====================================================

  /**
   * ▶️ Reproducir audio
   */
  async reproducir(tiempoInicio: number = 0): Promise<boolean> {
    try {
      if (!this.contextoAudio || !this.archivoActual?.buffer) {
        return false;
      }

      // Detener reproducción actual
      this.detener();

      // Crear nueva fuente
      this.fuenteAudio = this.contextoAudio.createBufferSource();
      this.fuenteAudio.buffer = this.archivoActual.buffer;
      this.fuenteAudio.connect(this.nodoVolumen!);

      // Configurar eventos
      this.fuenteAudio.onended = () => {
        this.estado.reproduciendo = false;
        this.emitirEvento('ended', {});
        this.limpiarIntervalo();
      };

      // Iniciar reproducción
      this.tiempoOffset = tiempoInicio;
      this.inicioReproduccion = this.contextoAudio.currentTime;
      this.fuenteAudio.start(0, tiempoInicio);

      // Actualizar estado
      this.estado.reproduciendo = true;
      this.estado.pausado = false;
      this.estado.tiempo_actual_ms = tiempoInicio * 1000;

      // Iniciar tracking de tiempo
      this.iniciarTrackingTiempo();

      this.emitirEvento('play', { tiempo_ms: tiempoInicio * 1000 });
      return true;
    } catch (error) {
      this.emitirEvento('error', { error });
      return false;
    }
  }

  /**
   * ⏸️ Pausar reproducción
   */
  pausar(): void {
    if (!this.estado.reproduciendo) return;

    this.detener();
    this.estado.pausado = true;
    this.estado.reproduciendo = false;
    
    this.emitirEvento('pause', { tiempo_ms: this.estado.tiempo_actual_ms });
  }

  /**
   * ⏹️ Detener reproducción
   */
  detener(): void {
    if (this.fuenteAudio) {
      try {
        this.fuenteAudio.stop();
        this.fuenteAudio.disconnect();
      } catch (error) {
        // Ignorar errores al detener
      }
      this.fuenteAudio = null;
    }

    this.estado.reproduciendo = false;
    this.estado.pausado = false;
    this.limpiarIntervalo();
    
    this.emitirEvento('stop', { tiempo_ms: this.estado.tiempo_actual_ms });
  }

  /**
   * 🎯 Saltar a posición específica
   */
  async saltarA(tiempoSegundos: number): Promise<boolean> {
    const estabaReproduciendo = this.estado.reproduciendo;
    
    this.detener();
    this.tiempoOffset = tiempoSegundos;
    this.estado.tiempo_actual_ms = tiempoSegundos * 1000;
    this.actualizarPorcentaje();
    
    if (estabaReproduciendo) {
      return await this.reproducir(tiempoSegundos);
    }
    
    return true;
  }

  /**
   * 🔊 Cambiar volumen
   */
  cambiarVolumen(volumen: number): void {
    if (volumen < 0) volumen = 0;
    if (volumen > 1) volumen = 1;
    
    this.configuracion.volumen = volumen;
    
    if (this.nodoVolumen) {
      this.nodoVolumen.gain.value = volumen;
    }
    
  }

  // =====================================================
  // 📊 TRACKING DE TIEMPO
  // =====================================================

  /**
   * ⏰ Iniciar tracking de tiempo
   */
  private iniciarTrackingTiempo(): void {
    this.limpiarIntervalo();
    
    this.intervalId = window.setInterval(() => {
      if (this.contextoAudio && this.estado.reproduciendo) {
        const tiempoTranscurrido = this.contextoAudio.currentTime - this.inicioReproduccion;
        this.estado.tiempo_actual_ms = (this.tiempoOffset + tiempoTranscurrido) * 1000;
        
        // Verificar si se terminó
        if (this.estado.tiempo_actual_ms >= this.estado.duracion_total_ms) {
          this.detener();
          return;
        }
        
        this.actualizarPorcentaje();
        this.emitirEvento('time_update', { tiempo_ms: this.estado.tiempo_actual_ms });
      }
    }, 10); // Actualizar cada 10ms para precisión
  }

  /**
   * 🧹 Limpiar intervalo de tracking
   */
  private limpiarIntervalo(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 📊 Actualizar porcentaje de progreso
   */
  private actualizarPorcentaje(): void {
    if (this.estado.duracion_total_ms > 0) {
      this.estado.posicion_porcentaje = 
        (this.estado.tiempo_actual_ms / this.estado.duracion_total_ms) * 100;
    }
  }

  // =====================================================
  // 🎵 METRÓNOMO
  // =====================================================

  /**
   * 🥁 Crear metrónomo
   */
  crearMetronomo(bpm: number): { iniciar: () => void; detener: () => void } {
    let intervaloMetronomo: number | null = null;
    const intervalMs = (60 / bpm) * 1000;
    
    const iniciar = () => {
      if (intervaloMetronomo) return;
      
      intervaloMetronomo = window.setInterval(() => {
        this.reproducirClickMetronomo();
      }, intervalMs);
    };
    
    const detener = () => {
      if (intervaloMetronomo) {
        clearInterval(intervaloMetronomo);
        intervaloMetronomo = null;
      }
    };
    
    return { iniciar, detener };
  }

  /**
   * 🎵 Reproducir click del metrónomo
   */
  private reproducirClickMetronomo(): void {
    if (!this.contextoAudio) return;
    
    const oscillator = this.contextoAudio.createOscillator();
    const gainNode = this.contextoAudio.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.nodoVolumen!);
    
    oscillator.frequency.value = 800; // Frecuencia del click
    gainNode.gain.setValueAtTime(0.1, this.contextoAudio.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.contextoAudio.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(this.contextoAudio.currentTime + 0.1);
  }

  // =====================================================
  // 🎯 GESTIÓN DE EVENTOS
  // =====================================================

  /**
   * 📡 Suscribirse a eventos
   */
  suscribirseA(evento: string, callback: (evento: EventoAudio) => void): void {
    if (!this.listeners[evento]) {
      this.listeners[evento] = [];
    }
    this.listeners[evento].push(callback);
  }

  /**
   * 📡 Desuscribirse de eventos
   */
  desuscribirseDe(evento: string, callback: (evento: EventoAudio) => void): void {
    if (this.listeners[evento]) {
      this.listeners[evento] = this.listeners[evento].filter(cb => cb !== callback);
    }
  }

  /**
   * 📡 Emitir evento
   */
  private emitirEvento(tipo: EventoAudio['tipo'], datos: any = {}): void {
    const evento: EventoAudio = {
      tipo,
      tiempo_ms: this.estado.tiempo_actual_ms,
      datos
    };

    if (this.listeners[tipo]) {
      this.listeners[tipo].forEach(callback => {
        try {
          callback(evento);
        } catch (error) {
        }
      });
    }
  }

  // =====================================================
  // 🧹 LIMPIEZA
  // =====================================================

  /**
   * 🧹 Destruir instancia
   */
  destruir(): void {
    this.detener();
    this.limpiarIntervalo();
    
    if (this.contextoAudio) {
      try {
        this.contextoAudio.close();
      } catch (error) {
      }
    }
    
    this.contextoAudio = null;
    this.nodoVolumen = null;
    this.nodoDestino = null;
    this.archivoActual = null;
    this.listeners = {};
    
  }

  // =====================================================
  // 🎯 UTILIDADES
  // =====================================================

  /**
   * 🎵 Formatear tiempo
   */
  static formatearTiempo(milisegundos: number): string {
    const segundos = Math.floor(milisegundos / 1000);
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    
    return `${minutos}:${segs.toString().padStart(2, '0')}`;
  }

  /**
   * 🎵 Convertir BPM a milisegundos
   */
  static bpmAMilisegundos(bpm: number): number {
    return (60 / bpm) * 1000;
  }

  /**
   * 🎯 Verificar si está en ventana de timing
   */
  static estaEnVentanaTiming(tiempoEsperado: number, tiempoReal: number, tolerancia: number): boolean {
    const diferencia = Math.abs(tiempoEsperado - tiempoReal);
    return diferencia <= tolerancia;
  }

  /**
   * 🎵 Cuantizar timestamp a grid
   */
  static cuantizarTimestamp(timestamp: number, bpm: number, subdivision: number = 16): number {
    const beatMs = AudioService.bpmAMilisegundos(bpm);
    const gridMs = beatMs / subdivision;
    
    return Math.round(timestamp / gridMs) * gridMs;
  }

  /**
   * 📏 Obtener solo la duración del archivo de audio
   */
  static obtenerDuracionArchivo(archivo: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      const url = URL.createObjectURL(archivo);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        resolve(audio.duration);
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Error cargando archivo de audio'));
      };
      
      audio.src = url;
    });
  }
}

export default AudioService; 