/**
 * 🎵 SERVICIO DE STORAGE - ACADEMIA VALLENATA ONLINE
 * ================================================
 * Gestión de archivos en Supabase Storage
 * Verificación y creación de buckets
 * ================================================
 */

import { supabase } from '$servicios/clienteSupabase';

export class StorageService {
  static readonly BUCKET_CANCIONES = 'simulador-acordeon';
  static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  static readonly ALLOWED_TYPES = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg'];

  /**
   * Verificar si el bucket existe y crearlo si es necesario
   */
  static async verificarYCrearBucket(): Promise<boolean> {
    try {

      // Intentar listar archivos del bucket
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CANCIONES)
        .list('', { limit: 1 });

      if (!error) {
        return true;
      }

      // Si el bucket no existe, intentar crearlo
      const { data: bucketData, error: createError } = await supabase.storage
        .createBucket(this.BUCKET_CANCIONES, {
          public: true,
          fileSizeLimit: this.MAX_FILE_SIZE,
          allowedMimeTypes: this.ALLOWED_TYPES
        });

      if (createError) {
        return false;
      }

      return true;

    } catch (error) {
      return false;
    }
  }

  /**
   * Subir archivo de audio al bucket
   */
  static async subirArchivo(
    archivo: File, 
    ruta: string,
    onProgress?: (progress: number) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Verificar que el bucket existe
      const bucketOk = await this.verificarYCrearBucket();
      if (!bucketOk) {
        return { success: false, error: 'No se pudo acceder al storage' };
      }

      // Validar archivo
      const validacion = this.validarArchivo(archivo);
      if (!validacion.valido) {
        return { success: false, error: validacion.error };
      }


      // Simular progreso si se proporciona callback
      if (onProgress) {
        onProgress(10);
      }

      // Subir archivo
      const { data, error } = await supabase.storage
        .from(this.BUCKET_CANCIONES)
        .upload(ruta, archivo, {
          cacheControl: '3600',
          upsert: false
        });

      if (onProgress) {
        onProgress(70);
      }

      if (error) {
        return { success: false, error: error.message };
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_CANCIONES)
        .getPublicUrl(ruta);

      if (onProgress) {
        onProgress(100);
      }

      return { success: true, url: publicUrl };

    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validar archivo antes de subir
   */
  static validarArchivo(archivo: File): { valido: boolean; error?: string } {
    // Validar tipo
    if (!this.ALLOWED_TYPES.includes(archivo.type)) {
      return { 
        valido: false, 
        error: `Tipo de archivo no permitido. Usa: ${this.ALLOWED_TYPES.join(', ')}` 
      };
    }

    // Validar tamaño
    if (archivo.size > this.MAX_FILE_SIZE) {
      const maxMB = this.MAX_FILE_SIZE / (1024 * 1024);
      return { 
        valido: false, 
        error: `Archivo muy grande. Máximo ${maxMB}MB permitido` 
      };
    }

    return { valido: true };
  }

  /**
   * Generar nombre único para archivo
   */
  static generarNombreArchivo(titulo: string, usuarioId: string, extension: string): string {
    const timestamp = Date.now();
    const tituloLimpio = titulo
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 30);
    
    return `canciones/${usuarioId}/${tituloLimpio}-${timestamp}.${extension}`;
  }

  /**
   * Eliminar archivo del storage
   */
  static async eliminarArchivo(ruta: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_CANCIONES)
        .remove([ruta]);

      if (error) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtener información del bucket
   */
  static async obtenerInfoBucket(): Promise<any> {
    try {
      const { data, error } = await supabase.storage
        .getBucket(this.BUCKET_CANCIONES);

      if (error) {
        return null;
      }

      return data;
    } catch (error) {
      return null;
    }
  }
}

export default StorageService; 
