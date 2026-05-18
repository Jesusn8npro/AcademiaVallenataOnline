import type { Metadata } from 'next'
import RecuperarContrasena from '@/Paginas/Legales/RecuperarContrasena'

export const metadata: Metadata = {
  title: 'Restablecer Contraseña | Academia Vallenata Online',
  description:
    'Restablece la contraseña de tu cuenta de Academia Vallenata Online de forma segura y recupera el acceso a tus cursos de acordeón vallenato.',
  alternates: { canonical: 'https://academiavallenata.online/recuperar-contrasena' },
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Restablecer Contraseña | Academia Vallenata Online',
    description:
      'Restablece la contraseña de tu cuenta de Academia Vallenata Online de forma segura.',
    url: 'https://academiavallenata.online/recuperar-contrasena',
    type: 'website',
  },
}

export default function RecuperarContrasenaPage() {
  return <RecuperarContrasena />
}
