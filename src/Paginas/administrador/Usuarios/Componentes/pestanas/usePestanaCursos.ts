import { useState, useEffect } from 'react';
import { obtenerTodosPaquetes, obtenerTutorialesDisponibles, obtenerItemsPaquete } from '../../../../../servicios/paquetesService';
import { obtenerCursosDisponibles } from '../../../../../servicios/cursosServicio';
import { supabase } from '../../../../../servicios/clienteSupabase';

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
  eliminado: boolean;
  url_foto_perfil?: string;
  ciudad?: string;
  pais?: string;
  whatsapp?: string;
  nivel_habilidad?: string;
  documento_numero?: string;
  profesion?: string;
}

export interface Curso {
  id: string;
  titulo: string;
  imagen_url: string;
  precio_normal: number;
  precio_rebajado: number | null;
  descripcion: string;
  tipo?: 'curso' | 'tutorial';
  duracion?: number;
  precio?: number;
}

export interface Tutorial {
  id: string;
  titulo: string;
  imagen_url: string;
  duracion: number;
  precio_normal: number;
  precio_rebajado: number | null;
  descripcion: string;
  precio?: number;
}

export interface Paquete {
  id: string;
  titulo: string;
  descripcion_corta?: string;
  imagen_url?: string;
  precio_normal: number;
  precio_rebajado?: number;
  total_tutoriales?: number;
  nivel?: string;
  categoria?: string;
}

export interface Inscripcion {
  id: string;
  curso_id?: string;
  tutorial_id?: string;
  paquete_id?: string;
  fecha_inscripcion: string;
  estado: string;
  curso?: Curso;
  paquetes_tutoriales?: Paquete;
}

export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatearPrecio(precio: number | string): string {
  const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(numero);
}

