'use client'
import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, OrbitControls, Bounds, Center } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { subscribirNotas } from '../../../../Core/audio/emisorNotasAcordeon'

// GLB del personaje: geometría horneada (pose de agarre) + morph "Cerrar" (fuelle) +
// 8 morphs de dedos (R/L Index/Mid/Ring/Pinky) en CC_Base_Body.
const GLB_PATH = '/modelos3d/personaje-acordeon.glb?v=25'

useGLTF.setDecoderPath('/draco/')

// Color de resaltado (glow) del botón pisado.
const _glow = new THREE.Color(0.95, 0.78, 0.25)

// Normal del plano de un conjunto de puntos (PCA: eje de MENOR varianza).
// Sirve para saber hacia dónde "adentro" del teclado se hunde cada botón.
function normalPlano(pts: THREE.Vector3[]): THREE.Vector3 {
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
  // Las dos direcciones de MAYOR varianza (en el plano) por iteración de potencia; la normal = su producto cruz.
  let e1 = new THREE.Vector3(1, 0.31, 0.21).normalize()
  for (let i = 0; i < 50; i++) e1 = mul(M, e1).normalize()
  const l1 = mul(M, e1).dot(e1)
  const M2 = [M[0] - l1 * e1.x * e1.x, M[1] - l1 * e1.x * e1.y, M[2] - l1 * e1.x * e1.z,
    M[3] - l1 * e1.y * e1.y, M[4] - l1 * e1.y * e1.z, M[5] - l1 * e1.z * e1.z]
  let e2 = new THREE.Vector3(0.23, 1, 0.34).normalize()
  for (let i = 0; i < 50; i++) e2 = mul(M2, e2).normalize()
  return e1.cross(e2).normalize()
}

// Cada botón → dedo que lo presiona (calculado en Blender por cercanía de la punta).
const BOTON_DEDO: Record<string, string> = {
  Boton_D_01: 'R_Index', Boton_D_02: 'R_Index', Boton_D_03: 'R_Index', Boton_D_04: 'R_Ring',
  Boton_D_05: 'R_Ring', Boton_D_06: 'R_Pinky', Boton_D_07: 'R_Pinky', Boton_D_08: 'R_Pinky',
  Boton_D_09: 'R_Pinky', Boton_D_10: 'R_Pinky', Boton_D_11: 'R_Index', Boton_D_12: 'R_Index',
  Boton_D_13: 'R_Index', Boton_D_14: 'R_Index', Boton_D_15: 'R_Ring', Boton_D_16: 'R_Ring',
  Boton_D_17: 'R_Pinky', Boton_D_18: 'R_Pinky', Boton_D_19: 'R_Pinky', Boton_D_20: 'R_Pinky',
  Boton_D_21: 'R_Pinky', Boton_D_22: 'R_Index', Boton_D_23: 'R_Index', Boton_D_24: 'R_Index',
  Boton_D_25: 'R_Mid', Boton_D_26: 'R_Ring', Boton_D_27: 'R_Ring', Boton_D_28: 'R_Pinky',
  Boton_D_29: 'R_Pinky', Boton_D_30: 'R_Pinky', Boton_D_31: 'R_Pinky',
  Boton_I_01: 'L_Index', Boton_I_02: 'L_Index', Boton_I_03: 'L_Index', Boton_I_04: 'L_Mid',
  Boton_I_05: 'L_Mid', Boton_I_06: 'L_Ring', Boton_I_07: 'L_Index', Boton_I_08: 'L_Index',
  Boton_I_09: 'L_Mid', Boton_I_10: 'L_Mid', Boton_I_11: 'L_Ring', Boton_I_12: 'L_Ring',
}

// Mapeo nota→botón calculado en Blender por PCA (las 3 filas de melodía 10/11/10 y las
// 2 de bajos 6/6 se separan por el eje real del teclado, no por X — por eso se hardcodea).
const NOTA_BOTON: Record<string, string> = {
  '1-1': 'Boton_D_01', '1-2': 'Boton_D_02', '1-3': 'Boton_D_03', '1-4': 'Boton_D_04', '1-5': 'Boton_D_05',
  '1-6': 'Boton_D_06', '1-7': 'Boton_D_07', '1-8': 'Boton_D_08', '1-9': 'Boton_D_09', '1-10': 'Boton_D_10',
  '2-1': 'Boton_D_11', '2-2': 'Boton_D_12', '2-3': 'Boton_D_13', '2-4': 'Boton_D_14', '2-5': 'Boton_D_15',
  '2-6': 'Boton_D_16', '2-7': 'Boton_D_17', '2-8': 'Boton_D_18', '2-9': 'Boton_D_19', '2-10': 'Boton_D_20',
  '2-11': 'Boton_D_21', '3-1': 'Boton_D_22', '3-2': 'Boton_D_23', '3-3': 'Boton_D_24', '3-4': 'Boton_D_25',
  '3-5': 'Boton_D_26', '3-6': 'Boton_D_27', '3-7': 'Boton_D_28', '3-8': 'Boton_D_29', '3-9': 'Boton_D_30',
  '3-10': 'Boton_D_31',
  'bajo-1-1': 'Boton_I_01', 'bajo-1-2': 'Boton_I_02', 'bajo-1-3': 'Boton_I_03', 'bajo-1-4': 'Boton_I_04',
  'bajo-1-5': 'Boton_I_05', 'bajo-1-6': 'Boton_I_06', 'bajo-2-1': 'Boton_I_07', 'bajo-2-2': 'Boton_I_08',
  'bajo-2-3': 'Boton_I_09', 'bajo-2-4': 'Boton_I_10', 'bajo-2-5': 'Boton_I_11', 'bajo-2-6': 'Boton_I_12',
}

