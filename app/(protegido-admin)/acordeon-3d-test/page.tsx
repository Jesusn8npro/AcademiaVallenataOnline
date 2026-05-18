// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { AcordeonDiapason3DClient } from './client'

export const metadata: Metadata = {
  title: 'Acordeón 3D Test | Academia Vallenata Online',
}

export default function AcordeonDiapason3DRoute() {
  return <AcordeonDiapason3DClient />
}
