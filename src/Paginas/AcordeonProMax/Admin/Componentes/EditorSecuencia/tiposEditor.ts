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

export type ModoEdicion = 'idle' | 'preroll' | 'grabando' | 'revisando';

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

export interface LibreriaAPI {
  bpmHero: number;
  setBpmHero: (v: number) => void;
  pistaFile: File | null;
  setPistaUrl: (url: string | null) => void;
  bpmGrabacion: number;
  bpmOriginalGrabacion: number;
  setBpmOriginalGrabacion: (v: number) => void;
  cancionActivaLibreria: any;
  setCancionActivaLibreria: (c: any) => void;
  setUltimaCancionLibreriaActualizada: (c: any) => void;
  construirCancionHero: (c: any, s?: NotaHero[]) => any;
  prepararCancionEnEscenario: (c: any) => void;
  detenerReproduccionLocal: (tick?: number) => void;
}

export interface UseEditorSecuenciaAdminParams {
  bpm: number;
  grabandoSesion: boolean;
  logica: any;
  metronomoActivo: boolean;
  reproduciendo: boolean;
  pausado: boolean;
  tickActual: number;
  loopAB: any;
  secuencia: any[];
  totalTicks: number;
  onAlternarPausa: () => void;
  onAlternarLoop: () => void;
  onBuscarTick: (tick: number) => void;
  onReproducirSecuencia: (cancion: any) => void;
  onLimpiarLoop: () => void;
  onCambiarBpm: (v: number | ((prev: number) => number)) => void;
  libreria: LibreriaAPI;
}

export function sincronizarNotasModalConLogica(
  notas: NotaHero[],
  logica: any,
  notasCheadasRef: { current: Set<string> }
) {
  if (!logica) return;
  if (notas.length > 0) {
    const dirRequerida = (notas[0].fuelle === 'abriendo' || notas[0].fuelle === 'halar') ? 'halar' : 'empujar';
    if (logica.direccion !== dirRequerida) logica.setDireccion(dirRequerida);
  }
  const idsNuevos = new Set(notas.map(n => {
    const fuelle = n.fuelle === 'abriendo' ? 'halar' : 'empujar';
    let baseId = n.botonId.replace('-halar', '').replace('-empujar', '');
    if (baseId.includes('-bajo')) { baseId = baseId.replace('-bajo', ''); return `${baseId}-${fuelle}-bajo`; }
    return `${baseId}-${fuelle}`;
  }));
  const notasAnteriores = notasCheadasRef.current;
  notasAnteriores.forEach(id => { if (!idsNuevos.has(id)) logica.actualizarBotonActivo(id, 'remove', null, false, undefined); });
  idsNuevos.forEach(id => { if (!notasAnteriores.has(id)) logica.actualizarBotonActivo(id, 'add', null, false, undefined, true); });
  notasCheadasRef.current = idsNuevos;
}
