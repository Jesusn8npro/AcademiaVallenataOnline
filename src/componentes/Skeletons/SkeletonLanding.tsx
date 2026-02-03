import React from 'react';
import './SkeletonBase.css';
import './SkeletonLanding.css';

const SkeletonLanding: React.FC = () => {
    return (
        <div className="skeleton-landing-container">
            <div className="skeleton-landing-hero">
                {/* Columna Izquierda */}
                <div className="skeleton-left-col">
                    <div className="skeleton-badge-row">
                        <div className="skeleton-box skeleton-badge"></div>
                        <div className="skeleton-box skeleton-badge"></div>
                    </div>

                    <div className="skeleton-box skeleton-title"></div>
                    <div className="skeleton-box skeleton-text" style={{ width: '60%', height: '40px' }}></div>

                    <div className="skeleton-box skeleton-description"></div>

                    <div className="skeleton-benefits">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="skeleton-box skeleton-benefit-item"></div>
                        ))}
                    </div>

                    <div className="skeleton-cta-row">
                        <div className="skeleton-box skeleton-btn"></div>
                        <div className="skeleton-box skeleton-btn" style={{ width: '140px' }}></div>
                    </div>
                </div>

                {/* Columna Derecha */}
                <div className="skeleton-right-col">
                    <div style={{ width: '100%', maxWidth: '500px' }}>
                        <div className="skeleton-box skeleton-video-card"></div>
                        <div className="skeleton-box skeleton-rating-row"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkeletonLanding;
