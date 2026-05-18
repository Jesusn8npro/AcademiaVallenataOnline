// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { PaginaGrabadorV2Client } from './client'

export const metadata: Metadata = {
  title: 'Grabador PRO MAX | Academia Vallenata Online',
}

export default function PaginaGrabadorV2Route() {
  return <PaginaGrabadorV2Client />
}
