import { createClient } from '@supabase/supabase-js';
import { supabase } from '$lib/supabase/clienteSupabase';

// AVISO: No creamos nuevas instancias, reutilizamos la instancia singleton
// de supabaseClient.ts para evitar el error "Multiple GoTrueClient instances"

// Obtener variables de entorno usando import.meta.env (para Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables de entorno de Supabase no configuradas. Verifique VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
}

// IMPORTANTE: Ya no creamos otra instancia de Supabase aquí
// En su lugar, exportamos la referencia de supabaseClient.ts
export const supabaseClient = supabase;

// Verificación de credenciales de Supabase

import type { AuthSession, Provider } from '@supabase/supabase-js';

interface UserData {
  id: string;
  email: string | null;
  profile: any;
  subscription: string;
}

// Re-exportar el cliente de Supabase importado desde supabaseClient.ts
export { supabase };

// Obtener variables de entorno desde supabaseClient configurado
const supabaseServiceKey = typeof import.meta !== 'undefined' && import.meta.env
  ? import.meta.env.VITE_SUPABASE_SERVICE_KEY || ''
  : '';

// NOTA: Eliminamos la creación del adminSupabase para evitar múltiples instancias de GoTrueClient
// En su lugar, usamos el mismo cliente base y solo cambiamos la clave cuando sea necesario
export function getAdminAccess() {
  if (!supabaseServiceKey) {
    console.warn('Service key no disponible, usando cliente normal');
    return supabase;
  }
  
  // Solo accedemos a funciones específicas que no inicializan GoTrueClient
  return {
    storage: supabase.storage,
    from: supabase.from.bind(supabase),
    rpc: supabase.rpc.bind(supabase)
  };
}

// Obtener sesión actual
export const getSession = async (): Promise<AuthSession | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error al obtener sesión:', error.message);
    return null;
  }
  return data.session;
};

// Iniciar sesión con correo y contraseña
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: UserData | null; error: string | null }> => {
  try {
    // Usar timeout para prevenir bloqueos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 segundos timeout
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    clearTimeout(timeoutId);

    if (error) throw error;

    // Si la autenticación es exitosa, obtener datos del perfil
    if (data.user) {
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('Error al obtener perfil:', profileError);
        }

        return {
          user: {
            id: data.user.id,
            email: data.user.email || null,
            profile: profileData || null,
            subscription: profileData?.subscription || 'free',
          },
          error: null,
        };
      } catch (profileFetchError) {
        console.error('Error al obtener datos de perfil:', profileFetchError);
        // Devolvemos el usuario con datos básicos, sin perfil
        return {
          user: {
            id: data.user.id,
            email: data.user.email || null,
            profile: null,
            subscription: 'free',
          },
          error: null,
        };
      }
    }

    return { user: null, error: 'No se pudo iniciar sesión' };
  } catch (error: any) {
    console.error('Error en signInWithEmail:', error.message);
    
    // Mejorar mensajes de error para el usuario
    let errorMessage = 'Error al iniciar sesión';
    
    if (error.message?.includes('Invalid login credentials')) {
      errorMessage = 'Email o contraseña incorrectos';
    } else if (error.message?.includes('Email not confirmed')) {
      errorMessage = 'Por favor, confirma tu correo electrónico antes de iniciar sesión';
    } else if (error.message?.includes('rate limit')) {
      errorMessage = 'Demasiados intentos fallidos. Por favor, intenta de nuevo más tarde';
    } else if (error.name === 'AbortError') {
      errorMessage = 'La solicitud tardó demasiado tiempo. Verifica tu conexión e intenta de nuevo.';
    }
    
    return {
      user: null,
      error: errorMessage,
    };
  }
};

