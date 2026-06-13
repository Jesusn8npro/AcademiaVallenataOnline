'use client'
import * as React from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { PERSONAJES } from '../../personajes'
import { Modelo } from '../visor/Modelo'
import { usePersonajeEstudio } from '../../contextoPersonajeEstudio'
import { useUsuario } from '../../../../../contextos/UsuarioContext'
import { subscribirNotas } from '../../../../../Core/audio/emisorNotasAcordeon'
import { useLogicaAcordeon } from '../../../../../Core/hooks/useLogicaAcordeon'
import { motorAudioPro } from '../../../../../Core/audio/AudioEnginePro'
import { useMultijugador, EstadoJugador, RemotoEntry, NotaRemotaCb } from './useMultijugador'
import { useReto } from './useReto'
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

// Modos de cámara seleccionables. tercera/lejana = orbital 3ª persona; primera = ojos del personaje;
// cenital = picado desde arriba. Cada uno fija distancia/ángulo base (el mouse y la rueda ajustan encima).
export interface ModoVista { id: string; nombre: string; dist: number; pitch: number; cenital: boolean; primera: boolean }
export const VISTAS: ModoVista[] = [
  { id: 'tercera', nombre: '3ª persona', dist: 4.6, pitch: 0.32, cenital: false, primera: false },
  { id: 'lejana', nombre: 'Lejana', dist: 8.5, pitch: 0.45, cenital: false, primera: false },
  { id: 'primera', nombre: '1ª persona', dist: 0.5, pitch: 0.45, cenital: false, primera: true },
  { id: 'cenital', nombre: 'Cenital', dist: 11, pitch: 0.9, cenital: true, primera: false },
]

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
      g.traverse((o: any) => { if (!hips && o.isBone && /Hips$/.test(o.name || '')) hips = o })
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
    <Html position={[0, 2.05, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none', transform: 'translateY(-50%)' }}>
      <div style={{ whiteSpace: 'nowrap', padding: '1px 8px', borderRadius: 10, background: 'rgba(15,18,26,.7)', color: '#fff', fontSize: 12, fontFamily: 'system-ui, sans-serif', display: 'flex', gap: 4, alignItems: 'center', border: escuchando ? '1px solid #39d353' : tocando ? '1px solid #ffd54a' : '1px solid transparent' }}>
        {nombre || 'Jugador'}{tocando && <span style={{ fontSize: 13 }}>🎵</span>}{escuchando && <span style={{ fontSize: 12 }}>🔊</span>}
      </div>
    </Html>
  )
}

// Avatar de OTRO usuario: interpola pos/rot y replica personaje + animación + nombre + 🎵 + ANIMA
// los dedos/fuelle de lo que ESE jugador está tocando (notas de la red filtradas por su id).
function AvatarRemoto({ id, remotosRef, escuchando, suscribirNotasRemotas, posRemotosRef }: { id: string; remotosRef: React.MutableRefObject<Map<string, RemotoEntry>>; escuchando?: boolean; suscribirNotasRemotas: (cb: NotaRemotaCb) => () => void; posRemotosRef: React.MutableRefObject<Map<string, [number, number]>> }) {
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
    posRemotosRef.current.set(id, [g.position.x, g.position.z]) // última posición → efecto al irse
  })

  return (
    <group ref={grupo} userData={{ idJugador: id }}>
      <Etiqueta nombre={nombre} tocando={tocando} escuchando={escuchando} />
      <AnclaPies claveMedicion={glb}>
        <Modelo key={glb} fuelleAbiertoRef={fuelleRef} skin="original" glb={glb} baile={anim} fuenteNotas={fuenteNotas} headYawRef={headYawRef} tocandoRef={tocandoRef} ligero />
      </AnclaPies>
    </group>
  )
}

