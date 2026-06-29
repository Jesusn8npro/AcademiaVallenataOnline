import * as THREE from 'three'

// Tunables y objetos THREE reutilizables del visor del personaje. Extraídos de VisorPersonaje3D
// para que la lógica (hooks) quede limpia. Los objetos `_xxx` son singletons de módulo que se
// reutilizan por frame (evita asignar memoria en el bucle de render).

// Fuelle PROGRESIVO (como un acordeón real): no salta por nota — ACUMULA mientras se toca.
// El estado del fuelle a∈[-1,+1] (-1 abierto, 0 agarre, +1 cerrado) se mueve en la dirección del
// toque (halar abre, empujar/Q cierra) a FUELLE_RATE por segundo, y se relaja suave al agarre en
// silencio. Sin objetivos snapeados por nota → sin temblor. Todo ajustable en vivo.
export const FUELLE_RATE = 1.0     // velocidad de apertura/cierre al tocar (unidades/seg)
export const FUELLE_RATE_Q = 2.2   // velocidad al mantener Q (cierre manual más decidido)
export const FUELLE_RELAJA = 0.7   // qué tan lento vuelve al agarre en los silencios (suave = natural)
export const FUELLE_SUAVE = 10     // suavizado del render del fuelle (mata micro-temblores)
// Ventana (ms) que se sigue considerando "tocando" tras la última nota: mantiene el fuelle SOSTENIDO
// durante los huecos cortos entre notas de una frase (sin esto, pulsa de vuelta al agarre).
export const FUELLE_HOLD_MS = 450
// Estiramiento del fuelle a apertura total. 1 = EXACTO el frame "abierto" de Blender → la mano queda
// congelada/pegada igual que en Blender. >1 extrapola el morph para abrir más, PERO el brazo se
// extrapola distinto que la caja y la mano se sube/corre. Lo dejamos en 1 para que NO se descuadre.
export const FUELLE_ESTIRA = 1.0

// Color de resaltado (glow) del botón pisado.
export const _glow = new THREE.Color(0.95, 0.78, 0.25)
// Flexión de los dedos POR HUESOS (rig mixamo). Ajustables tras verlo en vivo:
export const CURL_AXIS = new THREE.Vector3(1, 0, 0) // eje LOCAL de flexión de la falange (pisada)
export const CURL_ANGLE = 0.30                       // radianes por falange media/distal (pisada)
export const _curlQ = new THREE.Quaternion()
// Pisada por Y LOCAL del hueso base (el "click" final). Medido en vivo: rotar el hueso base en su Y
// local mueve la punta casi puro VERTICAL → reposo = dedo LEVANTADO (mano flotando), pisar = BAJAR.
// El SIGNO de Y difiere por dedo según su orientación → se calcula automático en el setup (liftSign).
// El brazo YA llevó la mano a la banda (postura de región); el dedo solo da el click pequeño.
export const FINGER_LIFT = 0.30   // rad que se LEVANTA el dedo en reposo (mano "flotando")
export const FINGER_PRESS = 0.12  // rad del CLICK (baja bajo el reposo al pisar) — pequeño, sin deformar
export const FINGER_DAMP = 15     // suavizado del click (sin latencia, sin movimiento seco)
export const _YLOCAL = new THREE.Vector3(0, 1, 0)
export const _pressQ = new THREE.Quaternion()
// Apuntado FINO del dedo de melodía al botón EXACTO, ENCIMA de la postura de región: el brazo ya
// hizo el alcance grande (la mano está sobre la banda), así que esta rotación es PEQUEÑA y se
// CLAMPA a AIM_MAX para que nunca tuerza la malla. Cada dedo cae sobre su botón sin deformar.
export const AIM_MAX = 0.6 // rad MÁXIMO del swing del dedo hacia el botón (tope natural: nunca hiperextiende/deforma)
export const JOINT_MAX = 0.45 // rad MÁX por hueso del dedo en el IK (reparte entre Finger1/2/3 → llega sin deformar)
export const IK_ITERS = 3     // iteraciones del IK del dedo (CCD)
export const _bonePos = new THREE.Vector3(), _tipPos = new THREE.Vector3(), _btnPos = new THREE.Vector3()
export const _dirCur = new THREE.Vector3(), _dirTar = new THREE.Vector3()
export const _qRot = new THREE.Quaternion(), _qBoneW = new THREE.Quaternion(), _qParentW = new THREE.Quaternion()
export const _qIdent = new THREE.Quaternion()
export const _moveDir = new THREE.Vector3(), _wantV = new THREE.Vector3() // alcance VERTICAL del dedo (solo Y local)

