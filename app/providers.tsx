'use client'

// Providers globales que antes daba src/App.tsx (ErrorBoundary +
// UsuarioProvider) y la inicialización de i18n que hacía src/main.tsx.
// El routing (BrowserRouter) ya NO va aquí: lo da el App Router de Next.
import { Suspense } from 'react'
import '@/idiomas/configuracionIdiomas'
import { ErrorBoundary } from '@/componentes/ErrorBoundary'
import { UsuarioProvider } from '@/contextos/UsuarioContext'
import ArmazonApp from '@/componentes/Layout/ArmazonApp'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <UsuarioProvider>
        {/* fallback={null}: el Suspense global envuelve TODA la app; un
            spinner aquí taparía toda la pantalla ante cualquier carga
            interna (auth, lazy). Cada componente maneja su propia carga. */}
        <Suspense fallback={null}>
          <ArmazonApp>{children}</ArmazonApp>
        </Suspense>
      </UsuarioProvider>
    </ErrorBoundary>
  )
}
