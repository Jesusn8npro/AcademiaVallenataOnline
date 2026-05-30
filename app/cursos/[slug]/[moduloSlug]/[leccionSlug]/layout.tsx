import GuardCursoProtegido from '@/Paginas/Cursos/GuardCursoProtegido'

// Ruta protegida: requiere sesión + acceso al curso (inscripción o plan).
// La landing /cursos/[slug] sigue siendo pública (página de venta).
export default function LeccionCursoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <GuardCursoProtegido>{children}</GuardCursoProtegido>
}
