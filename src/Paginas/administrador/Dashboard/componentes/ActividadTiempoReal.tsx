import React from 'react';
import './ActividadTiempoReal.css';
import { type UsuarioActivo } from '../../../../servicios/actividadService';

interface Props {
    usuarios: UsuarioActivo[];
}

const ActividadTiempoReal: React.FC<Props> = ({ usuarios }) => {
    return (
        <div className="actividad-tiempo-real">
            <div className="encabezado-seccion">
                <div className="titulo-seccion">
                    <i className="fas fa-satellite-dish" style={{ color: '#3b82f6' }}></i>
                    <h2>Actividad en Tiempo Real</h2>
                </div>
                <div className="indicador-envivo">
                    <div className="punto-pulso"></div>
                    <span>EN VIVO</span>
                </div>
            </div>

            <div className="lista-usuarios-activos">
                {usuarios.length === 0 ? (
                    <div className="sin-actividad">
                        <div className="icono-vacio">🌙</div>
                        <p>No hay estudiantes activos en este momento</p>
                    </div>
                ) : (
                    usuarios.map((usuario) => (
                        <div key={usuario.usuario_id} className="usuario-activo-item">
                            <div className="avatar-container">
                                {usuario.perfiles?.url_foto_perfil ? (
                                    <img
                                        src={usuario.perfiles.url_foto_perfil}
                                        alt={usuario.perfiles.nombre}
                                        className="avatar-usuario"
                                    />
                                ) : (
                                    <div className="avatar-fallback">
                                        {usuario.perfiles?.nombre?.[0] || 'U'}
                                    </div>
                                )}
                                <div className={`estado-indicador ${usuario.estado_visual}`}></div>
                            </div>

                            <div className="info-usuario">
                                <span className="nombre-usuario">
                                    {usuario.perfiles?.nombre} {usuario.perfiles?.apellido}
                                </span>
                                <div className="actividad-usuario">
                                    <span className="pagina-actual">{usuario.pagina_actual}</span>
                                    <span style={{ fontSize: '0.7rem' }}>• {usuario.tipo_actividad}</span>
                                </div>
                            </div>

                            <div className="tiempo-actividad">
                                {usuario.tiempo_sesion_actual} min
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActividadTiempoReal;
