import { adaptadorCanciones, type CancionUniversal } from './adaptadorCanciones';
import { browser } from '$app/environment';

/**
 * Servicio específico para el editor que integra Supabase
 */

export interface GrabacionConAudio {
  titulo: string;
  artista: string;
  genero: string;
  dificultad: string;
  descripcion: string;
  notas: any[];
  audioBlob?: Blob;
  audioFile?: File;
  metadatos?: any;
}

export class EditorSupabaseService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private grabandoAudio: boolean = false;
  
  /**
   * Iniciar grabación de audio
   */
  async iniciarGrabacionAudio(): Promise<boolean> {
    if (!browser) return false;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.grabandoAudio = true;
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = () => {
        console.log('🎙️ Grabación de audio detenida');
        this.grabandoAudio = false;
        
        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.mediaRecorder.start();
      console.log('🎙️ Grabación de audio iniciada');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error iniciando grabación de audio:', error);
      return false;
    }
  }
  
  /**
   * Detener grabación de audio
   */
  async detenerGrabacionAudio(): Promise<Blob | null> {
    if (!this.mediaRecorder || !this.grabandoAudio) return null;
    
    return new Promise((resolve) => {
      this.mediaRecorder!.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
        console.log(`🎙️ Audio grabado: ${(audioBlob.size / 1024).toFixed(2)} KB`);
        resolve(audioBlob);
      };
      
      this.mediaRecorder!.stop();
    });
  }
  
  /**
   * Crear archivo de audio desde Blob
   */
  crearArchivoAudio(audioBlob: Blob, titulo: string): File {
    const timestamp = Date.now();
    const filename = `${titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.wav`;
    return new File([audioBlob], filename, { type: 'audio/wav' });
  }
  
  /**
   * Guardar canción con audio
   */
  async guardarCancionConAudio(grabacion: GrabacionConAudio): Promise<{success: boolean, error?: string}> {
    try {
      console.log(`💾 Guardando canción con audio: ${grabacion.titulo}`);
      
      // Crear canción universal
      const cancion: CancionUniversal = {
        id: `cancion_${Date.now()}`,
        titulo: grabacion.titulo,
        artista: grabacion.artista,
        genero: grabacion.genero,
        dificultad: grabacion.dificultad,
        descripcion: grabacion.descripcion,
        duracion: this.calcularDuracion(grabacion.notas),
        tempo: 120,
        notas: grabacion.notas,
        metadatos: {
          creador: 'Editor',
          fechaCreacion: new Date().toISOString(),
          version: '2.0',
          esPersonalizada: true,
          guardadoAutomatico: false,
          totalNotas: grabacion.notas.length,
          conAudio: true,
          tipoGuardado: 'con_audio'
        }
      };
      
      if (grabacion.audioFile) {
        // Guardar con archivo de audio
        const resultado = await adaptadorCanciones.agregarCancionConAudio(cancion, grabacion.audioFile);
        if (resultado.success) {
          console.log('✅ Canción con audio guardada exitosamente');
          return { success: true };
        } else {
          console.error('❌ Error guardando con audio:', resultado.error);
          return { success: false, error: resultado.error };
        }
      } else {
        // Guardar solo secuencia
        const resultado = await adaptadorCanciones.agregarCancion(cancion);
        if (resultado.success) {
          console.log('✅ Canción guardada exitosamente (sin audio)');
          return { success: true };
        } else {
          console.error('❌ Error guardando sin audio:', resultado.error);
          return { success: false, error: resultado.error };
        }
      }
      
    } catch (error) {
      console.error('❌ Error guardando canción:', error);
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: mensaje };
    }
  }
  
  /**
   * Guardar canción sin audio (método existente)
   */
  async guardarCancionSinAudio(grabacion: GrabacionConAudio): Promise<{success: boolean, error?: string}> {
    try {
      console.log(`💾 Guardando canción sin audio: ${grabacion.titulo}`);
      
      const cancion: CancionUniversal = {
        id: `cancion_${Date.now()}`,
        titulo: grabacion.titulo,
        artista: grabacion.artista,
        genero: grabacion.genero,
        dificultad: grabacion.dificultad,
        descripcion: grabacion.descripcion,
        duracion: this.calcularDuracion(grabacion.notas),
        tempo: 120,
        notas: grabacion.notas,
        metadatos: {
          creador: 'Editor',
          fechaCreacion: new Date().toISOString(),
          version: '2.0',
          esPersonalizada: true,
          guardadoAutomatico: false,
          totalNotas: grabacion.notas.length,
          conAudio: false,
          tipoGuardado: 'sin_audio',
          ...(grabacion.metadatos || {})
        }
      };
      
      const resultado = await adaptadorCanciones.agregarCancion(cancion);
      if (resultado.success) {
        console.log('✅ Canción guardada exitosamente');
        return { success: true };
      } else {
        console.error('❌ Error guardando canción:', resultado.error);
        return { success: false, error: resultado.error };
      }
      
    } catch (error) {
      console.error('❌ Error guardando canción:', error);
      const mensaje = error instanceof Error ? error.message : 'Error desconocido';
      return { success: false, error: mensaje };
    }
  }
  
  /**
   * Obtener todas las canciones (para lista del editor)
   */
  async obtenerCanciones(): Promise<CancionUniversal[]> {
    try {
      const canciones = await adaptadorCanciones.obtenerTodasLasCanciones();
      
      // Filtrar solo canciones personalizadas
      return canciones.filter((cancion: CancionUniversal) => 
        cancion.metadatos?.creador === 'Editor' || 
        cancion.metadatos?.esPersonalizada === true
      );
      
    } catch (error) {
      console.error('❌ Error obteniendo canciones:', error);
      return [];
    }
  }
  
  /**
   * Eliminar canción
   */
  async eliminarCancion(id: string): Promise<boolean> {
    try {
      return await adaptadorCanciones.eliminarCancion(id);
    } catch (error) {
      console.error('❌ Error eliminando canción:', error);
      return false;
    }
  }
  
  /**
   * Exportar canción a JSON
   */
  exportarCancionJSON(cancion: CancionUniversal): void {
    try {
      const dataStr = JSON.stringify(cancion, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      const exportFileDefaultName = `${cancion.titulo.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      console.log(`📤 Canción exportada como ${exportFileDefaultName}`);
      
    } catch (error) {
      console.error('❌ Error exportando canción:', error);
    }
  }
  
  /**
   * Sincronizar con Supabase
   */
  async sincronizar(): Promise<void> {
    try {
      console.log('🔄 Sincronizando canciones con Supabase...');
      await adaptadorCanciones.sincronizar();
      console.log('✅ Sincronización completada');
    } catch (error) {
      console.error('❌ Error en sincronización:', error);
    }
  }
  
  /**
   * Configurar modo de operación
   */
  configurarModo(useSupabase: boolean): void {
    adaptadorCanciones.configurarModo(useSupabase);
  }
  
  /**
   * Verificar si está grabando audio
   */
  estaGrabandoAudio(): boolean {
    return this.grabandoAudio;
  }
  
  /**
   * Obtener estado del servicio
   */
  obtenerEstado(): { useSupabase: boolean; initialized: boolean; grabandoAudio: boolean } {
    return {
      ...adaptadorCanciones.obtenerEstado(),
      grabandoAudio: this.grabandoAudio
    };
  }
  
  // ===============================
  // MÉTODOS PRIVADOS
  // ===============================
  
  private calcularDuracion(notas: any[]): number {
    if (!notas || notas.length === 0) return 0;
    
    const duracionMaxima = Math.max(...notas.map(nota => 
      (nota.tiempo || 0) + (nota.duracion || 0)
    ));
    
    return Math.max(duracionMaxima, 10); // Mínimo 10 segundos
  }
}

// Instancia global del servicio
export const editorSupabase = new EditorSupabaseService();

// Función de utilidad para integrar con el editor existente
export function integrarConEditorExistente(
  funcionGuardarOriginal: (cancion: any) => void,
  funcionObtenerCancionesOriginal: () => any[]
) {
  return {
    async guardarCancion(cancion: any, audioFile?: File): Promise<boolean> {
      const grabacion: GrabacionConAudio = {
        titulo: cancion.titulo,
        artista: cancion.artista,
        genero: cancion.genero,
        dificultad: cancion.dificultad,
        descripcion: cancion.descripcion,
        notas: cancion.notas,
        audioFile: audioFile,
        metadatos: cancion.metadatos
      };
      
      if (audioFile) {
        const resultado = await editorSupabase.guardarCancionConAudio(grabacion);
        return resultado.success;
      } else {
        const resultado = await editorSupabase.guardarCancionSinAudio(grabacion);
        return resultado.success;
      }
    },
    
    async obtenerCanciones(): Promise<any[]> {
      try {
        const cancionesSupabase = await editorSupabase.obtenerCanciones();
        const cancionesLocales = funcionObtenerCancionesOriginal();
        
        // Combinar canciones, priorizando Supabase
        const combinadas = [...cancionesSupabase, ...cancionesLocales];
        
        // Eliminar duplicados por ID
        const unicas = combinadas.filter((cancion, index, arr) => 
          arr.findIndex(c => c.id === cancion.id) === index
        );
        
        return unicas;
        
      } catch (error) {
        console.error('❌ Error obteniendo canciones combinadas:', error);
        return funcionObtenerCancionesOriginal();
      }
    },
    
    async eliminarCancion(id: string): Promise<boolean> {
      return await editorSupabase.eliminarCancion(id);
    },
    
    async sincronizar(): Promise<void> {
      await editorSupabase.sincronizar();
    }
  };
} 