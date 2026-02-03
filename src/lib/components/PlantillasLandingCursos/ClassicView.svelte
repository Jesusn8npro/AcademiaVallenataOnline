<script lang="ts">
  	import ContadorOferta from '../ComponentesLanding/ContadorOferta.svelte';
	import HeroCurso from '../ComponentesLanding/HeroCurso.svelte';
	import SeccionBeneficios from '../ComponentesLanding/SeccionBeneficios.svelte';
	import SeccionProblema from '../ComponentesLanding/SeccionProblema.svelte';
	import SeccionSolucion from '../ComponentesLanding/SeccionSolucion.svelte';
	import ModalPagoInteligente from '../ComponentesLanding/ModalPagoInteligente.svelte';
	import { generateSlug } from '$lib/utilidades/utilidadesSlug';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
  
  // Props que recibimos
  export let data: any;
  export let handleInscripcion: () => Promise<void>;
  export let verContenido: (() => void) | null = null; // Puede ser null si no se pasa
  export let irAPrimeraClase: () => void = () => {}; // Para tutoriales
  
  // Datos del contenido (curso o tutorial)
  let contenido: any = data?.curso || data?.tutorial;
  const tipo = data?.curso ? 'curso' : 'tutorial';
  
  // 🔧 LIMPIAR DATOS DE PRUEBA REPETITIVOS
  if (contenido) {
    // Limpiar descripción duplicada/repetitiva
    if (contenido.descripcion) {
      const descripcionOriginal = contenido.descripcion;
      // Detectar patrones repetitivos como "Tutorial pruebaTutorial prueba..."
      const patronRepetido = /^(.+?)\1+$/;
      if (patronRepetido.test(descripcionOriginal)) {
        // Extraer solo la primera parte no repetida
        const match = descripcionOriginal.match(/^(.+?)(?:\1)+$/);
        if (match && match[1]) {
          contenido.descripcion = match[1].trim();
        }
      }
      // También limpiar patrones como "Tutorial prueba Tutorial prueba Tutorial prueba"
      const palabrasRepetidas = contenido.descripcion.split(' ');
      const palabrasLimpias = [];
      const secuenciaVista = new Set();
      
      for (let i = 0; i < palabrasRepetidas.length; i++) {
        const secuencia = palabrasRepetidas.slice(i, i + 2).join(' ');
        if (!secuenciaVista.has(secuencia) || palabrasLimpias.length < 6) {
          palabrasLimpias.push(palabrasRepetidas[i]);
          secuenciaVista.add(secuencia);
        } else {
          break; // Detener si encontramos repetición
        }
      }
      
      // Solo actualizar si realmente limpiamos algo
      if (palabrasLimpias.length < palabrasRepetidas.length && palabrasLimpias.length > 0) {
        contenido.descripcion = palabrasLimpias.join(' ').trim();
      }
    }
    
    // Limpiar título repetitivo también
    if (contenido.titulo) {
      const tituloOriginal = contenido.titulo;
      const patronRepetido = /^(.+?)\1+$/;
      if (patronRepetido.test(tituloOriginal)) {
        const match = tituloOriginal.match(/^(.+?)(?:\1)+$/);
        if (match && match[1]) {
          contenido.titulo = match[1].trim();
        }
      }
    }
  }
  
  // Estado de inscripción - usar exactamente la misma lógica que PremiumView
  let estaInscrito = data?.estaInscrito || false;
  
  // CRÍTICO: Declaración reactiva para propagación a componentes hijos
  $: estaInscrito = data?.estaInscrito || false;
  
  // Para compatibilidad con componentes existentes
  $: curso = { ...contenido, tipo }; // HeroCurso espera una prop llamada 'curso' con el tipo incluido
  
  // Función para navegar al contenido (copiada de PremiumView)
  function navegarAContenido() {
    console.log('[ClassicView] navegarAContenido - contenido:', contenido);
    console.log('[ClassicView] navegarAContenido - tipo:', tipo);

    if (tipo === 'curso') {
      // Buscar módulos y lecciones anidadas
      const modulos = contenido.modulos || contenido.modulos_preview || [];
      const primerModulo = modulos.find((m: any) => m.lecciones && m.lecciones.length > 0);
      const leccionesSueltas = contenido.lecciones_sueltas || [];

      console.log('[ClassicView] modulos:', modulos);
      console.log('[ClassicView] primerModulo:', primerModulo);
      console.log('[ClassicView] leccionesSueltas:', leccionesSueltas);

      if (primerModulo && primerModulo.lecciones.length > 0) {
        const cursoSlug = contenido.slug || generateSlug(contenido.titulo);
        const moduloSlug = primerModulo.slug || generateSlug(primerModulo.titulo);
        const leccionSlug = primerModulo.lecciones[0].slug || generateSlug(primerModulo.lecciones[0].titulo);
        const rutaDestino = `/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`;
        console.log('[ClassicView][CURSO] rutaDestino:', rutaDestino);
        goto(rutaDestino);
        return;
      } else if (leccionesSueltas.length > 0) {
        const primeraLeccion = leccionesSueltas[0];
        const cursoSlug = contenido.slug || generateSlug(contenido.titulo);
        const leccionSlug = primeraLeccion.slug || generateSlug(primeraLeccion.titulo);
        const rutaDestino = `/cursos/${cursoSlug}/leccion/${leccionSlug}`;
        console.log('[ClassicView][CURSO][SUELTA] rutaDestino:', rutaDestino);
        goto(rutaDestino);
        return;
      } else {
        alert('Este curso no tiene lecciones disponibles.\n\nVerifica que hayas creado módulos y lecciones correctamente.\nSi acabas de crear el curso, prueba recargar la página. Revisa la consola (F12) para más detalles.');
        console.error('[ClassicView][ERROR] Sin lecciones:', contenido);
        return;
      }
    }

    // Lógica de tutorial
    if (
      tipo === 'tutorial' &&
      Array.isArray(contenido.modulos_preview) &&
      contenido.modulos_preview.length > 0
    ) {
      const tutorialSlug = generateSlug(contenido.titulo);
      const primeraClase = contenido.modulos_preview[0];
      const claseSlug = generateSlug(primeraClase.titulo);
      if (tutorialSlug && claseSlug) {
        goto(`/tutoriales/${tutorialSlug}/clase/${claseSlug}`);
        return;
      }
      alert('No se encontró la primera clase de este tutorial. Revisa la consola para más detalles.');
      console.error('[ClassicView][ERROR][TUTORIAL] contenido:', contenido);
      return;
    }

    // Fallback: usar la función verContenido si existe
    if (verContenido && typeof verContenido === 'function') {
      verContenido();
      return;
    }

    alert('No se encontró la primera lección o clase.\n\nRevisa la consola (F12) para ver la estructura de datos recibida.');
    console.error('[ClassicView][ERROR][GENERAL] contenido:', contenido);
  }
  
  // Estado del modal de pago
  let mostrarModalPago = false;
  
  // Función para abrir modal de pago
  function abrirModalPago() {
    mostrarModalPago = true;
  }
  
  // Función unificada para manejar la acción principal del HERO
  async function handleAccionPrincipalHero() {
    console.log('[ClassicView] handleAccionPrincipalHero - estaInscrito:', estaInscrito);
    
    if (estaInscrito) {
      // Si ya está inscrito, navegar al contenido
      console.log('[ClassicView] Usuario inscrito, navegando al contenido...');
      navegarAContenido();
    } else {
      // Si no está inscrito, abrir modal de pago
      console.log('[ClassicView] Usuario no inscrito, abriendo modal de pago...');
      abrirModalPago();
    }
  }
  
  // Función para manejar la inscripción desde el modal de pago
  async function handleInscripcionConActualizacion() {
    console.log('[ClassicView] handleInscripcionConActualizacion - antes de inscripción, estaInscrito:', estaInscrito);
    console.log('[ClassicView] Tipo de acceso:', contenido?.tipo_acceso);
    console.log('[ClassicView] Precio:', contenido?.precio);
    
    // Verificar si es contenido de pago
    const precioFinal = contenido?.precio_rebajado || contenido?.precio_normal || 0;
    const esGratis = precioFinal === 0;
    
    console.log('[ClassicView] DEBUG PRECIOS:');
    console.log('- contenido.precio_normal:', contenido?.precio_normal);
    console.log('- contenido.precio_rebajado:', contenido?.precio_rebajado);
    console.log('- contenido.tipo_acceso:', contenido?.tipo_acceso);
    console.log('- precioFinal calculado:', precioFinal);
    console.log('- esGratis (CORREGIDO):', esGratis);
    
    if (esGratis) {
      // CONTENIDO GRATUITO - Proceder con inscripción
      try {
        console.log('[ClassicView] Contenido gratuito, procediendo con inscripción...');
        
        // Ejecutar la función de inscripción
        await handleInscripcion();
        
        // Actualizar el estado local inmediatamente - CRÍTICO para reactividad
        console.log('[ClassicView] Inscripción completada, actualizando estado...');
        
        // Actualizar directamente el objeto data para trigger reactividad
        data = { ...data, estaInscrito: true };
        
        console.log('[ClassicView] Estado después de inscripción, estaInscrito:', estaInscrito);
        console.log('[ClassicView] data después de actualización:', data);
        
        // Cerrar modal
        mostrarModalPago = false;
        
      } catch (error) {
        console.error('[ClassicView] Error en inscripción:', error);
      }
    }
    // Si no es gratis, el modal de pago manejará el flujo de compra
  }
