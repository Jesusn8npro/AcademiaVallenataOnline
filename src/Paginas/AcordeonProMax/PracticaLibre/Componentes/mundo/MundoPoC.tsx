'use client'
import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh'

// BVH: acelera el raycast de colisiones contra la malla del escenario (~100× más rápido). Se parchea
// una sola vez a nivel de módulo. El collider se construye al cargar el escenario (ver EscenarioGLB).
;(THREE.BufferGeometry.prototype as any).computeBoundsTree = computeBoundsTree
;(THREE.BufferGeometry.prototype as any).disposeBoundsTree = disposeBoundsTree
;(THREE.Mesh.prototype as any).raycast = acceleratedRaycast
import { PERSONAJES } from '../../personajes'
import { Modelo } from '../visor/Modelo'
import { usePersonajeEstudio } from '../../contextoPersonajeEstudio'
import { useUsuario } from '../../../../../contextos/UsuarioContext'
import { subscribirNotas } from '../../../../../Core/audio/emisorNotasAcordeon'
import { useLogicaAcordeon } from '../../../../../Core/hooks/useLogicaAcordeon'
import { motorAudioPro } from '../../../../../Core/audio/AudioEnginePro'
import { useMultijugador, EstadoJugador, RemotoEntry, NotaRemotaCb } from './useMultijugador'
import { useReto } from './useReto'
import { ESCENARIOS_MUNDO, ESCENARIO_MUNDO_DEFAULT, escenarioMundoPorId, EscenarioMundoDef, AsientoDef, VISTAS } from './escenariosMundo'
import PanelReto from './PanelReto'
import DueloSimulador from './DueloSimulador'
import DueloSimuladorDesktop from './DueloSimuladorDesktop'
import TocarEnVivo from './TocarEnVivo'

// SimuladorApp (el acordeón móvil real) se carga BAJO DEMANDA: solo al abrir "Tocar" en táctil. Se
// monta como OVERLAY dentro del mundo (NO se navega) → el mundo sigue montado, la sesión multijugador
// sigue viva y los demás te oyen/ven tocar. Trae su propia detección de horizontal/“gira el teléfono”.
const SimuladorApp = React.lazy(() => import('../../../../SimuladorApp/SimuladorApp'))

// Mundo multijugador con MODO CAMINANTE profesional. Controlador desacoplado (PlayerController) que
// SOLO mueve/gira la cámara cuando isNavigationMode está activo (pointer-lock) → no choca con la
// interacción del acordeón. Movimiento con velocidad AMORTIGUADA (damp) = fluido, sin saltos. Cámara
// orbital 3ª persona controlada por el mouse (360°), con rueda para acercar hasta 1ª persona. Colisión
// suave con otros usuarios (se encuentran sin bloquearse). URL: /test-mundo-3d.

const VEL = 4.2           // m/s objetivo al caminar
const RUN_MULT = 1.9      // multiplicador de velocidad al CORRER (Shift en PC / botón en móvil)
const SALTO_SPEED = 1.0     // velocidad NATIVA del clip 'Salto vacano' (30fps)
// SALTO = SOLO ANIMACIÓN, EN EL SITIO: al pulsar Saltar se reproduce el clip 'Salto vacano' tal cual (como
// en Blender), SIN lanzar al avatar hacia arriba con gravedad (antes ese "saltico" de gravedad se veía poco
// natural). Dura SALTO_DUR_MS y vuelve a idle. La GRAVEDAD se mantiene SOLO para CAER por bordes/escalones.
const SALTO_DUR_MS = 1300   // largo del clip 'Salto vacano' a velocidad nativa 1.0 (la cadera sube 0.97→1.79m horneado en Blender)
const GRAVITY = 12          // gravedad (m/s²) — solo para caídas por bordes, NO para saltar
const ACCEL = 11          // lambda de damp de la velocidad (aceleración/desaceleración suave)
const FACE_RATE = 9       // suavizado del giro del cuerpo hacia el movimiento (más bajo = giro más natural)
const MOUSE_SENS = 0.0024 // sensibilidad del mouse (pointer-lock)
const PITCH_MIN = -0.25, PITCH_MAX = 1.15
const DIST_MIN = 0.5, DIST_MAX = 11, DIST_DEF = 4.6
const TARGET_H = 1.35     // altura del punto que mira la cámara (pecho/cabeza)
const SEP = 0.85          // distancia mínima entre jugadores (separación suave, no bloquea)
const LIMITE = 70
const HEAD_LIMITE = 1.2   // tope del head-look (~69°); igual al de useHeadLook
const BODY_TURN_RATE = 6  // qué tan rápido el cuerpo se endereza cuando miras más allá del tope
const INTERP_RATE = 13    // suavizado de interpolación de remotos (más alto = más responsivo, menos lag)
const PLAYER_RAD = 0.34   // radio de la CÁPSULA de colisión del avatar (m)
const PLAYER_ALTURA = 1.7 // alto de la cápsula del avatar (m)
const STEP_UP = 0.4       // (detección de piso de remotos) escalón que se sube sin caer
const MAX_DROP = 6        // (detección de piso de remotos) caída máxima que sigue el piso
// Raycaster compartido (detección de piso de remotos + anti-vacío). firstHitOnly = primer impacto (rápido con BVH).
const _rayCol = new THREE.Raycaster()
;(_rayCol as any).firstHitOnly = true
const _colO = new THREE.Vector3()
const _colD = new THREE.Vector3()

// Altura del piso bajo (px,pz): raycast hacia ABAJO desde bien arriba contra el collider. El avatar se
// para sobre el primer suelo que encuentre (a cualquier altura → rampas/escalones/pisos elevados). null
// si no hay nada debajo (borde/hueco).
function alturaPiso(col: THREE.Mesh, px: number, pz: number, fromY: number, far: number): number | null {
  _colO.set(px, fromY, pz)
  _colD.set(0, -1, 0)
  _rayCol.set(_colO, _colD)
  _rayCol.far = far
  const hit = _rayCol.intersectObject(col, false)[0]
  return hit ? hit.point.y : null
}

// Altura del piso bajo el avatar: primero CERCA DE LOS PIES (desde la cabeza hacia abajo, con tolerancia
// de escalón) → sigue el suelo sin saltar a los techos cuando estás bajo cubierta. Si ahí no hay nada
// (recién apareció bajo el suelo, o borde), REUBICA desde muy arriba (encuentra el piso superior). null
// solo si no hay piso en ninguno de los dos.
function pisoBajoAvatar(col: THREE.Mesh, px: number, pz: number, yActual: number): number | null {
  const cerca = alturaPiso(col, px, pz, yActual + STEP_UP, STEP_UP + MAX_DROP)
  if (cerca !== null) return cerca
  return alturaPiso(col, px, pz, 300, 600)
}

// --- COLISIÓN POR CÁPSULA (robusta: el avatar NO atraviesa NADA, ni barandas ni elementos delgados) ---
const _capSeg = new THREE.Line3()
const _capBox = new THREE.Box3()
const _triPt = new THREE.Vector3()
const _capPt = new THREE.Vector3()
const _pushDir = new THREE.Vector3()
// Empuja la cápsula del avatar FUERA de toda penetración con la geometría del escenario (paredes, barandas,
// muebles, suelo). Recorre los triángulos cercanos por el BVH y, por cada uno que penetre, desplaza la
// cápsula la profundidad necesaria. Devuelve los pies corregidos + si quedó APOYADO (empuje hacia arriba=piso).
function resolverCapsula(col: THREE.Mesh, px: number, py: number, pz: number) {
  const bt = (col.geometry as any).boundsTree
  if (!bt) return { x: px, y: py, z: pz, apoyado: false }
  _capSeg.start.set(px, py + PLAYER_RAD, pz)
  _capSeg.end.set(px, py + PLAYER_ALTURA - PLAYER_RAD, pz)
  _capBox.makeEmpty()
  _capBox.expandByPoint(_capSeg.start); _capBox.expandByPoint(_capSeg.end); _capBox.expandByScalar(PLAYER_RAD)
  let apoyado = false
  bt.shapecast({
    intersectsBounds: (b: THREE.Box3) => b.intersectsBox(_capBox),
    intersectsTriangle: (tri: any) => {
      const dist = tri.closestPointToSegment(_capSeg, _triPt, _capPt)
      if (dist < PLAYER_RAD) {
        const depth = PLAYER_RAD - dist
        _pushDir.copy(_capPt).sub(_triPt)
        const len = _pushDir.length()
        if (len > 1e-6) {
          _pushDir.multiplyScalar(1 / len)
          _capSeg.start.addScaledVector(_pushDir, depth)
          _capSeg.end.addScaledVector(_pushDir, depth)
          if (_pushDir.y > 0.3) apoyado = true // empuje con componente hacia arriba = está sobre un piso
        }
      }
    },
  })
  return { x: _capSeg.start.x, y: _capSeg.start.y - PLAYER_RAD, z: _capSeg.start.z, apoyado }
}

// PRNG determinista (mulberry32).
function prng(seed: number) {
  let s = seed
  return () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function dampAngle(cur: number, target: number, lambda: number, dt: number) {
  let d = target - cur
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return cur + d * (1 - Math.exp(-lambda * dt))
}

// Normaliza un ángulo a (-π, π]. Para el desfase cabeza↔cuerpo del head-look.
function normAngle(a: number) {
  while (a > Math.PI) a -= Math.PI * 2
  while (a < -Math.PI) a += Math.PI * 2
  return a
}

// Posición de aparición DETERMINISTA a partir de un identificador estable (id de usuario): el mismo
// usuario cae SIEMPRE en el mismo punto del mapa (en cualquier dispositivo / al recargar), y usuarios
// distintos se reparten en un anillo (ángulo áureo) sin amontonarse en el centro. Antes era
// Math.random() por sesión → cada quien aparecía en un sitio distinto cada vez. Hash FNV-1a.
function spawnDeterminista(semilla: string): readonly [number, number] {
  let h = 2166136261
  for (let i = 0; i < semilla.length; i++) { h ^= semilla.charCodeAt(i); h = Math.imul(h, 16777619) }
  h >>>= 0
  const ang = (h % 100000) / 100000 * Math.PI * 2
  const rad = 6 + ((h >>> 13) % 700) / 100 // anillo 6..13 m del centro
  return [Math.cos(ang) * rad, Math.sin(ang) * rad] as const
}

// Escena: suelo + árboles + rocas + arbustos + flores + laguna. Low-poly, PRNG, centro libre.
function Escena() {
  const { arboles, rocas, arbustos, flores } = React.useMemo(() => {
    const rnd = prng(7)
    const enAnillo = (min: number) => { const a = rnd() * Math.PI * 2, r = min + rnd() * (LIMITE - min - 2); return [Math.cos(a) * r, Math.sin(a) * r] as [number, number] }
    const arboles: { p: [number, number]; h: number; r: number; c: number }[] = []
    for (let i = 0; i < 50; i++) arboles.push({ p: enAnillo(8), h: 2.4 + rnd() * 3.4, r: 0.9 + rnd() * 1.1, c: rnd() })
    const rocas: { p: [number, number]; s: number }[] = []
    for (let i = 0; i < 16; i++) rocas.push({ p: enAnillo(6), s: 0.4 + rnd() * 1.2 })
    const arbustos: { p: [number, number]; s: number; c: number }[] = []
    for (let i = 0; i < 22; i++) arbustos.push({ p: enAnillo(5), s: 0.5 + rnd() * 0.7, c: rnd() })
    const flores: { p: [number, number]; c: number }[] = []
    for (let i = 0; i < 30; i++) flores.push({ p: enAnillo(3), c: rnd() })
    return { arboles, rocas, arbustos, flores }
  }, [])
  const FLOR = ['#e85d75', '#f2c14e', '#7b8cde', '#e8743b', '#d36bd8']
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}><circleGeometry args={[LIMITE + 8, 80]} /><meshStandardMaterial color="#5f7d4a" roughness={1} metalness={0} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[18, 0.02, -14]}><circleGeometry args={[9, 48]} /><meshStandardMaterial color="#3f7fa6" roughness={0.3} metalness={0.1} /></mesh>
      {arboles.map((a, i) => (
        <group key={'t' + i} position={[a.p[0], 0, a.p[1]]}>
          <mesh position={[0, a.h * 0.28, 0]}><cylinderGeometry args={[0.16, 0.26, a.h * 0.56, 6]} /><meshStandardMaterial color="#6b4a2c" roughness={1} /></mesh>
          <mesh position={[0, a.h * 0.78, 0]}><coneGeometry args={[a.r, a.h, 7]} /><meshStandardMaterial color={a.c < 0.33 ? '#3f6b34' : a.c < 0.66 ? '#4c7d3f' : '#578a47'} roughness={1} /></mesh>
        </group>
      ))}
      {rocas.map((r, i) => (<mesh key={'r' + i} position={[r.p[0], r.s * 0.4, r.p[1]]} rotation={[r.s, r.s * 2, 0]}><dodecahedronGeometry args={[r.s, 0]} /><meshStandardMaterial color="#8a8f96" roughness={1} flatShading /></mesh>))}
      {arbustos.map((b, i) => (<mesh key={'b' + i} position={[b.p[0], b.s * 0.6, b.p[1]]}><icosahedronGeometry args={[b.s, 0]} /><meshStandardMaterial color={b.c < 0.5 ? '#4d7a3a' : '#5f9147'} roughness={1} flatShading /></mesh>))}
      {flores.map((f, i) => (
        <group key={'f' + i} position={[f.p[0], 0, f.p[1]]}>
          <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.02, 0.02, 0.36, 4]} /><meshStandardMaterial color="#3f6b34" /></mesh>
          <mesh position={[0, 0.4, 0]}><sphereGeometry args={[0.09, 6, 6]} /><meshStandardMaterial color={FLOR[Math.floor(f.c * FLOR.length)]} roughness={0.8} /></mesh>
        </group>
      ))}
    </group>
  )
}

