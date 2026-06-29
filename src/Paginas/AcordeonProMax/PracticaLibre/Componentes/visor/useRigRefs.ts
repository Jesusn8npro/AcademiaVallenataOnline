import * as React from 'react'
import * as THREE from 'three'

// Bolsa de refs del visor del personaje. Antes vivían sueltas dentro de Modelo; agruparlas en un
// objeto tipado permite que los hooks (setup, fuelle, bailes, suscripción, frame) compartan el
// MISMO estado sin pasar 30 argumentos. Cada campo es la misma ref que existía antes (mismo runtime).
export interface RigRefs {
  qRef: React.MutableRefObject<number>
  // Capa BRAZOS del cierre (pausada, escrubada con Q): el agarre de las manos sobre el acordeón.
  closeAction: React.MutableRefObject<THREE.AnimationAction | null>
  // Capa CUERPO del cierre (pausada): pose de agarre del torso/piernas = idle. Crossfade con bailes.
  cuerpoAction: React.MutableRefObject<THREE.AnimationAction | null>
  // Baile sonando ahora (acción del mixer) + caché de acciones por clip.
  baileAccion: React.MutableRefObject<THREE.AnimationAction | null>
  accionesBaile: React.MutableRefObject<Record<string, THREE.AnimationAction>>
  // Malla(s) del acordeón con morph 'Cerrar' (fuelle + caja de bajos + botones I).
  morphCerrar: React.MutableRefObject<Array<{ mesh: THREE.Mesh; idx: number; idxAbrir: number }>>
  closeDur: React.MutableRefObject<number>
  // Calibración por personaje: restW = peso del morph que pone la caja bajo la mano real; handFactor escala la acción de la mano.
  restW: React.MutableRefObject<number>
  handFactor: React.MutableRefObject<number>
  // Brazo izquierdo (bajos) en agarre, para aplicar el hard-copy de la pose "abierto" de Blender.
  brazoIzq: React.MutableRefObject<{ bones: THREE.Object3D[]; qAgarre: THREE.Quaternion[]; qClosed: THREE.Quaternion[]; posAgarre: THREE.Vector3[]; posClosed: THREE.Vector3[] }>
  // Caja de bajos: mantiene la mano sobre los botones siguiendo el morph.
  cajaGrip: React.MutableRefObject<{ caja: THREE.Mesh; handLocalBind: THREE.Vector3; dCerrar: THREE.Vector3; dAbrir: THREE.Vector3; restW: number; handQ: THREE.Quaternion } | null>
  // Brazo DERECHO (melodía): codo + muñeca en agarre, base de la postura de región.
  brazoDer: React.MutableRefObject<{ foreArm: THREE.Object3D | null; hand: THREE.Object3D | null; gripFore: THREE.Quaternion; gripHand: THREE.Quaternion }>
  curForeDelta: React.MutableRefObject<THREE.Quaternion>
  curHandDelta: React.MutableRefObject<THREE.Quaternion>
  // Sistema de POSES: huesos del brazo derecho con su quaternion de AGARRE (idle) y el actual.
  drivenDer: React.MutableRefObject<Array<{ bone: THREE.Object3D; suffix: string; gripQ: THREE.Quaternion; curQ: THREE.Quaternion }>>
  melodyPoseRef: React.MutableRefObject<string | null>
  // Poses ponderadas a mezclar para el botón pisado (mezcla por cercanía → dedo sobre el botón exacto).
  melodyBlendRef: React.MutableRefObject<[string, number][] | null>
  // Botón de melodía pisado (para flexionar el dedo asignado sobre él) y peso suavizado de la pisada.
  melodyButtonRef: React.MutableRefObject<string | null>
  melodyPressRef: React.MutableRefObject<number>
  // Mapa botón → pose que mejor lo cubre (precalculado en el setup).
  botonHome: React.MutableRefObject<Record<string, { pose: string; finger: string }>>
  // Sprites de anillos (efecto de pisada) por botón, + nivel de glow suavizado por botón.
  ringSprites: React.MutableRefObject<Record<string, THREE.Sprite>>
  botonGlow: React.MutableRefObject<Record<string, number>>
  // Banda objetivo (de la última nota de melodía) + cuántas notas de melodía suenan + sello de tiempo.
  regionTargetRef: React.MutableRefObject<'alta' | 'media' | 'baja'>
  melodiaSonandoRef: React.MutableRefObject<number>
  ultimaMelodiaMsRef: React.MutableRefObject<number>
  // Banda (Alta/Media/Baja) de cada botón de melodía, clasificada por su altura (Y) en el setup.
  botonRegion: React.MutableRefObject<Record<string, 'alta' | 'media' | 'baja'>>
  // Coord [hilera, columna] de cada botón por GEOMETRÍA real (columna = altura Y cuantizada) → para
  // reconocer una FIGURA de acorde igual aunque esté desplazada arriba/abajo o en otra hilera.
  botonCoordRef: React.MutableRefObject<Record<string, [number, number]>>
  // Dedos del rig mixamo: por dedo, sus huesos + rotaciones de descanso + punta + signo de levante.
  fingerData: React.MutableRefObject<Record<string, { joints: THREE.Object3D[]; rests: THREE.Quaternion[]; tip: THREE.Object3D | null; liftSign: number }>>
  fingerPress: React.MutableRefObject<Record<string, number>>
  // Calibración de la punta del dedo: ON/OFF + offset fino por botón (marco local de la malla) que el
  // usuario acomoda en vivo (F2 + flechas) para que la yema caiga EXACTO sobre cada botón.
  calibrandoRef: React.MutableRefObject<boolean>
  ajustesDedo: React.MutableRefObject<Record<string, THREE.Vector3>>
  botones: React.MutableRefObject<Record<string, { mesh: THREE.Mesh; orig: THREE.Vector3; sink: THREE.Vector3; mat: any; emisivoBase: THREE.Color; localCenter: THREE.Vector3; surfaceLocal: THREE.Vector3; salida: THREE.Vector3; radio: number }>>
  notaAMesh: React.MutableRefObject<Record<string, string>>
  notasActivas: React.MutableRefObject<Set<string>>
  // Fuelleo automático: dirección de la última nota + cuántas notas suenan ahora + sello de tiempo.
  fuelleNotaRef: React.MutableRefObject<'abriendo' | 'cerrando'>
  notasSonandoRef: React.MutableRefObject<number>
  ultimaNotaMsRef: React.MutableRefObject<number>
  // Acumulador del fuelle (objetivo).
  aAccumRef: React.MutableRefObject<number>
  accMats: React.MutableRefObject<Array<{ part: string; mat: any }>>
}

