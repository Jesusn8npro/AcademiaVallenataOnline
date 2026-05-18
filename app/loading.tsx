// Estado de carga entre rutas (Next lo muestra al instante al navegar).
// Evita la "pantalla blanca brusca": transición fluida con spinner de marca.
import Cargando from './_cargando'

export default function Loading() {
  return <Cargando />
}
