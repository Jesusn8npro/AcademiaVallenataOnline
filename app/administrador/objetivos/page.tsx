import type { Metadata } from 'next'
import PanelDeObjetivos from '@/Paginas/administrador/Objetivos/PanelDeObjetivos'

export const metadata: Metadata = {
  title: 'Objetivos | Administración | Academia Vallenata Online',
}

export default function AdminObjetivosRoute() {
  return <PanelDeObjetivos />
}
