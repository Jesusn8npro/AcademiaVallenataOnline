import { Howl, Howler } from 'howler';
import type { CancionUniversal } from '../supabase/adaptadorCanciones';

/**
 * Sistema de reproducción de audio sincronizado con secuencias del acordeón
 */

export interface EventoReproduccion {
  tipo: 'play' | 'pause' | 'stop' | 'seek' | 'end' | 'error';
  tiempo?: number;
  data?: any;
}

export interface ConfiguracionReproduccion {
  volumen?: number;
  velocidad?: number;
  offsetInicial?: number;
  sincronizarSecuencias?: boolean;
  mostrarNotas?: boolean;
  autoRepetir?: boolean;
}

export class ReproductorAudioSincronizado {
  private audio: Howl | null = null;
  private cancionActual: CancionUniversal | null = null;
  private configuracion: ConfiguracionReproduccion = {};
  private listeners: Map<string, Function[]> = new Map();
  
  // Estado del reproductor
  private reproduciendo: boolean = false;
  private pausado: boolean = false;
  private tiempoActual: number = 0;
  private duracionTotal: number = 0;
  
  // Sincronización de secuencias
  private intervalSincronizacion: number | null = null;
  private secuenciaActual: any[] = [];
  private notasActivas: Map<string, any> = new Map();
  
  constructor() {
    this.inicializarEventos();
  }
  
  /**
   * Cargar canción
   */
  async cargarCancion(cancion: CancionUniversal, configuracion?: ConfiguracionReproduccion): Promise<boolean> {
    try {
      console.log(`🎵 Cargando canción: ${cancion.titulo}`);
      
      // Detener reproducción anterior
      this.detener();
      
      // Verificar si tiene audio
      if (!cancion.audio_url) {
        console.log('⚠️ Canción sin audio, solo secuencias');
        return this.cargarSoloSecuencias(cancion, configuracion);
      }
      
      // Cargar audio con Howler
      this.audio = new Howl({
        src: [cancion.audio_url],
        html5: true,
        preload: true,
        volume: configuracion?.volumen || 0.8,
        rate: configuracion?.velocidad || 1.0,
        onload: () => {
          console.log('✅ Audio cargado correctamente');
          this.duracionTotal = this.audio?.duration() || 0;
          this.emitirEvento('load', { duracion: this.duracionTotal });
        },
        onplay: () => {
          console.log('▶️ Reproducción iniciada');
          this.reproduciendo = true;
          this.pausado = false;
          this.iniciarSincronizacion();
          this.emitirEvento('play');
        },
        onpause: () => {
          console.log('⏸️ Reproducción pausada');
          this.pausado = true;
          this.detenerSincronizacion();
          this.emitirEvento('pause');
        },
        onstop: () => {
          console.log('⏹️ Reproducción detenida');
          this.reproduciendo = false;
          this.pausado = false;
          this.detenerSincronizacion();
          this.limpiarNotasActivas();
          this.emitirEvento('stop');
        },
        onend: () => {
          console.log('🏁 Reproducción terminada');
          this.reproduciendo = false;
          this.pausado = false;
          this.detenerSincronizacion();
          this.limpiarNotasActivas();
          this.emitirEvento('end');
          
          // Auto-repetir si está configurado
          if (configuracion?.autoRepetir) {
            setTimeout(() => this.reproducir(), 100);
          }
                 }
      });
      
      // Configurar canción actual
      this.cancionActual = cancion;
      this.configuracion = configuracion || {};
      this.secuenciaActual = cancion.notas || [];
      
      console.log(`✅ Canción cargada: ${cancion.titulo} (${this.secuenciaActual.length} notas)`);
      return true;
      
    } catch (error) {
      console.error('❌ Error cargando canción:', error);
      return false;
    }
  }
  
  /**
   * Cargar solo secuencias (sin audio)
   */
  private async cargarSoloSecuencias(cancion: CancionUniversal, configuracion?: ConfiguracionReproduccion): Promise<boolean> {
    try {
      this.cancionActual = cancion;
      this.configuracion = configuracion || {};
      this.secuenciaActual = cancion.notas || [];
      this.duracionTotal = cancion.duracion || 0;
      
      console.log(`✅ Secuencias cargadas: ${cancion.titulo} (${this.secuenciaActual.length} notas)`);
      this.emitirEvento('load', { duracion: this.duracionTotal });
      return true;
      
    } catch (error) {
      console.error('❌ Error cargando secuencias:', error);
      return false;
    }
  }
  
