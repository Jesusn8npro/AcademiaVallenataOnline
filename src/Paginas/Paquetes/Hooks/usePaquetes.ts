import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { obtenerPaquetesPublicados, buscarPaquetes, type PaqueteTutorial } from '../../../servicios/paquetesService';

interface Stats {
    total: number;
    principiante: number;
    intermedio: number;
    avanzado: number;
}

export function usePaquetes() {
    const navigate = useNavigate();
    const [paquetes, setPaquetes] = useState<PaqueteTutorial[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [filtroCategoria, setFiltroCategoria] = useState('');
    const [filtroNivel, setFiltroNivel] = useState('');
    const [categorias, setCategorias] = useState<string[]>([]);
    const busquedaTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [stats, setStats] = useState<Stats>({ total: 0, principiante: 0, intermedio: 0, avanzado: 0 });

    const calcularEstadisticas = (listaPaquetes: PaqueteTutorial[]) => {
        setStats({
            total: listaPaquetes.length,
            principiante: listaPaquetes.filter(p => p.nivel === 'principiante').length,
            intermedio: listaPaquetes.filter(p => p.nivel === 'intermedio').length,
            avanzado: listaPaquetes.filter(p => p.nivel === 'avanzado').length
        });
    };

    const cargarPaquetes = async () => {
        try {
            setCargando(true);
            setError('');
            const resultado = await obtenerPaquetesPublicados();
            if (resultado.success) {
                const listaPaquetes = resultado.data || [];
                setPaquetes(listaPaquetes);
                const categoriasUnicas = Array.from(new Set(
                    listaPaquetes.map(p => p.categoria).filter((c): c is string => !!c && c.trim() !== '')
                )).sort();
                setCategorias(categoriasUnicas);
                calcularEstadisticas(listaPaquetes);
            } else {
                setError(resultado.error || 'Error cargando paquetes');
            }
        } catch {
            setError('Error inesperado al cargar paquetes');
        } finally {
            setCargando(false);
        }
    };

    const aplicarFiltros = () => {
        if (busquedaTimeoutRef.current) clearTimeout(busquedaTimeoutRef.current);
        busquedaTimeoutRef.current = setTimeout(async () => {
            if (!busqueda && !filtroCategoria && !filtroNivel) {
                await cargarPaquetes();
                return;
            }
            try {
                setCargando(true);
                setError('');
                const resultado = await buscarPaquetes(busqueda, {
                    categoria: filtroCategoria || undefined,
                    nivel: filtroNivel || undefined
                });
                if (resultado.success) {
                    const listaPaquetes = resultado.data || [];
                    setPaquetes(listaPaquetes);
                    calcularEstadisticas(listaPaquetes);
                } else {
                    setError(resultado.error || 'Error en la búsqueda');
                }
            } catch {
                setError('Error inesperado en la búsqueda');
            } finally {
                setCargando(false);
            }
        }, busqueda ? 300 : 0);
    };

    const limpiarFiltros = () => {
        setBusqueda('');
        setFiltroCategoria('');
        setFiltroNivel('');
        cargarPaquetes();
    };

    const calcularDescuento = (precioNormal?: number, precioRebajado?: number) => {
        if (precioNormal && precioRebajado && precioRebajado < precioNormal) {
            return Math.round(((precioNormal - precioRebajado) / precioNormal) * 100);
        }
        return 0;
    };

    const verPaquete = (slug?: string) => {
        if (slug) navigate(`/paquetes/${slug}`);
    };

    const irAlInicio = () => navigate('/');

    useEffect(() => { cargarPaquetes(); }, []);

    useEffect(() => {
        if (busqueda || filtroCategoria || filtroNivel) {
            aplicarFiltros();
        } else if (!cargando && paquetes.length === 0 && !error) {
            cargarPaquetes();
        }
    }, [busqueda, filtroCategoria, filtroNivel]);

    return {
        paquetes, cargando, error, busqueda, setBusqueda,
        filtroCategoria, setFiltroCategoria, filtroNivel, setFiltroNivel,
        categorias, stats, cargarPaquetes, limpiarFiltros,
        calcularDescuento, verPaquete, irAlInicio
    };
}
