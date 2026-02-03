import React, { useMemo } from 'react'
import './PorcentajePerfil.css'

export default function PorcentajePerfil({ perfil }: { perfil: any }) {

  const { porcentaje, generalCompletadas, camposGenerales, trayectoriaCompletadas, camposTrayectoria, adicionalesCompletadas, camposAdicionales } = useMemo(() => {
    const isRealValue = (val: any) => val !== undefined && val !== null && val !== '' && val !== 'NULL'

    const camposGenerales = [
      perfil?.nombre,
      perfil?.apellido,
      perfil?.nombre_usuario,
      perfil?.biografia,
      perfil?.pais,
      perfil?.ciudad
    ]
    const generalCompletadas = camposGenerales.filter(isRealValue).length

    const camposTrayectoria = [
      perfil?.instrumento,
      perfil?.nivel_habilidad,
      perfil?.ano_experiencia,
      perfil?.estilo_favorito,
      perfil?.estudios_musicales,
      perfil?.objetivo_aprendizaje
    ]
    const trayectoriaCompletadas = camposTrayectoria.filter(isRealValue).length

    const camposAdicionales = [
      perfil?.fecha_nacimiento,
      perfil?.profesion,
      perfil?.whatsapp,
      perfil?.direccion_completa,
      perfil?.documento_tipo,
      perfil?.documento_numero
    ]
    const adicionalesCompletadas = camposAdicionales.filter(isRealValue).length

    const totalCampos = camposGenerales.length + camposTrayectoria.length + camposAdicionales.length
    const camposCompletados = generalCompletadas + trayectoriaCompletadas + adicionalesCompletadas
    const porcentaje = Math.round((camposCompletados / totalCampos) * 100)

    return { porcentaje, generalCompletadas, camposGenerales, trayectoriaCompletadas, camposTrayectoria, adicionalesCompletadas, camposAdicionales }
  }, [perfil])

  const colorProgreso = porcentaje >= 80 ? '#10b981' : porcentaje >= 50 ? '#f59e0b' : '#ef4444'
  const circunferencia = 314.16
  const offset = circunferencia - (circunferencia * porcentaje / 100)

  return (
    <div className="pop-widget-progreso">
      <div className="pop-header-widget">
        <div className="pop-emoji-estado">
          {porcentaje >= 80 ? '🎉' : porcentaje >= 50 ? '⚡' : '🚀'}
        </div>
        <h3 className="pop-titulo-progreso">Completa tu perfil</h3>
        <p className="pop-subtitulo">
          {porcentaje >= 80 ? '¡Excelente trabajo!' : porcentaje >= 50 ? '¡Vas muy bien!' : '¡Empecemos!'}
        </p>
      </div>

      <div className="pop-contenedor-circulo">
        <div className="pop-progreso-circular">
          <svg viewBox="0 0 120 120" className="pop-circulo-svg">
            <defs>
              <linearGradient id="gradienteProgreso" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: colorProgreso, stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: `${colorProgreso}80`, stopOpacity: 1 }} />
              </linearGradient>
              <filter id="sombra" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={colorProgreso} floodOpacity="0.2" />
              </filter>
            </defs>

            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="8"
              className="pop-fondo-circulo"
            />

            <circle
              cx="60"
              cy="60"
              r="50"
              fill="none"
              stroke="url(#gradienteProgreso)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circunferencia}
              strokeDashoffset={offset}
              className="pop-barra-progreso"
              filter="url(#sombra)"
            />
          </svg>

          <div className="pop-contenido-centro">
            <div className="pop-porcentaje-numero">{porcentaje}<span className="pop-simbolo-porcentaje">%</span></div>
            <div className="pop-texto-completado">Completado</div>
          </div>
        </div>
      </div>

      <div className="pop-lista-progreso">
        <div className={`pop-item-progreso ${generalCompletadas === camposGenerales.length ? 'pop-completado' : ''}`}>
          <div className="pop-icono-item">
            {generalCompletadas === camposGenerales.length ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="pop-circulo-vacio"></div>
            )}
          </div>
          <div className="pop-info-item">
            <span className="pop-nombre-item">Datos personales</span>
            <span className="pop-progreso-item">{generalCompletadas}/{camposGenerales.length}</span>
          </div>
        </div>

        <div className={`pop-item-progreso ${trayectoriaCompletadas === camposTrayectoria.length ? 'pop-completado' : ''}`}>
          <div className="pop-icono-item">
            {trayectoriaCompletadas === camposTrayectoria.length ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="pop-circulo-vacio"></div>
            )}
          </div>
          <div className="pop-info-item">
            <span className="pop-nombre-item">Trayectoria musical</span>
            <span className="pop-progreso-item">{trayectoriaCompletadas}/{camposTrayectoria.length}</span>
          </div>
        </div>

        <div className={`pop-item-progreso ${adicionalesCompletadas === camposAdicionales.length ? 'pop-completado' : ''}`}>
          <div className="pop-icono-item">
            {adicionalesCompletadas === camposAdicionales.length ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <div className="pop-circulo-vacio"></div>
            )}
          </div>
          <div className="pop-info-item">
            <span className="pop-nombre-item">Datos adicionales</span>
            <span className="pop-progreso-item">{adicionalesCompletadas}/{camposAdicionales.length}</span>
          </div>
        </div>
      </div>

      {porcentaje < 100 && (
        <div className="pop-motivacion">
          <p className="pop-texto-motivacion">
            {porcentaje >= 80 ? '¡Solo faltan unos detalles más!' : porcentaje >= 50 ? '¡Estás a mitad de camino!' : '¡Completa tu perfil para destacar!'}
          </p>
        </div>
      )}
    </div>
  )
}
