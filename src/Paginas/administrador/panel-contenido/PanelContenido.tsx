import React, { useState, useEffect } from 'react';
import { supabase } from '../../../servicios/supabaseCliente';
import MostradorCursosTutoriales from './MostradorCursosTutoriales';
import SidebarResumenAdmin from './SidebarResumenAdmin';
import './PanelContenido.css';

// Interfaces de tipos
interface Curso {
  id: string;
  titulo: string;
  descripcion?: string;
  descripcion_corta?: string;
  imagen_url?: string;
  estudiantes_inscritos?: number;
  conteo_lecciones?: number;
  duracion_estimada?: number;
  estado?: string;
  nivel?: string;
  categoria?: string;
  precio_normal?: number;
  precio_rebajado?: number;
  created_at: string;
  [key: string]: any;
}

interface Tutorial {
  id: string;
  titulo: string;
  descripcion?: string;
  descripcion_corta?: string;
  imagen_url?: string;
  duracion?: number;
  duracion_estimada?: number;
  estado?: string;
  nivel?: string;
  categoria?: string;
  artista?: string;
  acordeonista?: string;
  tonalidad?: string;
  precio_normal?: number;
  precio_rebajado?: number;
  created_at: string;
  [key: string]: any;
}

interface Estadisticas {
  total: number;
  publicados: number;
  filtrados: number;
}

