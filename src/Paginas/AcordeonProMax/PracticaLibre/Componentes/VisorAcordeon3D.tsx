'use client'
import * as React from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { useGLTF, OrbitControls, Bounds, Center } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { subscribirNotas } from '../../../../Core/audio/emisorNotasAcordeon'
import { Escenario } from './visor/Escenario'

// v3 — re-exportado con export_yup=False (mantener Z-up de Blender) para evitar que
// el exporter agregue rotaciones residuales en los nodos. La conversion Z-up→Y-up la
// hacemos en three.js con un <group rotation={[-Math.PI/2, 0, 0]}> alrededor del modelo.
// Cache-buster ?v=N — bumpear cada vez que se re-exporta el GLB.
const GLB_PATH = '/modelos3d/acordeon-fino-v1.glb?v=1'
// Diagnóstico del visor (window.__visor + console.log de posiciones). Apagado en producción.
const DEBUG_VISOR3D = false

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
  // Nombres del GLB "acordeon-fino" (extraído del personaje). three.js sanea los espacios
  // a '_', así que normalizamos a minúsculas con espacios para hacer match robusto.
  if (/^Boton_D_\d+/i.test(nombre)) return 'botones-melodia'
  if (/^Boton_I_\d+/i.test(nombre)) return 'botones-bajos'
  const n = nombre.toLowerCase().replace(/_/g, ' ').trim()
  if (n === 'fuelle') return 'fuelle'
  if (n.startsWith('marco')) return 'marcos'
  if (n.includes('caja de los bajos')) return 'caja-bajos'
  if (n.includes('caja de parrilla')) return 'caja-melodia'
  if (n.startsWith('diapason')) return 'diapason'
  if (n.startsWith('tornillos')) return 'tornillos'
  if (n === 'parrilla' || n === 'rejilla' || n === 'borde parrilla') return 'parrilla'
  if (n.startsWith('cuerpo')) return 'correas'
  if (n.includes('broche')) return 'broches'
  if (n.startsWith('pin')) return 'pines'
  if (n.startsWith('bases')) return 'bases'
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

// Colores del feedback de tecla (reutilizados cada frame, sin alocar): glow cyan sostenido
// mientras la nota suena + chispazo BLANCO al momento de pisar (destello tipo videojuego).
const _COLOR_GLOW = new THREE.Color('#22d3ee')
const _COLOR_FLASH = new THREE.Color('#ffffff')
// Colores por dirección del fuelle (mismos que las notas y que SimuladorApp): el botón activo
// se ilumina AZUL al halar / ROJO al empujar, para que se entienda igual en todos lados.
const _COLOR_HALAR = new THREE.Color('#3b82f6')
const _COLOR_EMPUJAR = new THREE.Color('#ef4444')

interface ModeloProps {
  materialPorMesh: Record<string, MaterialPieza>
  piezaSeleccionada: string | null
  onClickPieza: (nombre: string) => void
  onMallasDetectadas: (piezas: InfoPieza[]) => void
  fuelleCerrandoRef: React.MutableRefObject<boolean>
  animShapeKey: { id: AnimShapeKeyId; epoch: number } | null
  animProgramatica: { id: AnimProgramaticaId; epoch: number } | null
  pulseEpoch: { mesh: string; epoch: number } | null
  // Tocar: al pisar un botón 3D suena la nota real. idLogico = "fila-col-direccion"
  // (melodía) o "fila-col-direccion-bajo" (bajos). direccion = fuelle actual.
  onTocarBoton?: (idLogico: string, accion: 'down' | 'up') => void
  direccion?: 'halar' | 'empujar'
  // ── Modo juego (Maestro/Alumno) ──────────────────────────────────────────────
  // Piel: 'original' = mapas del GLB; '1'..'7' = /public/texturas-acordeon (por material acc_*).
  skin?: string
  // Drive del hundimiento desde fuera (botones activos del maestro o del alumno). Si se
  // pasa, el visor NO se suscribe al emisor global (evita cross-talk entre maestro y alumno).
  botonesActivosExternos?: Record<string, any>
  // Fuelle siempre cerrado (los acordeones del juego se muestran cerrados).
  fuelleCerradoFijo?: boolean
  // Reporta cada frame la posición en pantalla (px de viewport) de cada botón, clave = id
  // lógico sin dirección ("1-5", "bajo-1-3"). El PuenteNotas lo usa para apuntar las notas.
  onPosicionesBotones?: (mapa: Record<string, { x: number; y: number }>) => void
  // Calibración del mapeo posicional para que coincida con la convención de la canción.
  invFilasModelo?: boolean
  invColsModelo?: boolean
  // Botones OBJETIVO (próximos a pisar) → proximidad 0..1 (0 = recién aparece con todo el aviso,
  // 1 = pisarlo AHORA). El visor los ILUMINA con anticipación (pulso que crece) para que se vea
  // clarísimo cuál es el próximo botón, estilo Guitar Hero / SimuladorApp.
  objetivosRef?: React.MutableRefObject<Record<string, number>>
  // Modo juego: ACTIVIDAD del fuelle 0..1 (cuántas notas suenan). Si se pasa, el fuelle se mueve
  // CONTINUO en la dirección (fuelleCerrandoRef) a velocidad ∝ actividad (muchas notas = rápido, una
  // sola = lento), simétrico al abrir/cerrar. Sin esto, comportamiento de estudio (toggle + damping).
  fuelleActividadRef?: React.MutableRefObject<number>
}

