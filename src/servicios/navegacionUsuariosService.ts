/**
 * 🔗 SERVICIO DE NAVEGACIÓN DE USUARIOS
 * Maneja la navegación entre Panel Admin y Administrador Usuarios
 */

export interface ParametrosNavegacionUsuario {
  usuarioId: string;
  pestana?: 'personal' | 'cursos' | 'pagos' | 'actividad';
  abrirEnNuevaVentana?: boolean;
}

/**
 * Navegar a los detalles de un usuario específico
 */
export function navegarADetallesUsuario(params: ParametrosNavegacionUsuario): void {
  const { usuarioId, pestana = 'actividad', abrirEnNuevaVentana = true } = params;
  
  if (!usuarioId) {
    console.error('❌ [NAVEGACIÓN] ID de usuario requerido');
    throw new Error('ID de usuario requerido para navegación');
  }
  
  // Construir URL con parámetros
  const urlParams = new URLSearchParams();
  urlParams.set('usuario', usuarioId);
  if (pestana) {
    urlParams.set('pestana', pestana);
  }
  
  const urlDestino = `/administrador/usuarios?${urlParams.toString()}`;
  
  console.log('🔗 [NAVEGACIÓN] Dirigiendo a:', {
    usuarioId,
    pestana,
    url: urlDestino,
    nuevaVentana: abrirEnNuevaVentana
  });
  
  if (abrirEnNuevaVentana) {
    // Abrir en nueva pestaña para mantener contexto
    window.open(urlDestino, '_blank');
  } else {
    // Navegar en la misma ventana
    window.location.href = urlDestino;
  }
}

/**
 * Extraer parámetros de navegación de la URL actual
 */
export function extraerParametrosNavegacion(url: URL): { usuarioId: string | null; pestana: string | null } {
  return {
    usuarioId: url.searchParams.get('usuario'),
    pestana: url.searchParams.get('pestana')
  };
}

/**
 * Generar URL para navegación a usuario
 */
export function generarUrlUsuario(usuarioId: string, pestana?: string): string {
  const urlParams = new URLSearchParams();
  urlParams.set('usuario', usuarioId);
  if (pestana) {
    urlParams.set('pestana', pestana);
  }
  
  return `/administrador/usuarios?${urlParams.toString()}`;
}

/**
 * Validar que el usuario existe antes de navegar
 */
export async function validarYNavegar(
  usuarioId: string, 
  validarExistencia: (id: string) => Promise<boolean>,
  pestana?: string
): Promise<void> {
  try {
    const existe = await validarExistencia(usuarioId);
    
    if (!existe) {
      console.warn('⚠️ [NAVEGACIÓN] Usuario no encontrado:', usuarioId);
      alert('Usuario no encontrado en el sistema');
      return;
    }
    
    navegarADetallesUsuario({
      usuarioId,
      pestana: pestana as any,
      abrirEnNuevaVentana: true
    });
    
  } catch (error) {
    console.error('❌ [NAVEGACIÓN] Error validando usuario:', error);
    alert('Error al verificar el usuario');
  }
} 