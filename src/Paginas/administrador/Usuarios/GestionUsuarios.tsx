import React from 'react';
import DetalleUsuario from './Componentes/DetalleUsuario';
import CrearUsuario from './Componentes/CrearUsuario';
import './GestionUsuarios.css';
import { useGestionUsuarios } from './useGestionUsuarios';

const GestionUsuarios: React.FC = () => {
  const {
    usuariosFiltrados, usuarioSeleccionado, mostrarCrearUsuario,
    cargando, error, exito,
    busqueda, setBusqueda, filtroRol, setFiltroRol,
    filtroSuscripcion, setFiltroSuscripcion,
    mostrarEliminados, setMostrarEliminados,
    usuariosSeleccionados, seleccionarTodos, mostrarAccionesSeleccion,
    menuContextual, estadisticas,
    confirmandoBulk, setConfirmandoBulk, confirmarEliminarBulk, pedirConfirmacionBulk,
    confirmandoIndividualId, setConfirmandoIndividualId, confirmarEliminarIndividual,
    pedirConfirmacionIndividual, nombreConfirmandoIndividual,
    seleccionarUsuario, cerrarDetalles, abrirCrearUsuario, cerrarCrearUsuario,
    onUsuarioCreado, onUsuarioActualizado, onUsuarioEliminado,
    toggleSeleccionUsuario, toggleSeleccionarTodos,
    mostrarMenuContextual, ocultarMenuContextual,
    usuarios,
  } = useGestionUsuarios();

  return (
    <div className="gestion-usuarios-contenedor">
      <div className="gestion-usuarios-header">
        <div className="gestion-usuarios-titulo">
          <h1>👥 Gestión de Usuarios</h1>
          <p>Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button className="gestion-usuarios-btn-crear" onClick={abrirCrearUsuario}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
          </svg>
          Crear Usuario
        </button>
      </div>

      <div className="gestion-usuarios-estadisticas">
        {[
          { icono: '👥', valor: estadisticas.total, label: 'Total Usuarios' },
          { icono: '✅', valor: estadisticas.activos, label: 'Activos' },
          { icono: '👑', valor: estadisticas.administradores, label: 'Administradores' },
          { icono: '🎓', valor: estadisticas.estudiantes, label: 'Estudiantes' },
          { icono: '💎', valor: estadisticas.premium, label: 'Usuarios Premium' },
          { icono: '🆕', valor: estadisticas.nuevosHoy, label: 'Nuevos Hoy' },
        ].map(({ icono, valor, label }) => (
          <div key={label} className="gestion-usuarios-stat-card">
            <div className="gestion-usuarios-stat-icono">{icono}</div>
            <div className="gestion-usuarios-stat-contenido">
              <div className="gestion-usuarios-stat-valor">{valor}</div>
              <div className="gestion-usuarios-stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="gestion-usuarios-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor" />
          </svg>
          {error}
        </div>
      )}

      {exito && (
        <div className="gestion-usuarios-exito">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
          </svg>
          {exito}
        </div>
      )}

      {confirmandoBulk && (
        <div className="gestion-usuarios-confirm-panel">
          <p>¿Eliminar {usuariosSeleccionados.size} usuario(s)? Esta acción no se puede deshacer.</p>
          <button onClick={confirmarEliminarBulk}>Confirmar</button>
          <button onClick={() => setConfirmandoBulk(false)}>Cancelar</button>
        </div>
      )}

      {confirmandoIndividualId && (
        <div className="gestion-usuarios-confirm-panel">
          <p>¿Eliminar a "{nombreConfirmandoIndividual}"? Esta acción no se puede deshacer.</p>
          <button onClick={confirmarEliminarIndividual}>Confirmar</button>
          <button onClick={() => setConfirmandoIndividualId(null)}>Cancelar</button>
        </div>
      )}

      <div className="gestion-usuarios-contenido">
        {!usuarioSeleccionado && !mostrarCrearUsuario && (
          <div className="gestion-usuarios-lista">
            <div className="gestion-usuarios-controles">
              <div className="gestion-usuarios-campo-busqueda">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input type="text" placeholder="Buscar por nombre o correo..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              </div>
              <div className="gestion-usuarios-filtros">
                <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}>
                  <option value="todos">Todos los roles</option>
                  <option value="admin">Administradores</option>
                  <option value="estudiante">Estudiantes</option>
                </select>
                <select value={filtroSuscripcion} onChange={(e) => setFiltroSuscripcion(e.target.value)}>
                  <option value="todas">Todas las membresías</option>
                  <option value="free">Gratuita</option>
                  <option value="basic">Básica</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Profesional</option>
                </select>
                <label className="gestion-usuarios-toggle">
                  <input type="checkbox" checked={mostrarEliminados} onChange={(e) => setMostrarEliminados(e.target.checked)} />
                  <span>Ver eliminados</span>
                </label>
              </div>
            </div>

            {mostrarAccionesSeleccion && (
              <div className="gestion-usuarios-acciones-seleccion">
                <div className="gestion-usuarios-info-seleccion">
                  <span className="gestion-usuarios-contador-seleccion">{usuariosSeleccionados.size} usuario(s) seleccionado(s)</span>
                </div>
                <div className="gestion-usuarios-botones-seleccion">
                  <button className="gestion-usuarios-btn-eliminar-masivo" onClick={pedirConfirmacionBulk} disabled={cargando}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Eliminar Seleccionados
                  </button>
                  <button className="gestion-usuarios-btn-limpiar-seleccion" onClick={() => toggleSeleccionarTodos(usuariosFiltrados)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Limpiar Selección
                  </button>
                </div>
              </div>
            )}

            <div className="gestion-usuarios-contenedor-tabla">
              {cargando ? (
                <div className="gestion-usuarios-cargando">
                  <div className="gestion-usuarios-spinner"></div>
                  <p>Cargando usuarios...</p>
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <div className="gestion-usuarios-sin-resultados">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="currentColor" opacity="0.3" />
                  </svg>
                  <h3>No se encontraron usuarios</h3>
                  <p>Intenta cambiar los filtros de búsqueda</p>
                </div>
              ) : (
                <table className="gestion-usuarios-tabla-usuarios">
                  <thead>
                    <tr>
                      <th className="gestion-usuarios-celda-checkbox">
                        <input type="checkbox" checked={seleccionarTodos} onChange={() => toggleSeleccionarTodos(usuariosFiltrados)} className="gestion-usuarios-checkbox-principal" />
                      </th>
                      <th>Usuario</th>
                      <th>Correo</th>
                      <th>Rol</th>
                      <th>Membresía</th>
                      <th>Fecha Registro</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuariosFiltrados.map((usuario) => (
                      <tr
                        key={usuario.id}
                        className={`gestion-usuarios-fila-usuario ${usuario.eliminado ? 'eliminado' : ''} ${usuariosSeleccionados.has(usuario.id) ? 'seleccionado' : ''}`}
                        onContextMenu={(e) => mostrarMenuContextual(e, usuario.id)}
                      >
                        <td className="gestion-usuarios-celda-checkbox">
                          <input type="checkbox" checked={usuariosSeleccionados.has(usuario.id)} onChange={(e) => { e.stopPropagation(); toggleSeleccionUsuario(usuario.id); }} className="gestion-usuarios-checkbox-usuario" />
                        </td>
                        <td className="gestion-usuarios-celda-usuario">
                          <div className="gestion-usuarios-info-usuario" onClick={() => seleccionarUsuario(usuario)} style={{ cursor: 'pointer' }}>
                            {usuario.url_foto_perfil ? (
                              <img src={usuario.url_foto_perfil} alt={usuario.nombre_completo} className="gestion-usuarios-avatar" />
                            ) : (
                              <div className="gestion-usuarios-avatar-placeholder">
                                {usuario.nombre?.charAt(0) || ''}{usuario.apellido?.charAt(0) || ''}
                              </div>
                            )}
                            <div className="gestion-usuarios-datos-usuario">
                              <span className="gestion-usuarios-nombre">{usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()}</span>
                              <span className="gestion-usuarios-ubicacion">{usuario.ciudad ? `${usuario.ciudad}, ${usuario.pais}` : usuario.pais || ''}</span>
                            </div>
                          </div>
                        </td>
                        <td>{usuario.correo_electronico}</td>
                        <td>
                          <span className={`gestion-usuarios-badge gestion-usuarios-badge-${usuario.rol}`}>
                            {usuario.rol === 'admin' ? 'Administrador' : 'Estudiante'}
                          </span>
                        </td>
                        <td>
                          <span className={`gestion-usuarios-badge gestion-usuarios-badge-suscripcion-${usuario.suscripcion}`}>
                            {usuario.suscripcion === 'free' ? 'Gratuita' : usuario.suscripcion === 'basic' ? 'Básica' : usuario.suscripcion === 'premium' ? 'Premium' : usuario.suscripcion === 'pro' ? 'Profesional' : usuario.suscripcion}
                          </span>
                        </td>
                        <td>{new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')}</td>
                        <td>
                          <span className={`gestion-usuarios-estado ${usuario.eliminado ? 'inactivo' : 'activo'}`}>
                            {usuario.eliminado ? 'Eliminado' : 'Activo'}
                          </span>
                        </td>
                        <td className="gestion-usuarios-celda-acciones">
                          <button className="gestion-usuarios-btn-accion" onClick={(e) => { e.stopPropagation(); seleccionarUsuario(usuario); }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {usuarioSeleccionado && (
          <div className="gestion-usuarios-detalle">
            <DetalleUsuario
              usuario={usuarioSeleccionado}
              onCerrar={cerrarDetalles}
              onUsuarioActualizado={onUsuarioActualizado}
              onUsuarioEliminado={onUsuarioEliminado}
            />
          </div>
        )}

        {mostrarCrearUsuario && (
          <div className="gestion-usuarios-crear">
            <CrearUsuario onCerrar={cerrarCrearUsuario} onUsuarioCreado={onUsuarioCreado} />
          </div>
        )}

        {menuContextual.visible && (
          <div
            className="gestion-usuarios-menu-contextual"
            style={{ position: 'fixed', left: Math.min(menuContextual.x, window.innerWidth - 220), top: Math.min(menuContextual.y, window.innerHeight - 200), zIndex: 1000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gestion-usuarios-menu-contextual-contenido">
              <button className="gestion-usuarios-menu-item" onClick={() => { const u = usuarios.find(u => u.id === menuContextual.usuarioId); if (u) { seleccionarUsuario(u); ocultarMenuContextual(); } }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Ver Detalles
              </button>
              <button className="gestion-usuarios-menu-item" onClick={() => { toggleSeleccionUsuario(menuContextual.usuarioId); ocultarMenuContextual(); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
                </svg>
                {usuariosSeleccionados.has(menuContextual.usuarioId) ? 'Deseleccionar' : 'Seleccionar'}
              </button>
              <div className="gestion-usuarios-menu-separador"></div>
              <button className="gestion-usuarios-menu-item gestion-usuarios-menu-item-peligroso" onClick={() => pedirConfirmacionIndividual(menuContextual.usuarioId)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" />
                </svg>
                Eliminar Usuario
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionUsuarios;
