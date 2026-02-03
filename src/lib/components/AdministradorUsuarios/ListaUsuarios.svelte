<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	interface Usuario {
		id: string;
		nombre: string;
		apellido: string;
		nombre_completo: string;
		correo_electronico: string;
		rol: string;
		suscripcion: string;
		fecha_creacion: string;
		eliminado: boolean;
		url_foto_perfil?: string;
		ciudad?: string;
		pais?: string;
	}

	export let usuarios: Usuario[] = [];
	export let cargando = false;
	export let busqueda = '';
	export let filtroRol = 'todos';
	export let filtroSuscripcion = 'todas';
	export let mostrarEliminados = false;

	const dispatch = createEventDispatcher();

	function seleccionarUsuario(usuario: Usuario) {
		dispatch('seleccionarUsuario', usuario);
	}

	function formatearFecha(fecha: string) {
		return new Date(fecha).toLocaleDateString('es-ES', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function obtenerIniciales(nombre: string, apellido: string) {
		return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
	}
</script>

<!-- Filtros -->
<div class="controles">
	<div class="campo-busqueda">
		<svg width="20" height="20" viewBox="0 0 24 24" fill="none">
			<path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" stroke-width="2"/>
		</svg>
		<input
			type="text"
			placeholder="Buscar por nombre o correo..."
			bind:value={busqueda}
		/>
	</div>

	<div class="filtros">
		<select bind:value={filtroRol}>
			<option value="todos">Todos los roles</option>
			<option value="admin">Administradores</option>
			<option value="user">Estudiantes</option>
		</select>

		<select bind:value={filtroSuscripcion}>
			<option value="todas">Todas las membresías</option>
			<option value="free">Gratuita</option>
			<option value="basic">Básica</option>
			<option value="premium">Premium</option>
			<option value="pro">Profesional</option>
		</select>

		<label class="toggle">
			<input type="checkbox" bind:checked={mostrarEliminados} />
			<span>Ver eliminados</span>
		</label>
	</div>
</div>

<!-- Lista de usuarios -->
<div class="contenedor-tabla">
	{#if cargando}
		<div class="cargando">
			<div class="spinner"></div>
			<p>Cargando usuarios...</p>
		</div>
	{:else if usuarios.length === 0}
		<div class="sin-resultados">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none">
				<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" opacity="0.3"/>
			</svg>
			<h3>No se encontraron usuarios</h3>
			<p>Intenta cambiar los filtros de búsqueda</p>
		</div>
	{:else}
		<table class="tabla-usuarios">
			<thead>
				<tr>
					<th>Usuario</th>
					<th>Correo</th>
					<th>Rol</th>
					<th>Membresía</th>
					<th>Fecha Registro</th>
					<th>Estado</th>
					<th>Acciones</th>
				</tr>
			</thead>
			<tbody>
				{#each usuarios as usuario (usuario.id)}
					<tr 
						class="fila-usuario"
						class:eliminado={usuario.eliminado}
						on:click={() => seleccionarUsuario(usuario)}
					>
						<td class="celda-usuario">
							<div class="info-usuario">
								{#if usuario.url_foto_perfil}
									<img src={usuario.url_foto_perfil} alt={usuario.nombre_completo} class="avatar" />
								{:else}
									<div class="avatar-placeholder">
										{obtenerIniciales(usuario.nombre, usuario.apellido)}
									</div>
								{/if}
								<div class="datos-usuario">
									<span class="nombre">{usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()}</span>
									<span class="ubicacion">{usuario.ciudad ? `${usuario.ciudad}, ${usuario.pais}` : usuario.pais || ''}</span>
								</div>
							</div>
						</td>
						<td>{usuario.correo_electronico}</td>
						<td>
							<span class="badge badge-{usuario.rol}">
								{usuario.rol === 'admin' ? 'Administrador' : 'Estudiante'}
							</span>
						</td>
						<td>
							<span class="badge badge-suscripcion-{usuario.suscripcion}">
								{usuario.suscripcion === 'free' ? 'Gratuita' : 
								 usuario.suscripcion === 'basic' ? 'Básica' :
								 usuario.suscripcion === 'premium' ? 'Premium' : 
								 usuario.suscripcion === 'pro' ? 'Profesional' : usuario.suscripcion}
							</span>
						</td>
						<td>{formatearFecha(usuario.fecha_creacion)}</td>
						<td>
							<span class="estado" class:activo={!usuario.eliminado} class:inactivo={usuario.eliminado}>
								{usuario.eliminado ? 'Eliminado' : 'Activo'}
							</span>
						</td>
						<td class="celda-acciones">
							<button class="btn-accion" on:click|stopPropagation={() => seleccionarUsuario(usuario)}>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none">
									<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2"/>
									<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
								</svg>
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.controles {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 15px;
		padding: 20px;
		margin-bottom: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 20px;
		flex-wrap: wrap;
	}

	.campo-busqueda {
		position: relative;
		min-width: 300px;
		flex: 1;
	}

	.campo-busqueda svg {
		position: absolute;
		left: 15px;
		top: 50%;
		transform: translateY(-50%);
		color: rgba(255, 255, 255, 0.7);
	}

	.campo-busqueda input {
		width: 100%;
		padding: 12px 45px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 10px;
		color: white;
		font-size: 14px;
	}

	.campo-busqueda input::placeholder {
		color: rgba(255, 255, 255, 0.6);
	}

	.filtros {
		display: flex;
		gap: 15px;
		align-items: center;
		flex-wrap: wrap;
	}

	.filtros select {
		padding: 10px 15px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 8px;
		color: white;
		font-size: 14px;
	}

	.filtros option {
		background: #333;
		color: white;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 8px;
		color: white;
		font-size: 14px;
		cursor: pointer;
	}

	.contenedor-tabla {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(20px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 15px;
		overflow: hidden;
	}

	.cargando {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: white;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid rgba(255, 255, 255, 0.3);
		border-top: 3px solid white;
		border-radius: 50%;
		animation: girar 1s linear infinite;
		margin-bottom: 20px;
	}

	.sin-resultados {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60px 20px;
		color: white;
		text-align: center;
	}

	.tabla-usuarios {
		width: 100%;
		border-collapse: collapse;
	}

	.tabla-usuarios th {
		background: rgba(255, 255, 255, 0.1);
		padding: 15px;
		text-align: left;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
		color: white;
		font-weight: 600;
	}

	.fila-usuario {
		cursor: pointer;
		transition: all 0.3s ease;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	.fila-usuario:hover {
		background: rgba(255, 255, 255, 0.1);
	}

	.fila-usuario.eliminado {
		opacity: 0.6;
	}

	.tabla-usuarios td {
		padding: 15px;
		vertical-align: middle;
		color: white;
	}

	.celda-usuario {
		min-width: 250px;
	}

	.info-usuario {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
	}

	.avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea, #764ba2);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 14px;
	}

	.datos-usuario {
		display: flex;
		flex-direction: column;
	}

	.nombre {
		font-weight: 600;
		font-size: 14px;
	}

	.ubicacion {
		font-size: 12px;
		color: rgba(255, 255, 255, 0.7);
	}

	.badge {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.badge-admin {
		background: linear-gradient(135deg, #FF9800, #F57C00);
		color: white;
	}

	.badge-user {
		background: linear-gradient(135deg, #2196F3, #1976D2);
		color: white;
	}

	.badge-suscripcion-free {
		background: rgba(156, 156, 156, 0.2);
		color: #ccc;
		border: 1px solid #999;
	}

	.badge-suscripcion-basic {
		background: linear-gradient(135deg, #4CAF50, #45a049);
		color: white;
	}

	.badge-suscripcion-premium {
		background: linear-gradient(135deg, #9C27B0, #7B1FA2);
		color: white;
	}

	.badge-suscripcion-pro {
		background: linear-gradient(135deg, #FF5722, #D84315);
		color: white;
	}

	.estado {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 600;
	}

	.estado.activo {
		background: rgba(76, 175, 80, 0.2);
		color: #4CAF50;
		border: 1px solid #4CAF50;
	}

	.estado.inactivo {
		background: rgba(244, 67, 54, 0.2);
		color: #f44336;
		border: 1px solid #f44336;
	}

	.celda-acciones {
		text-align: center;
	}

	.btn-accion {
		padding: 8px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.3);
		border-radius: 6px;
		color: white;
		cursor: pointer;
		transition: all 0.3s ease;
	}

	.btn-accion:hover {
		background: rgba(255, 255, 255, 0.2);
		transform: translateY(-1px);
	}

	@keyframes girar {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	@media (max-width: 768px) {
		.controles {
			flex-direction: column;
			align-items: stretch;
		}

		.campo-busqueda {
			min-width: auto;
		}

		.filtros {
			justify-content: space-between;
		}

		.contenedor-tabla {
			overflow-x: auto;
		}
	}
</style> 