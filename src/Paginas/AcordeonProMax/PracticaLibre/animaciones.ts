// Catálogo de bailes 3D del visor (pestaña Personaje).
//
// Los 9 bailes viven en UN solo GLB solo-esqueleto (~0.8MB) exportado de PACK-BAILES.blend
// (scripts/exportar-pack-bailes.py + scripts/comprimir-bailes.mjs). Cada clip trae SOLO
// rotaciones del cuerpo + rebote vertical de Hips — sin brazos (la pose de agarre del acordeón
// la pone la acción 'Cierre' de cada personaje) y sin desplazamiento horizontal.
//
// El visor los retargetea a cualquier personaje por nombre de hueso (rebasando rest poses) y
// los cruza con crossfade — bailar y cerrar el fuelle con Q funcionan A LA VEZ.
//
// Gating: premium=true exige membresía activa (perfiles.membresia_activa_id, igual que
// grabaciones). Cambiar el reparto gratis/premium es editar esta lista.

export const BAILES_GLB = '/modelos3d/bailes-pack-v1.glb'

// Crossfade entre animaciones (entrar/salir de un baile o cambiar de baile), en segundos.
export const CROSSFADE_BAILE = 0.5

// Velocidad de reproducción de los bailes (timeScale del AnimationAction). Los clips traen su
// velocidad real de Mixamo (30fps); bajar este valor los hace más lentos/naturales para el show.
// 1 = velocidad original; 0.5 = mitad de velocidad. Ajustable en vivo.
export const VELOCIDAD_BAILE = 0.5

export interface BaileDef {
  id: string
  nombre: string // etiqueta del botón
  clip: string // nombre EXACTO de la animación dentro de BAILES_GLB
  premium: boolean
}

// Paso de una secuencia de animaciones (playlist ordenada): qué clip y cuántos segundos dura antes
// de pasar al siguiente. La secuencia se reproduce en orden y en loop (ver SecuenciadorBailes).
export interface PasoSecuencia {
  id: string      // id único del paso (para reordenar/borrar en la UI)
  clip: string    // nombre del clip dentro de BAILES_GLB
  nombre: string  // etiqueta visible
  segundos: number // cuánto dura este paso antes de avanzar
}

export const BAILES: BaileDef[] = [
  { id: 'caminata', nombre: 'Caminata', clip: 'Caminata', premium: false },
  { id: 'tonto', nombre: 'Baile tonto', clip: 'Baile Tonto', premium: false },
  { id: 'viejo', nombre: 'Viejo con cigarro', clip: 'Viejo con cigarro', premium: false },
  { id: 'salsa', nombre: 'Salsa', clip: 'Salsa', premium: false },
  { id: 'afarizado', nombre: 'Afarizado', clip: 'Baile Afarizado', premium: false },
  { id: 'corriendo', nombre: 'Corriendo', clip: 'Corriendo', premium: false },
  { id: 'salto', nombre: 'Salto vacano', clip: 'Salto vacano', premium: false },
  { id: 'baile2', nombre: 'Baile 2', clip: 'Baile 2', premium: true },
  { id: 'hiphop', nombre: 'Hip Hop', clip: 'Hip Hop', premium: true },
  { id: 'breakdance', nombre: 'Breakdance', clip: 'Breakdance 1990', premium: true },
  { id: 'hokey', nombre: 'Hokey Pokey', clip: 'Hokey Pokey', premium: true },
  { id: 'twerk', nombre: 'Twerk', clip: 'Twerk', premium: true },
  { id: 'zombie', nombre: 'Estilo Zombie', clip: 'Estilo Zombie', premium: true },
]
