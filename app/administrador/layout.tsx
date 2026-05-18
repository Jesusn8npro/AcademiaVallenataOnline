'use client';

// ─────────────────────────────────────────────────────────────────────────
// Layout del back-office /administrador (todas las subrutas). Reusa el guard
// existente `src/SeguridadApp/ProteccionAdmin` (client) TAL CUAL, envolviendo
// {children}. NO se reimplementa auth (ver MIGRACION_NEXT.md sección 6).
// Este layout es Client Component porque el guard usa estado/efectos y hooks
// de navegación. Equivale a <Route element={<ProteccionAdmin/>}> de
// src/App.tsx para todas las rutas /administrador/*.
// ─────────────────────────────────────────────────────────────────────────
import ProteccionAdmin from '@/SeguridadApp/ProteccionAdmin'

export default function LayoutAdministrador({ children }: { children: React.ReactNode }) {
  return <ProteccionAdmin>{children}</ProteccionAdmin>
}
