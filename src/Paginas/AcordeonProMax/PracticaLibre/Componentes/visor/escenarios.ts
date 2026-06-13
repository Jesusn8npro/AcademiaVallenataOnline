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
]

export const ESCENARIO_DEFAULT = 'estudio'
