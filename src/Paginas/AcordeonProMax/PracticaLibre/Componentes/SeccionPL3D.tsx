import * as React from 'react'
import {
  Box, Palette, Sparkles, ArrowDownToLine, ArrowUpToLine, Combine,
  MousePointerClick, Keyboard, Wind, Activity, Square, Music2,
} from 'lucide-react'
import type { AnimShapeKeyId, AnimProgramaticaId, InfoPieza } from './VisorAcordeon3D'

export const COLORES_3D = [
  { id: 'original', label: 'Original', hex: '#ffffff' },
  { id: 'rojo',     label: 'Rojo',     hex: '#dc2626' },
  { id: 'azul',     label: 'Azul',     hex: '#1d4ed8' },
  { id: 'negro',    label: 'Negro',    hex: '#1f2937' },
  { id: 'dorado',   label: 'Dorado',   hex: '#d97706' },
  { id: 'verde',    label: 'Verde',    hex: '#15803d' },
] as const

export const VARIANTES_3D = [
  { id: 'mate',     label: 'Mate',     roughness: 0.85, metalness: 0.00 },
  { id: 'estandar', label: 'Estándar', roughness: 0.50, metalness: 0.10 },
  { id: 'perlado',  label: 'Perlado',  roughness: 0.25, metalness: 0.30 },
  { id: 'cromo',    label: 'Cromo',    roughness: 0.10, metalness: 0.90 },
] as const

export type VarianteId = typeof VARIANTES_3D[number]['id']

export const GRUPOS_3D: Array<{ id: string; label: string }> = [
  { id: 'todos',           label: 'Todo el acordeón' },
  { id: 'fuelle',          label: 'Fuelle' },
  { id: 'marcos',          label: 'Marcos' },
  { id: 'caja-melodia',    label: 'Caja melodía' },
  { id: 'caja-bajos',      label: 'Caja bajos' },
  { id: 'botones-melodia', label: 'Botones melodía' },
  { id: 'botones-bajos',   label: 'Botones bajos' },
  { id: 'parrilla',        label: 'Parrilla' },
  { id: 'diapason',        label: 'Diapasón' },
  { id: 'tornillos',       label: 'Tornillos' },
]

// Animaciones del GLB: usan shape keys, el fuelle se DEFORMA visualmente.
const ANIM_SHAPEKEY: Array<{ id: AnimShapeKeyId; label: string; icono: React.ReactNode }> = [
  { id: 'Fuelle_Uniforme', label: 'Cerrar uniforme', icono: <Combine size={14} /> },
  { id: 'Fuelle_Abajo',    label: 'Cerrar abajo',    icono: <ArrowDownToLine size={14} /> },
  { id: 'Fuelle_Arriba',   label: 'Cerrar arriba',   icono: <ArrowUpToLine size={14} /> },
]

// Animaciones programáticas: escalan el fuelle como BLOQUE rígido + mueven las cajas, sin deformar.
const ANIM_PROGRAMATICA: Array<{ id: AnimProgramaticaId; label: string; icono: React.ReactNode }> = [
  { id: 'Tocar_Suave',  label: 'Tocar suave',  icono: <Music2 size={14} /> },
  { id: 'Tocar_Fuerte', label: 'Tocar fuerte', icono: <Activity size={14} /> },
  { id: 'Respira',      label: 'Respira (loop)', icono: <Wind size={14} /> },
]

interface SeccionPL3DProps {
  piezaSeleccionada: string | null
  piezasDisponibles: InfoPieza[]
  grupoActivo: string
  onCambiarGrupoActivo: (grupo: string) => void
  onAplicarTinta: (hex: string) => void
  onAplicarVariante: (id: VarianteId) => void
  onDispararShapeKey: (id: AnimShapeKeyId) => void
  onDispararProgramatica: (id: AnimProgramaticaId) => void
  onDetenerProgramatica: () => void
  programaticaActiva: AnimProgramaticaId | null
}

const SeccionPL3D: React.FC<SeccionPL3DProps> = ({
  piezaSeleccionada, piezasDisponibles, grupoActivo, onCambiarGrupoActivo,
  onAplicarTinta, onAplicarVariante, onDispararShapeKey, onDispararProgramatica,
  onDetenerProgramatica, programaticaActiva,
}) => {
  const targetLabel = piezaSeleccionada
    ? `pieza: ${piezaSeleccionada}`
    : `grupo: ${GRUPOS_3D.find((g) => g.id === grupoActivo)?.label ?? grupoActivo}`

  return (
    <div className="estudio-practica-libre-seccion">
      <div className="visor3d-ayuda">
        <div className="visor3d-ayuda-item">
          <MousePointerClick size={13} /> Click en una pieza del acordeón para seleccionarla
        </div>
        <div className="visor3d-ayuda-item">
          <Keyboard size={13} /> Mantené <kbd>Q</kbd> para cerrar el fuelle (al soltar se abre)
        </div>
      </div>

      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Aplicar a</div>
        <div className="visor3d-grupos">
          {GRUPOS_3D.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`visor3d-grupo-btn ${!piezaSeleccionada && grupoActivo === g.id ? 'activo' : ''}`}
              onClick={() => onCambiarGrupoActivo(g.id)}
              disabled={!!piezaSeleccionada}
              title={piezaSeleccionada ? 'Hay una pieza individual seleccionada por click' : g.label}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="visor3d-target">
          Cambios van a <strong>{targetLabel}</strong>
          {piezasDisponibles.length > 0 && !piezaSeleccionada && (
            <span className="visor3d-target-meta"> · {piezasDisponibles.length} mallas detectadas</span>
          )}
        </div>
      </div>

      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Palette size={14} /> Color
        </div>
        <div className="visor3d-colores">
          {COLORES_3D.map((c) => (
            <button
              key={c.id}
              type="button"
              className="visor3d-color-chip"
              style={{ background: c.hex }}
              title={c.label}
              onClick={() => onAplicarTinta(c.hex)}
            />
          ))}
        </div>
      </div>

      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Sparkles size={14} /> Acabado
        </div>
        <div className="visor3d-variantes">
          {VARIANTES_3D.map((v) => (
            <button
              key={v.id}
              type="button"
              className="visor3d-variante-btn"
              onClick={() => onAplicarVariante(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Box size={14} /> Cierre del fuelle (deforma los pliegues)
        </div>
        <div className="visor3d-anims">
          {ANIM_SHAPEKEY.map((a) => (
            <button key={a.id} type="button" className="visor3d-anim-btn"
              onClick={() => onDispararShapeKey(a.id)}>
              {a.icono} {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Wind size={14} /> Movimiento del fuelle (rígido, sin deformar)
        </div>
        <div className="visor3d-anims">
          {ANIM_PROGRAMATICA.map((a) => (
            <button key={a.id} type="button"
              className={`visor3d-anim-btn ${programaticaActiva === a.id ? 'activo' : ''}`}
              onClick={() => onDispararProgramatica(a.id)}>
              {a.icono} {a.label}
            </button>
          ))}
          {programaticaActiva && (
            <button type="button" className="visor3d-anim-btn detener"
              onClick={onDetenerProgramatica}>
              <Square size={14} /> Detener
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default SeccionPL3D
