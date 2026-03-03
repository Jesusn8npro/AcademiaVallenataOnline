// ✅ FASE 3: Store de usuario con estados deterministas
// Basado en la documentación oficial de SvelteKit para estados estables

import { writable, derived, get } from '$utilidades/tiendaReact';
const browser = typeof window !== 'undefined';

// ✅ SOLUCIÓN: Interfaz mejorada para perfil de usuario
export interface PerfilUsuario {
  id: string; // ID único del usuario (igual al de Supabase Auth)
  correo_electronico: string; // Correo electrónico
  nombre?: string;
  apellido?: string;
  whatsapp?: string;
  rol?: string; // Rol del usuario (admin, estudiante, etc)
  url_foto_perfil?: string; // URL de la foto de perfil
  // ✅ NUEVO: Campos adicionales para estados deterministas
  ultima_actividad?: string;
  estado_online?: boolean;
  preferencias?: {
    tema?: 'light' | 'dark' | 'auto';
    notificaciones?: boolean;
    idioma?: string;
  };
}

// ✅ SOLUCIÓN: Estado inicial determinista
const ESTADO_INICIAL: PerfilUsuario | null = null;

// ✅ SOLUCIÓN: Store principal con validación de estado
export const usuario = writable<PerfilUsuario | null>(ESTADO_INICIAL);

// ✅ SOLUCIÓN: Store derivado para estado de autenticación
export const estadoAutenticacion = derived(usuario, ($usuario) => ({
  autenticado: !!$usuario,
  rol: $usuario?.rol || null,
  nombreCompleto: $usuario?.nombre && $usuario?.apellido
    ? `${$usuario.nombre} ${$usuario.apellido}`
    : $usuario?.nombre || 'Usuario',
  iniciales: obtenerIniciales($usuario),
  permisos: obtenerPermisos($usuario)
}));

// ✅ SOLUCIÓN: Store derivado para preferencias del usuario
export const preferenciasUsuario = derived(usuario, ($usuario) => ({
  tema: $usuario?.preferencias?.tema || 'light',
  notificaciones: $usuario?.preferencias?.notificaciones ?? true,
  idioma: $usuario?.preferencias?.idioma || 'es'
}));

// ✅ SOLUCIÓN: Store derivado para estado de actividad
export const estadoActividad = derived(usuario, ($usuario) => ({
  ultimaActividad: $usuario?.ultima_actividad || null,
  online: $usuario?.estado_online ?? false,
  tiempoInactivo: calcularTiempoInactivo($usuario?.ultima_actividad)
}));

// ✅ SOLUCIÓN: Función para obtener iniciales de manera determinista
function obtenerIniciales(usuario: PerfilUsuario | null): string {
  if (!usuario) return 'U';

  if (usuario.nombre && usuario.apellido) {
    return `${usuario.nombre.charAt(0)}${usuario.apellido.charAt(0)}`.toUpperCase();
  }

  if (usuario.nombre) {
    return usuario.nombre.charAt(0).toUpperCase();
  }

  if (usuario.correo_electronico) {
    return usuario.correo_electronico.charAt(0).toUpperCase();
  }

  return 'U';
}

// ✅ SOLUCIÓN: Función para obtener permisos de manera determinista
function obtenerPermisos(usuario: PerfilUsuario | null): string[] {
  if (!usuario) return [];

  const permisos: string[] = [];

  // ✅ SOLUCIÓN: Permisos basados en rol
  if (usuario.rol === 'admin') {
    permisos.push('admin', 'gestionar_usuarios', 'gestionar_contenido', 'ver_estadisticas');
  } else if (usuario.rol === 'estudiante') {
    permisos.push('estudiante', 'ver_cursos', 'ver_tutoriales', 'participar_comunidad');
  }

  // ✅ SOLUCIÓN: Permisos universales
  permisos.push('ver_perfil', 'editar_perfil', 'cambiar_tema');

  return permisos;
}

// ✅ SOLUCIÓN: Función para calcular tiempo inactivo de manera determinista
function calcularTiempoInactivo(ultimaActividad: string | undefined): number {
  if (!ultimaActividad || !browser) return 0;

  try {
    const ultima = new Date(ultimaActividad);
    const ahora = new Date();
    const diferenciaMs = ahora.getTime() - ultima.getTime();
    return Math.floor(diferenciaMs / (1000 * 60)); // Minutos
  } catch (error) {
    console.warn('⚠️ [USUARIO] Error calculando tiempo inactivo:', error);
    return 0;
  }
}

// ✅ SOLUCIÓN: Función para actualizar usuario con validación
export function setUsuario(nuevoUsuario: PerfilUsuario | null): void {
  try {
    // ✅ SOLUCIÓN: Validar estructura del usuario
    if (nuevoUsuario && !validarUsuario(nuevoUsuario)) {
      console.warn('⚠️ [USUARIO] Usuario con estructura inválida:', nuevoUsuario);
      return;
    }

    // ✅ SOLUCIÓN: Actualizar estado de actividad
    if (nuevoUsuario) {
      nuevoUsuario.ultima_actividad = new Date().toISOString();
      nuevoUsuario.estado_online = true;
    }

    // ✅ SOLUCIÓN: Actualizar store
    usuario.set(nuevoUsuario);

    // ✅ SOLUCIÓN: Persistir en localStorage si es cliente
    if (browser && nuevoUsuario) {
      try {
        localStorage.setItem('usuario_actual', JSON.stringify(nuevoUsuario));
        console.log('✅ [USUARIO] Usuario persistido en localStorage');
      } catch (error) {
        console.warn('⚠️ [USUARIO] Error persistiendo usuario:', error);
      }
    }

    console.log('✅ [USUARIO] Usuario actualizado:', nuevoUsuario?.nombre || 'null');
  } catch (error) {
    console.error('❌ [USUARIO] Error actualizando usuario:', error);
  }
}

