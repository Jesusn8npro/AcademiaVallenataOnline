import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function generarSlug(texto: string = ''): string {
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface UseBarraLateralCursoProps {
  curso: any;
  leccionActiva: string;
  progreso?: Record<string, number | boolean>;
  tipo?: 'curso' | 'tutorial';
}

export function useBarraLateralCurso({
  curso, leccionActiva, progreso = {}, tipo = 'curso',
}: UseBarraLateralCursoProps) {
  const navigate = useNavigate();
  const [modulosExpandidos, setModulosExpandidos] = useState<Record<string, boolean>>({});
  const [cursoAdaptado, setCursoAdaptado] = useState<any>(curso);

  useEffect(() => {
    if (!curso || curso.modulos) { setCursoAdaptado(curso); return; }
    const lecciones = curso.partes_tutorial || curso.clases_tutorial || curso.partes || curso.clases;
    if (!Array.isArray(lecciones) || !lecciones.length) { setCursoAdaptado(curso); return; }
    const unicas = lecciones.filter((p: any, i: number, arr: any[]) => arr.findIndex((q: any) => q.id === p.id) === i);
    const normalizadas = unicas.map((p: any) => ({
      ...p,
      thumbnail_url: p.thumbnail_url || p.thumbnail || p.video_miniatura_url || '',
    }));
    setCursoAdaptado({
      ...curso,
      modulos: [{ id: 'tutorial-partes', titulo: 'Clases', lecciones: normalizadas }],
    });
  }, [curso]);

  useEffect(() => {
    if (cursoAdaptado?.modulos) {
      const nuevosExpandidos: Record<string, boolean> = { ...modulosExpandidos };
      cursoAdaptado.modulos.forEach((modulo: any) => {
        if (!(modulo.id in nuevosExpandidos)) nuevosExpandidos[modulo.id] = true;
      });
      setModulosExpandidos(nuevosExpandidos);
    }
  }, [cursoAdaptado]);

  function obtenerVideoId(url: string): { source: 'youtube' | 'bunny' | null; id: string | null; libraryId: string | null } {
    if (!url) return { source: null, id: null, libraryId: null };
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match?.[1]) return { source: 'youtube', id: match[1], libraryId: null };
    }
    const bunnyPatterns = [
      /iframe\.mediadelivery\.net\/embed\/([0-9]+)\/([a-zA-Z0-9-]+)/,
      /iframe\.mediadelivery\.net\/play\/([0-9]+)\/([a-zA-Z0-9-]+)/,
    ];
    for (const pattern of bunnyPatterns) {
      const match = url.match(pattern);
      if (match) return { source: 'bunny', id: match[2], libraryId: match[1] };
    }
    return { source: null, id: null, libraryId: null };
  }

  function obtenerMiniatura(videoUrl: string): string {
    const { source, id, libraryId } = obtenerVideoId(videoUrl);
    if (source === 'youtube' && id) return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
    if (source === 'bunny' && libraryId && id) return `https://iframe.mediadelivery.net/thumbnail/${libraryId}/${id}`;
    return 'https://academiavallenataonline.com/wp-content/uploads/2023/06/placeholder-video.jpg';
  }

  function toggleModulo(moduloId: string) {
    setModulosExpandidos(prev => ({ ...prev, [moduloId]: !prev[moduloId] }));
  }

  function irALeccion(modulo: any, leccion: any) {
    const cursoSlug = curso?.slug || (curso?.titulo ? generarSlug(curso.titulo) : '');
    const moduloSlug = modulo?.slug || (modulo?.titulo ? generarSlug(modulo.titulo) : '');
    const leccionSlug = leccion?.slug || (leccion?.titulo ? generarSlug(leccion.titulo) : '');
    if (tipo === 'curso' && cursoSlug && moduloSlug && leccionSlug) {
      navigate(`/cursos/${cursoSlug}/${moduloSlug}/${leccionSlug}`);
    } else if (tipo === 'tutorial' && cursoSlug && leccionSlug) {
      navigate(`/tutoriales/${cursoSlug}/clase/${leccionSlug}`);
    }
  }

  function esLeccionCompletada(leccionId: string): boolean {
    const p = progreso[leccionId];
    return p === true || p >= 90;
  }

  function esLeccionActiva(leccion: any): boolean {
    return String(leccion.slug) === String(leccionActiva) ||
      String(leccion.id) === String(leccionActiva) ||
      leccion.id === parseInt(String(leccionActiva));
  }

  return {
    modulosExpandidos, cursoAdaptado,
    obtenerMiniatura, toggleModulo, irALeccion,
    esLeccionCompletada, esLeccionActiva,
  };
}
