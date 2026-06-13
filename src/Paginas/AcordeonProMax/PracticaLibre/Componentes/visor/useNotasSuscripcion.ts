import * as React from 'react'
import { RigRefs } from './useRigRefs'
import { subscribirNotas } from '../../../../../Core/audio/emisorNotasAcordeon'
import { keyDeId, botonAPose } from './mapas'

// Logs de tuneo de poses: solo en desarrollo. En producción no se filtran a la consola del usuario
// ni inundan el log en cada nota (hardening + rendimiento).
const DEBUG_PERSONAJE = process.env.NODE_ENV !== 'production'

// Suscripción a las notas reales: marca/desmarca el botón que suena, rastrea el fuelleo y elige la
// pose objetivo de la mano de melodía. Movido verbatim desde Modelo.
export function useNotasSuscripcion(refs: RigRefs) {
  const {
    fuelleNotaRef, notasSonandoRef, ultimaNotaMsRef, notaAMesh, botonRegion,
    regionTargetRef, melodiaSonandoRef, ultimaMelodiaMsRef, melodyPoseRef, botonHome, notasActivas,
  } = refs

  React.useEffect(() => {
    const off = subscribirNotas((e) => {
      // Fuelleo: rastrear dirección + cuántas notas suenan (aunque el botón no mapee a una malla).
      if (e.accion === 'down') { fuelleNotaRef.current = e.fuelle; notasSonandoRef.current++; ultimaNotaMsRef.current = performance.now() }
      else notasSonandoRef.current = Math.max(0, notasSonandoRef.current - 1)
      const nombre = notaAMesh.current[keyDeId(e.idBoton)]
      if (!nombre) return
      // Banda de melodía: la postura del brazo derecho va a la región del botón de melodía que suena.
      const region = botonRegion.current[nombre]
      if (region) {
        if (e.accion === 'down') { regionTargetRef.current = region; melodiaSonandoRef.current++; ultimaMelodiaMsRef.current = performance.now() }
        else melodiaSonandoRef.current = Math.max(0, melodiaSonandoRef.current - 1)
      }
      // Pose objetivo (LÓGICA DE ESTADO FIJO): identificar a cuál de los 6 estados pertenece el botón.
      // VALIDACIÓN DE ID: si no se reconoce el botón → NO se mueve la mano (mejor quieto que equivocado).
      if (e.accion === 'down') {
        const home = botonHome.current[nombre]
        const p = home ? home.pose : botonAPose(nombre)
        if (p) {
          if (DEBUG_PERSONAJE) {
            if (p !== melodyPoseRef.current) console.log(`%c[Personaje] Estado de mano → ${p}`, 'color:#5bf;font-weight:bold')
            console.log(`[Personaje] Botón ${nombre} → pose "${p}"${home ? ' (dedo ' + home.finger + ')' : ''}`)
          }
          melodyPoseRef.current = p
        } else if (DEBUG_PERSONAJE) {
          console.warn(`[Personaje] Botón ${nombre} SIN pose conocida → la mano NO se mueve`)
        }
      }
      if (e.accion === 'down') notasActivas.current.add(nombre)
      else notasActivas.current.delete(nombre)
    })
    return off
  }, [])
}
