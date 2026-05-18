// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { AcordeonProMaxSimuladorClient } from './client'

export const metadata: Metadata = {
  title: 'Simulador Acordeón PRO MAX | Academia Vallenata Online',
}

export default function AcordeonProMaxSimuladorRoute() {
  return <AcordeonProMaxSimuladorClient />
}
