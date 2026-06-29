import * as React from 'react'
import * as THREE from 'three'
import { RigRefs } from './useRigRefs'
import { BOTON_AJUSTE } from './mapas'

// Herramienta de CALIBRACIÓN de la punta del dedo de melodía. El IK ya lleva la yema CERCA del botón;
// esto deja al usuario ACOMODARLA EXACTO sobre cada botón y lo guarda (por botón, en el marco local de
// la malla → sirve para los 6 personajes, que comparten el acordeón).
//
// USO (solo dev / pestaña Personaje):
//   F2            → activa/desactiva el modo calibración. Mientras está ON, el último botón de melodía
//                   pisado queda LATCHED (el dedo se queda encima aunque sueltes la tecla) para acomodar.
//   Flechas       → mueven la punta del dedo del botón latcheado en el plano del teclado (X/Y local).
//   AvPág/RePág   → acercan/alejan la punta (Z local, profundidad).
//   Shift+(tecla) → paso FINO.
//   F4            → vuelca a la consola el objeto BOTON_AJUSTE listo para pegar en mapas.ts (hornear).
//   Supr/Delete   → borra el ajuste del botón latcheado (vuelve al IK puro).
//
// Persistencia: cada ajuste se guarda en localStorage('ajustesDedoAcordeon') → sobrevive recargas
// durante la sesión de tuneo. Para dejarlo fijo en el código, F4 y pegar en BOTON_AJUSTE.
const LS_KEY = 'ajustesDedoAcordeon'

export function useCalibracionDedo(refs: RigRefs, habilitado: boolean) {
  const { calibrandoRef, ajustesDedo, melodyButtonRef, botones } = refs

  // Cargar ajustes: BOTON_AJUSTE (horneado en código) + lo guardado en localStorage (pisa al horneado).
  React.useEffect(() => {
    const m: Record<string, THREE.Vector3> = {}
    for (const k in BOTON_AJUSTE) { const a = BOTON_AJUSTE[k]; m[k] = new THREE.Vector3(a[0], a[1], a[2]) }
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) { const obj = JSON.parse(raw); for (const k in obj) { const a = obj[k]; m[k] = new THREE.Vector3(a[0], a[1], a[2]) } }
    } catch { /* localStorage no disponible */ }
    ajustesDedo.current = m
  }, [])

  React.useEffect(() => {
    // El teclado de tuneo solo en desarrollo; en producción los ajustes ya horneados se aplican igual.
    if (!habilitado || process.env.NODE_ENV === 'production') return
    const guardar = () => {
      const obj: Record<string, number[]> = {}
      for (const k in ajustesDedo.current) { const v = ajustesDedo.current[k]; obj[k] = [v.x, v.y, v.z] }
      try { localStorage.setItem(LS_KEY, JSON.stringify(obj)) } catch { /* ignore */ }
    }

    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'F2') {
        ev.preventDefault()
        calibrandoRef.current = !calibrandoRef.current
        console.log(`%c[Calib dedo] ${calibrandoRef.current ? 'ON — pisa un botón y acomódalo con las flechas' : 'OFF'}`, 'color:#f80;font-weight:bold')
        return
      }
      if (!calibrandoRef.current) return

      if (ev.key === 'F4') {
        ev.preventDefault()
        const obj: Record<string, number[]> = {}
        for (const k in ajustesDedo.current) { const v = ajustesDedo.current[k]; obj[k] = [+v.x.toFixed(5), +v.y.toFixed(5), +v.z.toFixed(5)] }
        console.log('%c[Calib dedo] BOTON_AJUSTE (pega esto en mapas.ts):', 'color:#5bf;font-weight:bold')
        console.log(JSON.stringify(obj, null, 2))
        return
      }

      const btn = melodyButtonRef.current
      if (!btn || !botones.current[btn]) {
        if (/^(Arrow|Page|Delete)/.test(ev.key)) console.warn('[Calib dedo] pisa primero un botón de melodía')
        return
      }
      const b = botones.current[btn]

      if (ev.key === 'Delete') {
        ev.preventDefault()
        delete ajustesDedo.current[btn]; guardar()
        console.log(`[Calib dedo] ${btn} → ajuste BORRADO`)
        return
      }

      // Paso proporcional al tamaño del botón (en su marco local) → consistente entre personajes.
      if (!b.mesh.geometry.boundingBox) b.mesh.geometry.computeBoundingBox()
      const sz = b.mesh.geometry.boundingBox!.getSize(new THREE.Vector3())
      const base = Math.max(sz.x, sz.y, sz.z) || 0.01
      const step = base * (ev.shiftKey ? 0.04 : 0.12)

      let dx = 0, dy = 0, dz = 0
      switch (ev.key) {
        case 'ArrowRight': dx = step; break
        case 'ArrowLeft': dx = -step; break
        case 'ArrowUp': dy = step; break
        case 'ArrowDown': dy = -step; break
        case 'PageUp': dz = step; break
        case 'PageDown': dz = -step; break
        default: return
      }
      ev.preventDefault()
      const v = (ajustesDedo.current[btn] ||= new THREE.Vector3())
      v.x += dx; v.y += dy; v.z += dz
      guardar()
      console.log(`[Calib dedo] ${btn} → [${v.x.toFixed(4)}, ${v.y.toFixed(4)}, ${v.z.toFixed(4)}]`)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [habilitado])
}
