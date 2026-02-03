<script lang="ts">
  import { onDestroy } from 'svelte';
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import ModalVisorImagenPerfil from './ModalVisorImagenPerfil.svelte';
  import { crearPublicacionAutomaticaSegura } from '$lib/services/publicacionesAutoService';
  import { goto } from '$app/navigation';
  import { mensajeriaService } from '$lib/services/mensajeriaService';
  import { generarIniciales, obtenerAvatarPorDefecto, debeMostrarIniciales } from '$lib/utils/avatarUtils';

  // Crear dispatcher para comunicar el estado del modal
  const dispatch = createEventDispatcher();

  // --- PROPS (Datos recibidos desde el padre) ---
  export let urlPortada: string | undefined = undefined;
  export let urlAvatar: string | undefined = undefined;
  export let nombreCompleto = 'Usuario';
  export const correoElectronico = 'correo@ejemplo.com'; // No utilizado pero mantenido para compatibilidad
  export let posicionPortadaY = 50;
  export let userId: string | null = null;
  export let stats = { publicaciones: 0, cursos: 0, tutoriales: 0, ranking: 0 };
  export let nivelUsuario = 1;
  export let rolUsuario = 'Estudiante';
  export let suscripcionUsuario = 'Free';
  export let esPerfilPublico = false; // true cuando es perfil de otra persona
  export let fechaCreacion: string | null = null;
  export let slugUsuario: string | null = null; // Para navegación en perfil público

  // --- MANEJO DE ARCHIVOS ---
  let vistaPortadaTemporal: string | null = null;
  let vistaAvatarTemporal: string | null = null;
  let archivoTemporal: File | null = null;
  
  // --- ESTADO UI ---
  let subiendo = false;
  let mensaje = '';
  let tipoMensaje: 'portada' | 'avatar' | 'posicion' | null = null;
  let modoEdicion: 'portada' | 'avatar' | null = null;
  let reposicionandoPortada = false;
  let mostrarMenuPortada = false;
  let mostrarMenuAvatar = false;
  let refMenuPortada: HTMLElement | null = null;
  let refMenuAvatar: HTMLElement | null = null;
  let refInputPortada: HTMLInputElement | null = null;
  let refInputAvatar: HTMLInputElement | null = null;
  let enviandoMensaje = false;

  // --- ESTADO MODAL ESTILO FACEBOOK ---
  let modalAbierto = false;
  let imagenModalUrl = '';
  let imagenModalId: string | null = null;
  let tipoImagenModal: 'avatar' | 'portada' | null = null;

  // --- MANEJO DE EVENTOS GLOBALES PARA REPOSICIONAR PORTADA ---
  function finalizarReposicion() {
    if (reposicionandoPortada) {
      guardarPosicionPortada();
    }
  }

  $: if (reposicionandoPortada) {
    window.addEventListener('mouseup', finalizarReposicion);
    window.addEventListener('touchend', finalizarReposicion);
  } else {
    window.removeEventListener('mouseup', finalizarReposicion);
    window.removeEventListener('touchend', finalizarReposicion);
  }

  function seleccionarArchivo(event: any, tipo: 'portada' | 'avatar') {
    const archivo = event.target.files[0];
    if (!archivo) return;
    archivoTemporal = archivo;
    modoEdicion = tipo;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (tipo === 'portada') {
        vistaPortadaTemporal = e.target?.result as string;
      } else {
        vistaAvatarTemporal = e.target?.result as string;
      }
    };
    reader.readAsDataURL(archivo);
  }

  async function guardarCambios() {
    if (!archivoTemporal || !userId || !modoEdicion) return;
    subiendo = true;
    mensaje = '';
    const bucket = modoEdicion === 'portada' ? 'fotoportada' : 'avatars';
    const extension = archivoTemporal.name.split('.').pop();
    const nombreArchivo = `${modoEdicion}-${userId}-${Date.now()}.${extension}`;
    
    try {
      // Subir archivo
      const { error: errorSubida } = await supabase.storage.from(bucket).upload(nombreArchivo, archivoTemporal, { upsert: true });
      if (errorSubida) {
        mostrarMensaje('Error al subir: ' + errorSubida.message, modoEdicion);
        subiendo = false;
        return;
      }
      
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(nombreArchivo);
      const nuevaUrl = urlData.publicUrl + '?t=' + Date.now();
      
      // Actualizar perfil
      const campoUpdate = modoEdicion === 'portada' ? { portada_url: nuevaUrl } : { url_foto_perfil: nuevaUrl };
      await supabase.from('perfiles').update(campoUpdate).eq('id', userId);
      
      // Guardar en tabla usuario_imagenes para el sistema de likes/comentarios
      const { data: imagenData, error: errorImagen } = await supabase
        .from('usuario_imagenes')
        .insert({
          usuario_id: userId,
          url_imagen: nuevaUrl,
          tipo: modoEdicion,
          fecha_subida: new Date().toISOString(),
          es_actual: true
        })
        .select()
        .single();

      if (errorImagen) {
        console.error('Error guardando imagen en usuario_imagenes:', errorImagen);
      }

      // Marcar otras imágenes del mismo tipo como no actuales
      if (imagenData) {
        await supabase
          .from('usuario_imagenes')
          .update({ es_actual: false })
          .eq('usuario_id', userId)
          .eq('tipo', modoEdicion)
          .neq('id', imagenData.id);
      }
      
      // Actualizar UI
      if (modoEdicion === 'portada') {
        urlPortada = nuevaUrl;
        vistaPortadaTemporal = null;
      } else {
        urlAvatar = nuevaUrl;
        vistaAvatarTemporal = null;
      }
      
      // 🎯 CREAR PUBLICACIÓN AUTOMÁTICA ESTILO FACEBOOK
      try {
        await crearPublicacionAutomaticaSegura({
          usuario_id: userId,
          tipo: modoEdicion === 'portada' ? 'foto_portada' : 'foto_perfil',
          url_imagen: nuevaUrl,
          usuario_nombre: nombreCompleto,
          usuario_avatar: modoEdicion === 'portada' ? nuevaUrl : urlAvatar
        });
        console.log('✅ Publicación automática creada exitosamente');
      } catch (error) {
        console.error('⚠️ Error creando publicación automática (no crítico):', error);
        // No mostramos error al usuario porque la imagen se guardó correctamente
      }
      
      mostrarMensaje('¡Actualizado exitosamente!', modoEdicion);
      limpiarSeleccion();
    } catch (error) {
      console.error('Error completo:', error);
      mostrarMensaje('Error inesperado', modoEdicion);
      subiendo = false;
    }
  }

  function limpiarSeleccion() {
    subiendo = false;
    archivoTemporal = null;
    vistaAvatarTemporal = null;
    vistaPortadaTemporal = null;
    modoEdicion = null;
  }
  
  function manejarDragPortada(event: MouseEvent | TouchEvent) {
    if (!reposicionandoPortada) return;
    event.preventDefault();
    const targetElement = (event.currentTarget as HTMLElement);
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const rect = targetElement.getBoundingClientRect();
    const y = clientY - rect.top;
    posicionPortadaY = Math.max(0, Math.min(100, (y / rect.height) * 100));
  }

  async function guardarPosicionPortada() {
    if (!userId) return;
    await supabase.from('perfiles').update({ posicion_img_portada: String(posicionPortadaY) }).eq('id', userId);
    reposicionandoPortada = false;
    mostrarMensaje('¡Posición guardada!', 'posicion');
  }

  function mostrarMensaje(texto: string, tipo: 'portada' | 'avatar' | 'posicion') {
    mensaje = texto;
    tipoMensaje = tipo;
    setTimeout(() => {
      mensaje = '';
      tipoMensaje = null;
    }, 3000);
  }

  // ============================================
  // FUNCIÓN PARA ENVIAR MENSAJE
  // ============================================
  async function enviarMensajeAlUsuario() {
    console.log('💬 Iniciando proceso para enviar mensaje al usuario');
    
    // Verificar que tenemos el ID del usuario del perfil
    if (!userId) {
      alert('Error: No se puede identificar al usuario');
      return;
    }

    enviandoMensaje = true;

    try {
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Debes iniciar sesión para enviar mensajes');
        goto('/auth/login');
        return;
      }

      // No permitir enviarse mensajes a sí mismo
      if (user.id === userId) {
        alert('No puedes enviarte un mensaje a ti mismo');
        return;
      }

      console.log('👤 Usuario destino (userId):', userId);
      console.log('👤 Usuario actual:', user.id);

      // Buscar si ya existe un chat privado entre estos usuarios
      const { chats } = await mensajeriaService.obtenerChatsUsuario();
      
      let chatExistente = chats.find((chat: any) => {
        if (chat.es_grupal) return false;
        
        // Verificar si el chat tiene exactamente 2 miembros y uno de ellos es el usuario destino
        const tieneUsuarioDestino = chat.miembros?.some((m: any) => m.usuario_id === userId);
        const tieneUsuarioActual = chat.miembros?.some((m: any) => m.usuario_id === user.id);
        const esChatPrivado = chat.miembros?.length === 2;
        
        return tieneUsuarioDestino && tieneUsuarioActual && esChatPrivado;
      });

      if (chatExistente) {
        console.log('💬 Chat existente encontrado, navegando...', chatExistente.id);
        goto(`/mensajes/${chatExistente.id}`);
      } else {
        console.log('📝 Creando nuevo chat privado...');
        
        // Crear nuevo chat privado
        const { chat: nuevoChat, error: errorCreacion } = await mensajeriaService.crearChat({
          es_grupal: false,
          miembros_ids: [user.id, userId]
        });

        if (errorCreacion || !nuevoChat) {
          console.error('Error creando chat:', errorCreacion);
          alert('Error al crear la conversación: ' + errorCreacion);
          return;
        }

        console.log('✅ Nuevo chat creado:', nuevoChat.id);
        goto(`/mensajes/${nuevoChat.id}`);
      }
      
    } catch (error) {
      console.error('Error enviando mensaje:', error);
      alert('Error inesperado al crear la conversación');
    } finally {
      enviandoMensaje = false;
    }
  }

  function abrirMenuPortada(e: any) {
    e.stopPropagation();
    mostrarMenuPortada = true;
  }
  function abrirMenuAvatar(e: any) {
    e.stopPropagation();
    mostrarMenuAvatar = true;
  }
  function cerrarMenus() {
    mostrarMenuPortada = false;
    mostrarMenuAvatar = false;
  }

  function clickFueraMenuPortada(e: Event) {
    if (refMenuPortada && !refMenuPortada.contains(e.target as Node) && 
        !(e.target as Element).closest('.icono-camara-portada')) {
      mostrarMenuPortada = false;
    }
  }
  function clickFueraMenuAvatar(e: any) {
    if (refMenuAvatar && !refMenuAvatar.contains(e.target)) {
      mostrarMenuAvatar = false;
    }
  }

  $: if (mostrarMenuPortada) {
    window.addEventListener('mousedown', clickFueraMenuPortada);
    window.addEventListener('touchstart', clickFueraMenuPortada);
  } else {
    window.removeEventListener('mousedown', clickFueraMenuPortada);
    window.removeEventListener('touchstart', clickFueraMenuPortada);
  }
  $: if (mostrarMenuAvatar) {
    window.addEventListener('mousedown', clickFueraMenuAvatar);
  } else {
    window.removeEventListener('mousedown', clickFueraMenuAvatar);
  }

  // --- FUNCIONES PARA MODAL ESTILO FACEBOOK ---
  async function abrirModalImagen(tipo: 'avatar' | 'portada') {
    if (!userId) return;
    
    try {
      // Buscar la imagen actual en la base de datos
      const { data: imagenData, error } = await supabase
        .from('usuario_imagenes')
        .select('*')
        .eq('usuario_id', userId)
        .eq('tipo', tipo)
        .eq('es_actual', true)
        .single();

      if (error || !imagenData) {
        // Si no hay registro en BD, crear uno con la URL actual
        const urlImagen = tipo === 'avatar' ? urlAvatar : urlPortada;
        if (!urlImagen) return;

        const { data: nuevaImagen, error: errorCrear } = await supabase
          .from('usuario_imagenes')
          .insert({
            usuario_id: userId,
            url_imagen: urlImagen,
            tipo: tipo,
            fecha_subida: new Date().toISOString(),
            es_actual: true
          })
          .select()
          .single();

        if (errorCrear) {
          console.error('Error creando registro de imagen:', errorCrear);
          return;
        }

        imagenModalId = nuevaImagen.id;
        imagenModalUrl = urlImagen;
      } else {
        imagenModalId = imagenData.id;
        imagenModalUrl = imagenData.url_imagen;
      }

      tipoImagenModal = tipo;
      modalAbierto = true;
      
      // Comunicar al padre que el modal se abrió
      dispatch('modalStateChange', { modalAbierto: true });
      
      // Cerrar menús
      cerrarMenus();
    } catch (error) {
      console.error('Error abriendo modal:', error);
    }
  }

  function cerrarModal() {
    modalAbierto = false;
    imagenModalUrl = '';
    imagenModalId = null;
    tipoImagenModal = null;
    
    // Comunicar al padre que el modal se cerró
    dispatch('modalStateChange', { modalAbierto: false });
  }

  function verFotoPortada() {
    abrirModalImagen('portada');
  }
  
  function verFotoAvatar() {
    abrirModalImagen('avatar');
  }
  
  function subirFotoPortada() {
    refInputPortada?.click();
    mostrarMenuPortada = false;
    modoEdicion = 'portada';
  }
  function subirFotoAvatar() {
    refInputAvatar?.click();
    mostrarMenuAvatar = false;
    modoEdicion = 'avatar';
  }
  function moverPortada() {
    reposicionandoPortada = true;
    mostrarMenuPortada = false;
  }

  onDestroy(() => {
    window.removeEventListener('mousedown', clickFueraMenuPortada);
    window.removeEventListener('touchstart', clickFueraMenuPortada);
    window.removeEventListener('mousedown', clickFueraMenuAvatar);
  });

  // Función para formatear la fecha de registro
  function formatearFechaRegistro(fecha: string | null): string {
    if (!fecha) return `Miembro desde ${new Date().getFullYear()}`;
    
    const fechaRegistro = new Date(fecha);
    const mes = fechaRegistro.toLocaleDateString('es-ES', { month: 'long' });
    const año = fechaRegistro.getFullYear();
    
    return `Miembro desde ${mes} ${año}`;
  }

  // Verificar si debemos mostrar iniciales en lugar de imagen
  $: mostrarIniciales = debeMostrarIniciales(urlAvatar) && nombreCompleto;
  $: iniciales = mostrarIniciales ? generarIniciales(nombreCompleto) : '';
