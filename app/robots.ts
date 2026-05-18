import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/administrador/',
        '/acordeon-pro-max/',
        '/simulador-app/',
        '/panel-estudiante/',
        '/mis-cursos/',
        '/mis-eventos/',
        '/mis-validaciones/',
        '/mis-evaluaciones/',
        '/publicaciones/',
        '/grabaciones/',
        '/configuracion/',
        '/mensajes/',
        '/pago-exitoso/',
        '/pago-error/',
        '/sesion-cerrada/',
      ],
    },
    sitemap: 'https://academiavallenata.online/sitemap.xml',
  }
}
