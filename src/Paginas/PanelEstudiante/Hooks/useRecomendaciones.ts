import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../servicios/clienteSupabase';
import { generateSlug } from '../../../utilidades/utilidadesSlug';

const datosPorDefecto = [
    { id: 1, titulo: 'A TOCAR ACORDEÓN', descripcion: 'Curso completo desde cero hasta tu primera canción', imagen_url: '/images/Home/academia-vallenata-1.jpg', slug: 'a-tocar-acordeon', nivel: 'principiante', categoria: 'Vallenato', precio_normal: 0, precio_rebajado: null, tipo: 'curso', rating: '4.8', estudiantes: '500+', razon: 'Perfecto para empezar' },
    { id: 2, titulo: 'Acordeón!', descripcion: 'Tutorial paso a paso de canciones populares', imagen_url: '/images/Home/academia-vallenata-1.jpg', slug: 'acordeon-tutorial', nivel: 'intermedio', categoria: 'Vallenato', precio_normal: 0, precio_rebajado: null, tipo: 'tutorial', rating: '4.6', estudiantes: '300+', razon: 'Canciones populares' }
];

const razones = ['Perfecto para tu nivel', 'Complementa tu aprendizaje', 'Popular entre estudiantes', 'Recomendado por tu progreso', 'Siguiente paso en tu formación', 'Ideal para mejorar técnica'];

const obtenerRazon = () => razones[Math.floor(Math.random() * razones.length)];

export function useRecomendaciones() {
    const navigate = useNavigate();
    const [cargando, setCargando] = useState(true);
    const [recomendaciones, setRecomendaciones] = useState<any[]>([]);
    const [mostrarMas, setMostrarMas] = useState(false);

    useEffect(() => {
        const cargar = async () => {
            setRecomendaciones(datosPorDefecto);
            setCargando(false);
            try {
                const [{ data: cursosData }, { data: tutorialesData }] = await Promise.all([
                    supabase.from('cursos').select('*').limit(4),
                    supabase.from('tutoriales').select('*').limit(4)
                ]);

                const cursosFormateados = (cursosData || []).map((c: any) => ({
                    id: c.id, titulo: c.titulo || 'Curso de Acordeón', descripcion: c.descripcion || 'Aprende acordeón vallenato paso a paso',
                    imagen_url: c.imagen_url || '/images/Home/academia-vallenata-1.jpg',
                    slug: generateSlug(c.titulo || 'curso-acordeon'), nivel: c.nivel || 'principiante',
                    categoria: c.categoria || 'Vallenato', precio_normal: c.precio_normal || 0,
                    precio_rebajado: c.precio_rebajado || null, tipo: 'curso',
                    rating: (4.2 + Math.random() * 0.8).toFixed(1), estudiantes: `${Math.floor(Math.random() * 2000) + 100}+`, razon: obtenerRazon()
                }));

                const tutorialesFormateados = (tutorialesData || []).map((t: any) => ({
                    id: t.id, titulo: t.titulo || 'Tutorial de Vallenato', descripcion: `Tutorial: ${t.titulo || 'Canción Popular'} - ${t.artista || 'Artista'}`,
                    imagen_url: t.imagen_url || '/images/Home/academia-vallenata-1.jpg',
                    slug: generateSlug(t.titulo || 'tutorial-vallenato'), nivel: t.nivel || 'principiante',
                    categoria: t.categoria || 'Vallenato', artista: t.artista || 'Artista Desconocido',
                    precio_normal: t.precio_normal || 0, precio_rebajado: t.precio_rebajado || null, tipo: 'tutorial',
                    rating: (4.2 + Math.random() * 0.8).toFixed(1), estudiantes: `${Math.floor(Math.random() * 1500) + 50}+`, razon: obtenerRazon()
                }));

                const reales = [...cursosFormateados, ...tutorialesFormateados].sort(() => Math.random() - 0.5);
                if (reales.length > 0) setRecomendaciones(reales);
            } catch { /* mantener datos por defecto */ }
        };
        cargar();
    }, []);

    const verContenido = (item: any) => {
        navigate(item.tipo === 'curso' ? `/cursos/${item.slug}` : `/tutoriales/${item.slug}`);
    };

    const formatearPrecio = (precio: number): string =>
        new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(precio);

    const calcularDescuento = (normal: number, rebajado: number): number =>
        Math.round(((normal - rebajado) / normal) * 100);

    const acortarTexto = (texto: string, limite = 100): string =>
        texto && texto.length > limite ? texto.substring(0, limite) + '...' : texto || '';

    return { cargando, recomendaciones, mostrarMas, setMostrarMas, verContenido, formatearPrecio, calcularDescuento, acortarTexto, navigate };
}
