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

// ===== MEZCLA POR CERCANÍA (dedo de melodía sobre el botón exacto) =====
// Cada pose ancla se posó a mano en Blender (cero deformación) y tiene un BOTÓN OBJETIVO derivado
// automáticamente (el Boton_D bajo la punta del dedo). Para CADA botón de melodía se precalcularon en
// Blender las 2 poses ancla más cercanas (en 3D) con su peso (inverso de la distancia, normalizado).
// El visor mezcla (slerp ponderado) esas poses → la mano + el dedo caen sobre el botón exacto,
// interpolando entre poses reales. Al agregar MÁS poses ancla en Blender, re-derivar este mapa mejora
// la precisión sin tocar el visor. (Generado por la derivación no destructiva — ver handoff.)
export const BOTON_POSES: Record<string, [string, number][]> = {
  Boton_D_01: [['adentro tonica abriendo', 0.5621], ['adentro quinta mayor abriendo', 0.4379]],
  Boton_D_02: [['adentro tonica abriendo', 0.6232], ['hilera medio superior', 0.3768]],
  Boton_D_03: [['adentro tonica abriendo', 0.9741], ['hilera medio superior', 0.0259]],
  Boton_D_04: [['hilera afuera superior', 0.9736], ['adentro quinta disonante cerrando', 0.0264]],
  Boton_D_05: [['hilera medio inferior', 0.5144], ['adentro quinta disonante cerrando', 0.4856]],
  Boton_D_06: [['hilera afuera inferior', 0.9752], ['hilera medio inferior', 0.0248]],
  Boton_D_07: [['hilera afuera inferior', 0.6333], ['hilera medio inferior', 0.3667]],
  Boton_D_08: [['hilera afuera inferior', 0.5626], ['hilera adentro inferior', 0.4374]],
  Boton_D_09: [['hilera afuera inferior', 0.533], ['hilera adentro inferior', 0.467]],
  Boton_D_10: [['hilera afuera inferior', 0.52], ['hilera adentro inferior', 0.48]],
  Boton_D_11: [['adentro tonica abriendo', 0.5013], ['adentro quinta mayor abriendo', 0.4987]],
  Boton_D_12: [['adentro tonica abriendo', 0.5007], ['adentro quinta mayor abriendo', 0.4993]],
  Boton_D_13: [['adentro tonica abriendo', 0.5018], ['adentro quinta mayor abriendo', 0.4982]],
  Boton_D_14: [['hilera medio superior', 0.9736], ['adentro quinta mayor abriendo', 0.0264]],
  Boton_D_15: [['adentro quinta disonante cerrando', 0.9736], ['hilera afuera superior', 0.0264]],
  Boton_D_16: [['hilera medio inferior', 0.9739], ['hilera adentro superior', 0.0261]],
  Boton_D_17: [['hilera afuera inferior', 0.5051], ['hilera adentro inferior', 0.4949]],
  Boton_D_18: [['hilera afuera inferior', 0.503], ['hilera adentro inferior', 0.497]],
  Boton_D_19: [['hilera afuera inferior', 0.5024], ['hilera adentro inferior', 0.4976]],
  Boton_D_20: [['hilera afuera inferior', 0.5017], ['hilera adentro inferior', 0.4983]],
  Boton_D_21: [['hilera afuera inferior', 0.5014], ['hilera adentro inferior', 0.4986]],
  Boton_D_22: [['adentro quinta mayor abriendo', 0.5], ['medio quinta zuleta', 0.5]],
  Boton_D_23: [['adentro quinta mayor abriendo', 0.5], ['medio quinta zuleta', 0.5]],
  Boton_D_24: [['adentro quinta mayor abriendo', 0.5], ['medio quinta zuleta', 0.5]],
  Boton_D_25: [['adentro tonica decima cerrando', 0.974], ['adentro quinta disonante cerrando', 0.026]],
  Boton_D_26: [['hilera adentro superior', 0.9739], ['hilera medio inferior', 0.0261]],
  Boton_D_27: [['hilera adentro inferior', 0.9749], ['hilera medio inferior', 0.0251]],
  Boton_D_28: [['hilera adentro inferior', 0.627], ['hilera medio inferior', 0.373]],
  Boton_D_29: [['hilera adentro inferior', 0.5592], ['hilera afuera inferior', 0.4408]],
  Boton_D_30: [['hilera adentro inferior', 0.5299], ['hilera afuera inferior', 0.4701]],
  Boton_D_31: [['hilera adentro inferior', 0.5173], ['hilera afuera inferior', 0.4827]],
}

