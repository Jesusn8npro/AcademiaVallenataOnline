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
      const c = box.getCenter(new THREE.Vector3())
      // setFromObject da bbox en MUNDO; el offset es LOCAL. Restamos la pos mundo del grupo (S) para
      // centrar el personaje SOBRE su grupo esté donde esté (sin esto se va volando al origen del mundo).
      const S = g.getWorldPosition(new THREE.Vector3())
      g.position.set(S.x - c.x, S.y - box.min.y, S.z - c.z)
    }
    raf = requestAnimationFrame(medir)
    return () => cancelAnimationFrame(raf)
  }, [claveMedicion])
  return <group ref={ref}>{children}</group>
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

// Avatar de OTRO usuario: interpola pos/rot y replica personaje + animación + nombre + 🎵.
function AvatarRemoto({ id, remotosRef, escuchando }: { id: string; remotosRef: React.MutableRefObject<Map<string, RemotoEntry>>; escuchando?: boolean }) {
  const grupo = React.useRef<THREE.Group>(null!)
  const fuelleRef = React.useRef(false)
  const ent0 = remotosRef.current.get(id)
  const [personajeId, setPersonajeId] = React.useState(ent0?.target.personajeId ?? PERSONAJES[0].id)
  const [anim, setAnim] = React.useState<string | null>(ent0?.target.anim ?? null)
  const [nombre, setNombre] = React.useState(ent0?.target.nombre ?? '')
  const [tocando, setTocando] = React.useState(false)
  const glb = (PERSONAJES.find((p) => p.id === personajeId) ?? PERSONAJES[0]).archivo

  React.useEffect(() => {
    const e = remotosRef.current.get(id)
    if (e && grupo.current) { grupo.current.position.set(e.target.x, 0, e.target.z); grupo.current.rotation.y = e.target.ry }
  }, [id, remotosRef])

  useFrame((_, dt) => {
    const ent = remotosRef.current.get(id)
    const g = grupo.current
    if (!ent || !g) return
    const k = 1 - Math.exp(-10 * dt)
    g.position.x += (ent.target.x - g.position.x) * k
    g.position.z += (ent.target.z - g.position.z) * k
    g.rotation.y = dampAngle(g.rotation.y, ent.target.ry, 10, dt)
    if (ent.target.anim !== anim) setAnim(ent.target.anim)
    if (ent.target.personajeId && ent.target.personajeId !== personajeId) setPersonajeId(ent.target.personajeId)
    if (ent.target.nombre !== nombre) setNombre(ent.target.nombre)
    if (ent.target.tocando !== tocando) setTocando(ent.target.tocando)
  })

  return (
    <group ref={grupo} userData={{ idJugador: id }}>
      <Etiqueta nombre={nombre} tocando={tocando} escuchando={escuchando} />
      <AnclaPies claveMedicion={glb}>
        <Modelo key={glb} fuelleAbiertoRef={fuelleRef} skin="original" glb={glb} baile={anim} />
      </AnclaPies>
    </group>
  )
}

// PlayerController: movimiento + cámara, DESACOPLADO de las notas. Solo actúa en MODO CAMINANTE
// (pointer-lock): WASD/flechas mueven con velocidad amortiguada, el mouse orbita la cámara 360°, la
// rueda acerca/aleja (hasta 1ª persona). Fuera del modo, no mueve nada y la cámara queda quieta
// detrás del personaje (cursor libre para la interfaz). Colisión suave con remotos (no bloquea).
function PlayerController({ personajeId, skin, baile, nombre, vistaModo, lastNoteRef, estadoLocalRef, remotosRef, onSeleccionarJugador, moveRef }: {
  personajeId: string; skin: string; baile: string | null; nombre: string; vistaModo: string
  lastNoteRef: React.MutableRefObject<number>; estadoLocalRef: React.MutableRefObject<EstadoJugador>
  remotosRef: React.MutableRefObject<Map<string, RemotoEntry>>; onSeleccionarJugador?: (id: string) => void
  moveRef: React.MutableRefObject<{ fwd: number; side: number }>
}) {
  const glb = (PERSONAJES.find((p) => p.id === personajeId) ?? PERSONAJES[0]).archivo
  const grupo = React.useRef<THREE.Group>(null!)
  const fuelleRef = React.useRef(false)
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

  const spawn = React.useMemo(() => { const a = Math.random() * Math.PI * 2, r = 1 + Math.random() * 3; return [Math.cos(a) * r, Math.sin(a) * r] as const }, [])
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
    // Teclado + joystick analógico (móvil) sumados.
    const iz = (t['w'] || t['arrowup'] ? 1 : 0) - (t['s'] || t['arrowdown'] ? 1 : 0) + moveRef.current.fwd
    const ix = (t['d'] || t['arrowright'] ? 1 : 0) - (t['a'] || t['arrowleft'] ? 1 : 0) + moveRef.current.side
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
    if (moviendo !== caminando) setCaminando(moviendo)

    // Recentrar la cámara detrás del personaje (tecla C).
    if (recentrar.current) { yaw.current = g.rotation.y; recentrar.current = false }

    // ¿Tocando? (nota <500ms) — para el indicador 🎵.
    const tocandoAhora = performance.now() - lastNoteRef.current < 500
    if (tocandoAhora !== tocando) setTocando(tocandoAhora)

    // Publicar estado a la red.
    const est = estadoLocalRef.current
    est.x = g.position.x; est.z = g.position.z; est.ry = g.rotation.y
    est.personajeId = personajeId; est.anim = moviendo ? 'Caminata' : baile
    est.nombre = nombre; est.tocando = tocandoAhora

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
      <AnclaPies claveMedicion={glb}>
        <Modelo key={glb} fuelleAbiertoRef={fuelleRef} skin={skin} glb={glb} baile={caminando ? 'Caminata' : baile} />
      </AnclaPies>
    </group>
  )
}