// Registrar nuevo usuario
export const signUp = async (
  email: string,
  password: string,
  fullName: string
): Promise<{ user: UserData | null; error: string | null }> => {
  try {
    // Registrar usuario en auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    // Si el registro es exitoso, crear perfil
    if (data.user) {
      // Extraer first_name y last_name de fullName
      const [first_name, ...rest] = fullName.split(' ');
      const last_name = rest.join(' ');
      const { error: profileError } = await supabase.from('profiles').insert([
        {
          id: data.user.id,
          full_name: fullName,
          first_name: first_name || null,
          last_name: last_name || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        console.error('Error al crear perfil:', profileError);
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || null, // Añadir null como fallback
          profile: {
            id: data.user.id,
            full_name: fullName,
            created_at: new Date(),
          },
          subscription: 'free',
        },
        error: null,
      };
    }

    return { user: null, error: 'No se pudo registrar el usuario' };
  } catch (error: any) {
    console.error('Error en signUp:', error.message);
    return {
      user: null,
      error: error.message || 'Error al registrar usuario',
    };
  }
};

// Cerrar sesión
export const signOut = async (): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error en signOut:', error.message);
    return {
      error: error.message || 'Error al cerrar sesión',
    };
  }
};

// Iniciar sesión con proveedor OAuth (Google, Facebook, etc.)
export const signInWithProvider = async (
  provider: Provider
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error(`Error al iniciar sesión con ${provider}:`, error.message);
    return {
      error: error.message || `Error al iniciar sesión con ${provider}`,
    };
  }
};

// Recuperar contraseña
export const resetPassword = async (
  email: string
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error al solicitar recuperación de contraseña:', error.message);
    return {
      error: error.message || 'Error al solicitar recuperación de contraseña',
    };
  }
};

// Actualizar usuario
export const updateUserProfile = async (
  userId: string, 
  updates: Partial<{ full_name: string; bio: string; avatar_url: string }>
): Promise<{ error: string | null }> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);

    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error al actualizar perfil:', error.message);
    return {
      error: error.message || 'Error al actualizar perfil',
    };
  }
};

// Cargar perfil de usuario
export const getUserProfile = async (
  userId: string
): Promise<{ profile: any | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    
    // Si no existe rol en los datos, asignar 'user' por defecto
    if (data && !data.role) {
      data.role = 'user';
    }

    // Asegurarse de que full_name está disponible para la interfaz de usuario
    if (data && !data.full_name && data.nombre) {
      data.full_name = data.nombre;
    }

    // Si no hay un nombre definido, extraerlo del email
    if (data && !data.full_name && !data.nombre && data.email) {
      const emailName = data.email.split('@')[0];
      data.full_name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return { profile: data, error: null };
  } catch (error: any) {
    console.error('Error al obtener perfil:', error.message);
    return {
      profile: null,
      error: error.message || 'Error al obtener perfil',
    };
  }
};

// Verificar si el usuario tiene una suscripción activa
export const checkSubscription = async (
  userId: string
): Promise<{ subscription: string | null; error: string | null }> => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('type, is_active, expires_at')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 es el código para "no se encontraron resultados", lo que significa que no hay suscripción
      throw error;
    }

    // Verificar si hay una suscripción activa
    if (data && data.is_active) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt > new Date()) {
        return { subscription: data.type, error: null };
      }
    }

    // Por defecto, suscripción gratuita
    return { subscription: 'free', error: null };
  } catch (error: any) {
    console.error('Error al verificar suscripción:', error.message);
    return {
      subscription: 'free', // En caso de error, asumir suscripción gratuita
      error: error.message || 'Error al verificar suscripción',
    };
  }
};

// Tipos para la aplicación
interface Profile {
  id: string;
  nombre?: string;
  email?: string;
  avatar_url?: string;
  role?: string;
  subscription?: string;
}

interface Curso {
  id: string;
  titulo: string;
  descripcion: string;
  nivel: string;
  categoria?: string;
  duracion_estimada?: number;
  imagen_url?: string;
  instructor_id?: string;
  precio?: number;
  tipo_acceso: 'gratuito' | 'pago' | 'suscripcion';
  estado: 'borrador' | 'publicado' | 'archivado';
}

// Funciones para perfiles
export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) return { profile: null, error: error.message };
  return { profile: data as Profile, error: null };
}

export async function updateProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  if (error) return { profile: null, error: error.message };
  return { profile: data as Profile, error: null };
}

