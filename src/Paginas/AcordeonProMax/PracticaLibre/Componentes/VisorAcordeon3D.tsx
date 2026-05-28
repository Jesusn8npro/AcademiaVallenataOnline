'use client'
import * as React from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, OrbitControls, Bounds, Center } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { subscribirNotas } from '../../../../Core/audio/emisorNotasAcordeon'

// v3 — re-exportado con export_yup=False (mantener Z-up de Blender) para evitar que
// el exporter agregue rotaciones residuales en los nodos. La conversion Z-up→Y-up la
// hacemos en three.js con un <group rotation={[-Math.PI/2, 0, 0]}> alrededor del modelo.
// Cache-buster ?v=N — bumpear cada vez que se re-exporta el GLB.
const GLB_PATH = '/modelos3d/acordeon-pro-max-v3.glb?v=4'

useGLTF.setDecoderPath('/draco/')

// Anim de shape key (vienen del GLB, deforman pliegues).
export type AnimShapeKeyId = 'Fuelle_Uniforme' | 'Fuelle_Abajo' | 'Fuelle_Arriba'
// Anim programática (escala el fuelle como bloque rígido + mueve cajas, no deforma).
export type AnimProgramaticaId = 'Tocar_Suave' | 'Tocar_Fuerte' | 'Respira'
export type Anim3DId = AnimShapeKeyId | AnimProgramaticaId

export interface MaterialPieza {
  tinta: string
  roughness: number
  metalness: number
  // El GLB viene con texturas baked (color/metallic/roughness). Mientras el usuario
  // no cambia nada, mostramos esas texturas para que se vea como en Blender. Cuando
  // aplica un color o un acabado, quitamos los maps de ese mesh para que el cambio
  // se vea limpio.
  usarTexturaOriginal?: boolean
}

export function grupoDePieza(nombre: string): string {
  if (nombre === 'Fuelle') return 'fuelle'
  if (nombre === 'marco Fuelle 2' || nombre === 'Marco Derecho') return 'marcos'
  if (nombre === 'Caja izquierda del acordeon, bajos') return 'caja-bajos'
  if (nombre === 'Caja botones principales') return 'caja-melodia'
  if (nombre === 'Diapason') return 'diapason'
  if (nombre.startsWith('Boton_D_')) return 'botones-melodia'
  if (nombre.startsWith('Boton_I_')) return 'botones-bajos'
  if (nombre.startsWith('Tornillo_')) return 'tornillos'
  if (nombre === 'Marco parrilla' || nombre === 'Tela parrilla'
   || nombre === 'Celdas parrilla' || nombre === 'Cube_011') return 'parrilla'
  return 'otros'
}

export interface InfoPieza { nombre: string; grupo: string }

// three.js GLTFLoader SANEA los nombres de nodo (PropertyBinding.sanitizeNodeName):
// reemplaza espacios por '_' y elimina los chars reservados de animación [].:/ — así
// "Caja izquierda del acordeon, bajos" llega a la escena como
// "Caja_izquierda_del_acordeon,_bajos". Por eso buscar por el nombre con espacios fallaba
// (la caja de bajos, el marco y la caja de melodía nunca se encontraban). Saneamos el
// nombre buscado para que coincida con el real.
const sanitizar = (s: string) => s.replace(/\s/g, '_').replace(/[[\].:/]/g, '')

// Convierte el id lógico que emite useLogicaAcordeon (ej. "1-5-halar",
// "1-3-empujar-bajo") en la clave espacial de un botón 3D. La dirección del fuelle
// (halar/empujar) no cambia QUÉ botón es, así que la descartamos: el mismo botón físico
// suena distinto al abrir/cerrar. Melodía → "${fila}-${i}", bajos → "bajo-${fila}-${i}".
function keyDeId(idBoton: string): string {
  let s = idBoton
  let bajo = false
  if (s.endsWith('-bajo')) { bajo = true; s = s.slice(0, -5) }
  s = s.replace(/-halar$/, '').replace(/-empujar$/, '')
  return bajo ? `bajo-${s}` : s
}

// Configuración de las 3 animaciones programáticas.
// El fuelle NO se traslada nunca — solo se deforma via la shape key Cerr_uniforme.
// influMax = valor máximo de la influencia del morph target durante la animación
// (0 = abierto, 1 = totalmente cerrado).
const PROG_CONFIG: Record<AnimProgramaticaId, { duracion: number; influMax: number; loop: boolean }> = {
  Tocar_Suave:  { duracion: 1.20, influMax: 0.15, loop: false },
  Tocar_Fuerte: { duracion: 0.75, influMax: 0.45, loop: false },
  Respira:      { duracion: 2.80, influMax: 0.25, loop: true  },
}

interface ModeloProps {
  materialPorMesh: Record<string, MaterialPieza>
  piezaSeleccionada: string | null
  onClickPieza: (nombre: string) => void
  onMallasDetectadas: (piezas: InfoPieza[]) => void
  fuelleCerrandoRef: React.MutableRefObject<boolean>
  animShapeKey: { id: AnimShapeKeyId; epoch: number } | null
  animProgramatica: { id: AnimProgramaticaId; epoch: number } | null
  pulseEpoch: { mesh: string; epoch: number } | null
}