  /**
   * Reproducir
   */
  reproducir(): void {
    if (!this.cancionActual) {
      console.error('❌ No hay canción cargada');
      return;
    }
    
    if (this.audio) {
      // Reproducir con audio
      this.audio.play();
    } else {
      // Reproducir solo secuencias
      console.log('▶️ Reproduciendo solo secuencias');
      this.reproduciendo = true;
      this.pausado = false;
      this.iniciarSincronizacion();
      this.emitirEvento('play');
    }
  }
  
  /**
   * Pausar
   */
  pausar(): void {
    if (this.audio) {
      this.audio.pause();
    } else if (this.reproduciendo) {
      this.pausado = true;
      this.detenerSincronizacion();
      this.emitirEvento('pause');
    }
  }
  
  /**
   * Detener
   */
  detener(): void {
    if (this.audio) {
      this.audio.stop();
    } else if (this.reproduciendo) {
      this.reproduciendo = false;
      this.pausado = false;
      this.tiempoActual = 0;
      this.detenerSincronizacion();
      this.limpiarNotasActivas();
      this.emitirEvento('stop');
    }
  }
  
  /**
   * Saltar a tiempo específico
   */
  saltarA(tiempo: number): void {
    if (this.audio) {
      this.audio.seek(tiempo);
    } else {
      this.tiempoActual = tiempo;
      this.emitirEvento('seek', { tiempo });
    }
  }
  
  /**
   * Configurar volumen
   */
  configurarVolumen(volumen: number): void {
    if (this.audio) {
      this.audio.volume(volumen);
    }
    this.configuracion.volumen = volumen;
  }
  
  /**
   * Configurar velocidad
   */
  configurarVelocidad(velocidad: number): void {
    if (this.audio) {
      this.audio.rate(velocidad);
    }
    this.configuracion.velocidad = velocidad;
  }
  
  /**
   * Obtener tiempo actual
   */
  obtenerTiempoActual(): number {
    if (this.audio) {
      return this.audio.seek() || 0;
    }
    return this.tiempoActual;
  }
  
  /**
   * Obtener duración total
   */
  obtenerDuracionTotal(): number {
    return this.duracionTotal;
  }
  
  /**
   * Verificar si está reproduciendo
   */
  estaReproduciendo(): boolean {
    return this.reproduciendo && !this.pausado;
  }
  
  /**
   * Obtener información de la canción actual
   */
  obtenerCancionActual(): CancionUniversal | null {
    return this.cancionActual;
  }
  
  /**
   * Obtener notas activas en tiempo real
   */
  obtenerNotasActivas(): Map<string, any> {
    return this.notasActivas;
  }
  
  /**
   * Suscribirse a eventos
   */
  suscribirseA(evento: string, callback: Function): void {
    if (!this.listeners.has(evento)) {
      this.listeners.set(evento, []);
    }
    this.listeners.get(evento)!.push(callback);
  }
  
  /**
   * Desuscribirse de eventos
   */
  desuscribirseDeEvento(evento: string, callback: Function): void {
    const callbacks = this.listeners.get(evento);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }
  
  /**
   * Limpiar recursos
   */
  limpiar(): void {
    this.detener();
    
    if (this.audio) {
      this.audio.unload();
      this.audio = null;
    }
    
    this.cancionActual = null;
    this.secuenciaActual = [];
    this.notasActivas.clear();
    this.listeners.clear();
  }
  
  // ===============================
  // MÉTODOS PRIVADOS
  // ===============================
  
  private inicializarEventos(): void {
    // Configurar Howler globalmente
    Howler.volume(0.8);
    Howler.autoUnlock = true;
  }
  
