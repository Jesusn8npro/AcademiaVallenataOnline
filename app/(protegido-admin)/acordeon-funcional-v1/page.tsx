// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { AcordeonFuncionalV1Client } from './client'

export const metadata: Metadata = {
  title: 'Acordeón Funcional V1 | Academia Vallenata Online',
}

export default function AcordeonFuncionalV1Route() {
  return <AcordeonFuncionalV1Client />
}
