<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  import EmojiPicker from '$lib/components/Comunidad/EmojiPicker.svelte';
  import CrearEncuesta from '$lib/components/Comunidad/CrearEncuesta.svelte';
  import GifPicker from '$lib/components/Comunidad/GifPicker.svelte';
  import { subirArchivoComunidad } from '$lib/supabase/supabase-comunidad';
  import { notificarNuevaPublicacionComunidad } from '$lib/services/generadorNotificaciones';

  // Props
  export let usuario: { id: string, nombre: string } | null = null;

  // Estados principales
  let showModal = false;
  let tipo: 'texto' | 'foto' | 'video' | 'encuesta' | 'gif' = 'texto';
  let texto = '';
  let titulo = '';

  // Estados de publicación
  let publicando = false;
  let publicandoMensaje = '';

  // Estados de archivos
  let fotoFile: File | null = null;
  let fotoPreview: string | null = null;
  let videoFile: File | null = null;

  // Estados de GIF
  let showGifPicker = false;
  let gifSeleccionado: string | null = null;
  let gifPickerBtn: HTMLButtonElement | null = null;

  // Estados de emojis
  let showEmojiPicker = false;
  let emojiBtn: HTMLButtonElement | null = null;

  // Estados de encuesta
  let mostrarModalEncuesta = false;
  let datosEncuesta: any = null;

  // Constantes
  	const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';
  const DURACIONES = ['1 día', '3 días', '7 días', '14 días'];
  const dispatch = createEventDispatcher();

  // Funciones de archivos optimizadas
  const handleFileChange = (e: Event, fileType: 'foto' | 'video') => {
    const input = e.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    if (fileType === 'foto') {
      fotoFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => fotoPreview = ev.target?.result as string;
      reader.readAsDataURL(file);
    } else {
      videoFile = file;
    }
  };

  const removeFile = (fileType: 'foto' | 'video') => {
    if (fileType === 'foto') {
    fotoFile = null;
    fotoPreview = null;
    } else {
    videoFile = null;
  }
  };

  // Funciones de modal
  const abrirModal = (tipoPublicacion: typeof tipo = 'texto') => {
    tipo = tipoPublicacion;
    showModal = true;
  };

  const cerrarModal = () => {
    // Reset completo del estado
    showModal = false;
    tipo = 'texto';
    texto = '';
    titulo = '';
    fotoFile = null;
    fotoPreview = null;
    videoFile = null;
    gifSeleccionado = null;
    showGifPicker = false;
    showEmojiPicker = false;
    mostrarModalEncuesta = false;
    datosEncuesta = null;
    publicando = false;
    publicandoMensaje = '';
  };

  // Funciones de pickers
  const togglePicker = (pickerType: 'emoji' | 'gif', buttonElement: HTMLButtonElement | null) => {
    if (pickerType === 'emoji') {
      showEmojiPicker = !showEmojiPicker;
      showGifPicker = false;
    } else {
      showGifPicker = !showGifPicker;
      showEmojiPicker = false;
    }
  };

  const selectEmoji = (emoji: string) => {
    texto += emoji;
    showEmojiPicker = false;
  };

  const selectGif = (url: string) => {
    gifSeleccionado = url;
    showGifPicker = false;
  };

  // Funciones de encuesta
  const handleGuardarEncuesta = (event: CustomEvent) => {
    datosEncuesta = event.detail;
    publicarEncuesta();
  };

  const handleCancelarEncuesta = () => {
        mostrarModalEncuesta = false;
  };

  const publicarEncuesta = async () => {
    if (!datosEncuesta || publicando) return;

    // Protección contra clics múltiples
    publicando = true;
    publicandoMensaje = 'Publicando encuesta...';

    try {
      const insertData = {
      usuario_id: usuario?.id,
      usuario_nombre: usuario?.nombre,
      usuario_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || 'Usuario')}&background=667eea&color=fff`,
        titulo: datosEncuesta.pregunta,
      descripcion: '',
      tipo: 'encuesta',
        encuesta: datosEncuesta,
        fecha_creacion: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('comunidad_publicaciones')
        .insert([insertData])
        .select();

      if (error) throw error;

      // 🔔 ENVIAR NOTIFICACIONES PARA ENCUESTAS (SOLO SI ES ADMIN)
      if (data && data.length > 0 && usuario?.id) {
        const encuestaCreada = data[0];
        console.log('🔍 VERIFICANDO ROL DEL USUARIO PARA ENCUESTA...');
        
        const esAdmin = await esUsuarioAdministrador(usuario.id);
        console.log('👑 ¿Es administrador para encuesta?', esAdmin);
        
        // 🚨 VERIFICACIÓN ESTRICTA - SOLO PROCEDER SI ES ADMIN
        if (!esAdmin) {
          console.log('🚫 USUARIO NO ES ADMIN - SALIENDO SIN ENVIAR NOTIFICACIONES DE ENCUESTA');
          console.log('🚫 FIN DE VERIFICACIÓN DE ENCUESTA - NO SE PROCESAN NOTIFICACIONES');
          // Salir inmediatamente sin procesar notificaciones
        } else {
          console.log('👑 ✅ CONFIRMADO: USUARIO ES ADMIN - PROCEDIENDO CON NOTIFICACIONES DE ENCUESTA...');
          
          try {
            console.log('📤 INICIANDO ENVÍO DE NOTIFICACIONES DE ENCUESTA...');
            const resultadoNotificacion = await notificarNuevaPublicacionComunidad({
              publicacion_id: encuestaCreada.id,
              titulo_publicacion: datosEncuesta.pregunta || 'Nueva encuesta',
              contenido: `Nueva encuesta: ${datosEncuesta.pregunta}`,
              autor_id: usuario?.id || '',
              autor_nombre: usuario?.nombre || 'Usuario'
            });
            
            if (resultadoNotificacion.exito) {
              console.log(`✅ Notificaciones de encuesta enviadas exitosamente: ${resultadoNotificacion.notificaciones_creadas}`);
            } else {
              console.error('❌ Error enviando notificaciones de encuesta:', resultadoNotificacion.error);
            }
          } catch (errorNotificacion) {
            console.error('❌ Error inesperado enviando notificaciones de encuesta:', errorNotificacion);
          }
        }
      }

      dispatch('publicar');
      cerrarModal();
    } catch (error: any) {
      console.error('💥 ERROR EN PUBLICACIÓN DE ENCUESTA:', error);
      alert(`Error al publicar encuesta: ${error.message || error}`);
    } finally {
      // Siempre resetear estado de publicación
      publicando = false;
      publicandoMensaje = '';
    }
  };

  // Función principal de publicación
  const publicar = async () => {
    // Protección contra clics múltiples
    if (publicando) {
      console.log('🛑 YA SE ESTÁ PUBLICANDO, IGNORANDO CLIC');
      return;
    }

    publicando = true;
    publicandoMensaje = tipo === 'foto' ? 'Subiendo imagen...' : 
                      tipo === 'video' ? 'Subiendo video...' : 
                      'Publicando...';

    console.log('🚀 INICIANDO PUBLICACIÓN');
    console.log('👤 Usuario:', usuario);
    try {
      let url_media = null;

      // Manejo de archivos
    if (tipo === 'foto' && fotoFile) {
      const { url, error } = await subirArchivoComunidad(fotoFile, 'imagenes');
        if (error) throw new Error(error);
      url_media = url;
    } else if (tipo === 'video' && videoFile) {
      const { url, error } = await subirArchivoComunidad(videoFile, 'videos');
        if (error) throw new Error(error);
      url_media = url;
      } else if (gifSeleccionado) {
      url_media = gifSeleccionado;
      }

      // Preparar datos para inserción
      const insertData: any = {
        usuario_id: usuario?.id,
        usuario_nombre: usuario?.nombre,
        usuario_avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || 'Usuario')}&background=667eea&color=fff`,
        titulo,
      descripcion: texto,
      tipo,
        fecha_creacion: new Date().toISOString()
      };

      console.log('📝 DATOS A INSERTAR:', insertData);

      // Asignar campos de media según tipo
      if (tipo === 'foto' && url_media) insertData.url_imagen = url_media;
      else if (tipo === 'video' && url_media) insertData.url_video = url_media;
      else if (tipo === 'gif' && url_media) insertData.url_gif = url_media;

      // Insertar en Supabase
      console.log('💾 INSERTANDO EN SUPABASE...');
      const { data, error } = await supabase
      .from('comunidad_publicaciones')
      .insert([insertData])
      .select();

      console.log('📊 RESPUESTA SUPABASE:', { data, error });

      if (error) {
        console.error('❌ ERROR SUPABASE:', error);
        throw error;
      }

    console.log('✅ PUBLICACIÓN EXITOSA');
    
    // 🔔 ENVIAR NOTIFICACIONES (SOLO SI ES ADMIN)
    if (data && data.length > 0 && usuario?.id) {
      const publicacionCreada = data[0];
      console.log('🔍 VERIFICANDO ROL DEL USUARIO...');
      
      const esAdmin = await esUsuarioAdministrador(usuario.id);
      console.log('👑 ¿Es administrador?', esAdmin);
      
      // 🚨 VERIFICACIÓN ESTRICTA - SOLO PROCEDER SI ES ADMIN
      if (!esAdmin) {
        console.log('🚫 USUARIO NO ES ADMIN - SALIENDO SIN ENVIAR NOTIFICACIONES');
        console.log('🚫 FIN DE VERIFICACIÓN - NO SE PROCESAN NOTIFICACIONES');
        // Salir inmediatamente sin procesar notificaciones
      } else {
        console.log('👑 ✅ CONFIRMADO: USUARIO ES ADMIN - PROCEDIENDO CON NOTIFICACIONES...');
        
        try {
          console.log('📤 INICIANDO ENVÍO DE NOTIFICACIONES...');
          const resultadoNotificacion = await notificarNuevaPublicacionComunidad({
            publicacion_id: publicacionCreada.id,
            titulo_publicacion: titulo || 'Nueva publicación',
            contenido: texto || 'Contenido multimedia',
            autor_id: usuario?.id || '',
            autor_nombre: usuario?.nombre || 'Usuario'
          });
          
          if (resultadoNotificacion.exito) {
            console.log(`✅ Notificaciones enviadas exitosamente: ${resultadoNotificacion.notificaciones_creadas}`);
          } else {
            console.error('❌ Error enviando notificaciones:', resultadoNotificacion.error);
          }
        } catch (errorNotificacion) {
          console.error('❌ Error inesperado enviando notificaciones:', errorNotificacion);
        }
      }
    }
    
    dispatch('publicar');
    cerrarModal();
    } catch (error: any) {
      console.error('💥 ERROR EN PUBLICACIÓN:', error);
      console.error('💥 ERROR COMPLETO:', JSON.stringify(error, null, 2));
      alert(`Error al publicar: ${error.message || error}`);
    } finally {
      // Siempre resetear estado de publicación
      publicando = false;
      publicandoMensaje = '';
    }
  };

  // Función para verificar si el usuario es administrador
  const esUsuarioAdministrador = async (userId: string): Promise<boolean> => {
    try {
      console.log('🔍 VERIFICANDO ROL PARA USUARIO ID:', userId);
      console.log('🔍 TIPO DE USUARIO ID:', typeof userId);
      
      const { data, error } = await supabase
        .from('perfiles')
        .select('rol, nombre, correo_electronico')
        .eq('id', userId)
        .single();
      
      console.log('📊 RESPUESTA COMPLETA DE BASE DE DATOS:', { data, error });
      
      if (error) {
        console.error('❌ Error verificando rol del usuario:', error);
        console.error('❌ DETALLE DEL ERROR:', JSON.stringify(error, null, 2));
        return false;
      }
      
      if (!data) {
        console.error('❌ NO SE ENCONTRÓ USUARIO CON ID:', userId);
        return false;
      }
      
      const rolUsuario = data.rol;
      console.log('👤 DATOS COMPLETOS DEL USUARIO:', data);
      console.log('👤 ROL DEL USUARIO (raw):', rolUsuario);
      console.log('👤 TIPO DEL ROL:', typeof rolUsuario);
      console.log('👤 ROL TRIMMED:', `"${rolUsuario?.trim()}"`);
      
      const esAdmin = rolUsuario === 'admin';
      console.log('🔐 COMPARACIÓN rolUsuario === "admin":', esAdmin);
      console.log('🔐 RESULTADO FINAL - ¿ES ADMIN?:', esAdmin);
      
      // Verificación adicional
      if (rolUsuario !== 'admin') {
        console.log('🚫 USUARIO NO ES ADMIN - NO SE ENVIARÁN NOTIFICACIONES');
        console.log('🚫 ROL ACTUAL:', rolUsuario, 'ESPERADO: admin');
      }
      
      return esAdmin;
    } catch (error) {
      console.error('❌ Error inesperado verificando rol:', error);
      console.error('❌ STACK TRACE:', JSON.stringify(error, null, 2));
      return false;
    }
  };
