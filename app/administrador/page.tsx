// ─────────────────────────────────────────────────────────────────────────
// Ruta protegida por admin (el guard ProteccionAdmin vive en el layout de
// /administrador). Tras login → sin foco SEO; metadata mínima.
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import DashboardAdmin from '@/Paginas/administrador/Dashboard/DashboardAdmin'

export const metadata: Metadata = {
  title: 'Panel de Administración | Academia Vallenata Online',
}

export default function AdministradorRoute() {
  return <DashboardAdmin />
}
