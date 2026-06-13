import * as THREE from 'three'

// Helpers de rig del visor del personaje: normal de plano (PCA), captura de rest pose y rebaseo de
// clips entre esqueletos. Extraídos de VisorPersonaje3D (funciones puras).

// ===== Bailes por capas =====
// La acción 'Cierre' del personaje keyea los 55 huesos (bake completo). Para que un baile no
// pelee con ella en el mixer, el clip se PARTE en dos capas: BRAZOS (Shoulder/Arm/Hand — el
// agarre del acordeón, siempre activa y escrubada con Q) y CUERPO (torso/piernas en pose de
// agarre — el "idle", que se cruza con el baile). Los bailes del pack NO traen huesos de brazos
// (misma firma que en Blender) → bailar y cerrar el fuelle funcionan A LA VEZ sin conflicto.
export const RE_HUESOS_BRAZO = /(Shoulder|Arm|Hand)/

// Normal del plano de un conjunto de puntos (PCA: eje de MENOR varianza).
// Sirve para saber hacia dónde "adentro" del teclado se hunde cada botón.
export function normalPlano(pts: THREE.Vector3[]): THREE.Vector3 {
  const c = new THREE.Vector3()
  pts.forEach((p) => c.add(p)); c.multiplyScalar(1 / pts.length)
  let xx = 0, xy = 0, xz = 0, yy = 0, yz = 0, zz = 0
  for (const p of pts) {
    const dx = p.x - c.x, dy = p.y - c.y, dz = p.z - c.z
    xx += dx * dx; xy += dx * dy; xz += dx * dz; yy += dy * dy; yz += dy * dz; zz += dz * dz
  }
  const M = [xx, xy, xz, yy, yz, zz]
  const mul = (m: number[], v: THREE.Vector3) => new THREE.Vector3(
    m[0] * v.x + m[1] * v.y + m[2] * v.z,
    m[1] * v.x + m[3] * v.y + m[4] * v.z,
    m[2] * v.x + m[4] * v.y + m[5] * v.z,
  )
  let e1 = new THREE.Vector3(1, 0.31, 0.21).normalize()
  for (let i = 0; i < 50; i++) e1 = mul(M, e1).normalize()
  const l1 = mul(M, e1).dot(e1)
  const M2 = [M[0] - l1 * e1.x * e1.x, M[1] - l1 * e1.x * e1.y, M[2] - l1 * e1.x * e1.z,
    M[3] - l1 * e1.y * e1.y, M[4] - l1 * e1.y * e1.z, M[5] - l1 * e1.z * e1.z]
  let e2 = new THREE.Vector3(0.23, 1, 0.34).normalize()
  for (let i = 0; i < 50; i++) e2 = mul(M2, e2).normalize()
  return e1.cross(e2).normalize()
}

// Rest pose (TRS local de carga) de cada hueso, cacheada en la escena: los clips glTF guardan
// rotaciones locales ABSOLUTAS, así que para retargetear un baile del AnimRig a un personaje hay
// que rebasarlo con los rests de ambos. Se captura en el PRIMER render (huesos prístinos del
// loader) porque useGLTF cachea la escena y al volver a un personaje sus huesos quedan posados.
export function restPoseDe(escena: THREE.Object3D): Map<string, { q: THREE.Quaternion; p: THREE.Vector3 }> {
  let rest = escena.userData.__restHuesos
  if (!rest) {
    rest = new Map()
    // OJO: el pack de bailes va SIN skin (solo-esqueleto) → sus huesos cargan como Object3D
    // planos, no como Bone. Filtrar solo isBone dejaba el mapa vacío (0 tracks rebasados).
    escena.traverse((o: any) => {
      if (o.isBone || /^mixamorig/.test(o.name || '')) rest.set(o.name, { q: o.quaternion.clone(), p: o.position.clone() })
    })
    escena.userData.__restHuesos = rest
  }
  return rest
}

// Rebasa un clip del AnimRig (rests A) al esqueleto del personaje (rests B) — el equivalente
// runtime del remapeo que hace Blender con las acciones (que son relativas al rest de cada rig):
//   q_final = q_restB ⊗ q_restA⁻¹ ⊗ q_clip      t_final = t_restB + (t_clip − t_restA)
// Sin esto, las diferencias de rest entre auto-rigs Mixamo (2-10° en piernas/torso) tuercen el
// baile distinto en cada personaje. Huesos que el personaje no tiene se descartan.
export function rebasarClip(
  clip: THREE.AnimationClip,
  escenaA: THREE.Object3D,
  escenaB: THREE.Object3D,
  restA: Map<string, { q: THREE.Quaternion; p: THREE.Vector3 }>,
  restB: Map<string, { q: THREE.Quaternion; p: THREE.Vector3 }>,
): THREE.AnimationClip {
  const qClip = new THREE.Quaternion(), qInv = new THREE.Quaternion(), qOut = new THREE.Quaternion()
  const vDelta = new THREE.Vector3()
  const tracks: THREE.KeyframeTrack[] = []
  for (const t of clip.tracks) {
    const punto = t.name.lastIndexOf('.')
    const nodo = t.name.slice(0, punto), prop = t.name.slice(punto + 1)
    const ra = restA.get(nodo), rb = restB.get(nodo)
    if (!ra || !rb) continue
    const times = (t.times as Float32Array).slice()
    const vals = (t.values as Float32Array).slice()
    if (prop === 'quaternion') {
      qInv.copy(ra.q).invert()
      for (let i = 0; i < vals.length; i += 4) {
        qClip.fromArray(vals, i)
        qOut.copy(rb.q).multiply(qInv).multiply(qClip)
        qOut.toArray(vals, i)
      }
      tracks.push(new THREE.QuaternionKeyframeTrack(t.name, times as any, vals as any))
    } else if (prop === 'position') {
      // El delta vive en el espacio LOCAL del padre del hueso, y los padres tienen escalas
      // DISTINTAS entre rigs (AnimRig 0.0112 vs personajes 0.01) → convertir delta_A a mundo y
      // de mundo al local de B con los Matrix3 (rotación+escala) de ambos padres.
      const huesoA = escenaA.getObjectByName(nodo), huesoB = escenaB.getObjectByName(nodo)
      const mA = new THREE.Matrix3(), mBinv = new THREE.Matrix3()
      if (huesoA?.parent && huesoB?.parent) {
        mA.setFromMatrix4(huesoA.parent.matrixWorld)
        mBinv.setFromMatrix4(huesoB.parent.matrixWorld).invert()
      } else {
        mA.identity(); mBinv.identity()
      }
      for (let i = 0; i < vals.length; i += 3) {
        vDelta.set(vals[i] - ra.p.x, vals[i + 1] - ra.p.y, vals[i + 2] - ra.p.z)
        vDelta.applyMatrix3(mA).applyMatrix3(mBinv)
        vals[i] = rb.p.x + vDelta.x
        vals[i + 1] = rb.p.y + vDelta.y
        vals[i + 2] = rb.p.z + vDelta.z
      }
      tracks.push(new THREE.VectorKeyframeTrack(t.name, times as any, vals as any))
    }
  }
  return new THREE.AnimationClip(clip.name, clip.duration, tracks)
}
