'use client'
import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, Bounds, Center } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { subscribirNotas } from '../../../../Core/audio/emisorNotasAcordeon'
import { PERSONAJES, ACORDEON_GLB } from '../personajes'

// Arquitectura: personaje (GLB liviano, rig mixamorig:, acción 'Cierre' horneada con el brazo
// izquierdo siguiendo la tapa) + acordeón COMPARTIDO (acordeon-fino-v1, morph 'Cerrar' horneado
// en 22 piezas) acoplado en runtime al nodo 'AnclaAcordeon' por el marco de la pieza 'parrilla'.
// Q comprime el morph 'Cerrar' del fuelle; la mano queda fija en la pose de agarre.

useGLTF.setDecoderPath('/draco/')

// Compresión del fuelle: Q va 0..1 (morph 'Cerrar'). OJO: EXTRAPOLAR el morph horneado (>1)
// ROMPE el fuelle — tope limpio en 1.
const CIERRE_MAX = 1

// Color de resaltado (glow) del botón pisado.
const _glow = new THREE.Color(0.95, 0.78, 0.25)
// Flexión de los dedos POR HUESOS (rig mixamo). Ajustables tras verlo en vivo:
const CURL_AXIS = new THREE.Vector3(1, 0, 0) // eje LOCAL de flexión de la falange (pisada)
const CURL_ANGLE = 0.30                       // radianes por falange media/distal (pisada)
const _curlQ = new THREE.Quaternion()
// Temporales reutilizables (evita asignar por frame).
const _bonePos = new THREE.Vector3(), _tipPos = new THREE.Vector3(), _btnPos = new THREE.Vector3()
const _dirCur = new THREE.Vector3(), _dirTar = new THREE.Vector3()
const _qRot = new THREE.Quaternion(), _qBoneW = new THREE.Quaternion(), _qParentW = new THREE.Quaternion()
const _qIdent = new THREE.Quaternion()

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

// Mapeo nota→botón calculado en Blender por PCA (filas reales del teclado, no eje X).
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

// Partes del acordeón fino que aceptan pieles (axe/correas se quedan con su material original).
const PARTES_PIEL = new Set(['cuerpo', 'botones', 'fuelle', 'pack', 'parte botones'])