// Escenario seleccionado: si tiene .glb lo carga (useGLTF + Draco), si no, el bosque procedural.
// El GLB ya viene con el piso en y=0 y centrado, a escala de metros (calza con el avatar de 1.7 m).
// Si construirColisiones, arma un único collider (geometría fusionada en espacio mundo + BVH) y lo
// publica en colliderRef → el PlayerController lo usa para que las paredes/muebles frenen al avatar.
interface PuertaCfg { pivot: THREE.Object3D; cx: number; cz: number; abierta: number }
function EscenarioGLB({ glb, escala = 1, construirColisiones, colliderRef, puertas, radioPuerta = 5, jugadorRef, onListo }: { glb: string; escala?: number; construirColisiones?: boolean; colliderRef?: React.MutableRefObject<THREE.Mesh | null>; puertas?: string[]; radioPuerta?: number; jugadorRef?: React.MutableRefObject<EstadoJugador>; onListo?: () => void }) {
  const { scene } = useGLTF(glb)
  // Clon para no mutar la escena cacheada por URL (mismo patrón que el estudio). Marca las mallas para
  // RECIBIR (y proyectar) sombra, y SUAVIZA el material: el modelo trae muchos paneles/displays EMISSIVE
  // que brillan blanco muy fuerte + mármol muy reflectivo → bajamos emissiveIntensity y envMapIntensity
  // (valores fijos = idempotente). Da el look más calmado sin re-exportar el .glb.
  const obj = React.useMemo(() => {
    const c = scene.clone(true)
    const calido = new THREE.Color('#c9a978') // beige cálido (estilo madera) para suavizar los blancos fuertes
    c.traverse((o: any) => {
      if (!o.isMesh) return
      o.receiveShadow = true; o.castShadow = true
      // Clonar los materiales: así NO mutamos los del caché de useGLTF (el tinte no se acumula al recargar).
      o.material = Array.isArray(o.material) ? o.material.map((m: any) => m.clone()) : o.material.clone()
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (!m) continue
        // APAGAR casi del todo los paneles/displays EMISSIVE (eran las "muchas luces" blancas muy fuertes).
        if (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) > 0.02) m.emissiveIntensity = Math.min(m.emissiveIntensity ?? 1, 0.06)
        if ('envMapIntensity' in m) m.envMapIntensity = 0.4 // menos reflejo del entorno (blanco menos quemado)
        // Suavizar los blancos MUY fuertes hacia un tono cálido tipo madera (no toca vidrio/metal).
        if (m.color && (m.metalness === undefined || m.metalness < 0.5) && !m.transparent) {
          const lum = (m.color.r + m.color.g + m.color.b) / 3
          if (lum > 0.72) m.color.lerp(calido, 0.4)
        }
        m.needsUpdate = true
      }
    })
    return c
  }, [scene])
  const puertasRef = React.useRef<PuertaCfg[]>([])
  // ¿una malla pertenece a una hoja de puerta? (su nombre empieza por el nodo de la puerta) → se excluye
  // del collider para que el UMBRAL sea pasable (la puerta es solo visual, se abre al acercarse).
  const esPuerta = React.useCallback((nombre: string) => !!puertas && puertas.some((p) => nombre.startsWith(p)), [puertas])

  React.useEffect(() => {
    if (!construirColisiones || !colliderRef) return
    obj.scale.setScalar(escala)
    obj.updateWorldMatrix(true, true)
    const geos: THREE.BufferGeometry[] = []
    obj.traverse((o: any) => {
      if (!o.isMesh || !o.geometry) return
      if (esPuerta(o.name) || (o.parent && esPuerta(o.parent.name))) return // puerta = fuera del collider (umbral pasable)
      const g = o.geometry.clone() as THREE.BufferGeometry
      for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k) // colisión = solo posición
      const ng = g.index ? g.toNonIndexed() : g
      ng.applyMatrix4(o.matrixWorld) // a espacio MUNDO (incluye la escala del escenario)
      geos.push(ng)
    })
    if (!geos.length) return
    const merged = BufferGeometryUtils.mergeGeometries(geos, false)
    geos.forEach((g) => g.dispose())
    ;(merged as any).computeBoundsTree()
    // DoubleSide: los rayos de colisión y de PISO golpean sin importar la orientación de las normales.
    const mesh = new THREE.Mesh(merged, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
    mesh.updateMatrixWorld() // matriz identidad: la geometría ya está en mundo
    colliderRef.current = mesh
    return () => {
      ;(merged as any).disposeBoundsTree?.()
      merged.dispose()
      if (colliderRef.current === mesh) colliderRef.current = null
    }
  }, [obj, escala, construirColisiones, colliderRef, esPuerta])

  // PUERTAS: monta un PIVOTE en el borde-bisagra de cada hoja y la re-parenta → rotar el pivote la abre.
  React.useEffect(() => {
    puertasRef.current = []
    if (!puertas || !puertas.length) return
    obj.scale.setScalar(escala)
    obj.updateWorldMatrix(true, true)
    const hojas = puertas.map((n) => obj.getObjectByName(n)).filter(Boolean) as THREE.Object3D[]
    if (!hojas.length) return
    // centro del vano = promedio de los centros de las hojas (para decidir el lado de la bisagra)
    const centros = hojas.map((h) => new THREE.Box3().setFromObject(h).getCenter(new THREE.Vector3()))
    const vanoX = centros.reduce((s, c) => s + c.x, 0) / centros.length
    hojas.forEach((hoja, i) => {
      const box = new THREE.Box3().setFromObject(hoja)
      const c = centros[i]
      const haciaMas = c.x >= vanoX // hoja del lado +X → bisagra en su borde +X, abre hacia afuera (signo -)
      const hingeX = haciaMas ? box.max.x : box.min.x
      const hingeMundo = new THREE.Vector3(hingeX, c.y, c.z)
      const parent = hoja.parent!
      const pivot = new THREE.Group()
      parent.add(pivot)
      pivot.position.copy(parent.worldToLocal(hingeMundo.clone()))
      pivot.updateWorldMatrix(true, false)
      pivot.attach(hoja) // re-parenta preservando el transform mundo → rotar pivot.rotation.y gira en bisagra
      puertasRef.current.push({ pivot, cx: c.x, cz: c.z, abierta: (haciaMas ? -1 : 1) * Math.PI * 0.55 })
    })
  }, [obj, puertas, escala])

  // Abrir/cerrar por proximidad del jugador (lerp suave).
  useFrame((_, dt) => {
    const cfgs = puertasRef.current
    if (!cfgs.length || !jugadorRef) return
    const px = jugadorRef.current.x, pz = jugadorRef.current.z
    const k = 1 - Math.exp(-6 * dt)
    for (const d of cfgs) {
      const cerca = Math.hypot(px - d.cx, pz - d.cz) < radioPuerta
      const objetivo = cerca ? d.abierta : 0
      d.pivot.rotation.y += (objetivo - d.pivot.rotation.y) * k
    }
  })

  // Avisa "escenario listo" una vez cargado el GLB (+ construido el collider, que corre en el efecto de
  // arriba antes que éste). El avatar ya puede pararse sobre el piso → la página oculta el "Cargando".
  React.useEffect(() => { onListo?.() }, [obj, onListo])

  return <primitive object={obj} scale={escala} />
}

function EscenarioMundo({ def, colliderRef, jugadorRef, onListo }: { def: EscenarioMundoDef; colliderRef: React.MutableRefObject<THREE.Mesh | null>; jugadorRef: React.MutableRefObject<EstadoJugador>; onListo?: () => void }) {
  // Sin glb (bosque) o sin colisiones → no hay collider.
  React.useEffect(() => { if (!def.glb || !def.colisiones) colliderRef.current = null }, [def, colliderRef])
  // Bosque (sin glb): listo de inmediato (no hay GLB que esperar).
  React.useEffect(() => { if (!def.glb) onListo?.() }, [def.glb, onListo])
  if (def.glb) return <EscenarioGLB glb={def.glb} escala={def.escala} construirColisiones={def.colisiones} colliderRef={colliderRef} puertas={def.puertas} radioPuerta={def.radioPuerta} jugadorRef={jugadorRef} onListo={onListo} />
  return <Escena />
}
// Precargar los .glb de escenarios para cambio instantáneo.
ESCENARIOS_MUNDO.forEach((e) => { if (e.glb) useGLTF.preload(e.glb) })

// Cielo: domo gigante con degradado (no se ve el "vacío azul plano" del fondo; envuelve toda la escena).
// No le afecta la niebla (fog:false) → el degradado se ve limpio; la niebla difumina los BORDES del
// escenario hacia el color del horizonte → sin cortes feos donde termina el modelo.
function CieloDomo() {
  const mat = React.useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { arriba: { value: new THREE.Color('#5b93cc') }, abajo: { value: new THREE.Color('#d4e4ee') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 arriba; uniform vec3 abajo; void main(){ float h = clamp(normalize(vP).y * 0.5 + 0.5, 0.0, 1.0); gl_FragColor = vec4(mix(abajo, arriba, smoothstep(0.0, 1.0, h)), 1.0); }',
  }), [])
  return <mesh scale={500} renderOrder={-1}><sphereGeometry args={[1, 32, 16]} /><primitive object={mat} attach="material" /></mesh>
}

// Luz "solar" direccional que SIGUE al jugador local → proyecta una sombra REALISTA con un frustum
// ajustado (no enorme) = sombra nítida. El target apunta a los pies del jugador. Sin esto, una sola luz
// fija sobre un mundo grande daría sombras borrosas o fuera de cuadro.
function LuzSol({ estadoLocalRef }: { estadoLocalRef: React.MutableRefObject<EstadoJugador> }) {
  const ref = React.useRef<THREE.DirectionalLight>(null!)
  const tgt = React.useMemo(() => new THREE.Object3D(), [])
  useFrame(() => {
    const l = ref.current
    if (!l) return
    const s = estadoLocalRef.current
    l.position.set(s.x + 14, 26, s.z + 10) // sol en diagonal alta
    tgt.position.set(s.x, 0, s.z)
    tgt.updateMatrixWorld()
  })
  return (
    <>
      <primitive object={tgt} />
      <directionalLight
        ref={ref} target={tgt} intensity={1.25} color="#fff6e8" castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-near={1} shadow-camera-far={90}
        shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18}
        shadow-bias={-0.0004} shadow-normalBias={0.03}
      />
    </>
  )
}

