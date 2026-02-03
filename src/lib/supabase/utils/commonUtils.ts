// 🛠️ UTILIDADES COMUNES CENTRALIZADAS
// Evita 20+ imports duplicados de utilidades dispersas

// Re-exportar generateSlug desde su ubicación original
export { generateSlug, generateUniqueSlug } from '../../utilidades/utilidadesSlug';

/**
 * Formatear precio de manera consistente
 * @param precio - Precio en número
 * @param moneda - Moneda (default: COP)
 */
export function formatearPrecio(precio: number, moneda: string = 'COP'): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
}

/**
 * Formatear número con separadores de miles
 * @param numero - Número a formatear
 */
export function formatearNumero(numero: number): string {
  return new Intl.NumberFormat('es-CO').format(numero);
}

/**
 * Formatear tiempo relativo (hace X minutos, hace X horas, etc.)
 * @param fecha - Fecha a formatear
 */
export function formatearTiempoRelativo(fecha: string | Date): string {
  const now = new Date();
  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
  const diff = now.getTime() - fechaObj.getTime();

  const segundos = Math.floor(diff / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  const meses = Math.floor(dias / 30);
  const años = Math.floor(dias / 365);

  if (años > 0) return `hace ${años} año${años > 1 ? 's' : ''}`;
  if (meses > 0) return `hace ${meses} mes${meses > 1 ? 'es' : ''}`;
  if (dias > 0) return `hace ${dias} día${dias > 1 ? 's' : ''}`;
  if (horas > 0) return `hace ${horas} hora${horas > 1 ? 's' : ''}`;
  if (minutos > 0) return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  return 'hace un momento';
}

/**
 * Capitalizar primera letra
 * @param texto - Texto a capitalizar
 */
export function capitalizar(texto: string): string {
  if (!texto) return '';
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Truncar texto con puntos suspensivos
 * @param texto - Texto a truncar
 * @param longitud - Longitud máxima
 */
export function truncarTexto(texto: string, longitud: number = 100): string {
  if (!texto || texto.length <= longitud) return texto;
  return texto.substring(0, longitud) + '...';
}

/**
 * Validar email
 * @param email - Email a validar
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Generar ID único simple
 */
export function generarId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Debounce función para evitar llamadas excesivas
 * @param func - Función a hacer debounce
 * @param delay - Delay en ms
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

/**
 * Obtener extensión de archivo
 * @param nombreArchivo - Nombre del archivo
 */
export function obtenerExtension(nombreArchivo: string): string {
  return nombreArchivo.split('.').pop()?.toLowerCase() || '';
}

/**
 * Validar que sea imagen
 * @param archivo - Archivo a validar
 */
export function esImagen(archivo: File): boolean {
  const extensionesValidas = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  const extension = obtenerExtension(archivo.name);
  return extensionesValidas.includes(extension);
}

/**
 * Formatear tamaño de archivo
 * @param bytes - Tamaño en bytes
 */
export function formatearTamano(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 