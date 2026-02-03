import React, { useState, useEffect } from 'react';
import { actualizarUsuario, eliminarUsuario } from '../../../../servicios/usuariosAdminService';
import PestanaActividad from './pestanas/PestanaActividad';
import PestanaGeolocalizacion from './pestanas/PestanaGeolocalizacion';
import PestanaCursos from './pestanas/PestanaCursos';
import PestanaConfiguracion from './pestanas/PestanaConfiguracion';
import './DetalleUsuario.css';

// Definir la interfaz Usuario directamente aquí como en Svelte
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

interface Curso {
  id: string;
  titulo: string;
  imagen_url: string;
  precio_normal: number;
  precio_rebajado: number | null;
  descripcion: string;
}

interface Tutorial {
  id: string;
  titulo: string;
  imagen_url: string;
  duracion: number;
  precio_normal: number;
  precio_rebajado: number | null;
  descripcion: string;
}

interface Inscripcion {
  id: string;
  curso_id?: string;
  tutorial_id?: string;
  paquete_id?: string;
  fecha_inscripcion: string;
  porcentaje_completado: number;
  completado: boolean;
  estado: string;
  progreso: number;
  ultima_actividad: string;
  curso?: Curso | Tutorial;
  paquetes_tutoriales?: {
    id: string;
    titulo: string;
    descripcion_corta: string;
    imagen_url: string;
    precio_normal: number;
    precio_rebajado: number;
    total_tutoriales: number;
    nivel: string;
    categoria: string;
  };
}

interface Pago {
  id: string;
  descripcion: string;
  nombre_producto: string;
  fecha_transaccion: string;
  ref_payco: string;
  valor: number;
  estado: string;
  created_at: string;
}


interface HistorialGeolocalizacion {
  id: string;
  ip: string;
  pais: string;
  ciudad: string;
  isp: string;
  tipo_conexion: string;
  es_movil: boolean;
  es_vpn: boolean;
  primera_visita: string;
  ultima_visita: string;
  visitas_totales: number;
  bandera_url: string;
}

interface Props {
  usuario: Usuario;
  onCerrar: () => void;
  onUsuarioActualizado: (usuario: Usuario) => void;
  onUsuarioEliminado: (usuarioId: string) => void;
}