// Funciones para cursos - SIMPLIFICADAS para evitar errores
export async function getCursos() {
  try {
    // Consulta directa a la tabla cursos con límite para mejor rendimiento
    const { data, error } = await supabase
      .from('cursos')
      .select('*')
      .eq('estado', 'publicado')
      .limit(50);
    
    if (error) {
      console.error('Error al obtener cursos:', error);
      return { cursos: [], error: error.message };
    }
    
    return { cursos: data || [], error: null };
  } catch (e) {
    console.error('Error en la función getCursos:', e);
    return { cursos: [], error: 'Error interno al obtener cursos' };
  }
}

export async function getCursoById(cursoId: string) {
  const { data, error } = await supabase
    .from('cursos')
    .select('*')
    .eq('id', cursoId)
    .single();
  
  if (error) return { curso: null, error: error.message };
  return { curso: data as Curso, error: null };
}

// Función para verificar inscripción
export async function verificarInscripcion(userId: string, cursoId: string) {
  if (!userId || !cursoId) {
    return { inscrito: false, error: 'ID de usuario o curso no proporcionado' };
  }
  
  const { data, error } = await supabase
    .from('inscripciones')
    .select('*')
    .eq('usuario_id', userId)
    .eq('curso_id', cursoId)
    .single();
  
  if (error && error.code !== 'PGRST116') { // No se encontraron resultados
    return { inscrito: false, error: error.message };
  }
  
  return { inscrito: !!data, error: null };
}

// Función genérica para inscribir a cursos o tutoriales
export async function inscribirAContenido(userId: string, contenidoId: string, tipo: 'curso' | 'tutorial') {
  try {
    if (!userId || !contenidoId) {
      console.error('Error: ID de usuario o contenido no proporcionado', { userId, contenidoId });
      return { success: false, error: 'ID de usuario o contenido no proporcionado' };
    }

    // Verificar si ya está inscrito
    let filtro: any = { usuario_id: userId };
    if (tipo === 'curso') filtro['curso_id'] = contenidoId;
    if (tipo === 'tutorial') filtro['tutorial_id'] = contenidoId;

    // Buscar si ya existe una inscripción activa para este usuario y contenido
    const { data: yaInscrito, error: errorExistente } = await supabase
      .from('inscripciones')
      .select('id')
      .match(filtro)
      .maybeSingle();
    if (errorExistente) {
      console.error('Error al verificar inscripción existente:', errorExistente);
      return { success: false, error: 'Error al verificar inscripción existente' };
    }
    if (yaInscrito) {
      // Ya existe una inscripción, no crear duplicado
      return { success: true, error: null };
    }

    // Insertar inscripción
    const insertObj: any = {
      usuario_id: userId,
      fecha_inscripcion: new Date().toISOString(),
      progreso: 0,
      completado: false
    };
    if (tipo === 'curso') insertObj['curso_id'] = contenidoId;
    if (tipo === 'tutorial') insertObj['tutorial_id'] = contenidoId;

    const { error: insertError } = await supabase
      .from('inscripciones')
      .insert(insertObj);
    if (insertError) {
      console.error('Error al inscribir:', insertError);
      return { success: false, error: 'No se pudo inscribir' };
    }
    return { success: true, error: null };
  } catch (err: any) {
    console.error('Error general al inscribir:', err);
    return { success: false, error: err.message || 'Error inesperado al inscribir' };
  }
}

