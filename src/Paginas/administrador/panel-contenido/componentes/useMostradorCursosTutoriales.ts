import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../../servicios/clienteSupabase';

export interface Contenido {
    id: string;
    titulo: string;
    descripcion?: string;
    descripcion_corta?: string;
    imagen_url?: string;
    estado?: string;
    nivel?: string;
    categoria?: string;
    created_at: string;
    precio_normal?: number;
    precio_rebajado?: number;
    estudiantes_inscritos_real?: number;
    estudiantes_inscritos?: number;
    modulos_count_real?: number;
    modulos_count?: number;
    lecciones_count_real?: number;
    lecciones_count?: number;
    conteo_lecciones?: number;
    duracion_estimada?: number;
    partes_count_real?: number;
    partes_count?: number;
    duracion?: number;
    artista?: string;
    tonalidad?: string;
    tipo?: 'curso' | 'tutorial';
    [key: string]: any;
}

interface Opciones {
    cursos: Contenido[];
    tutoriales: Contenido[];
    onUpdate?: () => void;
}

export function useMostradorCursosTutoriales({ cursos, tutoriales }: Opciones) {
    const navigate = useNavigate();
    const [procesandoAccion, setProcesandoAccion] = useState(false);
    const [itemProcesando, setItemProcesando] = useState('');
    const [modalInscripcionesOpen, setModalInscripcionesOpen] = useState(false);
    const [itemSeleccionado, setItemSeleccionado] = useState<Contenido | null>(null);
    const [confirmarEliminarItem, setConfirmarEliminarItem] = useState<Contenido | null>(null);
    const [errorAccion, setErrorAccion] = useState('');

    const contenidoUnificado = [
        ...cursos.map(c => ({ ...c, tipo: 'curso' as const })),
        ...tutoriales.map(t => ({ ...t, tipo: 'tutorial' as const }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const generarSlug = (texto: string): string =>
        texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const solicitarEliminar = (item: Contenido) => {
        if (!procesandoAccion) setConfirmarEliminarItem(item);
    };

    const cancelarEliminar = () => setConfirmarEliminarItem(null);

    const confirmarEliminar = async () => {
        if (!confirmarEliminarItem) return;
        const item = confirmarEliminarItem;
        setConfirmarEliminarItem(null);
        try {
            setProcesandoAccion(true);
            setItemProcesando(item.id);
            const tabla = item.tipo === 'curso' ? 'cursos' : 'tutoriales';
            const { error } = await supabase.from(tabla).delete().eq('id', item.id);
            if (error) throw error;
            window.location.reload();
        } catch {
            setErrorAccion(`Error al eliminar el ${item.tipo}. Por favor, intenta de nuevo.`);
        } finally {
            setProcesandoAccion(false);
            setItemProcesando('');
        }
    };

    const manejarEditar = (item: Contenido) => {
        if (!procesandoAccion) navigate(`/administrador/crear-contenido?tipo=${item.tipo}&editar=${item.id}`);
    };

    const manejarVer = async (item: Contenido) => {
        if (procesandoAccion) return;
        try {
            setProcesandoAccion(true);
            setItemProcesando(item.id);
            if (item.tipo === 'curso') {
                const { data: curso, error } = await supabase.from('cursos').select('slug, titulo').eq('id', item.id).single();
                if (error || !curso) throw new Error('No se encontró el curso');
                navigate(`/cursos/${curso.slug || generarSlug(curso.titulo)}`);
            } else {
                const { data: tutorial, error } = await supabase.from('tutoriales').select('titulo').eq('id', item.id).single();
                if (error || !tutorial) throw new Error('No se encontró el tutorial');
                navigate(`/tutoriales/${generarSlug(tutorial.titulo)}`);
            }
        } catch {
            setErrorAccion('Error al cargar el contenido. Por favor, intenta de nuevo.');
        } finally {
            setProcesandoAccion(false);
            setItemProcesando('');
        }
    };

    const abrirModalInscripciones = (item: Contenido) => {
        setItemSeleccionado(item);
        setModalInscripcionesOpen(true);
    };

    return {
        contenidoUnificado,
        procesandoAccion,
        itemProcesando,
        modalInscripcionesOpen,
        setModalInscripcionesOpen,
        itemSeleccionado,
        confirmarEliminarItem,
        errorAccion,
        solicitarEliminar,
        cancelarEliminar,
        confirmarEliminar,
        manejarEditar,
        manejarVer,
        abrirModalInscripciones
    };
}
