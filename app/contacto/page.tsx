// ─────────────────────────────────────────────────────────────────────────
// PÁGINA DE REFERENCIA (patrón canónico para páginas públicas con SEO).
// Estructura: page.tsx = Server Component que exporta `metadata` (SEO real
// server-side) y renderiza el componente de UI existente.
// El componente de UI conserva su código y su CSS IGUAL; solo se le añade
// 'use client' arriba si usa estado/efectos/eventos.
// ─────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import Contacto from '@/Paginas/Contacto/Contacto'

export const metadata: Metadata = {
  title: 'Contacto | Academia Vallenata Online',
  description:
    'Contáctanos por WhatsApp, email o llamada. Resolvemos tus dudas sobre los cursos de acordeón vallenato y el simulador interactivo.',
  alternates: { canonical: 'https://academiavallenata.online/contacto' },
  openGraph: {
    title: 'Contacto | Academia Vallenata Online',
    description:
      'Contáctanos por WhatsApp, email o llamada. Resolvemos tus dudas sobre los cursos de acordeón vallenato.',
    url: 'https://academiavallenata.online/contacto',
    type: 'website',
  },
}

export default function ContactoPage() {
  return <Contacto />
}
