// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { AcordeonProMaxPruebaClient } from './client'

export const metadata: Metadata = {
  title: 'Prueba PRO MAX | Academia Vallenata Online',
}

export default function AcordeonProMaxPruebaRoute() {
  return <AcordeonProMaxPruebaClient />
}
