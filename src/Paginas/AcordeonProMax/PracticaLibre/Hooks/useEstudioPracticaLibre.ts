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
import { motorAudioPro } from '../../../../Core/audio/AudioEnginePro';
import { useAudioFondo } from './_useAudioFondo';

interface UseEstudioPracticaLibreArgs {
  tonalidadSeleccionada: string;
  instrumentoId: string;
  grabando: boolean;
  volumenAcordeon: number;
  setVolumenAcordeon: React.Dispatch<React.SetStateAction<number>>;
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
  const [preferenciasListas, setPreferenciasListas] = React.useState(false);

  const urlsLocalesRef = React.useRef<string[]>([]);
  const grabandoAnteriorRef = React.useRef(grabando);

  const {
    reproduciendoPista, tiempoPistaActual, duracionPista,
    tiempoActualRef,
    pausarTodosLosAudios, destruirAudios,
    alternarReproduccionPista, reiniciarPista, autoReiniciarDespuesDeGrabacion,
  } = useAudioFondo({
    pistaActiva,
    capasActivas: preferencias.capasActivas,
    volumenPista: preferencias.efectos.volumenPista,
  });

  React.useEffect(() => {
    let vivo = true;
    const cargarPistas = async () => {
      setCargandoPistas(true);
      try {
        const pistas = await listarPistasPracticaLibre();
        if (vivo) setPistasDisponibles(pistas);
      } finally {
        if (vivo) setCargandoPistas(false);
      }
    };
    void cargarPistas();
    return () => { vivo = false; };
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
    return () => { vivo = false; };
  }, [destruirAudios, tonalidadSeleccionada]);

  React.useEffect(() => {
    if (!preferenciasListas) return;
    const timer = window.setTimeout(() => {
      void guardarPreferenciasPracticaLibre(tonalidadSeleccionada, preferencias, instrumentoId);
    }, 280);
    return () => { window.clearTimeout(timer); };
  }, [instrumentoId, preferencias, preferenciasListas, tonalidadSeleccionada]);

  React.useEffect(() => {
    if (!preferenciasListas) return;
    const { efectos } = preferencias;
    motorAudioPro.actualizarEQ(efectos.bajos, efectos.medios, efectos.agudos);
    motorAudioPro.actualizarReverb(efectos.reverb / 100);
    motorAudioPro.setVolumenMaestro(volumenAcordeon / 100);
  }, [preferencias.efectos, volumenAcordeon, preferenciasListas]);

  React.useEffect(() => {
    if (!preferenciasListas) return;
    if (pistaActiva) return;
    if (!preferencias.pistaId && !preferencias.pistaUrl) return;
    const encontrada = pistasDisponibles.find((pista) => pista.id === preferencias.pistaId)
      || pistasDisponibles.find((pista) => pista.audioUrl && pista.audioUrl === preferencias.pistaUrl);
    if (encontrada) setPistaActiva(encontrada);
  }, [preferenciasListas, preferencias.pistaId, preferencias.pistaUrl, pistaActiva, pistasDisponibles]);

  React.useEffect(() => {
    return () => {
      destruirAudios();
      urlsLocalesRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsLocalesRef.current = [];
    };
  }, [destruirAudios]);

  React.useEffect(() => {
    const estabaGrabando = grabandoAnteriorRef.current;
    grabandoAnteriorRef.current = grabando;
    if (grabando || !estabaGrabando) return;
    if (preferencias.efectos.autoReiniciarPista) autoReiniciarDespuesDeGrabacion();
  }, [grabando, autoReiniciarDespuesDeGrabacion, preferencias.efectos.autoReiniciarPista]);

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
    actualizarPreferencias((prev) => ({ ...prev, modeloVisualId }));
  }, [actualizarPreferencias]);

  const seleccionarPista = React.useCallback((pista: PistaPracticaLibre) => {
    pausarTodosLosAudios();
    tiempoActualRef.current = 0;
    setPistaActiva(pista);
    actualizarPreferencias((prev) => ({
      ...prev,
      pistaId: pista.origen === 'local' ? null : pista.id,
      pistaUrl: pista.origen === 'local' ? null : pista.audioUrl,
      pistaNombre: pista.nombre,
      capasActivas: Array.isArray(pista.capas) && pista.capas.length > 0
        ? pista.capas.map((capa) => capa.id)
        : [],
    }));
  }, [actualizarPreferencias, pausarTodosLosAudios, tiempoActualRef]);

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
    actualizarPreferencias((prev) => ({ ...prev, efectos: { ...prev.efectos, ...parcial } }));
  }, [actualizarPreferencias]);

  const ajustarVolumenAcordeon = React.useCallback((valor: number) => {
    setVolumenAcordeon(Math.max(0, Math.min(100, valor)));
  }, [setVolumenAcordeon]);

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
