'use client'
import * as React from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, OrbitControls, Bounds, Center } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

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

// Configuración de las 3 animaciones programáticas.
// El fuelle NO se traslada nunca — solo se deforma via la shape key Cerr_uniforme.
// influMax = valor máximo de la influencia del morph target durante la animación
// (0 = abierto, 1 = totalmente cerrado).
const PROG_CONFIG: Record<AnimProgramaticaId, { duracion: number; influMax: number; loop: boolean }> = {
  Tocar_Suave:  { duracion: 1.20, influMax: 0.15, loop: false },
  Tocar_Fuerte: { duracion: 0.75, influMax: 0.45, loop: false },
  Respira:      { duracion: 2.80, influMax: 0.25, loop: true  },
}

// Contracción que produce cada shape key sobre el extremo derecho del fuelle.
// Medidos en Blender comparando bbox de Basis vs cada shape key al peso máximo.
const CONTRACCION_UNIFORME_X = 0.95
const CONTRACCION_ABAJO_X = 0.034
const CONTRACCION_ARRIBA_X = 0.033

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
        nombre === 'Caja izquierda del acordeon, bajos' ||
        nombre === 'marco Fuelle 2' ||
        /^Boton_I_\d+$/.test(nombre)
      if (esLadoBajos) {
        if (obj.userData.origX === undefined) obj.userData.origX = obj.position.x
        if (!ladoBajosObjects.current.includes(obj)) ladoBajosObjects.current.push(obj)
      }
      if (nombre === 'Caja izquierda del acordeon, bajos') {
        cajaBajosCentroRef.current = obj
      }
      if (nombre === 'Caja botones principales') {
        cajaBotonesPrincipalesRef.current = obj
      }
    })
    setMeshes(lista)

    // Calcular OFFSET LOCAL de hundimiento por cada boton (para el pulse).
    // Estrategia: en world, el vector "hacia adentro" = centro_caja − centro_boton
    // normalizado. La magnitud es chica (~7% del lado mas corto del boton, que es la
    // altura visible del boton). Convertimos el punto destino (centro_boton + dirWorld*mag)
    // a coordenadas LOCALES del PADRE del mesh y guardamos el delta respecto al originalPos.
    // Asi el desplazamiento es robusto al escalado/rotacion del grupo (Bounds, Center).
    const tmpCajaCenter = new THREE.Vector3()
    const tmpBotonCenter = new THREE.Vector3()
    const box = new THREE.Box3()

    const centroCajaD = cajaBotonesPrincipalesRef.current
      ? box.setFromObject(cajaBotonesPrincipalesRef.current).getCenter(tmpCajaCenter.clone())
      : null
    const centroCajaI = cajaBajosCentroRef.current
      ? box.setFromObject(cajaBajosCentroRef.current).getCenter(tmpCajaCenter.clone())
      : null

    const _qInv = new THREE.Quaternion()
    lista.forEach((m) => {
      if (m.userData.hundirOffset) return
      const esD = m.name.startsWith('Boton_D_')
      const esI = m.name.startsWith('Boton_I_')
      if (!esD && !esI) return
      const centroCaja = esD ? centroCajaD : centroCajaI
      if (!centroCaja || !m.parent) return

      // Centro del boton en world
      box.setFromObject(m).getCenter(tmpBotonCenter)
      const dirWorld = new THREE.Vector3().subVectors(centroCaja, tmpBotonCenter)
      if (dirWorld.lengthSq() < 1e-6) return
      dirWorld.normalize()

      // Magnitud: 50% de la altura del cilindro del boton (el lado mas chico del bbox).
      // Es bien visible — el boton se "mete" hasta la mitad en la caja durante el pulse.
      const size = box.getSize(new THREE.Vector3())
      const magnitud = Math.min(size.x, size.y, size.z) * 0.5

      // Convertir el VECTOR direccion de world a local del padre (solo rotacion inversa).
      // Como el GLB v2 viene con todos los meshes apply-transformed, sus vertices estan en
      // world position y mesh.position queda en (0,0,0). El offset que aplicamos al pulse
      // es un DELTA de translation desde la posicion original, asi que solo necesitamos
      // expresar la direccion en local space del padre.
      m.parent.getWorldQuaternion(_qInv).invert()
      const dirLocal = dirWorld.clone().applyQuaternion(_qInv)
      m.userData.hundirOffset = dirLocal.multiplyScalar(magnitud)
    })

    // Debug temporal: confirmar qué piezas se detectaron como lado bajos.
    // Si el marco Fuelle 2 no aparece en este log, el problema es la detección.
    if (typeof window !== 'undefined') {
      console.log('[Visor3D] lado bajos detectados:',
        ladoBajosObjects.current.map((o) => o.name))
    }

    onMallasDetectadas(lista.map((m) => ({ nombre: m.name, grupo: grupoDePieza(m.name) })))
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

    // 4) Contracción total = suma de contracciones de cada shape key activa.
    //    Define cuánto se ha movido el extremo derecho del fuelle hacia -X.
    let contraccionTotal = 0
    if (fuelle?.morphTargetInfluences && fuelle.morphTargetDictionary) {
      const infl = fuelle.morphTargetInfluences
      const dict = fuelle.morphTargetDictionary
      const uni = infl[dict['Cerr_uniforme'] ?? -1] ?? 0
      const ab = infl[dict['Cerr_abajo'] ?? -1] ?? 0
      const ar = infl[dict['Cerr_arriba'] ?? -1] ?? 0
      contraccionTotal += uni * CONTRACCION_UNIFORME_X
      contraccionTotal += ab * CONTRACCION_ABAJO_X
      contraccionTotal += ar * CONTRACCION_ARRIBA_X
    }
    // Snap final: si contraccionTotal es chiquito, el marco se queda en su posición
    // ORIGINAL exacta — fijo, no flotando un pelo.
    if (Math.abs(contraccionTotal) < SNAP_EPS) contraccionTotal = 0

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

    // Mover el lado bajos (caja + marco fuelle 2 + 12 botones I) por -contraccionTotal
    // en X. Si un objeto de ese grupo está siendo pulsado, sumamos también su offset de
    // hundimiento para que ambos efectos se vean al mismo tiempo.
    for (const obj of ladoBajosObjects.current) {
      // Capturar origX/origPos DEFENSIVAMENTE si todavía no se hizo (puede ser que
      // el objeto entró al lado bajos pero no era mesh y no llegó a setear originalPos).
      if (obj.userData.origX === undefined) obj.userData.origX = obj.position.x
      if (!obj.userData.originalPos) obj.userData.originalPos = obj.position.clone()
      const origX = obj.userData.origX as number
      const origPos = obj.userData.originalPos as THREE.Vector3
      const hundirOffset = (pulseMeshName === obj.name)
        ? obj.userData.hundirOffset as THREE.Vector3 | undefined
        : undefined
      obj.position.x = origX - contraccionTotal + (hundirOffset ? hundirOffset.x * pulseFactor : 0)
      obj.position.y = origPos.y + (hundirOffset ? hundirOffset.y * pulseFactor : 0)
      obj.position.z = origPos.z + (hundirOffset ? hundirOffset.z * pulseFactor : 0)
    }

    // Debug: una vez cada ~2 segundos, log las posiciones del marco y caja bajos.
    // Esto nos dice si el código mueve correctamente o no.
    const debugRef = fuelle?.userData as { _debugT?: number } | undefined
    if (debugRef) {
      debugRef._debugT = (debugRef._debugT ?? 0) + delta
      if (debugRef._debugT >= 2) {
        debugRef._debugT = 0
        const marco = ladoBajosObjects.current.find((o) => o.name === 'marco Fuelle 2')
        const caja = ladoBajosObjects.current.find((o) => o.name === 'Caja izquierda del acordeon, bajos')
        const boton = ladoBajosObjects.current.find((o) => o.name === 'Boton_I_01')
        // eslint-disable-next-line no-console
        console.log('[Visor3D] frame state',
          'contraccion:', contraccionTotal.toFixed(4),
          'marco.x:', marco?.position.x.toFixed(4),
          'caja.x:', caja?.position.x.toFixed(4),
          'boton.x:', boton?.position.x.toFixed(4),
          'ladoBajos count:', ladoBajosObjects.current.length,
        )
      }
    }

    // 4) Pulse del click para piezas que NO son del lado bajos (botones D, otras piezas).
    if (pulse.current) {
      const mesh = scene.getObjectByName(pulseMeshName!) as THREE.Mesh | undefined
      const esLadoBajos = mesh ? ladoBajosObjects.current.includes(mesh) : false
      if (mesh && !esLadoBajos) {
        const offsetLocal = mesh.userData.hundirOffset as THREE.Vector3 | undefined
        const origPos = mesh.userData.originalPos as THREE.Vector3 | undefined

        if (offsetLocal && origPos) {
          mesh.position.x = origPos.x + offsetLocal.x * pulseFactor
          mesh.position.y = origPos.y + offsetLocal.y * pulseFactor
          mesh.position.z = origPos.z + offsetLocal.z * pulseFactor
        } else {
          // Pieza generica (caja, marco, fuelle): mini-flash emissive azul.
          const mat = mesh.material as THREE.MeshStandardMaterial
          if (mat && (mat as any).isMeshStandardMaterial) {
            mat.emissive.set('#60a5fa')
            mat.emissiveIntensity = pulseFactor * 0.9
            mat.needsUpdate = true
          }
        }
      }
    }
    // Cleanup del pulse cuando termina su duracion.
    if (pulse.current && pulse.current.t >= 0.14) {
      const mesh = scene.getObjectByName(pulse.current.mesh) as THREE.Mesh | undefined
      if (mesh) {
        const esLadoBajos = ladoBajosObjects.current.includes(mesh)
        if (!esLadoBajos && mesh.userData.originalPos) {
          // Piezas no-lado-bajos: restaurar position. Las del lado bajos las maneja el loop.
          mesh.position.copy(mesh.userData.originalPos as THREE.Vector3)
        }
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
      <Canvas camera={{ position: [0, 1.2, 6], fov: 32 }} dpr={[1, 1.8]}>
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
