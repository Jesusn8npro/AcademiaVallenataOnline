import { supabase } from './clienteSupabase';

// Actualizar los datos del usuario en la tabla 'perfiles'
// Lista de campos válidos según la tabla perfiles
const CAMPOS_VALIDOS_PERFIL = [
  'nombre', 'apellido', 'nombre_usuario', 'correo_electronico', 'biografia',
  'fecha_nacimiento', 'pais', 'ciudad', 'objetivo_aprendizaje', 'ano_experiencia',
  'estudios_musicales', 'nivel_habilidad', 'instrumento', 'rol',
  'url_foto_perfil', 'portada_url', 'fecha_actualizacion'
];

/**
 * Actualiza el perfil del usuario en la tabla 'perfiles'.
 * Solo se envían los campos válidos definidos en la tabla.
 * El campo fecha_actualizacion se añade automáticamente.
 */
export async function actualizarPerfil(id, datos) {
  // Filtrar solo los campos válidos (evita enviar updated_at, etc)
  const datosFiltrados = {};
  for (const campo of CAMPOS_VALIDOS_PERFIL) {
    if (datos.hasOwnProperty(campo)) {
      datosFiltrados[campo] = datos[campo];
    }
  }
  // Añadir fecha_actualizacion
  datosFiltrados['fecha_actualizacion'] = new Date().toISOString();

  const { data, error } = await supabase
    .from('perfiles')
    .update(datosFiltrados)
    .eq('id', id)
    .select();
  if (error) return { perfil: null, error: error.message };
  return { perfil: data?.[0] || null, error: null };
}

