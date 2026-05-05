import React from 'react';
import { Play, Music, ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useCancionesProMax } from '../../Hooks/useCancionesProMax';
import type { CancionHeroConTonalidad } from '../../TiposProMax';

interface SeccionPLLibreriaProps {
  onSeleccionarCancion: (cancion: CancionHeroConTonalidad) => void;
  onSeleccionarSeccion?: (cancion: CancionHeroConTonalidad, seccion: any) => void;
}

const TIPO_ICONO: Record<string, string> = {
  cancion: '🎵',
  ejercicio: '📚',
  secuencia: '🎼',
};

const DIFICULTAD_COLOR: Record<string, string> = {
  BASICO: '#22c55e',
  INTERMEDIO: '#f59e0b',
  PROFESIONAL: '#ef4444',
};

const formatearTiempoTicks = (ticks: number, bpm: number, resolucion = 192) => {
  const seg = (ticks / resolucion) * (60 / Math.max(1, bpm));
  const m = Math.floor(seg / 60);
  const s = Math.floor(seg % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const parsearSecciones = (raw: any): any[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; }
    catch { return []; }
  }
  return [];
};

const SeccionPLLibreria: React.FC<SeccionPLLibreriaProps> = ({
  onSeleccionarCancion,
  onSeleccionarSeccion,
}) => {
  const { canciones, cargando, error } = useCancionesProMax();
  const [filtroTipo, setFiltroTipo] = React.useState<'todos' | 'cancion' | 'ejercicio' | 'secuencia'>('todos');
  const [expandidas, setExpandidas] = React.useState<Set<string>>(new Set());

  const cancionesFiltradas = React.useMemo(() => {
    return canciones.filter((c: any) => filtroTipo === 'todos' || c.tipo === filtroTipo);
  }, [canciones, filtroTipo]);

  const alternarExpandida = (id: string) => {
    setExpandidas((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id); else nuevo.add(id);
      return nuevo;
    });
  };

  if (cargando) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Cargando librería…</div>;
  }
  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#ef4444' }}>Error: {error}</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '4px' }}>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {(['todos', 'cancion', 'ejercicio', 'secuencia'] as const).map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              background: filtroTipo === tipo ? '#3b82f6' : 'rgba(255,255,255,0.06)',
              color: filtroTipo === tipo ? 'white' : '#cbd5e1',
              transition: 'all 0.15s',
            }}
          >
            {tipo === 'todos' ? 'Todos' : tipo.charAt(0).toUpperCase() + tipo.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {cancionesFiltradas.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '30px', color: '#64748b' }}>
            <Music size={28} opacity={0.3} />
            <span style={{ fontSize: '13px' }}>No hay canciones en la librería</span>
          </div>
        ) : (
          cancionesFiltradas.map((cancion: any) => {
            const dif = (cancion.dificultad || '').toUpperCase();
            const secciones = parsearSecciones(cancion.secciones);
            const expandida = expandidas.has(cancion.id);
            const tieneSecciones = secciones.length > 0;
            const bpm = cancion.bpm || 120;
            const resolucion = cancion.resolucion || 192;

            return (
              <div
                key={cancion.id}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                  <button
                    onClick={() => tieneSecciones && alternarExpandida(cancion.id)}
                    disabled={!tieneSecciones}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: tieneSecciones ? 'pointer' : 'default',
                      color: '#94a3b8',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={tieneSecciones ? 'Ver secciones' : 'Sin secciones'}
                  >
                    {tieneSecciones ? (expandida ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span style={{ width: 16, display: 'inline-block' }} />}
                  </button>

                  <div style={{ fontSize: '20px' }}>{TIPO_ICONO[cancion.tipo] || '🎶'}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: 'white', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cancion.titulo}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px', fontSize: '11px', color: '#94a3b8' }}>
                      <span>{bpm} BPM</span>
                      {dif && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '999px',
                            background: DIFICULTAD_COLOR[dif] ?? '#6b7280',
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          {dif}
                        </span>
                      )}
                      {tieneSecciones && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Layers size={11} /> {secciones.length}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onSeleccionarCancion(cancion)}
                    style={{
                      background: '#22c55e',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 10px',
                      cursor: 'pointer',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                    title="Reproducir desde el inicio"
                  >
                    <Play size={12} fill="white" /> Tocar
                  </button>
                </div>

                {expandida && tieneSecciones && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '6px 10px 10px 38px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {secciones.map((sec: any, i: number) => {
                      const tickInicio = sec.tickInicio ?? sec.inicio ?? 0;
                      const tickFin = sec.tickFin ?? sec.fin ?? 0;
                      const nombre = sec.nombre || `Sección ${i + 1}`;
                      return (
                        <button
                          key={sec.id ?? i}
                          onClick={() => onSeleccionarSeccion?.(cancion, sec)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            background: 'rgba(59,130,246,0.08)',
                            border: '1px solid rgba(59,130,246,0.2)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            color: '#dbeafe',
                            fontSize: '12px',
                            textAlign: 'left',
                          }}
                          title={`Tocar ${nombre}`}
                        >
                          <Play size={11} fill="currentColor" />
                          <span style={{ flex: 1, fontWeight: 600 }}>{nombre}</span>
                          <span style={{ fontSize: '10px', opacity: 0.7 }}>
                            {formatearTiempoTicks(tickInicio, bpm, resolucion)} → {formatearTiempoTicks(tickFin, bpm, resolucion)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SeccionPLLibreria;
