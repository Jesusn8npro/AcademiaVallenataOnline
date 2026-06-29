import * as React from 'react'
import * as THREE from 'three'
import { RigRefs } from './useRigRefs'
import { normalPlano } from './rigUtils'
import { crearTexturaAnillo } from './texturas'
import { NOTA_BOTON, POSES_VISOR, RIGHT_SUF } from './mapas'

// Setup del personaje: acción de cierre partida en capas + huesos de dedos + botones + morphs del
// acordeón + calibración mano↔caja + clasificación de regiones + mapa botón→pose. Movido verbatim
// desde Modelo; solo cambia que las refs llegan en la bolsa `refs`.
export function useSetupPersonaje(
  refs: RigRefs,
  deps: {
    scene: THREE.Object3D
    acordeon: THREE.Object3D
    mixer: THREE.AnimationMixer | undefined
    clipBrazos: THREE.AnimationClip | null
    clipCuerpo: THREE.AnimationClip | null
    camera: THREE.Camera
    ligero?: boolean
  },
) {
  const { scene, acordeon, mixer, clipBrazos, clipCuerpo, camera, ligero } = deps
  const {
    fingerData, fingerPress, botones, morphCerrar, closeAction, cuerpoAction, closeDur,
    brazoIzq, brazoDer, curForeDelta, curHandDelta, drivenDer, restW, handFactor, cajaGrip,
    botonHome, ringSprites, botonGlow, botonRegion, botonCoordRef, notaAMesh,
  } = refs

  // Setup: acción de cierre + huesos de dedos + botones + morphs del acordeón.
  React.useEffect(() => {
    fingerData.current = {}
    fingerPress.current = {}
    botones.current = {}
    morphCerrar.current = []

    // Acción 'Cierre' del personaje partida en capas: BRAZOS (frame 0 = agarre; la MANO de bajos
    // se traslada siguiendo el deslizamiento de la caja, horneada con el MISMO vector que el
    // morph) se reproduce PAUSADA y se escruba con Q junto al morph → la mano va pegada a la
    // caja. CUERPO (pose de agarre del resto) es el idle que se cruza con los bailes.
    let a: THREE.AnimationAction | null = null
    if (mixer && clipBrazos && clipCuerpo) {
      a = mixer.clipAction(clipBrazos, scene)
      const ac = mixer.clipAction(clipCuerpo, scene)
      for (const x of [a, ac]) { x.reset(); x.play(); x.paused = true; x.time = 0 }
      closeAction.current = a
      cuerpoAction.current = ac
      closeDur.current = clipBrazos.duration
      mixer.update(0)
    }

    // Capturar la pose del brazo izquierdo (bajos) en AGARRE (t=0) y CERRADO (t=dur). En useFrame,
    // la apertura se extrapola desde el agarre en sentido contrario al cierre → el brazo sigue la
    // caja al abrir sin estirar la piel. (LeftShoulder/Arm/ForeArm/Hand, sin dedos.)
    const bonesIzq: THREE.Object3D[] = []
    scene.traverse((o: any) => { if (o.isBone && /Left(Shoulder|Arm|ForeArm|Hand)$/.test(o.name || '')) bonesIzq.push(o) })
    if (a && bonesIzq.length) {
      a.time = 0; mixer!.update(0)
      const qAg = bonesIzq.map((b: any) => b.quaternion.clone())
      const pAg = bonesIzq.map((b: any) => b.position.clone())  // posición LOCAL de agarre (para traslado rígido)
      a.time = closeDur.current; mixer!.update(0)
      const qCl = bonesIzq.map((b: any) => b.quaternion.clone())
      const pCl = bonesIzq.map((b: any) => b.position.clone())  // posición LOCAL en cerrado
      a.time = 0; mixer!.update(0)
      brazoIzq.current = { bones: bonesIzq, qAgarre: qAg, qClosed: qCl, posAgarre: pAg, posClosed: pCl }
    }

    // Capturar el AGARRE del brazo derecho (melodía): codo (RightForeArm) + muñeca (RightHand). En
    // useFrame se les aplica encima el DELTA de la postura de región para subir/bajar la mano.
    if (a) { a.time = 0; mixer!.update(0) }
    let foreDer: THREE.Object3D | null = null, handDer: THREE.Object3D | null = null
    scene.traverse((o: any) => {
      if (!o.isBone) return
      if (!foreDer && /RightForeArm$/.test(o.name || '')) foreDer = o
      if (!handDer && /RightHand$/.test(o.name || '')) handDer = o
    })
    brazoDer.current = {
      foreArm: foreDer, hand: handDer,
      gripFore: foreDer ? (foreDer as THREE.Object3D).quaternion.clone() : new THREE.Quaternion(),
      gripHand: handDer ? (handDer as THREE.Object3D).quaternion.clone() : new THREE.Quaternion(),
    }
    curForeDelta.current.identity()
    curHandDelta.current.identity()

    // Sistema de POSES: capturar el AGARRE (idle) de los huesos del brazo derecho que maneja la pose.
    // Estamos en grip (a.time=0). El curQ arranca en el agarre; en useFrame se slerpa hacia la pose.
    drivenDer.current = []
    for (const suf of RIGHT_SUF) {
      let bone: THREE.Object3D | null = null
      scene.traverse((o: any) => { if (!bone && o.isBone && (o.name || '').endsWith(suf)) bone = o })
      if (bone) {
        const q = (bone as THREE.Object3D).quaternion.clone()
        drivenDer.current.push({ bone, suffix: suf, gripQ: q, curQ: q.clone() })
      }
    }

    // --- Personaje: huesos de dedos ---
    scene.traverse((o: any) => {
      if (!o.isBone) return
      const nm: string = o.name || ''
      const mp = nm.match(/^mixamorig:?(Right|Left)Hand(Index|Middle|Ring|Pinky|Thumb)([1-4])$/)
      if (!mp) return
      const finger = `${mp[1] === 'Right' ? 'R' : 'L'}_${mp[2] === 'Middle' ? 'Mid' : mp[2]}`
      const fd = (fingerData.current[finger] ||= { joints: [], rests: [], tip: null, liftSign: 1 })
      const n = +mp[3]
      if (n <= 3) { fd.joints[n - 1] = o; fd.rests[n - 1] = o.quaternion.clone() }
      else fd.tip = o
    })
    for (const fd of Object.values(fingerData.current)) {
      if (!fd.tip) fd.tip = fd.joints[2] || null // rigs sin falange 4 (Pelao)
    }
    // Signo de la rotación en Y LOCAL del hueso base que LEVANTA la punta (≈ +Y mundo). Difiere por
    // dedo según su orientación: liftDir = (Y local en mundo) × (dirección del hueso); el signo de su
    // componente Y dice si +rotación sube o baja la punta. Así Index/Pinky y Middle/Ring se levantan
    // todos hacia arriba aunque sus ejes locales apunten distinto.
    scene.updateMatrixWorld(true)
    const _yW = new THREE.Vector3(), _bdW = new THREE.Vector3(), _liftW = new THREE.Vector3()
    const _bpW = new THREE.Vector3(), _tpW = new THREE.Vector3()
    for (const fd of Object.values(fingerData.current)) {
      const base = fd.joints[0]
      if (!base || !fd.tip) { fd.liftSign = 1; continue }
      _yW.setFromMatrixColumn(base.matrixWorld, 1).normalize()
      base.getWorldPosition(_bpW); fd.tip.getWorldPosition(_tpW)
      _bdW.subVectors(_tpW, _bpW)
      _liftW.crossVectors(_yW, _bdW)
      fd.liftSign = _liftW.y >= 0 ? 1 : -1
    }

    // --- Acordeón compartido: morphs 'Cerrar' + botones ---
    const dMeshes: THREE.Mesh[] = []
    const iMeshes: THREE.Mesh[] = []
    const box = new THREE.Box3()
    acordeon.traverse((o: any) => {
      if (!o.isMesh) return
      const dict = o.morphTargetDictionary
      if (dict && dict.Cerrar !== undefined) morphCerrar.current.push({ mesh: o, idx: dict.Cerrar, idxAbrir: dict.Abrir ?? -1 })
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const mm of mats) if (mm && /fuelle/i.test(mm.name || '')) mm.side = THREE.DoubleSide
      // Extrae el nombre CANÓNICO del botón (Boton_D_NN / Boton_I_NN) del nodo, ignorando el prefijo
      // de export ACC_ y CUALQUIER sufijo (_m, o el "001" del duplicado .001 de Blender al que el
      // export le quitó el punto → "Boton_D_05001"). Así casa con las claves de NOTA_BOTON/BOTON_DEDO.
      const raw = (o.name || '').replace(/^ACC_/, '')
      const mD = raw.match(/^Boton_D_(\d{2})/)
      const mI = raw.match(/^Boton_I_(\d{2})/)
      if (mD) { const base = `Boton_D_${mD[1]}`; o.userData.botonBase = base; dMeshes.push(o) }
      else if (mI) { const base = `Boton_I_${mI[1]}`; o.userData.botonBase = base; iMeshes.push(o) }
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
        const depth = (Math.min(ws.x, ws.y, ws.z) || 0.01) * 0.22 // hundido SUTIL (0.75 lo hacía desaparecer)
        const pW = new THREE.Vector3(); m.getWorldPosition(pW)
        const pWmov = pW.clone().add(normal.clone().multiplyScalar(depth))
        const sink = m.parent!.worldToLocal(pWmov).sub(m.position)
        const mat = (Array.isArray(m.material) ? m.material[0] : m.material).clone()
        m.material = mat
        // El material 'acc_botones' del GLB viene semi-transparente (opacity 0.69, depthWrite off) →
        // los botones se ven translúcidos. Son botones sólidos: forzar opaco.
        mat.transparent = false; mat.opacity = 1; mat.depthWrite = true; mat.needsUpdate = true
        const matEmisivo = mat as any
        const emisivoBase = matEmisivo.emissive ? matEmisivo.emissive.clone() : new THREE.Color(0x000000)
        // Centro de la GEOMETRÍA en local de la malla (los nodos comparten origen tras el export →
        // el origen del nodo NO es la posición visible del botón; el centro real vive en la geometría).
        // Se transforma por matrixWorld cada frame para obtener la coordenada exacta y actual.
        const localCenter = new THREE.Vector3()
        if (!m.geometry.boundingBox) m.geometry.computeBoundingBox()
        m.geometry.boundingBox!.getCenter(localCenter)
        // Punto de SUPERFICIE del botón (cara exterior, por donde entra el dedo), en geometría-local: el
        // centro corrido hacia AFUERA (−normal del teclado) media altura del botón. El contacto del dedo
        // apunta AQUÍ y no al centro (que está DENTRO) → la yema descansa SOBRE el botón y la mano no
        // atraviesa el teclado/diapasón. SURF_CLEAR>1 deja un pelín de aire para que la pisada lo cubra.
        const SURF_CLEAR = 1.2
        const halfThick = ((Math.min(ws.x, ws.y, ws.z) || 0.01) / 2) * SURF_CLEAR
        const surfaceW = localCenter.clone().applyMatrix4(m.matrixWorld).add(normal.clone().multiplyScalar(-halfThick))
        const surfaceLocal = m.worldToLocal(surfaceW)
        // salida = normal del teclado HACIA AFUERA (lejos del diapasón, hacia la cámara) en mundo, y radio
        // = tamaño del botón. El alcance del codo apunta a un punto AFUERA (surface + salida·radio·STANDOFF)
        // → la mano queda al frente sin traspasar; el dedo presiona hacia adentro lo último.
        const salida = normal.clone().negate()
        const radio = Math.max(ws.x, ws.y, ws.z) || 0.01
        botones.current[(m.userData as any).botonBase] = { mesh: m, orig: m.position.clone(), sink, mat, emisivoBase, localCenter, surfaceLocal, salida, radio }
      })
    }
    setupGrupo(dMeshes); setupGrupo(iMeshes)
    notaAMesh.current = NOTA_BOTON

    // Clasificar los botones de MELODÍA en 3 bandas de altura (Alta/Media/Baja) por su centro de
    // geometría en Y. El recorrido grande del teclado es VERTICAL (~19cm), no entre hileras (~4cm),
    // así que la banda define la postura del brazo y el dedo más cercano (BOTON_DEDO) hace el click.
    botonRegion.current = {}
    scene.updateMatrixWorld(true)
    const dCentros: Array<{ base: string; y: number }> = []
    const _c = new THREE.Vector3()
    for (const base in botones.current) {
      if (!/^Boton_D_/.test(base)) continue
      const b = botones.current[base]
      _c.copy(b.localCenter).applyMatrix4(b.mesh.matrixWorld)
      dCentros.push({ base, y: _c.y })
    }
    if (dCentros.length) {
      const ys = dCentros.map((d) => d.y)
      const yMin = Math.min(...ys), yMax = Math.max(...ys)
      const t1 = yMin + (yMax - yMin) / 3, t2 = yMin + (2 * (yMax - yMin)) / 3
      for (const { base, y } of dCentros) botonRegion.current[base] = y < t1 ? 'baja' : y < t2 ? 'media' : 'alta'
    }

    // Coord [hilera, COLUMNA] por GEOMETRÍA: hilera por número (1-10/11-21/22-31); columna = altura Y
    // CUANTIZADA al paso real entre botones → capta el escalonado del teclado. Así una misma FIGURA de
    // acorde se reconoce igual aunque esté desplazada arriba/abajo o cruce filas (ej. tercera con décima).
    botonCoordRef.current = {}
    if (dCentros.length > 1) {
      const ysOrden = dCentros.map((d) => d.y).slice().sort((a, b) => a - b)
      const gaps: number[] = []
      for (let i = 1; i < ysOrden.length; i++) { const g = ysOrden[i] - ysOrden[i - 1]; if (g > 1e-5) gaps.push(g) }
      gaps.sort((a, b) => a - b)
      const paso = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 1   // mediana = paso vertical típico
      const yMin2 = ysOrden[0]
      for (const { base, y } of dCentros) {
        const n = +base.replace('Boton_D_', '')
        const hil = n <= 10 ? 0 : n <= 21 ? 1 : 2
        botonCoordRef.current[base] = [hil, Math.round((y - yMin2) / (paso || 1))]
      }
    }

    // Sprites de ANILLOS (efecto de pisada, imagen ref): uno por botón de melodía, hijo de su malla
    // (sigue al botón), billboard (siempre de frente), aditivo (glow). Opacidad = nivel de pisada.
    for (const sp of Object.values(ringSprites.current)) sp.parent?.remove(sp)
    ringSprites.current = {}
    botonGlow.current = {}
    // Modo ligero (remotos): SIN anillos de pisada — no se aprecian de lejos y son ~40 sprites/avatar
    // (draw calls). El bucle per-frame de visuales de botones también se salta en usePersonajeFrame.
    if (!ligero) {
      const ringTex = crearTexturaAnillo()
      const _sz = new THREE.Vector3()
      for (const base in botones.current) {
        if (!/^Boton_D_/.test(base)) continue
        const b = botones.current[base]
        if (!b.mesh.geometry.boundingBox) b.mesh.geometry.computeBoundingBox()
        b.mesh.geometry.boundingBox!.getSize(_sz)
        const d = Math.max(_sz.x, _sz.y, _sz.z) || 0.01
        const mat = new THREE.SpriteMaterial({ map: ringTex, blending: THREE.AdditiveBlending, transparent: true, opacity: 0, depthWrite: false, depthTest: false })
        const sp = new THREE.Sprite(mat)
        sp.scale.setScalar(d * 1.5) // halo JUSTO sobre el botón (chico, se entiende cuál se pisa)
        sp.position.copy(b.localCenter)
        sp.renderOrder = 999
        b.mesh.add(sp)
        ringSprites.current[base] = sp
        botonGlow.current[base] = 0
      }
    }

    // --- Mapa botón → POSE que lo cubre (cobertura total con TODAS las poses) ---
    // Para cada botón de melodía: la pose cuyo dedo cae más cerca. Prefiere la pose de REGIÓN (natural)
    // si su dedo llega (≤ POSE_THRESH); si no (botones de los extremos), usa la pose ABIERTA (quinta/
    // tónica) cuyo dedo SÍ cae ahí. Así cada botón tiene un dedo encima sin deformar, usando tus poses.
    botonHome.current = {}
    const POSE_THRESH = 0.040
    const rTips: Array<{ k: string; tip: THREE.Object3D }> = []
    for (const k in fingerData.current) { const fd = fingerData.current[k]; if (k.startsWith('R_') && !/Thumb/.test(k) && fd.tip) rTips.push({ k, tip: fd.tip }) }
    const btnWc: Record<string, THREE.Vector3> = {}
    scene.updateMatrixWorld(true)
    for (const base in botones.current) { if (/^Boton_D_/.test(base)) { const b = botones.current[base]; btnWc[base] = b.localCenter.clone().applyMatrix4(b.mesh.matrixWorld) } }
    if (drivenDer.current.length && rTips.length) {
      const gripSave = drivenDer.current.map((e) => e.bone.quaternion.clone())
      const _tp = new THREE.Vector3()
      // Hilera del botón (por número) y de la pose (por nombre) → un botón SOLO puede usar poses de su
      // MISMA hilera (adentro/medio/afuera). Así la mano nunca salta de región: D_11 (medio) usa una pose
      // de medio, NUNCA una de adentro aunque un dedo abierto quede cerca. Dentro de la hilera, el dedo
      // más cercano. (Si la hilera no cubre un botón, se nota el hueco → ahí el usuario posa esa posición.)
      const regionWord = (base: string) => { const n = +base.replace('Boton_D_', ''); return n <= 10 ? 'afuera' : n <= 21 ? 'medio' : 'adentro' }
      const best: Record<string, { pose: string; finger: string; d: number }> = {}
      for (const poseName in POSES_VISOR) {
        // SOLO poses de REGIÓN ("hilera ...") = las TOTALMENTE FUNCIONALES para tocar nota a nota. Las
        // poses de acorde (quinta/tónica) NO se usan para notas sueltas (posicionan la mano para acorde
        // → se veía raro); quedan reservadas para detección de acordes (futuro).
        if (!poseName.startsWith('hilera')) continue
        const pr = poseName.includes('afuera') ? 'afuera' : poseName.includes('medio') ? 'medio' : 'adentro'
        const pose = POSES_VISOR[poseName]
        for (const e of drivenDer.current) { const q = pose[e.suffix]; if (q) e.bone.quaternion.set(q[0], q[1], q[2], q[3]) }
        scene.updateMatrixWorld(true)
        for (const { k, tip } of rTips) {
          tip.getWorldPosition(_tp)
          for (const base in btnWc) {
            if (pr !== regionWord(base)) continue // SOLO poses de la misma hilera
            const d = _tp.distanceTo(btnWc[base])
            if (!best[base] || d < best[base].d) best[base] = { pose: poseName, finger: k, d }
          }
        }
      }
      for (const base in btnWc) { if (best[base]) botonHome.current[base] = { pose: best[base].pose, finger: best[base].finger } }
      drivenDer.current.forEach((e, i) => e.bone.quaternion.copy(gripSave[i]))
      scene.updateMatrixWorld(true)
    }

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
        // D = deslizamiento del morph que debe seguir la mano. NO se usa el promedio de la CAJA: su
        // malla incluye vértices del lado del fuelle que se deslizan distinto (en +Z) y "ensucian" el
        // promedio → la mano deriva y se sale de los botones al cerrar. Se usa el promedio de los
        // BOTONES de bajos (Boton_I), que es donde van los dedos → la mano queda PEGADA a los botones
        // en todo el recorrido (igual que en Blender, mano CHILD_OF de la caja).
        a.time = 0; mixer!.update(0); scene.updateMatrixWorld(true)
        // dLocal = desplazamiento del morph que sigue la mano, en el marco LOCAL de la caja. Se calcula
        // el desplazamiento MUNDIAL real de los BOTONES de bajos (cada uno con SU matrixWorld — su
        // escala/orientación puede diferir de la caja) y se convierte a local de la caja. Así el "weld"
        // de la mano (que aplica dLocal·caja.matrixWorld) reproduce EXACTO el viaje de los botones en
        // todo el recorrido (sin deriva en el cierre fuerte). Se evita el promedio de la CAJA (incluye
        // vértices del fuelle que van en +Z y ensucian) → la mano queda pegada a los botones, como el
        // CHILD_OF de Blender.
        const botonesBajos = morphCerrar.current.filter(({ mesh }) => /Boton_I/.test(mesh.name))
        const fuente = botonesBajos.length ? botonesBajos : [cajaCal]
        const dWorld = new THREE.Vector3()
        const _nm = new THREE.Matrix3()
        for (const b of fuente) {
          const db = (b.mesh.geometry as any).morphAttributes?.position?.[b.idx]
          if (!db) continue
          const db1 = new THREE.Vector3()
          const nb = Math.min(db.count, 300)
          for (let i = 0; i < nb; i++) db1.add(new THREE.Vector3(db.getX(i), db.getY(i), db.getZ(i)))
          db1.multiplyScalar(1 / nb)
          b.mesh.updateWorldMatrix(true, false)
          dWorld.add(db1.applyMatrix3(_nm.setFromMatrix4(b.mesh.matrixWorld)))
        }
        dWorld.multiplyScalar(1 / fuente.length)
        cajaCal.mesh.updateWorldMatrix(true, false)
        const dLocal = dWorld.clone().applyMatrix3(_nm.setFromMatrix4(cajaCal.mesh.matrixWorld).invert())
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
          a.time = closeDur.current; mixer!.update(0); scene.updateMatrixWorld(true)
          ;(manoBone as THREE.Object3D).getWorldPosition(p1)
          a.time = 0; mixer!.update(0); scene.updateMatrixWorld(true)
          const viajeMano = p0.distanceTo(p1)
          // al cerrar (q=1) la caja viaja (1-restW)×|D|; la mano debe viajar lo mismo
          if (viajeMano > 1e-4) handFactor.current = Math.min(1, ((1 - restW.current) * Math.sqrt(dd)) / viajeMano)
        }
        // El REPOSO del fuelle = estado ABIERTO (basis del morph, morph=0): es como se ve recién
        // cargado, con los pliegues limpios. La proyección de arriba daba ~0.265 (reposo 26% cerrado),
        // pero el morph 'Cerrar' es LINEAL → a la mínima influencia ya deforma los pliegues (picos). Al
        // forzar restW=0 el reposo queda abierto y limpio; la mano sigue pegada porque handLocalBind se
        // mide en el marco local de la caja (independiente del morph) y al cerrar la mano sigue dCerrar.
        restW.current = 0

        // Objetivo de la caja: la mano en local de la caja (agarre) + delta promedio del morph 'Abrir',
        // para que el seguimiento del useFrame mantenga la mano sobre los botones al abrir/cerrar.
        a.time = 0; mixer!.update(0); scene.updateMatrixWorld(true)
        // MISMO método robusto que dCerrar (promedio de los BOTONES de bajos vía su matrixWorld, NO el
        // promedio crudo de la CAJA que incluye vértices del fuelle), pero con el morph 'Abrir'. Antes
        // usaba el promedio de la caja → la mano se DESPEGABA al arquear.
        const dWorldA = new THREE.Vector3(); let nFuenteA = 0
        for (const b of fuente) {
          if (b.idxAbrir < 0) continue
          const dbA = (b.mesh.geometry as any).morphAttributes?.position?.[b.idxAbrir]
          if (!dbA) continue
          const d1 = new THREE.Vector3(); const nb = Math.min(dbA.count, 300)
          for (let i = 0; i < nb; i++) d1.add(new THREE.Vector3(dbA.getX(i), dbA.getY(i), dbA.getZ(i)))
          d1.multiplyScalar(1 / nb)
          b.mesh.updateWorldMatrix(true, false)
          dWorldA.add(d1.applyMatrix3(_nm.setFromMatrix4(b.mesh.matrixWorld))); nFuenteA++
        }
        if (nFuenteA) dWorldA.multiplyScalar(1 / nFuenteA)
        cajaCal.mesh.updateWorldMatrix(true, false)
        const dAbrirLocal = dWorldA.clone().applyMatrix3(_nm.setFromMatrix4(cajaCal.mesh.matrixWorld).invert())
        const handW = new THREE.Vector3(); (manoBone as THREE.Object3D).getWorldPosition(handW)
        // Orientación de la mano RELATIVA a la caja (réplica del COPY_ROTATION de Blender): constante.
        // hand_world = caja_world · handQ. Como la caja (nodo) no rota en la web, esto fija la
        // orientación de la mano sin importar cómo se aime el antebrazo → los dedos no se tuercen.
        const _cq = new THREE.Quaternion(), _hq = new THREE.Quaternion()
        cajaCal.mesh.getWorldQuaternion(_cq)
        ;(manoBone as THREE.Object3D).getWorldQuaternion(_hq)
        cajaGrip.current = {
          caja: cajaCal.mesh,
          handLocalBind: cajaCal.mesh.worldToLocal(handW.clone()),
          dCerrar: dLocal.clone(),
          dAbrir: dAbrirLocal,
          restW: restW.current,
          handQ: _cq.invert().multiply(_hq),
        }
      }
    }
  }, [scene, acordeon, clipBrazos, clipCuerpo, mixer])
}