function Modelo({ fuelleAbiertoRef, skin, glb }: { fuelleAbiertoRef: React.MutableRefObject<boolean>; skin: string; glb: string }) {
  const grupo = React.useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF(glb) as any
  const acordeonGltf = useGLTF(ACORDEON_GLB) as any
  const { actions, mixer } = useAnimations(animations, scene)
  const qRef = React.useRef(0)
  const camera = useThree((s) => s.camera)

  // Clon del acordeón compartido: la geometría se comparte (sin costo GPU extra), pero los
  // materiales que mutamos (pieles/glow) se clonan para no contaminar la pestaña "Acordeón 3D".
  const acordeon = React.useMemo(() => {
    const esc: THREE.Object3D = acordeonGltf.scene.clone(true)
    const clones = new Map<string, THREE.Material>()
    esc.traverse((o: any) => {
      // Las "bases para parar el acordeón" (patas blancas para la pestaña 3D) sobran
      // cuando el personaje lo sostiene — se ven como un manchón blanco flotante.
      if (/Bases.?para.?parar/i.test(o.name || '')) o.visible = false
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      const nuevos = mats.map((m: any) => {
        if (!m) return m
        if (!clones.has(m.uuid)) {
          const c = m.clone()
          c.userData.orig = { map: c.map, roughnessMap: c.roughnessMap, metalnessMap: c.metalnessMap, normalMap: c.normalMap }
          clones.set(m.uuid, c)
        }
        return clones.get(m.uuid)
      })
      o.material = Array.isArray(o.material) ? nuevos : nuevos[0]
    })
    return esc
  }, [acordeonGltf.scene])

  React.useEffect(() => { (window as any).__pm = { scene, acordeon } }) // MEDICION TEMPORAL

  // Acción del personaje pausada en frame 0 = pose de agarre (manos sobre el acordeón). Queda
  // FIJA: nunca se escruba, así la mano de bajos no se mueve ni deforma.
  const closeAction = React.useRef<THREE.AnimationAction | null>(null)

  // Malla(s) del acordeón con morph 'Cerrar' (fuelle + caja de bajos + botones I). Contrato de
  // acordeon-personaje-v2 (horneado del PACK): geometría base (peso 0) = estado de AGARRE,
  // peso 1 = CERRADO total contra el cuerpo. (Trae también 'Abrir' = abierto total, sin usar.)
  const morphCerrar = React.useRef<Array<{ mesh: THREE.Mesh; idx: number }>>([])
  const closeDur = React.useRef(1)
  // Calibración por personaje: restW = peso del morph que pone la caja EXACTO bajo la mano real
  // (proyección sobre el eje de deslizamiento; ≈0 si la mano calza con el agarre horneado), y
  // handFactor escala la acción de la mano (horneada con el viaje del fino, 22.5cm) al viaje
  // real de la caja al cerrar ((1-restW) × deslizamiento del morph).
  const restW = React.useRef(0)
  const handFactor = React.useRef(1)

  // Dedos del rig mixamo: mixamorig{R/L}Hand{Index/Middle/Ring/Pinky/Thumb}{1..4}
  // (GLTFLoader elimina ':' de los nombres). La punta es la falange 4; si el rig no la
  // tiene (Pelao), se usa la 3 como punta.
  const fingerData = React.useRef<Record<string, { joints: THREE.Object3D[]; rests: THREE.Quaternion[]; tip: THREE.Object3D | null }>>({})
  const fingerPress = React.useRef<Record<string, number>>({})
  const botones = React.useRef<Record<string, { mesh: THREE.Mesh; orig: THREE.Vector3; sink: THREE.Vector3; mat: any; emisivoBase: THREE.Color }>>({})
  const notaAMesh = React.useRef<Record<string, string>>({})
  const notasActivas = React.useRef<Set<string>>(new Set())
  const accMats = React.useRef<Array<{ part: string; mat: any }>>([])
  const [listo, setListo] = React.useState(0)

  // Acoplar el acordeón compartido al personaje. La pieza 'parrilla' del acordeón se hace coincidir
  // EXACTAMENTE con el marco 'AnclaAcordeon' (matriz mundial de la parrilla en la pose de agarre,
  // exportada desde Blender). Pero el acordeón NO se cuelga del ancla estática: se cuelga del HUESO
  // del pecho 'mixamorig:Spine2' — igual que en Blender, donde el Empty del acordeón está
  // bone-parented a Spine2. Así, en CUALQUIER animación (baile, inclinación del torso), el acordeón
  // rueda con el pecho junto al brazo de bajos → la mano nunca se despega de la caja.
  React.useLayoutEffect(() => {
    const ancla = scene.getObjectByName('AnclaAcordeon')
    const parrilla = acordeon.getObjectByName('parrilla')
    if (!ancla || !parrilla) return
    let spine2: THREE.Object3D | null = null
    scene.traverse((o: any) => { if (!spine2 && o.isBone && /Spine2$/.test(o.name || '')) spine2 = o })

    // El GLB no carga en la pose de agarre: la acción 'Cierre' (frame 0 = agarre) la aplica el
    // mixer. Hay que posar el esqueleto al agarre ANTES de muestrear Spine2, o el offset que pega
    // el acordeón al pecho se calcula contra la pose equivocada (el acordeón quedaría corrido).
    const clipGrip = animations?.[0]
    const aGrip = clipGrip ? actions?.[clipGrip.name] : null
    if (aGrip) { aGrip.reset(); aGrip.play(); aGrip.paused = true; aGrip.time = 0 }
    if (mixer) mixer.update(0)
    scene.updateMatrixWorld(true)
    acordeon.position.set(0, 0, 0)
    acordeon.quaternion.identity()
    acordeon.scale.set(1, 1, 1)
    acordeon.updateMatrixWorld(true)
    // Mundo deseado del acordeón en reposo: que su 'parrilla' caiga sobre el marco del ancla.
    // (con el acordeón en identidad, parrilla.matrixWorld = marco local de la parrilla).
    const mundoDeseado = ancla.matrixWorld.clone().multiply(parrilla.matrixWorld.clone().invert())

    // Padre = el hueso del pecho si existe; si no (acordeón sin rig de personaje), cae al ancla.
    const padre: THREE.Object3D = spine2 ?? ancla
    // Local respecto al padre = inv(padreMundo) · mundoDeseado. Matriz directa (NO decompose): la
    // inversa de un marco con escala no uniforme tiene shear que position/quaternion/scale no
    // representan (~2cm de error si se descompone).
    const local = padre.matrixWorld.clone().invert().multiply(mundoDeseado)
    padre.add(acordeon)
    acordeon.matrixAutoUpdate = false
    acordeon.matrix.copy(local)
    acordeon.matrixWorldNeedsUpdate = true
    return () => { padre.remove(acordeon); acordeon.matrixAutoUpdate = true }
  }, [scene, acordeon, animations, actions, mixer])

  // Setup: acción de cierre + huesos de dedos + botones + morphs del acordeón.
  React.useEffect(() => {
    fingerData.current = {}
    fingerPress.current = {}
    botones.current = {}
    morphCerrar.current = []

    // Acción 'Cierre' del personaje: frame 0 = pose de agarre; a lo largo de la acción la MANO de
    // bajos se traslada siguiendo el deslizamiento de la caja (horneado con el MISMO vector que el
    // morph). Se reproduce PAUSADA y se escruba con Q junto al morph → la mano va pegada a la caja.
    const clip = animations?.[0]
    const a = clip ? actions?.[clip.name] : null
    if (a) {
      a.reset(); a.play(); a.paused = true; a.time = 0
      closeAction.current = a
      closeDur.current = a.getClip().duration
    }
    if (mixer) mixer.update(0)

    // --- Personaje: huesos de dedos ---
    scene.traverse((o: any) => {
      if (!o.isBone) return
      const nm: string = o.name || ''
      const mp = nm.match(/^mixamorig:?(Right|Left)Hand(Index|Middle|Ring|Pinky|Thumb)([1-4])$/)
      if (!mp) return
      const finger = `${mp[1] === 'Right' ? 'R' : 'L'}_${mp[2] === 'Middle' ? 'Mid' : mp[2]}`
      const fd = (fingerData.current[finger] ||= { joints: [], rests: [], tip: null })
      const n = +mp[3]
      if (n <= 3) { fd.joints[n - 1] = o; fd.rests[n - 1] = o.quaternion.clone() }
      else fd.tip = o
    })
    for (const fd of Object.values(fingerData.current)) {
      if (!fd.tip) fd.tip = fd.joints[2] || null // rigs sin falange 4 (Pelao)
    }

    // --- Acordeón compartido: morphs 'Cerrar' + botones ---
    const dMeshes: THREE.Mesh[] = []
    const iMeshes: THREE.Mesh[] = []
    const box = new THREE.Box3()
    acordeon.traverse((o: any) => {
      if (!o.isMesh) return
      const dict = o.morphTargetDictionary
      if (dict && dict.Cerrar !== undefined) morphCerrar.current.push({ mesh: o, idx: dict.Cerrar })
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const mm of mats) if (mm && /fuelle/i.test(mm.name || '')) mm.side = THREE.DoubleSide
      // Normaliza el nombre del nodo (quita prefijo de export ACC_, sufijo _m, y .00X) para casar
      // con las claves de NOTA_BOTON / BOTON_DEDO.
      const base: string = (o.name || '').replace(/^ACC_/, '').replace(/\.\d+$/, '').replace(/_m$/, '')
      if (/^Boton_D_\d+$/.test(base)) { o.userData.botonBase = base; dMeshes.push(o) }
      if (/^Boton_I_\d+$/.test(base)) { o.userData.botonBase = base; iMeshes.push(o) }
    })

    // Hundido = normal del teclado hacia ADENTRO (lejos de cámara), por grupo melodía/bajos.
    scene.updateMatrixWorld(true)
    const camPos = new THREE.Vector3(); camera.getWorldPosition(camPos)
    const setupGrupo = (meshes: THREE.Mesh[]) => {
      if (!meshes.length) return
      const centros = meshes.map((m) => box.setFromObject(m).getCenter(new THREE.Vector3()))
      const cen = new THREE.Vector3(); centros.forEach((c) => cen.add(c)); cen.multiplyScalar(1 / centros.length)
      const normal = normalPlano(centros)
      if (normal.dot(cen.clone().sub(camPos)) < 0) normal.negate()
      meshes.forEach((m) => {
        const wbb = box.setFromObject(m)
        const ws = wbb.getSize(new THREE.Vector3())
        const depth = (Math.min(ws.x, ws.y, ws.z) || 0.01) * 0.75
        const pW = new THREE.Vector3(); m.getWorldPosition(pW)
        const pWmov = pW.clone().add(normal.clone().multiplyScalar(depth))
        const sink = m.parent!.worldToLocal(pWmov).sub(m.position)
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material).clone()
        m.material = mat
        const matEmisivo = mat as any
        const emisivoBase = matEmisivo.emissive ? matEmisivo.emissive.clone() : new THREE.Color(0x000000)
        botones.current[(m.userData as any).botonBase] = { mesh: m, orig: m.position.clone(), sink, mat, emisivoBase }
      })
    }
    setupGrupo(dMeshes); setupGrupo(iMeshes)
    notaAMesh.current = NOTA_BOTON

    // --- Calibración mano↔caja (por personaje) ---
    // Relación canónica de Blender (PACK/Modelados): la mano de bajos vive PEGADA a la caja en
    // su marco local en OFFSET_GRIP (verificado 0.00cm durante toda la animación del fuelle).
    // El morph 'Cerrar' desliza la caja del agarre (0) al cerrado (1) en línea recta D. Se
    // resuelve restW = proyección de la mano real (acción en t=0) sobre D (≈0 si calza exacto).
    // Se prueban ambas convenciones de ejes del export (Blender vs Y-up) y gana la de menor error.
    restW.current = 0
    handFactor.current = 1
    const OFFSETS_GRIP = [new THREE.Vector3(4.1304, -0.8721, 0.1669), new THREE.Vector3(4.1304, -0.1669, -0.8721)]
    let manoBone: THREE.Object3D | null = null
    scene.traverse((o: any) => { if (!manoBone && o.isBone && /LeftHand$/.test(o.name || '')) manoBone = o })
    const cajaCal = morphCerrar.current.find(({ mesh }) => /Caja_de_los_bajos/.test(mesh.name))
    if (a && manoBone && cajaCal) {
      const g: any = cajaCal.mesh.geometry
      const delta = g.morphAttributes?.position?.[cajaCal.idx]
      if (delta) {
        // D = deslizamiento total de la caja (promedio del delta del morph) en MUNDO
        const dLocal = new THREE.Vector3()
        const n = Math.min(delta.count, 300)
        for (let i = 0; i < n; i++) dLocal.add(new THREE.Vector3(delta.getX(i), delta.getY(i), delta.getZ(i)))
        dLocal.multiplyScalar(1 / n)
        a.time = 0; mixer.update(0); scene.updateMatrixWorld(true)
        const e = cajaCal.mesh.matrixWorld.elements
        const D = new THREE.Vector3(
          e[0] * dLocal.x + e[4] * dLocal.y + e[8] * dLocal.z,
          e[1] * dLocal.x + e[5] * dLocal.y + e[9] * dLocal.z,
          e[2] * dLocal.x + e[6] * dLocal.y + e[10] * dLocal.z,
        )
        const H = new THREE.Vector3()
        ;(manoBone as THREE.Object3D).getWorldPosition(H)
        const dd = D.lengthSq()
        if (dd > 1e-8) {
          let mejor = { err: Infinity, w: 0 }
          for (const off of OFFSETS_GRIP) {
            const grip0 = off.clone().applyMatrix4(cajaCal.mesh.matrixWorld)
            const rel = H.clone().sub(grip0)
            const w = THREE.MathUtils.clamp(rel.dot(D) / dd, 0, 1)
            const err = rel.sub(D.clone().multiplyScalar(w)).length()
            if (err < mejor.err) mejor = { err, w }
          }
          restW.current = mejor.w
          // viaje de la mano según la acción completa (horneada con el recorrido del fino)
          const p0 = new THREE.Vector3(), p1 = new THREE.Vector3()
          ;(manoBone as THREE.Object3D).getWorldPosition(p0)
          a.time = closeDur.current; mixer.update(0); scene.updateMatrixWorld(true)
          ;(manoBone as THREE.Object3D).getWorldPosition(p1)
          a.time = 0; mixer.update(0); scene.updateMatrixWorld(true)
          const viajeMano = p0.distanceTo(p1)
          // al cerrar (q=1) la caja viaja (1-restW)×|D|; la mano debe viajar lo mismo
          if (viajeMano > 1e-4) handFactor.current = Math.min(1, ((1 - restW.current) * Math.sqrt(dd)) / viajeMano)
        }
      }
    }
  }, [scene, acordeon, actions, animations, mixer])

  // Materiales del acordeón por pieza (cuerpo/botones/fuelle/pack/parte botones) → pieles.
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
  }, [skin, listo])

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
    // CIERRE = acción 'Cierre' del personaje (brazo izquierdo pegado a la tapa, IK horneado)
    // + morph 'Cerrar' del acordeón compartido, ambos escrubados por el MISMO q.
    const tCerrar = fuelleAbiertoRef.current ? CIERRE_MAX : 0
    qRef.current = THREE.MathUtils.damp(qRef.current, tCerrar, 9, delta)
    if (Math.abs(qRef.current - tCerrar) < 0.001) qRef.current = tCerrar
    const q = qRef.current
    // Q escruba JUNTOS: la acción de la mano (escalada por handFactor para aterrizar en la caja)
    // y el morph 'Cerrar' del acordeón (v2: 0 = agarre, 1 = cerrado, igual que el cierre del
    // PACK-BAILES). Reposo (q=0) = agarre calibrado (restW≈0); Q (q=1) = cerrado total.
    if (closeAction.current) closeAction.current.time = q * closeDur.current * handFactor.current
    if (mixer) mixer.update(0)
    const w = restW.current + (1 - restW.current) * q
    for (const { mesh, idx } of morphCerrar.current) {
      if (mesh.morphTargetInfluences) mesh.morphTargetInfluences[idx] = w
    }

    // Dedos POR HUESOS: el dedo del botón pisado APUNTA a ese botón y se flexiona (pisada).
    const fingerTarget: Record<string, string> = {}
    notasActivas.current.forEach((btn) => { const f = BOTON_DEDO[btn]; if (f && botones.current[btn]) fingerTarget[f] = btn })
    for (const [finger, fd] of Object.entries(fingerData.current)) {
      const btn = fingerTarget[finger]
      const press = THREE.MathUtils.damp(fingerPress.current[finger] ?? 0, btn ? 1 : 0, 12, delta)
      fingerPress.current[finger] = press
      for (let i = 0; i < fd.joints.length; i++) if (fd.joints[i]) fd.joints[i].quaternion.copy(fd.rests[i])
      if (press > 0.01 && btn && fd.tip && fd.joints[0]) {
        const base = fd.joints[0]
        base.updateWorldMatrix(true, true)
        const b = botones.current[btn]
        b.mesh.getWorldPosition(_btnPos)
        base.getWorldPosition(_bonePos); fd.tip.getWorldPosition(_tipPos)
        _dirCur.subVectors(_tipPos, _bonePos); _dirTar.subVectors(_btnPos, _bonePos)
        if (_dirCur.lengthSq() > 1e-8 && _dirTar.lengthSq() > 1e-8) {
          _dirCur.normalize(); _dirTar.normalize()
          _qRot.setFromUnitVectors(_dirCur, _dirTar)
          _qRot.slerp(_qIdent, 1 - press)
          base.getWorldQuaternion(_qBoneW)
          base.parent!.getWorldQuaternion(_qParentW).invert()
          base.quaternion.copy(_qParentW).multiply(_qRot).multiply(_qBoneW)
        }
        _curlQ.setFromAxisAngle(CURL_AXIS, CURL_ANGLE * press)
        for (let i = 1; i < fd.joints.length; i++) if (fd.joints[i]) fd.joints[i].quaternion.copy(fd.rests[i]).multiply(_curlQ)
      }
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

useGLTF.preload(PERSONAJES[0].archivo)
useGLTF.preload(ACORDEON_GLB)

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
  const [personajeId, setPersonajeId] = React.useState(PERSONAJES[0].id)
  const glbActual = (PERSONAJES.find((p) => p.id === personajeId) ?? PERSONAJES[0]).archivo

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
    <div className="visor-personaje-stage">
      <div className="visor-personaje-lienzo">
        <Canvas camera={{ position: [0, 1.3, 3.6], fov: 35 }} dpr={[1, 1.25]}>
          <React.Suspense fallback={null}>
            <EnvmapLocal />
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 6, 5]} intensity={1.0} />
            <directionalLight position={[-5, 3, -3]} intensity={0.4} />
            <Bounds fit clip margin={1.05}>
              <Center>
                <Modelo key={personajeId} fuelleAbiertoRef={fuelleAbiertoRef} skin={skin} glb={glbActual} />
              </Center>
            </Bounds>
            {/* Control tipo Blender: orbitar (clic izq), encuadrar/pan (clic der), zoom (scroll). */}
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
      </div>

      {/* Dock de controles DEBAJO del canvas (no tapa al personaje). */}
      <div className="visor-personaje-dock">
        <div className="visor-personaje-cards">
          {PERSONAJES.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`visor-personaje-card ${personajeId === p.id ? 'activo' : ''}`}
              onClick={() => setPersonajeId(p.id)}
              title={p.nombre}
            >
              <img src={p.foto} alt={p.nombre} loading="lazy" />
              <span>{p.nombre}</span>
              {/* Vista previa grande al hacer hover */}
              <span className="visor-personaje-zoom" aria-hidden="true">
                <img src={p.foto} alt="" loading="lazy" />
                <em>{p.nombre}</em>
              </span>
            </button>
          ))}
        </div>

        <div className="visor-personaje-dock-der">
          <button
            type="button"
            className={`visor-personaje-fuelle-btn ${abierto ? 'activo' : ''}`}
            onPointerDown={() => { fuelleAbiertoRef.current = true; setAbierto(true) }}
            onPointerUp={() => { fuelleAbiertoRef.current = false; setAbierto(false) }}
            onPointerLeave={() => { if (abierto) { fuelleAbiertoRef.current = false; setAbierto(false) } }}
          >
            <kbd>Q</kbd> Cerrar fuelle
          </button>

          <div className="visor-personaje-pieles-dock">
            <span className="visor-personaje-pieles-label">Acordeón</span>
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
    </div>
  )
}

export default VisorPersonaje3D
