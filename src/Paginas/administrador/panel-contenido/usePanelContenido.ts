import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';

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

function filtrarContenido(cursos: Contenido[], tutoriales: Contenido[], busqueda: string, estado: string, tipo: string) {
    let items = [
        ...cursos.map(c => ({ ...c, tipo: 'curso' as const })),
        ...tutoriales.map(t => ({ ...t, tipo: 'tutorial' as const }))
    ];

    if (tipo !== 'todos') items = items.filter(item => item.tipo === tipo);
    if (estado !== 'todos') items = items.filter(item => item.estado === estado);

    if (busqueda.trim()) {
        const q = busqueda.toLowerCase();
        items = items.filter(item =>
            item.titulo?.toLowerCase().includes(q) ||
            item.descripcion?.toLowerCase().includes(q) ||
            item.descripcion_corta?.toLowerCase().includes(q) ||
            item.artista?.toLowerCase().includes(q) ||
            item.acordeonista?.toLowerCase().includes(q) ||
            item.tonalidad?.toLowerCase().includes(q) ||
            item.categoria?.toLowerCase().includes(q) ||
            item.nivel?.toLowerCase().includes(q) ||
            item.estado?.toLowerCase().includes(q)
        );
    }

    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export function usePanelContenido() {
    const navigate = useNavigate();
    const [cursos, setCursos] = useState<Contenido[]>([]);
    const [tutoriales, setTutoriales] = useState<Contenido[]>([]);
    const [cargando, setCargando] = useState(true);
    const [textoBusqueda, setTextoBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'publicado' | 'borrador'>('todos');
    const [filtroTipo, setFiltroTipo] = useState<'todos' | 'curso' | 'tutorial'>('todos');
    const [modoVista, setModoVista] = useState<'cuadricula' | 'lista'>('cuadricula');

    const itemsFiltrados = useMemo(
        () => filtrarContenido(cursos, tutoriales, textoBusqueda, filtroEstado, filtroTipo),
        [cursos, tutoriales, textoBusqueda, filtroEstado, filtroTipo]
    );

    const stats = useMemo(() => ({
        total: cursos.length + tutoriales.length,
        publicados: [...cursos, ...tutoriales].filter(item => item.estado === 'publicado').length,
        filtrados: itemsFiltrados.length
    }), [cursos, tutoriales, itemsFiltrados]);

    const cargarContenido = async () => {
        try {
            const [cursosRes, tutorialesRes, modulosRes, leccionesRes, inscripcionesRes, partesRes] = await Promise.all([
                supabase.from('cursos').select('*').order('created_at', { ascending: false }),
                supabase.from('tutoriales').select('*').order('created_at', { ascending: false }),
                supabase.from('modulos').select('curso_id'),
                supabase.from('lecciones').select('curso_id'),
                supabase.from('inscripciones').select('*'),
                supabase.from('partes_tutorial').select('tutorial_id')
            ]);

            const modulosData = modulosRes.data || [];
            const leccionesData = leccionesRes.data || [];
            const inscripcionesData = inscripcionesRes.data || [];
            const partesData = partesRes.data || [];

            if (!cursosRes.error) {
                setCursos((cursosRes.data || []).map((curso: any) => ({
                    ...curso,
                    modulos_count_real: modulosData.filter((m: any) => m.curso_id === curso.id).length,
                    lecciones_count_real: leccionesData.filter((l: any) => l.curso_id === curso.id).length,
                    estudiantes_inscritos_real: inscripcionesData.filter((i: any) => i.curso_id === curso.id).length
                })));
            }

            if (!tutorialesRes.error) {
                setTutoriales((tutorialesRes.data || []).map((tutorial: any) => ({
                    ...tutorial,
                    estudiantes_inscritos_real: inscripcionesData.filter((i: any) => i.tutorial_id === tutorial.id).length,
                    partes_count_real: partesData.filter((p: any) => p.tutorial_id === tutorial.id).length
                })));
            }
        } catch { /* error no fatal */ } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarContenido(); }, []);

    const limpiarFiltros = () => {
        setTextoBusqueda('');
        setFiltroEstado('todos');
        setFiltroTipo('todos');
    };

    return {
        cursos,
        tutoriales,
        cargando,
        textoBusqueda,
        setTextoBusqueda,
        filtroEstado,
        setFiltroEstado,
        filtroTipo,
        setFiltroTipo,
        modoVista,
        setModoVista,
        itemsFiltrados,
        stats,
        cargarContenido,
        limpiarFiltros,
        navegarACrearCurso: () => navigate('/administrador/crear-contenido?tipo=curso'),
        navegarACrearTutorial: () => navigate('/administrador/crear-contenido?tipo=tutorial')
    };
}
