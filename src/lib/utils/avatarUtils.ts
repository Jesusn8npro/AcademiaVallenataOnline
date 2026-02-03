/**
 * 🎨 Utilidades para manejar avatares de usuarios
 */

/**
 * Generar iniciales a partir de un nombre completo
 */
export function generarIniciales(nombreCompleto: string): string {
  if (!nombreCompleto) return 'U';
  
  const palabras = nombreCompleto.split(' ').filter(palabra => palabra.length > 0);
  let iniciales = '';
  
  if (palabras.length >= 2) {
    // Si tiene nombre y apellido, tomar primera letra de cada uno
    iniciales = palabras[0].charAt(0) + palabras[1].charAt(0);
  } else if (palabras.length === 1) {
    // Si solo tiene una palabra, tomar las primeras 2 letras
    iniciales = palabras[0].substring(0, 2);
  } else {
    iniciales = 'U';
  }
  
  return iniciales.toUpperCase();
}

/**
 * Obtener avatar por defecto de la carpeta local
 */
export function obtenerAvatarPorDefecto(): string {
  return '/images/perfil-portada/Imagen perfil 1.jpg';
}

/**
 * Obtener portada por defecto de la carpeta local
 */
export function obtenerPortadaPorDefecto(): string {
  return '/images/perfil-portada/Imagen de portada.png';
}

/**
 * Verificar si se debe mostrar iniciales en lugar de imagen
 */
export function debeMostrarIniciales(urlAvatar: string | null | undefined): boolean {
  return !urlAvatar || urlAvatar.trim() === '';
}

/**
 * Obtener URL de avatar con fallback a imagen por defecto
 */
export function obtenerUrlAvatar(urlAvatar: string | null | undefined): string {
  return urlAvatar || obtenerAvatarPorDefecto();
} 