import { supabase } from './clienteSupabase';

// Obtener la sesión actual del usuario
export const obtenerSesion = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
};

// Iniciar sesión con correo electrónico y contraseña
export const iniciarSesionConCorreo = async (correoElectronico, contrasena) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email: correoElectronico, password: contrasena });
  if (error) return { usuario: null, error: error.message };
  return { usuario: data.user, error: null };
};

// Registrar un nuevo usuario y crear su perfil en la tabla 'perfiles' (incluyendo whatsapp y rol estudiante)
export const registrarUsuario = async (
  correoElectronico: string,
  contrasena: string,
  datosPerfil: { nombre?: string; apellido?: string; whatsapp?: string }
) => {
  // 1. Verificar si el correo ya existe en perfiles (un solo perfil por correo)
  const { data: existePerfil, error: errorCheck } = await supabase
    .from('perfiles')
    .select('id')
    .eq('correo_electronico', correoElectronico.trim().toLowerCase())
    .maybeSingle();

  if (errorCheck) {
    console.error('Error verificando perfil existente:', errorCheck);
  }

  if (existePerfil) {
    return { usuario: null, error: 'Ya existe un perfil asociado a este correo electrónico.' };
  }

  // 2. Proceder con el registro en Auth
  const { data, error } = await supabase.auth.signUp({
    email: correoElectronico,
    password: contrasena
  });

  if (error) return { usuario: null, error: error.message };

  if (data.user) {
    const perfilData = {
      id: data.user.id,
      correo_electronico: correoElectronico.trim().toLowerCase(),
      rol: 'estudiante',
      ...datosPerfil
    };

    const resultado = await supabase
      .from('perfiles')
      .insert([perfilData]);

    if (resultado.error) {
      console.error('FALLA SUPABASE PERFIL:', {
        errorPerfil: resultado.error,
        perfilData,
        resultadoCompleto: resultado
      });
      return { usuario: null, error: resultado.error.message };
    }
    return { usuario: perfilData, error: null };
  }
  return { usuario: null, error: 'No se pudo registrar el usuario' };
};

// Cerrar sesión del usuario
export const cerrarSesion = async () => {
  try {
    // 1️⃣ OBTENER USUARIO ACTUAL ANTES DE CERRAR SESIÓN
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      console.log('🚪 [LOGOUT] Marcando usuario como desconectado:', user.id);

      // 2️⃣ MARCAR COMO INACTIVO EN SESIONES_USUARIO
      const ahora = new Date().toISOString();
      await supabase
        .from('sesiones_usuario')
        .update({
          esta_activo: false,
          ultima_actividad: ahora,
          updated_at: ahora
        })
        .eq('usuario_id', user.id);

      // 3️⃣ REGISTRAR EVENTO DE LOGOUT
      try {
        await supabase
          .from('eventos_actividad')
          .insert({
            usuario_id: user.id,
            tipo_evento: 'logout',
            pagina: window?.location?.pathname || '/logout',
            detalles: {
              timestamp: ahora,
              dispositivo: 'web',
              motivo: 'manual'
            },
            duracion_minutos: 0
          });
      } catch (eventoError) {
        console.warn('⚠️ [LOGOUT] Error registrando evento:', eventoError);
      }

      console.log('✅ [LOGOUT] Usuario marcado como desconectado correctamente');
    }

    // 4️⃣ PROCEDER CON EL LOGOUT DE SUPABASE
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ [LOGOUT] Error en signOut:', error);
      return error.message;
    }

    console.log('✅ [LOGOUT] Sesión cerrada exitosamente');
    return null;

  } catch (error) {
    console.error('❌ [LOGOUT] Error general:', error);
    // Intentar cerrar sesión de todas formas
    const { error: signOutError } = await supabase.auth.signOut();
    return signOutError?.message || 'Error cerrando sesión';
  }
};

// Obtener el perfil del usuario actual desde la tabla 'perfiles'
export const obtenerPerfil = async (id) => {
  const { data, error } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return { perfil: null, error: error.message };
  return { perfil: data, error: null };
};
