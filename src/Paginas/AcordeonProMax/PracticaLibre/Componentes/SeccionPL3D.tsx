import * as React from 'react'
import {
  Box, ArrowDownToLine, ArrowUpToLine, Combine,
  MousePointerClick, Keyboard, Wind, Activity, Square, Music2, Palette, Copy, ClipboardPaste, Type,
  Pipette, Save, Trash2, Bookmark, Mic,
} from 'lucide-react'
import type { AnimShapeKeyId, AnimProgramaticaId, InfoPieza, NombresCajasConfig, NombreCajaConfig } from './VisorAcordeon3D'
import type { PresetAcordeon } from '../Servicios/servicioPresetsAcordeon'
import ReplayGrabacionEn3D from './ReplayGrabacionEn3D'

// Colores REALES de acordeón (los acabados clásicos del acordeón vallenato/diatónico, no colores
// ficticios). Se aplican CONSERVANDO el relieve y el micro-acabado horneados del GLB (normalMap +
// roughness/metalness map) → se ven como cuero/celuloide/metal de verdad, no como plástico plano.
// 'original' (#ffffff) restaura las texturas baked de Blender tal cual.
export const COLORES_3D = [
  { id: 'original',  label: 'Original',   hex: '#ffffff' },
  { id: 'perla',     label: 'Perla',      hex: '#efe4cf' },
  { id: 'hueso',     label: 'Hueso',      hex: '#e8dcc0' },
  { id: 'negro',     label: 'Negro',      hex: '#15120f' },
  { id: 'grafito',   label: 'Grafito',    hex: '#3a3d42' },
  { id: 'rojo',      label: 'Rojo',       hex: '#b01818' },
  { id: 'vino',      label: 'Vino',       hex: '#5a1626' },
  { id: 'naranja',   label: 'Naranja',    hex: '#c2611c' },
  { id: 'dorado',    label: 'Dorado',     hex: '#b8860b' },
  { id: 'mostaza',   label: 'Mostaza',    hex: '#9c7a1a' },
  { id: 'verde',     label: 'Verde',      hex: '#1f5135' },
  { id: 'esmeralda', label: 'Esmeralda',  hex: '#0f6b54' },
  { id: 'turquesa',  label: 'Turquesa',   hex: '#1f7a85' },
  { id: 'celeste',   label: 'Celeste',    hex: '#2f6db5' },
  { id: 'azulrey',   label: 'Azul rey',   hex: '#1b2f6b' },
  { id: 'morado',    label: 'Morado',     hex: '#4a2a6b' },
  { id: 'vinotinto', label: 'Vino tinto', hex: '#3f1020' },
  { id: 'plata',     label: 'Plata',      hex: '#b8bcc2' },
  { id: 'cobre',     label: 'Cobre',      hex: '#9a5a33' },
  { id: 'tabaco',    label: 'Tabaco',     hex: '#6b4423' },
] as const

export const VARIANTES_3D = [
  { id: 'mate',     label: 'Mate',     roughness: 0.85, metalness: 0.00 },
  { id: 'estandar', label: 'Estándar', roughness: 0.50, metalness: 0.10 },
  { id: 'perlado',  label: 'Perlado',  roughness: 0.25, metalness: 0.30 },
  { id: 'cromo',    label: 'Cromo',    roughness: 0.10, metalness: 0.90 },
] as const

export type VarianteId = typeof VARIANTES_3D[number]['id']

