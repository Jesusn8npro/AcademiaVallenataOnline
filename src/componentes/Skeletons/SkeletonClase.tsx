import React from 'react';
import './SkeletonBase.css';
import './SkeletonClase.css';

const SkeletonClase: React.FC = () => {
    return (
        <div className="skeleton-clase-container">
            {/* Header Simulado */}
            <div className="skeleton-clase-header">
                <div className="skeleton-box skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
                <div className="skeleton-box skeleton-text" style={{ width: '200px', marginBottom: 0 }}></div>
            </div>

            <div className="skeleton-clase-body">
                {/* Área Principal (Video) */}
                <div className="skeleton-clase-main">
                    <div className="skeleton-box skeleton-video-player"></div>

                    <div className="skeleton-clase-info">
                        <div className="skeleton-box skeleton-title" style={{ height: '40px', width: '60%' }}></div>
                        <div className="skeleton-box skeleton-text" style={{ width: '40%' }}></div>
                    </div>
                </div>

                {/* Sidebar (Lista de Lecciones) */}
                <div className="skeleton-clase-sidebar">
                    <div className="skeleton-box skeleton-text" style={{ width: '80%', height: '30px', marginBottom: '20px' }}></div>
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div key={i} className="skeleton-box skeleton-lesson-item"></div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SkeletonClase;
