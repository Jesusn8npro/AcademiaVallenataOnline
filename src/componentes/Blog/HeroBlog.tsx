'use client';

import * as React from 'react';
import { useState, useEffect } from 'react'
import { supabaseAnonimo } from '../../servicios/clienteSupabase'

interface HeroBlogProps {
  onCta?: () => void
}

const HeroBlog: React.FC<HeroBlogProps> = ({ onCta }) => {
  const [stats, setStats] = useState({ articulos: 0, estudiantes: 0, tutoriales: 0 })
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
    Promise.all([
      supabaseAnonimo.from('blog_articulos').select('*', { count: 'exact', head: true }).eq('estado_publicacion', 'publicado'),
      supabaseAnonimo.from('perfiles').select('*', { count: 'exact', head: true }).eq('rol', 'estudiante'),
      supabaseAnonimo.from('tutoriales').select('*', { count: 'exact', head: true }).eq('estado', 'publicado'),
    ]).then(([a, e, t]) => {
      setStats({ articulos: a.count ?? 0, estudiantes: e.count ?? 0, tutoriales: t.count ?? 0 })
    }).catch(() => {})
  }, [])

  const fmt = (n: number) => n >= 1000 ? `${Math.floor(n / 1000)}K+` : n > 0 ? `${n}+` : '—'

  const STATS = [
    { valor: fmt(stats.articulos), label: 'Artículos' },
    { valor: fmt(stats.estudiantes), label: 'Estudiantes' },
    { valor: fmt(stats.tutoriales), label: 'Tutoriales' },
  ]

  return (
    <section style={{
      background: 'linear-gradient(160deg, #0f0520 0%, #1a0a2e 55%, #2d1264 100%)',
      padding: 'clamp(64px, 10vw, 120px) 24px clamp(48px, 7vw, 80px)',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Notas musicales decorativas */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {(['♪', '♫', '♬', '♩', '♪', '♫'] as const).map((nota, i) => (
          <span key={i} style={{
            position: 'absolute',
            fontSize: `${1.6 + (i % 3) * 0.6}rem`,
            left: `${8 + i * 15}%`,
            top: `${15 + (i % 4) * 20}%`,
            color: '#c4b5fd',
            opacity: 0.07,
            animation: `flotarNota ${7 + i * 0.7}s ease-in-out infinite`,
            animationDelay: `${i * 0.9}s`,
            userSelect: 'none',
          }}>{nota}</span>
        ))}
      </div>

      <div style={{
        maxWidth: 760,
        margin: '0 auto',
        position: 'relative',
        zIndex: 1,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}>
        {/* Etiqueta superior */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(124, 58, 237, 0.18)',
          border: '1px solid rgba(167, 139, 250, 0.3)',
          borderRadius: 40,
          padding: '6px 18px',
          marginBottom: 28,
          fontSize: 12,
          color: '#c4b5fd',
          fontWeight: 600,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          🎵 Blog de la Academia
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 5.5vw, 3.8rem)',
          fontWeight: 900,
          color: 'white',
          margin: '0 0 20px',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}>
          Aprende, inspírate y{' '}
          <span style={{
            background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #7c3aed 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>domina el acordeón</span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2.2vw, 1.2rem)',
          color: 'rgba(255,255,255,0.7)',
          maxWidth: 580,
          margin: '0 auto 44px',
          lineHeight: 1.65,
        }}>
          Artículos con técnicas profesionales, historias del vallenato y consejos
          de nuestros instructores para llevar tu música al siguiente nivel.
        </p>

        {/* Stats reales */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(24px, 5vw, 60px)',
          flexWrap: 'wrap',
          marginBottom: 44,
        }}>
          {STATS.map(s => (
            <div key={s.label}>
              <div style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
                fontWeight: 900,
                background: 'linear-gradient(135deg, #a78bfa, #c4b5fd)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
              }}>{s.valor}</div>
              <div style={{
                fontSize: '0.78rem',
                color: 'rgba(255,255,255,0.45)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                marginTop: 6,
                fontWeight: 600,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={onCta}
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            color: 'white',
            border: 'none',
            borderRadius: 50,
            padding: '14px 38px',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 8px 32px rgba(124, 58, 237, 0.45)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 14px 40px rgba(124, 58, 237, 0.55)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(124, 58, 237, 0.45)'
          }}
        >
          Explorar artículos
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </button>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute',
        bottom: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.25)',
        fontSize: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        pointerEvents: 'none',
      }}>
        <span>Desliza para explorar</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'bounceDown 2s infinite' }}>
          <polyline points="6,9 12,15 18,9" />
        </svg>
      </div>

      <style>{`
        @keyframes flotarNota {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-18px) rotate(7deg); }
        }
        @keyframes bounceDown {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(5px); }
        }
      `}</style>
    </section>
  )
}

export default HeroBlog
