import React from 'react';
import {
  PREFERENCIAS_PRACTICA_LIBRE_POR_DEFECTO,
  type PistaPracticaLibre,
  type PreferenciasPracticaLibre,
  type SeccionPanelPracticaLibre,
} from '../TiposPracticaLibre';
import { listarPistasPracticaLibre } from '../Servicios/servicioPistasPracticaLibre';
import {
  cargarPreferenciasPracticaLibre,
  guardarPreferenciasPracticaLibre,
} from '../Servicios/servicioPreferenciasPracticaLibre';
import { motorAudioPro } from '../../../SimuladorDeAcordeon/AudioEnginePro';

interface UseEstudioPracticaLibreArgs {
  tonalidadSeleccionada: string;
  instrumentoId: string;
  grabando: boolean;
  volumenAcordeon: number;
  setVolumenAcordeon: React.Dispatch<React.SetStateAction<number>>;
}

interface OpcionesConfigurarAudio {
  autoplay?: boolean;
  tiempoInicial?: number;
}

export function useEstudioPracticaLibre({
  tonalidadSeleccionada,
  instrumentoId,
  grabando,
  volumenAcordeon,
  setVolumenAcordeon,
}: UseEstudioPracticaLibreArgs) {
  const [panelActivo, setPanelActivo] = React.useState<SeccionPanelPracticaLibre | null>('sonido');
  const [preferencias, setPreferencias] = React.useState<PreferenciasPracticaLibre>(PREFERENCIAS_PRACTICA_LIBRE_POR_DEFECTO);
  const [pistasDisponibles, setPistasDisponibles] = React.useState<PistaPracticaLibre[]>([]);
  const [cargandoPistas, setCargandoPistas] = React.useState(true);
  const [pistaActiva, setPistaActiva] = React.useState<PistaPracticaLibre | null>(null);
  const [reproduciendoPista, setReproduciendoPista] = React.useState(false);
  const [tiempoPistaActual, setTiempoPistaActual] = React.useState(0);
  const [duracionPista, setDuracionPista] = React.useState(0);
  const [preferenciasListas, setPreferenciasListas] = React.useState(false);

  const audioPrincipalRef = React.useRef<HTMLAudioElement | null>(null);
  const audiosCapasRef = React.useRef<HTMLAudioElement[]>([]);
  const reproduciendoRef = React.useRef(false);
  const tiempoActualRef = React.useRef(0);
  const intervaloSincronizacionRef = React.useRef<number | null>(null);
  const urlsLocalesRef = React.useRef<string[]>([]);
  const grabandoAnteriorRef = React.useRef(grabando);

  const limpiarIntervaloSincronizacion = React.useCallback(() => {
    if (intervaloSincronizacionRef.current) {
      window.clearInterval(intervaloSincronizacionRef.current);
      intervaloSincronizacionRef.current = null;
    }
  }, []);

  const pausarTodosLosAudios = React.useCallback(() => {
    if (audioPrincipalRef.current) {
      audioPrincipalRef.current.pause();
    }
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

    audiosCapasRef.current.forEach((audio) => {
      audio.pause();
      audio.src = '';
      audio.load();
    });

    audiosCapasRef.current = [];
    reproduciendoRef.current = false;
    setReproduciendoPista(false);
    setTiempoPistaActual(0);
    setDuracionPista(0);
    tiempoActualRef.current = 0;
  }, [limpiarIntervaloSincronizacion]);

  const actualizarVolumenPistas = React.useCallback(() => {
    const factor = Math.max(0, Math.min(1, preferencias.efectos.volumenPista / 100));
    if (audioPrincipalRef.current) {
      audioPrincipalRef.current.volume = factor;
    }

    audiosCapasRef.current.forEach((audio) => {
      const base = Number(audio.dataset.baseVolume || '1');
      audio.volume = Math.max(0, Math.min(1, factor * base));
    });
  }, [preferencias.efectos.volumenPista]);

  const obtenerFuentesActivas = React.useCallback((pista: PistaPracticaLibre) => {
    if (Array.isArray(pista.capas) && pista.capas.length > 0 && preferencias.capasActivas.length > 0) {
      return pista.capas
        .filter((capa) => preferencias.capasActivas.includes(capa.id))
        .map((capa) => ({
          id: capa.id,
          nombre: capa.nombre,
          url: capa.url,
          volumen: typeof capa.volumen === 'number' ? capa.volumen : 1,
        }))
        .filter((capa) => capa.url);
    }

    if (pista.audioUrl) {
      return [
        {
          id: pista.id,
          nombre: pista.nombre,
          url: pista.audioUrl,
          volumen: 1,
        },
      ];
    }

    return [];
  }, [preferencias.capasActivas]);

  const iniciarSincronizacionCapas = React.useCallback(() => {
    limpiarIntervaloSincronizacion();

    intervaloSincronizacionRef.current = window.setInterval(() => {
      const maestro = audioPrincipalRef.current;
      if (!maestro || maestro.paused) return;

      audiosCapasRef.current.forEach((audio) => {
        if (Math.abs(audio.currentTime - maestro.currentTime) > 0.18) {
          audio.currentTime = maestro.currentTime;
        }
      });
    }, 450);
  }, [limpiarIntervaloSincronizacion]);

  const configurarAudioPista = React.useCallback(async (
    pista: PistaPracticaLibre,
    opciones: OpcionesConfigurarAudio = {}
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
    audiosCapasRef.current.forEach((audio) => {
      audio.currentTime = tiempoInicial;
    });

    let ultimaActualizacionUI = 0;
    maestro.addEventListener('timeupdate', () => {
      tiempoActualRef.current = maestro.currentTime;
      // Actualizar UI del tiempo solo cada 500ms para no provocar re-renders excesivos
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
      audiosCapasRef.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
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

  React.useEffect(() => {
    let vivo = true;

    const cargarPistas = async () => {
      setCargandoPistas(true);
      try {
        const pistas = await listarPistasPracticaLibre();
        if (vivo) {
          setPistasDisponibles(pistas);
        }
      } finally {
        if (vivo) {
          setCargandoPistas(false);
        }
      }
    };

    void cargarPistas();

    return () => {
      vivo = false;
    };
  }, []);

  React.useEffect(() => {
    let vivo = true;

    const cargar = async () => {
      destruirAudios();
      setPistaActiva(null);
      setPreferenciasListas(false);
      const preferenciasCargadas = await cargarPreferenciasPracticaLibre(tonalidadSeleccionada);
      if (!vivo) return;

      setPreferencias(preferenciasCargadas);
      setPanelActivo(preferenciasCargadas.ultimaSeccion || 'sonido');
      setPreferenciasListas(true);
    };

    void cargar();

    return () => {
      vivo = false;
    };
  }, [destruirAudios, tonalidadSeleccionada]);

  React.useEffect(() => {
    if (!preferenciasListas) return;

    const timer = window.setTimeout(() => {
      void guardarPreferenciasPracticaLibre(tonalidadSeleccionada, preferencias, instrumentoId);
    }, 280);

    return () => {
      window.clearTimeout(timer);
    };
  }, [instrumentoId, preferencias, preferenciasListas, tonalidadSeleccionada]);

  React.useEffect(() => {
    actualizarVolumenPistas();
  }, [actualizarVolumenPistas]);

  // 🔊 Sincronizar efectos con el motor de audio real
  React.useEffect(() => {
    if (!preferenciasListas) return;
    
    const { efectos } = preferencias;
    // EQ: graves, medios, agudos
    motorAudioPro.actualizarEQ(efectos.bajos, efectos.medios, efectos.agudos);
    // Reverb: 0-100 -> 0.0-1.0
    motorAudioPro.actualizarReverb(efectos.reverb / 100);
    // Volumen Maestro
    motorAudioPro.setVolumenMaestro(volumenAcordeon / 100);
  }, [preferencias.efectos, volumenAcordeon, preferenciasListas]);

  React.useEffect(() => {
    if (!pistaActiva) {
      destruirAudios();
      return;
    }

    void configurarAudioPista(pistaActiva, {
      autoplay: reproduciendoRef.current,
      tiempoInicial: tiempoActualRef.current,
    });
  }, [configurarAudioPista, destruirAudios, pistaActiva, preferencias.capasActivas]);

  React.useEffect(() => {
    if (!preferenciasListas) return;
    if (pistaActiva) return;
    if (!preferencias.pistaId && !preferencias.pistaUrl) return;

    const encontrada = pistasDisponibles.find((pista) => pista.id === preferencias.pistaId)
      || pistasDisponibles.find((pista) => pista.audioUrl && pista.audioUrl === preferencias.pistaUrl);

    if (encontrada) {
      setPistaActiva(encontrada);
    }
  }, [preferenciasListas, preferencias.pistaId, preferencias.pistaUrl, pistaActiva, pistasDisponibles]);

  React.useEffect(() => {
    return () => {
      destruirAudios();
      urlsLocalesRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsLocalesRef.current = [];
    };
  }, [destruirAudios]);

  const actualizarPreferencias = React.useCallback((actualizador: (prev: PreferenciasPracticaLibre) => PreferenciasPracticaLibre) => {
    setPreferencias((prev) => actualizador(prev));
  }, []);

  const alternarPanel = React.useCallback((seccion: SeccionPanelPracticaLibre) => {
    setPanelActivo((prev) => {
      const siguiente = prev === seccion ? null : seccion;
      setPreferencias((actuales) => ({ ...actuales, ultimaSeccion: siguiente }));
      return siguiente;
    });
  }, []);

  const seleccionarModeloVisual = React.useCallback((modeloVisualId: string) => {
    actualizarPreferencias((prev) => ({
      ...prev,
      modeloVisualId,
    }));
  }, [actualizarPreferencias]);

  const seleccionarPista = React.useCallback((pista: PistaPracticaLibre) => {
    pausarTodosLosAudios();
    setPistaActiva(pista);
    setTiempoPistaActual(0);
    tiempoActualRef.current = 0;
    actualizarPreferencias((prev) => ({
      ...prev,
      pistaId: pista.origen === 'local' ? null : pista.id,
      pistaUrl: pista.origen === 'local' ? null : pista.audioUrl,
      pistaNombre: pista.nombre,
      capasActivas: Array.isArray(pista.capas) && pista.capas.length > 0
        ? pista.capas.map((capa) => capa.id)
        : [],
    }));
  }, [actualizarPreferencias, pausarTodosLosAudios]);

  const limpiarPistaSeleccionada = React.useCallback(() => {
    pausarTodosLosAudios();
    destruirAudios();
    setPistaActiva(null);
    actualizarPreferencias((prev) => ({
      ...prev,
      pistaId: null,
      pistaUrl: null,
      pistaNombre: null,
      capasActivas: [],
    }));
  }, [actualizarPreferencias, destruirAudios, pausarTodosLosAudios]);

  const alternarReproduccionPista = React.useCallback(async () => {
    if (!pistaActiva) return;

    if (!audioPrincipalRef.current) {
      await configurarAudioPista(pistaActiva, { autoplay: true, tiempoInicial: tiempoActualRef.current });
      return;
    }

    if (reproduciendoRef.current) {
      pausarTodosLosAudios();
      return;
    }

    try {
      const audios = [audioPrincipalRef.current, ...audiosCapasRef.current].filter(Boolean) as HTMLAudioElement[];
      audios.forEach((audio) => {
        audio.currentTime = tiempoActualRef.current;
      });
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
    await configurarAudioPista(pistaActiva, {
      autoplay,
      tiempoInicial: 0,
    });
  }, [configurarAudioPista, pistaActiva]);

  const prepararPistaParaGrabar = React.useCallback(async () => {
    if (!pistaActiva) return;
    if (!preferencias.efectos.autoReiniciarPista) return;
    await reiniciarPista(true);
  }, [pistaActiva, preferencias.efectos.autoReiniciarPista, reiniciarPista]);

  const cargarArchivoLocal = React.useCallback((archivo: File) => {
    const url = URL.createObjectURL(archivo);
    urlsLocalesRef.current.push(url);

    const pistaLocal: PistaPracticaLibre = {
      id: `local-${Date.now()}`,
      nombre: archivo.name.replace(/\.[^.]+$/, ''),
      descripcion: 'Pista local cargada desde tu equipo',
      audioUrl: url,
      origen: 'local',
      nombreArchivo: archivo.name,
      capas: [],
    };

    void seleccionarPista(pistaLocal);
  }, [seleccionarPista]);

  const alternarCapa = React.useCallback((capaId: string) => {
    actualizarPreferencias((prev) => ({
      ...prev,
      capasActivas: prev.capasActivas.includes(capaId)
        ? prev.capasActivas.filter((id) => id !== capaId)
        : [...prev.capasActivas, capaId],
    }));
  }, [actualizarPreferencias]);

  const actualizarEfectos = React.useCallback((parcial: Partial<PreferenciasPracticaLibre['efectos']>) => {
    actualizarPreferencias((prev) => ({
      ...prev,
      efectos: {
        ...prev.efectos,
        ...parcial,
      },
    }));
  }, [actualizarPreferencias]);

  const ajustarVolumenAcordeon = React.useCallback((valor: number) => {
    setVolumenAcordeon(Math.max(0, Math.min(100, valor)));
  }, [setVolumenAcordeon]);

  React.useEffect(() => {
    const estabaGrabando = grabandoAnteriorRef.current;
    grabandoAnteriorRef.current = grabando;

    if (grabando || !estabaGrabando) return;

    if (reproduciendoRef.current && preferencias.efectos.autoReiniciarPista) {
      pausarTodosLosAudios();
      if (audioPrincipalRef.current) {
        audioPrincipalRef.current.currentTime = 0;
      }
      audiosCapasRef.current.forEach((audio) => {
        audio.currentTime = 0;
      });
      tiempoActualRef.current = 0;
      setTiempoPistaActual(0);
    }
  }, [grabando, pausarTodosLosAudios, preferencias.efectos.autoReiniciarPista]);

  return {
    panelActivo,
    alternarPanel,
    cerrarPanel: () => setPanelActivo(null),
    preferencias,
    setPreferencias,
    seleccionarModeloVisual,
    pistasDisponibles,
    cargandoPistas,
    pistaActiva,
    seleccionarPista,
    limpiarPistaSeleccionada,
    cargarArchivoLocal,
    reproduciendoPista,
    alternarReproduccionPista,
    reiniciarPista,
    prepararPistaParaGrabar,
    tiempoPistaActual,
    duracionPista,
    alternarCapa,
    actualizarEfectos,
    volumenAcordeon,
    ajustarVolumenAcordeon,
  };
}
