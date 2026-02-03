<script context="module" lang="ts">
	// Declarar ePayco como variable global
	declare const ePayco: any;
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { usuario } from '$lib/UsuarioActivo/usuario';
	import { supabase } from '$lib/supabase/clienteSupabase';
	import { goto } from '$app/navigation';
	import ModalPagoInteligente from '$lib/components/ComponentesLanding/ModalPagoInteligente.svelte';

	// Props
	export let mostrarModal = false;
	export let planSeleccionado: string | null = null;

	// Estado del componente
	let cargando = true;
	let error = '';
	let membresiaActual: any = null;
	let planes: any[] = [];
	let mostrarAnual = false; // Toggle para mostrar precios anuales vs mensuales

	// Estados del proceso de selección
	let procesando = false;
	let mostrandoConfirmacion = false;
	let planASeleccionar: any = null;
	
	// Modal de pago
	let mostrarModalPago = false;

	// Cargar datos al montar el componente
	onMount(async () => {
		await cargarDatos();
	});

	async function cargarDatos() {
		try {
			cargando = true;
			error = '';
			
			// Cargar planes de membresía disponibles
			const { data: planesData, error: planesError } = await supabase
				.from('membresias')
				.select('*')
				.eq('activa', true)
				.order('precio_mensual', { ascending: true });

			if (planesError) throw planesError;
			planes = planesData || [];

			// Si el usuario está autenticado, cargar su membresía actual
			if ($usuario?.id) {
				const { data: suscripcionData, error: suscripcionError } = await supabase
					.from('suscripciones_usuario')
					.select(`
						*,
						membresias (
							id,
							nombre,
							descripcion,
							precio_mensual,
							precio_anual,
							permisos
						)
					`)
					.eq('usuario_id', $usuario.id)
					.eq('estado', 'activa')
					.single();

				if (suscripcionError && suscripcionError.code !== 'PGRST116') {
					console.error('Error cargando suscripción:', suscripcionError);
				} else if (suscripcionData) {
					membresiaActual = suscripcionData;
				}
			}

		} catch (err) {
			console.error('Error cargando datos de membresías:', err);
			error = 'Error cargando información de membresías. Por favor, intenta de nuevo.';
		} finally {
			cargando = false;
		}
	}

	function formatearPrecio(precio: number): string {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		}).format(precio);
	}

	function calcularDescuentoAnual(mensual: number, anual: number): number {
		const mensualAnualizado = mensual * 12;
		return Math.round(((mensualAnualizado - anual) / mensualAnualizado) * 100);
	}

	function obtenerColorPlan(planId: string): string {
		const colores = {
			'basica': 'from-blue-500 to-blue-600',
			'intermedia': 'from-green-500 to-green-600', 
			'avanzada': 'from-purple-500 to-purple-600',
			'premium': 'from-yellow-500 to-yellow-600'
		};
		return colores[planId as keyof typeof colores] || 'from-gray-500 to-gray-600';
	}

	function obtenerIconoPlan(planId: string): string {
		const iconos = {
			'basica': '🌱',
			'intermedia': '🚀', 
			'avanzada': '⭐',
			'premium': '👑'
		};
		return iconos[planId as keyof typeof iconos] || '📦';
	}

	function obtenerNivelPlan(planId: string): number {
		const niveles = {
			'basica': 1,
			'intermedia': 2,
			'avanzada': 3,
			'premium': 4
		};
		return niveles[planId as keyof typeof niveles] || 0;
	}

	function esPlaneActual(planId: string): boolean {
		return membresiaActual?.membresias?.id === planId;
	}

	function esPlanSuperior(planId: string): boolean {
		if (!membresiaActual?.membresias) return true;
		const planActualPrecio = membresiaActual.membresias.precio_mensual;
		const planPrecio = planes.find(p => p.id === planId)?.precio_mensual || 0;
		return planPrecio > planActualPrecio;
	}

	async function seleccionarPlan(plan: any) {
		// 🔧 PERMITIR COMPRA SIN LOGIN - EL MODAL MANEJA EL REGISTRO
		if (esPlaneActual(plan.id)) {
			error = 'Ya tienes este plan activo';
			return;
		}

		planASeleccionar = plan;
		
		// Si no hay usuario, abrir directamente el modal (permitirá registro)
		if (!$usuario?.id) {
			console.log('🚀 Usuario no logueado - abriendo modal de pago para crear cuenta');
			mostrarModalPago = true;
		} else {
			// Si hay usuario, mostrar confirmación primero
			mostrandoConfirmacion = true;
		}
	}

	async function confirmarSeleccion() {
		if (!planASeleccionar || !$usuario?.id) return;

		console.log('🚀 Abriendo modal de pago para membresía:', planASeleccionar);
		mostrandoConfirmacion = false;
		mostrarModalPago = true;
	}

	/**
	 * Abrir formulario de pago de ePayco
	 */
	function abrirFormularioEpayco(epaycoData: any) {
		try {
			console.log('🎯 Abriendo formulario de ePayco con datos:', epaycoData);

			// Verificar que ePayco esté disponible
			if (typeof ePayco === 'undefined') {
				console.error('❌ ePayco no está cargado');
				error = 'El sistema de pagos no está disponible. Por favor, recarga la página e intenta de nuevo.';
				return;
			}

			// Configurar y abrir el checkout de ePayco
			const handler = ePayco.checkout.configure({
				key: epaycoData.key,
				test: epaycoData.test
			});

			// ✅ CONFIGURAR CALLBACKS OFICIALES DE EPAYCO
			handler.onCreated = function(response: any) {
				console.log('✅ Checkout creado:', response);
			};

			handler.onResponse = function(response: any) {
				console.log('✅ Respuesta recibida:', response);
				// Procesar respuesta del pago
				if (response.x_response === 'Aceptada' || response.x_cod_response === '1') {
					console.log('✅ Pago exitoso de membresía');
					// Aquí podrías redirigir o mostrar confirmación
				} else {
					console.error('❌ Pago rechazado:', response.x_response_reason_text || response.x_response);
				}
			};

			handler.onClosed = function(response: any) {
				console.log('✅ Modal cerrado:', response);
			};

			handler.onErrors = function(error: any) {
				console.error('❌ Error en ePayco:', error);
			};

			handler.open(epaycoData);

			console.log('✅ Formulario de ePayco abierto exitosamente');

		} catch (error) {
			console.error('💥 Error abriendo formulario de ePayco:', error);
			error = 'Error abriendo el formulario de pago. Por favor, intenta de nuevo.';
		}
	}

	function cerrarConfirmacion() {
		mostrandoConfirmacion = false;
		planASeleccionar = null;
	}

	function parsearPermisos(permisos: any): string[] {
		if (typeof permisos === 'string') {
			try {
				const parsed = JSON.parse(permisos);
				return Object.keys(parsed).filter(key => parsed[key] === true);
			} catch {
				return [];
			}
		}
		if (typeof permisos === 'object' && permisos !== null) {
			return Object.keys(permisos).filter(key => permisos[key] === true);
		}
		return [];
	}
