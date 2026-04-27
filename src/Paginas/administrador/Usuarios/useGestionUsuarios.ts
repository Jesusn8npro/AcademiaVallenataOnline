import { useState, useEffect } from 'react';
import { cargarUsuarios, calcularEstadisticas, eliminarUsuario, type UsuarioAdmin } from '../../../servicios/usuariosAdminService';

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
  const [mostrarEliminados, setMostrarEliminados] = useState(false);

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
  useEffect(() => { cargarUsuariosData(); }, [busqueda, filtroRol, filtroSuscripcion, mostrarEliminados]);

  useEffect(() => {
    const handleClickOutside = () => { if (menuContextual.visible) ocultarMenuContextual(); };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [menuContextual.visible]);

  const cargarUsuariosData = async () => {
    try {
      setCargando(true);
      setError('');
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
        nivel_habilidad: undefined, documento_numero: undefined, profesion: undefined,
        documento_tipo: undefined, instrumento: undefined,
        latitud: undefined, longitud: undefined, zona_horaria: undefined, ip_registro: undefined,
      }));
      setUsuarios(usuariosMapeados);
      calcularEstadisticasLocal(usuariosData);
    } catch (err: any) {
      setError(`Error al cargar los usuarios: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  const calcularEstadisticasLocal = (usuariosData: UsuarioAdmin[]) => {
    const base = calcularEstadisticas(usuariosData);
    const administradores = usuariosData.filter(u => (u.rol || '').toLowerCase() === 'admin').length;
    const premium = usuariosData.filter(u => ['premium', 'pro'].includes((u.suscripcion || '').toLowerCase())).length;
    const gratuitos = usuariosData.filter(u => (u.suscripcion || '').toLowerCase() === 'free').length;
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
    const matchSuscripcion = filtroSuscripcion === 'todas' || (u.suscripcion || '').toLowerCase() === filtroSuscripcion;
    const matchEliminados = mostrarEliminados ? true : !u.eliminado;
    return matchBusqueda && matchRol && matchSuscripcion && matchEliminados;
  });

  const nombreConfirmandoIndividual = confirmandoIndividualId
    ? (usuarios.find(u => u.id === confirmandoIndividualId)?.nombre_completo || confirmandoIndividualId)
    : '';

  return {
    usuarios, usuariosFiltrados, usuarioSeleccionado, mostrarCrearUsuario,
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
  };
}
