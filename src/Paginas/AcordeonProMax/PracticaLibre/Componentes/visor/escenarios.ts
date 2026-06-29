// Catálogo de escenarios de la pestaña Personaje. Por ahora son escenarios "de código" (primitivas
// three.js, CERO descarga) para tener el sistema completo andando. Cuando lleguen los .glb reales,
// se agrega aquí su entrada (con tipo:'glb' + ruta) y una rama en Escenario.tsx — sin tocar el
// encuadre ni el anclaje del personaje.
export interface EscenarioDef {
  id: string
  nombre: string
}

export const ESCENARIOS: EscenarioDef[] = [
  { id: 'estudio', nombre: 'Estudio' },
  { id: 'ninguno', nombre: 'Ninguno' },
  { id: 'tarima', nombre: 'Tarima' },
  { id: 'plaza', nombre: 'Plaza' },
  // Escenarios .glb reales (Sketchfab CC-BY → comprimir-escenario.mjs). Se posicionan solos en
  // tiempo de ejecución (centro XZ + piso a y=0) en Escenario.tsx.
  { id: 'concierto', nombre: 'Concierto' },
  { id: 'neon', nombre: 'Futurista' },
  { id: 'tarima-led', nombre: 'Tarima LED' },
  { id: 'playa', nombre: 'Playa' },
]

export const ESCENARIO_DEFAULT = 'estudio'

// Config por defecto de los escenarios .glb reales (posición/escala del escenario para que el personaje,
// anclado al origen, quede bien parado). El admin puede sobreescribir x/y/z/rotY/escala/autoPiso por
// escenario y guardarlos en Supabase (tabla escenario_personaje_pos) → ganan sobre estos defaults.
// offset: corre el escenario (XZ = dónde se para el personaje; Y = ajuste fino vertical).
// autoPiso: aterriza solo sobre la plataforma pisable bajo el personaje (false = solo offset manual).
export interface EscenarioGLBCfg {
  glb: string
  escala: number
  offset: [number, number, number]
  rotY: number
  autoPiso: boolean
}

export const ESCENARIOS_GLB: Record<string, EscenarioGLBCfg> = {
  concierto: { glb: '/modelos3d/escenarios/esc-concierto-v1.glb', escala: 0.08, offset: [0, 0, 0], rotY: 0, autoPiso: true },
  neon: { glb: '/modelos3d/escenarios/esc-neon-v1.glb', escala: 0.16, offset: [0.08, 0, -0.42], rotY: 0, autoPiso: true },
  'tarima-led': { glb: '/modelos3d/escenarios/esc-tarima2-v1.glb', escala: 0.007, offset: [0, -1.4, -0.8], rotY: 0, autoPiso: false },
  playa: { glb: '/modelos3d/escenarios/esc-playa-v1.glb', escala: 0.7, offset: [-1.05, 0, -3.92], rotY: 0, autoPiso: true },
}

// ¿este escenario es un .glb posicionable (admite el editor de posición)?
export function esEscenarioGLB(id: string): boolean {
  return id in ESCENARIOS_GLB
}
