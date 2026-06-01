import { useState, useEffect } from 'react';
import { cargarUsuariosEnriquecido, calcularEstadisticas, eliminarUsuario, type UsuarioAdminEnriquecido, type ContenidoUsuario } from '../../../servicios/usuariosAdminService';

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
  // Datos enriquecidos (RPC admin_listar_usuarios_enriquecido)
  membresia_nombre?: string | null;
  membresia_color?: string | null;
  membresia_estado?: string | null;
  membresia_vence?: string | null;
  membresia_dias_restantes?: number | null;
  ult_ip?: string | null;
  ult_ciudad?: string | null;
  ult_pais?: string | null;
  ult_visita?: string | null;
  ult_es_movil?: boolean | null;
  dias_activos?: number | null;
  tiempo_total_min?: number | null;
  sesiones_total?: number | null;
  ultima_sesion?: string | null;
  en_linea?: boolean | null;
  total_contenido?: number | null;
  total_cursos?: number | null;
  total_tutoriales?: number | null;
  total_paquetes?: number | null;
  contenido?: ContenidoUsuario[] | null;
}

export interface EstadisticasUsuarios {
  total: number;
  activos: number;
  administradores: number;
  estudiantes: number;
  premium: number;
  gratuitos: number;
  nuevosHoy: number;
}

