import React, { useState, useEffect } from 'react';
import './PestanaCursos.css';
import { obtenerTodosPaquetes, obtenerTutorialesDisponibles, obtenerItemsPaquete } from '../../../../../servicios/paquetesService';
import { obtenerCursosDisponibles } from '../../../../../servicios/cursosServicio';
import { supabase } from '../../../../../servicios/supabaseCliente';

// Interfaces
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
  eliminado: boolean;
  url_foto_perfil?: string;
  ciudad?: string;
  pais?: string;
  whatsapp?: string;
  nivel_habilidad?: string;
  documento_numero?: string;
  profesion?: string;
}

interface Curso {
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

interface Tutorial {
  id: string;
  titulo: string;
  imagen_url: string;
  duracion: number;
  precio_normal: number;
  precio_rebajado: number | null;
  descripcion: string;
  precio?: number;
}

interface Paquete {
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

interface Inscripcion {
  id: string;
  curso_id?: string;
  tutorial_id?: string;
  paquete_id?: string;
  fecha_inscripcion: string;
  estado: string;
  curso?: Curso;
  paquetes_tutoriales?: Paquete;
}

interface Props {
  usuario: Usuario;
}

const PestanaCursos: React.FC<Props> = ({ usuario: _usuario }) => {
  // Estados principales
  const [cursosInscritos, setCursosInscritos] = useState<Inscripcion[]>([]);
  const [cursosDisponibles, setCursosDisponibles] = useState<Curso[]>([]);
  const [tutorialesDisponibles, setTutorialesDisponibles] = useState<Tutorial[]>([]);
  const [paquetesInscritos, setPaquetesInscritos] = useState<Inscripcion[]>([]);
  const [paquetesDisponibles, setPaquetesDisponibles] = useState<Paquete[]>([]);

  // Estados de carga
  const [cargandoCursos, setCargandoCursos] = useState(false);
  const [cargandoDisponibles, setCargandoDisponibles] = useState(false);
  const [cargandoPaquetes, setCargandoPaquetes] = useState(false);

  // Estados de filtros y búsqueda
  const [busquedaCursos, setBusquedaCursos] = useState('');
  const [filtroTipoContenido, setFiltroTipoContenido] = useState<'todos' | 'cursos' | 'tutoriales' | 'paquetes'>('todos');

  // Estados de paginación
  const [paginaActualTutoriales, setPaginaActualTutoriales] = useState(1);
  const elementosPorPagina = 6;

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatosCompletos();
  }, []);

