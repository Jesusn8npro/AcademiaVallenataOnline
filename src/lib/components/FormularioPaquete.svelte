<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { 
        crearPaquete,
        actualizarPaquete,
        obtenerPaquetePorId,
        obtenerTutorialesPaquete,
        agregarTutorialAPaquete,
        removerTutorialDePaquete,
        formatearPrecio,
        type PaqueteTutorial
    } from '$lib/services/paquetesService';
    import { supabase } from '$lib/supabase/clienteSupabase';
    import SubidorImagenes from '$lib/components/SubidorImagenes.svelte';
    import ModalSeleccionTutoriales from '$lib/components/ModalSeleccionTutoriales.svelte';

    const dispatch = createEventDispatcher();

    // Props
    export let paqueteId: string | null = null;
    export let titulo: string = '';

    // Estado del paquete
    let paquete: Partial<PaqueteTutorial> = {
        titulo: '',
        descripcion: '',
        precio_normal: 0,
        precio_rebajado: 0,
        estado: 'borrador',
        categoria: '',
        nivel: 'principiante',
        destacado: false,
        visible: true
    };

    // Estados
    let cargando = true;
    let guardando = false;
    let error = '';
    let exito = '';
    let mostrarModal = false;
    let tutorialesDisponibles: any[] = [];
    let tutorialesSeleccionados: any[] = [];
    let categoriasDisponibles: string[] = [];
    let nivelesDisponibles: string[] = [];

    $: modoEdicion = paqueteId !== null;

    onMount(cargarDatos);

    async function cargarDatos() {
        try {
            cargando = true;
            error = '';

            // Cargar paquete si estamos editando
            if (modoEdicion) {
                const [paqueteResult, tutorialesResult] = await Promise.all([
                    obtenerPaquetePorId(paqueteId!),
                    obtenerTutorialesPaquete(paqueteId!)
                ]);

                if (paqueteResult.success && paqueteResult.data) {
                    paquete = paqueteResult.data;
                }

                if (tutorialesResult.success && tutorialesResult.data) {
                    tutorialesSeleccionados = tutorialesResult.data;
                }
            }

            // Cargar tutoriales disponibles
            const { data: tutoriales } = await supabase
                .from('tutoriales')
                .select('id, titulo, descripcion_corta, categoria, precio_normal, nivel, duracion_estimada, imagen_url, artista, tonalidad')
                .eq('estado', 'publicado')
                .order('titulo');
            
            tutorialesDisponibles = tutoriales || [];
            categoriasDisponibles = [...new Set(tutorialesDisponibles.map((t: any) => t.categoria).filter(Boolean))];
            nivelesDisponibles = [...new Set(tutorialesDisponibles.map((t: any) => t.nivel).filter(Boolean))];
            
        } catch (err) {
            error = 'Error cargando datos';
        } finally {
            cargando = false;
        }
    }

    async function guardarPaquete() {
        if (!paquete.titulo || !paquete.precio_normal) {
            error = 'Título y precio son obligatorios';
            return;
        }

        if (tutorialesSeleccionados.length === 0) {
            error = 'Debe incluir al menos un tutorial';
            return;
        }

        try {
            guardando = true;
            error = '';

            const paqueteCompleto: PaqueteTutorial = {
                titulo: paquete.titulo || '',
                descripcion: paquete.descripcion || '',
                precio_normal: paquete.precio_normal || 0,
                precio_rebajado: paquete.precio_rebajado || 0,
                estado: paquete.estado || 'borrador',
                categoria: paquete.categoria || '',
                nivel: paquete.nivel || 'principiante',
                destacado: paquete.destacado || false,
                tipo_acceso: 'premium',
                visible: paquete.visible !== undefined ? paquete.visible : true,
                imagen_url: paquete.imagen_url || ''
            };

            const resultado = modoEdicion 
                ? await actualizarPaquete(paqueteId!, paqueteCompleto)
                : await crearPaquete(paqueteCompleto);
            
            if (resultado.success && resultado.data) {
                const idPaquete = resultado.data.id;
                
                // Gestionar tutoriales
                if (modoEdicion) {
                    await sincronizarTutoriales(paqueteId!, tutorialesSeleccionados);
                } else {
                    await agregarTutorialesAPaquete(idPaquete, tutorialesSeleccionados);
                }
                
                exito = modoEdicion ? 'Paquete actualizado exitosamente' : 'Paquete creado exitosamente';
                dispatch('guardado', { id: idPaquete, esEdicion: modoEdicion });
                
            } else {
                error = resultado.error || 'Error procesando paquete';
            }
        } catch (err: any) {
            error = 'Error: ' + err.message;
        } finally {
            guardando = false;
        }
    }

    async function sincronizarTutoriales(paqueteId: string, tutorialesNuevos: any[]) {
        const tutorialesActuales = await obtenerTutorialesPaquete(paqueteId);
        const idsActuales = tutorialesActuales.success ? tutorialesActuales.data!.map((t: any) => t.id) : [];
        const idsNuevos = tutorialesNuevos.map((t: any) => t.id);

        // Remover tutoriales que ya no están
        for (const id of idsActuales) {
            if (!idsNuevos.includes(id)) {
                await removerTutorialDePaquete(paqueteId, id);
            }
        }

        // Agregar nuevos tutoriales
        for (let i = 0; i < tutorialesNuevos.length; i++) {
            const tutorial = tutorialesNuevos[i];
            if (!idsActuales.includes(tutorial.id)) {
                await agregarTutorialAPaquete({
                    paquete_id: paqueteId,
                    tutorial_id: tutorial.id,
                    orden: i + 1,
                    incluido: true,
                    precio_individual_referencia: tutorial.precio_normal || 0
                });
            }
        }
    }

    async function agregarTutorialesAPaquete(paqueteId: string, tutoriales: any[]) {
        for (let i = 0; i < tutoriales.length; i++) {
            const tutorial = tutoriales[i];
            await agregarTutorialAPaquete({
                paquete_id: paqueteId,
                tutorial_id: tutorial.id,
                orden: i + 1,
                incluido: true,
                precio_individual_referencia: tutorial.precio_normal || 0
            });
        }
    }

    function removerTutorial(tutorialId: string) {
        tutorialesSeleccionados = tutorialesSeleccionados.filter((t: any) => t.id !== tutorialId);
        calcularPreciosSugeridos();
    }

    function calcularPreciosSugeridos() {
        if (tutorialesSeleccionados.length > 0) {
            const total = tutorialesSeleccionados.reduce((sum: number, t: any) => sum + (t.precio_normal || 0), 0);
            
            if (!paquete.precio_normal || paquete.precio_normal === 0) {
                paquete.precio_normal = Math.round(total * 0.7);
            }
            
            if (!paquete.precio_rebajado || paquete.precio_rebajado === 0) {
                paquete.precio_rebajado = Math.round(total * 0.6);
            }
        }
    }

    function calcularAhorro() {
        const totalIndividual = tutorialesSeleccionados.reduce((sum: number, t: any) => sum + (t.precio_normal || 0), 0);
        return totalIndividual - (paquete.precio_normal || 0);
    }

    function calcularDescuento() {
        if (paquete.precio_normal && paquete.precio_rebajado) {
            return Math.round(((paquete.precio_normal - paquete.precio_rebajado) / paquete.precio_normal) * 100);
        }
        return 0;
    }

    function abrirModal() {
        mostrarModal = true;
    }

    function cerrarModal() {
        mostrarModal = false;
    }

    function manejarTutorialesSeleccionados(event: CustomEvent) {
        const nuevos = event.detail;
        
        for (const tutorial of nuevos) {
            if (!tutorialesSeleccionados.find((t: any) => t.id === tutorial.id)) {
                tutorialesSeleccionados = [...tutorialesSeleccionados, tutorial];
            }
        }
        
        calcularPreciosSugeridos();
        exito = `${nuevos.length} tutorial${nuevos.length === 1 ? '' : 'es'} agregado${nuevos.length === 1 ? '' : 's'} exitosamente`;
        setTimeout(() => exito = '', 2000);
    }

    function manejarImagenSubida(event: CustomEvent) {
        const { url } = event.detail;
        paquete.imagen_url = url;
        error = '';
    }

    function manejarErrorImagen(event: CustomEvent) {
        const { message } = event.detail;
        error = `Error con la imagen: ${message}`;
    }

    function cancelar() {
        dispatch('cancelar');
    }
