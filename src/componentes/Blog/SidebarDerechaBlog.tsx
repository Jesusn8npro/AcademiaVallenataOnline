'use client';

import React, { useState, useEffect } from 'react'
import { supabaseAnonimo } from '../../servicios/clienteSupabase'
import { useNavigate } from '@/compat/router'
import Image from 'next/image'

interface ContenidoSidebar {
  id: string
  titulo: string
  precio_normal: number
  precio_rebajado: number | null
  imagen_url: string | null
  slug?: string
  tipo: 'curso' | 'tutorial'
}

const SidebarDerechaBlog: React.FC = () => {
  const navegar = useNavigate()
  const [email, setEmail] = useState('')
  const [nombre, setNombre] = useState('')
  const [estadoForm, setEstadoForm] = useState<'idle' | 'enviando' | 'ok' | 'duplicado' | 'error'>('idle')
  const [contenidos, setContenidos] = useState<ContenidoSidebar[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      const [{ data: cursos }, { data: tuts }] = await Promise.all([
        supabaseAnonimo
          .from('cursos')
          .select('id, titulo, precio_normal, precio_rebajado, imagen_url, slug')
          .limit(2),
        supabaseAnonimo
          .from('tutoriales')
          .select('id, titulo, precio_normal, precio_rebajado, imagen_url')
          .eq('estado', 'publicado')
          .eq('tipo_acceso', 'pago')
          .order('created_at', { ascending: false })
          .limit(2),
      ])
      const lista: ContenidoSidebar[] = [
        ...(cursos || []).map(c => ({ ...c, tipo: 'curso' as const })),
        ...(tuts || []).map(t => ({ ...t, tipo: 'tutorial' as const })),
      ].slice(0, 3)
      setContenidos(lista)
      setCargando(false)
    }
    cargar()
  }, [])

  const suscribirse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) return
    setEstadoForm('enviando')
    const { error } = await supabaseAnonimo
      .from('suscriptores_boletin')
      .insert({ email: email.trim().toLowerCase(), nombre: nombre.trim() || null })
    if (!error) {
      setEstadoForm('ok')
      setEmail('')
      setNombre('')
    } else if (error.code === '23505') {
      setEstadoForm('duplicado')
    } else {
      setEstadoForm('error')
    }
    setTimeout(() => setEstadoForm('idle'), 6000)
  }

  const fmtPrecio = (n: number) => `$${Number(n).toLocaleString('es-CO')}`

  const s: Record<string, React.CSSProperties> = {
    aside: { position: 'sticky', top: 80, alignSelf: 'start', width: '100%', display: 'flex', flexDirection: 'column', gap: 16 },
    card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' },
    h4: { fontSize: '1rem', fontWeight: 700, margin: '0 0 14px', color: '#1e293b' },
    input: { width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' as const, outline: 'none', color: '#1e293b', background: 'white' },
    btnVerde: { width: '100%', background: '#10b981', color: 'white', border: 'none', padding: '11px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14, marginTop: 4, transition: 'background 0.2s' },
    contenidoItem: { display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 },
    img: { width: 54, height: 54, borderRadius: 8, objectFit: 'cover' as const, flexShrink: 0, background: '#e2e8f0' },
    tituloContenido: { fontSize: 13, fontWeight: 600, color: '#1e293b', margin: '0 0 5px', lineHeight: 1.35 },
    badge: { display: 'inline-block', fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700, background: '#ede9fe', color: '#7c3aed', marginBottom: 4, textTransform: 'uppercase' as const, letterSpacing: '0.04em' },
    precioRebajado: { fontSize: 13, fontWeight: 700, color: '#10b981', marginRight: 6 },
    precioOriginal: { fontSize: 12, textDecoration: 'line-through', color: '#94a3b8' },
    btnVerTodos: { width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', color: '#7c3aed', padding: '10px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13, transition: 'background 0.2s' },
  }

  return (
    <aside style={s.aside}>

      {/* ── Boletín ───────────────────────────────── */}
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 34, marginBottom: 6 }}>🎵</div>
          <h4 style={{ ...s.h4, textAlign: 'center', marginBottom: 6 }}>Boletín de la Academia</h4>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            Recibe artículos nuevos, técnicas exclusivas y noticias del vallenato directamente en tu email.
          </p>
        </div>

        {estadoForm === 'ok' ? (
          <div style={{ background: '#d1fae5', borderRadius: 8, padding: '12px 16px', textAlign: 'center', color: '#065f46', fontWeight: 600, fontSize: 14 }}>
            ✅ ¡Suscrito! Te avisaremos con cada artículo nuevo.
          </div>
        ) : estadoForm === 'duplicado' ? (
          <div style={{ background: '#ede9fe', borderRadius: 8, padding: '12px 16px', textAlign: 'center', color: '#5b21b6', fontWeight: 600, fontSize: 14 }}>
            📬 Ya estás suscrito a nuestro boletín.
          </div>
        ) : (
          <form onSubmit={suscribirse} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              type="text"
              placeholder="Tu nombre (opcional)"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              style={s.input}
            />
            <input
              type="email"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={s.input}
            />
            {estadoForm === 'error' && (
              <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>Error al suscribirse, intenta de nuevo.</p>
            )}
            <button
              type="submit"
              style={{ ...s.btnVerde, opacity: estadoForm === 'enviando' ? 0.65 : 1 }}
              disabled={estadoForm === 'enviando'}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#059669' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#10b981' }}
            >
              {estadoForm === 'enviando' ? 'Suscribiendo…' : '🔔 Suscribirme gratis'}
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
          {[
            '📩 Artículos nuevos directo a tu email',
            '🎼 Técnicas y consejos exclusivos',
            '🎉 Noticias y eventos de la academia',
          ].map(b => (
            <div key={b} style={{ fontSize: 12, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>{b}</div>
          ))}
        </div>
      </div>

      {/* ── Contenido destacado ───────────────────── */}
      {(cargando || contenidos.length > 0) && (
        <div style={s.card}>
          <h4 style={s.h4}>🏆 Contenido Destacado</h4>
          {cargando ? (
            <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Cargando…</p>
          ) : (
            <>
              {contenidos.map(c => (
                <div key={c.id} style={s.contenidoItem}>
                  {c.imagen_url ? (
                    <Image src={c.imagen_url} alt={c.titulo} width={54} height={54} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0, background: '#e2e8f0' }} />
                  ) : (
                    <div style={{ ...s.img, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {c.tipo === 'curso' ? '🎓' : '🎵'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={s.badge}>{c.tipo}</span>
                    <p style={s.tituloContenido}>{c.titulo}</p>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {c.precio_rebajado ? (
                        <>
                          <span style={s.precioRebajado}>{fmtPrecio(c.precio_rebajado)}</span>
                          <span style={s.precioOriginal}>{fmtPrecio(c.precio_normal)}</span>
                        </>
                      ) : (
                        <span style={s.precioRebajado}>{fmtPrecio(c.precio_normal)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <button
                style={s.btnVerTodos}
                onClick={() => { navegar('/tutoriales') }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#ede9fe' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc' }}
              >
                Ver todo el contenido →
              </button>
            </>
          )}
        </div>
      )}

    </aside>
  )
}

export default SidebarDerechaBlog