// Ancla los pies del personaje a y=0 (mide su bbox una vez).
function AnclaPies({ claveMedicion, children }: { claveMedicion: string; children: React.ReactNode }) {
  const ref = React.useRef<THREE.Group>(null!)
  React.useEffect(() => {
    let raf = 0
    const medir = () => {
      const g = ref.current
      if (!g) return
      g.position.set(0, 0, 0); g.updateWorldMatrix(true, true)
      const box = new THREE.Box3().setFromObject(g)
      if (box.isEmpty()) { raf = requestAnimationFrame(medir); return }
      // EJE DE GIRO = hueso HIPS (caderas), NO el centro del bbox. El bbox incluye el ACORDEÓN (sale
      // hacia adelante) → centrarlo dejaba el CUERPO descentrado respecto al grupo, así que al girar
      // caminando el cuerpo ORBITABA el grupo (giros bruscos, "no gira sobre su eje"). Con las caderas
      // como eje, gira sobre sí mismo. Todo se calcula en el frame LOCAL del padre (grupo), por eso es
      // independiente de la rotación del cuerpo (antes el offset de mundo aplicado como local se torcía
      // al cambiar de personaje con el cuerpo girado).
      let hips: THREE.Object3D | null = null
      g.traverse((o: any) => { if (!hips && o.isBone && /Hips$/.test(o.name || '')) hips = o; if (o.isMesh) o.castShadow = true })
      const eje = new THREE.Vector3()
      if (hips) (hips as THREE.Object3D).getWorldPosition(eje)
      else box.getCenter(eje)
      const padre = g.parent
      const invP = new THREE.Matrix4().copy(padre ? padre.matrixWorld : g.matrixWorld).invert()
      const ejeLocal = eje.clone().applyMatrix4(invP)                                  // caderas en frame del grupo
      const piesLocalY = new THREE.Vector3(eje.x, box.min.y, eje.z).applyMatrix4(invP).y // pies en frame del grupo
      g.position.set(-ejeLocal.x, -piesLocalY, -ejeLocal.z)
    }
    raf = requestAnimationFrame(medir)
    return () => cancelAnimationFrame(raf)
  }, [claveMedicion])
  return <group ref={ref}>{children}</group>
}

// Efecto de aparición/desaparición de un jugador: ráfaga de partículas brillantes (chispas) que suben
// desde el suelo y se desvanecen (~1.2 s) y luego se auto-desmonta. 'aparecer' = doradas, 'desaparecer'
// = celestes. Aditivo, points → cero impacto en el layout/diseño. Se monta como overlay efímero.
const EF_N = 64
const EF_DUR = 1.2
function EfectoJugador({ pos, tipo, onDone }: { pos: [number, number, number]; tipo: 'aparecer' | 'desaparecer'; onDone: () => void }) {
  const ref = React.useRef<THREE.Points>(null!)
  const t = React.useRef(0)
  const { base, vel, geom } = React.useMemo(() => {
    const base = new Float32Array(EF_N * 3)
    const vel: number[][] = []
    for (let i = 0; i < EF_N; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * 0.35
      base[i * 3] = Math.cos(a) * r; base[i * 3 + 1] = Math.random() * 0.25; base[i * 3 + 2] = Math.sin(a) * r
      vel.push([Math.cos(a) * (0.25 + Math.random() * 0.5), 1.3 + Math.random() * 1.9, Math.sin(a) * (0.25 + Math.random() * 0.5)])
    }
    const geom = new THREE.BufferGeometry()
    geom.setAttribute('position', new THREE.BufferAttribute(base.slice(), 3))
    return { base, vel, geom }
  }, [])
  React.useEffect(() => () => geom.dispose(), [geom])
  useFrame((_, dt) => {
    t.current += dt
    const k = t.current / EF_DUR
    if (k >= 1) { onDone(); return }
    const arr = geom.attributes.position.array as Float32Array
    const tt = t.current
    for (let i = 0; i < EF_N; i++) {
      const v = vel[i]
      arr[i * 3] = base[i * 3] + v[0] * tt
      arr[i * 3 + 1] = base[i * 3 + 1] + v[1] * tt - 0.8 * tt * tt // sube y cae un poco (gravedad suave)
      arr[i * 3 + 2] = base[i * 3 + 2] + v[2] * tt
    }
    geom.attributes.position.needsUpdate = true
    const m = ref.current.material as THREE.PointsMaterial
    m.opacity = 1 - k
    m.size = 0.14 * (1 - k * 0.4)
  })
  return (
    <points ref={ref} position={pos} geometry={geom}>
      <pointsMaterial color={tipo === 'desaparecer' ? '#7bdfff' : '#ffd36b'} size={0.14} transparent opacity={1} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
    </points>
  )
}

