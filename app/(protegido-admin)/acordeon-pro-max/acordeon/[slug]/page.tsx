// Ruta protegida por admin con slug dinámico (equivale a
// /acordeon-pro-max/acordeon/:slug de src/App.tsx). El componente es el
// mismo simulador; el slug lo consume el hook useAcordeonProMaxSimulador
// via useParams de @/compat/router (no se pasa por props).
import type { Metadata } from 'next'
import { AcordeonProMaxSimuladorClient } from '../client'

export const metadata: Metadata = {
  title: 'Simulador Acordeón PRO MAX | Academia Vallenata Online',
}

export default function AcordeonProMaxSimuladorSlugRoute() {
  return <AcordeonProMaxSimuladorClient />
}
