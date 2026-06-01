'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../servicios/clienteSupabase';

interface Membresia {
  id?: string;
  nombre: string;
  tagline: string | null;
  descripcion: string | null;
  precio_mensual: number | null;
  precio_anual: number | null;
  descuento_anual: number | null;
  color_hex: string | null;
  icono: string | null;
  orden: number | null;
  activa: boolean;
  destacada: boolean;
  beneficios: string[];
}

const VACIA: Membresia = {
  nombre: '', tagline: '', descripcion: '', precio_mensual: 0, precio_anual: null,
  descuento_anual: 0, color_hex: '#7c3aed', icono: '🎵', orden: 99, activa: true, destacada: false, beneficios: [],
};

const money = (v?: number | null) => v != null ? `$${Number(v).toLocaleString('es-CO')}` : '—';

export default function GestionPlanes() {
  const [planes, setPlanes] = useState<Membresia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState<Membresia | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState<Membresia | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string } | null>(null);

  const cargar = async () => {
    setCargando(true);
    const { data } = await supabase.from('membresias').select('*').order('orden', { ascending: true });
    setPlanes((data as any[] || []).map(p => ({ ...p, beneficios: Array.isArray(p.beneficios) ? p.beneficios : [] })));
    setCargando(false);
  };
  useEffect(() => { cargar(); }, []);

  const notificar = (ok: boolean, texto: string) => { setMsg({ ok, texto }); setTimeout(() => setMsg(null), 3500); };

  const guardar = async () => {
    if (!editando) return;
    if (!editando.nombre.trim()) { notificar(false, 'El nombre es obligatorio.'); return; }
    setGuardando(true);
    const payload: any = {
      nombre: editando.nombre.trim(), tagline: editando.tagline, descripcion: editando.descripcion,
      precio_mensual: editando.precio_mensual, precio_anual: editando.precio_anual,
      descuento_anual: editando.descuento_anual, color_hex: editando.color_hex, icono: editando.icono,
      orden: editando.orden, activa: editando.activa, destacada: editando.destacada,
      beneficios: editando.beneficios,
    };
    const resp = editando.id
      ? await supabase.from('membresias').update(payload).eq('id', editando.id)
      : await supabase.from('membresias').insert(payload);
    setGuardando(false);
    if (resp.error) { notificar(false, `Error: ${resp.error.message}`); return; }
    notificar(true, editando.id ? 'Plan actualizado.' : 'Plan creado.');
    setEditando(null);
    cargar();
  };

  const toggle = async (p: Membresia, campo: 'activa' | 'destacada') => {
    const { error } = await supabase.from('membresias').update({ [campo]: !p[campo] }).eq('id', p.id!);
    if (error) { notificar(false, `Error: ${error.message}`); return; }
    setPlanes(prev => prev.map(x => x.id === p.id ? { ...x, [campo]: !x[campo] } : x));
  };

  const eliminar = async () => {
    if (!confirmarBorrar?.id) return;
    const { error } = await supabase.from('membresias').delete().eq('id', confirmarBorrar.id);
    setConfirmarBorrar(null);
    if (error) { notificar(false, `Error: ${error.message}`); return; }
    notificar(true, 'Plan eliminado.');
    cargar();
  };

  return (
    <div>
      <div className="madm-subhead">
        <p>Crea y edita los planes que se muestran en la página pública de membresías.</p>
        <button className="madm-btn-primary" onClick={() => setEditando({ ...VACIA })}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Nuevo plan
        </button>
      </div>

      {msg && <div className={`madm-toast ${msg.ok ? 'ok' : 'err'}`}>{msg.texto}</div>}

      {cargando ? (
        <div className="madm-loading"><div className="madm-spinner" />Cargando planes…</div>
      ) : (
        <div className="madm-grid">
          {planes.map((p) => (
            <article key={p.id} className={`madm-card ${!p.activa ? 'inactiva' : ''}`} style={{ ['--accent' as any]: p.color_hex || '#7c3aed' }}>
              {p.destacada && <span className="madm-card-destacada">★ Destacada</span>}
              <div className="madm-card-top">
                <span className="madm-card-icono">{p.icono || '🎵'}</span>
                <div>
                  <h3>{p.nombre}</h3>
                  <span className="madm-card-tagline">{p.tagline || '—'}</span>
                </div>
              </div>
              <div className="madm-card-precio"><strong>{money(p.precio_mensual)}</strong><span>/mes</span></div>
              <div className="madm-card-anual">{p.precio_anual ? `${money(p.precio_anual)}/año · -${p.descuento_anual || 0}%` : 'Sin precio anual'}</div>
              <ul className="madm-card-beneficios">
                {(p.beneficios || []).slice(0, 5).map((b, i) => (<li key={i}><span>✓</span>{b}</li>))}
                {(p.beneficios || []).length > 5 && <li className="mas">+{p.beneficios.length - 5} beneficios más</li>}
              </ul>
              <div className="madm-card-toggles">
                <button className={`madm-toggle ${p.activa ? 'on' : ''}`} onClick={() => toggle(p, 'activa')}>{p.activa ? '● Activa' : '○ Inactiva'}</button>
                <button className={`madm-toggle ${p.destacada ? 'on dorado' : ''}`} onClick={() => toggle(p, 'destacada')}>{p.destacada ? '★ Destacada' : '☆ Destacar'}</button>
              </div>
              <div className="madm-card-acciones">
                <button className="madm-btn-edit" onClick={() => setEditando({ ...p, beneficios: [...(p.beneficios || [])] })}>Editar</button>
                <button className="madm-btn-del" onClick={() => setConfirmarBorrar(p)} aria-label="Eliminar plan">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2m-9 0v14a2 2 0 002 2h6a2 2 0 002-2V6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editando && (
        <div className="madm-overlay" onClick={() => !guardando && setEditando(null)}>
          <div className="madm-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="madm-modal-head" style={{ ['--accent' as any]: editando.color_hex || '#7c3aed' }}>
              <h2>{editando.id ? 'Editar plan' : 'Nuevo plan'}</h2>
              <button className="madm-modal-close" onClick={() => setEditando(null)} aria-label="Cerrar">✕</button>
            </div>
            <div className="madm-modal-body">
              <div className="madm-form-row">
                <label className="madm-field"><span>Nombre *</span><input value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })} /></label>
                <label className="madm-field madm-icono"><span>Icono</span><input value={editando.icono || ''} onChange={e => setEditando({ ...editando, icono: e.target.value })} maxLength={4} /></label>
                <label className="madm-field madm-color"><span>Color</span><input type="color" value={editando.color_hex || '#7c3aed'} onChange={e => setEditando({ ...editando, color_hex: e.target.value })} /></label>
              </div>
              <label className="madm-field"><span>Tagline</span><input value={editando.tagline || ''} onChange={e => setEditando({ ...editando, tagline: e.target.value })} placeholder="Ej: El simulador completo" /></label>
              <label className="madm-field"><span>Descripción</span><textarea rows={2} value={editando.descripcion || ''} onChange={e => setEditando({ ...editando, descripcion: e.target.value })} /></label>
              <div className="madm-form-row">
                <label className="madm-field"><span>Precio mensual</span><input type="number" value={editando.precio_mensual ?? ''} onChange={e => setEditando({ ...editando, precio_mensual: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                <label className="madm-field"><span>Precio anual</span><input type="number" value={editando.precio_anual ?? ''} onChange={e => setEditando({ ...editando, precio_anual: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                <label className="madm-field"><span>Descuento anual (%)</span><input type="number" value={editando.descuento_anual ?? ''} onChange={e => setEditando({ ...editando, descuento_anual: e.target.value === '' ? null : Number(e.target.value) })} /></label>
                <label className="madm-field"><span>Orden</span><input type="number" value={editando.orden ?? ''} onChange={e => setEditando({ ...editando, orden: e.target.value === '' ? null : Number(e.target.value) })} /></label>
              </div>
              <label className="madm-field"><span>Beneficios (uno por línea)</span>
                <textarea rows={6} value={(editando.beneficios || []).join('\n')} onChange={e => setEditando({ ...editando, beneficios: e.target.value.split('\n').map(s => s.trim()).filter(Boolean) })} />
              </label>
              <div className="madm-switches">
                <label className="madm-switch"><input type="checkbox" checked={editando.activa} onChange={e => setEditando({ ...editando, activa: e.target.checked })} /><span>Activa (visible al público)</span></label>
                <label className="madm-switch"><input type="checkbox" checked={editando.destacada} onChange={e => setEditando({ ...editando, destacada: e.target.checked })} /><span>Destacada (más popular)</span></label>
              </div>
            </div>
            <div className="madm-modal-foot">
              <button className="madm-btn-ghost" onClick={() => setEditando(null)} disabled={guardando}>Cancelar</button>
              <button className="madm-btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar plan'}</button>
            </div>
          </div>
        </div>
      )}

      {confirmarBorrar && (
        <div className="madm-overlay" onClick={() => setConfirmarBorrar(null)}>
          <div className="madm-confirm" onClick={e => e.stopPropagation()} role="alertdialog" aria-modal="true">
            <span className="madm-confirm-icono">🗑️</span>
            <h3>¿Eliminar el plan "{confirmarBorrar.nombre}"?</h3>
            <p>Esta acción no se puede deshacer. Los usuarios con esta membresía no se verán afectados, pero el plan dejará de mostrarse.</p>
            <div className="madm-confirm-acciones">
              <button className="madm-btn-ghost" onClick={() => setConfirmarBorrar(null)}>Cancelar</button>
              <button className="madm-btn-del-full" onClick={eliminar}>Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
