// ─────────────────────────────────────────────────────────────────────────
// Ruta protegida (requiere sesión — el guard vive en el layout del grupo
// `(protegido)`). Panel del estudiante: NO usa PerfilLayout.
// Detrás de login → no necesita SEO; metadata mínima.
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import PanelEstudiante from '@/Paginas/PanelEstudiante/PanelEstudiante'

export const metadata: Metadata = {
  title: 'Panel Estudiante | Academia Vallenata Online',
}

export default function PanelEstudianteRoute() {
  return <PanelEstudiante />
}