// Partes pintables. Se quitó "Todo el acordeón" (global) a propósito: hacía cambios masivos que
// borraban los detalles del diseño. El acordeón se pinta PARTE POR PARTE. ('todos' sigue existiendo
// SOLO como color de relleno por defecto de las partes que no pintes, no como botón.)
export const GRUPOS_3D: Array<{ id: string; label: string }> = [
  { id: 'caja-melodia',    label: 'Caja melodía' },
  { id: 'caja-bajos',      label: 'Caja bajos' },
  { id: 'fuelle-cintas',   label: 'Fondo del fuelle' },   // la malla 'fuelle' (cloth de fondo)
  { id: 'fuelle-aros',     label: 'Cintas del fuelle' },  // TODOS los aros (la cinta visible) de una
  { id: 'fuelle-cueros',   label: 'Cintas (solo cuero)' },// aros de cuero
  { id: 'fuelle-codos',    label: 'Cintas (solo metal)' },// aros de metal
  { id: 'botones-melodia', label: 'Botones melodía' },
  { id: 'botones-bajos',   label: 'Botones bajos' },
  { id: 'parrilla',        label: 'Parrilla' },
  { id: 'diapason',        label: 'Diapasón' },
  { id: 'puntas',          label: 'Broches / puntas' },
  { id: 'correas',         label: 'Correas' },
  { id: 'tornillos',       label: 'Tornillos' },
  // 'marcos' eliminado: el modelo no tiene mallas "marco" → no había nada que pintar.
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
  // Copiar el color/acabado de la parte actual y pegarlo en otra.
  onCopiarColor: () => void
  onPegarColor: () => void
  hayColorCopiado: boolean
  // Nombres sobre las cajas (melodía/bajos).
  nombresCajas: NombresCajasConfig
  onCambiarNombreCaja: (caja: 'melodia' | 'bajos', patch: Partial<NombreCajaConfig>) => void
  // Colores reales muestreados de la textura de cada grupo (semilla para editar desde el color real).
  coloresBase: Record<string, string>
  // Presets (diseños guardados con nombre).
  presets: PresetAcordeon[]
  onGuardarPreset: (nombre: string) => Promise<{ ok: boolean; error?: string }>
  onAplicarPreset: (preset: PresetAcordeon) => void
  onEliminarPreset: (id: string) => Promise<{ ok: boolean; error?: string }>
  // Galería de modelos: '' = "Mi diseño" (pintado, editable); 'original'/'1'..'7' = piel de fábrica.
  skinSeleccionado: string
  presetAplicadoId: string | null
  onSeleccionarModelo: (skin: string) => void
}

// Pieles de fábrica del acordeón (mismas que la pestaña Personaje): texturas predeterminadas.
const PIELES_FABRICA = ['original', '1', '2', '3', '4', '5', '6', '7'] as const

