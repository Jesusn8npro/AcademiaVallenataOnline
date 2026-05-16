import { useMemo, useState } from 'react'
import './BannerOnboarding.css'

const PESOS: Record<string, number> = {
  nombre: 15,
  apellido: 15,
  biografia: 20,
  url_foto_perfil: 15,
  portada_url: 10,
  whatsapp: 10,
  ciudad: 10,
  nombre_usuario: 5,
}

const ETIQUETAS: Record<string, string> = {
  nombre: 'Nombre',
  apellido: 'Apellido',
  biografia: 'Biografía',
  url_foto_perfil: 'Foto de perfil',
  portada_url: 'Foto de portada',
  whatsapp: 'WhatsApp',
  ciudad: 'Ciudad',
  nombre_usuario: 'Nombre de usuario',
}

function esValorReal(val: any) {
  return val !== undefined && val !== null && val !== '' && val !== 'NULL'
}

export default function BannerOnboarding({ perfil }: { perfil: any }) {
  const storageKey = `banner_onboarding_descartado_${perfil?.id}`
  const [descartado, setDescartado] = useState(() => !!localStorage.getItem(storageKey))

  const { completitud, faltantes } = useMemo(() => {
    let completitud = 0
    const faltantes: string[] = []
    for (const campo of Object.keys(PESOS)) {
      if (esValorReal(perfil?.[campo])) {
        completitud += PESOS[campo]
      } else {
        faltantes.push(campo)
      }
    }
    return { completitud, faltantes }
  }, [perfil])

  if (completitud >= 80 || descartado) return null

  function descartar() {
    localStorage.setItem(storageKey, '1')
    setDescartado(true)
  }

  function irAlFormulario() {
    document.querySelector('.ipp-info-perfil')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="bo-banner">
      <button className="bo-cerrar" onClick={descartar} aria-label="Descartar">×</button>
      <div className="bo-encabezado">
        <span className="bo-titulo">¡Completa tu perfil! ({completitud}% completado)</span>
      </div>
      <div className="bo-barra-fondo">
        <div className="bo-barra-progreso" style={{ width: `${completitud}%` }} />
      </div>
      <ul className="bo-lista-faltantes">
        {faltantes.map((campo) => (
          <li key={campo} className="bo-item-faltante">
            <span className="bo-campo-nombre">{ETIQUETAS[campo]}</span>
            <button className="bo-btn-completar" onClick={irAlFormulario}>
              Completar ahora →
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
