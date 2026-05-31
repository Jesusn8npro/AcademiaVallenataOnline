'use client';

import * as React from 'react';
import { Link } from '@/compat/router';
import { Crown, Check, Calendar, Sparkles, Music4, Gamepad2, Smartphone, BookOpen, Layers, Mic, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react';
import { supabase } from '../../servicios/clienteSupabase';
import { useUsuario } from '../../contextos/UsuarioContext';
import './mi-membresia.css';

interface MembresiaInfo {
  id: string;
  nombre: string;
  descripcion: string | null;
  tagline: string | null;
  beneficios: string[];
  color_hex: string | null;
  icono: string | null;
  permisos: {
    nivel?: number;
    facturacion?: 'mensual' | 'unica';
    simulador?: { tocar?: boolean; efectos?: boolean; movil?: boolean; hero?: boolean };
    estudio?: { habilitado?: boolean; max_pistas?: number; max_grabaciones?: number };
    contenido?: { tutoriales_video?: boolean; cursos?: boolean; paquetes?: boolean };
  } | null;
}

interface SuscripcionInfo {
  estado: string;
  periodo: string | null;
  fecha_inicio: string | null;
  fecha_vencimiento: string | null;
  precio_pagado: number | null;
}

const fmtFecha = (f: string | null) =>
  f ? new Date(f + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const etiquetaPeriodo = (p: string | null) =>
  p === 'anual' ? 'Anual' : p === 'vitalicio' ? 'De por vida' : 'Mensual';

export default function MiMembresia() {
  const { usuario } = useUsuario();
  const [cargando, setCargando] = React.useState(true);
  const [membresia, setMembresia] = React.useState<MembresiaInfo | null>(null);
  const [suscripcion, setSuscripcion] = React.useState<SuscripcionInfo | null>(null);
  const [vencimiento, setVencimiento] = React.useState<string | null>(null);
  const [vencida, setVencida] = React.useState(false);

  React.useEffect(() => {
    if (!usuario) return;
    let activo = true;
    (async () => {
      setCargando(true);
      try {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('membresia_activa_id, fecha_vencimiento_membresia')
          .eq('id', usuario.id)
          .maybeSingle();

        if (!activo) return;

        const memId = (perfil as any)?.membresia_activa_id;
        const venc = (perfil as any)?.fecha_vencimiento_membresia as string | null;
        setVencimiento(venc);

        if (!memId) { setMembresia(null); setCargando(false); return; }

        // Vencida = fecha pasada (fecha lejana / null = nunca vence, ej. Vitalicio).
        const estaVencida = !!venc && venc < new Date().toISOString().slice(0, 10);
        setVencida(estaVencida);

        const [{ data: mem }, { data: sus }] = await Promise.all([
          supabase
            .from('membresias')
            .select('id, nombre, descripcion, tagline, beneficios, color_hex, icono, permisos')
            .eq('id', memId)
            .maybeSingle(),
          supabase
            .from('suscripciones_usuario')
            .select('estado, periodo, fecha_inicio, fecha_vencimiento, precio_pagado')
            .eq('usuario_id', usuario.id)
            .eq('estado', 'activa')
            .order('created_at', { ascending: false })
            .maybeSingle(),
        ]);

        if (!activo) return;
        setMembresia(mem as MembresiaInfo);
        setSuscripcion(sus as SuscripcionInfo);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => { activo = false; };
  }, [usuario]);

  if (cargando) {
    return (
      <div className="mim-wrap">
        <div className="mim-skeleton" />
      </div>
    );
  }

  // Sin membresía activa (o vencida) → estado vacío con CTA.
  if (!membresia || vencida) {
    return (
      <div className="mim-wrap">
        <div className="mim-empty">
          <div className="mim-empty-ico"><Crown size={40} /></div>
          <h2>{vencida ? 'Tu membresía venció' : 'Aún no tienes una membresía activa'}</h2>
          <p>
            {vencida
              ? 'Renueva tu plan para seguir disfrutando de todo el contenido y el simulador completo.'
              : 'Elige un plan y accede a todos los tutoriales, cursos y al simulador completo.'}
          </p>
          <Link to="/membresias" className="mim-btn-primary">
            <Sparkles size={18} /> {vencida ? 'Renovar membresía' : 'Ver planes'}
          </Link>
        </div>
      </div>
    );
  }

  const color = membresia.color_hex || '#8b5cf6';
  const permisos = membresia.permisos || {};
  const sim = permisos.simulador || {};
  const est = permisos.estudio || {};
  const cont = permisos.contenido || {};
  const esVitalicio = permisos.facturacion === 'unica' || suscripcion?.periodo === 'vitalicio';

  // Lista de "a qué tienes acceso" derivada de los permisos del plan.
  const accesos: { ok: boolean; icon: React.ReactNode; texto: string }[] = [
    { ok: !!cont.tutoriales_video, icon: <BookOpen size={18} />, texto: 'Todos los tutoriales en video' },
    { ok: !!cont.cursos, icon: <Layers size={18} />, texto: 'Todos los cursos completos' },
    { ok: !!cont.paquetes, icon: <Layers size={18} />, texto: 'Paquetes de tutoriales' },
    { ok: !!sim.tocar, icon: <Music4 size={18} />, texto: 'Simulador de acordeón' },
    { ok: !!sim.efectos, icon: <Sparkles size={18} />, texto: 'Efectos del simulador' },
    { ok: !!sim.hero, icon: <Gamepad2 size={18} />, texto: 'Modo Hero (canciones interactivas)' },
    { ok: !!sim.movil, icon: <Smartphone size={18} />, texto: 'Acordeón móvil' },
    {
      ok: !!est.habilitado,
      icon: <Mic size={18} />,
      texto: est.max_grabaciones === -1
        ? 'Grabaciones ilimitadas en el estudio'
        : `Hasta ${est.max_grabaciones ?? 0} grabaciones`,
    },
  ];

  return (
    <div className="mim-wrap">
      {/* Tarjeta principal del plan */}
      <div className="mim-card" style={{ ['--mim-accent' as string]: color }}>
        <div className="mim-card-glow" aria-hidden="true" />
        <div className="mim-card-top">
          <span className="mim-icono" aria-hidden="true">{membresia.icono || '🎵'}</span>
          <div className="mim-card-headtext">
            <span className="mim-kicker"><Crown size={14} /> Tu membresía</span>
            <h1 className="mim-plan-nombre">{membresia.nombre}</h1>
            {membresia.tagline && <p className="mim-plan-tagline">{membresia.tagline}</p>}
          </div>
          <span className="mim-estado-badge">Activa</span>
        </div>

        <div className="mim-meta">
          <div className="mim-meta-item">
            <Calendar size={16} />
            <div>
              <span className="mim-meta-label">Facturación</span>
              <strong>{etiquetaPeriodo(suscripcion?.periodo ?? null)}</strong>
            </div>
          </div>
          <div className="mim-meta-item">
            {esVitalicio ? <InfinityIcon size={16} /> : <Calendar size={16} />}
            <div>
              <span className="mim-meta-label">{esVitalicio ? 'Vigencia' : 'Renueva / vence'}</span>
              <strong>{esVitalicio ? 'De por vida' : fmtFecha(vencimiento)}</strong>
            </div>
          </div>
          {suscripcion?.fecha_inicio && (
            <div className="mim-meta-item">
              <ShieldCheck size={16} />
              <div>
                <span className="mim-meta-label">Activa desde</span>
                <strong>{fmtFecha(suscripcion.fecha_inicio)}</strong>
              </div>
            </div>
          )}
        </div>

        {membresia.descripcion && <p className="mim-desc">{membresia.descripcion}</p>}
      </div>

      {/* A qué tienes acceso */}
      <div className="mim-seccion">
        <h2 className="mim-seccion-titulo">A qué tienes acceso</h2>
        <div className="mim-accesos">
          {accesos.map((a, i) => (
            <div key={i} className={`mim-acceso ${a.ok ? 'is-on' : 'is-off'}`}>
              <span className="mim-acceso-ico">{a.icon}</span>
              <span className="mim-acceso-texto">{a.texto}</span>
              {a.ok ? <Check size={16} className="mim-acceso-check" /> : <span className="mim-acceso-x">—</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Beneficios listados del plan (texto libre de la BD) */}
      {membresia.beneficios?.length > 0 && (
        <div className="mim-seccion">
          <h2 className="mim-seccion-titulo">Incluye</h2>
          <ul className="mim-beneficios">
            {membresia.beneficios.map((b, i) => (
              <li key={i}><Check size={17} className="mim-check" /><span>{b}</span></li>
            ))}
          </ul>
        </div>
      )}

      <div className="mim-footer-cta">
        <Link to="/membresias" className="mim-btn-outline">Cambiar de plan</Link>
        <Link to="/mis-cursos" className="mim-btn-primary">Ir a Mis Cursos</Link>
      </div>
    </div>
  );
}
