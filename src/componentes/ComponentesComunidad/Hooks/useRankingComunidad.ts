import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';

interface UsuarioRanking {
  nombre: string;
  apellido: string;
  nombre_usuario?: string;
  nombre_completo?: string;
  url_foto_perfil?: string;
}

export interface RankingItem {
  posicion: number;
  puntuacion: number;
  usuario_id: string;
  usuario: UsuarioRanking;
  nivel: number;
  xp_total: number;
  cursos_completados: number;
  tutoriales_completados: number;
  publicaciones_creadas: number;
  likes_recibidos: number;
  comentarios_hechos: number;
  racha_actual_dias: number;
  logros_totales: number;
  es_gaming: boolean;
}

interface Filtro {
  value: string;
  label: string;
  icon: string;
}

const RANKING_MOCK: RankingItem[] = [
  { posicion: 1, puntuacion: 2500, usuario_id: '1', usuario: { nombre: 'Carlos', apellido: 'Mendoza', url_foto_perfil: '' }, nivel: 15, xp_total: 2500, cursos_completados: 8, tutoriales_completados: 12, publicaciones_creadas: 25, likes_recibidos: 150, comentarios_hechos: 45, racha_actual_dias: 30, logros_totales: 8, es_gaming: true },
  { posicion: 2, puntuacion: 2300, usuario_id: '2', usuario: { nombre: 'Ana', apellido: 'Rodriguez', url_foto_perfil: '' }, nivel: 14, xp_total: 2300, cursos_completados: 7, tutoriales_completados: 10, publicaciones_creadas: 20, likes_recibidos: 120, comentarios_hechos: 35, racha_actual_dias: 25, logros_totales: 7, es_gaming: true },
  { posicion: 3, puntuacion: 1900, usuario_id: '3', usuario: { nombre: 'Luis', apellido: 'García', url_foto_perfil: '' }, nivel: 10, xp_total: 1900, cursos_completados: 5, tutoriales_completados: 6, publicaciones_creadas: 15, likes_recibidos: 78, comentarios_hechos: 28, racha_actual_dias: 20, logros_totales: 6, es_gaming: true },
  { posicion: 4, puntuacion: 1800, usuario_id: '4', usuario: { nombre: 'María', apellido: 'López', url_foto_perfil: '' }, nivel: 9, xp_total: 1800, cursos_completados: 4, tutoriales_completados: 8, publicaciones_creadas: 12, likes_recibidos: 65, comentarios_hechos: 22, racha_actual_dias: 18, logros_totales: 5, es_gaming: true },
  { posicion: 5, puntuacion: 1700, usuario_id: '5', usuario: { nombre: 'Pedro', apellido: 'Martínez', url_foto_perfil: '' }, nivel: 8, xp_total: 1700, cursos_completados: 3, tutoriales_completados: 7, publicaciones_creadas: 10, likes_recibidos: 55, comentarios_hechos: 18, racha_actual_dias: 15, logros_totales: 4, es_gaming: true },
  { posicion: 6, puntuacion: 1600, usuario_id: '6', usuario: { nombre: 'Sofia', apellido: 'González', url_foto_perfil: '' }, nivel: 7, xp_total: 1600, cursos_completados: 2, tutoriales_completados: 6, publicaciones_creadas: 8, likes_recibidos: 45, comentarios_hechos: 15, racha_actual_dias: 12, logros_totales: 3, es_gaming: true },
  { posicion: 7, puntuacion: 1500, usuario_id: '7', usuario: { nombre: 'Diego', apellido: 'Hernández', url_foto_perfil: '' }, nivel: 6, xp_total: 1500, cursos_completados: 2, tutoriales_completados: 5, publicaciones_creadas: 6, likes_recibidos: 35, comentarios_hechos: 12, racha_actual_dias: 10, logros_totales: 2, es_gaming: true },
  { posicion: 8, puntuacion: 1400, usuario_id: '8', usuario: { nombre: 'Laura', apellido: 'Díaz', url_foto_perfil: '' }, nivel: 5, xp_total: 1400, cursos_completados: 1, tutoriales_completados: 4, publicaciones_creadas: 4, likes_recibidos: 25, comentarios_hechos: 8, racha_actual_dias: 8, logros_totales: 2, es_gaming: true },
  { posicion: 9, puntuacion: 1300, usuario_id: '9', usuario: { nombre: 'Miguel', apellido: 'Ruiz', url_foto_perfil: '' }, nivel: 4, xp_total: 1300, cursos_completados: 1, tutoriales_completados: 3, publicaciones_creadas: 3, likes_recibidos: 20, comentarios_hechos: 6, racha_actual_dias: 6, logros_totales: 1, es_gaming: true },
  { posicion: 10, puntuacion: 1200, usuario_id: '10', usuario: { nombre: 'Carmen', apellido: 'Vega', url_foto_perfil: '' }, nivel: 3, xp_total: 1200, cursos_completados: 1, tutoriales_completados: 2, publicaciones_creadas: 2, likes_recibidos: 15, comentarios_hechos: 4, racha_actual_dias: 4, logros_totales: 1, es_gaming: true },
];

