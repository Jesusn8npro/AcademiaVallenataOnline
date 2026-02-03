import { supabase } from '../servicios/supabaseCliente'

export async function enviarEmailRestablecimiento(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-password`
    })
    if (error) throw error
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function cambiarPasswordUsuario(usuarioId: string, nuevaPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('cambiar_password_usuario', {
      usuario_id: usuarioId,
      nueva_password: nuevaPassword
    })

    if (error) throw error

    // La función RPC devuelve un objeto con success y error/message
    if (data && !data.success) {
      throw new Error(data.error || 'Error desconocido al cambiar contraseña')
    }

    return { success: true }
  } catch (e: any) {
    console.error('Error changing password:', e)
    return { success: false, error: e.message }
  }
}
