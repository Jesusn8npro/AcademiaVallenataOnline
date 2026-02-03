import React, { useEffect, useMemo, useState } from 'react';
import './PestanaGeolocalizacion.css';
import {
  obtenerIPPublica,
  obtenerDatosGeolocalizacion,
  guardarGeolocalizacionUsuario,
  obtenerHistorialUsuario,
  obtenerEstadisticasUsuario,
  detectarRiesgo,
  colorRiesgo
} from '../../../../../servicios/geolocalizacionService';
import { supabase } from '../../../../../servicios/supabaseCliente';

interface PestanaGeolocalizacionProps {
  usuario: any;
}

const PestanaGeolocalizacion: React.FC<PestanaGeolocalizacionProps> = ({ usuario }) => {
  const [ubicacionActual, setUbicacionActual] = useState<any>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [capturando, setCapturando] = useState(false);
  const [estadisticas, setEstadisticas] = useState({ totalRegistros: 0, visitas: 0, paisesUnicos: 0 });

  useEffect(() => {
    if (usuario?.id) {
      cargarTodo();
    }
  }, [usuario.id]);

  async function cargarTodo() {
    try {
      setCargando(true);
      setError('');

      // Verificamos auth pero no es estrictamente necesario para cargar historial, solo para capturar.
      // Pero mantendremos el flujo original.

      // Cargar Historial y Estadísticas primero (no dependen de IP actual)
      const hist = await obtenerHistorialUsuario(usuario.id, 10);
      setHistorial(hist || []);

      const stats = await obtenerEstadisticasUsuario(usuario.id);
      setEstadisticas(stats || { totalRegistros: 0, visitas: 0, paisesUnicos: 0 });

      // Intentar obtener ubicación actual (IP pública) pero no bloquear si falla
      try {
        const ip = await obtenerIPPublica();
        if (ip) {
          const datos = await obtenerDatosGeolocalizacion(ip);
          setUbicacionActual(datos);

          // Solo guardamos si capturamos explícitamente o es la primera vez?
          // La lógica original guardaba automáticamente al cargar. 
          // Mantenemos eso pero con cuidado de permisos.

          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            let targetUserId = user.id;
            if (usuario.id !== user.id) {
              const { data: perfilActual } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
              const rolActual = (perfilActual?.rol || '');
              const rolLc = rolActual.toLowerCase();
              const isAdmin = rolLc.includes('admin') || rolLc.includes('administrador');
              targetUserId = isAdmin ? usuario.id : user.id;
            }
            // Opcional: auto-guardar al visitar la pestaña (tracking pasivo)
            await guardarGeolocalizacionUsuario(targetUserId, datos);
          }
        }
      } catch (err: any) {
        console.warn("No se pudo obtener ubicación actual automática:", err);
        // No seteamos error global para no ocultar el historial
      }

    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error cargando historial');
    } finally {
      setCargando(false);
    }
  }

  async function capturarManual() {
    try {
      setCapturando(true);
      setError('');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Debes iniciar sesión para capturar ubicación'); return; }

      const ip = await obtenerIPPublica();
      const datos = await obtenerDatosGeolocalizacion(ip);
      setUbicacionActual(datos);

      let targetUserId = user.id;
      if (usuario.id !== user.id) {
        const { data: perfilActual } = await supabase.from('perfiles').select('rol').eq('id', user.id).single();
        const rolActual = (perfilActual?.rol || '');
        const rolLc = rolActual.toLowerCase();
        const isAdmin = rolLc.includes('admin') || rolLc.includes('administrador');
        targetUserId = isAdmin ? usuario.id : user.id;
      }

      await guardarGeolocalizacionUsuario(targetUserId, datos);

      // Recargar historial
      const hist = await obtenerHistorialUsuario(usuario.id, 10);
      setHistorial(hist || []);
      const stats = await obtenerEstadisticasUsuario(usuario.id);
      setEstadisticas(stats || { totalRegistros: 0, visitas: 0, paisesUnicos: 0 });

    } catch (e: any) {
      setError(e.message || 'Error capturando ubicación');
    } finally {
      setCapturando(false);
    }
  }

  function exportarCSV() {
    if (!historial.length) return;
    const encabezados = ['#', 'Ciudad', 'Pais', 'IP', 'ISP', 'Conexion', 'Primera visita', 'Ultima visita', 'Visitas'];
    const filas = historial.map((h, i) => [
      i + 1,
      h.ciudad || '',
      h.pais || '',
      h.ip || '',
      h.isp || '',
      h.tipo_conexion || '',
      h.primera_visita || '',
      h.ultima_visita || '',
      h.visitas_totales || 0
    ]);
    const contenido = [encabezados, ...filas].map(arr => arr.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geolocalizacion_${usuario.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const riesgoNivel = useMemo(() => ubicacionActual ? detectarRiesgo(ubicacionActual) : 'BAJO', [ubicacionActual]);
  const riesgoColor = useMemo(() => colorRiesgo(riesgoNivel), [riesgoNivel]);

  return (
    <div className="ugeo-container">
      <div className="ugeo-header">
        <div className="ugeo-title">
          <h3>Geolocalización del Usuario</h3>
          <p>Ubicación, conexión y seguridad</p>
        </div>
        <div className="ugeo-actions">
          <button className="ugeo-btn-tracking" onClick={capturarManual} disabled={capturando}>
            {capturando ? <div className="ugeo-spinner-sm" /> : null}
            Capturar Ubicación Actual
          </button>
          <button className="ugeo-btn-export" onClick={exportarCSV}>Exportar Historial</button>
        </div>
      </div>

      {cargando ? (
        <div className="ugeo-loading">
          <div className="ugeo-spinner" />
          Cargando datos de geolocalización...
        </div>
      ) : error ? (
        <div className="ugeo-loading">{error}</div>
      ) : (
        <>
          {/* SECCIÓN UBICACIÓN ACTUAL */}
          <div className="ugeo-current-location">
            <div className="ugeo-location-header">
              <h4>Ubicación Actual (Detectada)</h4>
              <div
                className="ugeo-connection-status"
                style={{
                  backgroundColor: `${riesgoColor}20`,
                  color: riesgoColor,
                  borderColor: riesgoColor,
                  border: '1px solid'
                }}
              >
                Riesgo {riesgoNivel}
              </div>
            </div>

            {ubicacionActual ? (
              <>
                <div className="ugeo-location-details">
                  <div className="ugeo-detail-main">
                    {ubicacionActual?.bandera_url && (
                      <img src={ubicacionActual.bandera_url} alt={ubicacionActual?.pais} width={48} height={36} />
                    )}
                    <div className="ugeo-place-data">
                      <div className="ugeo-place-name">
                        {ubicacionActual?.ciudad}, {ubicacionActual?.region} - {ubicacionActual?.pais}
                      </div>
                      <div className="ugeo-place-ip">IP {ubicacionActual?.ip}</div>
                    </div>
                  </div>
                  <div className="ugeo-connection-details">
                    <div className="ugeo-detail-item">
                      <span className="ugeo-detail-label">Proveedor</span>
                      <span className="ugeo-detail-value">{ubicacionActual?.isp || 'Desconocido'}</span>
                    </div>
                    <div className="ugeo-detail-item">
                      <span className="ugeo-detail-label">Tipo Conexión</span>
                      <span className="ugeo-detail-value">{ubicacionActual?.tipo_conexion || 'Desconocido'}</span>
                    </div>
                    <div className="ugeo-detail-item">
                      <span className="ugeo-detail-label">Zona Horaria</span>
                      <span className="ugeo-detail-value">{ubicacionActual?.zona_horaria || 'Desconocido'}</span>
                    </div>
                    <div className="ugeo-detail-item">
                      <span className="ugeo-detail-label">Coordenadas</span>
                      <span className="ugeo-detail-value">
                        {ubicacionActual?.latitud ? `${ubicacionActual.latitud}, ${ubicacionActual.longitud}` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="ugeo-risk-indicator" style={{ borderColor: riesgoColor }}>
                  <div className="ugeo-risk-level" style={{ color: riesgoColor }}>Nivel {riesgoNivel}</div>
                  <div className="ugeo-risk-desc">Evaluación basada en VPN/Proxy y tipo de conexión</div>
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                No se ha detectado ubicación actual todavía. Haz clic en "Capturar Ubicación Actual".
              </div>
            )}
          </div>

          {/* ESTADÍSTICAS */}
          <div className="ugeo-stats-grid">
            <div className="ugeo-stat-item">
              <div className="ugeo-stat-numero">{estadisticas.totalRegistros}</div>
              <div className="ugeo-stat-label">Registros</div>
            </div>
            <div className="ugeo-stat-item">
              <div className="ugeo-stat-numero">{estadisticas.visitas}</div>
              <div className="ugeo-stat-label">Visitas Totales</div>
            </div>
            <div className="ugeo-stat-item">
              <div className="ugeo-stat-numero">{estadisticas.paisesUnicos}</div>
              <div className="ugeo-stat-label">Países</div>
            </div>
          </div>

          {/* HISTORIAL */}
          <div className="ugeo-history-section">
            <h4>Historial de Ubicación</h4>
            {historial.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                No hay historial disponible para este usuario.
              </div>
            ) : (
              <div className="ugeo-history-list">
                {historial.map((h: any, idx: number) => (
                  <div key={h.id || idx} className={`ugeo-history-item ${idx === 0 ? 'ugeo-active' : ''}`}>
                    <div className="ugeo-history-order">{idx + 1}</div>
                    <div className="ugeo-place-main">
                      {h.bandera_url && (
                        <img src={h.bandera_url} alt={h.pais} width={32} height={24} />
                      )}
                      <div className="ugeo-place-data">
                        <div className="ugeo-place-name">
                          {h.ciudad}, {h.region} - {h.pais}
                        </div>
                        <div className="ugeo-place-ip">{h.ip}</div>
                      </div>
                    </div>
                    <div className="ugeo-history-conn">
                      <div className="ugeo-conn-type">{h.es_movil ? 'Móvil' : 'Fija'}</div>
                      <div className="ugeo-conn-isp">{h.proveedor || h.isp || ''}</div>
                    </div>
                    <div className="ugeo-history-time">
                      <div className="ugeo-time-date">
                        {h.primera_visita ? new Date(h.primera_visita).toLocaleDateString('es-ES') : '-'}
                      </div>
                      <div className="ugeo-time-relative">
                        {h.ultima_visita ? new Date(h.ultima_visita).toLocaleString('es-ES') : '-'}
                      </div>
                    </div>
                    <div className="ugeo-history-visits">
                      <div className="ugeo-visits-num">{h.visitas_totales || 1}</div>
                      <div className="ugeo-visits-label">visitas</div>
                    </div>
                    <div className="ugeo-risk-indicator-list">
                      {(() => {
                        const n = detectarRiesgo(h);
                        const c = colorRiesgo(n);
                        return (
                          <div className="ugeo-risk-badge" style={{ backgroundColor: `${c}20`, color: c }}>
                            {n}
                          </div>
                        );
                      })()}
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
