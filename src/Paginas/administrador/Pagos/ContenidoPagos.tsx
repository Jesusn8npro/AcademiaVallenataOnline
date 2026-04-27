import React from 'react';
import type { Pago } from './usePagos';
import { formatearFecha, formatearValor, obtenerClaseBadgeEstado, obtenerIconoEstado, truncarReferencia } from './usePagos';

interface Props {
    pagos: Pago[];
    cargando: boolean;
    vistaActual: 'tabla' | 'cards';
    setVistaActual: (v: 'tabla' | 'cards') => void;
    confirmando: Record<string, boolean>;
    mensajesConfirmacion: Record<string, string>;
    onConfirmar: (refPayco: string) => void;
    onCambiarEstado: (refPayco: string, nuevoEstado: string) => void;
    cargarPagos: () => void;
}

const ContenidoPagos = ({ pagos, cargando, vistaActual, setVistaActual, confirmando, mensajesConfirmacion, onConfirmar, onCambiarEstado, cargarPagos }: Props) => {
    if (cargando) return (
        <div className="academia-pagos-mensaje-estado">
            <div className="academia-spinner"></div>
            <p style={{ color: '#4b5563', fontSize: '1.rem' }}>Cargando pagos...</p>
        </div>
    );

    if (pagos.length === 0) return (
        <div className="academia-pagos-mensaje-estado">
            <div className="academia-pagos-emoji-vacio">😕</div>
            <h3 className="academia-pagos-titulo-vacio">No se encontraron pagos</h3>
            <p className="academia-pagos-texto-vacio">Esto puede deberse a filtros muy restrictivos o problemas de conexión</p>
            <button onClick={cargarPagos} className="academia-pagos-btn-accion academia-btn-azul" style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
                🔄 Intentar Recargar
            </button>
        </div>
    );

    return (
        <>
            {vistaActual === 'tabla' && (
                <>
                    <div className="academia-pagos-tabla-movil-aviso">
                        <div style={{ fontSize: '2.25rem', marginBottom: '0.75rem' }}>📱</div>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1e3a8a', marginBottom: '0.5rem' }}>Vista optimizada para móvil</h3>
                        <p style={{ color: '#1d4ed8', marginBottom: '1rem' }}>La vista de tabla está optimizada para pantallas más grandes. En móviles recomendamos usar la vista de tarjetas para una mejor experiencia.</p>
                        <button onClick={() => setVistaActual('cards')} className="academia-pagos-btn-accion academia-btn-azul" style={{ width: 'auto' }}>🃏 Cambiar a Cards</button>
                    </div>
                    <div className="academia-pagos-tabla-container">
                        <div className="academia-pagos-table-wrapper">
                            <table className="academia-pagos-table">
                                <thead>
                                    <tr>
                                        <th className="academia-pagos-th">Referencia</th>
                                        <th className="academia-pagos-th">Usuario</th>
                                        <th className="academia-pagos-th">Producto</th>
                                        <th className="academia-pagos-th">Valor</th>
                                        <th className="academia-pagos-th">Estado</th>
                                        <th className="academia-pagos-th">Fecha</th>
                                        <th className="academia-pagos-th">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagos.map((pago) => (
                                        <tr key={pago.id} className="academia-pagos-tr">
                                            <td className="academia-pagos-td">
                                                <div className="academia-pagos-ref">{truncarReferencia(pago.ref_payco)}</div>
                                                {pago.metodo_pago && <div className="academia-pagos-metodo">{pago.metodo_pago}</div>}
                                            </td>
                                            <td className="academia-pagos-td">
                                                <div className="academia-pagos-usuario-flex">
                                                    <div className="academia-pagos-avatar">{pago.perfiles?.nombre?.charAt(0) || '?'}</div>
                                                    <div className="academia-pagos-usuario-info">
                                                        <div className="academia-pagos-nombre">{pago.perfiles?.nombre || 'Sin nombre'} {pago.perfiles?.apellido || ''}</div>
                                                        <div className="academia-pagos-email">{pago.perfiles?.correo_electronico || 'Sin email'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="academia-pagos-td">
                                                <div className="academia-pagos-producto">{pago.nombre_producto}</div>
                                                {pago.cursos?.titulo && <div className="academia-pagos-subproducto academia-text-blue">📚 {pago.cursos.titulo}</div>}
                                                {pago.tutoriales?.titulo && <div className="academia-pagos-subproducto academia-text-green">🎥 {pago.tutoriales.titulo}</div>}
                                            </td>
                                            <td className="academia-pagos-td">
                                                <div className="academia-pagos-valor">{formatearValor(pago.valor)}</div>
                                            </td>
                                            <td className="academia-pagos-td">
                                                <span className={obtenerClaseBadgeEstado(pago.estado)}>
                                                    {obtenerIconoEstado(pago.estado)} <span style={{ marginLeft: '0.25rem' }}>{pago.estado}</span>
                                                </span>
                                            </td>
                                            <td className="academia-pagos-td" style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                                {formatearFecha(pago.created_at)}
                                            </td>
                                            <td className="academia-pagos-td">
                                                <div className="academia-pagos-acciones-flex">
                                                    <div className="academia-pagos-btn-row">
                                                        <button onClick={() => onCambiarEstado(pago.ref_payco, 'aceptada')} className="academia-btn-mini academia-btn-mini-emerald" title="Aceptar pago">✅</button>
                                                        <button onClick={() => onCambiarEstado(pago.ref_payco, 'rechazada')} className="academia-btn-mini academia-btn-mini-red" title="Rechazar pago">❌</button>
                                                        <button onClick={() => onCambiarEstado(pago.ref_payco, 'pendiente')} className="academia-btn-mini academia-btn-mini-amber" title="Marcar pendiente">⏳</button>
                                                    </div>
                                                    <div>
                                                        <button className="academia-btn-confirmar" onClick={() => onConfirmar(pago.ref_payco)} disabled={confirmando[pago.ref_payco] || pago.estado === 'aceptada'}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" /></svg>
                                                            {confirmando[pago.ref_payco] ? '...' : (pago.estado === 'aceptada' ? 'Confirmado' : 'Confirmar')}
                                                        </button>
                                                    </div>
                                                </div>
                                                {mensajesConfirmacion[pago.ref_payco] && (
                                                    <div className={`academia-mensaje-confirmacion ${mensajesConfirmacion[pago.ref_payco].includes('✅') ? 'academia-msg-exito' : 'academia-msg-error'}`}>
                                                        {mensajesConfirmacion[pago.ref_payco]}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {vistaActual === 'cards' && (
                <div className="academia-pagos-grid-cards">
                    {pagos.map((pago) => (
                        <div key={pago.id} className="academia-pago-card">
                            <div className="academia-card-header">
                                <div className="academia-pagos-usuario-flex">
                                    <div className="academia-pagos-avatar">{pago.perfiles?.nombre?.charAt(0) || '?'}</div>
                                    <div>
                                        <div className="academia-pagos-nombre">{pago.perfiles?.nombre || 'Sin nombre'} {pago.perfiles?.apellido || ''}</div>
                                        <div className="academia-pagos-email">{pago.perfiles?.correo_electronico || 'Sin email'}</div>
                                    </div>
                                </div>
                                <span className={obtenerClaseBadgeEstado(pago.estado)}>
                                    {obtenerIconoEstado(pago.estado)} {pago.estado}
                                </span>
                            </div>
                            <div className="academia-card-info">
                                <div className="academia-info-bloque">
                                    <p>Referencia</p>
                                    <p className="academia-pagos-ref">{truncarReferencia(pago.ref_payco)}</p>
                                </div>
                                <div className="academia-info-bloque">
                                    <p>Producto</p>
                                    <p>{pago.nombre_producto}</p>
                                    {pago.cursos?.titulo && <p className="academia-pagos-subproducto academia-text-blue">📚 {pago.cursos.titulo}</p>}
                                    {pago.tutoriales?.titulo && <p className="academia-pagos-subproducto academia-text-green">🎥 {pago.tutoriales.titulo}</p>}
                                </div>
                                <div className="academia-card-footer" style={{ borderTop: 'none', padding: 0, display: 'flex', justifyContent: 'space-between' }}>
                                    <div className="academia-info-bloque">
                                        <p>Valor</p>
                                        <p className="academia-pagos-valor">{formatearValor(pago.valor)}</p>
                                    </div>
                                    <div className="academia-info-bloque" style={{ textAlign: 'right' }}>
                                        <p>Fecha</p>
                                        <p>{formatearFecha(pago.created_at)}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="academia-card-footer">
                                <div className="academia-card-acciones">
                                    <button onClick={() => onCambiarEstado(pago.ref_payco, 'aceptada')} className="academia-btn-card academia-btn-mini-emerald">✅ Aceptar</button>
                                    <button onClick={() => onCambiarEstado(pago.ref_payco, 'rechazada')} className="academia-btn-card academia-btn-mini-red">❌ Rechazar</button>
                                </div>
                                <div>
                                    <button className="academia-btn-card-confirmar" onClick={() => onConfirmar(pago.ref_payco)} disabled={confirmando[pago.ref_payco] || pago.estado === 'aceptada'}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 6L9 17l-5-5" /></svg>
                                        {confirmando[pago.ref_payco] ? '...' : (pago.estado === 'aceptada' ? 'Confirmado' : 'Confirmar Manual')}
                                    </button>
                                </div>
                                {mensajesConfirmacion[pago.ref_payco] && (
                                    <div className={`academia-mensaje-confirmacion ${mensajesConfirmacion[pago.ref_payco].includes('✅') ? 'academia-msg-exito' : 'academia-msg-error'}`} style={{ textAlign: 'center' }}>
                                        {mensajesConfirmacion[pago.ref_payco]}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default ContenidoPagos;