const SeccionPL3D: React.FC<SeccionPL3DProps> = ({
  piezaSeleccionada, piezasDisponibles, grupoActivo, onCambiarGrupoActivo,
  onAplicarTinta, onAplicarVariante, onDispararShapeKey, onDispararProgramatica,
  onDetenerProgramatica, programaticaActiva,
  onCopiarColor, onPegarColor, hayColorCopiado,
  nombresCajas, onCambiarNombreCaja,
  coloresBase, presets, onGuardarPreset, onAplicarPreset, onEliminarPreset,
  skinSeleccionado, presetAplicadoId, onSeleccionarModelo,
}) => {
  // Nombre legible de lo que se está pintando: la pieza clicada en el 3D gana; si no, el grupo activo.
  const nombreTarget = piezaSeleccionada
    ? (piezasDisponibles.find((p) => p.nombre === piezaSeleccionada)?.nombre ?? piezaSeleccionada)
    : (GRUPOS_3D.find((g) => g.id === grupoActivo)?.label ?? 'Caja melodía')

  // Grupo del objetivo (para buscar su color real muestreado) + color base de la textura de esa parte.
  const grupoTarget = piezaSeleccionada
    ? (piezasDisponibles.find((p) => p.nombre === piezaSeleccionada)?.grupo ?? grupoActivo)
    : grupoActivo
  const colorBaseTarget = coloresBase[grupoTarget]

  // Pestañas internas del panel (más fácil de navegar/editar que un scroll largo).
  const [tab, setTab] = React.useState<'color' | 'nombres' | 'disenos' | 'fuelle' | 'grabaciones'>('color')

  // Estado de la galería de diseños: qué modelo está puesto + si se puede editar el color.
  const esPiel = skinSeleccionado !== ''
  const esMiDiseno = !esPiel && !presetAplicadoId
  const esEditable = !esPiel // 'Mi diseño' y los presets (pintados) sí; las pieles de fábrica no.
  const nombreSeleccionado = esPiel
    ? (skinSeleccionado === 'original' ? 'Original (de fábrica)' : `Piel ${skinSeleccionado}`)
    : (presetAplicadoId ? (presets.find((p) => p.id === presetAplicadoId)?.nombre ?? 'Mi diseño') : 'Mi diseño')

  // Guardar diseño (preset). Pre-llenamos el nombre con el del diseño SELECCIONADO → "Guardar" actualiza
  // ESE diseño (mismo nombre = update, no duplica) y el personaje que lo tiene puesto refleja el cambio.
  const [nombrePreset, setNombrePreset] = React.useState('')
  React.useEffect(() => {
    const n = presets.find((p) => p.id === presetAplicadoId)?.nombre
    setNombrePreset(n ?? '')
  }, [presetAplicadoId])
  const [guardando, setGuardando] = React.useState(false)
  // ¿El nombre actual ya existe? → "Guardar" actualiza ese diseño (no crea otro).
  const esActualizacion = nombrePreset.trim().length > 0 &&
    presets.some((p) => p.nombre.trim().toLowerCase() === nombrePreset.trim().toLowerCase())
  const guardar = async () => {
    const n = nombrePreset.trim()
    if (!n) return
    setGuardando(true)
    const r = await onGuardarPreset(n)
    setGuardando(false)
    // Tras guardar un diseño NUEVO (no actualización) limpiamos solo si no quedó como aplicado.
    if (r.ok && !presetAplicadoId) setNombrePreset('')
  }

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

      {/* Pestañas: Color · Nombres · Diseños · Fuelle */}
      <div style={{ display: 'flex', gap: 6, margin: '4px 0 12px', flexWrap: 'wrap' }}>
        {(['color', 'nombres', 'disenos', 'fuelle', 'grabaciones'] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="visor3d-anim-btn"
            style={tab === id
              ? { background: 'linear-gradient(135deg,#2563eb,#3b82f6)', color: '#fff', borderColor: '#3b82f6' }
              : undefined}
          >
            {id === 'color' && <><Palette size={14} /> Color</>}
            {id === 'nombres' && <><Type size={14} /> Nombres</>}
            {id === 'disenos' && <><Bookmark size={14} /> Diseños</>}
            {id === 'fuelle' && <><Wind size={14} /> Fuelle</>}
            {id === 'grabaciones' && <><Mic size={14} /> Grabaciones</>}
          </button>
        ))}
      </div>

      {/* ── Pintar el acordeón por partes (color REAL + acabado), se guarda por usuario ── */}
      {tab === 'color' && (
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Palette size={14} /> Color por parte
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
          Editando: <strong style={{ color: '#fff' }}>{nombreTarget}</strong>
          {piezaSeleccionada && (
            <button
              type="button"
              onClick={() => onCambiarGrupoActivo(grupoActivo)}
              style={{ marginLeft: 8, padding: '2px 8px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
            >
              usar grupo
            </button>
          )}
        </div>

        {/* Partes del acordeón (también podés hacer click directo sobre una pieza en el 3D). */}
        <div className="visor3d-anims" style={{ marginBottom: 12 }}>
          {GRUPOS_3D.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`visor3d-anim-btn ${!piezaSeleccionada && grupoActivo === g.id ? 'activo' : ''}`}
              onClick={() => onCambiarGrupoActivo(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Colores reales del acordeón. */}
        <div className="visor3d-colores">
          {COLORES_3D.map((c) => (
            <button
              key={c.id}
              type="button"
              className="visor3d-color-chip"
              title={c.label}
              onClick={() => onAplicarTinta(c.hex)}
              style={c.id === 'original'
                ? { background: 'conic-gradient(from 0deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.6)' }
                : { background: c.hex }}
            >
              {c.id === 'original' ? '↺' : ''}
            </button>
          ))}
        </div>

        {/* Color a medida + tomar el color REAL de la textura de esta parte (para guiarse). */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'rgba(255,255,255,0.8)' }}>
            <Palette size={14} /> A medida
            <input
              type="color"
              defaultValue={colorBaseTarget ?? '#cccccc'}
              key={grupoTarget + (colorBaseTarget ?? '')}
              onChange={(e) => onAplicarTinta(e.target.value)}
              style={{ width: 34, height: 28, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
            />
          </label>
          {colorBaseTarget && (
            <button
              type="button"
              className="visor3d-anim-btn"
              title="Empezar desde el color real de la textura de esta parte"
              onClick={() => onAplicarTinta(colorBaseTarget)}
            >
              <Pipette size={14} /> Color real
              <span style={{ width: 14, height: 14, borderRadius: '50%', background: colorBaseTarget, marginLeft: 4, border: '1px solid rgba(255,255,255,0.4)' }} />
            </button>
          )}
        </div>

        {/* Acabado del material (conserva el relieve/textura real de Blender). */}
        <div className="visor3d-variantes" style={{ marginTop: 12 }}>
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

        {/* Copiar el color/acabado de esta parte y pegarlo en otra (elegí otra parte y pegá). */}
        <div className="visor3d-anims" style={{ marginTop: 12 }}>
          <button type="button" className="visor3d-anim-btn" onClick={onCopiarColor}>
            <Copy size={14} /> Copiar color
          </button>
          <button
            type="button"
            className="visor3d-anim-btn"
            onClick={onPegarColor}
            disabled={!hayColorCopiado}
            style={!hayColorCopiado ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
          >
            <ClipboardPaste size={14} /> Pegar en esta parte
          </button>
        </div>

        {/* Guardar/actualizar el diseño SIN salir de Color → los cambios quedan y se ven en el personaje/mundo. */}
        <div style={{ marginTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
          {nombrePreset.trim() ? (
            <button
              type="button"
              onClick={guardar}
              disabled={guardando}
              className="visor3d-anim-btn"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '10px',
                background: 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', borderColor: '#22c55e',
                opacity: guardando ? 0.6 : 1 }}
            >
              <Save size={15} /> {esActualizacion ? `Actualizar «${nombrePreset.trim()}»` : `Guardar «${nombrePreset.trim()}»`}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setTab('disenos')}
              className="visor3d-anim-btn"
              style={{ width: '100%', justifyContent: 'center', fontWeight: 700, padding: '10px' }}
            >
              <Save size={15} /> Guardar como diseño…
            </button>
          )}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 6, textAlign: 'center' }}>
            {esActualizacion
              ? 'Actualiza el diseño seleccionado → se ve igual en el personaje y el mundo.'
              : 'Guarda tus cambios para usarlos en todos lados.'}
          </div>
        </div>
      </div>
      )}

      {/* ── Nombre personalizado sobre las cajas (queda adherido y se puede mover) ── */}
      {tab === 'nombres' && (
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Type size={14} /> Nombre en las cajas
        </div>
        {(['melodia', 'bajos'] as const).map((caja) => {
          const cfg = nombresCajas[caja]
          return (
            <div key={caja} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>
                Caja de {caja === 'melodia' ? 'melodía' : 'bajos'}
              </div>
              <input
                type="text"
                value={cfg.texto}
                placeholder="Escribe un nombre…"
                onChange={(e) => onCambiarNombreCaja(caja, { texto: e.target.value })}
                maxLength={24}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14, marginBottom: 8 }}
              />
              {([
                ['Izq/Der', 'offX', -6, 6, 0.05] as const,
                ['Arriba/Abajo', 'offY', -6, 6, 0.05] as const,
                ['Adelante/Atrás', 'offZ', -6, 6, 0.05] as const,
                ['Tamaño', 'tam', 0.1, 2.5, 0.02] as const,
                ['Giro', 'giro', -3.15, 3.15, 0.02] as const,
              ]).map(([label, key, min, max, step]) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>
                  <span style={{ width: 96 }}>{label}</span>
                  <input
                    type="range" min={min} max={max} step={step}
                    value={(cfg as any)[key]}
                    onChange={(e) => onCambiarNombreCaja(caja, { [key]: +e.target.value } as Partial<NombreCajaConfig>)}
                    style={{ flex: 1 }}
                  />
                </label>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
                <span style={{ width: 96 }}>Color letra</span>
                <input type="color" value={cfg.color} onChange={(e) => onCambiarNombreCaja(caja, { color: e.target.value })} />
              </label>
            </div>
          )
        })}
      </div>
      )}

      {/* ── Diseños: galería de modelos (Mi diseño + pieles de fábrica + mis presets) ── */}
      {tab === 'disenos' && (
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Bookmark size={14} /> Diseños del acordeón
        </div>

        {/* Qué modelo está seleccionado ahora mismo. */}
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 10 }}>
          Seleccionado: <strong style={{ color: '#fff' }}>{nombreSeleccionado}</strong>
          {esEditable && <span style={{ color: 'rgba(255,255,255,0.5)' }}> · editá los colores en la pestaña Color</span>}
        </div>

        {/* Galería: tu diseño editable + las texturas de fábrica + tus diseños guardados. */}
        <div className="visor-personaje-pieles-dock en-panel" style={{ marginBottom: 14 }}>
          {/* Mi diseño (el pintado por partes, editable). */}
          <button
            type="button"
            className={`visor-piel-card ${esMiDiseno ? 'activo' : ''}`}
            onClick={() => onSeleccionarModelo('')}
            title="Tu diseño pintado (editable)"
          >
            <span style={{ display: 'block', width: '100%', aspectRatio: '3 / 2', borderRadius: 6, background: 'conic-gradient(from 0deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7,#ef4444)' }} />
            <span>Mi diseño</span>
          </button>

          {/* Pieles de fábrica (texturas predeterminadas). */}
          {PIELES_FABRICA.map((p) => (
            <button
              key={p}
              type="button"
              className={`visor-piel-card ${skinSeleccionado === p ? 'activo' : ''}`}
              onClick={() => onSeleccionarModelo(p)}
              title={p === 'original' ? 'Original (de fábrica)' : `Piel ${p}`}
            >
              <img src={`/pieles-acordeon/${p}.webp`} alt={p === 'original' ? 'Original' : `Piel ${p}`} loading="lazy" />
              <span>{p === 'original' ? 'Original' : p}</span>
            </button>
          ))}

          {/* Mis diseños guardados (presets). */}
          {presets.map((preset) => {
            const activo = skinSeleccionado === '' && presetAplicadoId === preset.id
            return (
              <button
                key={preset.id}
                type="button"
                className={`visor-piel-card ${activo ? 'activo' : ''}`}
                onClick={() => onAplicarPreset(preset)}
                title={preset.nombre}
                style={{ position: 'relative' }}
              >
                {preset.thumbnail
                  ? <img src={preset.thumbnail} alt={preset.nombre} loading="lazy" />
                  : <span style={{ display: 'block', width: '100%', aspectRatio: '3 / 2', background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />}
                <span>{preset.nombre}</span>
                {/* Borrar (span con rol botón: un <button> dentro de otro <button> es HTML inválido). */}
                <span
                  role="button"
                  tabIndex={0}
                  title="Eliminar diseño"
                  onClick={(e) => { e.stopPropagation(); void onEliminarPreset(preset.id) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); void onEliminarPreset(preset.id) } }}
                  style={{ position: 'absolute', top: 4, right: 4, display: 'flex', padding: 3, borderRadius: 6, background: 'rgba(0,0,0,0.55)', color: 'rgba(255,140,140,0.95)', cursor: 'pointer' }}
                >
                  <Trash2 size={13} />
                </span>
              </button>
            )
          })}
        </div>

        {/* Guardar el diseño actual con un nombre. */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={nombrePreset}
            placeholder="Nombre del diseño…"
            onChange={(e) => setNombrePreset(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') void guardar() }}
            maxLength={40}
            style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14 }}
          />
          <button
            type="button"
            className="visor3d-anim-btn"
            onClick={guardar}
            disabled={guardando || !nombrePreset.trim()}
            style={(guardando || !nombrePreset.trim()) ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
          >
            <Save size={14} /> {esActualizacion ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
        {presets.length === 0 && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 8 }}>
            Pintá el acordeón en la pestaña Color y guardalo acá con un nombre.
          </div>
        )}
      </div>
      )}

      {tab === 'fuelle' && (
      <>
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
      </>
      )}

      {/* ── Mis grabaciones: reproduce una grabación sobre el acordeón (su propia pestaña, no mezclada con los diseños) ── */}
      {tab === 'grabaciones' && (
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">
          <Mic size={14} /> Mis grabaciones
        </div>
        <ReplayGrabacionEn3D />
      </div>
      )}
    </div>
  )
}

export default SeccionPL3D