</script>

<!-- Modal de selección de membresías -->
{#if mostrarModal}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
			<div class="p-6 border-b border-gray-200">
				<div class="flex justify-between items-center">
					<div>
						<h2 class="text-2xl font-bold text-gray-900">Planes de Membresía</h2>
						<p class="text-gray-600 mt-1">Elige el plan que mejor se adapte a tu aprendizaje</p>
					</div>
					<button 
						on:click={() => mostrarModal = false}
						class="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			</div>

			<div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
				{#if error}
					<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
						<div class="flex">
							<svg class="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
							</svg>
							<div class="ml-3">
								<p class="text-sm text-red-800">{error}</p>
							</div>
						</div>
					</div>
				{/if}

				{#if cargando}
					<div class="flex justify-center items-center py-12">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
						<span class="ml-3 text-gray-600">Cargando planes...</span>
					</div>
				{:else}
					<!-- Toggle precios anuales/mensuales -->
					<div class="flex justify-center mb-8">
						<div class="bg-gray-100 p-1 rounded-lg flex">
							<button
								class="px-4 py-2 rounded-md text-sm font-medium transition-all {!mostrarAnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
								on:click={() => mostrarAnual = false}
							>
								Mensual
							</button>
							<button
								class="px-4 py-2 rounded-md text-sm font-medium transition-all {mostrarAnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
								on:click={() => mostrarAnual = true}
							>
								Anual <span class="text-green-600 font-bold">(Ahorra hasta 20%)</span>
							</button>
						</div>
					</div>

					<!-- Membresía actual (si existe) -->
					{#if membresiaActual}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
							<div class="flex items-center">
								<svg class="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
								<div class="ml-3">
									<h3 class="text-sm font-medium text-blue-800">Plan Actual</h3>
									<p class="text-sm text-blue-700">
										{membresiaActual.membresias.nombre} - 
										Vence el {new Date(membresiaActual.fecha_vencimiento).toLocaleDateString('es-CO')}
									</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Grid de planes -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
						{#each planes as plan}
							{@const precio = mostrarAnual ? plan.precio_anual : plan.precio_mensual}
							{@const descuento = mostrarAnual ? calcularDescuentoAnual(plan.precio_mensual, plan.precio_anual) : 0}
							{@const permisos = parsearPermisos(plan.permisos)}
							{@const esActual = esPlaneActual(plan.id)}
							{@const esSuperior = esPlanSuperior(plan.id)}
							
							<div class="relative">
								<!-- Badge para plan recomendado -->
								{#if plan.id === 'intermedia'}
									<div class="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
										<span class="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold">
											RECOMENDADO
										</span>
									</div>
								{/if}

								<div class="relative bg-white rounded-xl border-2 {esActual ? 'border-blue-500 bg-blue-50' : esSuperior ? 'border-gray-200 hover:border-gray-300' : 'border-gray-200 opacity-75'} transition-all duration-200 hover:shadow-lg {plan.id === 'intermedia' ? 'ring-2 ring-green-200' : ''}">
									<!-- Header del plan -->
									<div class="p-6 text-center">
										<div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r {obtenerColorPlan(plan.id)} rounded-full flex items-center justify-center text-2xl">
											{obtenerIconoPlan(plan.id)}
										</div>
										<h3 class="text-xl font-bold text-gray-900 capitalize">{plan.nombre}</h3>
										<p class="text-gray-600 text-sm mt-2">{plan.descripcion || 'Plan perfecto para tu nivel'}</p>
										
										<!-- Precio -->
										<div class="mt-4">
											{#if mostrarAnual && descuento > 0}
												<div class="text-sm text-gray-500 line-through">
													{formatearPrecio(plan.precio_mensual * 12)}
												</div>
											{/if}
											<div class="text-3xl font-bold text-gray-900">
												{formatearPrecio(precio)}
											</div>
											<div class="text-sm text-gray-600">
												{mostrarAnual ? 'por año' : 'por mes'}
												{#if mostrarAnual && descuento > 0}
													<span class="text-green-600 font-bold ml-1">(-{descuento}%)</span>
												{/if}
											</div>
										</div>
									</div>

									<!-- Features del plan -->
									<div class="px-6 pb-6">
										<ul class="space-y-3">
											{#each permisos.slice(0, 5) as permiso}
												<li class="flex items-center text-sm">
													<svg class="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
														<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
													</svg>
													<span class="text-gray-700 capitalize">{permiso.replace(/_/g, ' ')}</span>
												</li>
											{/each}
											{#if permisos.length > 5}
												<li class="text-sm text-gray-500 italic">
													+{permisos.length - 5} beneficios más...
												</li>
											{/if}
										</ul>
									</div>

									<!-- Botón de acción -->
									<div class="px-6 pb-6">
										{#if esActual}
											<button 
												disabled
												class="w-full bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
											>
												Plan Actual
											</button>
										{:else if esSuperior}
											<button 
												on:click={() => seleccionarPlan(plan)}
												class="w-full bg-gradient-to-r {obtenerColorPlan(plan.id)} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
											>
												{membresiaActual ? 'Actualizar Plan' : 'Seleccionar Plan'}
											</button>
										{:else}
											<button 
												disabled
												class="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
											>
												Plan Inferior
											</button>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Información adicional -->
					<div class="mt-8 bg-gray-50 rounded-lg p-6">
						<h3 class="text-lg font-semibold text-gray-900 mb-4">¿Por qué elegir una membresía?</h3>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div class="flex items-start">
								<svg class="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
								</svg>
								<div>
									<h4 class="font-medium text-gray-900">Acceso Completo</h4>
									<p class="text-sm text-gray-600">Todos los cursos, tutoriales y contenido premium</p>
								</div>
							</div>
							<div class="flex items-start">
								<svg class="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
								</svg>
								<div>
									<h4 class="font-medium text-gray-900">Soporte Prioritario</h4>
									<p class="text-sm text-gray-600">Atención preferencial y respuestas rápidas</p>
								</div>
							</div>
							<div class="flex items-start">
								<svg class="w-6 h-6 text-purple-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z" clip-rule="evenodd" />
								</svg>
								<div>
									<h4 class="font-medium text-gray-900">Contenido Exclusivo</h4>
									<p class="text-sm text-gray-600">Masterclasses y contenido solo para miembros</p>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}

<!-- Modal de confirmación -->
{#if mostrandoConfirmacion && planASeleccionar}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
		<div class="bg-white rounded-xl max-w-md w-full">
			<div class="p-6">
				<div class="text-center">
					<div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r {obtenerColorPlan(planASeleccionar.id)} rounded-full flex items-center justify-center text-2xl">
						{obtenerIconoPlan(planASeleccionar.id)}
					</div>
					<h3 class="text-lg font-semibold text-gray-900 mb-2">
						Confirmar Selección
					</h3>
					<p class="text-gray-600 mb-4">
						¿Estás seguro de que quieres {membresiaActual ? 'actualizar a' : 'seleccionar'} el plan <strong class="capitalize">{planASeleccionar.nombre}</strong>?
					</p>
					<div class="text-2xl font-bold text-gray-900 mb-6">
						{formatearPrecio(mostrarAnual ? planASeleccionar.precio_anual : planASeleccionar.precio_mensual)}
						<span class="text-sm font-normal text-gray-600">
							{mostrarAnual ? '/año' : '/mes'}
						</span>
					</div>
				</div>

				<div class="flex space-x-3">
					<button
						on:click={cerrarConfirmacion}
						disabled={procesando}
						class="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
					>
						Cancelar
					</button>
					<button
						on:click={confirmarSeleccion}
						disabled={procesando}
						class="flex-1 bg-gradient-to-r {obtenerColorPlan(planASeleccionar.id)} text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center"
					>
						{#if procesando}
							<div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
						{/if}
						Continuar al Pago
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Componente independiente para usar en páginas -->
{#if !mostrarModal}
	<div class="py-12">
		{#if error}
			<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
				<div class="flex">
					<svg class="w-5 h-5 text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
					</svg>
					<div class="ml-3">
						<p class="text-sm text-red-800">{error}</p>
					</div>
				</div>
			</div>
		{/if}

		{#if cargando}
			<div class="flex justify-center items-center py-12">
				<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
				<span class="ml-3 text-gray-600">Cargando planes...</span>
			</div>
		{:else}
			<div class="text-center mb-8">
				<h2 class="text-3xl font-bold text-gray-900 mb-4">Planes de Membresía</h2>
				<p class="text-gray-600 max-w-2xl mx-auto">
					Elige el plan que mejor se adapte a tu nivel y metas de aprendizaje. 
					Todos los planes incluyen acceso a la comunidad y soporte.
				</p>
			</div>

			<!-- Toggle Mensual/Anual -->
			<div class="flex justify-center mb-8">
				<div class="bg-gray-100 p-1 rounded-lg">
					<button 
						on:click={() => mostrarAnual = false}
						class="px-6 py-2 rounded-md text-sm font-medium transition-all {!mostrarAnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
					>
						Mensual
					</button>
					<button 
						on:click={() => mostrarAnual = true}
						class="px-6 py-2 rounded-md text-sm font-medium transition-all {mostrarAnual ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"
					>
						Anual 
						<span class="bg-green-500 text-white text-xs px-2 py-1 rounded-full ml-1">-20%</span>
					</button>
				</div>
			</div>

			<!-- Grid de planes -->
			{#if planes && planes.length > 0}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
					{#each planes as plan}
						{@const precio = mostrarAnual ? plan.precio_anual : plan.precio_mensual}
						{@const descuento = mostrarAnual ? Math.round(((plan.precio_mensual * 12 - plan.precio_anual) / (plan.precio_mensual * 12)) * 100) : 0}
						{@const permisos = Object.keys(plan.permisos || {}).filter(key => plan.permisos[key])}
						{@const nivelPlan = obtenerNivelPlan(plan.id)}
						{@const nivelActual = membresiaActual ? obtenerNivelPlan(membresiaActual.plan_id) : 0}
						{@const esActual = membresiaActual?.plan_id === plan.id}
						{@const esSuperior = nivelPlan >= nivelActual}

						<div class="flex flex-col">
							{#if plan.id === 'intermedia'}
								<div class="bg-green-500 text-white text-center py-2 rounded-t-xl text-sm font-medium">
									⭐ MÁS POPULAR
								</div>
							{/if}

							<div class="relative bg-white rounded-xl border-2 {esActual ? 'border-blue-500 bg-blue-50' : esSuperior ? 'border-gray-200 hover:border-gray-300' : 'border-gray-200 opacity-75'} transition-all duration-200 hover:shadow-lg {plan.id === 'intermedia' ? 'ring-2 ring-green-200' : ''} flex-1 flex flex-col">
								<!-- Header del plan -->
								<div class="p-6 text-center">
									<div class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r {obtenerColorPlan(plan.id)} rounded-full flex items-center justify-center text-2xl">
										{obtenerIconoPlan(plan.id)}
									</div>
									<h3 class="text-xl font-bold text-gray-900 capitalize">{plan.nombre}</h3>
									<p class="text-gray-600 text-sm mt-2">{plan.descripcion || 'Plan perfecto para tu nivel'}</p>
									
									<!-- Precio -->
									<div class="mt-4">
										{#if mostrarAnual && descuento > 0}
											<div class="text-sm text-gray-500 line-through">
												{formatearPrecio(plan.precio_mensual * 12)}
											</div>
										{/if}
										<div class="text-3xl font-bold text-gray-900">
											{formatearPrecio(precio)}
										</div>
										<div class="text-sm text-gray-600">
											{mostrarAnual ? 'por año' : 'por mes'}
											{#if mostrarAnual && descuento > 0}
												<span class="text-green-600 font-bold ml-1">(-{descuento}%)</span>
											{/if}
										</div>
									</div>
								</div>

								<!-- Features del plan -->
								<div class="px-6 pb-6 flex-1">
									<ul class="space-y-3">
										{#each permisos.slice(0, 5) as permiso}
											<li class="flex items-center text-sm">
												<svg class="w-4 h-4 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
												</svg>
												<span class="text-gray-700 capitalize">{permiso.replace(/_/g, ' ')}</span>
											</li>
										{/each}
										{#if permisos.length > 5}
											<li class="text-sm text-gray-500 italic">
												+{permisos.length - 5} beneficios más...
											</li>
										{/if}
									</ul>
								</div>

								<!-- Botón de acción -->
								<div class="px-6 pb-6">
									{#if esActual}
										<button 
											disabled
											class="w-full bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
										>
											Plan Actual
										</button>
									{:else if esSuperior}
										<button 
											on:click={() => seleccionarPlan(plan)}
											class="w-full bg-gradient-to-r {obtenerColorPlan(plan.id)} text-white py-3 px-4 rounded-lg font-medium hover:shadow-lg transition-all duration-200 transform hover:scale-105"
										>
											{membresiaActual ? 'Actualizar Plan' : 'Seleccionar Plan'}
										</button>
									{:else}
										<button 
											disabled
											class="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg font-medium cursor-not-allowed"
										>
											Plan Inferior
										</button>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Información adicional -->
				<div class="mt-12 bg-gray-50 rounded-lg p-6 max-w-4xl mx-auto">
					<h3 class="text-lg font-semibold text-gray-900 mb-4 text-center">¿Por qué elegir una membresía?</h3>
					<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
						<div class="flex items-start">
							<svg class="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
							</svg>
							<div>
								<h4 class="font-medium text-gray-900">Acceso Completo</h4>
								<p class="text-sm text-gray-600">Todos los cursos, tutoriales y contenido premium</p>
							</div>
						</div>
						<div class="flex items-start">
							<svg class="w-6 h-6 text-blue-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
							</svg>
							<div>
								<h4 class="font-medium text-gray-900">Soporte Prioritario</h4>
								<p class="text-sm text-gray-600">Atención preferencial y respuestas rápidas</p>
							</div>
						</div>
						<div class="flex items-start">
							<svg class="w-6 h-6 text-purple-500 mr-3 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 01-1 1h-2a1 1 0 01-1-1v-2z" clip-rule="evenodd" />
							</svg>
							<div>
								<h4 class="font-medium text-gray-900">Contenido Exclusivo</h4>
								<p class="text-sm text-gray-600">Masterclasses y contenido solo para miembros</p>
							</div>
						</div>
					</div>
				</div>
			{:else}
				<div class="text-center py-12">
					<svg class="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<h3 class="text-lg font-medium text-gray-900 mb-2">No hay planes disponibles</h3>
					<p class="text-gray-600">Los planes de membresía no están disponibles en este momento.</p>
				</div>
			{/if}
		{/if}
	</div>
{/if}

<!-- Modal de Pago Inteligente -->
{#if planASeleccionar}
	<ModalPagoInteligente 
		bind:mostrar={mostrarModalPago} 
		contenido={planASeleccionar}
		tipoContenido="membresia"
	/>
{/if} 