import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface HeroHomeProps {
  mostrarModal: boolean;
  scrollToSection: (id: string) => void;
}

const HeroHome: React.FC<HeroHomeProps> = ({ scrollToSection }) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const irAlCursoEstrella = () => {
    window.location.href = '/curso-acordeon-desde-cero';
  };

  const irASimulador = () => {
    // Simulador próximamente
    alert('🎮 ¡Simulador Gaming en desarrollo! Será la experiencia más innovadora para aprender acordeón. ¡Lanzamiento en los próximos días!');
  };

  return (
    <>
      <section className="hero-section-container" style={styles.heroSection}>
        {/* Fondo animado con partículas */}
        <div style={styles.heroParticles}>
          <div style={styles.particles}></div>
        </div>

        {/* Imagen de fondo con overlay */}
        <div style={styles.heroBackground}>
          <img
            src="/imagenes/Inicio/Home/Banner- Academia vallenata ONLINE.jpg"
            alt={t('hero.etiqueta')}
            style={styles.heroBgImage}
          />
        </div>

        {/* Contenido principal */}
        <div style={styles.heroContent}>
          {visible && (
            <>
              {/* Badge de credibilidad */}
              <div
                style={{
                  ...styles.credibilidadBadge,
                  animation: 'flyInFromTop 0.8s ease-out, pulseGlow 3s ease-in-out infinite'
                }}
              >
                🏆 {t('hero.etiqueta')} • 5,000+ {t('hero.estadisticas.estudiantes')}
              </div>

              {/* Título principal */}
              <div
                style={{
                  animation: 'flyInFromBottom 1s ease-out 0s'
                }}
              >
                <h1 style={styles.heroTitle}>
                  <span style={styles.tituloPrincipal}>{t('hero.tituloPrincipal')}</span>
                  <span style={styles.heroSubtitle}>{t('hero.subtitulo')}</span>
                </h1>
              </div>

              {/* Promesa de valor */}
              <div
                style={{
                  animation: 'flyInFromBottom 1s ease-out 0.2s both'
                }}
              >
                <p style={styles.heroDescription}>
                  <strong dangerouslySetInnerHTML={{ __html: t('hero.descripcion') }} />
                </p>
              </div>

              {/* Botones de acción */}
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

              {/* Social proof */}
              <div
                style={{
                  animation: 'scaleIn 1s ease-out 0.5s both'
                }}
              >
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
          )}
        </div>

        {/* Scroll indicator */}
        <div style={styles.scrollIndicator}>
          <div style={styles.scrollMouse}>
            <div style={styles.scrollDot}></div>
          </div>
          <span style={styles.scrollText}>Descubre más</span>
        </div>
      </section>

      <style>{`
        @keyframes particleFloat {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
          100% { transform: translateY(0) rotate(360deg); }
        }

        @keyframes pulseGlow {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 12px 35px rgba(251, 191, 36, 0.5);
          }
        }

        @keyframes pulseRed {
          0%, 100% { 
            box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
          }
          50% { 
            box-shadow: 0 15px 40px rgba(220, 38, 38, 0.7), 0 0 20px rgba(220, 38, 38, 0.3);
          }
        }

        @keyframes scrollDot {
          0%, 20% { opacity: 1; transform: translateY(0); }
          80%, 100% { opacity: 0; transform: translateY(1rem); }
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateX(-50%) translateY(0); }
          40% { transform: translateX(-50%) translateY(-10px); }
          60% { transform: translateX(-50%) translateY(-5px); }
        }

        @keyframes flyInFromTop {
          from { transform: translateY(-30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes flyInFromBottom {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Media queries para botones responsivos */
        @media (max-width: 768px) {
          .hero-buttons {
            flex-direction: column !important;
          }
          
          .hero-btn-primary, .hero-btn-gaming {
            width: 100% !important;
            max-width: 100% !important;
            min-width: auto !important;
          }
        }

        @media (min-width: 769px) {
          .hero-buttons {
            flex-direction: row !important;
          }
        }
        
        /* Mobile Top Padding Fix */
        @media (max-width: 768px) {
          .hero-section-container {
            padding-top: 80px !important;
          }
        }
      `}</style>
    </>
  );
};

