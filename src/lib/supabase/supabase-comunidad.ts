import { supabase } from '$lib/supabase/clienteSupabase';

/**
 * Verifica y crea el bucket 'comunidad' si no existe
 */
export async function verificarCrearBucketComunidad() {
  try {
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('comunidad');
    if (bucketError && bucketError.message.includes('not found')) {
      const { data: createData, error: createError } = await supabase.storage.createBucket('comunidad', {
        public: true,
      });
      if (createError) throw createError;
      console.log('Bucket "comunidad" creado correctamente');
    } else if (bucketError) {
      throw bucketError;
    } else {
      console.log('Bucket "comunidad" ya existe');
    }
    return { ok: true, message: 'Bucket "comunidad" verificado correctamente' };
  } catch (err: any) {
    console.error('Error al verificar/crear bucket:', err);
    return { ok: false, message: err.message || 'Error desconocido' };
  }
}

/**
 * Sube un archivo (imagen, video, gif) al bucket 'comunidad' y retorna la URL pública
 * @param file Archivo a subir
 * @param carpeta Carpeta dentro del bucket (opcional, por tipo)
 * @returns { url, error }
 */
export async function subirArchivoComunidad(file: File, carpeta: string = 'multimedia'): Promise<{ url: string | null, error: string | null }> {
  try {
    if (!file) return { url: null, error: 'No se proporcionó archivo' };
    const ext = file.name.split('.').pop();
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = `${carpeta}/${nombreUnico}`;
    const { data, error } = await supabase.storage.from('comunidad').upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });
    if (error) {
      return { url: null, error: error.message };
    }
    const { data: urlData } = supabase.storage.from('comunidad').getPublicUrl(filePath);
    return { url: urlData.publicUrl, error: null };
  } catch (err: any) {
    return { url: null, error: err.message || 'Error inesperado' };
  }
}