  private iniciarSincronizacion(): void {
    if (this.intervalSincronizacion) {
      clearInterval(this.intervalSincronizacion);
    }
    
    this.intervalSincronizacion = setInterval(() => {
      this.actualizarSincronizacion();
    }, 16) as unknown as number; // ~60 FPS
  }
  
  private detenerSincronizacion(): void {
    if (this.intervalSincronizacion) {
      clearInterval(this.intervalSincronizacion);
      this.intervalSincronizacion = null;
    }
  }
  
  private actualizarSincronizacion(): void {
    if (!this.reproduciendo || this.pausado) return;
    
    // Actualizar tiempo actual
    if (this.audio) {
      this.tiempoActual = this.audio.seek() || 0;
    } else {
      this.tiempoActual += 0.016; // 16ms
    }
    
    // Aplicar offset si está configurado
    const tiempoConOffset = this.tiempoActual + (this.configuracion.offsetInicial || 0);
    
    // Sincronizar secuencias
    if (this.configuracion.sincronizarSecuencias !== false) {
      this.sincronizarSecuencias(tiempoConOffset);
    }
    
    // Emitir evento de actualización de tiempo
    this.emitirEvento('timeupdate', { 
      tiempo: this.tiempoActual,
      tiempoConOffset: tiempoConOffset,
      notasActivas: this.notasActivas.size
    });
  }
  
  private sincronizarSecuencias(tiempo: number): void {
    const tolerancia = 0.05; // 50ms de tolerancia
    
    for (const nota of this.secuenciaActual) {
      const tiempoNota = nota.tiempo;
      const duracionNota = nota.duracion || 0.5;
      const tiempoFin = tiempoNota + duracionNota;
      
      // Verificar si la nota debe activarse
      if (tiempo >= tiempoNota - tolerancia && tiempo <= tiempoFin + tolerancia) {
        if (!this.notasActivas.has(nota.idBoton)) {
          this.activarNota(nota);
        }
      } else {
        // Desactivar nota si ya pasó su tiempo
        if (this.notasActivas.has(nota.idBoton) && tiempo > tiempoFin + tolerancia) {
          this.desactivarNota(nota);
        }
      }
    }
  }
  
  private activarNota(nota: any): void {
    this.notasActivas.set(nota.idBoton, nota);
    this.emitirEvento('nota_activada', { nota });
  }
  
  private desactivarNota(nota: any): void {
    this.notasActivas.delete(nota.idBoton);
    this.emitirEvento('nota_desactivada', { nota });
  }
  
  private limpiarNotasActivas(): void {
    for (const [idBoton, nota] of this.notasActivas) {
      this.emitirEvento('nota_desactivada', { nota });
    }
    this.notasActivas.clear();
  }
  
  private emitirEvento(evento: string, data?: any): void {
    const callbacks = this.listeners.get(evento);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`❌ Error en callback de evento ${evento}:`, error);
        }
      });
    }
  }
}

// Instancia global del reproductor
export const reproductorGlobal = new ReproductorAudioSincronizado();

// Funciones de utilidad para integrar con el sistema existente
export function crearReproductorIntegrado(
  onNotaActivada?: (nota: any) => void,
  onNotaDesactivada?: (nota: any) => void,
  onTiempoActualizado?: (tiempo: number) => void
) {
  const reproductor = new ReproductorAudioSincronizado();
  
  // Suscribirse a eventos
  if (onNotaActivada) {
    reproductor.suscribirseA('nota_activada', (data: any) => onNotaActivada(data.nota));
  }
  
  if (onNotaDesactivada) {
    reproductor.suscribirseA('nota_desactivada', (data: any) => onNotaDesactivada(data.nota));
  }
  
  if (onTiempoActualizado) {
    reproductor.suscribirseA('timeupdate', (data: any) => onTiempoActualizado(data.tiempo));
  }
  
  return reproductor;
}

// Utilidades para el juego
export function crearReproductorParaJuego() {
  return crearReproductorIntegrado(
    (nota) => {
      console.log(`🎹 Nota activada: ${nota.idBoton} en ${nota.tiempo}s`);
    },
    (nota) => {
      console.log(`🎹 Nota desactivada: ${nota.idBoton}`);
    },
    (tiempo) => {
      // Actualizar UI del juego
    }
  );
} 