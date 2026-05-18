import type { Metadata } from 'next'
import PanelContenido from '@/Paginas/administrador/PanelContenido'

export const metadata: Metadata = {
  title: 'Panel de Contenido | Administración | Academia Vallenata Online',
}

export default function AdminPanelContenidoRoute() {
  return <PanelContenido />
}
