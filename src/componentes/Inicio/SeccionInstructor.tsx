import React, { useState, useEffect } from 'react';

const SeccionInstructor: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    });

    const section = document.querySelector('.seccion-instructor');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const irAlCurso = () => {
    window.location.href = '/curso-acordeon-desde-cero';
  };

  return (
    <>
      <section className="seccion-instructor" id="instructor" style={styles.seccionInstructor}>
        {/* Fondo atmosférico */}
        <div style={styles.fondoAtmosferico}>
          <div style={styles.patronMusical}></div>
          <div style={styles.gradienteOverlay}></div>
        </div>

        <div style={styles.contenedor}>

          {/* Header emocional */}
          {visible && (
            <div style={{ ...styles.headerEmocional, animation: 'flyIn 1.2s ease-out' }}>
              <div style={styles.badgeQuestion}>🎵 TU MENTOR MUSICAL</div>
              <h2 style={styles.tituloEmocional}>
                <span style={styles.preguntaClave}>¿Quién Estará A Tu Lado</span>
                <span style={styles.respuestaDorada}>En Cada Nota?</span>
              </h2>
            </div>
          )}

          {/* Contenido principal split */}
          <div className="contenido-split" style={styles.contenidoSplit}>

            {/* Lado izquierdo - Foto y credenciales */}
            {visible && (
              <div className="lado-izquierdo" style={{ ...styles.ladoIzquierdo, animation: 'scaleIn 1s ease-out 0.3s both' }}>

                {/* Collage de fotos profesionales */}
                <div className="collage-maestro" style={styles.collageMaestro}>
                  <div className="foto-principal" style={styles.fotoPrincipal}>
                    <img
                      src="/imagenes/Inicio/Home/Foto maestro oficial JESUS GONZALEZ.jpg"
                      alt="Maestro Jesús González"
                      className="img-maestro"
                      style={styles.imgMaestro}
                    />
                    <div style={styles.overlayProfesional}></div>
                  </div>

                  <div className="badge-experiencia" style={styles.badgeExperiencia}>
                    <span className="numero-anos" style={styles.numeroAnos}>10+</span>
                    <span className="texto-anos" style={styles.textoAnos}>Años de Experiencia</span>
                  </div>
                </div>


              </div>
            )}

            {/* Lado derecho - Historia personal */}
            {visible && (
              <div className="lado-derecho" style={{ ...styles.ladoDerecho, animation: 'flyInFromRight 1s ease-out 0.5s both' }}>

                <div style={styles.presentacionPersonal}>
                  <h3 style={styles.saludoPersonal}>Hola, soy Jesús González</h3>
                  <p style={styles.subtituloPersonal}>Tu mentor en el acordeón vallenato</p>

                  <div style={styles.historiaEmotiva}>
                    <p style={styles.parrafoPrincipal}>
                      Con más de <strong>10 años de experiencia profesional</strong>, he tenido el honor de
                      compartir escena con <strong>Poncho Zuleta</strong> en más de 15 conciertos,
                      grabar junto a <strong>Felipe Peláez</strong> y <strong>Orlando Acosta</strong>,
                      y llevar nuestra hermosa música vallenata por toda Europa.
                    </p>

                    <p style={styles.parrafoGarantia}>
                      <strong>Te garantizo algo que nadie más puede:</strong> Mi método probado te llevará
                      de <strong>cero absoluto a tu primera canción en solo 7 días</strong>. No es magia,
                      es el mismo sistema que ha transformado a más de <strong>5,000 estudiantes</strong>
                      en acordeonistas exitosos.
                    </p>

                    <p style={styles.parrafoDiferencia}>
                      A diferencia de otros maestros, yo <strong>NO te abandono después de vender el curso</strong>.
                      Te acompaño paso a paso hasta que toques tu primera canción completa. Mi misión es simple:
                      <strong>hacer realidad tu sueño musical</strong>, sin frustración, sin vueltas,
                      <strong>directo al éxito</strong>.
                    </p>

                    <p style={styles.parrafoUrgencia}>
                      Miles ya están viviendo su sueño musical conmigo. <strong>¿Vas a seguir esperando</strong>
                      o te unes hoy mismo a la academia que <strong>SÍ cumple lo que promete?</strong>
                    </p>
                  </div>

                  {/* CTA principal */}
                  <div style={styles.ctaMaestro}>
                    <button style={styles.ctaPrincipal} onClick={irAlCurso}>
                      🚀 APRENDER CON JESÚS
                      <span style={styles.ctaSubtitle}>Curso desde cero - Primera canción en 7 días</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>



        </div>
      </section>

      <style>{`
        @keyframes floatPattern {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-60px) rotate(360deg); }
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

        @keyframes flyIn {
          from { transform: translateY(60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0.7); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        @keyframes flyInFromRight {
          from { transform: translateX(50px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        .cta-principal:hover {
          transform: translateY(-8px) scale(1.03);
          box-shadow: 0 25px 60px rgba(220, 38, 38, 0.6);
        }

        .img-maestro:hover {
          transform: scale(1.05);
        }

        /* === RESPONSIVE MOBILE === */
        @media (max-width: 900px) {
          .seccion-instructor {
            padding: 4rem 0 !important;
          }

          .contenido-split {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
          }

          .lado-izquierdo {
            order: 1;
          }

          .lado-derecho {
            order: 2;
          }

          .foto-principal {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 auto;
          }

          .img-maestro {
            width: 100% !important;
            height: auto !important;
            object-fit: cover !important;
            object-position: center !important;
            display: block !important;
          }

          .collage-maestro {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .badge-experiencia {
            top: 10px !important;
            right: 10px !important;
            padding: 0.75rem !important;
          }

          .numero-anos {
            font-size: 1.5rem !important;
          }

          .texto-anos {
            font-size: 0.7rem !important;
          }
        }

        @media (max-width: 480px) {
          .seccion-instructor {
            padding: 3rem 0 !important;
          }

          .contenedor {
            padding: 0 1rem !important;
          }

          .header-emocional {
            margin-bottom: 3rem !important;
          }

          .badge-question {
            font-size: 0.75rem !important;
            padding: 0.6rem 1.5rem !important;
          }

          .titulo-emocional {
            font-size: 2rem !important;
          }

          .saludo-personal {
            font-size: 1.75rem !important;
          }

          .subtitulo-personal {
            font-size: 1.1rem !important;
          }

          .parrafo-principal,
          .parrafo-garantia,
          .parrafo-diferencia,
          .parrafo-urgencia {
            font-size: 1rem !important;
          }

          .cta-principal {
            padding: 1.5rem !important;
            font-size: 1rem !important;
          }
        }
      `}</style>
    </>
  );
};

const styles = {
  seccionInstructor: {
    position: 'relative' as const,
    padding: '8rem 0',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%)',
    color: 'white',
    overflow: 'hidden',
  },
  fondoAtmosferico: {
    position: 'absolute' as const,
    inset: '0',
    zIndex: 1,
  },
  patronMusical: {
    position: 'absolute' as const,
    inset: '0',
    backgroundImage: `
      radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.1) 2px, transparent 2px),
      radial-gradient(circle at 75% 75%, rgba(124, 58, 237, 0.1) 2px, transparent 2px)
    `,
    backgroundSize: '60px 60px',
    animation: 'floatPattern 20s linear infinite',
  },
  gradienteOverlay: {
    position: 'absolute' as const,
    inset: '0',
    background: 'radial-gradient(ellipse at center, transparent 30%, rgba(15, 23, 42, 0.8) 100%)',
  },
  contenedor: {
    position: 'relative' as const,
    zIndex: 10,
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 2rem',
  },
  headerEmocional: {
    textAlign: 'center' as const,
    marginBottom: '6rem',
  },
  badgeQuestion: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    padding: '0.8rem 2rem',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)',
    animation: 'pulseGlow 3s ease-in-out infinite',
  },
  tituloEmocional: {
    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
    fontWeight: 900,
    lineHeight: 1.1,
    margin: 0,
  },
  preguntaClave: {
    display: 'block',
    color: '#e2e8f0',
    marginBottom: '0.5rem',
  },
  respuestaDorada: {
    display: 'block',
    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  contenidoSplit: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: '5rem',
    alignItems: 'center',
  },
  ladoIzquierdo: {},
  collageMaestro: {
    position: 'relative' as const,
    marginBottom: '3rem',
  },
  fotoPrincipal: {
    position: 'relative' as const,
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.3)',
  },
  imgMaestro: {
    width: '100%',
    height: 'auto',
    objectFit: 'contain' as const,
    transition: 'transform 0.3s ease',
    maxHeight: 'none',
  },
  overlayProfesional: {
    position: 'absolute' as const,
    inset: '0',
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%)',
  },
  badgeExperiencia: {
    position: 'absolute' as const,
    top: '20px',
    right: '20px',
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(10px)',
    padding: '1rem',
    borderRadius: '15px',
    textAlign: 'center' as const,
    border: '2px solid rgba(251, 191, 36, 0.3)',
  },
  numeroAnos: {
    display: 'block',
    fontSize: '2rem',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  textoAnos: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  ladoDerecho: {},
  presentacionPersonal: {
    height: '100%',
  },
  saludoPersonal: {
    fontSize: 'clamp(2rem, 4vw, 3rem)',
    fontWeight: 800,
    color: '#fbbf24',
    marginBottom: '0.5rem',
    lineHeight: 1.2,
  },
  subtituloPersonal: {
    fontSize: '1.3rem',
    color: '#94a3b8',
    marginBottom: '3rem',
    fontWeight: 600,
  },
  historiaEmotiva: {
    marginBottom: '3rem',
  },
  parrafoPrincipal: {
    fontSize: '1.1rem',
    lineHeight: 1.8,
    color: '#e2e8f0',
    marginBottom: '1.5rem',
  },
  parrafoGarantia: {
    fontSize: '1.15rem',
    lineHeight: 1.8,
    color: '#e2e8f0',
    marginBottom: '1.5rem',
    background: 'rgba(251, 191, 36, 0.1)',
    padding: '1.5rem',
    borderRadius: '12px',
    borderLeft: '4px solid #fbbf24',
  },
  parrafoDiferencia: {
    fontSize: '1.1rem',
    lineHeight: 1.8,
    color: '#e2e8f0',
    marginBottom: '1.5rem',
  },
  parrafoUrgencia: {
    fontSize: '1.1rem',
    lineHeight: 1.8,
    color: '#e2e8f0',
    marginBottom: '2rem',
    textAlign: 'center' as const,
    background: 'rgba(220, 38, 38, 0.1)',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '2px solid rgba(220, 38, 38, 0.3)',
  },
  ctaMaestro: {
    marginTop: '2rem',
  },
  ctaPrincipal: {
    width: '100%',
    padding: '2rem',
    borderRadius: '15px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 800,
    fontSize: '1.2rem',
    transition: 'all 0.3s ease',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)',
    color: 'white',
    boxShadow: '0 15px 40px rgba(220, 38, 38, 0.4)',
  },
  ctaSubtitle: {
    fontSize: '0.9rem',
    fontWeight: 400,
    opacity: 0.95,
    textTransform: 'none' as const,
    letterSpacing: 'normal',
    marginTop: '0.5rem',
    lineHeight: 1.4,
  },
};

export default SeccionInstructor; 