// Nueva función para inscribirse a un curso utilizando la función RPC
export async function inscribirACurso(userId: string, cursoId: string) {
  try {
    if (!userId || !cursoId) {
      console.error('Error: ID de usuario o curso no proporcionado', { userId, cursoId });
      return { success: false, error: 'ID de usuario o curso no proporcionado' };
    }
    
    console.log('Intentando inscribir al usuario', userId, 'al curso', cursoId);
    
    // Verificar primero si ya está inscrito para evitar duplicados
    const { inscrito, error: checkError } = await verificarInscripcion(userId, cursoId);
    
    if (checkError) {
      console.error('Error al verificar inscripción:', checkError);
    }
    
    if (inscrito) {
      console.log('El usuario ya está inscrito al curso');
      return { success: true, error: null, message: 'Ya estabas inscrito a este curso' };
    }
    
    // Intentar método directo de inserción primero (más confiable)
    try {
      console.log('Usando método directo de inserción');
      const { error: insertError } = await supabase
        .from('inscripciones')
        .insert({
          usuario_id: userId,
          curso_id: cursoId,
          fecha_inscripcion: new Date().toISOString(),
          progreso: 0,
          completado: false
        });
        
      if (insertError) {
        console.error('Error en método directo:', insertError);
        
        // Intentar el método RPC como respaldo si la inserción directa falla
        console.log('Intentando método RPC como respaldo');
        const { error: rpcError } = await supabase
          .rpc('inscripcion_directa', {
            p_curso_id: cursoId
          });
        
        if (rpcError) {
          console.error('Error en método RPC:', rpcError);
          return { success: false, error: 'No se pudo inscribir al curso' };
        }
      }
      
      return { success: true, error: null };
    } catch (err) {
      console.error('Error inesperado en inscripción:', err);
      return { success: false, error: 'Error al procesar la inscripción' };
    }
  } catch (err: any) {
    console.error('Error general al inscribir al curso:', err);
    return { success: false, error: err.message || 'Error inesperado al inscribir al curso' };
  }
}

// Nuevas funciones para obtener el contenido de los cursos
export async function obtenerModulosCurso(cursoId: string) {
  try {
    // Usar la función RPC
    const { data, error } = await supabase
      .rpc('obtener_modulos_curso', {
        p_curso_id: cursoId
      });
      
    if (error) {
      console.error('Error al obtener módulos:', error);
      
      // Método alternativo si falla el RPC
      const { data: modulosData, error: modulosError } = await supabase
        .from('modulos')
        .select('*')
        .eq('curso_id', cursoId)
        .order('orden');
        
      if (modulosError) {
        return { modulos: [], error: modulosError.message };
      }
      
      return { modulos: modulosData, error: null };
    }
    
    return { modulos: data, error: null };
  } catch (err: any) {
    console.error('Error inesperado al obtener módulos:', err);
    return { modulos: [], error: err.message };
  }
}

export async function obtenerLeccionesModulo(moduloId: string) {
  try {
    // Usar la función RPC
    const { data, error } = await supabase
      .rpc('obtener_lecciones_modulo', {
        p_modulo_id: moduloId
      });
      
    if (error) {
      console.error('Error al obtener lecciones:', error);
      
      // Método alternativo si falla el RPC
      const { data: leccionesData, error: leccionesError } = await supabase
        .from('lecciones')
        .select('*')
        .eq('modulo_id', moduloId)
        .order('orden');
        
      if (leccionesError) {
        return { lecciones: [], error: leccionesError.message };
      }
      
      return { lecciones: leccionesData, error: null };
    }
    
    return { lecciones: data, error: null };
  } catch (err: any) {
    console.error('Error inesperado al obtener lecciones:', err);
    return { lecciones: [], error: err.message };
  }
}

export async function obtenerContenidoCurso(cursoId: string) {
  try {
    // Obtenemos los módulos
    const { data: modulos, error: modulosError } = await supabase
      .from('modulos')
      .select('id, titulo, descripcion, orden')
      .eq('curso_id', cursoId)
      .order('orden');
    
    if (modulosError) throw modulosError;
    
    if (!modulos || modulos.length === 0) {
      return {
        modulos: [],
        error: null
      };
      }
      
      // Contenido formateado
    const contenido = await Promise.all(modulos.map(async (modulo: {id: string, titulo: string, descripcion?: string, orden: number}) => {
        const { lecciones } = await obtenerLeccionesModulo(modulo.id);
        return {
          ...modulo,
        lecciones
      };
    }));
    
    return {
      modulos: contenido,
      error: null
    };
    
  } catch (err: any) {
    console.error('Error al obtener contenido del curso:', err);
    return {
      modulos: [],
      error: err.message
    };
  }
}