function Modelo({
  materialPorMesh, piezaSeleccionada, onClickPieza, onMallasDetectadas,
  fuelleCerrandoRef, animShapeKey, animProgramatica, pulseEpoch,
  onTocarBoton, direccion,
  skin, botonesActivosExternos, fuelleCerradoFijo, onPosicionesBotones,
  invFilasModelo, invColsModelo, objetivosRef, fuelleActividadRef,
}: ModeloProps) {
  const grupo = React.useRef<THREE.Group>(null!)
  // useGLTF cachea y DEVUELVE LA MISMA escena. Un Object3D solo puede tener un padre, así que
  // si dos visores (maestro/alumno en el juego) montan <primitive object={scene}> con la misma
  // instancia, el segundo se la roba al primero → un acordeón desaparece. Clonamos por instancia
  // (la geometría se comparte; morphs y, tras la detección, los materiales quedan independientes).
  const { scene: sceneOriginal } = useGLTF(GLB_PATH) as any
  const scene = React.useMemo(() => sceneOriginal.clone(true), [sceneOriginal])
  const three = useThree()

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
  // Botones de bajos (Boton_I) para hundirlos en su sitio (igual que melodía).
  const botonesIRef = React.useRef<THREE.Mesh[]>([])
  // TODAS las mallas que llevan el morph de cierre (Cerr_uniforme/abajo/arriba). El cierre
  // se aplica a TODAS a la vez (como el tab Personaje) → el acordeón se cierra como un
  // bloque coherente y NADA se despega. Reemplaza la antigua "persecución" del lado bajos.
  const cerrarMeshesRef = React.useRef<Array<{ infl: number[]; dict: Record<string, number> }>>([])
  const valorQRef = React.useRef(fuelleCerradoFijo ? 1 : 0)

  // ── Tocar: mapa inverso mesh→clave lógica + punteros presionados ──────────────────
  // notaAMeshRef va lógico→mesh (para hundir); aquí guardamos mesh→clave (ej. "Boton_D_07"
  // → "1-5", "Boton_I_02" → "bajo-1-3") para resolver qué nota tocar al pisar un botón 3D.
  const meshANotaRef = React.useRef<Record<string, string>>({})
  // clave lógica → mesh del botón (para proyectar su posición a pantalla en modo juego).
  const notaMeshObjRef = React.useRef<Record<string, THREE.Mesh>>({})
  // pointerId → idLogico que está sonando (soporta acordes multitáctil + release seguro).
  const presionadosRef = React.useRef<Map<number, string>>(new Map())
  // direccion/callback leídos en handlers via ref para no recrear los listeners ni
  // capturar valores viejos.
  const direccionRef = React.useRef<'halar' | 'empujar'>(direccion ?? 'halar')
  React.useEffect(() => { direccionRef.current = direccion ?? 'halar' }, [direccion])
  const onTocarRef = React.useRef(onTocarBoton)
  React.useEffect(() => { onTocarRef.current = onTocarBoton }, [onTocarBoton])
  // Fuelle "respirando" mientras se toca (da vida al acordeón como el del personaje).
  const playFuelleRef = React.useRef(0)
  const playPhaseRef = React.useRef(0)
  // Fuelle del JUEGO: actividad y dirección SUAVIZADAS (damping) para que el movimiento sea fluido
  // (sin saltos "por partes" cuando las notas prenden/apagan o cambia la dirección de golpe).
  const fuelleActSuaveRef = React.useRef(0)
  const fuelleDirSuaveRef = React.useRef(-1)

  React.useEffect(() => {
    const lista: THREE.Mesh[] = []
    cerrarMeshesRef.current = []
    scene.traverse((obj: any) => {
      if (obj.isMesh) {
        lista.push(obj)
        if (obj.morphTargetInfluences && obj.morphTargetDictionary
            && ('Cerr_uniforme' in obj.morphTargetDictionary || 'Cerrar' in obj.morphTargetDictionary)) {
          cerrarMeshesRef.current.push({ infl: obj.morphTargetInfluences, dict: obj.morphTargetDictionary })
        }
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
      if (nombre === sanitizar('Caja de los bajos, izquierda')) {
        cajaBajosCentroRef.current = obj
      }
      if (nombre === sanitizar('Caja de parrilla, derecha')) {
        cajaBotonesPrincipalesRef.current = obj
      }
    })
    setMeshes(lista)

    // ── Botones: hundimiento perpendicular + mapeo nota→mesh ──────────────────────────
    const box = new THREE.Box3()
    const centrarMesh = (m: THREE.Mesh) => box.setFromObject(m).getCenter(new THREE.Vector3())
    const tamMesh = (m: THREE.Mesh) => box.setFromObject(m).getSize(new THREE.Vector3())

    // Centro de un botón en el espacio de su PADRE directo (m.matrix = matriz LOCAL, no world).
    // CLAVE: en el modo juego EncuadreJuego rota el modelo en 3D, y además el GLB trae rotaciones
    // de nodos intermedios (conversión Z-up→Y-up). box.setFromObject() devuelve WORLD, donde el
    // eje X queda inclinado y el clustering "por filas" (que agrupa por X) mezclaba botones de
    // filas distintas → solo ~16/43 coincidían con la canción. Usando m.matrix (relativa al padre)
    // ignoramos TODAS las rotaciones ancestrales y recuperamos el layout de diseño: las filas
    // vuelven a separarse limpio en X (10/11/10 + 6/6 = 43).
    // OJO: cada nodo de botón trae su PROPIA rotación (cada botón se inclina para seguir la
    // superficie curva del teclado). Si aplicamos esa rotación (m.matrix), el centro queda
    // "torcido" y las filas se vuelven diagonales en todos los ejes (no clusterizan). La
    // POSICIÓN en la rejilla vive en la TRASLACIÓN del nodo (+ el centro de la geometría, igual
    // para todos): sumándolos SIN rotar recuperamos la rejilla de diseño (filas limpias en X).
    const _cl = new THREE.Vector3()
    const centroLocal = (m: THREE.Mesh) => {
      const g = m.geometry as THREE.BufferGeometry
      if (!g.boundingBox) g.computeBoundingBox()
      return g.boundingBox!.getCenter(_cl).clone().add(m.position)
    }
    // Y del botón PROYECTADA en pantalla (NDC, arriba = +1). Para ORDENAR las columnas igual que
    // las imágenes (columna 1 = la de más ARRIBA). No usamos el eje Z local porque su sentido es
    // OPUESTO entre melodía y bajos (están en lados distintos del acordeón) → con Z una de las dos
    // quedaba invertida. La pantalla es el único marco común a ambos lados. El orden se preserva
    // aunque EncuadreJuego aún no haya aplicado escala/offset (son traslación + escala uniforme).
    const _sv = new THREE.Vector3()
    const pantallaY = (m: THREE.Mesh) => {
      box.setFromObject(m).getCenter(_sv)
      _sv.project(three.camera)
      return _sv.y
    }

    const centroCajaD = cajaBotonesPrincipalesRef.current
      ? centrarMesh(cajaBotonesPrincipalesRef.current as THREE.Mesh) : null
    const centroCajaI = cajaBajosCentroRef.current
      ? centrarMesh(cajaBajosCentroRef.current as THREE.Mesh) : null

    // Agrupar botones por X LOCAL (cada fila comparte X). El primer cluster SIEMPRE se crea.
    const clusterPorX = <T extends { c: THREE.Vector3 }>(items: T[]) => {
      const ordenados = [...items].sort((a, b) => a.c.x - b.c.x)
      const clusters: T[][] = []
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
    botonesIRef.current = iMeshes
    // c = centro LOCAL (para clustering de FILAS por X); cw = centro WORLD (para la normal de
    // hundimiento); sy = Y en pantalla (para ORDENAR las COLUMNAS como en las imágenes).
    const filasMel = clusterPorX(dMeshes.map((m) => ({ m, c: centroLocal(m), cw: centrarMesh(m), sy: pantallaY(m) })))
    const filasBajo = clusterPorX(iMeshes.map((m) => ({ m, c: centroLocal(m), cw: centrarMesh(m), sy: pantallaY(m) })))

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
    // La normal/hundimiento se calcula en WORLD (como siempre): convertimos las filas ya
    // agrupadas a su centro world (cw). La AGRUPACIÓN es la correcta (vino del clustering local).
    const aWorld = (filas: Array<Array<{ m: THREE.Mesh; cw: THREE.Vector3 }>>) =>
      filas.map((f) => f.map((it) => ({ m: it.m, c: it.cw })))
    const normalD = normalDeFilas(aWorld(filasMel), centroCajaD)
    const normalI = normalDeFilas(aWorld(filasBajo), centroCajaI)

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
        // Magnitud = 0: el botón NO se mueve. Antes se hundía dentro del cuerpo y se OCULTABA
        // (parecía "desaparecer"). Como en SimuladorApp, el feedback es por LUZ (glow), no por
        // movimiento → siempre visible y más fácil de entender. (queda el offset por si se quiere
        // reactivar un hundimiento sutil a futuro, pero a 0 no afecta la posición.)
        const mag = Math.min(s.x, s.y, s.z) * 0
        m.userData.hundirOffset = normalLocal.clone().multiplyScalar(mag)
      })
    }
    asignarHundir(dMeshes, normalDLocal)
    asignarHundir(iMeshes, normalILocal)

    // Mapeo POSICIONAL nota→mesh. Conteos 3D = filas lógicas: melodía 10/11/10 =
    // primeraFila/segundaFila/terceraFila, bajos 6/6 = una/dos. Filas por X (local) ascendente →
    // prefijos "1","2","3". Columnas por Y EN PANTALLA: columna 1 = la de más ARRIBA (sy mayor en
    // NDC), igual que en las imágenes (donde el botón 1 de cada hilera está arriba). invFilas
    // invierte el orden de filas; invCols invierte el de columnas. Calibran el mapeo vs la canción.
    const ordenarCol = (fila: Array<{ m: THREE.Mesh; sy: number }>) =>
      [...fila].sort((a, b) => (invColsModelo ? a.sy - b.sy : b.sy - a.sy))
    const mapa: Record<string, string> = {}
    filasMel.forEach((fila, iFila) => {
      const idx = invFilasModelo ? filasMel.length - 1 - iFila : iFila
      const pre = String(idx + 1)
      ordenarCol(fila).forEach((it, i) => {
        mapa[`${pre}-${i + 1}`] = it.m.name
      })
    })
    filasBajo.forEach((fila, iFila) => {
      const idx = invFilasModelo ? filasBajo.length - 1 - iFila : iFila
      const pre = String(idx + 1)
      ordenarCol(fila).forEach((it, i) => {
        mapa[`bajo-${pre}-${i + 1}`] = it.m.name
      })
    })
    notaAMeshRef.current = mapa
    // Inverso mesh→clave para tocar al pisar el botón.
    const reverso: Record<string, string> = {}
    for (const [k, v] of Object.entries(mapa)) reverso[v] = k
    meshANotaRef.current = reverso
    // clave lógica → objeto mesh (para proyectar posiciones de botón en modo juego).
    const objPorNombre: Record<string, THREE.Mesh> = {}
    for (const m of lista) objPorNombre[m.name] = m
    const idAObj: Record<string, THREE.Mesh> = {}
    for (const [id, name] of Object.entries(mapa)) { const o = objPorNombre[name]; if (o) idAObj[id] = o }
    notaMeshObjRef.current = idAObj

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

    // DEBUG (apagado en prod): volcar posiciones WORLD reales + exponer window.__visor. Poner
    // DEBUG_VISOR3D=true para reactivarlo al depurar.
    if (DEBUG_VISOR3D && typeof window !== 'undefined') {
      ;(window as any).__visor = { scene, fuelle: fuelleMesh.current, ladoBajos: ladoBajosObjects.current, ed: fuelleEdgeDeltasRef.current, notaAMesh: notaAMeshRef.current, notasActivas: notasActivasRef.current, cam: three.camera, gl: three.gl, ctrls: (three as any).controls }
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
  }, [scene, onMallasDetectadas, invFilasModelo, invColsModelo])

  // UN SOLO useEffect que aplica TODO: color, roughness, metalness, mapas y emissive
  // del highlight. Si la cfg tiene usarTexturaOriginal !== false (o sea: estado default
  // sin custom del usuario), restauramos las texturas baked del GLB. Si el usuario
  // aplico un color/acabado, quitamos los mapas para que el cambio se vea limpio.
  React.useEffect(() => {
    if (skin) return // modo juego: la piel gobierna los materiales (ver efecto de skin abajo)
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
  }, [materialPorMesh, piezaSeleccionada, meshes, skin])

  // ── Piel (modo juego) ─────────────────────────────────────────────────────────────
  // Aplica una textura PBR de /texturas-acordeon/{skin}/ por material acc_* (cuerpo/botones/
  // fuelle/pack), igual que usePielesAcordeon en el personaje (el fino comparte ese asset).
  React.useEffect(() => {
    if (!skin || meshes.length === 0) return
    const PARTES = new Set(['cuerpo', 'botones', 'fuelle', 'pack', 'parte botones'])
    const loader = new THREE.TextureLoader()
    const cache: Record<string, THREE.Texture> = {}
    const cargar = (url: string, srgb: boolean) => {
      if (cache[url]) return cache[url]
      const t = loader.load(url)
      t.flipY = false
      if (srgb) t.colorSpace = THREE.SRGBColorSpace
      cache[url] = t
      return t
    }
    meshes.forEach((mesh) => {
      const mat = mesh.material as THREE.MeshStandardMaterial
      if (!mat || !(mat as any).isMeshStandardMaterial) return
      const part = (mat.name || '').replace(/\.\d+$/, '').replace(/^acc_/, '')
      if (!PARTES.has(part)) return
      if (skin === 'original') {
        const o = mesh.userData.texOrig
        if (o) { mat.map = o.map; mat.roughnessMap = o.roughnessMap; mat.metalnessMap = o.metalnessMap }
      } else {
        const dir = `/texturas-acordeon/${skin}/${part.replace(/\s+/g, '-')}`
        mat.map = cargar(`${dir}_base.webp`, true)
        const mr = cargar(`${dir}_mr.webp`, false)
        mat.roughnessMap = mr; mat.metalnessMap = mr; mat.roughness = 1; mat.metalness = 1
        mat.normalMap = cargar(`${dir}_normal.webp`, false)
      }
      mat.color.set('#ffffff')
      mat.needsUpdate = true
    })
    return () => { Object.values(cache).forEach((t) => t.dispose()) }
  }, [skin, meshes])

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
  // Modo juego: el hundimiento viene de botonesActivosExternos (maestro/alumno), NO del
  // emisor global — así el visor del maestro no reacciona a lo que toca el alumno.
  const usaBotonesExternos = botonesActivosExternos !== undefined
  React.useEffect(() => {
    if (usaBotonesExternos) return
    const off = subscribirNotas((e) => {
      const nombreMesh = notaAMeshRef.current[keyDeId(e.idBoton)]
      if (!nombreMesh) return
      if (e.accion === 'down') notasActivasRef.current.add(nombreMesh)
      else notasActivasRef.current.delete(nombreMesh)
    })
    return off
  }, [usaBotonesExternos])

  // Sincroniza el set de meshes hundidos desde los botones activos externos.
  React.useEffect(() => {
    if (!botonesActivosExternos) return
    const set = notasActivasRef.current
    set.clear()
    for (const [id, v] of Object.entries(botonesActivosExternos)) {
      if (!v) continue
      const nombreMesh = notaAMeshRef.current[keyDeId(id)]
      if (nombreMesh) set.add(nombreMesh)
    }
  }, [botonesActivosExternos])

  useFrame((_, delta) => {
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

    // 3) Cierre del fuelle aplicado a TODAS las piezas a la vez (igual que el tab Personaje):
    //    el morph Cerr_uniforme/abajo/arriba está horneado en CADA malla con un campo de
    //    compresión GLOBAL coherente → el acordeón se cierra como un bloque y NADA se
    //    despega. (Antes solo el fuelle tenía morph y la caja de bajos lo "perseguía" con
    //    una medición, lo que despegaba las piezas al usar la geometría nueva.)
    const SNAP_EPS = 0.002
    const snap = (v: number) => (Math.abs(v) < SNAP_EPS ? 0 : v)
    let valorQ: number
    let pump = 0
    if (fuelleActividadRef) {
      // JUEGO: el fuelle se mueve en la dirección actual a velocidad ∝ actividad (cuántas notas
      // suenan). CLAVE para que sea FLUIDO (no "por partes"): suavizamos con damping tanto la
      // ACTIVIDAD (acelera/desacelera gradual, no salta al prender/apagar notas) como la DIRECCIÓN
      // (−1..1: al invertir cruza 0 suave, no rebota brusco). + una respiración mínima para que el
      // fuelle siempre fluya un poquito y no se "congele" en seco entre notas.
      const act = Math.min(Math.max(fuelleActividadRef.current, 0), 1)
      // actividad y dirección SUAVES (la actividad decae lento → notas cercanas dan movimiento
      // CONTINUO, no a pulsos; la dirección cruza 0 al invertir → sin rebote brusco).
      fuelleActSuaveRef.current = THREE.MathUtils.damp(fuelleActSuaveRef.current, act, 2.2, delta)
      const dirObj = fuelleCerrandoRef.current ? 1 : -1
      fuelleDirSuaveRef.current = THREE.MathUtils.damp(fuelleDirSuaveRef.current, dirObj, 3.2, delta)
      // movimiento direccional (solo con actividad → entre frases NO deriva a un extremo).
      const baseQ = THREE.MathUtils.clamp(
        valorQRef.current + fuelleDirSuaveRef.current * fuelleActSuaveRef.current * 1.0 * delta, 0, 1)
      valorQRef.current = baseQ
      // respiración: oscilación TENUE sobre el valor (no deriva) → nunca queda en seco, da vida.
      playPhaseRef.current += delta
      valorQ = THREE.MathUtils.clamp(baseQ + 0.022 * Math.sin(playPhaseRef.current * 1.4), 0, 1)
    } else {
      // ESTUDIO/replay: toggle abrir/cerrar con damping (tecla Q / fuelleCerradoFijo) + "respira".
      const targetQ = (fuelleCerradoFijo || fuelleCerrandoRef.current) ? 1 : 0
      valorQ = THREE.MathUtils.damp(valorQRef.current, targetQ, 12, delta)
      if (Math.abs(valorQ - targetQ) < SNAP_EPS) valorQ = targetQ
      valorQRef.current = valorQ
      const hayNota = notasActivasRef.current.size > 0
      if (hayNota) playPhaseRef.current += delta
      const pumpT = hayNota ? 0.10 + 0.10 * Math.sin(playPhaseRef.current * 2.4) : 0
      playFuelleRef.current = THREE.MathUtils.damp(playFuelleRef.current, pumpT, 6, delta)
      pump = playFuelleRef.current
    }
    const valUniforme = snap(Math.max(valorQ, influPrograma, influShapeUniforme, pump))
    const valAbajo = snap(influShapeAbajo)
    const valArriba = snap(influShapeArriba)
    for (const { infl, dict } of cerrarMeshesRef.current) {
      // El acordeón extraído del personaje usa el morph 'Cerrar' (cierre uniforme).
      if (dict['Cerrar'] !== undefined) infl[dict['Cerrar']] = valUniforme
      if (dict['Cerr_uniforme'] !== undefined) infl[dict['Cerr_uniforme']] = valUniforme
      if (dict['Cerr_abajo'] !== undefined) infl[dict['Cerr_abajo']] = valAbajo
      if (dict['Cerr_arriba'] !== undefined) infl[dict['Cerr_arriba']] = valArriba
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
      // Destello (flanco de subida): chispazo al MOMENTO exacto de pisar la tecla; decae rápido.
      // Da la "indicación tipo videojuego" pedida, encima del hundimiento. (no engancha en sostenido)
      if (activo && !obj.userData.eraActivo) obj.userData.flash = 1
      obj.userData.eraActivo = activo
      const fl = (obj.userData.flash as number | undefined) ?? 0
      obj.userData.flash = fl > 0.002 ? THREE.MathUtils.damp(fl, 0, 9, delta) : 0
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

    // Feedback de la tecla: glow claro coloreado por dirección. Tres estados:
    //  • PISADO/sonando → glow fuerte.
    //  • OBJETIVO próximo (prox>0) → pulso que CRECE con la cercanía = guía clara de cuál pisar
    //    (anticipación estilo Guitar Hero: el botón se enciende ANTES, con tiempo).
    //  • nada → apagado. Sin movimiento ni pico blanco (no satura, no desaparece).
    const tGlow = performance.now() * 0.001
    const latido = 0.6 + 0.4 * Math.sin(tGlow * 7) // pulso para el objetivo
    const colorDir = direccionRef.current === 'empujar' ? _COLOR_EMPUJAR : _COLOR_HALAR
    const objetivos = objetivosRef?.current
    const aplicarGlowBoton = (m: THREE.Mesh, factor: number, prox: number) => {
      const mat = m.material as THREE.MeshStandardMaterial
      if (!mat || !(mat as any).isMeshStandardMaterial) return
      const flash = (m.userData.flash as number | undefined) ?? 0
      if (factor > 0.002 || flash > 0.002) {
        mat.emissive.copy(colorDir)
        mat.emissiveIntensity = 0.3 + factor * 0.8 + flash * 0.35
      } else if (prox > 0.01) {
        // prox² → los lejanos apenas un indicio, el INMINENTE bien brillante (foco claro en el
        // próximo botón, sin saturar con muchos a la vez).
        mat.emissive.copy(colorDir)
        mat.emissiveIntensity = (0.12 + prox * prox * 1.5) * latido
      } else if (m.name === piezaSeleccionada) {
        mat.emissive.set('#3b82f6')
        mat.emissiveIntensity = 0.45
      } else {
        mat.emissive.set('#000000')
        mat.emissiveIntensity = 0
      }
    }
    const proxDe = (m: THREE.Mesh) => (objetivos ? (objetivos[meshANotaRef.current[m.name]] ?? 0) : 0)

    const _rsc = new THREE.Vector3()
    // ANIMACIÓN del botón = CRECE sobre su PROPIO centro (no se mueve, no se hunde, no desaparece).
    // Escalar un mesh lo agranda respecto a su origen de nodo (que NO es el centro del botón, porque
    // la geometría está desplazada) → para que crezca EN SITIO, compensamos la posición: al escalar
    // por k, el centro se iría a R·S·cg·k; lo devolvemos sumando R·S·cg·(1−k). Así el centro queda
    // CLAVADO (la proyección/puntería de notas no se mueve) y el botón solo se hace más grande.
    const animarBoton = (m: THREE.Mesh, realce: number) => {
      const origPos = m.userData.originalPos as THREE.Vector3 | undefined
      const origScale = m.userData.originalScale as THREE.Vector3 | undefined
      if (!origPos || !origScale) return
      let cg = m.userData.centroGeo as THREE.Vector3 | undefined
      if (!cg) {
        const g = m.geometry as THREE.BufferGeometry
        if (!g.boundingBox) g.computeBoundingBox()
        cg = g.boundingBox!.getCenter(new THREE.Vector3())
        m.userData.centroGeo = cg
      }
      const k = 1 + realce * 0.85 // hasta ~1.85× cuando es el objetivo inminente / está pisado
      _rsc.copy(cg).multiply(origScale).applyQuaternion(m.quaternion).multiplyScalar(1 - k)
      m.scale.copy(origScale).multiplyScalar(k)
      m.position.copy(origPos).add(_rsc)
    }

    for (const m of botonesIRef.current) {
      const factor = Math.max(sinkFactor(m), pulseMeshName === m.name ? pulseFactor : 0)
      const prox = proxDe(m)
      animarBoton(m, Math.max(factor, prox))
      aplicarGlowBoton(m, factor, prox)
    }
    for (const m of botonesDRef.current) {
      const factor = Math.max(sinkFactor(m), pulseMeshName === m.name ? pulseFactor : 0)
      const prox = proxDe(m)
      animarBoton(m, Math.max(factor, prox))
      aplicarGlowBoton(m, factor, prox)
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

    // ── Modo juego: proyectar la posición de cada botón a px de viewport para el PuenteNotas.
    // Cámara fija + fuelle cerrado → posiciones estables; se reportan cada frame (barato).
    if (onPosicionesBotones) {
      const rect = three.gl.domElement.getBoundingClientRect()
      const v = new THREE.Vector3()
      const mapa: Record<string, { x: number; y: number }> = {}
      for (const id in notaMeshObjRef.current) {
        const m = notaMeshObjRef.current[id]
        // OJO: en el GLB los botones de una hilera comparten el mismo NODO; lo que los distingue
        // son los VÉRTICES → proyectamos el CENTRO de geometría, no la posición del nodo.
        // OPTIMIZACIÓN: ese centro local es constante → se cachea (m.userData.centroGeo, mismo que
        // usa animarBoton) y cada frame sólo se lleva a world (matrixWorld) y se proyecta, en vez de
        // `box.setFromObject` (que recorre toda la geometría) por 43 botones × 2 acordeones/frame.
        // El botón escala SOBRE su centro, así que el centro world NO se mueve → la nota apunta exacto.
        let cg = m.userData.centroGeo as THREE.Vector3 | undefined
        if (!cg) {
          const g = m.geometry as THREE.BufferGeometry
          if (!g.boundingBox) g.computeBoundingBox()
          cg = g.boundingBox!.getCenter(new THREE.Vector3())
          m.userData.centroGeo = cg
        }
        v.copy(cg).applyMatrix4(m.matrixWorld).project(three.camera)
        mapa[id] = {
          x: rect.left + (v.x * 0.5 + 0.5) * rect.width,
          y: rect.top + (-v.y * 0.5 + 0.5) * rect.height,
        }
      }
      onPosicionesBotones(mapa)
    }
  })

  // idLogico de la nota a tocar desde el mesh pisado: clave inversa + dirección del fuelle.
  const idLogicoDeMesh = React.useCallback((meshName: string): string | null => {
    const key = meshANotaRef.current[meshName]
    if (!key) return null
    const dir = direccionRef.current
    if (key.startsWith('bajo-')) return `${key.slice(5)}-${dir}-bajo`
    return `${key}-${dir}`
  }, [])

  // Soltar la nota asociada a un puntero. Garantiza que ninguna nota quede pegada.
  const soltarPuntero = React.useCallback((pointerId: number) => {
    const id = presionadosRef.current.get(pointerId)
    if (id == null) return
    presionadosRef.current.delete(pointerId)
    onTocarRef.current?.(id, 'up')
  }, [])

  // pointerup/cancel a nivel window: aunque sueltes fuera del botón, la nota se libera.
  React.useEffect(() => {
    const onUp = (e: PointerEvent) => soltarPuntero(e.pointerId)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      // Al desmontar (cambiar de pestaña mientras se toca) soltar todo lo que sonara.
      presionadosRef.current.forEach((id) => onTocarRef.current?.(id, 'up'))
      presionadosRef.current.clear()
    }
  }, [soltarPuntero])

  const onPointerDownMesh = React.useCallback((e: ThreeEvent<PointerEvent>) => {
    const name = (e.object as any)?.name as string | undefined
    if (!name) return
    const id = idLogicoDeMesh(name)
    if (!id) return // no es un botón → dejar pasar (selección de pieza para pintar)
    e.stopPropagation()
    soltarPuntero(e.pointerId) // por si el puntero traía una nota previa
    presionadosRef.current.set(e.pointerId, id)
    onTocarRef.current?.(id, 'down')
  }, [idLogicoDeMesh, soltarPuntero])

  // Click solo selecciona piezas que NO son botones (para pintarlas). Los botones son
  // para tocar; seleccionarlos dejaría un highlight azul molesto tras cada nota.
  const onClickMesh = React.useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    const name = (e.object as any)?.name as string | undefined
    if (!name || meshANotaRef.current[name]) return
    onClickPieza(name)
  }, [onClickPieza])

  return <primitive ref={grupo} object={scene} onClick={onClickMesh} onPointerDown={onPointerDownMesh} />
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
  onTocarBoton?: (idLogico: string, accion: 'down' | 'up') => void
  direccion?: 'halar' | 'empujar'
  skin?: string
  botonesActivosExternos?: Record<string, any>
  fuelleCerradoFijo?: boolean
  // Modo juego: cámara fija de frente (sin orbitar) para que las posiciones de los botones
  // se mantengan alineadas con el PuenteNotas.
  camaraFija?: boolean
  onPosicionesBotones?: (mapa: Record<string, { x: number; y: number }>) => void
  // Modo juego: rotación (radianes) aplicada al modelo para encararlo de frente a la cámara fija.
  rotacionModelo?: [number, number, number]
  // Modo juego (encuadre AUTO, responsive): `fill` = fracción del ANCHO del lienzo que ocupa el
  // acordeón (1 = todo el ancho; >1 = se acerca y recorta las correas). `offsetRelY` = nudge
  // vertical como fracción de la altura del modelo. Así se centra solo en cualquier pantalla.
  fillModelo?: number
  offsetRelXModelo?: number
  offsetRelYModelo?: number
  invFilasModelo?: boolean
  invColsModelo?: boolean
  // Modo juego: botones objetivo próximos a pisar (clave→proximidad 0..1) para iluminarlos con
  // anticipación. Lo arma el padre desde la canción + tick; se pasa al acordeón del ALUMNO.
  objetivosRef?: React.MutableRefObject<Record<string, number>>
  // Modo juego: actividad del fuelle 0..1 (cuántas notas suenan) → velocidad del movimiento del
  // fuelle. Se pasa a AMBOS acordeones para que ambos animen con la canción.
  fuelleActividadRef?: React.MutableRefObject<number>
  // Modo juego: permite ROTAR la cámara (orbitar) para explorar el acordeón en 3D. Sólo rotación
  // (sin zoom ni pan): EncuadreJuego escala según la distancia de cámara, así que el zoom pelearía
  // con el auto-fit; rotando a distancia constante el modelo queda fijo de tamaño y las notas
  // siguen alineadas (las posiciones se reproyectan cada frame).
  navegable?: boolean
  // Modo juego: escenario 3D detrás del acordeón (mismo `<Escenario>` que la pestaña Personaje / Mundo:
  // estudio cove .glb, tarima, plaza). Se renderiza como TELÓN (fuera de EncuadreJuego, con transform
  // propio) porque el acordeón flota escalado. 'ninguno'/undefined → sin escenario (fondo original).
  escenarioId?: string
  className?: string
}

