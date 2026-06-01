import * as React from 'react';
import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import './PestanaGeolocalizacion.css';
import {
  obtenerHistorialUsuario,
  obtenerEstadisticasUsuario,
  detectarRiesgo,
  colorRiesgo
} from '../../../../../servicios/servicioGeolocalizacion';

interface PestanaGeolocalizacionProps {
  usuario: any;
}

const PestanaGeolocalizacion: React.FC<PestanaGeolocalizacionProps> = ({ usuario }) => {
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState({ totalRegistros: 0, visitas: 0, paisesUnicos: 0 });

  useEffect(() => {
    if (usuario?.id) cargarTodo();
  }, [usuario.id]);

  async function cargarTodo() {
    try {
      setCargando(true);
      setError('');
      const [hist, stats] = await Promise.all([
        obtenerHistorialUsuario(usuario.id, 20),
        obtenerEstadisticasUsuario(usuario.id),
      ]);
      setHistorial(hist || []);
      setEstadisticas(stats || { totalRegistros: 0, visitas: 0, paisesUnicos: 0 });
    } catch (e: any) {
      setError(e.message || 'Error cargando ubicación');
    } finally {
      setCargando(false);
    }
  }

  function exportarCSV() {
    if (!historial.length) return;
    const encabezados = ['#', 'Ciudad', 'Region', 'Pais', 'IP', 'ISP', 'Movil', 'Primera visita', 'Ultima visita', 'Visitas'];
    const filas = historial.map((h, i) => [
      i + 1, h.ciudad || '', h.region || '', h.pais || '', h.ip || '', h.proveedor || h.isp || '',
      h.es_movil ? 'Si' : 'No', h.primera_visita || '', h.ultima_visita || '', h.visitas_totales || 0
    ]);
    const contenido = [encabezados, ...filas].map(arr => arr.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ubicaciones_${usuario.id}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const ultima = historial[0] || null;
  const riesgoNivel = useMemo(() => ultima ? detectarRiesgo(ultima) : 'BAJO', [ultima]);
  const riesgoColor = useMemo(() => colorRiesgo(riesgoNivel), [riesgoNivel]);
  const mapsHref = ultima?.latitud ? `https://www.google.com/maps?q=${ultima.latitud},${ultima.longitud}` : null;

  return (
    <div className="ugeo-container">
      <div className="ugeo-header">
        <div className="ugeo-title">
          <h3>Ubicación del Usuario</h3>
          <p>Ubicaciones reales detectadas en cada inicio de sesión del usuario</p>
        </div>
        <div className="ugeo-actions">
          <button className="ugeo-btn-tracking" onClick={cargarTodo} disabled={cargando}>
            {cargando ? <div className="ugeo-spinner-sm" /> : null}
            Actualizar
          </button>
          <button className="ugeo-btn-export" onClick={exportarCSV} disabled={!historial.length}>Exportar Historial</button>
        </div>
      </div>

      {cargando ? (
        <div className="ugeo-loading"><div className="ugeo-spinner" />Cargando ubicaciones reales...</div>
      ) : error ? (
        <div className="ugeo-loading">{error}</div>
      ) : (
        <>
          <div className="ugeo-current-location">
            <div className="ugeo-location-header">
              <h4>Última ubicación conocida (último login)</h4>
              {ultima && (
                <div className="ugeo-connection-status" style={{ backgroundColor: `${riesgoColor}20`, color: riesgoColor, borderColor: riesgoColor, border: '1px solid' }}>
                  Riesgo {riesgoNivel}
                </div>
              )}
            </div>

            {ultima ? (
              <>
                <div className="ugeo-location-details">
                  <div className="ugeo-detail-main">
                    {ultima.bandera_url && <Image src={ultima.bandera_url} alt={ultima.pais ?? ''} width={48} height={36} />}
                    <div className="ugeo-place-data">
                      <div className="ugeo-place-name">{[ultima.ciudad, ultima.region, ultima.pais].filter(Boolean).join(', ')}</div>
                      <div className="ugeo-place-ip">IP {ultima.ip}</div>
                    </div>
                  </div>
                  <div className="ugeo-connection-details">
                    <div className="ugeo-detail-item"><span className="ugeo-detail-label">Proveedor</span><span className="ugeo-detail-value">{ultima.proveedor || ultima.isp || 'Desconocido'}</span></div>
                    <div className="ugeo-detail-item"><span className="ugeo-detail-label">Conexión</span><span className="ugeo-detail-value">{ultima.es_movil ? 'Móvil' : 'Fija'}{ultima.es_vpn ? ' · VPN' : ''}{ultima.es_proxy ? ' · Proxy' : ''}</span></div>
                    <div className="ugeo-detail-item"><span className="ugeo-detail-label">Último acceso</span><span className="ugeo-detail-value">{ultima.ultima_visita ? new Date(ultima.ultima_visita).toLocaleString('es-ES') : '—'}</span></div>
                    <div className="ugeo-detail-item"><span className="ugeo-detail-label">Coordenadas</span><span className="ugeo-detail-value">{ultima.latitud ? `${ultima.latitud}, ${ultima.longitud}` : 'N/A'}</span></div>
                  </div>
                </div>
                {mapsHref && (
                  <a className="ugeo-btn-export" href={mapsHref} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 12, textDecoration: 'none' }}>
                    📍 Ver en Google Maps
                  </a>
                )}
              </>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                Aún no hay ubicaciones registradas para este usuario. Se capturan automáticamente la próxima vez que el usuario inicie sesión.
              </div>
            )}
          </div>

          <div className="ugeo-stats-grid">
            <div className="ugeo-stat-item"><div className="ugeo-stat-numero">{estadisticas.totalRegistros}</div><div className="ugeo-stat-label">Ubicaciones</div></div>
            <div className="ugeo-stat-item"><div className="ugeo-stat-numero">{estadisticas.visitas}</div><div className="ugeo-stat-label">Visitas Totales</div></div>
            <div className="ugeo-stat-item"><div className="ugeo-stat-numero">{estadisticas.paisesUnicos}</div><div className="ugeo-stat-label">Países</div></div>
          </div>

          <div className="ugeo-history-section">
            <h4>Historial de Ubicaciones</h4>
            {historial.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>No hay historial disponible para este usuario.</div>
            ) : (
              <div className="ugeo-history-list">
                {historial.map((h: any, idx: number) => (
                  <div key={h.id || idx} className={`ugeo-history-item ${idx === 0 ? 'ugeo-active' : ''}`}>
                    <div className="ugeo-history-order">{idx + 1}</div>
                    <div className="ugeo-place-main">
                      {h.bandera_url && <Image src={h.bandera_url} alt={h.pais ?? ''} width={32} height={24} />}
                      <div className="ugeo-place-data">
                        <div className="ugeo-place-name">{[h.ciudad, h.region, h.pais].filter(Boolean).join(', ')}</div>
                        <div className="ugeo-place-ip">{h.ip}</div>
                      </div>
                    </div>
                    <div className="ugeo-history-conn">
                      <div className="ugeo-conn-type">{h.es_movil ? 'Móvil' : 'Fija'}</div>
                      <div className="ugeo-conn-isp">{h.proveedor || h.isp || ''}</div>
                    </div>
                    <div className="ugeo-history-time">
                      <div className="ugeo-time-date">{h.primera_visita ? new Date(h.primera_visita).toLocaleDateString('es-ES') : '-'}</div>
                      <div className="ugeo-time-relative">{h.ultima_visita ? new Date(h.ultima_visita).toLocaleString('es-ES') : '-'}</div>
                    </div>
                    <div className="ugeo-history-visits">
                      <div className="ugeo-visits-num">{h.visitas_totales || 1}</div>
                      <div className="ugeo-visits-label">visitas</div>
                    </div>
                    <div className="ugeo-risk-indicator-list">
                      {(() => { const n = detectarRiesgo(h); const c = colorRiesgo(n); return (<div className="ugeo-risk-badge" style={{ backgroundColor: `${c}20`, color: c }}>{n}</div>); })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PestanaGeolocalizacion;
