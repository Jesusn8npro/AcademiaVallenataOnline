<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { supabase } from '$lib/supabase/clienteSupabase';

	const dispatch = createEventDispatcher();

	let cargando = false;
	let error = '';
	let exito = false;

	// Datos del formulario
	let datos = {
		nombre: '',
		apellido: '',
		nombre_usuario: '',
		correo_electronico: '',
		password: '',
		rol: 'estudiante',
		suscripcion: 'free',
		ciudad: '',
		pais: '',
		whatsapp: '',
		nivel_habilidad: '',
		documento_tipo: 'CC',
		documento_numero: '',
		profesion: '',
		instrumento: 'acordeon'
	};

	function cerrar() {
		dispatch('cerrar');
	}

	// Función para limpiar entrada de emojis y caracteres especiales
	function limpiarTexto(texto: string): string {
		return texto
			.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
	}
	
	// Función para limpiar solo al enviar el formulario (con trim)
	function limpiarTextoFinal(texto: string): string {
		return texto
			.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
			.trim();
	}

	// Función para validar email
	function validarEmail(email: string): boolean {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return regex.test(email);
	}



	async function crearUsuario() {
		// Limpiar todos los campos de texto al enviar el formulario
		datos.nombre = limpiarTextoFinal(datos.nombre);
		datos.apellido = limpiarTextoFinal(datos.apellido);
		datos.nombre_usuario = limpiarTextoFinal(datos.nombre_usuario);
		datos.correo_electronico = datos.correo_electronico.trim().toLowerCase();
		datos.ciudad = limpiarTextoFinal(datos.ciudad);
		datos.pais = limpiarTextoFinal(datos.pais);
		datos.profesion = limpiarTextoFinal(datos.profesion);

		// Validaciones
		if (!datos.nombre || !datos.apellido || !datos.correo_electronico || !datos.password) {
			error = 'Por favor completa todos los campos obligatorios';
			return;
		}

		if (!validarEmail(datos.correo_electronico)) {
			error = 'Por favor ingresa un correo electrónico válido';
			return;
		}

		if (datos.password.length < 6) {
			error = 'La contraseña debe tener al menos 6 caracteres';
			return;
		}

		// Validar formato del nombre de usuario (solo si se proporciona)
		if (datos.nombre_usuario && datos.nombre_usuario.trim() !== '') {
			const usernameRegex = /^[a-zA-Z0-9_]+$/;
			if (!usernameRegex.test(datos.nombre_usuario)) {
				error = 'El nombre de usuario solo puede contener letras, números y guiones bajos (_)';
				return;
			}

			if (datos.nombre_usuario.length < 3) {
				error = 'El nombre de usuario debe tener al menos 3 caracteres';
				return;
			}
		}

		try {
			cargando = true;
			error = '';

			// Crear usuario usando API endpoint local (NO afecta la sesión del admin)
			const response = await fetch('/api/admin/crear-usuario', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(datos)
			});

			const resultado = await response.json();

			if (!response.ok) {
				error = resultado.error || 'Error al crear el usuario';
				return;
			}

			// Usuario creado exitosamente
			exito = true;
			const usuarioCreado = resultado.usuario;
			limpiarFormulario();
			setTimeout(() => {
				dispatch('usuarioCreado', usuarioCreado);
			}, 2000);

		} catch (err: any) {
			console.error('Error completo:', err);
			error = `Error inesperado: ${err.message}`;
		} finally {
			cargando = false;
		}
	}

	function limpiarFormulario() {
		datos = {
			nombre: '',
			apellido: '',
			nombre_usuario: '',
			correo_electronico: '',
			password: '',
			rol: 'estudiante',
			suscripcion: 'free',
			ciudad: '',
			pais: '',
			whatsapp: '',
			nivel_habilidad: '',
			documento_tipo: 'CC',
			documento_numero: '',
			profesion: '',
			instrumento: 'acordeon'
		};
		error = '';
		exito = false;
	}

	// Manejadores de entrada para limpiar automáticamente
	function manejarEntradaTexto(event: Event) {
		const target = event.target as HTMLInputElement;
		const campo = target.name;
		if (campo && ['nombre', 'apellido', 'nombre_usuario', 'ciudad', 'pais', 'profesion'].includes(campo)) {
			target.value = limpiarTexto(target.value);
		}
	}
</script>

