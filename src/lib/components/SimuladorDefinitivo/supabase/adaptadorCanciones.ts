import { browser } from '$app/environment';

export interface CancionUniversal {
  id: string;
  titulo: string;
  artista: string;
  genero: string;
  dificultad: string;
  descripcion: string;
  duracion: number;
  tempo: number;
  notas: any[];
  metadatos?: {
    creador?: string;
    fechaCreacion?: string;
    version?: string;
    esPersonalizada?: boolean;
    guardadoAutomatico?: boolean;
    totalNotas?: number;
    conAudio?: boolean;
    tipoGuardado?: string;
    [key: string]: any;
  };
}

export interface ResultadoOperacion {
  success: boolean;
  error?: string;
}

class AdaptadorCanciones {
  private canciones: CancionUniversal[] = [];
  private useSupabase: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.inicializar();
  }

  private inicializar(): void {
    if (browser) {
      this.cargarCancionesLocales();
      this.initialized = true;
    }
  }

  private cargarCancionesLocales(): void {
    try {
      const cancionesGuardadas = localStorage.getItem('canciones_editor');
      if (cancionesGuardadas) {
        this.canciones = JSON.parse(cancionesGuardadas);
      }
    } catch (error) {
      console.error('Error cargando canciones locales:', error);
      this.canciones = [];
    }
  }

  private guardarCancionesLocales(): void {
    try {
      localStorage.setItem('canciones_editor', JSON.stringify(this.canciones));
    } catch (error) {
      console.error('Error guardando canciones locales:', error);
    }
  }

  async agregarCancion(cancion: CancionUniversal): Promise<ResultadoOperacion> {
    try {
      // Verificar si ya existe
      const existeIndex = this.canciones.findIndex(c => c.id === cancion.id);
      
      if (existeIndex >= 0) {
        // Actualizar existente
        this.canciones[existeIndex] = cancion;
      } else {
        // Agregar nueva
        this.canciones.push(cancion);
      }
      
      this.guardarCancionesLocales();
      
      return { success: true };
    } catch (error) {
      console.error('Error agregando canción:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  async agregarCancionConAudio(cancion: CancionUniversal, audioFile: File): Promise<ResultadoOperacion> {
    try {
      // Por ahora, solo guardamos la canción sin el audio
      // En el futuro aquí se podría implementar el guardado del audio
      cancion.metadatos = {
        ...cancion.metadatos,
        conAudio: true,
        nombreArchivoAudio: audioFile.name,
        tamanoAudio: audioFile.size
      };
      
      return await this.agregarCancion(cancion);
    } catch (error) {
      console.error('Error agregando canción con audio:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      };
    }
  }

  async obtenerTodasLasCanciones(): Promise<CancionUniversal[]> {
    return [...this.canciones];
  }

  async eliminarCancion(id: string): Promise<boolean> {
    try {
      const index = this.canciones.findIndex(c => c.id === id);
      if (index >= 0) {
        this.canciones.splice(index, 1);
        this.guardarCancionesLocales();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error eliminando canción:', error);
      return false;
    }
  }

  async sincronizar(): Promise<void> {
    // Por ahora solo sincronización local
    this.guardarCancionesLocales();
  }

  configurarModo(useSupabase: boolean): void {
    this.useSupabase = useSupabase;
  }

  obtenerEstado(): { useSupabase: boolean; initialized: boolean } {
    return {
      useSupabase: this.useSupabase,
      initialized: this.initialized
    };
  }
}

export const adaptadorCanciones = new AdaptadorCanciones(); 