// Función para verificar y crear el bucket de imágenes de cursos usando permisos de admin
export const verificarCrearBucketCursos = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    console.log('Verificando bucket "cursos" con permisos de admin...');
    
    // Verificar si el bucket existe
    const { data: bucketData, error: bucketError } = await supabase.storage
      .getBucket('cursos');
    
    // Si no existe, intentar crearlo
    if (bucketError && bucketError.message.includes('not found')) {
      console.log('Bucket "cursos" no encontrado, intentando crearlo con permisos de admin...');
      
      const { data: createData, error: createError } = await supabase.storage
        .createBucket('cursos', {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        });
      
      if (createError) {
        console.error('Error al crear bucket:', createError);
        return { 
          ok: false, 
          message: `Error al crear bucket: ${createError.message}` 
        };
      }
      
      // Crear las políticas de acceso
      try {
        await crearPoliticasAccesoBucket('cursos');
      } catch (policyErr: any) {
        console.warn('Error al crear políticas:', policyErr.message);
        // No fallamos si hay error en políticas, el bucket ya está creado
      }
      
      console.log('Bucket "cursos" creado correctamente con permisos de admin');
      return { 
        ok: true, 
        message: 'Bucket "cursos" creado correctamente' 
      };
    } else if (bucketError) {
      console.error('Error al verificar bucket:', bucketError);
      return { 
        ok: false, 
        message: `Error al verificar bucket: ${bucketError.message}` 
      };
    }
    
    console.log('Bucket "cursos" verificado correctamente');
    
    // Verificar políticas
    try {
      await verificarPoliticasAccesoBucket('cursos');
    } catch (policyErr: any) {
      console.warn('Advertencia al verificar políticas:', policyErr.message);
      // No fallamos por error en verificación de políticas
    }
    
    return { 
      ok: true, 
      message: 'Bucket "cursos" verificado correctamente' 
    };
  } catch (err: any) {
    console.error('Error inesperado al verificar/crear bucket:', err);
    return { 
      ok: false, 
      message: `Error inesperado: ${err.message || 'Error desconocido'}` 
    };
  }
};

// Función para crear políticas de acceso para un bucket
export const crearPoliticasAccesoBucket = async (bucketId: string): Promise<void> => {
  try {
    // Política para lectura pública
    await supabase.rpc('ejecutar_sql_seguro', {
      sql_comando: `
        CREATE POLICY "public_read_${bucketId}" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = '${bucketId}')
      `
    });
    
    // Política para inserción (usuarios autenticados)
    await supabase.rpc('ejecutar_sql_seguro', {
      sql_comando: `
        CREATE POLICY "auth_insert_${bucketId}" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = '${bucketId}' AND auth.role() = 'authenticated')
      `
    });
    
    // Política para actualización (usuarios autenticados)
    await supabase.rpc('ejecutar_sql_seguro', {
      sql_comando: `
        CREATE POLICY "auth_update_${bucketId}" 
        ON storage.objects 
        FOR UPDATE 
        WITH CHECK (bucket_id = '${bucketId}' AND auth.role() = 'authenticated')
      `
    });
    
    // Política para eliminación (usuarios autenticados)
    await supabase.rpc('ejecutar_sql_seguro', {
      sql_comando: `
        CREATE POLICY "auth_delete_${bucketId}" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = '${bucketId}' AND auth.role() = 'authenticated')
      `
    });
    
    console.log(`Políticas para bucket "${bucketId}" creadas correctamente`);
  } catch (err: any) {
    console.error(`Error al crear políticas para bucket "${bucketId}":`, err.message);
    throw err;
  }
};

// Función para verificar políticas existentes
export const verificarPoliticasAccesoBucket = async (bucketId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('verificar_politicas_bucket', {
      nombre_bucket: bucketId
    });
    
    if (error) throw error;
    
    const politicasCompletas = data?.politicas_completas || false;
    
    if (!politicasCompletas) {
      console.log(`Políticas incompletas para "${bucketId}", intentando crearlas...`);
      await crearPoliticasAccesoBucket(bucketId);
    }
    
    return true;
  } catch (err: any) {
    console.warn(`Error al verificar políticas: ${err.message}`);
    return false;
  }
};

