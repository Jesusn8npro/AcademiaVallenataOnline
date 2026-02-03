import React from 'react'
import { useUsuario } from '../contextos/UsuarioContext'

interface Props {
  titulo?: string
  mensajePrincipal?: string
  children: React.ReactNode
}

export default function ProteccionAutenticacion({ titulo = '🔒 PERFIL RESTRINGIDO', mensajePrincipal = 'Tu perfil personal requiere que inicies sesión', children }: Props) {
  const { usuario, inicializado } = useUsuario()

  if (!inicializado) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        <p style={{ color: '#6b7280' }}>Verificando sesión...</p>
      </div>
    )
  }

  if (!usuario) {
    return (
      <div style={{ maxWidth: 700, margin: '2rem auto', background: '#fff', borderRadius: 16, padding: '2rem', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>{titulo}</h2>
        <p>{mensajePrincipal}</p>
        <a href="/" style={{ display: 'inline-block', marginTop: '1rem', background: '#2563eb', color: '#fff', padding: '0.75rem 1rem', borderRadius: 8, textDecoration: 'none' }}>Ir al inicio</a>
      </div>
    )
  }

  return <>{children}</>
}
