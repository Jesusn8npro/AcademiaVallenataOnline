import type { Metadata } from 'next'
import AdminBlog from '@/Paginas/administrador/blog/AdminBlog'

export const metadata: Metadata = {
  title: 'Blog | Administración | Academia Vallenata Online',
}

export default function AdminBlogRoute() {
  return <AdminBlog />
}
