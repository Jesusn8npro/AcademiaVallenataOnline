import React, { useState, useEffect } from 'react';
// Importaciones corregidas
import HeroHome from '../../componentes/Inicio/HeroHome';
import SeccionOpciones from '../../componentes/Inicio/SeccionOpciones';
import SeccionInstructor from '../../componentes/Inicio/SeccionInstructor';
import SeccionStats from '../../componentes/Inicio/SeccionStats';
import SeccionCTAFinal from '../../componentes/Inicio/SeccionCTAFinal';
import SEO from '../../componentes/common/SEO';

const Home: React.FC = () => {
  const [paginaCargada, setPaginaCargada] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    setPaginaCargada(true);
    console.log('Página cargada correctamente');
  }, []);

  const scrollToSection = (sectionId: string) => {
    console.log('Scroll to:', sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    // Configurar smooth scroll global
    document.documentElement.style.scrollBehavior = 'smooth';

    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return (
    <>
      {/* Meta tags para SEO */}
      <SEO
        title="Academia Vallenata Online - Aprende Acordeón desde Cero | Simulador Gaming"
        description="🎵 La Academia #1 de Acordeón Vallenato online. Simulador gaming único, comunidad de 5,000+ estudiantes. Primera canción en 7 días garantizado."
      />

      {paginaCargada ? (
        <main style={styles.homePrincipal}>


          {/* Hero Principal */}
          <HeroHome mostrarModal={mostrarModal} scrollToSection={scrollToSection} />

          {/* Sección de Opciones de Aprendizaje */}
          <SeccionOpciones />

          {/* Sección del Instructor - Jesús González */}
          <SeccionInstructor />

          {/* Sección de Estadísticas y Social Proof */}
          <SeccionStats />

          {/* Sección CTA Final - Conversión */}
          <SeccionCTAFinal />
        </main>
      ) : (
        <div style={styles.loading}>
          <p>Cargando...</p>
        </div>
      )}
    </>
  );
};

const styles = {
  homePrincipal: {
    width: '100%',
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    paddingTop: '0', // El menú se superpone, no necesitamos padding
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '1.5rem',
  },
};

export default Home; 
