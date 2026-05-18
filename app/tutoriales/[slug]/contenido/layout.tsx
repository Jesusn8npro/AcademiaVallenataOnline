import GuardTutorialProtegido from '@/Paginas/Tutoriales/GuardTutorialProtegido'

// Ruta protegida (requiere sesión). Reusa src/SeguridadApp/ProteccionRuta
// vía el wrapper client GuardTutorialProtegido, envolviendo {children}.
export default function ContenidoTutorialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <GuardTutorialProtegido>{children}</GuardTutorialProtegido>
}
