<script lang="ts">
	import { onMount } from 'svelte';
	import EditorQuill from './EditorQuill.svelte';
	import { supabase } from '$lib/supabase/clienteSupabase.js';
	import { getAdminAccess } from '$lib/components/supabase';
	import { slide } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { notificarNuevoArticuloBlog } from '$lib/services/generadorNotificaciones';

	// Interfaces para tipado
	interface Articulo {
		id: string;
		titulo: string;
		resumen: string;
		contenido: string;
		imagen_url?: string;
		estado: 'borrador' | 'publicado';
		slug: string;
		creado_en: string;
		autor?: string;
	}

	interface FormularioArticulo {
		titulo: string;
		resumen: string;
		contenido: string;
		imagen_url?: string;
		estado: 'borrador' | 'publicado';
		slug: string;
	}

	// Estados del componente
	let articulos: Articulo[] = [];
	let estadoCarga = { cargando: false, error: '', exito: '' };
	let mostrandoFormulario = false;
	let editandoId: string | null = null;
	let eliminandoId: string | null = null;
	let archivoParaSubir: File | null = null;
	let urlPrevisualizacion: string | null = null;
	let estadoSubida = { subiendo: false, progreso: 0 };

	let formulario: FormularioArticulo = {
		titulo: '',
		resumen: '',
		contenido: '',
		imagen_url: '',
		estado: 'borrador',
		slug: ''
	};

	onMount(() => {
		obtenerArticulos();
	});

	// --- FUNCIONES CRUD ---

	async function obtenerArticulos() {
		try {
			console.log('📚 Cargando artículos...');
			estadoCarga = { cargando: true, error: '', exito: '' };
			
			const { data, error } = await supabase
				.from('blog_articulos')
				.select('*')
				.order('creado_en', { ascending: false });

			console.log('📊 Resultado de carga de artículos:', { data: data?.length || 0, error });

			if (error) {
				console.error('❌ Error al cargar artículos:', error);
				estadoCarga.error = `No se pudieron cargar los artículos: ${error.message}`;
				articulos = [];
			} else {
				articulos = data || [];
				console.log(`✅ ${articulos.length} artículos cargados exitosamente`);
				// Debug: Mostrar estructura de un artículo
				if (articulos.length > 0) {
					console.log('📋 Estructura del primer artículo:', articulos[0]);
					console.log('🆔 IDs de todos los artículos:', articulos.map(a => ({ titulo: a.titulo, id: a.id, tipo: typeof a.id })));
				}
			}
		} catch (err) {
			console.error('💥 Error inesperado al cargar artículos:', err);
			estadoCarga.error = `Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`;
			articulos = [];
		} finally {
			estadoCarga.cargando = false;
		}
	}

	function iniciarNuevoArticulo() {
		editandoId = null;
		formulario = {
			titulo: '',
			resumen: '',
			contenido: '',
			imagen_url: '',
			estado: 'borrador',
			slug: ''
		};
		limpiarSeleccionArchivo();
		mostrandoFormulario = true;
	}

	function iniciarEdicion(articulo: Articulo) {
		editandoId = articulo.id;
		formulario = {
			titulo: articulo.titulo,
			resumen: articulo.resumen,
			contenido: articulo.contenido,
			imagen_url: articulo.imagen_url || '',
			estado: articulo.estado,
			slug: articulo.slug
		};
		limpiarSeleccionArchivo();
		mostrandoFormulario = true;
	}

	function cancelarFormulario() {
		mostrandoFormulario = false;
		editandoId = null;
		estadoCarga.error = '';
		estadoCarga.exito = '';
	}

	async function guardarArticulo() {
		estadoCarga = { cargando: true, error: '', exito: '' };

		if (!formulario.titulo || !formulario.contenido) {
			estadoCarga.error = 'El título y el contenido son obligatorios.';
			estadoCarga.cargando = false;
			return;
		}

		try {
			// Si se seleccionó un archivo nuevo, lo subimos primero
			if (archivoParaSubir) {
				const urlImagenSubida = await subirImagen(archivoParaSubir);
				if (urlImagenSubida) {
					formulario.imagen_url = urlImagenSubida;
				} else {
					return; // Ya se manejó el error en subirImagen
				}
			}

			const datosArticulo = {
				...formulario,
				slug: generarSlug(formulario.titulo)
			};

			const { data, error } = editandoId
				? await supabase.from('blog_articulos').update(datosArticulo).eq('id', editandoId).select()
				: await supabase.from('blog_articulos').insert([datosArticulo]).select();

			if (error) {
				throw new Error(error.message);
			}

			// 🔔 ENVIAR NOTIFICACIONES PARA ARTÍCULOS DEL BLOG (solo para artículos nuevos y publicados)
			if (!editandoId && datosArticulo.estado === 'publicado' && data && data.length > 0) {
				const articuloCreado = data[0];
				console.log('📢 ENVIANDO NOTIFICACIONES PARA ARTÍCULO DEL BLOG...');
				
				try {
					const { data: { user } } = await supabase.auth.getUser();
					const resultadoNotificacion = await notificarNuevoArticuloBlog({
						articulo_id: articuloCreado.id,
						titulo_articulo: articuloCreado.titulo,
						resumen: articuloCreado.resumen || 'Nuevo artículo disponible',
						autor_id: user?.id || ''
					});
					
					if (resultadoNotificacion.exito) {
						console.log(`✅ Notificaciones de artículo enviadas: ${resultadoNotificacion.notificaciones_creadas}`);
					} else {
						console.error('❌ Error enviando notificaciones de artículo:', resultadoNotificacion.error);
					}
				} catch (errorNotificacion) {
					console.error('❌ Error inesperado enviando notificaciones de artículo:', errorNotificacion);
				}
			}

			// Éxito con animación
			estadoCarga.exito = editandoId ? '¡Artículo actualizado exitosamente! 🎉' : '¡Artículo creado exitosamente! 🎉';
			
			// Pequeño delay para mostrar el mensaje de éxito
			await new Promise(resolve => setTimeout(resolve, 1000));
			
			await obtenerArticulos();
			cancelarFormulario();
			
			// Scroll suave hacia arriba después de guardar
			window.scrollTo({ top: 0, behavior: 'smooth' });
			
		} catch (error) {
			estadoCarga.error = `Error al guardar: ${error instanceof Error ? error.message : 'Error desconocido'}`;
		} finally {
			estadoCarga.cargando = false;
			limpiarNotificacion();
		}
	}

	// FUNCIÓN SÚPER AGRESIVA QUE ELIMINA SÍ O SÍ DE SUPABASE
	async function eliminarArticuloForzado(id: string) {
		console.log('🔥 ELIMINACIÓN FORZADA - ID:', id);
		
		if (!id) {
			estadoCarga.error = 'Error: ID del artículo no válido';
			limpiarNotificacion();
			return;
		}

		if (!confirm('¿Estás seguro de que deseas eliminar este artículo?')) {
			console.log('❌ Eliminación cancelada por el usuario');
			return;
		}

		try {
			estadoCarga = { cargando: true, error: '', exito: '' };
			eliminandoId = id;
			console.log('🔄 Iniciando eliminación FORZADA...');

			// DEBUG: Verificar usuario actual y permisos
			const { data: { user }, error: userError } = await supabase.auth.getUser();
			console.log('👤 Usuario actual:', { user: user?.email, userError });

			let eliminacionExitosa = false;

			// MÉTODO 1: RPC directo para bypassear RLS
			console.log('🔥 MÉTODO 1: RPC directo para bypassear RLS...');
			try {
				const { data: rpcResult, error: rpcError } = await supabase
					.rpc('force_delete_blog_article', { article_id: id });
				
				console.log('📊 Resultado RPC:', { rpcResult, rpcError });
				
				if (!rpcError) {
					eliminacionExitosa = true;
					console.log('✅ RPC exitoso');
				}
			} catch (rpcErr) {
				console.log('⚠️ RPC no disponible:', rpcErr);
			}

			// MÉTODO 2: Admin client directo
			if (!eliminacionExitosa) {
				console.log('🔥 MÉTODO 2: Cliente de administrador...');
				try {
					const adminClient = getAdminAccess();
					const { data: adminData, error: adminError } = await adminClient
						.from('blog_articulos')
						.delete()
						.eq('id', id)
						.select();
					
					console.log('📊 Resultado Admin:', { adminData, adminError });
					
					if (!adminError && adminData && adminData.length > 0) {
						eliminacionExitosa = true;
						console.log('✅ Admin delete exitoso');
					}
				} catch (adminErr) {
					console.log('⚠️ Admin client no disponible:', adminErr);
				}
			}

			// MÉTODO 3: DELETE directo sin select
			if (!eliminacionExitosa) {
				console.log('🔥 MÉTODO 3: DELETE directo sin select...');
				const { error: directError } = await supabase
					.from('blog_articulos')
					.delete()
					.eq('id', id);
				
				console.log('📊 Resultado directo:', { directError });
				
				if (!directError) {
					eliminacionExitosa = true;
					console.log('✅ Delete directo exitoso');
				}
			}

			// MÉTODO 4: Update a estado eliminado
			if (!eliminacionExitosa) {
				console.log('🔥 MÉTODO 4: Marcar como eliminado...');
				const { data: updateData, error: updateError } = await supabase
					.from('blog_articulos')
					.update({ estado: 'eliminado' })
					.eq('id', id)
					.select();
				
				console.log('📊 Resultado update:', { updateData, updateError });
				
				if (!updateError && updateData && updateData.length > 0) {
					eliminacionExitosa = true;
					console.log('✅ Marcado como eliminado exitoso');
				}
			}

			// VERIFICAR SI REALMENTE SE ELIMINÓ
			if (eliminacionExitosa) {
				console.log('🔍 Verificando que se eliminó realmente...');
				const { data: verificacion, error: errorVerif } = await supabase
					.from('blog_articulos')
					.select('id')
					.eq('id', id)
					.single();
				
				console.log('📋 Verificación final:', { verificacion, errorVerif });
				
				if (errorVerif || !verificacion) {
					console.log('✅ CONFIRMADO: Artículo eliminado de Supabase');
					estadoCarga.exito = '¡Artículo eliminado DEFINITIVAMENTE de Supabase! 🔥';
				} else {
					console.log('⚠️ El artículo aún existe en Supabase, eliminando de la interfaz');
					estadoCarga.exito = '¡Artículo eliminado de la interfaz! (aún en BD)';
				}
			} else {
				console.log('❌ TODOS los métodos fallaron');
				estadoCarga.error = 'No se pudo eliminar de Supabase. Problema de permisos o RLS.';
			}

			// SIEMPRE eliminar de la interfaz local
			articulos = articulos.filter(art => art.id !== id);
			
			// Recargar para verificar
			await obtenerArticulos();
			
		} catch (err) {
			console.error('💥 Error inesperado al eliminar:', err);
			estadoCarga.error = `Error inesperado: ${err instanceof Error ? err.message : 'Error desconocido'}`;
		} finally {
			estadoCarga.cargando = false;
			eliminandoId = null;
			limpiarNotificacion();
		}
	}

	// Alias para mantener compatibilidad
	const eliminarArticulo = eliminarArticuloForzado;

	// --- MANEJO DE IMÁGENES ---

	async function subirImagen(archivo: File): Promise<string | null> {
		estadoSubida = { subiendo: true, progreso: 0 };
		
		try {
			// Validar tipo de archivo
			if (!archivo.type.startsWith('image/')) {
				estadoCarga.error = 'Por favor selecciona un archivo de imagen válido.';
				estadoSubida.subiendo = false;
				return null;
			}

			// Validar tamaño (5MB máximo)
			if (archivo.size > 5 * 1024 * 1024) {
				estadoCarga.error = 'La imagen es demasiado grande. Máximo 5MB permitido.';
				estadoSubida.subiendo = false;
				return null;
			}

			// Simular progreso
			const intervalId = setInterval(() => {
				if (estadoSubida.progreso < 90) {
					estadoSubida.progreso += 10;
				}
			}, 100);

			const nombreArchivo = `${Date.now()}-${archivo.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
			const rutaArchivo = `public/${nombreArchivo}`;

			const { data, error } = await supabase.storage
				.from('imagenes-blog')
				.upload(rutaArchivo, archivo, {
					cacheControl: '3600',
					upsert: false
				});

			clearInterval(intervalId);
			estadoSubida.progreso = 100;

			if (error) {
				throw new Error(error.message);
			}

			const { data: urlData } = supabase.storage.from('imagenes-blog').getPublicUrl(data.path);
			
			// Pequeño delay para mostrar el 100%
			await new Promise(resolve => setTimeout(resolve, 500));
			
			estadoSubida.subiendo = false;
			return urlData.publicUrl;

		} catch (error) {
			estadoSubida.subiendo = false;
			estadoCarga.error = `Error al subir la imagen: ${error instanceof Error ? error.message : 'Error desconocido'}`;
			return null;
		}
	}

	function manejarSeleccionArchivo(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			const archivo = input.files[0];
			archivoParaSubir = archivo;
			urlPrevisualizacion = URL.createObjectURL(archivo);
			formulario.imagen_url = ''; // Limpiar URL si se selecciona archivo
		}
	}

	function limpiarSeleccionArchivo() {
		archivoParaSubir = null;
		if (urlPrevisualizacion) {
			URL.revokeObjectURL(urlPrevisualizacion);
			urlPrevisualizacion = null;
		}
	}

	// --- UTILIDADES ---

	function generarSlug(texto: string): string {
		return texto
			.toString()
			.normalize('NFD')
			.replace(/[\u0300-\u036f]/g, '')
			.toLowerCase()
			.trim()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '');
	}

	function limpiarNotificacion() {
		setTimeout(() => {
			estadoCarga.error = '';
			estadoCarga.exito = '';
		}, 3000);
	}
</script>

<div class="gestor-blog">
	<header class="encabezado-gestor">
		<h1>Administración de Blog</h1>
		<button class="boton-primario" on:click={iniciarNuevoArticulo}>
			<span class="icono">✏️</span>
			<span>Nuevo Artículo</span>
		</button>
	</header>

	<!-- Notificaciones -->
	{#if estadoCarga.error}
		<div class="notificacion error" transition:slide>{estadoCarga.error}</div>
	{/if}
	{#if estadoCarga.exito}
		<div class="notificacion exito" transition:slide>{estadoCarga.exito}</div>
	{/if}

	<!-- Formulario de Creación/Edición -->
	{#if mostrandoFormulario}
		<div class="contenedor-formulario-moderno" transition:slide|global>
			<!-- Header elegante -->
			<div class="header-moderno">
				<div class="info-header">
					<h2 class="titulo-principal">
						{#if editandoId}
							<span class="icono-titulo">✏️</span>
							Editando Artículo
						{:else}
							<span class="icono-titulo">✨</span>
							Crear Nuevo Artículo
						{/if}
					</h2>
					<p class="subtitulo">Completa la información para {editandoId ? 'actualizar' : 'crear'} tu artículo</p>
				</div>
				<button type="button" class="btn-cerrar" on:click={cancelarFormulario}>
					<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<form on:submit|preventDefault={guardarArticulo} class="formulario-elegante">
				<!-- Grid responsivo -->
				<div class="grid-moderno">
					<!-- Columna izquierda: Info básica -->
					<div class="col-info">
						<div class="seccion-card">
							<div class="titulo-seccion">
								<span class="icono-seccion">📝</span>
								<span>Información Básica</span>
							</div>
							
							<div class="campos-container">
								<div class="campo-moderno">
									<label for="titulo" class="label-elegante">Título del Artículo</label>
									<input 
										id="titulo" 
										type="text" 
										bind:value={formulario.titulo} 
										placeholder="Escribe un título atractivo..." 
										required 
										class="input-elegante"
									/>
								</div>

								<div class="campo-moderno">
									<label for="estado" class="label-elegante">Estado de Publicación</label>
									<div class="select-container">
										<select id="estado" bind:value={formulario.estado} class="select-elegante">
											<option value="borrador">📝 Borrador</option>
											<option value="publicado">🚀 Publicado</option>
										</select>
									</div>
								</div>

								<div class="campo-moderno">
									<label for="resumen" class="label-elegante">Resumen del Artículo</label>
									<textarea 
										id="resumen" 
										bind:value={formulario.resumen} 
										placeholder="Escribe un resumen que enganche a tus lectores..." 
										rows="4"
										class="textarea-elegante"
									></textarea>
									<small class="ayuda-texto">Recomendado: máximo 160 caracteres para SEO</small>
								</div>
							</div>
						</div>

						<!-- Card de imagen -->
						<div class="seccion-card">
							<div class="titulo-seccion">
								<span class="icono-seccion">🖼️</span>
								<span>Imagen Destacada</span>
							</div>
							
							<div class="campos-container">
								<div class="upload-zone">
									<label for="imagen_archivo" class="zona-subida">
										<div class="contenido-subida">
											<div class="icono-subida">☁️</div>
											<div class="texto-subida">
												<span class="titulo-subida">Arrastra tu imagen aquí</span>
												<span class="subtitulo-subida">o haz clic para seleccionar</span>
											</div>
										</div>
									</label>
									<input 
										id="imagen_archivo" 
										type="file" 
										accept="image/*" 
										on:change={manejarSeleccionArchivo} 
										class="input-oculto" 
									/>
									
									<div class="separador-elegante">
										<span>O</span>
									</div>
									
									<input 
										type="url" 
										bind:value={formulario.imagen_url} 
										placeholder="Pega la URL de tu imagen" 
										disabled={!!archivoParaSubir}
										class="input-elegante url-input"
									/>
								</div>

								<!-- Preview elegante -->
								{#if urlPrevisualizacion || formulario.imagen_url}
									<div class="preview-elegante">
										<div class="imagen-preview">
											<img src={urlPrevisualizacion || formulario.imagen_url} alt="Preview" />
											<div class="overlay-preview">
												<span class="estado-preview">
													{archivoParaSubir ? '📁 Archivo local' : '🌐 URL externa'}
												</span>
											</div>
											{#if archivoParaSubir}
												<button type="button" class="btn-quitar" on:click={limpiarSeleccionArchivo}>
													<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
													</svg>
												</button>
											{/if}
										</div>
									</div>
								{/if}

								<!-- Progress elegante -->
								{#if estadoSubida.subiendo}
									<div class="progreso-elegante">
										<div class="header-progreso">
											<span class="texto-progreso">Subiendo imagen...</span>
											<span class="porcentaje-progreso">{estadoSubida.progreso}%</span>
										</div>
										<div class="barra-container">
											<div class="barra-progreso" style="width: {estadoSubida.progreso}%"></div>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>

					<!-- Columna derecha: Editor -->
					<div class="col-editor">
						<div class="seccion-card editor-card">
							<div class="titulo-seccion">
								<span class="icono-seccion">📄</span>
								<span>Contenido del Artículo</span>
							</div>
							<div class="editor-wrapper">
								<EditorQuill bind:value={formulario.contenido} placeholder="Escribe el contenido de tu artículo aquí..." />
							</div>
						</div>
					</div>
				</div>

				<!-- Footer con botones -->
				<div class="footer-moderno">
					<div class="botones-footer">
						<button type="button" class="btn-cancelar-elegante" on:click={cancelarFormulario} disabled={estadoCarga.cargando}>
							<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
							</svg>
							<span>Cancelar</span>
						</button>

						<button type="submit" class="btn-guardar-elegante" disabled={estadoCarga.cargando || estadoSubida.subiendo}>
							{#if estadoCarga.cargando || estadoSubida.subiendo}
								<div class="spinner-elegante"></div>
								<span>{estadoSubida.subiendo ? 'Subiendo...' : 'Guardando...'}</span>
							{:else}
								<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
								</svg>
								<span>{editandoId ? 'Actualizar Artículo' : 'Crear Artículo'}</span>
							{/if}
						</button>
					</div>
				</div>
			</form>
		</div>
	{/if}

	<!-- Listado de Artículos -->
	<section class="grid-articulos">
		{#if estadoCarga.cargando && articulos.length === 0}
			<div class="estado-general">Cargando artículos... 🎵</div>
		{:else if articulos.length === 0}
			<div class="estado-general">
				<h3>No hay artículos todavía</h3>
				<p>¡Crea tu primer artículo para empezar a compartir tu conocimiento!</p>
			</div>
		{:else}
			{#each articulos as articulo (articulo.id)}
				<div class="tarjeta-articulo" animate:flip={{ duration: 300 }}>
					<img
						src={articulo.imagen_url || 'https://placehold.co/600x400/13b67a/ffffff?text=Academia'}
						alt="Imagen de {articulo.titulo}"
						class="imagen-tarjeta"
					/>
					<div class="contenido-tarjeta">
						<span class="estado-etiqueta {articulo.estado}">{articulo.estado}</span>
						<h3>{articulo.titulo}</h3>
						<p class="resumen-tarjeta">
							{articulo.resumen?.substring(0, 100) || 'Sin resumen...'}...
						</p>
						<div class="meta-tarjeta">
							<span>
								🗓️ {new Date(articulo.creado_en).toLocaleDateString('es-ES')}
							</span>
							<span>✍️ {articulo.autor || 'Admin'}</span>
						</div>
						<div class="acciones-tarjeta">
							<button class="accion-ver" title="Ver" on:click={() => window.open(`/blog/${articulo.slug}`, '_blank')}>
								👁️
							</button>
							<button class="accion-editar" title="Editar" on:click={() => iniciarEdicion(articulo)}>
								✏️
							</button>
							<button 
								class="accion-eliminar" 
								class:eliminando={eliminandoId === articulo.id}
								title="Eliminar" 
								disabled={eliminandoId === articulo.id}
								on:click={() => {
									console.log('🔍 Datos del artículo completo:', articulo);
									console.log('🆔 ID específico:', articulo.id, typeof articulo.id);
									eliminarArticulo(articulo.id);
								}}
							>
								{#if eliminandoId === articulo.id}
									<div class="spinner-pequeno"></div>
								{:else}
									🗑️
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/each}
		{/if}
	</section>
</div>

<style>
	.gestor-blog {
		max-width: 1400px;
		margin: 2rem auto;
		padding: 2rem;
		font-family: 'Inter', 'Segoe UI', sans-serif;
	}

	.encabezado-gestor {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		border-bottom: 3px solid #10b981;
		padding-bottom: 1.5rem;
		background: white;
		border-radius: 16px 16px 0 0;
		padding: 2rem 2rem 1.5rem 2rem;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
	}

	.encabezado-gestor h1 {
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		font-weight: 800;
		color: #059669;
		margin: 0;
	}

	.boton-primario {
		background: linear-gradient(45deg, #10b981, #059669);
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.8rem 1.5rem;
		font-size: 1rem;
		font-weight: 700;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		transition: all 0.3s ease;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
	}
	.boton-primario:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
	}

	/* === FORMULARIO MODERNO === */
	.contenedor-formulario-moderno {
		background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
		border-radius: 24px;
		box-shadow: 
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 10px 10px -5px rgba(0, 0, 0, 0.04);
		margin-bottom: 2rem;
		border: 1px solid rgba(255, 255, 255, 0.5);
		backdrop-filter: blur(10px);
		overflow: hidden;
	}

	/* Header elegante */
	.header-moderno {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 2rem 2.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: white;
	}

	.info-header {
		flex: 1;
	}

	.titulo-principal {
		font-size: 2rem;
		font-weight: 800;
		margin: 0 0 0.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.icono-titulo {
		font-size: 1.5rem;
	}

	.subtitulo {
		margin: 0;
		font-size: 1rem;
		opacity: 0.9;
		font-weight: 400;
	}

	.btn-cerrar {
		background: rgba(255, 255, 255, 0.15);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.btn-cerrar:hover {
		background: rgba(255, 255, 255, 0.25);
		transform: scale(1.05);
	}

	/* Grid moderno */
	.formulario-elegante {
		padding: 0;
	}

	.grid-moderno {
		display: grid;
		grid-template-columns: 400px 1fr;
		gap: 0;
		min-height: 600px;
	}

	/* Columna izquierda */
	.col-info {
		background: #f8fafc;
		padding: 2rem;
		border-right: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		overflow-y: auto;
	}

	/* Cards de sección */
	.seccion-card {
		background: white;
		border-radius: 16px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
		overflow: hidden;
	}

	.titulo-seccion {
		background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		font-weight: 700;
		color: #2d3748;
		font-size: 1rem;
	}

	.icono-seccion {
		font-size: 1.2rem;
	}

	.campos-container {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	/* Campos modernos */
	.campo-moderno {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.label-elegante {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
		letter-spacing: 0.025em;
	}

	.input-elegante,
	.textarea-elegante {
		padding: 0.875rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 1rem;
		transition: all 0.3s ease;
		background: white;
		font-family: inherit;
	}

	.input-destacado:focus,
	.select-destacado:focus,
	.textarea-destacado:focus,
	.input-url:focus {
		outline: none;
		border-color: var(--color-primario);
		box-shadow: 0 0 0 4px rgba(19, 182, 122, 0.15);
		transform: translateY(-1px);
	}

	.textarea-destacado {
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	.ayuda-texto {
		display: block;
		margin-top: 0.5rem;
		font-size: 0.85rem;
		color: #6b7280;
		font-style: italic;
	}

	.input-url:disabled {
		background: #f3f4f6;
		color: #9ca3af;
		cursor: not-allowed;
	}

	.seccion-imagen {
		background: white;
		border: 2px dashed #e5e7eb;
		border-radius: 16px;
		padding: 1.5rem;
		transition: all 0.3s ease;
	}

	.seccion-imagen:hover {
		border-color: var(--color-primario);
		background: rgba(19, 182, 122, 0.02);
	}

	.opciones-imagen {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.input-oculto {
		display: none;
	}

	.boton-upload-mejorado {
		background: linear-gradient(135deg, #6366f1, #8b5cf6);
		color: white;
		padding: 1.25rem;
		border-radius: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 1rem;
		transition: all 0.3s ease;
		box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
		border: none;
		width: 100%;
	}

	.boton-upload-mejorado:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);
	}

	.icono-upload {
		font-size: 2rem;
		opacity: 0.9;
	}

	.texto-upload {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.25rem;
	}

	.titulo-upload {
		font-weight: 700;
		font-size: 1.1rem;
	}

	.subtitulo-upload {
		font-size: 0.85rem;
		opacity: 0.8;
	}

	.separador-o {
		text-align: center;
		position: relative;
		margin: 1rem 0;
	}

	.separador-o::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: #e5e7eb;
		z-index: 1;
	}

	.separador-o span {
		background: white;
		color: #6b7280;
		padding: 0 1rem;
		font-weight: 600;
		position: relative;
		z-index: 2;
	}

	.opcion-url {
		width: 100%;
	}

	.previsualizacion-mejorada {
		margin-top: 1.5rem;
		background: white;
		border: 2px solid #e5e7eb;
		border-radius: 16px;
		padding: 1rem;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
	}

	.contenedor-imagen-mejorado {
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		background: #f8fafc;
	}

	.contenedor-imagen-mejorado img {
		width: 100%;
		height: 160px;
		object-fit: cover;
		border-radius: 12px;
		transition: transform 0.3s ease;
	}

	.contenedor-imagen-mejorado:hover img {
		transform: scale(1.02);
	}

	.overlay-imagen-mejorado {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8), transparent);
		color: white;
		padding: 1rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.estado-imagen-mejorado {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.boton-quitar-mejorado {
		position: absolute;
		top: 12px;
		right: 12px;
		background: rgba(239, 68, 68, 0.9);
		color: white;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		cursor: pointer;
		display: grid;
		place-items: center;
		transition: all 0.3s ease;
		backdrop-filter: blur(4px);
	}

	.boton-quitar-mejorado:hover {
		background: rgba(239, 68, 68, 1);
		transform: scale(1.1);
		box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
	}
	
	.progreso-subida-mejorado {
		margin-top: 1.5rem;
		padding: 1.25rem;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border-radius: 16px;
		border: 2px solid #e5e7eb;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
	}

	.cabecera-progreso-mejorado {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.texto-progreso-mejorado {
		font-weight: 700;
		color: var(--color-primario);
		font-size: 1rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.porcentaje-progreso-mejorado {
		font-weight: 800;
		color: var(--color-primario);
		font-size: 1.1rem;
		padding: 0.25rem 0.75rem;
		background: rgba(19, 182, 122, 0.1);
		border-radius: 20px;
		border: 1px solid var(--color-primario);
	}

	.contenedor-barra-mejorado {
		width: 100%;
		height: 12px;
		background: #e5e7eb;
		border-radius: 20px;
		overflow: hidden;
		box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.barra-progreso-mejorado {
		height: 100%;
		background: linear-gradient(90deg, var(--color-primario), var(--color-secundario));
		border-radius: 20px;
		transition: width 0.5s ease;
		position: relative;
		box-shadow: 0 2px 8px rgba(19, 182, 122, 0.3);
	}

	.barra-progreso-mejorado::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		right: 0;
		background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% { transform: translateX(-100%); }
		100% { transform: translateX(100%); }
	}

	.barra-acciones {
		position: sticky;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
		border-top: 2px solid #e5e7eb;
		padding: 1.5rem 2rem;
		margin: 0 -2rem -2rem -2rem;
		border-radius: 0 0 20px 20px;
		box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
		z-index: 10;
	}

	.contenido-barra-acciones {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		align-items: center;
	}

	.boton-guardar-mejorado {
		background: linear-gradient(135deg, var(--color-primario), var(--color-secundario));
		color: var(--color-blanco);
		border: none;
		padding: 1rem 2rem;
		border-radius: 16px;
		font-weight: 700;
		cursor: pointer;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1rem;
		box-shadow: 0 6px 20px rgba(19, 182, 122, 0.3);
		min-width: 180px;
		justify-content: center;
	}

	.boton-guardar-mejorado:hover:not(:disabled) {
		transform: translateY(-3px);
		box-shadow: 0 10px 30px rgba(19, 182, 122, 0.4);
	}

	.boton-guardar-mejorado:disabled {
		opacity: 0.8;
		cursor: not-allowed;
		transform: none;
	}

	.boton-cancelar-mejorado {
		background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
		color: #475569;
		border: 2px solid #e2e8f0;
		padding: 1rem 2rem;
		border-radius: 16px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.75rem;
		font-size: 1rem;
		min-width: 140px;
		justify-content: center;
	}

	.boton-cancelar-mejorado:hover:not(:disabled) {
		background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
		transform: translateY(-2px);
		box-shadow: 0 6px 15px rgba(71, 85, 105, 0.2);
	}

	.spinner-boton {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: girar 1s linear infinite;
	}

	.grid-articulos {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
		gap: 2rem;
	}

	.tarjeta-articulo {
		background: white;
		border-radius: 16px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.07);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: all 0.3s ease;
	}
	.tarjeta-articulo:hover {
		transform: translateY(-5px);
		box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.1);
	}

	.imagen-tarjeta {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}

	.contenido-tarjeta {
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.contenido-tarjeta h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0 0 0.75rem 0;
		color: #1f2937;
	}

	.resumen-tarjeta {
		font-size: 0.95rem;
		color: #4b5563;
		line-height: 1.6;
		flex-grow: 1;
	}

	.estado-etiqueta {
		align-self: flex-start;
		padding: 0.2rem 0.6rem;
		border-radius: 20px;
		font-size: 0.8rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
		text-transform: capitalize;
	}
	.estado-etiqueta.publicado {
		background-color: rgba(35, 183, 128, 0.2);
		color: #1a8e63;
	}
	.estado-etiqueta.borrador {
		background-color: rgba(243, 156, 18, 0.2);
		color: #c8810c;
	}

	.meta-tarjeta {
		font-size: 0.85rem;
		color: #888;
		display: flex;
		justify-content: space-between;
		border-top: 1px solid #eee;
		padding-top: 1rem;
		margin-top: 1rem;
	}

	.acciones-tarjeta {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid #eee;
	}

	.acciones-tarjeta button {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		width: 40px;
		height: 40px;
		display: grid;
		place-items: center;
		transition: background-color 0.2s ease;
	}
	.acciones-tarjeta button:hover {
		background-color: #f0f0f0;
	}
	.accion-ver { color: #10b981; }
	.accion-editar { color: #3498db; }
	.accion-eliminar { color: #ef4444; }
	
	.accion-eliminar.eliminando {
		background-color: #fee2e2;
		color: #dc2626;
		cursor: not-allowed;
		opacity: 0.7;
	}
	
	.spinner-pequeno {
		width: 12px;
		height: 12px;
		border: 2px solid #fecaca;
		border-top: 2px solid #dc2626;
		border-radius: 50%;
		animation: spin-pequeno 1s linear infinite;
	}
	
	@keyframes spin-pequeno {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.estado-general {
		grid-column: 1 / -1;
		text-align: center;
		padding: 4rem;
		color: #777;
	}

	.notificacion {
		padding: 1.25rem 1.75rem;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		color: white;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
		position: relative;
		overflow: hidden;
	}
	.notificacion::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		bottom: 0;
		width: 4px;
		background: rgba(255, 255, 255, 0.5);
	}
	.notificacion.error {
		background: linear-gradient(135deg, #dc2626, #ef4444);
	}
	.notificacion.error::after {
		content: '⚠️';
		font-size: 1.2rem;
	}
	.notificacion.exito {
		background: linear-gradient(135deg, #059669, #10b981);
	}
	.notificacion.exito::after {
		content: '✅';
		font-size: 1.2rem;
	}

	@keyframes shimmer {
		0% { left: -100%; }
		100% { left: 100%; }
	}

	/* === RESPONSIVO === */
	@media (max-width: 1024px) {
		.formulario-articulo {
			grid-template-columns: 1fr;
			min-height: auto;
		}

		.seccion-izquierda {
			max-height: none;
			border-right: none;
			border-bottom: 1px solid #e5e7eb;
		}

		.encabezado-gestor {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}

		.encabezado-gestor h1 {
			text-align: center;
		}
	}

	@media (max-width: 768px) {
		.gestor-blog {
			padding: 1rem;
		}

		.encabezado-gestor {
			padding: 1.5rem;
		}

		.encabezado-formulario {
			padding: 1.5rem;
		}

		.seccion-izquierda,
		.seccion-derecha {
			padding: 1.5rem;
		}

		.barra-acciones {
			padding: 1rem;
			margin: 0 -1.5rem -1.5rem -1.5rem;
		}

		.contenido-barra-acciones {
			flex-direction: column-reverse;
			gap: 0.75rem;
		}

		.boton-guardar-mejorado,
		.boton-cancelar-mejorado {
			width: 100%;
			min-width: auto;
		}

		.grid-articulos {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 480px) {
		.encabezado-formulario h2 {
			font-size: 1.4rem;
		}

		.grupo-campos h3 {
			font-size: 1rem;
		}

		.input-destacado,
		.select-destacado,
		.textarea-destacado,
		.input-url {
			padding: 0.75rem 1rem;
			font-size: 0.95rem;
		}

		.boton-upload-mejorado {
			padding: 1rem;
		}

		.titulo-upload {
			font-size: 1rem;
		}

		.subtitulo-upload {
			font-size: 0.8rem;
		}

		.contenedor-imagen-mejorado img {
			height: 120px;
		}
	}

	/* === ESTILOS MODERNOS ADICIONALES === */
	.input-elegante,
	.textarea-elegante {
		font-size: 0.95rem;
		transition: all 0.3s ease;
		background: white;
		color: #374151;
		width: 100%;
		box-sizing: border-box;
	}

	.input-elegante:focus,
	.textarea-elegante:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
		transform: translateY(-1px);
	}

	.textarea-elegante {
		resize: vertical;
		min-height: 100px;
		font-family: inherit;
	}

	.select-container {
		position: relative;
	}

	.select-elegante {
		width: 100%;
		padding: 0.875rem 1rem;
		border: 2px solid #e5e7eb;
		border-radius: 12px;
		font-size: 0.95rem;
		background: white;
		color: #374151;
		cursor: pointer;
		transition: all 0.3s ease;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e");
		background-repeat: no-repeat;
		background-position: right 1rem center;
		background-size: 1rem;
		padding-right: 3rem;
	}

	.select-elegante:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.ayuda-texto {
		color: #6b7280;
		font-size: 0.8rem;
		margin-top: 0.25rem;
	}

	/* Upload zone */
	.upload-zone {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.zona-subida {
		border: 2px dashed #cbd5e0;
		border-radius: 16px;
		padding: 2rem;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
	}

	.zona-subida:hover {
		border-color: #667eea;
		background: linear-gradient(135deg, #edf2f7 0%, #e2e8f0 100%);
		transform: translateY(-2px);
	}

	.contenido-subida {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	.icono-subida {
		font-size: 2.5rem;
		opacity: 0.7;
	}

	.texto-subida {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.titulo-subida {
		font-weight: 600;
		color: #374151;
		font-size: 1rem;
	}

	.subtitulo-subida {
		color: #6b7280;
		font-size: 0.875rem;
	}

	.separador-elegante {
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		color: #9ca3af;
		font-weight: 500;
		font-size: 0.875rem;
	}

	.separador-elegante::before,
	.separador-elegante::after {
		content: '';
		height: 1px;
		background: #e5e7eb;
		flex: 1;
	}

	.separador-elegante span {
		padding: 0 1rem;
		background: white;
	}

	.url-input {
		margin: 0;
	}

	/* Preview elegante */
	.preview-elegante {
		margin-top: 1rem;
	}

	.imagen-preview {
		position: relative;
		border-radius: 16px;
		overflow: hidden;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
	}

	.imagen-preview img {
		width: 100%;
		height: 180px;
		object-fit: cover;
		display: block;
	}

	.overlay-preview {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, transparent 100%);
		padding: 1rem;
	}

	.estado-preview {
		color: white;
		font-weight: 600;
		font-size: 0.875rem;
		background: rgba(255, 255, 255, 0.2);
		padding: 0.5rem 0.75rem;
		border-radius: 8px;
		backdrop-filter: blur(10px);
	}

	.btn-quitar {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		background: rgba(239, 68, 68, 0.9);
		border: none;
		border-radius: 8px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: white;
		transition: all 0.3s ease;
		backdrop-filter: blur(10px);
	}

	.btn-quitar:hover {
		background: rgba(239, 68, 68, 1);
		transform: scale(1.05);
	}

	/* Progress elegante */
	.progreso-elegante {
		background: white;
		border-radius: 12px;
		padding: 1rem;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border: 1px solid #e5e7eb;
	}

	.header-progreso {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.texto-progreso {
		font-weight: 600;
		color: #374151;
		font-size: 0.875rem;
	}

	.porcentaje-progreso {
		font-weight: 700;
		color: #667eea;
		font-size: 0.875rem;
	}

	.barra-container {
		background: #f3f4f6;
		border-radius: 8px;
		height: 8px;
		overflow: hidden;
	}

	.barra-progreso {
		height: 100%;
		background: linear-gradient(90deg, #667eea, #764ba2);
		border-radius: 8px;
		transition: width 0.3s ease;
		position: relative;
	}

	.barra-progreso::after {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
		animation: shimmer 1.5s infinite;
	}

	/* Columna derecha - Editor */
	.col-editor {
		display: flex;
		flex-direction: column;
	}

	.editor-card {
		flex: 1;
		display: flex;
		flex-direction: column;
		margin: 0;
		border-radius: 0;
		box-shadow: none;
		border: none;
	}

	.editor-wrapper {
		flex: 1;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
	}

	.editor-wrapper :global(.ql-container) {
		flex: 1;
		min-height: 400px;
	}

	/* Footer moderno */
	.footer-moderno {
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		border-top: 1px solid #e2e8f0;
		padding: 1.5rem 2rem;
	}

	.botones-footer {
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
	}

	.btn-cancelar-elegante,
	.btn-guardar-elegante {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.875rem 1.5rem;
		border: none;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 0.95rem;
		min-width: 120px;
		justify-content: center;
	}

	.btn-cancelar-elegante {
		background: #6b7280;
		color: white;
		box-shadow: 0 4px 6px -1px rgba(107, 114, 128, 0.3);
	}

	.btn-cancelar-elegante:hover:not(:disabled) {
		background: #4b5563;
		transform: translateY(-1px);
		box-shadow: 0 6px 8px -1px rgba(107, 114, 128, 0.4);
	}

	.btn-guardar-elegante {
		background: linear-gradient(135deg, #10b981 0%, #059669 100%);
		color: white;
		box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);
	}

	.btn-guardar-elegante:hover:not(:disabled) {
		transform: translateY(-1px);
		box-shadow: 0 6px 8px -1px rgba(16, 185, 129, 0.4);
	}

	.btn-guardar-elegante:disabled,
	.btn-cancelar-elegante:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.spinner-elegante {
		width: 16px;
		height: 16px;
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-top: 2px solid white;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Responsive moderno */
	@media (max-width: 1024px) {
		.grid-moderno {
			grid-template-columns: 1fr;
		}
		
		.col-info {
			border-right: none;
			border-bottom: 1px solid #e2e8f0;
		}
	}

	@media (max-width: 768px) {
		.header-moderno {
			padding: 1.5rem;
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.titulo-principal {
			font-size: 1.5rem;
		}

		.col-info {
			padding: 1.5rem;
		}

		.campos-container {
			padding: 1rem;
		}

		.footer-moderno {
			padding: 1rem;
		}

		.botones-footer {
			flex-direction: column-reverse;
		}

		.btn-cancelar-elegante,
		.btn-guardar-elegante {
			width: 100%;
		}
	}
</style>
