import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../servicios/clienteSupabase';
import './recuperar-contrasena.css';

const RecuperarContrasena: React.FC = () => {
    const navigate = useNavigate();
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');
    const [exito, setExito] = useState(false);
    const [sesionValida, setSesionValida] = useState(false);

    useEffect(() => {
        // Verificar si hay una sesión activa (Supabase procesa el token automáticamente)
        const verificarSesion = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setSesionValida(true);
            } else {
                // Si no hay sesión, posiblemente el link expiró o es inválido
                setError('El enlace de recuperación ha expirado o no es válido. Por favor, solicita uno nuevo.');
            }
        };

        verificarSesion();
    }, []);

    const manejarCambioContrasena = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setExito(false);

        if (nuevaContrasena.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        if (nuevaContrasena !== confirmarContrasena) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setCargando(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: nuevaContrasena
            });

            if (error) {
                setError(error.message);
            } else {
                setExito(true);
                // Cerrar la sesión técnica para obligar a entrar con la nueva clave
                await supabase.auth.signOut();
                // Redirigir al inicio después de unos segundos
                setTimeout(() => {
                    navigate('/');
                }, 4000);
            }
        } catch (err) {
            setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="recuperar-contenedor">
            <div className="recuperar-tarjeta">
                <div className="recuperar-header">
                    <div className="logo-contenedor">
                        <img
                            src="/logo academia vallenata.webp"
                            alt="Logo Academia Vallenata"
                            className="recuperar-logo"
                            width="300"
                            height="194"
                            loading="lazy"
                            decoding="async"
                        />
                    </div>
                    <h1 className="recuperar-titulo">Restablecer Contraseña</h1>
                </div>

                {exito ? (
                    <div className="recuperar-exito">
                        <div className="icono-exito">✅</div>
                        <h2>¡Contraseña actualizada!</h2>
                        <p>Tu contraseña ha sido cambiada exitosamente. Serás redirigido al inicio en unos segundos.</p>
                        <button 
                            className="boton-primario" 
                            onClick={() => navigate('/')}
                        >
                            Ir al Inicio ahora
                        </button>
                    </div>
                ) : (
                    <>
                        {error && <div className="recuperar-error">{error}</div>}
                        
                        {!sesionValida && !error ? (
                            <div className="recuperar-cargando">
                                <div className="spinner"></div>
                                <p>Verificando enlace de seguridad...</p>
                            </div>
                        ) : (
                            <form className="recuperar-formulario" onSubmit={manejarCambioContrasena}>
                                <p className="recuperar-instrucciones">
                                    Ingresa tu nueva contraseña a continuación para recuperar el acceso a tu cuenta.
                                </p>

                                <div className="campo-grupo">
                                    <label htmlFor="nueva">Nueva Contraseña</label>
                                    <div className="input-con-icono">
                                        <input
                                            id="nueva"
                                            type={mostrarContrasena ? "text" : "password"}
                                            value={nuevaContrasena}
                                            onChange={(e) => setNuevaContrasena(e.target.value)}
                                            placeholder="Mínimo 6 caracteres"
                                            required
                                            disabled={cargando}
                                        />
                                        <button 
                                            type="button" 
                                            className="boton-ojito"
                                            onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                        >
                                            {mostrarContrasena ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>

                                <div className="campo-grupo">
                                    <label htmlFor="confirmar">Confirmar Contraseña</label>
                                    <div className="input-con-icono">
                                        <input
                                            id="confirmar"
                                            type={mostrarContrasena ? "text" : "password"}
                                            value={confirmarContrasena}
                                            onChange={(e) => setConfirmarContrasena(e.target.value)}
                                            placeholder="Repite tu contraseña"
                                            required
                                            disabled={cargando}
                                        />
                                        <button 
                                            type="button" 
                                            className="boton-ojito"
                                            onClick={() => setMostrarContrasena(!mostrarContrasena)}
                                        >
                                            {mostrarContrasena ? '👁️' : '🙈'}
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    className="boton-primario" 
                                    disabled={cargando || !sesionValida}
                                >
                                    {cargando ? 'Actualizando...' : 'Cambiar Contraseña'}
                                </button>
                            </form>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RecuperarContrasena;
