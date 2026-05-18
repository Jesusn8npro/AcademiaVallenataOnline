import type { Metadata } from 'next'
import ConfiguracionPerfil from '@/Paginas/Perfil/ConfiguracionPerfil'

export const metadata: Metadata = {
  title: 'Configuración | Academia Vallenata Online',
}

export default function ConfiguracionRoute() {
  return <ConfiguracionPerfil />
}