const styles = {
  heroSection: {
    position: 'relative' as const,
    minHeight: '100vh',
    width: '100%',
    maxWidth: '100vw',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #7c3aed 50%, #1e40af 75%, #0f172a 100%)',
    boxSizing: 'border-box' as const,
  },
  heroParticles: {
    position: 'absolute' as const,
    inset: '0',
    opacity: 0.3,
  },
  particles: {
    width: '100%',
    height: '100%',
    background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
    animation: 'particleFloat 25s linear infinite',
  },
  heroBackground: {
    position: 'absolute' as const,
    inset: '0',
    background: 'rgba(0, 0, 0, 0.5)',
  },
  heroBgImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    opacity: 0.2,
  },
  heroContent: {
    position: 'relative' as const,
    zIndex: 10,
    textAlign: 'center' as const,
    color: 'white',
    padding: '0 1rem',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    boxSizing: 'border-box' as const,
  },
  credibilidadBadge: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    padding: '0.8rem 2rem',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)',
  },
  heroTitle: {
    marginBottom: '2rem',
  },
  tituloPrincipal: {
    display: 'block',
    fontSize: 'clamp(2.5rem, 8vw, 6rem)',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1.1,
    marginBottom: '0.5rem',
    textShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  heroSubtitle: {
    display: 'block',
    fontSize: 'clamp(1.5rem, 4vw, 3rem)',
    fontWeight: 700,
    color: '#e2e8f0',
    lineHeight: 1.2,
  },
  heroDescription: {
    fontSize: 'clamp(1.1rem, 3vw, 1.4rem)',
    marginBottom: '2rem',
    color: '#cbd5e1',
    maxWidth: '800px',
    marginLeft: 'auto',
    marginRight: 'auto',
    lineHeight: 1.6,
  },
  heroButtons: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '1.5rem',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '2.5rem',
    maxWidth: '100%',
    width: '100%',
    marginLeft: 'auto',
    marginRight: 'auto',
    padding: '0 0.5rem',
    boxSizing: 'border-box' as const,
    flexWrap: 'wrap' as const,
  },
  heroBtnPrimary: {
    padding: '1.5rem 1rem',
    borderRadius: '15px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 'clamp(1rem, 4vw, 1.2rem)',
    width: 'auto',
    minWidth: '280px',
    flex: '1',
    maxWidth: '400px',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
    color: 'white',
    boxShadow: '0 10px 30px rgba(220, 38, 38, 0.4)',
  },
  heroBtnGaming: {
    padding: '1.5rem 2rem',
    borderRadius: '15px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: 'clamp(1rem, 4vw, 1.2rem)',
    width: 'auto',
    minWidth: '280px',
    flex: '1',
    maxWidth: '400px',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #4f46e5 100%)',
    color: 'white',
    boxShadow: '0 10px 30px rgba(124, 58, 237, 0.4)',
  },
  btnSubtitle: {
    fontSize: '0.8rem',
    fontWeight: 400,
    opacity: 0.9,
    textTransform: 'none' as const,
    letterSpacing: 'normal',
  },
  heroRating: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1rem',
  },
  ratingEstrellas: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  ratingStars: {
    fontSize: '1.5rem',
  },
  ratingText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fbbf24',
  },
  ratingEstudiantes: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.1rem',
  },
  numeroDestacado: {
    fontSize: '2rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  scrollIndicator: {
    position: 'absolute' as const,
    bottom: '2rem',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '0.5rem',
    animation: 'bounce 2s infinite',
  },
  scrollMouse: {
    width: '1.5rem',
    height: '2.5rem',
    border: '2px solid rgba(255, 255, 255, 0.6)',
    borderRadius: '15px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '0.5rem',
  },
  scrollDot: {
    width: '0.25rem',
    height: '0.75rem',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '2px',
    animation: 'scrollDot 2s infinite',
  },
  scrollText: {
    fontSize: '0.8rem',
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 500,
  },
};

export default HeroHome; 