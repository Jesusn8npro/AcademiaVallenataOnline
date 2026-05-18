// ─────────────────────────────────────────────────────────────────────────
// Sub-layout del grupo de PERFIL (rutas que en react-router iban bajo
// <PerfilLayout/>). El guard de auth ya lo aplica el layout del grupo
// `(protegido)`. Aquí solo se reusa PerfilLayout: donde tenía <Outlet/>
// recibe {children} (ver MIGRACION_NEXT.md secciones 5 y 6).
// `(perfil)` es un route group: NO añade segmento a la URL.
// ─────────────────────────────────────────────────────────────────────────
import PerfilLayout from '@/Paginas/Perfil/PerfilLayout'

export default function LayoutPerfil({ children }: { children: React.ReactNode }) {
  return <PerfilLayout>{children}</PerfilLayout>
}