// Convierte el id lógico que emite el acordeón (ej "1-5-halar", "1-3-empujar-bajo")
// en la clave espacial del botón. (Misma lógica que VisorAcordeon3D.)
function keyDeId(idBoton: string): string {
  let s = idBoton
  let bajo = false
  if (s.endsWith('-bajo')) { bajo = true; s = s.slice(0, -5) }
  s = s.replace(/-halar$/, '').replace(/-empujar$/, '')
  return bajo ? `bajo-${s}` : s
}

function Modelo({ fuelleAbiertoRef, skin }: { fuelleAbiertoRef: React.MutableRefObject<boolean>; skin: string }) {
  const grupo = React.useRef<THREE.Group>(null!)
  const { scene } = useGLTF(GLB_PATH) as any
  const camera = useThree((s) => s.camera)
  // Materiales del acordeón (acc_*) inyectados por pieza → permiten cambiar de "piel".
  const accMats = React.useRef<Array<{ part: string; mat: any }>>([])
  const [matsReady, setMatsReady] = React.useState(0)

  // Morphs "Cerrar" (en todas las mallas) y 8 morphs de dedos (R/L Index/Mid/Ring/Pinky).
  const cerrarMorphs = React.useRef<Array<{ infl: number[]; idx: number }>>([])
  // Por dedo, TODAS las sub-mallas del cuerpo que tienen ese morph (el cuerpo está
  // partido en 6 sub-mallas por material → hay que mover el morph en todas, no en una).
  const fingerMorphs = React.useRef<Record<string, Array<{ infl: number[]; idx: number }>>>({})
  // Botones: mesh por nombre normalizado, posición original, dirección de hundimiento,
  // material clonado y su emisivo base (para resaltar el botón pisado).
  const botones = React.useRef<Record<string, { mesh: THREE.Mesh; orig: THREE.Vector3; sink: THREE.Vector3; mat: any; emisivoBase: THREE.Color }>>({})
  const notaAMesh = React.useRef<Record<string, string>>({})
  const notasActivas = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    cerrarMorphs.current = []
    fingerMorphs.current = {}
    botones.current = {}
    const dMeshes: THREE.Mesh[] = []
    const iMeshes: THREE.Mesh[] = []
    const box = new THREE.Box3()
    const centro = new THREE.Vector3()

    scene.traverse((o: any) => {
      if (!o.isMesh) return
      const dict = o.morphTargetDictionary
      const infl = o.morphTargetInfluences
      if (dict && infl) {
        if ('Cerrar' in dict) cerrarMorphs.current.push({ infl, idx: dict['Cerrar'] })
        for (const k of Object.keys(dict)) {
          if (k.startsWith('R_') || k.startsWith('L_')) {
            if (!fingerMorphs.current[k]) fingerMorphs.current[k] = []
            fingerMorphs.current[k].push({ infl, idx: dict[k] })
          }
        }
      }
      // three.js usa el nombre del NODO (ej "Boton_D_14_m", sufijo "_m") → lo normalizamos
      // quitando "_m" y/o ".002" para casar con las claves de NOTA_BOTON / BOTON_DEDO.
      const base: string = (o.name || '').replace(/\.\d+$/, '').replace(/_m$/, '')
      if (/^Boton_D_\d+$/.test(base)) { o.userData.botonBase = base; dMeshes.push(o) }
      if (/^Boton_I_\d+$/.test(base)) { o.userData.botonBase = base; iMeshes.push(o) }
    })

    // Hundido = normal del teclado hacia ADENTRO (lejos de cámara), por grupo melodía/bajos.
    // (Antes se hundía hacia el centro de los botones = de lado hacia el fuelle → no parecía hundirse.)
    const camPos = new THREE.Vector3(); camera.getWorldPosition(camPos)
    const setupGrupo = (meshes: THREE.Mesh[]) => {
      if (!meshes.length) return
      const centros = meshes.map((m) => box.setFromObject(m).getCenter(new THREE.Vector3()))
      const cen = new THREE.Vector3(); centros.forEach((c) => cen.add(c)); cen.multiplyScalar(1 / centros.length)
      const normal = normalPlano(centros)
      if (normal.dot(cen.clone().sub(camPos)) < 0) normal.negate() // apuntar adentro (lejos de cámara)
      meshes.forEach((m) => {
        const wbb = box.setFromObject(m)
        const ws = wbb.getSize(new THREE.Vector3())
        const depth = (Math.min(ws.x, ws.y, ws.z) || 0.01) * 0.75 // ~3/4 del grosor del botón
        const pW = new THREE.Vector3(); m.getWorldPosition(pW)
        const pWmov = pW.clone().add(normal.clone().multiplyScalar(depth))
        // Desplazamiento mundial → local (respeta rotación/escala del padre).
        const sink = m.parent!.worldToLocal(pWmov).sub(m.position)
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material).clone()
        m.material = mat
        // `emissive` solo existe en materiales tipo MeshStandard/Phong/etc., no en
        // el tipo base Material. En runtime el chequeo `?` lo cubre; el cast evita el error TS.
        const matEmisivo = mat as any
        const emisivoBase = matEmisivo.emissive ? matEmisivo.emissive.clone() : new THREE.Color(0x000000)
        botones.current[(m.userData as any).botonBase] = { mesh: m, orig: m.position.clone(), sink, mat, emisivoBase }
      })
    }
    setupGrupo(dMeshes); setupGrupo(iMeshes)

    // Mapeo nota→mesh: hardcodeado (calculado por PCA en Blender, robusto a la escala).
    notaAMesh.current = NOTA_BOTON
  }, [scene])

  // Recolectar los materiales por pieza del acordeón (acc_cuerpo, acc_fuelle, acc_botones,
  // acc_pack, "acc_parte botones") y cachear sus mapas originales para poder volver a "Original".
  React.useEffect(() => {
    const seen = new Set<any>()
    const list: Array<{ part: string; mat: any }> = []
    scene.traverse((o: any) => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (!m || seen.has(m)) continue
        const name: string = m.name || ''
        if (!name.startsWith('acc_')) continue
        seen.add(m)
        m.userData.orig = { map: m.map, roughnessMap: m.roughnessMap, metalnessMap: m.metalnessMap, normalMap: m.normalMap }
        list.push({ part: name.slice(4), mat: m })
      }
    })
    accMats.current = list
    setMatsReady(list.length)
  }, [scene])

  // Aplicar la piel seleccionada. 'original' = mapas horneados del GLB. '1'..'7' = pieles
  // generadas en /public/texturas-acordeon. Las texturas del GLB usan flipY=false (glTF).
  React.useEffect(() => {
    if (!accMats.current.length) return
    const loader = new THREE.TextureLoader()
    const cargar = (url: string, srgb: boolean) => {
      const t = loader.load(url, () => {})
      t.flipY = false
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      return t
    }
    for (const { part, mat } of accMats.current) {
      if (skin === 'original') {
        const o = mat.userData.orig
        if (o) { mat.map = o.map; mat.roughnessMap = o.roughnessMap; mat.metalnessMap = o.metalnessMap; mat.normalMap = o.normalMap }
      } else {
        const dir = `/texturas-acordeon/${skin}/${part.replace(/\s+/g, '-')}`
        mat.map = cargar(`${dir}_base.webp`, true)
        const mr = cargar(`${dir}_mr.webp`, false)
        mat.roughnessMap = mr; mat.metalnessMap = mr; mat.roughness = 1; mat.metalness = 1
        mat.normalMap = cargar(`${dir}_normal.webp`, false)
      }
      mat.needsUpdate = true
    }
  }, [skin, matsReady])

  // Suscripción a las notas reales: marca/desmarca el botón que suena.
  React.useEffect(() => {
    const off = subscribirNotas((e) => {
      const nombre = notaAMesh.current[keyDeId(e.idBoton)]
      if (!nombre) return
      if (e.accion === 'down') notasActivas.current.add(nombre)
      else notasActivas.current.delete(nombre)
    })
    return off
  }, [])

  useFrame((_, delta) => {
    // Fuelle (Q)
    const tCerrar = fuelleAbiertoRef.current ? 1 : 0
    for (const m of cerrarMorphs.current) {
      let v = THREE.MathUtils.damp(m.infl[m.idx] ?? 0, tCerrar, 9, delta)
      if (Math.abs(v - tCerrar) < 0.001) v = tCerrar
      m.infl[m.idx] = v
    }
    // Dedos activos según los botones pisados → curvar ese dedo (presión).
    // OJO: el GLB es una malla HORNEADA SIN esqueleto; solo hay un morph crudo por dedo que
    // mueve la PUNTA. Pasar de 1.0 lo sobre-deforma. Lo dejamos sutil (0.55) para que no se
    // vea grotesco. El movimiento natural (dedo desde la base + mano) requiere re-exportar el
    // modelo CON huesos (skinned) desde el blend nuevo → ahí se anima por huesos, no por morph.
    const AMP_DEDO = 0.55
    const dedosActivos = new Set<string>()
    notasActivas.current.forEach((nm) => { const d = BOTON_DEDO[nm]; if (d) dedosActivos.add(d) })
    for (const [fn, arr] of Object.entries(fingerMorphs.current)) {
      const t = dedosActivos.has(fn) ? AMP_DEDO : 0
      for (const m of arr) m.infl[m.idx] = THREE.MathUtils.damp(m.infl[m.idx] ?? 0, t, 22, delta)
    }
    // Hundir + resaltar (glow) los botones pisados.
    const k = 1 - Math.exp(-26 * delta)
    for (const [nm, b] of Object.entries(botones.current)) {
      const activo = notasActivas.current.has(nm)
      const objetivo = activo ? b.orig.clone().add(b.sink) : b.orig
      b.mesh.position.lerp(objetivo, k)
      if (b.mat.emissive) {
        const ei = b.mat.emissiveIntensity ?? 1
        b.mat.emissiveIntensity = THREE.MathUtils.lerp(ei, activo ? 1.6 : 1, k)
        b.mat.emissive.lerp(activo ? _glow : b.emisivoBase, k)
      }
    }
  })

  return <primitive ref={grupo} object={scene} />
}