// Componente principal
const DetalleUsuario: React.FC<Props> = ({
  usuario,
  onCerrar,
  onUsuarioActualizado,
  onUsuarioEliminado
}) => {
  // Estados principales
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [editando, setEditando] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState('general');

  // Datos editables
  const [datosEditables, setDatosEditables] = useState<Usuario>({ ...usuario });

  // Datos adicionales
  const [cursosInscritos, setCursosInscritos] = useState<Inscripcion[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [tutorialesDisponibles, setTutorialesDisponibles] = useState<Tutorial[]>([]);
  const [paquetesInscritos, setPaquetesInscritos] = useState<Inscripcion[]>([]);
  const [paquetesDisponibles, setPaquetesDisponibles] = useState<any[]>([]);
  const [historialPagos, setHistorialPagos] = useState<Pago[]>([]);
  const [historialGeo, setHistorialGeo] = useState<HistorialGeolocalizacion[]>([]);

  // Estados de carga
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [cargandoPagos, setCargandoPagos] = useState(false);
  const [cargandoDisponibles, setCargandoDisponibles] = useState(false);
  const [cargandoPaquetes, setCargandoPaquetes] = useState(false);
  const [cargandoGeo, setCargandoGeo] = useState(false);

  // Estados para gestión de cursos
  const [mostrarAgregarCursos, setMostrarAgregarCursos] = useState(false);
  const [busquedaCursos, setBusquedaCursos] = useState('');
  const [mostrarGestionMembresia, setMostrarGestionMembresia] = useState(false);
  const [mostrarPaquetesDisponibles, setMostrarPaquetesDisponibles] = useState(false);
  const [filtroTipoContenido, setFiltroTipoContenido] = useState<'todos' | 'cursos' | 'tutoriales' | 'paquetes'>('todos');

  // Estados para drag & drop
  const [draggedItem, setDraggedItem] = useState<any>(null);
  const [draggedType, setDraggedType] = useState<'curso' | 'tutorial'>('curso');

  // Pestanas disponibles
  const pestanas = [
    { id: 'general', label: 'General', icono: 'general' },
    { id: 'actividad', label: 'Actividad', icono: 'actividad' },
    { id: 'geolocalizacion', label: 'Ubicación', icono: 'geolocalizacion' },
    { id: 'cursos', label: 'Cursos', icono: 'cursos' },
    { id: 'configuracion', label: 'Configuracion', icono: 'configuracion' }
  ];

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatosCompletos();
  }, []);

  // Cargar datos completos
  const cargarDatosCompletos = async () => {
    try {
      setCargando(true);

      // Cargar datos críticos primero
      await Promise.all([
        cargarCursosInscritos(),
        cargarPaquetesInscritos()
      ]);

      // Cargar datos específicos de la pestaña activa
      if (pestanaActiva === 'cursos') {
        await Promise.all([
          cargarCursosDisponibles(),
          cargarPaquetesDisponibles()
        ]);
      } else if (pestanaActiva === 'configuracion') {
        await cargarHistorialPagos();
      } else if (pestanaActiva === 'actividad') {
        // La pestaña de actividad se maneja con el componente PestanaActividad
      } else if (pestanaActiva === 'geolocalizacion') {
        await cargarHistorialGeolocalizacion();
      }
    } catch (err) {
      console.error('Error cargando datos completos:', err);
      setError('Error al cargar los datos del usuario');
    } finally {
      setCargando(false);
    }
  };

  // Cargar cursos inscritos
  const cargarCursosInscritos = async () => {
    try {
      setCargandoCursos(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 500));
      setCursosInscritos([]);
    } catch (err) {
      console.error('Error cargando cursos inscritos:', err);
    } finally {
      setCargandoCursos(false);
    }
  };

  // Cargar paquetes inscritos
  const cargarPaquetesInscritos = async () => {
    try {
      setCargandoPaquetes(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 500));
      setPaquetesInscritos([]);
    } catch (err) {
      console.error('Error cargando paquetes inscritos:', err);
    } finally {
      setCargandoPaquetes(false);
    }
  };

  // Cargar cursos disponibles
  const cargarCursosDisponibles = async () => {
    try {
      setCargandoDisponibles(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 500));
      setCursosDisponibles([]);
      setTutorialesDisponibles([]);
    } catch (err) {
      console.error('Error cargando cursos disponibles:', err);
    } finally {
      setCargandoDisponibles(false);
    }
  };

  // Cargar paquetes disponibles
  const cargarPaquetesDisponibles = async () => {
    try {
      setCargandoPaquetes(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 500));
      setPaquetesDisponibles([]);
    } catch (err) {
      console.error('Error cargando paquetes disponibles:', err);
    } finally {
      setCargandoPaquetes(false);
    }
  };

  // Cargar historial de pagos
  const cargarHistorialPagos = async () => {
    try {
      setCargandoPagos(true);
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 500));
      setHistorialPagos([]);
    } catch (err) {
      console.error('Error cargando historial de pagos:', err);
    } finally {
      setCargandoPagos(false);
    }
  };


  // Cargar historial de geolocalización
  const cargarHistorialGeolocalizacion = async () => {
    try {
      setCargandoGeo(true);
      // Simular datos de geolocalización por ahora
      const datos = {
        ubicaciones: [
          {
            id: '1',
            ciudad: usuario.ciudad || 'No especificada',
            pais: usuario.pais || 'No especificado',
            fecha: usuario.fecha_creacion,
            ip: usuario.ip_registro || 'N/A'
          }
        ]
      };
      setHistorialGeo(datos.ubicaciones.map((ubicacion: any) => ({
        ...ubicacion,
        isp: 'N/A',
        tipo_conexion: 'N/A',
        es_movil: false,
        es_vpn: false,
        latitud: '0',
        longitud: '0',
        zona_horaria: 'UTC',
        timestamp: ubicacion.fecha
      })));
    } catch (err) {
      console.error('Error cargando historial de geolocalización:', err);
    } finally {
      setCargandoGeo(false);
    }
  };

  // Cambiar pestaña
  const cambiarPestana = async (pestana: string) => {
    setPestanaActiva(pestana);

    // Cargar datos específicos de la pestaña bajo demanda
    if (pestana === 'cursos') {
      if (cursosDisponibles.length === 0) {
        await cargarCursosDisponibles();
      }
      if (paquetesDisponibles.length === 0) {
        await cargarPaquetesDisponibles();
      }
    } else if (pestana === 'configuracion') {
      if (historialPagos.length === 0) {
        await cargarHistorialPagos();
      }
    } else if (pestana === 'actividad') {
      // La pestaña de actividad se maneja con el componente PestanaActividad
    } else if (pestana === 'geolocalizacion') {
      if (historialGeo.length === 0) {
        await cargarHistorialGeolocalizacion();
      }
    }
  };

  // Activar edición
  const activarEdicion = () => {
    setEditando(true);
    setDatosEditables({ ...usuario });
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setEditando(false);
    setDatosEditables({ ...usuario });
    setError('');
  };

  // Guardar cambios
  const guardarCambios = async () => {
    try {
      setCargando(true);
      setError('');

      // Actualizar usuario usando Supabase
      const resultado = await actualizarUsuario(usuario.id, datosEditables);

      if (resultado.success) {
        setEditando(false);
        setExito('Cambios guardados exitosamente');
        onUsuarioActualizado(resultado.data);
      } else {
        setError(resultado.error || 'Error al actualizar el usuario');
      }

      setTimeout(() => {
        setExito('');
      }, 3000);
    } catch (err: any) {
      setError(`Error al actualizar: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Eliminar usuario
  const eliminarUsuarioHandler = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

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

  // Formatear fecha
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear precio
  const formatearPrecio = (precio: number | string) => {
    const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numero);
  };

  // Obtener iniciales
  const obtenerIniciales = (nombre: string, apellido: string) => {
    return `${nombre?.charAt(0) || ''}${apellido?.charAt(0) || ''}`.toUpperCase();
  };

  // Manejar actualización de usuario desde PestanaConfiguracion
  const handleUsuarioActualizado = (usuarioActualizado: Usuario) => {
    // Actualizar el usuario local
    Object.assign(usuario, usuarioActualizado);

    // Notificar al componente padre
    if (onUsuarioActualizado) {
      onUsuarioActualizado(usuarioActualizado);
    }
  };

  return (
    <div className="detalle-usuario">
      {/* Header del detalle */}
      <div className="detalle-usuario-header">
        <div className="detalle-usuario-info-header">
          <div className="detalle-usuario-avatar-grande">
            {usuario.url_foto_perfil ? (
              <img
                src={usuario.url_foto_perfil}
                alt={usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim()}
              />
            ) : (
              <div className="detalle-usuario-avatar-iniciales">
                {obtenerIniciales(
                  editando ? datosEditables.nombre : usuario.nombre,
                  editando ? datosEditables.apellido : usuario.apellido
                )}
              </div>
            )}
          </div>
          <div className="detalle-usuario-info-basica">
            <h2>{usuario.nombre_completo || `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || 'Usuario'}</h2>
            <p className="detalle-usuario-correo">{usuario.correo_electronico}</p>
            <div className="detalle-usuario-badges">
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.rol}`}>
                {usuario.rol}
              </span>
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.suscripcion}`}>
                {usuario.suscripcion}
              </span>
              <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.eliminado ? 'eliminado' : 'activo'}`}>
                {usuario.eliminado ? 'Eliminado' : 'Activo'}
              </span>
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

      {/* Mensajes de estado */}
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
          Usuario actualizado exitosamente
        </div>
      )}

      {/* Pestañas */}
      <div className="detalle-usuario-pestanas">
        {pestanas.map((pestana) => (
          <button
            key={pestana.id}
            className={`detalle-usuario-pestana ${pestanaActiva === pestana.id ? 'activa' : ''}`}
            onClick={() => cambiarPestana(pestana.id)}
          >
            <span className="detalle-usuario-pestana-icono">
              {pestana.id === 'general' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
                  <path d="M6 21v-2a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {pestana.id === 'actividad' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 3v18h18" stroke="currentColor" strokeWidth="2" />
                  <path d="M7 14l4-4 3 3 3-5" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {pestana.id === 'geolocalizacion' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 3c3 4 3 14 0 18" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {pestana.id === 'cursos' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M3 4h14a3 3 0 0 1 3 3v13H6a3 3 0 0 1-3-3V4z" stroke="currentColor" strokeWidth="2" />
                  <path d="M6 4v13" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
              {pestana.id === 'configuracion' && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                  <path d="M19.4 15a7.9 7.9 0 0 0 .1-6l2-1.6-2-3.4-2.4.6a8 8 0 0 0-5.2-2l-.6-2h-4l-.6 2a8 8 0 0 0-5.2 2L2.5 4l-2 3.4 2 1.6a8 8 0 0 0 .1 6l-2 1.6 2 3.4 2.4-.6a8 8 0 0 0 5.2 2l.6 2h4l.6-2a8 8 0 0 0 5.2-2l2.4.6 2-3.4-2-1.6z" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </span>
            {pestana.label}
          </button>
        ))}
      </div>

      {/* Contenido de las pestañas */}
      <div className="detalle-usuario-contenido-pestanas">
        {/* Pestaña General */}
        {pestanaActiva === 'general' && (
          <div className="detalle-usuario-pestana-contenido">
            <div className="detalle-usuario-seccion">
              <h3>Información Básica</h3>
              <div className="detalle-usuario-campos-grid">
                <div className="detalle-usuario-campo">
                  <label>Nombre:</label>
                  {editando ? (
                    <input
                      type="text"
                      value={datosEditables.nombre || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, nombre: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.nombre || 'No especificado'}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>Apellido:</label>
                  {editando ? (
                    <input
                      type="text"
                      value={datosEditables.apellido || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, apellido: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.apellido || 'No especificado'}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>Correo:</label>
                  {editando ? (
                    <input
                      type="email"
                      value={datosEditables.correo_electronico || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, correo_electronico: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.correo_electronico}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>Rol:</label>
                  {editando ? (
                    <select
                      value={datosEditables.rol || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, rol: e.target.value })}
                    >
                      <option value="estudiante">Estudiante</option>
                      <option value="profesor">Profesor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  ) : (
                    <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.rol}`}>
                      {usuario.rol}
                    </span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>Suscripción:</label>
                  {editando ? (
                    <select
                      value={datosEditables.suscripcion || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, suscripcion: e.target.value })}
                    >
                      <option value="free">Gratuita</option>
                      <option value="basic">Básica</option>
                      <option value="premium">Premium</option>
                      <option value="pro">Profesional</option>
                    </select>
                  ) : (
                    <span className={`detalle-usuario-badge detalle-usuario-badge-${usuario.suscripcion}`}>
                      {usuario.suscripcion}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="detalle-usuario-seccion">
              <h3>Información Adicional</h3>
              <div className="detalle-usuario-campos-grid">
                <div className="detalle-usuario-campo">
                  <label>Ciudad:</label>
                  {editando ? (
                    <input
                      type="text"
                      value={datosEditables.ciudad || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, ciudad: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.ciudad || 'No especificado'}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>País:</label>
                  {editando ? (
                    <input
                      type="text"
                      value={datosEditables.pais || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, pais: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.pais || 'No especificado'}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>WhatsApp:</label>
                  {editando ? (
                    <input
                      type="tel"
                      value={datosEditables.whatsapp || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, whatsapp: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.whatsapp || 'No especificado'}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>Nivel de Habilidad:</label>
                  {editando ? (
                    <select
                      value={datosEditables.nivel_habilidad || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, nivel_habilidad: e.target.value })}
                    >
                      <option value="">Seleccionar...</option>
                      <option value="principiante">Principiante</option>
                      <option value="intermedio">Intermedio</option>
                      <option value="avanzado">Avanzado</option>
                      <option value="experto">Experto</option>
                    </select>
                  ) : (
                    <span>{usuario.nivel_habilidad || 'No especificado'}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>Documento:</label>
                  {editando ? (
                    <input
                      type="text"
                      value={datosEditables.documento_numero || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, documento_numero: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.documento_numero || 'No especificado'}</span>
                  )}
                </div>
                <div className="detalle-usuario-campo">
                  <label>Profesión:</label>
                  {editando ? (
                    <input
                      type="text"
                      value={datosEditables.profesion || ''}
                      onChange={(e) => setDatosEditables({ ...datosEditables, profesion: e.target.value })}
                    />
                  ) : (
                    <span>{usuario.profesion || 'No especificado'}</span>
                  )}
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

            {/* Acciones de edición */}
            {editando ? (
              <div className="detalle-usuario-acciones-edicion">
                <button
                  className="detalle-usuario-btn-cancelar"
                  onClick={cancelarEdicion}
                  disabled={cargando}
                >
                  Cancelar
                </button>
                <button
                  className="detalle-usuario-btn-guardar"
                  onClick={guardarCambios}
                  disabled={cargando}
                >
                  {cargando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            ) : (
              <div className="detalle-usuario-acciones-usuario">
                <button
                  className="detalle-usuario-btn-eliminar"
                  onClick={eliminarUsuarioHandler}
                  disabled={cargando}
                >
                  Eliminar Usuario
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pestaña Cursos */}
        {pestanaActiva === 'cursos' && (
          <PestanaCursos usuario={usuario} />
        )}

        {/* Pestaña Actividad */}
        {pestanaActiva === 'actividad' && (
          <PestanaActividad usuario={usuario} />
        )}

        {/* Pestaña Geolocalización */}
        {pestanaActiva === 'geolocalizacion' && (
          <PestanaGeolocalizacion usuario={usuario} />
        )}

        {/* Pestaña Configuración */}
        {pestanaActiva === 'configuracion' && (
          <PestanaConfiguracion
            usuario={usuario}
            onUsuarioActualizado={handleUsuarioActualizado}
          />
        )}
      </div>
    </div>
  );
};

export default DetalleUsuario;
