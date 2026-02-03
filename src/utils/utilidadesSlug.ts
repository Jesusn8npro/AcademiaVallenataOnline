export function generateSlug(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD') // Normaliza caracteres con acentos
    .replace(/[\u0300-\u036f]/g, "") // Elimina diacríticos (acentos)
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Reemplaza espacios con guiones
    .replace(/-+/g, '-') // Reemplaza múltiples guiones con uno solo
}

export function generateUniqueSlug(texto: string): string {
  const base = generateSlug(texto)
  const sufijo = Math.random().toString(36).slice(2, 6)
  return `${base}-${sufijo}`
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
  if (!usuario) return 'usuario';

  // Prioridad 1: nombre_usuario
  if (usuario.nombre_usuario) {
    return generateSlug(usuario.nombre_usuario);
  }

  // Prioridad 2: nombre + apellido
  if (usuario.nombre && usuario.apellido) {
    return generateSlug(`${usuario.nombre} ${usuario.apellido}`);
  }

  // Prioridad 3: nombre solo
  if (usuario.nombre) {
    return generateSlug(usuario.nombre);
  }

  // Prioridad 4: nombre_completo
  if (usuario.nombre_completo) {
    return generateSlug(usuario.nombre_completo);
  }

  // Prioridad 5: usuario_nombre (para publicaciones)
  if (usuario.usuario_nombre) {
    return generateSlug(usuario.usuario_nombre);
  }

  // Fallback
  return 'usuario';
}