const PanelContenido: React.FC = () => {
  // Estados principales
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [tutoriales, setTutoriales] = useState<Tutorial[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados para filtros
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [modoVista, setModoVista] = useState<'cuadricula' | 'lista'>('cuadricula');

  // Función para filtrar contenido
  const filtrarContenido = (cursos: Curso[], tutoriales: Tutorial[], busqueda: string, estado: string, tipo: string) => {
    console.log('🔍 [FILTROS] Aplicando filtros:', { busqueda, estado, tipo });
    console.log('📊 [DATOS] Cursos:', cursos.length, 'Tutoriales:', tutoriales.length);

    let items = [
      ...cursos.map(c => ({ ...c, tipo: 'curso' as const })),
      ...tutoriales.map(t => ({ ...t, tipo: 'tutorial' as const }))
    ];

    console.log('📋 [UNIFICADO] Total items antes de filtrar:', items.length);

    // FILTRO POR TIPO PRIMERO
    if (tipo !== 'todos') {
      items = items.filter(item => item.tipo === tipo);
      console.log(`🎯 [TIPO] Filtrado por "${tipo}":`, items.length, 'items');
    }

    // FILTRO POR ESTADO
    if (estado !== 'todos') {
      items = items.filter(item => item.estado === estado);
      console.log(`📌 [ESTADO] Filtrado por "${estado}":`, items.length, 'items');
    }

    // FILTRO POR BÚSQUEDA
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      items = items.filter(item =>
        item.titulo?.toLowerCase().includes(busquedaLower) ||
        item.descripcion?.toLowerCase().includes(busquedaLower) ||
        item.descripcion_corta?.toLowerCase().includes(busquedaLower) ||
        (item as any).artista?.toLowerCase().includes(busquedaLower) ||
        (item as any).acordeonista?.toLowerCase().includes(busquedaLower) ||
        (item as any).tonalidad?.toLowerCase().includes(busquedaLower) ||
        item.categoria?.toLowerCase().includes(busquedaLower) ||
        item.nivel?.toLowerCase().includes(busquedaLower) ||
        item.estado?.toLowerCase().includes(busquedaLower)
      );
      console.log(`🔍 [BÚSQUEDA] Filtrado por "${busqueda}":`, items.length, 'items');
    }

    const resultado = items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    console.log('✅ [RESULTADO] Items finales:', resultado.length);

    return resultado;
  };

  // Datos computados para filtros
  const itemsFiltrados = filtrarContenido(cursos, tutoriales, textoBusqueda, filtroEstado, filtroTipo);
  const stats: Estadisticas = {
    total: cursos.length + tutoriales.length,
    publicados: [...cursos, ...tutoriales].filter(item => item.estado === 'publicado').length,
    filtrados: itemsFiltrados.length
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
    console.log('🖥️ [PANEL] Ancho de pantalla:', window.innerWidth);
  }, []);

  const cargarDatos = async () => {
    try {
      console.log('🔄 Cargando contenido del panel admin...');

      console.log('🔄 Intentando consultas con JOINs...');

      const [cursosRes, tutorialesRes, modulosRes, leccionesRes, inscripcionesRes, partesRes] = await Promise.all([
        // CURSOS básicos
        supabase
          .from('cursos')
          .select('*')
          .order('created_at', { ascending: false }),

        // TUTORIALES básicos
        supabase
          .from('tutoriales')
          .select('*')
          .order('created_at', { ascending: false }),

        // MÓDULOS para contar por curso
        supabase
          .from('modulos')
          .select('curso_id'),

        // LECCIONES para contar por curso
        supabase
          .from('lecciones')
          .select('curso_id'),

        // INSCRIPCIONES para contar por tutorial
        supabase
          .from('inscripciones')
          .select('*'),

        // PARTES DE TUTORIAL
        supabase
          .from('partes_tutorial')
          .select('tutorial_id')
      ]);

      // Verificar errores en las consultas auxiliares
      if (modulosRes.error) console.error('❌ Error módulos:', modulosRes.error);
      if (leccionesRes.error) console.error('❌ Error lecciones:', leccionesRes.error);
      if (inscripcionesRes.error) console.error('❌ Error inscripciones:', inscripcionesRes.error);
      if (partesRes.error) console.error('❌ Error partes:', partesRes.error);

      // Procesar datos y hacer conteos manuales
      const modulosData = modulosRes.data || [];
      const leccionesData = leccionesRes.data || [];
      const inscripcionesData = inscripcionesRes.data || [];
      const partesData = partesRes.data || [];

      console.log('📊 Datos auxiliares cargados:');
      console.log('- Módulos:', modulosData.length, modulosRes.error ? '(ERROR)' : '');
      console.log('- Lecciones:', leccionesData.length, leccionesRes.error ? '(ERROR)' : '');
      console.log('- Inscripciones:', inscripcionesData.length, inscripcionesRes.error ? '(ERROR)' : '');
      console.log('- Partes:', partesData.length, partesRes.error ? '(ERROR)' : '');

      // Debug: Mostrar estructura de inscripciones
      if (inscripcionesData.length > 0) {
        console.log('🔍 [DEBUG] Muestra de inscripción:', inscripcionesData[0]);
        console.log('🔍 [DEBUG] Campos disponibles:', Object.keys(inscripcionesData[0]));
      } else {
        console.log('⚠️ [DEBUG] No hay inscripciones o error al cargar');
      }

      // Debug: Mostrar estructura de lecciones
      if (leccionesData.length > 0) {
        console.log('🔍 [DEBUG] Muestra de lección:', leccionesData[0]);
        console.log('🔍 [DEBUG] Campos disponibles:', Object.keys(leccionesData[0]));
      } else {
        console.log('⚠️ [DEBUG] No hay lecciones o error al cargar');
      }

      if (cursosRes.error) {
        console.error('❌ Error cargando cursos:', cursosRes.error);
      } else {
        // Procesar cursos con conteos MANUALES
        const cursosProcesados = (cursosRes.data || []).map((curso, index) => {
          const modulosDelCurso = modulosData.filter(m => m.curso_id === curso.id).length;
          const leccionesDelCurso = leccionesData.filter(l => l.curso_id === curso.id).length;
          const estudiantesDelCurso = inscripcionesData.filter(i => i.curso_id === curso.id).length;

          // Solo mostrar logs para el primer curso
          if (index === 0) {
            console.log(`🔍 [CURSO ${index}] ${curso.titulo}:`);
            console.log(`📊 [CURSO ${index}] - Módulos reales: ${modulosDelCurso}`);
            console.log(`📊 [CURSO ${index}] - Lecciones reales: ${leccionesDelCurso}`);
            console.log(`📊 [CURSO ${index}] - Estudiantes reales: ${estudiantesDelCurso}`);
            console.log(`📊 [CURSO ${index}] - Campo directo estudiantes_inscritos: ${curso.estudiantes_inscritos}`);
            console.log(`📊 [CURSO ${index}] - Campo directo conteo_lecciones: ${curso.conteo_lecciones}`);
          }

          const cursoFinal = {
            ...curso,
            modulos_count_real: modulosDelCurso,
            lecciones_count_real: leccionesDelCurso,
            estudiantes_inscritos_real: estudiantesDelCurso
          };

          // Debug para el primer curso
          if (index === 0) {
            console.log('🎯 [CURSO FINAL]', cursoFinal);
            console.log('🎯 [CURSO FINAL] Campos:', Object.keys(cursoFinal));
          }

          return cursoFinal;
        });
        setCursos(cursosProcesados);
        console.log('✅ Cursos procesados:', cursosProcesados.length);
      }

      if (tutorialesRes.error) {
        console.error('❌ Error cargando tutoriales:', tutorialesRes.error);
      } else {
        // Procesar tutoriales con conteos MANUALES
        const tutorialesProcesados = (tutorialesRes.data || []).map((tutorial, index) => {
          const estudiantesDelTutorial = inscripcionesData.filter(i => i.tutorial_id === tutorial.id).length;
          const partesDelTutorial = partesData.filter(p => p.tutorial_id === tutorial.id).length;

          // Solo mostrar logs para el primer tutorial  
          if (index === 0) {
            console.log(`🔍 [TUTORIAL ${index}] ${tutorial.titulo}:`);
            console.log(`📊 [TUTORIAL ${index}] - ID: ${tutorial.id}`);
            console.log(`📊 [TUTORIAL ${index}] - Estudiantes reales: ${estudiantesDelTutorial}`);
            console.log(`📊 [TUTORIAL ${index}] - Partes reales: ${partesDelTutorial}`);
            console.log(`📊 [TUTORIAL ${index}] - Inscripciones que coinciden:`, inscripcionesData.filter(i => i.tutorial_id === tutorial.id));
          }

          const tutorialFinal = {
            ...tutorial,
            estudiantes_inscritos_real: estudiantesDelTutorial,
            partes_count_real: partesDelTutorial
          };

          // Debug para el primer tutorial
          if (index === 0) {
            console.log('🎯 [TUTORIAL FINAL]', tutorialFinal);
            console.log('🎯 [TUTORIAL FINAL] Campos:', Object.keys(tutorialFinal));
          }

          return tutorialFinal;
        });
        setTutoriales(tutorialesProcesados);
        console.log('✅ Tutoriales procesados:', tutorialesProcesados.length);
      }

    } catch (error) {
      console.error('❌ Error general cargando datos:', error);
    } finally {
      setCargando(false);
      console.log('✅ Panel de contenido cargado completamente');
    }
  };

  const navegarACrearCurso = () => {
    window.location.href = '/administrador/crear-contenido?tipo=curso';
  };

  const navegarACrearTutorial = () => {
    window.location.href = '/administrador/crear-contenido?tipo=tutorial';
  };

  const limpiarFiltros = () => {
    setTextoBusqueda('');
    setFiltroEstado('todos');
    setFiltroTipo('todos');
  };

  if (cargando) {
    return (
      <div className="panel-contenido">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando panel de contenido...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="panel-contenido">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-info">
            <h1>📚 Panel de Contenido</h1>
            <p>Gestiona tus cursos y tutoriales</p>
            <div className="stats">
              <span className="stat-item">📊 {stats.total} total</span>
              <span className="stat-item">✅ {stats.publicados} publicados</span>
              <span className={`stat-item ${stats.filtrados !== stats.total ? 'stat-filtrado' : ''}`}>
                🎯 {stats.filtrados} mostrando
              </span>
            </div>

            {/* Indicadores de filtros activos */}
            {(textoBusqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos') && (
              <div className="filtros-activos">
                <span className="filtros-label">Filtros activos:</span>
                {textoBusqueda && (
                  <span className="filtro-tag">🔍 "{textoBusqueda}"</span>
                )}
                {filtroTipo !== 'todos' && (
                  <span className="filtro-tag">📁 {filtroTipo === 'curso' ? 'Cursos' : 'Tutoriales'}</span>
                )}
                {filtroEstado !== 'todos' && (
                  <span className="filtro-tag">📌 {filtroEstado === 'publicado' ? 'Publicados' : 'Borradores'}</span>
                )}
              </div>
            )}
          </div>
          <div className="header-actions">
            <button className="btn-create curso" onClick={navegarACrearCurso}>
              📚 Crear Curso
            </button>
            <button className="btn-create tutorial" onClick={navegarACrearTutorial}>
              🎥 Crear Tutorial
            </button>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <section className="filters">
        <div className="filters-content">
          <div className="search-box">
            <div className="search-input-container">
              <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Buscar por título, descripción, artista, tonalidad..."
                value={textoBusqueda}
                onChange={(e) => setTextoBusqueda(e.target.value)}
                className="search-input"
              />
              {textoBusqueda && (
                <button className="clear-search" onClick={() => setTextoBusqueda('')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <div className="filter-controls">
            <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="filter-select">
              <option value="todos">🎯 Todos</option>
              <option value="curso">📚 Cursos</option>
              <option value="tutorial">🎥 Tutoriales</option>
            </select>

            <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="filter-select">
              <option value="todos">🔄 Todos</option>
              <option value="publicado">✅ Publicados</option>
              <option value="borrador">📝 Borradores</option>
            </select>

            <button className="btn-limpiar" onClick={limpiarFiltros}>
              🔄 Limpiar
            </button>

            <div className="view-toggle">
              <button
                className={`view-btn ${modoVista === 'cuadricula' ? 'active' : ''}`}
                onClick={() => setModoVista('cuadricula')}
                title="Vista de cuadrícula"
              >⊞</button>
              <button
                className={`view-btn ${modoVista === 'lista' ? 'active' : ''}`}
                onClick={() => setModoVista('lista')}
                title="Vista de lista"
              >☰</button>
            </div>
          </div>
        </div>
      </section>

      {/* Contenido */}
      <main className="panel-main-content">
        <div className="content-area">
          {itemsFiltrados.length === 0 && (textoBusqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos') ? (
            <div className="estado-vacio">
              <div className="icono-vacio">🔍</div>
              <h3>No se encontraron resultados</h3>
              <p>Intenta ajustar los filtros o buscar con términos diferentes</p>
              <button className="btn-limpiar-vacio" onClick={limpiarFiltros}>
                🔄 Limpiar filtros
              </button>
            </div>
          ) : itemsFiltrados.length === 0 ? (
            <div className="estado-vacio">
              <div className="icono-vacio">📚</div>
              <h3>¡Empieza creando contenido!</h3>
              <p>Aún no tienes cursos o tutoriales creados</p>
              <div className="acciones-rapidas">
                <button className="btn-create curso" onClick={navegarACrearCurso}>
                  📚 Crear Primer Curso
                </button>
                <button className="btn-create tutorial" onClick={navegarACrearTutorial}>
                  🎥 Crear Primer Tutorial
                </button>
              </div>
            </div>
          ) : (
            <MostradorCursosTutoriales
              cursos={itemsFiltrados.filter(item => item.tipo === 'curso')}
              tutoriales={itemsFiltrados.filter(item => item.tipo === 'tutorial')}
              modoVista={modoVista}
            />
          )}
        </div>
        <aside className="sidebar">
          <SidebarResumenAdmin />
        </aside>
      </main>
    </div>
  );
};

export default PanelContenido;