</script>

<div class="contenedor">
    <header class="cabecera">
        <h1>{titulo}</h1>
    </header>

    {#if error}
        <div class="alerta error">❌ {error}</div>
    {/if}

    {#if exito}
        <div class="alerta exito">✅ {exito}</div>
    {/if}

    {#if cargando}
        <div class="cargando">
            <div class="spinner"></div>
            <p>Cargando datos...</p>
        </div>
    {:else}
        <form on:submit|preventDefault={guardarPaquete} class="formulario">
            <!-- Información Básica -->
            <section class="tarjeta">
                <h2>📝 Información Básica</h2>
                <div class="campos">
                    <div class="campo">
                        <label>Título *</label>
                        <input type="text" bind:value={paquete.titulo} required placeholder="Ej: Binomio de Oro - Completo" />
                    </div>
                    <div class="campo">
                        <label>Descripción</label>
                        <textarea 
                            bind:value={paquete.descripcion} 
                            rows="3" 
                            maxlength="500"
                            placeholder="Descripción del paquete (máximo 500 caracteres)..."
                        ></textarea>
                    </div>
                    <div class="campo">
                        <SubidorImagenes
                            imagenActual={paquete.imagen_url || ''}
                            etiqueta="Imagen del paquete"
                            on:imagenSubida={manejarImagenSubida}
                            on:error={manejarErrorImagen}
                        />
                    </div>
                </div>
            </section>

            <!-- Configuración -->
            <section class="tarjeta">
                <h2>⚙️ Configuración</h2>
                <div class="campos">
                    <div class="fila">
                        <div class="campo">
                            <label>Categoría</label>
                            <input type="text" bind:value={paquete.categoria} placeholder="Ej: Binomio de Oro" />
                        </div>
                        <div class="campo">
                            <label>Nivel</label>
                            <select bind:value={paquete.nivel}>
                                <option value="principiante">Principiante</option>
                                <option value="intermedio">Intermedio</option>
                                <option value="avanzado">Avanzado</option>
                            </select>
                        </div>
                    </div>
                    <div class="fila">
                        <div class="campo">
                            <label>Estado</label>
                            <select bind:value={paquete.estado}>
                                <option value="borrador">Borrador</option>
                                <option value="publicado">Publicado</option>
                                <option value="archivado">Archivado</option>
                            </select>
                        </div>
                        <div class="campo">
                            <label class="checkbox">
                                <input type="checkbox" bind:checked={paquete.destacado} />
                                Destacado
                            </label>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Tutoriales -->
            <section class="tarjeta">
                <div class="cabecera-seccion">
                    <h2>🎵 Tutoriales ({tutorialesSeleccionados.length})</h2>
                    <button type="button" class="btn-secundario" on:click={abrirModal}>
                        + Agregar
                    </button>
                </div>
                
                {#if tutorialesSeleccionados.length === 0}
                    <div class="vacio">
                        <p>No hay tutoriales seleccionados</p>
                        <button type="button" class="btn-primario" on:click={abrirModal}>
                            Agregar Tutorial
                        </button>
                    </div>
                {:else}
                    <div class="tutoriales">
                        {#each tutorialesSeleccionados as tutorial}
                            <div class="item-tutorial">
                                <div class="info-tutorial">
                                    <h4>{tutorial.titulo}</h4>
                                    <span class="precio">{formatearPrecio(tutorial.precio_normal || 0)}</span>
                                </div>
                                <button type="button" class="btn-remover" on:click={() => removerTutorial(tutorial.id)}>
                                    ×
                                </button>
                            </div>
                        {/each}
                    </div>
                {/if}
            </section>

            <!-- Precios -->
            <section class="tarjeta">
                <h2>💰 Precios</h2>
                <div class="campos">
                    {#if tutorialesSeleccionados.length > 0}
                        <div class="info-precio">
                            <p><strong>Total individual:</strong> {formatearPrecio(tutorialesSeleccionados.reduce((sum: number, t: any) => sum + (t.precio_normal || 0), 0))}</p>
                            <button type="button" class="btn-sugerir" on:click={calcularPreciosSugeridos}>
                                💡 Calcular precios sugeridos
                            </button>
                        </div>
                    {/if}
                    
                    <div class="fila">
                        <div class="campo">
                            <label>Precio Normal (COP) *</label>
                            <input type="number" bind:value={paquete.precio_normal} step="1000" required />
                        </div>
                        <div class="campo">
                            <label>Precio Rebajado (COP)</label>
                            <input type="number" bind:value={paquete.precio_rebajado} step="1000" />
                        </div>
                    </div>
                    
                    {#if paquete.precio_normal && paquete.precio_rebajado && tutorialesSeleccionados.length > 0}
                        <div class="vista-previa-precio">
                            <span class="precio-actual">{formatearPrecio(paquete.precio_rebajado)}</span>
                            <span class="precio-original">{formatearPrecio(paquete.precio_normal)}</span>
                            <span class="descuento">{calcularDescuento()}% OFF</span>
                            <span class="ahorro">💾 Ahorro: {formatearPrecio(calcularAhorro())}</span>
                        </div>
                    {/if}
                </div>
            </section>

            <!-- Acciones -->
            <div class="acciones">
                <button type="button" class="btn-secundario" on:click={cancelar}>
                    Cancelar
                </button>
                <button type="submit" class="btn-primario" disabled={guardando}>
                    {guardando ? 'Guardando...' : (modoEdicion ? '💾 Actualizar Paquete' : '💾 Crear Paquete')}
                </button>
            </div>
        </form>
    {/if}
</div>

<ModalSeleccionTutoriales 
    bind:mostrar={mostrarModal}
    {tutorialesDisponibles}
    {tutorialesSeleccionados}
    {categoriasDisponibles}
    {nivelesDisponibles}
    on:cerrar={cerrarModal}
    on:seleccionados={manejarTutorialesSeleccionados}
/>

<style>
    .contenedor {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
    }

    .cabecera {
        text-align: center;
        margin-bottom: 2rem;
    }

    .cabecera h1 {
        margin: 0;
        color: #333;
    }

    .alerta {
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .alerta.error {
        background: #fee;
        color: #c33;
        border: 1px solid #fcc;
    }

    .alerta.exito {
        background: #efe;
        color: #3c3;
        border: 1px solid #cfc;
    }

    .cargando {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 3rem;
        color: #6c757d;
    }

    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 1rem;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .formulario {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }

    .tarjeta {
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .tarjeta h2 {
        margin: 0 0 1rem 0;
        color: #333;
        font-size: 1.25rem;
    }

    .cabecera-seccion {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }

    .cabecera-seccion h2 {
        margin: 0;
    }

    .campos {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .fila {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .campo {
        display: flex;
        flex-direction: column;
    }

    .campo label {
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #333;
    }

    .campo input,
    .campo select,
    .campo textarea {
        padding: 0.75rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 1rem;
    }

    .campo input:focus,
    .campo select:focus,
    .campo textarea:focus {
        outline: none;
        border-color: #007bff;
        box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
    }

    .checkbox {
        flex-direction: row !important;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
    }

    .checkbox input {
        width: auto;
        margin: 0;
    }

    .info-precio {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 6px;
        margin-bottom: 1rem;
    }

    .info-precio p {
        margin: 0 0 0.5rem 0;
        color: #666;
    }

    .btn-sugerir {
        background: #17a2b8;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
    }

    .btn-sugerir:hover {
        background: #138496;
    }

    .vista-previa-precio {
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .precio-actual {
        font-size: 1.5rem;
        font-weight: bold;
        color: #007bff;
    }

    .precio-original {
        text-decoration: line-through;
        color: #666;
    }

    .descuento {
        background: #28a745;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: 600;
    }

    .ahorro {
        color: #28a745;
        font-weight: 500;
    }

    .vacio {
        text-align: center;
        padding: 2rem;
        color: #666;
    }

    .tutoriales {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .item-tutorial {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 6px;
        border: 1px solid #e9ecef;
    }

    .info-tutorial h4 {
        margin: 0 0 0.25rem 0;
        color: #333;
    }

    .info-tutorial .precio {
        color: #666;
        font-size: 0.9rem;
    }

    .btn-remover {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        cursor: pointer;
        font-size: 1.2rem;
    }

    .btn-remover:hover {
        background: #c82333;
    }

    .acciones {
        display: flex;
        justify-content: center;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #ddd;
    }

    .btn-primario {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        font-size: 1rem;
    }

    .btn-primario:hover:not(:disabled) {
        background: #0056b3;
    }

    .btn-primario:disabled {
        background: #6c757d;
        cursor: not-allowed;
    }

    .btn-secundario {
        background: white;
        color: #333;
        border: 1px solid #ddd;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        font-size: 1rem;
    }

    .btn-secundario:hover {
        background: #f8f9fa;
    }

    @media (max-width: 768px) {
        .contenedor {
            padding: 1rem;
        }

        .fila {
            grid-template-columns: 1fr;
        }

        .acciones {
            flex-direction: column;
        }

        .vista-previa-precio {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
        }
    }
</style> 