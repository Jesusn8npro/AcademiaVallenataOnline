import React from 'react'
import './SkeletonEncabezadoPerfil.css'

const SkeletonEncabezadoPerfil: React.FC = () => {
    return (
        <div className="skeleton-encabezado-perfil">
            {/* Portada */}
            <div className="skeleton-portada">
                <div className="skeleton-box skeleton-portada-img"></div>
                <div className="skeleton-avatar-container">
                    <div className="skeleton-box skeleton-avatar-circle"></div>
                </div>
            </div>

            {/* Info Usuario */}
            <div className="skeleton-info-usuario">
                {/* Estadísticas */}
                <div className="skeleton-estadisticas">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton-stat">
                            <div className="skeleton-box skeleton-stat-icon"></div>
                            <div className="skeleton-box skeleton-stat-value"></div>
                            <div className="skeleton-box skeleton-stat-label"></div>
                        </div>
                    ))}
                </div>

                {/* Separador */}
                <div className="skeleton-separador"></div>

                {/* Info Central */}
                <div className="skeleton-central">
                    <div className="skeleton-box skeleton-nombre"></div>
                    <div className="skeleton-box skeleton-rating"></div>
                    <div className="skeleton-badges">
                        <div className="skeleton-box skeleton-badge"></div>
                        <div className="skeleton-box skeleton-badge"></div>
                    </div>
                </div>

                {/* Acciones */}
                <div className="skeleton-acciones">
                    <div className="skeleton-box skeleton-saludo"></div>
                    <div className="skeleton-box skeleton-boton"></div>
                </div>
            </div>
        </div>
    )
}

export default SkeletonEncabezadoPerfil
