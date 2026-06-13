import * as THREE from 'three'
import posesVisorData from '../../posesVisor.json'

// Mapas de datos del visor del personaje: botón↔nota↔dedo↔pose, posturas y deltas del brazo de bajos.
// Extraídos de VisorPersonaje3D (datos puros, sin estado).

// ===== Posturas por REGIÓN (banda de altura del teclado de melodía) =====
// En vez de calcular la posición del botón y apuntar el dedo (deformaba la mano al alcanzar botones
// lejanos), el BRAZO DERECHO adopta una de 3 posturas SEGURAS según la banda del botón que suena
// (Alta/Media/Baja). Cada postura es un DELTA de rotación (relativo al agarre) para el codo
// (RightForeArm) y la muñeca (RightHand) — igual patrón que el brazo de bajos (DELTA_ABIERTO/CERRADO).
export const POSTURAS_REGIONES: Record<'alta' | 'media' | 'baja', { foreArm: THREE.Quaternion; hand: THREE.Quaternion }> = {
  alta:  { foreArm: new THREE.Quaternion(-0.0282, 0, -0.0585, 0.9979), hand: new THREE.Quaternion(0, 0, 0, 1) },
  media: { foreArm: new THREE.Quaternion( 0.0087, 0,  0.0180, 0.9998), hand: new THREE.Quaternion(0, 0, 0, 1) },
  baja:  { foreArm: new THREE.Quaternion( 0.0434, 0,  0.0899, 0.9950), hand: new THREE.Quaternion(0, 0, 0, 1) },
}

// ===== Sistema de POSES reales (capturadas en Blender, posesVisor.json) =====
// Sufijos de hueso que maneja la pose (brazo derecho + sus dedos). El GLB usa prefijo 'mixamorig'.
export const RIGHT_SUF = ['RightShoulder', 'RightArm', 'RightForeArm', 'RightHand',
  'RightHandThumb1', 'RightHandThumb2', 'RightHandThumb3', 'RightHandIndex1', 'RightHandIndex2', 'RightHandIndex3',
  'RightHandMiddle1', 'RightHandMiddle2', 'RightHandMiddle3', 'RightHandRing1', 'RightHandRing2', 'RightHandRing3',
  'RightHandPinky1', 'RightHandPinky2', 'RightHandPinky3']

// Botón de melodía → nombre de la pose de su región. (Acordes se manejarán aparte.)
export function botonAPose(boton: string): string | null {
  const m = boton.match(/^Boton_D_(\d+)$/)
  if (!m) return null
  const n = +m[1]
  if (n <= 10) return n <= 5 ? 'hilera afuera superior' : 'hilera afuera inferior'   // fila 1 = afuera
  if (n <= 21) return n <= 15 ? 'hilera medio superior' : 'hilera medio inferior'    // fila 2 = medio
  return n <= 26 ? 'hilera adentro superior' : 'hilera adentro inferior'             // fila 3 = adentro
}
export const POSES_VISOR: Record<string, Record<string, number[]>> = (posesVisorData as any).poses || {}

// ===== Override manual del DEDO por botón (preparado para el PANEL ADMIN futuro) =====
// Nota/Botón ID → dedo que lo pisa. VACÍO por ahora → se usa BOTON_DEDO (proximidad precalculada).
export const MAPA_DEDO_ADMIN: Record<string, string> = {}
export function dedoDeBoton(boton: string): string | undefined {
  return MAPA_DEDO_ADMIN[boton] || BOTON_DEDO[boton]
}

// Pose del brazo izquierdo (bajos) en los frames "abierto" (f1) y "cerrado" (f58) de la acción
// 'Abrir y Cerrar Fuelle' de Blender, RELATIVAS al agarre (f34) (x,y,z,w). HARD-COPY de los valores
// reales del artista. Orden: Shoulder, Arm, ForeArm, Hand.
export const DELTA_ABIERTO = [
  new THREE.Quaternion(-0.03789, -0.02134, -0.00031, 0.99906),
  new THREE.Quaternion(-0.0557, -0.07549, -0.02375, 0.99531),
  new THREE.Quaternion(-0.11642, -0.0027, -0.10856, 0.98725),
  new THREE.Quaternion(0.2122, -0.08929, 0.03413, 0.97254),
]
export const DELTA_CERRADO = [
  new THREE.Quaternion(0.03819, 0.00951, 0.029, 0.99881),
  new THREE.Quaternion(0.03174, 0.04629, 0.01984, 0.99822),
  new THREE.Quaternion(0.05862, 0.00022, 0.02551, 0.99795),
  new THREE.Quaternion(-0.13338, 0.07675, -0.01336, 0.988),
]

