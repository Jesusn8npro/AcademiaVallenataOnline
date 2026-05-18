'use client';

import React from 'react'
import { Link } from '@/compat/router'
import { generarSlug } from '../../utilidades/slug'

interface Parte { id: string; titulo: string; slug?: string; tipo_contenido?: string }

export default function TutorialClases({ tutorial, progreso, slug }: {
  tutorial: any
  progreso: Record<string, { completado: boolean }>
  slug: string
}) {
  const partes: Parte[] = tutorial?.partes || []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1rem' }}>
      {partes.map((p) => {
        const esEvaluacion = p.tipo_contenido === 'evaluacion'
        const done = !!progreso[p.id]?.completado
        const claseSlug = p.slug || generarSlug(p.titulo)
        return (
          <Link key={p.id} to={`/tutoriales/${slug}/clase/${claseSlug}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: esEvaluacion ? '#faf5ff' : '#fff',
              border: `1px solid ${esEvaluacion ? '#ddd6fe' : '#e5e7eb'}`,
              borderRadius: 12,
              padding: '1rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                  {esEvaluacion && <span style={{ fontSize: 16 }}>🎯</span>}
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.titulo}</h4>
                </div>
                <span style={{ fontSize: 12, flexShrink: 0, color: done ? '#10b981' : esEvaluacion ? '#7c3aed' : '#64748b', fontWeight: done ? 600 : 400 }}>
                  {done ? 'Completada' : esEvaluacion ? 'Evaluación' : 'Pendiente'}
                </span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
