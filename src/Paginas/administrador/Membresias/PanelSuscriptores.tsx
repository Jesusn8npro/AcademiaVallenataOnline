'use client';

import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { cargarUsuariosEnriquecido, type UsuarioAdminEnriquecido } from '../../../servicios/usuariosAdminService';

const fmtFecha = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtTiempo = (min?: number | null) => { const m = min || 0; return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`; };

interface Alerta { texto: string; cls: string; }

function alertasDe(u: UsuarioAdminEnriquecido): Alerta[] {
  const out: Alerta[] = [];
  const tiene = !!u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa';
  const dias = u.membresia_dias_restantes;
  if (tiene && dias != null && dias < 0) out.push({ texto: 'Vencida', cls: 'rojo' });
  else if (tiene && dias != null && dias <= 7) out.push({ texto: `Vence en ${dias}d`, cls: 'ambar' });
  if (tiene && (u.dias_activos || 0) === 0) out.push({ texto: 'Sin uso', cls: 'gris' });
  if ((u.total_contenido || 0) >= 15) out.push({ texto: 'Uso intensivo', cls: 'morado' });
  if ((u.total_tutoriales || 0) >= 20) out.push({ texto: 'Muchos tutoriales', cls: 'azul' });
  return out;
}

export default function PanelSuscriptores() {
  const [usuarios, setUsuarios] = useState<UsuarioAdminEnriquecido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPlan, setFiltroPlan] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [orden, setOrden] = useState<{ campo: string; dir: 'asc' | 'desc' }>({ campo: 'dias', dir: 'asc' });

  useEffect(() => {
    (async () => {
      setCargando(true);
      try { setUsuarios(await cargarUsuariosEnriquecido(false)); } catch { /* */ }
      setCargando(false);
    })();
  }, []);

  const planes = useMemo(() => Array.from(new Set(usuarios.filter(u => u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa').map(u => u.membresia_nombre!))), [usuarios]);

  const resumen = useMemo(() => {
    const conMembresia = usuarios.filter(u => u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa');
    const porPlan: Record<string, number> = {};
    conMembresia.forEach(u => { porPlan[u.membresia_nombre!] = (porPlan[u.membresia_nombre!] || 0) + 1; });
    const porVencer = conMembresia.filter(u => (u.membresia_dias_restantes ?? 999) <= 7 && (u.membresia_dias_restantes ?? 999) >= 0).length;
    const alertas = usuarios.filter(u => alertasDe(u).length > 0).length;
    return { conMembresia: conMembresia.length, porPlan, porVencer, alertas, total: usuarios.length };
  }, [usuarios]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const arr = usuarios.filter(u => {
      const tiene = !!u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa';
      const mq = !q || (u.nombre_completo || '').toLowerCase().includes(q) || (u.correo_electronico || '').toLowerCase().includes(q);
      const mp = filtroPlan === 'todos'
        || (filtroPlan === 'sin_plan' && !tiene && (u.total_contenido || 0) === 0)
        || (filtroPlan === 'solo_tutoriales' && !tiene && (u.total_contenido || 0) > 0)
        || u.membresia_nombre === filtroPlan;
      const dias = u.membresia_dias_restantes;
      const me = filtroEstado === 'todos'
        || (filtroEstado === 'activa' && tiene)
        || (filtroEstado === 'por_vencer' && tiene && (dias ?? 999) <= 7 && (dias ?? 999) >= 0)
        || (filtroEstado === 'vencida' && tiene && dias != null && dias < 0);
      return mq && mp && me;
    });
    const dir = orden.dir === 'asc' ? 1 : -1;
    const val = (u: UsuarioAdminEnriquecido): number | string => {
      switch (orden.campo) {
        case 'nombre': return (u.nombre_completo || '').toLowerCase();
        case 'plan': return u.membresia_nombre || 'zzz';
        case 'uso': return (u.tiempo_total_min || 0);
        case 'contenido': return (u.total_contenido || 0);
        default: return (u.membresia_dias_restantes ?? 99999);
      }
    };
    return arr.sort((a, b) => { const av = val(a), bv = val(b); return av < bv ? -1 * dir : av > bv ? 1 * dir : 0; });
  }, [usuarios, busqueda, filtroPlan, filtroEstado, orden]);

  const cambiarOrden = (campo: string) => setOrden(o => o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' });
  const ind = (campo: string) => orden.campo === campo ? (orden.dir === 'asc' ? ' ▲' : ' ▼') : '';

  return (
    <div className="psus">
      <div className="psus-resumen">
        <div className="psus-stat"><strong>{resumen.conMembresia}</strong><span>Con membresía</span></div>
        {Object.entries(resumen.porPlan).map(([plan, n]) => (
          <div key={plan} className="psus-stat"><strong>{n}</strong><span>{plan}</span></div>
        ))}
        <div className="psus-stat alerta"><strong>{resumen.porVencer}</strong><span>Por vencer ≤7d</span></div>
        <div className="psus-stat morado"><strong>{resumen.alertas}</strong><span>Con alertas</span></div>
      </div>

      <div className="psus-filtros">
        <input className="psus-input" placeholder="Buscar por nombre o correo…" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select className="psus-input" value={filtroPlan} onChange={e => setFiltroPlan(e.target.value)}>
          <option value="todos">Todos los planes</option>
          {planes.map(p => <option key={p} value={p}>{p}</option>)}
          <option value="solo_tutoriales">Solo tutoriales sueltos</option>
          <option value="sin_plan">Sin contenido</option>
        </select>
        <select className="psus-input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
          <option value="todos">Todo estado</option>
          <option value="activa">Membresía activa</option>
          <option value="por_vencer">Por vencer (≤7d)</option>
          <option value="vencida">Vencida</option>
        </select>
        <span className="psus-count">{filtrados.length} usuarios</span>
      </div>

      {cargando ? (
        <div className="psus-loading"><div className="madm-spinner" />Cargando suscriptores…</div>
      ) : (
        <div className="psus-tabla-wrap">
          <table className="psus-tabla">
            <thead>
              <tr>
                <th className="psus-sort" onClick={() => cambiarOrden('nombre')}>Usuario{ind('nombre')}</th>
                <th className="psus-sort" onClick={() => cambiarOrden('plan')}>Plan{ind('plan')}</th>
                <th className="psus-sort" onClick={() => cambiarOrden('dias')}>Días restantes{ind('dias')}</th>
                <th>Vence</th>
                <th className="psus-sort" onClick={() => cambiarOrden('uso')}>Uso del plan{ind('uso')}</th>
                <th className="psus-sort" onClick={() => cambiarOrden('contenido')}>Contenidos{ind('contenido')}</th>
                <th>Alertas</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(u => {
                const tiene = !!u.membresia_nombre && (u.membresia_estado || '').toLowerCase() === 'activa';
                const dias = u.membresia_dias_restantes;
                const alertas = alertasDe(u);
                return (
                  <tr key={u.id}>
                    <td>
                      <a className="psus-usuario" href={`/administrador/usuarios?usuario=${u.id}`}>
                        <span className="psus-nombre">{u.nombre_completo || u.correo_electronico}</span>
                        <span className="psus-correo">{u.correo_electronico}{u.en_linea ? ' · 🟢 conectado' : ''}</span>
                      </a>
                    </td>
                    <td>
                      {tiene ? <span className="psus-badge" style={{ background: u.membresia_color || '#7c3aed', color: '#fff' }}>{u.membresia_nombre}</span>
                        : (u.total_contenido || 0) > 0 ? <span className="psus-badge gris">Solo contenido</span>
                          : <span className="psus-badge gris">Sin plan</span>}
                    </td>
                    <td>{tiene && dias != null ? <span className={dias < 0 ? 'psus-dias rojo' : dias <= 7 ? 'psus-dias ambar' : 'psus-dias'}>{dias < 0 ? 'Vencida' : `${dias} días`}</span> : '—'}</td>
                    <td className="psus-muted">{tiene ? fmtFecha(u.membresia_vence) : '—'}</td>
                    <td><div className="psus-uso"><span>{u.dias_activos || 0} días · {u.sesiones_total || 0} ses.</span><small>{fmtTiempo(u.tiempo_total_min)}</small></div></td>
                    <td><span className="psus-conts">📚 {u.total_cursos || 0} · 🎬 {u.total_tutoriales || 0} · 📦 {u.total_paquetes || 0}</span></td>
                    <td>
                      <div className="psus-alertas">
                        {alertas.length === 0 ? <span className="psus-ok">✓ OK</span> : alertas.map((a, i) => <span key={i} className={`psus-alerta ${a.cls}`}>{a.texto}</span>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
