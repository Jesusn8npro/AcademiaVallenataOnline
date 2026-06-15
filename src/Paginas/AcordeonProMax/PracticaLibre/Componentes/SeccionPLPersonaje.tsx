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

// Panel derecho de la pestaña Personaje: selector de personaje + skins del acordeón + bailes +
// control del fuelle + reproductor de grabaciones. Vive en PanelLateralEstudiante (no tapa la vista).
const PIELES = ['original', '1', '2', '3', '4', '5', '6', '7']

const SeccionPLPersonaje: React.FC = () => {
  const { personajeId, setPersonajeId, skin, setSkin, baile, setBaile, escenarioId, setEscenarioId, tomaCamara, setTomaCamara, directorAuto, setDirectorAuto, premium, abierto, setFuelle } = usePersonajeEstudio()
  // `premium` se resuelve async (esUsuarioPremium) → el SSR y el primer render del cliente difieren y
  // disparan un error de hidratación en el gating de bailes. Gateamos por `montado` para que el primer
  // render coincida con el servidor (sin bloqueo) y el estado real se aplique tras montar.
  const [montado, setMontado] = React.useState(false)
  React.useEffect(() => { setMontado(true) }, [])

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
              className={`visor-personaje-card ${personajeId === p.id ? 'activo' : ''}`}
              onClick={() => setPersonajeId(p.id)}
              title={p.nombre}
            >
              <img src={p.foto} alt={p.nombre} loading="lazy" />
              <span>{p.nombre}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fuelle + skins del acordeón */}
      <div className="estudio-practica-libre-bloque">
        <div className="estudio-practica-libre-bloque-titulo">Acordeón</div>
        <button
          type="button"
          className={`visor-personaje-fuelle-btn ${abierto ? 'activo' : ''}`}
          onPointerDown={() => setFuelle(true)}
          onPointerUp={() => setFuelle(false)}
          onPointerLeave={() => { if (abierto) setFuelle(false) }}
        >
          <kbd>Q</kbd> Cerrar fuelle
        </button>
        <div className="visor-personaje-pieles-dock en-panel">
          {PIELES.map((p) => (
            <button
              key={p}
              type="button"
              className={`visor-piel-btn ${skin === p ? 'activo' : ''}`}
              onClick={() => setSkin(p)}
            >
              {p === 'original' ? 'Original' : p}
            </button>
          ))}
        </div>
      </div>

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