// PlayerController: movimiento + cámara, DESACOPLADO de las notas. Solo actúa en MODO CAMINANTE
// (pointer-lock): WASD/flechas mueven con velocidad amortiguada, el mouse orbita la cámara 360°, la
// rueda acerca/aleja (hasta 1ª persona). Fuera del modo, no mueve nada y la cámara queda quieta
// detrás del personaje (cursor libre para la interfaz). Colisión suave con remotos (no bloquea).
function PlayerController({ personajeId, skin, baile, nombre, vistaModo, lastNoteRef, estadoLocalRef, remotosRef, onSeleccionarJugador, moveRef, semillaSpawn, bloquearTecladoRef }: {
  personajeId: string; skin: string; baile: string | null; nombre: string; vistaModo: string
  lastNoteRef: React.MutableRefObject<number>; estadoLocalRef: React.MutableRefObject<EstadoJugador>
  remotosRef: React.MutableRefObject<Map<string, RemotoEntry>>; onSeleccionarJugador?: (id: string) => void
  moveRef: React.MutableRefObject<{ fwd: number; side: number }>; semillaSpawn: string
  bloquearTecladoRef: React.MutableRefObject<boolean>
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
  const arrastrando = React.useRef(false) // rotando la cámara con el clic mantenido
  const recentrar = React.useRef(false)   // tecla C → recentrar la cámara detrás del personaje
  const _ray = React.useRef(new THREE.Raycaster())
  const _ndc = React.useRef(new THREE.Vector2())

  // Aplicar el modo de vista elegido (distancia/ángulo base). El mouse y la rueda ajustan encima.
  React.useEffect(() => {
    const v = VISTAS.find((x) => x.id === vistaModo) ?? VISTAS[0]
    dist.current = v.dist; pitch.current = v.pitch; cenital.current = v.cenital; primera.current = v.primera
  }, [vistaModo])
  const [caminando, setCaminando] = React.useState(false)
  const [tocando, setTocando] = React.useState(false)
  const { gl, camera, scene } = useThree()
  const _f = React.useRef(new THREE.Vector3())
  const _r = React.useRef(new THREE.Vector3())
  const _d = React.useRef(new THREE.Vector3())
  const _tgt = React.useRef(new THREE.Vector3())

  const spawn = React.useMemo(() => spawnDeterminista(semillaSpawn), [semillaSpawn])
  React.useEffect(() => {
    if (grupo.current) grupo.current.position.set(spawn[0], 0, spawn[1])
    estadoLocalRef.current.x = spawn[0]; estadoLocalRef.current.z = spawn[1]
  }, [spawn, estadoLocalRef])

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
    const onKeyDn = (e: KeyboardEvent) => { if (enInput()) return; if (e.key.toLowerCase() === 'c') recentrar.current = true; if (e.key.startsWith('Arrow')) e.preventDefault(); teclas.current[e.key.toLowerCase()] = true }
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

  useFrame((_, dt) => {
    const g = grupo.current
    if (!g) return
    const t = teclas.current

    // Direcciones relativas al yaw de la cámara. (right invertido → A/D en el sentido natural.)
    const fwd = _f.current.set(Math.sin(yaw.current), 0, Math.cos(yaw.current))
    const right = _r.current.set(-Math.cos(yaw.current), 0, Math.sin(yaw.current))
    // Teclado + joystick analógico (móvil) sumados. Si el panel "Tocar en vivo" está abierto, el
    // teclado toca el acordeón (W/A/S/D son notas) → ignoramos las teclas de movimiento (el joystick
    // móvil sigue funcionando). Es el "modo tocar": para caminar de nuevo se cierra el panel.
    const kb = bloquearTecladoRef.current ? 0 : 1
    const iz = kb * ((t['w'] || t['arrowup'] ? 1 : 0) - (t['s'] || t['arrowdown'] ? 1 : 0)) + moveRef.current.fwd
    const ix = kb * ((t['d'] || t['arrowright'] ? 1 : 0) - (t['a'] || t['arrowleft'] ? 1 : 0)) + moveRef.current.side
    const desired = _d.current.set(0, 0, 0).addScaledVector(fwd, iz).addScaledVector(right, ix)
    const mag = desired.length() // analógico: joystick a medias = camina más lento; clamp a 1 = full
    if (mag > 1e-4) desired.multiplyScalar(((mag > 1 ? 1 / mag : 1)) * VEL)

    // Velocidad AMORTIGUADA → aceleración/desaceleración suaves (sin saltos).
    vel.current.x = THREE.MathUtils.damp(vel.current.x, desired.x, ACCEL, dt)
    vel.current.z = THREE.MathUtils.damp(vel.current.z, desired.z, ACCEL, dt)
    g.position.x += vel.current.x * dt
    g.position.z += vel.current.z * dt

    // Límite del mundo.
    const rad = Math.hypot(g.position.x, g.position.z)
    if (rad > LIMITE) { g.position.x *= LIMITE / rad; g.position.z *= LIMITE / rad }

    // Colisión SUAVE con remotos: si se solapan, se separan un poco (no bloquea el movimiento).
    for (const [, ent] of remotosRef.current) {
      const dx = g.position.x - ent.target.x, dz = g.position.z - ent.target.z
      const dd = Math.hypot(dx, dz)
      if (dd > 1e-3 && dd < SEP) { const push = (SEP - dd) * 0.5; g.position.x += (dx / dd) * push; g.position.z += (dz / dd) * push }
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
    if (moviendo !== caminando) setCaminando(moviendo)

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
    est.personajeId = personajeId; est.anim = moviendo ? 'Caminata' : baile
    est.nombre = nombre; est.tocando = tocandoAhora; est.mira = yaw.current

    // Cámara según el modo de vista. Rotación 1:1 con el mouse (yaw/pitch).
    const P = g.position
    if (cenital.current) {
      // Picado desde arriba, centrado en el personaje.
      camera.position.set(P.x, P.y + dist.current, P.z + 0.01)
      _tgt.current.set(P.x, P.y, P.z)
    } else if (primera.current) {
      // Ojos del personaje, mirando hacia adelante (yaw) con tilt vertical por el pitch.
      const hx = Math.sin(yaw.current), hz = Math.cos(yaw.current)
      camera.position.set(P.x + hx * 0.15, P.y + 1.6, P.z + hz * 0.15)
      const v = (pitch.current - 0.45) * 3
      _tgt.current.set(P.x + hx * 3, P.y + 1.6 + v, P.z + hz * 3)
    } else {
      // Orbital 3ª persona: detrás/encima según yaw/pitch/dist.
      const cp = Math.cos(pitch.current), sp = Math.sin(pitch.current)
      _tgt.current.set(P.x, P.y + TARGET_H, P.z)
      camera.position.set(
        P.x - Math.sin(yaw.current) * dist.current * cp,
        P.y + TARGET_H + dist.current * sp,
        P.z - Math.cos(yaw.current) * dist.current * cp,
      )
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
          <Modelo key={glb} fuelleAbiertoRef={fuelleRef} skin={skin} glb={glb} baile={caminando ? 'Caminata' : baile} headYawRef={headYawRef} tocandoRef={tocandoRef} />
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
  // En un DUELO forzamos la tonalidad de la CANCIÓN + el acordeón POR DEFECTO → el banco de este oyente
  // queda IGUAL al del que toca (mismo instrumento + tono), así las notas remotas suenan idénticas y el
  // fallback también queda correcto, sin cruzarse con el instrumento/tonalidad personal del que escucha
  // (era el bug "llega en otro tono / se cruza con el acordeón preseleccionado").
  React.useEffect(() => {
    if (!tonalidadForzada) return
    if (logica.setTonalidadSeleccionada) logica.setTonalidadSeleccionada(tonalidadForzada)
    if (logica.setInstrumentoId && logica.instrumentoId !== '4e9f2a94-21c0-4029-872e-7cb1c314af69') logica.setInstrumentoId('4e9f2a94-21c0-4029-872e-7cb1c314af69')
  }, [tonalidadForzada, logica.setTonalidadSeleccionada, logica.setInstrumentoId, logica.instrumentoId])
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

export default function MundoPoC({ compacto = false }: { compacto?: boolean } = {}) {
  const bottomBase = compacto ? 78 : 16 // deja libre el menú inferior de la app en móvil
  const { personajeId, skin, baile } = usePersonajeEstudio()
  const { usuario } = useUsuario()
  const [vistaModo, setVistaModo] = React.useState('tercera')
  const moveRef = React.useRef({ fwd: 0, side: 0 }) // joystick analógico (móvil)
  const [tactil, setTactil] = React.useState(false)
  React.useEffect(() => { setTactil(typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)) }, [])

  // Teclas 1-4 cambian de vista (si el foco no está en un input).
  React.useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const a = document.activeElement
      if (a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA')) return
      const i = ['1', '2', '3', '4'].indexOf(e.key)
      if (i >= 0 && VISTAS[i]) setVistaModo(VISTAS[i].id)
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
      <Canvas frameloop={(tocarAbierto && tactil) || reto.meTocaJugar ? 'never' : 'always'} camera={{ position: [0, 2, 5], fov: 48 }} dpr={compacto ? 1 : [1, 1.25]}>
        <React.Suspense fallback={null}>
          <EnvMundo />
          <fog attach="fog" args={['#bcd9d2', 38, 120]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[10, 16, 8]} intensity={1.2} />
          <Escena />
          <PlayerController personajeId={personajeId} skin={skin} baile={baile} nombre={nombre} vistaModo={vistaModo} lastNoteRef={lastNoteRef} estadoLocalRef={estadoLocalRef} remotosRef={remotosRef} onSeleccionarJugador={seleccionarJugador} moveRef={moveRef} semillaSpawn={semillaSpawn} bloquearTecladoRef={bloquearTecladoRef} />
          {/* Cada avatar remoto en su PROPIO Suspense: si uno nuevo entra con un personaje aún no
              cargado, solo se carga él mismo SIN borrar/recargar la escena de los demás. */}
          {remotos.map((id) => (
            <React.Suspense key={id} fallback={null}>
              <AvatarRemoto id={id} remotosRef={remotosRef} escuchando={escuchando.has(id)} suscribirNotasRemotas={suscribirNotasRemotas} posRemotosRef={posRemotosRef} />
            </React.Suspense>
          ))}
          {/* Efectos de partículas al entrar/salir un jugador (efímeros, se auto-desmontan). */}
          {efectos.map((ef) => (
            <EfectoJugador key={ef.key} pos={ef.pos} tipo={ef.tipo} onDone={() => quitarEfecto(ef.key)} />
          ))}
        </React.Suspense>
      </Canvas>

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
        empezarDuelo={reto.empezarDuelo}
      />

      {/* DUELO: cuando es MI turno, el simulador real ocupa la pantalla con la canción acordada. En
          MÓVIL = SimuladorApp (JuegoSimuladorApp); en COMPUTADOR = pantalla competitiva de AcordeonProMax
          (ModoJuego). Al terminar reporta el puntaje (el turno avanza solo). Salir antes = forfeit (0). */}
      {reto.meTocaJugar && reto.cancion && (
        tactil
          ? <DueloSimulador cancionId={reto.cancion.id} seccionId={reto.cancion.seccionId} onResultado={reto.reportarPuntaje} onAbandonar={() => reto.reportarPuntaje(0)} />
          : <DueloSimuladorDesktop cancionId={reto.cancion.id} seccionId={reto.cancion.seccionId} onResultado={reto.reportarPuntaje} onAbandonar={() => reto.reportarPuntaje(0)} />
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

      {/* Joystick táctil (móvil) */}
      {tactil && !tocarAbierto && <Joystick moveRef={moveRef} bottom={bottomBase + 4} />}

      {/* HUD inferior: instrucciones + selector de vistas */}
      <div style={{ position: 'absolute', left: tactil ? 160 : 16, bottom: bottomBase, display: 'flex', flexDirection: 'column', gap: 8, fontFamily: 'system-ui, sans-serif', maxWidth: 'calc(100% - 180px)' }}>
        <div style={{ color: '#fff', background: 'rgba(0,0,0,.5)', padding: '7px 12px', borderRadius: 9, fontSize: 13, width: 'fit-content' }}>
          {tactil
            ? <><b>Joystick</b> caminar · <b>arrastra</b> para mirar · <b>pellizca</b> zoom · <b>tap</b> a un jugador para oírlo</>
            : <><b>WASD</b>/flechas caminar · <b>arrastra</b> para mirar · <b>rueda</b> zoom · <b>C</b> recentrar · <b>1-4</b> vistas · <b>clic</b> a un jugador para oírlo</>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {VISTAS.map((v, i) => (
            <button key={v.id} type="button" onClick={() => setVistaModo(v.id)} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, background: vistaModo === v.id ? '#ff7a18' : 'rgba(0,0,0,.5)', color: '#fff', fontWeight: vistaModo === v.id ? 700 : 400 }}>
              <span style={{ opacity: 0.6, marginRight: 4 }}>{i + 1}</span>{v.nombre}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