  // Cargar datos completos
  const cargarDatosCompletos = async () => {
    try {
      setCargandoCursos(true);
      setCargandoDisponibles(true);
      setCargandoPaquetes(true);

      // Cargar cursos inscritos del usuario (como en Svelte original)
      await cargarCursosInscritos();

      // Cargar paquetes inscritos
      await cargarPaquetesInscritos();

      // Cargar cursos disponibles desde Supabase
      console.log('🔍 Cargando cursos desde Supabase...');
      const cursosResult = await obtenerCursosDisponibles();
      console.log('📊 Resultado cursos:', cursosResult);

      if (cursosResult.success && cursosResult.data) {
        const cursos = cursosResult.data.map((curso: any) => ({
          id: curso.id,
          titulo: curso.titulo,
          imagen_url: curso.imagen_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
          precio_normal: curso.precio_normal || 0,
          precio_rebajado: curso.precio_rebajado,
          descripcion: curso.descripcion || '',
          tipo: 'curso' as const,
          precio: curso.precio_rebajado || curso.precio_normal || 0
        }));
        console.log('✅ Cursos procesados:', cursos);
        setCursosDisponibles(cursos);
      } else {
        console.log('❌ Error cargando cursos:', cursosResult.error);
      }

      // Cargar tutoriales disponibles desde Supabase
      console.log('🔍 Cargando tutoriales desde Supabase...');
      const tutorialesResult = await obtenerTutorialesDisponibles();
      console.log('📊 Resultado tutoriales:', tutorialesResult);

      if (tutorialesResult.success && tutorialesResult.data) {
        const tutoriales = tutorialesResult.data.map((tutorial: any) => ({
          id: tutorial.id,
          titulo: tutorial.titulo,
          imagen_url: tutorial.imagen_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
          duracion: tutorial.duracion || 30,
          precio_normal: tutorial.precio_normal || 0,
          precio_rebajado: tutorial.precio_rebajado,
          descripcion: tutorial.descripcion || '',
          precio: tutorial.precio_rebajado || tutorial.precio_normal || 0
        }));
        console.log('✅ Tutoriales procesados:', tutoriales);
        setTutorialesDisponibles(tutoriales);
      } else {
        console.log('❌ Error cargando tutoriales:', tutorialesResult.error);
      }

      // Cargar paquetes disponibles desde Supabase
      console.log('🔍 Cargando paquetes desde Supabase...');
      const paquetesResult = await obtenerTodosPaquetes();
      console.log('📊 Resultado paquetes:', paquetesResult);

      if (paquetesResult.success && paquetesResult.data) {
        const paquetes = paquetesResult.data.map((paquete: any) => ({
          id: paquete.id,
          titulo: paquete.titulo,
          descripcion_corta: paquete.descripcion_corta || paquete.descripcion,
          imagen_url: paquete.imagen_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop',
          precio_normal: paquete.precio_normal || 0,
          precio_rebajado: paquete.precio_rebajado,
          total_tutoriales: paquete.total_tutoriales || 0,
          nivel: paquete.nivel || 'Principiante',
          categoria: paquete.categoria || 'General'
        }));
        console.log('✅ Paquetes procesados:', paquetes);
        setPaquetesDisponibles(paquetes);
      } else {
        console.log('❌ Error cargando paquetes:', paquetesResult.error);
      }

    } catch (err) {
      console.error('Error cargando datos completos:', err);
    } finally {
      setCargandoCursos(false);
      setCargandoDisponibles(false);
      setCargandoPaquetes(false);
    }
  };

