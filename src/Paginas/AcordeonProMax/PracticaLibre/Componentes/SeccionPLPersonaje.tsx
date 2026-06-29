'use client'
import * as React from 'react'
import { PERSONAJES } from '../personajes'
import { BAILES } from '../animaciones'
import { ESCENARIOS } from './visor/escenarios'
import { TOMAS } from './visor/camaras'
import { usePersonajeEstudio } from '../contextoPersonajeEstudio'
import ReplayGrabacionEn3D from './ReplayGrabacionEn3D'
import SecuenciadorBailes from './SecuenciadorBailes'
import EditorPosEscenario from './EditorPosEscenario'
import EditorDedos from './EditorDedos'

// Panel derecho de la pestaña Personaje: selector de personaje + skins del acordeón + bailes +
// control del fuelle + reproductor de grabaciones. Vive en PanelLateralEstudiante (no tapa la vista).
const PIELES = ['original', '1', '2', '3', '4', '5', '6', '7']

const SeccionPLPersonaje: React.FC = () => {
  const { personajeId, setPersonajeId, skin, setSkin, presetsAcordeon, baile, setBaile, escenarioId, setEscenarioId, tomaCamara, setTomaCamara, directorAuto, setDirectorAuto, premium, abierto, setFuelle, fuellePos, setFuellePos } = usePersonajeEstudio()
  // `premium` se resuelve async (esUsuarioPremium) → el SSR y el primer render del cliente difieren y
  // disparan un error de hidratación en el gating de bailes. Gateamos por `montado` para que el primer
  // render coincida con el servidor (sin bloqueo) y el estado real se aplique tras montar.
  const [montado, setMontado] = React.useState(false)
  React.useEffect(() => { setMontado(true) }, [])

  // Detecta que el diseño del acordeón cambió (se editó/guardó en la pestaña Acordeón, incluso en OTRA
  // pestaña del navegador) → muestra el botón "Actualizar" resaltado. Al pulsarlo, el acordeón re-aplica
  // el diseño más reciente (evento 'acordeon-actualizar' que escucha useDisenoEnAcordeon).
  const [hayActualizacion, setHayActualizacion] = React.useState(false)
  React.useEffect(() => {
    const marcar = () => setHayActualizacion(true)
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key.includes('acordeon3d:materiales')) marcar() }
    window.addEventListener('acordeon-presets-cambio', marcar)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener('acordeon-presets-cambio', marcar); window.removeEventListener('storage', onStorage) }
  }, [])
  const actualizarDiseno = () => { window.dispatchEvent(new Event('acordeon-actualizar')); setHayActualizacion(false) }

  return (
    <div className="estudio-practica-libre-seccion seccion-pl-personaje">
      {/* Selector de personaje */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Personaje</div>
        <div className="visor-personaje-cards en-panel">
          {PERSONAJES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`visor-personaje-card ${personajeId === p.id ? 'activo' : ''} ${p.bloqueado ? 'bloqueado' : ''}`}
              onClick={() => { if (!p.bloqueado) setPersonajeId(p.id) }}
              title={p.bloqueado ? `${p.nombre} — próximamente` : p.nombre}
            >
              <img src={p.foto} alt={p.nombre} loading="lazy" />
              <span>{p.bloqueado && <span aria-hidden="true">🔒 </span>}{p.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fuelle + skins del acordeón */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span>Acordeón</span>
          <button
            type="button"
            onClick={actualizarDiseno}
            title="Trae el último diseño que editaste en la pestaña Acordeón"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700,
              padding: '4px 9px', borderRadius: 999, cursor: 'pointer',
              border: '1px solid ' + (hayActualizacion ? '#f59e0b' : 'rgba(255,255,255,0.2)'),
              background: hayActualizacion ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.06)',
              color: hayActualizacion ? '#fbbf24' : 'rgba(255,255,255,0.8)',
            }}
          >
            🔄 Actualizar{hayActualizacion ? ' •' : ''}
          </button>
        </div>
        <button
          type="button"
          className={`visor-personaje-fuelle-btn ${abierto ? 'activo' : ''}`}
          onPointerDown={() => setFuelle(true)}
          onPointerUp={() => setFuelle(false)}
          onPointerLeave={() => { if (abierto) setFuelle(false) }}
        >
          <kbd>Q</kbd> Cerrar fuelle
        </button>
        {/* Slider para mover la caja de bajos a cualquier apertura (la mano sigue pegada a los botones). */}
        <label className="visor-personaje-fuelle-slider">
          <span>Abrir</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(fuellePos * 100)}
            onChange={(e) => setFuellePos(Number(e.target.value) / 100)}
            aria-label="Mover caja de bajos (abrir/cerrar fuelle)"
          />
          <span>Cerrar</span>
        </label>
        <div className="visor-personaje-pieles-dock en-panel">
          {PIELES.map((p) => (
            <button
              key={p}
              type="button"
              className={`visor-piel-card ${skin === p ? 'activo' : ''}`}
              onClick={() => setSkin(p)}
              title={p === 'original' ? 'Original' : `Piel ${p}`}
            >
              <img src={`/pieles-acordeon/${p}.webp`} alt={p === 'original' ? 'Original' : `Piel ${p}`} loading="lazy" />
              <span>{p === 'original' ? 'Original' : p}</span>
            </button>
          ))}
          {/* Mis diseños guardados (presets) como modelos extra, seleccionables igual que las pieles. */}
          {presetsAcordeon.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className={`visor-piel-card ${skin === `preset:${preset.id}` ? 'activo' : ''}`}
              onClick={() => setSkin(`preset:${preset.id}`)}
              title={preset.nombre}
            >
              {preset.thumbnail
                ? <img src={preset.thumbnail} alt={preset.nombre} loading="lazy" />
                : <span style={{ display: 'block', width: '100%', aspectRatio: '3 / 2', background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />}
              <span>{preset.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor de poses de dedos (solo admin) */}
      <EditorDedos />

      {/* Bailes */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Baile</div>
        <div className="visor-personaje-bailes en-panel">
          <button
            type="button"
            className={`visor-baile-btn ${baile === null ? 'activo' : ''}`}
            onClick={() => setBaile(null)}
          >
            Quieto
          </button>
          {BAILES.map((b) => {
            const bloqueado = montado && b.premium && !premium
            return (
              <button
                key={b.id}
                type="button"
                className={`visor-baile-btn ${baile === b.clip ? 'activo' : ''} ${bloqueado ? 'bloqueado' : ''}`}
                onClick={() => { if (!bloqueado) setBaile(b.clip) }}
                title={bloqueado ? 'Disponible con membresía Premium' : b.nombre}
              >
                {bloqueado && <span aria-hidden="true">🔒</span>}
                {b.nombre}
              </button>
            )
          })}
        </div>
      </div>

      {/* Escenario */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Escenario</div>
        <div className="visor-personaje-bailes en-panel">
          {ESCENARIOS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`visor-baile-btn ${escenarioId === e.id ? 'activo' : ''}`}
              onClick={() => setEscenarioId(e.id)}
            >
              {e.nombre}
            </button>
          ))}
        </div>
        {/* Editor de posición fija del personaje (solo admin, solo escenarios .glb) */}
        <EditorPosEscenario />
      </div>

      {/* Secuencia de animaciones (orden + duración) */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Secuencia de animaciones</div>
        <SecuenciadorBailes />
      </div>

      {/* Director de cámaras */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Cámara</div>
        <div className="visor-personaje-bailes en-panel">
          {TOMAS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`visor-baile-btn ${!directorAuto && tomaCamara === t.id ? 'activo' : ''}`}
              onClick={() => { setDirectorAuto(false); setTomaCamara(t.id) }}
            >
              {t.nombre}
            </button>
          ))}
          <button
            type="button"
            className={`visor-baile-btn ${directorAuto ? 'activo' : ''}`}
            onClick={() => setDirectorAuto(!directorAuto)}
            title="Corta solo entre tomas mientras suena una grabación"
          >
            🎬 Director
          </button>
        </div>
      </div>

      {/* Reproductor de grabaciones (toca la grabación sobre el personaje) */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Mis grabaciones</div>
        <ReplayGrabacionEn3D />
      </div>
    </div>
  )
}

export default SeccionPLPersonaje
