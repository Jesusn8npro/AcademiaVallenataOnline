'use client';

// ─────────────────────────────────────────────────────────────────────────
// Layout del grupo de rutas PROTEGIDAS (requieren sesión iniciada).
// Reusa el guard existente `src/SeguridadApp/ProteccionRuta` (client) tal
// cual, envolviendo {children}. NO se reimplementa auth (ver MIGRACION_NEXT.md
// secciones 5 y 6). Este layout es Client Component porque el guard usa
// estado/efectos y hooks de navegación.
// ─────────────────────────────────────────────────────────────────────────
import ProteccionRuta from '@/SeguridadApp/ProteccionRuta'

export default function LayoutProtegido({ children }: { children: React.ReactNode }) {
  return <ProteccionRuta>{children}</ProteccionRuta>
}
