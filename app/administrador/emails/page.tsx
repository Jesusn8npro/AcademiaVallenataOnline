import type { Metadata } from 'next'
import EmailsAdmin from '@/Paginas/administrador/emails/EmailsAdmin'

export const metadata: Metadata = {
  title: 'Emails | Administración | Academia Vallenata Online',
}

export default function AdminEmailsRoute() {
  return <EmailsAdmin />
}
