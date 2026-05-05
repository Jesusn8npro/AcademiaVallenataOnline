import React from 'react';
import { Usb, Wifi, WifiOff, AlertCircle, Sparkles } from 'lucide-react';

interface Props {
  conectado: boolean;
  onConectar(): void;
  onDesconectar?(): void;
}

const PanelUSBV2: React.FC<Props> = ({ conectado, onConectar, onDesconectar }) => {
  const soportaWebSerial = typeof (navigator as any).serial !== 'undefined';

  return (
    <div className="grabv2-tab-cuerpo grabv2-usb">
      <div className={`grabv2-usb-status ${conectado ? 'on' : 'off'}`}>
        <div className="grabv2-usb-status-icon">
          {conectado ? <Wifi size={22} /> : <WifiOff size={22} />}
        </div>
        <div className="grabv2-usb-status-info">
          <span className="grabv2-usb-status-label">{conectado ? 'CONECTADO' : 'DESCONECTADO'}</span>
          <span className="grabv2-usb-status-sub">
            {conectado
              ? 'Acordeón físico sincronizado a 115200 baud'
              : 'Selecciona el puerto COM para conectar'}
          </span>
        </div>
      </div>

      <div className="grabv2-usb-acciones">
        <button
          className="grabv2-usb-btn grabv2-usb-btn-conectar"
          onClick={onConectar}
          disabled={conectado || !soportaWebSerial}
        >
          <Usb size={14} /> {conectado ? 'Ya conectado' : 'Conectar'}
        </button>
        <button
          className="grabv2-usb-btn grabv2-usb-btn-desconectar"
          onClick={onDesconectar || onConectar}
          disabled={!conectado}
        >
          <WifiOff size={14} /> Desconectar
        </button>
      </div>

      {!soportaWebSerial && (
        <div className="grabv2-usb-warning">
          <AlertCircle size={14} />
          <span>
            Tu navegador no soporta Web Serial API. Usá Chrome o Edge 89+ para conectar el hardware.
          </span>
        </div>
      )}

      <div className="grabv2-usb-card">
        <div className="grabv2-usb-card-titulo">
          <Sparkles size={11} /> Información técnica
        </div>
        <dl className="grabv2-usb-info-grid">
          <dt>Protocolo</dt><dd>Serial USB (115200 baud)</dd>
          <dt>Dispositivo</dt><dd>ESP32-S3 (Accordeon Hardware)</dd>
          <dt>Datos</dt><dd>H1 · H2 · H3 · Bajos · Fuelle</dd>
          <dt>Estado</dt><dd className={conectado ? 'ok' : 'pending'}>
            {conectado ? '✓ Sincronizado' : '⏳ Esperando conexión'}
          </dd>
        </dl>
      </div>

      <div className="grabv2-usb-card">
        <div className="grabv2-usb-card-titulo">¿Cómo conectar?</div>
        <ol className="grabv2-usb-pasos">
          <li>Enchufá el acordeón ESP32 a una puerta USB del computador.</li>
          <li>Hacé click en <b>Conectar</b>.</li>
          <li>Seleccioná el puerto COM en el navegador.</li>
          <li>El estado debe cambiar a <b className="ok">CONECTADO</b>.</li>
          <li>Listo: tocá en el hardware y se sincroniza con el grabador.</li>
        </ol>
      </div>
    </div>
  );
};

export default React.memo(PanelUSBV2);