// Cada botón → dedo que lo presiona (calculado en Blender por cercanía de la punta).
export const BOTON_DEDO: Record<string, string> = {
  Boton_D_01: 'R_Index', Boton_D_02: 'R_Index', Boton_D_03: 'R_Index', Boton_D_04: 'R_Ring',
  Boton_D_05: 'R_Ring', Boton_D_06: 'R_Pinky', Boton_D_07: 'R_Pinky', Boton_D_08: 'R_Pinky',
  Boton_D_09: 'R_Pinky', Boton_D_10: 'R_Pinky', Boton_D_11: 'R_Index', Boton_D_12: 'R_Index',
  Boton_D_13: 'R_Index', Boton_D_14: 'R_Index', Boton_D_15: 'R_Ring', Boton_D_16: 'R_Ring',
  Boton_D_17: 'R_Pinky', Boton_D_18: 'R_Pinky', Boton_D_19: 'R_Pinky', Boton_D_20: 'R_Pinky',
  Boton_D_21: 'R_Pinky', Boton_D_22: 'R_Index', Boton_D_23: 'R_Index', Boton_D_24: 'R_Index',
  Boton_D_25: 'R_Mid', Boton_D_26: 'R_Ring', Boton_D_27: 'R_Ring', Boton_D_28: 'R_Pinky',
  Boton_D_29: 'R_Pinky', Boton_D_30: 'R_Pinky', Boton_D_31: 'R_Pinky',
  Boton_I_01: 'L_Index', Boton_I_02: 'L_Index', Boton_I_03: 'L_Index', Boton_I_04: 'L_Mid',
  Boton_I_05: 'L_Mid', Boton_I_06: 'L_Ring', Boton_I_07: 'L_Index', Boton_I_08: 'L_Index',
  Boton_I_09: 'L_Mid', Boton_I_10: 'L_Mid', Boton_I_11: 'L_Ring', Boton_I_12: 'L_Ring',
}

// Mapeo nota→botón calculado en Blender por PCA (filas reales del teclado, no eje X).
export const NOTA_BOTON: Record<string, string> = {
  '1-1': 'Boton_D_01', '1-2': 'Boton_D_02', '1-3': 'Boton_D_03', '1-4': 'Boton_D_04', '1-5': 'Boton_D_05',
  '1-6': 'Boton_D_06', '1-7': 'Boton_D_07', '1-8': 'Boton_D_08', '1-9': 'Boton_D_09', '1-10': 'Boton_D_10',
  '2-1': 'Boton_D_11', '2-2': 'Boton_D_12', '2-3': 'Boton_D_13', '2-4': 'Boton_D_14', '2-5': 'Boton_D_15',
  '2-6': 'Boton_D_16', '2-7': 'Boton_D_17', '2-8': 'Boton_D_18', '2-9': 'Boton_D_19', '2-10': 'Boton_D_20',
  '2-11': 'Boton_D_21', '3-1': 'Boton_D_22', '3-2': 'Boton_D_23', '3-3': 'Boton_D_24', '3-4': 'Boton_D_25',
  '3-5': 'Boton_D_26', '3-6': 'Boton_D_27', '3-7': 'Boton_D_28', '3-8': 'Boton_D_29', '3-9': 'Boton_D_30',
  '3-10': 'Boton_D_31',
  'bajo-1-1': 'Boton_I_01', 'bajo-1-2': 'Boton_I_02', 'bajo-1-3': 'Boton_I_03', 'bajo-1-4': 'Boton_I_04',
  'bajo-1-5': 'Boton_I_05', 'bajo-1-6': 'Boton_I_06', 'bajo-2-1': 'Boton_I_07', 'bajo-2-2': 'Boton_I_08',
  'bajo-2-3': 'Boton_I_09', 'bajo-2-4': 'Boton_I_10', 'bajo-2-5': 'Boton_I_11', 'bajo-2-6': 'Boton_I_12',
}

// Convierte el id lógico que emite el acordeón (ej "1-5-halar", "1-3-empujar-bajo")
// en la clave espacial del botón. (Misma lógica que VisorAcordeon3D.)
export function keyDeId(idBoton: string): string {
  let s = idBoton
  let bajo = false
  if (s.endsWith('-bajo')) { bajo = true; s = s.slice(0, -5) }
  s = s.replace(/-halar$/, '').replace(/-empujar$/, '')
  return bajo ? `bajo-${s}` : s
}

// Partes del acordeón fino que aceptan pieles (axe/correas se quedan con su material original).
export const PARTES_PIEL = new Set(['cuerpo', 'botones', 'fuelle', 'pack', 'parte botones'])
