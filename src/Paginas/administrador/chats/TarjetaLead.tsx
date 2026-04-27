import { Mail, Phone, MapPin, Calendar } from 'lucide-react';
import type { Lead } from './useAdminChats';

interface Props {
    lead: Lead;
    onVerDetalle: (lead: Lead) => void;
    onVerChat: (lead: Lead) => void;
}

const TarjetaLead = ({ lead, onVerDetalle, onVerChat }: Props) => (
    <div className="lead-card">
        <div className="lead-header">
            <div>
                <h3 className="lead-nombre">{lead.nombre || 'Usuario Anónimo'} {lead.apellido || ''}</h3>
                <span className="lead-id">ID: {lead.id.substring(0, 8)}...</span>
            </div>
            <div className="lead-badges">
                <span className={`estado-badge estado-${lead.estado || 'default'}`}>{lead.estado || 'N/A'}</span>
                {lead.converted && <span className="convertido-badge" title="Lead Convertido">🌟</span>}
            </div>
        </div>

        <div className="lead-content">
            <div className="contacto-info">
                {lead.email && <div className="contacto-item"><Mail className="contacto-icon" /><span className="contacto-texto">{lead.email}</span></div>}
                {lead.whatsapp && <div className="contacto-item"><Phone className="contacto-icon" /><span className="contacto-texto">{lead.whatsapp}</span></div>}
                {lead.ciudad && <div className="contacto-item"><MapPin className="contacto-icon" /><span className="contacto-texto">{lead.ciudad}</span></div>}
            </div>

            {lead.contexto_inicial && (
                <div className="contexto-inicial">
                    <p>"{lead.contexto_inicial.length > 80 ? lead.contexto_inicial.substring(0, 80) + '...' : lead.contexto_inicial}"</p>
                </div>
            )}

            <div className="metricas-lead">
                <div className="metrica">
                    <span className="metrica-label">Probabilidad</span>
                    <span className={`metrica-valor ${(lead.probabilidad_compra || 0) > 70 ? 'interes-alto' : (lead.probabilidad_compra || 0) > 40 ? 'interes-medio' : 'interes-bajo'}`}>
                        {lead.probabilidad_compra || 0}%
                    </span>
                </div>
                <div className="metrica">
                    <span className="metrica-label">Interés</span>
                    <span className="metrica-valor">{lead.tipo_consulta || '-'}</span>
                </div>
            </div>

            <div className="fecha-lead">
                <Calendar className="fecha-icon" size={14} />
                <span>{new Date(lead.created_at).toLocaleDateString()}</span>
            </div>
        </div>

        <div className="lead-actions">
            <button className="btn-action ver-detalle" onClick={() => onVerDetalle(lead)}>Ver Detalles</button>
            <button className="btn-action ver-chat" onClick={() => onVerChat(lead)}>Ver Chat</button>
            {lead.whatsapp && (
                <button className="btn-action whatsapp" onClick={() => window.open(`https://wa.me/${lead.whatsapp}`, '_blank')}>
                    <Phone size={14} /> Link
                </button>
            )}
        </div>
    </div>
);

export default TarjetaLead;