// Encuadre AUTO para el modo juego: mide la caja del modelo una vez, lo centra en el origen y
// calcula la escala para llenar `fill` del ANCHO visible del lienzo (responsive: usa el aspect
// y el fov reales de la cámara). Reemplaza a Bounds/Center (que centran por la caja completa,
// incluidas las correas) y a los valores absolutos (que no se trasladaban entre pantallas).
const EncuadreJuego: React.FC<{
  rotacion: [number, number, number]
  fill: number
  offsetRelX: number
  offsetRelY: number
  children: React.ReactNode
}> = ({ rotacion, fill, offsetRelX, offsetRelY, children }) => {
  const { camera } = useThree()
  const outer = React.useRef<THREE.Group>(null!)
  const centro = React.useRef<THREE.Group>(null!)
  const rot = React.useRef<THREE.Group>(null!)
  // El CENTRADO se mide una sola vez (con outer en identidad). El TAMAÑO y el desplazamiento
  // se aplican cada frame, así responden a los sliders en vivo.
  const medido = React.useRef<{ size: THREE.Vector3 } | null>(null)
  // Valores ANIMADOS (lerp) hacia fill/offset objetivo: cambiar de "toma" de cámara (zoom/encuadre)
  // se ve suave. En reposo convergen a los props → idéntico al encuadre fijo (no rompe nada).
  const cur = React.useRef<{ fill: number; offX: number; offY: number } | null>(null)
  useFrame((_, dt) => {
    if (!rot.current || !outer.current || !centro.current) return
    if (!medido.current) {
      const box = new THREE.Box3().setFromObject(rot.current)
      if (box.isEmpty()) return
      const size = box.getSize(new THREE.Vector3())
      const center = box.getCenter(new THREE.Vector3())
      centro.current.position.set(-center.x, -center.y, -center.z) // centra el modelo en el origen
      medido.current = { size }
    }
    if (!cur.current) cur.current = { fill, offX: offsetRelX, offY: offsetRelY }
    const k = 1 - Math.exp(-5 * (dt || 0.016)) // tween suave hacia la toma
    cur.current.fill += (fill - cur.current.fill) * k
    cur.current.offX += (offsetRelX - cur.current.offX) * k
    cur.current.offY += (offsetRelY - cur.current.offY) * k
    const { size } = medido.current
    const cam = camera as THREE.PerspectiveCamera
    const dist = cam.position.length() // cámara mira al origen → distancia = |pos|
    const visH = 2 * Math.tan((cam.fov * Math.PI) / 180 / 2) * dist
    const visW = visH * cam.aspect
    // Escala para que el ANCHO del acordeón ocupe `fill` del ancho visible.
    const s = (cur.current.fill * visW) / (size.x || 1)
    outer.current.scale.setScalar(s)
    outer.current.position.set(cur.current.offX * size.x * s, cur.current.offY * size.y * s, 0)
  })
  return (
    <group ref={outer}>
      <group ref={centro}>
        <group ref={rot} rotation={rotacion}>{children}</group>
      </group>
    </group>
  )
}

