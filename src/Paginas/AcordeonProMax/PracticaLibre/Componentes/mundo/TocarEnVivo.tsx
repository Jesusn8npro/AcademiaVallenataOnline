'use client'
import * as React from 'react'
import { X } from 'lucide-react'
import { useLogicaAcordeon } from '../../../../../Core/hooks/useLogicaAcordeon'
import VisorAcordeon3D from '../VisorAcordeon3D'
import { usePersonajeEstudio } from '../../contextoPersonajeEstudio'
import { TONALIDADES } from '../../../../../Core/acordeon/notasAcordeonDiatonico'

// Acordeón JUGABLE 3D dentro del mundo (desktop). Crea UN useLogicaAcordeon REAL (interacción ON): al
// tocar (tap en los botones 3D o teclado QWERTY) suena localmente y, como actualizarBotonActivo emite al
// emisor global de notas, useMultijugador lo BROADCASTea → los jugadores que te eligieron te oyen y tu
// avatar (local y remoto) anima dedos/fuelle. El VisorAcordeon3D (sin botonesActivosExternos) escucha ese
// mismo emisor global → hunde las teclas y mueve el fuelle en sincronía. Muestra la PIEL del usuario.
//
// OJO: el teclado físico mapea W/A/S/D a notas (= mover en el mundo). Por eso, mientras este panel está
// abierto, MundoPoC desactiva el movimiento por teclado (modo "tocar"); el mouse/joystick siguen.

const TONALIDAD_DEFAULT = 'BES' // afinación vallenata estándar
const ENC_ROT: [number, number, number] = [-0.05, 0.10, 0.12] // 3/4 ligero, de frente a la cámara

export default function TocarEnVivo({ onCerrar, ancho }: { onCerrar: () => void; ancho: number }) {
  const logica = useLogicaAcordeon()
  const { skin } = usePersonajeEstudio()
  const fuelleCerrandoRef = React.useRef(false)
  fuelleCerrandoRef.current = logica.direccion === 'empujar'

  const tonalidadInit = React.useRef(false)
  React.useEffect(() => {
    if (tonalidadInit.current) return
    tonalidadInit.current = true
    if (logica.tonalidadSeleccionada !== TONALIDAD_DEFAULT) logica.setTonalidadSeleccionada(TONALIDAD_DEFAULT)
  }, [])

  const listaTonalidades = React.useMemo(
    () => (logica.listaTonalidades.length ? logica.listaTonalidades : Object.keys(TONALIDADES)),
    [logica.listaTonalidades],
  )

  return (
    <div style={{ background: 'rgba(15,18,26,.92)', border: '1px solid #2a3346', borderRadius: 14, padding: 12, boxShadow: '0 12px 40px rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', fontFamily: 'system-ui, sans-serif', width: ancho }}>
      {/* El stage base (.visor-acordeon-3d-stage) viene de EstudioPracticaLibre.css con alto clamp(360..720);
          acá lo fijamos más bajo (cabe en el panel). 2 clases → más específico → gana sobre la base. */}
      <style>{`.tocarvivo-3d.visor-acordeon-3d-stage{height:300px;border-radius:12px;background:radial-gradient(ellipse at center,rgba(40,50,80,.35) 0%,rgba(8,10,22,.9) 80%)}`}</style>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>🎹 Tocar en vivo</span>
        <select
          value={logica.tonalidadSeleccionada}
          onChange={(e) => logica.setTonalidadSeleccionada(e.target.value)}
          title="Tonalidad"
          style={{ background: '#1c2230', color: '#fff', border: '1px solid #2a3346', borderRadius: 7, padding: '3px 8px', fontSize: 12 }}
        >
          {listaTonalidades.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <button
          type="button"
          onClick={() => logica.setDireccion(logica.direccion === 'halar' ? 'empujar' : 'halar')}
          title="Cambiar fuelle (Q)"
          style={{ background: logica.direccion === 'halar' ? '#2563eb' : '#ff7a18', color: '#fff', border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
        >
          {logica.direccion === 'halar' ? '◀ Halando' : 'Empujando ▶'}
        </button>
        <span style={{ flex: 1 }} />
        <button type="button" onClick={onCerrar} title="Cerrar" style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex' }}>
          <X size={18} />
        </button>
      </div>

      <VisorAcordeon3D
        materialPorMesh={{}}
        piezaSeleccionada={null}
        onClickPieza={() => {}}
        onMallasDetectadas={() => {}}
        fuelleCerrandoRef={fuelleCerrandoRef}
        animShapeKey={null}
        animProgramatica={null}
        pulseEpoch={null}
        skin={skin}
        camaraFija
        direccion={logica.direccion}
        rotacionModelo={ENC_ROT}
        fillModelo={0.95}
        offsetRelXModelo={0}
        offsetRelYModelo={0.05}
        onTocarBoton={(id, accion) => logica.actualizarBotonActivo(id, accion === 'down' ? 'add' : 'remove')}
        className="tocarvivo-3d"
      />

      <p style={{ color: '#8a93a6', fontSize: 11, textAlign: 'center', margin: '8px 0 0' }}>
        Toca los botones o usa el teclado · <b>Q</b> cambia el fuelle · mientras tocas no caminas
      </p>
    </div>
  )
}
