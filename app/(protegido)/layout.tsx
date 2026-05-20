import type { ReactNode } from 'react'
import ProteccionRuta from '@/SeguridadApp/ProteccionRuta'

export default function LayoutProtegido({ children }: { children: ReactNode }) {
  return <ProteccionRuta>{children}</ProteccionRuta>
}
