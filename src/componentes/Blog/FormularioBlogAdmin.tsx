import React from 'react';
import EditorQuill from './EditorQuill';
import { IconPlus, IconDoc, IconImage, IconText, IconEdit, IconCloudUpload } from './BlogIcons';
import type { FormularioArticulo, EstadoCarga, EstadoSubida } from './useBlogAdminManager';

interface Props {
  formulario: FormularioArticulo;
  setFormulario: React.Dispatch<React.SetStateAction<FormularioArticulo>>;
  estadoCarga: EstadoCarga;
  estadoSubida: EstadoSubida;
  editandoId: string | null;
  archivoParaSubir: File | null;
  urlPrevisualizacion: string | null;
  onGuardar: () => void;
  onCancelar: () => void;
  onSeleccionArchivo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLimpiarArchivo: () => void;
}

export default function FormularioBlogAdmin({
  formulario, setFormulario, estadoCarga, estadoSubida,
  editandoId, archivoParaSubir, urlPrevisualizacion,
  onGuardar, onCancelar, onSeleccionArchivo, onLimpiarArchivo
}: Props) {
  return (
    <div className="contenedor-formulario-moderno">
      <div className="header-moderno">
        <div className="info-header">
          <h2 className="titulo-principal">
            {editandoId ? (
              <><IconEdit />Editando Artículo</>
            ) : (
              <><IconPlus />Crear Nuevo Artículo</>
            )}
          </h2>
          <p className="subtitulo">
            Completa la información para {editandoId ? 'actualizar' : 'crear'} tu artículo
          </p>
        </div>
        <button type="button" className="btn-cerrar" onClick={onCancelar}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); onGuardar(); }} className="formulario-elegante">
        <div className="grid-moderno">
          <div className="col-info">
            <div className="seccion-card">
              <div className="titulo-seccion"><IconDoc /><span>Información Básica</span></div>
              <div className="campos-container">
                <div className="campo-moderno">
                  <label htmlFor="titulo" className="label-elegante">Título del Artículo</label>
                  <input id="titulo" type="text" value={formulario.titulo}
                    onChange={(e) => setFormulario(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Escribe un título atractivo..." required className="input-elegante" />
                </div>
                <div className="campo-moderno">
                  <label htmlFor="estado" className="label-elegante">Estado de Publicación</label>
                  <div className="select-container">
                    <select id="estado" value={formulario.estado}
                      onChange={(e) => setFormulario(prev => ({ ...prev, estado: e.target.value as 'borrador' | 'publicado' }))}
                      className="select-elegante">
                      <option value="borrador">Borrador</option>
                      <option value="publicado">Publicado</option>
                    </select>
                  </div>
                </div>
                <div className="campo-moderno">
                  <label htmlFor="resumen" className="label-elegante">Resumen del Artículo</label>
                  <textarea id="resumen" value={formulario.resumen}
                    onChange={(e) => setFormulario(prev => ({ ...prev, resumen: e.target.value }))}
                    placeholder="Escribe un resumen que enganche a tus lectores..." rows={4} className="textarea-elegante" />
                  <small className="ayuda-texto">Recomendado: máximo 160 caracteres para SEO</small>
                </div>
              </div>
            </div>

            <div className="seccion-card">
              <div className="titulo-seccion"><IconImage /><span>Imagen Destacada</span></div>
              <div className="campos-container">
                <div className="upload-zone">
                  <label htmlFor="imagen_archivo" className="zona-subida">
                    <div className="contenido-subida">
                      <IconCloudUpload className="icono-subida" />
                      <div className="texto-subida">
                        <span className="titulo-subida">Arrastra tu imagen aquí</span>
                        <span className="subtitulo-subida">o haz clic para seleccionar</span>
                      </div>
                    </div>
                  </label>
                  <input id="imagen_archivo" type="file" accept="image/*" onChange={onSeleccionArchivo} className="input-oculto" />
                  <div className="separador-elegante"><span>O</span></div>
                  <input type="url" value={formulario.imagen_url}
                    onChange={(e) => setFormulario(prev => ({ ...prev, imagen_url: e.target.value }))}
                    placeholder="Pega la URL de tu imagen" disabled={!!archivoParaSubir} className="input-elegante url-input" />
                </div>

                {(urlPrevisualizacion || formulario.imagen_url) && (
                  <div className="preview-elegante">
                    <div className="imagen-preview">
                      <img src={urlPrevisualizacion || formulario.imagen_url} alt="Preview" />
                      <div className="overlay-preview">
                        <span className="estado-preview">{archivoParaSubir ? '📁 Archivo local' : '🌐 URL externa'}</span>
                      </div>
                      {archivoParaSubir && (
                        <button type="button" className="btn-quitar" onClick={onLimpiarArchivo}>
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {estadoSubida.subiendo && (
                  <div className="progreso-elegante">
                    <div className="header-progreso">
                      <span className="texto-progreso">Subiendo imagen...</span>
                      <span className="porcentaje-progreso">{estadoSubida.progreso}%</span>
                    </div>
                    <div className="barra-container">
                      <div className="barra-progreso" style={{ width: `${estadoSubida.progreso}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-editor">
            <div className="seccion-card editor-card">
              <div className="titulo-seccion"><IconText /><span>Contenido del Artículo</span></div>
              <div className="editor-wrapper">
                <EditorQuill
                  value={formulario.contenido}
                  onChange={(value) => setFormulario(prev => ({ ...prev, contenido: value }))}
                  placeholder="Escribe el contenido de tu artículo aquí..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="footer-moderno">
          <div className="botones-footer">
            <button type="button" className="btn-cancelar-elegante" onClick={onCancelar} disabled={estadoCarga.cargando}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              <span>Cancelar</span>
            </button>
            <button type="submit" className="btn-guardar-elegante" disabled={estadoCarga.cargando || estadoSubida.subiendo}>
              {estadoCarga.cargando || estadoSubida.subiendo ? (
                <><div className="spinner-elegante"></div><span>{estadoSubida.subiendo ? 'Subiendo...' : 'Guardando...'}</span></>
              ) : (
                <>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span>{editandoId ? 'Actualizar Artículo' : 'Crear Artículo'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