export function usePestanaCursos(usuario: Usuario) {
  const [cursosInscritos, setCursosInscritos] = useState<Inscripcion[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [tutorialesDisponibles, setTutorialesDisponibles] = useState<Tutorial[]>([]);
  const [paquetesInscritos, setPaquetesInscritos] = useState<Inscripcion[]>([]);
  const [paquetesDisponibles, setPaquetesDisponibles] = useState<Paquete[]>([]);

  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [cargandoDisponibles, setCargandoDisponibles] = useState(false);
  const [cargandoPaquetes, setCargandoPaquetes] = useState(false);

  const [busquedaCursos, setBusquedaCursos] = useState('');
  const [filtroTipoContenido, setFiltroTipoContenido] = useState<'todos' | 'cursos' | 'tutoriales' | 'paquetes'>('todos');
  const [paginaActualTutoriales, setPaginaActualTutoriales] = useState(1);
  const elementosPorPagina = 6;

  // Replaces alert() for success/error messages
  const [mensajeOperacion, setMensajeOperacion] = useState<{ tipo: 'exito' | 'error' | 'advertencia'; texto: string } | null>(null);
  // Replaces confirm() for quitarCurso and quitarPaquete
  const [confirmandoQuitarCurso, setConfirmandoQuitarCurso] = useState<string | null>(null);
  const [confirmandoQuitarPaquete, setConfirmandoQuitarPaquete] = useState<string | null>(null);

  useEffect(() => { cargarDatosCompletos(); }, []);
  useEffect(() => { if (busquedaCursos) setPaginaActualTutoriales(1); }, [busquedaCursos]);

  const cargarDatosCompletos = async () => {
    try {
      setCargandoCursos(true);
      setCargandoDisponibles(true);
      setCargandoPaquetes(true);

      await cargarCursosInscritos();
      await cargarPaquetesInscritos();

      const cursosResult = await obtenerCursosDisponibles();
      if (cursosResult.success && cursosResult.data) {
        setCursosDisponibles(cursosResult.data.map((c: any) => ({
          id: c.id, titulo: c.titulo,
          imagen_url: c.imagen_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
          precio_normal: c.precio_normal || 0, precio_rebajado: c.precio_rebajado,
          descripcion: c.descripcion || '', tipo: 'curso' as const,
          precio: c.precio_rebajado || c.precio_normal || 0
        })));
      }

      const tutorialesResult = await obtenerTutorialesDisponibles();
      if (tutorialesResult.success && tutorialesResult.data) {
        setTutorialesDisponibles(tutorialesResult.data.map((t: any) => ({
          id: t.id, titulo: t.titulo,
          imagen_url: t.imagen_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
          duracion: t.duracion || 30, precio_normal: t.precio_normal || 0, precio_rebajado: t.precio_rebajado,
          descripcion: t.descripcion || '', precio: t.precio_rebajado || t.precio_normal || 0
        })));
      }

      const paquetesResult = await obtenerTodosPaquetes();
      if (paquetesResult.success && paquetesResult.data) {
        setPaquetesDisponibles(paquetesResult.data.map((p: any) => ({
          id: p.id, titulo: p.titulo, descripcion_corta: p.descripcion_corta || p.descripcion,
          imagen_url: p.imagen_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
          precio_normal: p.precio_normal || 0, precio_rebajado: p.precio_rebajado,
          total_tutoriales: p.total_tutoriales || 0, nivel: p.nivel || 'Principiante', categoria: p.categoria || 'General'
        })));
      }
    } catch {
    } finally {
      setCargandoCursos(false);
      setCargandoDisponibles(false);
      setCargandoPaquetes(false);
    }
  };

  const cargarCursosInscritos = async () => {
    try {
      const { data: inscripciones, error: inscripcionesError } = await supabase
        .from('inscripciones').select('*').eq('usuario_id', usuario.id);

      if (inscripcionesError) return;

      const temp: Inscripcion[] = [];
      for (const inscripcion of inscripciones || []) {
        let detalleCurso = null;
        if (inscripcion.curso_id) {
          const { data: curso } = await supabase.from('cursos').select('id, titulo, imagen_url, precio_normal, precio_rebajado, descripcion').eq('id', inscripcion.curso_id).single();
          if (curso) detalleCurso = { ...curso, tipo: 'curso' as const, precio: curso.precio_rebajado || curso.precio_normal };
        } else if (inscripcion.tutorial_id) {
          const { data: tutorial } = await supabase.from('tutoriales').select('id, titulo, imagen_url, precio_normal, precio_rebajado, descripcion').eq('id', inscripcion.tutorial_id).single();
          if (tutorial) detalleCurso = { ...tutorial, tipo: 'tutorial' as const, precio: tutorial.precio_rebajado || tutorial.precio_normal };
        }
        if (detalleCurso) temp.push({ id: inscripcion.id, curso_id: inscripcion.curso_id, tutorial_id: inscripcion.tutorial_id, paquete_id: inscripcion.paquete_id, fecha_inscripcion: inscripcion.fecha_inscripcion, estado: inscripcion.estado || 'activo', curso: detalleCurso });
      }
      setCursosInscritos(temp);
    } catch {
      setCursosInscritos([]);
    }
  };

  const cargarPaquetesInscritos = async () => {
    try {
      const { data, error } = await supabase
        .from('inscripciones')
        .select('*, paquetes_tutoriales (id, titulo, descripcion_corta, imagen_url, precio_normal, precio_rebajado, total_tutoriales, nivel, categoria)')
        .eq('usuario_id', usuario.id)
        .not('paquete_id', 'is', null);
      if (error) return;
      setPaquetesInscritos(data || []);
    } catch {
      setPaquetesInscritos([]);
    }
  };

  const agregarTutorialAUsuario = async (tutorialId: string) => {
    try {
      setCargandoCursos(true);
      const { error } = await supabase.from('inscripciones').insert({ usuario_id: usuario.id, tutorial_id: tutorialId, fecha_inscripcion: new Date().toISOString(), estado: 'activo', porcentaje_completado: 0, completado: false }).select().single();
      if (error) throw error;
      await cargarCursosInscritos();
    } catch {
      setMensajeOperacion({ tipo: 'error', texto: 'Error al agregar el tutorial. Por favor intenta de nuevo.' });
    } finally {
      setCargandoCursos(false);
    }
  };

  const agregarCursoAUsuario = async (cursoId: string) => {
    try {
      setCargandoCursos(true);
      const { error } = await supabase.from('inscripciones').insert({ usuario_id: usuario.id, curso_id: cursoId, fecha_inscripcion: new Date().toISOString(), estado: 'activo', porcentaje_completado: 0, completado: false }).select().single();
      if (error) throw error;
      await cargarCursosInscritos();
    } catch {
      setMensajeOperacion({ tipo: 'error', texto: 'Error al agregar el curso. Por favor intenta de nuevo.' });
    } finally {
      setCargandoCursos(false);
    }
  };

  const agregarPaqueteAUsuario = async (paqueteId: string) => {
    try {
      setCargandoPaquetes(true);
      const { error: paqueteError } = await supabase.from('inscripciones').insert({ usuario_id: usuario.id, paquete_id: paqueteId, fecha_inscripcion: new Date().toISOString(), estado: 'activo', porcentaje_completado: 0, completado: false }).select().single();
      if (paqueteError) throw paqueteError;

      const { success, data: tutorialIds } = await obtenerItemsPaquete(paqueteId);
      if (success && tutorialIds && tutorialIds.length > 0) {
        const yaInscritos = cursosInscritos.filter(i => i.tutorial_id && tutorialIds.includes(i.tutorial_id)).map(i => i.tutorial_id);
        const nuevos = tutorialIds.filter(id => !yaInscritos.includes(id));
        if (nuevos.length > 0) {
          const { error: tutorialesError } = await supabase.from('inscripciones').insert(nuevos.map(tutorialId => ({ usuario_id: usuario.id, tutorial_id: tutorialId, fecha_inscripcion: new Date().toISOString(), estado: 'activo', porcentaje_completado: 0, completado: false })));
          if (tutorialesError) {
            setMensajeOperacion({ tipo: 'advertencia', texto: 'El paquete se agregó, pero hubo un problema agregando algunos tutoriales individuales.' });
          }
        }
      }

      await Promise.all([cargarPaquetesInscritos(), cargarCursosInscritos()]);
      setMensajeOperacion({ tipo: 'exito', texto: 'Paquete y tutoriales agregados exitosamente.' });
    } catch {
      setMensajeOperacion({ tipo: 'error', texto: 'Error al agregar el paquete. Por favor intenta de nuevo.' });
    } finally {
      setCargandoPaquetes(false);
    }
  };

  const confirmarQuitarCurso = async () => {
    if (!confirmandoQuitarCurso) return;
    const id = confirmandoQuitarCurso;
    setConfirmandoQuitarCurso(null);
    try {
      setCargandoCursos(true);
      const { error } = await supabase.from('inscripciones').delete().eq('id', id);
      if (error) throw error;
      await cargarCursosInscritos();
    } catch {
      setMensajeOperacion({ tipo: 'error', texto: 'Error al eliminar el curso. Por favor intenta de nuevo.' });
    } finally {
      setCargandoCursos(false);
    }
  };

  const confirmarQuitarPaquete = async () => {
    if (!confirmandoQuitarPaquete) return;
    const id = confirmandoQuitarPaquete;
    setConfirmandoQuitarPaquete(null);
    try {
      setCargandoPaquetes(true);
      const { error } = await supabase.from('inscripciones').delete().eq('id', id);
      if (error) throw error;
      await cargarPaquetesInscritos();
    } catch {
      setMensajeOperacion({ tipo: 'error', texto: 'Error al eliminar el paquete. Por favor intenta de nuevo.' });
    } finally {
      setCargandoPaquetes(false);
    }
  };

  const cursosDisponiblesFiltrados = cursosDisponibles
    .filter(c => !cursosInscritos.some(i => i.curso_id === c.id))
    .filter(c => c.titulo.toLowerCase().includes(busquedaCursos.toLowerCase()));

  const tutorialesDisponiblesFiltrados = tutorialesDisponibles
    .filter(t => !cursosInscritos.some(i => i.tutorial_id === t.id))
    .filter(t => t.titulo.toLowerCase().includes(busquedaCursos.toLowerCase()));

  const paquetesDisponiblesFiltrados = paquetesDisponibles
    .filter(p => !paquetesInscritos.some(i => i.paquete_id === p.id))
    .filter(p => p.titulo.toLowerCase().includes(busquedaCursos.toLowerCase()));

  const totalPaginasTutoriales = Math.ceil(tutorialesDisponiblesFiltrados.length / elementosPorPagina);
  const tutorialesPaginados = tutorialesDisponiblesFiltrados.slice((paginaActualTutoriales - 1) * elementosPorPagina, paginaActualTutoriales * elementosPorPagina);

  const cambiarPaginaTutoriales = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginasTutoriales) setPaginaActualTutoriales(nuevaPagina);
  };

  return {
    cursosInscritos, cursosDisponibles, tutorialesDisponibles, paquetesInscritos, paquetesDisponibles,
    cargandoCursos, cargandoDisponibles, cargandoPaquetes,
    busquedaCursos, setBusquedaCursos, filtroTipoContenido, setFiltroTipoContenido,
    paginaActualTutoriales, totalPaginasTutoriales, tutorialesPaginados,
    mensajeOperacion, setMensajeOperacion,
    confirmandoQuitarCurso, setConfirmandoQuitarCurso, confirmarQuitarCurso,
    confirmandoQuitarPaquete, setConfirmandoQuitarPaquete, confirmarQuitarPaquete,
    cursosDisponiblesFiltrados, tutorialesDisponiblesFiltrados, paquetesDisponiblesFiltrados,
    agregarTutorialAUsuario, agregarCursoAUsuario, agregarPaqueteAUsuario,
    cambiarPaginaTutoriales,
  };
}