// Etiqueta flotante (nombre + 🎵) de tamaño constante sobre la cabeza.
function Etiqueta({ nombre, tocando, escuchando }: { nombre: string; tocando: boolean; escuchando?: boolean }) {
  return (
    <Html position={[0, 1.88, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none', transform: 'translateY(-50%)' }}>
      <div style={{ whiteSpace: 'nowrap', padding: '1px 8px', borderRadius: 10, background: 'rgba(15,18,26,.7)', color: '#fff', fontSize: 12, fontFamily: 'system-ui, sans-serif', display: 'flex', gap: 4, alignItems: 'center', border: escuchando ? '1px solid #39d353' : tocando ? '1px solid #ffd54a' : '1px solid transparent' }}>
        {nombre || 'Jugador'}{tocando && <span style={{ fontSize: 13 }}>🎵</span>}{escuchando && <span style={{ fontSize: 12 }}>🔊</span>}
      </div>
    </Html>
  )
}

// Avatar de OTRO usuario: interpola pos/rot y replica personaje + animación + nombre + 🎵 + ANIMA
// los dedos/fuelle de lo que ESE jugador está tocando (notas de la red filtradas por su id).
function AvatarRemoto({ id, remotosRef, escuchando, suscribirNotasRemotas, posRemotosRef, colliderRef }: { id: string; remotosRef: React.MutableRefObject<Map<string, RemotoEntry>>; escuchando?: boolean; suscribirNotasRemotas: (cb: NotaRemotaCb) => () => void; posRemotosRef: React.MutableRefObject<Map<string, [number, number]>>; colliderRef: React.MutableRefObject<THREE.Mesh | null> }) {
  const grupo = React.useRef<THREE.Group>(null!)
  const fuelleRef = React.useRef(false)
  const tocandoRef = React.useRef(false) // está tocando → balanceo del torso
  const headYawRef = React.useRef(0) // desfase cabeza↔cuerpo (head-look), calculado desde 'mira' de la red
  const ent0 = remotosRef.current.get(id)
  const [personajeId, setPersonajeId] = React.useState(ent0?.target.personajeId ?? PERSONAJES[0].id)
  const [anim, setAnim] = React.useState<string | null>(ent0?.target.anim ?? null)
  const [nombre, setNombre] = React.useState(ent0?.target.nombre ?? '')
  const [tocando, setTocando] = React.useState(false)
  const glb = (PERSONAJES.find((p) => p.id === personajeId) ?? PERSONAJES[0]).archivo

  // Fuente de notas SOLO de este jugador → el Modelo anima sus dedos/fuelle. Reconstruye el evento que
  // espera useNotasSuscripcion (fuelle según el id) y AUTO-SUELTA a los 3 s si un 'up' se pierde en la
  // red (sin esto la nota se quedaría pegada: dedo hundido + fuelle abierto para siempre).
  const fuenteNotas = React.useCallback((cb: (e: { idBoton: string; fuelle: 'abriendo' | 'cerrando'; accion: 'down' | 'up'; t: number }) => void) => {
    const safety = new Map<string, ReturnType<typeof setTimeout>>()
    const emitir = (idBoton: string, accion: 'down' | 'up') =>
      cb({ idBoton, fuelle: idBoton.includes('-halar') ? 'abriendo' : 'cerrando', accion, t: performance.now() })
    const off = suscribirNotasRemotas((idBoton, accion, deId) => {
      if (deId !== id) return
      if (accion === 'down') {
        const prev = safety.get(idBoton)
        if (prev) { clearTimeout(prev); emitir(idBoton, 'up') } // re-trigger limpio
        emitir(idBoton, 'down')
        safety.set(idBoton, setTimeout(() => { safety.delete(idBoton); emitir(idBoton, 'up') }, 3000))
      } else {
        const prev = safety.get(idBoton)
        if (!prev) return // ya soltada (p.ej. por el safety) → no doble 'up'
        clearTimeout(prev); safety.delete(idBoton); emitir(idBoton, 'up')
      }
    })
    return () => { off(); safety.forEach(clearTimeout); safety.clear() }
  }, [suscribirNotasRemotas, id])

  React.useEffect(() => {
    const e = remotosRef.current.get(id)
    if (e && grupo.current) { grupo.current.position.set(e.target.x, 0, e.target.z); grupo.current.rotation.y = e.target.ry }
  }, [id, remotosRef])

  // El balanceo se maneja por ACTIVIDAD DE NOTAS (no por el flag 'tocando' del estado): cuando el dueño
  // juega su turno del duelo, SU Canvas está pausado y deja de transmitir 'tocando', pero las NOTAS sí
  // siguen llegando (van por su propio broadcast). Así el balanceo funciona también durante el duelo.
  const ultimaNotaRef = React.useRef(0)
  React.useEffect(() => suscribirNotasRemotas((_idB, accion, deId) => {
    if (deId === id && accion === 'down') ultimaNotaRef.current = performance.now()
  }), [suscribirNotasRemotas, id])

  useFrame((_, dt) => {
    const ent = remotosRef.current.get(id)
    const g = grupo.current
    if (!ent || !g) return
    const k = 1 - Math.exp(-INTERP_RATE * dt)
    g.position.x += (ent.target.x - g.position.x) * k
    g.position.z += (ent.target.z - g.position.z) * k
    g.rotation.y = dampAngle(g.rotation.y, ent.target.ry, INTERP_RATE, dt)
    // Head-look: desfase entre hacia dónde mira (cámara del dueño, 'mira') y su cuerpo.
    headYawRef.current = normAngle((typeof ent.target.mira === 'number' ? ent.target.mira : g.rotation.y) - g.rotation.y)
    if (ent.target.anim !== anim) setAnim(ent.target.anim)
    if (ent.target.personajeId && ent.target.personajeId !== personajeId) setPersonajeId(ent.target.personajeId)
    if (ent.target.nombre !== nombre) setNombre(ent.target.nombre)
    if (ent.target.tocando !== tocando) setTocando(ent.target.tocando)
    tocandoRef.current = performance.now() - ultimaNotaRef.current < 650 // balanceo por actividad de notas
    // PISO: el remoto también se para sobre el suelo real del escenario (mismo collider compartido).
    const colR = colliderRef.current
    if (colR) { const yp = pisoBajoAvatar(colR, g.position.x, g.position.z, g.position.y); if (yp !== null) g.position.y = yp }
    posRemotosRef.current.set(id, [g.position.x, g.position.z]) // última posición → efecto al irse
  })

  return (
    <group ref={grupo} userData={{ idJugador: id }}>
      <Etiqueta nombre={nombre} tocando={tocando} escuchando={escuchando} />
      <AnclaPies claveMedicion={glb}>
        <Modelo key={glb} fuelleAbiertoRef={fuelleRef} skin="original" glb={glb} baile={anim} velocidadBaile={anim === 'Salto vacano' ? SALTO_SPEED : undefined} fuenteNotas={fuenteNotas} headYawRef={headYawRef} tocandoRef={tocandoRef} ligero />
      </AnclaPies>
    </group>
  )
}

// PlayerController: movimiento + cámara, DESACOPLADO de las notas. Solo actúa en MODO CAMINANTE
// (pointer-lock): WASD/flechas mueven con velocidad amortiguada, el mouse orbita la cámara 360°, la
// rueda acerca/aleja (hasta 1ª persona). Fuera del modo, no mueve nada y la cámara queda quieta
// detrás del personaje (cursor libre para la interfaz). Colisión suave con remotos (no bloquea).
function PlayerController({ personajeId, skin, baile, nombre, vistaModo, limite, lastNoteRef, estadoLocalRef, remotosRef, onSeleccionarJugador, moveRef, semillaSpawn, bloquearTecladoRef, correrRef, saltarRef, colliderRef, spawnFijo, mirarFijo, sentadoRef, asientos, onCercaAsiento }: {
  personajeId: string; skin: string; baile: string | null; nombre: string; vistaModo: string; limite: number
  lastNoteRef: React.MutableRefObject<number>; estadoLocalRef: React.MutableRefObject<EstadoJugador>
  remotosRef: React.MutableRefObject<Map<string, RemotoEntry>>; onSeleccionarJugador?: (id: string) => void
  moveRef: React.MutableRefObject<{ fwd: number; side: number }>; semillaSpawn: string
  bloquearTecladoRef: React.MutableRefObject<boolean>
  correrRef: React.MutableRefObject<boolean>   // correr sostenido (botón móvil); en PC también Shift
  saltarRef: React.MutableRefObject<number>    // contador: al cambiar dispara un salto (botón / Espacio)
  colliderRef: React.MutableRefObject<THREE.Mesh | null> // collider del escenario (null = sin colisiones)
  spawnFijo?: [number, number] // punto de aparición del escenario (si falta → determinista en anillo)
  mirarFijo?: number           // orientación inicial del cuerpo (rotation.y, rad)
  sentadoRef: React.MutableRefObject<boolean> // true = el usuario pidió sentarse (botón)
  asientos?: AsientoDef[]       // sofás donde sentarse (se engancha al más cercano)
  onCercaAsiento?: (cerca: boolean) => void // avisa si hay un sofá al alcance (para mostrar el botón)
}) {
  const glb = (PERSONAJES.find((p) => p.id === personajeId) ?? PERSONAJES[0]).archivo
  const grupo = React.useRef<THREE.Group>(null!)
  const fuelleRef = React.useRef(false)
  const tocandoRef = React.useRef(false) // está tocando → balanceo del torso
  const headYawRef = React.useRef(0) // desfase cabeza↔cuerpo (head-look): cámara - orientación del cuerpo
  const teclas = React.useRef<Record<string, boolean>>({})
  const vel = React.useRef(new THREE.Vector3())
  const yaw = React.useRef(0)   // cámara DETRÁS del personaje al inicio (vista de juego, ves a dónde vas)
  const pitch = React.useRef(0.32)
  const dist = React.useRef(DIST_DEF)
  const cenital = React.useRef(false)
  const primera = React.useRef(false)
  const frontal = React.useRef(false)
  const arrastrando = React.useRef(false) // rotando la cámara con el clic mantenido
  const recentrar = React.useRef(false)   // tecla C → recentrar la cámara detrás del personaje
  const vyRef = React.useRef(0)              // velocidad vertical (gravedad)
  const enAireRef = React.useRef(false)      // true mientras el avatar NO está apoyado en el piso
  const saltoActivoRef = React.useRef(false) // true mientras se reproduce la anim de salto (en el sitio)
  const saltoHastaRef = React.useRef(0)      // performance.now() hasta cuándo dura la anim de salto
  const yAnteriorRef = React.useRef(0)       // altura del frame anterior (para detectar que SUBE escaleras)
  const subVelRef = React.useRef(0)          // velocidad vertical SUAVIZADA (sin spikes del raycast)
  const subiendoHastaRef = React.useRef(0)   // mientras el piso sube al caminar → anim 'Subiendo escaleras'
  const ultSaltoRef = React.useRef(0)     // último valor visto de saltarRef (edge del botón Saltar)
  const prevEspacioRef = React.useRef(false) // edge de la barra espaciadora (saltar en PC)
  const sentadoEnRef = React.useRef<AsientoDef | null>(null) // asiento donde está sentado (null = de pie)
  const pisoSentadoRef = React.useRef(0)  // altura del PISO al sentarse (pies en el suelo, no sobre el cojín)
  const cercaAsientoRef = React.useRef(false) // ¿hay un sofá al alcance? (para mostrar el botón Sentarse)
  const _ray = React.useRef(new THREE.Raycaster())
  const _ndc = React.useRef(new THREE.Vector2())

  // Aplicar el modo de vista elegido (distancia/ángulo base). El mouse y la rueda ajustan encima.
  React.useEffect(() => {
    const v = VISTAS.find((x) => x.id === vistaModo) ?? VISTAS[0]
    dist.current = v.dist; pitch.current = v.pitch; cenital.current = v.cenital; primera.current = v.primera; frontal.current = !!v.frontal
  }, [vistaModo])
  const [anim, setAnim] = React.useState<string | null>(null) // clip actual (caminar/correr/saltar/baile)
  const [tocando, setTocando] = React.useState(false)
  const { gl, camera, scene } = useThree()
  const _f = React.useRef(new THREE.Vector3())
  const _r = React.useRef(new THREE.Vector3())
  const _d = React.useRef(new THREE.Vector3())
  const _tgt = React.useRef(new THREE.Vector3())

  // Spawn: si el escenario define un punto fijo, aparecer ahí (con un jitter determinista pequeño para
  // que varios jugadores no se apilen exacto); si no, spawn determinista en anillo (bosque).
  const spawn = React.useMemo<readonly [number, number]>(() => {
    if (spawnFijo) {
      let h = 2166136261
      for (let i = 0; i < semillaSpawn.length; i++) { h ^= semillaSpawn.charCodeAt(i); h = Math.imul(h, 16777619) }
      h >>>= 0
      const a = (h % 100000) / 100000 * Math.PI * 2, r = ((h >>> 13) % 400) / 100 // 0..4 m
      return [spawnFijo[0] + Math.cos(a) * r, spawnFijo[1] + Math.sin(a) * r] as const
    }
    return spawnDeterminista(semillaSpawn)
  }, [spawnFijo, semillaSpawn])
  React.useEffect(() => {
    if (grupo.current) {
      grupo.current.position.set(spawn[0], 0, spawn[1])
      if (typeof mirarFijo === 'number') {
        grupo.current.rotation.y = mirarFijo
        yaw.current = mirarFijo // alinear la cámara DETRÁS mirando lo mismo (si no, la lógica de "el cuerpo
                                // se endereza hacia la cámara" gira al avatar hacia yaw=0 y mira a otro lado)
      }
    }
    estadoLocalRef.current.x = spawn[0]; estadoLocalRef.current.z = spawn[1]
  }, [spawn, estadoLocalRef, mirarFijo])

  // Pointer-lock + mouse (rotación) + rueda (zoom) + teclado. navRef refleja si el pointer está bloqueado.
  React.useEffect(() => {
    const dom = gl.domElement
    // La cámara rota SOLO con el clic mantenido (arrastrar). El resto del tiempo el cursor está libre
    // para la interfaz; NO se captura la pantalla (sin pointer-lock). Un CLIC (sin arrastrar) sobre el
    // avatar de otro jugador lo selecciona para escucharlo.
    // Clic/tap sobre un avatar → seleccionarlo (escucharlo).
    const raySelect = (cx: number, cy: number) => {
      if (!onSeleccionarJugador) return
      const rect = dom.getBoundingClientRect()
      _ndc.current.set(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1)
      _ray.current.setFromCamera(_ndc.current, camera)
      const hits = _ray.current.intersectObjects(scene.children, true)
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object
        while (o && !(o.userData && o.userData.idJugador)) o = o.parent
        if (o) { onSeleccionarJugador(o.userData.idJugador); break }
      }
    }
    let downX = 0, downY = 0
    const onDown = (e: MouseEvent) => { if (e.button === 0) { arrastrando.current = true; downX = e.clientX; downY = e.clientY; dom.style.cursor = 'grabbing'; e.preventDefault() } }
    const onUp = (e: MouseEvent) => {
      arrastrando.current = false; dom.style.cursor = 'grab'
      if (Math.hypot(e.clientX - downX, e.clientY - downY) < 6) raySelect(e.clientX, e.clientY)
    }
    const onMove = (e: MouseEvent) => {
      if (!arrastrando.current) return
      // Si el mouse va invertido, cambiar los signos de estas dos líneas.
      yaw.current -= e.movementX * MOUSE_SENS
      pitch.current = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch.current - e.movementY * MOUSE_SENS))
    }
    const onWheel = (e: WheelEvent) => { e.preventDefault(); dist.current = Math.min(DIST_MAX, Math.max(DIST_MIN, dist.current + e.deltaY * 0.006)) }

    // --- TÁCTIL: 1 dedo arrastra la cámara (tap selecciona); 2 dedos = pellizco para zoom. ---
    let tx = 0, ty = 0, tDownX = 0, tDownY = 0, tUno = false, pinch0 = 0
    const distEntre = (e: TouchEvent) => Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { tUno = true; tx = tDownX = e.touches[0].clientX; ty = tDownY = e.touches[0].clientY }
      else if (e.touches.length === 2) { tUno = false; pinch0 = distEntre(e) }
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = distEntre(e); dist.current = Math.min(DIST_MAX, Math.max(DIST_MIN, dist.current - (d - pinch0) * 0.02)); pinch0 = d; e.preventDefault(); return
      }
      if (!tUno || e.touches.length !== 1) return
      const nx = e.touches[0].clientX, ny = e.touches[0].clientY
      yaw.current -= (nx - tx) * MOUSE_SENS * 1.5
      pitch.current = Math.min(PITCH_MAX, Math.max(PITCH_MIN, pitch.current - (ny - ty) * MOUSE_SENS * 1.5))
      tx = nx; ty = ny; e.preventDefault()
    }
    const onTouchEnd = (e: TouchEvent) => {
      if (tUno && e.touches.length === 0 && Math.hypot(tx - tDownX, ty - tDownY) < 8) raySelect(tx, ty)
      tUno = false
    }
    // No mover si el foco está en un input (ej. duración del secuenciador).
    const enInput = () => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA') }
    const onKeyDn = (e: KeyboardEvent) => { if (enInput()) return; if (e.key.toLowerCase() === 'c') recentrar.current = true; if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault(); teclas.current[e.key.toLowerCase()] = true }
    const onKeyUp = (e: KeyboardEvent) => { teclas.current[e.key.toLowerCase()] = false }
    dom.style.cursor = 'grab'
    dom.style.touchAction = 'none'
    dom.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mousemove', onMove)
    dom.addEventListener('wheel', onWheel, { passive: false })
    dom.addEventListener('touchstart', onTouchStart, { passive: false })
    dom.addEventListener('touchmove', onTouchMove, { passive: false })
    dom.addEventListener('touchend', onTouchEnd)
    window.addEventListener('keydown', onKeyDn, { passive: false })
    window.addEventListener('keyup', onKeyUp)
    return () => {
      dom.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mousemove', onMove)
      dom.removeEventListener('wheel', onWheel)
      dom.removeEventListener('touchstart', onTouchStart)
      dom.removeEventListener('touchmove', onTouchMove)
      dom.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDn)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [gl, camera, scene, onSeleccionarJugador])

  useFrame((_, dtReal) => {
    const g = grupo.current
    if (!g) return
    // CLAMP del dt de física: un frame lento (FPS bajo / lag spike) daría un paso de gravedad gigante que
    // mataría el salto (vy se vuelve muy negativo de golpe) o teletransportaría al avatar. Se limita a 1/20 s
    // → la física es ESTABLE a cualquier FPS (en FPS bajo el mundo va un poco más lento, pero no se rompe).
    const dt = Math.min(dtReal, 0.05)
    const t = teclas.current

    // Direcciones relativas al yaw de la cámara. (right invertido → A/D en el sentido natural.)
    const fwd = _f.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current))
    const right = _r.current.set(-Math.cos(yaw.current), 0, Math.sin(yaw.current))
    // Teclado + joystick analógico (móvil) sumados. Si el panel "Tocar en vivo" está abierto, el
    // teclado toca el acordeón (W/A/S/D son notas) → ignoramos las teclas de movimiento (el joystick
    // móvil sigue funcionando). Es el "modo tocar": para caminar de nuevo se cierra el panel.
    const kb = bloquearTecladoRef.current ? 0 : 1
    // SENTARSE: al pedir sentarse, se engancha UNA vez al sofá más cercano (snap a su posición + orientación)
    // y queda quieto (sin caminar) hasta pararse. El clip 'Sentarse' anima la pose. Si no hay sofá cerca,
    // se sienta en el sitio. Al pararse (sentado=false) se suelta.
    // ¿Hay un SOFÁ enfrente? Detección SIN coordenadas, por RAYCAST: un rayo hacia abajo desde un punto
    // justo adelante del avatar; si pega en una superficie a ALTURA DE ASIENTO (piso+0.25..0.85 m), hay un
    // sofá/banco delante → se puede sentar. (Las coordenadas calculadas no servían en este modelo multinivel.)
    const col = colliderRef.current // collider del escenario (se usa para sofás + colisión de cápsula)
    let cerca = false
    if (col && asientos) {
      const fwx = Math.sin(g.rotation.y), fwz = Math.cos(g.rotation.y)
      const by = g.position.y
      _colO.set(g.position.x + fwx * 0.55, by + 1.5, g.position.z + fwz * 0.55)
      _colD.set(0, -1, 0); _rayCol.set(_colO, _colD); _rayCol.far = 1.7
      const hit = _rayCol.intersectObject(col, false)[0]
      if (hit) { const h = hit.point.y - by; if (h > 0.22 && h < 0.85) cerca = true }
    }
    if (cerca !== cercaAsientoRef.current) { cercaAsientoRef.current = cerca; onCercaAsiento?.(cerca) }

    const sentado = sentadoRef.current
    if (sentado && !sentadoEnRef.current && cerca) {
      // Sentarse sobre el sofá de enfrente: avanzar un poco para quedar sobre el cojín y girar 180° (sentarse
      // de espaldas al respaldo, mirando hacia afuera). Anclar al PISO actual (el clip 'Sentarse' baja el cuerpo).
      const fwx = Math.sin(g.rotation.y), fwz = Math.cos(g.rotation.y)
      g.position.x += fwx * 0.45; g.position.z += fwz * 0.45
      g.rotation.y += Math.PI; yaw.current = g.rotation.y
      sentadoEnRef.current = { x: g.position.x, z: g.position.z, ry: g.rotation.y }
      pisoSentadoRef.current = g.position.y
    } else if (!sentado && sentadoEnRef.current) {
      sentadoEnRef.current = null
    }
    const enSofa = !!sentadoEnRef.current // sentado de verdad en un sofá
    const mov = enSofa ? 0 : 1 // sentado = sin desplazamiento
    const iz = mov * (kb * ((t['w'] || t['arrowup'] ? 1 : 0) - (t['s'] || t['arrowdown'] ? 1 : 0)) + moveRef.current.fwd)
    const ix = mov * (kb * ((t['d'] || t['arrowright'] ? 1 : 0) - (t['a'] || t['arrowleft'] ? 1 : 0)) + moveRef.current.side)
    // CORRER: botón sostenido en móvil (correrRef) o Shift en PC. SALTAR: edge del botón (saltarRef) o
    // de la barra espaciadora. LÓGICA ESTILO VIDEOJUEGO: si viene en MOVIMIENTO al disparar el salto, dura
    // poco (solo el brinco) → sigue caminando/corriendo fluido; si está QUIETO, dura el salto COMPLETO
    // (con aterrizaje) y vuelve a idle. La duración se fija al disparar (no se vuelve a disparar hasta terminar).
    const correr = kb === 1 && (correrRef.current || !!t['shift'])
    const espacio = kb === 1 && !!t[' ']
    // SALTO = SOLO ANIMACIÓN EN EL SITIO: reproduce 'Salto vacano' por SALTO_DUR_MS SIN mover al avatar en
    // vertical (sin gravedad de salto). Solo desde el piso; no se re-dispara hasta que termina la anim.
    const dispararSalto = () => {
      if (!enAireRef.current && !enSofa && performance.now() >= saltoHastaRef.current) {
        saltoActivoRef.current = true
        saltoHastaRef.current = performance.now() + SALTO_DUR_MS
      }
    }
    if (saltarRef.current !== ultSaltoRef.current) { ultSaltoRef.current = saltarRef.current; dispararSalto() }
    if (espacio && !prevEspacioRef.current) dispararSalto()
    prevEspacioRef.current = espacio
    // La anim de salto dura SALTO_DUR_MS y luego vuelve a idle/caminar (gobernada por el temporizador).
    if (saltoActivoRef.current && performance.now() >= saltoHastaRef.current) saltoActivoRef.current = false
    const saltando = saltoActivoRef.current
    const desired = _d.current.set(0, 0, 0).addScaledVector(fwd, iz).addScaledVector(right, ix)
    const mag = desired.length() // analógico: joystick a medias = camina más lento; clamp a 1 = full
    if (mag > 1e-4) desired.multiplyScalar(((mag > 1 ? 1 / mag : 1)) * VEL * (correr ? RUN_MULT : 1))

    // Velocidad AMORTIGUADA → aceleración/desaceleración suaves (sin saltos).
    vel.current.x = THREE.MathUtils.damp(vel.current.x, desired.x, ACCEL, dt)
    vel.current.z = THREE.MathUtils.damp(vel.current.z, desired.z, ACCEL, dt)
    // Movimiento horizontal LIBRE (la cápsula resuelve la colisión más abajo, tras la gravedad).
    const xPrev = g.position.x, zPrev = g.position.z
    g.position.x += vel.current.x * dt
    g.position.z += vel.current.z * dt

    // Límite del mundo (radio de navegación del escenario actual).
    const rad = Math.hypot(g.position.x, g.position.z)
    if (rad > limite) { g.position.x *= limite / rad; g.position.z *= limite / rad }

    // Colisión SUAVE con remotos: si se solapan, se separan un poco (no bloquea el movimiento).
    for (const [, ent] of remotosRef.current) {
      const dx = g.position.x - ent.target.x, dz = g.position.z - ent.target.z
      const dd = Math.hypot(dx, dz)
      if (dd > 1e-3 && dd < SEP) { const push = (SEP - dd) * 0.5; g.position.x += (dx / dd) * push; g.position.z += (dz / dd) * push }
    }

    // GRAVEDAD + COLISIÓN POR CÁPSULA: la cápsula del avatar se empuja FUERA de TODA la geometría
    // (paredes, barandas, muebles, suelo) → NO atraviesa nada. La gravedad lo posa en el piso; el salto
    // sube de verdad y ATERRIZA ENCIMA. Bajar un escaloncito NO dispara la anim de salto (saltoActivoRef).
    if (col && enSofa) {
      // SENTADO EN UN SOFÁ: pies anclados al PISO real (guardado al sentarse), NO al cojín (si raycasteara
      // hacia abajo pegaría sobre el sofá = se para encima). El clip 'Sentarse' baja el cuerpo al asiento.
      g.position.y = THREE.MathUtils.damp(g.position.y, pisoSentadoRef.current, 16, dt)
    } else if (col) {
      // VERTICAL por RAYCAST (confiable, sin tunneling): el avatar se para sobre el piso real y nunca lo
      // atraviesa, sin importar la velocidad de caída. floorY=null = no hay piso debajo (borde/vacío).
      const floorY = pisoBajoAvatar(col, g.position.x, g.position.z, g.position.y)
      // Anti-vacío (en el piso): si te moviste a un XZ sin piso debajo (borde del mundo), revertir.
      if (!enAireRef.current && floorY === null) { g.position.x = xPrev; g.position.z = zPrev }
      // Gravedad + aterrizaje: cae hasta el piso y se queda ahí (el salto sube de verdad y aterriza ENCIMA).
      vyRef.current = Math.max(-30, vyRef.current - GRAVITY * dt)
      const ny = g.position.y + vyRef.current * dt
      if (floorY !== null && ny <= floorY) {
        // EN EL PISO: sigue el suelo SUAVE (damp) → SIN tirón vertical por el jitter del raycast al correr,
        // y aterrizaje suave (antes ny=floorY de golpe daba el "movimiento brusco hacia arriba/abajo").
        g.position.y = THREE.MathUtils.damp(g.position.y, floorY, 16, dt)
        vyRef.current = 0; enAireRef.current = false; subVelRef.current = 0 // en piso (la anim de salto la gobierna su temporizador)
      } else {
        // EN EL AIRE: gravedad directa (salto/caída suaves por la física).
        g.position.y = ny
        enAireRef.current = true
      }
      // HORIZONTAL por CÁPSULA: empuja al avatar FUERA de paredes/barandas/elementos delgados → NO atraviesa
      // NADA. Solo se aplica la corrección XZ (el vertical ya lo maneja el raycast, sin tunneling).
      const r = resolverCapsula(col, g.position.x, g.position.y, g.position.z)
      g.position.x = r.x; g.position.z = r.z
    } else {
      g.position.y = 0; vyRef.current = 0; enAireRef.current = false
    }

    const speed = Math.hypot(vel.current.x, vel.current.z)
    const moviendo = speed > 0.25
    if (moviendo) g.rotation.y = dampAngle(g.rotation.y, Math.atan2(vel.current.x, vel.current.z), FACE_RATE, dt)
    else {
      // Quieto: si miras (cámara) más allá del límite del cuello, el CUERPO se endereza hacia allá
      // (como en los juegos). Así el desfase cabeza↔cuerpo nunca supera el tope → la cabeza no "salta"
      // al cruzar la espalda (era el bug del head-look: normAngle volteaba el signo en ±π).
      const d = normAngle(yaw.current - g.rotation.y)
      const exceso = Math.abs(d) - HEAD_LIMITE
      if (exceso > 0) g.rotation.y += Math.sign(d) * exceso * (1 - Math.exp(-BODY_TURN_RATE * dt))
    }
    // ¿SUBIENDO ESCALERAS? = el piso sube SOSTENIDO al caminar. La velocidad vertical se SUAVIZA (low-pass)
    // → el jitter del raycast NO la dispara (solo un ascenso real y sostenido de escalera). Histéresis 250ms.
    const subVel = dt > 1e-4 ? (g.position.y - yAnteriorRef.current) / dt : 0
    yAnteriorRef.current = g.position.y
    subVelRef.current += (subVel - subVelRef.current) * (1 - Math.exp(-7 * dt))
    if (!enAireRef.current && moviendo && subVelRef.current > 0.8) subiendoHastaRef.current = performance.now() + 250
    const subiendo = !enAireRef.current && moviendo && performance.now() < subiendoHastaRef.current
    // Anim por prioridad: SALTO > SUBIENDO ESCALERAS > correr/caminar > baile del panel > nada.
    // Anim por prioridad: SALTO > SUBIENDO ESCALERAS > correr/caminar > baile del panel > nada. El clip
    // 'Subiendo escaleras' YA existe en el pack (agregado de su FBX, sin desplazamiento vertical: la física
    // del piso sube al avatar y el clip pone el paso de escalera). subiendo = el piso sube sostenido al caminar.
    const animActual = enSofa ? 'Sentarse' : (saltando ? 'Salto vacano' : (subiendo ? 'Subiendo escaleras' : (moviendo ? (correr ? 'Corriendo' : 'Caminata') : baile)))
    if (animActual !== anim) setAnim(animActual)

    // Recentrar la cámara detrás del personaje (tecla C).
    if (recentrar.current) { yaw.current = g.rotation.y; recentrar.current = false }

    // ¿Tocando? (nota <500ms) — para el indicador 🎵.
    const tocandoAhora = performance.now() - lastNoteRef.current < 500
    if (tocandoAhora !== tocando) setTocando(tocandoAhora)
    tocandoRef.current = tocandoAhora

    // Head-look: la cabeza apunta hacia donde mira la cámara (yaw), limitado respecto al cuerpo.
    headYawRef.current = normAngle(yaw.current - g.rotation.y)

    // Publicar estado a la red.
    const est = estadoLocalRef.current
    est.x = g.position.x; est.z = g.position.z; est.ry = g.rotation.y
    est.personajeId = personajeId; est.anim = animActual
    est.nombre = nombre; est.tocando = tocandoAhora; est.mira = yaw.current

    // Cámara según el modo de vista. Rotación 1:1 con el mouse (yaw/pitch). El grupo está SIEMPRE en el piso
    // (el salto sube la cadera DENTRO del grupo vía el clip), así que la cámara no sube con el salto.
    const P = g.position
    const py = P.y
    if (cenital.current) {
      // Picado desde arriba, centrado en el personaje.
      camera.position.set(P.x, py + dist.current, P.z + 0.01)
      _tgt.current.set(P.x, py, P.z)
    } else if (primera.current) {
      // Ojos del personaje, mirando hacia adelante (yaw) con tilt vertical por el pitch.
      const hx = Math.sin(yaw.current), hz = Math.cos(yaw.current)
      camera.position.set(P.x + hx * 0.15, P.y + 1.6, P.z + hz * 0.15)
      const v = (pitch.current - 0.45) * 3
      _tgt.current.set(P.x + hx * 3, P.y + 1.6 + v, P.z + hz * 3)
    } else if (frontal.current) {
      // FRONTAL: cámara DELANTE del personaje (lo ves de frente, su cara), siguiendo su orientación.
      const fx = Math.sin(g.rotation.y), fz = Math.cos(g.rotation.y)
      const cp = Math.cos(pitch.current), sp = Math.sin(pitch.current)
      _tgt.current.set(P.x, py + TARGET_H, P.z)
      camera.position.set(
        P.x + fx * dist.current * cp,
        py + TARGET_H + dist.current * sp,
        P.z + fz * dist.current * cp,
      )
    } else {
      // Orbital 3ª persona: detrás/encima según yaw/pitch/dist.
      const cp = Math.cos(pitch.current), sp = Math.sin(pitch.current)
      _tgt.current.set(P.x, py + TARGET_H, P.z)
      camera.position.set(
        P.x - Math.sin(yaw.current) * dist.current * cp,
        py + TARGET_H + dist.current * sp,
        P.z - Math.cos(yaw.current) * dist.current * cp,
      )
    }
    // Colisión de CÁMARA: si una pared queda entre el personaje y la cámara, acercar la cámara hasta el
    // muro (no atravesarlo). Solo en vistas orbitales (no 1ª persona ni cenital).
    if (col && !primera.current && !cenital.current) {
      _colD.subVectors(camera.position, _tgt.current)
      const len = _colD.length()
      if (len > 1e-3) {
        _colD.multiplyScalar(1 / len)
        _rayCol.set(_colO.copy(_tgt.current), _colD)
        _rayCol.far = len
        const hit = _rayCol.intersectObject(col, false)[0]
        if (hit) camera.position.copy(_tgt.current).addScaledVector(_colD, Math.max(0.4, hit.distance - 0.2))
      }
    }
    camera.lookAt(_tgt.current)
  })

  return (
    <group ref={grupo}>
      <Etiqueta nombre={nombre} tocando={tocando} />
      {/* Suspense PROPIO del personaje local: al cambiar de personaje (glb nuevo) suspende SOLO la
          malla mientras carga; el controlador (cámara, teclas, caminar) sigue VIVO → ya no se reinicia
          ni se rompe la caminata al cambiar seguido. */}
      <React.Suspense fallback={null}>
        <AnclaPies claveMedicion={glb}>
          <Modelo key={glb} fuelleAbiertoRef={fuelleRef} skin={skin} glb={glb} baile={anim} velocidadBaile={anim === 'Salto vacano' ? SALTO_SPEED : undefined} headYawRef={headYawRef} tocandoRef={tocandoRef} />
        </AnclaPies>
      </React.Suspense>
    </group>
  )
}

