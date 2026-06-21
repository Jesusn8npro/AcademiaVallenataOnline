import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigRefs } from './useRigRefs'
import { DELTA_ABIERTO, DELTA_CERRADO, POSES_VISOR } from './mapas'
import {
  FUELLE_HOLD_MS, FUELLE_RATE_Q, FUELLE_RATE, FUELLE_RELAJA, FUELLE_SUAVE, FUELLE_ESTIRA,
  POSE_HOLD_MS, POSE_RATE, _glow, _tmpQ, _qOpen,
  _ikA, _ikB, _ikC, _ikDC, _ikDT, _ikQ, _ikQb, _ikQp, _vLt, _vLm,
} from './constantes'

// Bucle de render del personaje: UN solo useFrame con orden de operaciones crítico (fuelle →
// mixer.update → morphs → brazo de bajos → poses → botones). NO partir en varios useFrame: el orden
// importa (GOTCHAs de calibración del fuelle/brazo). Movido verbatim desde Modelo.
// `ligero` (avatares remotos del mundo, muchos jugadores): salta los dos bloques per-frame caros (IK
// del brazo de bajos con CCD + bucle de visuales de TODOS los botones), conservando lo visible de
// lejos (caminar/bailar via mixer, fuelle, orientación del brazo de bajos, brazo de melodía). El
// estudio y el jugador local NO lo usan → calidad completa.
export function usePersonajeFrame(
  refs: RigRefs,
  fuelleAbiertoRef: React.MutableRefObject<boolean>,
  mixer: THREE.AnimationMixer | undefined,
  ligero: boolean = false,
  // Velocidad (timeScale) de la animación de LOCOMOCIÓN (caminar/correr), sincronizada por quien usa el
  // Modelo con el desplazamiento real → los pies no patinan ("flotar"). null/undefined = no es locomoción
  // (un baile del panel) → se respeta el timeScale que puso useBailes.
  velocidadLocoRef?: React.MutableRefObject<number | undefined>,
) {
  const {
    qRef, notasSonandoRef, ultimaNotaMsRef, fuelleNotaRef, aAccumRef, closeAction, cuerpoAction,
    morphCerrar, restW, brazoIzq, cajaGrip, melodiaSonandoRef, ultimaMelodiaMsRef, melodyPoseRef,
    drivenDer, botones, ringSprites, botonGlow, notasActivas, baileAccion,
  } = refs

  useFrame((_, delta) => {
    // CIERRE = acción 'Cierre' del personaje (brazo izquierdo pegado a la tapa, IK horneado)
    // + morph 'Cerrar' del acordeón compartido, ambos escrubados por el MISMO q.
    // Fuelle PROGRESIVO a ∈ [-1,+1]: +1 cerrado, 0 agarre, -1 abierto. Se ACUMULA en la dirección
    // del toque mientras se toca (como un acordeón real) y se relaja al agarre en silencio.
    // Dirección: Q manual cierra; si no, la dirección de la nota (halar abre, empujar cierra) —
    // durante el replay esto sigue EXACTO lo que se grabó.
    const tocando = notasSonandoRef.current > 0 || (performance.now() - ultimaNotaMsRef.current) < FUELLE_HOLD_MS
    let dir = 0
    if (fuelleAbiertoRef.current) dir = 1
    else if (tocando) dir = fuelleNotaRef.current === 'cerrando' ? 1 : -1
    if (dir !== 0) {
      const rate = fuelleAbiertoRef.current ? FUELLE_RATE_Q : FUELLE_RATE
      aAccumRef.current = THREE.MathUtils.clamp(aAccumRef.current + dir * rate * delta, -1, 1)
    } else {
      aAccumRef.current = THREE.MathUtils.damp(aAccumRef.current, 0, FUELLE_RELAJA, delta)
    }
    // Render suavizado del acumulador → sin micro-temblores.
    qRef.current = THREE.MathUtils.damp(qRef.current, aAccumRef.current, FUELLE_SUAVE, delta)
    const a = qRef.current
    const cierre = Math.max(0, a)            // tramo de cierre [0,1] (la acción horneada lo sigue)
    const abrir = Math.max(0, -a)            // tramo de apertura [0,1]
    const abrirVisual = abrir * FUELLE_ESTIRA // el fuelle se estira un poco más que el morph base
    // El brazo de bajos lo maneja el HARD-COPY de Blender (abajo) → las acciones quedan en el AGARRE
    // (frame 0): la mano de melodía y los dedos en su pose de agarre; el brazo de bajos lo pisa el
    // hard-copy. cuerpoAction en 0 = base idle que se cruza con los bailes.
    if (closeAction.current) closeAction.current.time = 0
    if (cuerpoAction.current) cuerpoAction.current.time = 0
    // Locomoción: el ritmo de las piernas sigue la velocidad real de avance (antifloat/antipatinaje).
    if (velocidadLocoRef && velocidadLocoRef.current != null && baileAccion.current) baileAccion.current.timeScale = velocidadLocoRef.current
    if (mixer) mixer.update(delta)
    // Morphs: 'Cerrar' al cerrar (desde restW); 'Abrir' al abrir (estirado por FUELLE_ESTIRA).
    const wCerrar = restW.current * (1 - abrir) + (1 - restW.current) * cierre
    for (const { mesh, idx, idxAbrir } of morphCerrar.current) {
      if (!mesh.morphTargetInfluences) continue
      mesh.morphTargetInfluences[idx] = wCerrar
      if (idxAbrir >= 0) mesh.morphTargetInfluences[idxAbrir] = abrirVisual
    }

    // (1) ORIENTACIÓN del brazo de bajos por HARD-COPY de Blender: al ABRIR va a la pose del frame
    // "abierto" (f1) y al CERRAR a la del "cerrado" (f58) de 'Abrir y Cerrar Fuelle', interpoladas
    // desde el AGARRE (f34). Da la orientación correcta de la muñeca/antebrazo (sin deformar).
    const bz = brazoIzq.current
    if (bz.bones.length >= 4) {
      const delta = a < 0 ? DELTA_ABIERTO : DELTA_CERRADO
      const s = a < 0 ? abrirVisual : cierre
      for (let i = 0; i < 4; i++) {
        _qOpen.identity().slerp(delta[i], s)
        bz.bones[i].quaternion.copy(bz.qAgarre[i]).multiply(_qOpen)
      }
    }
    // (2) POSICIÓN: seguir la caja para que la mano quede SOBRE los botones (no "arriba"). La copia
    // de Blender da la orientación pero la posición se va arriba (el brazo del personaje está orientado
    // distinto). El seguimiento mueve el brazo (CCD) a que la mano caiga en el agarre de la caja, que
    // se desplaza con el morph igual que en Blender (afuera), y la clava ahí (weld). Con FUELLE_ESTIRA=1
    // el objetivo es ALCANZABLE (a 1.25 quedaba fuera del alcance → se despegaba).
    const cg = cajaGrip.current
    if (!ligero && cg && bz.bones.length >= 4 && (abrir > 0.001 || cierre > 0.001)) {
      _vLm.copy(cg.dCerrar).multiplyScalar(wCerrar - cg.restW).addScaledVector(cg.dAbrir, abrirVisual)
      _vLt.copy(cg.handLocalBind).add(_vLm)
      cg.caja.updateWorldMatrix(true, false)
      _vLt.applyMatrix4(cg.caja.matrixWorld)
      const upper = bz.bones[1], fore = bz.bones[2], hand = bz.bones[3]
      upper.updateWorldMatrix(true, true)
      const aim = (bone: THREE.Object3D, root: THREE.Vector3) => {
        hand.getWorldPosition(_ikC)
        _ikDC.copy(_ikC).sub(root); _ikDT.copy(_vLt).sub(root)
        if (_ikDC.lengthSq() < 1e-10 || _ikDT.lengthSq() < 1e-10) return
        _ikQ.setFromUnitVectors(_ikDC.normalize(), _ikDT.normalize())
        bone.getWorldQuaternion(_ikQb); bone.parent!.getWorldQuaternion(_ikQp).invert()
        bone.quaternion.copy(_ikQp).multiply(_ikQ).multiply(_ikQb); bone.updateWorldMatrix(true, true)
      }
      for (let it = 0; it < 5; it++) {
        fore.getWorldPosition(_ikB); aim(fore, _ikB)
        upper.getWorldPosition(_ikA); aim(upper, _ikA)
      }
      // Weld: clavar la mano EXACTO (alcanzable a estiramiento 1) → fija, sin drift.
      const padreMano = hand.parent
      if (padreMano) { padreMano.updateWorldMatrix(true, false); hand.position.copy(padreMano.worldToLocal(_vLt)) }
    }

    // ===== Mano DERECHA (melodía): MEZCLA hacia la POSE capturada del botón que suena =====
    // Cada botón que suena tiene UNA pose guardada (posada a mano: mano+dedos sobre ese botón, sin
    // deformar). Mientras suena melodía, los huesos del brazo derecho hacen slerp hacia esa pose; en
    // silencio vuelven al AGARRE (idle, dedos parados). Rotación pura de bone.quaternion → cero
    // deformación. (Los dedos de bajos quedan en el agarre del mixer; la mano de bajos la maneja el fuelle.)
    const melodiaActiva = melodiaSonandoRef.current > 0 || (performance.now() - ultimaMelodiaMsRef.current) < POSE_HOLD_MS
    const poseAct = melodiaActiva && melodyPoseRef.current ? POSES_VISOR[melodyPoseRef.current] : null
    const kPose = 1 - Math.exp(-POSE_RATE * delta)
    for (const e of drivenDer.current) {
      const pq = poseAct ? poseAct[e.suffix] : null
      const tgt = pq ? _tmpQ.set(pq[0], pq[1], pq[2], pq[3]) : e.gripQ  // pose (pisando) o agarre (idle)
      e.curQ.slerp(tgt, kPose)
      e.bone.quaternion.copy(e.curQ)
    }

    // ===== Dedos: SIN cálculo — la POSE ya los coloca sobre los botones =====
    // La pose maestra (drivenDer, arriba) YA pone brazo + muñeca + DEDOS exactamente como los posaste
    // en Blender (cada dedo sobre su botón). PROHIBIDO calcular/IK/apuntar/estirar el dedo aquí — eso
    // era lo que lo DEFORMABA. No se toca ningún hueso del dedo: queda tal cual la pose. El feedback de
    // "pisada" es el ANILLO azul + el hundido del botón (abajo). Cobertura por botón vía botonHome.

    // Hundir (sutil) + glow + ANILLOS de los botones pisados. SALTADO en modo ligero (remotos): es el
    // bucle más caro (recorre todos los botones cada frame tocando posición+material+sprite) y de lejos
    // no se aprecia. El fuelle y el brazo (arriba) sí muestran que está tocando.
    const k = 1 - Math.exp(-26 * delta)
    const tPulse = performance.now() * 0.006
    if (!ligero) for (const [nm, b] of Object.entries(botones.current)) {
      const activo = notasActivas.current.has(nm)
      const objetivo = activo ? b.orig.clone().add(b.sink) : b.orig
      b.mesh.position.lerp(objetivo, k)
      if (b.mat.emissive) {
        const ei = b.mat.emissiveIntensity ?? 1
        b.mat.emissiveIntensity = THREE.MathUtils.lerp(ei, activo ? 1.6 : 1, k)
        b.mat.emissive.lerp(activo ? _glow : b.emisivoBase, k)
      }
      const sp = ringSprites.current[nm]
      if (sp) {
        const g = THREE.MathUtils.lerp(botonGlow.current[nm] ?? 0, activo ? 1 : 0, k)
        botonGlow.current[nm] = g
        ;(sp.material as THREE.SpriteMaterial).opacity = g
        sp.visible = g > 0.01
        const baseSc = (sp.userData.baseScale ??= sp.scale.x)
        sp.scale.setScalar(baseSc * (1 + 0.14 * Math.sin(tPulse) * g))
      }
    }
  })
}
