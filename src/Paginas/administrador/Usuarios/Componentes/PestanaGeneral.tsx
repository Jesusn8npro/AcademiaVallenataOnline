import React from 'react';

export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  correo_electronico: string;
  rol: string;
  suscripcion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  ultima_actividad?: string;
  url_foto_perfil?: string;
  eliminado: boolean;
  whatsapp?: string;
  ciudad?: string;
  pais?: string;
  nivel_habilidad?: string;
  documento_numero?: string;
  profesion?: string;
  documento_tipo?: string;
  instrumento?: string;
  latitud?: string;
  longitud?: string;
  zona_horaria?: string;
  ip_registro?: string;
}

interface Props {
  usuario: Usuario;
  editando: boolean;
  datosEditables: Usuario;
  cargando: boolean;
  confirmandoEliminar: boolean;
  setConfirmandoEliminar: (v: boolean) => void;
  setDatosEditables: (u: Usuario) => void;
  guardarCambios: () => void;
  cancelarEdicion: () => void;
  eliminarUsuarioHandler: () => void;
}

const formatearFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

const PestanaGeneral: React.FC<Props> = ({
  usuario, editando, datosEditables, cargando,
  confirmandoEliminar, setConfirmandoEliminar,
  setDatosEditables, guardarCambios, cancelarEdicion, eliminarUsuarioHandler
}) => {
  const set = (campo: keyof Usuario, valor: string) => setDatosEditables({ ...datosEditables, [campo]: valor });

  return (
    <div className="detalle-usuario-pestana-contenido">
      <div className="detalle-usuario-seccion">
        <h3>Información Básica</h3>
        <div className="detalle-usuario-campos-grid">
          <div className="detalle-usuario-campo">
            <label>Nombre:</label>
            {editando ? <input type="text" value={datosEditables.nombre || ''} onChange={(e) => set('nombre', e.target.value)} /> : <span>{usuario.nombre || 'No especificado'}</span>}
          </div>
          <div className="detalle-usuario-campo">
            <label>Apellido:</label>
            {editando ? <input type="text" value={datosEditables.apellido || ''} onChange={(e) => set('apellido', e.target.value)} /> : <span>{usuario.apellido || 'No especificado'}</span>}
          </div>
          <div className="detalle-usuario-campo">
            <label>Correo:</label>
            {editando ? <input type="email" value={datosEditables.correo_electronico || ''} onChange={(e) => set('correo_electronico', e.target.value)} /> : <span>{usuario.correo_electronico}</span>}
          </div>
          <div className="detalle-usuario-campo">
            <label>Rol:</label>
            {editando ? (
              <select value={datosEditables.rol || ''} onChange={(e) => set('rol', e.target.value)}>
                <option value="estudiante">Estudiante</option>
                <option value="profesor">Profesor</option>
                <option value="admin">Administrador</option>
              </select>
            ) : (
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.rol}`}>{usuario.rol}</span>
            )}
          </div>
          <div className="detalle-usuario-campo">
            <label>Suscripción:</label>
            {editando ? (
              <select value={datosEditables.suscripcion || ''} onChange={(e) => set('suscripcion', e.target.value)}>
                <option value="free">Gratuita</option>
                <option value="basic">Básica</option>
                <option value="premium">Premium</option>
                <option value="pro">Profesional</option>
              </select>
            ) : (
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.suscripcion}`}>{usuario.suscripcion}</span>
            )}
          </div>
        </div>
      </div>

      <div className="detalle-usuario-seccion">
        <h3>Información Adicional</h3>
        <div className="detalle-usuario-campos-grid">
          {(['ciudad', 'pais', 'whatsapp'] as const).map((campo) => (
            <div key={campo} className="detalle-usuario-campo">
              <label>{campo.charAt(0).toUpperCase() + campo.slice(1)}:</label>
              {editando
                ? <input type={campo === 'whatsapp' ? 'tel' : 'text'} value={(datosEditables[campo] as string) || ''} onChange={(e) => set(campo, e.target.value)} />
                : <span>{(usuario[campo] as string) || 'No especificado'}</span>
              }
            </div>
          ))}
          <div className="detalle-usuario-campo">
            <label>Nivel de Habilidad:</label>
            {editando ? (
              <select value={datosEditables.nivel_habilidad || ''} onChange={(e) => set('nivel_habilidad', e.target.value)}>
                <option value="">Seleccionar...</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
                <option value="experto">Experto</option>
              </select>
            ) : <span>{usuario.nivel_habilidad || 'No especificado'}</span>}
          </div>
          <div className="detalle-usuario-campo">
            <label>Documento:</label>
            {editando ? <input type="text" value={datosEditables.documento_numero || ''} onChange={(e) => set('documento_numero', e.target.value)} /> : <span>{usuario.documento_numero || 'No especificado'}</span>}
          </div>
          <div className="detalle-usuario-campo">
            <label>Profesión:</label>
            {editando ? <input type="text" value={datosEditables.profesion || ''} onChange={(e) => set('profesion', e.target.value)} /> : <span>{usuario.profesion || 'No especificado'}</span>}
          </div>
        </div>
      </div>

      <div className="detalle-usuario-seccion">
        <h3>Fechas Importantes</h3>
        <div className="detalle-usuario-campos-grid">
          <div className="detalle-usuario-campo">
            <label>Fecha de Registro:</label>
            <span>{formatearFecha(usuario.fecha_creacion)}</span>
          </div>
          <div className="detalle-usuario-campo">
            <label>Última Actualización:</label>
            <span>{formatearFecha(usuario.fecha_actualizacion)}</span>
          </div>
        </div>
      </div>

      {editando ? (
        <div className="detalle-usuario-acciones-edicion">
          <button className="detalle-usuario-btn-cancelar" onClick={cancelarEdicion} disabled={cargando}>Cancelar</button>
          <button className="detalle-usuario-btn-guardar" onClick={guardarCambios} disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      ) : (
        <div className="detalle-usuario-acciones-usuario">
          {confirmandoEliminar ? (
            <div className="detalle-usuario-confirm-eliminar">
              <p>¿Eliminar este usuario? Esta acción no se puede deshacer.</p>
              <button className="detalle-usuario-btn-eliminar" onClick={eliminarUsuarioHandler} disabled={cargando}>Confirmar</button>
              <button onClick={() => setConfirmandoEliminar(false)} disabled={cargando}>Cancelar</button>
            </div>
          ) : (
            <button className="detalle-usuario-btn-eliminar" onClick={() => setConfirmandoEliminar(true)} disabled={cargando}>
              Eliminar Usuario
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PestanaGeneral;
