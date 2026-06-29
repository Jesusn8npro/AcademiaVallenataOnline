'use client'
import * as React from 'react'
import * as THREE from 'three'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls } from '@react-three/drei'

// ───────────────────────────────────────────────────────────────────────────
// /prueba-3d — SALA DE PRUEBAS aislada del mecanismo "fuelle por huesos".
//
// Idea (decidida con el usuario): el acordeón de Pelao se exporta a UN GLB con UN
// clip de esqueleto 'AbrirCerrar' (t=0 → fuelle CERRADO, t=fin → ABIERTO) horneado
// del rig real (Spline IK del fuelle + brazo/mano por IK). En la web NO empujamos
// un morph: ESCRUBAMOS ese clip. Como cada hueso se horneó siguiendo las constraints
// reales, three.js reproduce Blender EXACTO → el fuelle no se deforma y la mano queda
// pegada SOLA (es parte del mismo clip), sin matemática de "weld" ni deriva.
//
// Interacción (pedido del usuario):
//   • Por defecto SE NAVEGA con el mouse (OrbitControls).
//   • Botón "Inhabilitar vista 3D" congela la cámara → al arrastrar se MANIPULA la
//     caja de bajos (= escrubar el clip): la mano la sigue pegada.
// ───────────────────────────────────────────────────────────────────────────

// GLB del personaje+acordeón con el clip horneado. Mientras el fuelle de Pelao se
// repara en Blender, apuntamos a un placeholder para validar la página (ruta,
// órbita, toggle, arrastre). Al tener el horneado se cambia esta constante por
// '/modelos3d/prueba-3d/pelao-prueba.glb'.
const GLB_PRUEBA = '/modelos3d/prueba-3d/pelao-prueba.glb?v=4'
const GLB_PLACEHOLDER = '/modelos3d/personaje-pelao.glb?v=3'

useGLTF.setDecoderPath('/draco/')

interface ModeloProps {
  glb: string
  // Progreso del fuelle 0..1 (0=cerrado, 1=abierto). Se aplica como tiempo del clip.
  aperturaRef: React.MutableRefObject<number>
}

function ModeloPelao({ glb, aperturaRef }: ModeloProps) {
  const grupo = React.useRef<THREE.Group>(null)
  const { scene, animations } = useGLTF(glb) as any
  // El GLB se clona para no mutar el caché de useGLTF entre montajes.
  const escena = React.useMemo(() => {
    const c = (scene as THREE.Object3D).clone(true)
    c.traverse((o: any) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false } })
    return c
  }, [scene])

  // El GLB sale a la escala NATIVA de Blender (acordeón ~200 unidades, descentrado).
  // Lo normalizamos: medimos su caja, lo centramos en el origen y lo escalamos a
  // ~2.4 de alto (tamaño humano) → la cámara y los controles trabajan en unidades
  // sanas y se puede orbitar/alejar. La escala uniforme conserva el movimiento.
  const { escala, centro } = React.useMemo(() => {
    escena.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(escena)
    const c = box.getCenter(new THREE.Vector3())
    const s = box.getSize(new THREE.Vector3())
    return { escala: 2.4 / (s.y || 1), centro: c }
  }, [escena])

  const { actions, mixer, names } = useAnimations(animations, grupo)

  // El export SCENE de Blender deja VARIOS clips (uno por armature/objeto: Pelao,
  // fuelle, Ctrl_Bajos…). Hay que reproducirlos y escrubarlos TODOS a la vez al
  // mismo tiempo → el personaje, el fuelle y la caja se mueven sincronizados.
  const accionesRef = React.useRef<THREE.AnimationAction[]>([])
  React.useEffect(() => {
    const todas = names.map((n) => actions[n]).filter(Boolean) as THREE.AnimationAction[]
    accionesRef.current = todas
    for (const a of todas) {
      a.reset(); a.play(); a.paused = true; a.clampWhenFinished = true; a.time = 0
    }
    mixer.update(0)
    return () => { for (const a of todas) a.stop() }
  }, [actions, names, mixer])

  // Aplica la apertura (0..1) como tiempo de TODOS los clips en cada frame.
  useEscrub(accionesRef, mixer, aperturaRef)

  React.useEffect(() => { (window as any).__pruebaDbg = { escena, aperturaRef, acciones: accionesRef, mixer } }, [escena, aperturaRef, mixer])

  // grupo (con la animación) = escalado; dentro, un grupo que recentra el modelo.
  return (
    <group ref={grupo} scale={escala}>
      <group position={[-centro.x, -centro.y, -centro.z]}>
        <primitive object={escena} />
      </group>
    </group>
  )
}

