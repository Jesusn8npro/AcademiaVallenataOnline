<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { formatearPrecio } from '$lib/services/paquetesService';

    const dispatch = createEventDispatcher();

    export let mostrar = false;
    export let tutorialesDisponibles: any[] = [];
    export let tutorialesSeleccionados: any[] = [];
    export let categoriasDisponibles: string[] = [];
    export let nivelesDisponibles: string[] = [];

    // Estados del modal
    let busqueda = '';
    let filtroCategoria = '';
    let filtroNivel = '';
    let paginaActual = 1;
    let tutorialesPorPagina = 8;
    let seleccionados = new Set<string>();

    // Computed values
    $: tutorialesFiltrados = tutorialesDisponibles
        .filter(t => !tutorialesSeleccionados.find(s => s.id === t.id))
        .filter(t => !filtroCategoria || t.categoria === filtroCategoria)
        .filter(t => !filtroNivel || t.nivel === filtroNivel)
        .filter(t => !busqueda || t.titulo.toLowerCase().includes(busqueda.toLowerCase()))
        .sort((a, b) => a.titulo.localeCompare(b.titulo));

    $: tutorialesPaginados = tutorialesFiltrados.slice(
        (paginaActual - 1) * tutorialesPorPagina,
        paginaActual * tutorialesPorPagina
    );

    $: totalPaginas = Math.ceil(tutorialesFiltrados.length / tutorialesPorPagina);

    $: if (busqueda || filtroCategoria || filtroNivel) {
        paginaActual = 1;
    }

    $: ahorroTotal = Array.from(seleccionados)
        .map(id => tutorialesDisponibles.find(t => t.id === id))
        .filter(Boolean)
        .reduce((sum, t) => sum + (t?.precio_normal || 0), 0) * 0.3;

    function cerrar() {
        limpiarEstado();
        dispatch('cerrar');
    }

    function limpiarEstado() {
        busqueda = '';
        filtroCategoria = '';
        filtroNivel = '';
        paginaActual = 1;
        seleccionados.clear();
        seleccionados = new Set();
    }

    function toggleSeleccion(tutorial: any) {
        if (seleccionados.has(tutorial.id)) {
            seleccionados.delete(tutorial.id);
        } else {
            seleccionados.add(tutorial.id);
        }
        seleccionados = new Set(seleccionados);
    }

    function seleccionarTodos() {
        seleccionados = new Set(tutorialesFiltrados.map(t => t.id));
    }

    function deseleccionarTodos() {
        seleccionados.clear();
        seleccionados = new Set();
    }

    function confirmarSeleccion() {
        const tutorialesSeleccionados = tutorialesDisponibles.filter(t => seleccionados.has(t.id));
        dispatch('seleccionados', tutorialesSeleccionados);
        cerrar();
    }

    function cambiarPagina(pagina: number) {
        if (pagina >= 1 && pagina <= totalPaginas) {
            paginaActual = pagina;
        }
    }

    function limpiarFiltros() {
        busqueda = '';
        filtroCategoria = '';
        filtroNivel = '';
        paginaActual = 1;
    }
</script>

