// Configuración base del sitio
const SITIO_CONFIG = {
  nombre: 'Academia Vallenata Online',
  descripcion: 'La mejor academia online para aprender acordeón vallenato',
  url: 'https://academiavallenata.com',
  autor: 'Jesús González',
  twitter: '@AcademiaVallenata',
  imagen: '/images/og-default.jpg'
};

// Interface para metadatos de artículo
export interface MetadatosArticulo {
  titulo: string;
  descripcion?: string;
  imagen?: string;
  autor?: string;
  fechaPublicacion?: string;
  fechaModificacion?: string;
  categorias?: string[];
  etiquetas?: string[];
  tiempoLectura?: number;
  url?: string;
}

/**
 * Genera metadatos optimizados para SEO de un artículo específico
 */
export function generarMetadatosArticulo(datos: MetadatosArticulo) {
  const {
    titulo,
    descripcion = '',
    imagen = SITIO_CONFIG.imagen,
    autor = SITIO_CONFIG.autor,
    fechaPublicacion = '',
    fechaModificacion = '',
    categorias = [],
    etiquetas = [],
    tiempoLectura = 0,
    url = ''
  } = datos;

  // Título optimizado para SEO
  const tituloCompleto = `${titulo} | ${SITIO_CONFIG.nombre}`;
  const tituloCorto = titulo.length > 60 ? titulo.substring(0, 57) + '...' : titulo;

  // Descripción optimizada
  const descripcionOptimizada = descripcion || 
    `Aprende ${titulo.toLowerCase()} con nuestra guía completa de acordeón vallenato. ${SITIO_CONFIG.descripcion}`;
  
  const descripcionCorta = descripcionOptimizada.length > 160 ? 
    descripcionOptimizada.substring(0, 157) + '...' : descripcionOptimizada;

  // URL completa de la imagen
  const imagenCompleta = imagen.startsWith('http') ? imagen : `${SITIO_CONFIG.url}${imagen}`;

  // Palabras clave combinando categorías y etiquetas
  const palabrasClave = [
    'acordeón vallenato',
    'aprender vallenato',
    'academia vallenata',
    ...categorias.map(c => c.toLowerCase()),
    ...etiquetas.map(t => t.toLowerCase())
  ].join(', ');

  return {
    // Meta tags básicos
    title: tituloCompleto,
    description: descripcionCorta,
    keywords: palabrasClave,
    author: autor,
    
    // Open Graph (Facebook, LinkedIn)
    'og:type': 'article',
    'og:title': tituloCorto,
    'og:description': descripcionCorta,
    'og:image': imagenCompleta,
    'og:image:alt': `Imagen del artículo: ${titulo}`,
    'og:url': url,
    'og:site_name': SITIO_CONFIG.nombre,
    'og:locale': 'es_ES',
    
    // Twitter Cards
    'twitter:card': 'summary_large_image',
    'twitter:title': tituloCorto,
    'twitter:description': descripcionCorta,
    'twitter:image': imagenCompleta,
    'twitter:image:alt': `Imagen del artículo: ${titulo}`,
    'twitter:site': SITIO_CONFIG.twitter,
    'twitter:creator': SITIO_CONFIG.twitter,
    
    // Article específico
    'article:author': autor,
    'article:published_time': fechaPublicacion,
    'article:modified_time': fechaModificacion || fechaPublicacion,
    'article:section': categorias[0] || 'Acordeón Vallenato',
    'article:tag': etiquetas.join(','),
    
    // Datos adicionales
    'robots': 'index,follow',
    'language': 'es',
    'revisit-after': '7 days',
    
    // Rich snippets adicionales
    'reading-time': tiempoLectura ? `${tiempoLectura} minutos` : undefined,
    'content-language': 'es'
  };
}

/**
 * Genera metadatos básicos para páginas generales del blog
 */
export function generarMetadatosBlog() {
  return {
    title: `Blog de Acordeón Vallenato | ${SITIO_CONFIG.nombre}`,
    description: 'Descubre artículos, tutoriales y guías sobre acordeón vallenato. Aprende técnicas, historia y secretos del vallenato con nuestros expertos.',
    keywords: 'blog vallenato, acordeón vallenato, tutoriales acordeón, aprender vallenato, música vallenata, blog academia',
    'og:type': 'website',
    'og:title': 'Blog de Acordeón Vallenato',
    'og:description': 'El mejor blog para aprender acordeón vallenato online',
    'og:image': SITIO_CONFIG.imagen,
    'og:url': `${SITIO_CONFIG.url}/blog`,
    'twitter:card': 'summary_large_image'
  };
}

/**
 * Aplica metadatos al documento HTML
 */
export function aplicarMetadatos(metadatos: Record<string, string | undefined>, documento = document) {
  Object.entries(metadatos).forEach(([propiedad, contenido]) => {
    if (!contenido) return;

    // Buscar meta tag existente
    let metaTag = documento.querySelector(`meta[name="${propiedad}"]`) ||
                  documento.querySelector(`meta[property="${propiedad}"]`);

    if (!metaTag) {
      // Crear nuevo meta tag
      metaTag = documento.createElement('meta');
      
      // Determinar si es property (Open Graph, Twitter) o name
      if (propiedad.startsWith('og:') || propiedad.startsWith('twitter:') || propiedad.startsWith('article:')) {
        metaTag.setAttribute('property', propiedad);
      } else {
        metaTag.setAttribute('name', propiedad);
      }
      
      documento.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', contenido);
  });

  // Actualizar título si está incluido
  if (metadatos.title) {
    documento.title = metadatos.title;
  }
}

/**
 * Genera URL canónica para evitar contenido duplicado
 */
export function generarUrlCanonica(slug: string): string {
  return `${SITIO_CONFIG.url}/blog/${slug}`;
}

/**
 * Genera breadcrumbs estructurados
 */
export function generarBreadcrumbs(titulo: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": SITIO_CONFIG.url
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": `${SITIO_CONFIG.url}/blog`
      },
      {
        "@type": "ListItem", 
        "position": 3,
        "name": titulo,
        "item": generarUrlCanonica(slug)
      }
    ]
  };
} 