</script>

<svelte:head>
  <title>{contenido?.titulo || 'Contenido'} | Academia Vallenata</title>
</svelte:head>

<!-- Contador de oferta (si hay fecha de expiración) -->
{#if contenido?.fecha_expiracion}
  <ContadorOferta />
{/if}

<!-- Hero principal del curso -->
<HeroCurso 
  {curso}
  {estaInscrito}
  handleInscripcion={handleAccionPrincipalHero}
  verContenido={navegarAContenido}
/>

<!-- 🔥 SECCIÓN PROBLEMA - Amplifica el dolor del cliente (POSICIÓN CORRECTA) -->
<SeccionProblema 
  {tipo} 
/>

<!-- ⚡ SECCIÓN SOLUCIÓN - LA RESPUESTA al problema del cliente -->
<SeccionSolucion 
  {tipo} 
/>

<!-- 💰 MODAL DE PAGO INTELIGENTE -->
<ModalPagoInteligente 
  bind:mostrar={mostrarModalPago}
  {contenido}
  tipoContenido={tipo}
/>

<!-- ✨ SECCIÓN BENEFICIOS - TEMPORALMENTE OCULTA -->
<!-- <SeccionBeneficios 
  {contenido} 
  {tipo} 
/> -->

<style>
  /* Estilos globales para la página de curso */
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f0f0f0;
  }
</style>
