<script lang="ts">
	import { onMount, onDestroy, createEventDispatcher } from 'svelte';
	import { browser } from '$app/environment';

	export let value = '';
	export let placeholder = 'Escribe aquí...';
	export let readOnly = false;

	const dispatch = createEventDispatcher();

	let editorDiv: HTMLDivElement;
	let quill: any;
	let quillLoaded = false;

	onMount(async () => {
		if (!browser) return;

		const Quill = (await import('quill')).default;
		await import('quill/dist/quill.snow.css');

		// Traducciones de los tooltips de la barra de herramientas
		const translations = {
			Bold: 'Negrita',
			Italic: 'Cursiva',
			Underline: 'Subrayado',
			Strike: 'Tachado',
			Blockquote: 'Cita',
			'Code Block': 'Bloque de Código',
			Link: 'Enlace',
			Image: 'Imagen',
			Video: 'Video',
			'Ordered List': 'Lista Ordenada',
			'Bulleted List': 'Lista con Viñetas',
			'Align text': 'Alinear texto',
			'Header': 'Encabezado',
			'Clean': 'Limpiar formato'
		};
		const Font = Quill.import('formats/font');
		Font.whitelist = ['sans-serif', 'serif', 'monospace'];
		Quill.register(Font, true);

		const icons = Quill.import('ui/icons');
		Object.keys(translations).forEach((key) => {
			const sanitizedKey = key.toLowerCase().replace(/\s/g, '-');
			if (icons[sanitizedKey]) {
				icons[sanitizedKey] = `<span title="${translations[key]}">${icons[sanitizedKey]}</span>`;
			}
		});

		quill = new Quill(editorDiv, {
			theme: 'snow',
			readOnly,
			placeholder,
			modules: {
				toolbar: {
					container: [
						[{ header: [1, 2, 3, 4, false] }],
						['bold', 'italic', 'underline', 'strike'],
						[{ color: [] }, { background: [] }],
						[{ list: 'ordered' }, { list: 'bullet' }],
						[{ align: [] }],
						['blockquote', 'code-block'],
						['link', 'image', 'video'],
						['clean']
					],
				}
			}
		});

		if (value) {
			quill.root.innerHTML = value;
		}

		quill.on('text-change', () => {
			const newHtml = quill.root.innerHTML;
			if (value !== newHtml) {
				value = newHtml;
				dispatch('input', value);
			}
		});

		quillLoaded = true;
	});

	$: if (quillLoaded && quill && quill.root.innerHTML !== value) {
		quill.root.innerHTML = value || '';
	}

	onDestroy(() => {
		if (quill) {
			quill.off('text-change');
			quill = null;
		}
	});
</script>

<div bind:this={editorDiv} class="editor-quill-container" />

<style>
	.editor-quill-container {
		background: #fff;
		border-radius: var(--borde-radio, 12px);
		border: 1px solid #ccc;
		min-height: 250px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		transition: border-color 0.3s ease, box-shadow 0.3s ease;
	}

	.editor-quill-container:focus-within {
		border-color: var(--color-primario, #13b67a);
		box-shadow: 0 0 0 3px rgba(19, 182, 122, 0.2);
	}

	:global(.ql-toolbar) {
		background-color: #f8f9fa;
		border-top-left-radius: var(--borde-radio, 12px);
		border-top-right-radius: var(--borde-radio, 12px);
		border: none !important;
		border-bottom: 1px solid #ccc !important;
	}

	:global(.ql-container) {
		flex-grow: 1;
		font-size: 1rem;
		border-bottom-left-radius: var(--borde-radio, 12px);
		border-bottom-right-radius: var(--borde-radio, 12px);
		border: none !important;
	}

	:global(.ql-editor) {
		padding: 1.5rem;
		line-height: 1.6;
	}

	:global(.ql-editor.ql-blank::before) {
		font-style: italic;
		color: #999;
		left: 1.5rem;
	}

	:global(.ql-stroke) {
		stroke: #555;
	}
	:global(.ql-fill) {
		fill: #555;
	}
	:global(.ql-picker-label) {
		color: #555;
	}
	:global(.ql-snow .ql-active .ql-stroke) {
		stroke: var(--color-primario, #13b67a);
	}
	:global(.ql-snow .ql-active .ql-fill) {
		fill: var(--color-primario, #13b67a);
	}
	:global(.ql-snow .ql-active .ql-picker-label) {
		color: var(--color-primario, #13b67a);
	}

	:global(.ql-tooltip) {
		z-index: 1000;
		box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
		border-radius: 8px;
	}
</style>
