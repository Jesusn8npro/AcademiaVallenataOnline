import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    crearNotificacion,
    notificarNuevoCurso,
    notificarNuevoTutorial,
    notificarPagoAprobado,
    notificarPromocionEspecial,
    limpiarNotificacionesExpiradas,
    obtenerEstadisticasNotificaciones,
    type TipoEvento
} from '../../../servicios/generadorNotificaciones';
import './AdminNotificaciones.css';

const AdminNotificaciones: React.FC = () => {
    // Estado
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [tipoMensaje, setTipoMensaje] = useState<'exito' | 'error'>('exito');
    const [estadisticas, setEstadisticas] = useState<any>(null);

    // Formulario de notificación manual
    const [formManual, setFormManual] = useState({
        tipo: 'nuevo_curso' as TipoEvento,
        mensaje: '',
        url_accion: '',
        usuario_id: '',
        prioridad: 'normal'
    });

    // Formularios de prueba
    const [formCurso, setFormCurso] = useState({
        titulo: '',
        descripcion: ''
    });

    const [formTutorial, setFormTutorial] = useState({
        titulo: '',
        descripcion: ''
    });

    const [formPago, setFormPago] = useState<{
        usuario_id: string;
        monto: number;
        curso_titulo?: string;
    }>({
        usuario_id: '',
        monto: 0,
        curso_titulo: ''
    });

    const [formPromocion, setFormPromocion] = useState<{
        titulo: string;
        descripcion: string;
        codigo: string;
        fecha_limite: string;
    }>({
        titulo: '',
        descripcion: '',
        codigo: '',
        fecha_limite: ''
    });

    useEffect(() => {
        cargarEstadisticas();
    }, []);

    const cargarEstadisticas = async () => {
        const { exito, estadisticas: stats } = await obtenerEstadisticasNotificaciones();
        if (exito) {
            setEstadisticas(stats);
        }
    };

    const mostrarMensaje = (texto: string, tipo: 'exito' | 'error') => {
        setMensaje(texto);
        setTipoMensaje(tipo);
        setTimeout(() => setMensaje(''), 5000);
    };

    // Notificación manual
    const enviarNotificacionManual = async () => {
        if (!formManual.mensaje.trim()) {
            mostrarMensaje('El mensaje es requerido', 'error');
            return;
        }

        setCargando(true);

        const resultado = await crearNotificacion({
            tipo: formManual.tipo,
            mensaje: formManual.mensaje,
            url_accion: formManual.url_accion || undefined,
            usuario_id: formManual.usuario_id || undefined,
            datos_adicionales: { manual: true }
        });

        if (resultado.exito) {
            mostrarMensaje(`✅ Notificación enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
            setFormManual(prev => ({ ...prev, mensaje: '', url_accion: '', usuario_id: '' }));
            await cargarEstadisticas();
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }

        setCargando(false);
    };

    // Prueba: Nuevo curso
    const probarNuevoCurso = async () => {
        if (!formCurso.titulo.trim()) {
            mostrarMensaje('El título del curso es requerido', 'error');
            return;
        }

        setCargando(true);

        const resultado = await notificarNuevoCurso({
            curso_id: 'curso-demo-' + Date.now(),
            titulo_curso: formCurso.titulo,
            descripcion_curso: formCurso.descripcion || 'Curso de demostración',
            creador_id: 'admin-demo'
        });

        if (resultado.exito) {
            mostrarMensaje(`✅ Notificación de curso enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
            setFormCurso({ titulo: '', descripcion: '' });
            await cargarEstadisticas();
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }

        setCargando(false);
    };

    // Prueba: Nuevo tutorial
    const probarNuevoTutorial = async () => {
        if (!formTutorial.titulo.trim()) {
            mostrarMensaje('El título del tutorial es requerido', 'error');
            return;
        }

        setCargando(true);

        const resultado = await notificarNuevoTutorial({
            tutorial_id: 'tutorial-demo-' + Date.now(),
            titulo_tutorial: formTutorial.titulo,
            descripcion_tutorial: formTutorial.descripcion || 'Tutorial de demostración',
            creador_id: 'admin-demo'
        });

        if (resultado.exito) {
            mostrarMensaje(`✅ Notificación de tutorial enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
            setFormTutorial({ titulo: '', descripcion: '' });
            await cargarEstadisticas();
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }

        setCargando(false);
    };

    // Prueba: Pago aprobado
    const probarPagoAprobado = async () => {
        if (!formPago.usuario_id.trim() || formPago.monto <= 0) {
            mostrarMensaje('Usuario ID y monto son requeridos', 'error');
            return;
        }

        setCargando(true);

        const resultado = await notificarPagoAprobado({
            usuario_id: formPago.usuario_id,
            transaccion_id: 'txn-demo-' + Date.now(),
            monto: formPago.monto,
            curso_titulo: formPago.curso_titulo || undefined
        });

        if (resultado.exito) {
            mostrarMensaje(`✅ Notificación de pago enviada`, 'exito');
            setFormPago({ usuario_id: '', monto: 0, curso_titulo: '' });
            await cargarEstadisticas();
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }

        setCargando(false);
    };

    // Prueba: Promoción especial
    const probarPromocionEspecial = async () => {
        if (!formPromocion.titulo.trim()) {
            mostrarMensaje('El título de la promoción es requerido', 'error');
            return;
        }

        setCargando(true);

        const resultado = await notificarPromocionEspecial({
            titulo_promocion: formPromocion.titulo,
            descripcion: formPromocion.descripcion || 'Promoción especial de demostración',
            codigo_descuento: formPromocion.codigo || undefined,
            fecha_limite: formPromocion.fecha_limite || undefined
        });

        if (resultado.exito) {
            mostrarMensaje(`✅ Promoción enviada a ${resultado.notificaciones_creadas} usuarios`, 'exito');
            setFormPromocion({ titulo: '', descripcion: '', codigo: '', fecha_limite: '' });
            await cargarEstadisticas();
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }

        setCargando(false);
    };

    // Limpiar notificaciones expiradas
    const limpiarExpiradas = async () => {
        if (!window.confirm('¿Estás seguro de eliminar todas las notificaciones expiradas?')) {
            return;
        }

        setCargando(true);

        const resultado = await limpiarNotificacionesExpiradas();

        if (resultado.exito) {
            mostrarMensaje(`🧹 ${resultado.eliminadas} notificaciones expiradas eliminadas`, 'exito');
            await cargarEstadisticas();
        } else {
            mostrarMensaje(`❌ Error: ${resultado.error}`, 'error');
        }

        setCargando(false);
    };

    return (
        <div className="academia-panel-notificaciones">
            <div className="academia-header-panel">
                <h1>
                    <span className="academia-icono">🔔</span>
                    Panel de Gestión de Notificaciones
                </h1>
                <p className="academia-descripcion">Gestiona y prueba el sistema de notificaciones de la plataforma</p>
            </div>

            {/* Mensaje de estado */}
            {mensaje && (
                <div className={`academia-mensaje-panel academia-${tipoMensaje}`}>
                    {mensaje}
                </div>
            )}

            {/* Estadísticas */}
            {estadisticas && (
                <div className="academia-seccion-estadisticas">
                    <h2>📊 Estadísticas de Notificaciones</h2>
                    <div className="academia-stats-grid">
                        <div className="academia-stat-card">
                            <div className="academia-numero">{estadisticas.total}</div>
                            <div className="academia-label">Total</div>
                        </div>
                        <div className="academia-stat-card">
                            <div className="academia-numero">{estadisticas.no_leidas}</div>
                            <div className="academia-label">Sin leer</div>
                        </div>
                        <div className="academia-stat-card">
                            <div className="academia-numero">{estadisticas.leidas}</div>
                            <div className="academia-label">Leídas</div>
                        </div>
                        <div className="academia-stat-card">
                            <div className="academia-numero">{estadisticas.ultimos_30_dias}</div>
                            <div className="academia-label">Últimos 30 días</div>
                        </div>
                    </div>

                    <div className="academia-stats-details">
                        <div className="academia-stat-section">
                            <h3>Por Categoría</h3>
                            {Object.entries(estadisticas.por_categoria).map(([categoria, cantidad]) => (
                                <div key={categoria} className="academia-stat-item">
                                    <span>{categoria}</span>
                                    <span>{cantidad as React.ReactNode}</span>
                                </div>
                            ))}
                        </div>

                        <div className="academia-stat-section">
                            <h3>Por Prioridad</h3>
                            {Object.entries(estadisticas.por_prioridad).map(([prioridad, cantidad]) => (
                                <div key={prioridad} className="academia-stat-item">
                                    <span>{prioridad}</span>
                                    <span>{cantidad as React.ReactNode}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="academia-contenido-panel">
                {/* Notificación Manual */}
                <div className="academia-seccion">
                    <h2>✍️ Crear Notificación Manual</h2>
                    <div className="academia-formulario">
                        <div className="academia-campo">
                            <label htmlFor="tipo">Tipo de Notificación:</label>
                            <select
                                id="tipo"
                                value={formManual.tipo}
                                onChange={(e) => setFormManual({ ...formManual, tipo: e.target.value as TipoEvento })}
                            >
                                <option value="nuevo_curso">🎓 Nuevo Curso</option>
                                <option value="nuevo_tutorial">📹 Nuevo Tutorial</option>
                                <option value="nueva_actualizacion_plataforma">🚀 Actualización</option>
                                <option value="promocion_especial">🎁 Promoción</option>
                                <option value="bienvenida_usuario">👋 Bienvenida</option>
                            </select>
                        </div>

                        <div className="academia-campo">
                            <label htmlFor="mensaje">Mensaje:</label>
                            <textarea
                                id="mensaje"
                                value={formManual.mensaje}
                                onChange={(e) => setFormManual({ ...formManual, mensaje: e.target.value })}
                                placeholder="Escribe el mensaje de la notificación..."
                                rows={3}
                            ></textarea>
                        </div>

                        <div className="academia-campo">
                            <label htmlFor="url">URL de Acción (opcional):</label>
                            <input
                                id="url"
                                type="text"
                                value={formManual.url_accion}
                                onChange={(e) => setFormManual({ ...formManual, url_accion: e.target.value })}
                                placeholder="/cursos, /blog/articulo-1, etc."
                            />
                        </div>

                        <div className="academia-campo">
                            <label htmlFor="usuario">Usuario ID específico (opcional):</label>
                            <input
                                id="usuario"
                                type="text"
                                value={formManual.usuario_id}
                                onChange={(e) => setFormManual({ ...formManual, usuario_id: e.target.value })}
                                placeholder="Dejar vacío para enviar a todos"
                            />
                        </div>

                        <button
                            className="academia-boton-enviar"
                            onClick={enviarNotificacionManual}
                            disabled={cargando}
                        >
                            {cargando ? '⏳ Enviando...' : '📤 Enviar Notificación'}
                        </button>
                    </div>
                </div>

                {/* Pruebas Automáticas */}
                <div className="academia-seccion">
                    <h2>🧪 Pruebas de Notificaciones Automáticas</h2>

                    <div className="academia-pruebas-grid">
                        {/* Nuevo Curso */}
                        <div className="academia-prueba-card">
                            <h3>🎓 Nuevo Curso</h3>
                            <div className="academia-formulario-mini">
                                <input
                                    type="text"
                                    value={formCurso.titulo}
                                    onChange={(e) => setFormCurso({ ...formCurso, titulo: e.target.value })}
                                    placeholder="Título del curso"
                                />
                                <input
                                    type="text"
                                    value={formCurso.descripcion}
                                    onChange={(e) => setFormCurso({ ...formCurso, descripcion: e.target.value })}
                                    placeholder="Descripción"
                                />
                                <button
                                    className="academia-boton-prueba"
                                    onClick={probarNuevoCurso}
                                    disabled={cargando}
                                >
                                    Probar
                                </button>
                            </div>
                        </div>

                        {/* Nuevo Tutorial */}
                        <div className="academia-prueba-card">
                            <h3>📹 Nuevo Tutorial</h3>
                            <div className="academia-formulario-mini">
                                <input
                                    type="text"
                                    value={formTutorial.titulo}
                                    onChange={(e) => setFormTutorial({ ...formTutorial, titulo: e.target.value })}
                                    placeholder="Título del tutorial"
                                />
                                <input
                                    type="text"
                                    value={formTutorial.descripcion}
                                    onChange={(e) => setFormTutorial({ ...formTutorial, descripcion: e.target.value })}
                                    placeholder="Descripción"
                                />
                                <button
                                    className="academia-boton-prueba"
                                    onClick={probarNuevoTutorial}
                                    disabled={cargando}
                                >
                                    Probar
                                </button>
                            </div>
                        </div>

                        {/* Pago Aprobado */}
                        <div className="academia-prueba-card">
                            <h3>✅ Pago Aprobado</h3>
                            <div className="academia-formulario-mini">
                                <input
                                    type="text"
                                    value={formPago.usuario_id}
                                    onChange={(e) => setFormPago({ ...formPago, usuario_id: e.target.value })}
                                    placeholder="ID del usuario"
                                />
                                <input
                                    type="number"
                                    value={formPago.monto}
                                    onChange={(e) => setFormPago({ ...formPago, monto: Number(e.target.value) })}
                                    placeholder="Monto"
                                />
                                <input
                                    type="text"
                                    value={formPago.curso_titulo}
                                    onChange={(e) => setFormPago({ ...formPago, curso_titulo: e.target.value })}
                                    placeholder="Título del curso (opcional)"
                                />
                                <button
                                    className="academia-boton-prueba"
                                    onClick={probarPagoAprobado}
                                    disabled={cargando}
                                >
                                    Probar
                                </button>
                            </div>
                        </div>

                        {/* Promoción Especial */}
                        <div className="academia-prueba-card">
                            <h3>🎁 Promoción Especial</h3>
                            <div className="academia-formulario-mini">
                                <input
                                    type="text"
                                    value={formPromocion.titulo}
                                    onChange={(e) => setFormPromocion({ ...formPromocion, titulo: e.target.value })}
                                    placeholder="Título de la promoción"
                                />
                                <input
                                    type="text"
                                    value={formPromocion.descripcion}
                                    onChange={(e) => setFormPromocion({ ...formPromocion, descripcion: e.target.value })}
                                    placeholder="Descripción"
                                />
                                <input
                                    type="text"
                                    value={formPromocion.codigo}
                                    onChange={(e) => setFormPromocion({ ...formPromocion, codigo: e.target.value })}
                                    placeholder="Código de descuento"
                                />
                                <input
                                    type="date"
                                    value={formPromocion.fecha_limite}
                                    onChange={(e) => setFormPromocion({ ...formPromocion, fecha_limite: e.target.value })}
                                />
                                <button
                                    className="academia-boton-prueba"
                                    onClick={probarPromocionEspecial}
                                    disabled={cargando}
                                >
                                    Probar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Herramientas de Gestión */}
                <div className="academia-seccion">
                    <h2>🛠️ Herramientas de Gestión</h2>
                    <div className="academia-herramientas">
                        <button
                            className="academia-boton-herramienta academia-limpiar"
                            onClick={limpiarExpiradas}
                            disabled={cargando}
                        >
                            🧹 Limpiar Notificaciones Expiradas
                        </button>

                        <button
                            className="academia-boton-herramienta academia-actualizar"
                            onClick={cargarEstadisticas}
                            disabled={cargando}
                        >
                            🔄 Actualizar Estadísticas
                        </button>

                        <Link to="/notificaciones" className="academia-boton-herramienta academia-ver">
                            👀 Ver Mis Notificaciones
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNotificaciones;