// Motor de audio "OYENTE": un useLogicaAcordeon headless (carga los samples / el banco) que reproduce
// las notas que tocan los DEMÁS (recibidas por la red) → así escuchas a los otros usuarios tocar. Vive
// fuera del Canvas (es audio, no 3D). El volumen ajusta el maestro del motor. Reproduce el TONO que
// viajó en cada nota (muestra+semitonos del que tocó) → audio puro vía motorAudioPro: no toca el store
// de botones ni emite notas → no anima ni interfiere con tu avatar.
function OyenteRemoto({ suscribir, volumen, escuchandoRef, tonalidadForzada }: { suscribir: (cb: NotaRemotaCb) => () => void; volumen: number; escuchandoRef: React.MutableRefObject<Set<string>>; tonalidadForzada?: string | null }) {
  // deshabilitarInteraccion: true → NO atiende el teclado físico (si no, al teclear o tocar en vivo
  // este motor también dispararía/broadcastearía notas). Igual reproduce audio: reproduceTono y
  // motorAudioPro.reproducir NO miran ese flag.
  const logica = useLogicaAcordeon({ deshabilitarInteraccion: true })
  React.useEffect(() => { try { motorAudioPro.setVolumenMaestro(volumen) } catch {} }, [volumen])
  // En un DUELO forzamos la tonalidad de la CANCIÓN en el oyente → las notas remotas suenan en el tono
  // correcto (y el fallback también), sin cruzarse con la tonalidad personal del que escucha. GUARD
  // CONTINUO (deps incluyen tonalidadSeleccionada): la nube la pisa async y aquí la revertimos. NO
  // forzamos el instrumento (recargar el banco mete latencia y el pitch ya queda bien por la tonalidad).
  React.useEffect(() => {
    if (!tonalidadForzada) return
    if (logica.setTonalidadSeleccionada && logica.tonalidadSeleccionada !== tonalidadForzada) logica.setTonalidadSeleccionada(tonalidadForzada)
  }, [tonalidadForzada, logica.tonalidadSeleccionada, logica.setTonalidadSeleccionada])
  React.useEffect(() => {
    // Notas SONANDO ahora mismo, indexadas por (jugador:botón). 'down' arranca el tono igual que al
    // tocar en vivo (sin duración fija) y guarda sus instancias; 'up' las detiene → la nota dura
    // EXACTO lo que el otro la sostuvo, fluido y sin pegarse. Temporizador de seguridad por si un 'up'
    // se pierde en la red (broadcast no es fiable): suelta la nota a los 3 s como tope.
    const activas = new Map<string, { instances: any[]; safety: ReturnType<typeof setTimeout> }>()
    const soltar = (clave: string) => {
      const v = activas.get(clave)
      if (!v) return
      clearTimeout(v.safety)
      v.instances.forEach((inst) => { try { motorAudioPro.detener(inst, 0.04) } catch {} })
      activas.delete(clave)
    }
    const off = suscribir((idBoton, accion, deId, tono) => {
      if (!escuchandoRef.current.has(deId)) return
      const clave = deId + ':' + idBoton
      if (accion === 'down') {
        soltar(clave) // re-trigger limpio: corta la anterior si seguía sonando
        // Reproducir el TONO EXACTO que tocó el otro (muestra + semitonos que viajaron en el evento) →
        // suena en el MISMO tono sin importar la tonalidad/instrumento de ESTE cliente. Si no llegó el
        // tono (o el banco no está cargado aquí), caemos a la resolución local (puede sonar transpuesto).
        let instances: any[] = []
        if (tono && tono.samples?.length) {
          instances = tono.samples
            .map((s) => motorAudioPro.reproducir(s.idSonido, tono.bancoId, tono.volumen, s.semitonos, false))
            .filter(Boolean)
        }
        if (instances.length === 0) { try { instances = logica.reproduceTono(idBoton).instances || [] } catch {} }
        activas.set(clave, { instances, safety: setTimeout(() => soltar(clave), 3000) })
      } else {
        soltar(clave)
      }
    })
    return () => { off(); Array.from(activas.keys()).forEach(soltar) }
  }, [suscribir, logica, escuchandoRef])
  return null
}

