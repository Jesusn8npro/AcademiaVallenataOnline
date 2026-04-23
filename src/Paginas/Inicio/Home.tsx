import React, { useEffect } from 'react';
import HeroHome from './Componentes/HeroHome';
import SeccionOpciones from './Componentes/SeccionOpciones';
import SeccionInstructor from './Componentes/SeccionInstructor';
import SeccionStats from './Componentes/SeccionStats';
import SeccionCTAFinal from './Componentes/SeccionCTAFinal';
import SEO from '../../componentes/common/SEO';

const Home: React.FC = () => {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => { document.documentElement.style.scrollBehavior = 'auto'; };
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <SEO
        title="Academia Vallenata Online - Aprende Acordeón desde Cero | Simulador Gaming"
        description="🎵 La Academia #1 de Acordeón Vallenato online. Simulador gaming único, comunidad de 5,000+ estudiantes. Primera canción en 7 días garantizado."
      />
      <main style={styles.homePrincipal}>
        <HeroHome scrollToSection={scrollToSection} />
        <SeccionOpciones />
        <SeccionInstructor />
        <SeccionStats />
        <SeccionCTAFinal />
      </main>
    </>
  );
};

const styles = {
  homePrincipal: {
    width: '100%',
    minHeight: '100vh',
    overflowX: 'hidden' as const,
    paddingTop: '0',
  },
};

export default Home;