export function useRigRefs(): RigRefs {
  return {
    qRef: React.useRef(0),
    closeAction: React.useRef<THREE.AnimationAction | null>(null),
    cuerpoAction: React.useRef<THREE.AnimationAction | null>(null),
    baileAccion: React.useRef<THREE.AnimationAction | null>(null),
    accionesBaile: React.useRef<Record<string, THREE.AnimationAction>>({}),
    morphCerrar: React.useRef<Array<{ mesh: THREE.Mesh; idx: number; idxAbrir: number }>>([]),
    closeDur: React.useRef(1),
    restW: React.useRef(0),
    handFactor: React.useRef(1),
    brazoIzq: React.useRef<{ bones: THREE.Object3D[]; qAgarre: THREE.Quaternion[]; qClosed: THREE.Quaternion[]; posAgarre: THREE.Vector3[]; posClosed: THREE.Vector3[] }>({ bones: [], qAgarre: [], qClosed: [], posAgarre: [], posClosed: [] }),
    cajaGrip: React.useRef<{ caja: THREE.Mesh; handLocalBind: THREE.Vector3; dCerrar: THREE.Vector3; dAbrir: THREE.Vector3; restW: number; handQ: THREE.Quaternion } | null>(null),
    brazoDer: React.useRef<{ foreArm: THREE.Object3D | null; hand: THREE.Object3D | null; gripFore: THREE.Quaternion; gripHand: THREE.Quaternion }>({ foreArm: null, hand: null, gripFore: new THREE.Quaternion(), gripHand: new THREE.Quaternion() }),
    curForeDelta: React.useRef(new THREE.Quaternion()),
    curHandDelta: React.useRef(new THREE.Quaternion()),
    drivenDer: React.useRef<Array<{ bone: THREE.Object3D; suffix: string; gripQ: THREE.Quaternion; curQ: THREE.Quaternion }>>([]),
    melodyPoseRef: React.useRef<string | null>(null),
    melodyBlendRef: React.useRef<[string, number][] | null>(null),
    melodyButtonRef: React.useRef<string | null>(null),
    melodyPressRef: React.useRef(0),
    botonHome: React.useRef<Record<string, { pose: string; finger: string }>>({}),
    ringSprites: React.useRef<Record<string, THREE.Sprite>>({}),
    botonGlow: React.useRef<Record<string, number>>({}),
    regionTargetRef: React.useRef<'alta' | 'media' | 'baja'>('media'),
    melodiaSonandoRef: React.useRef(0),
    ultimaMelodiaMsRef: React.useRef(0),
    botonRegion: React.useRef<Record<string, 'alta' | 'media' | 'baja'>>({}),
    botonCoordRef: React.useRef<Record<string, [number, number]>>({}),
    fingerData: React.useRef<Record<string, { joints: THREE.Object3D[]; rests: THREE.Quaternion[]; tip: THREE.Object3D | null; liftSign: number }>>({}),
    fingerPress: React.useRef<Record<string, number>>({}),
    calibrandoRef: React.useRef(false),
    ajustesDedo: React.useRef<Record<string, THREE.Vector3>>({}),
    botones: React.useRef<Record<string, { mesh: THREE.Mesh; orig: THREE.Vector3; sink: THREE.Vector3; mat: any; emisivoBase: THREE.Color; localCenter: THREE.Vector3; surfaceLocal: THREE.Vector3; salida: THREE.Vector3; radio: number }>>({}),
    notaAMesh: React.useRef<Record<string, string>>({}),
    notasActivas: React.useRef<Set<string>>(new Set()),
    fuelleNotaRef: React.useRef<'abriendo' | 'cerrando'>('cerrando'),
    notasSonandoRef: React.useRef(0),
    ultimaNotaMsRef: React.useRef(0),
    aAccumRef: React.useRef(0),
    accMats: React.useRef<Array<{ part: string; mat: any }>>([]),
  }
}