useGLTF.preload(GLB_PATH)

const EnvmapLocal: React.FC = () => {
  const { gl, scene } = useThree()
  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    return () => { envTex.dispose(); pmrem.dispose(); scene.environment = null }
  }, [gl, scene])
  return null
}

const VisorPersonaje3D: React.FC = () => {
  const fuelleAbiertoRef = React.useRef(false)
  const [abierto, setAbierto] = React.useState(false)
  const [skin, setSkin] = React.useState('original')
  const PIELES = ['original', '1', '2', '3', '4', '5', '6', '7']

  React.useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') { fuelleAbiertoRef.current = true; setAbierto(true) }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key === 'q' || e.key === 'Q') { fuelleAbiertoRef.current = false; setAbierto(false) }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      fuelleAbiertoRef.current = false
    }
  }, [])

  return (
    <div className="visor-acordeon-3d-stage">
      <Canvas camera={{ position: [0, 1.3, 3.6], fov: 35 }} dpr={[1, 1.25]}>
        <React.Suspense fallback={null}>
          <EnvmapLocal />
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 6, 5]} intensity={1.0} />
          <directionalLight position={[-5, 3, -3]} intensity={0.4} />
          <Bounds fit clip margin={1.05}>
            <Center>
              <Modelo fuelleAbiertoRef={fuelleAbiertoRef} skin={skin} />
            </Center>
          </Bounds>
          {/* Control tipo Blender: orbitar (clic izq), encuadrar/pan (clic der), zoom (scroll).
              Pan habilitado + rango amplio para poder alejarse y ver TODO el personaje o
              acercarse a un botón sin perder el cuadro. */}
          <OrbitControls
            makeDefault
            enablePan
            target={[0, 1, 0]}
            minDistance={0.6}
            maxDistance={20}
            enableDamping
            dampingFactor={0.1}
            zoomSpeed={0.9}
            panSpeed={0.8}
          />
        </React.Suspense>
      </Canvas>

      <div className="visor-personaje-anims">
        <button
          type="button"
          className={`visor3d-anim-btn ${abierto ? 'activo' : ''}`}
          onPointerDown={() => { fuelleAbiertoRef.current = true; setAbierto(true) }}
          onPointerUp={() => { fuelleAbiertoRef.current = false; setAbierto(false) }}
          onPointerLeave={() => { if (abierto) { fuelleAbiertoRef.current = false; setAbierto(false) } }}
        >
          Mantené <kbd>Q</kbd> para cerrar el fuelle · tocá el teclado y el muñeco presiona el botón
        </button>

        <div className="visor-personaje-pieles">
          <span className="visor-personaje-pieles-label">Estilo del acordeón:</span>
          {PIELES.map((p) => (
            <button
              key={p}
              type="button"
              className={`visor-piel-btn ${skin === p ? 'activo' : ''}`}
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

export default VisorPersonaje3D
