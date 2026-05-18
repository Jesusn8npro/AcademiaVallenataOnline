// Ruta protegida por admin (ProteccionAdmin via layout del grupo).
import type { Metadata } from 'next'
import { ListaCancionesProMaxClient } from './client'

export const metadata: Metadata = {
  title: 'Lista de Canciones PRO MAX | Academia Vallenata Online',
}

export default function ListaCancionesProMaxRoute() {
  return <ListaCancionesProMaxClient />
}
