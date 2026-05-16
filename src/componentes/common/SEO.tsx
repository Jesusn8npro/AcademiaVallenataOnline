import { useEffect } from 'react';

interface SchemaOrg {
    '@context': string;
    '@type': string;
    [key: string]: any;
}

interface SEOProps {
    title: string;
    description: string;
    canonicalUrl?: string;
    ogImage?: string;
    ogType?: 'website' | 'article' | 'product';
    schema?: SchemaOrg | SchemaOrg[];
    noindex?: boolean;
}

export default function SEO({
    title,
    description,
    canonicalUrl,
    ogImage = 'https://academiavallenata.online/og-image.jpg',
    ogType = 'website',
    schema,
    noindex = false,
}: SEOProps) {
    useEffect(() => {
        document.title = title;

        setMeta('name', 'description', description);
        setMeta('property', 'og:title', title);
        setMeta('property', 'og:description', description);
        setMeta('property', 'og:type', ogType);
        setMeta('property', 'og:image', ogImage);
        setMeta('name', 'twitter:title', title);
        setMeta('name', 'twitter:description', description);
        setMeta('name', 'twitter:image', ogImage);

        if (canonicalUrl) {
            setMeta('property', 'og:url', canonicalUrl);
            setCanonical(canonicalUrl);
        }

        if (noindex) {
            setMeta('name', 'robots', 'noindex, nofollow');
        }

        if (schema) {
            injectSchema(schema);
        }

        return () => {
            removeSchema();
        };
    }, [title, description, canonicalUrl, ogImage, ogType, schema, noindex]);

    return null;
}

function setMeta(attr: 'name' | 'property', key: string, value: string) {
    let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

function setCanonical(url: string) {
    let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', url);
}

function injectSchema(schema: SchemaOrg | SchemaOrg[]) {
    removeSchema();
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seo-schema-dynamic';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}

function removeSchema() {
    document.getElementById('seo-schema-dynamic')?.remove();
}
