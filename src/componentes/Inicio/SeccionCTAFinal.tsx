import React, { useState, useEffect } from 'react';

const SeccionCTAFinal: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    });

    const section = document.querySelector('.seccion-cta-final');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const irAlCursoEstrella = () => {
    window.location.href = '/curso-acordeon-desde-cero';
  };

  const irASimulador = () => {
    // Simulador próximamente
    alert('¡Simulador gaming próximo a lanzar! Será la experiencia más innovadora para aprender acordeón.');
  };

  const beneficiosFinales = [
    'Primera canción en 7 días garantizado',
    'Simulador gaming (lanzamiento próximos días)',
    'Comunidad de 5,000+ estudiantes',
    'Método del Maestro Jesús González',
    'Garantía de satisfacción 30 días'
  ];

  return (
    <>
      <section className="seccion-cta-final" style={styles.seccionCtaFinal}>
        <div style={styles.contenedor}>
          
          {/* Mensaje principal */}
          {visible && (
            <div style={{ ...styles.mensajePrincipal, animation: 'flyIn 1s ease-out' }}>
              <div style={styles.badgeUrgencia}>⚡ TU MOMENTO ES AHORA</div>
              <h2 style={styles.tituloCta}>
                <span style={styles.textoImpacto}>¡No Esperes Más!</span><br />
                <span style={styles.textoMotivacion}>Tu Sueño Musical te Está Esperando</span>
              </h2>
              <p style={styles.descripcionCta}>
                Miles de estudiantes ya están tocando acordeón gracias a nuestro método probado.
                <br /><strong>Es tu turno de unirte al éxito.</strong>
              </p>
            </div>
          )}

          {/* Beneficios finales */}
          {visible && (
            <div style={{ ...styles.beneficiosFinales, animation: 'flyIn 1s ease-out 0.2s both' }}>
              <h3 style={styles.tituloBeneficios}>Lo que Obtienes:</h3>
              <div style={styles.gridBeneficios}>
                {beneficiosFinales.map((beneficio, index) => (
                  <div 
                    key={index}
                    style={{
                      ...styles.beneficioFinal,
                      animation: `flyInFromLeft 0.5s ease-out ${0.3 + (index * 0.1)}s both`
                    }}
                  >
                    <span style={styles.checkFinal}>✅</span>
                    {beneficio}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón principal */}
          {visible && (
            <div style={{ ...styles.accionPrincipal, animation: 'scaleIn 1s ease-out 0.6s both' }}>
              <button style={styles.botonMegaCta} onClick={irAlCursoEstrella}>
                <span style={styles.iconoBoton}>🚀</span>
                <div style={styles.textoBoton}>
                  <span style={styles.textoPrincipal}>¡EMPEZAR AHORA!</span>
                  <span style={styles.textoSecundario}>Curso desde cero</span>
                </div>
              </button>
              
              <button style={styles.botonSimulador} onClick={irASimulador}>
                🎮 Simulador (Próximamente)
              </button>
            </div>
          )}

          {/* Garantía */}
          {visible && (
            <div style={{ ...styles.garantiaFinal, animation: 'flyIn 1s ease-out 0.8s both' }}>
              <div style={styles.contenidoGarantia}>
                <div style={styles.iconoGarantia}>🛡️</div>
                <div style={styles.textoGarantia}>
                  <h4>Garantía Total de 30 Días</h4>
                  <p>Si no estás 100% satisfecho, te devolvemos tu dinero sin preguntas</p>
                </div>
              </div>
            </div>
          )}

          {/* Mensaje de cierre */}
          {visible && (
            <div style={{ ...styles.mensajeCierre, animation: 'scaleIn 1s ease-out 1s both' }}>
              <div style={styles.contenidoCierre}>
                <h3>La Música Vallenata Corre por Tus Venas</h3>
                <p>
                  No permitas que pase otro día sin tocar. 
                  <br /><strong>Tu acordeón te está esperando. Es hora de liberarlo.</strong>
                </p>
                
                <div style={styles.fraseMotivacional}>
                  <span style={styles.comillas}>"</span>
                  <span style={styles.frase}>El mejor momento para aprender fue ayer. El segundo mejor momento es AHORA.</span>
                  <span style={styles.comillas}>"</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes rotatePattern {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulseGlow {
          0%, 100% { 
            transform: scale(1);
            box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
          }
          50% { 
            transform: scale(1.05);
            box-shadow: 0 15px 40px rgba(251, 191, 36, 0.6);
          }
        }

        @keyframes flyIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes flyInFromLeft {
          from { transform: translateX(-30px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .boton-mega-cta:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 60px rgba(251, 191, 36, 0.6);
        }

        .boton-simulador:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #fbbf24;
          color: #fbbf24;
        }
      `}</style>
    </>
  );
};

const styles = {
  seccionCtaFinal: {
    padding: '6rem 0',
    background: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 25%, #b91c1c 50%, #991b1b 75%, #7c2d12 100%)',
    color: 'white',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  contenedor: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 2rem',
    position: 'relative' as const,
    zIndex: 2,
  },
  mensajePrincipal: {
    textAlign: 'center' as const,
    marginBottom: '4rem',
  },
  badgeUrgencia: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    padding: '0.8rem 2rem',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.4)',
    animation: 'pulseGlow 2s ease-in-out infinite',
  },
  tituloCta: {
    fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
    fontWeight: 900,
    marginBottom: '1.5rem',
    lineHeight: 1.1,
  },
  textoImpacto: {
    display: 'block',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '0.5rem',
  },
  textoMotivacion: {
    display: 'block',
    color: '#fecaca',
  },
  descripcionCta: {
    fontSize: '1.3rem',
    color: '#fecaca',
    maxWidth: '600px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  beneficiosFinales: {
    marginBottom: '4rem',
  },
  tituloBeneficios: {
    textAlign: 'center' as const,
    fontSize: '1.8rem',
    fontWeight: 800,
    color: '#fbbf24',
    marginBottom: '2rem',
  },
  gridBeneficios: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '1rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  beneficioFinal: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    fontWeight: 600,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  checkFinal: {
    fontSize: '1.2rem',
    flexShrink: 0,
  },
  accionPrincipal: {
    textAlign: 'center' as const,
    marginBottom: '4rem',
  },
  botonMegaCta: {
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    border: 'none',
    padding: '2rem 3rem',
    borderRadius: '20px',
    fontWeight: 900,
    fontSize: '1.4rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 15px 40px rgba(251, 191, 36, 0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    margin: '0 auto 1.5rem auto',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  iconoBoton: {
    fontSize: '2rem',
  },
  textoBoton: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  textoPrincipal: {
    fontSize: '1.4rem',
    lineHeight: 1,
  },
  textoSecundario: {
    fontSize: '1rem',
    opacity: 0.8,
    textTransform: 'none' as const,
    letterSpacing: 'normal',
  },
  botonSimulador: {
    background: 'transparent',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    color: 'white',
    padding: '1rem 2rem',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  garantiaFinal: {
    marginBottom: '4rem',
  },
  contenidoGarantia: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1.5rem',
    background: 'rgba(255, 255, 255, 0.1)',
    padding: '2rem',
    borderRadius: '16px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  iconoGarantia: {
    fontSize: '3rem',
    flexShrink: 0,
  },
  textoGarantia: {},
  mensajeCierre: {
    textAlign: 'center' as const,
  },
  contenidoCierre: {},
  fraseMotivacional: {
    fontStyle: 'italic',
    fontSize: '1.1rem',
    color: '#fed7aa',
    position: 'relative' as const,
    padding: '1.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    maxWidth: '500px',
    margin: '0 auto',
  },
  comillas: {
    fontSize: '2rem',
    color: '#fbbf24',
    fontWeight: 900,
  },
  frase: {
    fontWeight: 600,
  },
};

export default SeccionCTAFinal; 