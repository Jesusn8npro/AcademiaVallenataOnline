'use client';
import { Link } from '@/compat/router';
import * as React from 'react';
import { useUsuario } from '../contextos/UsuarioContext'

interface Props {
  titulo?: string
  mensajePrincipal?: string
  children: React.ReactNode
}

/**
 * OPTIMISTA — sin pantalla bloqueante "Verificando sesión...".
 *
 * Render rules (en orden):
 *   1. Si NO está inicializado todavía → renderiza children (optimista).
 *      Los datos están protegidos por RLS server-side, no hay riesgo de leak.
 *      Esto evita el flash feo de "Verificando sesión..." con footer
 *      desordenado debajo mientras Supabase resuelve la sesión.
 *   2. Si está inicializado Y hay usuario → renderiza children normal.
 *   3. Si está inicializado Y NO hay usuario → "acceso denegado" estilizado.
 *
 * Patrón documentado en supabase #553 y guías de auth optimista de Next.
 */
export default function ProteccionAutenticacion({ titulo = '🔒 PERFIL RESTRINGIDO', mensajePrincipal = 'Tu perfil personal requiere que inicies sesión', children }: Props) {
  const { usuario, inicializado } = useUsuario()

  // Renderizar contenido inmediatamente; si después se confirma que no hay
  // sesión, mostramos la pantalla de acceso denegado.
  if (!inicializado || usuario) {
    return <>{children}</>
  }

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
      <h2 style={{ marginTop: 0 }}>{titulo}</h2>
      <p>{mensajePrincipal}</p>
      <Link href="/" style={{ display: 'inline-block', marginTop: '1rem', background: '#2563eb', color: '#fff', padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none' }}>Ir al inicio</Link>
    </div>
  )
}