{#if mostrar}
    <div class="modal-overlay" on:click={cerrar}>
        <div class="modal" on:click|stopPropagation>
            <!-- Cabecera -->
            <div class="modal-cabecera">
                <div class="titulo-info">
                    <h3>🎵 Seleccionar Tutoriales</h3>
                    <div class="resumen">
                        <span class="contador">{seleccionados.size} seleccionados</span>
                        {#if seleccionados.size > 0}
                            <span class="ahorro">💰 Ahorro: {formatearPrecio(ahorroTotal)}</span>
                        {/if}
                    </div>
                </div>
                <button class="btn-cerrar" on:click={cerrar}>×</button>
            </div>

            <!-- Controles -->
            <div class="controles">
                <div class="filtros">
                    <input 
                        type="text" 
                        bind:value={busqueda} 
                        placeholder="🔍 Buscar..."
                        class="input-busqueda"
                    />
                    <select bind:value={filtroCategoria} class="select-filtro">
                        <option value="">Todas las categorías</option>
                        {#each categoriasDisponibles as categoria}
                            <option value={categoria}>{categoria}</option>
                        {/each}
                    </select>
                    <select bind:value={filtroNivel} class="select-filtro">
                        <option value="">Todos los niveles</option>
                        {#each nivelesDisponibles as nivel}
                            <option value={nivel}>{nivel}</option>
                        {/each}
                    </select>
                    <button class="btn-limpiar" on:click={limpiarFiltros}>🗑️</button>
                </div>

                <div class="acciones">
                    <button class="btn-mini" on:click={seleccionarTodos} disabled={tutorialesFiltrados.length === 0}>
                        ✅ Todos
                    </button>
                    <button class="btn-mini" on:click={deseleccionarTodos} disabled={seleccionados.size === 0}>
                        ❌ Ninguno
                    </button>
                </div>
            </div>

            <!-- Contenido -->
            <div class="contenido">
                <div class="info-resultados">
                    <span>{tutorialesFiltrados.length} tutoriales</span>
                    {#if totalPaginas > 1}
                        <span>Página {paginaActual} de {totalPaginas}</span>
                    {/if}
                </div>

                <div class="grid-tutoriales">
                    {#each tutorialesPaginados as tutorial}
                        <div class="tarjeta-tutorial" class:seleccionado={seleccionados.has(tutorial.id)}>
                            <div class="checkbox">
                                <input 
                                    type="checkbox" 
                                    checked={seleccionados.has(tutorial.id)}
                                    on:change={() => toggleSeleccion(tutorial)}
                                />
                            </div>
                            
                            <div class="info" on:click={() => toggleSeleccion(tutorial)}>
                                <div class="imagen">
                                    {#if tutorial.imagen_url}
                                        <img src={tutorial.imagen_url} alt={tutorial.titulo} />
                                    {:else}
                                        <div class="sin-imagen">🎵</div>
                                    {/if}
                                </div>
                                
                                <div class="detalles">
                                    <h4>{tutorial.titulo}</h4>
                                    {#if tutorial.artista}
                                        <p class="artista">🎤 {tutorial.artista}</p>
                                    {/if}
                                    
                                    <div class="etiquetas">
                                        {#if tutorial.categoria}
                                            <span class="etiqueta">{tutorial.categoria}</span>
                                        {/if}
                                        {#if tutorial.nivel}
                                            <span class="etiqueta">{tutorial.nivel}</span>
                                        {/if}
                                    </div>
                                    
                                    <div class="precio-duracion">
                                        <span class="precio">{formatearPrecio(tutorial.precio_normal || 0)}</span>
                                        {#if tutorial.duracion_estimada}
                                            <span class="duracion">⏱️ {tutorial.duracion_estimada}min</span>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    {:else}
                        <div class="sin-resultados">
                            <div class="icono">🔍</div>
                            <h4>No se encontraron tutoriales</h4>
                            <p>Intenta con otros filtros</p>
                            <button class="btn-secundario" on:click={limpiarFiltros}>
                                🗑️ Limpiar filtros
                            </button>
                        </div>
                    {/each}
                </div>

                <!-- Paginación -->
                {#if totalPaginas > 1}
                    <div class="paginacion">
                        <button 
                            class="btn-pagina" 
                            disabled={paginaActual === 1}
                            on:click={() => cambiarPagina(paginaActual - 1)}
                        >
                            ← Anterior
                        </button>
                        
                        {#each Array.from({length: totalPaginas}, (_, i) => i + 1) as pagina}
                            <button 
                                class="numero-pagina" 
                                class:activo={pagina === paginaActual}
                                on:click={() => cambiarPagina(pagina)}
                            >
                                {pagina}
                            </button>
                        {/each}
                        
                        <button 
                            class="btn-pagina" 
                            disabled={paginaActual === totalPaginas}
                            on:click={() => cambiarPagina(paginaActual + 1)}
                        >
                            Siguiente →
                        </button>
                    </div>
                {/if}
            </div>

            <!-- Pie -->
            <div class="modal-pie">
                <div class="info-seleccion">
                    {#if seleccionados.size > 0}
                        <span>{seleccionados.size} tutoriales seleccionados</span>
                    {/if}
                </div>
                
                <div class="acciones-pie">
                    <button class="btn-secundario" on:click={cerrar}>
                        Cancelar
                    </button>
                    <button 
                        class="btn-primario" 
                        disabled={seleccionados.size === 0}
                        on:click={confirmarSeleccion}
                    >
                        ✅ Agregar ({seleccionados.size})
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal {
        background: white;
        border-radius: 12px;
        width: 95%;
        max-width: 900px;
        max-height: 85vh;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }

    .modal-cabecera {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 1.5rem;
        border-bottom: 1px solid #e9ecef;
        background: #f8f9fa;
    }

    .titulo-info h3 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .resumen {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .contador {
        background: #007bff;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
    }

    .ahorro {
        background: #28a745;
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 12px;
        font-size: 0.875rem;
    }

    .btn-cerrar {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
        width: 30px;
        height: 30px;
        border-radius: 50%;
    }

    .btn-cerrar:hover {
        background: #e9ecef;
    }

    .controles {
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e9ecef;
    }

    .filtros {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .input-busqueda {
        flex: 1;
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        min-width: 200px;
    }

    .select-filtro {
        padding: 0.5rem;
        border: 1px solid #ddd;
        border-radius: 6px;
        min-width: 120px;
    }

    .btn-limpiar {
        background: #6c757d;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }

    .acciones {
        display: flex;
        gap: 0.5rem;
    }

    .btn-mini {
        background: white;
        border: 1px solid #ddd;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.8rem;
    }

    .btn-mini:hover:not(:disabled) {
        background: #f8f9fa;
    }

    .btn-mini:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .contenido {
        flex: 1;
        overflow-y: auto;
        padding: 1rem 1.5rem;
    }

    .info-resultados {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        font-size: 0.875rem;
        color: #666;
    }

    .grid-tutoriales {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1rem;
    }

    .tarjeta-tutorial {
        border: 1px solid #e9ecef;
        border-radius: 8px;
        padding: 1rem;
        background: white;
        transition: all 0.2s;
        position: relative;
    }

    .tarjeta-tutorial:hover {
        border-color: #007bff;
        box-shadow: 0 2px 8px rgba(0,123,255,0.15);
    }

    .tarjeta-tutorial.seleccionado {
        border-color: #28a745;
        background: #f8fff8;
    }

    .checkbox {
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
    }

    .info {
        display: flex;
        gap: 1rem;
        cursor: pointer;
        padding-right: 2rem;
    }

    .imagen {
        width: 80px;
        height: 80px;
        border-radius: 6px;
        overflow: hidden;
        background: #f8f9fa;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .imagen img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .sin-imagen {
        font-size: 1.5rem;
        color: #6c757d;
    }

    .detalles {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .detalles h4 {
        margin: 0;
        font-size: 1rem;
        color: #333;
    }

    .artista {
        margin: 0;
        font-size: 0.875rem;
        color: #6c757d;
    }

    .etiquetas {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    .etiqueta {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 12px;
        background: #e3f2fd;
        color: #1976d2;
    }

    .precio-duracion {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: auto;
    }

    .precio {
        font-weight: 600;
        color: #28a745;
    }

    .duracion {
        font-size: 0.8rem;
        color: #6c757d;
    }

    .sin-resultados {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #6c757d;
    }

    .sin-resultados .icono {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }

    .sin-resultados h4 {
        margin: 0 0 0.5rem 0;
        color: #333;
    }

    .sin-resultados p {
        margin: 0 0 1rem 0;
    }

    .paginacion {
        display: flex;
        justify-content: center;
        gap: 0.5rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e9ecef;
    }

    .btn-pagina, .numero-pagina {
        background: white;
        border: 1px solid #ddd;
        padding: 0.5rem 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.875rem;
    }

    .btn-pagina:hover:not(:disabled), .numero-pagina:hover {
        background: #f8f9fa;
    }

    .btn-pagina:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .numero-pagina.activo {
        background: #007bff;
        color: white;
        border-color: #007bff;
    }

    .modal-pie {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-top: 1px solid #e9ecef;
        background: #f8f9fa;
    }

    .info-seleccion {
        font-size: 0.875rem;
        color: #6c757d;
    }

    .acciones-pie {
        display: flex;
        gap: 0.5rem;
    }

    .btn-primario {
        background: #007bff;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
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
        padding: 0.5rem 1rem;
        border-radius: 6px;
        cursor: pointer;
    }

    .btn-secundario:hover {
        background: #f8f9fa;
    }

    @media (max-width: 768px) {
        .modal {
            width: 95%;
            max-height: 90vh;
        }

        .filtros {
            flex-direction: column;
        }

        .input-busqueda {
            min-width: auto;
        }

        .grid-tutoriales {
            grid-template-columns: 1fr;
        }

        .info {
            flex-direction: column;
            padding-right: 0;
        }

        .imagen {
            width: 100%;
            height: 120px;
        }
    }
</style> 