<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { supabase } from '$lib/supabase/clienteSupabase';
	import { obtenerPaquetesPublicados, inscribirUsuarioEnPaquete, formatearPrecio as formatearPrecioPaquete, obtenerTutorialesPaquete, eliminarInscripcionPaquete } from '$lib/services/paquetesService';
	import TestPaquete from './TestPaquete.svelte';
	import PestanaActividad from './pestanas/PestanaActividad.svelte';
	import PestanaGeolocalizacion from './pestanas/PestanaGeolocalizacion.svelte';
	// Definir interface Usuario localmente
	interface Usuario {
		id: string;
		nombre: string;
		apellido: string;
		nombre_completo: string;
		correo_electronico: string;
		rol: string;
		suscripcion: string;
		fecha_creacion: string;
		fecha_actualizacion: string;
		eliminado: boolean;
		url_foto_perfil?: string;
		ciudad?: string;
		pais?: string;
		whatsapp?: string;
		nivel_habilidad?: string;
		documento_numero?: string;
		profesion?: string;
	}

	interface Curso {
		id: string;
		titulo: string;
		imagen_url: string;
		precio_normal: number;
		precio_rebajado: number | null;
		descripcion: string;
	}

	interface Tutorial {
		id: string;
		titulo: string;
		imagen_url: string;
		duracion: number;
		precio_normal: number;
		precio_rebajado: number | null;
		descripcion: string;
	}

	export let usuario: Usuario;
	export let pestanaInicial: string = 'general'; // prop opcional para establecer la pestaña inicial

	const dispatch = createEventDispatcher();

	let cargando = false;
	let error = '';
	let exito = '';
	let editando = false;
	let pestanaActiva = pestanaInicial; // general, actividad, geolocalizacion, cursos, configuracion

	// Datos editables
	let datosEditables = { ...usuario };

	// Datos adicionales
	let cursosInscritos: any[] = [];
	let cursosDisponibles: any[] = [];
	let tutorialesDisponibles: any[] = [];
	let paquetesInscritos: any[] = [];
	let paquetesDisponibles: any[] = [];
	let historialPagos: any[] = [];

	let cargandoCursos = false;
	let cargandoPagos = false;
	let cargandoDisponibles = false;
	let cargandoPaquetes = false;

	// Estados para gestión de cursos
	let mostrarAgregarCursos = false;
	let busquedaCursos = '';
	let mostrarGestionMembresia = false;
	let mostrarPaquetesDisponibles = false;
	let filtroTipoContenido: 'todos' | 'cursos' | 'tutoriales' | 'paquetes' = 'todos';

	// Variables de paginación
	let paginaActualCursos = 1;
	let paginaActualTutoriales = 1;
	let elementosPorPagina = 6; // Cursos por página

	// Estados para drag & drop
	let draggedItem: any = null;
	let draggedType: 'curso' | 'tutorial' = 'curso';

	onMount(() => {
		cargarDatosCompletos();
		// Crear diagnóstico global
		crearDiagnosticoGlobal();
	});

	async function cargarDatosCompletos() {
		// Cargar datos críticos primero
		await Promise.all([
			cargarCursosInscritos(),
			cargarPaquetesInscritos()
		]);
		
		// Cargar datos secundarios solo si es necesario
		if (pestanaActiva === 'cursos') {
			await Promise.all([
				cargarCursosDisponibles(),
				cargarPaquetesDisponibles()
			]);
		} else if (pestanaActiva === 'pagos') {
			await cargarHistorialPagos();
		} else if (pestanaActiva === 'configuracion') {
			await cargarHistorialPagos();
		}
	}

	// Función auxiliar para recargar todos los datos de cursos/paquetes
	async function recargarTodosCursosPaquetes() {
		await Promise.all([
			cargarCursosInscritos(),
			cargarPaquetesInscritos(),
			cargarCursosDisponibles(),
			cargarPaquetesDisponibles()
		]);
	}

	async function cargarCursosDisponibles() {
		try {
			cargandoDisponibles = true;
			
			// Obtener IDs de cursos ya inscritos
			const cursosInscritosIds = cursosInscritos
				.filter(i => i.curso_id)
				.map(i => i.curso_id);
			
			const tutorialesInscritosIds = cursosInscritos
				.filter(i => i.tutorial_id)
				.map(i => i.tutorial_id);

			// Cargar todos los cursos
			const { data: cursosData, error: cursosError } = await supabase
				.from('cursos')
				.select('id, titulo, imagen_url, precio_normal, precio_rebajado, descripcion')
				.order('titulo');

			if (cursosError) {
				console.error('Error al cargar cursos:', cursosError);
			}

			// Filtrar cursos no inscritos y formatear precio
			cursosDisponibles = (cursosData || [])
				.filter((curso: Curso) => !cursosInscritosIds.includes(curso.id))
				.map((curso: Curso) => ({
					...curso,
					precio: curso.precio_rebajado || curso.precio_normal
				}));

			// Cargar todos los tutoriales
			const { data: tutorialesData, error: tutorialesError } = await supabase
				.from('tutoriales')
				.select('id, titulo, imagen_url, duracion, precio_normal, precio_rebajado, descripcion')
				.order('titulo');

			if (tutorialesError) {
				console.error('Error al cargar tutoriales:', tutorialesError);
			}

			// Filtrar tutoriales no inscritos y formatear precio
			tutorialesDisponibles = (tutorialesData || [])
				.filter((tutorial: Tutorial) => !tutorialesInscritosIds.includes(tutorial.id))
				.map((tutorial: Tutorial) => ({
					...tutorial,
					precio: tutorial.precio_rebajado || tutorial.precio_normal
				}));
		} catch (err) {
			console.error('Error al cargar cursos disponibles:', err);
			cursosDisponibles = [];
			tutorialesDisponibles = [];
		} finally {
			cargandoDisponibles = false;
		}
	}

	async function cargarCursosInscritos() {
		try {
			cargandoCursos = true;
			
			// Cargar inscripciones básicas primero
			const { data: inscripciones, error: inscripcionesError } = await supabase
				.from('inscripciones')
				.select('*')
				.eq('usuario_id', usuario.id);

			if (inscripcionesError) throw inscripcionesError;

			cursosInscritos = [];

			// Para cada inscripción, cargar los detalles del curso o tutorial
			for (const inscripcion of inscripciones || []) {
				let detalleCurso = null;
				
				if (inscripcion.curso_id) {
					const { data: curso }: { data: any } = await supabase
						.from('cursos')
						.select('id, titulo, imagen_url, precio_normal, precio_rebajado')
						.eq('id', inscripcion.curso_id)
						.single();
					
					if (curso) {
						detalleCurso = { 
							...curso, 
							tipo: 'curso',
							precio: curso.precio_rebajado || curso.precio_normal
						};
					}
				} else if (inscripcion.tutorial_id) {
					const { data: tutorial }: { data: any } = await supabase
						.from('tutoriales')
						.select('id, titulo, imagen_url, duracion, precio_normal, precio_rebajado')
						.eq('id', inscripcion.tutorial_id)
						.single();
					
					if (tutorial) {
						detalleCurso = { 
							...tutorial, 
							tipo: 'tutorial',
							precio: tutorial.precio_rebajado || tutorial.precio_normal
						};
					}
				}

				if (detalleCurso) {
					cursosInscritos.push({
						...inscripcion,
						curso: detalleCurso
					});
				}
			}
		} catch (err) {
			console.error('Error al cargar cursos inscritos:', err);
			cursosInscritos = [];
		} finally {
			cargandoCursos = false;
		}
	}

	async function cargarHistorialPagos() {
		try {
			cargandoPagos = true;
			const { data, error } = await supabase
				.from('pagos_epayco')
				.select('*')
				.eq('usuario_id', usuario.id)
				.order('fecha_transaccion', { ascending: false })
				.limit(10);

			if (error) throw error;
			historialPagos = data || [];
		} catch (err) {
			console.error('Error al cargar pagos:', err);
			historialPagos = [];
		} finally {
			cargandoPagos = false;
		}
	}



	async function cargarPaquetesInscritos() {
		try {
			cargandoPaquetes = true;
			console.log('🔍 Cargando paquetes inscritos para usuario:', usuario.id);
			
			const { data, error } = await supabase
				.from('inscripciones')
				.select(`
					id,
					paquete_id,
					fecha_inscripcion,
					paquetes_tutoriales (
						id,
						titulo,
						descripcion_corta,
						imagen_url,
						precio_normal,
						precio_rebajado,
						total_tutoriales,
						nivel,
						categoria
					)
				`)
				.eq('usuario_id', usuario.id)
				.not('paquete_id', 'is', null)
				.order('fecha_inscripcion', { ascending: false });

			if (error) {
				console.error('❌ Error al cargar paquetes inscritos:', error);
				throw error;
			}

			console.log('✅ Paquetes inscritos cargados:', data?.length || 0);
			paquetesInscritos = data || [];
		} catch (err) {
			console.error('❌ Error al cargar paquetes inscritos:', err);
			paquetesInscritos = [];
		} finally {
			cargandoPaquetes = false;
		}
	}

	async function cargarPaquetesDisponibles() {
		try {
			const resultado = await obtenerPaquetesPublicados();
			if (resultado.success) {
				// Filtrar paquetes ya inscritos
				const paquetesInscritosIds = paquetesInscritos.map(p => p.paquete_id);
				paquetesDisponibles = (resultado.data || [])
					.filter((paquete: any) => !paquetesInscritosIds.includes(paquete.id));
			}
		} catch (err) {
					console.error('Error al cargar paquetes disponibles:', err);
		paquetesDisponibles = [];
	}
}

// Función para agregar paquete a usuario
async function agregarPaqueteAUsuario(paqueteId: string) {
	try {
		cargandoPaquetes = true;
		error = '';

		const resultado = await inscribirUsuarioEnPaquete(usuario.id, paqueteId);
		
		if (resultado.success) {
			exito = resultado.message || 'Paquete agregado exitosamente';
			
			// Recargar TODOS los datos para mostrar cambios inmediatos
			await recargarTodosCursosPaquetes();

			// Cerrar la sección de paquetes disponibles
			mostrarPaquetesDisponibles = false;
			
			// Verificar diagnóstico después de agregar
			setTimeout(() => verificarTutorialesEnBD(usuario.id, paqueteId), 2000);
		} else {
			error = resultado.error || 'Error agregando paquete';
		}
	} catch (err: any) {
		console.error('Error al agregar paquete:', err);
		error = 'Error inesperado al agregar paquete';
	} finally {
		cargandoPaquetes = false;
	}
}

