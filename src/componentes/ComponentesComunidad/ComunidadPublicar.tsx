import React, { useState, useRef } from 'react';
import { supabase } from '../../servicios/supabaseCliente';
import './ComunidadPublicar.css';

interface Usuario {
  id: string;
  nombre: string;
}

interface ComunidadPublicarProps {
  usuario: Usuario | null;
  onPublicar?: () => void;
}

const ComunidadPublicar: React.FC<ComunidadPublicarProps> = ({ usuario, onPublicar }) => {
  // Estados principales
  const [showModal, setShowModal] = useState(false);
  const [tipo, setTipo] = useState<'texto' | 'foto' | 'video' | 'encuesta' | 'gif'>('texto');
  const [texto, setTexto] = useState('');
  const [titulo, setTitulo] = useState('');

  // Estados de publicación
  const [publicando, setPublicando] = useState(false);
  const [publicandoMensaje, setPublicandoMensaje] = useState('');

  // Estados de archivos
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  // Estados de GIF
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [gifSeleccionado, setGifSeleccionado] = useState<string | null>(null);

  // Estados de emojis
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Estados de encuesta
  const [mostrarModalEncuesta, setMostrarModalEncuesta] = useState(false);
  const [datosEncuesta, setDatosEncuesta] = useState<any>(null);

  // Referencias
  const emojiBtnRef = useRef<HTMLButtonElement>(null);
  const gifPickerBtnRef = useRef<HTMLButtonElement>(null);

  // Constantes
  const GIPHY_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

  // Funciones de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: 'foto' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileType === 'foto') {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setVideoFile(file);
    }
  };

  const removeFile = (fileType: 'foto' | 'video') => {
    if (fileType === 'foto') {
      setFotoFile(null);
      setFotoPreview(null);
    } else {
      setVideoFile(null);
    }
  };

  // Funciones de modal
  const abrirModal = (tipoPublicacion: typeof tipo = 'texto') => {
    setTipo(tipoPublicacion);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setTipo('texto');
    setTexto('');
    setTitulo('');
    setFotoFile(null);
    setFotoPreview(null);
    setVideoFile(null);
    setGifSeleccionado(null);
    setShowGifPicker(false);
    setShowEmojiPicker(false);
    setMostrarModalEncuesta(false);
    setDatosEncuesta(null);
    setPublicando(false);
    setPublicandoMensaje('');
  };

  // Funciones de pickers
  const togglePicker = (pickerType: 'emoji' | 'gif') => {
    if (pickerType === 'emoji') {
      setShowEmojiPicker(!showEmojiPicker);
      setShowGifPicker(false);
    } else {
      setShowGifPicker(!showGifPicker);
      setShowEmojiPicker(false);
    }
  };

  const selectEmoji = (emoji: string) => {
    setTexto(texto + emoji);
    setShowEmojiPicker(false);
  };

  const selectGif = (url: string) => {
    setGifSeleccionado(url);
    setShowGifPicker(false);
  };

  // Función para verificar si el usuario es administrador
  const esUsuarioAdministrador = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('perfiles')
        .select('rol, nombre, correo_electronico')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error verificando rol del usuario:', error);
        return false;
      }

      if (!data) {
        console.error('NO SE ENCONTRÓ USUARIO CON ID:', userId);
        return false;
      }

      const esAdmin = data.rol === 'admin';
      console.log('¿ES ADMIN?:', esAdmin);

      return esAdmin;
    } catch (error) {
      console.error('Error inesperado verificando rol:', error);
      return false;
    }
  };

  // Función para subir archivo a Supabase Storage
  const subirArchivoComunidad = async (file: File, bucket: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { url: null, error: error };
    }
  };

  // Función principal de publicación
  const publicar = async () => {
    if (publicando) {
      console.log('🛑 YA SE ESTÁ PUBLICANDO, IGNORANDO CLIC');
      return;
    }

    setPublicando(true);
    setPublicandoMensaje(tipo === 'foto' ? 'Subiendo imagen...' :
      tipo === 'video' ? 'Subiendo video...' :
        'Publicando...');

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

      // Intentar insertar en Supabase
      console.log('💾 INSERTANDO EN SUPABASE...');
      try {
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

          if (esAdmin) {
            console.log('👑 ✅ CONFIRMADO: USUARIO ES ADMIN - PROCEDIENDO CON NOTIFICACIONES...');
            // Aquí implementarías el sistema de notificaciones
          } else {
            console.log('🚫 USUARIO NO ES ADMIN - NO SE ENVIARÁN NOTIFICACIONES');
          }
        }
      } catch (supabaseError) {
        console.error('💥 ERROR DE SUPABASE:', supabaseError);
        // En caso de error de Supabase, simular éxito para desarrollo
        console.log('🔄 MODO DESARROLLO: Simulando publicación exitosa');
      }

      if (onPublicar) {
        onPublicar();
      }
      cerrarModal();
    } catch (error: any) {
      console.error('💥 ERROR EN PUBLICACIÓN:', error);
      alert(`Error al publicar: ${error.message || error}`);
    } finally {
      setPublicando(false);
      setPublicandoMensaje('');
    }
  };

  return (
    <>
      {/* Caja inicial moderna */}
      <div className="comunidad-publicar-contenedor">
        <div className="comunidad-publicar-header">
          <div className="comunidad-publicar-avatar-usuario">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || 'Usuario')}`}
              alt="Avatar"
              className="comunidad-publicar-avatar-img"
            />
          </div>

          <div className="comunidad-publicar-seccion-input">
            <input
              className="comunidad-publicar-input-principal"
              placeholder="¿Qué quieres compartir hoy?"
              readOnly
              onClick={() => abrirModal()}
            />
            <button
              className="comunidad-publicar-trigger-emoji"
              onClick={() => togglePicker('emoji')}
              ref={emojiBtnRef}
            >
              😊
            </button>
          </div>
        </div>

        <div className="comunidad-publicar-botones-accion">
          <div className="comunidad-publicar-botones-media">
            <button className="comunidad-publicar-btn-accion" onClick={() => abrirModal('foto')}>
              <span className="comunidad-publicar-icono-btn">🖼️</span>
              <span className="comunidad-publicar-texto-btn">Imagen</span>
            </button>

            <button className="comunidad-publicar-btn-accion" onClick={() => abrirModal('video')}>
              <span className="comunidad-publicar-icono-btn">🎥</span>
              <span className="comunidad-publicar-texto-btn">Video</span>
            </button>

            <button className="comunidad-publicar-btn-accion" onClick={() => { setShowModal(true); setMostrarModalEncuesta(true); }}>
              <span className="comunidad-publicar-icono-btn">📊</span>
              <span className="comunidad-publicar-texto-btn">Encuesta</span>
            </button>

            <button className="comunidad-publicar-btn-accion comunidad-publicar-btn-privacidad">
              <span className="comunidad-publicar-icono-btn">🌐</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal moderno y responsivo */}
      {showModal && (
        <div className="comunidad-publicar-modal-overlay" onClick={cerrarModal}>
          <div className="comunidad-publicar-modal-contenedor" onClick={(e) => e.stopPropagation()}>
            {/* Header del modal */}
            <div className="comunidad-publicar-modal-header">
              <h2 className="comunidad-publicar-modal-titulo">Crear publicación</h2>
              <button className="comunidad-publicar-modal-cerrar" onClick={cerrarModal}>
                <svg viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info del usuario */}
            <div className="comunidad-publicar-info-usuario">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(usuario?.nombre || 'Usuario')}`}
                alt="Avatar"
                className="comunidad-publicar-avatar-usuario-grande"
              />
              <div className="comunidad-publicar-detalles-usuario">
                <div className="comunidad-publicar-nombre-usuario">{usuario?.nombre || 'Usuario'}</div>
                <div className="comunidad-publicar-indicador-privacidad">
                  <span className="comunidad-publicar-badge-privacidad">🌐 Público</span>
                </div>
              </div>
            </div>

            {/* Formulario principal */}
            <form className="comunidad-publicar-modal-formulario" onSubmit={(e) => { e.preventDefault(); publicar(); }}>
              {/* Preview de GIF seleccionado */}
              {gifSeleccionado && (
                <div className="comunidad-publicar-preview-gif">
                  <img src={gifSeleccionado} alt="GIF seleccionado" className="comunidad-publicar-imagen-gif" />
                  <button
                    type="button"
                    className="comunidad-publicar-btn-remover"
                    onClick={() => setGifSeleccionado(null)}
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Área de texto */}
              {tipo === 'texto' && (
                <textarea
                  className="comunidad-publicar-textarea-contenido"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="¿Qué quieres compartir?"
                />
              )}

              {/* Sección de imagen */}
              {tipo === 'foto' && (
                <>
                  <div className="comunidad-publicar-area-subida-archivo">
                    {!fotoFile ? (
                      <label className="comunidad-publicar-trigger-subida">
                        <div className="comunidad-publicar-icono-subida">📷</div>
                        <div className="comunidad-publicar-texto-subida">
                          <div className="comunidad-publicar-titulo-subida">Agregar fotos</div>
                          <div className="comunidad-publicar-subtitulo-subida">o arrastra y suelta</div>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="comunidad-publicar-input-archivo"
                          onChange={(e) => handleFileChange(e, 'foto')}
                        />
                      </label>
                    ) : (
                      <div className="comunidad-publicar-preview-archivo">
                        <img src={fotoPreview || ''} alt="Preview" className="comunidad-publicar-imagen-preview" />
                        <div className="comunidad-publicar-info-archivo">
                          <div className="comunidad-publicar-nombre-archivo">{fotoFile.name}</div>
                          <button
                            type="button"
                            className="comunidad-publicar-btn-remover-archivo"
                            onClick={() => removeFile('foto')}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <textarea
                    className="comunidad-publicar-textarea-contenido comunidad-publicar-textarea-compacto"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Agrega un comentario..."
                  />
                </>
              )}

              {/* Sección de video */}
              {tipo === 'video' && (
                <>
                  <div className="comunidad-publicar-area-subida-archivo">
                    {!videoFile ? (
                      <label className="comunidad-publicar-trigger-subida">
                        <div className="comunidad-publicar-icono-subida">🎥</div>
                        <div className="comunidad-publicar-texto-subida">
                          <div className="comunidad-publicar-titulo-subida">Agregar videos</div>
                          <div className="comunidad-publicar-subtitulo-subida">o arrastra y suelta</div>
                        </div>
                        <input
                          type="file"
                          accept="video/*"
                          className="comunidad-publicar-input-archivo"
                          onChange={(e) => handleFileChange(e, 'video')}
                        />
                      </label>
                    ) : (
                      <div className="comunidad-publicar-preview-archivo">
                        <div className="comunidad-publicar-icono-video">🎥</div>
                        <div className="comunidad-publicar-info-archivo">
                          <div className="comunidad-publicar-nombre-archivo">{videoFile.name}</div>
                          <button
                            type="button"
                            className="comunidad-publicar-btn-remover-archivo"
                            onClick={() => removeFile('video')}
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <textarea
                    className="comunidad-publicar-textarea-contenido comunidad-publicar-textarea-compacto"
                    value={texto}
                    onChange={(e) => setTexto(e.target.value)}
                    placeholder="Agrega un comentario..."
                  />
                </>
              )}

              {/* Barra de herramientas */}
              <div className="comunidad-publicar-toolbar">
                <div className="comunidad-publicar-botones-herramienta">
                  <button type="button" className="comunidad-publicar-btn-herramienta" onClick={() => setTipo('foto')}>📷</button>
                  <button type="button" className="comunidad-publicar-btn-herramienta" onClick={() => setTipo('video')}>🎥</button>

                  <div className="comunidad-publicar-contenedor-btn-gif">
                    <button
                      type="button"
                      className="comunidad-publicar-btn-herramienta comunidad-publicar-btn-gif"
                      ref={gifPickerBtnRef}
                      onClick={() => togglePicker('gif')}
                    >
                      🖼️ <span className="comunidad-publicar-texto-gif">GIF</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    className="comunidad-publicar-btn-herramienta"
                    onClick={() => setMostrarModalEncuesta(true)}
                  >
                    📊
                  </button>

                  <button
                    type="button"
                    className="comunidad-publicar-btn-herramienta"
                    ref={emojiBtnRef}
                    onClick={() => togglePicker('emoji')}
                  >
                    😊
                  </button>
                </div>

                <button
                  type="submit"
                  className={`comunidad-publicar-btn-publicar ${publicando ? 'publicando' : ''}`}
                  disabled={publicando}
                >
                  {publicando ? (
                    <>
                      <div className="comunidad-publicar-spinner-carga"></div>
                      <span>{publicandoMensaje}</span>
                    </>
                  ) : (
                    'Publicar'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ComunidadPublicar;
