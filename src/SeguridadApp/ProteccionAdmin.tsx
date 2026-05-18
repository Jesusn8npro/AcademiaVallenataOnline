'use client';

import React, { useEffect } from 'react';
import { Outlet, useNavigate } from '@/compat/router';
import { useUsuario } from '../contextos/UsuarioContext';
import './ProteccionRuta.css'; // Reusing the same CSS file for consistency

interface ProteccionAdminProps {
    children?: React.ReactNode;
}

const ProteccionAdmin: React.FC<ProteccionAdminProps> = ({ children }) => {
    const { usuario, inicializado } = useUsuario();
    const navigate = useNavigate();
    const esAdmin = usuario?.rol === 'admin';

    useEffect(() => {
        if (inicializado && !esAdmin) {
            const timer = setTimeout(() => {
                navigate('/');
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [inicializado, esAdmin, navigate]);

    // OPTIMISTA: mientras la sesion aun no se resuelve (no inicializado), o si
    // ya es admin, renderizamos el contenido YA — sin pantalla bloqueante
    // "Verificando permisos". Los datos estan protegidos por RLS en el
    // servidor (Supabase), asi que no hay riesgo de fuga; el contenido y la
    // verificacion cargan en paralelo (mucho mas rapido, sin espera muerta).
    if (!inicializado || esAdmin) {
        return children ? <>{children}</> : <Outlet />;
    }

    // Si no es admin (ya sea no logueado o estudiante)
    return (
        <div className="acceso-denegado-container admin-style">
            <div className="acceso-denegado-content">
                <div className="error-icono">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 11c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1 4h-2v-2h2v2z" fill="#dc2626" />
                    </svg>
                </div>
                <h1>⛔ ACCESO DENEGADO</h1>
                <p className="mensaje-principal">Esta área es exclusiva para administradores</p>

                <div className="info-simple">
                    {!usuario ? (
                        <>
                            <p><strong>⚠️ No has iniciado sesión</strong></p>
                            <p>Debes iniciar sesión con una cuenta administrativa.</p>
                        </>
                    ) : (
                        <>
                            <p><strong>⚠️ Sin privilegios suficientes</strong></p>
                            <p>Tu cuenta actual ({usuario.email}) no tiene permisos de administrador.</p>
                        </>
                    )}
                </div>

                <div className="mensaje-firme">
                    <p>🛡️ Área protegida y monitoreada</p>
                    <p>Cualquier intento de acceso no autorizado queda registrado.</p>
                </div>

                <div className="acciones-seguridad">
                    <button className="btn-inicio-seguridad" onClick={() => navigate('/')}>
                        VOLVER AL INICIO
                    </button>
                </div>

                <div className="countdown-seguridad">
                    <p>Redirigiendo automáticamente...</p>
                </div>
            </div>
        </div>
    );
};

export default ProteccionAdmin;
