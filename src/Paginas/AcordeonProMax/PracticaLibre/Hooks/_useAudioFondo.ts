import React from 'react';
import type { PistaPracticaLibre } from '../TiposPracticaLibre';

interface UseAudioFondoParams {
  pistaActiva: PistaPracticaLibre | null;
  capasActivas: string[];
  volumenPista: number;
}

export function useAudioFondo({ pistaActiva, capasActivas, volumenPista }: UseAudioFondoParams) {
  const [reproduciendoPista, setReproduciendoPista] = React.useState(false);
  const [tiempoPistaActual, setTiempoPistaActual] = React.useState(0);
  const [duracionPista, setDuracionPista] = React.useState(0);

  const audioPrincipalRef = React.useRef<HTMLAudioElement | null>(null);
  const audiosCapasRef = React.useRef<HTMLAudioElement[]>([]);
  const reproduciendoRef = React.useRef(false);
  const tiempoActualRef = React.useRef(0);
  const intervaloSincronizacionRef = React.useRef<number | null>(null);

  const limpiarIntervaloSincronizacion = React.useCallback(() => {
    if (intervaloSincronizacionRef.current) {
      window.clearInterval(intervaloSincronizacionRef.current);
      intervaloSincronizacionRef.current = null;
    }
  }, []);

  const pausarTodosLosAudios = React.useCallback(() => {
    if (audioPrincipalRef.current) audioPrincipalRef.current.pause();
    audiosCapasRef.current.forEach((audio) => audio.pause());
    reproduciendoRef.current = false;
    setReproduciendoPista(false);
  }, []);

  const destruirAudios = React.useCallback(() => {
    limpiarIntervaloSincronizacion();
    if (audioPrincipalRef.current) {
      audioPrincipalRef.current.pause();
      audioPrincipalRef.current.src = '';
      audioPrincipalRef.current.load();
      audioPrincipalRef.current = null;
    }
    audiosCapasRef.current.forEach((audio) => { audio.pause(); audio.src = ''; audio.load(); });
    audiosCapasRef.current = [];
    reproduciendoRef.current = false;
    setReproduciendoPista(false);
    setTiempoPistaActual(0);
    setDuracionPista(0);
    tiempoActualRef.current = 0;
  }, [limpiarIntervaloSincronizacion]);

  const actualizarVolumenPistas = React.useCallback(() => {
    const factor = Math.max(0, Math.min(1, volumenPista / 100));
    if (audioPrincipalRef.current) audioPrincipalRef.current.volume = factor;
    audiosCapasRef.current.forEach((audio) => {
      const base = Number(audio.dataset.baseVolume || '1');
      audio.volume = Math.max(0, Math.min(1, factor * base));
    });
  }, [volumenPista]);

  const obtenerFuentesActivas = React.useCallback((pista: PistaPracticaLibre) => {
    if (Array.isArray(pista.capas) && pista.capas.length > 0 && capasActivas.length > 0) {
      return pista.capas
        .filter((capa) => capasActivas.includes(capa.id))
        .map((capa) => ({
          id: capa.id,
          nombre: capa.nombre,
          url: capa.url,
          volumen: typeof capa.volumen === 'number' ? capa.volumen : 1,
        }))
        .filter((capa) => capa.url);
    }
    if (pista.audioUrl) return [{ id: pista.id, nombre: pista.nombre, url: pista.audioUrl, volumen: 1 }];
    return [];
  }, [capasActivas]);

  const iniciarSincronizacionCapas = React.useCallback(() => {
    limpiarIntervaloSincronizacion();
    intervaloSincronizacionRef.current = window.setInterval(() => {
      const maestro = audioPrincipalRef.current;
      if (!maestro || maestro.paused) return;
      audiosCapasRef.current.forEach((audio) => {
        if (Math.abs(audio.currentTime - maestro.currentTime) > 0.18) audio.currentTime = maestro.currentTime;
      });
    }, 450);
  }, [limpiarIntervaloSincronizacion]);

  const configurarAudioPista = React.useCallback(async (
    pista: PistaPracticaLibre,
    opciones: { autoplay?: boolean; tiempoInicial?: number } = {}
  ) => {
    destruirAudios();
    const fuentes = obtenerFuentesActivas(pista);
    if (!fuentes.length) return;
    const tiempoInicial = Math.max(0, opciones.tiempoInicial || 0);
    const nuevosAudios = fuentes.map((fuente) => {
      const audio = new Audio(fuente.url);
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.dataset.baseVolume = String(fuente.volumen || 1);
      return audio;
    });
    const maestro = nuevosAudios[0];
    audioPrincipalRef.current = maestro;
    audiosCapasRef.current = nuevosAudios.slice(1);
    maestro.currentTime = tiempoInicial;
    audiosCapasRef.current.forEach((audio) => { audio.currentTime = tiempoInicial; });
    let ultimaActualizacionUI = 0;
    maestro.addEventListener('timeupdate', () => {
      tiempoActualRef.current = maestro.currentTime;
      const ahora = Date.now();
      if (ahora - ultimaActualizacionUI >= 500) {
        ultimaActualizacionUI = ahora;
        setTiempoPistaActual(maestro.currentTime);
      }
    });
    maestro.addEventListener('loadedmetadata', () => {
      setDuracionPista(Number.isFinite(maestro.duration) ? maestro.duration : 0);
    });
    maestro.addEventListener('ended', () => {
      reproduciendoRef.current = false;
      setReproduciendoPista(false);
      setTiempoPistaActual(0);
      tiempoActualRef.current = 0;
      audiosCapasRef.current.forEach((audio) => { audio.pause(); audio.currentTime = 0; });
      limpiarIntervaloSincronizacion();
    });
    actualizarVolumenPistas();
    if (opciones.autoplay) {
      try {
        await Promise.all(nuevosAudios.map((audio) => audio.play()));
        reproduciendoRef.current = true;
        setReproduciendoPista(true);
        iniciarSincronizacionCapas();
      } catch {
        reproduciendoRef.current = false;
        setReproduciendoPista(false);
      }
    }
  }, [actualizarVolumenPistas, destruirAudios, iniciarSincronizacionCapas, limpiarIntervaloSincronizacion, obtenerFuentesActivas]);

  React.useEffect(() => { actualizarVolumenPistas(); }, [actualizarVolumenPistas]);

  React.useEffect(() => {
    if (!pistaActiva) { destruirAudios(); return; }
    void configurarAudioPista(pistaActiva, {
      autoplay: reproduciendoRef.current,
      tiempoInicial: tiempoActualRef.current,
    });
  }, [configurarAudioPista, destruirAudios, pistaActiva, capasActivas]);

  const alternarReproduccionPista = React.useCallback(async () => {
    if (!pistaActiva) return;
    if (!audioPrincipalRef.current) {
      await configurarAudioPista(pistaActiva, { autoplay: true, tiempoInicial: tiempoActualRef.current });
      return;
    }
    if (reproduciendoRef.current) { pausarTodosLosAudios(); return; }
    try {
      const audios = [audioPrincipalRef.current, ...audiosCapasRef.current].filter(Boolean) as HTMLAudioElement[];
      audios.forEach((audio) => { audio.currentTime = tiempoActualRef.current; });
      await Promise.all(audios.map((audio) => audio.play()));
      reproduciendoRef.current = true;
      setReproduciendoPista(true);
      iniciarSincronizacionCapas();
    } catch {
      reproduciendoRef.current = false;
      setReproduciendoPista(false);
    }
  }, [configurarAudioPista, iniciarSincronizacionCapas, pausarTodosLosAudios, pistaActiva]);

  const reiniciarPista = React.useCallback(async (autoplay = false) => {
    if (!pistaActiva) return;
    tiempoActualRef.current = 0;
    setTiempoPistaActual(0);
    await configurarAudioPista(pistaActiva, { autoplay, tiempoInicial: 0 });
  }, [configurarAudioPista, pistaActiva]);

  const autoReiniciarDespuesDeGrabacion = React.useCallback(() => {
    if (!reproduciendoRef.current) return;
    pausarTodosLosAudios();
    if (audioPrincipalRef.current) audioPrincipalRef.current.currentTime = 0;
    audiosCapasRef.current.forEach((audio) => { audio.currentTime = 0; });
    tiempoActualRef.current = 0;
    setTiempoPistaActual(0);
  }, [pausarTodosLosAudios]);

  return {
    reproduciendoPista,
    tiempoPistaActual,
    duracionPista,
    reproduciendoRef,
    tiempoActualRef,
    audioPrincipalRef,
    audiosCapasRef,
    pausarTodosLosAudios,
    destruirAudios,
    configurarAudioPista,
    alternarReproduccionPista,
    reiniciarPista,
    autoReiniciarDespuesDeGrabacion,
  };
}
