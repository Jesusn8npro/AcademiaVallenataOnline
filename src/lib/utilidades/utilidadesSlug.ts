/**
 * Utilidades para el manejo de slugs en la aplicación
 */

/**
 * Genera un slug a partir de un texto
 * @param text Texto del que se generará el slug
 * @returns Slug generado
 */
export function generateSlug(text: string): string {
  if (!text) return '';
  
  console.log('🔧 Generando slug para:', text);
  
  const slug = text
    .toString()
    .trim()                             // Elimina espacios al inicio y final
    .normalize('NFD')                   // Normaliza caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')    // Elimina diacríticos (tildes, etc.)
    .toLowerCase()                      // Convierte a minúsculas
    .replace(/[^\w\s-]/g, ' ')          // Convierte caracteres especiales a espacios
    .replace(/\s+/g, '-')               // Reemplaza espacios múltiples con guiones
    .replace(/--+/g, '-')               // Elimina guiones múltiples
    .replace(/^-+|-+$/g, '');           // Elimina guiones al inicio y final
  
  console.log('✅ Slug generado:', slug);
  return slug;
}

/**
 * Genera un slug único añadiendo timestamp
 * @param text Texto del que se generará el slug
 * @returns Slug único generado
 */
export function generateUniqueSlug(text: string): string {
  const baseSlug = generateSlug(text);
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
}

/**
 * Obtiene el ID de un curso desde una URL que usa slug
 * @param slug Slug del curso/módulo/lección
 * @param items Array de objetos que contienen id y título
 * @returns ID correspondiente al slug o null si no existe
 */
export function getIdFromSlug(slug: string, items: Array<{ id: string, titulo: string }>): string | null {
  // Primera opción: Buscar por slug exacto
  const foundByExactSlug = items.find(item => generateSlug(item.titulo) === slug);
  if (foundByExactSlug) return foundByExactSlug.id;
  
  // Segunda opción: Buscar por slug parcial (para manejar slugs con timestamp)
  // Primero extraemos la parte base del slug (sin el timestamp)
  const slugBase = slug.split('-').slice(0, -1).join('-');
  // Si el slug no tiene un timestamp o es muy corto, omitimos esta búsqueda
  if (slugBase.length > 3) {
    const foundByBaseSlug = items.find(item => {
      const itemSlug = generateSlug(item.titulo);
      return itemSlug === slugBase || slug.startsWith(itemSlug + '-');
    });
    if (foundByBaseSlug) return foundByBaseSlug.id;
  }
  
  // Tercera opción: Asumimos que podría ser un ID directo
  const foundById = items.find(item => item.id === slug);
  return foundById ? foundById.id : null;
}

/**
 * Obtiene el slug a partir de un ID
 * @param id ID del elemento
 * @param items Array de objetos que contienen id y título
 * @returns Slug generado o el ID original si no se encuentra
 */
export function getSlugFromId(id: string, items: Array<{ id: string, titulo: string }>): string {
  const item = items.find(item => item.id === id);
  return item ? generateSlug(item.titulo) : id;
}

/**
 * Utilidades para generar y manejar slugs de usuario
 */

/**
 * Genera un slug limpio a partir de un texto
 */
export function generarSlug(texto: string): string {
  if (!texto) return 'usuario';
  
  return texto
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Espacios a guiones
    .replace(/[^a-z0-9-]/g, '')     // Solo letras, números y guiones
    .replace(/-+/g, '-')            // Múltiples guiones a uno solo
    .replace(/^-|-$/g, '');         // Eliminar guiones al inicio y final
}

/**
 * Obtiene el slug de un usuario usando prioridad:
 * 1. nombre_usuario (si existe)
 * 2. nombre + apellido (si existen)
 * 3. nombre (si existe)
 * 4. nombre_completo (si existe)
 * 5. fallback por defecto
 */
export function obtenerSlugUsuario(usuario: any): string {
  // Prioridad 1: nombre_usuario
  if (usuario.nombre_usuario) {
    return generarSlug(usuario.nombre_usuario);
  }
  
  // Prioridad 2: nombre + apellido
  if (usuario.nombre && usuario.apellido) {
    return generarSlug(`${usuario.nombre} ${usuario.apellido}`);
  }
  
  // Prioridad 3: nombre solo
  if (usuario.nombre) {
    return generarSlug(usuario.nombre);
  }
  
  // Prioridad 4: nombre_completo
  if (usuario.nombre_completo) {
    return generarSlug(usuario.nombre_completo);
  }
  
  // Prioridad 5: usuario_nombre (para publicaciones)
  if (usuario.usuario_nombre) {
    return generarSlug(usuario.usuario_nombre);
  }
  
  // Fallback
  return 'usuario';
}

/**
 * Busca un usuario por slug considerando múltiples posibilidades
 */
export function coincideSlug(usuario: any, slug: string): boolean {
  const slugBuscado = slug.toLowerCase();
  const slugsUsuario = [
    usuario.nombre_usuario,
    usuario.nombre && usuario.apellido ? `${usuario.nombre} ${usuario.apellido}` : null,
    usuario.nombre,
    usuario.nombre_completo,
    usuario.usuario_nombre
  ]
    .filter(Boolean)
    .map(texto => generarSlug(texto))
    .filter(s => s !== 'usuario');
  
  return slugsUsuario.includes(slugBuscado);
} 