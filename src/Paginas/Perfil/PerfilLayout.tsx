import React, { useEffect, useState } from 'react'
import ProteccionAutenticacion from '../../guards/ProteccionAutenticacion'
import { PerfilProvider, usePerfilStore } from '../../stores/perfilStore'
import EncabezadoPerfil from '../../componentes/Perfil/EncabezadoPerfil'
import PestanasPerfil from '../../componentes/Perfil/PestanasPerfil'
import { useUsuario } from '../../contextos/UsuarioContext'
import './perfil-layout.css'
import { Outlet } from 'react-router-dom'

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { perfil, stats, cargarDatosPerfil, forzarInicializacion, inicializado } = usePerfilStore()
  const { usuario } = useUsuario()
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    cargarDatosPerfil()

    const safetyTimer = setTimeout(() => {
      if (!inicializado && !perfil) forzarInicializacion()
    }, 3000)

    return () => clearTimeout(safetyTimer)
  }, [])

  // Mostrar encabezado inmediatamente con datos del contexto,
  // se actualiza solo cuando el store termina de cargar
  const nombreCompleto = perfil?.nombre_completo || usuario?.nombre || ''
  const urlAvatar = perfil?.url_foto_perfil || usuario?.url_foto_perfil
  const userId = perfil?.id || usuario?.id

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
