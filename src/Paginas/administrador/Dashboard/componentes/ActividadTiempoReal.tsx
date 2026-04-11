import React from 'react';
import './ActividadTiempoReal.css';

interface UsuarioActivoRPC {
    usuario_id: string;
    pagina_actual: string;
    ultima_actividad: string;
    tiempo_sesion_actual: number;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    url_foto_perfil: string | null;
}

interface Props {
    usuarios: UsuarioActivoRPC[];
}

// Limpiar página actual - quitar slugs largos y mostrar nombre amigable
const limpiarPagina = (pagina: string): string => {
    if (!pagina || pagina === 'session_end') return 'Desconectado';
    if (pagina.includes('/tutoriales/')) return '📚 Viendo tutorial';
    if (pagina.includes('/administrador')) return '⚙️ Panel Admin';
    if (pagina.includes('/panel-estudiante')) return '🏠 Mi Panel';
    if (pagina.includes('/cursos/')) return '🎓 Viendo curso';
    if (pagina.includes('/configuracion')) return '⚙️ Configuración';
    if (pagina.includes('/comunidad')) return '👥 Comunidad';
    if (pagina.includes('/ranking')) return '🏆 Ranking';
    if (pagina.includes('/mensajes')) return '💬 Mensajes';
    if (pagina.includes('/mi-perfil')) return '👤 Mi Perfil';
    return pagina;
};

// Calcular tiempo relativo
const tiempoRelativo = (fecha: string): string => {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000);
    if (diff < 1) return 'ahora mismo';
    if (diff === 1) return 'hace 1 min';
    return `hace ${diff} min`;
};

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
                {!usuarios || usuarios.length === 0 ? (
                    <div className="sin-actividad">
                        <div className="icono-vacio">🌙</div>
                        <p>No hay estudiantes activos en este momento</p>
                    </div>
                ) : (
                    usuarios.map((usuario) => (
                        <div key={usuario.usuario_id} className="usuario-activo-item">
                            <div className="avatar-container">
                                {usuario.url_foto_perfil && usuario.url_foto_perfil.trim() !== '' ? (
                                    <img
                                        src={usuario.url_foto_perfil}
                                        alt={usuario.nombre}
                                        className="avatar-usuario"
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            objectFit: 'cover'
                                        }}
                                    />
                                ) : (
                                    <div
                                        className="avatar-fallback"
                                        style={{
                                            backgroundColor: '#3B6D11',
                                            color: 'white',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '14px',
                                            fontWeight: '600'
                                        }}
                                    >
                                        {usuario.nombre?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                )}
                                <div className="estado-indicador online"></div>
                            </div>

                            <div className="info-usuario">
                                <span className="nombre-usuario">
                                    {usuario.nombre} {usuario.apellido}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {usuario.correo_electronico}
                                </span>
                                <div className="actividad-usuario">
                                    <span className="pagina-actual">{limpiarPagina(usuario.pagina_actual)}</span>
                                </div>
                            </div>

                            <div className="tiempo-actividad">
                                {tiempoRelativo(usuario.ultima_actividad)}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActividadTiempoReal;
