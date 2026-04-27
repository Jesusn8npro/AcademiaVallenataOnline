import React from 'react';
import { useBlogAdminManager } from './useBlogAdminManager';
import { IconPlus, IconCalendar, IconUser, IconEye, IconEdit, IconTrash } from './BlogIcons';
import FormularioBlogAdmin from './FormularioBlogAdmin';
import './BlogAdminManager.css';

export default function BlogAdminManager() {
  const {
    articulos, estadoCarga, mostrandoFormulario, editandoId, eliminandoId,
    articuloParaEliminar, archivoParaSubir, urlPrevisualizacion, estadoSubida,
    formulario, setFormulario,
    iniciarNuevoArticulo, iniciarEdicion, cancelarFormulario, guardarArticulo,
    pedirConfirmacionEliminar, confirmarEliminar, cancelarEliminar,
    manejarSeleccionArchivo, limpiarSeleccionArchivo
  } = useBlogAdminManager();

  return (
    <div className="gestor-blog">
      <header className="encabezado-gestor">
        <h1>Administración de Blog</h1>
        <button className="boton-primario" onClick={iniciarNuevoArticulo}>
          <IconPlus />
          <span>Nuevo Artículo</span>
        </button>
      </header>

      {estadoCarga.error && <div className="notificacion error">{estadoCarga.error}</div>}
      {estadoCarga.exito && <div className="notificacion exito">{estadoCarga.exito}</div>}

      {articuloParaEliminar && (
        <div className="confirmacion-overlay">
          <div className="confirmacion-dialogo">
            <p>¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.</p>
            <div className="confirmacion-botones">
              <button className="boton-confirmar-eliminar" onClick={confirmarEliminar}>Eliminar</button>
              <button className="boton-cancelar-eliminar" onClick={cancelarEliminar}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {mostrandoFormulario && (
        <FormularioBlogAdmin
          formulario={formulario}
          setFormulario={setFormulario}
          estadoCarga={estadoCarga}
          estadoSubida={estadoSubida}
          editandoId={editandoId}
          archivoParaSubir={archivoParaSubir}
          urlPrevisualizacion={urlPrevisualizacion}
          onGuardar={guardarArticulo}
          onCancelar={cancelarFormulario}
          onSeleccionArchivo={manejarSeleccionArchivo}
          onLimpiarArchivo={limpiarSeleccionArchivo}
        />
      )}

      <section className="grid-articulos">
        {estadoCarga.cargando && articulos.length === 0 ? (
          <div className="estado-general">Cargando artículos...</div>
        ) : articulos.length === 0 ? (
          <div className="estado-general">
            <h3>No hay artículos todavía</h3>
            <p>¡Crea tu primer artículo para empezar a compartir tu conocimiento!</p>
          </div>
        ) : (
          articulos.map((articulo) => (
            <div key={articulo.id} className="tarjeta-articulo">
              <img
                src={articulo.imagen_url || 'https://placehold.co/600x400/13b67a/ffffff?text=Academia'}
                alt={`Imagen de ${articulo.titulo}`}
                className="imagen-tarjeta"
              />
              <div className="contenido-tarjeta">
                <span className={`estado-etiqueta ${articulo.estado}`}>{articulo.estado}</span>
                <h3>{articulo.titulo}</h3>
                <p className="resumen-tarjeta">{articulo.resumen?.substring(0, 100) || 'Sin resumen...'}...</p>
                <div className="meta-tarjeta">
                  <span><IconCalendar style={{ marginRight: 6 }} />{new Date(articulo.creado_en).toLocaleDateString('es-ES')}</span>
                  <span><IconUser style={{ marginRight: 6 }} />{articulo.autor || 'Admin'}</span>
                </div>
                <div className="acciones-tarjeta">
                  <button className="accion-ver" title="Ver" onClick={() => window.open(`/blog/${articulo.slug}`, '_blank')}>
                    <IconEye />
                  </button>
                  <button className="accion-editar" title="Editar" onClick={() => iniciarEdicion(articulo)}>
                    <IconEdit />
                  </button>
                  <button
                    className={`accion-eliminar ${eliminandoId === articulo.id ? 'eliminando' : ''}`}
                    title="Eliminar"
                    disabled={eliminandoId === articulo.id}
                    onClick={() => pedirConfirmacionEliminar(articulo.id)}
                  >
                    {eliminandoId === articulo.id ? <div className="spinner-pequeno"></div> : <IconTrash />}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
