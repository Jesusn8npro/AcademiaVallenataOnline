import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import { GamificacionServicio as GamificacionService } from '../../../servicios/gamificacionServicio';
import { obtenerSlugUsuario } from '../../../utilidades/utilidadesSlug';

const blogPorDefecto = [
    { id: 1, titulo: '¿Cómo convertir tu talento musical en un negocio real?', creado_en: new Date().toISOString(), lecturas: 0 },
    { id: 2, titulo: '¿Y si no encuentro mi estilo al tocar acordeón?', creado_en: new Date().toISOString(), lecturas: 0 }
];

const rankingPorDefecto = [
    { posicion: 1, puntuacion: 3537, perfiles: { nombre: 'Jesus', apellido: 'Gonzalez' } },
    { posicion: 2, puntuacion: 1900, perfiles: { nombre: 'Robinson', apellido: 'Niñez' } },
    { posicion: 3, puntuacion: 1900, perfiles: { nombre: 'John', apellido: 'Orozco' } }
];

export function formatearFecha(fecha: string): string {
    if (!fecha) return '';
    const dias = Math.floor((Date.now() - new Date(fecha).getTime()) / (1000 * 60 * 60 * 24));
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `${dias} días`;
    return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export function truncarTexto(texto: string, limite = 80): string {
    if (!texto) return '';
    return texto.length > limite ? texto.substring(0, limite) + '...' : texto;
}

export function useSidebarDerecho() {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(true);
    const [articulosBlog, setArticulosBlog] = useState<any[]>([]);
    const [rankingTop, setRankingTop] = useState<any[]>([]);
    const [publicacionesRecientes, setPublicacionesRecientes] = useState<any[]>([]);

    useEffect(() => {
        setArticulosBlog(blogPorDefecto);
        setRankingTop(rankingPorDefecto);
        setCargando(false);

        const cargarBlog = async () => {
            try {
                const { data, error } = await supabase.from('blog_articulos').select('*').eq('estado', 'publicado').order('creado_en', { ascending: false }).limit(2);
                if (error) throw error;
                if (data && data.length > 0) setArticulosBlog(data);
                else setArticulosBlog(blogPorDefecto);
            } catch { setArticulosBlog(blogPorDefecto); }
        };

        const cargarRanking = async () => {
            try {
                const ranking = await GamificacionService.obtenerRanking('general', 3);
                if (ranking && ranking.length > 0) setRankingTop(ranking);
                else setRankingTop(rankingPorDefecto);
            } catch { setRankingTop(rankingPorDefecto); }
        };

        const cargarComunidad = async () => {
            try {
                const { data: publicaciones, error } = await supabase.from('comunidad_publicaciones').select('*, perfiles(nombre, apellido, url_foto_perfil, nombre_usuario, nombre_completo)').order('fecha_creacion', { ascending: false }).limit(2);
                if (error) throw error;
                const procesadas = (publicaciones || []).map((pub: any) => {
                    const perfil = pub.perfiles || {};
                    const usuarioSlug = obtenerSlugUsuario({ nombre_usuario: perfil.nombre_usuario, nombre: perfil.nombre || pub.usuario_nombre, apellido: perfil.apellido, nombre_completo: perfil.nombre_completo, usuario_nombre: pub.usuario_nombre });
                    return { ...pub, usuario_slug: usuarioSlug, contenido: pub.descripcion || pub.contenido || '', usuario_nombre: pub.usuario_nombre || perfil.nombre || 'Usuario', perfiles: perfil };
                });
                setPublicacionesRecientes(procesadas);
            } catch { setPublicacionesRecientes([]); }
        };

        Promise.all([cargarBlog(), cargarRanking(), cargarComunidad()]);
    }, []);

    return { cargando, articulosBlog, rankingTop, publicacionesRecientes, navigate };
}
