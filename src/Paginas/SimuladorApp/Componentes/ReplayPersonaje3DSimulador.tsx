'use client'
import * as React from 'react'
import { X, SlidersHorizontal } from 'lucide-react'
import {
  PersonajeEstudioProvider,
  usePersonajeEstudio,
} from '../../AcordeonProMax/PracticaLibre/contextoPersonajeEstudio'
import VisorPersonaje3D from '../../AcordeonProMax/PracticaLibre/Componentes/VisorPersonaje3D'
import { BAILES } from '../../AcordeonProMax/PracticaLibre/animaciones'
import { ESCENARIOS } from '../../AcordeonProMax/PracticaLibre/Componentes/visor/escenarios'
import { TOMAS } from '../../AcordeonProMax/PracticaLibre/Componentes/visor/camaras'
// Los estilos (.rp3d-*) viven en SimuladorApp.css (CSS cargado siempre), NO acá: el HMR de Next con
// chunks lazy no carga su CSS de forma confiable y salía todo sin estilo.

// Vista 3D del replay en el Simulador App: el personaje "fichado" del usuario toca la grabación que
// YA está sonando. No hay segundo motor — useReplaySimulador conduce el replay y useLogicaAcordeon
// emite cada nota al emisor global; VisorPersonaje3D (vía Modelo → emisor global) anima en sincronía.

// Skins del acordeón (mismo set que el panel de Pro Max).
const PIELES = ['original', '1', '2', '3', '4', '5', '6', '7']

// Panel desplegable de opciones (cámara / baile / escenario / skin). Flota sobre la vista, así el
// personaje sigue a pantalla completa; se abre/cierra con el botón "Opciones". Vive dentro del provider.
const PanelOpciones: React.FC = () => {
  const {
    baile, setBaile, escenarioId, setEscenarioId, premium,
    skin, setSkin, tomaCamara, setTomaCamara, directorAuto, setDirectorAuto,
  } = usePersonajeEstudio()
  // Gating premium se resuelve async → gateamos por `montado` (mismo patrón que SeccionPLPersonaje)
  // para que el primer render coincida con el SSR y no haya error de hidratación.
  const [montado, setMontado] = React.useState(false)
  React.useEffect(() => { setMontado(true) }, [])

  return (
    <div className="rp3d-panel">
      <div className="rp3d-seccion">
        <span className="rp3d-seccion-tit">Cámara</span>
        <div className="rp3d-chips">
          {TOMAS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`rp3d-chip ${!directorAuto && tomaCamara === t.id ? 'activo' : ''}`}
              onClick={() => { setDirectorAuto(false); setTomaCamara(t.id) }}
            >
              {t.nombre}
            </button>
          ))}
          <button
            type="button"
            className={`rp3d-chip ${directorAuto ? 'activo' : ''}`}
            onClick={() => setDirectorAuto(!directorAuto)}
            title="Corta solo entre tomas mientras suena la grabación"
          >
            🎬 Director
          </button>
        </div>
      </div>

      <div className="rp3d-seccion">
        <span className="rp3d-seccion-tit">Baile</span>
        <div className="rp3d-chips">
          <button
            type="button"
            className={`rp3d-chip ${baile === null ? 'activo' : ''}`}
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
                className={`rp3d-chip ${baile === b.clip ? 'activo' : ''} ${bloqueado ? 'bloqueado' : ''}`}
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

      <div className="rp3d-seccion">
        <span className="rp3d-seccion-tit">Escenario</span>
        <div className="rp3d-chips">
          {ESCENARIOS.map((e) => (
            <button
              key={e.id}
              type="button"
              className={`rp3d-chip ${escenarioId === e.id ? 'activo' : ''}`}
              onClick={() => setEscenarioId(e.id)}
            >
              {e.nombre}
            </button>
          ))}
        </div>
      </div>

      <div className="rp3d-seccion">
        <span className="rp3d-seccion-tit">Acordeón</span>
        <div className="rp3d-chips">
          {PIELES.map((p) => (
            <button
              key={p}
              type="button"
              className={`rp3d-chip ${skin === p ? 'activo' : ''}`}
              onClick={() => setSkin(p)}
            >
              {p === 'original' ? 'Original' : p}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  onCerrar: () => void
}

const ReplayPersonaje3DSimulador: React.FC<Props> = ({ onCerrar }) => {
  const [opcionesAbiertas, setOpcionesAbiertas] = React.useState(false)

  // Giramos la vista (roll de cámara) SOLO en pantallas anchas (landscape): ahí el personaje vertical
  // quedaba chico con espacio a los lados → girado llena la pantalla. En portrait (teléfono vertical)
  // NO se gira: ya se ve completo de arriba a abajo.
  const [esLandscape, setEsLandscape] = React.useState(true)
  React.useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const actualizar = () => setEsLandscape(mq.matches)
    actualizar()
    mq.addEventListener('change', actualizar)
    return () => mq.removeEventListener('change', actualizar)
  }, [])

  return (
    // Provider propio (self-contained): hidrata el MISMO personaje fichado (localStorage + DB) que el
    // Mundo 3D y Pro Max.
    <PersonajeEstudioProvider>
      <div className="rp3d-overlay">
        {/* Botones arriba a la izquierda: volver a Teclas + desplegar Opciones (al lado, como pidió). */}
        <div className="rp3d-topbar">
          <button type="button" className="rp3d-btn-top" onClick={onCerrar} title="Volver a las teclas">
            <X size={16} /> Teclas
          </button>
          <button
            type="button"
            className={`rp3d-btn-top ${opcionesAbiertas ? 'activo' : ''}`}
            onClick={() => setOpcionesAbiertas((v) => !v)}
            title="Opciones del personaje"
          >
            <SlidersHorizontal size={15} /> Opciones
          </button>
        </div>

        {opcionesAbiertas && <PanelOpciones />}

        <div className="rp3d-visor">
          {/* key: al cambiar orientación remonta el visor para que OrbitControls re-inicialice con el
              vector `up` rotado correcto (su quaternion interno se fija al construirse). */}
          <VisorPersonaje3D key={esLandscape ? 'rot' : 'norm'} rotarVista={esLandscape} />
        </div>
      </div>
    </PersonajeEstudioProvider>
  )
}

export default ReplayPersonaje3DSimulador