</script>

<!--
  Estructura visual y media queries organizados:
  - General styles
  - Media queries agrupados al final y comentados
-->

<!-- Contenedor Principal -->
<div class="contenedor-portada" on:mousemove={manejarDragPortada} on:touchmove={manejarDragPortada}>
  <img
    src={vistaPortadaTemporal || urlPortada || '/images/perfil-portada/Imagen de portada.png'}
    alt="Portada de perfil"
    class="imagen-portada"
    class:reposicionando={reposicionandoPortada}
    style="object-position: 50% {posicionPortadaY}%; cursor: {!reposicionandoPortada && !vistaPortadaTemporal && (urlPortada || !urlPortada) ? 'pointer' : 'default'};"
    on:click={() => {
      if (!reposicionandoPortada && !vistaPortadaTemporal) {
        abrirModalImagen('portada');
      }
    }}
  />
  
  <!-- Menú flotante portada -->
  {#if mostrarMenuPortada}
    <div class="menu-flotante-portada" bind:this={refMenuPortada}>
      {#if urlPortada}
        <button on:click={verFotoPortada}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg> Ver foto de portada</button>
      {/if}
      <button on:click={subirFotoPortada}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><rect x="4" y="16" width="16" height="4" rx="2"/></svg> Subir foto nueva</button>
      <button on:click={moverPortada}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v18m9-9H3"/></svg> Mover</button>
    </div>
  {/if}

  <!-- Botones Guardar/Cancelar portada cuando hay imagen temporal -->
  {#if vistaPortadaTemporal || modoEdicion === 'portada'}
    <div class="controles-portada">
      <button class="boton-control" on:click={guardarCambios} disabled={subiendo}>
        {subiendo ? 'Guardando...' : 'Guardar'}
      </button>
      <button class="boton-control secundario" on:click={limpiarSeleccion} disabled={subiendo}>
        Cancelar
      </button>
    </div>
  {/if}

  <!-- Icono cámara portada: SIEMPRE abre menú -->
  <span class="icono-camara-portada" on:click|stopPropagation={abrirMenuPortada}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="4"/><path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></svg>
    <span class="texto-cambiar-portada">Cambiar portada</span>
  </span>
  <input type="file" class="input-oculto" bind:this={refInputPortada} on:change={(e) => seleccionarArchivo(e, 'portada')} />

  <!-- Avatar -->
  <div class="contenedor-avatar">
    <div class="avatar-interactivo">
      {#if mostrarIniciales}
        <!-- Avatar con iniciales cuando no hay imagen -->
        <div 
          class="avatar-iniciales"
          on:click={() => abrirModalImagen('avatar')}
          style:cursor="pointer"
        >
          {iniciales}
        </div>
      {:else}
        <!-- Imagen de avatar -->
        <img 
          src={vistaAvatarTemporal || obtenerAvatarPorDefecto()} 
          alt="Avatar" 
          class="imagen-avatar"
          on:click={() => abrirModalImagen('avatar')}
          style:cursor="pointer"
        />
      {/if}
      <!-- Icono cámara perfil SIEMPRE visible y abre menú -->
      <span class="icono-camara-avatar" on:click|stopPropagation={abrirMenuAvatar}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="4"/><path d="M5 7h2l2-3h6l2 3h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/></svg>
      </span>
    </div>
    <input type="file" class="input-oculto" bind:this={refInputAvatar} on:change={(e) => seleccionarArchivo(e, 'avatar')} />
    
    <!-- Menú flotante avatar -->
    {#if mostrarMenuAvatar}
      <div class="menu-flotante-avatar" bind:this={refMenuAvatar}>
        {#if urlAvatar}
          <button on:click={verFotoAvatar}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg> Ver foto del perfil</button>
        {/if}
        <button on:click={subirFotoAvatar}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 16V4m0 0l-4 4m4-4l4 4"/><rect x="4" y="16" width="16" height="4" rx="2"/></svg> Elegir foto del perfil</button>
      </div>
    {/if}
    {#if modoEdicion === 'avatar'}
      <div class="controles-avatar">
        <button class="boton-guardar-avatar" on:click={guardarCambios} disabled={subiendo}>{subiendo ? 'Guardando...' : 'Guardar'}</button>
        <button class="boton-cancelar-avatar" on:click={limpiarSeleccion} disabled={subiendo}>Cancelar</button>
      </div>
    {/if}
  </div>

  <!-- Mensajes de estado -->
  {#if mensaje}
    <div class="mensaje-flotante" class:avatar={tipoMensaje === 'avatar'}>{mensaje}</div>
  {/if}
</div>

<!-- Info Usuario -->
<div class="info-usuario">
  <div class="seccion-estadisticas">
    <div class="estadistica">
      <div class="icono-estadistica publicacion">📝</div>
      <div class="valor">{stats.publicaciones}</div>
      <div class="etiqueta">Publicaciones</div>
    </div>
    <div class="estadistica">
      <div class="icono-estadistica curso">📚</div>
      <div class="valor">{stats.cursos}</div>
      <div class="etiqueta">Cursos</div>
    </div>
    <div class="estadistica">
      <div class="icono-estadistica tutorial">🎓</div>
      <div class="valor">{stats.tutoriales}</div>
      <div class="etiqueta">Tutoriales</div>
    </div>
    <div class="estadistica">
      <div class="icono-estadistica ranking">🏆</div>
      <div class="valor">#{stats.ranking || '--'}</div>
      <div class="etiqueta">Ranking</div>
    </div>
  </div>
  
  <div class="separador-vertical"></div>
  
  <div class="seccion-central">
          <div class="info-usuario-principal">
        <div class="nombre-usuario">{nombreCompleto}</div>
        <div class="estrellas-rating">
          <div class="estrellas">
            {'★'.repeat(4)}{'☆'.repeat(1)}
          </div>
          <div class="nivel-usuario">Nivel {nivelUsuario}</div>
        </div>
      </div>
      <div class="badges-usuario">
        <span class="badge badge-rol">{rolUsuario}</span>
        <span class="badge badge-suscripcion">{suscripcionUsuario}</span>
      </div>
  </div>
  
  <div class="seccion-accion">
    {#if esPerfilPublico}
      <!-- Contenido para perfil de otra persona -->
      <div class="info-perfil-publico">
        <div class="fecha-registro">{formatearFechaRegistro(fechaCreacion)}</div>
        <!-- Información eliminada como solicitó el usuario -->
      </div>
      <div class="acciones-perfil-publico">
                    <button class="boton-mensaje" on:click={enviarMensajeAlUsuario} disabled={enviandoMensaje}>
              {#if enviandoMensaje}
                <span class="spinner-pequeño"></span> Enviando...
              {:else}
                ✉️ Mensaje
              {/if}
            </button>
        <button class="boton-seguir" on:click={() => alert('Función de seguir próximamente')}>
          ➕ Seguir
        </button>
        <button class="boton-publicaciones" on:click={() => slugUsuario && (window.location.href = `/usuarios/${slugUsuario}/publicaciones`)}>
          📝 Publicaciones
        </button>
      </div>
    {:else}
      <!-- Contenido para perfil propio -->
      <div class="saludo-accion">¡Sigue así, {nombreCompleto ? nombreCompleto.split(' ')[0] : 'crack'}!</div>
      <button class="boton-accion-principal" on:click={() => window.location.href = '/mis-cursos'}>
        🎹 Ir a mi aprendizaje
      </button>
    {/if}
  </div>
</div>

<style>
  /* === VARIABLES === */
  :root {
    --color-primario: #2563eb;
    --color-secundario: #f59e0b;
    --color-exito: #22c55e;
    --texto-blanco: white;
    --fondo-blanco: white;
    --gris-claro: #f3f4f6;
    --gris-medio: #9ca3af;
    --gris-oscuro: #1f2937;
    --borde-radius: 16px;
    --sombra-suave: 0 4px 24px rgba(0, 0, 0, 0.06);
    --sombra-fuerte: 0 12px 40px rgba(0, 0, 0, 0.22);
  }

  /* === LAYOUT PRINCIPAL === */
  .contenedor-portada {
    position: relative;
    width: 100%;
    height: 370px;
    overflow: visible;
    border-radius: var(--borde-radius) var(--borde-radius) 0 0;
    z-index: 1;
    padding: 0;
    margin-top: 0;
  }

  .imagen-portada {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: object-position 0.3s ease;
    z-index: 2;
    position: relative;
    border-radius: var(--borde-radius) var(--borde-radius) 0 0;
  }
  .imagen-portada.reposicionando { cursor: grabbing; }

  .info-usuario {
    background: var(--fondo-blanco);
    margin-top: 90px;
    padding: 1px;
    border-radius: 0 0 var(--borde-radius) var(--borde-radius);
    box-shadow: var(--sombra-suave);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    position: relative;
    z-index: 1;
    overflow: visible;
  }

  /* === CONTROLES === */
  .controles-portada {
    position: absolute;
    top: 16px;
    right: 16px;
    display: flex;
    gap: 12px;
    z-index: 9999;
  }

  .boton-control {
    background: rgba(0, 0, 0, 0.7);
    color: var(--texto-blanco);
    padding: 10px 18px;
    border-radius: 8px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    font-size: 0.9rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .boton-control:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.85);
    transform: translateY(-2px);
  }

  .boton-control.secundario { background: rgba(245, 158, 107, 0.8); }
  .boton-control.secundario:hover:not(:disabled) { background: rgba(245, 158, 107, 1); }
  .boton-control:disabled { background: var(--gris-medio); cursor: not-allowed; }

  /* === AVATAR === */
  .contenedor-avatar {
    position: absolute;
    left: 50%;
    bottom: -80px;
    transform: translateX(-50%);
    z-index: 9998;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .avatar-interactivo {
    position: relative;
    width: 160px;
    height: 160px;
  }

  .imagen-avatar {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6px solid var(--fondo-blanco);
    object-fit: cover;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    z-index: 100;
  }
  
  .avatar-iniciales {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 6px solid var(--fondo-blanco);
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    font-weight: 900;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    z-index: 100;
    cursor: pointer;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  .avatar-interactivo:hover .imagen-avatar, 
  .avatar-interactivo:hover .avatar-iniciales { 
    box-shadow: 0 12px 40px rgba(37, 99, 235, 0.2); 
    transform: scale(1.02);
  }

  .controles-avatar {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .boton-guardar-avatar, .boton-cancelar-avatar {
    color: var(--texto-blanco);
    padding: 8px 16px;
    border-radius: 6px;
    border: none;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .boton-guardar-avatar { background: var(--color-exito); }
  .boton-guardar-avatar:hover:not(:disabled) { background: #16a34a; }
  .boton-cancelar-avatar { background: var(--gris-medio); }
  .boton-cancelar-avatar:hover:not(:disabled) { background: #6b7280; }
  .boton-guardar-avatar:disabled, .boton-cancelar-avatar:disabled {
    background: var(--gris-claro);
    cursor: not-allowed;
  }

  /* === SECCIONES INFO === */
  .seccion-estadisticas {
    display: flex;
    align-items: center;
    gap: 4px;
    flex: 1.5;
    position: relative;
    z-index: 1;
  }

  .estadistica {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    flex: 1;
    margin-bottom: 10px;
  }

  .icono-estadistica { font-size: 2.2rem; line-height: 1; }
  .icono-estadistica.publicacion { color: #3b82f6; }
  .icono-estadistica.curso { color: #10b981; }
  .icono-estadistica.tutorial { color: #8b5cf6; }
  .icono-estadistica.ranking { color: var(--color-secundario); }

  .valor { font-size: 1.2rem; font-weight: 700; color: var(--gris-oscuro); }
  .etiqueta { font-size: 0.65rem; color: #6b7280; font-weight: 600; text-transform: uppercase; }

  .separador-vertical { width: 1px; background-color: var(--gris-claro); align-self: stretch; }
  
  .seccion-central {
    text-align: left;
    flex: 1;
    margin-top: 10px;
    padding-left: 20px;
  }

  .info-usuario-principal {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .nombre-usuario {
    font-size: 1.4rem;
    font-weight: 800;
    color: var(--gris-oscuro);
    margin: 0;
    line-height: 1.2;
  }

  .estrellas-rating {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .estrellas {
    font-size: 1.1rem;
    color: var(--color-secundario);
    letter-spacing: 2px;
  }

  .nivel-usuario {
    font-size: 0.85rem;
    color: var(--gris-medio);
    font-weight: 600;
    background: var(--gris-claro);
    padding: 2px 8px;
    border-radius: 12px;
  }

  .badges-usuario {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 20px;
    text-transform: capitalize;
    letter-spacing: 0.5px;
  }

  .badge-rol {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
  }

  .badge-suscripcion {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .seccion-accion {
    flex: 1.2;
    text-align: center;
    margin-top: 0;
  }

  .saludo-accion {
    font-size: 1rem;
    font-weight: 700;
    color: var(--gris-oscuro);
    margin-bottom: 4px;
  }

  .boton-accion-principal {
    background: linear-gradient(135deg, var(--color-primario), #1d4ed8);
    color: var(--texto-blanco);
    padding: 8px 12px;
    border-radius: 8px;
    border: none;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.92rem;
    width: 100%;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
  }
  .boton-accion-principal:hover { 
    transform: translateY(-2px); 
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); 
  }

  /* === ESTILOS PERFIL PÚBLICO === */
  .info-perfil-publico {
    text-align: center;
    margin-bottom: 12px;
  }

  .fecha-registro {
    font-size: 0.85rem;
    color: var(--gris-medio);
    font-weight: 500;
    margin-bottom: 8px;
  }

  .logros-usuario {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .logro {
    font-size: 0.8rem;
    color: var(--gris-oscuro);
    font-weight: 600;
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    padding: 4px 8px;
    border-radius: 12px;
    border: 1px solid #d1d5db;
  }

  .acciones-perfil-publico {
    display: flex;
    flex-direction: row;
    gap: 6px;
    justify-content: center;
  }

  .boton-mensaje {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
    flex: 1;
    max-width: 80px;
  }

  .boton-mensaje:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  }

  .boton-mensaje:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .boton-mensaje:disabled:hover {
    transform: none;
    box-shadow: 0 2px 8px rgba(139, 92, 246, 0.2);
  }

  .spinner-pequeño {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top: 2px solid white;
    animation: spin 1s linear infinite;
    margin-right: 4px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .boton-seguir {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
    flex: 1;
    max-width: 80px;
  }

  .boton-seguir:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .boton-publicaciones {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
    flex: 1;
    max-width: 80px;
  }

  .boton-publicaciones:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  /* === ICONOS Y MENÚS === */
  .icono-camara-portada, .icono-camara-avatar {
    background: rgba(255,255,255,0.85);
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icono-camara-portada {
    position: absolute;
    bottom: 16px;
    right: 16px;
    border-radius: 30px;
    padding: 6px 12px 6px 6px;
    z-index: 20;
    gap: 8px;
  }

  .icono-camara-avatar {
    position: absolute;
    bottom: 8px;
    right: 8px;
    border-radius: 50%;
    padding: 4px;
    z-index: 30;
  }

  .texto-cambiar-portada {
    display: none;
    color: var(--gris-oscuro);
    font-weight: 500;
    font-size: 0.9rem;
  }

  .menu-flotante-portada, .menu-flotante-avatar {
    position: absolute;
    background: white;
    border-radius: 12px;
    padding: 8px;
    box-shadow: var(--sombra-fuerte);
    z-index: 10000;
  }

  .menu-flotante-portada {
    top: 50%;
    right: 16px;
    transform: translateY(-50%);
    min-width: 200px;
  }

  .menu-flotante-avatar {
    top: auto;
    bottom: 110%;
    left: 50%;
    transform: translate(-50%, -8px);
    min-width: 220px;
    z-index: 9999;
  }

  .menu-flotante-portada button,
  .menu-flotante-avatar button {
    width: 100%;
    text-align: left;
    padding: 10px 12px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--gris-oscuro);
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .menu-flotante-portada button:hover,
  .menu-flotante-avatar button:hover {
    background: var(--gris-claro);
  }

  .menu-flotante-portada button svg,
  .menu-flotante-avatar button svg {
    flex-shrink: 0;
  }

  /* === MENSAJES === */
  .mensaje-flotante {
    position: absolute;
    top: 20px;
    right: 20px;
    background: var(--color-exito);
    color: var(--texto-blanco);
    padding: 12px 20px;
    border-radius: 8px;
    font-weight: 600;
    z-index: 30;
    animation: fadeInOut 3s ease-in-out forwards;
  }
  .mensaje-flotante.avatar {
    top: auto;
    bottom: -90px;
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }

  .input-oculto { display: none; }

  @keyframes fadeInOut {
    0%, 100% { opacity: 0; transform: translateY(-10px); }
    10%, 90% { opacity: 1; transform: translateY(0); }
  }

  /* === RESPONSIVE DESIGN === */
  


  /* Tablet (600px - 900px) - Estilo Facebook */
  @media (max-width: 900px) {

    
    .contenedor-portada { 
      height:240px;
      margin-top: 15px;
      border-radius: 0; /* Sin border-radius - estilo Facebook */
      width: 100vw; /* Ancho completo de la ventana */
      margin-left: calc(-50vw + 50%); /* Compensar el centrado del contenedor */
      position: relative;
    }
    
    .imagen-portada {
      border-radius: 0; /* Sin border-radius - estilo Facebook */
      width: 100%;
      height: 100%;
      object-fit: cover;
      
    }
    .info-usuario { 
      flex-direction: column; 
      width: 100vw; /* Ancho completo - estilo Facebook */
      margin-left: calc(-50vw + 50%); /* Compensar el centrado del contenedor */
      border-radius: 0; /* Sin border-radius - estilo Facebook */
    }
    .seccion-estadisticas, .seccion-central, .seccion-accion { 
      width: 100%; 
      flex: none; 
      margin-bottom: 15px;
    }
    .avatar-interactivo {
    position: relative;
    width: 140px;
    height: 140px;
    }
    
    .avatar-iniciales {
      font-size: 2.5rem;
    }
    .contenedor-avatar {
      position: absolute;
      transform: translateX(-50%) translateY(20%);
      margin-bottom: 10px;
    }
    .info-usuario {
      background: var(--fondo-blanco);
      margin-top: 100px;
      border-radius: 0 0 var(--borde-radius) var(--borde-radius);
      box-shadow: var(--sombra-suave);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2px;
    }
    /* === SECCIONES INFO === */
    .seccion-estadisticas {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding: 20px 10px;
  }

  .estadistica {
    flex: 1;
    margin-bottom: 10px;
    gap: 2px;
  }

  .seccion-central {
    flex: 1;
    margin-top: -15px;
    text-align: center;
    padding-left: 0;
  }

  .info-usuario-principal {
    align-items: center;
    text-align: center;
  }


  .estrellas-rating {
    justify-content: center;
    margin-bottom: 8px;
    margin-top: -10px;
  }

  .estrellas {
    font-size: 1.4rem;
    color: #0c0c08
  }

  .nivel-usuario {
    font-size: 0.8rem;
  }

  .badges-usuario {
    justify-content: center;
    margin-top: -15px;
  }

  .boton-mensaje,
  .boton-seguir {
    font-size: 0.75rem;
    padding: 6px 8px;
  }

  .seccion-accion {
    flex: 1.2;
    text-align: center;
    margin-top: -15px;
  }

  .saludo-accion {
    font-size: 1rem;
    font-weight: 700;
    color: var(--gris-oscuro);
    margin-bottom: 4px;
  }

  .boton-accion-principal {
    background: linear-gradient(135deg, var(--color-primario), #1d4ed8);
    color: var(--texto-blanco);
    padding: 8px 12px;
    width: 100%;
    max-width: 200px;
    margin-bottom: 10px;
  }

  }

  /* Móvil (480px - 600px) - Estilo Facebook */
  @media (max-width: 600px) {
    .contenedor-portada { 
      height: 180px; 
      width: 100vw; /* Ancho completo - estilo Facebook */
      margin-left: calc(-50vw + 50%); /* Compensar el centrado del contenedor */
      border-radius: 0; /* Sin border-radius - estilo Facebook */
    }
    
    .imagen-portada {
      border-radius: 0; /* Sin border-radius - estilo Facebook */
    }
    
    .menu-flotante-portada {
      top: auto;
      bottom: 80px;
      right: 16px;
      transform: translateX(-50%);
      min-width: 95vw;
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(0,0,0,0.1);
      left: 50%;
    }
    .menu-flotante-avatar { min-width: 95vw; }

    .nombre-usuario {
      font-size: 1.6rem;
      margin: 0 10px;
    }

    .estrellas {
      font-size: 1.2rem;
    }

    .badge {
      font-size: 0.7rem;
      padding: 3px 8px;
    }

    .acciones-perfil-publico {
      flex-direction: row;
      gap: 4px;
      justify-content: center;
      max-width: 160px;
      margin: 0 auto;
    }

    .boton-mensaje,
    .boton-seguir,
    .boton-publicaciones {
      font-size: 0.65rem;
      padding: 5px 6px;
      flex: 1;
      max-width: 65px;
    }
  }

  /* Móvil pequeño (menos de 480px) - Estilo Facebook */
  @media (max-width: 480px) {
    .contenedor-portada { 
      height: 240px;
      border-radius: 0;
      width: 100vw; /* Ancho completo - estilo Facebook */
      margin-left: calc(-50vw + 50%); /* Compensar el centrado del contenedor */
    }
    .imagen-portada { border-radius: 0; }
    .controles-portada { gap: 8px; }
    .boton-control { padding: 8px 16px; font-size: 0.85rem; }
    .icono-estadistica { font-size: 1.9rem; }
    .valor { font-size: 1.1rem; }
    .etiqueta { font-size: 0.6rem; }
    .info-usuario { 
      padding: 5px; 
      margin-top: 60px; 
      width: 100vw; /* Ancho completo - estilo Facebook */
      margin-left: calc(-50vw + 50%); /* Compensar el centrado del contenedor */
      border-radius: 0; /* Sin border-radius - estilo Facebook */
      box-shadow: none; /* Sin sombra - estilo Facebook */
    }
    .contenedor-avatar { bottom: -40px; }
    
    .avatar-iniciales {
      font-size: 2rem;
    }
  }
</style>

<!-- Modal estilo Facebook para ver imágenes con likes y comentarios -->
<ModalVisorImagenPerfil
  abierto={modalAbierto}
  imagenUrl={imagenModalUrl}
  imagenId={imagenModalId}
  tipoImagen={tipoImagenModal}
  usuarioPropietario={{
    id: userId || '',
    nombre: nombreCompleto,
    avatar: urlAvatar || ''
  }}
  onCerrar={cerrarModal}
/>

