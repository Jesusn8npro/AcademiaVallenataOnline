import type { Metadata, Viewport } from 'next'
import { Providers } from './providers'

export const metadata: Metadata = {
  metadataBase: new URL('https://academiavallenata.online'),
  title: 'Academia Vallenata Online - Aprende Acordeón desde Cero',
  description:
    'La Academia #1 de Acordeón Vallenato online. Simulador gaming único, comunidad de estudiantes y cursos desde cero a avanzado.',
  keywords:
    'acordeón vallenato, aprender acordeón, clases acordeón online, academia vallenata, vallenato, música colombiana',
  authors: [{ name: 'Academia Vallenata Online' }],
  alternates: { canonical: 'https://academiavallenata.online/' },
  icons: {
    icon: [{ url: '/logo-175.webp', type: 'image/webp' }],
    apple: '/iconos-pwa/icon-192x192.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Academia Vallenata',
  },
  openGraph: {
    type: 'website',
    url: 'https://academiavallenata.online/',
    title: 'Academia Vallenata Online - Aprende Acordeón',
    description:
      'La Academia #1 de Acordeón Vallenato online. Simulador gaming único, comunidad de estudiantes y cursos desde cero a avanzado.',
    siteName: 'Academia Vallenata Online',
    locale: 'es_CO',
    images: [
      {
        url: 'https://academiavallenata.online/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Academia Vallenata Online - Aprende acordeón desde cero',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@AcademiaVallenata',
    title: 'Academia Vallenata Online - Aprende Acordeón',
    description:
      'La Academia #1 de Acordeón Vallenato online. Simulador gaming único, comunidad de estudiantes y cursos desde cero a avanzado.',
    images: ['https://academiavallenata.online/og-image.jpg'],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#8b5cf6',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://academiavallenata.online/#organization',
      name: 'Academia Vallenata Online',
      url: 'https://academiavallenata.online',
      logo: {
        '@type': 'ImageObject',
        url: 'https://academiavallenata.online/logo academia vallenata.webp',
        width: 400,
        height: 400,
      },
      description:
        'La Academia #1 de Acordeón Vallenato online. Simulador gaming único, comunidad de estudiantes y cursos desde cero a avanzado.',
      sameAs: [],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['Spanish'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://academiavallenata.online/#website',
      url: 'https://academiavallenata.online',
      name: 'Academia Vallenata Online',
      description: 'Aprende acordeón vallenato online con la mejor academia virtual',
      publisher: { '@id': 'https://academiavallenata.online/#organization' },
      inLanguage: 'es-CO',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate:
            'https://academiavallenata.online/tutoriales-de-acordeon?buscar={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'EducationalOrganization',
      '@id': 'https://academiavallenata.online/#edu',
      name: 'Academia Vallenata Online',
      url: 'https://academiavallenata.online',
      description:
        'Academia de música especializada en acordeón vallenato. Cursos online desde nivel cero hasta avanzado con simulador interactivo.',
      teaches: 'Acordeón vallenato',
      educationalLevel: ['Beginner', 'Intermediate', 'Advanced'],
      availableLanguage: 'es',
    },
  ],
}

const speculationRules = {
  prerender: [
    { where: { href_matches: '/cursos*' }, eagerness: 'moderate' },
    { where: { href_matches: '/contacto' }, eagerness: 'moderate' },
    { where: { href_matches: '/paquetes*' }, eagerness: 'moderate' },
    { where: { href_matches: '/nuestra-academia' }, eagerness: 'moderate' },
    { where: { href_matches: '/blog*' }, eagerness: 'moderate' },
    { where: { href_matches: '/eventos*' }, eagerness: 'moderate' },
  ],
}

const gaScript = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-V6LNQ93YE6', { 'send_page_view': false });
window.addEventListener('load', function () {
  setTimeout(function () {
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=G-V6LNQ93YE6';
    s.onload = function () { gtag('event', 'page_view'); };
    document.head.appendChild(s);
  }, 3000);
});
`

const antiConsolaScript = `
(function () {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) return;
  const _log = console.log;
  const mostrarDetente = function () {
    if (window.__permitirDevTools) return;
    console.clear();
    _log("%c¡SISTEMA PROTEGIDO POR IA DE RASTREO!","color: #ef4444; font-size: 55px; font-weight: bold; text-shadow: 4px 4px 8px black; padding: 15px; font-family: 'Segoe UI', sans-serif;");
    _log("%cBLOQUEO DE SEGURIDAD ACTIVO. Nuestra IA de Seguridad Forense ha registrado su huella digital de dispositivo (Fingerprint), dirección IP e identificadores de metadatos. El acceso no autorizado a los activos de la Academia Vallenata Online está siendo monitoreado en tiempo real. Cualquier manipulación activará acciones legales por fraude informático y robo de activos digitales.","color: #ffffff; background: #991b1b; font-size: 18px; font-weight: bold; font-family: sans-serif; padding: 20px; border: 2px solid gold; line-height: 1.5;");
    _log("%cID DE RASTREO: " + Math.random().toString(36).substring(2, 12).toUpperCase() + " | ESTADO: MONITOREO ACTIVO","color: #fbbf24; font-size: 16px; font-weight: bold; padding: 10px;");
  };
  const v = function() {};
  console.log = v; console.info = v; console.warn = v; console.debug = v;
  setTimeout(mostrarDetente, 2000);
})();
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preload" as="image" href="/logo-175.webp" fetchPriority="high" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://tbijzvtyyewhtwgakgka.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://tbijzvtyyewhtwgakgka.supabase.co" />
        <link rel="dns-prefetch" href="https://iframe.mediadelivery.net" />
        <link rel="dns-prefetch" href="https://video.bunnycdn.com" />
        <script dangerouslySetInnerHTML={{ __html: gaScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speculationRules) }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <script dangerouslySetInnerHTML={{ __html: antiConsolaScript }} />
      </body>
    </html>
  )
}
