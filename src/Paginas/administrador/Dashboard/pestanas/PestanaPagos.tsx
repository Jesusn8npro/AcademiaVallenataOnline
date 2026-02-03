import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../servicios/supabaseCliente';
import {
    Download,
    RefreshCw,
    DollarSign,
    Calendar,
    Target,
    CheckCircle,
    Clock,
    Eye,
    TrendingUp,
    TrendingDown,
    CreditCard
} from 'lucide-react';
import './PestanaPagos.css';

interface EstadisticasPagos {
    totalIngresos: number;
    ingresosEsteMes: number;
    transaccionesExitosas: number;
    transaccionesPendientes: number;
    transaccionesRechazadas: number;
    ticketPromedio: number;
    crecimientoMensual: number;
    tasaExito: number;
}

interface TransaccionPago {
    id: string;
    usuario_nombre: string;
    usuario_email: string;
    monto: number;
    estado: string;
    fecha_transaccion: string;
    metodo_pago: string;
    referencia_pago: string;
    paquete_nombre?: string;
    moneda: string;
}

const PestanaPagos: React.FC = () => {
    const [cargandoPagos, setCargandoPagos] = useState(false);
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState('30d');
    const [transaccionesRecientes, setTransaccionesRecientes] = useState<TransaccionPago[]>([]);
    const [ingresosPorMes, setIngresosPorMes] = useState<any[]>([]);
    const [estadisticasPagos, setEstadisticasPagos] = useState<EstadisticasPagos>({
        totalIngresos: 0,
        ingresosEsteMes: 0,
        transaccionesExitosas: 0,
        transaccionesPendientes: 0,
        transaccionesRechazadas: 0,
        ticketPromedio: 0,
        crecimientoMensual: 0,
        tasaExito: 0
    });

    useEffect(() => {
        cargarDatosPagos();
    }, []);

    async function cargarDatosPagos() {
        try {
            setCargandoPagos(true);
            console.log('💰 [PAGOS] Cargando datos financieros...');

            await Promise.all([
                cargarEstadisticasPagos(),
                cargarTransaccionesRecientes(),
                cargarIngresosPorMes()
            ]);

        } catch (error) {
            console.error('❌ [PAGOS] Error:', error);
        } finally {
            setCargandoPagos(false);
        }
    }

    async function cargarEstadisticasPagos() {
        try {
            const hoy = new Date();
            const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            const inicioMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
            const finMesAnterior = new Date(hoy.getFullYear(), hoy.getMonth(), 0);

            // Total ingresos y transacciones exitosas
            const { data: pagosExitosos } = await supabase
                .from('pagos_epayco')
                .select('monto, created_at')
                .eq('estado', 'exitoso');

            const totalIngresos = pagosExitosos?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;
            const transaccionesExitosas = pagosExitosos?.length || 0;

            // Ingresos este mes
            const { data: pagosEsteMes } = await supabase
                .from('pagos_epayco')
                .select('monto')
                .eq('estado', 'exitoso')
                .gte('created_at', inicioMes.toISOString());

            const ingresosEsteMes = pagosEsteMes?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;

            // Ingresos mes anterior para calcular crecimiento
            const { data: pagosMesAnterior } = await supabase
                .from('pagos_epayco')
                .select('monto')
                .eq('estado', 'exitoso')
                .gte('created_at', inicioMesAnterior.toISOString())
                .lte('created_at', finMesAnterior.toISOString());

            const ingresosMesAnterior = pagosMesAnterior?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;

            // Transacciones por estado
            const [{ count: pendientes }, { count: rechazadas }] = await Promise.all([
                supabase.from('pagos_epayco').select('*', { count: 'exact', head: true }).eq('estado', 'pendiente'),
                supabase.from('pagos_epayco').select('*', { count: 'exact', head: true }).eq('estado', 'rechazado')
            ]);

            // Calcular métricas
            const totalTransacciones = transaccionesExitosas + (pendientes || 0) + (rechazadas || 0);
            const ticketPromedio = transaccionesExitosas > 0 ? totalIngresos / transaccionesExitosas : 0;
            const tasaExito = totalTransacciones > 0 ? (transaccionesExitosas / totalTransacciones) * 100 : 0;
            const crecimientoMensual = ingresosMesAnterior > 0
                ? ((ingresosEsteMes - ingresosMesAnterior) / ingresosMesAnterior) * 100
                : 0;

            setEstadisticasPagos({
                totalIngresos,
                ingresosEsteMes,
                transaccionesExitosas,
                transaccionesPendientes: pendientes || 0,
                transaccionesRechazadas: rechazadas || 0,
                ticketPromedio,
                crecimientoMensual,
                tasaExito
            });

        } catch (error) {
            console.error('❌ [PAGOS] Error en estadísticas:', error);
        }
    }

    async function cargarTransaccionesRecientes() {
        try {
            const { data: transacciones } = await supabase
                .from('pagos_epayco')
                .select(`
                    id, monto, estado, created_at, metodo_pago, referencia_pago, moneda,
                    usuario_id,
                    perfiles:usuario_id(nombre, apellido, correo_electronico),
                    paquete_id,
                    paquetes_tutoriales:paquete_id(titulo)
                `)
                .order('created_at', { ascending: false })
                .limit(20);

            const transaccionesMapeadas = transacciones?.map((t: any) => ({
                id: t.id,
                usuario_nombre: t.perfiles ? `${t.perfiles.nombre} ${t.perfiles.apellido}` : 'Usuario desconocido',
                usuario_email: t.perfiles?.correo_electronico || 'No disponible',
                monto: parseFloat(t.monto) || 0,
                estado: t.estado,
                fecha_transaccion: t.created_at,
                metodo_pago: t.metodo_pago || 'No especificado',
                referencia_pago: t.referencia_pago || '',
                paquete_nombre: t.paquetes_tutoriales?.titulo || 'Sin paquete',
                moneda: t.moneda || 'COP'
            })) || [];

            setTransaccionesRecientes(transaccionesMapeadas);
        } catch (error) {
            console.error('❌ [PAGOS] Error en transacciones:', error);
        }
    }

    async function cargarIngresosPorMes() {
        try {
            // Últimos 6 meses
            const mesesIngresos = [];

            for (let i = 5; i >= 0; i--) {
                const fecha = new Date();
                fecha.setMonth(fecha.getMonth() - i);
                const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
                const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0);

                const { data: pagosMes } = await supabase
                    .from('pagos_epayco')
                    .select('monto')
                    .eq('estado', 'exitoso')
                    .gte('created_at', inicioMes.toISOString())
                    .lte('created_at', finMes.toISOString());

                const ingresosMes = pagosMes?.reduce((sum, pago) => sum + (parseFloat(pago.monto) || 0), 0) || 0;

                mesesIngresos.push({
                    mes: fecha.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
                    ingresos: ingresosMes,
                    transacciones: pagosMes?.length || 0
                });
            }

            setIngresosPorMes(mesesIngresos);

        } catch (error) {
            console.error('❌ [PAGOS] Error en ingresos por mes:', error);
        }
    }

    function obtenerColorEstado(estado: string): string {
        switch (estado) {
            case 'exitoso': return '#10b981';
            case 'pendiente': return '#f59e0b';
            case 'rechazado': return '#ef4444';
            default: return '#6b7280';
        }
    }

    function formatearMonto(monto: number, moneda: string = 'COP'): string {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: moneda,
            minimumFractionDigits: 0
        }).format(monto);
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

    function exportarDatosFinancieros() {
        const datosFinancieros = {
            fecha_reporte: new Date().toISOString(),
            estadisticas: estadisticasPagos,
            ingresosPorMes: ingresosPorMes,
            transacciones_recientes: transaccionesRecientes.map(t => ({
                ...t,
                monto_formateado: formatearMonto(t.monto, t.moneda)
            }))
        };

        const jsonData = JSON.stringify(datosFinancieros, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_financiero_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

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

            {/* ESTADÍSTICAS FINANCIERAS */}
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
                            {estadisticasPagos.crecimientoMensual >= 0 ? <TrendingUp size={12} style={{ display: 'inline' }} /> : <TrendingDown size={12} style={{ display: 'inline' }} />}
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
                {/* GRÁFICO DE INGRESOS */}
                <div className="pp-chart-section">
                    <div className="pp-chart-header">
                        <h3>📊 Ingresos por Mes</h3>
                        <div className="pp-chart-controls">
                            <select value={periodoSeleccionado} onChange={(e) => {
                                setPeriodoSeleccionado(e.target.value);
                                cargarDatosPagos();
                            }}>
                                <option value="30d">Últimos 30 días</option>
                                <option value="6m">Últimos 6 meses</option>
                                <option value="1y">Último año</option>
                            </select>
                        </div>
                    </div>

                    {cargandoPagos ? (
                        <div className="pp-loading">
                            <div className="pp-spinner"></div>
                            <p>Cargando datos financieros...</p>
                        </div>
                    ) : (
                        <div className="pp-bar-chart">
                            {ingresosPorMes.map((mes, index) => {
                                const maxVal = Math.max(...ingresosPorMes.map(m => m.ingresos));
                                const alturaRelativa = ingresosPorMes.length > 0 && maxVal > 0 ? (mes.ingresos / maxVal) * 100 : 0;
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
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* TRANSACCIONES RECIENTES */}
                <div className="pp-transactions-section">
                    <div className="pp-transactions-header">
                        <h3>💳 Transacciones Recientes</h3>
                        <button className="pp-btn-update" onClick={cargarDatosPagos} disabled={cargandoPagos}>
                            <RefreshCw size={14} className={cargandoPagos ? 'pp-spinning' : ''} style={{ marginRight: '0.5rem' }} />
                            Actualizar
                        </button>
                    </div>

                    {cargandoPagos ? (
                        <div className="pp-loading">
                            <div className="pp-spinner"></div>
                            <p>Cargando transacciones...</p>
                        </div>
                    ) : transaccionesRecientes.length === 0 ? (
                        <div className="pp-empty-state">
                            💳 No hay transacciones registradas
                        </div>
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

                                    <div className="pp-amount">
                                        {formatearMonto(transaccion.monto, transaccion.moneda)}
                                    </div>

                                    <div className="pp-status-cell">
                                        <span
                                            className="pp-status-badge"
                                            style={{
                                                backgroundColor: `${obtenerColorEstado(transaccion.estado)}20`,
                                                color: obtenerColorEstado(transaccion.estado)
                                            }}
                                        >
                                            {transaccion.estado}
                                        </span>
                                    </div>

                                    <div className="pp-method">
                                        {transaccion.metodo_pago}
                                    </div>

                                    <div className="pp-date">
                                        {formatearFecha(transaccion.fecha_transaccion)}
                                    </div>

                                    <div className="pp-actions-cell">
                                        <button className="pp-btn-view" onClick={() => alert(`Ver detalles: ${transaccion.id}`)}>
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
    );
};

export default PestanaPagos;
