// Tomas del "Director de Cámaras". El personaje está anclado en el ORIGEN (pies y=0, centrado en
// X/Z), así que estas coordenadas de MUNDO son estables entre personajes. Tunables en vivo.
// Énfasis pedido: enfocar sobre todo la MANO DERECHA (melodía), no los bajos.
export interface TomaCamara {
  id: string
  nombre: string
  pos: [number, number, number]    // posición de la cámara
  target: [number, number, number] // punto al que mira (= target de OrbitControls)
  fov?: number                     // opcional; por defecto FOV_DEFAULT
}

export const FOV_DEFAULT = 35

export const TOMAS: TomaCamara[] = [
  { id: 'general',  nombre: 'General',  pos: [0, 1.15, 4.2],  target: [0, 1.0, 0] },
  { id: 'musico',   nombre: 'Músico',   pos: [1.7, 1.5, 2.6], target: [0, 1.15, 0.2] },
  { id: 'mano_der', nombre: 'Mano der.', pos: [0.85, 1.4, 1.35], target: [0.2, 1.18, 0.32], fov: 26 }, // melodía de cerca
  { id: 'teclado',  nombre: 'Teclado',  pos: [0.35, 1.5, 1.5], target: [0.08, 1.16, 0.3], fov: 30 },
  { id: 'rostro',   nombre: 'Rostro',   pos: [0, 1.62, 1.5],   target: [0, 1.55, 0], fov: 30 },
  { id: 'perfil',   nombre: 'Perfil',   pos: [3.0, 1.3, 0.4],  target: [0, 1.15, 0.2], fov: 38 },
]

// Tomas que usa el modo AUTO (cortes durante el replay). Evita 'perfil'/'rostro' fijos largos; prioriza
// general + músico + la mano derecha (lo que el usuario quiere ver tocar).
export const TOMAS_AUTO = ['general', 'musico', 'mano_der', 'teclado']

export const TOMA_DEFAULT = 'general'
