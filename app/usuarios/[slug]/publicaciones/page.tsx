// /usuarios/:slug/publicaciones -> PublicacionesUsuarioPage. Datos vía
// OutletContext del PerfilPublicoLayout (layout.tsx del grupo).
import PublicacionesUsuarioPage from '@/Paginas/Usuarios/PublicacionesUsuarioPage'

export default function UsuarioPublicacionesRoute() {
  return <PublicacionesUsuarioPage />
}
