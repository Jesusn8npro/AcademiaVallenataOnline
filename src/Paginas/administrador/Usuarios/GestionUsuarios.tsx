import React, { useState, useEffect } from 'react';
import DetalleUsuario from './Componentes/DetalleUsuario';
import CrearUsuario from './Componentes/CrearUsuario';
import { cargarUsuarios, calcularEstadisticas, type UsuarioAdmin } from '../../../servicios/usuariosAdminService';
import './GestionUsuarios.css';

// Definir las interfaces directamente aquí como en Svelte
interface Usuario {
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
  // Campos de geolocalización
  latitud?: string;
  longitud?: string;
  zona_horaria?: string;
  ip_registro?: string;
}

interface EstadisticasUsuarios {
  total: number;
  activos: number;
  administradores: number;
  estudiantes: number;
  premium: number;
  gratuitos: number;
  nuevosHoy: number;
}

// Componente principal
const GestionUsuarios: React.FC = () => {
  // Estados principales
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [mostrarCrearUsuario, setMostrarCrearUsuario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  // Estados de filtros y búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('todas');
  const [mostrarEliminados, setMostrarEliminados] = useState(false);

  // Estados para selección múltiple
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<string>>(new Set());
  const [seleccionarTodos, setSeleccionarTodos] = useState(false);
  const [mostrarAccionesSeleccion, setMostrarAccionesSeleccion] = useState(false);

  // Estados para menú contextual
  const [menuContextual, setMenuContextual] = useState<{
    visible: boolean;
    x: number;
    y: number;
    usuarioId: string;
  }>({
    visible: false,
    x: 0,
    y: 0,
    usuarioId: ''
  });

  // Estados de estadísticas
  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios>({
    total: 0,
    activos: 0,
    administradores: 0,
    estudiantes: 0,
    premium: 0,
    gratuitos: 0,
    nuevosHoy: 0
  });

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarUsuariosData();
  }, []);

  // Función para cargar usuarios y estadísticas
  const cargarUsuariosData = async () => {
    try {
      setCargando(true);
      setError('');

      // Cargar usuarios desde Supabase
      const usuariosData = await cargarUsuarios(mostrarEliminados);
      const usuariosMapeados: Usuario[] = (usuariosData as UsuarioAdmin[]).map((u) => ({
        id: u.id,
        nombre: u.nombre || '',
        apellido: u.apellido || '',
        nombre_completo: u.nombre_completo || `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        correo_electronico: u.correo_electronico || '',
        rol: (u.rol || '').toLowerCase(),
        suscripcion: (u.suscripcion || '').toLowerCase(),
        fecha_creacion: u.fecha_creacion || new Date().toISOString(),
        fecha_actualizacion: u.fecha_creacion || new Date().toISOString(),
        ultima_actividad: undefined,
        url_foto_perfil: u.url_foto_perfil || undefined,
        eliminado: false,
        whatsapp: undefined,
        ciudad: u.ciudad || undefined,
        pais: u.pais || undefined,
        nivel_habilidad: undefined,
        documento_numero: undefined,
        profesion: undefined,
        documento_tipo: undefined,
        instrumento: undefined,
        latitud: undefined,
        longitud: undefined,
        zona_horaria: undefined,
        ip_registro: undefined,
      }));

      setUsuarios(usuariosMapeados);
      calcularEstadisticasLocal(usuariosData);

    } catch (err: any) {
      setError(`Error al cargar los usuarios: ${err.message}`);
      console.error('Error cargando usuarios:', err);
    } finally {
      setCargando(false);
    }
  };

  // Calcular estadísticas
  const calcularEstadisticasLocal = (usuariosData: UsuarioAdmin[]) => {
    const base = calcularEstadisticas(usuariosData);
    const administradores = usuariosData.filter(u => (u.rol || '').toLowerCase() === 'admin').length;
    const premium = usuariosData.filter(u => ['premium', 'pro'].includes((u.suscripcion || '').toLowerCase())).length;
    const gratuitos = usuariosData.filter(u => (u.suscripcion || '').toLowerCase() === 'free').length;
    const hoyISO = new Date().toISOString().slice(0, 10);
    const nuevosHoy = usuariosData.filter(u => (u.fecha_creacion || '').slice(0, 10) === hoyISO).length;
    setEstadisticas({
      total: base.total,
      activos: base.activos,
      administradores,
      estudiantes: base.estudiantes,
      premium,
      gratuitos,
      nuevosHoy
    });
  };

  // Procesar parámetros de URL
  const procesarParametrosURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const usuarioId = urlParams.get('usuario');

    if (usuarioId && usuarios.length > 0) {
      const usuario = usuarios.find(u => u.id === usuarioId);
      if (usuario) {
        setUsuarioSeleccionado(usuario);
      }
    }
  };

  // Efecto para procesar URL cuando cambian los usuarios
  useEffect(() => {
    if (usuarios.length > 0) {
      procesarParametrosURL();
    }
  }, [usuarios]);

  // Seleccionar usuario
  const seleccionarUsuario = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarCrearUsuario(false);

    // Actualizar URL
    const url = new URL(window.location.href);
    url.searchParams.set('usuario', usuario.id);
    window.history.pushState({}, '', url.toString());
  };

  // Cerrar detalles
  const cerrarDetalles = () => {
    setUsuarioSeleccionado(null);

    // Limpiar URL
    const url = new URL(window.location.href);
    url.searchParams.delete('usuario');
    window.history.pushState({}, '', url.toString());
  };

  // Abrir crear usuario
  const abrirCrearUsuario = () => {
    setMostrarCrearUsuario(true);
    setUsuarioSeleccionado(null);
  };

  // Cerrar crear usuario
  const cerrarCrearUsuario = () => {
    setMostrarCrearUsuario(false);
  };

  // Callbacks para eventos
  const onUsuarioCreado = async (usuario: Usuario) => {
    try {
      // Recargar la lista de usuarios
      await cargarUsuariosData();
      setMostrarCrearUsuario(false);
      setExito('Usuario creado exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      console.error('Error al recargar usuarios:', err);
    }
  };

  const onUsuarioActualizado = async (usuarioActualizado: Usuario) => {
    try {
      // Actualizar el usuario en la lista local
      const usuariosActualizados = usuarios.map(u => u.id === usuarioActualizado.id ? usuarioActualizado : u);
      setUsuarios(usuariosActualizados);
      setUsuarioSeleccionado(usuarioActualizado);
      calcularEstadisticasLocal(usuariosActualizados);
      setExito('Usuario actualizado exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
    }
  };

  const onUsuarioEliminado = async (usuarioId: string) => {
    try {
      // Recargar la lista de usuarios
      await cargarUsuariosData();
      setUsuarioSeleccionado(null);
      setExito('Usuario eliminado exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
    }
  };

  // Efecto para recargar usuarios cuando cambien los filtros
  useEffect(() => {
    cargarUsuariosData();
  }, [busqueda, filtroRol, filtroSuscripcion, mostrarEliminados]);

  // Los usuarios ya vienen filtrados desde el servicio
  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase();
    const matchBusqueda = q === '' || (u.nombre_completo?.toLowerCase().includes(q) || u.correo_electronico?.toLowerCase().includes(q));
    const matchRol = filtroRol === 'todos' || (u.rol || '').toLowerCase() === filtroRol;
    const matchSuscripcion = filtroSuscripcion === 'todas' || (u.suscripcion || '').toLowerCase() === filtroSuscripcion;
    const matchEliminados = mostrarEliminados ? true : !u.eliminado;
    return matchBusqueda && matchRol && matchSuscripcion && matchEliminados;
  });

  // Funciones para selección múltiple
  const toggleSeleccionUsuario = (usuarioId: string) => {
    const nuevosSeleccionados = new Set(usuariosSeleccionados);
    if (nuevosSeleccionados.has(usuarioId)) {
      nuevosSeleccionados.delete(usuarioId);
    } else {
      nuevosSeleccionados.add(usuarioId);
    }
    setUsuariosSeleccionados(nuevosSeleccionados);
    setMostrarAccionesSeleccion(nuevosSeleccionados.size > 0);
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionarTodos) {
      setUsuariosSeleccionados(new Set());
      setSeleccionarTodos(false);
      setMostrarAccionesSeleccion(false);
    } else {
      const todosLosIds = usuariosFiltrados.map(u => u.id);
      setUsuariosSeleccionados(new Set(todosLosIds));
      setSeleccionarTodos(true);
      setMostrarAccionesSeleccion(true);
    }
  };

  // Funciones para menú contextual
  const mostrarMenuContextual = (e: React.MouseEvent, usuarioId: string) => {
    e.preventDefault();
    e.stopPropagation();

    // Obtener la posición del elemento
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.right + 10; // Aparecer a la derecha del usuario
    const y = rect.top + (rect.height / 2); // Centrado verticalmente

    setMenuContextual({
      visible: true,
      x: x,
      y: y,
      usuarioId
    });
  };

  const ocultarMenuContextual = () => {
    setMenuContextual({
      visible: false,
      x: 0,
      y: 0,
      usuarioId: ''
    });
  };

  // Función para eliminar usuarios seleccionados
  const eliminarUsuariosSeleccionados = async () => {
    if (usuariosSeleccionados.size === 0) return;

    const confirmacion = confirm(
      `¿Estás seguro de que quieres eliminar ${usuariosSeleccionados.size} usuario(s) seleccionado(s)? Esta acción no se puede deshacer.`
    );

    if (!confirmacion) return;

    try {
      setCargando(true);
      const { eliminarUsuario } = await import('../../../servicios/usuariosAdminService');

      // Eliminar cada usuario seleccionado
      const promesasEliminacion = Array.from(usuariosSeleccionados).map(usuarioId =>
        eliminarUsuario(usuarioId)
      );

      await Promise.all(promesasEliminacion);

      // Recargar la lista
      await cargarUsuariosData();

      // Limpiar selección
      setUsuariosSeleccionados(new Set());
      setSeleccionarTodos(false);
      setMostrarAccionesSeleccion(false);

      setExito(`${usuariosSeleccionados.size} usuario(s) eliminado(s) exitosamente`);
      setTimeout(() => setExito(''), 3000);

    } catch (err: any) {
      setError(`Error al eliminar usuarios: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Función para eliminar usuario individual desde menú contextual
  const eliminarUsuarioIndividual = async (usuarioId: string) => {
    const confirmacion = confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.');
    if (!confirmacion) return;

    try {
      setCargando(true);
      const { eliminarUsuario } = await import('../../../servicios/usuariosAdminService');

      const resultado = await eliminarUsuario(usuarioId);

      if (resultado.success) {
        await cargarUsuariosData();
        setExito('Usuario eliminado exitosamente');
        setTimeout(() => setExito(''), 3000);
      } else {
        setError(resultado.error || 'Error al eliminar el usuario');
      }

    } catch (err: any) {
      setError(`Error al eliminar usuario: ${err.message}`);
    } finally {
      setCargando(false);
      ocultarMenuContextual();
    }
  };

  // Efecto para cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (menuContextual.visible) {
        ocultarMenuContextual();
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuContextual.visible]);

  return (
    <div className="gestion-usuarios-contenedor">
      {/* Header principal */}
      <div className="gestion-usuarios-header">
        <div className="gestion-usuarios-titulo">
          <h1>👥 Gestión de Usuarios</h1>
          <p>Administra usuarios, roles y permisos del sistema</p>
        </div>
        <button
          className="gestion-usuarios-btn-crear"
          onClick={abrirCrearUsuario}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
          </svg>
          Crear Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="gestion-usuarios-estadisticas">
        <div className="gestion-usuarios-stat-card">
          <div className="gestion-usuarios-stat-icono">👥</div>
          <div className="gestion-usuarios-stat-contenido">
            <div className="gestion-usuarios-stat-valor">{estadisticas.total}</div>
            <div className="gestion-usuarios-stat-label">Total Usuarios</div>
          </div>
        </div>

        <div className="gestion-usuarios-stat-card">
          <div className="gestion-usuarios-stat-icono">✅</div>
          <div className="gestion-usuarios-stat-contenido">
            <div className="gestion-usuarios-stat-valor">{estadisticas.activos}</div>
            <div className="gestion-usuarios-stat-label">Activos</div>
          </div>
        </div>

        <div className="gestion-usuarios-stat-card">
          <div className="gestion-usuarios-stat-icono">👑</div>
          <div className="gestion-usuarios-stat-contenido">
            <div className="gestion-usuarios-stat-valor">{estadisticas.administradores}</div>
            <div className="gestion-usuarios-stat-label">Administradores</div>
          </div>
        </div>

        <div className="gestion-usuarios-stat-card">
          <div className="gestion-usuarios-stat-icono">🎓</div>
          <div className="gestion-usuarios-stat-contenido">
            <div className="gestion-usuarios-stat-valor">{estadisticas.estudiantes}</div>
            <div className="gestion-usuarios-stat-label">Estudiantes</div>
          </div>
        </div>

        <div className="gestion-usuarios-stat-card">
          <div className="gestion-usuarios-stat-icono">💎</div>
          <div className="gestion-usuarios-stat-contenido">
            <div className="gestion-usuarios-stat-valor">{estadisticas.premium}</div>
            <div className="gestion-usuarios-stat-label">Usuarios Premium</div>
          </div>
        </div>

        <div className="gestion-usuarios-stat-card">
          <div className="gestion-usuarios-stat-icono">🆕</div>
          <div className="gestion-usuarios-stat-contenido">
            <div className="gestion-usuarios-stat-valor">{estadisticas.nuevosHoy}</div>
            <div className="gestion-usuarios-stat-label">Nuevos Hoy</div>
          </div>
        </div>
      </div>

      {/* Mensajes de estado */}
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

      {/* Contenido principal */}
      <div className="gestion-usuarios-contenido">
        {/* Lista de usuarios */}
        {!usuarioSeleccionado && !mostrarCrearUsuario && (
          <div className="gestion-usuarios-lista">
            {/* Filtros */}
            <div className="gestion-usuarios-controles">
              <div className="gestion-usuarios-campo-busqueda">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" stroke="currentColor" strokeWidth="2" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar por nombre o correo..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>

              <div className="gestion-usuarios-filtros">
                <select
                  value={filtroRol}
                  onChange={(e) => setFiltroRol(e.target.value)}
                >
                  <option value="todos">Todos los roles</option>
                  <option value="admin">Administradores</option>
                  <option value="estudiante">Estudiantes</option>
                </select>

                <select
                  value={filtroSuscripcion}
                  onChange={(e) => setFiltroSuscripcion(e.target.value)}
                >
                  <option value="todas">Todas las membresías</option>
                  <option value="free">Gratuita</option>
                  <option value="basic">Básica</option>
                  <option value="premium">Premium</option>
                  <option value="pro">Profesional</option>
                </select>

                <label className="gestion-usuarios-toggle">
                  <input
                    type="checkbox"
                    checked={mostrarEliminados}
                    onChange={(e) => setMostrarEliminados(e.target.checked)}
                  />
                  <span>Ver eliminados</span>
                </label>
              </div>
            </div>

            {/* Barra de acciones para usuarios seleccionados */}
            {mostrarAccionesSeleccion && (
              <div className="gestion-usuarios-acciones-seleccion">
                <div className="gestion-usuarios-info-seleccion">
                  <span className="gestion-usuarios-contador-seleccion">
                    {usuariosSeleccionados.size} usuario(s) seleccionado(s)
                  </span>
                </div>
                <div className="gestion-usuarios-botones-seleccion">
                  <button
                    className="gestion-usuarios-btn-eliminar-masivo"
                    onClick={eliminarUsuariosSeleccionados}
                    disabled={cargando}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Eliminar Seleccionados
                  </button>
                  <button
                    className="gestion-usuarios-btn-limpiar-seleccion"
                    onClick={() => {
                      setUsuariosSeleccionados(new Set());
                      setSeleccionarTodos(false);
                      setMostrarAccionesSeleccion(false);
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    Limpiar Selección
                  </button>
                </div>
              </div>
            )}

            {/* Tabla de usuarios */}
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
                        <input
                          type="checkbox"
                          checked={seleccionarTodos}
                          onChange={toggleSeleccionarTodos}
                          className="gestion-usuarios-checkbox-principal"
                        />
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
                          <input
                            type="checkbox"
                            checked={usuariosSeleccionados.has(usuario.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleSeleccionUsuario(usuario.id);
                            }}
                            className="gestion-usuarios-checkbox-usuario"
                          />
                        </td>
                        <td className="gestion-usuarios-celda-usuario">
                          <div
                            className="gestion-usuarios-info-usuario"
                            onClick={() => seleccionarUsuario(usuario)}
                            style={{ cursor: 'pointer' }}
                          >
                            {usuario.url_foto_perfil ? (
                              <img
                                src={usuario.url_foto_perfil}
                                alt={usuario.nombre_completo}
                                className="gestion-usuarios-avatar"
                              />
                            ) : (
                              <div className="gestion-usuarios-avatar-placeholder">
                                {usuario.nombre?.charAt(0) || ''}{usuario.apellido?.charAt(0) || ''}
                              </div>
                            )}
                            <div className="gestion-usuarios-datos-usuario">
                              <span className="gestion-usuarios-nombre">
                                {usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()}
                              </span>
                              <span className="gestion-usuarios-ubicacion">
                                {usuario.ciudad ? `${usuario.ciudad}, ${usuario.pais}` : usuario.pais || ''}
                              </span>
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
                            {usuario.suscripcion === 'free' ? 'Gratuita' :
                              usuario.suscripcion === 'basic' ? 'Básica' :
                                usuario.suscripcion === 'premium' ? 'Premium' :
                                  usuario.suscripcion === 'pro' ? 'Profesional' : usuario.suscripcion}
                          </span>
                        </td>
                        <td>{new Date(usuario.fecha_creacion).toLocaleDateString('es-ES')}</td>
                        <td>
                          <span className={`gestion-usuarios-estado ${usuario.eliminado ? 'inactivo' : 'activo'}`}>
                            {usuario.eliminado ? 'Eliminado' : 'Activo'}
                          </span>
                        </td>
                        <td className="gestion-usuarios-celda-acciones">
                          <button
                            className="gestion-usuarios-btn-accion"
                            onClick={(e) => {
                              e.stopPropagation();
                              seleccionarUsuario(usuario);
                            }}
                          >
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

        {/* Detalle de usuario */}
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

        {/* Crear usuario */}
        {mostrarCrearUsuario && (
          <div className="gestion-usuarios-crear">
            <CrearUsuario
              onCerrar={cerrarCrearUsuario}
              onUsuarioCreado={onUsuarioCreado}
            />
          </div>
        )}

        {/* Menú contextual */}
        {menuContextual.visible && (
          <div
            className="gestion-usuarios-menu-contextual"
            style={{
              position: 'fixed',
              left: Math.min(menuContextual.x, window.innerWidth - 220), // Evitar que se salga de la pantalla
              top: Math.min(menuContextual.y, window.innerHeight - 200), // Evitar que se salga de la pantalla
              zIndex: 1000
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="gestion-usuarios-menu-contextual-contenido">
              <button
                className="gestion-usuarios-menu-item"
                onClick={() => {
                  const usuario = usuarios.find(u => u.id === menuContextual.usuarioId);
                  if (usuario) {
                    seleccionarUsuario(usuario);
                    ocultarMenuContextual();
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
                Ver Detalles
              </button>

              <button
                className="gestion-usuarios-menu-item"
                onClick={() => {
                  toggleSeleccionUsuario(menuContextual.usuarioId);
                  ocultarMenuContextual();
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" />
                </svg>
                {usuariosSeleccionados.has(menuContextual.usuarioId) ? 'Deseleccionar' : 'Seleccionar'}
              </button>

              <div className="gestion-usuarios-menu-separador"></div>

              <button
                className="gestion-usuarios-menu-item gestion-usuarios-menu-item-peligroso"
                onClick={() => eliminarUsuarioIndividual(menuContextual.usuarioId)}
              >
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
