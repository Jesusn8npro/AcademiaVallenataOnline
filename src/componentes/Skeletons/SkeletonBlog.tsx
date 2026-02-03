import React from 'react';
import './SkeletonBase.css';
import './SkeletonBlog.css';

const SkeletonBlog: React.FC = () => {
    return (
        <div className="skeleton-blog-container">
            <div className="skeleton-main-content">
                <header className="skeleton-article-header">
                    <div className="skeleton-box skeleton-title" style={{ height: '50px' }}></div>
                    <div className="skeleton-meta-row">
                        <div className="skeleton-box skeleton-avatar"></div>
                        <div className="skeleton-box skeleton-meta-text"></div>
                        <div className="skeleton-box skeleton-meta-text"></div>
                    </div>
                </header>

                <div className="skeleton-box skeleton-cover-image"></div>

                <div className="skeleton-content-block">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="skeleton-box skeleton-paragraph" style={{ width: `${Math.random() * 30 + 70}%` }}></div>
                    ))}
                    <br />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton-box skeleton-paragraph"></div>
                    ))}
                    <div className="skeleton-box skeleton-rect" style={{ height: '200px', margin: '2rem 0' }}></div>
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton-box skeleton-paragraph"></div>
                    ))}
                </div>
            </div>

            <div className="skeleton-sidebar">
                <div className="skeleton-box skeleton-sidebar-widget"></div>
                <div className="skeleton-box skeleton-sidebar-widget" style={{ height: '150px' }}></div>
            </div>
        </div>
    );
};

export default SkeletonBlog;