// Pose de la MANO para un botón = la de su HILERA (afuera/medio/adentro × superior/inferior), tal cual
// las posó el usuario en Blender. NO se usa la mezcla por cercanía (BOTON_POSES): cruzaba hileras (ponía
// poses de "adentro" en botones de "afuera/medio") y por eso la hilera de afuera no se veía bien. El aim
// del codo (usePersonajeFrame) lleva el dedo al botón EXACTO dentro de la hilera → la pose por hilera basta.
export function botonABlend(boton: string): [string, number][] | null {
  const p = botonAPose(boton)
  return p ? [[p, 1]] : null
}

// ===== Override manual del DEDO por botón (preparado para el PANEL ADMIN futuro) =====
// Nota/Botón ID → dedo que lo pisa. VACÍO por ahora → se usa BOTON_DEDO (proximidad precalculada).
export const MAPA_DEDO_ADMIN: Record<string, string> = {}
export function dedoDeBoton(boton: string): string | undefined {
  return MAPA_DEDO_ADMIN[boton] || BOTON_DEDO[boton]
}

// Pose del brazo izquierdo (bajos) RELATIVA al agarre, en (x,y,z,w). Orden: Shoulder, Arm, ForeArm, Hand.
// DELTA_CERRADO = medido del cuerpo NUEVO (personaje-pelao.glb, acción 'Cierre' agarre→cerrado del
// acordeón moreno .007; q0⁻¹·qN por hueso). DELTA_ABIERTO = identidad: el acordeón nuevo no tiene morph
// 'Abrir' (su reposo ya es abierto) → al "abrir" el brazo no se mueve (no se despega).
export const DELTA_ABIERTO = [
  new THREE.Quaternion(0, 0, 0, 1),
  new THREE.Quaternion(0, 0, 0, 1),
  new THREE.Quaternion(0, 0, 0, 1),
  new THREE.Quaternion(0, 0, 0, 1),
]
// La caja de bajos al cerrar TRASLADA (no rota, por el tope recto de Blender) → la mano debe MANTENER
// su orientación de agarre y solo seguir la posición de los botones (CCD). DELTA_CERRADO = identidad
// reproduce el CHILD_OF de Blender (dedos siempre en los mismos botones, abierto o cerrado), sin el
// giro de muñeca del DELTA viejo (medido del overshoot del cuerpo) que sacaba los dedos de los botones.
export const DELTA_CERRADO = [
  new THREE.Quaternion(0, 0, 0, 1),
  new THREE.Quaternion(0, 0, 0, 1),
  new THREE.Quaternion(0, 0, 0, 1),
  new THREE.Quaternion(0, 0, 0, 1),
]

// Dedo lógico → prefijo del hueso (mixamorig). Para flexionar el dedo asignado sobre el botón.
export const FINGER_SUF: Record<string, string> = {
  R_Index: 'RightHandIndex', R_Mid: 'RightHandMiddle', R_Ring: 'RightHandRing',
  R_Pinky: 'RightHandPinky', R_Thumb: 'RightHandThumb',
}

// Ajuste FINO por botón (calibrado en vivo con F2 + flechas) para que la punta del dedo caiga EXACTO
// sobre cada botón. Es un offset en el marco LOCAL de la malla del botón [x,y,z]. Vacío = el IK solo.
// Se edita con la herramienta de calibración (useCalibracionDedo) y se persiste en localStorage; para
// hornearlo al código, pulsa F4 (vuelca este objeto a la consola) y pega el resultado aquí.
export const BOTON_AJUSTE: Record<string, [number, number, number]> = {}

// Cada botón → dedo que lo presiona (calculado en Blender por cercanía de la punta).
export const BOTON_DEDO: Record<string, string> = {
  Boton_D_01: 'R_Index', Boton_D_02: 'R_Index', Boton_D_03: 'R_Mid', Boton_D_04: 'R_Ring',
  Boton_D_05: 'R_Pinky', Boton_D_06: 'R_Pinky', Boton_D_07: 'R_Pinky', Boton_D_08: 'R_Pinky',
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
