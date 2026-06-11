// Catálogo de personajes 3D del visor (pestaña Personaje).
//
// Arquitectura "acordeón compartido": cada personaje es un GLB liviano (~0.5MB) SIN acordeón
// (huesos renombrados al prefijo común mixamorig:, acción 'Cierre' con el brazo izquierdo
// horneado siguiendo la tapa de bajos, y un nodo vacío 'AnclaAcordeon' = marco de la parrilla).
// El visor carga UNA sola vez el acordeón (ACORDEON_GLB, el mismo de la pestaña 3D) y lo
// acopla al ancla de cada personaje — así 6 personajes no pesan 6 acordeones.
//
// CÓMO AGREGAR UNO: en Blender (Personajes Modelados 6.blend) posarlo con el clonador,
// exportarlo con el pipeline de scripts/comprimir-personaje-mixamo.mjs y agregar una línea acá
// + su miniatura en /public/personajes/. Ver GUIA-AGREGAR-PERSONAJE.md.

export interface PersonajeDef {
  id: string
  nombre: string
  archivo: string // ruta pública del GLB (sin acordeón)
  foto: string // miniatura para el selector
}

// GLB del acordeón compartido para la pestaña Personaje. Es EL MISMO acordeón contra el que se
// posaron las manos en Blender (no el "fino" de la pestaña 3D, que es más largo y no calza), así
// la mano de bajos queda EXACTA como en el .blend, sin IK ni deformación. Lo cargan los 6.
// v2 (horneado de PACK-BAILES "Abrir y Cerrar Fuelle"): geometría base = estado de AGARRE (f34),
// morph 'Cerrar' = cerrado total (f58), morph 'Abrir' = abierto total (f1, reservado).
export const ACORDEON_GLB = '/modelos3d/acordeon-personaje-v2.glb'

export const PERSONAJES: PersonajeDef[] = [
  { id: 'pelao', nombre: 'Pelao', archivo: '/modelos3d/personaje-pelao.glb', foto: '/personajes/pelao.webp' },
  { id: 'sudadera', nombre: 'Sudadera', archivo: '/modelos3d/personaje-sudadera.glb', foto: '/personajes/sudadera.webp' },
  { id: 'muchacha', nombre: 'Muchacha', archivo: '/modelos3d/personaje-muchacha.glb', foto: '/personajes/muchacha.webp' },
  { id: 'rojo', nombre: 'Pelao de rojo', archivo: '/modelos3d/personaje-rojo.glb', foto: '/personajes/rojo.webp' },
  { id: 'vacana', nombre: 'Hembra Vacana', archivo: '/modelos3d/personaje-vacana.glb', foto: '/personajes/vacana.webp' },
  { id: 'gris', nombre: 'Gris ojos verdes', archivo: '/modelos3d/personaje-gris.glb', foto: '/personajes/gris.webp' },
]
