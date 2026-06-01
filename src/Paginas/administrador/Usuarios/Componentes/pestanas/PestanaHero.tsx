import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../../servicios/clienteSupabase';

interface Props { usuario: any; }

const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const pct = (n?: number | null) => n != null ? `${Math.round(Number(n))}%` : '—';

interface StatsCancion {
  cancion_id: string; titulo: string; autor: string;
  intentos: number; mejorPuntuacion: number; mejorPrecision: number; precisionPromedio: number;
  primeraPrecision: number; ultimaPrecision: number; mejora: number; rachaMax: number;
  xpTotal: number; ultimaFecha: string; abandonos: number;
}

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, padding: '4px 2px' },
  resumen: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 },
  statCard: { background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: 14, textAlign: 'center' },
  statNum: { fontSize: 24, fontWeight: 800, color: '#fff' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.03em' },
  card: { background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 12, padding: 14 },
  cancionHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 },
  cancionTitulo: { fontSize: 14, fontWeight: 700, color: '#fff' },
  metricaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 10 },
  metrica: { display: 'flex', flexDirection: 'column' },
  metricaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' },
  metricaValor: { fontSize: 15, fontWeight: 700, color: '#c4b5fd' },
  vacio: { color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', fontSize: 13 },
  barra: { height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden', marginTop: 4 },
};

const PestanaHero: React.FC<Props> = ({ usuario }) => {
  const [cargando, setCargando] = useState(true);
  const [scores, setScores] = useState<any[]>([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      const { data } = await supabase
        .from('scores_hero')
        .select('cancion_id, puntuacion, precision_porcentaje, racha_maxima, xp_ganado, abandono, created_at, canciones_hero(titulo, autor)')
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: true });
      if (!activo) return;
      setScores(data || []);
      setCargando(false);
    })();
    return () => { activo = false; };
  }, [usuario.id]);

  const { porCancion, totales } = useMemo(() => {
    const mapa = new Map<string, any[]>();
    for (const sc of scores) {
      const k = sc.cancion_id || 'sin-cancion';
      if (!mapa.has(k)) mapa.set(k, []);
      mapa.get(k)!.push(sc);
    }
    const porCancion: StatsCancion[] = Array.from(mapa.entries()).map(([cancion_id, lista]) => {
      const precs = lista.map(x => Number(x.precision_porcentaje) || 0);
      return {
        cancion_id,
        titulo: lista[0]?.canciones_hero?.titulo || 'Canción desconocida',
        autor: lista[0]?.canciones_hero?.autor || '',
        intentos: lista.length,
        mejorPuntuacion: Math.max(...lista.map(x => x.puntuacion || 0)),
        mejorPrecision: Math.max(...precs),
        precisionPromedio: precs.reduce((a, b) => a + b, 0) / (precs.length || 1),
        primeraPrecision: precs[0] || 0,
        ultimaPrecision: precs[precs.length - 1] || 0,
        mejora: (precs[precs.length - 1] || 0) - (precs[0] || 0),
        rachaMax: Math.max(...lista.map(x => x.racha_maxima || 0)),
        xpTotal: lista.reduce((a, b) => a + (b.xp_ganado || 0), 0),
        ultimaFecha: lista[lista.length - 1]?.created_at,
        abandonos: lista.filter(x => x.abandono).length,
      };
    }).sort((a, b) => new Date(b.ultimaFecha).getTime() - new Date(a.ultimaFecha).getTime());

    const totales = {
      intentos: scores.length,
      canciones: porCancion.length,
      xp: porCancion.reduce((a, b) => a + b.xpTotal, 0),
      mejorPrecision: porCancion.length ? Math.max(...porCancion.map(c => c.mejorPrecision)) : 0,
    };
    return { porCancion, totales };
  }, [scores]);

  if (cargando) return <div style={s.vacio}>Cargando estadísticas del simulador…</div>;
  if (scores.length === 0) return <div style={s.vacio}>Este usuario aún no ha jugado en Acordeón Hero Pro Max.</div>;

  return (
    <div style={s.wrap}>
      <div style={s.resumen}>
        <div style={s.statCard}><div style={s.statNum}>{totales.intentos}</div><div style={s.statLabel}>Intentos totales</div></div>
        <div style={s.statCard}><div style={s.statNum}>{totales.canciones}</div><div style={s.statLabel}>Canciones</div></div>
        <div style={s.statCard}><div style={s.statNum}>{pct(totales.mejorPrecision)}</div><div style={s.statLabel}>Mejor precisión</div></div>
        <div style={s.statCard}><div style={s.statNum}>{totales.xp.toLocaleString('es-CO')}</div><div style={s.statLabel}>XP ganado</div></div>
      </div>

      {porCancion.map((c) => (
        <div key={c.cancion_id} style={s.card}>
          <div style={s.cancionHead}>
            <div>
              <div style={s.cancionTitulo}>{c.titulo}</div>
              {c.autor && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{c.autor}</div>}
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: c.mejora > 0 ? 'rgba(34,197,94,0.2)' : c.mejora < 0 ? 'rgba(239,68,68,0.2)' : 'rgba(148,163,184,0.2)', color: c.mejora > 0 ? '#86efac' : c.mejora < 0 ? '#fca5a5' : '#cbd5e1' }}>
              {c.mejora > 0 ? `▲ +${Math.round(c.mejora)}%` : c.mejora < 0 ? `▼ ${Math.round(c.mejora)}%` : '= sin cambio'}
            </span>
          </div>
          <div style={s.metricaGrid}>
            <div style={s.metrica}><span style={s.metricaLabel}>Intentos</span><span style={s.metricaValor}>{c.intentos}</span></div>
            <div style={s.metrica}><span style={s.metricaLabel}>Mejor punt.</span><span style={s.metricaValor}>{c.mejorPuntuacion.toLocaleString('es-CO')}</span></div>
            <div style={s.metrica}><span style={s.metricaLabel}>Mejor prec.</span><span style={s.metricaValor}>{pct(c.mejorPrecision)}</span></div>
            <div style={s.metrica}><span style={s.metricaLabel}>Prec. prom.</span><span style={s.metricaValor}>{pct(c.precisionPromedio)}</span></div>
            <div style={s.metrica}><span style={s.metricaLabel}>Racha máx.</span><span style={s.metricaValor}>{c.rachaMax}</span></div>
            <div style={s.metrica}><span style={s.metricaLabel}>Último</span><span style={{ ...s.metricaValor, fontSize: 12 }}>{fmt(c.ultimaFecha)}</span></div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Evolución: {pct(c.primeraPrecision)} → {pct(c.ultimaPrecision)}</div>
            <div style={s.barra}><div style={{ width: `${Math.min(100, c.ultimaPrecision)}%`, height: '100%', background: 'linear-gradient(90deg,#7c3aed,#22d3ee)' }} /></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PestanaHero;
