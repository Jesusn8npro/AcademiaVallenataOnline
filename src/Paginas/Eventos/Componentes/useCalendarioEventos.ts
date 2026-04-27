import { useState, useEffect } from 'react';
import { eventosService, type EventoCompleto } from '../../../servicios/eventosService';

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

export function useCalendarioEventos(eventosPorPagina: number, vistaInicial: 'grid' | 'lista') {
  const [vista, setVista] = useState<'grid' | 'lista'>(vistaInicial);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [filtros, setFiltros] = useState<FiltrosEvento>(FILTROS_INICIAL);

  const cargarEventos = async () => {
    setLoading(true);
    setError(null);
    try {
      // @ts-ignore
      const { eventos: eventosData, total, error: errorData } = await eventosService.obtenerEventos({
        ...filtros, estado: 'programado', limit: eventosPorPagina, offset: paginaActual * eventosPorPagina,
      });
      if (errorData) { setError(errorData); return; }
      setEventos(eventosData || []);
      setTotalPaginas(Math.ceil((total || 0) / eventosPorPagina));
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