// Joystick en pantalla (móvil): el pulgar lo arrastra y escribe un vector analógico {fwd, side} en
// moveRef, que el PlayerController suma al teclado. Pointer events → sirve con dedo y con mouse.
function Joystick({ moveRef, bottom = 24 }: { moveRef: React.MutableRefObject<{ fwd: number; side: number }>; bottom?: number }) {
  const base = React.useRef<HTMLDivElement>(null)
  const [knob, setKnob] = React.useState({ x: 0, y: 0 })
  const activo = React.useRef(false)
  const mover = (e: React.PointerEvent) => {
    if (!activo.current || !base.current) return
    const r = base.current.getBoundingClientRect()
    const R = r.width / 2
    let dx = e.clientX - (r.left + R), dy = e.clientY - (r.top + R)
    const len = Math.hypot(dx, dy)
    if (len > R) { dx = (dx / len) * R; dy = (dy / len) * R }
    setKnob({ x: dx, y: dy })
    moveRef.current.side = dx / R
    moveRef.current.fwd = -dy / R
  }
  const fin = () => { activo.current = false; setKnob({ x: 0, y: 0 }); moveRef.current.side = 0; moveRef.current.fwd = 0 }
  return (
    <div
      ref={base}
      onPointerDown={(e) => { activo.current = true; (e.target as HTMLElement).setPointerCapture(e.pointerId); mover(e) }}
      onPointerMove={mover}
      onPointerUp={fin}
      onPointerCancel={fin}
      style={{ position: 'absolute', left: 24, bottom, width: 116, height: 116, borderRadius: '50%', background: 'rgba(0,0,0,.22)', border: '2px solid rgba(255,255,255,.3)', touchAction: 'none', zIndex: 30 }}
    >
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: 50, height: 50, marginLeft: -25, marginTop: -25, transform: `translate(${knob.x}px, ${knob.y}px)`, borderRadius: '50%', background: 'rgba(255,255,255,.5)', pointerEvents: 'none' }} />
    </div>
  )
}

const EnvMundo: React.FC = () => {
  const { gl, scene } = useThree()
  React.useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => { env.dispose(); pmrem.dispose(); scene.environment = null }
  }, [gl, scene])
  return null
}