// Hook de escrubado: en cada frame del Canvas mapea aperturaRef(0..1) → action.time
// de TODOS los clips. Cada clip usa su propia duración (todos cubren el mismo tramo
// cerrado→abierto). drei's useAnimations llama mixer.update(delta) en su propio
// useFrame; como las acciones están pausadas, el tiempo lo fijamos aquí.
function useEscrub(
  accionesRef: React.MutableRefObject<THREE.AnimationAction[]>,
  mixer: THREE.AnimationMixer,
  aperturaRef: React.MutableRefObject<number>,
) {
  const ultimaRef = React.useRef(-1)
  useFrame(() => {
    const v = THREE.MathUtils.clamp(aperturaRef.current, 0, 1)
    if (Math.abs(v - ultimaRef.current) < 1e-4) return
    for (const a of accionesRef.current) {
      a.enabled = true
      a.setEffectiveWeight(1)
      a.paused = true
      if (!a.isRunning()) a.play()
      a.time = v * (a.getClip().duration || 1)
    }
    mixer.update(0)
    ultimaRef.current = v
  })
}

export default function PruebaPelao3D() {
  // ¿La vista 3D (órbita) está habilitada? true = navegar; false = manipular caja.
  const [vista3D, setVista3D] = React.useState(true)
  const [apertura, setApertura] = React.useState(0)      // solo para el % en pantalla
  const aperturaRef = React.useRef(0)                    // fuente de verdad (sin re-render)
  const [glb, setGlb] = React.useState(GLB_PLACEHOLDER)  // se cambia al GLB real cuando exista
  const [faltaGlb, setFaltaGlb] = React.useState(false)

  // r3f mide el Canvas con ResizeObserver; dentro de un contenedor position:fixed
  // la primera medición sale 0 (el observer no dispara al montar) → el canvas queda
  // en 300×150. Un 'resize' lo fuerza a medir el contenedor real. Lo lanzamos un par
  // de veces tras montar para cubrir el primer layout.
  React.useEffect(() => {
    const nudge = () => window.dispatchEvent(new Event('resize'))
    const a = requestAnimationFrame(nudge)
    const b = setTimeout(nudge, 200)
    return () => { cancelAnimationFrame(a); clearTimeout(b) }
  }, [])

  // Comprueba si ya existe el GLB horneado real; si está, lo usa.
  React.useEffect(() => {
    let vivo = true
    fetch(GLB_PRUEBA, { method: 'HEAD' })
      .then((r) => { if (vivo && r.ok) setGlb(GLB_PRUEBA) })
      .catch(() => {})
    fetch(GLB_PLACEHOLDER, { method: 'HEAD' })
      .then((r) => { if (vivo && !r.ok) setFaltaGlb(true) })
      .catch(() => { if (vivo) setFaltaGlb(true) })
    return () => { vivo = false }
  }, [])

  // Arrastre cuando la vista 3D está inhabilitada → escrubar el clip (mover la caja).
  const arrastrando = React.useRef(false)
  const baseX = React.useRef(0)
  const baseApertura = React.useRef(0)
  const onPointerDown = (e: React.PointerEvent) => {
    if (vista3D) return
    arrastrando.current = true
    baseX.current = e.clientX
    baseApertura.current = aperturaRef.current
    ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (vista3D || !arrastrando.current) return
    // Arrastrar a la derecha ABRE; el ancho de pantalla = recorrido completo.
    const dx = (e.clientX - baseX.current) / Math.max(window.innerWidth * 0.6, 1)
    const v = THREE.MathUtils.clamp(baseApertura.current + dx, 0, 1)
    aperturaRef.current = v
    setApertura(v)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    arrastrando.current = false
    ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
  }

  const noSel: React.CSSProperties = { userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' as any }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at center, #1a2740 0%, #0a0e1a 80%)', overflow: 'hidden', cursor: vista3D ? 'grab' : 'ew-resize', ...noSel }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 42, near: 0.1, far: 100 }} dpr={[1, 2]} shadows>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 6, 4]} intensity={1.6} castShadow />
        <directionalLight position={[-4, 3, -2]} intensity={0.5} />
        <React.Suspense fallback={null}>
          <ModeloPelao glb={glb} aperturaRef={aperturaRef} />
        </React.Suspense>
        {/* Modelo centrado en el origen (~2.4 de alto). Pan activado (clic derecho)
            + zoom amplio para alejarse/acercarse sin quedar atrapado dentro. */}
        <OrbitControls
          enabled={vista3D}
          enablePan
          zoomSpeed={1.2}
          minDistance={0.5}
          maxDistance={40}
          target={[0, 0, 0]}
          makeDefault
        />
      </Canvas>

      {/* ── HUD ── */}
      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8, flexWrap: 'wrap', zIndex: 10 }}>
        <button type="button" onClick={() => { if (typeof window !== 'undefined') { if (window.history.length > 1) window.history.back(); else window.location.href = '/' } }}
          style={botonEstilo('#c0392b')}>← Volver</button>
        <button type="button" onClick={() => setVista3D((v) => !v)}
          style={botonEstilo(vista3D ? 'rgba(0,0,0,.6)' : '#ff7a18')}>
          {vista3D ? '🔒 Inhabilitar vista 3D' : '🔓 Habilitar vista 3D'}
        </button>
      </div>

      {/* Estado / ayuda */}
      <div style={{ position: 'absolute', bottom: 14, left: 12, right: 12, display: 'flex', justifyContent: 'center', zIndex: 10, pointerEvents: 'none' }}>
        <div style={{ background: 'rgba(8,11,18,.78)', color: '#fff', fontFamily: 'system-ui, sans-serif', fontSize: 13, padding: '8px 14px', borderRadius: 10, textAlign: 'center', maxWidth: 'min(92vw, 560px)' }}>
          {vista3D
            ? '🖱️ Arrastra = girar · clic derecho = mover (pan) · rueda = zoom. Pulsa “Inhabilitar vista 3D” para mover la caja de bajos.'
            : <>↔️ Arrastra para <b>abrir / cerrar el fuelle</b> · apertura <b>{Math.round(apertura * 100)}%</b> · la mano sigue pegada.</>}
        </div>
      </div>

      {/* Aviso si aún no hay GLB (ni real ni placeholder) */}
      {faltaGlb && glb === GLB_PLACEHOLDER && (
        <div style={{ position: 'absolute', top: 64, left: 12, background: 'rgba(192,57,43,.92)', color: '#fff', fontFamily: 'system-ui, sans-serif', fontSize: 13, padding: '8px 12px', borderRadius: 8, maxWidth: 'min(92vw, 420px)', zIndex: 10 }}>
          Falta el GLB. Cuando Pelao esté listo, horneo <code>pelao-prueba.glb</code> y aparece aquí.
        </div>
      )}
    </div>
  )
}

function botonEstilo(bg: string): React.CSSProperties {
  return { padding: '8px 13px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: bg, color: '#fff', fontFamily: 'system-ui, sans-serif', WebkitTapHighlightColor: 'transparent' }
}

useGLTF.preload(GLB_PLACEHOLDER)
