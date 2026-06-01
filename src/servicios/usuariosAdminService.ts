import { supabase } from '../servicios/clienteSupabase'

export interface UsuarioAdmin {
  id: string
  nombre?: string | null
  apellido?: string | null
  nombre_completo?: string | null
  correo_electronico?: string | null
  url_foto_perfil?: string | null
  ciudad?: string | null
  pais?: string | null
  rol?: string | null
  suscripcion?: string | null
  fecha_creacion?: string | null
}

export interface ContenidoUsuario {
  tipo: 'curso' | 'tutorial' | 'paquete'
  titulo: string | null
  estado: string | null
}

/** Fila enriquecida que devuelve admin_listar_usuarios_enriquecido (membresía real, ubicación, frecuencia, contenido). */
export interface UsuarioAdminEnriquecido extends UsuarioAdmin {
  eliminado?: boolean | null
  whatsapp?: string | null
  ultima_actividad?: string | null
  membresia_nombre?: string | null
  membresia_color?: string | null
  membresia_estado?: string | null
  membresia_vence?: string | null
  membresia_dias_restantes?: number | null
  ult_ip?: string | null
  ult_ciudad?: string | null
  ult_pais?: string | null
  ult_visita?: string | null
  ult_es_movil?: boolean | null
  dias_activos?: number | null
  tiempo_total_min?: number | null
  sesiones_total?: number | null
  ultima_sesion?: string | null
  en_linea?: boolean | null
  total_contenido?: number | null
  total_cursos?: number | null
  total_tutoriales?: number | null
  total_paquetes?: number | null
  contenido?: ContenidoUsuario[] | null
}

export interface EstadisticasUsuarios {
  total: number
  activos: number
  estudiantes: number
  instructores: number
}

export async function cargarUsuarios(mostrarEliminados = false): Promise<UsuarioAdmin[]> {
  const { data, error } = await supabase.rpc('admin_listar_todos_perfiles', { p_mostrar_eliminados: mostrarEliminados });

  if (error) {
    throw error;
  }

  return (data || []) as UsuarioAdmin[];
}

export async function cargarUsuariosEnriquecido(mostrarEliminados = false): Promise<UsuarioAdminEnriquecido[]> {
  const { data, error } = await supabase.rpc('admin_listar_usuarios_enriquecido', { p_mostrar_eliminados: mostrarEliminados });
  if (error) throw error;
  return (data || []) as UsuarioAdminEnriquecido[];
}

export function calcularEstadisticas(usuarios: UsuarioAdmin[]): EstadisticasUsuarios {
  const total = usuarios.length
  const activos = usuarios.filter(u => (u.suscripcion || '').toLowerCase() !== 'cancelada').length
  const estudiantes = usuarios.filter(u => (u.rol || '').toLowerCase() === 'estudiante').length
  const instructores = usuarios.filter(u => (u.rol || '').toLowerCase() === 'instructor').length
  return { total, activos, estudiantes, instructores }
}

export async function eliminarUsuario(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener sesión del usuario autenticado
    const { data: { session } } = await supabase.auth.getSession()

    if (!session?.access_token) {
      throw new Error('No hay sesión activa')
    }

    // Llamar Edge Function para eliminar usuario completamente
    // (tanto de perfiles como de auth.users)
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/eliminar-usuario`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ usuarioId: id }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Error al eliminar usuario')
    }

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function crearUsuario(datos: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('crear-usuario-admin', {
      body: datos
    })

    if (error) {
      // Intenta obtener el body del error si es un `FunctionsHttpError`
      let errorAmostrar = 'Error al invocar la función de creación';
      try {
        const errorBody = await error.context?.json();
        if (errorBody && errorBody.error) {
          errorAmostrar = errorBody.error;
        }
      } catch (e) {
        errorAmostrar = error.message;
      }

      throw new Error(errorAmostrar);
    }

    if (data && data.error) {
      throw new Error(data.error)
    }

    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function actualizarUsuario(id: string, cambios: any): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const { data, error } = await (supabase.from('perfiles') as any)
      .update(cambios)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return { success: true, data }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}