// Función de diagnóstico para verificar tutoriales en BD
async function verificarTutorialesEnBD(usuarioId: string, paqueteId: string) {
	console.log('🔍 DIAGNÓSTICO: Verificando tutoriales en BD...');
	
	try {
		// 1. Obtener tutoriales del paquete
		const resultadoTutoriales = await obtenerTutorialesPaquete(paqueteId);
		console.log('📚 Tutoriales del paquete:', resultadoTutoriales);
		
		if (resultadoTutoriales.success && resultadoTutoriales.data) {
			const tutorialesIds = resultadoTutoriales.data.map((item: any) => item.tutoriales?.id).filter(Boolean);
			console.log('🎯 IDs de tutoriales:', tutorialesIds);
			
			// 2. Verificar inscripciones en BD
			const { data: inscripciones, error } = await supabase
				.from('inscripciones')
				.select('*')
				.eq('usuario_id', usuarioId)
				.not('tutorial_id', 'is', null);
			
			console.log('📋 Inscripciones de tutoriales en BD:', inscripciones);
			console.log('❌ Error al consultar inscripciones:', error);
			
			// 3. Verificar específicamente estos tutoriales
			if (tutorialesIds.length > 0) {
				const { data: inscripcionesEspecificas, error: errorEspecifico } = await supabase
					.from('inscripciones')
					.select('*')
					.eq('usuario_id', usuarioId)
					.in('tutorial_id', tutorialesIds);
				
				console.log('🎯 Inscripciones específicas encontradas:', inscripcionesEspecificas);
				console.log('❌ Error específico:', errorEspecifico);
			}
		}
	} catch (error) {
		console.error('❌ Error en diagnóstico:', error);
	}
}

// Función de diagnóstico global - disponible en consola
function crearDiagnosticoGlobal() {
	// Hacer función disponible globalmente
	(window as any).diagnosticoPaquetes = async (usuarioId: string, paqueteId: string) => {
		console.log('🔧 DIAGNÓSTICO GLOBAL INICIADO');
		console.log('👤 Usuario ID:', usuarioId);
		console.log('📦 Paquete ID:', paqueteId);
		
		// Ejecutar diagnóstico
		await verificarTutorialesEnBD(usuarioId, paqueteId);
		
		// Función adicional para verificar "Mis Cursos"
		console.log('🔍 Verificando página "Mis Cursos"...');
		try {
			const { data: misCursos, error } = await supabase
				.from('inscripciones')
				.select('*')
				.eq('usuario_id', usuarioId)
				.order('fecha_inscripcion', { ascending: false });
			
			console.log('📋 Datos en "Mis Cursos":', misCursos);
			console.log('❌ Error en "Mis Cursos":', error);
		} catch (error) {
			console.error('❌ Error consultando "Mis Cursos":', error);
		}
	};
	
	// Función para forzar inscripción manual de tutoriales
	(window as any).inscribirTutorialesManual = async (usuarioId: string, paqueteId: string) => {
		console.log('🔧 INSCRIPCIÓN MANUAL INICIADA');
		console.log('👤 Usuario ID:', usuarioId);
		console.log('📦 Paquete ID:', paqueteId);
		
		try {
			// Obtener tutoriales del paquete
			const resultado = await obtenerTutorialesPaquete(paqueteId);
			console.log('📚 Tutoriales del paquete:', resultado);
			
			if (resultado.success && resultado.data && resultado.data.length > 0) {
				for (const item of resultado.data) {
					if (item.tutoriales?.id) {
						const inscripcion = {
							usuario_id: usuarioId,
							tutorial_id: item.tutoriales.id,
							fecha_inscripcion: new Date().toISOString(),
							porcentaje_completado: 0,
							completado: false,
							estado: 'activo',
							progreso: 0,
							ultima_actividad: new Date().toISOString()
						};
						
						console.log('💾 Inscribiendo tutorial:', inscripcion);
						
						const { data, error } = await supabase
							.from('inscripciones')
							.insert([inscripcion])
							.select();
						
						if (error) {
							console.error('❌ Error:', error);
						} else {
							console.log('✅ Inscrito:', data);
						}
					}
				}
			}
		} catch (error) {
			console.error('❌ Error en inscripción manual:', error);
		}
	};

	// Función para obtener IDs actuales del usuario
	(window as any).obtenerIdsUsuario = () => {
		const usuarioId = usuario?.id || 'No disponible';
		console.log('👤 Usuario ID actual:', usuarioId);
		console.log('📦 Paquetes inscritos:', paquetesInscritos);
		if (paquetesInscritos && paquetesInscritos.length > 0) {
			console.log('📋 IDs de paquetes:');
			paquetesInscritos.forEach((paquete, index) => {
				console.log(`  ${index + 1}. ${paquete.paquetes_tutoriales?.titulo}: ${paquete.paquete_id}`);
			});
		}
		return { usuarioId, paquetesInscritos };
	};

	// Función para inscribir tutoriales de forma ultra simple
	(window as any).inscribirTutorialesSimple = async (usuarioId: string, tutorialIds: string[]) => {
		console.log('🔧 INSCRIPCIÓN SIMPLE INICIADA');
		console.log('👤 Usuario ID:', usuarioId);
		console.log('🎯 Tutorial IDs:', tutorialIds);
		
		for (const tutorialId of tutorialIds) {
			try {
				console.log(`💾 Inscribiendo tutorial ID: ${tutorialId}`);
				
				const { data, error } = await supabase
					.from('inscripciones')
					.insert([{
						usuario_id: usuarioId,
						tutorial_id: tutorialId,
						fecha_inscripcion: new Date().toISOString(),
						porcentaje_completado: 0,
						completado: false,
						estado: 'activo',
						progreso: 0,
						ultima_actividad: new Date().toISOString()
					}])
					.select();
				
				if (error) {
					console.error(`❌ Error inscribiendo ${tutorialId}:`, error);
				} else {
					console.log(`✅ Tutorial ${tutorialId} inscrito:`, data);
				}
			} catch (error) {
				console.error(`❌ Error procesando ${tutorialId}:`, error);
			}
		}
	};
	
	// Función SÚPER SIMPLE para arreglar el problema
	(window as any).arreglarTutorialesPaquetes = async (usuarioId: string) => {
		console.log('🔧 ARREGLANDO TUTORIALES DE PAQUETES PARA:', usuarioId);
		
		try {
			// 1. Obtener todos los paquetes del usuario
			const { data: paquetesUsuario, error: errorPaquetes } = await supabase
				.from('inscripciones')
				.select('paquete_id')
				.eq('usuario_id', usuarioId)
				.not('paquete_id', 'is', null);
			
			if (errorPaquetes) {
				console.error('❌ Error obteniendo paquetes:', errorPaquetes);
				return;
			}
			
			console.log('📦 Paquetes encontrados:', paquetesUsuario);
			
			// 2. Para cada paquete, obtener sus tutoriales
			for (const paqueteInscripcion of paquetesUsuario) {
				console.log(`🔍 Procesando paquete: ${paqueteInscripcion.paquete_id}`);
				
				// Obtener tutoriales del paquete
				const { data: items, error: errorItems } = await supabase
					.from('paquetes_tutoriales_items')
					.select(`
						tutorial_id,
						tutoriales:tutorial_id (
							id,
							titulo
						)
					`)
					.eq('paquete_id', paqueteInscripcion.paquete_id)
					.eq('incluido', true);
				
				if (errorItems) {
					console.error('❌ Error obteniendo tutoriales:', errorItems);
					continue;
				}
				
				console.log(`📚 Tutoriales encontrados: ${items?.length || 0}`);
				
				// 3. Inscribir cada tutorial individualmente (verificando duplicados)
				for (const item of items || []) {
					if (item.tutorial_id) {
						console.log(`💾 Verificando tutorial: ${item.tutoriales?.titulo}`);
						
						// Verificar si ya existe
						const { data: existente } = await supabase
							.from('inscripciones')
							.select('id')
							.eq('usuario_id', usuarioId)
							.eq('tutorial_id', item.tutorial_id)
							.maybeSingle();
						
						if (existente) {
							console.log(`⚠️ Ya existe: ${item.tutoriales?.titulo}`);
							continue;
						}
						
						const { data, error } = await supabase
							.from('inscripciones')
							.insert([{
								usuario_id: usuarioId,
								tutorial_id: item.tutorial_id,
								fecha_inscripcion: new Date().toISOString(),
								porcentaje_completado: 0,
								completado: false,
								estado: 'activo',
								progreso: 0,
								ultima_actividad: new Date().toISOString()
							}])
							.select();
						
						if (error) {
							console.error(`❌ Error inscribiendo ${item.tutoriales?.titulo}:`, error);
						} else {
							console.log(`✅ Tutorial inscrito: ${item.tutoriales?.titulo}`);
						}
					}
				}
			}
			
			console.log('🎉 PROCESO COMPLETADO! Ve a "Mis Cursos" y recarga la página.');
			
		} catch (error) {
			console.error('❌ Error general:', error);
		}
	};

	// Función para limpiar todo y empezar de nuevo
	(window as any).limpiarYArreglar = async (usuarioId: string) => {
		console.log('🧹 LIMPIANDO Y ARREGLANDO PARA:', usuarioId);
		
		try {
			// 1. Eliminar todas las inscripciones de tutoriales existentes
			console.log('🗑️ Eliminando inscripciones de tutoriales existentes...');
			const { error: errorEliminar } = await supabase
				.from('inscripciones')
				.delete()
				.eq('usuario_id', usuarioId)
				.not('tutorial_id', 'is', null);
			
			if (errorEliminar) {
				console.error('❌ Error eliminando:', errorEliminar);
				return;
			}
			
			console.log('✅ Inscripciones de tutoriales eliminadas');
			
			// 2. Esperar un poco
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			// 3. Ejecutar arreglo
			await (window as any).arreglarTutorialesPaquetes(usuarioId);
			
		} catch (error) {
			console.error('❌ Error en limpieza:', error);
		}
	};

	console.log('🔧 Diagnóstico global creado. Usar:');
	console.log('   obtenerIdsUsuario() - Obtener IDs del usuario actual');
	console.log('   arreglarTutorialesPaquetes("ID_USUARIO") - SOLUCIÓN SIMPLE');
	console.log('   limpiarYArreglar("ID_USUARIO") - SOLUCIÓN COMPLETA');
	console.log('   diagnosticoPaquetes(usuarioId, paqueteId)');
	console.log('');
	console.log('🎯 SOLUCIÓN RÁPIDA:');
	console.log('   1. obtenerIdsUsuario()');
	console.log('   2. limpiarYArreglar("ID_USUARIO")');
	console.log('   3. Recargar página "Mis Cursos"');
	console.log('');
	console.log('🎯 SOLUCIÓN ALTERNATIVA:');
	console.log('   1. obtenerIdsUsuario()');
	console.log('   2. arreglarTutorialesPaquetes("ID_USUARIO")');
	console.log('   3. Recargar página "Mis Cursos"');
}

// Función para mostrar notificación toast
function mostrarToast(mensaje: string, tipo: 'success' | 'error' = 'success') {
	// Crear elemento toast
	const toast = document.createElement('div');
	toast.className = `toast toast-${tipo}`;
	toast.textContent = mensaje;
	
	// Estilos inline para el toast
	Object.assign(toast.style, {
		position: 'fixed',
		top: '20px',
		right: '20px',
		backgroundColor: tipo === 'success' ? '#10b981' : '#ef4444',
		color: 'white',
		padding: '12px 20px',
		borderRadius: '8px',
		boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
		zIndex: '9999',
		fontSize: '14px',
		fontWeight: '500',
		maxWidth: '300px',
		opacity: '0',
		transform: 'translateY(-10px)',
		transition: 'all 0.3s ease'
	});
	
	// Agregar al DOM
	document.body.appendChild(toast);
	
	// Mostrar con animación
	setTimeout(() => {
		toast.style.opacity = '1';
		toast.style.transform = 'translateY(0)';
	}, 100);
	
	// Ocultar después de 3 segundos
	setTimeout(() => {
		toast.style.opacity = '0';
		toast.style.transform = 'translateY(-10px)';
		setTimeout(() => {
			if (toast.parentNode) {
				toast.parentNode.removeChild(toast);
			}
		}, 300);
	}, 3000);
}

