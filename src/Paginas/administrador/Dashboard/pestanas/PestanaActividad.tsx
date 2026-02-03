import React, { useMemo } from 'react';
import './PestanaActividad.css';
import ActividadTiempoReal from '../componentes/ActividadTiempoReal';
import { type UsuarioActivo } from '../../../../servicios/actividadService';

// Placeholder for AlertasInteligentes (will implement later if needed or in next step)
const AlertasInteligentes = () => (
    <div style={{
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        padding: '1rem',
        marginBottom: '2rem',
        display: 'none' // Hidden by default for now as it's complex
    }}>
        <h4 style={{ margin: 0, color: '#fca5a5' }}>🚨 Alertas del Sistema</h4>
    </div>
);

// Placeholder for GestionAlumnos (using existing GestionUsuarios logic would be best, for now simple placeholder to match layout)
// Preview component for GestionAlumnos to show real data if available
const GestionAlumnosPreview = ({ onGestionarTodos, alumnos = [] }: { onGestionarTodos: () => void, alumnos?: any[] }) => (
    <div className="contenedor-actividad" style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: '16px',
        padding: '1.5rem',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ color: 'white', margin: 0 }}>Gestión de Alumnos</h3>
            <span style={{ background: '#3b82f6', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', color: 'white' }}>
                {alumnos.length} recientes
            </span>
        </div>

        {alumnos.length > 0 ? (
            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'rgba(255,255,255,0.8)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Alumno</th>
                            <th style={{ padding: '0.5rem' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alumnos.slice(0, 5).map((a, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '0.5rem' }}>
                                    {a.perfiles?.nombre} {a.perfiles?.apellido}
                                </td>
                                <td style={{ padding: '0.5rem' }}>
                                    <span style={{
                                        color: a.estado_visual === 'online' ? '#4ade80' : '#94a3b8',
                                        fontSize: '0.9rem'
                                    }}>
                                        {a.estado_visual === 'online' ? '🟢 Online' : '⚪ Offline'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {alumnos.length > 5 && (
                    <div style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.9rem', color: 'rgba(255,255,255,0.5)' }}>
                        ... y {alumnos.length - 5} más
                    </div>
                )}
            </div>
        ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-users" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)', marginBottom: '1rem' }}></i>
                <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: '1.5rem' }}>
                    Visualiza y gestiona a todos los estudiantes.
                </p>
            </div>
        )}

        <button
            onClick={onGestionarTodos}
            style={{
                background: '#3b82f6',
                border: 'none',
                color: 'white',
                padding: '0.75rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600,
                width: '100%'
            }}
        >
            Ver Todos los Alumnos
        </button>
    </div>
);

interface Props {
    actividadTiempoReal: UsuarioActivo[];
    alumnosActivos: any[];
    estadisticasGenerales: any;
    onGestionarTodos: () => void;
}

const PestanaActividad: React.FC<Props> = ({
    actividadTiempoReal,
    alumnosActivos,
    estadisticasGenerales,
    onGestionarTodos
}) => {

    const metricasActividad = useMemo(() => {
        const usuariosOnline = alumnosActivos.filter(a => a.estado_visual === 'online').length;
        const totalSesionesHoy = actividadTiempoReal.length;

        let tiempoPromedioSesion = 0;
        if (actividadTiempoReal.length > 0) {
            const tiempoTotal = actividadTiempoReal.reduce((sum, a) => sum + (a.tiempo_sesion_actual || 0), 0);
            tiempoPromedioSesion = Math.round(tiempoTotal / actividadTiempoReal.length);
        }

        return {
            usuariosOnline,
            totalSesionesHoy,
            tiempoPromedioSesion
        };
    }, [alumnosActivos, actividadTiempoReal]);

    return (
        <div className="pestaña-actividad">
            <div className="encabezado-pestaña">
                <h2>📊 Actividad en Tiempo Real</h2>
                <p>Monitoreo de usuarios activos y actividad del sistema</p>
            </div>

            {/* MÉTRICAS RÁPIDAS */}
            <div className="metricas-rapidas">
                <div className="metrica-card">
                    <div className="metrica-icono">👥</div>
                    <div className="metrica-info">
                        <div className="metrica-numero">{metricasActividad.usuariosOnline}</div>
                        <div className="metrica-label">En Línea Ahora</div>
                    </div>
                </div>
                <div className="metrica-card">
                    <div className="metrica-icono">📱</div>
                    <div className="metrica-info">
                        <div className="metrica-numero">{metricasActividad.totalSesionesHoy}</div>
                        <div className="metrica-label">Sesiones Hoy</div>
                    </div>
                </div>
                <div className="metrica-card">
                    <div className="metrica-icono">⏱️</div>
                    <div className="metrica-info">
                        <div className="metrica-numero">{metricasActividad.tiempoPromedioSesion}m</div>
                        <div className="metrica-label">Tiempo Promedio</div>
                    </div>
                </div>
                <div className="metrica-card">
                    <div className="metrica-icono">📈</div>
                    <div className="metrica-info">
                        <div className="metrica-numero">{estadisticasGenerales?.totalUsuarios || 0}</div>
                        <div className="metrica-label">Total Usuarios</div>
                    </div>
                </div>
            </div>

            {/* ALERTAS INTELIGENTES */}
            <div className="seccion-alertas">
                <AlertasInteligentes />
            </div>

            <div className="contenido-actividad">
                {/* ACTIVIDAD TIEMPO REAL */}
                <div className="seccion-tiempo-real">
                    <ActividadTiempoReal
                        usuarios={actividadTiempoReal}
                    />
                </div>

                {/* GESTIÓN DE ALUMNOS */}
                <div className="seccion-alumnos">
                    <GestionAlumnosPreview onGestionarTodos={onGestionarTodos} alumnos={alumnosActivos} />
                </div>
            </div>
        </div>
    );
};

export default PestanaActividad;
