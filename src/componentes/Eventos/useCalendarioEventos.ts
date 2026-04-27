import { useState, useEffect } from 'react'
import eventosService, { type EventoCompleto, type FiltrosEventos } from '../../servicios/eventosServicio'

export const categorias = [
  { value: '', label: 'Todas las categorías' },
  { value: 'tecnica', label: 'Técnica' },
  { value: 'teoria', label: 'Teoría' },
  { value: 'repertorio', label: 'Repertorio' },
  { value: 'historia', label: 'Historia' }
]

export const tiposEvento = [
  { value: '', label: 'Todos los tipos' },
  { value: 'masterclass', label: 'Masterclass' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'concierto', label: 'Concierto' },
  { value: 'concurso', label: 'Concurso' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'reunion', label: 'Reunión' }
]

export const nivelesEvento = [
  { value: '', label: 'Todos los niveles' },
  { value: 'principiante', label: 'Principiante' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
  { value: 'profesional', label: 'Profesional' }
]

interface Props {
  eventosPorPagina: number
}

export function useCalendarioEventos({ eventosPorPagina }: Props) {
  const [eventos, setEventos] = useState<EventoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paginaActual, setPaginaActual] = useState(0)
  const [totalEventos, setTotalEventos] = useState(0)
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [filtros, setFiltros] = useState<FiltrosEventos>({
    categoria: '',
    tipo_evento: '',
    nivel_dificultad: '',
    es_gratuito: undefined,
    busqueda: '',
    fecha_desde: '',
    fecha_hasta: ''
  })

  const formatearFecha = (fecha: string): string =>
    new Date(fecha).toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

  const formatearHora = (fecha: string): string =>
    new Date(fecha).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  const formatearPrecio = (precio: number): string =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio)

  const obtenerColorTipo = (tipo: string): string => {
    const clases: Record<string, string> = {
      masterclass: 'badge badge-tipo masterclass',
      workshop: 'badge badge-tipo workshop',
      concierto: 'badge badge-tipo concierto',
      concurso: 'badge badge-tipo concurso',
      webinar: 'badge badge-tipo webinar',
      reunion: 'badge badge-tipo reunion'
    }
    return clases[tipo] || 'badge badge-tipo reunion'
  }

  const obtenerColorNivel = (nivel: string | null): string => {
    if (!nivel) return 'nivel nivel-dot'
    const clases: Record<string, string> = {
      principiante: 'nivel nivel-dot principiante',
      intermedio: 'nivel nivel-dot intermedio',
      avanzado: 'nivel nivel-dot avanzado',
      profesional: 'nivel nivel-dot profesional'
    }
    return clases[nivel] || 'nivel nivel-dot'
  }

  const cargarEventos = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const resultado = await eventosService.obtenerEventos({
        ...filtros,
        limit: eventosPorPagina,
        offset: paginaActual * eventosPorPagina
      })
      setEventos(resultado.eventos)
      setTotalEventos(resultado.total)
      setTotalPaginas(Math.ceil(resultado.total / eventosPorPagina))
    } catch (err) {
      setError('Error al cargar los eventos. Por favor, intenta de nuevo.')
      setEventos([])
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = (): void => {
    setPaginaActual(0)
    cargarEventos()
  }

  const limpiarFiltros = (): void => {
    setFiltros({
      categoria: '',
      tipo_evento: '',
      nivel_dificultad: '',
      es_gratuito: undefined,
      busqueda: '',
      fecha_desde: '',
      fecha_hasta: ''
    })
    setPaginaActual(0)
  }

  const cambiarPagina = (nuevaPagina: number): void => setPaginaActual(nuevaPagina)

  const irAEvento = (slug: string | null): void => {
    if (slug) window.location.href = `/eventos/${slug}`
  }

  useEffect(() => { cargarEventos() }, [paginaActual])
  useEffect(() => { cargarEventos() }, [filtros])

  return {
    eventos, loading, error,
    paginaActual, totalEventos, totalPaginas,
    filtros, setFiltros,
    formatearFecha, formatearHora, formatearPrecio,
    obtenerColorTipo, obtenerColorNivel,
    cargarEventos, aplicarFiltros, limpiarFiltros,
    cambiarPagina, irAEvento
  }
}
