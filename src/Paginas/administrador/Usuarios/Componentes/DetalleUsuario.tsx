import React, { useState, useEffect, useRef } from 'react';
import { actualizarUsuario, eliminarUsuario } from '../../../../servicios/usuariosAdminService';
import PestanaActividad from './pestanas/PestanaActividad';
import PestanaGeolocalizacion from './pestanas/PestanaGeolocalizacion';
import PestanaCursos from './pestanas/PestanaCursos';
import PestanaConfiguracion from './pestanas/PestanaConfiguracion';
import PestanaGeneral, { type Usuario } from './PestanaGeneral';
import './DetalleUsuario.css';

interface Props {
  usuario: Usuario;
  onCerrar: () => void;
  onUsuarioActualizado: (usuario: Usuario) => void;
  onUsuarioEliminado: (usuarioId: string) => void;
}

const PESTANAS = [
  { id: 'general', label: 'General' },
  { id: 'actividad', label: 'Actividad' },
  { id: 'geolocalizacion', label: 'Ubicación' },
  { id: 'cursos', label: 'Cursos' },
  { id: 'configuracion', label: 'Configuracion' }
];

const ICONOS_PESTANA: Record<string, React.ReactNode> = {
  general: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" /><path d="M6 21v-2a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2" /></svg>,
  actividad: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" /><path d="M7 14l4-4 3 3 3-5" stroke="currentColor" strokeWidth="2" /></svg>,
  geolocalizacion: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" /><path d="M3 12h18" stroke="currentColor" strokeWidth="2" /><path d="M12 3c3 4 3 14 0 18" stroke="currentColor" strokeWidth="2" /></svg>,
  cursos: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 4h14a3 3 0 0 1 3 3v13H6a3 3 0 0 1-3-3V4z" stroke="currentColor" strokeWidth="2" /><path d="M6 4v13" stroke="currentColor" strokeWidth="2" /></svg>,
  configuracion: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" /><path d="M19.4 15a7.9 7.9 0 0 0 .1-6l2-1.6-2-3.4-2.4.6a8 8 0 0 0-5.2-2l-.6-2h-4l-.6 2a8 8 0 0 0-5.2 2L2.5 4l-2 3.4 2 1.6a8 8 0 0 0 .1 6l-2 1.6 2 3.4 2.4-.6a8 8 0 0 0 5.2 2l.6 2h4l.6-2a8 8 0 0 0 5.2-2l2.4.6 2-3.4-2-1.6z" stroke="currentColor" strokeWidth="2" /></svg>
};

