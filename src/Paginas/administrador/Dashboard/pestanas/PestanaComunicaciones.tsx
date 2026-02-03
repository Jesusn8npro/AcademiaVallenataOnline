import { supabase } from '../../../../servicios/supabaseCliente';
import {
    Mail,
    MessageSquare,
    Bell,
    TrendingUp,
    Users,
    RefreshCw,
    Download,
    Plus,
    X,
    Eye,
    MessageCircle
} from 'lucide-react';
import './PestanaComunicaciones.css';

interface CampañaComunicacion {
    id: string;
    titulo: string;
    tipo: 'email' | 'whatsapp' | 'notificacion';
    estado: 'borrador' | 'programada' | 'enviada';
    destinatarios: number;
    fecha_creacion: string;
    fecha_programada?: string;
    fecha_enviada?: string;
    tasa_apertura?: number;
    tasa_respuesta?: number;
}

interface EstadisticasComunicacion {
    totalCampañas: number;
    emailsEnviados: number;
    whatsappsEnviados: number;
    notificacionesEnviadas: number;
    tasaAperturaPromedio: number;
    tasaRespuestaPromedio: number;
}

const PestanaComunicaciones: React.FC = () => {
    const [cargando, setCargando] = useState(false);
    const [modalNuevaCampaña, setModalNuevaCampaña] = useState(false);
    const [campañas, setCampañas] = useState<CampañaComunicacion[]>([]);
    const [usuariosDisponibles, setUsuariosDisponibles] = useState<any[]>([]);

    const [estadisticasComunicacion, setEstadisticasComunicacion] = useState<EstadisticasComunicacion>({
        totalCampañas: 0,
        emailsEnviados: 0,
        whatsappsEnviados: 0,
        notificacionesEnviadas: 0,
        tasaAperturaPromedio: 0,
        tasaRespuestaPromedio: 0
    });

    const [nuevaCampaña, setNuevaCampaña] = useState({
        titulo: '',
        tipo: 'email' as 'email' | 'whatsapp' | 'notificacion',
        mensaje: '',
        asunto: '',
        destinatarios: [] as string[],
        filtroDestinatarios: 'todos' as 'todos' | 'activos' | 'inactivos' | 'nuevos' | 'personalizado',
        fechaProgramada: '',
        horaEnvio: '09:00'
    });

    // Plantillas predefinidas
    const plantillasEmail = [
        {
            nombre: 'Bienvenida',
            asunto: '¡Bienvenido a Academia Vallenata Online! 🎵',
            contenido: '¡Hola [NOMBRE]!\n\n' +
                '¡Bienvenido a nuestra academia! Estamos emocionados de tenerte con nosotros.\n\n' +
                '🎵 **¿Qué puedes hacer ahora?**\n' +
                '• Explora nuestros cursos de acordeón\n' +
                '• Prueba el simulador interactivo\n' +
                '• Únete a nuestra comunidad\n\n' +
                '¡Empecemos tu viaje musical!\n\n' +
                'Saludos,\n' +
                '    Equipo Academia Vallenata'
        },
        {
            nombre: 'Recordatorio Curso',
            asunto: '¡No olvides continuar tu curso! 📚',
            contenido: '¡Hola [NOMBRE]!\n\n' +
                'Notamos que no has visitado tu curso en unos días.\n\n' +
                '🎯 **Tu progreso:**\n' +
                '• Curso: [CURSO]\n' +
                '• Progreso: [PROGRESO]%\n' +
                '• Última lección: [LECCION]\n\n' +
                '¡Continúa aprendiendo y no pierdas el ritmo!\n\n' +
                '[ENLACE_CURSO]'
        },
        {
            nombre: 'Nuevo Contenido',
            asunto: '🎉 Nuevo contenido disponible en tu curso',
            contenido: '¡Hola [NOMBRE]!\n\n' +
                '¡Tenemos nuevo contenido para ti!\n\n' +
                '🆕 **Novedades:**\n' +
                '• [NUEVO_CONTENIDO]\n' +
                '• Ejercicios prácticos\n' +
                '• Partituras descargables\n\n' +
                '¡No te lo pierdas!\n\n' +
                'Ver ahora: [ENLACE]'
        }
    ];

    const plantillasWhatsApp = [
        {
            nombre: 'Recordatorio Amigable',
            contenido: '¡Hola [NOMBRE]! 👋\n\n' +
                '¿Cómo vas con el acordeón? Recuerda que tienes contenido nuevo esperándote en la academia.\n\n' +
                '¡Sigue practicando! 🎵'
        },
        {
            nombre: 'Motivacional',
            contenido: '¡[NOMBRE], no te rindas! 💪\n\n' +
                'Cada gran acordeonista empezó como principiante. Tu constancia es la clave del éxito.\n\n' +
                '¡Vamos, continúa con tu siguiente lección! 🎶'
        }
    ];

    useEffect(() => {
        cargarDatosComunicacion();
    }, []);

    async function cargarDatosComunicacion() {
        try {
            setCargando(true);
            await Promise.all([
                cargarUsuariosDisponibles(),
                cargarCampañasExistentes()
            ]);
            // Stats are calculated after loading campaigns
        } catch (error) {
            console.error('❌ [COMUNICACIÓN] Error:', error);
        } finally {
            setCargando(false);
        }
    }

    // Effect to calculate stats whenever campaigns change
    useEffect(() => {
        if (campañas.length > 0) {
            calcularEstadisticas();
        }
    }, [campañas]);

    async function cargarUsuariosDisponibles() {
        const { data: usuarios } = await supabase
            .from('perfiles')
            .select(`
id, nombre, apellido, correo_electronico, whatsapp, rol, created_at,
    sesiones_usuario!left(ultima_actividad, esta_activo)
            `)
            .eq('eliminado', false)
            .eq('rol', 'estudiante');

        const mappedUsers = usuarios?.map((u: any) => ({
            ...u,
            nombre_completo: `${u.nombre} ${u.apellido} `,
            estado: u.sesiones_usuario?.[0]?.esta_activo ? 'activo' : 'inactivo',
            dias_registro: Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24))
        })) || [];

        setUsuariosDisponibles(mappedUsers);
    }

    async function cargarCampañasExistentes() {
        // Simular campañas existentes (en implementación real vendría de BD)
        const mockCampañas: CampañaComunicacion[] = [
            {
                id: '1',
                titulo: 'Bienvenida Nuevos Estudiantes',
                tipo: 'email',
                estado: 'enviada',
                destinatarios: 45,
                fecha_creacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                fecha_enviada: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
                tasa_apertura: 78.5,
                tasa_respuesta: 12.3
            },
            {
                id: '2',
                titulo: 'Recordatorio Práctica Semanal',
                tipo: 'whatsapp',
                estado: 'programada',
                destinatarios: 89,
                fecha_creacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                fecha_programada: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
                id: '3',
                titulo: 'Nuevo Curso Disponible',
                tipo: 'notificacion',
                estado: 'borrador',
                destinatarios: 156,
                fecha_creacion: new Date().toISOString()
            }
        ];

        setCampañas(mockCampañas);
    }

    function calcularEstadisticas() {
        setEstadisticasComunicacion({
            totalCampañas: campañas.length,
            emailsEnviados: campañas.filter(c => c.tipo === 'email' && c.estado === 'enviada').reduce((sum, c) => sum + c.destinatarios, 0),
            whatsappsEnviados: campañas.filter(c => c.tipo === 'whatsapp' && c.estado === 'enviada').reduce((sum, c) => sum + c.destinatarios, 0),
            notificacionesEnviadas: campañas.filter(c => c.tipo === 'notificacion' && c.estado === 'enviada').reduce((sum, c) => sum + c.destinatarios, 0),
            tasaAperturaPromedio: campañas.filter(c => c.tasa_apertura).reduce((sum, c) => sum + (c.tasa_apertura || 0), 0) / (campañas.filter(c => c.tasa_apertura).length || 1),
            tasaRespuestaPromedio: campañas.filter(c => c.tasa_respuesta).reduce((sum, c) => sum + (c.tasa_respuesta || 0), 0) / (campañas.filter(c => c.tasa_respuesta).length || 1)
        });
    }

    function filtrarUsuarios() {
        switch (nuevaCampaña.filtroDestinatarios) {
            case 'activos':
                return usuariosDisponibles.filter(u => u.estado === 'activo');
            case 'inactivos':
                return usuariosDisponibles.filter(u => u.estado === 'inactivo');
            case 'nuevos':
                return usuariosDisponibles.filter(u => u.dias_registro <= 7);
            case 'personalizado':
                return usuariosDisponibles.filter(u => nuevaCampaña.destinatarios.includes(u.id));
            default:
                return usuariosDisponibles;
        }
    }

    function aplicarPlantilla(plantilla: any) {
        setNuevaCampaña(prev => ({
            ...prev,
            asunto: plantilla.asunto || prev.asunto,
            mensaje: plantilla.contenido
        }));
    }

    async function enviarCampaña() {
        try {
            const destinatariosFiltrados = filtrarUsuarios();

            if (destinatariosFiltrados.length === 0) {
                alert('❌ No hay destinatarios válidos para esta campaña');
                return;
            }

            // Validaciones
            if (!nuevaCampaña.titulo.trim()) {
                alert('❌ El título es obligatorio');
                return;
            }

            if (!nuevaCampaña.mensaje.trim()) {
                alert('❌ El mensaje es obligatorio');
                return;
            }

            if (nuevaCampaña.tipo === 'email' && !nuevaCampaña.asunto.trim()) {
                alert('❌ El asunto es obligatorio para emails');
                return;
            }

            // Simular envío
            console.log('📧 [COMUNICACIÓN] Enviando campaña...', {
                titulo: nuevaCampaña.titulo,
                tipo: nuevaCampaña.tipo,
                destinatarios: destinatariosFiltrados.length,
                programada: nuevaCampaña.fechaProgramada ? true : false
            });

            // Crear nueva campaña
            const nuevaCampañaObj: CampañaComunicacion = {
                id: Date.now().toString(),
                titulo: nuevaCampaña.titulo,
                tipo: nuevaCampaña.tipo,
                estado: nuevaCampaña.fechaProgramada ? 'programada' : 'enviada',
                destinatarios: destinatariosFiltrados.length,
                fecha_creacion: new Date().toISOString(),
                fecha_programada: nuevaCampaña.fechaProgramada ? new Date(nuevaCampaña.fechaProgramada + 'T' + nuevaCampaña.horaEnvio).toISOString() : undefined,
                fecha_enviada: !nuevaCampaña.fechaProgramada ? new Date().toISOString() : undefined,
                tasa_apertura: !nuevaCampaña.fechaProgramada ? Math.random() * 30 + 60 : undefined, // Simulado
                tasa_respuesta: !nuevaCampaña.fechaProgramada ? Math.random() * 20 + 5 : undefined // Simulado
            };

            setCampañas(prev => [nuevaCampañaObj, ...prev]);

            // Resetear formulario
            setNuevaCampaña({
                titulo: '',
                tipo: 'email',
                mensaje: '',
                asunto: '',
                destinatarios: [],
                filtroDestinatarios: 'todos',
                fechaProgramada: '',
                horaEnvio: '09:00'
            });

            setModalNuevaCampaña(false);
            alert(`✅ Campaña ${nuevaCampañaObj.estado === 'programada' ? 'programada' : 'enviada'} exitosamente a ${destinatariosFiltrados.length} usuarios`);

        } catch (error) {
            console.error('❌ [COMUNICACIÓN] Error enviando campaña:', error);
            alert('❌ Error al enviar la campaña');
        }
    }

    function obtenerIconoTipo(tipo: string) {
        switch (tipo) {
            case 'email': return <Mail size={16} />;
            case 'whatsapp': return <MessageCircle size={16} />;
            case 'notificacion': return <Bell size={16} />;
            default: return <Mail size={16} />;
        }
    }

    function obtenerColorEstado(estado: string): string {
        switch (estado) {
            case 'enviada': return '#10b981';
            case 'programada': return '#f59e0b';
            case 'borrador': return '#6b7280';
            default: return '#6b7280';
        }
    }

    function formatearFecha(fecha: string): string {
        return new Date(fecha).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function exportarListaUsuarios() {
        const usuariosFiltrados = filtrarUsuarios();
        const csv = ['Nombre,Email,WhatsApp,Estado,Días Registro']
            .concat(usuariosFiltrados.map(u =>
                `"${u.nombre_completo}", "${u.correo_electronico}", "${u.whatsapp || 'N/A'}", "${u.estado}", ${u.dias_registro} `
            ))
            .join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usuarios_comunicacion_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    return (
        <div className="pc-container">
            <div className="pc-header">
                <div className="pc-header-content">
                    <div className="pc-header-text">
                        <h2>📢 Comunicaciones</h2>
                        <p>Gestiona emails, WhatsApp y notificaciones para tus estudiantes</p>
                    </div>
                    <button className="pc-btn-new-campaign" onClick={() => setModalNuevaCampaña(true)}>
                        <Plus size={16} />
                        Nueva Campaña
                    </button>
                </div>
            </div>

            {/* ESTADÍSTICAS DE COMUNICACIÓN */}
            <div className="pc-stats-grid">
                <div className="pc-stat-card">
                    <TrendingUp className="pc-stat-icon" style={{ color: '#a78bfa' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.totalCampañas}</div>
                        <div className="pc-stat-label">Total Campañas</div>
                    </div>
                </div>

                <div className="pc-stat-card">
                    <Mail className="pc-stat-icon" style={{ color: '#3b82f6' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.emailsEnviados}</div>
                        <div className="pc-stat-label">Emails Enviados</div>
                    </div>
                </div>

                <div className="pc-stat-card">
                    <MessageCircle className="pc-stat-icon" style={{ color: '#22c55e' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.whatsappsEnviados}</div>
                        <div className="pc-stat-label">WhatsApps Enviados</div>
                    </div>
                </div>

                <div className="pc-stat-card">
                    <Bell className="pc-stat-icon" style={{ color: '#f59e0b' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.notificacionesEnviadas}</div>
                        <div className="pc-stat-label">Notificaciones</div>
                    </div>
                </div>

                <div className="pc-stat-card">
                    <Eye className="pc-stat-icon" style={{ color: '#60a5fa' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.tasaAperturaPromedio.toFixed(1)}%</div>
                        <div className="pc-stat-label">Tasa Apertura</div>
                    </div>
                </div>

                <div className="pc-stat-card">
                    <MessageSquare className="pc-stat-icon" style={{ color: '#8b5cf6' }} />
                    <div className="pc-stat-info">
                        <div className="pc-stat-number">{estadisticasComunicacion.tasaRespuestaPromedio.toFixed(1)}%</div>
                        <div className="pc-stat-label">Tasa Respuesta</div>
                    </div>
                </div>
            </div>

            <div className="pc-content-grid">
                {/* LISTA DE CAMPAÑAS */}
                <div className="pc-campaigns-section">
                    <div className="pc-campaigns-header">
                        <h3>📋 Campañas Recientes</h3>
                        <button className="pc-btn-update" onClick={cargarDatosComunicacion} disabled={cargando}>
                            <RefreshCw size={14} className={cargando ? 'pc-spinning' : ''} style={{ marginRight: '0.5rem' }} />
                            Actualizar
                        </button>
                    </div>

                    {cargando ? (
                        <div className="pc-loading">
                            <div className="pc-spinner"></div>
                            <p>Cargando campañas...</p>
                        </div>
                    ) : campañas.length === 0 ? (
                        <div className="pc-empty-state">
                            📢 No hay campañas aún. ¡Crea tu primera campaña!
                        </div>
                    ) : (
                        <div className="pc-campaigns-list">
                            {campañas.map((campaña) => (
                                <div key={campaña.id} className="pc-campaign-card">
                                    <div className="pc-campaign-header">
                                        <div className="pc-campaign-title">
                                            {obtenerIconoTipo(campaña.tipo)} {campaña.titulo}
                                        </div>
                                        <div
                                            className="pc-campaign-status"
                                            style={{
                                                backgroundColor: `${obtenerColorEstado(campaña.estado)} 20`,
                                                color: obtenerColorEstado(campaña.estado)
                                            }}
                                        >
                                            {campaña.estado}
                                        </div>
                                    </div>

                                    <div className="pc-campaign-info">
                                        <div className="pc-info-item">
                                            <span className="pc-info-label">Destinatarios:</span>
                                            <span className="pc-info-value">{campaña.destinatarios}</span>
                                        </div>
                                        <div className="pc-info-item">
                                            <span className="pc-info-label">Creada:</span>
                                            <span className="pc-info-value">{formatearFecha(campaña.fecha_creacion)}</span>
                                        </div>
                                        {campaña.fecha_enviada && (
                                            <div className="pc-info-item">
                                                <span className="pc-info-label">Enviada:</span>
                                                <span className="pc-info-value">{formatearFecha(campaña.fecha_enviada)}</span>
                                            </div>
                                        )}
                                        {campaña.fecha_programada && (
                                            <div className="pc-info-item">
                                                <span className="pc-info-label">Programada:</span>
                                                <span className="pc-info-value">{formatearFecha(campaña.fecha_programada)}</span>
                                            </div>
                                        )}
                                    </div>

                                    {(campaña.tasa_apertura || campaña.tasa_respuesta) && (
                                        <div className="pc-campaign-metrics">
                                            {campaña.tasa_apertura && (
                                                <div className="pc-metric-item">
                                                    <span className="pc-metric-value">{campaña.tasa_apertura.toFixed(1)}%</span>
                                                    <span className="pc-metric-label">Apertura</span>
                                                </div>
                                            )}
                                            {campaña.tasa_respuesta && (
                                                <div className="pc-metric-item">
                                                    <span className="pc-metric-value">{campaña.tasa_respuesta.toFixed(1)}%</span>
                                                    <span className="pc-metric-label">Respuesta</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ACCIONES RÁPIDAS */}
                <div className="pc-actions-section">
                    <h3>⚡ Acciones Rápidas</h3>

                    <div className="pc-actions-list">
                        <button className="pc-action-card" onClick={() => setModalNuevaCampaña(true)}>
                            <Mail className="pc-action-icon" style={{ color: '#3b82f6' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">Email Masivo</div>
                                <div className="pc-action-desc">Enviar email a todos los estudiantes</div>
                            </div>
                        </button>

                        <button className="pc-action-card" onClick={() => {
                            setNuevaCampaña(prev => ({ ...prev, tipo: 'whatsapp' }));
                            setModalNuevaCampaña(true);
                        }}>
                            <MessageCircle className="pc-action-icon" style={{ color: '#22c55e' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">WhatsApp Masivo</div>
                                <div className="pc-action-desc">Enviar mensaje por WhatsApp</div>
                            </div>
                        </button>

                        <button className="pc-action-card" onClick={() => {
                            setNuevaCampaña(prev => ({ ...prev, filtroDestinatarios: 'inactivos' }));
                            setModalNuevaCampaña(true);
                        }}>
                            <Users className="pc-action-icon" style={{ color: '#f59e0b' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">Reactivar Inactivos</div>
                                <div className="pc-action-desc">Contactar usuarios inactivos</div>
                            </div>
                        </button>

                        <button className="pc-action-card" onClick={exportarListaUsuarios}>
                            <Download className="pc-action-icon" style={{ color: '#8b5cf6' }} />
                            <div className="pc-action-info">
                                <div className="pc-action-title">Exportar Contactos</div>
                                <div className="pc-action-desc">Descargar lista de usuarios</div>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL NUEVA CAMPAÑA */}
            {modalNuevaCampaña && (
                <div className="pc-modal-overlay" onClick={() => setModalNuevaCampaña(false)}>
                    <div className="pc-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="pc-modal-header">
                            <h3>📢 Nueva Campaña de Comunicación</h3>
                            <button className="pc-btn-close" onClick={() => setModalNuevaCampaña(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="pc-modal-body">
                            {/* CONFIGURACIÓN BÁSICA */}
                            <div className="pc-form-section">
                                <h4>📋 Configuración Básica</h4>

                                <div className="pc-form-group">
                                    <label htmlFor="titulo">Título de la Campaña</label>
                                    <input
                                        id="titulo"
                                        type="text"
                                        className="pc-form-control"
                                        value={nuevaCampaña.titulo}
                                        onChange={e => setNuevaCampaña({ ...nuevaCampaña, titulo: e.target.value })}
                                        placeholder="Ej: Bienvenida nuevos estudiantes"
                                    />
                                </div>

                                <div className="pc-form-group">
                                    <label htmlFor="tipo">Tipo de Comunicación</label>
                                    <select
                                        id="tipo"
                                        className="pc-form-control"
                                        value={nuevaCampaña.tipo}
                                        onChange={e => setNuevaCampaña({ ...nuevaCampaña, tipo: e.target.value as any })}
                                    >
                                        <option value="email">📧 Email</option>
                                        <option value="whatsapp">💬 WhatsApp</option>
                                        <option value="notificacion">🔔 Notificación</option>
                                    </select>
                                </div>

                                {nuevaCampaña.tipo === 'email' && (
                                    <div className="pc-form-group">
                                        <label htmlFor="asunto">Asunto del Email</label>
                                        <input
                                            id="asunto"
                                            type="text"
                                            className="pc-form-control"
                                            value={nuevaCampaña.asunto}
                                            onChange={e => setNuevaCampaña({ ...nuevaCampaña, asunto: e.target.value })}
                                            placeholder="Ej: ¡Bienvenido a Academia Vallenata!"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* DESTINATARIOS */}
                            <div className="pc-form-section">
                                <h4>👥 Destinatarios ({filtrarUsuarios().length} usuarios)</h4>

                                <div className="pc-form-group">
                                    <label htmlFor="filtro">Filtrar Destinatarios</label>
                                    <select
                                        id="filtro"
                                        className="pc-form-control"
                                        value={nuevaCampaña.filtroDestinatarios}
                                        onChange={e => setNuevaCampaña({ ...nuevaCampaña, filtroDestinatarios: e.target.value as any })}
                                    >
                                        <option value="todos">Todos los usuarios ({usuariosDisponibles.length})</option>
                                        <option value="activos">Solo usuarios activos ({usuariosDisponibles.filter(u => u.estado === 'activo').length})</option>
                                        <option value="inactivos">Solo usuarios inactivos ({usuariosDisponibles.filter(u => u.estado === 'inactivo').length})</option>
                                        <option value="nuevos">Usuarios nuevos (últimos 7 días) ({usuariosDisponibles.filter(u => u.dias_registro <= 7).length})</option>
                                    </select>
                                </div>
                            </div>

                            {/* PLANTILLAS */}
                            <div className="pc-form-section">
                                <h4>📝 Plantillas Rápidas</h4>
                                <div className="pc-templates-list">
                                    {nuevaCampaña.tipo === 'email' ? (
                                        plantillasEmail.map((plantilla, idx) => (
                                            <button key={idx} className="pc-btn-template" onClick={() => aplicarPlantilla(plantilla)}>
                                                {plantilla.nombre}
                                            </button>
                                        ))
                                    ) : nuevaCampaña.tipo === 'whatsapp' ? (
                                        plantillasWhatsApp.map((plantilla, idx) => (
                                            <button key={idx} className="pc-btn-template" onClick={() => aplicarPlantilla(plantilla)}>
                                                {plantilla.nombre}
                                            </button>
                                        ))
                                    ) : null}
                                </div>
                            </div>

                            {/* MENSAJE */}
                            <div className="pc-form-section">
                                <h4>✍️ Contenido del Mensaje</h4>
                                <div className="pc-form-group">
                                    <label htmlFor="mensaje">Mensaje</label>
                                    <textarea
                                        id="mensaje"
                                        className="pc-form-control"
                                        value={nuevaCampaña.mensaje}
                                        onChange={e => setNuevaCampaña({ ...nuevaCampaña, mensaje: e.target.value })}
                                        rows={8}
                                        placeholder="Escribe tu mensaje aquí... Puedes usar [NOMBRE] para personalizar"
                                    ></textarea>
                                    <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Variables disponibles: [NOMBRE], [CURSO], [PROGRESO], [LECCION]</small>
                                </div>
                            </div>

                            {/* PROGRAMACIÓN */}
                            <div className="pc-form-section">
                                <h4>⏰ Programación (Opcional)</h4>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div className="pc-form-group" style={{ flex: 1 }}>
                                        <label htmlFor="fecha">Fecha de Envío</label>
                                        <input
                                            id="fecha"
                                            type="date"
                                            className="pc-form-control"
                                            value={nuevaCampaña.fechaProgramada}
                                            onChange={e => setNuevaCampaña({ ...nuevaCampaña, fechaProgramada: e.target.value })}
                                        />
                                    </div>
                                    <div className="pc-form-group" style={{ flex: 1 }}>
                                        <label htmlFor="hora">Hora de Envío</label>
                                        <input
                                            id="hora"
                                            type="time"
                                            className="pc-form-control"
                                            value={nuevaCampaña.horaEnvio}
                                            onChange={e => setNuevaCampaña({ ...nuevaCampaña, horaEnvio: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <small style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Déjalo vacío para enviar inmediatamente</small>
                            </div>
                        </div>

                        <div className="pc-modal-footer">
                            <button className="pc-btn-cancel" onClick={() => setModalNuevaCampaña(false)}>
                                Cancelar
                            </button>
                            <button className="pc-btn-submit" onClick={enviarCampaña}>
                                {nuevaCampaña.fechaProgramada ? '⏰ Programar' : '🚀 Enviar Ahora'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PestanaComunicaciones;
