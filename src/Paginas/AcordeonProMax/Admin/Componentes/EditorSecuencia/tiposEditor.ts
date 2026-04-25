import type { NotaHero } from '../../../TiposProMax';

export const PALETA_SECCIONES = [
  { bg: 'rgba(59,130,246,0.45)', borde: '#3b82f6', texto: '#93c5fd' },
  { bg: 'rgba(16,185,129,0.45)', borde: '#10b981', texto: '#6ee7b7' },
  { bg: 'rgba(245,158,11,0.45)', borde: '#f59e0b', texto: '#fcd34d' },
  { bg: 'rgba(239,68,68,0.45)', borde: '#ef4444', texto: '#fca5a5' },
  { bg: 'rgba(139,92,246,0.45)', borde: '#8b5cf6', texto: '#c4b5fd' },
  { bg: 'rgba(236,72,153,0.45)', borde: '#ec4899', texto: '#f9a8d4' },
  { bg: 'rgba(20,184,166,0.45)', borde: '#14b8a6', texto: '#99f6e4' },
  { bg: 'rgba(251,146,60,0.45)', borde: '#fb923c', texto: '#fed7aa' },
];

export interface Seccion {
  nombre: string;
  tickInicio: number;
  tickFin: number;
  tipo: 'melodia' | 'acompanamiento';
}

export interface ModalEditorSecuenciaProps {
  cancion: any;
  onCerrar: () => void;
  tickActual: number;
  totalTicks: number;
  reproduciendoHero: boolean;
  onAlternarPausa: () => void;
  onDetener: () => void;
  onBuscarTick: (tick: number) => void;
  bpm: number;
  onCambiarBpm: (bpm: number) => void;
  grabando: boolean;
  tiempoGrabacionMs: number;
  cuentaAtrasPreRoll: number | null;
  onIniciarGrabacion: () => void;
  onDetenerGrabacion: () => void;
  punchInTick: number | null;
  setPunchInTick: (tick: number | null) => void;
  punchOutTick: number | null;
  setPunchOutTick: (tick: number | null) => void;
  notasGrabadas: NotaHero[];
  onNotasActuales?: (notas: NotaHero[]) => void;
  onSecuenciaChange: (secuencia: NotaHero[]) => void;
  duracionAudioProp: number;
  preRollSegundos: number;
  setPreRollSegundos: (s: number) => void;
  metronomoActivo: boolean;
  setMetronomoActivo: (v: boolean) => void;
  mensajeEdicionProp: string | null;
}

export function formatearTiempoDesdeTicks(ticks: number, bpm: number) {
  const seg = (ticks / 192) * (60 / Math.max(1, bpm));
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  const d = Math.floor((seg % 1) * 10);
  return `${m}:${s.toString().padStart(2, '0')}.${d}`;
}

export function fmtSeg(s: number, conDecimas = false) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const dec = Math.floor((s % 1) * 10);
  return conDecimas
    ? `${m}:${sec.toString().padStart(2, '0')}.${dec}`
    : `${m}:${sec.toString().padStart(2, '0')}`;
}
