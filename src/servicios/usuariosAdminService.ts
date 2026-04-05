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

export interface EstadisticasUsuarios {
  total: number
  activos: number
  estudiantes: number
  instructores: number
}

export async function cargarUsuarios(mostrarEliminados = false): Promise<UsuarioAdmin[]> {
  let query = supabase
    .from('perfiles')
    .select('id,nombre,apellido,nombre_completo,correo_electronico,url_foto_perfil,ciudad,pais,rol,suscripcion,fecha_creacion,eliminado')
    .order('fecha_creacion', { ascending: false });

  if (!mostrarEliminados) {
    query = query.or('eliminado.eq.false,eliminado.is.null');
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error cargando usuarios:', error);
    throw error;
  }

  return (data || []) as UsuarioAdmin[];
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
    const { error } = await supabase.from('perfiles').delete().eq('id', id)
    if (error) throw error
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

      console.error('Error detallado de Edge Function:', errorAmostrar, error);
      throw new Error(errorAmostrar);
    }

    if (data && data.error) {
      throw new Error(data.error)
    }

    return { success: true, data }
  } catch (e: any) {
    console.error('Error al crear usuario:', e)
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
