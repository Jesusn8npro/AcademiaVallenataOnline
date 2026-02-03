import React, { useEffect, useState } from 'react'
import { supabase } from '../../servicios/supabaseCliente'

interface Props {
  children: React.ReactNode
  titulo?: string
  mensajePrincipal?: string
}

export default function MensajesLayout({ children, titulo = '💬 MENSAJES PRIVADOS', mensajePrincipal = 'Tus mensajes personales requieren que inicies sesión' }: Props) {
  const [cargando, setCargando] = useState(true)
  const [autenticado, setAutenticado] = useState(false)

  useEffect(() => {
    let activo = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!activo) return
      setAutenticado(!!user)
      setCargando(false)
      if (!user) {
        window.location.href = '/auth/login'
      }
    })()
    return () => { activo = false }
  }, [])

  if (cargando) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 32, height: 32, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!autenticado) {
    return (
      <div style={{ padding: '2rem', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>{titulo}</h1>
        <p style={{ color: '#64748b' }}>{mensajePrincipal}</p>
      </div>
    )
  }

  return (
    <div>{children}</div>
  )
}

