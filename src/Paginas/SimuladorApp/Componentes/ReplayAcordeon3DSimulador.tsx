'use client'
import * as React from 'react'
import { X } from 'lucide-react'
import VisorAcordeon3D, { type InfoPieza } from '../../AcordeonProMax/PracticaLibre/Componentes/VisorAcordeon3D'

// Vista 3D del replay en el Simulador App: SOLO el acordeón (sin personaje), con la PIEL que el usuario
// eligió. No hay segundo motor: useReplaySimulador conduce el replay y emite cada nota al emisor global;
// VisorAcordeon3D (sin botonesActivosExternos) se suscribe a ese emisor y hunde las teclas en sincronía.
//
// Encuadre AUTO: usamos el modo NO camaraFija del visor (Bounds + Center) → el acordeón se CENTRA y se
// ajusta solo en pantalla (antes con camaraFija salía descentrado/gigante). El usuario lo gira arrastrando
// (OrbitControls) y hace zoom con la rueda / pellizco.

const NOOP_CLICK: (n: string) => void = () => {}
const NOOP_MALLAS: (p: InfoPieza[]) => void = () => {}

interface Props {
  skin: string
  direccion: 'halar' | 'empujar'
  onCerrar: () => void
}

const ReplayAcordeon3DSimulador: React.FC<Props> = ({ skin, direccion, onCerrar }) => {
  // El fuelle sigue la dirección del replay (cerrando = empujar). La actividad la da el emisor global
  // (VisorAcordeon3D "respira" mientras suenan notas).
  const fuelleCerrandoRef = React.useRef(false)
  fuelleCerrandoRef.current = direccion === 'empujar'

  return (
    <div className="rp3d-overlay">
      <div className="rp3d-topbar">
        <button type="button" className="rp3d-btn-top" onClick={onCerrar} title="Volver a las teclas">
          <X size={16} /> Teclas
        </button>
        <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 12, alignSelf: 'center' }}>Arrastra para girar · rueda/pellizco para acercar</span>
      </div>

      <div className="rp3d-visor">
        <VisorAcordeon3D
          materialPorMesh={{}}
          piezaSeleccionada={null}
          onClickPieza={NOOP_CLICK}
          onMallasDetectadas={NOOP_MALLAS}
          fuelleCerrandoRef={fuelleCerrandoRef}
          animShapeKey={null}
          animProgramatica={null}
          pulseEpoch={null}
          skin={skin}
          direccion={direccion}
        />
      </div>
    </div>
  )
}

export default ReplayAcordeon3DSimulador