</script>

<!-- Caja inicial moderna -->
<div class="publisher-container">
  <div class="publisher-header">
    <div class="user-avatar">
      <img 
        src={'https://ui-avatars.com/api/?name=' + encodeURIComponent(usuario?.nombre || 'Usuario')} 
        alt="Avatar" 
        class="avatar-img"
      />
</div>
    
    <div class="input-section">
      <input 
        class="main-input" 
        placeholder="¿Qué quieres compartir hoy?" 
        readonly 
        on:click={() => abrirModal()}
      />
      <button 
        class="emoji-trigger"
        on:click={() => togglePicker('emoji', emojiBtn)}
        bind:this={emojiBtn}
      >
        😊
      </button>
    </div>
  </div>

  <div class="action-buttons">
    <div class="media-buttons">
      <button class="action-btn" on:click={() => abrirModal('foto')}>
        <span class="btn-icon">🖼️</span>
        <span class="btn-text">Imagen</span>
      </button>
      
      <button class="action-btn" on:click={() => abrirModal('video')}>
        <span class="btn-icon">🎥</span>
        <span class="btn-text">Video</span>
      </button>
      
      <button class="action-btn" on:click={() => { showModal = true; mostrarModalEncuesta = true; }}>
        <span class="btn-icon">📊</span>
        <span class="btn-text">Encuesta</span>
      </button>
      
      <button class="action-btn privacy-action-btn">
        <span class="btn-icon">🌐</span>
    </button>
    </div>
  </div>
