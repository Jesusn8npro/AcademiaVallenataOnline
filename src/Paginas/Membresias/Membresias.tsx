'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Crown, ShieldCheck, Infinity as InfinityIcon, Gauge, Smartphone, Gamepad2, Music4 } from 'lucide-react';
import { supabase } from '../../servicios/clienteSupabase';
import ModalPagoInteligente from '../../componentes/Pagos/ModalPagoInteligente';
import type { ContenidoCompra } from '../../componentes/Pagos/Hooks/useModalPago';
import './Membresias.css';

interface Plan {
  id: string;
  nombre: string;
  descripcion: string | null;
  tagline: string | null;
  precio_mensual: number;
  precio_anual: number | null;
  descuento_anual: number | null;
  color_hex: string | null;
  icono: string | null;
  orden: number;
  destacada: boolean;
  beneficios: string[];
  permisos: { facturacion?: 'mensual' | 'unica' } | null;
}

type Periodo = 'mensual' | 'anual';

const formatearCOP = (n: number) => `$${Math.round(n).toLocaleString('es-CO')}`;

const Membresias: React.FC = () => {
  const [planes, setPlanes] = React.useState<Plan[]>([]);
  const [cargando, setCargando] = React.useState(true);
  const [periodo, setPeriodo] = React.useState<Periodo>('mensual');

  const [mostrarPago, setMostrarPago] = React.useState(false);
  const [planSeleccionado, setPlanSeleccionado] = React.useState<ContenidoCompra | null>(null);

  React.useEffect(() => {
    let activo = true;
    (async () => {
      const { data } = await supabase
        .from('membresias')
        .select('id, nombre, descripcion, tagline, precio_mensual, precio_anual, descuento_anual, color_hex, icono, orden, destacada, beneficios, permisos')
        .eq('activa', true)
        .order('orden', { ascending: true });
      if (!activo) return;
      setPlanes((data as Plan[]) || []);
      setCargando(false);
    })();
    return () => { activo = false; };
  }, []);

  const esVitalicio = (p: Plan) => p.permisos?.facturacion === 'unica';

  // Precio que se le cobra al usuario según el periodo elegido.
  const precioElegido = (p: Plan): number => {
    if (esVitalicio(p)) return p.precio_mensual;
    return periodo === 'anual' && p.precio_anual ? p.precio_anual : p.precio_mensual;
  };

  const elegirPlan = (p: Plan) => {
    setPlanSeleccionado({ id: p.id, nombre: p.nombre, precio: precioElegido(p) });
    setMostrarPago(true);
  };

  const scrollAPlanes = () => {
    document.getElementById('mem-planes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const [trialCargando, setTrialCargando] = React.useState(false);
  const [trialMsg, setTrialMsg] = React.useState<string | null>(null);

  const activarTrial = async () => {
    setTrialMsg(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setTrialMsg('Inicia sesión o regístrate para activar tu prueba gratis.');
      return;
    }
    setTrialCargando(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/activar-trial`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      });
      const r = await res.json();
      if (res.ok && r.success) {
        setTrialMsg('¡Listo! Activamos tu plan Pro por 3 días. ¡A practicar!');
        setTimeout(() => { window.location.href = '/'; }, 1800);
      } else {
        setTrialMsg(r.error || 'No se pudo activar la prueba.');
      }
    } catch {
      setTrialMsg('Error de conexión. Intenta de nuevo.');
    } finally {
      setTrialCargando(false);
    }
  };

  return (
    <div className="mem-page">
      {/* ===== HERO ===== */}
      <header className="mem-hero">
        <div className="mem-hero-glow" aria-hidden="true" />
        <div className="mem-orbs" aria-hidden="true">
          <span className="mem-orb mem-orb-1" />
          <span className="mem-orb mem-orb-2" />
          <span className="mem-orb mem-orb-3" />
        </div>
        <motion.div
          className="mem-hero-content"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="mem-hero-badge">
            <Sparkles size={15} aria-hidden="true" /> Prueba 3 días gratis · cancela cuando quieras
          </span>
          <h1 className="mem-hero-title">
            Elige tu plan y aprende acordeón vallenato <span className="mem-grad">como un profesional</span>
          </h1>
          <p className="mem-hero-sub">
            Desde tocar tu primer acordeón hasta acceder a todos los tutoriales y cursos.
            Un plan para cada momento de tu aprendizaje.
          </p>
          <div className="mem-hero-cta">
            <button className="mem-btn mem-btn-primary" onClick={scrollAPlanes}>
              Ver los planes
            </button>
            <button className="mem-btn mem-btn-trial" onClick={activarTrial} disabled={trialCargando}>
              {trialCargando ? 'Activando…' : 'Probar 3 días gratis'}
            </button>
          </div>
          {trialMsg && <p className="mem-hero-msg" role="status">{trialMsg}</p>}
          <span className="mem-hero-trust">
            <ShieldCheck size={16} aria-hidden="true" /> Pago seguro con ePayco
          </span>
        </motion.div>
      </header>

      {/* ===== TOGGLE MENSUAL / ANUAL ===== */}
      <div className="mem-toggle-wrap" role="group" aria-label="Periodo de facturación">
        <button
          className={`mem-toggle-opt ${periodo === 'mensual' ? 'is-active' : ''}`}
          onClick={() => setPeriodo('mensual')}
          aria-pressed={periodo === 'mensual'}
        >
          Mensual
        </button>
        <button
          className={`mem-toggle-opt ${periodo === 'anual' ? 'is-active' : ''}`}
          onClick={() => setPeriodo('anual')}
          aria-pressed={periodo === 'anual'}
        >
          Anual <span className="mem-toggle-ahorro">ahorra</span>
        </button>
        <motion.span
          className="mem-toggle-thumb"
          animate={{ x: periodo === 'mensual' ? 0 : '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          aria-hidden="true"
        />
      </div>

      {/* ===== PLANES ===== */}
      <section id="mem-planes" className="mem-planes">
        {cargando ? (
          <div className="mem-grid">
            {[0, 1, 2, 3].map((i) => <div key={i} className="mem-skeleton" />)}
          </div>
        ) : (
          <div className="mem-grid">
            {planes.map((p, i) => {
              const vit = esVitalicio(p);
              const precio = precioElegido(p);
              const color = p.color_hex || '#8b5cf6';
              const mostrarAnual = !vit && periodo === 'anual' && p.precio_anual;
              return (
                <motion.article
                  key={p.id}
                  className={`mem-card ${p.destacada ? 'is-destacada' : ''}`}
                  style={{ ['--mem-accent' as string]: color }}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, ease: 'easeOut', delay: i * 0.07 }}
                >
                  {p.destacada && (
                    <span className="mem-badge-popular">
                      <Crown size={14} aria-hidden="true" /> Más popular
                    </span>
                  )}

                  <div className="mem-card-head">
                    <span className="mem-card-icono" aria-hidden="true">{p.icono || '🎵'}</span>
                    <h3 className="mem-card-nombre">{p.nombre}</h3>
                    {p.tagline && <p className="mem-card-tagline">{p.tagline}</p>}
                  </div>

                  <div className="mem-card-precio">
                    {vit ? (
                      <>
                        <span className="mem-precio-num">{formatearCOP(precio)}</span>
                        <span className="mem-precio-periodo">
                          <InfinityIcon size={14} aria-hidden="true" /> pago único · de por vida
                        </span>
                      </>
                    ) : mostrarAnual ? (
                      <>
                        <span className="mem-precio-num">{formatearCOP(precio / 12)}</span>
                        <span className="mem-precio-periodo">/ mes</span>
                        <span className="mem-precio-ahorro">
                          Facturado anual {formatearCOP(precio)}
                          {p.descuento_anual ? ` · ahorras ${p.descuento_anual}%` : ''}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mem-precio-num">{formatearCOP(precio)}</span>
                        <span className="mem-precio-periodo">/ mes</span>
                      </>
                    )}
                  </div>

                  {p.descripcion && <p className="mem-card-desc">{p.descripcion}</p>}

                  <button
                    className={`mem-btn mem-btn-plan ${p.destacada ? 'mem-btn-primary' : 'mem-btn-outline'}`}
                    onClick={() => elegirPlan(p)}
                  >
                    {vit ? 'Comprar acceso vitalicio' : 'Elegir este plan'}
                  </button>

                  <ul className="mem-beneficios">
                    {(p.beneficios || []).map((b, idx) => (
                      <li key={idx}>
                        <Check size={17} className="mem-check" aria-hidden="true" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </motion.article>
              );
            })}
          </div>
        )}

        <p className="mem-nota-pie">
          Todos los precios están en pesos colombianos (COP) e incluyen IVA. ¿Prefieres comprar un
          tutorial suelto? También puedes hacerlo desde su página.
        </p>
      </section>

      {/* ===== SIMULADOR (highlight) ===== */}
      <section className="mem-sim">
        <div className="mem-sim-glow" aria-hidden="true" />
        <motion.div
          className="mem-sim-inner"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="mem-sim-kicker">Nuestro simulador</span>
          <h2 className="mem-sim-title">
            Aprende acordeón de forma <span className="mem-grad">fácil y efectiva</span>, sin fallas
          </h2>
          <p className="mem-sim-sub">
            Un simulador realista que responde al instante: practica como si tuvieras el acordeón
            en tus manos, en tu computador o en tu celular.
          </p>

          <div className="mem-sim-features">
            {[
              { icon: Gauge, t: 'Respuesta instantánea', d: 'Sin latencia: cada nota suena justo cuando la tocas.' },
              { icon: Gamepad2, t: 'Modo Hero', d: 'Aprende jugando con canciones interactivas tipo Guitar Hero.' },
              { icon: Smartphone, t: 'En tu celular', d: 'Practica donde quieras con el Acordeón Móvil.' },
              { icon: Music4, t: 'Tu propia música', d: 'Sube tus canciones y practícalas en el Área de Estudio.' },
            ].map((f, i) => (
              <motion.div
                key={f.t}
                className="mem-sim-feat"
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08, ease: 'easeOut' }}
              >
                <span className="mem-sim-feat-ico" aria-hidden="true"><f.icon size={22} /></span>
                <strong>{f.t}</strong>
                <span>{f.d}</span>
              </motion.div>
            ))}
          </div>

          <button className="mem-btn mem-btn-primary" onClick={scrollAPlanes}>
            Empieza hoy con un plan
          </button>
        </motion.div>
      </section>

      {/* ===== CONFIANZA ===== */}
      <section className="mem-confianza">
        <div className="mem-conf-item">
          <ShieldCheck size={22} aria-hidden="true" />
          <div><strong>Pago 100% seguro</strong><span>Procesado por ePayco</span></div>
        </div>
        <div className="mem-conf-item">
          <Sparkles size={22} aria-hidden="true" />
          <div><strong>Prueba 3 días</strong><span>Conoce la plataforma antes de pagar</span></div>
        </div>
        <div className="mem-conf-item">
          <Crown size={22} aria-hidden="true" />
          <div><strong>Acceso inmediato</strong><span>Empieza a aprender al instante</span></div>
        </div>
      </section>

      <ModalPagoInteligente
        mostrar={mostrarPago}
        setMostrar={setMostrarPago}
        contenido={planSeleccionado}
        tipoContenido="membresia"
      />
    </div>
  );
};

export default Membresias;
