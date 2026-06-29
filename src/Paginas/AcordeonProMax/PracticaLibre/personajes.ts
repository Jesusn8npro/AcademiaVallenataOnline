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
  bloqueado?: boolean // miniatura visible pero no seleccionable (aún sin re-exportar)
}

// GLB del acordeón compartido para la pestaña Personaje. Es EL MISMO acordeón contra el que se
// posaron las manos en Blender (no el "fino" de la pestaña 3D, que es más largo y no calza), así
// la mano de bajos queda EXACTA como en el .blend, sin IK ni deformación. Lo cargan los 6.
// v2 (horneado de PACK-BAILES "Abrir y Cerrar Fuelle"): geometría base = estado de AGARRE (f34),
// morph 'Cerrar' = cerrado total (f58), morph 'Abrir' = abierto total (f1, reservado).
// v3 (moreno .007): geometría base = AGARRE; morph 'Cerrar' = cerrado (horneado del rig Spline IK).
// El AnclaAcordeon de personaje-pelao.glb se horneó de parrilla.007 → este v3 calza exacto. v2 queda
// de respaldo en /modelos3d/. Editar este acordeón → re-exportar → reemplaza este 1 GLB → todos al día.
// v12 (27/06): horneado desde el PELAO (Empty.002), NO la Muchacha. Las instancias del acordeón
// difieren ~3 unidades en los botones de bajos respecto a la parrilla, así que un acordeón
// compartido solo calza con la instancia de la que se horneó. Como las manos del Pelao se posaron
// contra SU acordeón, v12 sale del Pelao → ambas manos (bajos + melódica) calzan, como el test page.
// Morphs Cerrar/Abrir = recorrido real asimétrico de los 3 puntos (scripts/fuelle_puntos.json).
// ⚠️ Los otros 5 personajes se posaron contra SUS instancias → con v12 pueden quedar corridos;
// pendiente alinearlos todos a UNA instancia canónica ("fuente única").
// v13 (29/06): MISMOS nombres de malla que el acordeón del TAB (acordeon-fino-nuevo-v2) → el diseño que
// el usuario pinta en /acordeon-pro-max/acordeon transfiere 100% IDÉNTICO (anillos sueltos incluidos).
// Geometría = v12 sin tocar (la mano de bajos calza, dist cajas 9.31). Solo se renombraron los nodos:
// nombre único → por nombre; anillos/duplicados → por orden dentro del material. Reproducir con
// scripts/renombrar-acordeon-personaje.mjs (lee fino + v12 → escribe v13). El rig sigue OK porque sus
// hooks quitan ACC_ y matchean nombres base (Caja_de_los_bajos/Boton_[DI]/fuelle/parrilla).
export const ACORDEON_GLB = '/modelos3d/acordeon-personaje-v13.glb?v=13'

// SOLO Pelao está activo por ahora. Los otros 5 se ven en el selector (miniatura) pero están
// bloqueados hasta re-exportarlos uno por uno desde el .blend nuevo. Su GLB fue borrado.
export const PERSONAJES: PersonajeDef[] = [
  { id: 'pelao', nombre: 'Pelao', archivo: '/modelos3d/personaje-pelao.glb?v=10', foto: '/personajes/pelao.webp' },
  { id: 'sudadera', nombre: 'Sudadera', archivo: '/modelos3d/personaje-sudadera.glb?v=7', foto: '/personajes/sudadera.webp' },
  { id: 'muchacha', nombre: 'Muchacha', archivo: '/modelos3d/personaje-muchacha.glb?v=7', foto: '/personajes/muchacha.webp' },
  { id: 'rojo', nombre: 'Pelao de rojo', archivo: '/modelos3d/personaje-rojo.glb?v=7', foto: '/personajes/rojo.webp' },
  { id: 'vacana', nombre: 'Hembra Vacana', archivo: '/modelos3d/personaje-vacana.glb?v=7', foto: '/personajes/vacana.webp' },
  { id: 'gris', nombre: 'Gris ojos verdes', archivo: '/modelos3d/personaje-gris.glb?v=7', foto: '/personajes/gris.webp' },
]

// Resuelve el GLB a cargar para un id; si el personaje no existe o está bloqueado (GLB borrado),
// cae al primero activo (Pelao) para no pedir un archivo inexistente.
export const glbDePersonaje = (id: string): string => {
  const d = PERSONAJES.find((p) => p.id === id)
  return d && !d.bloqueado ? d.archivo : PERSONAJES[0].archivo
}