</div>

<!-- Modal moderno y responsivo -->
{#if showModal}
  <div class="modal-overlay" on:click|self={cerrarModal}>
    <div class="modal-container">
      <!-- Header del modal -->
      <div class="modal-header">
        <h2 class="modal-title">Crear publicación</h2>
        <button class="modal-close" on:click={cerrarModal}>
          <svg viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
  </div>

      <!-- Info del usuario -->
      <div class="user-info">
        <img 
          src={'https://ui-avatars.com/api/?name=' + encodeURIComponent(usuario?.nombre || 'Usuario')} 
          alt="Avatar"
          class="user-avatar-large"
        />
        <div class="user-details">
          <div class="user-name">{usuario?.nombre || 'Usuario'}</div>
          <div class="privacy-indicator">
            <span class="privacy-badge">🌐 Público</span>
      </div>
    </div>
  </div>

      <!-- Formulario principal -->
      <form class="modal-form" on:submit|preventDefault={publicar}>
        <!-- Preview de GIF seleccionado -->
    {#if gifSeleccionado}
          <div class="gif-preview">
            <img src={gifSeleccionado} alt="GIF seleccionado" class="gif-image" />
            <button 
              type="button" 
              class="remove-btn"
              on:click={() => gifSeleccionado = null}
            >
              ×
            </button>
      </div>
    {/if}

        <!-- Área de texto -->
        {#if tipo === 'texto'}
      <textarea
            class="content-textarea"
        bind:value={texto}
            placeholder="¿Qué quieres compartir?"
      ></textarea>
    {/if}

        <!-- Sección de imagen -->
    {#if tipo === 'foto'}
          <div class="file-upload-area">
    {#if !fotoFile}
              <label class="upload-trigger">
                <div class="upload-icon">📷</div>
                <div class="upload-text">
                  <div class="upload-title">Agregar fotos</div>
                  <div class="upload-subtitle">o arrastra y suelta</div>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  class="file-input"
                  on:change={(e) => handleFileChange(e, 'foto')}
                />
      </label>
    {:else}
              <div class="file-preview">
                <img src={fotoPreview} alt="Preview" class="preview-image" />
                <div class="file-info">
                  <div class="file-name">{fotoFile.name}</div>
                  <button 
                    type="button" 
                    class="remove-file-btn"
                    on:click={() => removeFile('foto')}
                  >
                    Quitar
                  </button>
                </div>
      </div>
    {/if}
  </div>
          
          <textarea
            class="content-textarea compact"
            bind:value={texto}
            placeholder="Agrega un comentario..."
          ></textarea>
{/if}

        <!-- Sección de video -->
{#if tipo === 'video'}
          <div class="file-upload-area">
    {#if !videoFile}
              <label class="upload-trigger">
                <div class="upload-icon">🎥</div>
                <div class="upload-text">
                  <div class="upload-title">Agregar videos</div>
                  <div class="upload-subtitle">o arrastra y suelta</div>
                </div>
                <input 
                  type="file" 
                  accept="video/*" 
                  class="file-input"
                  on:change={(e) => handleFileChange(e, 'video')}
                />
      </label>
    {:else}
              <div class="file-preview">
                <div class="video-icon">🎥</div>
                <div class="file-info">
                  <div class="file-name">{videoFile.name}</div>
                  <button 
                    type="button" 
                    class="remove-file-btn"
                    on:click={() => removeFile('video')}
                  >
                    Quitar
                  </button>
                </div>
      </div>
    {/if}
  </div>
          
          <textarea
            class="content-textarea compact"
            bind:value={texto}
            placeholder="Agrega un comentario..."
          ></textarea>
{/if}



        <!-- Barra de herramientas -->
        <div class="toolbar">
          <div class="tool-buttons">
            <button type="button" class="tool-btn" on:click={() => tipo = 'foto'}>📷</button>
            <button type="button" class="tool-btn" on:click={() => tipo = 'video'}>🎥</button>
            
            <div class="tool-btn-container">
              <button 
                type="button" 
                class="tool-btn gif-btn"
                bind:this={gifPickerBtn}
                on:click={() => togglePicker('gif', gifPickerBtn)}
              >
                🖼️ <span class="gif-text">GIF</span>
              </button>
              
    <GifPicker
      apiKey={GIPHY_KEY}
      show={showGifPicker}
                top={0}
                left={0}
                onSelect={selectGif}
      onClose={() => showGifPicker = false}
    />
  </div>
            
            <button 
              type="button" 
              class="tool-btn"
              on:click={() => mostrarModalEncuesta = true}
            >
              📊
            </button>
            
            <button 
              type="button" 
              class="tool-btn"
              bind:this={emojiBtn}
              on:click={() => togglePicker('emoji', emojiBtn)}
            >
              😊
            </button>
          </div>

          <button 
            type="submit" 
            class="publish-btn"
            class:publicando
            disabled={publicando}
          >
            {#if publicando}
              <div class="loading-spinner"></div>
              <span>{publicandoMensaje}</span>
            {:else}
              Publicar
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<!-- Componentes auxiliares -->
<EmojiPicker
  show={showEmojiPicker}
  top={0}
  left={0}
  emojiSearch=""
  filteredEmojis={[]}
  selectEmoji={selectEmoji}
  onClose={() => showEmojiPicker = false}
/>

{#if mostrarModalEncuesta}
  <CrearEncuesta
    on:guardarEncuesta={handleGuardarEncuesta}
    on:cancelar={handleCancelarEncuesta}
/>
{/if}

<style>
  /* Contenedor principal */
  .publisher-container {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 20px;
    transition: all 0.3s ease;
  }

  .publisher-container:hover {
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }

  /* Header con avatar e input */
  .publisher-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 16px;
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 3px solid #f1f5f9;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  }

  .avatar-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .input-section {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .main-input {
    flex: 1;
    background: #f1f5f9;
    border: 2px solid transparent;
    border-radius: 25px;
    padding: 14px 20px;
    font-size: 16px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .main-input:hover {
    background: #e2e8f0;
    border-color: #cbd5e1;
  }

  .emoji-trigger {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #f1f5f9;
    border: none;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .emoji-trigger:hover {
    background: #e2e8f0;
    transform: scale(1.1);
  }

  /* Botones de acción */
  .action-buttons {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .media-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr auto;
    gap: 8px;
    width: 100%;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 12px 8px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    min-height: 54px;
    position: relative;
    overflow: hidden;
  }

  .action-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }

  .action-btn:hover::before {
    opacity: 1;
  }

  .action-btn:hover {
    border-color: #cbd5e1;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .action-btn > * {
    position: relative;
    z-index: 1;
  }

  .btn-icon {
    font-size: 20px;
    flex-shrink: 0;
    margin-bottom: 2px;
  }

  .btn-text {
    font-weight: 600;
    font-size: 11px;
    text-align: center;
    line-height: 1.2;
  }

  .privacy-action-btn {
    background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
    border-color: #cbd5e1;
    padding: 8px;
    min-height: 54px;
    max-width: 54px;
    flex-shrink: 0;
  }

  .privacy-action-btn .btn-icon {
    font-size: 18px;
    margin-bottom: 0;
  }

  .privacy-action-btn:hover {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }

  .dropdown-icon-small {
    width: 14px;
    height: 14px;
    fill: currentColor;
    flex-shrink: 0;
    margin-left: 2px;
  }

  .privacy-btn {
    display: none; /* Ocultamos el botón original */
  }

  .dropdown-icon {
    display: none; /* Ocultamos el ícono original */
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 20px;
  }

  .modal-container {
    background: white;
    border-radius: 20px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
  }

  .modal-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #f1f5f9;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal-close:hover {
    background: #e2e8f0;
    transform: scale(1.1);
  }

  .modal-close svg {
    width: 18px;
    height: 18px;
    stroke: #64748b;
    stroke-width: 2;
    fill: none;
  }

  /* Info del usuario en modal */
  .user-info {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
  }

  .user-avatar-large {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #f1f5f9;
  }

  .user-details {
    flex: 1;
  }

  .user-name {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }

  .privacy-indicator {
    display: flex;
    align-items: center;
  }

  .privacy-badge {
    background: #f1f5f9;
    color: #64748b;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid #e2e8f0;
  }

  /* Formulario */
  .modal-form {
    padding: 0 24px 24px;
    max-height: 60vh;
    overflow-y: auto;
  }

  .content-textarea {
    width: 100%;
    min-height: 120px;
    max-height: 300px;
    padding: 16px 0;
    border: none;
    outline: none;
    font-size: 18px;
    line-height: 1.5;
    color: #1e293b;
    resize: none;
    font-family: inherit;
  }

  .content-textarea.compact {
    min-height: 80px;
  }

  .content-textarea::placeholder {
    color: #94a3b8;
  }

  /* Área de subida de archivos */
  .file-upload-area {
    background: #f8fafc;
    border: 2px dashed #cbd5e1;
    border-radius: 16px;
    padding: 40px 20px;
    margin: 16px 0;
    transition: all 0.3s ease;
  }

  .file-upload-area:hover {
    border-color: #94a3b8;
    background: #f1f5f9;
  }

  .upload-trigger {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
  }

  .upload-icon {
    width: 64px;
    height: 64px;
    background: #e2e8f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    margin-bottom: 16px;
    transition: all 0.3s ease;
  }

  .upload-trigger:hover .upload-icon {
    background: #cbd5e1;
    transform: scale(1.05);
  }

  .upload-text {
    text-align: center;
  }

  .upload-title {
    font-size: 16px;
    font-weight: 600;
    color: #475569;
    margin-bottom: 4px;
  }

  .upload-subtitle {
    font-size: 14px;
    color: #94a3b8;
  }

  .file-input {
    display: none;
  }

  /* Preview de archivos */
  .file-preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .preview-image {
    max-height: 200px;
    max-width: 100%;
    border-radius: 12px;
    object-fit: cover;
  }

  .video-icon {
    font-size: 48px;
    margin-bottom: 8px;
  }

  .file-info {
    text-align: center;
  }

  .file-name {
    font-size: 14px;
    color: #64748b;
    margin-bottom: 8px;
  }

  .remove-file-btn {
    background: #fee2e2;
    color: #dc2626;
    border: none;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .remove-file-btn:hover {
    background: #fecaca;
  }

  /* Preview de GIF */
  .gif-preview {
    position: relative;
    display: inline-block;
    margin-bottom: 16px;
  }

  .gif-image {
    max-width: 300px;
    max-height: 200px;
    border-radius: 12px;
    object-fit: cover;
  }

  .remove-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: bold;
    color: #64748b;
    transition: all 0.3s ease;
  }

  .remove-btn:hover {
    background: white;
    color: #dc2626;
  }

  /* Sección de encuesta */
  .survey-section {
    margin: 20px 0;
  }

  .form-group {
    margin-bottom: 20px;
  }

  .form-label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .form-input {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .form-select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    font-size: 14px;
    background: white;
  }

  .option-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .option-row .form-input {
    flex: 1;
  }

  .remove-option-btn {
    width: 32px;
    height: 32px;
    background: #fee2e2;
    color: #dc2626;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  .remove-option-btn:hover {
    background: #fecaca;
  }

  .add-option-btn {
    background: #f3f4f6;
    color: #374151;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .add-option-btn:hover {
    background: #e5e7eb;
  }

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .checkbox-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
  }

  .checkbox-item input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: #3b82f6;
  }

  /* Barra de herramientas */
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    margin-top: 20px;
  }

  .tool-buttons {
    display: flex;
    gap: 8px;
  }

  .tool-btn {
    width: 40px;
    height: 40px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .tool-btn:hover {
    background: #f1f5f9;
    transform: translateY(-1px);
  }

  .tool-btn-container {
    position: relative;
  }

  .gif-btn {
    width: auto;
    padding: 0 12px;
    gap: 4px;
  }

  .gif-text {
    font-size: 10px;
    font-weight: 600;
  }

  .publish-btn {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
  }

  .publish-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(59, 130, 246, 0.4);
  }

  .publish-btn:active {
    transform: translateY(0);
  }

  .publish-btn:disabled,
  .publish-btn.publicando {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
    cursor: not-allowed;
    transform: none;
    box-shadow: 0 2px 8px rgba(148, 163, 184, 0.2);
  }

  .publish-btn.publicando {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid #ffffff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .publisher-container {
      padding: 18px;
      border-radius: 14px;
      margin-bottom: 18px;
    }

    .publisher-header {
      gap: 14px;
      margin-bottom: 18px;
    }

    .user-avatar {
      width: 44px;
      height: 44px;
      border-width: 2px;
    }

    .main-input {
      font-size: 15px;
      padding: 14px 18px;
      border-radius: 22px;
    }

    .emoji-trigger {
      width: 44px;
      height: 44px;
      font-size: 18px;
    }

    .action-buttons {
      gap: 0;
    }

    .media-buttons {
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 10px;
      width: 100%;
    }

    .action-btn {
      padding: 14px 8px;
      min-height: 58px;
      border-radius: 14px;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
    }

    .btn-icon {
      font-size: 22px;
      margin-bottom: 3px;
    }

    .btn-text {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .privacy-action-btn {
      grid-column: span 1;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      border-color: #a5b4fc;
      color: #4338ca;
      max-width: 58px;
      padding: 10px 8px;
    }

    .privacy-action-btn .btn-icon {
      font-size: 20px;
      margin-bottom: 0;
    }

    .privacy-action-btn:hover {
      background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
      border-color: #8b5cf6;
    }

    .dropdown-icon-small {
      width: 16px;
      height: 16px;
      margin-left: 4px;
    }

    .modal-overlay {
      padding: 12px;
    }

    .modal-container {
      max-height: 95vh;
      border-radius: 18px;
    }

    .modal-header {
      padding: 18px 22px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
    }

    .user-info {
      padding: 18px 22px;
    }

    .user-avatar-large {
      width: 50px;
      height: 50px;
    }

    .modal-form {
      padding: 0 22px 22px;
    }

    .content-textarea {
      font-size: 16px;
      padding: 18px 0;
    }

    .file-upload-area {
      padding: 32px 18px;
      border-radius: 14px;
    }

    .upload-icon {
      width: 52px;
      height: 52px;
      font-size: 22px;
      margin-bottom: 14px;
    }

    .toolbar {
      flex-direction: column;
      gap: 18px;
      align-items: stretch;
      padding-top: 22px;
    }

    .tool-buttons {
      justify-content: center;
      gap: 12px;
    }

    .tool-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      font-size: 20px;
    }

    .publish-btn {
      width: 100%;
      padding: 16px;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 700;
      box-shadow: 0 6px 24px rgba(59, 130, 246, 0.35);
    }

    .publish-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.45);
    }

    .publish-btn:disabled:hover,
    .publish-btn.publicando:hover {
      transform: none;
      box-shadow: 0 2px 8px rgba(148, 163, 184, 0.2);
    }
  }

  @media (max-width: 480px) {
    .publisher-container {
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 12px;
    }

    .publisher-header {
      gap: 12px;
      margin-bottom: 16px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
    }

    .main-input {
      font-size: 14px;
      padding: 12px 16px;
    }

    .emoji-trigger {
      width: 40px;
      height: 40px;
      font-size: 16px;
    }

    .media-buttons {
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 8px;
    }

    .action-btn {
      padding: 12px 6px;
      min-height: 52px;
      border-radius: 12px;
    }

    .btn-icon {
      font-size: 20px;
      margin-bottom: 2px;
    }

    .btn-text {
      font-size: 10px;
      font-weight: 800;
    }

    .privacy-action-btn {
      padding: 10px 6px;
      max-width: 52px;
    }

    .privacy-action-btn .btn-icon {
      font-size: 18px;
      margin-bottom: 0;
    }

    .modal-header {
      padding: 16px 18px;
    }

    .user-info {
      padding: 16px 18px;
    }

    .modal-form {
      padding: 0 18px 18px;
    }

    .file-upload-area {
      padding: 28px 16px;
    }

    .upload-icon {
      width: 48px;
      height: 48px;
      font-size: 20px;
    }

    .toolbar {
      gap: 16px;
      padding-top: 20px;
    }

    .tool-buttons {
      gap: 10px;
    }

    .tool-btn {
      width: 40px;
      height: 40px;
      font-size: 18px;
    }

    .publish-btn {
      padding: 14px;
      font-size: 15px;
    }
  }

  /* Mejoras adicionales para tablets */
  @media (min-width: 481px) and (max-width: 768px) {
    .media-buttons {
      grid-template-columns: 1fr 1fr 1fr auto;
      gap: 12px;
    }

    .privacy-action-btn {
      grid-column: span 1;
      background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
      border-color: #cbd5e1;
      color: #64748b;
      max-width: 54px;
      padding: 10px 8px;
    }

    .privacy-action-btn:hover {
      background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    }

    .action-btn {
      min-height: 54px;
      padding: 12px 8px;
    }

    .btn-icon {
      font-size: 20px;
      margin-bottom: 2px;
    }

    .btn-text {
      font-size: 11px;
    }

    .privacy-action-btn .btn-icon {
      font-size: 20px;
      margin-bottom: 0;
    }
  }
</style>
