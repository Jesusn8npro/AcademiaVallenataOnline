'use client'

// Armazón global de la app: menús, footer, chat, WhatsApp, cursor.
// Reemplaza lo que hacía <AppContent> dentro del antiguo src/App.tsx.
// En vez de <Routes> renderiza {children} (App Router de Next).

import { useEffect, useLayoutEffect, useState, lazy, Suspense } from 'react'
import dynamic from 'next/dynamic'
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
const BotonWhatsapp = dynamic(() => import('@/componentes/BotonWhatsapp/BotonWhatsapp'), { ssr: false })
const ChatEnVivo = dynamic(() => import('@/componentes/chat/ChatEnVivo'), { ssr: false })
const Footer = lazy(() => import('@/componentes/Footer/Footer'))
const CursorPersonalizado = lazy(
  () => import('@/componentes/ui/CursorPersonalizado/CursorPersonalizado'),
)

export default function ArmazonApp({ children }: { children: React.ReactNode }) {
  const { estaAutenticado, usuario, inicializado } = useUsuario()
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
  // Landing pages de tutoriales y cursos (no clases)
  const esTutorialLanding = /^\/tutoriales\/[^/]+$/.test(pathname)
  const esCursoLanding = /^\/cursos\/[^/]+$/.test(pathname)
  // En landing pages se muestra el menú pero NO el sidebar (evita padding-left: 280px en VistaPremium)
  const esPaginaLanding = esTutorialLanding || esCursoLanding

  const esInmersivo =
    esModoLectura ||
    esLandingVenta ||
    esSimuladorApp ||
    esAcordeonProMax ||
    esRecuperarContrasena

  // Evita hydration mismatch (SSR no conoce auth). useLayoutEffect dispara
  // ANTES del primer paint del navegador → el usuario nunca ve el menú
  // equivocado, a diferencia de useEffect que dispara DESPUÉS del paint.
  const [clienteMontado, setClienteMontado] = useState(false)
  useLayoutEffect(() => { setClienteMontado(true) }, [])

  // Remueve el CSS que ocultaba el menú público (inyectado por authHideScript en layout.tsx)
  // una vez que React conoce el estado de auth — antes del primer paint del navegador.
  useLayoutEffect(() => {
    if (inicializado) {
      document.getElementById('__auth-hide-pub')?.remove()
    }
  }, [inicializado])

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
    if (estaAutenticado && !esInmersivo && !esPaginaLanding) {
      document.body.classList.add('con-sidebar')
    } else {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }
    return () => {
      document.body.classList.remove('con-sidebar')
      document.body.classList.remove('con-sidebar-colapsado')
    }
  }, [estaAutenticado, esInmersivo, esPaginaLanding])

  return (
    <>
      {mouseDetectado && !pathname.startsWith('/simulador') && (
        <Suspense fallback={null}>
          <CursorPersonalizado />
        </Suspense>
      )}

      {!esInmersivo && !(clienteMontado && inicializado && estaAutenticado) && <MenuPublico />}
      {!esInmersivo && clienteMontado && inicializado && estaAutenticado && (
        <MenuSuperiorAutenticado onCerrarSesion={cerrarSesion} />
      )}

      {clienteMontado && estaAutenticado && !esInmersivo && (
        <Suspense fallback={null}>
          <EmailCompletarWrapper />
        </Suspense>
      )}

      {clienteMontado && estaAutenticado && !esInmersivo && !esPaginaLanding && <SidebarAdmin />}
      {clienteMontado && estaAutenticado && !esInmersivo && !esPaginaLanding && <MenuInferiorResponsivo />}

      {children}

      {!esInmersivo && !pathname.includes('/mensajes') && (
        <Suspense fallback={null}>
          {(!clienteMontado || !estaAutenticado) && <ChatEnVivo />}
          {(!clienteMontado || !estaAutenticado) && <BotonWhatsapp />}
        </Suspense>
      )}

      {(!clienteMontado || !estaAutenticado) && !esInmersivo && (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      )}
    </>
  )
}
