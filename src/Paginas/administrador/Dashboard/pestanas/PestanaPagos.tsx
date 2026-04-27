import React from 'react'
import {
    Download, RefreshCw, DollarSign, Calendar, Target, CheckCircle,
    Clock, Eye, TrendingUp, TrendingDown, CreditCard
} from 'lucide-react'
import './PestanaPagos.css'
import { usePestanaPagos } from './usePestanaPagos'

const PestanaPagos: React.FC = () => {
    const {
        cargandoPagos, periodoSeleccionado, setPeriodoSeleccionado,
        transaccionesRecientes, ingresosPorMes, estadisticasPagos,
        cargarDatosPagos, obtenerColorEstado, formatearMonto, formatearFecha,
        exportarDatosFinancieros
    } = usePestanaPagos()

    return (
        <div className="pp-container">
            <div className="pp-header">
                <div className="pp-header-content">
                    <div className="pp-header-text">
                        <h2>💰 Gestión de Pagos</h2>
                        <p>Análisis financiero completo y transacciones de la academia</p>
                    </div>
                    <button className="pp-btn-export" onClick={exportarDatosFinancieros}>
                        <Download size={16} />
                        Exportar Reporte
                    </button>
                </div>
            </div>

            <div className="pp-stats-grid">
                <div className="pp-stat-card">
                    <DollarSign className="pp-stat-icon" style={{ color: '#10b981' }} />
                    <div className="pp-stat-info">
                        <div className="pp-stat-number">{formatearMonto(estadisticasPagos.totalIngresos)}</div>
                        <div className="pp-stat-label">Total Ingresos</div>
                    </div>
                </div>
                <div className="pp-stat-card">
                    <Calendar className="pp-stat-icon" style={{ color: '#3b82f6' }} />
                    <div className="pp-stat-info">
                        <div className="pp-stat-number">{formatearMonto(estadisticasPagos.ingresosEsteMes)}</div>
                        <div className="pp-stat-label">Ingresos Este Mes</div>
                        <div className={`pp-stat-change ${estadisticasPagos.crecimientoMensual >= 0 ? 'pp-positive' : 'pp-negative'}`}>
                            {estadisticasPagos.crecimientoMensual >= 0
                                ? <TrendingUp size={12} style={{ display: 'inline' }} />
                                : <TrendingDown size={12} style={{ display: 'inline' }} />}
                            {Math.abs(estadisticasPagos.crecimientoMensual).toFixed(1)}%
                        </div>
                    </div>
                </div>
                <div className="pp-stat-card">
                    <Target className="pp-stat-icon" style={{ color: '#8b5cf6' }} />
                    <div className="pp-stat-info">
                        <div className="pp-stat-number">{formatearMonto(estadisticasPagos.ticketPromedio)}</div>
                        <div className="pp-stat-label">Ticket Promedio</div>
                    </div>
                </div>
                <div className="pp-stat-card">
                    <CheckCircle className="pp-stat-icon" style={{ color: '#10b981' }} />
                    <div className="pp-stat-info">
                        <div className="pp-stat-number">{estadisticasPagos.tasaExito.toFixed(1)}%</div>
                        <div className="pp-stat-label">Tasa de Éxito</div>
                    </div>
                </div>
                <div className="pp-stat-card">
                    <CheckCircle className="pp-stat-icon" style={{ color: '#10b981' }} />
                    <div className="pp-stat-info">
                        <div className="pp-stat-number">{estadisticasPagos.transaccionesExitosas}</div>
                        <div className="pp-stat-label">Exitosas</div>
                    </div>
                </div>
                <div className="pp-stat-card">
                    <Clock className="pp-stat-icon" style={{ color: '#f59e0b' }} />
                    <div className="pp-stat-info">
                        <div className="pp-stat-number">{estadisticasPagos.transaccionesPendientes}</div>
                        <div className="pp-stat-label">Pendientes</div>
                    </div>
                </div>
            </div>

            <div className="pp-content-grid">
                <div className="pp-chart-section">
                    <div className="pp-chart-header">
                        <h3>📊 Ingresos por Mes</h3>
                        <div className="pp-chart-controls">
                            <select value={periodoSeleccionado} onChange={(e) => {
                                setPeriodoSeleccionado(e.target.value)
                                cargarDatosPagos()
                            }}>
                                <option value="30d">Últimos 30 días</option>
                                <option value="6m">Últimos 6 meses</option>
                                <option value="1y">Último año</option>
                            </select>
                        </div>
                    </div>
                    {cargandoPagos ? (
                        <div className="pp-loading"><div className="pp-spinner"></div><p>Cargando datos financieros...</p></div>
                    ) : (
                        <div className="pp-bar-chart">
                            {ingresosPorMes.map((mes, index) => {
                                const maxVal = Math.max(...ingresosPorMes.map(m => m.ingresos))
                                const alturaRelativa = ingresosPorMes.length > 0 && maxVal > 0 ? (mes.ingresos / maxVal) * 100 : 0
                                return (
                                    <div key={index} className="pp-bar-column">
                                        <div className="pp-bar-fill" style={{ height: `${alturaRelativa}%` }}>
                                            <div className="pp-tooltip">
                                                <strong>{mes.mes}</strong><br />
                                                {formatearMonto(mes.ingresos)}<br />
                                                {mes.transacciones} transacciones
                                            </div>
                                        </div>
                                        <div className="pp-bar-label">{mes.mes}</div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="pp-transactions-section">
                    <div className="pp-transactions-header">
                        <h3>💳 Transacciones Recientes</h3>
                        <button className="pp-btn-update" onClick={cargarDatosPagos} disabled={cargandoPagos}>
                            <RefreshCw size={14} className={cargandoPagos ? 'pp-spinning' : ''} style={{ marginRight: '0.5rem' }} />
                            Actualizar
                        </button>
                    </div>
                    {cargandoPagos ? (
                        <div className="pp-loading"><div className="pp-spinner"></div><p>Cargando transacciones...</p></div>
                    ) : transaccionesRecientes.length === 0 ? (
                        <div className="pp-empty-state">💳 No hay transacciones registradas</div>
                    ) : (
                        <div className="pp-transaction-list">
                            {transaccionesRecientes.map((transaccion) => (
                                <div key={transaccion.id} className="pp-table-row">
                                    <div className="pp-user-info">
                                        <div className="pp-user-name">{transaccion.usuario_nombre}</div>
                                        <div className="pp-user-email">{transaccion.usuario_email}</div>
                                        {transaccion.paquete_nombre !== 'Sin paquete' && (
                                            <div className="pp-package-name">{transaccion.paquete_nombre}</div>
                                        )}
                                    </div>
                                    <div className="pp-amount">{formatearMonto(transaccion.monto, transaccion.moneda)}</div>
                                    <div className="pp-status-cell">
                                        <span className="pp-status-badge" style={{ backgroundColor: `${obtenerColorEstado(transaccion.estado)}20`, color: obtenerColorEstado(transaccion.estado) }}>
                                            {transaccion.estado}
                                        </span>
                                    </div>
                                    <div className="pp-method">{transaccion.metodo_pago}</div>
                                    <div className="pp-date">{formatearFecha(transaccion.fecha_transaccion)}</div>
                                    <div className="pp-actions-cell">
                                        <button className="pp-btn-view">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default PestanaPagos