function Modelo({
  materialPorMesh, piezaSeleccionada, onClickPieza, onMallasDetectadas,
  fuelleCerrandoRef, animShapeKey, animProgramatica, pulseEpoch,
}: ModeloProps) {
  const grupo = React.useRef<THREE.Group>(null!)
  const { scene } = useGLTF(GLB_PATH) as any

  const [meshes, setMeshes] = React.useState<THREE.Mesh[]>([])

  // Refs a piezas que se mueven con el fuelle (busqueda flexible por substring).
  const fuelleMesh = React.useRef<THREE.Mesh | null>(null)
  // TODO el lado bajos (caja bajos + marco Fuelle 2 + 12 botones I_*) se mueve como un
  // grupo siguiendo el extremo derecho del fuelle. Sin esto la caja se desliza pero los
  // botones quedan flotando en el aire.
  const ladoBajosObjects = React.useRef<THREE.Object3D[]>([])
  // Cajas que sirven de "centro" para calcular la direccion de hundimiento de los botones.
  const cajaBotonesPrincipalesRef = React.useRef<THREE.Object3D | null>(null)
  const cajaBajosCentroRef = React.useRef<THREE.Object3D | null>(null)
  // Transformación medida del extremo del fuelle (cara del lado bajos) por cada morph:
  // t = traslación media de la cara, w = vector de rotación (eje·ángulo) que mide cuánto
  // se INCLINA la cara (cierre abajo/arriba la inclinan, uniforme no). C0 = centro de la
  // cara = pivote del giro. El lado bajos sigue esta transformación rígida cada frame, así
  // queda pegado Y se inclina igual que el fuelle.
  const fuelleEdgeDeltasRef = React.useRef<{
    C0: THREE.Vector3
    u: { t: THREE.Vector3; w: THREE.Vector3 }
    a: { t: THREE.Vector3; w: THREE.Vector3 }
    r: { t: THREE.Vector3; w: THREE.Vector3 }
  } | null>(null)
  // Mapeo nota lógica → nombre de mesh del botón 3D (ej. "1-5" → "Boton_D_07",
  // "bajo-1-3" → "Boton_I_02"). Se arma por posición en la detección. notasActivasRef
  // guarda los nombres de mesh actualmente pisados (vía emisorNotasAcordeon). botonesDRef
  // cachea los botones de melodía para hundirlos cada frame.
  const notaAMeshRef = React.useRef<Record<string, string>>({})
  const notasActivasRef = React.useRef<Set<string>>(new Set())
  const botonesDRef = React.useRef<THREE.Mesh[]>([])
  const edgeDeltaTmp = React.useRef(new THREE.Vector3())
  const rotVecTmp = React.useRef(new THREE.Vector3())
  const rotAxisTmp = React.useRef(new THREE.Vector3())
  const quatTmp = React.useRef(new THREE.Quaternion())
  const pivTmp = React.useRef(new THREE.Vector3())
  const hundirTmp = React.useRef(new THREE.Vector3())

  React.useEffect(() => {
    const lista: THREE.Mesh[] = []
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        lista.push(obj)
        if (!obj.userData.preparado) {
          if (obj.material) obj.material = obj.material.clone()
          obj.userData.originalScale = obj.scale.clone()
          obj.userData.originalPos = obj.position.clone()
          // Guardamos las texturas baked originales para poder restaurarlas si el
          // usuario vuelve al color "Original".
          const mat = obj.material as THREE.MeshStandardMaterial | undefined
          if (mat && (mat as any).isMeshStandardMaterial) {
            obj.userData.texOrig = {
              map: mat.map ?? null,
              metalnessMap: mat.metalnessMap ?? null,
              roughnessMap: mat.roughnessMap ?? null,
              baseColor: mat.color.clone(),
              baseRoughness: mat.roughness,
              baseMetalness: mat.metalness,
            }
          }
          obj.userData.preparado = true
        }
      }
      // Búsqueda flexible: case-insensitive + substring. Cubre nombres que cambien
      // ligeramente entre Blender y el GLB exportado.
      const n = (obj.name ?? '').toLowerCase()
      if (n === 'fuelle' && obj.isMesh) fuelleMesh.current = obj
      // Detectar TODO el lado bajos por NOMBRE EXACTO para evitar ambigüedades.
      // Estos son los objetos que se mueven juntos con el extremo derecho del fuelle.
      const nombre = obj.name ?? ''
      const esLadoBajos =
        nombre === sanitizar('Caja izquierda del acordeon, bajos') ||
        nombre === sanitizar('marco Fuelle 2') ||
        /^Boton_I_\d+$/.test(nombre)
      if (esLadoBajos) {
        if (!ladoBajosObjects.current.includes(obj)) ladoBajosObjects.current.push(obj)
      }
      if (nombre === sanitizar('Caja izquierda del acordeon, bajos')) {
        cajaBajosCentroRef.current = obj
      }
      if (nombre === sanitizar('Caja botones principales')) {
        cajaBotonesPrincipalesRef.current = obj
      }
    })
    setMeshes(lista)

    // ── Botones: hundimiento perpendicular + mapeo nota→mesh ──────────────────────────
    const box = new THREE.Box3()
    const centrarMesh = (m: THREE.Mesh) => box.setFromObject(m).getCenter(new THREE.Vector3())
    const tamMesh = (m: THREE.Mesh) => box.setFromObject(m).getSize(new THREE.Vector3())

    const centroCajaD = cajaBotonesPrincipalesRef.current
      ? centrarMesh(cajaBotonesPrincipalesRef.current as THREE.Mesh) : null
    const centroCajaI = cajaBajosCentroRef.current
      ? centrarMesh(cajaBajosCentroRef.current as THREE.Mesh) : null

    // Agrupar botones por X (cada fila comparte X). El primer cluster SIEMPRE se crea.
    const clusterPorX = (items: Array<{ m: THREE.Mesh; c: THREE.Vector3 }>) => {
      const ordenados = [...items].sort((a, b) => a.c.x - b.c.x)
      const clusters: Array<Array<{ m: THREE.Mesh; c: THREE.Vector3 }>> = []
      let prevX = -Infinity
      for (const it of ordenados) {
        if (clusters.length === 0 || it.c.x - prevX > 0.05) clusters.push([])
        clusters[clusters.length - 1].push(it)
        prevX = it.c.x
      }
      return clusters // ordenados por X ascendente
    }
    const dMeshes = lista.filter((m) => /^Boton_D_\d+$/.test(m.name))
    const iMeshes = lista.filter((m) => /^Boton_I_\d+$/.test(m.name))
    botonesDRef.current = dMeshes
    const filasMel = clusterPorX(dMeshes.map((m) => ({ m, c: centrarMesh(m) })))
    const filasBajo = clusterPorX(iMeshes.map((m) => ({ m, c: centrarMesh(m) })))

    // NORMAL del teclado = dirección de hundimiento real (perpendicular a la superficie de
    // botones). Antes promediábamos "boton→centro caja", que da una diagonal y hacía que los
    // botones se "corrieran". En cambio: normal = rowDir × colDir, donde rowDir es el eje entre
    // filas y colDir el eje a lo largo de una fila. La firmamos hacia el centro de la caja para
    // que apunte HACIA ADENTRO (el botón se mete en su agujero, no se desliza).
    const centroide = (fila: Array<{ c: THREE.Vector3 }>) =>
      fila.reduce((acc, it) => acc.add(it.c), new THREE.Vector3()).multiplyScalar(1 / fila.length)
    const normalDeFilas = (
      filas: Array<Array<{ m: THREE.Mesh; c: THREE.Vector3 }>>,
      centroCaja: THREE.Vector3 | null,
    ): THREE.Vector3 | null => {
      if (filas.length < 2 || !centroCaja) return null
      const filaLarga = filas.reduce((a, b) => (b.length > a.length ? b : a))
      if (filaLarga.length < 2) return null
      const colSorted = [...filaLarga].sort((a, b) => a.c.y - b.c.y)
      const colDir = new THREE.Vector3().subVectors(
        colSorted[colSorted.length - 1].c, colSorted[0].c)
      const rowDir = new THREE.Vector3().subVectors(
        centroide(filas[filas.length - 1]), centroide(filas[0]))
      const normal = new THREE.Vector3().crossVectors(rowDir, colDir)
      if (normal.lengthSq() < 1e-9) return null
      normal.normalize()
      // Firmar la normal para que el hundimiento entre el botón en su agujero. Empíricamente,
      // por cómo el GLB viene apply-transformed + la rotación del grupo, el sentido que se ve
      // "hacia adentro" es el OPUESTO al centro de la caja: usamos la normal que apunta en
      // contra de haciaCaja.
      const haciaCaja = new THREE.Vector3().subVectors(centroCaja, filaLarga[0].c)
      if (normal.dot(haciaCaja) > 0) normal.negate()
      return normal
    }
    const normalD = normalDeFilas(filasMel, centroCajaD)
    const normalI = normalDeFilas(filasBajo, centroCajaI)

    // Pasar la normal world → local del padre de los botones (sólo rotación inversa: el GLB
    // viene apply-transformed, mesh.position=(0,0,0) y el hundimiento es un DELTA de posición).
    const _qInv = new THREE.Quaternion()
    const padreBotones = (dMeshes[0] ?? iMeshes[0])?.parent
    if (padreBotones) padreBotones.getWorldQuaternion(_qInv).invert()
    const normalDLocal = normalD ? normalD.clone().applyQuaternion(_qInv) : null
    const normalILocal = normalI ? normalI.clone().applyQuaternion(_qInv) : null
    const asignarHundir = (meshes: THREE.Mesh[], normalLocal: THREE.Vector3 | null) => {
      if (!normalLocal) return
      meshes.forEach((m) => {
        const s = tamMesh(m)
        // Magnitud = 50% de la altura del botón (lado más chico del bbox): se mete hasta
        // la mitad en su agujero durante el pulse/nota.
        const mag = Math.min(s.x, s.y, s.z) * 0.5
        m.userData.hundirOffset = normalLocal.clone().multiplyScalar(mag)
      })
    }
    asignarHundir(dMeshes, normalDLocal)
    asignarHundir(iMeshes, normalILocal)

    // Mapeo POSICIONAL nota→mesh. Conteos 3D = filas lógicas: melodía 10/11/10 =
    // primeraFila/segundaFila/terceraFila, bajos 6/6 = una/dos. Filas por X ascendente →
    // prefijos "1","2","3"; índice dentro de la fila por Y descendente.
    const mapa: Record<string, string> = {}
    filasMel.forEach((fila, iFila) => {
      const pre = String(iFila + 1)
      ;[...fila].sort((a, b) => b.c.y - a.c.y).forEach((it, i) => {
        mapa[`${pre}-${i + 1}`] = it.m.name
      })
    })
    filasBajo.forEach((fila, iFila) => {
      const pre = String(iFila + 1)
      ;[...fila].sort((a, b) => b.c.y - a.c.y).forEach((it, i) => {
        mapa[`bajo-${pre}-${i + 1}`] = it.m.name
      })
    })
    notaAMeshRef.current = mapa

    // Desplazamiento REAL del extremo del fuelle (cara del lado bajos) por cada morph,
    // medido directamente de la geometria del GLB. Los morphs de glTF son DELTAS relativos,
    // asi que el delta promedio de los vertices de esa cara ES el desplazamiento que sufre.
    // El lado bajos seguira este vector cada frame → queda SIEMPRE pegado al fuelle en
    // cualquier morph (uniforme/abajo/arriba) sin constantes medidas a ojo.
    const f = fuelleMesh.current
    if (f && f.morphTargetDictionary) {
      const geo = f.geometry as THREE.BufferGeometry
      const pos = geo.attributes.position
      const morphs = geo.morphAttributes.position
      let maxX = -Infinity
      for (let i = 0; i < pos.count; i++) maxX = Math.max(maxX, pos.getX(i))
      const EPS_CARA = 0.02
      const capIdx: number[] = []
      for (let i = 0; i < pos.count; i++) if (pos.getX(i) >= maxX - EPS_CARA) capIdx.push(i)

      // Centroide de la cara = pivote del giro.
      const C0 = new THREE.Vector3()
      const pv = new THREE.Vector3()
      for (const idx of capIdx) { pv.fromBufferAttribute(pos, idx); C0.add(pv) }
      if (capIdx.length) C0.multiplyScalar(1 / capIdx.length)

      // Para cada morph descomponemos el campo de desplazamiento de la cara en
      // traslación media (t) + rotación rígida (w, vector eje·ángulo) por mínimos
      // cuadrados: delta_i ≈ t + w × (P_i − C0). Resolviendo B·w = c con
      // B = Σ(|r|²I − r·rᵀ) y c = Σ(r × (delta_i − t)). Así "abajo"/"arriba" producen
      // un w no nulo (la cara se inclina) y "uniforme" un w ≈ 0 (solo traslada).
      const rigidoDeMorph = (key: string): { t: THREE.Vector3; w: THREE.Vector3 } => {
        const mi = f.morphTargetDictionary![key]
        const attr = mi !== undefined && morphs ? morphs[mi] : undefined
        const t = new THREE.Vector3()
        const w = new THREE.Vector3()
        if (!attr || capIdx.length === 0) return { t, w }
        const d = new THREE.Vector3()
        for (const idx of capIdx) { d.fromBufferAttribute(attr, idx); t.add(d) }
        t.multiplyScalar(1 / capIdx.length)
        let B00 = 0, B11 = 0, B22 = 0, B01 = 0, B02 = 0, B12 = 0, cx = 0, cy = 0, cz = 0
        const r = new THREE.Vector3()
        const dd = new THREE.Vector3()
        for (const idx of capIdx) {
          pv.fromBufferAttribute(pos, idx); r.copy(pv).sub(C0)
          dd.fromBufferAttribute(attr, idx); dd.sub(t)
          B00 += r.y * r.y + r.z * r.z
          B11 += r.x * r.x + r.z * r.z
          B22 += r.x * r.x + r.y * r.y
          B01 -= r.x * r.y; B02 -= r.x * r.z; B12 -= r.y * r.z
          cx += r.y * dd.z - r.z * dd.y
          cy += r.z * dd.x - r.x * dd.z
          cz += r.x * dd.y - r.y * dd.x
        }
        const m = new THREE.Matrix3().set(B00, B01, B02, B01, B11, B12, B02, B12, B22)
        w.set(cx, cy, cz).applyMatrix3(m.invert())
        return { t, w }
      }

      fuelleEdgeDeltasRef.current = {
        C0,
        u: rigidoDeMorph('Cerr_uniforme'),
        a: rigidoDeMorph('Cerr_abajo'),
        r: rigidoDeMorph('Cerr_arriba'),
      }
    }

    onMallasDetectadas(lista.map((m) => ({ nombre: m.name, grupo: grupoDePieza(m.name) })))

    // DEBUG TEMPORAL: volcar posiciones WORLD reales de las piezas clave.
    if (typeof window !== 'undefined') {
      ;(window as any).__visor = { scene, fuelle: fuelleMesh.current, ladoBajos: ladoBajosObjects.current, ed: fuelleEdgeDeltasRef.current, notaAMesh: notaAMeshRef.current, notasActivas: notasActivasRef.current }
      const bb = new THREE.Box3()
      const nombres = ['Fuelle', 'marco Fuelle 2', 'Caja izquierda del acordeon, bajos',
        'Boton_I_01', 'Boton_I_06', 'Boton_I_12', 'Caja botones principales', 'Boton_D_01']
      const filas = nombres.map((nm) => {
        const o = scene.getObjectByName(nm)
        if (!o) return `${nm}: NO ENCONTRADO`
        bb.setFromObject(o)
        const wp = o.getWorldPosition(new THREE.Vector3())
        return `${nm} | worldBBoxX[${bb.min.x.toFixed(3)},${bb.max.x.toFixed(3)}] | localPos[${o.position.x.toFixed(3)},${o.position.y.toFixed(3)},${o.position.z.toFixed(3)}] | worldPos[${wp.x.toFixed(3)},${wp.y.toFixed(3)},${wp.z.toFixed(3)}]`
      })
      const ed = fuelleEdgeDeltasRef.current
      // eslint-disable-next-line no-console
      console.log('[Visor3D DEBUG]\n' + filas.join('\n')
        + `\nC0=${ed?.C0.toArray().map((x) => +x.toFixed(3))}`
        + `\nu t=${ed?.u.t.toArray().map((x) => +x.toFixed(3))} w=${ed?.u.w.toArray().map((x) => +x.toFixed(4))}`
        + `\na t=${ed?.a.t.toArray().map((x) => +x.toFixed(3))} w=${ed?.a.w.toArray().map((x) => +x.toFixed(4))}`
        + `\nr t=${ed?.r.t.toArray().map((x) => +x.toFixed(3))} w=${ed?.r.w.toArray().map((x) => +x.toFixed(4))}`
        + `\nladoBajos detectados (${ladoBajosObjects.current.length}): ${ladoBajosObjects.current.map((o) => o.name).join(', ')}`)
    }
  }, [scene, onMallasDetectadas])

  // UN SOLO useEffect que aplica TODO: color, roughness, metalness, mapas y emissive
  // del highlight. Si la cfg tiene usarTexturaOriginal !== false (o sea: estado default
  // sin custom del usuario), restauramos las texturas baked del GLB. Si el usuario
  // aplico un color/acabado, quitamos los mapas para que el cambio se vea limpio.
  React.useEffect(() => {
    meshes.forEach((mesh) => {
      const cfg = materialPorMesh[mesh.name]
                ?? materialPorMesh[grupoDePieza(mesh.name)]
                ?? materialPorMesh['todos']
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat || !(mat as any).isMeshStandardMaterial) return
      const orig = mesh.userData.texOrig as {
        map: THREE.Texture | null
        metalnessMap: THREE.Texture | null
        roughnessMap: THREE.Texture | null
        baseColor: THREE.Color
        baseRoughness: number
        baseMetalness: number
      } | undefined

      const conTextura = cfg?.usarTexturaOriginal !== false
      if (conTextura && orig) {
        // Estado "con textura": restauramos los maps baked y permitimos que el cfg
        // tintee la textura (mat.color se MULTIPLICA con el map). Asi el default puede
        // arrancar con un crema marfil cálido en lugar de blanco plano.
        mat.map = orig.map
        mat.metalnessMap = orig.metalnessMap
        mat.roughnessMap = orig.roughnessMap
        mat.color.set(cfg?.tinta ?? '#ffffff')
        mat.roughness = cfg?.roughness ?? orig.baseRoughness
        mat.metalness = cfg?.metalness ?? orig.baseMetalness
      } else if (cfg) {
        // Estado "Custom": quitamos los mapas para que el color y el acabado pegados
        // desde el panel se vean sin filtrar por la textura baked.
        mat.map = null
        mat.metalnessMap = null
        mat.roughnessMap = null
        mat.color.set(cfg.tinta)
        mat.roughness = cfg.roughness
        mat.metalness = cfg.metalness
      }
      // Highlight de pieza seleccionada via emissive azul tenue (a menos que haya pulse activo).
      const enPulse = pulse.current?.mesh === mesh.name
      if (!enPulse) {
        if (mesh.name === piezaSeleccionada) {
          mat.emissive.set('#3b82f6')
          mat.emissiveIntensity = 0.45
        } else {
          mat.emissive.set('#000000')
          mat.emissiveIntensity = 0
        }
      }
      mat.needsUpdate = true
    })
  }, [materialPorMesh, piezaSeleccionada, meshes])

  // Animaciones de shape keys (Cerrar uniforme/abajo/arriba) — controladas MANUALMENTE.
  // NO usamos las actions del GLB porque useAnimations las deja con valores residuales
  // en los morph influences cuando terminan, lo que desplazaba el lado bajos sin razón.
  // Aquí guardamos un timer por shape key; cada frame calculamos sin(phase * PI) →
  // 0 → 1 → 0 limpio. Cuando termina, el ref vuelve a null y el influence queda en 0.
  const animShapeKeyRef = React.useRef<{ id: AnimShapeKeyId; t: number } | null>(null)
  const DURACION_SHAPE_KEY_ANIM = 1.4 // segundos del ciclo cierre→apertura

  React.useEffect(() => {
    if (!animShapeKey) return
    animShapeKeyRef.current = { id: animShapeKey.id, t: 0 }
  }, [animShapeKey])

  // Animación programática (Tocar suave/fuerte/Respira). Solo toca Cerr_uniforme.
  const animProgRef = React.useRef<{ id: AnimProgramaticaId; t: number } | null>(null)
  React.useEffect(() => {
    if (!animProgramatica) {
      animProgRef.current = null
      return
    }
    animProgRef.current = { id: animProgramatica.id, t: 0 }
  }, [animProgramatica])

  // Pulse al click (escala + flash emissive amarillo brillante).
  const pulse = React.useRef<{ mesh: string; t: number } | null>(null)
  React.useEffect(() => {
    if (pulseEpoch) pulse.current = { mesh: pulseEpoch.mesh, t: 0 }
  }, [pulseEpoch])

  // Suscripción a las notas reales del acordeón: cuando se pisa/suelta un botón (teclado,
  // click 2D, MIDI, pista) marcamos/desmarcamos su mesh 3D para que se hunda en useFrame.
  React.useEffect(() => {
    const off = subscribirNotas((e) => {
      const nombreMesh = notaAMeshRef.current[keyDeId(e.idBoton)]
      if (!nombreMesh) return
      if (e.accion === 'down') notasActivasRef.current.add(nombreMesh)
      else notasActivasRef.current.delete(nombreMesh)
    })
    return off
  }, [])

  useFrame((_, delta) => {
    const fuelle = fuelleMesh.current

    // El fuelle NUNCA se traslada ni se escala. Solo se DEFORMA via shape keys.
    // CONTROL MANUAL DE LOS 3 MORPH INFLUENCES — sin depender de las actions del GLB,
    // que dejaban valores residuales y causaban que el lado bajos se moviera sin razón.
    // Cuando ninguna animación está activa, los tres influences quedan en 0 limpio.

    // 1) Cerr_uniforme: max(Q damped, programática, animación shapekey "Fuelle_Uniforme")
    let influPrograma = 0
    if (animProgRef.current) {
      const cfg = PROG_CONFIG[animProgRef.current.id]
      animProgRef.current.t += delta
      const phase = cfg.loop
        ? (animProgRef.current.t % cfg.duracion) / cfg.duracion
        : Math.min(animProgRef.current.t / cfg.duracion, 1)
      const sin = Math.sin(phase * Math.PI) // 0 → 1 → 0
      influPrograma = cfg.influMax * sin
      if (!cfg.loop && animProgRef.current.t >= cfg.duracion) {
        animProgRef.current = null
        influPrograma = 0
      }
    }

    // 2) Animaciones de shapekey controladas manualmente: Fuelle_Uniforme/Abajo/Arriba.
    //    Cada una produce un sin(phase * PI) que va 0 → 1 → 0 y termina dejando el
    //    influence EXACTAMENTE en 0 (no residual).
    let influShapeUniforme = 0
    let influShapeAbajo = 0
    let influShapeArriba = 0
    if (animShapeKeyRef.current) {
      animShapeKeyRef.current.t += delta
      const phase = Math.min(animShapeKeyRef.current.t / DURACION_SHAPE_KEY_ANIM, 1)
      const valor = Math.sin(phase * Math.PI) // 0 → 1 → 0
      if (animShapeKeyRef.current.id === 'Fuelle_Uniforme') influShapeUniforme = valor
      if (animShapeKeyRef.current.id === 'Fuelle_Abajo')    influShapeAbajo    = valor
      if (animShapeKeyRef.current.id === 'Fuelle_Arriba')   influShapeArriba   = valor
      if (animShapeKeyRef.current.t >= DURACION_SHAPE_KEY_ANIM) {
        animShapeKeyRef.current = null
      }
    }

    // 3) Aplicar los 3 morph influences. SIEMPRE escribimos un valor explícito.
    //    Snap a 0 cuando los valores son insignificantes (< 0.002): así el damping de
    //    Q termina en 0 EXACTO en lugar de quedar en 0.0001 residual. Sin esto, el
    //    marco se movía un pelo cada frame eternamente tras soltar Q.
    const SNAP_EPS = 0.002
    if (fuelle?.morphTargetInfluences && fuelle.morphTargetDictionary) {
      const dict = fuelle.morphTargetDictionary
      const targetQ = fuelleCerrandoRef.current ? 1 : 0
      let valorQ = THREE.MathUtils.damp(
        (fuelle.userData.valorQ as number | undefined) ?? 0, targetQ, 12, delta,
      )
      if (Math.abs(valorQ - targetQ) < SNAP_EPS) valorQ = targetQ
      fuelle.userData.valorQ = valorQ

      const snap = (v: number) => (Math.abs(v) < SNAP_EPS ? 0 : v)
      const setInflu = (key: string, valor: number) => {
        const idx = dict[key]
        if (idx !== undefined) fuelle.morphTargetInfluences![idx] = snap(valor)
      }
      setInflu('Cerr_uniforme', Math.max(valorQ, influPrograma, influShapeUniforme))
      setInflu('Cerr_abajo',    influShapeAbajo)
      setInflu('Cerr_arriba',   influShapeArriba)
    }

    // 4) Desplazamiento REAL del extremo del fuelle = combinación lineal de los
    //    desplazamientos medidos de cada morph activo (calculados en la detección).
    //    El lado bajos seguirá ESTE vector, así queda siempre pegado al fuelle.
    const edgeDelta = edgeDeltaTmp.current.set(0, 0, 0)
    const rotVec = rotVecTmp.current.set(0, 0, 0)
    const deltas = fuelleEdgeDeltasRef.current
    if (deltas && fuelle?.morphTargetInfluences && fuelle.morphTargetDictionary) {
      const infl = fuelle.morphTargetInfluences
      const dict = fuelle.morphTargetDictionary
      const uni = infl[dict['Cerr_uniforme'] ?? -1] ?? 0
      const ab = infl[dict['Cerr_abajo'] ?? -1] ?? 0
      const ar = infl[dict['Cerr_arriba'] ?? -1] ?? 0
      edgeDelta.addScaledVector(deltas.u.t, uni)
      edgeDelta.addScaledVector(deltas.a.t, ab)
      edgeDelta.addScaledVector(deltas.r.t, ar)
      rotVec.addScaledVector(deltas.u.w, uni)
      rotVec.addScaledVector(deltas.a.w, ab)
      rotVec.addScaledVector(deltas.r.w, ar)
    }
    // El vector de rotación (rotVec) representa eje·ángulo; lo convertimos a quaternion.
    // El cierre uniforme da rotVec≈0 → quaternion identidad (solo traslación).
    const angulo = rotVec.length()
    const qR = quatTmp.current
    if (angulo > 1e-5) {
      qR.setFromAxisAngle(rotAxisTmp.current.copy(rotVec).divideScalar(angulo), angulo)
    } else {
      qR.identity()
    }

    // Calcular pulse (hundimiento) ANTES de mover el lado bajos, para combinarlos.
    let pulseFactor = 0
    let pulseMeshName: string | null = null
    if (pulse.current) {
      pulse.current.t += delta
      const duracion = 0.14
      const phase = Math.min(pulse.current.t / duracion, 1)
      const factor = phase < 0.35
        ? phase / 0.35
        : 1 - (phase - 0.35) / 0.65
      pulseFactor = Math.sin(factor * Math.PI * 0.5)
      pulseMeshName = pulse.current.mesh
    }

    // Factor de hundimiento por nota sostenida (0..1) con damping: 1 mientras la nota está
    // pisada, vuelve a 0 al soltarla. Se guarda por mesh en userData.hundirFactor.
    const sinkFactor = (obj: THREE.Object3D) => {
      const activo = notasActivasRef.current.has(obj.name)
      // Ataque INSTANTÁNEO al pisar (cero latencia: salta a 1 en el frame de la nota) y
      // release suave al soltar (damping). Así el botón reacciona en el momento exacto.
      let f: number
      if (activo) {
        f = 1
      } else {
        f = THREE.MathUtils.damp((obj.userData.hundirFactor as number | undefined) ?? 0, 0, 26, delta)
        if (f < 0.004) f = 0
      }
      obj.userData.hundirFactor = f
      return f
    }

    // Mover el lado bajos (caja + marco fuelle 2 + 12 botones I) siguiendo el extremo del
    // fuelle (edgeDelta). Todos parten de su posición original (0,0,0 baked) y se trasladan
    // por el MISMO vector → quedan rígidos entre sí Y pegados al fuelle. Si un objeto del
    // grupo está pulsado, sumamos su hundimiento encima.
    const C0 = deltas ? deltas.C0 : null
    for (const obj of ladoBajosObjects.current) {
      if (!obj.userData.originalPos) obj.userData.originalPos = obj.position.clone()
      if (!obj.userData.originalQuat) obj.userData.originalQuat = obj.quaternion.clone()
      const origPos = obj.userData.originalPos as THREE.Vector3
      const origQuat = obj.userData.originalQuat as THREE.Quaternion
      // Rotación rígida del lado bajos: qR (inclinación del extremo del fuelle) compuesta
      // con la orientación original de cada objeto.
      obj.quaternion.copy(qR).multiply(origQuat)
      // Posición: rotamos la posición original alrededor del pivote C0 (centroide del
      // extremo del fuelle) y luego trasladamos por edgeDelta. Así la caja queda pegada
      // al fuelle Y se inclina igual que su cara.
      const piv = pivTmp.current
      if (C0) piv.copy(origPos).sub(C0).applyQuaternion(qR).add(C0).add(edgeDelta)
      else piv.copy(origPos).add(edgeDelta)
      // Hundimiento = max(nota sostenida, pulse del click), rotado por qR para hundirse
      // perpendicular a la caja inclinada.
      const hundirOffset = obj.userData.hundirOffset as THREE.Vector3 | undefined
      if (hundirOffset) {
        const factor = Math.max(sinkFactor(obj), pulseMeshName === obj.name ? pulseFactor : 0)
        if (factor > 0) {
          piv.add(hundirTmp.current.copy(hundirOffset).applyQuaternion(qR).multiplyScalar(factor))
        }
      }
      obj.position.copy(piv)
    }

    // Hundir botones de melodía (Boton_D): no se mueven con el fuelle, sólo se hunden.
    // factor = max(nota sostenida, pulse del click). Al soltar, el damping los devuelve.
    for (const m of botonesDRef.current) {
      const offset = m.userData.hundirOffset as THREE.Vector3 | undefined
      const origPos = m.userData.originalPos as THREE.Vector3 | undefined
      if (!offset || !origPos) continue
      const factor = Math.max(sinkFactor(m), pulseMeshName === m.name ? pulseFactor : 0)
      m.position.set(
        origPos.x + offset.x * factor,
        origPos.y + offset.y * factor,
        origPos.z + offset.z * factor,
      )
    }

    // Pulse del click para piezas GENÉRICAS (caja, marco, fuelle): mini-flash emissive azul.
    // Los botones (con hundirOffset) ya se hunden en los loops de arriba.
    if (pulse.current) {
      const mesh = scene.getObjectByName(pulseMeshName!) as THREE.Mesh | undefined
      const esLadoBajos = mesh ? ladoBajosObjects.current.includes(mesh) : false
      if (mesh && !esLadoBajos && !mesh.userData.hundirOffset) {
        const mat = mesh.material as THREE.MeshStandardMaterial
        if (mat && (mat as any).isMeshStandardMaterial) {
          mat.emissive.set('#60a5fa')
          mat.emissiveIntensity = pulseFactor * 0.9
          mat.needsUpdate = true
        }
      }
    }
    // Cleanup del pulse cuando termina su duracion (sólo restaura emissive; las posiciones
    // de los botones las gobiernan los loops cada frame).
    if (pulse.current && pulse.current.t >= 0.14) {
      const mesh = scene.getObjectByName(pulse.current.mesh) as THREE.Mesh | undefined
      if (mesh) {
        const mat = mesh.material as THREE.MeshStandardMaterial | undefined
        if (mat && (mat as any).isMeshStandardMaterial) {
          if (mesh.name === piezaSeleccionada) {
            mat.emissive.set('#3b82f6')
            mat.emissiveIntensity = 0.45
          } else {
            mat.emissive.set('#000000')
            mat.emissiveIntensity = 0
          }
        }
      }
      pulse.current = null
    }
  })

  const onClickMesh = React.useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if ((e.object as any)?.name) onClickPieza((e.object as any).name)
  }, [onClickPieza])

  return <primitive ref={grupo} object={scene} onClick={onClickMesh} />
}

