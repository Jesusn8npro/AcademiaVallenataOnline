// /usuarios/:slug/grabaciones -> GrabacionesUsuarioPage. Datos vía
// OutletContext del PerfilPublicoLayout (layout.tsx del grupo).
import GrabacionesUsuarioPage from '@/Paginas/Usuarios/GrabacionesUsuarioPage'

export default function UsuarioGrabacionesRoute() {
  return <GrabacionesUsuarioPage />
}