// Función para eliminar paquete inscrito
async function eliminarPaqueteInscrito(paqueteId: string) {
	if (!confirm('¿Estás seguro de que quieres eliminar este paquete y todos sus tutoriales?')) {
		return;
	}

	try {
		// Mostrar indicador de carga solo para este paquete
		console.log('🗑️ Eliminando paquete:', paqueteId);
		
		// Buscar el paquete en la lista y marcarlo como eliminando
		const paqueteIndex = paquetesInscritos.findIndex(p => p.paquete_id === paqueteId);
		if (paqueteIndex !== -1) {
			paquetesInscritos[paqueteIndex].eliminando = true;
			paquetesInscritos = [...paquetesInscritos]; // Trigger reactivity
		}

		const resultado = await eliminarInscripcionPaquete(usuario.id, paqueteId);
		
		if (resultado.success) {
			// Mostrar mensaje de éxito
			mostrarToast(resultado.message || 'Paquete eliminado exitosamente', 'success');
			
			// Recargar TODOS los datos para reflejar cambios inmediatos
			await recargarTodosCursosPaquetes();
			
			console.log('✅ Paquete eliminado y datos actualizados');
		} else {
			// Quitar indicador de carga del paquete
			if (paqueteIndex !== -1) {
				paquetesInscritos[paqueteIndex].eliminando = false;
				paquetesInscritos = [...paquetesInscritos];
			}
			
			mostrarToast(resultado.error || 'Error eliminando paquete', 'error');
			console.error('❌ Error eliminando paquete:', resultado.error);
		}
	} catch (err: any) {
		console.error('Error al eliminar paquete:', err);
		mostrarToast('Error inesperado al eliminar paquete', 'error');
		
		// Quitar indicador de carga del paquete
		const paqueteIndex = paquetesInscritos.findIndex(p => p.paquete_id === paqueteId);
		if (paqueteIndex !== -1) {
			paquetesInscritos[paqueteIndex].eliminando = false;
			paquetesInscritos = [...paquetesInscritos];
		}
	}
}

// Función para ver paquete
function verPaquete(paqueteId: string) {
	window.open(`/paquetes/${paqueteId}`, '_blank');
}

	async function inscribirEnPaquete(paqueteId: string) {
		try {
			cargando = true;
			error = '';

			const resultado = await inscribirUsuarioEnPaquete(usuario.id, paqueteId);
			if (resultado.success) {
				exito = 'Usuario inscrito en el paquete exitosamente';
				// Recargar TODOS los datos para mostrar cambios inmediatos
				await recargarTodosCursosPaquetes();
				
				// Mostrar toast de éxito
				mostrarToast('Usuario inscrito en el paquete exitosamente', 'success');
				setTimeout(() => exito = '', 3000);
			} else {
				error = resultado.error || 'Error al inscribir en el paquete';
			}
		} catch (err: any) {
			error = `Error al inscribir en paquete: ${err.message}`;
		} finally {
			cargando = false;
		}
	}

	function cerrar() {
		dispatch('cerrar');
	}

	async function cambiarPestana(pestana: string) {
		pestanaActiva = pestana;
		
		// Cargar datos específicos de la pestaña bajo demanda
		if (pestana === 'cursos') {
			if (cursosDisponibles.length === 0) {
				await cargarCursosDisponibles();
			}
			if (paquetesDisponibles.length === 0) {
				await cargarPaquetesDisponibles();
			}
		} else if (pestana === 'pagos') {
			if (historialPagos.length === 0) {
				await cargarHistorialPagos();
			}
		} else if (pestana === 'configuracion') {
			await cargarHistorialPagos();
		}
	}

	function activarEdicion() {
		editando = true;
		datosEditables = { ...usuario };
	}

	function cancelarEdicion() {
		editando = false;
		datosEditables = { ...usuario };
		error = '';
	}

	async function guardarCambios() {
		try {
			cargando = true;
			error = '';

			// Construir nombre completo
			const nombreCompleto = `${datosEditables.nombre || ''} ${datosEditables.apellido || ''}`.trim();

			const { error: updateError } = await supabase
				.from('perfiles')
				.update({
					nombre: datosEditables.nombre,
					apellido: datosEditables.apellido,
					nombre_completo: nombreCompleto,
					correo_electronico: datosEditables.correo_electronico,
					rol: datosEditables.rol,
					suscripcion: datosEditables.suscripcion,
					ciudad: datosEditables.ciudad,
					pais: datosEditables.pais,
					whatsapp: datosEditables.whatsapp,
					nivel_habilidad: datosEditables.nivel_habilidad,
					documento_numero: datosEditables.documento_numero,
					profesion: datosEditables.profesion,
					fecha_actualizacion: new Date().toISOString()
				})
				.eq('id', usuario.id);

			if (updateError) throw updateError;

			// Actualizar usuario local con nombre completo actualizado
			usuario = { 
				...usuario,
				...datosEditables, 
				nombre_completo: nombreCompleto,
				fecha_actualizacion: new Date().toISOString()
			};
			editando = false;
			exito = 'Cambios guardados exitosamente';

			setTimeout(() => {
				exito = '';
			}, 3000);

			console.log('📤 Enviando usuario actualizado desde guardarCambios:', usuario);
			dispatch('usuarioActualizado', usuario);
			
			// Mostrar toast de éxito
			mostrarToast('Información personal actualizada exitosamente', 'success');
		} catch (err: any) {
			error = `Error al actualizar: ${err.message}`;
		} finally {
			cargando = false;
		}
	}

	async function eliminarUsuario() {
		if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
			return;
		}

		try {
			cargando = true;
			const { error: deleteError } = await supabase
				.from('perfiles')
				.update({ eliminado: true })
				.eq('id', usuario.id);

			if (deleteError) throw deleteError;

			dispatch('usuarioEliminado', usuario.id);
		} catch (err: any) {
			error = `Error al eliminar: ${err.message}`;
		} finally {
			cargando = false;
		}
	}

	async function toggleCurso(cursoId: string, tipo: 'curso' | 'tutorial', accion: 'agregar' | 'quitar') {
		try {
			if (accion === 'agregar') {
				// Verificar si ya existe una inscripción para prevenir duplicados
				const { data: inscripcionExistente, error: errorVerificar } = await supabase
					.from('inscripciones')
					.select('id')
					.eq('usuario_id', usuario.id)
					.eq(tipo === 'curso' ? 'curso_id' : 'tutorial_id', cursoId)
					.single();

				if (errorVerificar && errorVerificar.code !== 'PGRST116') {
					throw errorVerificar;
				}

				// Si ya existe, mostrar mensaje y no agregar
				if (inscripcionExistente) {
					error = `Este ${tipo} ya está agregado al usuario`;
					setTimeout(() => { error = ''; }, 3000);
					return;
				}

				// Insertar nueva inscripción
				const { error: insertError } = await supabase
					.from('inscripciones')
					.insert({
						usuario_id: usuario.id,
						[tipo === 'curso' ? 'curso_id' : 'tutorial_id']: cursoId,
						fecha_inscripcion: new Date().toISOString(),
						estado: 'activo'
					});
				if (insertError) throw insertError;
			} else {
				const { error: deleteError } = await supabase
					.from('inscripciones')
					.delete()
					.eq('usuario_id', usuario.id)
					.eq(tipo === 'curso' ? 'curso_id' : 'tutorial_id', cursoId);
				if (deleteError) throw deleteError;
			}

			// Recargar datos y mostrar mensaje de éxito
			await Promise.all([cargarCursosInscritos(), cargarCursosDisponibles()]);
			
			// Mostrar toast de éxito
			const nombreCurso = tipo === 'curso' ? 
				cursosDisponibles.find(c => c.id === cursoId)?.titulo || 
				cursosInscritos.find(c => c.curso_id === cursoId)?.curso?.titulo :
				tutorialesDisponibles.find(t => t.id === cursoId)?.titulo ||
				cursosInscritos.find(c => c.tutorial_id === cursoId)?.curso?.titulo;
				
			mostrarToast(`${tipo} "${nombreCurso}" ${accion === 'agregar' ? 'agregado' : 'removido'} exitosamente`, 'success');
		} catch (err: any) {
			error = `Error al ${accion} ${tipo}: ${err.message}`;
		}
	}

	// Funciones para Drag & Drop
	function handleDragStart(event: DragEvent, item: any, tipo: 'curso' | 'tutorial') {
		draggedItem = item;
		draggedType = tipo;
		event.dataTransfer!.effectAllowed = 'move';
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.dataTransfer!.dropEffect = 'move';
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (draggedItem && draggedType) {
			await toggleCurso(draggedItem.id, draggedType, 'agregar');
			draggedItem = null;
		}
	}

	// Función para cambiar membresía
	async function cambiarMembresia(nuevaMembresia: string) {
		try {
			cargando = true;
			const { error: updateError } = await supabase
				.from('perfiles')
				.update({ 
					suscripcion: nuevaMembresia,
					fecha_actualizacion: new Date().toISOString()
				})
				.eq('id', usuario.id);

			if (updateError) throw updateError;

			usuario = { 
				...usuario,
				suscripcion: nuevaMembresia,
				fecha_actualizacion: new Date().toISOString()
			};
			mostrarGestionMembresia = false;
			exito = 'Membresía actualizada exitosamente';

			setTimeout(() => {
				exito = '';
			}, 3000);

			console.log('📤 Enviando usuario actualizado desde cambiarMembresia:', usuario);
			dispatch('usuarioActualizado', usuario);
			
			// Mostrar toast de éxito  
			mostrarToast(`Membresía cambiada a ${nuevaMembresia}`, 'success');
		} catch (err: any) {
			error = `Error al cambiar membresía: ${err.message}`;
		} finally {
			cargando = false;
		}
	}

	// Filtrar cursos por búsqueda
	$: cursosDisponiblesFiltrados = cursosDisponibles.filter(curso =>
		curso.titulo.toLowerCase().includes(busquedaCursos.toLowerCase())
	);

	$: tutorialesDisponiblesFiltrados = tutorialesDisponibles.filter(tutorial =>
		tutorial.titulo.toLowerCase().includes(busquedaCursos.toLowerCase())
	);

	// Paginación de cursos
	$: totalPaginasCursos = Math.ceil(cursosDisponiblesFiltrados.length / elementosPorPagina);
	$: cursosPaginados = cursosDisponiblesFiltrados.slice(
		(paginaActualCursos - 1) * elementosPorPagina,
		paginaActualCursos * elementosPorPagina
	);

	// Paginación de tutoriales
	$: totalPaginasTutoriales = Math.ceil(tutorialesDisponiblesFiltrados.length / elementosPorPagina);
	$: tutorialesPaginados = tutorialesDisponiblesFiltrados.slice(
		(paginaActualTutoriales - 1) * elementosPorPagina,
		paginaActualTutoriales * elementosPorPagina
	);

	// Funciones de paginación
	function cambiarPaginaCursos(nuevaPagina: number) {
		if (nuevaPagina >= 1 && nuevaPagina <= totalPaginasCursos) {
			paginaActualCursos = nuevaPagina;
		}
	}

	function cambiarPaginaTutoriales(nuevaPagina: number) {
		if (nuevaPagina >= 1 && nuevaPagina <= totalPaginasTutoriales) {
			paginaActualTutoriales = nuevaPagina;
		}
	}

	// Resetear paginación cuando cambia la búsqueda
	$: if (busquedaCursos) {
		paginaActualCursos = 1;
		paginaActualTutoriales = 1;
	}

	function formatearFecha(fecha: string) {
		return new Date(fecha).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function formatearPrecio(precio: number | string) {
		const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0
		}).format(numero);
	}

	// Pestañas disponibles (actualizar)
	const pestañas = [
		{ id: 'general', label: '👤 General', icono: '👤' },
		{ id: 'actividad', label: '📊 Actividad', icono: '📊' },
		{ id: 'geolocalizacion', label: '🌍 Ubicación', icono: '🌍' },
		{ id: 'cursos', label: '📚 Cursos', icono: '📚' },
		{ id: 'configuracion', label: '⚙️ Configuración', icono: '⚙️' }
	];
