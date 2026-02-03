import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../servicios/supabaseCliente';
import MostradorCursosTutoriales from './panel-contenido/componentes/MostradorCursosTutoriales';
import SidebarResumenAdmin from './panel-contenido/componentes/SidebarResumenAdmin';
import './PanelContenido.css';

interface Contenido {
    id: string;
    titulo: string;
    descripcion?: string;
    descripcion_corta?: string;
    imagen_url?: string;
    estado?: string;
    nivel?: string;
    categoria?: string;
    precio_normal?: number;
    precio_rebajado?: number;
    created_at: string;
    tipo?: 'curso' | 'tutorial';
    [key: string]: any;
}

const PanelContenido = () => {
    const navigate = useNavigate();

    // Estados principales
    const [cursos, setCursos] = useState<Contenido[]>([]);
    const [tutoriales, setTutoriales] = useState<Contenido[]>([]);
    const [cargando, setCargando] = useState(true);

    // Estados para filtros
    const [textoBusqueda, setTextoBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'publicado' | 'borrador'>('todos');
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'curso' | 'tutorial'>('todos');
    const [modoVista, setModoVista] = useState<'cuadricula' | 'lista'>('cuadricula');

    // Función para filtrar contenido
    const filtrarContenido = (
        cursos: Contenido[],
        tutoriales: Contenido[],
        busqueda: string,
        estado: string,
        tipo: string
    ) => {
        console.log('🔍 [FILTROS] Aplicando filtros:', { busqueda, estado, tipo });

        let items = [
            ...cursos.map(c => ({ ...c, tipo: 'curso' as const })),
            ...tutoriales.map(t => ({ ...t, tipo: 'tutorial' as const }))
        ];

        console.log('📋 [UNIFICADO] Total items antes de filtrar:', items.length);

        // FILTRO POR TIPO
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
    const itemsFiltrados = useMemo(
        () => filtrarContenido(cursos, tutoriales, textoBusqueda, filtroEstado, filtroTipo),
        [cursos, tutoriales, textoBusqueda, filtroEstado, filtroTipo]
    );

    const stats = useMemo(() => ({
        total: cursos.length + tutoriales.length,
        publicados: [...cursos, ...tutoriales].filter(item => item.estado === 'publicado').length,
        filtrados: itemsFiltrados.length
    }), [cursos, tutoriales, itemsFiltrados]);

    // Cargar contenido
    useEffect(() => {
        cargarContenido();
    }, []);

    const cargarContenido = async () => {
        try {
            console.log('🔄 Cargando contenido del panel admin...');

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

                // INSCRIPCIONES
                supabase
                    .from('inscripciones')
                    .select('*'),

                // PARTES DE TUTORIAL
                supabase
                    .from('partes_tutorial')
                    .select('tutorial_id')
            ]);

            const modulosData = modulosRes.data || [];
            const leccionesData = leccionesRes.data || [];
            const inscripcionesData = inscripcionesRes.data || [];
            const partesData = partesRes.data || [];

            console.log('📊 Datos auxiliares cargados:');
            console.log('- Módulos:', modulosData.length);
            console.log('- Lecciones:', leccionesData.length);
            console.log('- Inscripciones:', inscripcionesData.length);
            console.log('- Partes:', partesData.length);

            if (!cursosRes.error) {
                const cursosConConteos = (cursosRes.data || []).map((curso: any) => {
                    const modulosDelCurso = modulosData.filter((m: any) => m.curso_id === curso.id).length;
                    const leccionesDelCurso = leccionesData.filter((l: any) => l.curso_id === curso.id).length;
                    const estudiantesDelCurso = inscripcionesData.filter((i: any) => i.curso_id === curso.id).length;

                    return {
                        ...curso,
                        modulos_count_real: modulosDelCurso,
                        lecciones_count_real: leccionesDelCurso,
                        estudiantes_inscritos_real: estudiantesDelCurso
                    };
                });
                setCursos(cursosConConteos);
                console.log('✅ Cursos procesados:', cursosConConteos.length);
            }

            if (!tutorialesRes.error) {
                const tutorialesConConteos = (tutorialesRes.data || []).map((tutorial: any) => {
                    const estudiantesDelTutorial = inscripcionesData.filter((i: any) => i.tutorial_id === tutorial.id).length;
                    const partesDelTutorial = partesData.filter((p: any) => p.tutorial_id === tutorial.id).length;

                    return {
                        ...tutorial,
                        estudiantes_inscritos_real: estudiantesDelTutorial,
                        partes_count_real: partesDelTutorial
                    };
                });
                setTutoriales(tutorialesConConteos);
                console.log('✅ Tutoriales procesados:', tutorialesConConteos.length);
            }

        } catch (error) {
            console.error('❌ Error general cargando datos:', error);
        } finally {
            setCargando(false);
            console.log('✅ Panel de contenido cargado completamente');
        }
    };

    const navegarACrearCurso = () => {
        navigate('/administrador/crear-contenido?tipo=curso');
    };

    const navegarACrearTutorial = () => {
        navigate('/administrador/crear-contenido?tipo=tutorial');
    };

    const limpiarFiltros = () => {
        setTextoBusqueda('');
        setFiltroEstado('todos');
        setFiltroTipo('todos');
    };

    if (cargando) {
        return (
            <div className="panel-contenido-loading">
                <div className="panel-contenido-spinner"></div>
                <p>Cargando panel de contenido...</p>
            </div>
        );
    }

    return (
        <div className="panel-contenido-container">
            {/* Header */}
            <header className="panel-contenido-header">
                <div className="panel-contenido-header-content">
                    <div className="panel-contenido-header-info">
                        <h1>📚 Panel de Contenido</h1>
                        <p>Gestiona tus cursos y tutoriales</p>
                        <div className="panel-contenido-stats">
                            <span className="panel-contenido-stat-item">📊 {stats.total} total</span>
                            <span className="panel-contenido-stat-item">✅ {stats.publicados} publicados</span>
                            <span className={`panel-contenido-stat-item ${stats.filtrados !== stats.total ? 'panel-contenido-stat-filtrado' : ''}`}>
                                🎯 {stats.filtrados} mostrando
                            </span>
                        </div>

                        {/* Indicadores de filtros activos */}
                        {(textoBusqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos') && (
                            <div className="panel-contenido-filtros-activos">
                                <span className="panel-contenido-filtros-label">Filtros activos:</span>
                                {textoBusqueda && (
                                    <span className="panel-contenido-filtro-tag">🔍 "{textoBusqueda}"</span>
                                )}
                                {filtroTipo !== 'todos' && (
                                    <span className="panel-contenido-filtro-tag">📁 {filtroTipo === 'curso' ? 'Cursos' : 'Tutoriales'}</span>
                                )}
                                {filtroEstado !== 'todos' && (
                                    <span className="panel-contenido-filtro-tag">📌 {filtroEstado === 'publicado' ? 'Publicados' : 'Borradores'}</span>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="panel-contenido-header-actions">
                        <button className="panel-contenido-btn-create panel-contenido-btn-curso" onClick={navegarACrearCurso}>
                            📚 Crear Curso
                        </button>
                        <button className="panel-contenido-btn-create panel-contenido-btn-tutorial" onClick={navegarACrearTutorial}>
                            🎥 Crear Tutorial
                        </button>
                    </div>
                </div>
            </header>

            {/* Filtros */}
            <section className="panel-contenido-filters">
                <div className="panel-contenido-filters-content">
                    <div className="panel-contenido-search-box">
                        <div className="panel-contenido-search-input-container">
                            <svg className="panel-contenido-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Buscar por título, descripción, artista, tonalidad..."
                                value={textoBusqueda}
                                onChange={(e) => setTextoBusqueda(e.target.value)}
                                className="panel-contenido-search-input"
                            />
                            {textoBusqueda && (
                                <button className="panel-contenido-clear-search" onClick={() => setTextoBusqueda('')}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="panel-contenido-filter-controls">
                        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value as any)} className="panel-contenido-filter-select">
                            <option value="todos">🎯 Todos</option>
                            <option value="curso">📚 Cursos</option>
                            <option value="tutorial">🎥 Tutoriales</option>
                        </select>

                        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value as any)} className="panel-contenido-filter-select">
                            <option value="todos">🔄 Todos</option>
                            <option value="publicado">✅ Publicados</option>
                            <option value="borrador">📝 Borradores</option>
                        </select>

                        <button className="panel-contenido-btn-limpiar" onClick={limpiarFiltros}>
                            🔄 Limpiar
                        </button>

                        <div className="panel-contenido-view-toggle">
                            <button
                                className={`panel-contenido-view-btn ${modoVista === 'cuadricula' ? 'panel-contenido-view-btn-active' : ''}`}
                                onClick={() => setModoVista('cuadricula')}
                                title="Vista de cuadrícula"
                            >
                                ⊞
                            </button>
                            <button
                                className={`panel-contenido-view-btn ${modoVista === 'lista' ? 'panel-contenido-view-btn-active' : ''}`}
                                onClick={() => setModoVista('lista')}
                                title="Vista de lista"
                            >
                                ☰
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Contenido */}
            <main className="panel-contenido-main">
                <div className="panel-contenido-content-area">
                    {itemsFiltrados.length === 0 && (textoBusqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos') ? (
                        <div className="panel-contenido-estado-vacio">
                            <div className="panel-contenido-icono-vacio">🔍</div>
                            <h3>No se encontraron resultados</h3>
                            <p>Intenta ajustar los filtros o buscar con términos diferentes</p>
                            <button className="panel-contenido-btn-limpiar-vacio" onClick={limpiarFiltros}>
                                🔄 Limpiar filtros
                            </button>
                        </div>
                    ) : itemsFiltrados.length === 0 ? (
                        <div className="panel-contenido-estado-vacio">
                            <div className="panel-contenido-icono-vacio">📚</div>
                            <h3>¡Empieza creando contenido!</h3>
                            <p>Aún no tienes cursos o tutoriales creados</p>
                            <div className="panel-contenido-acciones-rapidas">
                                <button className="panel-contenido-btn-create panel-contenido-btn-curso" onClick={navegarACrearCurso}>
                                    📚 Crear Primer Curso
                                </button>
                                <button className="panel-contenido-btn-create panel-contenido-btn-tutorial" onClick={navegarACrearTutorial}>
                                    🎥 Crear Primer Tutorial
                                </button>
                            </div>
                        </div>
                    ) : (
                        <MostradorCursosTutoriales
                            cursos={itemsFiltrados.filter(item => item.tipo === 'curso')}
                            tutoriales={itemsFiltrados.filter(item => item.tipo === 'tutorial')}
                            modoVista={modoVista}
                            onUpdate={cargarContenido}
                        />
                    )}
                </div>
                <aside className="panel-contenido-sidebar">
                    <SidebarResumenAdmin />
                </aside>
            </main>
        </div>
    );
};

export default PanelContenido;
