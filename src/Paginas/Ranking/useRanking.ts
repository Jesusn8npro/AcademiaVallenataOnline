import { useEffect, useRef, useState, useCallback } from 'react';
import { GamificacionServicio } from '../../servicios/gamificacionServicio';
import type { RankingGlobal } from '../../servicios/gamificacionServicio';

const INCREMENTO_POR_SCROLL = 4;

export function useRanking() {
    const [rankingCompleto, setRankingCompleto] = useState<RankingGlobal[]>([]);
    const [rankingMostrado, setRankingMostrado] = useState<RankingGlobal[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoMas, setCargandoMas] = useState(false);
    const [error, setError] = useState('');
    const [categoriaActiva, setCategoriaActiva] = useState('general');
    const [busqueda, setBusqueda] = useState('');
    const [mostrarSoloTop, setMostrarSoloTop] = useState(false);
    const [filtroNivel, setFiltroNivel] = useState('todos');
    const [usuariosMostrados, setUsuariosMostrados] = useState(6);
    const elementoTriggerRef = useRef<HTMLDivElement>(null);

    const filtrarRanking = (ranking?: RankingGlobal[]): RankingGlobal[] => {
        const datos = ranking || rankingCompleto;
        if (!datos || !Array.isArray(datos) || datos.length === 0) return [];

        let resultado = datos;
        if (busqueda) {
            resultado = resultado.filter(item =>
                item.perfiles?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
                item.perfiles?.apellido?.toLowerCase().includes(busqueda.toLowerCase())
            );
        }
        if (filtroNivel !== 'todos') {
            resultado = resultado.filter(item =>
                item.metricas?.nivel?.toString().toLowerCase() === filtroNivel.toLowerCase()
            );
        }
        if (mostrarSoloTop) resultado = resultado.slice(0, 10);
        return resultado;
    };

    const actualizarUsuariosMostrados = useCallback((ranking?: RankingGlobal[], cantidad?: number) => {
        const rankingFiltrado = filtrarRanking(ranking || rankingCompleto);
        const cantidadMostrar = cantidad || usuariosMostrados;
        setRankingMostrado(rankingFiltrado.slice(0, cantidadMostrar));
    }, [rankingCompleto, usuariosMostrados, busqueda, filtroNivel, mostrarSoloTop]);

    const cargarRanking = useCallback(async () => {
        try {
            setCargando(true);
            setError('');
            setUsuariosMostrados(6);
            const ranking = await GamificacionServicio.obtenerRanking(categoriaActiva, 200);
            setRankingCompleto(ranking);
            actualizarUsuariosMostrados(ranking, 6);
        } catch (err) {
            setError('Error al cargar el ranking: ' + ((err as any)?.message || 'Error desconocido'));
        } finally {
            setCargando(false);
        }
    }, [categoriaActiva]);

    const cargarMasUsuarios = useCallback(() => {
        const rankingFiltrado = filtrarRanking();
        if (usuariosMostrados >= rankingFiltrado.length) return;

        setCargandoMas(true);
        setTimeout(() => {
            const nuevaCantidad = usuariosMostrados + INCREMENTO_POR_SCROLL;
            setUsuariosMostrados(nuevaCantidad);
            actualizarUsuariosMostrados(rankingCompleto, nuevaCantidad);
            setCargandoMas(false);
        }, 300);
    }, [usuariosMostrados, rankingCompleto, actualizarUsuariosMostrados]);

    const cambiarCategoria = (categoria: string) => {
        if (categoria === categoriaActiva) return;
        setCategoriaActiva(categoria);
    };

    useEffect(() => {
        function onScroll() {
            const nearBottom = (window.scrollY + window.innerHeight) >= (document.documentElement.scrollHeight - 120);
            if (nearBottom && !cargandoMas && !cargando) cargarMasUsuarios();
        }
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, [cargarMasUsuarios, cargandoMas, cargando]);

    useEffect(() => { cargarRanking(); }, [cargarRanking]);
    useEffect(() => { actualizarUsuariosMostrados(); }, [actualizarUsuariosMostrados]);

    return {
        rankingMostrado, cargando, cargandoMas, error,
        categoriaActiva, busqueda, setBusqueda,
        mostrarSoloTop, setMostrarSoloTop,
        filtroNivel, setFiltroNivel,
        elementoTriggerRef,
        cargarRanking, cambiarCategoria
    };
}
