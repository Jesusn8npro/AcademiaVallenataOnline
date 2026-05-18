'use client';

// ─────────────────────────────────────────────────────────────────────────
// Layout del grupo de rutas PROTEGIDAS POR ADMIN (Acordeón PRO MAX, páginas
// 3D y Simulador App). Reusa el guard existente `src/SeguridadApp/
// ProteccionAdmin` (client) TAL CUAL, envolviendo {children}. NO se
// reimplementa auth (ver MIGRACION_NEXT.md sección 6). Este layout es Client
// Component porque el guard usa estado/efectos y hooks de navegación.
// Equivale a <Route element={<ProteccionAdmin/>}> de src/App.tsx.
// ─────────────────────────────────────────────────────────────────────────
import ProteccionAdmin from '@/SeguridadApp/ProteccionAdmin'

export default function LayoutProtegidoAdmin({ children }: { children: React.ReactNode }) {
  return <ProteccionAdmin>{children}</ProteccionAdmin>
}
