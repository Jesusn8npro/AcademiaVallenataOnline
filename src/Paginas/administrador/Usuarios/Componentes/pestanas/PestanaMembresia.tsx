import * as React from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../../servicios/clienteSupabase';

interface Props { usuario: any; }

const fmt = (d?: string | null) => d ? new Date(d).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
const money = (v?: number | null) => v != null ? `$${Number(v).toLocaleString('es-CO')}` : '—';

const s: Record<string, React.CSSProperties> = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 18, padding: '4px 2px' },
  card: { background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14, padding: 18 },
  titulo: { fontSize: 15, fontWeight: 700, color: '#c4b5fd', margin: '0 0 12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  campo: { display: 'flex', flexDirection: 'column', gap: 2 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(255,255,255,0.5)' },
  valor: { fontSize: 14, fontWeight: 600, color: '#fff' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  badge: { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  vacio: { color: 'rgba(255,255,255,0.45)', fontStyle: 'italic', fontSize: 13 },
};

const COLOR_ESTADO: Record<string, string> = {
  activa: '#22c55e', pendiente_pago: '#f59e0b', cancelada: '#ef4444', pausada: '#94a3b8', vencida: '#ef4444',
};

function detectarDispositivo(ua?: string | null): string {
  if (!ua) return '—';
  if (/Android/i.test(ua)) return '📱 Android';
  if (/iPhone|iPad|iPod/i.test(ua)) return '📱 iOS';
  if (/Windows/i.test(ua)) return '💻 Windows';
  if (/Macintosh|Mac OS/i.test(ua)) return '💻 Mac';
  if (/Linux/i.test(ua)) return '💻 Linux';
  return '🌐 Otro';
}

const PestanaMembresia: React.FC<Props> = ({ usuario }) => {
  const [cargando, setCargando] = useState(true);
  const [suscripciones, setSuscripciones] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [cupones, setCupones] = useState<any[]>([]);

  useEffect(() => {
    let activo = true;
    (async () => {
      setCargando(true);
      const [subs, pgs, cps] = await Promise.all([
        supabase.from('suscripciones_usuario').select('*, membresias(nombre, color_hex, precio_mensual, precio_anual)').eq('usuario_id', usuario.id).order('fecha_inicio', { ascending: false }),
        supabase.from('pagos_epayco').select('id, nombre_producto, valor, estado, metodo_pago, fecha_transaccion, ref_payco, ip_cliente, como_nos_conocio, ciudad, pais, datos_adicionales').eq('usuario_id', usuario.id).order('fecha_transaccion', { ascending: false }).limit(30),
        supabase.from('cupones_uso').select('id, descuento_aplicado, referencia, created_at, cupones(codigo)').eq('usuario_id', usuario.id).order('created_at', { ascending: false }),
      ]);
      if (!activo) return;
      setSuscripciones(subs.data || []);
      setPagos(pgs.data || []);
      setCupones(cps.data || []);
      setCargando(false);
    })();
    return () => { activo = false; };
  }, [usuario.id]);

  // Origen del cliente a partir del último pago + perfil
  const ultimoPago = pagos[0];
  const datosUltimo = ultimoPago?.datos_adicionales || {};
  const origen = {
    comoConocio: ultimoPago?.como_nos_conocio || datosUltimo?.marketing?.como_nos_conocio || usuario.como_nos_conocio || null,
    ciudadCompra: ultimoPago?.ciudad || datosUltimo?.direccion?.ciudad || null,
    paisCompra: ultimoPago?.pais || datosUltimo?.direccion?.pais || null,
    ip: ultimoPago?.ip_cliente || null,
    dispositivo: detectarDispositivo(datosUltimo?.tecnico?.user_agent),
  };
  const tieneOrigen = origen.comoConocio || origen.ciudadCompra || origen.ip || datosUltimo?.tecnico?.user_agent;

  const actual = suscripciones.find(x => (x.estado || '').toLowerCase() === 'activa') || suscripciones[0];
  const dias = usuario.membresia_dias_restantes;
  const tieneActiva = !!usuario.membresia_nombre && (usuario.membresia_estado || '').toLowerCase() === 'activa';

  if (cargando) return <div style={s.vacio}>Cargando membresía…</div>;

  return (
    <div style={s.wrap}>
      {/* Estado actual */}
      <div style={{ ...s.card, borderColor: tieneActiva ? 'rgba(34,197,94,0.4)' : 'rgba(148,163,184,0.3)' }}>
        <h3 style={s.titulo}>Membresía actual</h3>
        {tieneActiva || actual ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ ...s.badge, background: usuario.membresia_color || actual?.membresias?.color_hex || '#7c3aed', color: '#fff', fontSize: 14, padding: '5px 14px' }}>
                {usuario.membresia_nombre || actual?.membresias?.nombre || 'Plan'}
              </span>
              <span style={{ ...s.badge, background: `${COLOR_ESTADO[(actual?.estado || '').toLowerCase()] || '#94a3b8'}22`, color: COLOR_ESTADO[(actual?.estado || '').toLowerCase()] || '#94a3b8' }}>
                {actual?.estado || (tieneActiva ? 'activa' : 'sin membresía')}
              </span>
              {tieneActiva && dias != null && (
                <span style={{ ...s.badge, background: dias <= 7 ? 'rgba(245,158,11,0.2)' : 'rgba(124,58,237,0.2)', color: dias <= 7 ? '#fbbf24' : '#c4b5fd' }}>
                  {dias < 0 ? 'Vencida' : `${dias} días restantes`}
                </span>
              )}
            </div>
            <div style={s.grid}>
              <div style={s.campo}><span style={s.label}>Inicio</span><span style={s.valor}>{fmt(actual?.fecha_inicio || usuario.fecha_inicio_membresia)}</span></div>
              <div style={s.campo}><span style={s.label}>Vencimiento</span><span style={s.valor}>{fmt(actual?.fecha_vencimiento || usuario.membresia_vence)}</span></div>
              <div style={s.campo}><span style={s.label}>Periodo</span><span style={s.valor}>{actual?.periodo || '—'}</span></div>
              <div style={s.campo}><span style={s.label}>Auto-renovar</span><span style={s.valor}>{actual?.auto_renovar ? 'Sí' : 'No'}</span></div>
              <div style={s.campo}><span style={s.label}>Precio pagado</span><span style={s.valor}>{money(actual?.precio_pagado)}</span></div>
              <div style={s.campo}><span style={s.label}>Método</span><span style={s.valor}>{actual?.metodo_pago || '—'}</span></div>
            </div>
          </>
        ) : (
          <p style={s.vacio}>Este usuario no tiene membresía. {(usuario.total_contenido || 0) > 0 ? 'Solo tiene tutoriales/cursos sueltos.' : 'No tiene contenido adquirido.'}</p>
        )}
      </div>

      {/* Origen del cliente */}
      {tieneOrigen && (
        <div style={s.card}>
          <h3 style={s.titulo}>Origen del cliente y compra</h3>
          <div style={s.grid}>
            <div style={s.campo}><span style={s.label}>Cómo nos conoció</span><span style={s.valor}>{origen.comoConocio || 'No registrado'}</span></div>
            <div style={s.campo}><span style={s.label}>Ubicación de compra</span><span style={s.valor}>{[origen.ciudadCompra, origen.paisCompra].filter(Boolean).join(', ') || '—'}</span></div>
            <div style={s.campo}><span style={s.label}>Dispositivo</span><span style={s.valor}>{origen.dispositivo}</span></div>
            <div style={s.campo}><span style={s.label}>IP de compra</span><span style={s.valor}>{origen.ip || '—'}</span></div>
          </div>
        </div>
      )}

      {/* Cupones usados */}
      {cupones.length > 0 && (
        <div style={s.card}>
          <h3 style={s.titulo}>Cupones usados ({cupones.length})</h3>
          {cupones.map((c) => (
            <div key={c.id} style={s.row}>
              <span style={{ ...s.badge, background: 'rgba(245,158,11,0.2)', color: '#fcd34d' }}>🎁 {c.cupones?.codigo || 'Cupón'}</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{fmt(c.created_at)}</span>
              <span style={{ fontWeight: 700, color: '#86efac' }}>-{money(c.descuento_aplicado)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Historial de suscripciones */}
      <div style={s.card}>
        <h3 style={s.titulo}>Historial de suscripciones ({suscripciones.length})</h3>
        {suscripciones.length === 0 ? <p style={s.vacio}>Sin suscripciones registradas.</p> : suscripciones.map((su) => (
          <div key={su.id} style={s.row}>
            <span><strong style={{ color: '#fff' }}>{su.membresias?.nombre || 'Plan'}</strong> · {su.periodo || ''}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{fmt(su.fecha_inicio)} → {fmt(su.fecha_vencimiento)}</span>
            <span style={{ ...s.badge, background: `${COLOR_ESTADO[(su.estado || '').toLowerCase()] || '#94a3b8'}22`, color: COLOR_ESTADO[(su.estado || '').toLowerCase()] || '#94a3b8' }}>{su.estado}</span>
          </div>
        ))}
      </div>

      {/* Pagos */}
      <div style={s.card}>
        <h3 style={s.titulo}>Pagos ({pagos.length})</h3>
        {pagos.length === 0 ? <p style={s.vacio}>Sin pagos registrados.</p> : pagos.map((p) => (
          <div key={p.id} style={s.row}>
            <span>{p.nombre_producto || 'Producto'}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>💳 {p.metodo_pago || 'No especificado'}</span>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>{fmt(p.fecha_transaccion)}</span>
            <span style={{ fontWeight: 700, color: '#fff' }}>{money(p.valor)}</span>
            <span style={{ ...s.badge, background: (p.estado === 'aceptada' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'), color: p.estado === 'aceptada' ? '#22c55e' : '#fbbf24' }}>{p.estado}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PestanaMembresia;
