import type { Metadata } from 'next'
import PanelContenido from '@/Paginas/administrador/PanelContenido'

export const metadata: Metadata = {
  title: 'Contenido | Administración | Academia Vallenata Online',
}

export default function AdminContenidoRoute() {
  return <PanelContenido />
}