export const FILTROS: Filtro[] = [
  { value: 'general', label: 'General', icon: '🏆' },
  { value: 'cursos', label: 'Cursos', icon: '📚' },
  { value: 'comunidad', label: 'Comunidad', icon: '💬' },
  { value: 'simulador', label: 'Simulador', icon: '🎹' },
  { value: 'constancia', label: 'Constancia', icon: '🔥' },
];

export function useRankingComunidad() {
  const [rankingData, setRankingData] = useState<RankingItem[]>([]);
  const [rankingCompleto, setRankingCompleto] = useState<RankingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('general');
  const [datosUsuarioActual, setDatosUsuarioActual] = useState<{ id: string } | null>(null);

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setDatosUsuarioActual({ id: user.id });
      } catch {
        // no afecta la funcionalidad principal
      }
    };

    obtenerUsuarioActual();
  }, []);

  const cargarRanking = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setRankingCompleto(RANKING_MOCK);
      setCurrentPage(1);
      setRankingData(RANKING_MOCK.slice(0, itemsPerPage));
      setHasMore(RANKING_MOCK.length > itemsPerPage);
    } catch {
      setError('Error al cargar el ranking');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarMasUsuarios = () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    setTimeout(() => {
      const start = currentPage * itemsPerPage;
      const end = start + itemsPerPage;
      const nuevos = rankingCompleto.slice(start, end);

      if (nuevos.length > 0) {
        setRankingData(prev => [...prev, ...nuevos]);
        setCurrentPage(prev => prev + 1);
        setHasMore(end < rankingCompleto.length);
      } else {
        setHasMore(false);
      }

      setIsLoadingMore(false);
    }, 500);
  };

  const cambiarFiltro = (nuevoFiltro: string) => {
    if (nuevoFiltro !== filtroTipo) {
      setFiltroTipo(nuevoFiltro);
      setCurrentPage(1);
      setRankingData([]);
      cargarRanking();
    }
  };

  useEffect(() => {
    cargarRanking();
  }, [filtroTipo]);

  const obtenerEmojiPosicion = (posicion: number): string => {
    if (posicion === 1) return '🥇';
    if (posicion === 2) return '🥈';
    if (posicion === 3) return '🥉';
    return '🏅';
  };

  const obtenerClasePosicion = (posicion: number): string => {
    if (posicion <= 3) return 'top-tres';
    if (posicion <= 10) return 'top-diez';
    return 'otros';
  };

  return {
    rankingData, isLoading, isLoadingMore, error, filtroTipo,
    datosUsuarioActual, hasMore, loaderRef,
    cambiarFiltro, cargarMasUsuarios, cargarRanking,
    obtenerEmojiPosicion, obtenerClasePosicion,
  };
}
