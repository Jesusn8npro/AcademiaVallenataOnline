import React from 'react'
import { Link } from 'react-router-dom'
import { generarSlug } from '../../utilidades/slug'

interface Parte { id: string; titulo: string; slug?: string }
export default function TutorialClases({ tutorial, progreso, slug }: { tutorial: any, progreso: Record<string, { completado: boolean }>, slug: string }) {
  const partes: Parte[] = tutorial?.partes || []
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px,1fr))', gap: '1rem' }}>
      {partes.map((p) => {
        const done = !!progreso[p.id]?.completado
        const claseSlug = p.slug || generarSlug(p.titulo)
        return (
          <Link key={p.id} to={`/tutoriales/${slug}/clase/${claseSlug}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h4 style={{ margin: 0 }}>{p.titulo}</h4>
                <span style={{ fontSize: 12, color: done ? '#10b981' : '#64748b' }}>{done ? 'Completada' : 'Pendiente'}</span>
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
