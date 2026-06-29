import * as React from 'react'
import { RigRefs } from './useRigRefs'
import { subscribirNotas, EventoNotaAcordeon } from '../../../../../Core/audio/emisorNotasAcordeon'
import { keyDeId, botonAPose, botonABlend } from './mapas'
import type { HuesosPose } from '../../Servicios/servicioPosesDedos'

// Fuente de notas: por defecto el emisor global (las notas que toca ESTE cliente). En el mundo
// multijugador, un avatar REMOTO recibe una fuente propia que solo trae las notas de SU jugador (de
// la red) → cada avatar anima lo que toca su dueño, no lo que toca el local.
export type FuenteNotas = (cb: (e: EventoNotaAcordeon) => void) => () => void

// Poses de dedos por botón (admin): al pisar un botón con pose guardada, la mano reproduce esa pose.
export interface EdicionDedos {
  posesDedosRef: React.MutableRefObject<Record<string, HuesosPose>>
  adminPoseRef: React.MutableRefObject<HuesosPose | null>
}

// Logs de tuneo de poses: solo en desarrollo. En producción no se filtran a la consola del usuario
// ni inundan el log en cada nota (hardening + rendimiento).
const DEBUG_PERSONAJE = process.env.NODE_ENV !== 'production'

// Suscripción a las notas reales: marca/desmarca el botón que suena, rastrea el fuelleo y elige la
// pose objetivo de la mano de melodía. Movido verbatim desde Modelo.
export function useNotasSuscripcion(refs: RigRefs, fuenteNotas?: FuenteNotas, edicion?: EdicionDedos) {
  const {
    fuelleNotaRef, notasSonandoRef, ultimaNotaMsRef, notaAMesh, botonRegion,
    regionTargetRef, melodiaSonandoRef, ultimaMelodiaMsRef, melodyPoseRef, melodyBlendRef, melodyButtonRef, botonHome, notasActivas,
  } = refs

  React.useEffect(() => {
    const suscribir = fuenteNotas ?? subscribirNotas
    const off = suscribir((e) => {
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
        // MEZCLA POR CERCANÍA (per-botón, dedo exacto): SIEMPRE se usa botonABlend, que mezcla las 2
        // poses ancla más cercanas al botón. (Antes `home` la pisaba con 1 sola pose de región → el dedo
        // no cambiaba dentro de una hilera. Ese era el bug.) botonHome queda solo para el log/dedo.
        melodyBlendRef.current = botonABlend(nombre)
        melodyButtonRef.current = nombre  // botón pisado → flexionar su dedo asignado sobre él
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
      // Pose guardada (admin) para lo que se pisa AHORA: la clave = el SET de botones de melodía pisados
      // ordenado ('Boton_D_02+Boton_D_03'). Cubre tanto botón suelto (1 elemento) como ACORDE (varios).
      // Si existe esa pose exacta, el frame la aplica EXACTA e instantánea (sin IK).
      if (edicion) {
        const held = [...notasActivas.current].filter((x) => /^Boton_D_/.test(x)).sort()
        const clave = held.join('+')
        edicion.adminPoseRef.current = clave ? (edicion.posesDedosRef.current[clave] ?? null) : null
      }
    })
    return off
  }, [fuenteNotas, edicion])
}