</script>

<div class="detalle-usuario">
	<div class="header-detalle">
		<div class="info-header">
			<div class="avatar-grande">
				{#if usuario.url_foto_perfil}
					<img src={usuario.url_foto_perfil} alt={usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()} />
				{:else}
					<div class="avatar-iniciales">
						{(editando ? datosEditables.nombre : usuario.nombre)?.charAt(0) || ''}{(editando ? datosEditables.apellido : usuario.apellido)?.charAt(0) || ''}
					</div>
				{/if}
			</div>
			<div class="info-basica">
				<h2>{usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario'}</h2>
				<p class="correo">{usuario.correo_electronico}</p>
				<div class="badges">
					<span class="badge badge-{usuario.rol}">{usuario.rol}</span>
					<span class="badge badge-{usuario.suscripcion}">{usuario.suscripcion}</span>
					<span class="badge badge-{usuario.eliminado ? 'eliminado' : 'activo'}">
						{usuario.eliminado ? 'Eliminado' : 'Activo'}
					</span>
				</div>
			</div>
		</div>
		<div class="acciones-header">
			{#if !editando}
				<button class="btn-editar" on:click={activarEdicion}>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
						<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
					</svg>
					Editar
				</button>
			{/if}
			<button class="btn-cerrar" on:click={cerrar}>×</button>
		</div>
	</div>

	{#if error}
		<div class="error">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
			</svg>
			{error}
		</div>
	{/if}

	{#if exito}
		<div class="exito">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
				<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
			</svg>
			Usuario actualizado exitosamente
		</div>
	{/if}

	<div class="pestanas">
		{#each pestañas as pestaña}
			<button 
				class="pestana" 
				class:activa={pestanaActiva === pestaña.id}
				on:click={() => cambiarPestana(pestaña.id)}
			>
				<span class="pestana-icono">{pestaña.icono}</span>
				{pestaña.label}
			</button>
		{/each}
	</div>

	<div class="contenido-pestanas">
		{#if pestanaActiva === 'general'}
			<div class="pestana-contenido">
				<div class="seccion">
					<h3>Información Básica</h3>
					<div class="campos-grid">
						<div class="campo">
							<label>Nombre:</label>
							{#if editando}
								<input type="text" bind:value={datosEditables.nombre} />
							{:else}
								<span>{usuario.nombre || 'No especificado'}</span>
							{/if}
						</div>
						<div class="campo">
							<label>Apellido:</label>
							{#if editando}
								<input type="text" bind:value={datosEditables.apellido} />
							{:else}
								<span>{usuario.apellido || 'No especificado'}</span>
							{/if}
						</div>
						<div class="campo">
							<label>Correo:</label>
							{#if editando}
								<input type="email" bind:value={datosEditables.correo_electronico} />
							{:else}
								<span>{usuario.correo_electronico}</span>
							{/if}
						</div>
						<div class="campo">
							<label>Rol:</label>
							{#if editando}
								<select bind:value={datosEditables.rol}>
									<option value="estudiante">Estudiante</option>
									<option value="profesor">Profesor</option>
									<option value="admin">Administrador</option>
								</select>
							{:else}
								<span class="badge badge-{usuario.rol}">{usuario.rol}</span>
							{/if}
						</div>
						<div class="campo">
							<label>Suscripción:</label>
							{#if editando}
								<select bind:value={datosEditables.suscripcion}>
									<option value="free">Gratuita</option>
									<option value="basic">Básica</option>
									<option value="premium">Premium</option>
									<option value="pro">Profesional</option>
								</select>
							{:else}
								<span class="badge badge-{usuario.suscripcion}">{usuario.suscripcion}</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="seccion">
					<h3>Información Adicional</h3>
					<div class="campos-grid">
						<div class="campo">
							<label>Ciudad:</label>
							{#if editando}
								<input type="text" bind:value={datosEditables.ciudad} />
							{:else}
								<span>{usuario.ciudad || 'No especificado'}</span>
							{/if}
						</div>
						<div class="campo">
							<label>País:</label>
							{#if editando}
								<input type="text" bind:value={datosEditables.pais} />
							{:else}
								<span>{usuario.pais || 'No especificado'}</span>
							{/if}
						</div>
						<div class="campo">
							<label>WhatsApp:</label>
							{#if editando}
								<input type="tel" bind:value={datosEditables.whatsapp} />
							{:else}
								<span>{usuario.whatsapp || 'No especificado'}</span>
							{/if}
						</div>
						<div class="campo">
							<label>Nivel de Habilidad:</label>
							{#if editando}
								<select bind:value={datosEditables.nivel_habilidad}>
									<option value="">Seleccionar...</option>
									<option value="principiante">Principiante</option>
									<option value="intermedio">Intermedio</option>
									<option value="avanzado">Avanzado</option>
									<option value="experto">Experto</option>
								</select>
							{:else}
								<span>{usuario.nivel_habilidad || 'No especificado'}</span>
							{/if}
						</div>
						<div class="campo">
							<label>Documento:</label>
							{#if editando}
								<input type="text" bind:value={datosEditables.documento_numero} />
							{:else}
								<span>{usuario.documento_numero || 'No especificado'}</span>
							{/if}
						</div>
						<div class="campo">
							<label>Profesión:</label>
							{#if editando}
								<input type="text" bind:value={datosEditables.profesion} />
							{:else}
								<span>{usuario.profesion || 'No especificado'}</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="seccion">
					<h3>Fechas Importantes</h3>
					<div class="campos-grid">
						<div class="campo">
							<label>Fecha de Registro:</label>
							<span>{formatearFecha(usuario.fecha_creacion)}</span>
						</div>
						<div class="campo">
							<label>Última Actualización:</label>
							<span>{formatearFecha(usuario.fecha_actualizacion)}</span>
						</div>
					</div>
				</div>

				{#if editando}
					<div class="acciones-edicion">
						<button class="btn-cancelar" on:click={cancelarEdicion} disabled={cargando}>
							Cancelar
						</button>
						<button class="btn-guardar" on:click={guardarCambios} disabled={cargando}>
							{cargando ? 'Guardando...' : 'Guardar Cambios'}
						</button>
					</div>
				{:else}
					<div class="acciones-usuario">
						<button class="btn-eliminar" on:click={eliminarUsuario} disabled={cargando}>
							Eliminar Usuario
						</button>
					</div>
				{/if}
			</div>
		{/if}

		{#if pestanaActiva === 'cursos'}
			<div class="pestana-contenido">
				<!-- Diseño horizontal: Cursos inscritos a la izquierda, buscador a la derecha -->
				<div class="layout-cursos-horizontal">
					<!-- Columna izquierda: Cursos inscritos -->
					<div class="columna-izquierda">
						<div 
							class="zona-drop"
							on:dragover={handleDragOver}
							on:drop={handleDrop}
							role="region"
							aria-label="Zona para arrastrar cursos"
						>
							<div class="seccion">
								<div class="header-seccion">
									<h3>📚 Cursos Inscritos</h3>
									<span class="contador-cursos">{cursosInscritos.length}</span>
								</div>
								
								{#if cargandoCursos}
									<div class="cargando">Cargando cursos...</div>
								{:else if cursosInscritos.length === 0}
									<div class="vacio">
										<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
											<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
										</svg>
										<p>Sin cursos inscritos</p>
										<small>💡 Agrega cursos desde la derecha</small>
									</div>
								{:else}
									<div class="lista-cursos-compacta">
										{#each cursosInscritos as inscripcion}
											<div class="curso-item-compacto">
												<div class="curso-imagen-mini">
													{#if inscripcion.curso}
														<img src={inscripcion.curso.imagen_url} alt={inscripcion.curso.titulo} />
													{/if}
												</div>
												<div class="curso-info-mini">
													<h4>{inscripcion.curso?.titulo || 'Curso sin título'}</h4>
													<p class="tipo">
														{inscripcion.curso?.tipo === 'curso' ? '📚 Curso' : '🎯 Tutorial'}
													</p>
													<p class="fecha">
														{formatearFecha(inscripcion.fecha_inscripcion)}
													</p>
													<span class="estado estado-{inscripcion.estado || 'activo'}">
														{inscripcion.estado || 'activo'}
													</span>
												</div>
												<div class="curso-acciones">
													<button 
														class="btn-quitar-mini"
														on:click={() => toggleCurso(
															inscripcion.curso?.id,
															inscripcion.curso?.tipo,
															'quitar'
														)}
														title="Quitar curso"
													>
														<svg width="14" height="14" viewBox="0 0 24 24" fill="none">
															<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2"/>
														</svg>
													</button>
												</div>
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</div>

						<!-- Paquetes Inscritos -->
						<div class="seccion">
							<div class="header-seccion">
								<h3>🎁 Paquetes Inscritos</h3>
								<span class="contador-cursos">{paquetesInscritos.length}</span>
							</div>
							
							{#if cargandoPaquetes}
								<div class="cargando">Cargando paquetes...</div>
							{:else if paquetesInscritos.length === 0}
								<div class="vacio-mini">
									<svg width="24" height="24" viewBox="0 0 24 24" fill="none">
										<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" stroke-width="2"/>
									</svg>
									<p>No hay paquetes inscritos</p>
								</div>
							{:else}
								<div class="lista-cursos-inscritos">
									{#each paquetesInscritos as paquete}
										<div class="paquete-inscrito-expandido" class:eliminando={paquete.eliminando}>
											<div class="paquete-header">
												<div class="paquete-icon-grande">📦</div>
												<div class="paquete-info-principal">
													<h5>{paquete.paquetes_tutoriales?.titulo || 'Paquete'}</h5>
													<p class="paquete-descripcion">
														{paquete.paquetes_tutoriales?.descripcion_corta || 'Paquete de tutoriales'}
													</p>
													<div class="paquete-meta">
														<span class="fecha-inscripcion">
															📅 {formatearFecha(paquete.fecha_inscripcion)}
														</span>
														<span class="total-tutoriales">
															🎯 {paquete.paquetes_tutoriales?.total_tutoriales || 0} tutoriales
														</span>
														<span class="nivel-paquete">
															📊 {paquete.paquetes_tutoriales?.nivel || 'Principiante'}
														</span>
													</div>
												</div>
												<div class="paquete-acciones">
													<div class="progreso-paquete">
														<div class="progreso-circular">
															<span class="progreso-porcentaje">{paquete.porcentaje_completado || 0}%</span>
														</div>
													</div>
													<div class="botones-paquete">
														<button 
															class="btn-ver-paquete-detalle"
															on:click={() => verPaquete(paquete.paquete_id)}
															title="Ver paquete completo"
															disabled={paquete.eliminando}
														>
															👁️ Ver
														</button>
														<button 
															class="btn-eliminar-paquete"
															on:click={() => eliminarPaqueteInscrito(paquete.paquete_id)}
															title="Eliminar paquete"
															disabled={paquete.eliminando}
														>
															{#if paquete.eliminando}
																⏳ Eliminando...
															{:else}
																🗑️ Eliminar
															{/if}
														</button>
													</div>
												</div>
											</div>
											
											<!-- Lista de tutoriales del paquete -->
											<div class="tutoriales-paquete">
												<h6>📚 Tutoriales incluidos:</h6>
												{#await obtenerTutorialesPaquete(paquete.paquete_id) then resultado}
													{#if resultado.success && resultado.data && resultado.data.length > 0}
														<div class="lista-tutoriales-mini">
															{#each resultado.data as item}
																<div class="tutorial-item-mini">
																	<div class="tutorial-estado">
																		{#if item.completado}
																			✅
																		{:else}
																			⏳
																		{/if}
																	</div>
																	<div class="tutorial-info">
																		<span class="tutorial-titulo">{item.tutoriales?.titulo || 'Tutorial'}</span>
																		<span class="tutorial-duracion">⏱️ {item.tutoriales?.duracion_estimada || 0}min</span>
																	</div>
																</div>
															{/each}
														</div>
													{:else}
														<p class="sin-tutoriales">No se encontraron tutoriales</p>
													{/if}
												{:catch error}
													<p class="error-tutoriales">Error cargando tutoriales: {error.message}</p>
												{/await}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>

					<!-- Columna derecha: Buscador y cursos disponibles -->
					<div class="columna-derecha">
						<div class="seccion seccion-agregar">
							<div class="header-seccion">
								<h3>🔍 Agregar Cursos y Tutoriales</h3>
							</div>
							
							<!-- Buscador -->
							<div class="buscador-cursos">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
									<path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" stroke="currentColor" stroke-width="2"/>
								</svg>
								<input 
									type="text" 
									placeholder="Buscar contenido..."
									bind:value={busquedaCursos}
								/>
							</div>

							<!-- Filtros de tipo de contenido -->
							<div class="filtros-contenido">
								<button 
									class="filtro-btn"
									class:activo={filtroTipoContenido === 'todos'}
									on:click={() => filtroTipoContenido = 'todos'}
								>
									🎯 Todos
								</button>
								<button 
									class="filtro-btn"
									class:activo={filtroTipoContenido === 'cursos'}
									on:click={() => filtroTipoContenido = 'cursos'}
								>
									📚 Cursos
								</button>
								<button 
									class="filtro-btn"
									class:activo={filtroTipoContenido === 'tutoriales'}
									on:click={() => filtroTipoContenido = 'tutoriales'}
								>
									🎯 Tutoriales
								</button>
								<button 
									class="filtro-btn"
									class:activo={filtroTipoContenido === 'paquetes'}
									on:click={() => filtroTipoContenido = 'paquetes'}
								>
									🎁 Paquetes
								</button>
							</div>

							{#if cargandoDisponibles}
								<div class="cargando">Cargando contenido disponible...</div>
							{:else}
								<!-- Mostrar contenido según filtro -->
								{#if filtroTipoContenido === 'todos' || filtroTipoContenido === 'cursos'}
									{#if cursosDisponiblesFiltrados.length > 0}
										<div class="categoria-cursos">
											<div class="header-categoria">
												<h4>📚 Cursos Disponibles</h4>
												<span class="contador-resultados">
													{cursosDisponiblesFiltrados.length} cursos
												</span>
											</div>
											<div class="grid-cursos-disponibles">
												{#each cursosPaginados as curso}
													<div 
														class="curso-disponible"
														draggable="true"
														on:dragstart={(e) => handleDragStart(e, curso, 'curso')}
														role="button"
														aria-label="Arrastrar curso {curso.titulo}"
													>
														<div class="curso-imagen-mini">
															<img src={curso.imagen_url} alt={curso.titulo} />
														</div>
														<div class="curso-info-mini">
															<h5>{curso.titulo}</h5>
															<p class="precio">{formatearPrecio(curso.precio)}</p>
														</div>
														<button 
															class="btn-agregar-curso"
															on:click={() => toggleCurso(curso.id, 'curso', 'agregar')}
															aria-label="Agregar curso"
														>
															<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
																<path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="2"/>
															</svg>
														</button>
													</div>
												{/each}
											</div>
											
											<!-- Paginación cursos -->
											{#if totalPaginasCursos > 1}
												<div class="paginacion">
													<button 
														class="btn-pagina"
														class:disabled={paginaActualCursos === 1}
														on:click={() => cambiarPaginaCursos(paginaActualCursos - 1)}
														disabled={paginaActualCursos === 1}
													>
														<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
															<path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2"/>
														</svg>
													</button>
													
													{#each Array(totalPaginasCursos) as _, i}
														<button 
															class="btn-pagina"
															class:activa={paginaActualCursos === i + 1}
															on:click={() => cambiarPaginaCursos(i + 1)}
														>
															{i + 1}
														</button>
													{/each}
													
													<button 
														class="btn-pagina"
														class:disabled={paginaActualCursos === totalPaginasCursos}
														on:click={() => cambiarPaginaCursos(paginaActualCursos + 1)}
														disabled={paginaActualCursos === totalPaginasCursos}
													>
														<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
															<path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2"/>
														</svg>
													</button>
												</div>
											{/if}
										</div>
									{/if}
								{/if}

								{#if filtroTipoContenido === 'todos' || filtroTipoContenido === 'tutoriales'}
									{#if tutorialesDisponiblesFiltrados.length > 0}
										<div class="categoria-cursos">
											<div class="header-categoria">
												<h4>🎯 Tutoriales Disponibles</h4>
												<span class="contador-resultados">
													{tutorialesDisponiblesFiltrados.length} tutoriales
												</span>
											</div>
											<div class="grid-cursos-disponibles">
												{#each tutorialesPaginados as tutorial}
													<div 
														class="curso-disponible"
														draggable="true"
														on:dragstart={(e) => handleDragStart(e, tutorial, 'tutorial')}
														role="button"
														aria-label="Arrastrar tutorial {tutorial.titulo}"
													>
														<div class="curso-imagen-mini">
															<img src={tutorial.imagen_url} alt={tutorial.titulo} />
														</div>
														<div class="curso-info-mini">
															<h5>{tutorial.titulo}</h5>
															<p class="duracion">⏱️ {tutorial.duracion} min</p>
															{#if tutorial.precio}
																<p class="precio">{formatearPrecio(tutorial.precio)}</p>
															{/if}
														</div>
														<button 
															class="btn-agregar-curso"
															on:click={() => toggleCurso(tutorial.id, 'tutorial', 'agregar')}
															aria-label="Agregar tutorial"
														>
															<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
																<path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="2"/>
															</svg>
														</button>
													</div>
												{/each}
											</div>
											
											<!-- Paginación tutoriales -->
											{#if totalPaginasTutoriales > 1}
												<div class="paginacion">
													<button 
														class="btn-pagina"
														class:disabled={paginaActualTutoriales === 1}
														on:click={() => cambiarPaginaTutoriales(paginaActualTutoriales - 1)}
														disabled={paginaActualTutoriales === 1}
													>
														<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
															<path d="m15 18-6-6 6-6" stroke="currentColor" stroke-width="2"/>
														</svg>
													</button>
													
													{#each Array(totalPaginasTutoriales) as _, i}
														<button 
															class="btn-pagina"
															class:activa={paginaActualTutoriales === i + 1}
															on:click={() => cambiarPaginaTutoriales(i + 1)}
														>
															{i + 1}
														</button>
													{/each}
													
													<button 
														class="btn-pagina"
														class:disabled={paginaActualTutoriales === totalPaginasTutoriales}
														on:click={() => cambiarPaginaTutoriales(paginaActualTutoriales + 1)}
														disabled={paginaActualTutoriales === totalPaginasTutoriales}
													>
														<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
															<path d="m9 18 6-6-6-6" stroke="currentColor" stroke-width="2"/>
														</svg>
													</button>
												</div>
											{/if}
										</div>
									{/if}
								{/if}

								{#if filtroTipoContenido === 'todos' || filtroTipoContenido === 'paquetes'}
									<!-- Sección de Paquetes -->
									<div class="categoria-cursos">
										<div class="header-categoria">
											<h4>🎁 Paquetes Disponibles</h4>
											<span class="contador-resultados">
												{paquetesDisponibles.length} paquetes
											</span>
										</div>

										{#if cargandoPaquetes}
											<div class="cargando">Cargando paquetes...</div>
										{:else if paquetesDisponibles.length === 0}
											<div class="vacio">
												<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
													<path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" stroke-width="2"/>
												</svg>
												<p>No hay paquetes disponibles</p>
											</div>
										{:else}
											<div class="grid-cursos-disponibles">
												{#each paquetesDisponibles as paquete}
													<div class="curso-disponible paquete-item">
														<div class="curso-imagen-mini">
															<div class="paquete-icon">📦</div>
														</div>
														<div class="curso-info-mini">
															<h5>{paquete.titulo}</h5>
															<p class="paquete-detalles">
																{paquete.total_tutoriales || 0} tutoriales
															</p>
															<p class="precio">{formatearPrecioPaquete(paquete.precio_rebajado || paquete.precio_normal)}</p>
														</div>
														<button 
															class="btn-agregar-curso"
															on:click={() => agregarPaqueteAUsuario(paquete.id)}
															disabled={cargandoPaquetes}
															aria-label="Agregar paquete completo"
														>
															{cargandoPaquetes ? '...' : '+'}
														</button>
													</div>
												{/each}
											</div>
										{/if}
									</div>
								{/if}

								<!-- Componente de prueba para debug -->
								{#if paquetesDisponibles.length > 0}
									<TestPaquete usuarioId={usuario.id} paqueteId={paquetesDisponibles[0].id} />
								{/if}

								{#if cursosDisponiblesFiltrados.length === 0 && tutorialesDisponiblesFiltrados.length === 0}
									<div class="vacio">
										<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
											<path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" stroke="currentColor" stroke-width="2"/>
										</svg>
										<p>No se encontraron cursos disponibles</p>
										{#if busquedaCursos}
											<small>Intenta con otro término de búsqueda</small>
										{:else}
											<small>El usuario ya está inscrito en todos los cursos disponibles</small>
										{/if}
									</div>
								{/if}
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}

		{#if pestanaActiva === 'pagos'}
			<div class="pestana-contenido">
				<!-- Gestión de Membresía -->
				<div class="seccion seccion-membresia">
					<div class="header-seccion">
						<h3>Gestión de Membresía</h3>
						<button 
							class="btn-cambiar-membresia"
							on:click={() => mostrarGestionMembresia = !mostrarGestionMembresia}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
								<path d="M12 1L3 5l9 4 9-4-9-4zM3 5v14l9 4 9-4V5" stroke="currentColor" stroke-width="2"/>
							</svg>
							Cambiar Membresía
						</button>
					</div>

					<div class="membresia-actual">
						<div class="membresia-info">
							<div class="membresia-icon">
								{#if usuario.suscripcion === 'premium'}
									👑
								{:else if usuario.suscripcion === 'pro'}
									⭐
								{:else}
									🎓
								{/if}
							</div>
							<div class="membresia-detalles">
								<h4>Membresía Actual</h4>
								<p class="tipo-membresia">{usuario.suscripcion}</p>
								<p class="fecha-desde">Desde: {formatearFecha(usuario.fecha_creacion)}</p>
							</div>
						</div>
					</div>

					{#if mostrarGestionMembresia}
						<div class="selector-membresia">
							<h4>Seleccionar Nueva Membresía</h4>
							<div class="opciones-membresia">
								{#each ['gratis', 'basico', 'premium', 'pro', 'vip'] as tipoMembresia}
									<button
										class="opcion-membresia"
										class:activa={usuario.suscripcion === tipoMembresia}
										on:click={() => cambiarMembresia(tipoMembresia)}
										disabled={usuario.suscripcion === tipoMembresia || cargando}
									>
										<div class="membresia-icon">
											{#if tipoMembresia === 'premium'}
												👑
											{:else if tipoMembresia === 'pro'}
												⭐
											{:else if tipoMembresia === 'vip'}
												💎
											{:else if tipoMembresia === 'basico'}
												📚
											{:else}
												🎓
											{/if}
										</div>
										<span>{tipoMembresia}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>



				<!-- Historial de Pagos -->
				<div class="seccion">
					<h3>Historial de Pagos</h3>
					
					{#if cargandoPagos}
						<div class="cargando">Cargando historial de pagos...</div>
					{:else if historialPagos.length === 0}
						<div class="vacio">
							<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
								<path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/>
							</svg>
							<p>No hay historial de pagos</p>
						</div>
					{:else}
						<div class="lista-pagos">
							{#each historialPagos as pago}
								<div class="pago-item">
									<div class="pago-info">
										<h4>{pago.descripcion || pago.nombre_producto || 'Pago'}</h4>
										<p class="fecha">{formatearFecha(pago.fecha_transaccion || pago.created_at)}</p>
										<p class="referencia">Ref: {pago.ref_payco}</p>
									</div>
									<div class="pago-monto">
										<span class="monto">{formatearPrecio(pago.valor)}</span>
										<span class="estado estado-{pago.estado}">
											{pago.estado}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}

		{#if pestanaActiva === 'actividad'}
			<!-- 🔥 NUEVA PESTAÑA ACTIVIDAD CON DATOS REALES -->
			<PestanaActividad {usuario} />
		{/if}

		{#if pestanaActiva === 'geolocalizacion'}
			<!-- 🌍 NUEVA PESTAÑA GEOLOCALIZACIÓN -->
			<PestanaGeolocalizacion {usuario} />
		{/if}

		{#if pestanaActiva === 'configuracion'}
			<div class="pestana-contenido">
				<!-- Gestión de Membresía -->
				<div class="seccion seccion-membresia">
					<div class="header-seccion">
						<h3>Gestión de Membresía</h3>
						<button 
							class="btn-cambiar-membresia"
							on:click={() => mostrarGestionMembresia = !mostrarGestionMembresia}
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
								<path d="M12 1L3 5l9 4 9-4-9-4zM3 5v14l9 4 9-4V5" stroke="currentColor" stroke-width="2"/>
							</svg>
							Cambiar Membresía
						</button>
					</div>

					<div class="membresia-actual">
						<div class="membresia-info">
							<div class="membresia-icon">
								{#if usuario.suscripcion === 'premium'}
									👑
								{:else if usuario.suscripcion === 'pro'}
									⭐
								{:else}
									🎓
								{/if}
							</div>
							<div class="membresia-detalles">
								<h4>Membresía Actual</h4>
								<p class="tipo-membresia">{usuario.suscripcion}</p>
								<p class="fecha-desde">Desde: {formatearFecha(usuario.fecha_creacion)}</p>
							</div>
						</div>
					</div>

					{#if mostrarGestionMembresia}
						<div class="selector-membresia">
							<h4>Seleccionar Nueva Membresía</h4>
							<div class="opciones-membresia">
								{#each ['gratis', 'basico', 'premium', 'pro', 'vip'] as tipoMembresia}
									<button
										class="opcion-membresia"
										class:activa={usuario.suscripcion === tipoMembresia}
										on:click={() => cambiarMembresia(tipoMembresia)}
										disabled={usuario.suscripcion === tipoMembresia || cargando}
									>
										<div class="membresia-icon">
											{#if tipoMembresia === 'premium'}
												👑
											{:else if tipoMembresia === 'pro'}
												⭐
											{:else if tipoMembresia === 'vip'}
												💎
											{:else if tipoMembresia === 'basico'}
												📚
											{:else}
												🎓
											{/if}
										</div>
										<span>{tipoMembresia}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>



				<!-- Historial de Pagos -->
				<div class="seccion">
					<h3>Historial de Pagos</h3>
					
					{#if cargandoPagos}
						<div class="cargando">Cargando historial de pagos...</div>
					{:else if historialPagos.length === 0}
						<div class="vacio">
							<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
								<path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" fill="currentColor"/>
							</svg>
							<p>No hay historial de pagos</p>
						</div>
					{:else}
						<div class="lista-pagos">
							{#each historialPagos as pago}
								<div class="pago-item">
									<div class="pago-info">
										<h4>{pago.descripcion || pago.nombre_producto || 'Pago'}</h4>
										<p class="fecha">{formatearFecha(pago.fecha_transaccion || pago.created_at)}</p>
										<p class="referencia">Ref: {pago.ref_payco}</p>
									</div>
									<div class="pago-monto">
										<span class="monto">{formatearPrecio(pago.valor)}</span>
										<span class="estado estado-{pago.estado}">
											{pago.estado}
										</span>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.detalle-usuario {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 15px;
		color: white;
		max-height: 90vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.header-detalle {
		padding: 30px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.info-header {
		display: flex;
		gap: 20px;
		align-items: center;
	}

	.avatar-grande {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid rgba(255, 255, 255, 0.3);
	}

	.avatar-grande img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-iniciales {
		width: 100%;
		height: 100%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		font-weight: bold;
		color: white;
	}

	.info-basica h2 {
		margin: 0 0 5px 0;
		font-size: 24px;
		font-weight: 700;
	}

	.correo {
		margin: 0 0 15px 0;
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
	}

	.badges {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		text-transform: capitalize;
	}

	.badge-estudiante, .badge-user { background: rgba(33, 150, 243, 0.3); border: 1px solid #2196F3; }
	.badge-admin { background: rgba(244, 67, 54, 0.3); border: 1px solid #f44336; }
	.badge-profesor { background: rgba(255, 152, 0, 0.3); border: 1px solid #ff9800; }
	.badge-free { background: rgba(158, 158, 158, 0.3); border: 1px solid #9e9e9e; }
	.badge-premium { background: rgba(156, 39, 176, 0.3); border: 1px solid #9c27b0; }
	.badge-activo { background: rgba(76, 175, 80, 0.3); border: 1px solid #4CAF50; }
	.badge-eliminado { background: rgba(244, 67, 54, 0.3); border: 1px solid #f44336; }

	.acciones-header {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.btn-editar {
		background: rgba(102, 126, 234, 0.2);
		border: 1px solid #667eea;
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: all 0.3s ease;
	}

	.btn-editar:hover {
		background: rgba(102, 126, 234, 0.3);
	}

	.btn-cerrar {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		color: white;
		font-size: 18px;
		font-weight: bold;
		padding: 8px 12px;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-cerrar:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.error {
		background: rgba(244, 67, 54, 0.2);
		border: 1px solid #f44336;
		border-radius: 8px;
		padding: 15px;
		margin: 0 30px 20px 30px;
		color: #ff6b6b;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.exito {
		background: rgba(76, 175, 80, 0.2);
		border: 1px solid #4CAF50;
		border-radius: 8px;
		padding: 15px;
		margin: 0 30px 20px 30px;
		color: #4CAF50;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.pestanas {
		display: flex;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding: 0 30px;
		gap: 5px;
	}

	.pestana {
		background: none;
		border: none;
		color: rgba(255, 255, 255, 0.7);
		padding: 15px 20px;
		cursor: pointer;
		border-bottom: 2px solid transparent;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		font-weight: 500;
	}

	.pestana.activa {
		color: white;
		border-bottom-color: #667eea;
		background: rgba(102, 126, 234, 0.1);
	}

	.pestana:hover:not(.activa) {
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.05);
	}

	.contenido-pestanas {
		flex: 1;
		overflow-y: auto; /* Restauramos scroll principal */
		padding: 30px;
		min-height: 0; /* FIX: Evita el doble scroll en contenedores flex */
	}

	.pestana-contenido {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.seccion {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 25px;
		flex: 1; /* Ocupa todo el espacio disponible en la zona-drop */
		display: flex;
		flex-direction: column;
	}

	.seccion h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 10px;
	}

	.campos-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
	}

	.campo {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.campo label {
		font-weight: 600;
		font-size: 14px;
		color: rgba(255, 255, 255, 0.9);
	}

	.campo span {
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
	}

	.campo input, .campo select {
		padding: 12px 15px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		color: white;
		font-size: 14px;
	}

	.campo input:focus, .campo select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
	}

	.acciones-edicion {
		display: flex;
		gap: 15px;
		justify-content: flex-end;
		padding-top: 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-cancelar {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-guardar {
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.acciones-usuario {
		display: flex;
		justify-content: flex-end;
		padding-top: 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-eliminar {
		background: rgba(244, 67, 54, 0.2);
		color: #ff6b6b;
		border: 1px solid #f44336;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-eliminar:hover {
		background: rgba(244, 67, 54, 0.3);
	}

	.cargando, .vacio {
		text-align: center;
		padding: 40px;
		color: rgba(255, 255, 255, 0.7);
	}

	.vacio svg {
		opacity: 0.5;
		margin-bottom: 15px;
	}

	.lista-cursos, .lista-pagos {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.curso-item, .pago-item {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 20px;
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.curso-imagen {
		width: 60px;
		height: 60px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.curso-imagen img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.curso-info {
		flex: 1;
	}

	.curso-info h4 {
		margin: 0 0 5px 0;
		font-size: 16px;
		font-weight: 600;
	}

	.curso-info p {
		margin: 0;
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
	}

	.tipo {
		font-weight: 500;
		color: rgba(102, 126, 234, 0.8) !important;
	}

	.estado {
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
		text-transform: capitalize;
	}

	.estado-activo { background: rgba(76, 175, 80, 0.3); color: #4CAF50; }
	.estado-pendiente { background: rgba(255, 152, 0, 0.3); color: #ff9800; }
	.estado-completado { background: rgba(33, 150, 243, 0.3); color: #2196F3; }

	.btn-quitar {
		background: rgba(244, 67, 54, 0.2);
		color: #ff6b6b;
		border: 1px solid #f44336;
		padding: 8px 16px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.pago-info {
		flex: 1;
	}

	.pago-info h4 {
		margin: 0 0 5px 0;
		font-size: 16px;
		font-weight: 600;
	}

	.pago-monto {
		text-align: right;
	}

	.monto {
		font-size: 18px;
		font-weight: 700;
		color: #4CAF50;
		display: block;
		margin-bottom: 5px;
	}

	.estadisticas-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 20px;
		margin-bottom: 30px;
	}

	.stat-card {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 20px;
		text-align: center;
	}

	.stat-valor {
		font-size: 24px;
		font-weight: 700;
		color: #667eea;
		margin-bottom: 5px;
	}

	.stat-label {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.7);
	}

	.paginas-favoritas h4 {
		margin: 0 0 15px 0;
		font-size: 16px;
		font-weight: 600;
	}

	.pagina-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.pagina-item:last-child {
		border-bottom: none;
	}

	.pagina-nombre {
		font-size: 14px;
		color: rgba(255, 255, 255, 0.9);
	}

	.pagina-visitas {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
	}

	/* ===== NIVEL 2: ESTILOS AVANZADOS ===== */

	/* Header de secciones con botones */
	.header-seccion {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
	}

	.header-seccion h3 {
		margin: 0;
	}

	/* ===== DISEÑO HORIZONTAL PARA CURSOS ===== */
	.layout-cursos-horizontal {
		display: flex;
		gap: 20px;
		/* Quitamos height y min-height para eliminar restricciones de altura */
	}

	.columna-izquierda {
		flex: 1;
		min-width: 0;
		min-height: 500px; /* Altura mínima igual */
		display: flex;
		flex-direction: column;
	}

	.columna-derecha {
		flex: 1;
		min-width: 0;
		min-height: 500px; /* Altura mínima igual */
		display: flex;
		flex-direction: column;
	}

	/* Contador de cursos */
	.contador-cursos {
		background: rgba(102, 126, 234, 0.2);
		color: #667eea;
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
	}

	/* Lista de cursos compacta */
	.lista-cursos-compacta {
		display: flex;
		flex-direction: column;
		gap: 12px;
		flex: 1; /* Ocupa el espacio disponible pero sin scroll interno */
		min-height: 0; /* Permite que se redimensione */
	}

	.curso-item-compacto {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		transition: all 0.2s ease;
	}

	.curso-item-compacto:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: translateY(-1px);
	}

	.curso-item-compacto .curso-imagen-mini {
		width: 50px;
		height: 50px;
		border-radius: 6px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.curso-item-compacto .curso-imagen-mini img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.curso-item-compacto .curso-info-mini {
		flex: 1;
		min-width: 0;
	}

	.curso-item-compacto .curso-info-mini h4 {
		margin: 0 0 4px 0;
		font-size: 14px;
		font-weight: 600;
		color: white;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.curso-item-compacto .curso-info-mini p {
		margin: 0;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
		line-height: 1.4;
	}

	.curso-item-compacto .estado {
		font-size: 10px;
		padding: 2px 8px;
		border-radius: 12px;
		font-weight: 500;
		text-transform: uppercase;
	}

	.btn-quitar-mini {
		background: rgba(244, 67, 54, 0.2);
		border: 1px solid rgba(244, 67, 54, 0.3);
		color: #f44336;
		padding: 6px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-quitar-mini:hover {
		background: rgba(244, 67, 54, 0.3);
		transform: scale(1.05);
	}

	/* Header de categorías */
	.header-categoria {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 15px;
	}

	.header-categoria h4 {
		margin: 0;
	}

	.contador-resultados {
		background: rgba(102, 126, 234, 0.2);
		color: #667eea;
		padding: 4px 12px;
		border-radius: 15px;
		font-size: 12px;
		font-weight: 500;
	}

	/* ===== PAGINACIÓN ===== */
	.paginacion {
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
		margin-top: 20px;
		padding: 15px 0;
	}

	.btn-pagina {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: rgba(255, 255, 255, 0.7);
		padding: 8px 12px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		height: 36px;
		font-size: 14px;
		font-weight: 500;
	}

	.btn-pagina:hover:not(.disabled) {
		background: rgba(102, 126, 234, 0.2);
		border-color: rgba(102, 126, 234, 0.4);
		color: #667eea;
		transform: translateY(-1px);
	}

	.btn-pagina.activa {
		background: rgba(102, 126, 234, 0.3);
		border-color: #667eea;
		color: #667eea;
	}

	.btn-pagina.disabled {
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.3);
		cursor: not-allowed;
	}

	/* Responsive para móviles */
	@media (max-width: 768px) {
		.layout-cursos-horizontal {
			flex-direction: column;
			gap: 15px;
		}

		.columna-izquierda,
		.columna-derecha {
			flex: none;
			min-height: 300px; /* Altura mínima menor en móviles */
		}

		.header-categoria {
			flex-direction: column;
			gap: 8px;
			align-items: flex-start;
		}

		.contador-resultados {
			align-self: flex-end;
		}

		.paginacion {
			flex-wrap: wrap;
			gap: 6px;
		}

		.btn-pagina {
			min-width: 32px;
			height: 32px;
			padding: 6px 10px;
			font-size: 12px;
		}

		.grid-cursos-disponibles {
			grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
		}
	}

	/* Botón agregar cursos */
	.btn-agregar-cursos {
		background: rgba(76, 175, 80, 0.2);
		border: 1px solid #4CAF50;
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: all 0.3s ease;
		font-size: 14px;
	}

	.btn-agregar-cursos:hover {
		background: rgba(76, 175, 80, 0.3);
		transform: translateY(-1px);
	}

	/* Zona de drop para drag & drop */
	.zona-drop {
		flex: 1; /* Ocupa todo el espacio disponible */
		border: 2px dashed transparent;
		border-radius: 12px;
		transition: all 0.3s ease;
		display: flex;
		flex-direction: column;
	}

	.zona-drop:hover {
		border-color: rgba(102, 126, 234, 0.5);
		background: rgba(102, 126, 234, 0.05);
	}

	/* Sección para agregar cursos */
	.seccion-agregar {
		background: rgba(33, 150, 243, 0.1);
		border: 1px solid rgba(33, 150, 243, 0.3);
		border-radius: 12px;
		flex: 1; /* Ocupa todo el espacio disponible */
		display: flex;
		flex-direction: column;
	}

	/* Buscador de cursos */
	.buscador-cursos {
		position: relative;
		margin-bottom: 20px;
	}

	.buscador-cursos svg {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(255, 255, 255, 0.5);
	}

	.buscador-cursos input {
		width: 100%;
		padding: 12px 12px 12px 40px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 8px;
		color: white;
		font-size: 14px;
	}

	.buscador-cursos input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	/* Categorías de cursos */
	.categoria-cursos {
		margin-bottom: 30px;
	}

	.categoria-cursos h4 {
		margin-bottom: 15px;
		color: rgba(255, 255, 255, 0.9);
		font-size: 16px;
	}

	/* Grid de cursos disponibles */
	.grid-cursos-disponibles {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 15px;
	}

	/* Curso disponible (draggable) */
	.curso-disponible {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		padding: 15px;
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: grab;
		transition: all 0.3s ease;
	}

	.curso-disponible:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
	}

	.curso-disponible:active {
		cursor: grabbing;
	}

	.curso-imagen-mini {
		width: 50px;
		height: 50px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
	}

	.curso-imagen-mini img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.curso-info-mini {
		flex: 1;
		min-width: 0;
	}

	.curso-info-mini h5 {
		margin: 0 0 5px 0;
		font-size: 14px;
		font-weight: 600;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.curso-info-mini .precio,
	.curso-info-mini .duracion {
		margin: 0;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
	}

	/* Botón agregar curso individual */
	.btn-agregar-curso {
		background: rgba(76, 175, 80, 0.2);
		border: 1px solid #4CAF50;
		color: white;
		padding: 8px;
		border-radius: 6px;
		cursor: pointer;
		transition: all 0.3s ease;
		flex-shrink: 0;
	}

	.btn-agregar-curso:hover {
		background: rgba(76, 175, 80, 0.3);
		transform: scale(1.1);
	}

	/* ===== GESTIÓN DE MEMBRESÍAS ===== */

	.seccion-membresia {
		background: rgba(156, 39, 176, 0.1);
		border: 1px solid rgba(156, 39, 176, 0.3);
		border-radius: 12px;
		margin-bottom: 20px;
	}

	.btn-cambiar-membresia {
		background: rgba(156, 39, 176, 0.2);
		border: 1px solid #9c27b0;
		color: white;
		padding: 8px 16px;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: all 0.3s ease;
		font-size: 14px;
	}

	.btn-cambiar-membresia:hover {
		background: rgba(156, 39, 176, 0.3);
		transform: translateY(-1px);
	}

	/* Membresía actual */
	.membresia-actual {
		margin-bottom: 20px;
	}

	.membresia-info {
		display: flex;
		align-items: center;
		gap: 15px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 10px;
		padding: 20px;
	}

	.membresia-icon {
		font-size: 32px;
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 50%;
	}

	.membresia-detalles h4 {
		margin: 0 0 5px 0;
		font-size: 16px;
		color: rgba(255, 255, 255, 0.9);
	}

	.tipo-membresia {
		margin: 0 0 5px 0;
		font-size: 18px;
		font-weight: 700;
		color: #9c27b0;
		text-transform: capitalize;
	}

	.fecha-desde {
		margin: 0;
		font-size: 12px;
		color: rgba(255, 255, 255, 0.6);
	}

	/* Selector de membresías */
	.selector-membresia {
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		padding-top: 20px;
		margin-top: 20px;
	}

	.selector-membresia h4 {
		margin-bottom: 15px;
		color: rgba(255, 255, 255, 0.9);
	}

	.opciones-membresia {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
	}

	.opcion-membresia {
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		padding: 12px 16px;
		border-radius: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 8px;
		transition: all 0.3s ease;
		text-transform: capitalize;
	}

	.opcion-membresia:hover:not(:disabled) {
		background: rgba(156, 39, 176, 0.2);
		border-color: #9c27b0;
		transform: translateY(-1px);
	}

	.opcion-membresia.activa {
		background: rgba(156, 39, 176, 0.3);
		border-color: #9c27b0;
	}

	.opcion-membresia:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.opcion-membresia .membresia-icon {
		width: auto;
		height: auto;
		background: none;
		font-size: 16px;
	}

	/* Mejoras en lista de cursos inscritos */
	.curso-item .precio {
		color: #4CAF50;
		font-weight: 600;
	}

	@media (max-width: 768px) {
		.header-detalle {
			flex-direction: column;
			gap: 20px;
			align-items: center;
		}

		.info-header {
			flex-direction: column;
			text-align: center;
			align-items: center;
			width: 100%;
		}

		.badges {
			justify-content: center;
		}

		.campos-grid {
			grid-template-columns: 1fr;
		}

		.pestanas {
			flex-wrap: nowrap;
			overflow-x: auto;
			padding: 20px 15px;
			-ms-overflow-style: none; /* IE and Edge */
			scrollbar-width: none; /* Firefox */
		}
		.pestanas::-webkit-scrollbar {
			display: none; /* Chrome, Safari, Opera */
		}

		.pestana {
			flex-shrink: 0;
		}

		.contenido-pestanas {
			padding: 20px 15px;
		}

		.curso-item, .pago-item {
			flex-direction: column;
			text-align: center;
		}

		.grid-cursos-disponibles {
			grid-template-columns: 1fr;
		}

		.opciones-membresia {
			flex-direction: column;
		}

		.header-seccion {
			flex-direction: column;
			gap: 10px;
			align-items: stretch;
		}
	}

	/* ===== GESTIÓN DE PAQUETES ===== */
	.btn-agregar-paquete {
		display: flex;
		align-items: center;
		gap: 8px;
		background: rgba(40, 167, 69, 0.2);
		color: #28a745;
		border: 1px solid #28a745;
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 14px;
	}

	.btn-agregar-paquete:hover {
		background: rgba(40, 167, 69, 0.3);
		transform: translateY(-1px);
	}

	.paquetes-disponibles {
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 10px;
		padding: 20px;
		margin-top: 20px;
	}

	.paquetes-disponibles h4 {
		margin: 0 0 15px 0;
		color: white;
	}

	.lista-paquetes-disponibles {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.paquete-item-disponible {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 15px;
		transition: all 0.3s ease;
	}

	.paquete-item-disponible:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.paquete-info h5 {
		margin: 0 0 8px 0;
		color: white;
		font-size: 16px;
	}

	.paquete-descripcion {
		color: rgba(255, 255, 255, 0.7);
		font-size: 14px;
		margin: 0 0 10px 0;
		line-height: 1.4;
	}

	.paquete-detalles {
		display: flex;
		gap: 15px;
		align-items: center;
	}

	.tutoriales-count {
		color: #667eea;
		font-size: 12px;
		font-weight: 500;
	}

	.precio {
		color: #28a745;
		font-weight: 600;
		font-size: 14px;
	}

	.btn-agregar-paquete-item {
		background: rgba(102, 126, 234, 0.2);
		color: #667eea;
		border: 1px solid #667eea;
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 14px;
	}

	.btn-agregar-paquete-item:hover:not(:disabled) {
		background: rgba(102, 126, 234, 0.3);
		transform: translateY(-1px);
	}

	.btn-agregar-paquete-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.paquetes-inscritos {
		margin-top: 20px;
	}

	.paquetes-inscritos h4 {
		margin: 0 0 15px 0;
		color: white;
	}

	.lista-paquetes-inscritos {
		display: flex;
		flex-direction: column;
		gap: 15px;
	}

	.paquete-item-inscrito {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 8px;
		padding: 15px;
		transition: all 0.3s ease;
	}

	.paquete-item-inscrito:hover {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.2);
	}

	.fecha-inscripcion {
		color: rgba(255, 255, 255, 0.6);
		font-size: 12px;
		margin: 5px 0;
	}

	.progreso-paquete {
		margin-top: 10px;
	}

	.progreso-bar {
		background: rgba(255, 255, 255, 0.1);
		height: 8px;
		border-radius: 4px;
		overflow: hidden;
		margin-bottom: 5px;
	}

	.progreso-fill {
		background: linear-gradient(90deg, #667eea, #764ba2);
		height: 100%;
		transition: width 0.3s ease;
	}

	.progreso-texto {
		color: rgba(255, 255, 255, 0.7);
		font-size: 12px;
		font-weight: 500;
	}

	.btn-ver-paquete {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 14px;
	}

	.btn-ver-paquete:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	/* Estilos para la sección de paquetes en la pestaña cursos */
	.btn-agregar-paquete-small {
		background: rgba(102, 126, 234, 0.2);
		color: #667eea;
		border: 1px solid #667eea;
		padding: 6px 12px;
		border-radius: 4px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 12px;
	}

	.btn-agregar-paquete-small:hover {
		background: rgba(102, 126, 234, 0.3);
		transform: translateY(-1px);
	}

	.paquete-item {
		border: 2px solid rgba(102, 126, 234, 0.3);
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(102, 126, 234, 0.05));
	}

	.paquete-item:hover {
		border-color: rgba(102, 126, 234, 0.5);
		transform: translateY(-2px);
	}

	.paquete-icon {
		width: 40px;
		height: 40px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea, #764ba2);
		border-radius: 8px;
		font-size: 18px;
		color: white;
	}

	.paquete-detalles {
		color: #667eea;
		font-size: 13px;
		font-weight: 500;
		margin: 4px 0;
	}

	/* Estilos para paquetes inscritos en la columna izquierda */
	.paquete-inscrito {
		border-left: 4px solid #667eea;
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(102, 126, 234, 0.05));
	}

	.paquete-icon-mini {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea, #764ba2);
		border-radius: 6px;
		font-size: 16px;
		color: white;
	}

	.progreso-mini {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 4px;
	}

	.progreso-bar-mini {
		height: 4px;
		background: #667eea;
		border-radius: 2px;
		transition: width 0.3s ease;
		flex: 1;
	}

	.progreso-texto-mini {
		font-size: 11px;
		color: #667eea;
		font-weight: 600;
		min-width: 35px;
	}

	.btn-ver-mini {
		background: rgba(102, 126, 234, 0.2);
		color: #667eea;
		border: 1px solid #667eea;
		padding: 6px;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-ver-mini:hover {
		background: rgba(102, 126, 234, 0.3);
		transform: translateY(-1px);
	}

	/* Estilos para paquetes inscritos expandidos */
	.paquete-inscrito-expandido {
		background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(102, 126, 234, 0.05));
		border: 2px solid rgba(102, 126, 234, 0.3);
		border-radius: 12px;
		padding: 20px;
		margin-bottom: 20px;
		transition: all 0.3s ease;
	}

	.paquete-inscrito-expandido:hover {
		border-color: rgba(102, 126, 234, 0.5);
		transform: translateY(-2px);
		box-shadow: 0 8px 25px rgba(102, 126, 234, 0.2);
	}

	.paquete-header {
		display: flex;
		align-items: flex-start;
		gap: 15px;
		margin-bottom: 15px;
	}

	.paquete-icon-grande {
		width: 60px;
		height: 60px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea, #764ba2);
		border-radius: 12px;
		font-size: 28px;
		color: white;
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
	}

	.paquete-info-principal {
		flex: 1;
	}

	.paquete-info-principal h5 {
		margin: 0 0 8px 0;
		color: white;
		font-size: 18px;
		font-weight: 600;
	}

	.paquete-descripcion {
		color: rgba(255, 255, 255, 0.8);
		font-size: 14px;
		margin: 0 0 12px 0;
		line-height: 1.4;
	}

	.paquete-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		font-size: 12px;
	}

	.paquete-meta span {
		background: rgba(255, 255, 255, 0.1);
		padding: 4px 8px;
		border-radius: 12px;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
	}

	.paquete-acciones {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.progreso-circular {
		width: 50px;
		height: 50px;
		border-radius: 50%;
		background: conic-gradient(#667eea 0deg, #667eea calc(var(--progress, 0) * 3.6deg), rgba(255, 255, 255, 0.2) calc(var(--progress, 0) * 3.6deg));
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
	}

	.progreso-circular::before {
		content: '';
		position: absolute;
		width: 35px;
		height: 35px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.1);
	}

	.progreso-porcentaje {
		font-size: 11px;
		font-weight: 600;
		color: white;
		z-index: 1;
	}

	.botones-paquete {
		display: flex;
		gap: 8px;
		flex-wrap: wrap;
	}

	.btn-ver-paquete-detalle {
		background: rgba(102, 126, 234, 0.3);
		color: #667eea;
		border: 1px solid #667eea;
		padding: 8px 16px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s ease;
		font-size: 12px;
	}

	.btn-ver-paquete-detalle:hover {
		background: rgba(102, 126, 234, 0.5);
		color: white;
		transform: translateY(-1px);
	}

	.btn-eliminar-paquete {
		background: rgba(220, 53, 69, 0.3);
		color: #dc3545;
		border: 1px solid #dc3545;
		padding: 8px 16px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		transition: all 0.3s ease;
		font-size: 12px;
	}

	.btn-eliminar-paquete:hover {
		background: rgba(220, 53, 69, 0.5);
		color: white;
		transform: translateY(-1px);
	}

	.btn-eliminar-paquete:disabled {
		background: rgba(220, 53, 69, 0.2);
		color: rgba(220, 53, 69, 0.5);
		cursor: not-allowed;
		transform: none;
	}

	.btn-ver-paquete-detalle:disabled {
		background: rgba(102, 126, 234, 0.2);
		color: rgba(102, 126, 234, 0.5);
		cursor: not-allowed;
		transform: none;
	}

	.paquete-inscrito-expandido.eliminando {
		opacity: 0.6;
		pointer-events: none;
	}

	.tutoriales-paquete {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 8px;
		padding: 15px;
		margin-top: 15px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.tutoriales-paquete h6 {
		margin: 0 0 10px 0;
		color: white;
		font-size: 14px;
		font-weight: 600;
	}

	.lista-tutoriales-mini {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.tutorial-item-mini {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 6px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		transition: all 0.3s ease;
	}

	.tutorial-item-mini:hover {
		background: rgba(255, 255, 255, 0.1);
		border-color: rgba(102, 126, 234, 0.3);
	}

	.tutorial-estado {
		font-size: 14px;
		min-width: 20px;
		text-align: center;
	}

	.tutorial-info {
		flex: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.tutorial-titulo {
		color: white;
		font-size: 13px;
		font-weight: 500;
	}

	.tutorial-duracion {
		color: rgba(255, 255, 255, 0.7);
		font-size: 12px;
	}

	.sin-tutoriales, .error-tutoriales {
		color: rgba(255, 255, 255, 0.6);
		font-size: 12px;
		text-align: center;
		padding: 10px;
		font-style: italic;
	}

	.error-tutoriales {
		color: #ff6b6b;
	}

	/* Estilos para filtros de contenido */
	.filtros-contenido {
		display: flex;
		gap: 8px;
		margin-bottom: 20px;
		flex-wrap: wrap;
	}

	.filtro-btn {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(255, 255, 255, 0.2);
		padding: 8px 16px;
		border-radius: 20px;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.filtro-btn:hover {
		background: rgba(255, 255, 255, 0.2);
		color: white;
		transform: translateY(-1px);
	}

	.filtro-btn.activo {
		background: rgba(102, 126, 234, 0.3);
		color: #667eea;
		border-color: #667eea;
	}

	.filtro-btn.activo:hover {
		background: rgba(102, 126, 234, 0.4);
	}
</style> 