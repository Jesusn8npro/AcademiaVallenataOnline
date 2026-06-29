import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { RigRefs } from './useRigRefs'

// Arrastrar la CAJA DE LOS BAJOS con el mouse para abrir/cerrar el fuelle — igual que mover
// Ctrl_Bajos en Blender. No mueve la caja "a mano": traduce el arrastre a `fuellePosRef` (0=abierto,
// 1=cerrado), y la caja se desliza por el morph 'Cerrar' mientras la MANO la sigue pegada sola (el
// IK/CCD de usePersonajeFrame ya lo hace). Mientras se arrastra la caja, se apaga el OrbitControls
// para que el clic no gire la cámara. Solo activo en la pestaña Personaje (donde se pasa fuellePosRef).

const DRAG_PX_FULL = 240            // px de arrastre = recorrido completo abierto↔cerrado (tunear a gusto)
const RE_CAJA_BAJOS = /Caja_de_los_bajos|Boton_I/i

export function useArrastrarCaja(
  refs: RigRefs,
  acordeon: THREE.Object3D,
  fuellePosRef?: React.MutableRefObject<number>,
  activo: boolean = true,
  // true mientras se arrastra la caja → el fuelle sigue al mouse rápido (sin el suavizado lento de reposo).
  arrastrandoRef?: React.MutableRefObject<boolean>,
) {
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as any

  React.useEffect(() => {
    if (!activo || !fuellePosRef) return
    const dom = gl.domElement
    const ray = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    let drag: null | { startX: number; startY: number; startPos: number; axisPx: THREE.Vector2 } = null

    // ¿el rayo del puntero atraviesa la caja de bajos (o sus botones)? (revisa TODOS los hits)
    const tocaCaja = (e: PointerEvent): boolean => {
      const r = dom.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      ray.setFromCamera(ndc, camera)
      for (const h of ray.intersectObject(acordeon, true)) {
        for (let o: THREE.Object3D | null = h.object; o; o = o.parent) if (RE_CAJA_BAJOS.test(o.name)) return true
      }
      return false
    }

    // Dirección de CIERRE de la caja proyectada a pantalla (px) → arrastrar en ese sentido cierra.
    const ejePantalla = (): THREE.Vector2 => {
      const eje = new THREE.Vector2(1, 0)
      const caja = refs.cajaGrip.current?.caja
      const dCerrar = refs.cajaGrip.current?.dCerrar
      if (!caja || !dCerrar) return eje
      caja.updateWorldMatrix(true, false)
      const p0 = caja.getWorldPosition(new THREE.Vector3())
      const wd = dCerrar.clone().transformDirection(caja.matrixWorld).normalize()
      const s0 = p0.clone().project(camera)
      const s1 = p0.clone().add(wd.multiplyScalar(0.1)).project(camera)
      const r = dom.getBoundingClientRect()
      eje.set((s1.x - s0.x) * r.width / 2, -(s1.y - s0.y) * r.height / 2)
      return eje.lengthSq() < 1e-6 ? eje.set(1, 0) : eje.normalize()
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || drag || !tocaCaja(e)) return
      drag = { startX: e.clientX, startY: e.clientY, startPos: fuellePosRef.current, axisPx: ejePantalla() }
      if (arrastrandoRef) arrastrandoRef.current = true
      if (controls) controls.enabled = false   // no girar la cámara mientras se mueve la caja
    }
    const onMove = (e: PointerEvent) => {
      if (!drag) return
      const along = (e.clientX - drag.startX) * drag.axisPx.x + (e.clientY - drag.startY) * drag.axisPx.y
      // -1 = abierto/arqueado (morph 'Abrir'), 1 = cerrado. Arrastrar abre hasta el arqueado ancho.
      fuellePosRef.current = THREE.MathUtils.clamp(drag.startPos + along / DRAG_PX_FULL, -1, 1)
    }
    const onUp = () => {
      if (!drag) return
      drag = null
      if (arrastrandoRef) arrastrandoRef.current = false
      if (controls) controls.enabled = true
    }

    dom.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      dom.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      if (controls) controls.enabled = true
    }
  }, [gl, camera, controls, acordeon, refs, fuellePosRef, activo, arrastrandoRef])
}