// Posturas por REGIÓN (banda de altura del teclado): velocidades/ventanas del slerp del brazo.
export const _qIdentDelta = new THREE.Quaternion() // postura neutra (agarre) cuando no suena melodía
export const REGION_RATE = 9          // velocidad del slerp del brazo entre posturas (suave pero decidido)
export const REGION_HOLD_MS = 300     // ventana tras la última nota de melodía donde se mantiene la postura
export const REGION_GATE = 0.06       // rad de cercanía a la postura para considerar "brazo en su sitio" (gatea el click)

// Sistema de POSES reales (capturadas en Blender, posesVisor.json).
export const POSE_RATE = 8          // velocidad del slerp de la mano hacia la pose (suave pero decidido)
export const POSE_HOLD_MS = 300     // ventana tras la última nota: mantiene la pose entre notas seguidas
export const _tmpQ = new THREE.Quaternion()

// Cuánto BAJA el dedo asignado para PISAR su botón, ENCIMA de la pose. La mezcla de poses ya deja la
// punta SOBRE el botón → esto es solo una flexión PEQUEÑA del hueso base (presión), sin aimar/estirar.
// rad del click del dedo. PEQUEÑO a propósito: el giro es en el hueso BASE, así que la yema describe un
// arco grande (medido en Blender: 0.18 rad ≈ 0.77 u de recorrido de la punta) → con poco ángulo ya se
// ve la presión SIN traspasar el botón. Subir con cuidado (≤0.14) si se quiere un click más marcado.
export const PRESS_DIP = 0.10
export const FINGER_PRESS_RATE = 18 // qué tan rápido baja/sube el dedo al pisar/soltar
// Eje LOCAL de flexión del hueso base del dedo (mixamorig RightHand{Index/Middle/Ring/Pinky}1). Medido
// en Blender: rotar +Z local BAJA la yema hacia el teclado (presión); +X la curva hacia la palma. El
// rig mixamo es consistente → el mismo eje sirve para los 4 dedos. (Ver handoff-dedos-pisada-botones.)
export const PRESS_AXIS = new THREE.Vector3(0, 0, 1)
export const _dipQ = new THREE.Quaternion()
// Pisada SOLO-dedo: IK de 2 falanges (Index1+Index2) para que la PUNTA del dedo asignado caiga EXACTO
// sobre el botón (no solo cerca). Cada paso es una rotación de arco mínimo (sin twist, sin garra),
// clampeada por hueso y suavizada por peso de pisada. La MANO NO se mueve. Ajustable en vivo: subir
// PRESS_JOINT_MAX si el dedo no llega; subir PRESS_IK_ITERS si no aterriza fino.
export const PRESS_IK_ITERS = 4      // iteraciones de CCD (converge la punta al botón)
export const PRESS_JOINT_MAX = 0.5   // rad MÁX por hueso y por iteración (evita sobre-flexión/garra)
// ALCANCE del antebrazo (codo): rota el codo para BAJAR la mano cerca de los botones ANTES de la presión
// del dedo → la mano queda pegada y el dedo no se estira (no se deforma). Ajustable: subir FORE_MAX si la
// mano no baja lo suficiente al botón; bajar si se pasa.
export const FORE_ITERS = 3          // iteraciones del alcance del codo
export const FORE_MAX = 0.6          // rad MÁX por iteración del codo
// El codo lleva la MUÑECA a un punto al FRENTE de los botones, a "un largo de mano" (yema↔muñeca) de
// distancia → la palma queda AFUERA del diapasón y solo los dedos entran (no traspasa). Factor sobre ese
// largo: 1 = muñeca a un largo de mano; subir si la mano aún traspasa; bajar si queda lejos del botón.
export const REACH_STANDOFF = 0.6
// Largo estimado de la yema MÁS ALLÁ de Index3 (en múltiplos de la falange media). El hueso Index3
// llega al nudillo distal, no a la punta de carne; este factor extiende el efector hasta la yema real
// para que el CCD aterrice la CARNE sobre el botón (no el nudillo). Bajar si la punta se pasa del botón.
export const TIP_EXT = 0.7

// Temporales del fuelle/seguimiento de la caja (CCD + weld) que mantiene la mano sobre los botones.
export const _qOpen = new THREE.Quaternion()
export const _ikA = new THREE.Vector3(), _ikB = new THREE.Vector3(), _ikC = new THREE.Vector3()
export const _ikDC = new THREE.Vector3(), _ikDT = new THREE.Vector3()
export const _ikQ = new THREE.Quaternion(), _ikQb = new THREE.Quaternion(), _ikQp = new THREE.Quaternion()
export const _vLt = new THREE.Vector3(), _vLm = new THREE.Vector3()
