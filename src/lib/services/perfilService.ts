import { supabase } from '$lib/supabase/clienteSupabase';

export interface DatosUsuario {
	email: string;
	nombre: string;
	apellido?: string;
	telefono?: string;
	whatsapp?: string;
	fecha_nacimiento?: string;
	ciudad?: string;
	pais?: string;
	profesion?: string;
	documento_tipo?: string;
	documento_numero?: string;
	direccion_completa?: string;
	codigo_postal?: string;
	como_nos_conocio?: string;
	password?: string;
}

export interface ResultadoOperacion {
	success: boolean;
	data?: any;
	error?: string;
	message?: string;
	usuario_id?: string;
}

/**
 * Crear un nuevo usuario completo (auth + perfil)
 */
export async function crearUsuarioCompleto(datos: DatosUsuario): Promise<ResultadoOperacion> {
	try {
		console.log('👤 Creando usuario completo:', datos.email);

		// 1. Crear usuario en Auth
		const { data: authData, error: authError } = await supabase.auth.signUp({
			email: datos.email,
			password: datos.password || generarPasswordTemporal(),
			options: {
				data: {
					nombre: datos.nombre,
					apellido: datos.apellido || '',
					telefono: datos.telefono || ''
				}
			}
		});

		if (authError) {
			console.error('❌ Error creando usuario en Auth:', authError);
			return {
				success: false,
				error: authError.message,
				message: 'Error al crear la cuenta de usuario'
			};
		}

		if (!authData.user) {
			return {
				success: false,
				error: 'No se pudo crear el usuario',
				message: 'Error en el proceso de registro'
			};
		}

		// 2. Crear perfil completo
		const perfilData = {
			id: authData.user.id,
			nombre: datos.nombre,
			apellido: datos.apellido || '',
			nombre_completo: `${datos.nombre} ${datos.apellido || ''}`.trim(),
			correo_electronico: datos.email,
			whatsapp: datos.telefono || datos.whatsapp || '',
			fecha_nacimiento: datos.fecha_nacimiento || null,
			ciudad: datos.ciudad || '',
			pais: datos.pais || 'Colombia',
			rol: 'estudiante',
			suscripcion: 'gratuita',
			nivel_habilidad: 'principiante',
			instrumento: 'acordeon',
			// Nuevos campos
			profesion: datos.profesion || '',
			documento_tipo: datos.documento_tipo || '',
			documento_numero: datos.documento_numero || '',
			direccion_completa: datos.direccion_completa || '',
			codigo_postal: datos.codigo_postal || '',
			como_nos_conocio: datos.como_nos_conocio || ''
		};

		const { data: perfilCreado, error: perfilError } = await supabase
			.from('perfiles')
			.insert([perfilData])
			.select('*')
			.single();

		if (perfilError) {
			console.error('❌ Error creando perfil:', perfilError);
			
			// Si falla el perfil, intentar limpiar el usuario de auth
			await supabase.auth.admin.deleteUser(authData.user.id);
			
			return {
				success: false,
				error: perfilError.message,
				message: 'Error al crear el perfil de usuario'
			};
		}

		console.log('✅ Usuario completo creado exitosamente:', authData.user.id);
		
		return {
			success: true,
			data: {
				usuario: authData.user,
				perfil: perfilCreado
			},
			usuario_id: authData.user.id,
			message: 'Usuario creado exitosamente'
		};

	} catch (error: any) {
		console.error('💥 Error en crearUsuarioCompleto:', error);
		return {
			success: false,
			error: error.message,
			message: 'Error inesperado al crear el usuario'
		};
	}
}

/**
 * Actualizar perfil existente con nuevos datos
 */
