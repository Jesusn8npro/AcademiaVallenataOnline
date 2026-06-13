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

// Cuánto BAJA el dedo asignado (Y local) para PISAR su botón, ENCIMA de la pose.
export const PRESS_DIP = 0.18       // rad del click del dedo (pequeño: la pose ya lo tiene sobre el botón)
export const FINGER_PRESS_RATE = 18 // qué tan rápido baja/sube el dedo al pisar/soltar
export const _dipQ = new THREE.Quaternion()

// Temporales del fuelle/seguimiento de la caja (CCD + weld) que mantiene la mano sobre los botones.
export const _qOpen = new THREE.Quaternion()
export const _ikA = new THREE.Vector3(), _ikB = new THREE.Vector3(), _ikC = new THREE.Vector3()
export const _ikDC = new THREE.Vector3(), _ikDT = new THREE.Vector3()
export const _ikQ = new THREE.Quaternion(), _ikQb = new THREE.Quaternion(), _ikQp = new THREE.Quaternion()
export const _vLt = new THREE.Vector3(), _vLm = new THREE.Vector3()
