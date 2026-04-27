import { useRef, useState, useMemo, useEffect } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, CheckCircle2, Eye, HeartPulse, Music2,
  Radio, TimerReset, Trophy, Volume2, Waves,
} from 'lucide-react';
import type { ModoVista } from '../../../Core/acordeon/TiposAcordeon';

type TonoStat = 'gold' | 'green' | 'blue' | 'red' | 'neutral';
export type HeroStat = { label: string; value: string; icon: LucideIcon; tone: TonoStat };

export interface ConfirmacionHeader {
  texto: string;
  onConfirmar: () => void;
}

function formatearTiempo(ms: number) {
  const totalSegundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${minutos}:${segundos.toString().padStart(2, '0')}`;
}

function obtenerClaveModo(hero: any) {
  if (hero.estadoJuego === 'practica_libre' || hero.modoPractica === 'libre') return 'libre';
  if (hero.modoPractica === 'synthesia') return 'synthesia';
  if (hero.modoPractica === 'maestro_solo') return 'maestro_solo';
  return 'competencia';
}

interface UseHeaderHeroParams {
  hero: any;
  modosVista: { valor: ModoVista; label: string }[];
  compas: number;
  onAlturaChange: (height: number) => void;
  onVolver: () => void;
  onIrModoLibre: () => void;
}

export function useHeaderHero({ hero, modosVista, compas, onAlturaChange, onVolver, onIrModoLibre }: UseHeaderHeroParams) {
  const headerRef = useRef<HTMLDivElement | null>(null);
  const ayudaRef = useRef<HTMLDivElement | null>(null);
  const vistaRef = useRef<HTMLDivElement | null>(null);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [vistaAbierta, setVistaAbierta] = useState(false);
  const [confirmacion, setConfirmacion] = useState<ConfirmacionHeader | null>(null);

  const mostrarHeader = !['seleccion', 'resultados', 'gameOver'].includes(hero.estadoJuego);
  const claveModo = obtenerClaveModo(hero);
  const esModoLibre = claveModo === 'libre';
  const cancion = hero.cancionSeleccionada;
  const tonalidadActiva = hero.logica?.tonalidadSeleccionada || cancion?.tonalidad || 'ADG';
  const bpmBase = cancion?.bpm || hero.bpm || 120;
  const vistaActiva = modosVista.find(({ valor }) => hero.logica?.modoVista === valor) || modosVista[0];
  const totalIntentos = hero.estadisticas.notasPerfecto + hero.estadisticas.notasBien + hero.estadisticas.notasFalladas + hero.estadisticas.notasPerdidas;
  const aciertos = hero.estadisticas.notasPerfecto + hero.estadisticas.notasBien;
  const precision = totalIntentos > 0 ? Math.round((aciertos / totalIntentos) * 100) : 0;
  const avance = hero.totalTicks > 0 ? Math.round((hero.tickActual / hero.totalTicks) * 100) : 0;
  const grabando = Boolean(hero.grabaciones?.grabando);
  const tiempoGrabacion = hero.grabaciones?.tiempoGrabacionMs || 0;
  const haySesionActiva = ['contando', 'jugando', 'pausado', 'pausado_synthesia'].includes(hero.estadoJuego) || grabando;

  const modoInfo = useMemo(() => {
    switch (claveModo) {
      case 'libre': return { label: 'Modo libre', accent: 'libre', descripcion: 'Improvisa, graba frases y practica sin puntaje.' };
      case 'synthesia': return { label: 'Synthesia', accent: 'synthesia', descripcion: 'El sistema te guia nota por nota para estudiar limpio.' };
      case 'maestro_solo': return { label: 'Maestro solo', accent: 'maestro', descripcion: 'Escucha y repasa la ejecucion del maestro con calma.' };
      default: return { label: 'Competencia', accent: 'competencia', descripcion: 'Puntaje, vida y racha activos en tiempo real.' };
    }
  }, [claveModo]);

  const estadoInfo = useMemo(() => {
    switch (hero.estadoJuego) {
      case 'contando': return 'Cuenta regresiva';
      case 'jugando': return 'En curso';
      case 'pausado': return 'En pausa';
      case 'pausado_synthesia': return 'Esperando nota';
      case 'resultados': return 'Resultados';
      case 'gameOver': return 'Intento terminado';
      case 'practica_libre': return 'Sesion libre';
      default: return 'Activo';
    }
  }, [hero.estadoJuego]);

  const statsCompactas = useMemo<HeroStat[]>(() => {
    if (claveModo === 'competencia') {
      return [
        { label: 'Puntos', value: hero.estadisticas.puntos.toLocaleString('es-CO'), icon: Trophy, tone: 'gold' },
        { label: 'Precision', value: totalIntentos > 0 ? `${precision}%` : '--', icon: CheckCircle2, tone: 'green' },
        { label: 'Vida', value: `${hero.estadisticas.vida}%`, icon: HeartPulse, tone: 'red' },
        { label: 'Racha', value: `${hero.estadisticas.rachaActual}`, icon: Waves, tone: 'blue' },
      ];
    }
    if (claveModo === 'libre') {
      return [
        { label: 'Estado', value: grabando ? 'Grabando' : 'Listo', icon: Radio, tone: grabando ? 'red' : 'green' as TonoStat },
        { label: 'Tiempo', value: formatearTiempo(tiempoGrabacion), icon: TimerReset, tone: 'blue' },
        { label: 'Tono', value: tonalidadActiva, icon: Music2, tone: 'gold' },
        { label: 'Vista', value: vistaActiva?.label || 'T', icon: Eye, tone: 'neutral' },
      ];
    }
    return [
      { label: 'Precision', value: totalIntentos > 0 ? `${precision}%` : '--', icon: Trophy, tone: 'gold' },
      { label: 'Aciertos', value: `${aciertos}/${Math.max(totalIntentos, aciertos)}`, icon: CheckCircle2, tone: 'green' },
      { label: 'Avance', value: `${avance}%`, icon: Activity, tone: 'blue' },
      { label: 'Maestro', value: hero.maestroSuena ? 'Activo' : 'Muteado', icon: Volume2, tone: hero.maestroSuena ? 'gold' : 'neutral' as TonoStat },
    ];
  }, [aciertos, avance, claveModo, grabando, hero.estadisticas, hero.maestroSuena, precision, tiempoGrabacion, tonalidadActiva, totalIntentos, vistaActiva?.label]);

  const consejos = useMemo(() => {
    switch (claveModo) {
      case 'libre': return [
        'Usa este modo para grabar ideas, probar tonos y practicar sin puntaje.',
        'Abre Vista para cambiar la lectura del teclado sin mover el acordeon.',
        'Si estas grabando, mantente en el BPM actual para que el replay quede mas limpio.',
      ];
      case 'synthesia': return [
        'El sistema se detiene para que toques la nota correcta antes de seguir.',
        'Mira primero el fuelle y luego confirma el boton iluminado.',
        'Baja el BPM cuando quieras estudiar el fraseo por bloques.',
      ];
      case 'maestro_solo': return [
        'Usa este modo para escuchar, rebobinar y estudiar frases del maestro.',
        'Combina Maestro activo con BPM mas lento para limpiar pasajes dificiles.',
        'Fijate en el compas y en la direccion del fuelle para entrar seguro.',
      ];
      default: return [
        'La racha se sostiene mejor cuando ajustas el BPM en pasos pequenos.',
        'Escucha el primer golpe del metronomo para entrar firme en cada compas.',
        `Compas actual ${compas}/4. Mantener el pulso vale mas que correr.`,
      ];
    }
  }, [claveModo, compas]);

  const tituloPrincipal = cancion?.titulo || 'Acordeon Pro Max';
  const detalleBpm = hero.bpm !== bpmBase ? ` / base ${bpmBase}` : '';
  const lineaEstado =
    hero.feedbackFuelle ||
    hero.mensajeMotivacional ||
    (cancion
      ? `${estadoInfo}${cancion.autor ? ` · ${cancion.autor}` : ''} · BPM ${hero.bpm}${detalleBpm} · Vista ${vistaActiva?.label || 'T'}`
      : `${estadoInfo} · ${modoInfo.descripcion}`);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (ayudaRef.current && !ayudaRef.current.contains(target)) setAyudaAbierta(false);
      if (vistaRef.current && !vistaRef.current.contains(target)) setVistaAbierta(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setAyudaAbierta(false); setVistaAbierta(false); }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!mostrarHeader) { onAlturaChange(0); return; }
    const header = headerRef.current;
    if (!header) return;
    const actualizarAltura = () => {
      const altura = Math.ceil(header.getBoundingClientRect().height + 8);
      onAlturaChange(altura);
    };
    actualizarAltura();
    const resizeObserver = new ResizeObserver(actualizarAltura);
    resizeObserver.observe(header);
    window.addEventListener('resize', actualizarAltura);
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', actualizarAltura);
    };
  }, [mostrarHeader, onAlturaChange, ayudaAbierta, vistaAbierta, lineaEstado, statsCompactas.length]);

  const manejarVolver = () => {
    if (haySesionActiva) {
      setConfirmacion({ texto: 'Vas a salir de la sesion actual. Los cambios no guardados se perderan.', onConfirmar: onVolver });
      return;
    }
    onVolver();
  };

  const manejarModoLibre = () => {
    if (!esModoLibre && haySesionActiva) {
      setConfirmacion({ texto: 'Se cerrara la sesion actual para pasar a modo libre.', onConfirmar: onIrModoLibre });
      return;
    }
    onIrModoLibre();
  };

  return {
    headerRef, ayudaRef, vistaRef,
    ayudaAbierta, setAyudaAbierta,
    vistaAbierta, setVistaAbierta,
    confirmacion, setConfirmacion,
    mostrarHeader,
    modoInfo,
    statsCompactas,
    consejos,
    tituloPrincipal,
    lineaEstado,
    vistaActiva,
    tonalidadActiva,
    grabando,
    tiempoGrabacion,
    manejarVolver,
    manejarModoLibre,
  };
}