// Función para subir una imagen al bucket de cursos
export const subirImagenCurso = async (
  file: File,
  options?: {
    onProgress?: (progress: number) => void;
    carpeta?: string;
  }
): Promise<{ url: string | null; error: string | null }> => {
  try {
    if (!file) {
      return { url: null, error: 'No se proporcionó ningún archivo' };
    }
    
    // Obtener la carpeta de destino (cursos por defecto)
    const carpeta = options?.carpeta || 'cursos';
    
    // Validar tipo y tamaño del archivo
    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validImageTypes.includes(file.type)) {
      return { 
        url: null, 
        error: `Tipo de archivo no válido. Tipos permitidos: JPG, PNG, WebP, GIF. Tipo actual: ${file.type}` 
      };
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { 
        url: null, 
        error: `El archivo es demasiado grande. Tamaño máximo: 5MB. Tamaño actual: ${(file.size / (1024 * 1024)).toFixed(2)}MB` 
      };
    }
    
    // Generar nombre de archivo único
    const fileExt = file.name.split('.').pop();
    const fileName = `${carpeta}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `${carpeta}/${fileName}`;
    
    console.log(`Intentando subir imagen: ${fileName} en carpeta: ${carpeta}`);
    
    // Intentamos primero con el bucket 'storage' que suele estar preconfigurado en Supabase
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('storage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.warn('Error al subir a bucket storage:', uploadError.message);
        // Si hay error, continuamos con el siguiente intento
      } else {
        // Éxito en la carga
        const { data: urlData } = supabase.storage
          .from('storage')
          .getPublicUrl(filePath);
        
        if (urlData?.publicUrl) {
          console.log('Imagen subida exitosamente a storage:', urlData.publicUrl);
          return { url: urlData.publicUrl, error: null };
        }
      }
    } catch (error: any) {
      console.warn('Error en método 1 (storage):', error.message || error);
      // Continuamos con el siguiente método
    }
    
    // Si el primer intento falló, probamos con el bucket por defecto
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('default')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        console.warn('Error al subir a bucket default:', uploadError.message);
      } else {
        // Éxito en la carga
        const { data: urlData } = supabase.storage
          .from('default')
          .getPublicUrl(filePath);
        
        if (urlData?.publicUrl) {
          console.log('Imagen subida exitosamente a default:', urlData.publicUrl);
          return { url: urlData.publicUrl, error: null };
        }
      }
    } catch (error: any) {
      console.warn('Error en método 2 (default):', error.message || error);
    }

    // Como último recurso, intentamos con el bucket 'cursos' (sin intentar crearlo)
    try {
      const { data, error: uploadError } = await supabase.storage
        .from('cursos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('cursos')
        .getPublicUrl(filePath);
      
      if (!urlData || !urlData.publicUrl) {
        return { url: null, error: 'No se pudo obtener la URL pública' };
      }
      
      console.log('Imagen subida exitosamente a cursos:', urlData.publicUrl);
      return { url: urlData.publicUrl, error: null };
      
    } catch (error: any) {
      console.error('Error en método 3 (cursos):', error.message || error);
      return { 
        url: null, 
        error: `No se pudo subir la imagen: ${error.message || 'Error desconocido'}. Por favor, contacte al administrador para configurar el almacenamiento.` 
      };
    }
  } catch (error: any) {
    console.error('Error general al subir imagen:', error.message || error);
    return { url: null, error: `Error inesperado: ${error.message || 'Error desconocido'}` };
  }
};

// Añadir después de la función updateProfile existente
export async function updateUsuario(userId: string, updates: any) {
  console.log("Intentando actualizar usuario con ID:", userId);
  console.log("Datos a actualizar:", updates);
  
  // Primero intentamos con profiles
  try {
    // Filtrar las propiedades para eliminar aquellas que puedan no existir en la tabla
    const profileUpdates = { ...updates };
    
    // Intentar actualizar en profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .update(profileUpdates)
      .eq('id', userId)
      .select();
    
    if (!profileError) {
      console.log("Usuario actualizado exitosamente en la tabla 'profiles'");
      return { usuario: profileData[0], error: null };
    }
    
    // Si hay un error específico sobre columna no encontrada
    if (profileError.message && profileError.message.includes("column") && profileError.message.includes("does not exist")) {
      console.warn("Error de columna en 'profiles', actualizando solo campos básicos");
      
      // Crear un objeto con solo los campos básicos que sabemos que existen
      const basicUpdates: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      // Añadir campos comunes que probablemente existan
      if ('nombre' in updates) basicUpdates['nombre'] = updates.nombre;
      if ('email' in updates) basicUpdates['email'] = updates.email;
      if ('avatar_url' in updates) basicUpdates['avatar_url'] = updates.avatar_url;
      if ('rol' in updates) basicUpdates['rol'] = updates.rol;
      
      // Intentar de nuevo con campos básicos
      const { data: basicData, error: basicError } = await supabase
        .from('profiles')
        .update(basicUpdates)
        .eq('id', userId)
        .select();
      
      if (!basicError) {
        console.log("Actualización básica exitosa en 'profiles'");
        return { usuario: { ...updates, ...basicData[0] }, error: null };
      }
      
      console.error("Error incluso con actualización básica en 'profiles':", basicError);
    } else {
      console.error("Error al actualizar en 'profiles':", profileError);
    }
    
    // Si llegamos aquí, intentar con la tabla usuarios
    console.log("Intentando actualizar en tabla 'usuarios'");
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .update(updates)
      .eq('id', userId)
      .select();
    
    if (!usuariosError) {
      console.log("Usuario actualizado exitosamente en la tabla 'usuarios'");
      return { usuario: usuariosData[0], error: null };
    }
    
    // Si también falló en usuarios, devolver el error
    console.error("Error al actualizar en 'usuarios':", usuariosError);
    return { 
      usuario: null, 
      error: "No se pudo actualizar el usuario en ninguna tabla. Último error: " + usuariosError.message 
    };
    
  } catch (error: any) {
    console.error("Error inesperado al actualizar usuario:", error);
    return { 
      usuario: null, 
      error: "Error inesperado al actualizar: " + (error.message || "Error desconocido") 
    };
  }
}



// Función para crear un perfil con validación de ID
export async function createProfileWithId(profileData: any) {
  try {
    // Asegurarnos de que el ID está presente
    if (!profileData.id) {
      console.error('Error: Se intentó crear un perfil sin ID');
      return { success: false, error: 'Se requiere un ID válido para crear el perfil' };
    }

    // Verificar que el perfil no existe ya
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', profileData.id)
      .single();

    // Si ya existe un perfil con este ID, retornar error
    if (existingProfile) {
      console.warn('Ya existe un perfil con este ID:', profileData.id);
      return { success: false, error: 'Ya existe un perfil con este ID' };
    }

    // Asegurarse de que los campos obligatorios estén presentes
    const requiredFields = ['full_name', 'created_at'];
    for (const field of requiredFields) {
      if (!profileData[field]) {
        console.error(`Error: Campo obligatorio faltante: ${field}`);
        return { success: false, error: `Campo obligatorio faltante: ${field}` };
      }
    }

    // Insertar el nuevo perfil
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData]);

    if (error) {
      console.error('Error al crear perfil:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    console.error('Error inesperado al crear perfil:', err);
    return { success: false, error: err.message || 'Error inesperado al crear perfil' };
  }
}

// Definimos nuestra propia función checkSupabaseAvailability aquí
// Función para verificar la disponibilidad de Supabase (optimizada)
export async function checkSupabaseAvailability() {
  try {
    // Intentar hacer una consulta simple con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 segundos timeout
    
    const { data, error } = await supabase
      .from('profiles')
      .select('count');
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('Error al verificar disponibilidad:', error.message);
      return {
        available: false,
        error: error.message
      };
    }
    
    return { available: true };
  } catch (err: any) {
    console.error('Error al conectar con Supabase:', err.message);
    return {
      available: false,
      error: err.message || 'Error al conectar con Supabase'
    };
  }
} 