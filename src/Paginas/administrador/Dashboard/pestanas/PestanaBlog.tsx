
import BlogAdminManager from './BlogAdminManager';
import './PestanaBlog.css';

const PestanaBlog = () => {
    return (
        <div className="pestana-blog">
            <div className="encabezado-pestaña">
                <h2>📝 Blog & Contenido</h2>
                <p>Gestión completa de artículos del blog</p>
            </div>

            <div className="contenido-blog">
                <BlogAdminManager />
            </div>
        </div>
    );
};

export default PestanaBlog;