const DetalleUsuario: React.FC<Props> = ({ usuario, onCerrar, onUsuarioActualizado, onUsuarioEliminado }) => {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [editando, setEditando] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('general');
  const [datosEditables, setDatosEditables] = useState<Usuario>({ ...usuario });
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  const pestanasRef = useRef<HTMLDivElement>(null);
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  const [dragMoved, setDragMoved] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const scrollPestanas = (direccion: 'izq' | 'der') => {
    pestanasRef.current?.scrollBy({ left: direccion === 'der' ? 150 : -150, behavior: 'smooth' });
  };

  const onPestanasMouseDown = (e: React.MouseEvent) => {
    if (!pestanasRef.current) return;
    setIsDraggingTabs(true);
    setDragMoved(false);
    setStartX(e.pageX - pestanasRef.current.offsetLeft);
    setScrollLeft(pestanasRef.current.scrollLeft);
  };

  const onPestanasMouseLeaveOrUp = () => setIsDraggingTabs(false);

  const onPestanasMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingTabs || !pestanasRef.current) return;
    e.preventDefault();
    const walk = (e.pageX - pestanasRef.current.offsetLeft - startX) * 1.5;
    if (Math.abs(walk) > 5) setDragMoved(true);
    pestanasRef.current.scrollLeft = scrollLeft - walk;
  };

  const activarEdicion = () => { setEditando(true); setDatosEditables({ ...usuario }); };
  const cancelarEdicion = () => { setEditando(false); setDatosEditables({ ...usuario }); setError(''); };

  const guardarCambios = async () => {
    try {
      setCargando(true);
      setError('');
      const resultado = await actualizarUsuario(usuario.id, datosEditables);
      if (resultado.success) {
        setEditando(false);
        setExito('Cambios guardados exitosamente');
        onUsuarioActualizado(resultado.data);
      } else {
        setError(resultado.error || 'Error al actualizar el usuario');
      }
      setTimeout(() => setExito(''), 3000);
    } catch (err: any) {
      setError(`Error al actualizar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const eliminarUsuarioHandler = async () => {
    setConfirmandoEliminar(false);
    try {
      setCargando(true);
      const resultado = await eliminarUsuario(usuario.id);
      if (resultado.success) {
        onUsuarioEliminado(usuario.id);
      } else {
        setError(resultado.error || 'Error al eliminar el usuario');
      }
    } catch (err: any) {
      setError(`Error al eliminar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleUsuarioActualizado = (usuarioActualizado: Usuario) => {
    Object.assign(usuario, usuarioActualizado);
    onUsuarioActualizado?.(usuarioActualizado);
  };

  const obtenerIniciales = (nombre: string, apellido: string) =>
    `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();

  return (
    <div className="detalle-usuario">
      <div className="detalle-usuario-header">
        <div className="detalle-usuario-info-header">
          <div className="detalle-usuario-avatar-grande">
            {usuario.url_foto_perfil ? (
              <img src={usuario.url_foto_perfil} alt={usuario.nombre_completo || ''} />
            ) : (
              <div className="detalle-usuario-avatar-iniciales">
                {obtenerIniciales(editando ? datosEditables.nombre : usuario.nombre, editando ? datosEditables.apellido : usuario.apellido)}
              </div>
            )}
          </div>
          <div className="detalle-usuario-info-basica">
            <h2>{usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario'}</h2>
            <p className="detalle-usuario-correo">{usuario.correo_electronico}</p>
            <div className="detalle-usuario-badges">
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.rol}`}>{usuario.rol}</span>
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.suscripcion}`}>{usuario.suscripcion}</span>
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.eliminado ? 'eliminado' : 'activo'}`}>{usuario.eliminado ? 'Eliminado' : 'Activo'}</span>
            </div>
          </div>
        </div>
        <div className="detalle-usuario-acciones-header">
          {!editando && (
            <button className="detalle-usuario-btn-editar" onClick={activarEdicion}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor" />
              </svg>
              Editar
            </button>
          )}
          <button className="detalle-usuario-btn-cerrar" onClick={onCerrar}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="detalle-usuario-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
          </svg>
          {error}
        </div>
      )}

      {exito && (
        <div className="detalle-usuario-exito">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth={2} />
          </svg>
          {exito}
        </div>
      )}

      <div className="detalle-usuario-pestanas-wrapper">
        <button className="detalle-usuario-flecha-scroll izq" onClick={() => scrollPestanas('izq')} aria-label="Desplazar pestañas a la izquierda">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div
          className={`detalle-usuario-pestanas ${isDraggingTabs ? 'dragging' : ''}`}
          ref={pestanasRef}
          onMouseDown={onPestanasMouseDown}
          onMouseLeave={onPestanasMouseLeaveOrUp}
          onMouseUp={onPestanasMouseLeaveOrUp}
          onMouseMove={onPestanasMouseMove}
          style={{ cursor: isDraggingTabs ? 'grabbing' : 'grab' }}
        >
          {PESTANAS.map((pestana) => (
            <button
              key={pestana.id}
              className={`detalle-usuario-pestana ${pestanaActiva === pestana.id ? 'activa' : ''}`}
              onClick={() => { if (!dragMoved) setPestanaActiva(pestana.id); }}
            >
              <span className="detalle-usuario-pestana-icono">{ICONOS_PESTANA[pestana.id]}</span>
              {pestana.label}
            </button>
          ))}
        </div>
        <button className="detalle-usuario-flecha-scroll der" onClick={() => scrollPestanas('der')} aria-label="Desplazar pestañas a la derecha">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" stroke="currentColor" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>

      <div className="detalle-usuario-contenido-pestanas">
        {pestanaActiva === 'general' && (
          <PestanaGeneral
            usuario={usuario}
            editando={editando}
            datosEditables={datosEditables}
            cargando={cargando}
            confirmandoEliminar={confirmandoEliminar}
            setConfirmandoEliminar={setConfirmandoEliminar}
            setDatosEditables={setDatosEditables}
            guardarCambios={guardarCambios}
            cancelarEdicion={cancelarEdicion}
            eliminarUsuarioHandler={eliminarUsuarioHandler}
          />
        )}
        {pestanaActiva === 'cursos' && <PestanaCursos usuario={usuario} />}
        {pestanaActiva === 'actividad' && <PestanaActividad usuario={usuario} />}
        {pestanaActiva === 'geolocalizacion' && <PestanaGeolocalizacion usuario={usuario} />}
        {pestanaActiva === 'configuracion' && <PestanaConfiguracion usuario={usuario} onUsuarioActualizado={handleUsuarioActualizado} />}
      </div>
    </div>
  );
};

export default DetalleUsuario;
