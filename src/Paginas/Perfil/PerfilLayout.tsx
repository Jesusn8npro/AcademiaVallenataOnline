import React, { useEffect, useState } from 'react'
import ProteccionAutenticacion from '../../guards/ProteccionAutenticacion'
import { PerfilProvider, usePerfilStore } from '../../stores/perfilStore'
import EncabezadoPerfil from '../../componentes/Perfil/EncabezadoPerfil'
import PestanasPerfil from '../../componentes/Perfil/PestanasPerfil'
import SkeletonEncabezadoPerfil from '../../componentes/Skeletons/SkeletonEncabezadoPerfil'
import '../../componentes/Skeletons/SkeletonBase.css'
import './perfil-layout.css'
import { Outlet } from 'react-router-dom'

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { perfil, stats, cargando, inicializado, cargarDatosPerfil, forzarInicializacion } = usePerfilStore()
  const [modalAbierto, setModalAbierto] = useState(false)

  useEffect(() => {
    cargarDatosPerfil()

    const safetyTimer = setTimeout(() => {
      if (!inicializado && !perfil) forzarInicializacion()
    }, 3000)

    return () => clearTimeout(safetyTimer)
  }, [])

  function onModalStateChange(abierto: boolean) { setModalAbierto(abierto) }

  // Mostrar carga si no está inicializado O si está cargando y no hay perfil
  const mostrarCarga = !inicializado || (cargando && !perfil)

  return (
    <div className="layout-perfil-fijo" translate="no">
      {/* Área del Encabezado - Contenedor estable */}
      <div className="perfil-layout-header-wrapper">
        {mostrarCarga ? (
          <SkeletonEncabezadoPerfil />
        ) : perfil ? (
          <EncabezadoPerfil
            nombreCompleto={perfil.nombre_completo}
            urlAvatar={perfil.url_foto_perfil}
            urlPortada={perfil.portada_url}
            posicionPortadaY={Number(perfil.posicion_img_portada || 50)}
            userId={perfil.id}
            stats={stats}
            onModalStateChange={onModalStateChange}
          />
        ) : (
          <div className="encabezado-error">
            <p>Falló la carga</p>
            <button className="btn-reintentar" onClick={() => cargarDatosPerfil(true)}>Reintentar</button>
          </div>
        )}
      </div>

      {/* Área de Pestañas - Contenedor estable */}
      <div className="perfil-layout-tabs-wrapper" style={{ marginBottom: '1rem' }}>
        <PestanasPerfil modalAbierto={modalAbierto} />
      </div>

      {/* Área de Contenido - Contenedor estable */}
      <div className="contenido-dinamico">
        {perfil || inicializado ? (
          <div className="perfil-content-actual">{children}</div>
        ) : (
          <div className="contenido-cargando" style={{ padding: '2rem', width: '100%' }}>
            {/* Skeleton simple para el cuerpo */}
            <div className="skeleton-box" style={{ height: '40px', width: '300px', marginBottom: '2rem', borderRadius: '8px' }} />
            <div className="skeleton-box" style={{ height: '200px', width: '100%', borderRadius: '12px' }} />
          </div>
        )}
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