const VisorAcordeon3D: React.FC<VisorAcordeon3DProps> = (props) => {
  return (
    <div className={`visor-acordeon-3d-stage${props.className ? ` ${props.className}` : ''}`}>
      {/* Juego: cámara recta de frente (centrado limpio). Estudio: ligero picado. */}
      <Canvas camera={{ position: props.camaraFija ? [0, 0, 6] : [0, 1.2, 6], fov: 32 }} dpr={[1, 1.25]}>
        <React.Suspense fallback={null}>
          {/* Envmap procedural local — indispensable para que el acabado "Cromo" /
              metalness alto se vea como un metal real (sin esto se ven negros porque
              no tienen nada que reflejar). NO descarga nada de la red. */}
          <EnvmapLocal />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 6, 5]} intensity={0.9} />
          <directionalLight position={[-5, 3, -3]} intensity={0.35} />
          <directionalLight position={[0, -4, 4]} intensity={0.2} />
          {/* Escenario 3D como TELÓN detrás del acordeón (mismo `<Escenario>` que Personaje/Mundo).
              Va FUERA de EncuadreJuego (a escala mundo) y con su propio transform: bajado (el piso
              queda debajo del acordeón flotante) + escalado y atrás. 'ninguno'/undefined → nada. */}
          {props.camaraFija && props.escenarioId && props.escenarioId !== 'ninguno' && (
            <group position={[0, -2.0, -2.2]} scale={1.7}>
              <React.Suspense fallback={null}>
                <Escenario id={props.escenarioId} />
              </React.Suspense>
            </group>
          )}
          {/* Bounds SIN `observe`: fit/center se aplican una sola vez al cargar. Si dejamos
              observe, cada vez que un boton se hunde y vuelve, Bounds re-fitea el modelo
              entero y reorganiza las piezas — el usuario lo vio como "se daña todo al
              presionar un boton tras hacer zoom". */}
          {props.camaraFija ? (
            // Modo juego: encuadre AUTO (responsive) + orientación.
            <EncuadreJuego
              rotacion={props.rotacionModelo ?? [0, 0, 0]}
              fill={props.fillModelo ?? 0.95}
              offsetRelX={props.offsetRelXModelo ?? 0}
              offsetRelY={props.offsetRelYModelo ?? 0}
            >
              <Modelo {...props} />
            </EncuadreJuego>
          ) : (
            <Bounds fit clip margin={1.15}>
              <Center>
                {/* Conversion Z-up (Blender) → Y-up (three.js): rotacion -90° X.
                    El GLB v3 fue exportado con export_yup=False para que no metiera
                    rotaciones residuales por nodo (que rompian al marco Fuelle 2). */}
                {/* acordeon-solo extraído del personaje = Y-up nativo → SIN rotación -90X. */}
                <group>
                  <Modelo {...props} />
                </group>
              </Center>
            </Bounds>
          )}
          {/* Modo juego: cámara fija por defecto (no desalinea notas). Si `navegable`, se puede
              ORBITAR (sólo rotar, sin zoom/pan → no pelea con el auto-fit de EncuadreJuego). Las
              notas siguen pegadas porque las posiciones se reproyectan cada frame. Límite polar
              para no voltear el acordeón boca abajo. */}
          {props.camaraFija ? (
            <OrbitControls
              makeDefault
              enabled={props.navegable ?? false}
              enableZoom={false}
              enablePan={false}
              rotateSpeed={0.6}
              minPolarAngle={Math.PI * 0.18}
              maxPolarAngle={Math.PI * 0.82}
              target={[0, 0, 0]}
            />
          ) : (
            <OrbitControls makeDefault enablePan={false} minDistance={2.5} maxDistance={12} />
          )}
        </React.Suspense>
      </Canvas>
    </div>
  )
}

export default VisorAcordeon3D
