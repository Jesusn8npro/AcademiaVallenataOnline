import { supabase } from '$lib/supabase/clienteSupabase';

export interface ResultadoSubidaImagen {
    success: boolean;
    data?: {
        url: string;
        path: string;
        nombreArchivo: string;
    };
    error?: string;
}

export interface OpcionesImagen {
    maxSizeMB?: number;
    tiposPermitidos?: string[];
    prefijo?: string;
    compresion?: boolean;
}

const OPCIONES_DEFAULT: OpcionesImagen = {
    maxSizeMB: 10,
    tiposPermitidos: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
    prefijo: 'paquete',
    compresion: true
};

/**
 * Valida que el archivo sea una imagen válida
 */
export function validarImagen(archivo: File, opciones: OpcionesImagen = {}): { esValido: boolean; error?: string } {
    const config = { ...OPCIONES_DEFAULT, ...opciones };
    
    // Verificar que es un archivo
    if (!archivo) {
        return { esValido: false, error: 'No se seleccionó ningún archivo' };
    }
    
    // Verificar tipo de archivo
    if (!config.tiposPermitidos!.includes(archivo.type)) {
        return { 
            esValido: false, 
            error: `Tipo de archivo no permitido. Usa: ${config.tiposPermitidos!.join(', ')}` 
        };
    }
    
    // Verificar tamaño
    const sizeMB = archivo.size / (1024 * 1024);
    if (sizeMB > config.maxSizeMB!) {
        return { 
            esValido: false, 
            error: `El archivo es muy grande. Máximo ${config.maxSizeMB}MB, actual: ${sizeMB.toFixed(2)}MB` 
        };
    }
    
    return { esValido: true };
}

/**
 * Genera un nombre único para el archivo
 */
function generarNombreArchivo(archivo: File, prefijo: string = 'paquete'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = archivo.name.split('.').pop()?.toLowerCase();
    
    return `${prefijo}_${timestamp}_${random}.${extension}`;
}

/**
 * Comprime una imagen (opcional)
 */
async function comprimirImagen(archivo: File, calidad: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        const img = new Image();
        
        img.onload = () => {
            // Calcular nuevas dimensiones (máximo 1200px de ancho)
            const maxWidth = 1200;
            const maxHeight = 800;
            let { width, height } = img;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            // Dibujar imagen redimensionada
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convertir a blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const archivoComprimido = new File([blob], archivo.name, {
                            type: archivo.type,
                            lastModified: Date.now()
                        });
                        resolve(archivoComprimido);
                    } else {
                        resolve(archivo); // Si falla, devolver original
                    }
                },
                archivo.type,
                calidad
            );
        };
        
        img.onerror = () => resolve(archivo); // Si falla, devolver original
        img.src = URL.createObjectURL(archivo);
    });
}

/**
 * Sube una imagen al bucket de Supabase Storage
 */
export async function subirImagenPaquete(
    archivo: File, 
    opciones: OpcionesImagen = {}
): Promise<ResultadoSubidaImagen> {
    try {
        const config = { ...OPCIONES_DEFAULT, ...opciones };
        
        // Validar archivo
        const validacion = validarImagen(archivo, config);
        if (!validacion.esValido) {
            return {
                success: false,
                error: validacion.error
            };
        }
        
        // Comprimir imagen si está habilitado
        let archivoFinal = archivo;
        if (config.compresion) {
            archivoFinal = await comprimirImagen(archivo);
        }
        
        // Generar nombre único
        const nombreArchivo = generarNombreArchivo(archivoFinal, config.prefijo);
        const pathArchivo = nombreArchivo;
        
        // Subir a Supabase Storage
        const { data, error } = await supabase.storage
            .from('paquetes-imagenes')
            .upload(pathArchivo, archivoFinal, {
                cacheControl: '3600',
                upsert: false // No sobrescribir archivos existentes
            });
        
        if (error) {
            console.error('Error subiendo imagen:', error);
            return {
                success: false,
                error: `Error subiendo imagen: ${error.message}`
            };
        }
        
        // Obtener URL pública
        const { data: urlData } = supabase.storage
            .from('paquetes-imagenes')
            .getPublicUrl(pathArchivo);
        
        return {
            success: true,
            data: {
                url: urlData.publicUrl,
                path: pathArchivo,
                nombreArchivo: nombreArchivo
            }
        };
        
    } catch (error: any) {
        console.error('Error en subirImagenPaquete:', error);
        return {
            success: false,
            error: `Error inesperado: ${error.message}`
        };
    }
}

/**
 * Elimina una imagen del bucket
 */
export async function eliminarImagenPaquete(pathArchivo: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase.storage
            .from('paquetes-imagenes')
            .remove([pathArchivo]);
        
        if (error) {
            console.error('Error eliminando imagen:', error);
            return {
                success: false,
                error: `Error eliminando imagen: ${error.message}`
            };
        }
        
        return { success: true };
        
    } catch (error: any) {
        console.error('Error en eliminarImagenPaquete:', error);
        return {
            success: false,
            error: `Error inesperado: ${error.message}`
        };
    }
}

/**
 * Extrae el path del archivo desde una URL de Supabase
 */
export function extraerPathDeUrl(url: string): string | null {
    try {
        const match = url.match(/paquetes-imagenes\/(.+)$/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Genera una URL de vista previa para un archivo local
 */
export function generarVistaPrevia(archivo: File): string {
    return URL.createObjectURL(archivo);
}

/**
 * Libera la URL de vista previa
 */
export function liberarVistaPrevia(url: string): void {
    URL.revokeObjectURL(url);
}

/**
 * Formatea el tamaño de archivo en formato legible
 */
export function formatearTamanoArchivo(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Valida que una URL de imagen sea accesible
 */
export function validarUrlImagen(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
    });
} 