<div class="crear-usuario">
	<div class="header-crear">
		<h2>Crear Nuevo Usuario</h2>
		<button class="btn-cerrar" on:click={cerrar}>×</button>
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
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none">
				<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2"/>
			</svg>
			<p>¡Usuario creado exitosamente!</p>
			<small>Redirigiendo...</small>
		</div>
	{:else}
		<form on:submit|preventDefault={crearUsuario} class="formulario-crear">
			<div class="seccion">
				<h3>Información Básica</h3>
				<div class="campos-grupo">
					<div class="campo obligatorio">
						<label for="nombre">Nombre *</label>
						<input 
							id="nombre" 
							name="nombre"
							type="text" 
							bind:value={datos.nombre} 
							on:input={manejarEntradaTexto}
							required 
							placeholder="Nombre del usuario"
							maxlength="100"
						/>
					</div>

					<div class="campo obligatorio">
						<label for="apellido">Apellido *</label>
						<input 
							id="apellido" 
							name="apellido"
							type="text" 
							bind:value={datos.apellido} 
							on:input={manejarEntradaTexto}
							required 
							placeholder="Apellido del usuario"
							maxlength="100"
						/>
					</div>

					<div class="campo">
						<label for="nombre_usuario">Nombre de Usuario (opcional)</label>
						<input 
							id="nombre_usuario" 
							name="nombre_usuario"
							type="text" 
							bind:value={datos.nombre_usuario} 
							on:input={manejarEntradaTexto}
							placeholder="Se generará automáticamente si no se especifica"
							maxlength="50"
						/>
					</div>

					<div class="campo obligatorio">
						<label for="correo">Correo Electrónico *</label>
						<input 
							id="correo" 
							type="email" 
							bind:value={datos.correo_electronico} 
							required 
							placeholder="correo@ejemplo.com"
							maxlength="255"
						/>
					</div>

					<div class="campo obligatorio">
						<label for="password">Contraseña *</label>
						<input 
							id="password" 
							type="password" 
							bind:value={datos.password} 
							required 
							placeholder="Mínimo 6 caracteres"
							minlength="6"
							maxlength="100"
						/>
					</div>
				</div>
			</div>

			<div class="seccion">
				<h3>Rol y Permisos</h3>
				<div class="campos-grupo">
					<div class="campo">
						<label for="rol">Rol del Usuario</label>
						<select id="rol" bind:value={datos.rol}>
							<option value="estudiante">Estudiante</option>
							<option value="profesor">Profesor</option>
							<option value="admin">Administrador</option>
						</select>
					</div>

					<div class="campo">
						<label for="suscripcion">Tipo de Membresía</label>
						<select id="suscripcion" bind:value={datos.suscripcion}>
							<option value="free">Gratuita</option>
							<option value="basic">Básica</option>
							<option value="premium">Premium</option>
							<option value="pro">Profesional</option>
						</select>
					</div>
				</div>
			</div>

			<div class="seccion">
				<h3>Información Adicional (Opcional)</h3>
				<div class="campos-grupo">
					<div class="campo">
						<label for="ciudad">Ciudad</label>
						<input 
							id="ciudad" 
							name="ciudad"
							type="text" 
							bind:value={datos.ciudad} 
							on:input={manejarEntradaTexto}
							placeholder="Ciudad de residencia"
							maxlength="100"
						/>
					</div>

					<div class="campo">
						<label for="pais">País</label>
						<input 
							id="pais" 
							name="pais"
							type="text" 
							bind:value={datos.pais} 
							on:input={manejarEntradaTexto}
							placeholder="País de residencia"
							maxlength="100"
						/>
					</div>

					<div class="campo">
						<label for="whatsapp">WhatsApp</label>
						<input 
							id="whatsapp" 
							type="tel" 
							bind:value={datos.whatsapp} 
							placeholder="+57 300 123 4567"
							maxlength="20"
						/>
					</div>

					<div class="campo">
						<label for="nivel">Nivel de Habilidad</label>
						<select id="nivel" bind:value={datos.nivel_habilidad}>
							<option value="">Seleccionar nivel...</option>
							<option value="principiante">Principiante</option>
							<option value="intermedio">Intermedio</option>
							<option value="avanzado">Avanzado</option>
							<option value="experto">Experto</option>
						</select>
					</div>

					<div class="campo">
						<label for="documento_tipo">Tipo de Documento</label>
						<select id="documento_tipo" bind:value={datos.documento_tipo}>
							<option value="CC">Cédula de Ciudadanía</option>
							<option value="CE">Cédula de Extranjería</option>
							<option value="TI">Tarjeta de Identidad</option>
							<option value="PP">Pasaporte</option>
						</select>
					</div>

					<div class="campo">
						<label for="documento">Número de Documento</label>
						<input 
							id="documento" 
							type="text" 
							bind:value={datos.documento_numero} 
							placeholder="Número del documento"
							maxlength="20"
						/>
					</div>

					<div class="campo">
						<label for="profesion">Profesión</label>
						<input 
							id="profesion" 
							name="profesion"
							type="text" 
							bind:value={datos.profesion} 
							on:input={manejarEntradaTexto}
							placeholder="Profesión u ocupación"
							maxlength="100"
						/>
					</div>

					<div class="campo">
						<label for="instrumento">Instrumento Principal</label>
						<select id="instrumento" bind:value={datos.instrumento}>
							<option value="acordeon">Acordeón</option>
							<option value="caja">Caja</option>
							<option value="guacharaca">Guacharaca</option>
							<option value="bajo">Bajo</option>
							<option value="otro">Otro</option>
						</select>
					</div>
				</div>
			</div>

			<div class="acciones-formulario">
				<button 
					type="button" 
					class="btn-limpiar" 
					on:click={limpiarFormulario}
					disabled={cargando}
				>
					Limpiar
				</button>
				<button 
					type="submit" 
					class="btn-crear" 
					disabled={cargando}
				>
					{cargando ? 'Creando Usuario...' : 'Crear Usuario'}
				</button>
			</div>
		</form>
	{/if}
