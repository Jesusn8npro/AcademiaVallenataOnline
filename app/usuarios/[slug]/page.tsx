// Índice de /usuarios/:slug -> PerfilPublicoPage. Los datos (usuarioPublico,
// stats) llegan vía el OutletContext que provee PerfilPublicoLayout (layout.tsx).
import PerfilPublicoPage from '@/Paginas/Usuarios/PerfilPublicoPage'

export default function UsuarioPerfilRoute() {
  return <PerfilPublicoPage />
}
