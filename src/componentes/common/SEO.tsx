import React from 'react';

interface SEOProps {
    title: string;
    description: string;
    name?: string;
    type?: string;
}

// Componente dummy para evitar errores de build con React 19 / react-helmet-async
// El SEO base está estático en index.html
export default function SEO({ title, description, name = 'Academia Vallenata Online', type = 'website' }: SEOProps) {
    // useEffect(() => {
    //   document.title = title;
    // }, [title]);

    return null;
}
