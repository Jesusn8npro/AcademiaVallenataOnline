import React, { useState, useEffect } from 'react';
import { servicioSeguridad } from '../../../../servicios/servicioSeguridad';
import { RefreshCw, Clock, Shield, Users, MapPin, Activity, Globe } from 'lucide-react';
import './AlertasSeguridad.css';

const AlertasSeguridadGeografica: React.FC = () => {
    const [cargando, setCargando] = useState(true);
    const [ultimaActualizacion, setUltimaActualizacion] = useState<Date | null>(null);
    const [alertas, setAlertas] = useState<{
        cuentasCompartidas: any[];
        cambiosSospechosos: any[];
        conexionesSospechosas: any[];
    }>({
        cuentasCompartidas: [],
        cambiosSospechosos: [],
        conexionesSospechosas: []
    });

    useEffect(() => {
        cargarAlertas();
        const interval = setInterval(cargarAlertas, 2 * 60 * 1000); // 2 min
        return () => clearInterval(interval);
    }, []);

    const cargarAlertas = async () => {
        try {
            setCargando(true);
            const [cuentas, cambios, conexiones] = await Promise.all([
                servicioSeguridad.detectarCuentasCompartidas(),
                servicioSeguridad.detectarCambiosUbicacionSospechosos(),
                servicioSeguridad.detectarDatacentersYProxies()
            ]);

            setAlertas({
                cuentasCompartidas: cuentas,
                cambiosSospechosos: cambios,
                conexionesSospechosas: conexiones
            });
            setUltimaActualizacion(new Date());
        } catch (error) {
            console.error(error);
        } finally {
            setCargando(false);
        }
    };

    const totalAlertas = alertas.cuentasCompartidas.length + alertas.cambiosSospechosos.length + alertas.conexionesSospechosas.length;
    const alertasCriticas = [...alertas.cuentasCompartidas, ...alertas.cambiosSospechosos, ...alertas.conexionesSospechosas]
        .filter(a => a.nivel_riesgo === 'CRITICO' || a.nivel_riesgo === 'ALTO').length;

    const obtenerColorRiesgo = (nivel: string) => {
        switch (nivel) {
            case 'CRITICO': return '#dc2626';
            case 'ALTO': return '#ea580c';
            case 'MEDIO': return '#d97706';
            default: return '#16a34a';
        }
    };

    return (
        <div className="alertas-seguridad-widget">
            <div className="widget-header-alertas">
                <div className="titulo-seccion">
                    <h3>🚨 Alertas de Seguridad Geográfica</h3>
                    <div className="badges-resumen">
                        <div className={`badge-alerta total ${totalAlertas > 0 ? 'activo' : ''}`}>
                            {totalAlertas} alertas
                        </div>
                        {alertasCriticas > 0 && (
                            <div className="badge-alerta critico">
                                {alertasCriticas} críticas
                            </div>
                        )}
                    </div>
                </div>
                <button className="btn-actualizar-alertas" onClick={cargarAlertas} disabled={cargando}>
                    <RefreshCw size={16} className={cargando ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {ultimaActualizacion && (
                <div className="ultima-actualizacion-bar">
                    <Clock size={14} />
                    <span>Última actualización: {ultimaActualizacion.toLocaleTimeString()}</span>
                </div>
            )}

            <div className="alertas-contenido">
                {cargando && !ultimaActualizacion ? (
                    <div className="loading-state">
                        <div className="spinner-widget"></div>
                        <p>Analizando seguridad geográfica...</p>
                    </div>
                ) : totalAlertas === 0 ? (
                    <div className="no-alertas">
                        <Shield size={48} color="#10b981" />
                        <h4>✅ Todo seguro</h4>
                        <p>No se han detectado alertas de seguridad geográfica</p>
                    </div>
                ) : (
                    <>
                        {/* CUENTAS COMPARTIDAS */}
                        {alertas.cuentasCompartidas.length > 0 && (
                            <div className="seccion-alertas">
                                <h4><Users size={18} /> Cuentas Compartidas Detectadas ({alertas.cuentasCompartidas.length})</h4>
                                {alertas.cuentasCompartidas.map((cuenta, idx) => (
                                    <div key={idx} className="alerta-item" style={{ borderLeftColor: obtenerColorRiesgo(cuenta.nivel_riesgo) }}>
                                        <div className="alerta-header">
                                            <div className="usuario-info-alerta">
                                                <strong>{cuenta.usuario?.nombre} {cuenta.usuario?.apellido}</strong>
                                                <span className="email">{cuenta.usuario?.email}</span>
                                            </div>
                                            <div className="riesgo-badge" style={{ backgroundColor: obtenerColorRiesgo(cuenta.nivel_riesgo) }}>
                                                {cuenta.nivel_riesgo}
                                            </div>
                                        </div>
                                        <div className="alerta-detalles">
                                            <div className="detalle-item"><Globe size={14} /> <strong>Uba. Simultáneas:</strong> {cuenta.ubicaciones_simultaneas}</div>
                                            <div className="detalle-item"><MapPin size={14} /> <strong>Países dif:</strong> {cuenta.paises_diferentes}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* CAMBIOS SOSPECHOSOS */}
                        {alertas.cambiosSospechosos.length > 0 && (
                            <div className="seccion-alertas">
                                <h4><Activity size={18} /> Cambios de Ubicación Sospechosos ({alertas.cambiosSospechosos.length})</h4>
                                {alertas.cambiosSospechosos.map((cambio, idx) => (
                                    <div key={idx} className="alerta-item" style={{ borderLeftColor: obtenerColorRiesgo(cambio.nivel_riesgo) }}>
                                        <div className="alerta-header">
                                            <div className="usuario-info-alerta">
                                                <strong>{cambio.usuario?.nombre} {cambio.usuario?.apellido}</strong>
                                                <span className="email">{cambio.usuario?.email}</span>
                                            </div>
                                            <div className="riesgo-badge" style={{ backgroundColor: obtenerColorRiesgo(cambio.nivel_riesgo) }}>
                                                {cambio.nivel_riesgo}
                                            </div>
                                        </div>
                                        <div className="alerta-detalles">
                                            <div className="detalle-item"><strong>De:</strong> {cambio.ubicacion_anterior}</div>
                                            <div className="detalle-item"><strong>A:</strong> {cambio.ubicacion_actual}</div>
                                            <div className="detalle-item velocidad-imposible"><strong>Velocidad:</strong> {cambio.velocidad_teorica} km/h</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default AlertasSeguridadGeografica;
