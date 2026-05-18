// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { SimuladorAppClient } from './client'

export const metadata: Metadata = {
  title: 'Simulador App | Academia Vallenata Online',
}

export default function SimuladorAppRoute() {
  return <SimuladorAppClient />
}