  // Cargar cursos inscritos del usuario (exactamente como en Svelte original)
  const cargarCursosInscritos = async () => {
    try {
      console.log('🔍 Cargando cursos inscritos para usuario:', _usuario.id);

      // Cargar inscripciones básicas primero (como en Svelte)
      const { data: inscripciones, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select('*')
        .eq('usuario_id', _usuario.id);

      if (inscripcionesError) {
        console.error('❌ Error cargando inscripciones:', inscripcionesError);
        return;
      }

      console.log('📋 Inscripciones encontradas:', inscripciones);
      const cursosInscritosTemp: Inscripcion[] = [];

      // Para cada inscripción, cargar los detalles del curso o tutorial (como en Svelte)
      for (const inscripcion of inscripciones || []) {
        let detalleCurso = null;

        if (inscripcion.curso_id) {
          const { data: curso } = await supabase
            .from('cursos')
            .select('id, titulo, imagen_url, precio_normal, precio_rebajado, descripcion')
            .eq('id', inscripcion.curso_id)
            .single();

          if (curso) {
            detalleCurso = {
              ...curso,
              tipo: 'curso' as const,
              precio: curso.precio_rebajado || curso.precio_normal
            };
          }
        } else if (inscripcion.tutorial_id) {
          const { data: tutorial } = await supabase
            .from('tutoriales')
            .select('id, titulo, imagen_url, precio_normal, precio_rebajado, descripcion')
            .eq('id', inscripcion.tutorial_id)
            .single();

          if (tutorial) {
            detalleCurso = {
              ...tutorial,
              tipo: 'tutorial' as const,
              precio: tutorial.precio_rebajado || tutorial.precio_normal
            };
          }
        }

        if (detalleCurso) {
          cursosInscritosTemp.push({
            id: inscripcion.id,
            curso_id: inscripcion.curso_id,
            tutorial_id: inscripcion.tutorial_id,
            paquete_id: inscripcion.paquete_id,
            fecha_inscripcion: inscripcion.fecha_inscripcion,
            estado: inscripcion.estado || 'activo',
            curso: detalleCurso
          });
        }
      }

      console.log('✅ Cursos inscritos cargados:', cursosInscritosTemp);
      setCursosInscritos(cursosInscritosTemp);
    } catch (error) {
      console.error('❌ Error cargando cursos inscritos:', error);
      setCursosInscritos([]);
    }
  };

  // Cargar paquetes inscritos del usuario
  const cargarPaquetesInscritos = async () => {
    try {
      console.log('📦 Cargando paquetes inscritos para usuario:', _usuario.id);

      // Cargar inscripciones de paquetes
      const { data: inscripciones, error: inscripcionesError } = await supabase
        .from('inscripciones')
        .select(`
          *,
          paquetes_tutoriales (
            id,
            titulo,
            descripcion_corta,
            imagen_url,
            precio_normal,
            precio_rebajado,
            total_tutoriales,
            nivel,
            categoria
          )
        `)
        .eq('usuario_id', _usuario.id)
        .not('paquete_id', 'is', null);

      if (inscripcionesError) {
        console.error('❌ Error cargando paquetes inscritos:', inscripcionesError);
        return;
      }

      console.log('📋 Paquetes inscritos encontrados:', inscripciones);
      setPaquetesInscritos(inscripciones || []);
    } catch (error) {
      console.error('❌ Error cargando paquetes inscritos:', error);
      setPaquetesInscritos([]);
    }
  };

  // Resetear paginación cuando cambia la búsqueda
  useEffect(() => {
    if (busquedaCursos) {
      setPaginaActualTutoriales(1);
    }
  }, [busquedaCursos]);

  // ========================================
  // FUNCIONES DE GESTIÓN DE INSCRIPCIONES
  // ========================================

  // Función para agregar tutorial a usuario
  const agregarTutorialAUsuario = async (tutorialId: string) => {
    try {
      setCargandoCursos(true);
      console.log('📝 Agregando tutorial al usuario:', tutorialId);

      // Insertar inscripción en Supabase
      const { data, error } = await supabase
        .from('inscripciones')
        .insert({
          usuario_id: _usuario.id,
          tutorial_id: tutorialId,
          fecha_inscripcion: new Date().toISOString(),
          estado: 'activo',
          porcentaje_completado: 0,
          completado: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando inscripción:', error);
        throw error;
      }

      console.log('✅ Tutorial agregado exitosamente:', data);

      // Recargar cursos inscritos
      await cargarCursosInscritos();

    } catch (error) {
      console.error('❌ Error agregando tutorial:', error);
      alert('Error al agregar el tutorial. Por favor intenta de nuevo.');
    } finally {
      setCargandoCursos(false);
    }
  };

  // Función para agregar curso a usuario
  const agregarCursoAUsuario = async (cursoId: string) => {
    try {
      setCargandoCursos(true);
      console.log('📝 Agregando curso al usuario:', cursoId);

      // Insertar inscripción en Supabase
      const { data, error } = await supabase
        .from('inscripciones')
        .insert({
          usuario_id: _usuario.id,
          curso_id: cursoId,
          fecha_inscripcion: new Date().toISOString(),
          estado: 'activo',
          porcentaje_completado: 0,
          completado: false
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error insertando inscripción:', error);
        throw error;
      }

      console.log('✅ Curso agregado exitosamente:', data);

      // Recargar cursos inscritos
      await cargarCursosInscritos();

    } catch (error) {
      console.error('❌ Error agregando curso:', error);
      alert('Error al agregar el curso. Por favor intenta de nuevo.');
    } finally {
      setCargandoCursos(false);
    }
  };

  // Función para agregar paquete a usuario
  const agregarPaqueteAUsuario = async (paqueteId: string) => {
    try {
      setCargandoPaquetes(true);
      console.log('📦 Agregando paquete al usuario:', paqueteId);

      // 1. Insertar inscripción del PAQUETE
      const { data: paqueteData, error: paqueteError } = await supabase
        .from('inscripciones')
        .insert({
          usuario_id: _usuario.id,
          paquete_id: paqueteId,
          fecha_inscripcion: new Date().toISOString(),
          estado: 'activo',
          porcentaje_completado: 0,
          completado: false
        })
        .select()
        .single();

      if (paqueteError) {
        console.error('❌ Error insertando inscripción de paquete:', paqueteError);
        throw paqueteError;
      }

      console.log('✅ Paquete agregado exitosamente:', paqueteData);

      // 2. Obtener los tutoriales individuales del paquete
      const { success, data: tutorialIds } = await obtenerItemsPaquete(paqueteId);

      if (success && tutorialIds && tutorialIds.length > 0) {
        console.log(`📝 Encontrados ${tutorialIds.length} tutoriales en el paquete.`);

        // Filtrar tutoriales que el usuario ya tiene inscritos
        const tutorialesYaInscritos = cursosInscritos
          .filter(inscripcion => inscripcion.tutorial_id && tutorialIds.includes(inscripcion.tutorial_id))
          .map(i => i.tutorial_id);

        const tutorialesNuevos = tutorialIds.filter(id => !tutorialesYaInscritos.includes(id));

        console.log(`📝 ${tutorialesYaInscritos.length} ya inscritos, agregando ${tutorialesNuevos.length} nuevos...`);

        if (tutorialesNuevos.length > 0) {
          // Crear array de inscripciones SOLO para los nuevos
          const inscripcionesTutoriales = tutorialesNuevos.map(tutorialId => ({
            usuario_id: _usuario.id,
            tutorial_id: tutorialId,
            fecha_inscripcion: new Date().toISOString(),
            estado: 'activo',
            porcentaje_completado: 0,
            completado: false
          }));

          // Insertar solo los nuevos (usando insert normal, ya que garantizamos que no existen)
          const { error: tutorialesError } = await supabase
            .from('inscripciones')
            .insert(inscripcionesTutoriales);

          if (tutorialesError) {
            console.error('⚠️ Error agregando tutoriales individuales:', tutorialesError);
            alert('El paquete se agregó, pero hubo un problema agregando algunos tutoriales individuales.');
          } else {
            console.log('✅ Tutoriales individuales agregados exitosamente');
          }
        } else {
          console.log('✅ El usuario ya tenía todos los tutoriales del paquete');
        }
      }

      // Recargar datos
      await Promise.all([
        cargarPaquetesInscritos(),
        cargarCursosInscritos() // Recargamos también cursos/tutoriales para ver los nuevos
      ]);

      alert('Paquete y tutoriales agregados exitosamente');

    } catch (error) {
      console.error('❌ Error agregando paquete:', error);
      alert('Error al agregar el paquete. Por favor intenta de nuevo.');
    } finally {
      setCargandoPaquetes(false);
    }
  };

  // Función para quitar curso/tutorial de usuario
  const quitarCursoDeUsuario = async (inscripcionId: string) => {
    if (!confirm('¿Estás seguro de quitar este curso del usuario?')) {
      return;
    }

    try {
      setCargandoCursos(true);
      console.log('🗑️ Eliminando inscripción:', inscripcionId);

      const { error } = await supabase
        .from('inscripciones')
        .delete()
        .eq('id', inscripcionId);

      if (error) {
        console.error('❌ Error eliminando inscripción:', error);
        throw error;
      }

      console.log('✅ Curso eliminado exitosamente');

      // Recargar cursos inscritos
      await cargarCursosInscritos();

    } catch (error) {
      console.error('❌ Error eliminando curso:', error);
      alert('Error al eliminar el curso. Por favor intenta de nuevo.');
    } finally {
      setCargandoCursos(false);
    }
  };

  // Función para quitar paquete de usuario
  const quitarPaqueteDeUsuario = async (inscripcionId: string) => {
    if (!confirm('¿Estás seguro de quitar este paquete del usuario?')) {
      return;
    }

    try {
      setCargandoPaquetes(true);
      console.log('🗑️ Eliminando paquete:', inscripcionId);

      const { error } = await supabase
        .from('inscripciones')
        .delete()
        .eq('id', inscripcionId);

      if (error) {
        console.error('❌ Error eliminando paquete:', error);
        throw error;
      }

      console.log('✅ Paquete eliminado exitosamente');

      // Recargar paquetes inscritos
      await cargarPaquetesInscritos();

    } catch (error) {
      console.error('❌ Error eliminando paquete:', error);
      alert('Error al eliminar el paquete. Por favor intenta de nuevo.');
    } finally {
      setCargandoPaquetes(false);
    }
  };

  // Funciones de filtrado
  const cursosDisponiblesFiltrados = cursosDisponibles
    .filter(curso => {
      // Excluir cursos ya inscritos
      const yaInscrito = cursosInscritos.some(
        inscripcion => inscripcion.curso_id === curso.id
      );
      return !yaInscrito;
    })
    .filter(curso =>
      curso.titulo.toLowerCase().includes(busquedaCursos.toLowerCase())
    );

  const tutorialesDisponiblesFiltrados = tutorialesDisponibles
    .filter(tutorial => {
      // Excluir tutoriales ya inscritos
      const yaInscrito = cursosInscritos.some(
        inscripcion => inscripcion.tutorial_id === tutorial.id
      );
      return !yaInscrito;
    })
    .filter(tutorial =>
      tutorial.titulo.toLowerCase().includes(busquedaCursos.toLowerCase())
    );

  const paquetesDisponiblesFiltrados = paquetesDisponibles
    .filter(paquete => {
      // Excluir paquetes ya inscritos
      const yaInscrito = paquetesInscritos.some(
        inscripcion => inscripcion.paquete_id === paquete.id
      );
      return !yaInscrito;
    })
    .filter(paquete =>
      paquete.titulo.toLowerCase().includes(busquedaCursos.toLowerCase())
    );

  // Paginación
  const totalPaginasTutoriales = Math.ceil(tutorialesDisponiblesFiltrados.length / elementosPorPagina);
  const tutorialesPaginados = tutorialesDisponiblesFiltrados.slice(
    (paginaActualTutoriales - 1) * elementosPorPagina,
    paginaActualTutoriales * elementosPorPagina
  );

  const cambiarPaginaTutoriales = (nuevaPagina: number) => {
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginasTutoriales) {
      setPaginaActualTutoriales(nuevaPagina);
    }
  };

  // Funciones de utilidad
  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearPrecio = (precio: number | string) => {
    const numero = typeof precio === 'string' ? parseFloat(precio) : precio;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(numero);
  };

  return (
    <div className="pestana-cursos-contenido">
      <div className="pestana-cursos-layout-horizontal">
        {/* Columna izquierda: Cursos inscritos */}
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
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor" />
                  </svg>
                  <p>Sin cursos inscritos</p>
                  <small>💡 Agrega cursos desde la derecha</small>
                </div>
              ) : (
                <div className="pestana-cursos-lista-cursos-compacta">
                  {cursosInscritos.map((inscripcion) => (
                    <div key={inscripcion.id} className="pestana-cursos-curso-item-compacto">
                      <div className="pestana-cursos-curso-imagen-mini">
                        {inscripcion.curso && (
                          <img src={inscripcion.curso.imagen_url} alt={inscripcion.curso.titulo} />
                        )}
                      </div>
                      <div className="pestana-cursos-curso-info-mini">
                        <h4>{inscripcion.curso?.titulo || 'Curso sin título'}</h4>
                        <p className="pestana-cursos-tipo">
                          {inscripcion.curso?.tipo === 'curso' ? '📚 Curso' : '🎯 Tutorial'}
                        </p>
                        <p className="pestana-cursos-fecha">
                          {formatearFecha(inscripcion.fecha_inscripcion)}
                        </p>
                        <span className={`pestana-cursos-estado pestana-cursos-estado-${inscripcion.estado || 'activo'}`}>
                          {(inscripcion.estado || 'activo').toUpperCase()}
                        </span>
                      </div>
                      <div className="pestana-cursos-curso-acciones">
                        <button
                          className="pestana-cursos-btn-quitar-mini"
                          title="Quitar curso"
                          onClick={() => quitarCursoDeUsuario(inscripcion.id)}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Paquetes Inscritos */}
            <div className="pestana-cursos-seccion">
              <div className="pestana-cursos-header-seccion">
                <h3>🎁 Paquetes Inscritos</h3>
                <span className="pestana-cursos-contador-cursos">{paquetesInscritos.length}</span>
              </div>

              {cargandoPaquetes ? (
                <div className="pestana-cursos-cargando">Cargando paquetes...</div>
              ) : paquetesInscritos.length === 0 ? (
                <div className="pestana-cursos-vacio-mini">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <p>No hay paquetes inscritos</p>
                </div>
              ) : (
                <div className="pestana-cursos-lista-cursos-inscritos">
                  {paquetesInscritos.map((paquete) => (
                    <div key={paquete.id} className="pestana-cursos-paquete-inscrito-expandido">
                      <div className="pestana-cursos-paquete-header">
                        <div className="pestana-cursos-paquete-icon-grande">📦</div>
                        <div className="pestana-cursos-paquete-info-principal">
                          <h5>{paquete.paquetes_tutoriales?.titulo || 'Paquete'}</h5>
                          <p className="pestana-cursos-paquete-descripcion">
                            {paquete.paquetes_tutoriales?.descripcion_corta || 'Paquete de tutoriales'}
                          </p>
                          <div className="pestana-cursos-paquete-meta">
                            <span className="pestana-cursos-fecha-inscripcion">
                              📅 {formatearFecha(paquete.fecha_inscripcion)}
                            </span>
                            <span className="pestana-cursos-total-tutoriales">
                              🎯 {paquete.paquetes_tutoriales?.total_tutoriales || 0} tutoriales
                            </span>
                            <span className="pestana-cursos-nivel-paquete">
                              📊 {paquete.paquetes_tutoriales?.nivel || 'Principiante'}
                            </span>
                          </div>
                        </div>
                        <div className="pestana-cursos-paquete-acciones">
                          <div className="pestana-cursos-progreso-paquete">
                            <div className="pestana-cursos-progreso-circular">
                              <span className="pestana-cursos-progreso-porcentaje">0%</span>
                            </div>
                          </div>
                          <div className="pestana-cursos-botones-paquete">
                            <button
                              className="pestana-cursos-btn-ver-paquete-detalle"
                              title="Ver paquete completo"
                            >
                              👁️ Ver
                            </button>
                            <button
                              className="pestana-cursos-btn-eliminar-paquete"
                              title="Eliminar paquete"
                              onClick={() => quitarPaqueteDeUsuario(paquete.id)}
                            >
                              🗑️ Eliminar
                            </button>
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

        {/* Columna derecha: Buscador y cursos disponibles */}
        <div className="pestana-cursos-columna-derecha">
          <div className="pestana-cursos-seccion pestana-cursos-seccion-agregar">
            <div className="pestana-cursos-header-seccion">
              <h3>🔍 Agregar Cursos y Tutoriales</h3>
            </div>

            {/* Buscador */}
            <div className="pestana-cursos-buscador">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" />
              </svg>
              <input
                type="text"
                placeholder="Buscar contenido..."
                value={busquedaCursos}
                onChange={(e) => setBusquedaCursos(e.target.value)}
              />
            </div>

            {/* Filtros de tipo de contenido */}
            <div className="pestana-cursos-filtros-contenido">
              <button
                className={`pestana-cursos-filtro-btn ${filtroTipoContenido === 'todos' ? 'activo' : ''}`}
                onClick={() => setFiltroTipoContenido('todos')}
              >
                🎯 Todos
              </button>
              <button
                className={`pestana-cursos-filtro-btn ${filtroTipoContenido === 'cursos' ? 'activo' : ''}`}
                onClick={() => setFiltroTipoContenido('cursos')}
              >
                📚 Cursos
              </button>
              <button
                className={`pestana-cursos-filtro-btn ${filtroTipoContenido === 'tutoriales' ? 'activo' : ''}`}
                onClick={() => setFiltroTipoContenido('tutoriales')}
              >
                🎯 Tutoriales
              </button>
              <button
                className={`pestana-cursos-filtro-btn ${filtroTipoContenido === 'paquetes' ? 'activo' : ''}`}
                onClick={() => setFiltroTipoContenido('paquetes')}
              >
                🎁 Paquetes
              </button>
            </div>

            {cargandoDisponibles ? (
              <div className="pestana-cursos-cargando">Cargando contenido disponible...</div>
            ) : (
              <>
                {/* Mostrar contenido según filtro */}
                {(filtroTipoContenido === 'todos' || filtroTipoContenido === 'cursos') && (
                  <>
                    {cursosDisponiblesFiltrados.length > 0 && (
                      <div className="pestana-cursos-categoria-cursos">
                        <div className="pestana-cursos-header-categoria">
                          <h4>📚 Cursos Disponibles</h4>
                          <span className="pestana-cursos-contador-resultados">
                            {cursosDisponiblesFiltrados.length} cursos
                          </span>
                        </div>
                        <div className="pestana-cursos-grid-cursos-disponibles">
                          {cursosDisponiblesFiltrados.map((curso) => (
                            <div key={curso.id} className="pestana-cursos-curso-disponible">
                              <div className="pestana-cursos-curso-imagen-mini">
                                <img src={curso.imagen_url} alt={curso.titulo} />
                              </div>
                              <div className="pestana-cursos-curso-info-mini">
                                <h5>{curso.titulo}</h5>
                                <p className="pestana-cursos-tipo">📚 Curso Completo</p>
                                {curso.precio && (
                                  <p className="pestana-cursos-precio">{formatearPrecio(curso.precio)}</p>
                                )}
                              </div>
                              <button
                                className="pestana-cursos-btn-agregar-curso"
                                onClick={() => agregarCursoAUsuario(curso.id)}
                                disabled={cargandoCursos}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {(filtroTipoContenido === 'todos' || filtroTipoContenido === 'tutoriales') && (
                  <>
                    {tutorialesDisponiblesFiltrados.length > 0 && (
                      <div className="pestana-cursos-categoria-cursos">
                        <div className="pestana-cursos-header-categoria">
                          <h4>🎯 Tutoriales Disponibles</h4>
                          <span className="pestana-cursos-contador-resultados">
                            {tutorialesDisponiblesFiltrados.length} tutoriales
                          </span>
                        </div>
                        <div className="pestana-cursos-grid-cursos-disponibles">
                          {tutorialesPaginados.map((tutorial) => (
                            <div key={tutorial.id} className="pestana-cursos-curso-disponible">
                              <div className="pestana-cursos-curso-imagen-mini">
                                <img src={tutorial.imagen_url} alt={tutorial.titulo} />
                              </div>
                              <div className="pestana-cursos-curso-info-mini">
                                <h5>{tutorial.titulo}</h5>
                                <p className="pestana-cursos-duracion">⏱️ {tutorial.duracion} min</p>
                                {tutorial.precio && (
                                  <p className="pestana-cursos-precio">{formatearPrecio(tutorial.precio)}</p>
                                )}
                              </div>
                              <button
                                className="pestana-cursos-btn-agregar-curso"
                                onClick={() => agregarTutorialAUsuario(tutorial.id)}
                                disabled={cargandoCursos}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Paginación tutoriales */}
                        {totalPaginasTutoriales > 1 && (
                          <div className="pestana-cursos-paginacion">
                            <button
                              className={`pestana-cursos-btn-pagina ${paginaActualTutoriales === 1 ? 'disabled' : ''}`}
                              onClick={() => cambiarPaginaTutoriales(paginaActualTutoriales - 1)}
                              disabled={paginaActualTutoriales === 1}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            </button>

                            {Array.from({ length: totalPaginasTutoriales }, (_, i) => (
                              <button
                                key={i + 1}
                                className={`pestana-cursos-btn-pagina ${paginaActualTutoriales === i + 1 ? 'activa' : ''}`}
                                onClick={() => cambiarPaginaTutoriales(i + 1)}
                              >
                                {i + 1}
                              </button>
                            ))}

                            <button
                              className={`pestana-cursos-btn-pagina ${paginaActualTutoriales === totalPaginasTutoriales ? 'disabled' : ''}`}
                              onClick={() => cambiarPaginaTutoriales(paginaActualTutoriales + 1)}
                              disabled={paginaActualTutoriales === totalPaginasTutoriales}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="m9 18 6-6-6-6" stroke="currentColor" strokeWidth="2" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Mostrar paquetes si está seleccionado */}
                {(filtroTipoContenido === 'todos' || filtroTipoContenido === 'paquetes') && (
                  <div className="pestana-cursos-categoria-cursos">
                    <div className="pestana-cursos-header-categoria">
                      <h4>🎁 Paquetes Disponibles</h4>
                      <span className="pestana-cursos-contador-resultados">
                        {paquetesDisponiblesFiltrados.length} paquetes
                      </span>
                    </div>

                    {cargandoPaquetes ? (
                      <div className="pestana-cursos-cargando">Cargando paquetes...</div>
                    ) : paquetesDisponiblesFiltrados.length === 0 ? (
                      <div className="pestana-cursos-vacio">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" stroke="currentColor" strokeWidth="2" />
                        </svg>
                        <p>No hay paquetes disponibles</p>
                      </div>
                    ) : (
                      <div className="pestana-cursos-grid-cursos-disponibles">
                        {paquetesDisponiblesFiltrados.map((paquete) => (
                          <div key={paquete.id} className="pestana-cursos-curso-disponible pestana-cursos-paquete-item">
                            <div className="pestana-cursos-curso-imagen-mini">
                              <div className="pestana-cursos-paquete-icon">📦</div>
                            </div>
                            <div className="pestana-cursos-curso-info-mini">
                              <h5>{paquete.titulo}</h5>
                              <p className="pestana-cursos-paquete-detalles">
                                {paquete.total_tutoriales || 0} tutoriales
                              </p>
                              <p className="pestana-cursos-precio">{formatearPrecio(paquete.precio_rebajado || paquete.precio_normal)}</p>
                            </div>
                            <button
                              className="pestana-cursos-btn-agregar-curso"
                              onClick={() => agregarPaqueteAUsuario(paquete.id)}
                              disabled={cargandoPaquetes}
                              aria-label="Agregar paquete completo"
                            >
                              {cargandoPaquetes ? '...' : '+'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Mostrar mensaje de vacío si no hay contenido */}
                {cursosDisponiblesFiltrados.length === 0 && tutorialesDisponiblesFiltrados.length === 0 && paquetesDisponiblesFiltrados.length === 0 && (
                  <div className="pestana-cursos-vacio">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                      <path d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <p>No se encontraron cursos disponibles</p>
                    {busquedaCursos ? (
                      <small>Intenta con otro término de búsqueda</small>
                    ) : (
                      <small>El usuario ya está inscrito en todos los cursos disponibles</small>
                    )}
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