export async function actualizarPerfil(usuarioId: string, datos: Partial<DatosUsuario>): Promise<ResultadoOperacion> {
	try {
		console.log('📝 Actualizando perfil:', usuarioId);

		const actualizacion: any = {};

		// Mapear campos básicos
		if (datos.nombre) actualizacion.nombre = datos.nombre;
		if (datos.apellido) actualizacion.apellido = datos.apellido;
		if (datos.telefono) actualizacion.whatsapp = datos.telefono;
		if (datos.fecha_nacimiento) actualizacion.fecha_nacimiento = datos.fecha_nacimiento;
		if (datos.ciudad) actualizacion.ciudad = datos.ciudad;
		if (datos.pais) actualizacion.pais = datos.pais;
		if (datos.profesion) actualizacion.profesion = datos.profesion;
		if (datos.documento_tipo) actualizacion.documento_tipo = datos.documento_tipo;
		if (datos.documento_numero) actualizacion.documento_numero = datos.documento_numero;
		if (datos.direccion_completa) actualizacion.direccion_completa = datos.direccion_completa;
		if (datos.codigo_postal) actualizacion.codigo_postal = datos.codigo_postal;
		if (datos.como_nos_conocio) actualizacion.como_nos_conocio = datos.como_nos_conocio;

		// Actualizar nombre completo si hay cambios en nombre o apellido
		if (datos.nombre || datos.apellido) {
			const perfilActual = await obtenerPerfilPorId(usuarioId);
			if (perfilActual.success) {
				const nombreActual = datos.nombre || perfilActual.data.nombre;
				const apellidoActual = datos.apellido || perfilActual.data.apellido;
				actualizacion.nombre_completo = `${nombreActual} ${apellidoActual}`.trim();
			}
		}

		actualizacion.fecha_actualizacion = new Date().toISOString();

		const { data, error } = await supabase
			.from('perfiles')
			.update(actualizacion)
			.eq('id', usuarioId)
			.select('*')
			.single();

		if (error) {
			console.error('❌ Error actualizando perfil:', error);
			return {
				success: false,
				error: error.message,
				message: 'Error al actualizar el perfil'
			};
		}

		console.log('✅ Perfil actualizado exitosamente');
		return {
			success: true,
			data,
			message: 'Perfil actualizado exitosamente'
		};

	} catch (error: any) {
		console.error('💥 Error en actualizarPerfil:', error);
		return {
			success: false,
			error: error.message,
			message: 'Error inesperado al actualizar el perfil'
		};
	}
}

/**
 * Obtener perfil por ID
 */
export async function obtenerPerfilPorId(usuarioId: string): Promise<ResultadoOperacion> {
	try {
		const { data, error } = await supabase
			.from('perfiles')
			.select('*')
			.eq('id', usuarioId)
			.single();

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true, data };

	} catch (error: any) {
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Obtener perfil por email
 */
export async function obtenerPerfilPorEmail(email: string): Promise<ResultadoOperacion> {
	try {
		const { data, error } = await supabase
			.from('perfiles')
			.select('*')
			.eq('correo_electronico', email)
			.single();

		if (error) {
			return { success: false, error: error.message };
		}

		return { success: true, data };

	} catch (error: any) {
		return {
			success: false,
			error: error.message
		};
	}
}

/**
 * Verificar si un usuario existe por email
 */
export async function verificarUsuarioExiste(email: string): Promise<{ existe: boolean; usuario?: any }> {
	try {
		const resultado = await obtenerPerfilPorEmail(email);
		return {
			existe: resultado.success,
			usuario: resultado.data
		};
	} catch (error) {
		return { existe: false };
	}
}

/**
 * Sincronizar datos de pago con perfil
 */
export async function sincronizarDatosPagoConPerfil(
	datosPago: any, 
	usuarioId?: string
): Promise<ResultadoOperacion> {
	try {
		console.log('🔄 Sincronizando datos de pago con perfil');

		// Extraer datos del pago
		const datosUsuario: DatosUsuario = {
			email: datosPago.email,
			nombre: datosPago.nombre || datosPago.nombres || '',
			apellido: datosPago.apellido || datosPago.apellidos || '',
			telefono: datosPago.telefono || datosPago.celular || '',
			fecha_nacimiento: datosPago.fecha_nacimiento,
			ciudad: datosPago.ciudad,
			pais: datosPago.pais || 'Colombia',
			profesion: datosPago.profesion,
			documento_tipo: datosPago.documento_tipo,
			documento_numero: datosPago.documento_numero,
			direccion_completa: datosPago.direccion_completa,
			codigo_postal: datosPago.codigo_postal,
			como_nos_conocio: datosPago.como_nos_conocio,
			password: datosPago.password
		};

		// Si tenemos usuarioId, actualizar perfil existente
		if (usuarioId) {
			return await actualizarPerfil(usuarioId, datosUsuario);
		}

		// Si no, verificar si el usuario existe
		const usuarioExiste = await verificarUsuarioExiste(datosUsuario.email);
		
		if (usuarioExiste.existe) {
			// Usuario existe, actualizar perfil
			return await actualizarPerfil(usuarioExiste.usuario.id, datosUsuario);
		} else {
			// Usuario no existe, crear nuevo
			return await crearUsuarioCompleto(datosUsuario);
		}

	} catch (error: any) {
		console.error('💥 Error en sincronizarDatosPagoConPerfil:', error);
		return {
			success: false,
			error: error.message,
			message: 'Error al sincronizar datos'
		};
	}
}

/**
 * Generar password temporal
 */
function generarPasswordTemporal(): string {
	const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let password = '';
	for (let i = 0; i < 12; i++) {
		password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
	}
	return password;
} 