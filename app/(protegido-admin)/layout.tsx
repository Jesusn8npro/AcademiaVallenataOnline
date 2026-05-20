import type { ReactNode } from 'react'
import ProteccionAdmin from '@/SeguridadApp/ProteccionAdmin'

export default function LayoutProtegidoAdmin({ children }: { children: ReactNode }) {
  return <ProteccionAdmin>{children}</ProteccionAdmin>
}
