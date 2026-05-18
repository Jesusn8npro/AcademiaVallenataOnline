// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { ConfiguracionProMaxClient } from './client'

export const metadata: Metadata = {
  title: 'Configuración PRO MAX | Academia Vallenata Online',
}

export default function ConfiguracionProMaxRoute() {
  return <ConfiguracionProMaxClient />
}