export function useGestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [mostrarCrearUsuario, setMostrarCrearUsuario] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroSuscripcion, setFiltroSuscripcion] = useState('todas');
  const [filtroMembresiaEstado, setFiltroMembresiaEstado] = useState('todos');
  const [filtroActividad, setFiltroActividad] = useState('todos');
  const [mostrarEliminados, setMostrarEliminados] = useState(false);
  const [orden, setOrden] = useState<{ campo: string; dir: 'asc' | 'desc' }>({ campo: 'fecha_creacion', dir: 'desc' });

  const cambiarOrden = (campo: string) =>
    setOrden(o => o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' });

  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<Set<string>>(new Set());
  const [seleccionarTodos, setSeleccionarTodos] = useState(false);
  const [mostrarAccionesSeleccion, setMostrarAccionesSeleccion] = useState(false);

  const [menuContextual, setMenuContextual] = useState<{ visible: boolean; x: number; y: number; usuarioId: string }>({
    visible: false, x: 0, y: 0, usuarioId: ''
  });

  const [estadisticas, setEstadisticas] = useState<EstadisticasUsuarios>({
    total: 0, activos: 0, administradores: 0, estudiantes: 0, premium: 0, gratuitos: 0, nuevosHoy: 0
  });

  // State for confirm dialogs (replaces window.confirm)
  const [confirmandoBulk, setConfirmandoBulk] = useState(false);
  const [confirmandoIndividualId, setConfirmandoIndividualId] = useState<string | null>(null);

  useEffect(() => { cargarUsuariosData(); }, []);
  useEffect(() => { if (usuarios.length > 0) procesarParametrosURL(); }, [usuarios]);
  useEffect(() => { cargarUsuariosData(); }, [mostrarEliminados]);

  useEffect(() => {
    const handleClickOutside = () => { if (menuContextual.visible) ocultarMenuContextual(); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuContextual.visible]);

  const cargarUsuariosData = async () => {
    try {
      setCargando(true);
      setError('');
      const usuariosData = await cargarUsuariosEnriquecido(mostrarEliminados);
      const usuariosMapeados: Usuario[] = usuariosData.map((u) => ({
        id: u.id,
        nombre: u.nombre || '',
        apellido: u.apellido || '',
        nombre_completo: u.nombre_completo || `${u.nombre || ''} ${u.apellido || ''}`.trim(),
        correo_electronico: u.correo_electronico || '',
        rol: (u.rol || '').toLowerCase(),
        suscripcion: (u.suscripcion || '').toLowerCase(),
        fecha_creacion: u.fecha_creacion || new Date().toISOString(),
        fecha_actualizacion: u.fecha_creacion || new Date().toISOString(),
        ultima_actividad: u.ultima_actividad || undefined,
        url_foto_perfil: u.url_foto_perfil || undefined,
        eliminado: !!u.eliminado,
        whatsapp: u.whatsapp || undefined,
        ciudad: u.ciudad || undefined,
        pais: u.pais || undefined,
        nivel_habilidad: undefined, documento_numero: undefined, profesion: undefined,
        documento_tipo: undefined, instrumento: undefined,
        latitud: undefined, longitud: undefined, zona_horaria: undefined, ip_registro: undefined,
        membresia_nombre: u.membresia_nombre, membresia_color: u.membresia_color,
        membresia_estado: u.membresia_estado, membresia_vence: u.membresia_vence,
        membresia_dias_restantes: u.membresia_dias_restantes,
        ult_ip: u.ult_ip, ult_ciudad: u.ult_ciudad, ult_pais: u.ult_pais, ult_visita: u.ult_visita,
        ult_es_movil: u.ult_es_movil,
        dias_activos: u.dias_activos, tiempo_total_min: u.tiempo_total_min,
        sesiones_total: u.sesiones_total, ultima_sesion: u.ultima_sesion, en_linea: u.en_linea,
        total_contenido: u.total_contenido, total_cursos: u.total_cursos,
        total_tutoriales: u.total_tutoriales, total_paquetes: u.total_paquetes,
        contenido: u.contenido || [],
      }));
      setUsuarios(usuariosMapeados);
      calcularEstadisticasLocal(usuariosData);
    } catch (err: any) {
      setError(`Error al cargar los usuarios: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticasLocal = (usuariosData: UsuarioAdminEnriquecido[]) => {
    const base = calcularEstadisticas(usuariosData);
    const administradores = usuariosData.filter(u => ['admin', 'administrador'].includes((u.rol || '').toLowerCase())).length;
    // Premium = membresía real activa (no la columna legacy 'suscripcion')
    const premium = usuariosData.filter(u => u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa').length;
    const gratuitos = usuariosData.filter(u => !u.membresia_nombre || (u.membresia_estado || '').toLowerCase() !== 'activa').length;
    const hoyISO = new Date().toISOString().slice(0, 10);
    const nuevosHoy = usuariosData.filter(u => (u.fecha_creacion || '').slice(0, 10) === hoyISO).length;
    setEstadisticas({ total: base.total, activos: base.activos, administradores, estudiantes: base.estudiantes, premium, gratuitos, nuevosHoy });
  };

  const procesarParametrosURL = () => {
    const usuarioId = new URLSearchParams(window.location.search).get('usuario');
    if (usuarioId && usuarios.length > 0) {
      const usuario = usuarios.find(u => u.id === usuarioId);
      if (usuario) setUsuarioSeleccionado(usuario);
    }
  };

  const seleccionarUsuario = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setMostrarCrearUsuario(false);
    const url = new URL(window.location.href);
    url.searchParams.set('usuario', usuario.id);
    window.history.pushState({}, '', url.toString());
  };

  const cerrarDetalles = () => {
    setUsuarioSeleccionado(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('usuario');
    window.history.pushState({}, '', url.toString());
  };

  const abrirCrearUsuario = () => { setMostrarCrearUsuario(true); setUsuarioSeleccionado(null); };
  const cerrarCrearUsuario = () => setMostrarCrearUsuario(false);

  const onUsuarioCreado = async (usuario: Usuario) => {
    try {
      await cargarUsuariosData();
      setMostrarCrearUsuario(false);
      setExito('Usuario creado exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch { }
  };

  const onUsuarioActualizado = async (usuarioActualizado: Usuario) => {
    try {
      const actualizados = usuarios.map(u => u.id === usuarioActualizado.id ? usuarioActualizado : u);
      setUsuarios(actualizados);
      setUsuarioSeleccionado(usuarioActualizado);
      calcularEstadisticasLocal(actualizados);
      setExito('Usuario actualizado exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch { }
  };

  const onUsuarioEliminado = async (_usuarioId: string) => {
    try {
      await cargarUsuariosData();
      setUsuarioSeleccionado(null);
      setExito('Usuario eliminado exitosamente');
      setTimeout(() => setExito(''), 3000);
    } catch { }
  };

  const toggleSeleccionUsuario = (usuarioId: string) => {
    const nuevos = new Set(usuariosSeleccionados);
    if (nuevos.has(usuarioId)) nuevos.delete(usuarioId); else nuevos.add(usuarioId);
    setUsuariosSeleccionados(nuevos);
    setMostrarAccionesSeleccion(nuevos.size > 0);
  };

  const toggleSeleccionarTodos = (usuariosFiltrados: Usuario[]) => {
    if (seleccionarTodos) {
      setUsuariosSeleccionados(new Set());
      setSeleccionarTodos(false);
      setMostrarAccionesSeleccion(false);
    } else {
      setUsuariosSeleccionados(new Set(usuariosFiltrados.map(u => u.id)));
      setSeleccionarTodos(true);
      setMostrarAccionesSeleccion(true);
    }
  };

  const mostrarMenuContextual = (e: React.MouseEvent, usuarioId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuContextual({ visible: true, x: rect.right + 10, y: rect.top + (rect.height / 2), usuarioId });
  };

  const ocultarMenuContextual = () => setMenuContextual({ visible: false, x: 0, y: 0, usuarioId: '' });

  const pedirConfirmacionBulk = () => {
    if (usuariosSeleccionados.size === 0) return;
    setConfirmandoBulk(true);
  };

  const confirmarEliminarBulk = async () => {
    setConfirmandoBulk(false);
    try {
      setCargando(true);
      await Promise.all(Array.from(usuariosSeleccionados).map(id => eliminarUsuario(id)));
      await cargarUsuariosData();
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

  const pedirConfirmacionIndividual = (usuarioId: string) => {
    setConfirmandoIndividualId(usuarioId);
    ocultarMenuContextual();
  };

  const confirmarEliminarIndividual = async () => {
    if (!confirmandoIndividualId) return;
    const id = confirmandoIndividualId;
    setConfirmandoIndividualId(null);
    try {
      setCargando(true);
      const resultado = await eliminarUsuario(id);
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
    }
  };

  const usuariosFiltrados = usuarios.filter((u) => {
    const q = busqueda.trim().toLowerCase();
    const matchBusqueda = q === '' || (u.nombre_completo?.toLowerCase().includes(q) || u.correo_electronico?.toLowerCase().includes(q));
    const matchRol = filtroRol === 'todos' || (u.rol || '').toLowerCase() === filtroRol;
    const tieneMembresiaActiva = !!u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa';
    const matchSuscripcion =
      filtroSuscripcion === 'todas' ||
      (filtroSuscripcion === 'con_membresia' && tieneMembresiaActiva) ||
      (filtroSuscripcion === 'solo_tutoriales' && !tieneMembresiaActiva && (u.total_contenido || 0) > 0) ||
      (filtroSuscripcion === 'sin_nada' && !tieneMembresiaActiva && (u.total_contenido || 0) === 0) ||
      (u.membresia_nombre || '').toLowerCase() === filtroSuscripcion;
    const estadoM = (u.membresia_estado || '').toLowerCase();
    const matchMembresiaEstado =
      filtroMembresiaEstado === 'todos' ||
      (filtroMembresiaEstado === 'por_vencer' && tieneMembresiaActiva && (u.membresia_dias_restantes ?? 999) <= 7) ||
      estadoM === filtroMembresiaEstado;
    const refMs = u.ultima_sesion || u.ultima_actividad;
    const diasDesdeActividad = refMs ? Math.floor((Date.now() - new Date(refMs).getTime()) / 86400000) : null;
    const matchActividad =
      filtroActividad === 'todos' ||
      (filtroActividad === 'activos_7' && diasDesdeActividad !== null && diasDesdeActividad <= 7) ||
      (filtroActividad === 'inactivos_30' && (diasDesdeActividad === null || diasDesdeActividad > 30)) ||
      (filtroActividad === 'nunca' && diasDesdeActividad === null);
    const matchEliminados = mostrarEliminados ? true : !u.eliminado;
    return matchBusqueda && matchRol && matchSuscripcion && matchMembresiaEstado && matchActividad && matchEliminados;
  }).sort((a, b) => {
    const dir = orden.dir === 'asc' ? 1 : -1;
    const ms = (d?: string | null) => d ? new Date(d).getTime() : 0;
    const val = (u: Usuario): number | string => {
      switch (orden.campo) {
        case 'nombre': return (u.nombre_completo || '').toLowerCase();
        case 'correo': return (u.correo_electronico || '').toLowerCase();
        case 'membresia': return u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa'
          ? (u.membresia_dias_restantes ?? 99999) : -1;
        case 'actividad': return ms(u.ultima_sesion || u.ultima_actividad);
        case 'frecuencia': return (u.dias_activos || 0) * 100000 + (u.tiempo_total_min || 0);
        case 'ubicacion': return (u.ult_pais || 'zzz').toLowerCase();
        case 'estado': return u.eliminado ? 1 : 0;
        case 'fecha_creacion':
        default: return ms(u.fecha_creacion);
      }
    };
    const av = val(a), bv = val(b);
    if (av < bv) return -1 * dir;
    if (av > bv) return 1 * dir;
    return 0;
  });

  const nombreConfirmandoIndividual = confirmandoIndividualId
    ? (usuarios.find(u => u.id === confirmandoIndividualId)?.nombre_completo || confirmandoIndividualId)
    : '';

  return {
    usuarios, usuariosFiltrados, usuarioSeleccionado, mostrarCrearUsuario,
    cargando, error, exito,
    busqueda, setBusqueda, filtroRol, setFiltroRol,
    filtroSuscripcion, setFiltroSuscripcion,
    filtroMembresiaEstado, setFiltroMembresiaEstado,
    filtroActividad, setFiltroActividad,
    orden, cambiarOrden,
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
  };
}
