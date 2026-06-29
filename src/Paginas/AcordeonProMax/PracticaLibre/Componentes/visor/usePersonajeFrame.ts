import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { RigRefs } from './useRigRefs'
import { POSES_VISOR, BOTON_DEDO, FINGER_SUF } from './mapas'
import type { HuesosPose } from '../../Servicios/servicioPosesDedos'

// Editor admin de poses de dedos: pose activa (la del botón pisado), flag de edición y pose congelada.
export interface EdicionDedosFrame {
  adminPoseRef: React.MutableRefObject<HuesosPose | null>
  posesDedosRef: React.MutableRefObject<Record<string, HuesosPose>> // botón/acorde → huesos (poses guardadas)
  editandoDedosRef: React.MutableRefObject<boolean>
  edicionPoseRef: React.MutableRefObject<HuesosPose>
  botonEditandoRef: React.MutableRefObject<string[]> // botones a iluminar/editar (acorde) mientras se edita
  dedosBotonRef: React.MutableRefObject<Record<string, string>> // botón→dedo asignado (override admin del IK)
  guiaPorBotonRef: React.MutableRefObject<Record<string, HuesosPose>> // botón→pose de brazo heredada (guía)
  guiaAnclaRef: React.MutableRefObject<Record<string, string>> // botón→botón ANCLA de la guía (para deslizar la mano)
  posesListaRef: React.MutableRefObject<{ key: string; btns: string[] }[]> // poses parseadas (matching de acordes)
}
import {
  FUELLE_HOLD_MS, FUELLE_RATE_Q, FUELLE_RATE, FUELLE_RELAJA, FUELLE_SUAVE, FUELLE_ESTIRA,
  POSE_HOLD_MS, POSE_RATE, FINGER_PRESS_RATE, _glow, _tmpQ,
  _vLt, _vLm, _ikA, _ikB, _ikC, _ikDC, _ikDT, _ikQ, _ikQb, _ikQp, _qIdent,
  _wantV, _dirCur, _dirTar, PRESS_IK_ITERS, PRESS_JOINT_MAX, TIP_EXT, FORE_ITERS, FORE_MAX, REACH_STANDOFF,
} from './constantes'

