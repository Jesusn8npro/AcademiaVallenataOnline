import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
import {
    Rocket,
    Clock,
    Save,
    Database,
    PieChart,
    Download,
    Upload,
    Power,
    Trash2
} from 'lucide-react';
import './PestanaConfiguracion.css';

interface ConfiguracionSistema {
    nombreAcademia: string;
    emailContacto: string;
    whatsappContacto: string;
    mantenimientoActivo: boolean;
    registroAbierto: boolean;
    limiteUsuarios: number;
    duracionSesion: number;
    backupAutomatico: boolean;
    notificacionesEmail: boolean;
    modoDesarrollo: boolean;
}

const PestanaConfiguracion: React.FC = () => {
    const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>({
        nombreAcademia: 'Academia Vallenata Online',
        emailContacto: 'contacto@academiavallenata.com',
        whatsappContacto: '+57 300 123 4567',
        mantenimientoActivo: false,
        registroAbierto: true,
        limiteUsuarios: 1000,
        duracionSesion: 120, // minutos
        backupAutomatico: true,
        notificacionesEmail: true,
        modoDesarrollo: false
    });

    const [estadisticasSistema, setEstadisticasSistema] = useState({
        versionSistema: '2.1.0',
        tiempoOperacion: '0 días',
        ultimoBackup: 'Nunca',
        espacioUsado: 0,
        limiteBD: 1000
    });

    const [configuracionCambiada, setConfiguracionCambiada] = useState(false);
    const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);

    useEffect(() => {
        cargarConfiguracion();
        cargarEstadisticasSistema();
    }, []);

    const cargarConfiguracion = async () => {
        try {
            // Check localStorage first
            const storedConfig = localStorage.getItem('academia_config');
            if (storedConfig) {
                setConfiguracion(JSON.parse(storedConfig));
            }
            console.log('⚙️ [CONFIG] Configuración cargada');
        } catch (error) {
            console.error('❌ [CONFIG] Error cargando configuración:', error);
        }
    };

    const cargarEstadisticasSistema = async () => {
        try {
            const { count: totalUsuarios } = await supabase
                .from('perfiles')
                .select('*', { count: 'exact', head: true })
                .eq('eliminado', false);

            // Assuming sesiones_usuario table exists
            const { count: totalSesiones } = await supabase
                .from('sesiones_usuario')
                .select('*', { count: 'exact', head: true });

            const porcentajeUso = configuracion.limiteUsuarios > 0
                ? Math.round(((totalUsuarios || 0) / configuracion.limiteUsuarios) * 100)
                : 0;

            setEstadisticasSistema({
                versionSistema: '2.1.0',
                tiempoOperacion: '45 días', // Mocked as in Svelte
                ultimoBackup: 'Hace 2 horas', // Mocked as in Svelte
                espacioUsado: porcentajeUso,
                limiteBD: totalSesiones || 0
            });

        } catch (error) {
            console.error('❌ [ESTADÍSTICAS] Error:', error);
        }
    };

    const marcarCambio = () => {
        setConfiguracionCambiada(true);
    };

    const handleChange = (field: keyof ConfiguracionSistema, value: any) => {
        setConfiguracion(prev => ({ ...prev, [field]: value }));
        marcarCambio();
    };

    const guardarConfiguracion = async () => {
        try {
            setGuardandoConfiguracion(true);

            // Validaciones importantes
            if (configuracion.mantenimientoActivo) {
                if (!window.confirm('⚠️ ATENCIÓN: Vas a activar el modo mantenimiento.\n\nEsto bloqueará el acceso a todos los usuarios.\n¿Estás seguro?')) {
                    setConfiguracion(prev => ({ ...prev, mantenimientoActivo: false }));
                    setGuardandoConfiguracion(false);
                    return; // Important to return here
                }
            }

            if (configuracion.limiteUsuarios < 10) {
                alert('⚠️ El límite de usuarios debe ser al menos 10');
                setGuardandoConfiguracion(false);
                return;
            }

            // Simular guardado
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Guardar en localStorage
            localStorage.setItem('academia_config', JSON.stringify(configuracion));

            console.log('✅ [CONFIG] Configuración guardada:', configuracion);
            setConfiguracionCambiada(false);
            setGuardandoConfiguracion(false); // Ensure this is set to false

            // Aplicar cambios inmediatos
            if (configuracion.mantenimientoActivo) {
                console.log('🔧 [MANTENIMIENTO] Modo activado');
            }

            alert('✅ Configuración guardada exitosamente\n\n' +
                (configuracion.mantenimientoActivo ? '🔧 Modo mantenimiento ACTIVADO\n' : '') +
                (configuracion.registroAbierto ? '✅ Registro abierto\n' : '❌ Registro cerrado\n') +
                `👥 Límite usuarios: ${configuracion.limiteUsuarios}\n` +
                `⏱️ Duración sesión: ${configuracion.duracionSesion} min`);

        } catch (error: any) {
            console.error('❌ [CONFIG] Error guardando:', error);
            alert('❌ Error al guardar la configuración: ' + error.message);
            setGuardandoConfiguracion(false);
        }
    };

    const ejecutarBackupManual = async () => {
        try {
            console.log('💾 [BACKUP] Iniciando backup manual...');

            // Simular proceso
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Generar JSON
            const backupData = {
                fecha: new Date().toISOString(),
                configuracion: configuracion,
                estadisticas: estadisticasSistema,
                version: '2.1.0',
                metadata: {
                    generado_por: 'Panel Administración',
                    tipo: 'backup_manual'
                }
            };

            const backupJson = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupJson], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'academia_backup_' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            window.URL.revokeObjectURL(url);

            setEstadisticasSistema(prev => ({ ...prev, ultimoBackup: 'Ahora mismo' }));
            alert('✅ Backup descargado exitosamente como JSON');

        } catch (error) {
            console.error('❌ [BACKUP] Error:', error);
            alert('❌ Error durante el backup');
        }
    };

    const limpiarCacheSistema = async () => {
        try {
            console.log('🗑️ [CACHÉ] Limpiando caché del sistema...');

            if ('caches' in window) {
                const cacheNames = await caches.keys();
                const deletePromises = cacheNames.map(name => caches.delete(name));
                await Promise.all(deletePromises);
                console.log(`🗑️ [CACHÉ] ${cacheNames.length} cachés eliminados`);
            }

            if (window.confirm('¿También deseas limpiar datos locales del navegador?')) {
                localStorage.clear();
                sessionStorage.clear();
                console.log('🗑️ [CACHÉ] Storage local limpiado');
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('✅ Caché del sistema limpiado exitosamente');

        } catch (error: any) {
            console.error('❌ [CACHÉ] Error:', error);
            alert('❌ Error al limpiar caché: ' + error.message);
        }
    };

    const exportarConfiguracion = () => {
        const configJson = JSON.stringify(configuracion, null, 2);
        const blob = new Blob([configJson], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'configuracion_academia_' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const importarConfiguracion = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event: any) => {
                    try {
                        const nuevaConfig = JSON.parse(event.target.result);
                        setConfiguracion(prev => ({ ...prev, ...nuevaConfig }));
                        setConfiguracionCambiada(true);
                        alert('Configuración importada exitosamente');
                    } catch (error) {
                        alert('Error al importar configuración: archivo inválido');
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    };

    const reiniciarSistema = async () => {
        if (!window.confirm('⚠️ ATENCIÓN: Vas a reiniciar el sistema.\n\nEsto puede interrumpir las sesiones activas de usuarios.\n¿Estás seguro?')) {
            return;
        }

        try {
            console.log('🔄 [SISTEMA] Iniciando reinicio...');
            alert('🔄 Iniciando reinicio del sistema...\n\nEsto puede tomar unos momentos.');

            await new Promise(resolve => setTimeout(resolve, 2000));
            sessionStorage.clear();

            alert('✅ Sistema reiniciado exitosamente\n\nLa página se recargará automáticamente.');

            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error('❌ [SISTEMA] Error en reinicio:', error);
            alert('❌ Error durante el reinicio del sistema');
        }
    };

    return (
        <div className="pcfg-container">
            <div className="pcfg-header">
                <h2>⚙️ Configuración del Sistema</h2>
                <p>Parámetros generales y configuración de la academia</p>
            </div>

            {/* ESTADO DEL SISTEMA */}
            <div className="pcfg-status-grid">
                <div className="pcfg-status-card">
                    <Rocket className="pcfg-status-icon" style={{ color: '#8b5cf6' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">v{estadisticasSistema.versionSistema}</div>
                        <div className="pcfg-status-label">Versión Sistema</div>
                    </div>
                </div>
                <div className="pcfg-status-card">
                    <Clock className="pcfg-status-icon" style={{ color: '#3b82f6' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">{estadisticasSistema.tiempoOperacion}</div>
                        <div className="pcfg-status-label">Tiempo Operación</div>
                    </div>
                </div>
                <div className="pcfg-status-card">
                    <Save className="pcfg-status-icon" style={{ color: '#10b981' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">{estadisticasSistema.ultimoBackup}</div>
                        <div className="pcfg-status-label">Último Backup</div>
                    </div>
                </div>
                <div className="pcfg-status-card">
                    <Database className="pcfg-status-icon" style={{ color: '#f59e0b' }} />
                    <div className="pcfg-status-info">
                        <div className="pcfg-status-value">{estadisticasSistema.espacioUsado}%</div>
                        <div className="pcfg-status-label">Uso del Sistema</div>
                    </div>
                </div>
            </div>

            <div className="pcfg-content-grid">
                {/* CONFIGURACIÓN GENERAL */}
                <div className="pcfg-general-section">
                    <div className="pcfg-section-header">
                        <h3>🏫 Configuración General</h3>
                        <div className="pcfg-actions-group">
                            <button className="pcfg-btn-action" onClick={exportarConfiguracion}>
                                <Download size={14} style={{ marginRight: '0.5rem' }} />
                                Exportar
                            </button>
                            <button className="pcfg-btn-action" onClick={importarConfiguracion}>
                                <Upload size={14} style={{ marginRight: '0.5rem' }} />
                                Importar
                            </button>
                            <button
                                className={`pcfg-btn-save ${configuracionCambiada ? 'pcfg-changed' : ''}`}
                                disabled={!configuracionCambiada || guardandoConfiguracion}
                                onClick={guardarConfiguracion}
                            >
                                <Save size={14} className={guardandoConfiguracion ? 'pcfg-spin' : ''} style={{ marginRight: '0.5rem' }} />
                                {guardandoConfiguracion ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                    <div className="pcfg-form">
                        {/* INFORMACIÓN BÁSICA */}
                        <div className="pcfg-form-group">
                            <h4>📋 Información Básica</h4>

                            <div className="pcfg-input-group">
                                <label htmlFor="nombreAcademia">Nombre de la Academia</label>
                                <input
                                    id="nombreAcademia"
                                    type="text"
                                    className="pcfg-input"
                                    value={configuracion.nombreAcademia}
                                    onChange={(e) => handleChange('nombreAcademia', e.target.value)}
                                    placeholder="Academia Vallenata Online"
                                />
                            </div>

                            <div className="pcfg-input-group">
                                <label htmlFor="emailContacto">Email de Contacto</label>
                                <input
                                    id="emailContacto"
                                    type="email"
                                    className="pcfg-input"
                                    value={configuracion.emailContacto}
                                    onChange={(e) => handleChange('emailContacto', e.target.value)}
                                    placeholder="contacto@academiavallenata.com"
                                />
                            </div>

                            <div className="pcfg-input-group">
                                <label htmlFor="whatsappContacto">WhatsApp de Contacto</label>
                                <input
                                    id="whatsappContacto"
                                    type="text"
                                    className="pcfg-input"
                                    value={configuracion.whatsappContacto}
                                    onChange={(e) => handleChange('whatsappContacto', e.target.value)}
                                    placeholder="+57 300 123 4567"
                                />
                            </div>
                        </div>

                        {/* CONFIGURACIÓN DEL SISTEMA */}
                        <div className="pcfg-form-group">
                            <h4>⚙️ Sistema</h4>

                            <div className="pcfg-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={configuracion.mantenimientoActivo}
                                        onChange={(e) => handleChange('mantenimientoActivo', e.target.checked)}
                                    />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Modo Mantenimiento</span>
                                </label>
                                <p className="pcfg-toggle-desc">Bloquea el acceso temporal al sitio</p>
                            </div>

                            <div className="pcfg-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={configuracion.registroAbierto}
                                        onChange={(e) => handleChange('registroAbierto', e.target.checked)}
                                    />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Registro Abierto</span>
                                </label>
                                <p className="pcfg-toggle-desc">Permite nuevos registros de usuarios</p>
                            </div>

                            <div className="pcfg-input-group">
                                <label htmlFor="limiteUsuarios">Límite de Usuarios</label>
                                <input
                                    id="limiteUsuarios"
                                    type="number"
                                    className="pcfg-input"
                                    value={configuracion.limiteUsuarios}
                                    onChange={(e) => handleChange('limiteUsuarios', parseInt(e.target.value))}
                                    min={10}
                                    max={10000}
                                />
                            </div>

                            <div className="pcfg-input-group">
                                <label htmlFor="duracionSesion">Duración de Sesión (minutos)</label>
                                <input
                                    id="duracionSesion"
                                    type="number"
                                    className="pcfg-input"
                                    value={configuracion.duracionSesion}
                                    onChange={(e) => handleChange('duracionSesion', parseInt(e.target.value))}
                                    min={30}
                                    max={480}
                                />
                            </div>
                        </div>

                        {/* CONFIGURACIÓN AVANZADA */}
                        <div className="pcfg-form-group">
                            <h4>🔧 Configuración Avanzada</h4>

                            <div className="pcfg-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={configuracion.backupAutomatico}
                                        onChange={(e) => handleChange('backupAutomatico', e.target.checked)}
                                    />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Backup Automático</span>
                                </label>
                                <p className="pcfg-toggle-desc">Backup diario automático de datos</p>
                            </div>

                            <div className="pcfg-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={configuracion.notificacionesEmail}
                                        onChange={(e) => handleChange('notificacionesEmail', e.target.checked)}
                                    />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Notificaciones Email</span>
                                </label>
                                <p className="pcfg-toggle-desc">Envío automático de notificaciones</p>
                            </div>

                            <div className="pcfg-toggle">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={configuracion.modoDesarrollo}
                                        onChange={(e) => handleChange('modoDesarrollo', e.target.checked)}
                                    />
                                    <span className="pcfg-toggle-slider"></span>
                                    <span>Modo Desarrollo</span>
                                </label>
                                <p className="pcfg-toggle-desc">Habilita logs detallados</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HERRAMIENTAS DEL SISTEMA */}
                <div className="pcfg-tools-section">
                    <h3>🔧 Herramientas del Sistema</h3>

                    <div className="pcfg-tools-list">
                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">💾 Backup Manual</div>
                                <div className="pcfg-tool-desc">Crear respaldo de la base de datos</div>
                            </div>
                            <button className="pcfg-btn-tool" onClick={ejecutarBackupManual}>
                                <Database size={14} style={{ marginRight: '0.5rem' }} />
                                Ejecutar Backup
                            </button>
                        </div>

                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">🗑️ Limpiar Caché</div>
                                <div className="pcfg-tool-desc">Eliminar archivos temporales del sistema</div>
                            </div>
                            <button className="pcfg-btn-tool" onClick={limpiarCacheSistema}>
                                <Trash2 size={14} style={{ marginRight: '0.5rem' }} />
                                Limpiar Caché
                            </button>
                        </div>

                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">📊 Estadísticas DB</div>
                                <div className="pcfg-tool-desc">Ver uso detallado de la base de datos</div>
                            </div>
                            <button className="pcfg-btn-tool" onClick={() => alert('Próximamente')}>
                                <PieChart size={14} style={{ marginRight: '0.5rem' }} />
                                Ver Estadísticas
                            </button>
                        </div>

                        <div className="pcfg-tool-item">
                            <div className="pcfg-tool-info">
                                <div className="pcfg-tool-title">🔄 Reiniciar Sistema</div>
                                <div className="pcfg-tool-desc">Reinicio suave del sistema</div>
                            </div>
                            <button className="pcfg-btn-tool restart" onClick={reiniciarSistema}>
                                <Power size={14} style={{ marginRight: '0.5rem' }} />
                                Reiniciar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PestanaConfiguracion;
