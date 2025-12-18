import React from 'react'
import InfoPestanaPerfil from '../../componentes/Perfil/InfoPestanaPerfil'
import PorcentajePerfil from '../../componentes/Perfil/PorcentajePerfil'
import UltimosArticulosBlog from '../../componentes/Perfil/UltimosArticulosBlog'
import { usePerfilStore } from '../../stores/perfilStore'

export default function MiPerfil() {
  const { perfil, stats, cargando, actualizarPerfil } = usePerfilStore()

  // Si está cargando y NO hay perfil, mostramos spinner
  if (cargando && !perfil) {
    return (
      <div className="estado-carga" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 2rem', gap: '1.5rem' }}>
        <div className="spinner-carga" style={{ width: 50, height: 50, border: '4px solid #e5e7eb', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: '#64748b', fontWeight: 500 }}>Cargando información...</p>
      </div>
    )
  }

  // Objeto perfil vacío por defecto si es null, para permitir edición
  const perfilVisualizar = perfil || {
    id: '',
    nombre: '',
    apellido: '',
    nombre_usuario: '',
    biografia: '',
    nivel_habilidad: 'principiante'
  }

  return (
    <div className="contenido-mi-perfil">
      <div className="layout-info-perfil">
        <div className="columna-formulario-principal" style={{ minWidth: 0 }}>
          <InfoPestanaPerfil perfil={perfilVisualizar as any} onActualizar={actualizarPerfil} />
        </div>
        <aside className="columna-widget-lateral" style={{ position: 'sticky', top: '2rem' }}>
          <div className="widgets-contenedor" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <PorcentajePerfil perfil={perfil} />
            <UltimosArticulosBlog />
          </div>
        </aside>
      </div>
    </div>
  )
}
