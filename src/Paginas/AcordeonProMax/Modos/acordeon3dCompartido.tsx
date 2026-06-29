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
// Rotación de ENCUADRE como la imagen 2D: picado fuerte en X (-79°) que mira la CARA del teclado de
// frente → melodía a la izquierda, fuelle al centro (pliegues verticales), bajos a la derecha, nivelado.
// (-1.3788 = -79°, -0.0698 = -4° de ajuste fino en Y, sin ladeo en Z). Afinado en /modo-competitivo-muestra.
export const ENC_ROTACION: [number, number, number] = [-1.3788, -0.0698, 0];
// Encuadre CENTRADO: el cuerpo del acordeón (melodía + fuelle + bajos) queda centrado en cada recuadro
// Maestro/Alumno. El centrado no desalinea las notas: las posiciones se reproyectan cada frame.
export const ENC_FILL = 1.15;          // fracción del ancho del recuadro que ocupa el acordeón
export const ENC_OFFSET_REL_X = 0.06;  // nudge horizontal (centra el cuerpo)
export const ENC_OFFSET_REL_Y = 0;     // nudge vertical (ya centrado con la vista picada)
export const ENC_ANCHO_WRAP = '48%';
export const ENC_GAP = '0vw';
export const ENC_INV_FILAS = false;
export const ENC_INV_COLS = false;

// ── Encuadre GLOBAL editable por admin (store externo) ────────────────────────────────
// El admin "cuadra" el acordeón desde la página de la canción (botón Posición) y se guarda en
// Supabase (acordeon_encuadre). Para que TODOS los modos (Maestro/Synthesia/Competitivo) reaccionen
// en vivo sin pasar props por todos lados, los valores viven en un store externo: el editor lo
// actualiza, los visores lo leen con useEncuadreAcordeon(). Arranca con los defaults afinados (ENC_*).
export interface EncuadreAcordeonValores {
  rotacion: [number, number, number];
  fill: number;
  offX: number;
  offY: number;
}
// Hay DOS encuadres independientes: 'global' (modos de juego, acordeones lado a lado) y 'estudio'
// (pestaña Acordeón de Práctica Libre, un solo acordeón en un lienzo más ancho → fill propio).
export type EncuadreId = 'global' | 'estudio';
const _encuadres: Record<EncuadreId, EncuadreAcordeonValores> = {
  global: { rotacion: ENC_ROTACION, fill: ENC_FILL, offX: ENC_OFFSET_REL_X, offY: ENC_OFFSET_REL_Y },
  estudio: { rotacion: ENC_ROTACION, fill: 0.55, offX: 0, offY: 0 },
};
const _encuadreSubs = new Set<() => void>();
export function getEncuadreAcordeon(id: EncuadreId = 'global'): EncuadreAcordeonValores { return _encuadres[id]; }
export function setEncuadreAcordeon(id: EncuadreId, e: EncuadreAcordeonValores): void {
  _encuadres[id] = e;
  _encuadreSubs.forEach((f) => f());
}
export function useEncuadreAcordeon(id: EncuadreId = 'global'): EncuadreAcordeonValores {
  return React.useSyncExternalStore(
    (cb) => { _encuadreSubs.add(cb); return () => { _encuadreSubs.delete(cb); }; },
    () => _encuadres[id],
    () => _encuadres[id],
  );
}

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
  fill, offsetRelX, offsetRelY, className,
}) => {
  // Encuadre global (lo fija el admin); si el modo pasa fill/offset propios (p.ej. tomas de cámara) ganan.
  const enc = useEncuadreAcordeon();
  return (
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
    rotacionModelo={enc.rotacion}
    fillModelo={fill ?? enc.fill}
    offsetRelXModelo={offsetRelX ?? enc.offX}
    offsetRelYModelo={offsetRelY ?? enc.offY}
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
};

export default AcordeonModo3D;
