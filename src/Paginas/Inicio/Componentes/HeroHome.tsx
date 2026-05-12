import React from 'react';
import { useTranslation } from 'react-i18next';
import { sanitizarHTML } from '../../../utilidades/sanitizar';
import './HeroHome.css';
import { heroStyles as styles } from './HeroHome.styles';

interface HeroHomeProps {
  scrollToSection: (id: string) => void;
}

const HeroHome: React.FC<HeroHomeProps> = ({ scrollToSection }) => {
  const { t } = useTranslation();
  // NO usar useState(false) + useEffect(setVisible(true)) aqui — causaba
  // forced reflow ~350ms en mobile: primer render sin contenido, useEffect
  // mete contenido, browser recalcula layout. Renderizamos siempre, las
  // animaciones flyIn las hace CSS al montar (gratis, sin layout thrash).

  const irAlCursoEstrella = () => {
    window.location.href = '/curso-acordeon-desde-cero';
  };

  return (
    <section className="hero-section-container" style={styles.heroSection}>
      <div style={styles.heroParticles}>
        <div style={styles.particles}></div>
      </div>

      {/*
        Banner Hero deshabilitado: el archivo /images/Home/Banner-...jpg
        NO existe en public/, daba 404 en cada carga + DOM mutate al fallback.
        Si quieres re-habilitarlo: copiar el archivo a public/images/Home/
        o (mejor) importarlo como modulo Vite desde src/assets/images/Home/
      */}

      <div style={styles.heroContent}>
        <>
            <div
              style={{
                ...styles.credibilidadBadge,
                animation: 'flyInFromTop 0.8s ease-out, pulseGlow 3s ease-in-out infinite'
              }}
            >
              🏆 {t('hero.etiqueta')} • 5,000+ {t('hero.estadisticas.estudiantes')}
            </div>

            <div style={{ animation: 'flyInFromBottom 1s ease-out 0s' }}>
              <h1 style={styles.heroTitle}>
                <span style={styles.tituloPrincipal}>{t('hero.tituloPrincipal')}</span>
                <span style={styles.heroSubtitle}>{t('hero.subtitulo')}</span>
              </h1>
            </div>

            <div style={{ animation: 'flyInFromBottom 1s ease-out 0.2s both' }}>
              <p style={styles.heroDescription}>
                <strong dangerouslySetInnerHTML={{ __html: sanitizarHTML(t('hero.descripcion')) }} />
              </p>
            </div>

            <div
              className="hero-buttons"
              style={{
                ...styles.heroButtons,
                animation: 'flyInFromBottom 1s ease-out 0.3s both'
              }}
            >
              <button
                className="hero-btn-primary"
                onClick={irAlCursoEstrella}
                style={{
                  ...styles.heroBtnPrimary,
                  animation: 'pulseRed 2s ease-in-out infinite'
                }}
              >
                🚀 {t('hero.boton.empezar')}
                <span style={styles.btnSubtitle}>{t('hero.boton.subtexto')}</span>
              </button>

              <button
                className="hero-btn-gaming"
                onClick={() => scrollToSection('opciones')}
                style={styles.heroBtnGaming}
              >
                🤔 {t('hero.simuladorBoton.titulo')}
                <span style={styles.btnSubtitle}>{t('hero.simuladorBoton.subtitulo')}</span>
              </button>
            </div>

            <div style={{ animation: 'scaleIn 1s ease-out 0.5s both' }}>
              <div style={styles.heroRating}>
                <div style={styles.ratingEstrellas}>
                  <span style={styles.ratingStars}>⭐⭐⭐⭐⭐</span>
                  <span style={styles.ratingText}>4.9/5 - 847 reseñas verificadas</span>
                </div>
                <div style={styles.ratingEstudiantes}>
                  <span style={styles.numeroDestacado}>5,000+</span>
                  <span>{t('hero.estadisticas.estudiantes')}</span>
                </div>
              </div>
            </div>
        </>
      </div>

      <div style={styles.scrollIndicator}>
        <div style={styles.scrollMouse}>
          <div style={styles.scrollDot}></div>
        </div>
        <span style={styles.scrollText}>Descubre más</span>
      </div>
    </section>
  );
};

export default HeroHome;