</div>

<style>
	.crear-usuario {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 15px;
		padding: 30px;
		color: white;
		max-height: 80vh;
		overflow-y: auto;
	}

	.header-crear {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 30px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		padding-bottom: 20px;
	}

	.header-crear h2 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		color: white;
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
		margin-bottom: 20px;
		color: #ff6b6b;
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.exito {
		background: rgba(76, 175, 80, 0.2);
		border: 1px solid #4CAF50;
		border-radius: 8px;
		padding: 30px;
		text-align: center;
		color: #4CAF50;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 15px;
	}

	.exito p {
		margin: 0;
		font-size: 18px;
		font-weight: 600;
	}

	.exito small {
		color: rgba(76, 175, 80, 0.7);
		font-size: 14px;
	}

	.formulario-crear {
		display: flex;
		flex-direction: column;
		gap: 30px;
	}

	.seccion {
		background: rgba(255, 255, 255, 0.05);
		border-radius: 12px;
		padding: 25px;
	}

	.seccion h3 {
		margin: 0 0 20px 0;
		font-size: 18px;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
		padding-bottom: 10px;
	}

	.campos-grupo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
	}

	.campo {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.campo.obligatorio label::after {
		content: ' *';
		color: #ff6b6b;
	}

	.campo label {
		font-weight: 600;
		font-size: 14px;
		color: rgba(255, 255, 255, 0.9);
	}

	.campo input, .campo select {
		padding: 12px 15px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		color: white;
		font-size: 14px;
		transition: all 0.3s ease;
	}

	.campo input:focus, .campo select:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.2);
	}

	.campo input::placeholder {
		color: rgba(255, 255, 255, 0.5);
	}

	.campo option {
		background: #333;
		color: white;
	}

	.acciones-formulario {
		display: flex;
		gap: 15px;
		justify-content: flex-end;
		padding-top: 20px;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	.btn-limpiar {
		background: rgba(255, 255, 255, 0.1);
		color: white;
		border: 1px solid rgba(255, 255, 255, 0.3);
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-limpiar:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.2);
	}

	.btn-crear {
		background: linear-gradient(135deg, #667eea, #764ba2);
		color: white;
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.3s ease;
		min-width: 140px;
	}

	.btn-crear:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
	}

	.btn-crear:disabled, .btn-limpiar:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none !important;
	}

	@media (max-width: 768px) {
		.crear-usuario {
			padding: 20px;
			max-height: 90vh;
		}

		.header-crear {
			flex-direction: column;
			gap: 15px;
			text-align: center;
		}

		.campos-grupo {
			grid-template-columns: 1fr;
		}

		.acciones-formulario {
			flex-direction: column;
		}

		.btn-crear, .btn-limpiar {
			width: 100%;
		}
	}
</style> 