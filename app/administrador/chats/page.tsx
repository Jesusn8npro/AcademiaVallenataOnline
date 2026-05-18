import type { Metadata } from 'next'
import AdminChats from '@/Paginas/administrador/chats/AdminChats'

export const metadata: Metadata = {
  title: 'Chats | Administración | Academia Vallenata Online',
}

export default function AdminChatsRoute() {
  return <AdminChats />
}
