<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { 
        subirImagenPaquete, 
        validarImagen, 
        generarVistaPrevia, 
        liberarVistaPrevia,
        formatearTamanoArchivo
    } from '$lib/services/imagenService';

    const dispatch = createEventDispatcher<{
        imagenSubida: { url: string; path: string };
        error: { message: string };
    }>();

    // Props
    export let imagenActual: string = '';
    export let deshabilitado: boolean = false;
    export let etiqueta: string = 'Imagen del paquete';
    export let descripcion: string = 'Arrastra una imagen aquí o haz clic para seleccionar';

    // Estados
    let arrastrando = false;
    let subiendoImagen = false;
    let vistaPrevia = '';
    let archivo: File | null = null;
    let inputArchivo: HTMLInputElement;

    // Función para manejar la selección de archivo
    function manejarSeleccionArchivo(event: Event) {
        const target = event.target as HTMLInputElement;
        if (target.files && target.files[0]) {
            procesarArchivo(target.files[0]);
        }
    }

    // Función para manejar drag & drop
    function manejarDrop(event: DragEvent) {
        event.preventDefault();
        arrastrando = false;

        if (deshabilitado) return;

        const files = event.dataTransfer?.files;
        if (files && files[0]) {
            procesarArchivo(files[0]);
        }
    }

    function manejarDragOver(event: DragEvent) {
        event.preventDefault();
        if (!deshabilitado) {
            arrastrando = true;
        }
    }

    function manejarDragLeave(event: DragEvent) {
        event.preventDefault();
        arrastrando = false;
    }

    // Procesar archivo seleccionado
    async function procesarArchivo(file: File) {
        // Validar imagen
        const validacion = validarImagen(file);
        if (!validacion.esValido) {
            dispatch('error', { message: validacion.error || 'Archivo no válido' });
            return;
        }

        // Generar vista previa
        if (vistaPrevia) {
            liberarVistaPrevia(vistaPrevia);
        }
        vistaPrevia = generarVistaPrevia(file);
        archivo = file;
    }

    // Subir imagen
    async function subirImagen() {
        if (!archivo) return;

        try {
            subiendoImagen = true;
            
            const resultado = await subirImagenPaquete(archivo);
            
            if (resultado.success && resultado.data) {
                dispatch('imagenSubida', {
                    url: resultado.data.url,
                    path: resultado.data.path
                });
                
                // Limpiar vista previa temporal
                if (vistaPrevia) {
                    liberarVistaPrevia(vistaPrevia);
                    vistaPrevia = '';
                }
                archivo = null;
                
                // Resetear input
                if (inputArchivo) {
                    inputArchivo.value = '';
                }
            } else {
                dispatch('error', { message: resultado.error || 'Error subiendo imagen' });
            }
        } catch (error: any) {
            dispatch('error', { message: `Error inesperado: ${error.message}` });
        } finally {
            subiendoImagen = false;
        }
    }

    // Cancelar selección
    function cancelarSeleccion() {
        if (vistaPrevia) {
            liberarVistaPrevia(vistaPrevia);
            vistaPrevia = '';
        }
        archivo = null;
        
        if (inputArchivo) {
            inputArchivo.value = '';
        }
    }

    // Abrir selector de archivos
    function abrirSelector() {
        if (deshabilitado) return;
        inputArchivo?.click();
    }
</script>

