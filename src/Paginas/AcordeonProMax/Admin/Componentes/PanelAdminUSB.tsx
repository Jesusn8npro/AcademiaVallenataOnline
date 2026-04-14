import React from 'react';
import { Usb, Wifi, WifiOff } from 'lucide-react';
import './PanelAdminUSB.css';

interface PanelAdminUSBProps {
  conectado: boolean;
  onConectar: () => void;
  onDesconectar?: () => void;
}

const PanelAdminUSB: React.FC<PanelAdminUSBProps> = ({
  conectado,
  onConectar,
  onDesconectar,
}) => {
  return (
    <div className="panel-admin-usb">
      {/* Estado de conexión */}
      <div className="panel-admin-usb-bloque">
        <div className="panel-admin-usb-bloque-title">Conexión ESP32 / USB</div>
        <div
          style={{
            padding: '16px',
            borderRadius: '12px',
            backgroundColor: conectado ? 'rgba(34, 197, 94, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            border: `2px solid ${conectado ? '#22c55e' : '#6b7280'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {conectado ? (
            <Wifi size={24} color="#22c55e" />
          ) : (
            <WifiOff size={24} color="#9ca3af" />
          )}
          <div>
            <div style={{ fontWeight: 'bold', color: conectado ? '#22c55e' : '#9ca3af' }}>
              {conectado ? 'CONECTADO' : 'DESCONECTADO'}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {conectado
                ? 'Acordeón físico sincronizado a 115200 baud'
                : 'Selecciona puerto COM para conectar'}
            </div>
          </div>
        </div>
      </div>

      {/* Botones de control */}
      <div className="panel-admin-usb-bloque">
        <div className="panel-admin-usb-bloque-title">Controles</div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <button
            onClick={onConectar}
            disabled={conectado}
            className="panel-admin-usb-btn"
            style={{
              background: conectado ? '#27272a' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: conectado ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: conectado ? 0.5 : 1,
            }}
          >
            <Usb size={16} /> {conectado ? 'Conectado' : 'Conectar'}
          </button>

          <button
            onClick={onDesconectar || onConectar}
            disabled={!conectado}
            className="panel-admin-usb-btn"
            style={{
              background: !conectado ? '#27272a' : '#ef4444',
              color: 'white',
              border: 'none',
              padding: '12px',
              borderRadius: '12px',
              fontWeight: 'bold',
              cursor: !conectado ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: !conectado ? 0.5 : 1,
            }}
          >
            <WifiOff size={16} /> Desconectar
          </button>
        </div>
      </div>

      {/* Información técnica */}
      <div className="panel-admin-usb-bloque">
        <div className="panel-admin-usb-bloque-title">Información técnica</div>
        <div style={{ fontSize: '11px', color: '#999', lineHeight: '1.6' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#ccc' }}>Protocolo:</strong> Serial USB / COM (115200 baud)
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#ccc' }}>Dispositivo:</strong> ESP32-S3 (Accordeon Hardware)
          </div>
          <div style={{ marginBottom: '8px' }}>
            <strong style={{ color: '#ccc' }}>Datos:</strong> Hileras H1, H2, H3, Bajos, Fuelle
          </div>
          <div>
            <strong style={{ color: '#ccc' }}>Estado:</strong> {conectado ? '✅ Sincronizado' : '⏳ Esperando conexión'}
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="panel-admin-usb-bloque">
        <div className="panel-admin-usb-bloque-title">¿Cómo conectar?</div>
        <ol style={{ fontSize: '12px', color: '#999', paddingLeft: '20px', margin: '0', lineHeight: '1.8' }}>
          <li>Enchufa el acordeón ESP32 a una puerta USB del computador</li>
          <li>Haz clic en <strong style={{ color: '#ccc' }}>Conectar</strong></li>
          <li>Selecciona el puerto COM en el navegador</li>
          <li>El estado debe cambiar a <strong style={{ color: '#22c55e' }}>CONECTADO</strong></li>
          <li>Ahora puedes tocar directamente en el hardware y sincronizar con las grabaciones REC</li>
        </ol>
      </div>

      {/* Aviso */}
      <div className="panel-admin-usb-info">
        <strong>🔧 Soporte Hardware</strong>
        <p>
          Requiere navegador que soporte Web Serial API (Chrome/Edge 89+). Los datos se procesan en tiempo real sin latencia significativa.
        </p>
      </div>
    </div>
  );
};

export default PanelAdminUSB;
