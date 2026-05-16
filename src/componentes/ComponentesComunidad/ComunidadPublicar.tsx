import React from 'react';
import { useComunidadPublicar } from './Hooks/useComunidadPublicar';
import type { Usuario } from '../../Paginas/Comunidad/tipos';
import './ComunidadPublicar.css';

interface ComunidadPublicarProps {
  usuario: Usuario | null;
  onPublicar?: () => void;
}

const ComunidadPublicar: React.FC<ComunidadPublicarProps> = ({ usuario, onPublicar }) => {
  const {
    showModal, tipo, texto, titulo, publicando, publicandoMensaje, errorPublicar,
    fotoFile, fotoPreview, videoFile, gifSeleccionado,
    emojiBtnRef, gifPickerBtnRef,
    setTexto, setTitulo, setTipo, setShowModal,
    handleFileChange, removeFile, abrirModal, cerrarModal,
    togglePicker, publicar,
  } = useComunidadPublicar(usuario, onPublicar);

  return (
    <>
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

            <button className="comunidad-publicar-btn-accion" onClick={() => setShowModal(true)}>
              <span className="comunidad-publicar-icono-btn">📊</span>
              <span className="comunidad-publicar-texto-btn">Encuesta</span>
            </button>

            <button className="comunidad-publicar-btn-accion comunidad-publicar-btn-privacidad">
              <span className="comunidad-publicar-icono-btn">🌐</span>
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="comunidad-publicar-modal-overlay" onClick={cerrarModal}>
          <div className="comunidad-publicar-modal-contenedor" onClick={(e) => e.stopPropagation()}>
            <div className="comunidad-publicar-modal-header">
              <h2 className="comunidad-publicar-modal-titulo">Crear publicación</h2>
              <button className="comunidad-publicar-modal-cerrar" onClick={cerrarModal}>
                <svg viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

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

            <form className="comunidad-publicar-modal-formulario" onSubmit={(e) => { e.preventDefault(); publicar(); }}>
              {gifSeleccionado && (
                <div className="comunidad-publicar-preview-gif">
                  <img src={gifSeleccionado} alt="GIF seleccionado" className="comunidad-publicar-imagen-gif" />
                  <button
                    type="button"
                    className="comunidad-publicar-btn-remover"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                </div>
              )}

              {tipo === 'texto' && (
                <textarea
                  className="comunidad-publicar-textarea-contenido"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="¿Qué quieres compartir?"
                />
              )}

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
              {errorPublicar && <p style={{ color: '#e53e3e', fontSize: '0.875rem', marginTop: '0.5rem' }}>{errorPublicar}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default ComunidadPublicar;