// ✅ SOLUCIÓN: Función para limpiar usuario de manera determinista
export function limpiarUsuario(): void {
  try {
    // ✅ SOLUCIÓN: Resetear a estado inicial
    usuario.set(ESTADO_INICIAL);

    // ✅ SOLUCIÓN: Limpiar localStorage
    if (browser) {
      localStorage.removeItem('usuario_actual');
      console.log('✅ [USUARIO] Usuario limpiado de localStorage');
    }

    console.log('✅ [USUARIO] Usuario limpiado');
  } catch (error) {
    console.error('❌ [USUARIO] Error limpiando usuario:', error);
  }
}

// ✅ SOLUCIÓN: Función para validar estructura de usuario
function validarUsuario(usuario: any): usuario is PerfilUsuario {
  return usuario &&
    typeof usuario === 'object' &&
    typeof usuario.id === 'string' &&
    typeof usuario.correo_electronico === 'string' &&
    usuario.id.length > 0 &&
    usuario.correo_electronico.length > 0;
}

// ✅ SOLUCIÓN: Función para actualizar actividad del usuario
export function actualizarActividadUsuario(): void {
  try {
    const usuarioActual = get(usuario);
    if (usuarioActual) {
      const usuarioActualizado = {
        ...usuarioActual,
        ultima_actividad: new Date().toISOString(),
        estado_online: true
      };

      setUsuario(usuarioActualizado);
      console.log('✅ [USUARIO] Actividad actualizada para:', usuarioActual.nombre);
    }
  } catch (error) {
    console.warn('⚠️ [USUARIO] Error actualizando actividad:', error);
  }
}

// ✅ SOLUCIÓN: Función para actualizar preferencias del usuario
export function actualizarPreferenciasUsuario(
  preferencias: Partial<PerfilUsuario['preferencias']>
): void {
  try {
    const usuarioActual = get(usuario);
    if (usuarioActual) {
      const usuarioActualizado = {
        ...usuarioActual,
        preferencias: {
          ...usuarioActual.preferencias,
          ...preferencias
        }
      };

      setUsuario(usuarioActualizado);
      console.log('✅ [USUARIO] Preferencias actualizadas:', preferencias);
    }
  } catch (error) {
    console.warn('⚠️ [USUARIO] Error actualizando preferencias:', error);
  }
}

// ✅ SOLUCIÓN: Función para verificar si usuario tiene permiso
export function usuarioTienePermiso(permiso: string): boolean {
  try {
    const permisos = get(estadoAutenticacion).permisos;
    return permisos.includes(permiso);
  } catch (error) {
    console.warn('⚠️ [USUARIO] Error verificando permiso:', error);
    return false;
  }
}

// ✅ SOLUCIÓN: Función para obtener usuario del localStorage al inicializar
export function inicializarUsuarioDesdeStorage(): void {
  if (!browser) return;

  try {
    const usuarioGuardado = localStorage.getItem('usuario_actual');
    if (usuarioGuardado) {
      const usuarioParseado = JSON.parse(usuarioGuardado);
      if (validarUsuario(usuarioParseado)) {
        // ✅ SOLUCIÓN: Verificar si la sesión sigue siendo válida
        if (usuarioParseado.ultima_actividad) {
          const ultimaActividad = new Date(usuarioParseado.ultima_actividad);
          const ahora = new Date();
          const diferenciaHoras = (ahora.getTime() - ultimaActividad.getTime()) / (1000 * 60 * 60);

          // ✅ SOLUCIÓN: Si han pasado más de 24 horas, limpiar usuario
          if (diferenciaHoras > 24) {
            console.log('🕒 [USUARIO] Sesión expirada, limpiando usuario');
            limpiarUsuario();
            return;
          }
        }

        setUsuario(usuarioParseado);
        console.log('✅ [USUARIO] Usuario restaurado desde localStorage:', usuarioParseado.nombre);
      } else {
        console.warn('⚠️ [USUARIO] Usuario en localStorage inválido, limpiando');
        localStorage.removeItem('usuario_actual');
      }
    }
  } catch (error) {
    console.warn('⚠️ [USUARIO] Error restaurando usuario desde localStorage:', error);
    localStorage.removeItem('usuario_actual');
  }
}

// ✅ SOLUCIÓN: Inicializar usuario desde storage si estamos en cliente
if (browser) {
  inicializarUsuarioDesdeStorage();
}

/*
Ejemplo de uso:

import { usuario, setUsuario, limpiarUsuario, estadoAutenticacion } from '$servicios/UsuarioActivo/usuario';

// Para leer el usuario actual:
$usuario // (en un componente Svelte)

// Para leer el estado de autenticación:
$estadoAutenticacion // { autenticado: boolean, rol: string, nombreCompleto: string, iniciales: string, permisos: string[] }

// Para actualizar el usuario tras login:
setUsuario({ id: '...', correo_electronico: '...', rol: 'admin' });

// Para limpiar al hacer logout:
limpiarUsuario();

// Para verificar permisos:
if (usuarioTienePermiso('admin')) {
  // Mostrar funcionalidades de admin
}
*/


