'use client';

import * as React from 'react';
import { useEffect, useState } from 'react'
import ProteccionAutenticacion from '../../guards/ProteccionAutenticacion'
import { PerfilProvider, usePerfilStore } from '../../stores/perfilStore'
import EncabezadoPerfil from '../../componentes/Perfil/EncabezadoPerfil'
import PestanasPerfil from '../../componentes/Perfil/PestanasPerfil'
import { useUsuario } from '../../contextos/UsuarioContext'
import './perfil-layout.css'
import { Outlet } from '@/compat/router'

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { perfil, stats, cargando: cargandoStats, cargarDatosPerfil, forzarInicializacion, inicializado } = usePerfilStore()
  const { usuario } = useUsuario()
  const [modalAbierto, setModalAbierto] = useState(false)
  // mounted: hydration-safe. En SSR + first client render, mounted=false →
  // renderiza placeholder (HTML idéntico al server). Después del mount, en
  // el efecto, mounted=true → renderiza EncabezadoPerfil con userId real.
  // Sin este flag había hydration mismatch porque userId era null en SSR
  // pero válido en el primer render del cliente (viene del localStorage cache).
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    cargarDatosPerfil()

    const safetyTimer = setTimeout(() => {
      if (!inicializado && !perfil) forzarInicializacion()
    }, 4000)

    return () => clearTimeout(safetyTimer)
  }, [])

  // Mostrar encabezado inmediatamente con datos del contexto,
  // se actualiza solo cuando el store termina de cargar
  const nombreCompleto = perfil?.nombre_completo || usuario?.nombre || ''
  const urlAvatar = perfil?.url_foto_perfil || usuario?.url_foto_perfil
  // En SSR/first render, userId queda null para que coincida con el HTML del server.
  const userId = mounted ? (perfil?.id || usuario?.id) : null

  return (
    <div className="layout-perfil-fijo" translate="no">
      <div className="perfil-layout-header-wrapper">
        {userId ? (
          <EncabezadoPerfil
            nombreCompleto={nombreCompleto}
            urlAvatar={urlAvatar}
            urlPortada={perfil?.portada_url}
            posicionPortadaY={Number(perfil?.posicion_img_portada || 50)}
            userId={userId}
            stats={stats}
            cargandoStats={!inicializado}
            onModalStateChange={(abierto) => setModalAbierto(abierto)}
          />
        ) : (
          <div className="encabezado-cargando" />
        )}
      </div>

      <div className="perfil-layout-tabs-wrapper" style={{ marginBottom: '1rem' }}>
        <PestanasPerfil modalAbierto={modalAbierto} />
      </div>

      <div className="contenido-dinamico">
        <div className="perfil-content-actual">{children}</div>
      </div>
    </div>
  )
}

export default function PerfilLayout({ children }: { children?: React.ReactNode }) {
  return (
    <ProteccionAutenticacion titulo="🔒 PERFIL RESTRINGIDO" mensajePrincipal="Tu perfil personal requiere que inicies sesión">
      <PerfilProvider>
        <InnerLayout>{children || <Outlet />}</InnerLayout>
      </PerfilProvider>
    </ProteccionAutenticacion>
  )
}
