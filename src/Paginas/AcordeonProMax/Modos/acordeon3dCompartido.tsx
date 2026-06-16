import * as React from 'react';
import dynamic from 'next/dynamic';
import type { InfoPieza } from '../PracticaLibre/Componentes/VisorAcordeon3D';

// Acordeón 3D (three.js ~500KB) — sólo se carga si el usuario activa la vista 3D.
const VisorAcordeon3D = dynamic(
  () => import('../PracticaLibre/Componentes/VisorAcordeon3D'),
  { ssr: false, loading: () => <div className="acordeon-3d-juego-cargando">Cargando acordeón 3D…</div> }
);

// ── Pieles fijas de los modos con maestro+alumno ──────────────────────────────────────
// El MAESTRO usa una piel fija (de "profesor") para diferenciarlo; el ALUMNO usa la del usuario.
export const SKIN_MAESTRO = '3';
export const SKIN_ALUMNO = '5';

// ── Encuadre 3D (afinado en /modo-competitivo-muestra) ────────────────────────────────
// Orientación fija; tamaño/centrado AUTO (responsive) para verse igual en cualquier pantalla.
export const ENC_ROTACION: [number, number, number] = [-0.0775, 0.1260, 0.1638];
export const ENC_FILL = 1.23;          // fracción del ancho del recuadro que ocupa el acordeón
export const ENC_OFFSET_REL_X = 0.13;  // nudge horizontal (fracción del ancho del modelo)
export const ENC_OFFSET_REL_Y = 0.17;  // nudge vertical (fracción de la altura del modelo)
export const ENC_ANCHO_WRAP = '48%';
export const ENC_GAP = '0vw';
export const ENC_INV_FILAS = false;
export const ENC_INV_COLS = false;

// strip dirección → clave espacial del botón (idéntico a keyDeId del visor 3D): el PuenteNotas
// pregunta por "1-5-halar" y el visor reporta posiciones por "1-5" / "bajo-1-3".
export function claveBoton(idBoton: string): string {
  let s = idBoton;
  let bajo = false;
  if (s.endsWith('-bajo')) { bajo = true; s = s.slice(0, -5); }
  s = s.replace(/-halar$/, '').replace(/-empujar$/, '');
  return bajo ? `bajo-${s}` : s;
}

// Props "muertas" que el visor exige pero que en los modos de juego no usamos (selección/pintado).
const NOOP_CLICK_PIEZA: (n: string) => void = () => {};
const NOOP_MALLAS: (p: InfoPieza[]) => void = () => {};

interface AcordeonModo3DProps {
  skin: string;
  botonesActivos: Record<string, any>;
  direccion: 'halar' | 'empujar';
  fuelleCerrandoRef: React.MutableRefObject<boolean>;
  fuelleActividadRef: React.MutableRefObject<number>;
  // Sólo el alumno tocable: al pisar un botón 3D suena la nota real.
  onTocarBoton?: (idLogico: string, accion: 'down' | 'up') => void;
  // Alumno: botones objetivo (próximos a pisar) para iluminarlos con anticipación.
  objetivosRef?: React.MutableRefObject<Record<string, number>>;
  // Proyección de los botones a px (para que el PuenteNotas apunte exacto).
  onPosicionesBotones?: (mapa: Record<string, { x: number; y: number }>) => void;
  navegable?: boolean;
  escenarioId?: string;
  fill?: number;
  offsetRelX?: number;
  offsetRelY?: number;
  className?: string;
}

// Wrapper del acordeón 3D "estilo juego" con los defaults de encuadre ya afinados. Lo usan los modos
// Maestro y Synthesia (el Competitivo/Libre lo cablea directo en ModoJuego con sus sliders/cámaras).
const AcordeonModo3D: React.FC<AcordeonModo3DProps> = ({
  skin, botonesActivos, direccion, fuelleCerrandoRef, fuelleActividadRef,
  onTocarBoton, objetivosRef, onPosicionesBotones, navegable, escenarioId,
  fill = ENC_FILL, offsetRelX = ENC_OFFSET_REL_X, offsetRelY = ENC_OFFSET_REL_Y, className,
}) => (
  <VisorAcordeon3D
    materialPorMesh={{}}
    piezaSeleccionada={null}
    onClickPieza={NOOP_CLICK_PIEZA}
    onMallasDetectadas={NOOP_MALLAS}
    fuelleCerrandoRef={fuelleCerrandoRef}
    fuelleActividadRef={fuelleActividadRef}
    animShapeKey={null}
    animProgramatica={null}
    pulseEpoch={null}
    skin={skin}
    camaraFija
    botonesActivosExternos={botonesActivos}
    direccion={direccion}
    rotacionModelo={ENC_ROTACION}
    fillModelo={fill}
    offsetRelXModelo={offsetRelX}
    offsetRelYModelo={offsetRelY}
    invFilasModelo={ENC_INV_FILAS}
    invColsModelo={ENC_INV_COLS}
    navegable={navegable}
    escenarioId={escenarioId}
    objetivosRef={objetivosRef}
    onTocarBoton={onTocarBoton}
    onPosicionesBotones={onPosicionesBotones}
    className={className ?? 'acordeon-3d-juego'}
  />
);

export default AcordeonModo3D;
