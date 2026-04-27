import { X } from 'lucide-react';
import type { Lead } from './useAdminChats';

interface Props {
    leadSeleccionado: Lead;
    onCerrar: () => void;
}

const ModalDetalleLead = ({ leadSeleccionado, onCerrar }: Props) => (
    <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal-content modal-detalle" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h3>Detalles del Lead</h3>
                <button className="btn-cerrar" onClick={onCerrar}><X /></button>
            </div>
            <div className="modal-body">
                <div className="detalle-grid">
                    <div className="detalle-seccion">
                        <h4>Información Personal</h4>
                        <div className="detalle-items">
                            <div className="detalle-item"><strong>Nombre:</strong> <span>{leadSeleccionado.nombre} {leadSeleccionado.apellido}</span></div>
                            <div className="detalle-item"><strong>Email:</strong> <span>{leadSeleccionado.email || '-'}</span></div>
                            <div className="detalle-item"><strong>WhatsApp:</strong> <span>{leadSeleccionado.whatsapp || '-'}</span></div>
                            <div className="detalle-item"><strong>Ciudad:</strong> <span>{leadSeleccionado.ciudad || '-'}</span></div>
                        </div>
                    </div>
                    <div className="detalle-seccion">
                        <h4>Estado & Métricas</h4>
                        <div className="detalle-items">
                            <div className="detalle-item">
                                <strong>Estado:</strong>
                                <span className={`estado-badge estado-${leadSeleccionado.estado}`}>{leadSeleccionado.estado}</span>
                            </div>
                            <div className="detalle-item">
                                <strong>Convertido:</strong>
                                <span className={leadSeleccionado.converted ? 'convertido-si' : 'convertido-no'}>{leadSeleccionado.converted ? 'SÍ' : 'NO'}</span>
                            </div>
                            <div className="detalle-item"><strong>Probabilidad:</strong> <span>{leadSeleccionado.probabilidad_compra}%</span></div>
                        </div>
                    </div>
                    <div className="detalle-seccion full-width">
                        <h4>Contexto del Chat</h4>
                        <div className="contexto-box">"{leadSeleccionado.contexto_inicial || 'Sin contexto inicial'}"</div>
                    </div>
                    <div className="detalle-seccion full-width">
                        <h4>Productos Consultados</h4>
                        <div className="productos-consultados">
                            {leadSeleccionado.productos_consultados && leadSeleccionado.productos_consultados.length > 0 ? (
                                leadSeleccionado.productos_consultados.map((prod, idx) => (
                                    <span key={idx} className="producto-item">{prod}</span>
                                ))
                            ) : (
                                <span>No se registraron productos específicos.</span>
                            )}
                        </div>
                    </div>
                    {leadSeleccionado.notas_adicionales && (
                        <div className="detalle-seccion full-width">
                            <h4>Notas Adicionales</h4>
                            <div className="notas-box">{leadSeleccionado.notas_adicionales}</div>
                        </div>
                    )}
                </div>
            </div>
            <div className="modal-footer">
                <button className="btn-modal cerrar" onClick={onCerrar}>Cerrar</button>
            </div>
        </div>
    </div>
);

export default ModalDetalleLead;
