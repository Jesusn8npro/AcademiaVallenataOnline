'use client'
import * as React from 'react'
import { X } from 'lucide-react'
import { useLogicaAcordeon } from '../../../../../Core/hooks/useLogicaAcordeon'
import CuerpoAcordeon from '../../../../../Core/componentes/CuerpoAcordeon'
import { TONALIDADES } from '../../../../../Core/acordeon/notasAcordeonDiatonico'

// Acordeón JUGABLE dentro del mundo. Crea UN useLogicaAcordeon REAL (interacción ON): al tocar
// (clic/tap en los botones o teclado QWERTY) suena localmente y, como actualizarBotonActivo emite al
// emisor global de notas (no silencioso), useMultijugador lo BROADCASTea con su tono → los jugadores
// que te eligieron (clic en tu avatar) te oyen, y tu avatar (local y remoto) anima dedos/fuelle.
//
// OJO: el teclado físico mapea W/A/S/D a notas (= mover en el mundo). Por eso, mientras este panel
// está abierto, MundoPoC desactiva el movimiento por teclado (modo "tocar"); el mouse/joystick siguen.
// Reusa el cableado mínimo de PanelAcordeonEnClase (ajustesEmbed en px + CuerpoAcordeon).

const IMAGEN_ACORDEON = '/Acordeon PRO MAX.webp'
const TONALIDAD_DEFAULT = 'BES' // afinación vallenata estándar

export default function TocarEnVivo({ onCerrar, ancho }: { onCerrar: () => void; ancho: number }) {
  const logica = useLogicaAcordeon()
  const tamano = ancho - 24 // descuenta el padding del cuerpo (px, no %: clave para el --unit del CSS)

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

  const ajustesEmbed = React.useMemo(
    () => ({ ...logica.ajustes, tamano: `${tamano}px`, x: '50%', y: '50%' }),
    [logica.ajustes, tamano],
  )

  return (
    <div style={{ background: 'rgba(15,18,26,.92)', border: '1px solid #2a3346', borderRadius: 14, padding: 12, boxShadow: '0 12px 40px rgba(0,0,0,.5)', backdropFilter: 'blur(6px)', fontFamily: 'system-ui, sans-serif' }}>
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

      <div style={{ width: tamano, height: tamano, margin: '0 auto', position: 'relative' }}>
        <CuerpoAcordeon
          imagenFondo={IMAGEN_ACORDEON}
          ajustes={ajustesEmbed as any}
          direccion={logica.direccion}
          configTonalidad={logica.configTonalidad}
          botonesActivos={logica.botonesActivos}
          modoAjuste={false}
          botonSeleccionado={null}
          modoVista={logica.modoVista}
          vistaDoble={false}
          setBotonSeleccionado={() => {}}
          actualizarBotonActivo={logica.actualizarBotonActivo}
          listo
        />
      </div>

      <p style={{ color: '#8a93a6', fontSize: 11, textAlign: 'center', margin: '8px 0 0' }}>
        Toca los botones o usa el teclado · <b>Q</b> cambia el fuelle · mientras tocas no caminas
      </p>
    </div>
  )
}
