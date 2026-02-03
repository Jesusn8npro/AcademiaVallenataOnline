<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { audioManager, TipoEfectoUI } from '$lib/components/SimuladorDefinitivo/audio/AudioManager';

	export let mostrar = false;
	export let titulo = '';
	export let ancho = 'max-w-md';
	export let cerrarAlHacerClick = true;
	export let mostrarBotonCerrar = true;
	export let centrado = true;

	const dispatch = createEventDispatcher();

	let dialogoRef: HTMLDialogElement;

	onMount(() => {
		if (mostrar) {
			abrirModal();
		}
	});

	$: if (mostrar) {
		abrirModal();
	} else {
		cerrarModal();
	}

	function abrirModal() {
		if (dialogoRef) {
			dialogoRef.showModal();
			audioManager.reproducirEfectoUI(TipoEfectoUI.POP);
		}
	}

	function cerrarModal() {
		if (dialogoRef) {
			dialogoRef.close();
			audioManager.reproducirEfectoUI(TipoEfectoUI.SLIDE_1);
		}
	}

	function manejarCerrar() {
		mostrar = false;
		dispatch('cerrar');
	}

	function manejarClickFondo(evento: MouseEvent) {
		if (cerrarAlHacerClick && evento.target === dialogoRef) {
			manejarCerrar();
		}
	}

	function manejarTeclaEscape(evento: KeyboardEvent) {
		if (evento.key === 'Escape') {
			manejarCerrar();
		}
	}
</script>

<dialog
	bind:this={dialogoRef}
	on:click={manejarClickFondo}
	on:keydown={manejarTeclaEscape}
	class="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-transparent p-0 max-w-none"
>
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div
			class="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-xl rounded-xl 
                   shadow-2xl border border-purple-500/30 {ancho} w-full max-h-[90vh] overflow-auto
                   transform transition-all duration-300 ease-out
                   animate-in fade-in-0 zoom-in-95"
		>
			{#if titulo || mostrarBotonCerrar}
				<div class="flex items-center justify-between p-6 border-b border-purple-500/20">
					{#if titulo}
						<h2 class="text-xl font-bold text-white">{titulo}</h2>
					{/if}
					{#if mostrarBotonCerrar}
						<button
							on:click={manejarCerrar}
							class="text-gray-400 hover:text-white transition-colors p-2 rounded-full
                                   hover:bg-purple-500/20 active:scale-95"
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					{/if}
				</div>
			{/if}

			<div class="p-6">
				<slot />
			</div>

			{#if $$slots.acciones}
				<div class="flex justify-end gap-3 p-6 pt-0">
					<slot name="acciones" />
				</div>
			{/if}
		</div>
	</div>
</dialog>

<style>
	dialog {
		animation: fadeIn 0.3s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
</style> 