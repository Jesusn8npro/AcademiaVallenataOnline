import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUsuario } from '../contextos/UsuarioContext';
import './ProteccionRuta.css'; // We'll create this CSS next

interface ProteccionRutaProps {
    children?: React.ReactNode;
    titulo?: string;
    mensajePrincipal?: string;
}

const ProteccionRuta: React.FC<ProteccionRutaProps> = ({
    children,
    titulo = "🔒 ACCESO RESTRINGIDO",
    mensajePrincipal = "Esta área requiere que inicies sesión en tu cuenta"
}) => {
    const { usuario, inicializado } = useUsuario();
    const location = useLocation();
    const navigate = useNavigate();
    const [redirigiendo, setRedirigiendo] = useState(false);

    // Efecto para manejar redireción después de un tiempo
    useEffect(() => {
        if (inicializado && !usuario) {
            const timer = setTimeout(() => {
                setRedirigiendo(true);
                // Guardar ruta actual para redirigir después del login (opcional)
                // navigate(`/?redirigir=${encodeURIComponent(location.pathname)}`);
                navigate('/'); // Por ahora al home como en el original
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [inicializado, usuario, navigate, location]);

    if (!inicializado) {
        return (
            <div className="auth-verificacion">
                <div className="spinner"></div>
                <h2>Verificando sesión...</h2>
                <p>Comprobando tu acceso</p>
            </div>
        );
    }

    if (usuario) {
        return children ? <>{children}</> : <Outlet />;
    }

    // Si no hay usuario, mostrar pantalla de acceso denegado
    return (
        <div className="acceso-denegado-container">
            <div className="acceso-denegado-content">
                <div className="error-icono">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h2v2h-2v-2zm0-12h2v10h-2V5z" fill="#dc2626" />
                    </svg>
                </div>
                <h1>{titulo}</h1>
                <p className="mensaje-principal">{mensajePrincipal}</p>

                <div className="info-simple">
                    <p><strong>⚠️ Necesitas iniciar sesión</strong></p>
                    <p>Para acceder a este contenido debes tener una cuenta activa en la Academia Vallenata Online</p>
                </div>

                <div className="beneficios">
                    <h3>✨ Al iniciar sesión tendrás acceso a:</h3>
                    <ul>
                        <li>🎵 Todo el contenido de acordeón</li>
                        <li>🏆 Sistema de ranking y logros</li>
                        <li>👥 Comunidad de estudiantes</li>
                        <li>📊 Seguimiento de tu progreso</li>
                    </ul>
                </div>

                <div className="acciones-seguridad">
                    <button className="btn-login-seguridad" onClick={() => navigate('/')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M11 7L9.6 8.4l2.6 2.6H2v2h10.2l-2.6 2.6L11 17l5-5-5-5zm9 12h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-8v2h8v12z" fill="currentColor" />
                        </svg>
                        INICIAR SESIÓN
                    </button>
                    <button className="btn-inicio-seguridad" onClick={() => navigate('/')}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor" />
                        </svg>
                        VOLVER AL INICIO
                    </button>
                </div>

                <div className="countdown-seguridad">
                    <p>{redirigiendo ? 'Redirigiendo...' : 'Redirigiendo automáticamente...'}</p>
                </div>
            </div>
        </div>
    );
};

export default ProteccionRuta;
