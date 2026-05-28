'use client';

import { useState, useEffect } from 'react';
import { eventosService, type EventoCompleto } from '../../../servicios/eventosService';
import { leerCacheStale, guardarCache } from '../../../utilidades/cacheLocal';

export type Evento = EventoCompleto;

export interface FiltrosEvento {
  categoria: string;
  tipo_evento: string;
  nivel_dificultad: string;
  es_gratuito: boolean | undefined;
  busqueda: string;
  fecha_desde: string;
  fecha_hasta: string;
}

const FILTROS_INICIAL: FiltrosEvento = {
  categoria: '', tipo_evento: '', nivel_dificultad: '',
  es_gratuito: undefined, busqueda: '', fecha_desde: '', fecha_hasta: '',
};

// Clave de cache solo cuando NO hay filtros (lista por defecto que el usuario
// ve al abrir /eventos). Con filtros distintos no cacheamos para evitar
// confusión entre listas filtradas.
function tieneFiltrosActivos(f: FiltrosEvento): boolean {
  return !!(f.categoria || f.tipo_evento || f.nivel_dificultad ||
    f.es_gratuito !== undefined || f.busqueda || f.fecha_desde || f.fecha_hasta);
}

interface UseCalendarioEventosOptions {
  eventosIniciales?: Evento[];
  totalInicial?: number;
}

export function useCalendarioEventos(
  eventosPorPagina: number,
  vistaInicial: 'grid' | 'lista',
  options: UseCalendarioEventosOptions = {},
) {
  const { eventosIniciales, totalInicial } = options;
  const [vista, setVista] = useState<'grid' | 'lista'>(vistaInicial);
  const [eventos, setEventos] = useState<Evento[]>(eventosIniciales || []);
  // Si llegamos con datos del servidor (SSG), no mostramos spinner al inicio.
  const [loading, setLoading] = useState(!eventosIniciales);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(
    totalInicial ? Math.ceil(totalInicial / eventosPorPagina) : 0
  );
  const [filtros, setFiltros] = useState<FiltrosEvento>(FILTROS_INICIAL);

  const cargarEventos = async () => {
    // Stale-while-revalidate: si estamos en la primera vista (sin filtros, página 0)
    // y hay cache, lo aplicamos al instante. Luego refrescamos en background.
    const usarCache = paginaActual === 0 && !tieneFiltrosActivos(filtros);
    if (usarCache && !eventosIniciales) {
      const cached = leerCacheStale<{ eventos: Evento[]; total: number }>('eventos:listado-inicial');
      if (cached) {
        setEventos(cached.eventos);
        setTotalPaginas(Math.ceil(cached.total / eventosPorPagina));
        setLoading(false);
      }
    }

    setError(null);
    try {
      // @ts-ignore
      const { eventos: eventosData, total, error: errorData } = await eventosService.obtenerEventos({
        ...filtros, estado: 'programado', limit: eventosPorPagina, offset: paginaActual * eventosPorPagina,
      });
      if (errorData) { setError(errorData); return; }
      setEventos(eventosData || []);
      setTotalPaginas(Math.ceil((total || 0) / eventosPorPagina));
      if (usarCache && eventosData) {
        guardarCache('eventos:listado-inicial', { eventos: eventosData, total: total || 0 });
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarEventos(); }, [paginaActual, filtros]);

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFiltros(prev => ({ ...prev, [name]: checked ? true : undefined }));
    } else {
      setFiltros(prev => ({ ...prev, [name]: value }));
    }
    setPaginaActual(0);
  };

  const limpiarFiltros = () => { setFiltros(FILTROS_INICIAL); setPaginaActual(0); };

  return {
    vista, setVista, eventos, loading, error, paginaActual, setPaginaActual,
    totalPaginas, filtros, handleFiltroChange, limpiarFiltros, cargarEventos,
  };
}
