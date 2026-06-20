// Catálogo de escenarios del MUNDO 3D (selector). Cada uno es un .glb optimizado (Draco + WebP) que
// se carga reemplazando el bosque de prueba, o el bosque procedural ('bosque', sin glb). Los .glb
// vienen de Sketchfab (CC-BY), bajados/optimizados en escenarios-mundo.blend → comprimir-escenario.mjs.
// Piso normalizado a y=0 (calza con el avatar anclado a y=0). 'limite' = radio de navegación.
export interface EscenarioMundoDef {
  id: string
  nombre: string
  glb?: string          // ruta del .glb; si falta → escena procedural (bosque)
  escala?: number       // factor de escala al cargar (1 = metros nativos)
  limite: number        // radio máximo de navegación del avatar (m)
  credito?: string      // atribución CC-BY (autor del modelo)
  spawn?: [number, number]  // punto de aparición [x, z] (si falta → spawn determinista en anillo)
  mirar?: number        // orientación inicial del cuerpo (rotation.y, rad); 0 mira a +Z, π mira a -Z
  colisiones?: boolean  // true → el avatar choca con la malla del escenario (paredes/muebles)
  puertas?: string[]    // nombres de los nodos de hojas de puerta que se abren al acercarse (en el .glb)
  radioPuerta?: number  // distancia (m) a la que se abre la puerta
  asientos?: AsientoDef[] // sofás/bancos donde el avatar se puede sentar (coords del mundo + orientación)
}

// Un punto donde sentarse: posición (x,z) del asiento y hacia dónde mira el avatar al sentarse (ry).
export interface AsientoDef { x: number; z: number; ry: number }

export const ESCENARIOS_MUNDO: EscenarioMundoDef[] = [
  { id: 'coffee', nombre: '☕ Cafetería', glb: '/modelos3d/mundo-coffeeshop-v2.glb', escala: 1, limite: 60, credito: 'shawky.sherif1 (CC-BY)', spawn: [30, 33], mirar: Math.PI, colisiones: true, puertas: ['Cube008', 'Cube009'], radioPuerta: 5,
    asientos: [ // sofás del lounge (coords del mundo, calculadas en Blender); ry mira hacia el centro del lounge
      { x: 27.3, z: 24.8, ry: 2.79 },
      { x: 23.5, z: 17.6, ry: 2.04 },
      { x: 30.0, z: 14.1, ry: 1.91 },
      { x: 36.1, z: 9.3, ry: -0.83 },
      { x: 40.2, z: 2.3, ry: -0.66 },
    ] },
  { id: 'concert', nombre: '🎤 Tarima', glb: '/modelos3d/mundo-concert-v1.glb', escala: 1, limite: 70, credito: 'agung.ihackstuff (CC-BY)', spawn: [0, 12], mirar: Math.PI, colisiones: true },
  { id: 'bosque', nombre: '🌳 Bosque', limite: 70 },
]

export const ESCENARIO_MUNDO_DEFAULT = 'coffee'

export function escenarioMundoPorId(id: string): EscenarioMundoDef {
  return ESCENARIOS_MUNDO.find((e) => e.id === id) ?? ESCENARIOS_MUNDO[0]
}

// Modos de cámara seleccionables (vive acá, archivo liviano, para que la página los importe sin
// arrastrar three.js de MundoPoC). tercera/lejana = orbital 3ª persona; primera = ojos del personaje;
// cenital = picado desde arriba. Cada uno fija distancia/ángulo base (el mouse y la rueda ajustan encima).
export interface ModoVista { id: string; nombre: string; dist: number; pitch: number; cenital: boolean; primera: boolean; frontal?: boolean }
export const VISTAS: ModoVista[] = [
  { id: 'tercera', nombre: '3ª persona', dist: 4.6, pitch: 0.32, cenital: false, primera: false },
  { id: 'lejana', nombre: 'Lejana', dist: 8.5, pitch: 0.45, cenital: false, primera: false },
  { id: 'frontal', nombre: 'Frontal', dist: 4.2, pitch: 0.26, cenital: false, primera: false, frontal: true },
  { id: 'primera', nombre: '1ª persona', dist: 0.5, pitch: 0.45, cenital: false, primera: true },
  { id: 'cenital', nombre: 'Cenital', dist: 11, pitch: 0.9, cenital: true, primera: false },
]