// El CERRADO (morph=1) ya se hornea EN EL TOPE real de Blender (dist 8.5, limpio) → cerrar al 100% del
// morph YA es el límite válido, sin rasgar. Así que no hace falta recortar: MAX_CIERRE=1.0. (Si algún
// re-export volviera a hornear el cerrado en sobre-recorrido, bajar esto a ~0.55 para no rasgar.)
const MAX_CIERRE = 1.0
// Temp para la mezcla ponderada de poses del dedo de melodía (slerp incremental).
const _tmpQ2 = new THREE.Quaternion()
// Caché de FORMA (figura) por clave de pose guardada → para el matching de acordes por geometría sin
// recalcular cada frame. La geometría del acordeón (compartido) es estable → la forma por clave no cambia.
const _formaCache = new Map<string, string>()

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
  // Posición MANUAL del fuelle por slider (0=abierto, 1=cerrado al límite). Cuando NO se toca ni se
  // mantiene "Cerrar fuelle", el fuelle reposa aquí → el usuario mueve la caja de bajos a donde quiera
  // y la mano sigue pegada (mismo seguimiento de botones del cierre).
  fuellePosRef?: React.MutableRefObject<number>,
  // true mientras el usuario ARRASTRA la caja de bajos → el fuelle sigue al mouse rápido (sin el
  // suavizado lento de reposo), para que se sienta agarre directo.
  arrastrandoRef?: React.MutableRefObject<boolean>,
  // Editor admin de poses de dedos (solo pestaña Personaje): congela la mano al editar + aplica la pose
  // guardada del botón pisado. Ausente (mundo/remotos) = comportamiento normal (blend + IK).
  edicionDedos?: EdicionDedosFrame,
) {
  const {
    qRef, notasSonandoRef, ultimaNotaMsRef, fuelleNotaRef, aAccumRef, closeAction, cuerpoAction,
    morphCerrar, restW, brazoIzq, cajaGrip, melodiaSonandoRef, ultimaMelodiaMsRef, melodyBlendRef,
    fingerPress, calibrandoRef, ajustesDedo, melodyButtonRef, botonCoordRef,
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
      // En reposo el fuelle va a la posición del slider/arrastre (0 abierto → 1 cerrado); por defecto 0.
      // Mientras se ARRASTRA la caja, sigue rápido (lambda alto) → agarre directo; si no, suave (natural).
      // -1 = abierto/arqueado (morph 'Abrir'), 0 = agarre, 1 = cerrado (morph 'Cerrar').
      const objetivo = fuellePosRef ? THREE.MathUtils.clamp(fuellePosRef.current, -1, 1) : 0
      const lambda = arrastrandoRef?.current ? 18 : FUELLE_RELAJA
      aAccumRef.current = THREE.MathUtils.damp(aAccumRef.current, objetivo, lambda, delta)
    }
    // Render suavizado del acumulador → sin micro-temblores.
    qRef.current = THREE.MathUtils.damp(qRef.current, aAccumRef.current, FUELLE_SUAVE, delta)
    if (qRef.current > MAX_CIERRE) qRef.current = MAX_CIERRE  // tope de cierre (no rasgar pliegues)
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

    // BRAZO DE BAJOS — réplica del IK de Blender (CHILD_OF/IK a control rígido sobre la caja), que SIEMPRE
    // deja la mano pegada a los botones sin deformar:
    //   • HOMBRO (0) y BRAZO/upper (1): CONGELADOS al agarre (plantados, no se mueven por nada).
    //   • ANTEBRAZO (2): se aima (1 hueso, rotación mínima estable → sin el twist del CCD de 2 huesos)
    //     hacia el objetivo, así el CODO articula naturalmente.
    //   • MANO (3): POSICIÓN = WELD a los botones (CHILD_OF), ORIENTACIÓN = rotación de la caja (COPY_ROTATION,
    //     constante relativa a la caja, INDEPENDIENTE del aim del antebrazo → los dedos nunca se tuercen).
    // El objetivo sigue el deslizamiento real del morph (dCerrar/dAbrir) = el mismo que mueven los botones.
    const bz = brazoIzq.current
    const cg = cajaGrip.current
    if (!ligero && cg && bz.bones.length >= 4 && bz.posAgarre.length >= 4) {
      // objetivo mundial de la mano = agarre + deslizamiento del morph (igual que los botones)
      _vLm.copy(cg.dCerrar).multiplyScalar(wCerrar - cg.restW).addScaledVector(cg.dAbrir, abrirVisual)
      _vLt.copy(cg.handLocalBind).add(_vLm)
      cg.caja.updateWorldMatrix(true, false)
      _vLt.applyMatrix4(cg.caja.matrixWorld)
      // congelar hombro + brazo (plantados); antebrazo solo posición (su rotación = aim)
      bz.bones[0].quaternion.copy(bz.qAgarre[0]); bz.bones[0].position.copy(bz.posAgarre[0])
      bz.bones[1].quaternion.copy(bz.qAgarre[1]); bz.bones[1].position.copy(bz.posAgarre[1])
      bz.bones[2].position.copy(bz.posAgarre[2])
      bz.bones[1].updateWorldMatrix(true, true)
      // AIM solo del antebrazo (codo) hacia el objetivo
      const fore = bz.bones[2], hand = bz.bones[3]
      fore.getWorldPosition(_ikB); hand.getWorldPosition(_ikC)
      _ikDC.copy(_ikC).sub(_ikB); _ikDT.copy(_vLt).sub(_ikB)
      if (_ikDC.lengthSq() > 1e-10 && _ikDT.lengthSq() > 1e-10) {
        _ikQ.setFromUnitVectors(_ikDC.normalize(), _ikDT.normalize())
        fore.getWorldQuaternion(_ikQb); fore.parent!.getWorldQuaternion(_ikQp).invert()
        fore.quaternion.copy(_ikQp).multiply(_ikQ).multiply(_ikQb); fore.updateWorldMatrix(true, true)
      }
      // WELD posición: clavar la mano EXACTO sobre los botones → SIEMPRE pegada
      const padre = hand.parent
      if (padre) {
        padre.updateWorldMatrix(true, false)
        hand.position.copy(padre.worldToLocal(_vLt.clone()))
        // ORIENTACIÓN = COPY_ROTATION de la caja: hand_world = caja_world · handQ (constante)
        cg.caja.getWorldQuaternion(_ikQ).multiply(cg.handQ)
        padre.getWorldQuaternion(_ikQp).invert()
        hand.quaternion.copy(_ikQp).multiply(_ikQ)
      }
    } else if (bz.bones.length >= 4) {
      // ligero (remotos): solo congelar la orientación al agarre (sin IK por costo)
      for (let i = 0; i < 4; i++) bz.bones[i].quaternion.copy(bz.qAgarre[i])
    }

    // ===== Mano DERECHA (melodía): MEZCLA hacia la POSE capturada del botón que suena =====
    // Cada botón que suena tiene UNA pose guardada (posada a mano: mano+dedos sobre ese botón, sin
    // deformar). Mientras suena melodía, los huesos del brazo derecho hacen slerp hacia esa pose; en
    // silencio vuelven al AGARRE (idle, dedos parados). Rotación pura de bone.quaternion → cero
    // deformación. (Los dedos de bajos quedan en el agarre del mixer; la mano de bajos la maneja el fuelle.)
    // MEZCLA POR CERCANÍA: cada bone objetivo = slerp ponderado de las poses ancla cercanas al botón
    // pisado (melodyBlendRef). Así la mano + el dedo caen sobre el botón EXACTO interpolando entre poses
    // reales (cero deformación). En silencio vuelve al agarre (idle).
    // Calibración: con el modo ON, el último botón de melodía pisado queda LATCHED (mano + dedo se
    // quedan encima aunque sueltes la tecla) para acomodar la punta con las flechas (useCalibracionDedo).
    const mb = melodyButtonRef.current
    const calibLatch = calibrandoRef.current && mb && /^Boton_D_/.test(mb) && botones.current[mb] ? mb : null
    // Editor admin: mientras EDITAS, el botón objetivo se trata como ACTIVO → el blend + el IK posicionan
    // la mano AUTOMÁTICAMENTE sobre ese botón (auto-acomodo); tus ajustes del gizmo (edicionPoseRef) se
    // aplican ENCIMA al final. Así lo que ves (y guardas) SÍ queda sobre el botón.
    const botEditList = edicionDedos?.botonEditandoRef.current ?? []
    const editando = (edicionDedos?.editandoDedosRef.current ?? false) && botEditList.length > 0
    const melodiaActiva = editando || !!calibLatch || melodiaSonandoRef.current > 0 || (performance.now() - ultimaMelodiaMsRef.current) < POSE_HOLD_MS
    const blend = melodiaActiva ? melodyBlendRef.current : null
    // Si NO editas y el botón/acorde pisado tiene POSE GUARDADA exacta, esa pose pisa todo (sin IK).
    const adminPose = (!editando && melodiaActiva && edicionDedos?.adminPoseRef.current) ? edicionDedos.adminPoseRef.current : null
    // Dedo asignado a un botón (override admin o default por cercanía).
    const dedoDe = (b: string) => edicionDedos?.dedosBotonRef.current[b] || BOTON_DEDO[b]
    // Forma (FIGURA) de un conjunto de botones por GEOMETRÍA real (coords [hilera,columna]) → invariante
    // a la posición: la misma figura desplazada arriba/abajo o en otra fila da la MISMA cadena.
    const formaDe = (btns: string[]): string => {
      const cs: [number, number][] = []
      for (const b of btns) { const c = botonCoordRef.current[b]; if (c) cs.push(c) }
      if (cs.length < 2) return ''
      let minR = Infinity, minC = Infinity
      for (const [r, c] of cs) { if (r < minR) minR = r; if (c < minC) minC = c }
      return cs.map(([r, c]) => `${r - minR},${c - minC}`).sort().join(';')
    }
    const activos = editando ? botEditList : (melodiaActiva ? [...notasActivas.current].filter((x) => /^Boton_D_/.test(x)) : [])
    // BASE: la posición GUARDADA (suelta o acorde) que MÁS comparte con lo pisado, siendo SUBCONJUNTO de
    // lo pisado y la MÁS GRANDE → es "la más parecida". Ej: tienes guardada "quinta del medio" (3 botones)
    // y pisas esos 3 + 2 más → usa la quinta de base (conserva su forma) y abajo el IK SOLO agrega el dedo
    // de los 2 que faltan. baseCubre = los botones de la base (sus dedos ya están bien → no se les corre IK).
    // Si nada guardado calza → guía del más cercano de la hilera (a ese sí se le afina el dedo con IK).
    let basePose: HuesosPose | null = null
    let baseCubre: Set<string> | null = null
    let reubicar = false   // la base viene de OTRA posición (misma figura) → reubicar la mano (brazo local + reach + IK)
    let armGuide: HuesosPose | null = null  // brazo de la guía LOCAL (para reubicar la figura a la nueva posición)
    let guiaAncla: string | null = null  // botón ANCLA de la guía (1 botón) → deslizar la mano del ancla al pisado
    let guiaBtn: string | null = null    // botón pisado al que deslizar la mano (guía de 1 botón)
    if (!adminPose && edicionDedos && activos.length) {
      const pset = new Set(activos)
      // 1. Mejor SUBCONJUNTO exacto (misma ubicación) → conserva la forma; el IK solo agrega los que faltan.
      let bestItem: { key: string; btns: string[] } | null = null
      for (const item of edicionDedos.posesListaRef.current) {
        if (item.btns.length > (bestItem?.btns.length ?? 0) && item.btns.every((b) => pset.has(b))) bestItem = item
      }
      if (bestItem) { basePose = edicionDedos.posesDedosRef.current[bestItem.key]; baseCubre = new Set(bestItem.btns) }
      // 2. Misma FIGURA en OTRA posición → reusa esa pose REUBICADA (mismo número de botones, misma forma):
      //    los DEDOS (la figura) de la plantilla + el BRAZO de la guía local → la mano cae en la nueva posición.
      else if (activos.length > 1) {
        // Reusa la FIGURA guardada IDÉNTICA; si no hay, la MÁS PARECIDA (la que más coords comparte) →
        // la "postura más cercana" reubicada. Así replica algo coherente aunque no exista la exacta.
        const formaP = formaDe(activos)
        const setP = formaP ? new Set(formaP.split(';')) : null
        let bestOv = 0, bestK: string | null = null, exacto = false
        if (setP) for (const item of edicionDedos.posesListaRef.current) {
          if (item.btns.length < 2) continue
          let sh = _formaCache.get(item.key)
          if (sh === undefined) { sh = formaDe(item.btns); if (sh) _formaCache.set(item.key, sh) }
          if (!sh) continue
          if (sh === formaP) { bestK = item.key; exacto = true; break }
          let ov = 0; for (const cc of sh.split(';')) if (setP.has(cc)) ov++
          if (ov > bestOv) { bestOv = ov; bestK = item.key }
        }
        if (bestK && (exacto || bestOv >= 2)) { basePose = edicionDedos.posesDedosRef.current[bestK]; reubicar = true }
        if (reubicar) for (const btn of activos) { const g = edicionDedos.guiaPorBotonRef.current[btn] || edicionDedos.posesDedosRef.current[btn]; if (g && Object.keys(g).length) { armGuide = g; break } }
      }
      // 3. Guía del más cercano de la hilera (1 botón sin pose). Si es UN solo botón, además se RELOCALIZA:
      //    se desliza la mano del botón ancla (de donde salió la guía) al botón pisado (mismo delta mundial)
      //    → la mano se acomoda lo más cerca posible sin deformar (el IK del dedo solo afina el aterrizaje).
      if (!basePose) for (const btn of activos) {
        const g = edicionDedos.guiaPorBotonRef.current[btn]
        if (g && Object.keys(g).length) {
          basePose = g
          if (activos.length === 1) { guiaBtn = btn; guiaAncla = edicionDedos.guiaAnclaRef.current[btn] || null }
          break
        }
      }
    }
    const kPose = editando ? 1 : 1 - Math.exp(-POSE_RATE * delta)  // al editar, sin lag (snap)
    for (const e of drivenDer.current) {
      let tq: THREE.Quaternion | null = null
      let accW = 0
      // Reubicando una figura: el BRAZO sale de la guía local (mano en la nueva posición) y los DEDOS de
      // la plantilla (la figura guardada). Si no, todo de la base/pose exacta.
      const esFinger = /(Thumb|Index|Middle|Ring|Pinky)[123]$/.test(e.suffix)
      const src = adminPose ?? (reubicar && !esFinger && armGuide ? armGuide : basePose)
      const ap = src ? src[e.suffix] : undefined
      if (ap) { tq = _tmpQ.set(ap[0], ap[1], ap[2], ap[3]) }
      else if (!basePose && blend) {  // sin base → mezcla de hileras POSES_VISOR (fallback)
        for (const [pn, w] of blend) {
          const pose = POSES_VISOR[pn]
          const q = pose ? pose[e.suffix] : null
          if (!q) continue
          if (!tq) { tq = _tmpQ.set(q[0], q[1], q[2], q[3]); accW = w }
          else { _tmpQ2.set(q[0], q[1], q[2], q[3]); tq.slerp(_tmpQ2, w / (accW + w)); accW += w }
        }
      }
      const tgt = tq ?? e.gripQ  // pose exacta / BASE del acorde / mezcla (pisando) o agarre (idle)
      e.curQ.slerp(tgt, kPose)
      e.bone.quaternion.copy(e.curQ)
    }

    // ===== PISADA: IK de 2 falanges lleva la PUNTA del dedo EXACTO sobre el botón (mano quieta) =====
    // La pose (blend de arriba) ya dejó la mano sobre la hilera con los dedos curvados ("se ubica").
    // Aquí NO se mueve la mano ni el codo: para el dedo asignado (BOTON_DEDO→FINGER_SUF) se corre un
    // CCD de 2 huesos (nudillo Index1 + falange Index2) que ATERRIZA la yema sobre la superficie del
    // botón. Cada paso = rotación de ARCO MÍNIMO (sin twist, sin garra), clampeada por hueso
    // (PRESS_JOINT_MAX) y suavizada por peso de pisada. Acordes: cada dedo aterriza en el suyo.
    const kDip = 1 - Math.exp(-FINGER_PRESS_RATE * delta)
    if (!ligero) {
      const findB = (s: string) => drivenDer.current.find((e) => e.suffix === s)?.bone
      const SUFS = ['RightHandIndex', 'RightHandMiddle', 'RightHandRing', 'RightHandPinky']
      // RELOCACIÓN de guía (1 botón): la pose guía dejó la mano sobre el botón ANCLA; aquí se DESLIZA al
      // botón pisado por el MISMO desplazamiento mundial (translación rígida) → la mano conserva su forma
      // y su orientación (sin tilt → sin deformar). Solo se aima el codo para mover la muñeca ese delta y
      // luego se restaura la orientación mundial de la mano (translación pura). El IK del dedo (abajo)
      // afina el aterrizaje exacto. Para botones lejanos del ancla, esto evita que el dedo se estire/garra.
      if (guiaAncla && guiaBtn) {
        const bAnc = botones.current[guiaAncla], bTar = botones.current[guiaBtn]
        const fore = findB('RightForeArm'), wrist = findB('RightHand')
        if (bAnc && bTar && fore && wrist) {
          bAnc.mesh.updateWorldMatrix(true, false); bTar.mesh.updateWorldMatrix(true, false)
          _ikA.copy(bAnc.localCenter).applyMatrix4(bAnc.mesh.matrixWorld)   // ancla (mundo)
          _ikB.copy(bTar.localCenter).applyMatrix4(bTar.mesh.matrixWorld)   // botón pisado (mundo)
          _vLm.copy(_ikB).sub(_ikA)                                         // delta a deslizar
          wrist.getWorldPosition(_ikC); _vLt.copy(_ikC).add(_vLm)           // objetivo FIJO de la muñeca = actual + delta
          wrist.getWorldQuaternion(_ikQp)                                   // orientación de la mano a conservar
          for (let it = 0; it < FORE_ITERS; it++) {
            wrist.getWorldPosition(_ikC); fore.getWorldPosition(_ikA)
            _dirCur.copy(_ikC).sub(_ikA); _dirTar.copy(_vLt).sub(_ikA)      // codo→muñeca actual vs codo→objetivo
            if (_dirCur.lengthSq() < 1e-10 || _dirTar.lengthSq() < 1e-10) break
            _ikQ.setFromUnitVectors(_dirCur.normalize(), _dirTar.normalize())
            const angF = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(_ikQ.w), 0, 1))   // clamp por iteración
            if (angF > FORE_MAX) _ikQ.slerp(_qIdent, 1 - FORE_MAX / angF)
            fore.getWorldQuaternion(_ikQb); fore.parent!.getWorldQuaternion(_tmpQ).invert()
            fore.quaternion.copy(_tmpQ).multiply(_ikQ).multiply(_ikQb); fore.updateWorldMatrix(true, true)
          }
          wrist.parent!.getWorldQuaternion(_tmpQ).invert()                  // restaurar orientación (translación pura)
          wrist.quaternion.copy(_tmpQ).multiply(_ikQp); wrist.updateWorldMatrix(true, true)
        }
      }
      // Botones activos (editando → los del set; calibración; tocando → notasActivas). Empareja cada dedo
      // con SU botón asignado activo (que no cubra ya una pose exacta).
      const cands = editando ? botEditList : (calibLatch ? [calibLatch] : (melodiaActiva ? [...notasActivas.current] : []))
      const pares: { suf: string; bm: { mesh: THREE.Mesh; surfaceLocal: THREE.Vector3; salida: THREE.Vector3; radio: number }; bmBase: string }[] = []
      for (const suf of SUFS) {
        if (adminPose && adminPose[suf + '1']) continue
        for (const btn of cands) {
          if (baseCubre && baseCubre.has(btn)) continue   // su dedo ya está bien en la base → no se le corre IK
          if (dedoDe(btn) && FINGER_SUF[dedoDe(btn)] === suf) {
            const b = botones.current[btn]
            if (b && b.surfaceLocal) { pares.push({ suf, bm: b, bmBase: btn }); break }
          }
        }
      }
      // (1) ALCANCE: rota el ANTEBRAZO (codo) para que la MUÑECA llegue al FRENTE de los botones (a un
      // largo de mano de distancia, hacia afuera del diapasón) → la palma queda AFUERA y solo los dedos
      // entran a presionar. Así la mano NO traspasa el diapasón.
      // El alcance del codo SOLO se usa cuando NO hay NINGUNA pose base (caso raro: botón sin anclas en
      // su hilera). Con cualquier base (exacta/figura/guía), la pose ya deja la mano PEGADA al diapasón →
      // el codo NO la mueve → la mano NUNCA se suelta. (La reubicación de figuras la hace el brazo-guía.)
      const fore = findB('RightForeArm')
      const wrist = findB('RightHand')
      if (fore && wrist && pares.length && !basePose) for (let it = 0; it < FORE_ITERS; it++) {
        _ikB.set(0, 0, 0); let n = 0
        wrist.getWorldPosition(_vLt)
        for (const p of pares) {
          const tip = findB(p.suf + '3'); if (!tip) continue
          tip.getWorldPosition(_ikDT)
          const reach = _ikDT.distanceTo(_vLt) * REACH_STANDOFF        // largo muñeca↔yema (cuánto sale al frente)
          p.bm.mesh.updateWorldMatrix(true, false)
          _ikC.copy(p.bm.surfaceLocal); const aj0 = ajustesDedo.current[p.bmBase]; if (aj0) _ikC.add(aj0)
          _ikC.applyMatrix4(p.bm.mesh.matrixWorld)
          _ikC.addScaledVector(p.bm.salida, reach)                    // objetivo de la MUÑECA = botón + salida·largo
          _ikB.add(_ikC); n++
        }
        if (!n) break
        _ikB.multiplyScalar(1 / n)
        wrist.getWorldPosition(_ikA); fore.getWorldPosition(_vLt)
        _ikDT.copy(_ikA).sub(_vLt); _ikDC.copy(_ikB).sub(_vLt)         // codo→muñeca actual vs codo→objetivo
        if (_ikDT.lengthSq() < 1e-10 || _ikDC.lengthSq() < 1e-10) break
        _ikQ.setFromUnitVectors(_ikDT.normalize(), _ikDC.normalize())
        const angF = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(_ikQ.w), 0, 1))   // clamp por iteración
        if (angF > FORE_MAX) _ikQ.slerp(_qIdent, 1 - FORE_MAX / angF)
        fore.getWorldQuaternion(_ikQb); fore.parent!.getWorldQuaternion(_ikQp).invert()
        fore.quaternion.copy(_ikQp).multiply(_ikQ).multiply(_ikQb); fore.updateWorldMatrix(true, true)
      }
      // (2) PRESIÓN: IK de 2 falanges por dedo → la yema aterriza EXACTA sobre su botón (sin garra).
      for (const suf of SUFS) {
        const par = pares.find((p) => p.suf === suf)
        const prev = fingerPress.current[suf] ?? 0
        const w = fingerPress.current[suf] = prev + ((par ? 1 : 0) - prev) * kDip
        if (w < 0.001 || !par) continue
        const bm = par.bm
        const j3 = findB(suf + '3'), j2 = findB(suf + '2')
        if (!j3 || !j2) continue
        const aj = ajustesDedo.current[par.bmBase]  // offset fino calibrado para ESTE botón (marco local)
        bm.mesh.updateWorldMatrix(true, false)
        for (let it = 0; it < PRESS_IK_ITERS; it++) {
          for (const jn of ['1', '2']) {                      // CCD: nudillo base, luego falange media
            const j = findB(suf + jn)
            if (!j) continue
            // Efector = punta estimada del dedo (TIP_EXT falanges distales más allá de Index3 = la yema).
            j3.getWorldPosition(_ikC); j2.getWorldPosition(_ikA)
            _ikDC.copy(_ikC).sub(_ikA)
            _wantV.copy(_ikC).addScaledVector(_ikDC, TIP_EXT)  // j3 + (j3−j2)·TIP_EXT ≈ yema real
            // Objetivo = superficie del botón + ajuste fino calibrado (ambos en local), llevado a mundo.
            _ikB.copy(bm.surfaceLocal); if (aj) _ikB.add(aj)
            _ikB.applyMatrix4(bm.mesh.matrixWorld)
            j.getWorldPosition(_ikA)
            _dirCur.copy(_wantV).sub(_ikA); _dirTar.copy(_ikB).sub(_ikA)
            if (_dirCur.lengthSq() < 1e-10 || _dirTar.lengthSq() < 1e-10) continue
            _dirCur.normalize(); _dirTar.normalize()
            _ikQ.setFromUnitVectors(_dirCur, _dirTar)
            // Clamp del giro por hueso (sin garra) × peso de pisada → escala desde identidad.
            const ang = 2 * Math.acos(THREE.MathUtils.clamp(Math.abs(_ikQ.w), 0, 1))
            const f = (ang > 1e-6 ? Math.min(1, PRESS_JOINT_MAX / ang) : 1) * w
            _ikQ.slerp(_qIdent, 1 - f)
            j.getWorldQuaternion(_ikQb); j.parent!.getWorldQuaternion(_ikQp).invert()
            j.quaternion.copy(_ikQp).multiply(_ikQ).multiply(_ikQb); j.updateWorldMatrix(true, true)
          }
        }
      }
    }

    // Editor: aplica TUS ajustes del gizmo (overrides por hueso) ENCIMA del auto-acomodo (blend+IK) →
    // lo que ves es lo que se guarda. Sin override en un hueso → manda el auto-acomodo (así "Acomodar
    // dedo" = borrar sus overrides → el IK lo recoloca solo).
    if (editando && edicionDedos) {
      const ep = edicionDedos.edicionPoseRef.current
      for (const e of drivenDer.current) {
        const q = ep[e.suffix]
        if (q) { e.bone.quaternion.set(q[0], q[1], q[2], q[3]); e.bone.updateWorldMatrix(true, true) }
      }
    }

    // Hundir (sutil) + glow + ANILLOS de los botones pisados. SALTADO en modo ligero (remotos): es el
    // bucle más caro (recorre todos los botones cada frame tocando posición+material+sprite) y de lejos
    // no se aprecia. El fuelle y el brazo (arriba) sí muestran que está tocando.
    const k = 1 - Math.exp(-26 * delta)
    const tPulse = performance.now() * 0.006
    // Mientras editas, TODOS los botones del set quedan ILUMINADOS (aunque sueltes las teclas) para saber
    // qué estás configurando (acordes incluidos).
    if (!ligero) for (const [nm, b] of Object.entries(botones.current)) {
      const activo = notasActivas.current.has(nm) || botEditList.includes(nm)
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
