'use client'

// Armazón global de la app: menús, footer, chat, WhatsApp, cursor.
// Reemplaza lo que hacía <AppContent> dentro del antiguo src/App.tsx.
// En vez de <Routes> renderiza {children} (App Router de Next).

import { useEffect, useState, lazy, Suspense } from 'react'
import { useLocation } from '@/compat/router'
import MenuPublico from '@/componentes/Menu/MenuPublico'
import MenuSuperiorAutenticado from '@/componentes/Menu/MenuSuperiorAutenticado'
import MenuInferiorResponsivo from '@/componentes/Menu/MenuInferiorResponsivo'
import SidebarAdmin from '@/componentes/Menu/SidebarAdmin'
import { useUsuario } from '@/contextos/UsuarioContext'
import { supabase } from '@/servicios/clienteSupabase'
import { useSeguridadConsola } from '@/hooks/useSeguridadConsola'
import { useSesionTracker } from '@/hooks/useSesionTracker'

const EmailCompletarWrapper = lazy(() => import('@/componentes/Pagos/EmailCompletarWrapper'))
const BotonWhatsapp = lazy(() => import('@/componentes/BotonWhatsapp/BotonWhatsapp'))
const ChatEnVivo = lazy(() => import('@/componentes/chat/ChatEnVivo'))
const Footer = lazy(() => import('@/componentes/Footer/Footer'))
const CursorPersonalizado = lazy(
  () => import('@/componentes/ui/CursorPersonalizado/CursorPersonalizado'),
)

export default function ArmazonApp({ children }: { children: React.ReactNode }) {
  const { estaAutenticado, usuario } = useUsuario()
  const location = useLocation()
  const pathname = location.pathname

  const esClaseTutorial = pathname.includes('/tutoriales/') && pathname.includes('/clase/')
  const esClaseCurso =
    pathname.startsWith('/cursos/') && pathname.split('/').filter(Boolean).length >= 4
  const esModoLectura = esClaseTutorial || esClaseCurso
  const esLandingVenta = pathname === '/curso-acordeon-desde-cero'
  const esSimuladorApp = pathname.startsWith('/simulador-app')
  const esRecuperarContrasena = pathname === '/recuperar-contrasena'
  const esAcordeonProMax =
    pathname.startsWith('/acordeon-pro-max') ||
    pathname === '/acordeon-promax' ||
    pathname === '/acordeon-promax-menu'

  const esInmersivo =
    esModoLectura ||
    esLandingVenta ||
    esSimuladorApp ||
    esAcordeonProMax ||
    esRecuperarContrasena

  const [mouseDetectado, setMouseDetectado] = useState(false)
  useEffect(() => {
    if (mouseDetectado) return
    const handler = () => setMouseDetectado(true)
    window.addEventListener('mousemove', handler, { once: true, passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [mouseDetectado])

  useSeguridadConsola({ pausarVigilancia: esInmersivo })
  useSesionTracker(usuario?.id || null)

  const cerrarSesion = async () => {
    await supabase.auth.signOut()
    window.location.href = '/sesion-cerrada'
  }

  useEffect(() => {
    if (estaAutenticado && !esInmersivo) {
      document.body.classList.add('con-sidebar')
    } else {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }
    return () => {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }
  }, [estaAutenticado, esInmersivo])

  return (
    <>
      {mouseDetectado && !pathname.startsWith('/simulador') && (
        <Suspense fallback={null}>
          <CursorPersonalizado />
        </Suspense>
      )}

      {!esInmersivo &&
        (estaAutenticado ? (
          <MenuSuperiorAutenticado onCerrarSesion={cerrarSesion} />
        ) : (
          <MenuPublico />
        ))}

      {estaAutenticado && !esInmersivo && (
        <Suspense fallback={null}>
          <EmailCompletarWrapper />
        </Suspense>
      )}

      {estaAutenticado && !esInmersivo && <SidebarAdmin />}
      {estaAutenticado && !esInmersivo && <MenuInferiorResponsivo />}

      {children}

      {!esInmersivo && !pathname.includes('/mensajes') && (
        <Suspense fallback={null}>
          {!estaAutenticado && <ChatEnVivo />}
          {!estaAutenticado && <BotonWhatsapp />}
        </Suspense>
      )}

      {!estaAutenticado && !esInmersivo && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  )
}