// Motor de audio "OYENTE": un useLogicaAcordeon headless (carga los samples) que reproduce las notas
// que tocan los DEMÁS (recibidas por la red) → así escuchas a los otros usuarios tocar. Vive fuera del
// Canvas (es audio, no 3D). El volumen ajusta el maestro del motor. Solo llama reproduceTono (audio
// puro): no toca el store de botones ni emite notas → no anima ni interfiere con tu avatar.
function OyenteRemoto({ suscribir, volumen, escuchandoRef }: { suscribir: (cb: NotaRemotaCb) => () => void; volumen: number; escuchandoRef: React.MutableRefObject<Set<string>> }) {
  const logica = useLogicaAcordeon({ deshabilitarInteraccion: false })
  React.useEffect(() => { try { motorAudioPro.setVolumenMaestro(volumen) } catch {} }, [volumen])
  React.useEffect(() => suscribir((idBoton, accion, deId) => {
    // Solo suena lo de los jugadores que ELEGISTE escuchar (clic en su avatar).
    if (accion === 'down' && escuchandoRef.current.has(deId)) { try { logica.reproduceTono(idBoton) } catch {} }
  }), [suscribir, logica, escuchandoRef])
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

  const lastNoteRef = React.useRef(0)
  React.useEffect(() => subscribirNotas((e) => { if (e.accion === 'down') lastNoteRef.current = performance.now() }), [])

  const estadoLocalRef = React.useRef<EstadoJugador>({ x: 0, z: 0, ry: 0, personajeId, anim: null, nombre, tocando: false })
  const { remotos, remotosRef, suscribirNotasRemotas } = useMultijugador(estadoLocalRef)

  // Audio de los demás POR JUGADOR: clic en un avatar → lo escuchas (toggle). + volumen.
  const [escuchando, setEscuchando] = React.useState<Set<string>>(new Set())
  const escuchandoRef = React.useRef(escuchando)
  React.useEffect(() => { escuchandoRef.current = escuchando }, [escuchando])
  const [volumen, setVolumen] = React.useState(0.85)
  const toggleEscuchar = React.useCallback((id: string) => {
    setEscuchando((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }, [])

  return (
    <div style={{ flex: 1, minWidth: 0, height: '100%', position: 'relative', background: 'linear-gradient(#add0e6, #cfe6d0)' }}>
      {/* Motor de audio oyente (fuera del Canvas; reproduce lo que tocan los jugadores elegidos). */}
      {escuchando.size > 0 && <OyenteRemoto suscribir={suscribirNotasRemotas} volumen={volumen} escuchandoRef={escuchandoRef} />}
      <Canvas camera={{ position: [0, 2, 5], fov: 48 }} dpr={compacto ? 1 : [1, 1.25]}>
        <React.Suspense fallback={null}>
          <EnvMundo />
          <fog attach="fog" args={['#bcd9d2', 38, 120]} />
          <ambientLight intensity={0.65} />
          <directionalLight position={[10, 16, 8]} intensity={1.2} />
          <Escena />
          <PlayerController personajeId={personajeId} skin={skin} baile={baile} nombre={nombre} vistaModo={vistaModo} lastNoteRef={lastNoteRef} estadoLocalRef={estadoLocalRef} remotosRef={remotosRef} onSeleccionarJugador={toggleEscuchar} moveRef={moveRef} />
          {/* Cada avatar remoto en su PROPIO Suspense: si uno nuevo entra con un personaje aún no
              cargado, solo se carga él mismo SIN borrar/recargar la escena de los demás. */}
          {remotos.map((id) => (
            <React.Suspense key={id} fallback={null}>
              <AvatarRemoto id={id} remotosRef={remotosRef} escuchando={escuchando.has(id)} />
            </React.Suspense>
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

      {/* Joystick táctil (móvil) */}
      {tactil && <Joystick moveRef={moveRef} bottom={bottomBase + 4} />}

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
