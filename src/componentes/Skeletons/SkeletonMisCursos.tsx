import React from 'react'
import './SkeletonMisCursos.css'

const SkeletonMisCursos: React.FC = () => {
    return (
        <div className="skeleton-mis-cursos">
            <div className="skeleton-layout">
                {/* Columna Principal */}
                <div className="skeleton-columna-principal">
                    {/* Header */}
                    <div className="skeleton-header">
                        <div className="skeleton-box skeleton-title"></div>
                        <div className="skeleton-box skeleton-subtitle"></div>
                    </div>

                    {/* Grid de Cursos */}
                    <div className="skeleton-grid-cursos">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="skeleton-curso-card">
                                <div className="skeleton-box skeleton-imagen"></div>
                                <div className="skeleton-card-content">
                                    <div className="skeleton-box skeleton-card-title"></div>
                                    <div className="skeleton-box skeleton-card-text"></div>
                                    <div className="skeleton-box skeleton-card-text-short"></div>
                                    <div className="skeleton-card-footer">
                                        <div className="skeleton-box skeleton-badge"></div>
                                        <div className="skeleton-box skeleton-progress"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Columna Lateral */}
                <aside className="skeleton-columna-lateral">
                    {/* Widget Perfil */}
                    <div className="skeleton-widget">
                        <div className="skeleton-box skeleton-widget-header"></div>
                        <div className="skeleton-box skeleton-widget-circle"></div>
                        <div className="skeleton-box skeleton-widget-text"></div>
                        <div className="skeleton-box skeleton-widget-text-short"></div>
                    </div>

                    {/* Widget Banner */}
                    <div className="skeleton-widget">
                        <div className="skeleton-box skeleton-banner"></div>
                    </div>
                </aside>
            </div>
        </div>
    )
}

export default SkeletonMisCursos
