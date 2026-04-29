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
  const [esEmbed, setEsEmbed] = useState(false);
  const [idYouTube, setIdYouTube] = useState('');
  const [urlVideoLimpia, setUrlVideoLimpia] = useState('');
  const [videoId, setVideoId] = useState('');
  const [libraryId, setLibraryId] = useState('');
  const [duracion, setDuracion] = useState(0);
  const [tiempoActual, setTiempoActual] = useState(0);
  const [reproduciendose, setReproduciendose] = useState(false);
  const [urlProcesada, setUrlProcesada] = useState('');

  const elementoVideoRef = useRef<HTMLVideoElement>(null);
  const elementoIframeRef = useRef<HTMLIFrameElement>(null);

  const procesarUrl = (url: string): string => {
    if (!url || url.trim() === '') {
      setTieneError(true);
      return '';
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setEsYouTube(true);
      setEsBunny(false);

      let videoId = '';
      const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/
      ];

      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) { videoId = match[1]; break; }
      }

      if (videoId) {
        const youtubeUrl = `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&controls=1&enablejsapi=1&origin=${window.location.origin}`;
        setTieneError(false);
        return youtubeUrl;
      }
      setTieneError(true);
      return '';
    }

    if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com') || url.includes('mediadelivery.net')) {
      setEsYouTube(false);
      setEsBunny(true);

      const bunnyPatterns = [
        /iframe\.mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /bunnycdn\.com\/.*\/([0-9]+)\/([a-zA-Z0-9-]+)/
      ];

      for (const pattern of bunnyPatterns) {
        const match = url.match(pattern);
        if (match) {
          const libId = match[1];
          const vidId = match[2];
          setLibraryId(libId);
          setVideoId(vidId);
          const bunnyUrl = `https://iframe.mediadelivery.net/embed/${libId}/${vidId}?autoplay=0&controls=1&responsive=1`;
          setTieneError(false);
          return bunnyUrl;
        }
      }

      setTieneError(true);
      return '';
    }

    setEsYouTube(false);
    setEsBunny(false);
    setTieneError(false);
    return url;
  };

  const detectarTipoVideo = (url: string): void => {
    if (!url) {
      setEsEmbed(false); setEsYouTube(false); setEsBunny(false);
      return;
    }

    const regexYouTube = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const coincidenciaYouTube = url.match(regexYouTube);

    if (coincidenciaYouTube && coincidenciaYouTube[1]) {
      setEsYouTube(true); setEsBunny(false); setEsEmbed(true);
      setIdYouTube(coincidenciaYouTube[1]);
      return;
    }

    if (url.includes('iframe.mediadelivery.net') || url.includes('bunnycdn.com') || url.includes('mediadelivery.net')) {
      setEsBunny(true); setEsYouTube(false); setEsEmbed(true);
      const bunnyPattern = /(?:iframe\.)?mediadelivery\.net\/embed\/([0-9]+)\/([a-zA-Z0-9-]+)/;
      const match = url.match(bunnyPattern);
      if (match) { setLibraryId(match[1]); setVideoId(match[2]); }
      return;
    }

    if (url.includes('iframe') || url.includes('embed') || url.includes('player') || url.startsWith('<iframe')) {
      setEsEmbed(true); setEsYouTube(false); setEsBunny(false);
      return;
    }

    setEsEmbed(false); setEsYouTube(false); setEsBunny(false);
  };

  const limpiarUrlVideo = (url: string): string => {
    if (!url) return '';

    if (url.includes('iframe.mediadelivery.net') || url.includes('video.bunnycdn.com') || url.includes('mediadelivery.net')) {
      setEsBunny(true); setEsYouTube(false); setEsEmbed(false);

      const bunnyPatterns = [
        /iframe\.mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /mediadelivery\.net\/(?:play|embed)\/([0-9]+)\/([a-zA-Z0-9-]+)/,
        /bunnycdn\.com\/.*\/([0-9]+)\/([a-zA-Z0-9-]+)/
      ];

      let libId = '';
      let vidId = '';

      for (const pattern of bunnyPatterns) {
        const matches = url.match(pattern);
        if (matches) { libId = matches[1]; vidId = matches[2]; setLibraryId(libId); setVideoId(vidId); break; }
      }

      if (!libId || !vidId) {
        const generalPattern = /\/([0-9]+)\/([a-zA-Z0-9-]+)/;
        const generalMatch = url.match(generalPattern);
        if (generalMatch) { libId = generalMatch[1]; vidId = generalMatch[2]; setLibraryId(libId); setVideoId(vidId); }
      }

      if (libId && vidId) {
        return `https://iframe.mediadelivery.net/embed/${libId}/${vidId}?autoplay=0&controls=1&responsive=1`;
      }
      return url;
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      setEsYouTube(true); setEsBunny(false); setEsEmbed(false);

      const regexps = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/
      ];

      for (const regex of regexps) {
        const match = url.match(regex);
        if (match) { const id = match[1]; setIdYouTube(id); break; }
      }

      return `https://www.youtube.com/embed/${idYouTube}?autoplay=1&rel=0`;
    }

    return url;
  };

  const extraerUrlEmbed = (codigoEmbed: string): string => {
    if (!codigoEmbed.includes('<iframe')) return codigoEmbed;
    const coincidenciaSrc = codigoEmbed.match(/src=["'](.+?)["']/i);
    if (coincidenciaSrc && coincidenciaSrc[1]) return coincidenciaSrc[1];
    return codigoEmbed;
  };

  const reintentar = () => {
    setTieneError(false);
    setCargando(true);
    setEsYouTube(false);
    setEsBunny(false);
    setEsEmbed(false);
    setLibraryId('');
    setVideoId('');
    setIdYouTube('');
    detectarTipoVideo(videoUrl);
    const urlLimpia = limpiarUrlVideo(videoUrl);
    setUrlVideoLimpia(urlLimpia);
  };

  const navegarAnterior = () => {
    if (leccionAnterior) {
      const parentSlug = window.location.pathname.split('/')[2];
      const leccionSlug = leccionAnterior.slug || leccionAnterior.id;
      if (tipo === 'leccion') {
        const moduloSlug = leccionAnterior.moduloSlug;
        if (moduloSlug) navigate(`/cursos/${parentSlug}/${moduloSlug}/${leccionSlug}`);
      } else {
        navigate(`/tutoriales/${parentSlug}/clase/${leccionSlug}`);
      }
    }
  };

  const navegarSiguiente = () => {
    if (leccionSiguiente) {
      const parentSlug = window.location.pathname.split('/')[2];
      const leccionSlug = leccionSiguiente.slug || leccionSiguiente.id;
      if (tipo === 'leccion') {
        const moduloSlug = leccionSiguiente.moduloSlug;
        if (moduloSlug) navigate(`/cursos/${parentSlug}/${moduloSlug}/${leccionSlug}`);
      } else {
        navigate(`/tutoriales/${parentSlug}/clase/${leccionSlug}`);
      }
    }
  };

  useEffect(() => {
    if (videoUrl) {
      setTieneError(false);
      setCargando(true);
      const urlLimpia = limpiarUrlVideo(videoUrl);
      setUrlVideoLimpia(urlLimpia);
      detectarTipoVideo(videoUrl);
    }
  }, [videoUrl]);

  useEffect(() => {
    const urlP = procesarUrl(videoUrl);
    setUrlProcesada(urlP);
  }, [videoUrl]);

  return {
    cargando, setCargando,
    tieneError, setTieneError,
    esYouTube, esBunny, esEmbed,
    idYouTube, urlVideoLimpia, videoId, libraryId,
    duracion, tiempoActual, reproduciendose,
    urlProcesada,
    elementoVideoRef, elementoIframeRef,
    reintentar, navegarAnterior, navegarSiguiente,
    extraerUrlEmbed
  };
}