<div class="subidor-imagenes">
    <label class="subidor-label">{etiqueta}</label>
    
    <!-- Área de Drop -->
    <div 
        class="drop-area {arrastrando ? 'arrastrando' : ''} {deshabilitado ? 'deshabilitado' : ''}"
        on:drop={manejarDrop}
        on:dragover={manejarDragOver}
        on:dragleave={manejarDragLeave}
        on:click={abrirSelector}
        role="button"
        tabindex={deshabilitado ? -1 : 0}
    >
        <!-- Input oculto -->
        <input
            bind:this={inputArchivo}
            type="file"
            accept="image/*"
            on:change={manejarSeleccionArchivo}
            disabled={deshabilitado}
            class="input-oculto"
        />

        {#if vistaPrevia}
            <!-- Vista previa del archivo seleccionado -->
            <div class="preview-container">
                <div class="preview-image">
                    <img src={vistaPrevia} alt="Vista previa" />
                </div>
                <div class="preview-info">
                    <h4>📁 {archivo?.name}</h4>
                    <p>📏 {archivo ? formatearTamanoArchivo(archivo.size) : ''}</p>
                    <div class="preview-actions">
                        <button 
                            class="btn-subir" 
                            on:click|stopPropagation={subirImagen}
                            disabled={subiendoImagen}
                        >
                            {#if subiendoImagen}
                                <span class="loading-spinner"></span>
                                Subiendo...
                            {:else}
                                ⬆️ Subir imagen
                            {/if}
                        </button>
                        <button 
                            class="btn-cancelar" 
                            on:click|stopPropagation={cancelarSeleccion}
                            disabled={subiendoImagen}
                        >
                            ❌ Cancelar
                        </button>
                    </div>
                </div>
            </div>
        {:else if imagenActual}
            <!-- Imagen actual -->
            <div class="imagen-actual">
                <img src={imagenActual} alt="Imagen actual" />
                <div class="imagen-overlay">
                    <p>🖼️ Imagen actual</p>
                    <p class="cambiar-texto">Haz clic para cambiar</p>
                </div>
            </div>
        {:else}
            <!-- Estado vacío -->
            <div class="drop-placeholder">
                <div class="drop-icon">
                    {#if arrastrando}
                        📥
                    {:else}
                        🖼️
                    {/if}
                </div>
                <h3 class="drop-title">
                    {arrastrando ? '¡Suelta la imagen aquí!' : descripcion}
                </h3>
                <p class="drop-subtitle">
                    {#if arrastrando}
                        La imagen se procesará automáticamente
                    {:else}
                        Formatos soportados: JPG, PNG, WebP, GIF (máx. 10MB)
                    {/if}
                </p>
                {#if !arrastrando}
                    <button class="btn-seleccionar" type="button">
                        📁 Seleccionar imagen
                    </button>
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .subidor-imagenes {
        width: 100%;
    }

    .subidor-label {
        display: block;
        font-weight: 600;
        color: #374151;
        margin-bottom: 0.75rem;
        font-size: 1rem;
    }

    .drop-area {
        border: 3px dashed #d1d5db;
        border-radius: 16px;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        background: #f9fafb;
        position: relative;
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .drop-area:hover:not(.deshabilitado) {
        border-color: #6366f1;
        background: #f0f4ff;
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
    }

    .drop-area.arrastrando {
        border-color: #10b981;
        background: linear-gradient(135deg, #ecfdf5, #d1fae5);
        transform: scale(1.02);
        box-shadow: 0 12px 30px rgba(16, 185, 129, 0.2);
    }

    .drop-area.deshabilitado {
        opacity: 0.6;
        cursor: not-allowed;
        background: #f3f4f6;
    }

    .input-oculto {
        position: absolute;
        opacity: 0;
        pointer-events: none;
        width: 1px;
        height: 1px;
    }

    /* === PLACEHOLDER === */
    .drop-placeholder {
        width: 100%;
    }

    .drop-icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;
        opacity: 0.7;
        animation: bounce 2s infinite;
    }

    .drop-title {
        font-size: 1.25rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.75rem 0;
    }

    .drop-subtitle {
        font-size: 1rem;
        color: #6b7280;
        margin: 0 0 2rem 0;
        line-height: 1.5;
    }

    .btn-seleccionar {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: white;
        border: none;
        padding: 0.875rem 2rem;
        border-radius: 12px;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
    }

    .btn-seleccionar:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.4);
    }

    /* === VISTA PREVIA === */
    .preview-container {
        display: flex;
        align-items: center;
        gap: 2rem;
        width: 100%;
        max-width: 600px;
    }

    .preview-image {
        width: 150px;
        height: 150px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .preview-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .preview-info {
        flex: 1;
        text-align: left;
    }

    .preview-info h4 {
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
        margin: 0 0 0.5rem 0;
        word-break: break-word;
    }

    .preview-info p {
        font-size: 1rem;
        color: #6b7280;
        margin: 0 0 1.5rem 0;
    }

    .preview-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .btn-subir, .btn-cancelar {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 10px;
        font-size: 0.975rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .btn-subir {
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }

    .btn-subir:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
    }

    .btn-subir:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    .btn-cancelar {
        background: #f3f4f6;
        color: #6b7280;
        border: 2px solid #e5e7eb;
    }

    .btn-cancelar:hover:not(:disabled) {
        background: #e5e7eb;
        color: #374151;
    }

    .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    /* === IMAGEN ACTUAL === */
    .imagen-actual {
        position: relative;
        width: 100%;
        max-width: 400px;
        height: 250px;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        margin: 0 auto;
    }

    .imagen-actual img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .imagen-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(
            to top, 
            rgba(0, 0, 0, 0.8) 0%, 
            rgba(0, 0, 0, 0.3) 50%, 
            transparent 100%
        );
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        padding: 1.5rem;
        color: white;
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .imagen-actual:hover .imagen-overlay {
        opacity: 1;
    }

    .imagen-overlay p {
        margin: 0;
        font-weight: 600;
    }

    .cambiar-texto {
        font-size: 0.875rem;
        opacity: 0.9;
        margin-top: 0.25rem !important;
    }

    /* === ANIMACIONES === */
    @keyframes bounce {
        0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
        }
        40% {
            transform: translateY(-10px);
        }
        60% {
            transform: translateY(-5px);
        }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* === RESPONSIVE === */
    @media (max-width: 768px) {
        .drop-area {
            padding: 1.5rem;
            min-height: 250px;
        }

        .preview-container {
            flex-direction: column;
            text-align: center;
        }

        .preview-info {
            text-align: center;
        }

        .preview-actions {
            justify-content: center;
        }

        .drop-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }

        .drop-title {
            font-size: 1.125rem;
        }

        .drop-subtitle {
            font-size: 0.925rem;
        }
    }

    @media (max-width: 480px) {
        .drop-area {
            padding: 1rem;
        }

        .preview-actions {
            flex-direction: column;
        }

        .btn-subir, .btn-cancelar {
            width: 100%;
            justify-content: center;
        }
    }
</style> 