import React, { useState, useEffect } from 'react';

const SeccionStats: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [contadorIniciado, setContadorIniciado] = useState(false);

  // Estados para contadores
  const [estudiantesCount, setEstudiantesCount] = useState(0);
  const [satisfaccionCount, setSatisfaccionCount] = useState(0);
  const [reseniasCount, setReseniasCount] = useState(0);
  const [experienciaCount, setExperienciaCount] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !contadorIniciado) {
          setVisible(true);
          setContadorIniciado(true);
          setTimeout(() => animarContadores(), 500);
        }
      });
    });

    const section = document.querySelector('.seccion-stats');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, [contadorIniciado]);

  const animarContadores = () => {
    animarNumero(1247, 2000, (valor) => setEstudiantesCount(valor));
    animarNumero(4.8, 1500, (valor) => setSatisfaccionCount(Math.round(valor * 10) / 10));
    animarNumero(312, 1800, (valor) => setReseniasCount(valor));
    animarNumero(10, 1200, (valor) => setExperienciaCount(valor));
  };

  const animarNumero = (objetivo: number, duracion: number, callback: (valor: number) => void) => {
    const inicio = performance.now();

    const actualizar = (tiempoActual: number) => {
      const progreso = Math.min((tiempoActual - inicio) / duracion, 1);
      const easeOut = 1 - Math.pow(1 - progreso, 4);
      const valorActual = objetivo * easeOut;

      callback(Math.floor(valorActual));
      if (progreso < 1) requestAnimationFrame(actualizar);
      else callback(objetivo);
    };

    requestAnimationFrame(actualizar);
  };

  const estadisticas = [
    {
      numero: () => estudiantesCount.toLocaleString(),
      sufijo: '+',
      titulo: 'Estudiantes Transformados',
      icono: '👥',
      testimonio: '"Jesús cambió mi vida. En 3 semanas ya tocaba en fiestas familiares" - Carlos M.',
      destacado: true
    },
    {
      numero: () => reseniasCount.toString(),
      sufijo: '',
      titulo: 'Reseñas Auténticas',
      icono: '📝',
      testimonio: '"Mi hijo de 12 años ya toca mejor que yo" - Roberto P.',
      destacado: true
    },
    {
      numero: () => experienciaCount.toString(),
      sufijo: '+',
      titulo: 'Años Profesionales',
      icono: '🏆',
      testimonio: '"Se nota la experiencia de Jesús en cada clase" - Ana G.',
      destacado: false
    }
  ];

  const logrosExtras = [
    { titulo: 'Primera Canción', valor: '7 días', descripcion: 'Promedio de estudiantes que logran tocar su primera canción completa' },
    { titulo: 'Tasa de Éxito', valor: '89%', descripcion: 'De estudiantes que completan su primer mes de aprendizaje' },
    { titulo: 'Satisfacción', valor: '96%', descripcion: 'Recomendarían la academia a familiares y amigos' }
  ];

  return (
    <>
      <section className="seccion-stats" style={styles.seccionStats}>
        <div style={styles.contenedor}>

          {/* Header vendedor */}
          {visible && (
            <div style={{ ...styles.header, animation: 'flyIn 1s ease-out' }}>
              <div style={styles.badgeProof}>🏆 RESULTADOS COMPROBADOS</div>
              <h2 style={styles.titulo}>Los Números NO Mienten</h2>
              <p style={styles.descripcion}>
                Mientras otras academias prometen, <strong>nosotros demostramos</strong> con resultados reales
                <br />de estudiantes que ya están <strong>viviendo su sueño musical.</strong>
              </p>
            </div>
          )}

          {/* Grid de estadísticas principales */}
          <div className="grid-stats" style={styles.gridStats}>
            {estadisticas.map((stat, index) => (
              visible && (
                <div
                  key={index}
                  style={{
                    ...styles.statCard,
                    ...(stat.destacado ? styles.destacado : {}),
                    animation: `scaleIn 0.8s ease-out ${0.2 + (index * 0.15)}s both`
                  }}
                >
                  <div style={styles.icono}>{stat.icono}</div>
                  <div style={styles.numero}>
                    {stat.numero()}<span style={styles.sufijo}>{stat.sufijo}</span>
                  </div>
                  <div style={styles.tituloStat}>{stat.titulo}</div>

                  {/* Testimonio sutil */}
                  <div style={styles.testimonioSutil}>
                    <div style={styles.comillasMini}>"</div>
                    <p style={styles.textoTestimonio}>{stat.testimonio}</p>
                  </div>

                  {stat.destacado && (
                    <div style={styles.badgeDestacado}>✨ MÁS POPULAR</div>
                  )}
                </div>
              )
            ))}
          </div>

          {/* Logros comprobados */}
          {visible && (
            <div style={{ ...styles.logrosComprobados, animation: 'flyIn 1s ease-out 0.8s both' }}>
              <h3 style={styles.tituloLogros}>Métricas que Importan de Verdad</h3>

              <div className="grid-logros" style={styles.gridLogros}>
                {logrosExtras.map((logro, index) => (
                  <div
                    key={index}
                    style={{
                      ...styles.logroCard,
                      animation: `scaleIn 0.6s ease-out ${0.9 + (index * 0.1)}s both`
                    }}
                  >
                    <div style={styles.valorLogro}>{logro.valor}</div>
                    <div style={styles.tituloLogro}>{logro.titulo}</div>
                    <div style={styles.descripcionLogro}>{logro.descripcion}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje vendedor final */}
          {visible && (
            <div style={{ ...styles.mensajeVendedor, animation: 'scaleIn 1s ease-out 1.2s both' }}>
              <div style={styles.contenidoVendedor}>
                <h3>¿Aún Tienes Dudas?</h3>
                <p>
                  <strong>{estudiantesCount.toLocaleString()}+ estudiantes</strong> confiaron en nosotros y
                  <strong> NO se arrepintieron.</strong> Sus vidas musicales cambiaron para siempre.
                </p>
                <div style={styles.fraseImpacto}>
                  "La diferencia entre soñar y lograr está en elegir al <strong>maestro correcto.</strong>"
                </div>
              </div>
            </div>
          )}

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
            box-shadow: 0 8px 25px rgba(251, 191, 36, 0.4);
          }
          50% { 
            transform: scale(1.02);
            box-shadow: 0 12px 35px rgba(251, 191, 36, 0.6);
          }
        }

        @keyframes rotatePattern {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes flyIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .stat-card:hover {
          background: rgba(251, 191, 36, 0.1);
          transform: translateY(-10px);
          border-color: rgba(251, 191, 36, 0.4);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }

        .stat-card.destacado:hover {
          transform: translateY(-10px) scale(1.02);
        }

        .logro-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-5px);
          border-color: rgba(251, 191, 36, 0.3);
        }
        .logro-card:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-5px);
          border-color: rgba(251, 191, 36, 0.3);
        }

        /* === RESPONSIVE MOBILE === */
        @media (max-width: 900px) {
          .seccion-stats {
            padding: 4rem 0 !important;
          }
          
          .grid-stats {
            grid-template-columns: 1fr !important;
            gap: 1.5rem !important;
            max-width: 450px;
            margin: 0 auto 3rem auto;
          }

          .grid-logros {
            grid-template-columns: 1fr !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
          }

          .titulo, .titulo-logros {
            font-size: 2.5rem !important;
          }

          .logro-card {
            padding: 1.5rem !important;
          }

          .valor-logro {
            font-size: 2rem !important;
          }
        }

        @media (max-width: 480px) {
          .seccion-stats {
            padding: 3rem 0 !important;
          }

          .titulo, .titulo-logros {
            font-size: 2rem !important;
          }

          .numero {
            font-size: 3rem !important;
          }
        }
      `}</style>
    </>
  );
};

const styles = {
  seccionStats: {
    padding: '6rem 0',
    background: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)',
    color: 'white',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  contenedor: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    position: 'relative' as const,
    zIndex: 2,
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '4rem',
  },
  badgeProof: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    padding: '0.8rem 2rem',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.4)',
    animation: 'pulseGlow 3s ease-in-out infinite',
  },
  titulo: {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 900,
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '1.5rem',
    lineHeight: 1.1,
  },
  descripcion: {
    fontSize: '1.3rem',
    color: '#cbd5e1',
    maxWidth: '800px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  gridStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
    marginBottom: '5rem',
  },
  statCard: {
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '2.5rem 2rem',
    textAlign: 'center' as const,
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.4s ease',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  destacado: {
    background: 'rgba(251, 191, 36, 0.08)',
    border: '2px solid rgba(251, 191, 36, 0.3)',
    transform: 'scale(1.02)',
  },
  icono: {
    fontSize: '3.5rem',
    marginBottom: '1rem',
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
  },
  numero: {
    fontSize: '4rem',
    fontWeight: 900,
    color: '#fbbf24',
    marginBottom: '0.5rem',
    lineHeight: 1,
    textShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  sufijo: {
    fontSize: '2.5rem',
    opacity: 0.8,
  },
  tituloStat: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#e2e8f0',
    marginBottom: '1.5rem',
  },
  testimonioSutil: {
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '12px',
    padding: '1rem',
    marginTop: '1rem',
    borderLeft: '3px solid #fbbf24',
    position: 'relative' as const,
  },
  comillasMini: {
    position: 'absolute' as const,
    top: '-0.5rem',
    left: '0.5rem',
    fontSize: '2rem',
    color: '#fbbf24',
    fontWeight: 900,
  },
  textoTestimonio: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    fontStyle: 'italic',
    lineHeight: 1.4,
    margin: 0,
    paddingLeft: '1rem',
  },
  badgeDestacado: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    padding: '0.4rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.7rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  logrosComprobados: {
    marginBottom: '4rem',
  },
  tituloLogros: {
    textAlign: 'center' as const,
    fontSize: '2.2rem',
    fontWeight: 800,
    color: '#fbbf24',
    marginBottom: '3rem',
  },
  gridLogros: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2rem',
  },
  logroCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '2rem 1.5rem',
    textAlign: 'center' as const,
    transition: 'all 0.3s ease',
  },
  valorLogro: {
    fontSize: '2.5rem',
    fontWeight: 900,
    color: '#fbbf24',
    marginBottom: '0.5rem',
  },
  tituloLogro: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#e2e8f0',
    marginBottom: '0.8rem',
  },
  descripcionLogro: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    lineHeight: 1.4,
  },
  mensajeVendedor: {
    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.1))',
    border: '2px solid rgba(251, 191, 36, 0.3)',
    borderRadius: '20px',
    padding: '3rem 2rem',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden',
  },
  contenidoVendedor: {
    position: 'relative' as const,
    zIndex: 2,
  },
  fraseImpacto: {
    fontSize: '1.3rem',
    fontWeight: 600,
    color: '#fbbf24',
    fontStyle: 'italic',
    background: 'rgba(0, 0, 0, 0.3)',
    padding: '1.5rem',
    borderRadius: '12px',
    borderLeft: '4px solid #fbbf24',
  },
};

export default SeccionStats; 