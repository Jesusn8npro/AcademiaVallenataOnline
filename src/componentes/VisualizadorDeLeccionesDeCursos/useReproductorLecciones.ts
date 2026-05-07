import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface ReproductorLeccionesProps {
  leccionAnterior?: any;
  leccionSiguiente?: any;
  videoUrl?: string;
  tipo?: 'leccion' | 'clase';
}

export function useReproductorLecciones({
  videoUrl = '',
  leccionAnterior = null,
  leccionSiguiente = null,
  tipo = 'leccion'
}: ReproductorLeccionesProps) {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [tieneError, setTieneError] = useState(false);
  const [esYouTube, setEsYouTube] = useState(false);
  const [esBunny, setEsBunny] = useState(false);
  const [idYouTube, setIdYouTube] = useState('');
  const [videoId, setVideoId] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [urlProcesada, setUrlProcesada] = useState('');

  const elementoIframeRef = useRef<HTMLIFrameElement>(null);

  const procesarUrl = (url: string): string => {
    if (!url || !url.trim()) {
      setEsYouTube(false); setEsBunny(false);
      setTieneError(true);
      return '';
    }

    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      const id = ytMatch[1];
      setEsYouTube(true); setEsBunny(false);
      setIdYouTube(id);
      setTieneError(false);
      return `https://www.youtube.com/embed/${id}?autoplay=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&controls=1&enablejsapi=1&origin=${window.location.origin}`;
    }

    const bunnyMatch = url.match(/(?:iframe\.)?mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/);
    if (bunnyMatch) {
      setEsYouTube(false); setEsBunny(true);
      setLibraryId(bunnyMatch[1]);
      setVideoId(bunnyMatch[2]);
      setTieneError(false);
      return `https://iframe.mediadelivery.net/embed/${bunnyMatch[1]}/${bunnyMatch[2]}?autoplay=0&controls=1&responsive=1`;
    }

    setEsYouTube(false); setEsBunny(false);
    setTieneError(false);
    return url;
  };

  const reintentar = () => {
    setCargando(true);
    setUrlProcesada(procesarUrl(videoUrl));
  };

  const navegar = (destino: any) => {
    if (!destino) return;
    const parentSlug = window.location.pathname.split('/')[2];
    const leccionSlug = destino.slug || destino.id;
    if (tipo === 'leccion') {
      const moduloSlug = destino.moduloSlug;
      if (moduloSlug) navigate(`/cursos/${parentSlug}/${moduloSlug}/${leccionSlug}`);
    } else {
      navigate(`/tutoriales/${parentSlug}/clase/${leccionSlug}`);
    }
  };

  useEffect(() => {
    setCargando(true);
    setUrlProcesada(procesarUrl(videoUrl));
  }, [videoUrl]);

  return {
    cargando, setCargando,
    tieneError, setTieneError,
    esYouTube, esBunny,
    idYouTube, videoId, libraryId,
    urlProcesada,
    elementoIframeRef,
    reintentar,
    navegarAnterior: () => navegar(leccionAnterior),
    navegarSiguiente: () => navegar(leccionSiguiente),
  };
}
