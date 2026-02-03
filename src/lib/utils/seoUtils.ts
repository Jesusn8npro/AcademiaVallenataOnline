// Interfaces para tipado
export interface EncabezadoArticulo {
  id: string;
  text: string;
  level: 'H2' | 'H3';
}

export interface DatosEstructuradosArticulo {
  "@context": string;
  "@type": string;
  headline: string;
  description: string;
  author: {
    "@type": string;
    name: string;
  };
  publisher: {
    "@type": string;
    name: string;
    logo: {
      "@type": string;
      url: string;
    };
  };
  datePublished: string;
  dateModified: string;
  mainEntityOfPage: {
    "@type": string;
    "@id": string;
  };
  image?: string;
  url: string;
  articleBody: string;
  wordCount: number;
  timeRequired: string;
  inLanguage: string;
}

/**
 * Procesa el HTML del artículo y agrega IDs únicos a los encabezados para navegación
 */
export function agregarIdsAEncabezados(html: string): string {
  if (!html || typeof window === 'undefined') return html;
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const headers = Array.from(doc.querySelectorAll('h2, h3'));
  
  if (headers.length < 2) return html;
  
  headers.forEach((h, i) => {
    if (!h.id) {
      // Crear ID basado en el texto del encabezado
      const textoLimpio = h.textContent?.toLowerCase()
        .replace(/[^a-záéíóúñü0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) || 'seccion';
      h.id = `${textoLimpio}-${i}`;
    }
  });
  
  return doc.body.innerHTML;
}

/**
 * Procesa el contenido con IDs para navegación (alias para compatibilidad)
 */
export function procesarContenidoConIds(html: string): string {
  return agregarIdsAEncabezados(html);
}

/**
 * Extrae los encabezados del HTML para generar tabla de contenidos
 */
export function extraerEncabezados(html: string): EncabezadoArticulo[] {
  if (!html || typeof window === 'undefined') return [];
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  return Array.from(doc.querySelectorAll('h2, h3')).map((h, i) => {
    if (!h.id) {
      const textoLimpio = h.textContent?.toLowerCase()
        .replace(/[^a-záéíóúñü0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50) || 'seccion';
      h.id = `${textoLimpio}-${i}`;
    }
    
    return {
      id: h.id,
      text: h.textContent || '',
      level: h.tagName as 'H2' | 'H3',
    };
  });
}

/**
 * Calcula el tiempo estimado de lectura basado en palabras
 */
export function calcularTiempoLectura(contenido: string): number {
  if (!contenido) return 0;
  
  // Eliminar HTML y contar palabras
  const textoLimpio = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const palabras = textoLimpio.split(' ').filter(palabra => palabra.length > 0);
  
  // Promedio de 200 palabras por minuto
  return Math.max(1, Math.ceil(palabras.length / 200));
}

/**
 * Cuenta las palabras del contenido para datos estructurados
 */
export function contarPalabras(contenido: string): number {
  if (!contenido) return 0;
  
  const textoLimpio = contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return textoLimpio.split(' ').filter(palabra => palabra.length > 0).length;
}

/**
 * Genera datos estructurados JSON-LD para SEO
 */
export function generarDatosEstructurados(
  titulo: string,
  resumen: string,
  contenido: string,
  autor: string,
  fecha: string,
  url: string,
  imagenUrl?: string
): DatosEstructuradosArticulo {
  const fechaPublicacion = new Date(fecha).toISOString();
  const palabras = contarPalabras(contenido);
  const tiempoLectura = calcularTiempoLectura(contenido);
  
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: titulo,
    description: resumen,
    author: {
      "@type": "Person",
      name: autor
    },
    publisher: {
      "@type": "Organization",
      name: "Academia Vallenata Online",
      		logo: {
			"@type": "ImageObject",
			url: "https://academiavallenataonline.com/logo academia vallenata.png"
      }
    },
    datePublished: fechaPublicacion,
    dateModified: fechaPublicacion,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url
    },
    image: imagenUrl,
    url: url,
    articleBody: contenido.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
    wordCount: palabras,
    timeRequired: `PT${tiempoLectura}M`,
    inLanguage: "es-ES"
  };
}

/**
 * Genera meta tags para SEO
 */
export function generarMetaTags(
  titulo: string,
  resumen: string,
  url: string,
  imagenUrl?: string
): string {
  const metaTags = [
    `<meta property="og:title" content="${titulo}" />`,
    `<meta property="og:description" content="${resumen}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="Academia Vallenata Online" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${titulo}" />`,
    `<meta name="twitter:description" content="${resumen}" />`,
    `<meta name="description" content="${resumen}" />`,
    `<meta name="keywords" content="acordeón vallenato, música tradicional, cursos de acordeón, aprender vallenato, ${titulo.toLowerCase()}" />`
  ];
  
  if (imagenUrl) {
    metaTags.push(`<meta property="og:image" content="${imagenUrl}" />`);
    metaTags.push(`<meta name="twitter:image" content="${imagenUrl}" />`);
  }
  
  return metaTags.join('\n');
}

/**
 * Optimiza el contenido para SEO
 */
export function optimizarContenidoSEO(contenido: string): string {
  if (!contenido) return contenido;
  
  // Agregar alt text a imágenes sin él
  let contenidoOptimizado = contenido.replace(
    /<img([^>]*?)(?:\s+alt=["'][^"']*["'])?([^>]*?)>/gi,
    (match, antes, despues) => {
      if (match.includes('alt=')) return match;
      return `<img${antes} alt="Imagen del artículo sobre acordeón vallenato - Academia Vallenata Online"${despues}>`;
    }
  );
  
  // Agregar title a enlaces externos
  contenidoOptimizado = contenidoOptimizado.replace(
    /<a\s+href=["']https?:\/\/[^"']+["']([^>]*?)>/gi,
    (match) => {
      if (match.includes('title=')) return match;
      return match.replace('>', ' title="Enlace externo relacionado con acordeón vallenato">');
    }
  );
  
  return contenidoOptimizado;
}

/**
 * Genera breadcrumbs estructurados
 */
export function generarBreadcrumbs(titulo: string, slug: string): string {
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Inicio",
        "item": "https://academiavallenataonline.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blog",
        "item": "https://academiavallenataonline.com/blog"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": titulo,
        "item": `https://academiavallenataonline.com/blog/${slug}`
      }
    ]
  };
  
  return JSON.stringify(breadcrumbs);
} 