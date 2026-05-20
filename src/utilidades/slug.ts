export function generarSlug(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// Alias inglés para compatibilidad con imports existentes
export const generateSlug = generarSlug;

export function generateUniqueSlug(texto: string): string {
  const sufijo = Math.random().toString(36).slice(2, 6);
  return `${generarSlug(texto)}-${sufijo}`;
}

export function obtenerSlugUsuario(usuario: any): string {
  if (!usuario) return 'usuario';
  if (usuario.nombre_usuario) return generarSlug(usuario.nombre_usuario);
  if (usuario.nombre && usuario.apellido) return generarSlug(`${usuario.nombre} ${usuario.apellido}`);
  if (usuario.nombre) return generarSlug(usuario.nombre);
  if (usuario.nombre_completo) return generarSlug(usuario.nombre_completo);
  if (usuario.usuario_nombre) return generarSlug(usuario.usuario_nombre);
  return 'usuario';
}