export default function MundoPoC({
  compacto = false, onTocandoChange,
  escenarioId = ESCENARIO_MUNDO_DEFAULT, onEscenarioId,
  vistaModo = 'tercera', onVistaModo,
}: {
  compacto?: boolean; onTocandoChange?: (tocando: boolean) => void;
  // Escenario y vista los gobierna la PÁGINA (botones al lado de "Panel") → llegan como props.
  escenarioId?: string; onEscenarioId?: (id: string) => void;
  vistaModo?: string; onVistaModo?: (id: string) => void;
} = {}) {
  const bottomBase = compacto ? 78 : 16 // deja libre el menú inferior de la app en móvil
  const { personajeId, skin, baile } = usePersonajeEstudio()
  const { usuario } = useUsuario()
  const escenarioDef = React.useMemo(() => escenarioMundoPorId(escenarioId), [escenarioId])
  const colliderRef = React.useRef<THREE.Mesh | null>(null) // collider del escenario (lo llena EscenarioMundo)

  // "Cargando mundo abierto": overlay que cubre hasta que el escenario carga Y el avatar se posa sobre el
  // piso. Sin esto, al cargar se veía el personaje METIDO EN EL SUELO (el collider/medición de pies tardan
  // un instante) + la pantalla fea. Se re-muestra al cambiar de escenario.
  const [cargandoMundo, setCargandoMundo] = React.useState(true)
  React.useEffect(() => { setCargandoMundo(true) }, [escenarioId])
  const listoTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const marcarMundoListo = React.useCallback(() => {
    if (listoTimerRef.current) clearTimeout(listoTimerRef.current)
    listoTimerRef.current = setTimeout(() => setCargandoMundo(false), 700)
  }, [])
  React.useEffect(() => () => { if (listoTimerRef.current) clearTimeout(listoTimerRef.current) }, [])
  const [sentado, setSentado] = React.useState(false) // el usuario pidió sentarse (en un sofá cercano)
  const sentadoRef = React.useRef(false)
  React.useEffect(() => { sentadoRef.current = sentado }, [sentado])
  const [cercaAsiento, setCercaAsiento] = React.useState(false) // hay un sofá al alcance → mostrar botón
  // Al alejarse del sofá (o cambiar de escenario), levantarse / ocultar el botón.
  React.useEffect(() => { if (!cercaAsiento) setSentado(false) }, [cercaAsiento])
  React.useEffect(() => { setSentado(false) }, [escenarioId])
  const moveRef = React.useRef({ fwd: 0, side: 0 }) // joystick analógico (móvil)
  const [tactil, setTactil] = React.useState(false)
  React.useEffect(() => { setTactil(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) }, [])

  // Controles de juego: CORRER (PC: Shift; móvil: botón sostenido) y SALTAR (PC: Espacio; móvil: botón).
  // No son bailes (los bailes se eligen en el panel); son mecánicas del mundo.
  // CORRER (móvil): mantener presionado = corre mientras sostienes; DOBLE-TAP = lo deja FIJO (lock,
  // corre sin sostener). correrRef (lo lee el PlayerController) = fijo || presionado.
  const [corriendo, setCorriendo] = React.useState(false) // fijo (lock por doble-tap) → resalta verde
  const correrFijoRef = React.useRef(false)
  const correrPulsadoRef = React.useRef(false)
  const correrRef = React.useRef(false)
  const sincCorrer = React.useCallback(() => { correrRef.current = correrFijoRef.current || correrPulsadoRef.current }, [])
  React.useEffect(() => { correrFijoRef.current = corriendo; sincCorrer() }, [corriendo, sincCorrer])
  const ultTapCorrerRef = React.useRef(0)
  const correrDown = React.useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const now = performance.now()
    const esDoble = now - ultTapCorrerRef.current < 320
    ultTapCorrerRef.current = now
    if (esDoble) setCorriendo((v) => !v) // doble-tap = fija / quita el correr
    correrPulsadoRef.current = true; sincCorrer()
  }, [sincCorrer])
  const correrUp = React.useCallback(() => { correrPulsadoRef.current = false; sincCorrer() }, [sincCorrer])
  const saltarRef = React.useRef(0)
  const saltar = React.useCallback(() => { saltarRef.current += 1 }, [])

  // Teclas 1-5 cambian de vista (si el foco no está en un input).
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return
      const i = ['1', '2', '3', '4', '5'].indexOf(e.key)
      if (i >= 0 && VISTAS[i]) onVistaModo?.(VISTAS[i].id)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  const nombre = React.useMemo(() => (usuario as any)?.nombre || (usuario as any)?.nombre_usuario || 'Acordeonista-' + Math.random().toString(36).slice(2, 5), [usuario])
  // Semilla del spawn DETERMINISTA: id de usuario logueado (mismo punto siempre, en cualquier
  // dispositivo) o, sin login, el nombre de la sesión (estable mientras dure).
  const semillaSpawn = React.useMemo(() => String((usuario as any)?.id || nombre), [usuario, nombre])

  const lastNoteRef = React.useRef(0)
  React.useEffect(() => subscribirNotas((e) => { if (e.accion === 'down') lastNoteRef.current = performance.now() }), [])

  const estadoLocalRef = React.useRef<EstadoJugador>({ x: 0, z: 0, ry: 0, personajeId, anim: null, nombre, tocando: false, mira: 0 })
  const { remotos, remotosRef, miId, suscribirNotasRemotas } = useMultijugador(estadoLocalRef)
  // Modo Competencia (Rebanada 1): handshake + acuerdo del reto.
  const reto = useReto(miId, nombre)

  // Efectos de aparición/desaparición de jugadores (partículas). Diff de la lista de remotos: el que
  // ENTRA → chispas doradas en su spawn; el que SALE → chispas celestes en su última posición.
  const posRemotosRef = React.useRef<Map<string, [number, number]>>(new Map())
  const prevRemotosRef = React.useRef<string[]>([])
  const [efectos, setEfectos] = React.useState<Array<{ key: number; pos: [number, number, number]; tipo: 'aparecer' | 'desaparecer' }>>([])
  const keyEfectoRef = React.useRef(0)
  React.useEffect(() => {
    const prev = prevRemotosRef.current
    const nuevos: Array<{ key: number; pos: [number, number, number]; tipo: 'aparecer' | 'desaparecer' }> = []
    for (const id of remotos) {
      if (prev.includes(id)) continue
      const e = remotosRef.current.get(id)
      if (e) nuevos.push({ key: keyEfectoRef.current++, pos: [e.target.x, 0, e.target.z], tipo: 'aparecer' })
    }
    for (const id of prev) {
      if (remotos.includes(id)) continue
      const p = posRemotosRef.current.get(id)
      if (p) { nuevos.push({ key: keyEfectoRef.current++, pos: [p[0], 0, p[1]], tipo: 'desaparecer' }); posRemotosRef.current.delete(id) }
    }
    if (nuevos.length) setEfectos((es) => [...es, ...nuevos])
    prevRemotosRef.current = remotos
  }, [remotos, remotosRef])
  const quitarEfecto = React.useCallback((key: number) => setEfectos((es) => es.filter((e) => e.key !== key)), [])

  // Efecto de partículas cuando TÚ cambias de personaje (chispas doradas en tu posición actual) →
  // la transición se siente menos brusca. Salta el primer montaje (no es un cambio).
  const prevPersonajeLocalRef = React.useRef<string | null>(null)
  React.useEffect(() => {
    if (prevPersonajeLocalRef.current !== null && prevPersonajeLocalRef.current !== personajeId) {
      const s = estadoLocalRef.current
      setEfectos((es) => [...es, { key: keyEfectoRef.current++, pos: [s.x, 0, s.z], tipo: 'aparecer' }])
    }
    prevPersonajeLocalRef.current = personajeId
  }, [personajeId])

  // Audio de los demás POR JUGADOR: clic en un avatar → lo escuchas (toggle). + volumen.
  const [escuchando, setEscuchando] = React.useState<Set<string>>(new Set())
  const escuchandoRef = React.useRef(escuchando)
  React.useEffect(() => { escuchandoRef.current = escuchando }, [escuchando])
  const [volumen, setVolumen] = React.useState(0.85)
  const toggleEscuchar = React.useCallback((id: string) => {
    setEscuchando((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }, [])

  // Durante el turno del RIVAL en un duelo, lo auto-escuchas (su avatar ya anima por las notas de red;
  // así además lo OYES sin tener que clicarlo). El id del oponente del reto = el id de su avatar.
  // Cuando ME TOCA jugar, MUTEO todo lo que escucho (vacío el set) → no oigo al otro mientras toco mi
  // turno (pedido del usuario); al pasar al turno del rival se vuelve a auto-escuchar.
  React.useEffect(() => {
    if (reto.meTocaJugar) { setEscuchando(new Set()); return }
    if (reto.dueloIniciado && !reto.terminado && reto.oponente) {
      const id = reto.oponente.id
      setEscuchando((s) => (s.has(id) ? s : new Set(s).add(id)))
    }
  }, [reto.dueloIniciado, reto.meTocaJugar, reto.terminado, reto.oponente])

  // Clic en un avatar → abre un mini-popup con acciones (Escuchar / Retar) para ESE jugador.
  const [seleccionado, setSeleccionado] = React.useState<{ id: string; nombre: string } | null>(null)
  const seleccionarJugador = React.useCallback((id: string) => {
    const nom = remotosRef.current.get(id)?.target.nombre || 'Jugador'
    setSeleccionado({ id, nombre: nom })
  }, [remotosRef])

  // "Tocar en vivo": al abrir el panel, el teclado toca el acordeón → bloqueamos el movimiento por
  // teclado (ref para no re-registrar el useFrame del PlayerController).
  const [tocarAbierto, setTocarAbierto] = React.useState(false)
  const bloquearTecladoRef = React.useRef(false)
  // Bloquear el movimiento por teclado mientras tocas en vivo O juegas tu turno del duelo (las teclas
  // son notas del acordeón, no caminar).
  React.useEffect(() => { bloquearTecladoRef.current = tocarAbierto || reto.meTocaJugar }, [tocarAbierto, reto.meTocaJugar])
  // Avisar a la página (para ocultar los botones P/F y demás chrome mientras se toca → vista limpia).
  React.useEffect(() => { onTocandoChange?.(tocarAbierto || reto.meTocaJugar) }, [tocarAbierto, reto.meTocaJugar, onTocandoChange])
  // Cerrar el acordeón: también sale de pantalla completa (el SimuladorApp embebido la pide en Android).
  const cerrarTocar = React.useCallback(() => {
    setTocarAbierto(false)
    const doc: any = document
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      try { (doc.exitFullscreen || doc.webkitExitFullscreen)?.call(doc) } catch {}
    }
  }, [])

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', background: 'linear-gradient(#add0e6, #cfe6d0)' }}>
      {/* Motor de audio oyente (fuera del Canvas; reproduce lo que tocan los jugadores elegidos). Se
          APAGA durante MI turno del duelo → el motor del duelo es el único usando el audio (sin
          contención = sin latencia en la ejecución). */}
      {escuchando.size > 0 && !reto.meTocaJugar && <OyenteRemoto suscribir={suscribirNotasRemotas} volumen={volumen} escuchandoRef={escuchandoRef} tonalidadForzada={reto.dueloIniciado ? reto.cancion?.tonalidad : undefined} />}
      {/* Mientras tocas en móvil (SimuladorApp overlay tapa el mundo), PAUSAMOS el render 3D
          (frameloop=never) → libera CPU/GPU del teléfono para que las notas se transmitan SIN latencia.
          La conexión y el broadcast de notas (emisor → useMultijugador) NO dependen del Canvas, siguen
          vivos; los demás te oyen al instante. Al cerrar, el render se reanuda. */}
      <Canvas shadows={compacto ? false : 'soft'} frameloop={(tocarAbierto && tactil) || reto.meTocaJugar ? 'never' : 'always'} camera={{ position: [0, 2, 5], fov: 48 }} dpr={compacto ? 1 : [1, 1.25]}>
        <React.Suspense fallback={null}>
          <EnvMundo />
          <CieloDomo />
          <fog attach="fog" args={['#d4e4ee', 45, 160]} />
          <ambientLight intensity={0.5} />
          <LuzSol estadoLocalRef={estadoLocalRef} />
          <EscenarioMundo def={escenarioDef} colliderRef={colliderRef} jugadorRef={estadoLocalRef} onListo={marcarMundoListo} />
          <PlayerController personajeId={personajeId} skin={skin} baile={baile} nombre={nombre} vistaModo={vistaModo} limite={escenarioDef.limite} lastNoteRef={lastNoteRef} estadoLocalRef={estadoLocalRef} remotosRef={remotosRef} onSeleccionarJugador={seleccionarJugador} moveRef={moveRef} semillaSpawn={semillaSpawn} bloquearTecladoRef={bloquearTecladoRef} correrRef={correrRef} saltarRef={saltarRef} colliderRef={colliderRef} spawnFijo={escenarioDef.spawn} mirarFijo={escenarioDef.mirar} sentadoRef={sentadoRef} asientos={escenarioDef.asientos} onCercaAsiento={setCercaAsiento} />
          {/* Cada avatar remoto en su PROPIO Suspense: si uno nuevo entra con un personaje aún no
              cargado, solo se carga él mismo SIN borrar/recargar la escena de los demás. */}
          {remotos.map((id) => (
            <React.Suspense key={id} fallback={null}>
              <AvatarRemoto id={id} remotosRef={remotosRef} escuchando={escuchando.has(id)} suscribirNotasRemotas={suscribirNotasRemotas} posRemotosRef={posRemotosRef} colliderRef={colliderRef} />
            </React.Suspense>
          ))}
          {/* Efectos de partículas al entrar/salir un jugador (efímeros, se auto-desmontan). */}
          {efectos.map((ef) => (
            <EfectoJugador key={ef.key} pos={ef.pos} tipo={ef.tipo} onDone={() => quitarEfecto(ef.key)} />
          ))}
        </React.Suspense>
      </Canvas>

      {/* "Cargando mundo abierto": cubre la vista hasta que el escenario carga y el avatar se posa sobre el
          piso (evita ver al personaje metido en el suelo + la pantalla fea inicial). */}
      {cargandoMundo && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, background: 'radial-gradient(ellipse at center, #1a2740 0%, #0a0e1a 78%)', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
          <style>{`@keyframes mundoSpin{to{transform:rotate(360deg)}}@keyframes mundoPulse{0%,100%{opacity:.55}50%{opacity:1}}`}</style>
          <div style={{ width: 62, height: 62, borderRadius: '50%', border: '4px solid rgba(255,255,255,.14)', borderTopColor: '#ff7a18', animation: 'mundoSpin .9s linear infinite' }} />
          <div style={{ fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 800, letterSpacing: '.5px' }}>🌍 Cargando mundo abierto</div>
          <div style={{ fontSize: 14, opacity: .85, animation: 'mundoPulse 1.5s ease-in-out infinite' }}>¡Prepárate para disfrutar!</div>
        </div>
      )}

      {/* Contador */}
      <div style={{ position: 'absolute', top: 16, right: 16, color: '#fff', background: 'rgba(0,0,0,.5)', padding: '6px 12px', borderRadius: 20, fontFamily: 'system-ui, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#39d353', display: 'inline-block' }} />
        {remotos.length + 1} {remotos.length + 1 === 1 ? 'jugador' : 'jugadores'}
      </div>

      {/* Audio: clic en un jugador para escucharlo + volumen */}
      <div style={{ position: 'absolute', top: 54, right: 16, display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,.5)', padding: '6px 12px', borderRadius: 20, fontFamily: 'system-ui, sans-serif', fontSize: 13, color: '#fff' }}>
        {escuchando.size > 0 ? (
          <>
            <span>🔊 Escuchando a {escuchando.size}</span>
            <input type="range" min={0} max={1} step={0.05} value={volumen} onChange={(e) => setVolumen(Number(e.target.value))} style={{ width: 80 }} title="Volumen" />
            <button type="button" onClick={() => setEscuchando(new Set())} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 13 }} title="Silenciar todos">✕</button>
          </>
        ) : (
          <span style={{ opacity: 0.85 }}>🔇 Clic en un jugador para escucharlo</span>
        )}
      </div>

      {/* Mini-popup de acciones al clicar un jugador: escucharlo o retarlo (Modo Competencia). Solo se
          muestra si no hay un reto en curso (para no tapar el panel del reto). */}
      {seleccionado && reto.estado === 'libre' && (
        <div style={{ position: 'absolute', top: 92, left: '50%', transform: 'translateX(-50%)', zIndex: 60, background: 'rgba(15,18,26,.94)', color: '#fff', borderRadius: 12, padding: 12, fontFamily: 'system-ui, sans-serif', boxShadow: '0 8px 28px rgba(0,0,0,.5)', border: '1px solid rgba(255,255,255,.12)', minWidth: 200 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700 }}>{seleccionado.nombre}</span>
            <button type="button" onClick={() => setSeleccionado(null)} style={{ border: 'none', background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => toggleEscuchar(seleccionado.id)} style={{ flex: 1, border: 'none', borderRadius: 9, padding: '9px 10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: escuchando.has(seleccionado.id) ? '#27ae60' : '#333b48', color: '#fff' }}>
              {escuchando.has(seleccionado.id) ? '🔊 Silenciar' : '🔊 Escuchar'}
            </button>
            <button type="button" onClick={() => { reto.invitar(seleccionado.id, seleccionado.nombre); setSeleccionado(null) }} style={{ flex: 1, border: 'none', borderRadius: 9, padding: '9px 10px', fontSize: 14, fontWeight: 700, cursor: 'pointer', background: '#ff7a18', color: '#fff' }}>
              ⚔️ Retar
            </button>
          </div>
        </div>
      )}

      {/* Panel del reto (invitación / negociación con chat + canción / duelo). */}
      <PanelReto
        estado={reto.estado} oponente={reto.oponente} cancion={reto.cancion} chat={reto.chat}
        miListo={reto.miListo} suListo={reto.suListo} ambosListos={reto.ambosListos}
        aviso={reto.aviso} limpiarAviso={reto.limpiarAviso}
        aceptar={reto.aceptar} rechazar={reto.rechazar} cancelar={reto.cancelar}
        enviarChat={reto.enviarChat} proponerCancion={reto.proponerCancion} marcarListo={reto.marcarListo}
        soyRetador={reto.soyRetador} dueloIniciado={reto.dueloIniciado} meTocaJugar={reto.meTocaJugar}
        terminado={reto.terminado} ganador={reto.ganador} miPuntaje={reto.miPuntaje} rivalPuntaje={reto.rivalPuntaje}
        empezarDuelo={reto.empezarDuelo} revancha={reto.revancha}
      />

      {/* DUELO: cuando es MI turno, el simulador real ocupa la pantalla con la canción acordada. En
          MÓVIL = SimuladorApp (JuegoSimuladorApp); en COMPUTADOR = pantalla competitiva de AcordeonProMax
          (ModoJuego). Al terminar reporta el puntaje (el turno avanza solo). Salir antes = forfeit (0). */}
      {reto.meTocaJugar && reto.cancion && (
        tactil
          ? <DueloSimulador cancionId={reto.cancion.id} seccionId={reto.cancion.seccionId} metaRival={reto.rivalPuntaje} onResultado={reto.reportarPuntaje} onAbandonar={() => reto.reportarPuntaje(0)} />
          : <DueloSimuladorDesktop cancionId={reto.cancion.id} seccionId={reto.cancion.seccionId} metaRival={reto.rivalPuntaje} onResultado={reto.reportarPuntaje} onAbandonar={() => reto.reportarPuntaje(0)} />
      )}

      {/* Botón Tocar. En táctil abre el SimuladorApp real como OVERLAY (sin salir del mundo); en
          desktop, el panel pequeño embebido. */}
      <button
        type="button"
        onClick={() => setTocarAbierto((v) => !v)}
        style={{ position: 'absolute', top: 92, right: 16, display: 'flex', alignItems: 'center', gap: 6, background: tocarAbierto ? '#ff7a18' : 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
        title="Tocar el acordeón"
      >
        🎹 {tocarAbierto ? 'Cerrar' : 'Tocar'}
      </button>

      {/* Botón SENTARSE: aparece SOLO cuando hay un sofá al alcance (o ya estás sentado). Click = sentarse en
          el sofá más cercano; otra vez = pararse. */}
      {(cercaAsiento || sentado) && (
        <button
          type="button"
          onClick={() => setSentado((v) => !v)}
          style={{ position: 'absolute', top: 128, right: 16, display: 'flex', alignItems: 'center', gap: 6, background: sentado ? '#27ae60' : 'rgba(0,0,0,.5)', color: '#fff', border: 'none', borderRadius: 20, padding: '6px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          title="Sentarse en el sofá más cercano"
        >
          {sentado ? '🧍 Pararse' : '🪑 Sentarse'}
        </button>
      )}

      {/* TÁCTIL (móvil/tablet): SimuladorApp REAL como overlay a pantalla completa, SIN salir del mundo
          → la sesión multijugador sigue viva y los demás te oyen/ven tocar. Trae su propio aviso de
          "gira el teléfono a horizontal". Botón "Volver al mundo" arriba-izquierda (donde iría su volver). */}
      {tocarAbierto && tactil && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#000' }}>
          <React.Suspense fallback={<div style={{ color: '#fff', padding: 24, fontFamily: 'system-ui' }}>Cargando acordeón…</div>}>
            <SimuladorApp />
          </React.Suspense>
          <button
            type="button"
            onClick={cerrarTocar}
            style={{ position: 'fixed', top: 10, left: 10, zIndex: 100000, display: 'flex', alignItems: 'center', gap: 6, background: '#c0392b', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontFamily: 'system-ui, sans-serif', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,.5)' }}
          >
            ← Volver al mundo
          </button>
        </div>
      )}

      {/* DESKTOP: panel pequeño flotante sobre el HUD. */}
      {tocarAbierto && !tactil && (
        <div style={{ position: 'absolute', left: '50%', bottom: bottomBase, transform: 'translateX(-50%)', zIndex: 50, maxWidth: 'calc(100% - 16px)' }}>
          <TocarEnVivo onCerrar={() => setTocarAbierto(false)} ancho={460} />
        </div>
      )}

      {/* Joystick táctil (móvil) — bien abajo a la izquierda (no tapa al personaje). */}
      {tactil && !tocarAbierto && <Joystick moveRef={moveRef} bottom={16} />}

      {/* CONTROLES de juego en móvil: Saltar (pulso) + Correr (mantener = corre; DOBLE-TAP = fijo/lock).
          Más abajo y más chicos que antes para NO tapar al personaje. En PC son Shift y Espacio. */}
      {tactil && !tocarAbierto && (
        <div style={{ position: 'absolute', right: 16, bottom: 20, zIndex: 32, display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <button type="button" onPointerDown={(e) => { e.preventDefault(); saltar() }}
            style={{ width: 60, height: 60, borderRadius: '50%', border: '2px solid rgba(255,255,255,.35)', background: 'rgba(0,0,0,.45)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}>
            ⤴️<br />Saltar
          </button>
          <button type="button" onPointerDown={correrDown} onPointerUp={correrUp} onPointerLeave={correrUp} onPointerCancel={correrUp}
            title="Mantener para correr · doble-tap para fijar"
            style={{ width: 60, height: 60, borderRadius: '50%', border: corriendo ? '2px solid #6ee7a0' : '2px solid rgba(255,255,255,.35)', background: corriendo ? '#27ae60' : 'rgba(0,0,0,.45)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', touchAction: 'none', WebkitTapHighlightColor: 'transparent' }}>
            🏃<br />{corriendo ? 'Fijo' : 'Correr'}
          </button>
        </div>
      )}

      {/* HUD inferior: SOLO una línea de ayuda compacta (los selectores de escenario/vista se movieron a
          los menús de arriba para no tapar la pantalla). Se oculta mientras tocas. */}
      {!tocarAbierto && (
        <div style={{ position: 'absolute', left: tactil ? 160 : 16, bottom: bottomBase, fontFamily: 'system-ui, sans-serif', maxWidth: tactil ? 'calc(100% - 300px)' : 'calc(100% - 180px)' }}>
          <div style={{ color: '#fff', background: 'rgba(0,0,0,.42)', padding: '6px 11px', borderRadius: 9, fontSize: 12, width: 'fit-content' }}>
            {tactil
              ? <><b>Joystick</b> caminar · <b>arrastra</b> mirar · <b>tap</b> a un jugador para oírlo</>
              : <><b>WASD</b> caminar · <b>Shift</b> correr · <b>Espacio</b> saltar · <b>arrastra</b> mirar · <b>rueda</b> zoom · <b>1-5</b> vistas</>}
          </div>
        </div>
      )}
    </div>
  )
}
