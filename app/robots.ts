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
        '/mi-perfil/',
        '/publicaciones/',
        '/grabaciones/',
        '/configuracion/',
        '/mensajes/',
        '/notificaciones/',
        '/ranking/',
        '/comunidad/',
        '/pago-exitoso/',
        '/pago-error/',
        '/sesion-cerrada/',
        '/recuperar-contrasena/',
        '/auth/',
      ],
    },
    sitemap: 'https://academiavallenata.online/sitemap.xml',
  }
}
