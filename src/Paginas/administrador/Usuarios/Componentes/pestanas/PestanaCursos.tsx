import React from 'react';
import './PestanaCursos.css';
import { usePestanaCursos, formatearFecha, formatearPrecio, type Usuario, type Inscripcion, type Paquete } from './usePestanaCursos';

interface Props {
  usuario: Usuario;
}

const PestanaCursos: React.FC<Props> = ({ usuario }) => {
  const {
    cursosInscritos, paquetesInscritos,
    cargandoCursos, cargandoDisponibles, cargandoPaquetes,
    busquedaCursos, setBusquedaCursos, filtroTipoContenido, setFiltroTipoContenido,
    paginaActualTutoriales, totalPaginasTutoriales, tutorialesPaginados,
    mensajeOperacion, setMensajeOperacion,
    confirmandoQuitarCurso, setConfirmandoQuitarCurso, confirmarQuitarCurso,
    confirmandoQuitarPaquete, setConfirmandoQuitarPaquete, confirmarQuitarPaquete,
    cursosDisponiblesFiltrados, tutorialesDisponiblesFiltrados, paquetesDisponiblesFiltrados,
    agregarTutorialAUsuario, agregarCursoAUsuario, agregarPaqueteAUsuario,
    cambiarPaginaTutoriales,
  } = usePestanaCursos(usuario);

  return (
    <div className="pestana-cursos-contenido">
      {mensajeOperacion && (
        <div className={`pestana-cursos-mensaje pestana-cursos-mensaje-${mensajeOperacion.tipo}`}>
          {mensajeOperacion.texto}
          <button onClick={() => setMensajeOperacion(null)}>×</button>
        </div>
      )}

      {confirmandoQuitarCurso && (
        <div className="pestana-cursos-confirm">
          <p>¿Quitar este curso del usuario?</p>
          <button onClick={confirmarQuitarCurso}>Confirmar</button>
          <button onClick={() => setConfirmandoQuitarCurso(null)}>Cancelar</button>
        </div>
      )}

      {confirmandoQuitarPaquete && (
        <div className="pestana-cursos-confirm">
          <p>¿Quitar este paquete del usuario?</p>
          <button onClick={confirmarQuitarPaquete}>Confirmar</button>
          <button onClick={() => setConfirmandoQuitarPaquete(null)}>Cancelar</button>
        </div>
      )}

      <div className="pestana-cursos-layout-horizontal">
        <div className="pestana-cursos-columna-izquierda">
          <div className="pestana-cursos-zona-drop">
            <div className="pestana-cursos-seccion">
              <div className="pestana-cursos-header-seccion">
                <h3>📚 Cursos Inscritos</h3>
                <span className="pestana-cursos-contador-cursos">{cursosInscritos.length}</span>
              </div>
              {cargandoCursos ? (
                <div className="pestana-cursos-cargando">Cargando cursos...</div>
              ) : cursosInscritos.length === 0 ? (
                <div className="pestana-cursos-vacio">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor" /></svg>
                  <p>Sin cursos inscritos</p>
                  <small>💡 Agrega cursos desde la derecha</small>
                </div>
              ) : (
                <div className="pestana-cursos-lista-cursos-compacta">
                  {cursosInscritos.map((inscripcion: Inscripcion) => (
                    <div key={inscripcion.id} className="pestana-cursos-curso-item-compacto">
                      <div className="pestana-cursos-curso-imagen-mini">
                        {inscripcion.curso && <img src={inscripcion.curso.imagen_url} alt={inscripcion.curso.titulo} />}
                      </div>
                      <div className="pestana-cursos-curso-info-mini">
                        <h4>{inscripcion.curso?.titulo || 'Curso sin título'}</h4>
                        <p className="pestana-cursos-tipo">{inscripcion.curso?.tipo === 'curso' ? '📚 Curso' : '🎯 Tutorial'}</p>
                        <p className="pestana-cursos-fecha">{formatearFecha(inscripcion.fecha_inscripcion)}</p>
                        <span className={`pestana-cursos-estado pestana-cursos-estado-${inscripcion.estado || 'activo'}`}>{(inscripcion.estado || 'activo').toUpperCase()}</span>
                      </div>
                      <div className="pestana-cursos-curso-acciones">
                        <button className="pestana-cursos-btn-quitar-mini" title="Quitar curso" onClick={() => setConfirmandoQuitarCurso(inscripcion.id)}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pestana-cursos-seccion">
              <div className="pestana-cursos-header-seccion">
                <h3>🎁 Paquetes Inscritos</h3>
                <span className="pestana-cursos-contador-cursos">{paquetesInscritos.length}</span>
              </div>
              {cargandoPaquetes ? (
                <div className="pestana-cursos-cargando">Cargando paquetes...</div>
              ) : paquetesInscritos.length === 0 ? (
                <div className="pestana-cursos-vacio-mini">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="2" /></svg>
                  <p>No hay paquetes inscritos</p>
                </div>
              ) : (
                <div className="pestana-cursos-lista-cursos-inscritos">
                  {paquetesInscritos.map((paquete: Inscripcion) => (
                    <div key={paquete.id} className="pestana-cursos-paquete-inscrito-expandido">
                      <div className="pestana-cursos-paquete-header">
                        <div className="pestana-cursos-paquete-icon-grande">📦</div>
                        <div className="pestana-cursos-paquete-info-principal">
                          <h5>{paquete.paquetes_tutoriales?.titulo || 'Paquete'}</h5>
                          <p className="pestana-cursos-paquete-descripcion">{paquete.paquetes_tutoriales?.descripcion_corta || 'Paquete de tutoriales'}</p>
                          <div className="pestana-cursos-paquete-meta">
                            <span className="pestana-cursos-fecha-inscripcion">📅 {formatearFecha(paquete.fecha_inscripcion)}</span>
                            <span className="pestana-cursos-total-tutoriales">🎯 {(paquete.paquetes_tutoriales as Paquete | undefined)?.total_tutoriales || 0} tutoriales</span>
                            <span className="pestana-cursos-nivel-paquete">📊 {(paquete.paquetes_tutoriales as Paquete | undefined)?.nivel || 'Principiante'}</span>
                          </div>
                        </div>
                        <div className="pestana-cursos-paquete-acciones">
                          <div className="pestana-cursos-progreso-paquete">
                            <div className="pestana-cursos-progreso-circular">
                              <span className="pestana-cursos-progreso-porcentaje">0%</span>
                            </div>
                          </div>
                          <div className="pestana-cursos-botones-paquete">
                            <button className="pestana-cursos-btn-ver-paquete-detalle" title="Ver paquete completo">👁️ Ver</button>
                            <button className="pestana-cursos-btn-eliminar-paquete" title="Eliminar paquete" onClick={() => setConfirmandoQuitarPaquete(paquete.id)}>🗑️ Eliminar</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pestana-cursos-columna-derecha">
          <div className="pestana-cursos-seccion pestana-cursos-seccion-agregar">
            <div className="pestana-cursos-header-seccion">
              <h3>🔍 Agregar Cursos y Tutoriales</h3>
            </div>
            <div className="pestana-cursos-buscador">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" /></svg>
              <input type="text" placeholder="Buscar contenido..." value={busquedaCursos} onChange={(e) => setBusquedaCursos(e.target.value)} />
            </div>
            <div className="pestana-cursos-filtros-contenido">
              {(['todos', 'cursos', 'tutoriales', 'paquetes'] as const).map((tipo) => (
                <button key={tipo} className={`pestana-cursos-filtro-btn ${filtroTipoContenido === tipo ? 'activo' : ''}`} onClick={() => setFiltroTipoContenido(tipo)}>
                  {tipo === 'todos' ? '🎯 Todos' : tipo === 'cursos' ? '📚 Cursos' : tipo === 'tutoriales' ? '🎯 Tutoriales' : '🎁 Paquetes'}
                </button>
              ))}
            </div>

            {cargandoDisponibles ? (
              <div className="pestana-cursos-cargando">Cargando contenido disponible...</div>
            ) : (
              <>
                {(filtroTipoContenido === 'todos' || filtroTipoContenido === 'cursos') && cursosDisponiblesFiltrados.length > 0 && (
                  <div className="pestana-cursos-categoria-cursos">
                    <div className="pestana-cursos-header-categoria">
                      <h4>📚 Cursos Disponibles</h4>
                      <span className="pestana-cursos-contador-resultados">{cursosDisponiblesFiltrados.length} cursos</span>
                    </div>
                    <div className="pestana-cursos-grid-cursos-disponibles">
                      {cursosDisponiblesFiltrados.map((curso) => (
                        <div key={curso.id} className="pestana-cursos-curso-disponible">
                          <div className="pestana-cursos-curso-imagen-mini"><img src={curso.imagen_url} alt={curso.titulo} /></div>
                          <div className="pestana-cursos-curso-info-mini">
                            <h5>{curso.titulo}</h5>
                            <p className="pestana-cursos-tipo">📚 Curso Completo</p>
                            {curso.precio && <p className="pestana-cursos-precio">{formatearPrecio(curso.precio)}</p>}
                          </div>
                          <button className="pestana-cursos-btn-agregar-curso" onClick={() => agregarCursoAUsuario(curso.id)} disabled={cargandoCursos}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(filtroTipoContenido === 'todos' || filtroTipoContenido === 'tutoriales') && tutorialesDisponiblesFiltrados.length > 0 && (
                  <div className="pestana-cursos-categoria-cursos">
                    <div className="pestana-cursos-header-categoria">
                      <h4>🎯 Tutoriales Disponibles</h4>
                      <span className="pestana-cursos-contador-resultados">{tutorialesDisponiblesFiltrados.length} tutoriales</span>
                    </div>
                    <div className="pestana-cursos-grid-cursos-disponibles">
                      {tutorialesPaginados.map((tutorial) => (
                        <div key={tutorial.id} className="pestana-cursos-curso-disponible">
                          <div className="pestana-cursos-curso-imagen-mini"><img src={tutorial.imagen_url} alt={tutorial.titulo} /></div>
                          <div className="pestana-cursos-curso-info-mini">
                            <h5>{tutorial.titulo}</h5>
                            <p className="pestana-cursos-duracion">⏱️ {tutorial.duracion} min</p>
                            {tutorial.precio && <p className="pestana-cursos-precio">{formatearPrecio(tutorial.precio)}</p>}
                          </div>
                          <button className="pestana-cursos-btn-agregar-curso" onClick={() => agregarTutorialAUsuario(tutorial.id)} disabled={cargandoCursos}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                    {totalPaginasTutoriales > 1 && (
                      <div className="pestana-cursos-paginacion">
                        <button className={`pestana-cursos-btn-pagina ${paginaActualTutoriales === 1 ? 'disabled' : ''}`} onClick={() => cambiarPaginaTutoriales(paginaActualTutoriales - 1)} disabled={paginaActualTutoriales === 1}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" /></svg>
                        </button>
                        {Array.from({ length: totalPaginasTutoriales }, (_, i) => (
                          <button key={i + 1} className={`pestana-cursos-btn-pagina ${paginaActualTutoriales === i + 1 ? 'activa' : ''}`} onClick={() => cambiarPaginaTutoriales(i + 1)}>{i + 1}</button>
                        ))}
                        <button className={`pestana-cursos-btn-pagina ${paginaActualTutoriales === totalPaginasTutoriales ? 'disabled' : ''}`} onClick={() => cambiarPaginaTutoriales(paginaActualTutoriales + 1)} disabled={paginaActualTutoriales === totalPaginasTutoriales}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(filtroTipoContenido === 'todos' || filtroTipoContenido === 'paquetes') && (
                  <div className="pestana-cursos-categoria-cursos">
                    <div className="pestana-cursos-header-categoria">
                      <h4>🎁 Paquetes Disponibles</h4>
                      <span className="pestana-cursos-contador-resultados">{paquetesDisponiblesFiltrados.length} paquetes</span>
                    </div>
                    {cargandoPaquetes ? (
                      <div className="pestana-cursos-cargando">Cargando paquetes...</div>
                    ) : paquetesDisponiblesFiltrados.length === 0 ? (
                      <div className="pestana-cursos-vacio">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="2" /></svg>
                        <p>No hay paquetes disponibles</p>
                      </div>
                    ) : (
                      <div className="pestana-cursos-grid-cursos-disponibles">
                        {paquetesDisponiblesFiltrados.map((paquete) => (
                          <div key={paquete.id} className="pestana-cursos-curso-disponible pestana-cursos-paquete-item">
                            <div className="pestana-cursos-curso-imagen-mini"><div className="pestana-cursos-paquete-icon">📦</div></div>
                            <div className="pestana-cursos-curso-info-mini">
                              <h5>{paquete.titulo}</h5>
                              <p className="pestana-cursos-paquete-detalles">{paquete.total_tutoriales || 0} tutoriales</p>
                              <p className="pestana-cursos-precio">{formatearPrecio(paquete.precio_rebajado || paquete.precio_normal)}</p>
                            </div>
                            <button className="pestana-cursos-btn-agregar-curso" onClick={() => agregarPaqueteAUsuario(paquete.id)} disabled={cargandoPaquetes} aria-label="Agregar paquete completo">
                              {cargandoPaquetes ? '...' : '+'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {cursosDisponiblesFiltrados.length === 0 && tutorialesDisponiblesFiltrados.length === 0 && paquetesDisponiblesFiltrados.length === 0 && (
                  <div className="pestana-cursos-vacio">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" /></svg>
                    <p>No se encontraron cursos disponibles</p>
                    {busquedaCursos ? <small>Intenta con otro término de búsqueda</small> : <small>El usuario ya está inscrito en todos los cursos disponibles</small>}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestanaCursos;