useGLTF.preload(GLB_PATH)

// Envmap procedural local (sin descargas externas): RoomEnvironment + PMREMGenerator.
// Reemplaza al <Environment preset="studio"> de drei que descargaba un HDRI de un CDN
// que estaba fallando con "Failed to fetch" y reventaba el Canvas.
const EnvmapLocal: React.FC = () => {
  const { gl, scene } = useThree()
  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const roomEnv = new RoomEnvironment()
    const envTex = pmrem.fromScene(roomEnv, 0.04).texture
    scene.environment = envTex
    return () => {
      envTex.dispose()
      pmrem.dispose()
      scene.environment = null
    }
  }, [gl, scene])
  return null
}

interface VisorAcordeon3DProps {
  materialPorMesh: Record<string, MaterialPieza>
  piezaSeleccionada: string | null
  onClickPieza: (nombre: string) => void
  onMallasDetectadas: (piezas: InfoPieza[]) => void
  fuelleCerrandoRef: React.MutableRefObject<boolean>
  animShapeKey: { id: AnimShapeKeyId; epoch: number } | null
  animProgramatica: { id: AnimProgramaticaId; epoch: number } | null
  pulseEpoch: { mesh: string; epoch: number } | null
}

const VisorAcordeon3D: React.FC<VisorAcordeon3DProps> = (props) => {
  return (
    <div className="visor-acordeon-3d-stage">
      <Canvas camera={{ position: [0, 1.2, 6], fov: 32 }} dpr={[1, 1.25]}>
        <React.Suspense fallback={null}>
          {/* Envmap procedural local — indispensable para que el acabado "Cromo" /
              metalness alto se vea como un metal real (sin esto se ven negros porque
              no tienen nada que reflejar). NO descarga nada de la red. */}
          <EnvmapLocal />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 6, 5]} intensity={0.9} />
          <directionalLight position={[-5, 3, -3]} intensity={0.35} />
          <directionalLight position={[0, -4, 4]} intensity={0.2} />
          {/* Bounds SIN `observe`: fit/center se aplican una sola vez al cargar. Si dejamos
              observe, cada vez que un boton se hunde y vuelve, Bounds re-fitea el modelo
              entero y reorganiza las piezas — el usuario lo vio como "se daña todo al
              presionar un boton tras hacer zoom". */}
          <Bounds fit clip margin={1.15}>
            <Center>
              {/* Conversion Z-up (Blender) → Y-up (three.js): rotacion -90° X.
                  El GLB v3 fue exportado con export_yup=False para que no metiera
                  rotaciones residuales por nodo (que rompian al marco Fuelle 2). */}
              <group rotation={[-Math.PI / 2, 0, 0]}>
                <Modelo {...props} />
              </group>
            </Center>
          </Bounds>
          <OrbitControls makeDefault enablePan={false} minDistance={2.5} maxDistance={12} />
        </React.Suspense>
      </Canvas>
    </div>
  )
}

export default VisorAcordeon3D
