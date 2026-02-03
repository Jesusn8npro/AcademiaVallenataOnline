<!-- =====================================================
💬 ACADEMIA VALLENATA ONLINE - WIDGET DE CHAT
===================================================== -->
<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase/clienteSupabase';
	import { chatWidgetVisible } from '$lib/stores/chatWidgetStore';
	import { chatService } from '$lib/services/chatService';
	import { leadsService } from '$lib/services/leadsService';
	import { generateSlug } from '$lib/utilidades/utilidadesSlug';

	// 🎯 ESTADO DEL CHAT
	let chatAbierto = false;
	let chatPuedeIniciar = false;
	let mensajes = [];
	let nuevoMensaje = '';
	let escribiendo = false;
	let infoUsuario = null;
	let chatId = '';
	let contenedorMensajes; // Referencia al contenedor de mensajes

	// 🎯 MODAL DE DATOS GUEST
	let mostrarModalDatos = false;
	let datosGuest = { 
		nombre: '', 
		email: '', 
		whatsapp: '', 
		tipoConsulta: 'general' 
	};

	// 📱 CONFIGURACIÓN DE PAÍSES Y CÓDIGOS
	let paisSeleccionado = {
		codigo: '+57',
		pais: 'CO',
		bandera: '🇨🇴',
		digitos: 10,
		formato: '3XX XXX XXXX'
	};
	
	const paisesPrincipales = [
		{ codigo: '+57', pais: 'Colombia', bandera: '🇨🇴', digitos: 10, formato: '3XX XXX XXXX' },
		{ codigo: '+58', pais: 'Venezuela', bandera: '🇻🇪', digitos: 10, formato: '4XX XXX XXXX' },
		{ codigo: '+1', pais: 'Estados Unidos', bandera: '🇺🇸', digitos: 10, formato: 'XXX XXX XXXX' },
		{ codigo: '+56', pais: 'Chile', bandera: '🇨🇱', digitos: 9, formato: '9X XXX XXXX' },
		{ codigo: '+52', pais: 'México', bandera: '🇲🇽', digitos: 10, formato: '1 XXX XXX XXXX' },
		{ codigo: '+54', pais: 'Argentina', bandera: '🇦🇷', digitos: 10, formato: '9 XX XXXX XXXX' },
		{ codigo: '+51', pais: 'Perú', bandera: '🇵🇪', digitos: 9, formato: '9XX XXX XXX' },
		{ codigo: '+593', pais: 'Ecuador', bandera: '🇪🇨', digitos: 8, formato: '9X XXX XXXX' },
		{ codigo: '+55', pais: 'Brasil', bandera: '🇧🇷', digitos: 11, formato: 'XX 9XXXX XXXX' }
	];
	
	let numeroTelefono = '';
	let selectorVisible = false;
	let selectorConsultaVisible = false;
	
	const tiposConsulta = [
		{ valor: 'general', texto: '💬 Consulta general' },
		{ valor: 'cursos', texto: '📚 Información sobre cursos' },
		{ valor: 'precios', texto: '💰 Precios y membresías' },
		{ valor: 'tecnico', texto: '🔧 Soporte técnico' },
		{ valor: 'otro', texto: '❓ Otro tema' }
	];

	// 📱 FUNCIONES SELECTOR DE PAÍSES
	function seleccionarPais(pais) {
		paisSeleccionado = pais;
		numeroTelefono = '';
		selectorVisible = false;
	}

	function alternarSelector() {
		console.log('🔄 Alternando selector de países. Estado anterior:', selectorVisible);
		selectorVisible = !selectorVisible;
		console.log('🔄 Nuevo estado del selector:', selectorVisible);
	}

	function validarNumeroTelefono(numero) {
		// Limpiar el número (solo dígitos)
		const numeroLimpio = numero.replace(/\D/g, '');
		
		// Validar longitud según el país seleccionado
		if (numeroLimpio.length === paisSeleccionado.digitos) {
			datosGuest.whatsapp = paisSeleccionado.codigo + numeroLimpio;
			return true;
		}
		return false;
	}

	function formatearNumeroInput(event) {
		const input = event.target;
		let valor = input.value.replace(/\D/g, '');
		
		// Limitar longitud según país seleccionado
		if (valor.length > paisSeleccionado.digitos) {
			valor = valor.slice(0, paisSeleccionado.digitos);
		}
		
		numeroTelefono = valor;
		validarNumeroTelefono(valor);
	}

	// 📋 FUNCIONES SELECTOR DE CONSULTAS
	function alternarSelectorConsulta() {
		selectorConsultaVisible = !selectorConsultaVisible;
	}

	function seleccionarConsulta(consulta) {
		datosGuest.tipoConsulta = consulta.valor;
		selectorConsultaVisible = false;
	}

	function obtenerTextoConsulta() {
		const consulta = tiposConsulta.find(c => c.valor === datosGuest.tipoConsulta);
		return consulta ? consulta.texto : '💬 Consulta general';
	}

	// 🎯 CONFIGURACIÓN
	const URL_WEBHOOK = 'https://velostrategix-n8n.lnrubg.easypanel.host/webhook/chat';
	console.log('🌐 URL del Webhook configurada:', URL_WEBHOOK);

	// 🚀 INICIALIZACIÓN
	onMount(async () => {
		await detectarUsuario();
		chatId = generarChatId();
		await cargarHistorialChat();
		console.log('🆔 Chat ID generado:', chatId);
		
		// 📡 ESCUCHAR EVENTOS DEL MODAL DE BÚSQUEDA
		// Función para manejar toggle
		const manejarToggleChat = () => {
			chatAbierto = !chatAbierto;
			console.log('💬 Chat Widget toggled:', chatAbierto);
		};

		window.addEventListener('abrirChatWidget', manejarEventoAbrirChat);
		window.addEventListener('toggleChatWidget', manejarToggleChat);
		
		// 📱 CERRAR SELECTORES AL HACER CLIC FUERA
		function cerrarSelectores(event) {
			if (!event.target.closest('.campo-whatsapp')) {
				selectorVisible = false;
			}
			if (!event.target.closest('.selector-consulta-container')) {
				selectorConsultaVisible = false;
			}
		}
		document.addEventListener('click', cerrarSelectores);
		
		return () => {
			window.removeEventListener('abrirChatWidget', manejarEventoAbrirChat);
		window.removeEventListener('toggleChatWidget', manejarToggleChat);
			document.removeEventListener('click', cerrarSelectores);
		};
	});

	// 🎯 MANEJAR EVENTO DE APERTURA DESDE MODAL DE BÚSQUEDA
	function manejarEventoAbrirChat(event) {
		console.log('🎯 [CHAT WIDGET] Evento recibido desde modal:', event.detail);
		
		const { mensaje, origen } = event.detail;
		
		// Abrir el chat
		abrirChat();
		
		// Si no hay datos de usuario, mostrar modal de datos
		if (!infoUsuario || !infoUsuario.email) {
			mostrarModalDatos = true;
			
			// Pre-llenar el tipo de consulta basado en el mensaje
			if (mensaje.includes('curso')) {
				datosGuest.tipoConsulta = 'cursos';
			} else if (mensaje.includes('tutorial')) {
				datosGuest.tipoConsulta = 'tutoriales';
			} else if (mensaje.includes('evento')) {
				datosGuest.tipoConsulta = 'eventos';
			} else {
				datosGuest.tipoConsulta = 'general';
			}
		} else {
			// Usuario logueado, solo pre-llenar el mensaje sin enviar
			setTimeout(() => {
				nuevoMensaje = mensaje;
				// NO enviar automáticamente - solo dejar listo para que el usuario escriba
			}, 500);
		}
	};

	// 🆔 GENERAR ID DEL CHAT
	function generarChatId() {
		if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
			return 'temp_ssr_' + Math.random().toString(36).substr(2, 9);
		}
		
		// Usuario logueado
		if (infoUsuario?.email) {
			const hashEmail = btoa(infoUsuario.email).slice(0, 8);
			const fechaHoy = new Date().toISOString().slice(0, 10);
			const id = `user_${hashEmail}_${fechaHoy}`;
			console.log('🆔 ChatID para usuario logueado:', id);
			return id;
		}
		
		// Usuario anónimo con datos
		try {
			const datosGuardados = localStorage.getItem('datosGuestChat');
			if (datosGuardados) {
				const { email } = JSON.parse(datosGuardados);
				const hashEmail = btoa(email).slice(0, 8);
				const fechaHoy = new Date().toISOString().slice(0, 10);
				const id = `guest_${hashEmail}_${fechaHoy}`;
				console.log('🆔 ChatID para guest con datos:', id);
				return id;
			}
		} catch (error) {
			console.log('Error accediendo a localStorage:', error);
		}
		
		// ID temporal persistente
		let idPersistente = sessionStorage.getItem('idChatTemporal');
		if (!idPersistente) {
			idPersistente = 'temp_' + Math.random().toString(36).substr(2, 9);
			sessionStorage.setItem('idChatTemporal', idPersistente);
		}
		console.log('🆔 ChatID temporal persistente:', idPersistente);
		return idPersistente;
	}

	// 👤 DETECTAR USUARIO
	async function detectarUsuario() {
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (session?.user) {
				// Obtener perfil completo desde la tabla perfiles
				const { data: perfil, error: errorPerfil } = await supabase
					.from('perfiles')
					.select('*')
					.eq('id', session.user.id)
					.single();

				if (perfil && !errorPerfil) {
					infoUsuario = {
						id: session.user.id,
						email: session.user.email || perfil.correo_electronico,
						nombre: perfil.nombre_completo || perfil.nombre || session.user.email,
						apellido: perfil.apellido,
						nombreUsuario: perfil.nombre_usuario,
						rol: perfil.rol,
						ciudad: perfil.ciudad,
						pais: perfil.pais,
						whatsapp: perfil.whatsapp,
						nivelHabilidad: perfil.nivel_habilidad,
						instrumento: perfil.instrumento,
						suscripcion: perfil.suscripcion,
						objetivoAprendizaje: perfil.objetivo_aprendizaje,
						anosExperiencia: perfil.ano_experiencia,
						estiloFavorito: perfil.estilo_favorito,
						estudiosMusicales: perfil.estudios_musicales,
						profesion: perfil.profesion,
						comoNosConocio: perfil.como_nos_conocio,
						fechaRegistro: perfil.fecha_creacion,
						...session.user.user_metadata
					};
					console.log('👤 Usuario detectado con perfil completo:', infoUsuario.nombre);
				} else {
					infoUsuario = {
						id: session.user.id,
						email: session.user.email,
						nombre: session.user.email,
						...session.user.user_metadata
					};
					console.log('👤 Usuario detectado (solo auth):', infoUsuario.email);
				}
			}
		} catch (error) {
			console.log('Usuario no logueado:', error);
		}
	}

	// 📊 OBTENER CONTEXTO COMPLETO DEL USUARIO
	async function obtenerContextoCompleto() {
		console.log('🔍 [CHAT] INICIANDO obtenerContextoCompleto() con infoUsuario:', infoUsuario);
		console.log('🔍 [CHAT] infoUsuario?.id:', infoUsuario?.id);
		
		if (!infoUsuario?.id) {
			console.error('❌ [CHAT] NO HAY infoUsuario.id - saltando contexto completo');
			return '';
		}

		try {
			// LÓGICA EXACTA COPIADA DE MIS CURSOS (NO DE ESTUDIANTE)
			console.log('🔍 [CHAT] Cargando inscripciones para usuario:', infoUsuario.id);
			
			// PASO 1: Obtener TODAS las inscripciones (IGUAL QUE MIS CURSOS)
			const { data: inscripcionesData, error: inscripcionError } = await supabase
				.from('inscripciones')
				.select('*')
				.eq('usuario_id', infoUsuario.id)
				.order('fecha_inscripcion', { ascending: false });

			console.log('📋 [CHAT] Inscripciones encontradas:', inscripcionesData?.length || 0);
			console.log('📋 [CHAT] Datos de inscripciones:', inscripcionesData);

			if (inscripcionError || !inscripcionesData) {
				console.error('❌ [CHAT] Error obteniendo inscripciones:', inscripcionError);
				return '';
			}

			// PASO 2: Separar por tipo (IGUAL QUE MIS CURSOS)  
			const inscripcionesCursos = inscripcionesData.filter((i) => i.curso_id);
			const inscripcionesTutoriales = inscripcionesData.filter((i) => i.tutorial_id);
			const inscripcionesPaquetes = inscripcionesData.filter((i) => i.paquete_id);

			console.log('📊 [CHAT] Distribución de inscripciones:', {
				cursos: inscripcionesCursos.length,
				tutoriales: inscripcionesTutoriales.length,
				paquetes: inscripcionesPaquetes.length
			});

			// PASO 3: Obtener datos de CURSOS CON MÓDULOS Y LECCIONES (PARA ENLACES DIRECTOS)
			let cursosData = [];
			if (inscripcionesCursos.length > 0) {
				const cursoIds = inscripcionesCursos.map((i) => i.curso_id);
				console.log('📚 [CHAT] Buscando cursos con módulos:', cursoIds);
				
				// Obtener cursos básicos
				const { data: cursos, error: cursosError } = await supabase
					.from('cursos')
					.select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, slug')
					.in('id', cursoIds);
					
				if (cursosError) {
					console.error('❌ [CHAT] Error obteniendo cursos:', cursosError);
				} else {
					cursosData = cursos || [];
					console.log('✅ [CHAT] Cursos cargados:', cursosData.length);
					
					// Para cada curso, obtener módulos y primera lección
					for (let j = 0; j < cursosData.length; j++) {
						const curso = cursosData[j];
						console.log(`🔍 [CHAT] Cargando módulos para curso: "${curso.titulo}"`);
						
						const { data: modulos, error: modulosError } = await supabase
							.from('modulos')
							.select('id, titulo, descripcion, orden')
							.eq('curso_id', curso.id)
							.order('orden');
							
						if (!modulosError && modulos && modulos.length > 0) {
							// Para el primer módulo, obtener las lecciones
							const primerModulo = modulos[0];
							const { data: lecciones, error: leccionesError } = await supabase
								.from('lecciones')
								.select('id, titulo, descripcion, orden')
								.eq('modulo_id', primerModulo.id)
								.order('orden')
								.limit(1);
								
							if (!leccionesError && lecciones && lecciones.length > 0) {
								cursosData[j].modulos = [{
									...primerModulo,
									lecciones: lecciones
								}];
							} else {
								cursosData[j].modulos = [primerModulo];
							}
						}
					}
				}
			}

			// PASO 4: Obtener datos de TUTORIALES (COPIA EXACTA de estudiante)
			let tutorialesData = [];
			if (inscripcionesTutoriales.length > 0) {
				const tutorialIds = inscripcionesTutoriales.map((i) => i.tutorial_id);
				console.log('🎵 [CHAT] Buscando tutoriales:', tutorialIds);
				
				console.log('🎯 [CHAT] Tutorial IDs a buscar:', tutorialIds);
				const { data: tutoriales, error: tutorialesError } = await supabase
					.from('tutoriales')
					.select('id, titulo, descripcion, imagen_url, nivel, duracion_estimada, precio_normal, artista, acordeonista, tonalidad')
					.in('id', tutorialIds);
					
				if (tutorialesError) {
					console.error('❌ [CHAT] Error obteniendo tutoriales:', tutorialesError);
				} else {
					tutorialesData = tutoriales || [];
					console.log('✅ [CHAT] Tutoriales cargados:', tutorialesData.length);
					console.log('🎵 [CHAT] Datos de tutoriales:', tutorialesData);
				}
			}

			// PASO 5: Combinar inscripciones con contenido (COPIA EXACTA de estudiante)
			const inscripciones = [
				// Inscripciones a cursos
				...inscripcionesCursos.map((inscripcion) => ({
					...inscripcion,
					cursos: cursosData.find((curso) => curso.id === inscripcion.curso_id)
				})),
				// Inscripciones a tutoriales
				...inscripcionesTutoriales.map((inscripcion) => ({
					...inscripcion,
					tutoriales: tutorialesData.find((tutorial) => tutorial.id === inscripcion.tutorial_id)
				}))
			];

			console.log('✅ [CHAT] Inscripciones finales:', inscripciones.length);
			console.log('✅ [CHAT] Datos finales:', inscripciones);

			// PASO 6: Calcular PROGRESO DETALLADO (COMO EN TarjetaCurso.svelte)
			console.log('📊 [CHAT] Calculando progreso detallado para cada inscripción...');
			
			for (let i = 0; i < inscripciones.length; i++) {
				const inscripcion = inscripciones[i];
				const esCurso = !!inscripcion.cursos;
				const contenidoId = esCurso ? inscripcion.curso_id : inscripcion.tutorial_id;
				const titulo = esCurso ? inscripcion.cursos?.titulo : inscripcion.tutoriales?.titulo;
				
				console.log(`🔄 [CHAT] Calculando progreso para: "${titulo}" (${esCurso ? 'curso' : 'tutorial'})`);
				
				try {
					if (esCurso) {
						// Progreso de curso (LÓGICA EXACTA de TarjetaCurso)
						const { data: modulos } = await supabase
							.from('modulos')
							.select('id, lecciones(id)')
							.eq('curso_id', contenidoId);

						if (modulos && modulos.length > 0) {
							const leccionIds = modulos.flatMap((m) => m.lecciones?.map((l) => l.id) || []);
							
							if (leccionIds.length > 0) {
								const { data: progreso } = await supabase
									.from('progreso_lecciones')
									.select('leccion_id, estado')
									.eq('usuario_id', infoUsuario.id)
									.in('leccion_id', leccionIds);

								const completadas = progreso?.filter((p) => p.estado === 'completada').length || 0;
								const total = leccionIds.length;
								const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

								inscripciones[i].progresoDetallado = { porcentaje, completadas, total };
								console.log(`✅ [CHAT] Curso "${titulo}": ${completadas}/${total} lecciones (${porcentaje}%)`);
							}
						}
					} else {
						// Progreso de tutorial (LÓGICA EXACTA de TarjetaCurso)
						const { data: partes } = await supabase
							.from('partes_tutorial')
							.select('id')
							.eq('tutorial_id', contenidoId);

						if (partes && partes.length > 0) {
							const { data: progreso } = await supabase
								.from('progreso_tutorial')
								.select('parte_tutorial_id, completado')
								.eq('usuario_id', infoUsuario.id)
								.eq('tutorial_id', contenidoId);

							const completadas = progreso?.filter((p) => p.completado).length || 0;
							const total = partes.length;
							const porcentaje = total > 0 ? Math.round((completadas / total) * 100) : 0;

							inscripciones[i].progresoDetallado = { porcentaje, completadas, total };
							console.log(`✅ [CHAT] Tutorial "${titulo}": ${completadas}/${total} partes (${porcentaje}%)`);
						}
					}
				} catch (error) {
					console.error(`❌ [CHAT] Error calculando progreso para "${titulo}":`, error);
					inscripciones[i].progresoDetallado = { porcentaje: 0, completadas: 0, total: 0 };
				}
			}
			
			console.log('🎯 [CHAT] Progreso detallado calculado para todas las inscripciones');

			// PASO 7: Generar enlaces específicos para recomendaciones
			for (let i = 0; i < inscripciones.length; i++) {
				const inscripcion = inscripciones[i];
				const esCurso = !!inscripcion.cursos;
				const contenido = esCurso ? inscripcion.cursos : inscripcion.tutoriales;
				const progresoDetallado = inscripcion.progresoDetallado || { porcentaje: 0, completadas: 0, total: 0 };
				
				// Generar slug del contenido
				const contenidoSlug = contenido?.slug || (contenido?.titulo ? generateSlug(contenido.titulo) : '');
				
							if (esCurso) {
				// Para cursos: buscar la primera lección para enlace directo
				let enlaceDirecto = `/mis-cursos`;
				let textoEnlace = `Continuar curso`;
				
				// Buscar la primera lección disponible
				if (contenido.modulos && contenido.modulos.length > 0) {
					const primerModulo = contenido.modulos[0];
					if (primerModulo.lecciones && primerModulo.lecciones.length > 0) {
						const primeraLeccion = primerModulo.lecciones[0];
						const moduloSlug = generateSlug(primerModulo.titulo);
						const leccionSlug = generateSlug(primeraLeccion.titulo);
						enlaceDirecto = `/cursos/${contenidoSlug}/${moduloSlug}/${leccionSlug}`;
						
						if (progresoDetallado.porcentaje === 0) {
							textoEnlace = `Empezar curso`;
						} else {
							textoEnlace = `Continuar curso`;
						}
					}
				}
				
				inscripciones[i].enlaceRecomendado = enlaceDirecto;
				inscripciones[i].textoEnlace = textoEnlace;
				inscripciones[i].enlaceGeneral = `/cursos/${contenidoSlug}`;
				inscripciones[i].textoGeneral = `Ver curso completo`;
				} else {
					// Para tutoriales: intentar encontrar la siguiente clase específica
					if (contenidoSlug) {
						if (progresoDetallado.porcentaje === 0) {
							// Sin empezar: ir a la primera clase si existe
							if (contenido.partes && contenido.partes.length > 0) {
								const primeraClase = contenido.partes[0];
								const claseSlug = primeraClase.slug || generateSlug(primeraClase.titulo);
								inscripciones[i].enlaceRecomendado = `/tutoriales/${contenidoSlug}/clase/${claseSlug}`;
								inscripciones[i].textoEnlace = `Empezar: ${primeraClase.titulo}`;
							} else {
								inscripciones[i].enlaceRecomendado = `/tutoriales/${contenidoSlug}/contenido`;
								inscripciones[i].textoEnlace = `Empezar tutorial`;
							}
							inscripciones[i].enlaceGeneral = `/tutoriales/${contenidoSlug}/contenido`;
							inscripciones[i].textoGeneral = `Ver todas las clases`;
						} else if (progresoDetallado.porcentaje === 100) {
							// Completado: opción de revisar
							inscripciones[i].enlaceRecomendado = `/tutoriales/${contenidoSlug}/contenido`;
							inscripciones[i].textoEnlace = `Revisar tutorial`;
							inscripciones[i].enlaceGeneral = `/tutoriales/${contenidoSlug}`;
							inscripciones[i].textoGeneral = `Ver información`;
						} else {
							// En progreso: buscar siguiente clase pendiente
							let siguienteClase = null;
							if (contenido.partes) {
								// Simular progreso basado en el porcentaje para encontrar siguiente clase
								const clasesCompletadas = Math.floor((progresoDetallado.porcentaje / 100) * contenido.partes.length);
								if (clasesCompletadas < contenido.partes.length) {
									siguienteClase = contenido.partes[clasesCompletadas];
								}
							}
							
							if (siguienteClase) {
								const claseSlug = siguienteClase.slug || generateSlug(siguienteClase.titulo);
								inscripciones[i].enlaceRecomendado = `/tutoriales/${contenidoSlug}/clase/${claseSlug}`;
								inscripciones[i].textoEnlace = `Continuar: ${siguienteClase.titulo}`;
							} else {
								inscripciones[i].enlaceRecomendado = `/tutoriales/${contenidoSlug}/contenido`;
								inscripciones[i].textoEnlace = `Continuar tutorial`;
							}
							inscripciones[i].enlaceGeneral = `/tutoriales/${contenidoSlug}/contenido`;
							inscripciones[i].textoGeneral = `Ver todas las clases`;
						}
					}
				}
			}

			// PASO 8: Cargar información de la plataforma (Blog, Cursos, Membresías)
			console.log('🎯 [CHAT] Cargando información de la plataforma...');
			
			const [blogResult, cursosResult, tutorialesDisponiblesResult, membresiasResult] = await Promise.all([
				// Cargar artículos del blog
				supabase
					.from('blog_articulos')
					.select('*')
					.limit(5),
				
				// Cargar cursos disponibles
				supabase
					.from('cursos')
					.select('id, titulo, descripcion, imagen_url, slug, nivel, precio_normal')
					.order('created_at', { ascending: false })
					.limit(5),
				
				// Cargar tutoriales disponibles públicos
				supabase
					.from('tutoriales')
					.select('id, titulo, descripcion, imagen_url, slug, nivel, artista')
					.order('created_at', { ascending: false })
					.limit(5),
				
				// Cargar planes de membresía
				supabase
					.from('membresias')
					.select('id, nombre, descripcion, precio_mensual, precio_anual, permisos')
					.eq('activa', true)
					.order('precio_mensual', { ascending: true })
			]);

			let articulosBlog = [];
			let cursosDisponibles = [];
			let tutorialesPublicos = [];
			let planesMembresia = [];

			console.log('🔍 [CHAT] Resultado completo del blog:', blogResult);
			if (blogResult.error) {
				console.error('❌ [CHAT] Error cargando artículos del blog:', blogResult.error);
			} else {
				console.log('✅ [CHAT] Datos del blog recibidos:', blogResult.data);
				articulosBlog = blogResult.data || [];
			}

			if (cursosResult.error) {
				console.error('❌ [CHAT] Error cargando cursos:', cursosResult.error);
			} else if (cursosResult.data) {
				cursosDisponibles = cursosResult.data;
			}

			if (tutorialesDisponiblesResult.error) {
				console.error('❌ [CHAT] Error cargando tutoriales públicos:', tutorialesDisponiblesResult.error);
			} else if (tutorialesDisponiblesResult.data) {
				tutorialesPublicos = tutorialesDisponiblesResult.data;
			}

			if (membresiasResult.error) {
				console.error('❌ [CHAT] Error cargando membresías:', membresiasResult.error);
			} else if (membresiasResult.data) {
				planesMembresia = membresiasResult.data;
			}

			console.log('📚 [CHAT] Artículos del blog cargados:', articulosBlog.length, articulosBlog);
			console.log('🎓 [CHAT] Cursos disponibles cargados:', cursosDisponibles.length, cursosDisponibles);
			console.log('🎵 [CHAT] Tutoriales públicos cargados:', tutorialesPublicos.length, tutorialesPublicos);
			console.log('💎 [CHAT] Planes de membresía cargados:', planesMembresia.length, planesMembresia);

			// Obtener experiencia y ranking del usuario
			const { data: experiencia } = await supabase
				.from('experiencia_usuario')
				.select('*')
				.eq('usuario_id', infoUsuario.id)
				.single();

			// Obtener estadísticas de usuario
			const { data: estadisticas } = await supabase
				.from('estadisticas_usuario')
				.select('*')
				.eq('usuario_id', infoUsuario.id)
				.single();

			// Obtener posición en ranking
			const { data: posicionRanking } = await supabase
				.rpc('obtener_posicion_ranking', { usuario_id_param: infoUsuario.id });

			// Obtener progreso de lecciones
			const { data: progresoLecciones } = await supabase
				.from('progreso_lecciones')
				.select('*')
				.eq('usuario_id', infoUsuario.id);

			// Obtener tutoriales disponibles
			const { data: tutorialesDisponibles } = await supabase
				.from('tutoriales')
				.select('id, titulo, nivel, descripcion')
				.eq('activo', true)
				.limit(10);

			// Calcular estadísticas
			const leccionesCompletadas = progresoLecciones?.filter(p => p.completada).length || 0;
			const tiempoTotal = progresoLecciones?.reduce((acc, p) => acc + (p.tiempo_estudiado || 0), 0) || 0;
			const ultimoAcceso = progresoLecciones?.sort((a, b) => new Date(b.updated_at || b.fecha_actualizacion) - new Date(a.updated_at || a.fecha_actualizacion))[0]?.updated_at;

			// Construir contexto rico con TODA LA INFORMACIÓN
			const contextoRico = `
PERFIL COMPLETO:
- Usuario: ${infoUsuario.nombre_completo || infoUsuario.nombre} (${infoUsuario.email})
- Nivel: ${infoUsuario.nivel_habilidad || 'No definido'} en ${infoUsuario.instrumento || 'acordeón'}
- Experiencia: ${infoUsuario.ano_experiencia || 0} años
- Objetivo: ${infoUsuario.objetivo_aprendizaje || 'No definido'}
- Estilo favorito: ${infoUsuario.estilo_favorito || 'Vallenato'}
- Estudios musicales: ${infoUsuario.estudios_musicales || 'No especificado'}
- Suscripción: ${infoUsuario.suscripcion || 'free'}
- Ubicación: ${infoUsuario.ciudad || 'No especificada'}${infoUsuario.pais ? `, ${infoUsuario.pais}` : ''}

🎮 NIVEL Y EXPERIENCIA GAMING:
- Nivel actual: ${experiencia?.nivel || 1}
- XP actual: ${experiencia?.xp_actual || 0}/${experiencia?.xp_siguiente_nivel || 1000}
- XP total acumulado: ${experiencia?.xp_total || 0}
- Racha actual: ${experiencia?.racha_dias || 0} días
- Racha máxima: ${experiencia?.racha_maxima || 0} días

🏆 RANKING Y POSICIÓN:
- Posición en ranking general: #${posicionRanking || 'No clasificado'}
- Puntos totales: ${estadisticas?.puntos_totales || 0}
- Logros desbloqueados: ${estadisticas?.logros_totales || 0}

📚 INSCRIPCIONES ACTIVAS (${inscripciones?.length || 0}):
${inscripciones?.length > 0 ? inscripciones.map(i => {
	const contenido = i.cursos || i.tutoriales;
	const nombre = contenido?.titulo || 'Sin título disponible';
	const tipo = i.cursos ? 'CURSO' : 'TUTORIAL';
	const artista = contenido?.artista ? ` por ${contenido.artista}` : '';
	
	// Usar progreso detallado si está disponible
	const progresoDetallado = i.progresoDetallado || { porcentaje: 0, completadas: 0, total: 0 };
	const { porcentaje, completadas, total } = progresoDetallado;
	
	let estado;
	if (total > 0) {
		if (porcentaje === 100) {
			estado = `COMPLETADO (${completadas}/${total} ${tipo === 'CURSO' ? 'lecciones' : 'partes'})`;
		} else if (porcentaje > 0) {
			estado = `EN PROGRESO (${completadas}/${total} ${tipo === 'CURSO' ? 'lecciones' : 'partes'} - ${porcentaje}%)`;
		} else {
			estado = `SIN EMPEZAR (0/${total} ${tipo === 'CURSO' ? 'lecciones' : 'partes'})`;
		}
	} else {
		estado = 'Sin información de progreso';
	}
	
	// Agregar enlaces específicos si están disponibles
	let enlaceInfo = '';
	if (i.enlaceRecomendado && i.textoEnlace) {
		enlaceInfo = ` | ENLACE DIRECTO: [${i.textoEnlace}](${i.enlaceRecomendado})`;
		
		// Agregar enlace general como segunda opción
		if (i.enlaceGeneral && i.textoGeneral) {
			enlaceInfo += ` | ENLACE GENERAL: [${i.textoGeneral}](${i.enlaceGeneral})`;
		}
	}
	
	return `${tipo}: "${nombre}"${artista} - ${estado}${enlaceInfo}`;
}).join('\n') : 'NO TIENES INSCRIPCIONES ACTIVAS'}

📊 ESTADÍSTICAS DE PROGRESO:
- Lecciones completadas: ${leccionesCompletadas}
- Tiempo total estudiado: ${Math.round(tiempoTotal / 60)} minutos
- Último acceso: ${ultimoAcceso ? new Date(ultimoAcceso).toLocaleDateString() : 'Nunca'}
- Precisión promedio: ${estadisticas?.precision_promedio || 0}%
- Sesiones de simulador: ${estadisticas?.sesiones_simulador || 0}

🎯 TUTORIALES DISPONIBLES (${tutorialesDisponibles?.length || 0}):
${tutorialesDisponibles?.slice(0, 5).map(t => `- ${t.titulo} (${t.nivel})`).join('\n') || '- No hay tutoriales disponibles'}

📚 ARTÍCULOS DEL BLOG DESTACADOS (${articulosBlog?.length || 0}):
${articulosBlog?.length > 0 ? articulosBlog.map(a => `- "${a.titulo}" [Ver artículo](/blog/${a.slug}) - ${a.resumen ? a.resumen.substring(0, 100) + '...' : 'Sin resumen'}`).join('\n') : '- No hay artículos disponibles'}

🎓 CURSOS DISPONIBLES EN LA PLATAFORMA (${cursosDisponibles?.length || 0}):
${cursosDisponibles?.length > 0 ? cursosDisponibles.map(c => `- "${c.titulo}" - ${c.nivel || 'Todos los niveles'} [Ver curso](/cursos/${c.slug})`).join('\n') : '- No hay cursos disponibles'}

🎵 TUTORIALES PÚBLICOS DISPONIBLES (${tutorialesPublicos?.length || 0}):
${tutorialesPublicos?.length > 0 ? tutorialesPublicos.map(t => `- "${t.titulo}" por ${t.artista || 'Artista no especificado'} [Ver tutorial](/tutoriales/${t.slug})`).join('\n') : '- No hay tutoriales públicos disponibles'}

💎 PLANES DE MEMBRESÍA DISPONIBLES (${planesMembresia?.length || 0}):
${planesMembresia?.length > 0 ? planesMembresia.map(p => `- Plan ${p.nombre}: $${p.precio_mensual?.toLocaleString()} COP/mes ($${p.precio_anual?.toLocaleString()} COP/año) [Ver planes](/membresias)`).join('\n') : '- No hay planes disponibles'}

🚀 CURSO ESTRELLA - APRENDE DESDE CERO:
- "Aprende a Tocar Acordeón Vallenato Desde Cero" - Método paso a paso del maestro Jesús González
- Precio especial: $289.000 COP (antes $379.000) - ¡Ahorra $90.000!
- Primera canción en menos de 7 días - Más de 5,000 estudiantes felices
- [Ver curso completo](/curso-acordeon-desde-cero) | [Comprar ahora](/curso-acordeon-desde-cero)

FUNCIONALIDADES DE LA PLATAFORMA:
- 🎹 Simulador de Acordeón: /simulador-de-acordeon
- 📚 Mis Tutoriales: /tutoriales
- 📦 Explorar Paquetes: /paquetes  
- 👥 Comunidad: /comunidad
- 👤 Mi Perfil: /perfil
- 📊 Mi Progreso: /estudiante
- 🎵 Canciones Interactivas: /cancion-interactiva
- 🎮 Simulador Gaming: /simulador-gaming

INSTRUCCIONES PARA EL AGENTE:
- RESPONDE CONVERSACIONAL: Habla natural, como un amigo conocedor
- NO SALUDES repetitivamente, ve directo al punto
- INFORMACIÓN REAL: Los títulos en "INSCRIPCIONES ACTIVAS" son exactos de la BD
- FORMATO NATURAL: Sin markdown, sin listas, sin estructuras formales
- USA TÍTULOS EXACTOS: Menciona los nombres reales que aparecen arriba
- RECONOCE INSCRIPCIONES: Si dice "CURSO:" o "TUTORIAL:" es que SÍ está inscrito
- PROGRESO ESPECÍFICO: Usa los porcentajes exactos que aparecen
- ENLACES NATURALES: Incluye [nombre](/ruta) de forma fluida en la conversación
- EJEMPLO: "Tienes 9 inscripciones activas, como Tutorial de acordeón Era Como Yo y Aprende a Tocar Acordeón Vallenato Desde Cero"
`;

			return contextoRico;
		} catch (error) {
			console.error('❌ Error obteniendo contexto completo:', error);
			return '';
		}
	}

	// 📚 CARGAR HISTORIAL DEL CHAT
	async function cargarHistorialChat() {
		try {
			if (!chatId) return;
			
			const conversaciones = await chatService.obtenerConversacion(chatId);
			
			if (conversaciones && conversaciones.length > 0) {
				mensajes = conversaciones.map(conv => ({
					id: conv.id || Date.now() + Math.random(),
					texto: conv.message?.texto || conv.mensaje || 'Mensaje sin contenido',
					esBot: conv.message?.tipo === 'bot' || conv.message?.tipo === 'agente',
					timestamp: new Date(conv.created_at || conv.message?.timestamp || Date.now())
				}));
				console.log('📚 Historial cargado:', mensajes.length, 'mensajes');
				console.log('🔍 Primer mensaje de ejemplo:', conversaciones[0]);
			}
		} catch (error) {
			console.error('❌ Error cargando historial:', error);
		}
	}

	// 💾 GUARDAR MENSAJE EN BD
	async function guardarMensajeEnBD(mensaje, esBot) {
		try {
			let usuarioId, leadId, esUsuarioRegistrado;

			if (infoUsuario) {
				usuarioId = infoUsuario.id;
				esUsuarioRegistrado = true;
			} else {
				const lead = await leadsService.obtenerPorChatId(chatId);
				if (lead) {
					leadId = lead.id;
				}
				esUsuarioRegistrado = false;
			}

			const datosConversacion = {
				chat_id: chatId,
				usuario_id: usuarioId,
				lead_id: leadId || undefined,
				es_usuario_registrado: esUsuarioRegistrado,
				mensaje: mensaje,
				tipo_mensaje: (esBot ? 'bot' : 'usuario'),
				metadata: {
					timestamp: new Date().toISOString(),
					ruta: window.location.pathname,
					user_agent: navigator.userAgent
				}
			};

			const resultado = await chatService.guardarMensaje(datosConversacion);
			if (resultado) {
				console.log('💾 Mensaje guardado en BD:', resultado);
			} else {
				console.log('⚠️ No se pudo guardar el mensaje en BD');
			}
		} catch (error) {
			console.error('❌ Error guardando mensaje en BD:', error);
		}
	}
	
	// 🚀 ABRIR CHAT
	function abrirChat() {
		if (!infoUsuario) {
			datosGuest = { nombre: '', email: '', whatsapp: '', tipoConsulta: 'general' };
			if (typeof window !== 'undefined') {
				localStorage.removeItem('datosGuestChat');
			}
			mostrarModalDatos = true;
			return;
		}
		
		chatAbierto = true;
		chatPuedeIniciar = true;
		
		if (mensajes.length === 0) {
			mostrarMensajeBienvenida();
		}
		
		// Scroll al final cuando se abre el chat
		setTimeout(() => scrollAlFinal(), 200);
		
		reproducirSonido('abrir');
	}

	// 👋 MENSAJE DE BIENVENIDA
	async function mostrarMensajeBienvenida() {
		const mensajeBienvenida = {
			id: Date.now(),
			texto: infoUsuario 
				? `🎵 Asistente IA de Academia Vallenata Online listo para ayudarte, ${infoUsuario.nombre}. ¿Qué necesitas saber sobre acordeón o la academia?`
				: `🎵 Asistente IA de Academia Vallenata Online listo para ayudarte. ¿Qué necesitas saber sobre acordeón o la academia?`,
			esBot: true,
			timestamp: new Date()
		};
		mensajes = [mensajeBienvenida];
		
		await guardarMensajeEnBD(mensajeBienvenida.texto, true);
		reproducirSonido('abrir');
	}
	
	// 🔐 ABRIR MODAL LOGIN
	function abrirModalLogin() {
		mostrarModalDatos = false;
		window.location.href = '/?login=true';
	}
	
	// ❌ CERRAR CHAT
	function cerrarChat() {
		chatAbierto = false;
		reproducirSonido('cerrar');
	}

	// 📤 ENVIAR MENSAJE
	async function enviarMensaje() {
		if (!nuevoMensaje.trim()) return;
		
		const textoMensaje = nuevoMensaje.trim();
		nuevoMensaje = '';
		
		// Agregar mensaje del usuario
		const mensajeUsuario = {
			id: Date.now(),
			texto: textoMensaje,
			esBot: false,
			timestamp: new Date()
		};
		
		mensajes = [...mensajes, mensajeUsuario];
		escribiendo = true;
		reproducirSonido('enviar');
		
		// Guardar mensaje del usuario en BD
		await guardarMensajeEnBD(textoMensaje, false);
		
		try {
			// Obtener datos de usuario anónimo si existen
			let datosGuest = null;
			try {
				const datosGuardados = localStorage.getItem('datosGuestChat');
				if (datosGuardados) {
					datosGuest = JSON.parse(datosGuardados);
				}
			} catch (e) {
				console.log('No hay datos de guest o error parseando');
			}
			
			// Obtener contexto completo del usuario (solo si está autenticado)
			let contextoCompleto = '';
			if (infoUsuario?.id) {
				console.log('🚀 [CHAT] Usuario autenticado - Llamando obtenerContextoCompleto()...');
				contextoCompleto = await obtenerContextoCompleto();
				console.log('✅ [CHAT] Contexto completo obtenido. Longitud:', contextoCompleto.length);
			} else {
				console.log('👤 [CHAT] Usuario anónimo - saltando contexto completo');
				contextoCompleto = '';
			}
			
			// Preparar datos para N8N con contexto enriquecido
			const datosChat = {
				chatId: chatId,
				mensaje: `CONTEXTO DEL USUARIO:
${contextoCompleto}

PREGUNTA DEL USUARIO:
${textoMensaje}`,
				usuario: infoUsuario ? {
					// Identificación
					id: infoUsuario.id,
					email: infoUsuario.email,
					nombre: infoUsuario.nombre || infoUsuario.nombreCompleto,
					apellido: infoUsuario.apellido,
					nombreCompleto: infoUsuario.nombreCompleto,
					nombreUsuario: infoUsuario.nombreUsuario,
					
					// Perfil musical
					nivelHabilidad: infoUsuario.nivelHabilidad,
					instrumento: infoUsuario.instrumento,
					anosExperiencia: infoUsuario.anosExperiencia,
					estiloFavorito: infoUsuario.estiloFavorito,
					estudiosMusicales: infoUsuario.estudiosMusicales,
					objetivoAprendizaje: infoUsuario.objetivoAprendizaje,
					
					// Ubicación y contacto
					ciudad: infoUsuario.ciudad,
					pais: infoUsuario.pais,
					whatsapp: infoUsuario.whatsapp,
					
					// Información adicional
					profesion: infoUsuario.profesion,
					comoNosConocio: infoUsuario.comoNosConocio,
					suscripcion: infoUsuario.suscripcion,
					rol: infoUsuario.rol,
					fechaRegistro: infoUsuario.fechaRegistro,
					
					// Estado
					logueado: true,
					metadata: infoUsuario
				} : datosGuest ? {
					nombre: datosGuest.nombre,
					email: datosGuest.email,
					whatsapp: datosGuest.whatsapp,
					tipoConsulta: datosGuest.tipoConsulta,
					logueado: false,
					sesionId: chatId
				} : {
					logueado: false,
					sesionId: chatId
				},
				// Contexto SÚPER completo con toda la info del usuario
				contexto: contextoCompleto || (infoUsuario ? 
					`Usuario: ${infoUsuario.nombreCompleto || infoUsuario.nombre || infoUsuario.email}. ` +
					`Email: ${infoUsuario.email}. ` +
					`${infoUsuario.nivelHabilidad ? `Nivel: ${infoUsuario.nivelHabilidad}. ` : ''}` +
					`${infoUsuario.instrumento ? `Instrumento: ${infoUsuario.instrumento}. ` : ''}` +
					`${infoUsuario.anosExperiencia ? `Experiencia: ${infoUsuario.anosExperiencia} años. ` : ''}` +
					`${infoUsuario.objetivoAprendizaje ? `Objetivo: ${infoUsuario.objetivoAprendizaje}. ` : ''}` +
					`${infoUsuario.estiloFavorito ? `Estilo favorito: ${infoUsuario.estiloFavorito}. ` : ''}` +
					`${infoUsuario.suscripcion ? `Suscripción: ${infoUsuario.suscripcion}. ` : ''}` +
					`${infoUsuario.ciudad ? `Ubicación: ${infoUsuario.ciudad}${infoUsuario.pais ? `, ${infoUsuario.pais}` : ''}. ` : ''}` +
					`Usuario registrado y autenticado.` :
					datosGuest ? 
					`Usuario invitado: ${datosGuest.nombre} (${datosGuest.email}). WhatsApp: ${datosGuest.whatsapp}. Consulta sobre: ${datosGuest.tipoConsulta}.` :
					`Usuario anónimo navegando el sitio.`),
				timestamp: new Date().toISOString(),
				plataforma: 'academia_vallenata',
				ruta: window.location.pathname
			};
			
			console.log('🚀 Enviando a N8N:', datosChat);
			
			// Enviar a través del proxy
			const respuesta = await fetch('/api/chat-proxy', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					webhookUrl: URL_WEBHOOK,
					data: datosChat
				})
			});
			
			console.log('📥 Respuesta status:', respuesta.status);
			
			if (!respuesta.ok) {
				throw new Error(`HTTP ${respuesta.status}: ${respuesta.statusText}`);
			}
			
			const resultado = await respuesta.json();
			console.log('✅ Resultado del proxy:', resultado);
			
			// Agregar respuesta del bot
			const mensajeBot = {
				id: Date.now() + 1,
				texto: resultado.respuesta || resultado.output || 'Mensaje procesado correctamente',
				esBot: true,
				timestamp: new Date()
			};
			
			escribiendo = false;
			mensajes = [...mensajes, mensajeBot];
			reproducirSonido('recibir');
			
			// Guardar respuesta del bot en BD
			await guardarMensajeEnBD(mensajeBot.texto, true);
			
		} catch (error) {
			console.error('🚨 Error al enviar mensaje:', error);
			escribiendo = false;
			
			const mensajeError = {
				id: Date.now() + 1,
				texto: `❌ Error: ${error.message || 'Problema de conexión'}.`,
				esBot: true,
				timestamp: new Date()
			};
			
			mensajes = [...mensajes, mensajeError];
		}
	}

	// 🔧 GUARDAR DATOS GUEST
	async function guardarDatosGuest() {
		if (!datosGuest.nombre || !datosGuest.email) {
			alert('Por favor completa todos los campos obligatorios');
			return;
		}

		try {
			// Guardar en localStorage
			localStorage.setItem('datosGuestChat', JSON.stringify(datosGuest));
			
			// Guardar en base de datos
			await leadsService.crearLead({
				chat_id: chatId,
				nombre: datosGuest.nombre,
				email: datosGuest.email,
				whatsapp: datosGuest.whatsapp,
				tipo_consulta: datosGuest.tipoConsulta
			});
			
			mostrarModalDatos = false;
			chatAbierto = true;
			chatPuedeIniciar = true;
			
			if (mensajes.length === 0) {
				mostrarMensajeBienvenida();
			}
			
			// Scroll al final cuando se completa el registro guest
			setTimeout(() => scrollAlFinal(), 200);
			
		} catch (error) {
			console.error('Error guardando datos guest:', error);
			alert('Error al guardar datos. Intenta nuevamente.');
		}
	}

	// 🔑 MANEJAR ENTER
	function manejarEnter(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			enviarMensaje();
		}
	}

	// 📜 AUTO-SCROLL AL FINAL DEL CHAT
	function scrollAlFinal() {
		if (contenedorMensajes) {
			setTimeout(() => {
				contenedorMensajes.scrollTop = contenedorMensajes.scrollHeight;
			}, 100); // Pequeño delay para asegurar que el contenido se haya renderizado
		}
	}

	// 🔗 PROCESAR ENLACES EN MENSAJES CON BOTONES PERSONALIZADOS
	function procesarMensajeConEnlaces(texto) {
		// Separar texto de enlaces
		const regexEnlaces = /\[([^\]]+)\]\(([^)]+)\)/g;
		let enlaces = [];
		let textoLimpio = texto;
		
		// Extraer todos los enlaces
		let match;
		while ((match = regexEnlaces.exec(texto)) !== null) {
			const textoEnlace = match[1];
			const url = match[2];
			
			// Determinar tipo y estilo del botón basado en el texto y URL
			let emoji = '🔗';
			let color = 'from-purple-500 to-purple-700';
			let textoBoton = textoEnlace;
			
			// CURSOS
			if (textoEnlace.toLowerCase().includes('empezar curso') || (url.includes('/mis-cursos') && textoEnlace.toLowerCase().includes('empezar'))) {
				emoji = '🚀';
				color = 'from-green-500 to-green-700';
				textoBoton = 'Empezar mi Curso';
			} else if (textoEnlace.toLowerCase().includes('continuar curso') || (url.includes('/mis-cursos') && textoEnlace.toLowerCase().includes('continuar'))) {
				emoji = '📚';
				color = 'from-blue-500 to-blue-700';
				textoBoton = 'Continuar Curso';
			} else if (textoEnlace.toLowerCase().includes('ver curso') || url.includes('/cursos/')) {
				emoji = '🎓';
				color = 'from-indigo-500 to-indigo-700';
				textoBoton = 'Ver Curso';
			}
			
			// TUTORIALES
			else if (textoEnlace.toLowerCase().includes('empezar tutorial')) {
				emoji = '▶️';
				color = 'from-emerald-500 to-emerald-700';
				textoBoton = 'Empezar Tutorial';
			} else if (textoEnlace.toLowerCase().includes('continuar tutorial')) {
				emoji = '⏩';
				color = 'from-cyan-500 to-cyan-700';
				textoBoton = 'Continuar Tutorial';
			} else if (textoEnlace.toLowerCase().includes('revisar tutorial')) {
				emoji = '🔄';
				color = 'from-orange-500 to-orange-700';
				textoBoton = 'Revisar Tutorial';
			} else if (url.includes('/tutoriales/') && url.includes('/contenido')) {
				emoji = '🎵';
				color = 'from-teal-500 to-teal-700';
				textoBoton = 'Ver Clases';
			} else if (url.includes('/tutoriales/')) {
				emoji = '📝';
				color = 'from-teal-400 to-teal-600';
				textoBoton = 'Info Tutorial';
			}
			
			// SIMULADORES
			else if (url.includes('/simulador')) {
				emoji = '🎮';
				color = 'from-pink-500 to-pink-700';
				textoBoton = 'Abrir Simulador';
			}
			
			// BLOG
			else if (url.includes('/blog')) {
				emoji = '📖';
				color = 'from-yellow-500 to-yellow-700';
				textoBoton = 'Leer Artículos';
			}
			
			// MEMBRESÍAS
			else if (url.includes('/membresias')) {
				emoji = '💎';
				color = 'from-amber-500 to-amber-700';
				textoBoton = 'Ver Planes';
			}
			
			// COMUNIDAD
			else if (url.includes('/comunidad')) {
				emoji = '👥';
				color = 'from-rose-500 to-rose-700';
				textoBoton = 'Ir a Comunidad';
			}
			
			// CURSO DESDE CERO (ESTRELLA)
			else if (url.includes('/curso-acordeon-desde-cero')) {
				emoji = '⭐';
				color = 'from-red-500 to-red-700';
				textoBoton = 'Curso Estrella';
			}
			
			// MI PERFIL
			else if (url.includes('/perfil') || url.includes('/estudiante')) {
				emoji = '👤';
				color = 'from-violet-500 to-violet-700';
				textoBoton = 'Mi Progreso';
			}
			
			// RANKING
			else if (url.includes('/ranking')) {
				emoji = '🏆';
				color = 'from-yellow-600 to-yellow-800';
				textoBoton = 'Ver Ranking';
			}
			
			enlaces.push({
				textoCompleto: match[0],
				texto: textoEnlace,
				url: url,
				emoji: emoji,
				color: color,
				textoBoton: textoBoton
			});
		}
		
		// Remover enlaces del texto principal
		enlaces.forEach(enlace => {
			textoLimpio = textoLimpio.replace(enlace.textoCompleto, '');
		});
		
		// Limpiar espacios y saltos de línea extra
		textoLimpio = textoLimpio.replace(/\s+/g, ' ').trim();
		textoLimpio = textoLimpio.replace(/\.\s*$/, '.');
		
		// Crear HTML con texto y botones separados y personalizados
		let html = `<div class="mensaje-texto">${textoLimpio}</div>`;
		
		if (enlaces.length > 0) {
			html += '<div class="mensaje-botones">';
			enlaces.forEach(enlace => {
				html += `<a href="${enlace.url}" class="enlace-chat bg-gradient-to-r ${enlace.color} hover:scale-105 transform transition-all duration-200" target="_self">
					<span class="enlace-emoji">${enlace.emoji}</span>
					<span class="enlace-texto">${enlace.textoBoton}</span>
				</a>`;
			});
			html += '</div>';
		}
		
		return html;
	}

	// 🔄 REACTIVO: Scroll automático cuando cambian los mensajes
	$: if (mensajes.length > 0) {
		scrollAlFinal();
	}

	// 🔊 REPRODUCIR SONIDO
	function reproducirSonido(tipo) {
		try {
			let rutaAudio = '';
			switch(tipo) {
				case 'abrir': rutaAudio = '/audio/effects/ui/mopen.mp3'; break;
				case 'cerrar': rutaAudio = '/audio/effects/ui/mclose.mp3'; break;
				case 'enviar': rutaAudio = '/audio/effects/ui/click.mp3'; break;
				case 'recibir': rutaAudio = '/audio/effects/ui/ping.mp3'; break;
				default: return;
			}
			
			const audio = new Audio(rutaAudio);
			audio.volume = 0.3;
			audio.play().catch(() => console.log('Error reproduciendo sonido'));
		} catch (error) {
			console.log('Error con audio:', error);
		}
	}

	// 📅 FORMATEAR FECHA
	function formatearFecha(fecha) {
		return new Date(fecha).toLocaleTimeString('es-ES', {
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<!-- 🎨 WIDGET DEL CHAT -->
{#if !chatAbierto && $chatWidgetVisible}
	<!-- 🔵 Botón flotante -->
	<button 
		on:click={abrirChat}
		class="boton-chat"
		aria-label="Abrir chat"
	>
		💬
		<div class="pulso"></div>
	</button>
{:else}
	<!-- 🎭 Overlay con desenfoque de fondo -->
	<div class="chat-overlay" on:click={cerrarChat}></div>
	
	<!-- 💬 Ventana del chat -->
	<div class="ventana-chat">
		<!-- Encabezado -->
		<div class="encabezado-chat">
			<div class="info-chat">
				<div class="avatar-bot">🤖</div>
				<div>
					<div class="nombre-bot">Asistente IA</div>
					<div class="estado-bot">En línea</div>
				</div>
			</div>
			<button on:click={cerrarChat} class="boton-cerrar">❌</button>
		</div>
		
		<!-- Mensajes -->
		<div class="contenedor-mensajes" bind:this={contenedorMensajes}>
			{#each mensajes as mensaje (mensaje.id)}
				<div class="mensaje {mensaje.esBot ? 'bot' : 'usuario'}">
					<div class="contenido-mensaje">
						{#if mensaje.esBot}
							{@html procesarMensajeConEnlaces(mensaje.texto)}
						{:else}
							{mensaje.texto}
						{/if}
					</div>
					<div class="hora-mensaje">
						{formatearFecha(mensaje.timestamp)}
					</div>
				</div>
			{/each}
			
			{#if escribiendo}
				<div class="mensaje bot">
					<div class="contenido-mensaje escribiendo">
						<div class="puntos">
							<span></span>
							<span></span>
							<span></span>
						</div>
					</div>
				</div>
			{/if}
		</div>
		
		<!-- Entrada de mensaje -->
		<div class="entrada-mensaje">
			<input
				bind:value={nuevoMensaje}
				on:keydown={manejarEnter}
				placeholder="Escribe tu mensaje..."
				class="input-mensaje"
				disabled={escribiendo}
			/>
			<button 
				on:click={enviarMensaje} 
				class="boton-enviar"
				disabled={escribiendo || !nuevoMensaje.trim()}
			>
				📤
			</button>
		</div>
	</div>
{/if}

<!-- 📝 Modal datos guest -->
{#if mostrarModalDatos}
	<div class="overlay-modal" on:click={() => mostrarModalDatos = false}>
		<div class="modal-datos" on:click|stopPropagation>
			<div class="encabezado-modal">
				<h3>¡Bienvenido a Academia Vallenata! 🎵</h3>
				<p>Para brindarte una mejor atención, cuéntanos un poco sobre ti:</p>
				
				<!-- 🤖 MENSAJE SOBRE REGISTRO PARA IA -->
				<div class="aviso-ia">
					<div class="icono-ia">🤖</div>
					<div class="texto-ia">
						<p><strong>¡Chatea con nuestra IA!</strong></p>
						<p>Para acceder a toda la información personalizada y chatear con nuestra inteligencia artificial, 
						necesitas registrarte. <span class="highlight">¡Es rápido y sin complicaciones!</span></p>
					</div>
				</div>
			</div>
			
			<div class="formulario-datos">
				<input
					bind:value={datosGuest.nombre}
					placeholder="Tu nombre *"
					class="campo-datos"
					required
				/>
				
				<input
					bind:value={datosGuest.email}
					type="email"
					placeholder="Tu email *"
					class="campo-datos"
					required
				/>
				
				<!-- 📱 SELECTOR DE WHATSAPP CON CÓDIGOS DE PAÍS -->
				<div class="campo-whatsapp">
					<button 
						type="button"
						class="selector-pais" 
						on:click|stopPropagation={alternarSelector}
					>
						<span class="bandera">{paisSeleccionado.bandera}</span>
						<span class="codigo">{paisSeleccionado.codigo}</span>
						<span class="nombre-pais">{paisSeleccionado.pais}</span>
						<span class="flecha">{selectorVisible ? '▲' : '▼'}</span>
					</button>
					
					<input
						bind:value={numeroTelefono}
						on:input={formatearNumeroInput}
						placeholder={paisSeleccionado.formato}
						class="input-telefono"
						type="tel"
						maxlength={paisSeleccionado.digitos}
					/>
					
					{#if selectorVisible}
						<div class="dropdown-paises">
							{#each paisesPrincipales as pais}
								<button 
									type="button"
									class="opcion-pais" 
									on:click|stopPropagation={() => seleccionarPais(pais)}
								>
									<span class="bandera">{pais.bandera}</span>
									<span class="codigo">{pais.codigo}</span>
									<span class="nombre">{pais.pais}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>
				
				<!-- 📋 SELECTOR DE TIPO DE CONSULTA -->
				<div class="selector-consulta-container">
					<button 
						type="button"
						class="selector-consulta" 
						on:click|stopPropagation={alternarSelectorConsulta}
					>
						<span class="texto-consulta">{obtenerTextoConsulta()}</span>
						<span class="flecha-consulta">{selectorConsultaVisible ? '▲' : '▼'}</span>
					</button>
					
					{#if selectorConsultaVisible}
						<div class="dropdown-consultas">
							{#each tiposConsulta as consulta}
								<button 
									type="button"
									class="opcion-consulta" 
									on:click|stopPropagation={() => seleccionarConsulta(consulta)}
								>
									{consulta.texto}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>
			
			<div class="botones-modal">
				<button on:click={guardarDatosGuest} class="boton-continuar">
					Continuar al Chat
				</button>
				<button on:click={abrirModalLogin} class="boton-login">
					Ya tengo cuenta
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* 🎨 ESTILOS DEL CHAT */
	.chat-overlay {
		position: fixed !important;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 9997 !important;
		transition: all 0.3s ease;
		cursor: pointer;
	}

	.boton-chat {
		position: fixed !important;
		bottom: 65px !important;
		right: 24px !important;
		width: 60px;
		height: 60px;
		border-radius: 50%;
		background: linear-gradient(135deg, #8a2be2, #9932cc);
		border: none;
		color: white;
		font-size: 24px;
		cursor: pointer;
		box-shadow: 0 8px 25px rgba(138, 43, 226, 0.4);
		z-index: 9999 !important;
		transition: all 0.3s ease;
		display: flex !important;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.boton-chat:hover {
		transform: scale(1.1);
		box-shadow: 0 12px 35px rgba(138, 43, 226, 0.6);
	}

	.pulso {
		position: absolute;
		top: -2px;
		left: -2px;
		right: -2px;
		bottom: -2px;
		border-radius: 50%;
		border: 2px solid rgba(138, 43, 226, 0.6);
		animation: pulso 2s infinite;
	}

	@keyframes pulso {
		0% { transform: scale(1); opacity: 1; }
		100% { transform: scale(1.4); opacity: 0; }
	}

	.ventana-chat {
		position: fixed !important;
		bottom: 80px !important;
		right: 24px !important;
		width: 380px;
		height: 500px;
		background: rgba(15, 15, 35, 0.95);
		border-radius: 20px;
		border: 1px solid rgba(138, 43, 226, 0.3);
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(20px);
		z-index: 9998 !important;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.encabezado-chat {
		padding: 16px;
		background: linear-gradient(135deg, rgba(138, 43, 226, 0.2), rgba(153, 50, 204, 0.2));
		border-bottom: 1px solid rgba(138, 43, 226, 0.3);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.info-chat {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.avatar-bot {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #8a2be2, #9932cc);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
	}

	.nombre-bot {
		color: #e0e0ff;
		font-weight: 600;
		font-size: 14px;
	}

	.estado-bot {
		color: #00ff88;
		font-size: 12px;
	}

	.boton-cerrar {
		background: none;
		border: none;
		color: #ff6b6b;
		font-size: 16px;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		transition: all 0.3s ease;
	}

	.boton-cerrar:hover {
		background: rgba(255, 107, 107, 0.2);
	}

	.contenedor-mensajes {
		flex: 1;
		padding: 16px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.mensaje {
		display: flex;
		flex-direction: column;
		max-width: 80%;
	}

	.mensaje.usuario {
		align-self: flex-end;
		align-items: flex-end;
	}

	.mensaje.bot {
		align-self: flex-start;
		align-items: flex-start;
	}

	.contenido-mensaje {
		padding: 12px 16px;
		border-radius: 18px;
		font-size: 14px;
		line-height: 1.4;
		word-wrap: break-word;
	}

	.mensaje.usuario .contenido-mensaje {
		background: linear-gradient(135deg, #8a2be2, #9932cc);
		color: white;
	}

	.mensaje.bot .contenido-mensaje {
		background: rgba(255, 255, 255, 0.1);
		color: #e0e0ff;
		border: 1px solid rgba(138, 43, 226, 0.2);
	}

	.hora-mensaje {
		font-size: 11px;
		color: rgba(224, 224, 255, 0.6);
		margin-top: 4px;
		padding: 0 4px;
	}

	.escribiendo {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 20px;
	}

	.puntos {
		display: flex;
		gap: 4px;
	}

	.puntos span {
		width: 6px;
		height: 6px;
		background: #8a2be2;
		border-radius: 50%;
		animation: escribiendo 1.4s infinite ease-in-out;
	}

	.puntos span:nth-child(1) { animation-delay: -0.32s; }
	.puntos span:nth-child(2) { animation-delay: -0.16s; }

	@keyframes escribiendo {
		0%, 80%, 100% { transform: scale(0); opacity: 0.5; }
		40% { transform: scale(1); opacity: 1; }
	}

	.entrada-mensaje {
		padding: 16px;
		border-top: 1px solid rgba(138, 43, 226, 0.3);
		display: flex;
		gap: 8px;
		background: rgba(0, 0, 0, 0.2);
	}

	.input-mensaje {
		flex: 1;
		padding: 12px 16px;
		border: 1px solid rgba(138, 43, 226, 0.3);
		border-radius: 25px;
		background: rgba(255, 255, 255, 0.1);
		color: #e0e0ff;
		font-size: 14px;
		outline: none;
		transition: all 0.3s ease;
	}

	.input-mensaje:focus {
		border-color: #8a2be2;
		background: rgba(255, 255, 255, 0.15);
	}

	.input-mensaje::placeholder {
		color: rgba(224, 224, 255, 0.5);
	}

	.boton-enviar {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		background: linear-gradient(135deg, #8a2be2, #9932cc);
		border: none;
		color: white;
		font-size: 16px;
		cursor: pointer;
		transition: all 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.boton-enviar:hover:not(:disabled) {
		transform: scale(1.1);
	}

	.boton-enviar:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* 📝 MODAL */
	.overlay-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.8);
		backdrop-filter: blur(10px);
		z-index: 1001;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.modal-datos {
		background: rgba(15, 15, 35, 0.95);
		border-radius: 20px;
		border: 1px solid rgba(138, 43, 226, 0.3);
		padding: 24px;
		width: 100%;
		max-width: 400px;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
		z-index: 1002;
		position: relative;
		overflow: visible !important;
	}

	.encabezado-modal h3 {
		color: #e0e0ff;
		margin: 0 0 8px 0;
		font-size: 18px;
	}

	.encabezado-modal p {
		color: rgba(224, 224, 255, 0.7);
		margin: 0 0 20px 0;
		font-size: 14px;
	}

	.formulario-datos {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
		overflow: visible !important;
	}

	.campo-datos {
		padding: 12px 16px;
		border: 1px solid rgba(138, 43, 226, 0.3);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		color: #e0e0ff;
		font-size: 14px;
		outline: none;
		transition: all 0.3s ease;
	}

	.campo-datos:focus {
		border-color: #8a2be2;
		background: rgba(255, 255, 255, 0.15);
	}

	.campo-datos::placeholder {
		color: rgba(224, 224, 255, 0.5);
	}

	/* 📱 ESTILOS SELECTOR DE PAÍSES */
	.campo-whatsapp {
		position: relative;
		display: flex;
		gap: 0;
		border: 1px solid rgba(138, 43, 226, 0.3);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		overflow: visible !important;
		transition: all 0.3s ease;
	}

	.campo-whatsapp:focus-within {
		border-color: #8a2be2;
		background: rgba(255, 255, 255, 0.15);
	}

	.selector-pais {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 12px 12px;
		background: rgba(138, 43, 226, 0.2);
		cursor: pointer;
		transition: all 0.3s ease;
		border-right: 1px solid rgba(138, 43, 226, 0.3);
		min-width: 85px;
	}

	.selector-pais:hover {
		background: rgba(138, 43, 226, 0.3);
	}

	.bandera {
		font-size: 16px;
	}

	.codigo {
		color: #e0e0ff;
		font-size: 13px;
		font-weight: 500;
	}

	.nombre-pais {
		color: #e0e0ff;
		font-weight: 400;
		font-size: 13px;
		flex: 1;
		text-align: left;
		margin-left: 8px;
	}

	.flecha {
		color: rgba(224, 224, 255, 0.6);
		font-size: 10px;
		transition: transform 0.3s ease;
	}

	.input-telefono {
		flex: 1;
		padding: 12px 16px;
		border: none;
		background: transparent;
		color: #e0e0ff;
		font-size: 14px;
		outline: none;
	}

	.input-telefono::placeholder {
		color: rgba(224, 224, 255, 0.5);
	}

	.dropdown-paises {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: rgba(15, 15, 35, 0.98);
		border: 1px solid rgba(138, 43, 226, 0.3);
		border-radius: 12px;
		margin-top: 4px;
		max-height: 200px;
		overflow-y: auto;
		z-index: 1003;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(10px);
		animation: dropdown-appear 0.2s ease-out;
	}

	@keyframes dropdown-appear {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.opcion-pais {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 16px;
		border: none;
		background: transparent;
		color: #e0e0ff;
		font-size: 14px;
		text-align: left;
		cursor: pointer;
		transition: all 0.3s ease;
		border-bottom: 1px solid rgba(138, 43, 226, 0.1);
	}

	.opcion-pais:last-child {
		border-bottom: none;
	}

	.opcion-pais:hover {
		background: rgba(138, 43, 226, 0.2);
		color: #ffffff;
	}

	.nombre {
		color: rgba(224, 224, 255, 0.8);
		font-size: 13px;
		flex: 1;
	}

	/* 🤖 ESTILOS AVISO IA */
	.aviso-ia {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		background: linear-gradient(135deg, rgba(138, 43, 226, 0.15), rgba(75, 0, 130, 0.15));
		border: 1px solid rgba(138, 43, 226, 0.3);
		border-radius: 12px;
		padding: 16px;
		margin: 16px 0;
		backdrop-filter: blur(5px);
	}

	.icono-ia {
		font-size: 24px;
		animation: pulse-ia 2s infinite;
	}

	@keyframes pulse-ia {
		0%, 100% { transform: scale(1); }
		50% { transform: scale(1.1); }
	}

	.texto-ia p {
		margin: 0 0 8px 0;
		color: #e0e0ff;
		font-size: 13px;
		line-height: 1.4;
	}

	.texto-ia p:last-child {
		margin-bottom: 0;
	}

	.highlight {
		color: #dda0dd;
		font-weight: 600;
	}

	/* 📋 ESTILOS SELECTOR DE CONSULTAS */
	.selector-consulta-container {
		position: relative;
		width: 100%;
	}

	.selector-consulta {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border: 1px solid rgba(138, 43, 226, 0.3);
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		color: #e0e0ff;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.3s ease;
		outline: none;
	}

	.selector-consulta:hover,
	.selector-consulta:focus {
		border-color: #8a2be2;
		background: rgba(255, 255, 255, 0.15);
	}

	.texto-consulta {
		flex: 1;
		text-align: left;
	}

	.flecha-consulta {
		color: rgba(224, 224, 255, 0.6);
		font-size: 10px;
		transition: transform 0.3s ease;
		margin-left: 8px;
	}

	.dropdown-consultas {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: rgba(15, 15, 35, 0.98);
		border: 1px solid rgba(138, 43, 226, 0.3);
		border-radius: 12px;
		margin-top: 4px;
		z-index: 1003;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(10px);
		overflow: hidden;
	}

	.opcion-consulta {
		width: 100%;
		display: block;
		padding: 12px 16px;
		border: none;
		background: transparent;
		color: #e0e0ff;
		font-size: 14px;
		text-align: left;
		cursor: pointer;
		transition: all 0.3s ease;
		border-bottom: 1px solid rgba(138, 43, 226, 0.1);
	}

	.opcion-consulta:last-child {
		border-bottom: none;
	}

	.opcion-consulta:hover {
		background: rgba(138, 43, 226, 0.2);
	}

	/* 🔧 AJUSTES PARA BOTONES EN SELECTORES */
	.selector-pais,
	.opcion-pais {
		border: none;
		outline: none;
	}

	.opcion-pais {
		width: 100%;
		background: transparent;
	}

	.botones-modal {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.boton-continuar, .boton-login {
		padding: 12px 24px;
		border: none;
		border-radius: 12px;
		font-size: 14px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.boton-continuar {
		background: linear-gradient(135deg, #8a2be2, #9932cc);
		color: white;
	}

	.boton-login {
		background: rgba(255, 255, 255, 0.1);
		color: #e0e0ff;
		border: 1px solid rgba(138, 43, 226, 0.3);
	}

	.boton-continuar:hover, .boton-login:hover {
		transform: translateY(-2px);
	}

	/* 🎨 SCROLLBAR PERSONALIZADA */
	.contenedor-mensajes::-webkit-scrollbar {
		width: 8px;
	}

	.contenedor-mensajes::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 4px;
		margin: 8px;
	}

	.contenedor-mensajes::-webkit-scrollbar-thumb {
		background: linear-gradient(135deg, #8a2be2, #9932cc);
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(138, 43, 226, 0.3);
		transition: all 0.3s ease;
	}

	.contenedor-mensajes::-webkit-scrollbar-thumb:hover {
		background: linear-gradient(135deg, #9932cc, #a855f7);
		box-shadow: 0 4px 12px rgba(138, 43, 226, 0.5);
		transform: scaleY(1.1);
	}

	.contenedor-mensajes::-webkit-scrollbar-thumb:active {
		background: linear-gradient(135deg, #7c3aed, #8a2be2);
	}

	/* Firefox */
	.contenedor-mensajes {
		scrollbar-width: thin;
		scrollbar-color: #8a2be2 rgba(255, 255, 255, 0.05);
	}

	/* 🔗 ESTILOS PARA MENSAJES CON BOTONES */
	:global(.mensaje-texto) {
		margin-bottom: 12px;
		line-height: 1.5;
	}

	:global(.mensaje-botones) {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 12px;
		padding-top: 8px;
		border-top: 1px solid rgba(255, 255, 255, 0.1);
	}

	/* 🔗 ESTILOS PARA ENLACES PERSONALIZADOS EN EL CHAT */
	:global(.enlace-chat) {
		display: inline-flex !important;
		align-items: center;
		justify-content: center;
		gap: 8px;
		color: white !important;
		padding: 12px 18px;
		border-radius: 22px;
		text-decoration: none !important;
		font-weight: 600;
		font-size: 13px;
		margin: 4px 6px 4px 0;
		border: 2px solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
		transition: all 0.3s ease;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		text-align: center;
		min-width: 140px;
		max-width: 200px;
	}

	:global(.enlace-chat::before) {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
		transition: left 0.5s;
	}

	:global(.enlace-chat:hover) {
		transform: translateY(-2px) scale(1.05);
		box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
		border-color: rgba(255, 255, 255, 0.4);
	}

	:global(.enlace-chat:hover::before) {
		left: 100%;
	}

	:global(.enlace-chat:active) {
		transform: translateY(0) scale(0.98);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	/* Estilos para emoji y texto dentro de los enlaces */
	:global(.enlace-emoji) {
		font-size: 16px;
		line-height: 1;
		display: inline-block;
	}

	:global(.enlace-texto) {
		font-size: 13px;
		font-weight: 600;
		white-space: nowrap;
		display: inline-block;
	}

	/* 📱 RESPONSIVE */
	@media (max-width: 768px) and (min-width: 481px) {
		.ventana-chat {
			width: 360px !important;
			height: 480px !important;
			bottom: 80px !important;
			right: 16px !important;
		}
		
		.boton-chat {
			bottom: 80px !important;
			right: 16px !important;
		}
	}

	@media (max-width: 480px) {
		.chat-overlay {
			background: rgba(0, 0, 0, 0.6);
			backdrop-filter: blur(4px);
			-webkit-backdrop-filter: blur(4px);
		}

		.ventana-chat {
			width: calc(100vw - 24px) !important;
			height: 70vh !important;
			bottom: 20px !important;
			right: 12px !important;
			left: 12px !important;
			border-radius: 16px !important;
			box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
		}
		
		.boton-chat {
			bottom: 75px !important;
			right: 20px !important;
			width: 56px !important;
			height: 56px !important;
		}

		.encabezado-chat {
			padding: 12px 16px !important;
		}

		.contenedor-mensajes {
			padding: 12px !important;
		}

		.entrada-mensaje {
			padding: 12px !important;
		}

		.input-mensaje {
			font-size: 16px !important; /* Evita zoom en iOS */
		}
	}
</style> 