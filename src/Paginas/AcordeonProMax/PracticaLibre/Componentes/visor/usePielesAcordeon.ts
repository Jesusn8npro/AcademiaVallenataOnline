import * as React from 'react'
import * as THREE from 'three'
import { RigRefs } from './useRigRefs'
import { PARTES_PIEL } from './mapas'

// Materiales del acordeón por pieza (cuerpo/botones/fuelle/pack/parte botones) → pieles. El estado
// `listo` (cuántas piezas mapean a piel) vive aquí porque solo lo usan estos dos efectos.
export function usePielesAcordeon(refs: RigRefs, acordeon: THREE.Object3D, skin: string) {
  const { accMats } = refs
  const [listo, setListo] = React.useState(0)

  // Materiales del acordeón por pieza → pieles.
  React.useEffect(() => {
    const seen = new Set<any>()
    const list: Array<{ part: string; mat: any }> = []
    acordeon.traverse((o: any) => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (!m || seen.has(m)) continue
        seen.add(m)
        // Materiales del acordeón del personaje vienen como 'acc_fuelle.001' etc.
        const part = (m.name || '').replace(/\.\d+$/, '').replace(/^acc_/, '')
        if (!PARTES_PIEL.has(part)) continue
        list.push({ part, mat: m })
      }
    })
    accMats.current = list
    setListo(list.length)
  }, [acordeon])

  // Aplicar la piel seleccionada. 'original' = mapas del GLB. '1'..'7' = /public/texturas-acordeon.
  React.useEffect(() => {
    if (!accMats.current.length) return
    const loader = new THREE.TextureLoader()
    // Cache por URL: ahora los materiales del acordeón se clonan POR MALLA (para el diseño por partes),
    // así que muchas mallas comparten la misma piel → cargamos cada textura UNA sola vez (no por malla).
    const cache = new Map<string, THREE.Texture>()
    const cargar = (url: string, srgb: boolean) => {
      const k = srgb ? `s|${url}` : url
      const hit = cache.get(k)
      if (hit) return hit
      const t = loader.load(url, () => {})
      t.flipY = false
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      cache.set(k, t)
      return t
    }
    for (const { part, mat } of accMats.current) {
      // 'original' y los DISEÑOS propios ('preset:<id>') usan las texturas baked como base; el preset
      // luego se tinta encima (useDisenoEnAcordeon). Las pieles '1'..'7' cargan sus texturas.
      if (skin === 'original' || skin.startsWith('preset:')) {
        const o = mat.userData.orig
        if (o) { mat.map = o.map; mat.roughnessMap = o.roughnessMap; mat.metalnessMap = o.metalnessMap; mat.normalMap = o.normalMap }
      } else {
        const dir = `/texturas-acordeon/${skin}/${part.replace(/\s+/g, '-')}`
        mat.map = cargar(`${dir}_base.webp`, true)
        const mr = cargar(`${dir}_mr.webp`, false)
        mat.roughnessMap = mr; mat.metalnessMap = mr; mat.roughness = 1; mat.metalness = 1
        mat.normalMap = cargar(`${dir}_normal.webp`, false)
      }
      // Color a blanco SIEMPRE: limpia cualquier tinte de un diseño anterior. Si el modelo elegido es
      // un preset, useDisenoEnAcordeon vuelve a tintar encima (después de este efecto).
      mat.color.set('#ffffff')
      mat.needsUpdate = true
    }
  }, [skin, listo])
}
