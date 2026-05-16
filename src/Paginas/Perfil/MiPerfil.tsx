import InfoPestanaPerfil from '../../componentes/Perfil/InfoPestanaPerfil'
import PorcentajePerfil from '../../componentes/Perfil/PorcentajePerfil'
import UltimosArticulosBlog from '../../componentes/Perfil/UltimosArticulosBlog'
import { usePerfilStore } from '../../stores/perfilStore'
import ExperienciaPerfil from '../../componentes/Perfil/ExperienciaPerfil'
import MonedasPerfil from '../../componentes/Perfil/MonedasPerfil'
import BannerOnboarding from '../../componentes/Perfil/BannerOnboarding'

export default function MiPerfil() {
  const { perfil, actualizarPerfil } = usePerfilStore()

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
      {perfil && <BannerOnboarding perfil={perfil} />}
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

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {perfil?.id && (
          <>
            <ExperienciaPerfil usuarioId={perfil.id} />
            <MonedasPerfil usuarioId={perfil.id} />
          </>
        )}
      </div>
    </div>
  )
}
