import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';

const SeccionOpciones: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisible(true);
        }
      });
    });

    const section = document.querySelector('.seccion-opciones');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const opciones = [
    {
      titulo: t('seccionOpciones.opciones.cursos.titulo'),
      descripcion: t('seccionOpciones.opciones.cursos.descripcion'),
      imagen: '/imagenes/Inicio/Clusters (Por donde empezart)/Cursos-De-Acordeon.jpg',
      icono: '📚',
      color: 'from-blue-500 to-purple-600',
      beneficios: t('seccionOpciones.opciones.cursos.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.cursos.precio'),
      destacado: false,
      action: () => window.location.href = '/cursos'
    },
    {
      titulo: t('seccionOpciones.opciones.simulador.titulo'),
      descripcion: t('seccionOpciones.opciones.simulador.descripcion'),
      imagen: '/imagenes/Inicio/Acordeon PRO MAX.png',
      icono: '🎮',
      color: 'from-purple-600 to-pink-600',
      beneficios: t('seccionOpciones.opciones.simulador.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.simulador.precio'),
      destacado: true,
      etiqueta: t('seccionOpciones.opciones.simulador.etiqueta'),
      action: () => window.location.href = '/simulador-gaming'
    },
    {
      titulo: t('seccionOpciones.opciones.tutoriales.titulo'),
      descripcion: t('seccionOpciones.opciones.tutoriales.descripcion'),
      imagen: '/imagenes/Inicio/Clusters (Por donde empezart)/Tutoriales-De-Acordeon.jpg',
      icono: '🎥',
      color: 'from-green-500 to-teal-600',
      beneficios: t('seccionOpciones.opciones.tutoriales.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.tutoriales.precio'),
      destacado: false,
      action: () => window.location.href = '/tutoriales'
    },
    {
      titulo: t('seccionOpciones.opciones.comunidad.titulo'),
      descripcion: t('seccionOpciones.opciones.comunidad.descripcion'),
      imagen: '/imagenes/Inicio/Home/comunidad imagen.webp',
      icono: '👥',
      color: 'from-orange-500 to-red-600',
      beneficios: t('seccionOpciones.opciones.comunidad.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.comunidad.precio'),
      destacado: true,
      etiqueta: t('seccionOpciones.opciones.comunidad.etiqueta'),
      action: () => window.location.href = '/comunidad'
    },
    {
      titulo: t('seccionOpciones.opciones.paquetes.titulo'),
      descripcion: t('seccionOpciones.opciones.paquetes.descripcion'),
      imagen: '/imagenes/Inicio/Clusters (Por donde empezart)/Paquetes-de-tutoriales.jpg',
      icono: '📦',
      color: 'from-indigo-500 to-purple-600',
      beneficios: t('seccionOpciones.opciones.paquetes.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.paquetes.precio'),
      destacado: false,
      action: () => window.location.href = '/paquetes'
    },
    {
      titulo: t('seccionOpciones.opciones.clases.titulo'),
      descripcion: t('seccionOpciones.opciones.clases.descripcion'),
      imagen: '/imagenes/Inicio/Clusters (Por donde empezart)/Clases-Personalizadas!.jpg',
      icono: '👨‍🏫',
      color: 'from-yellow-500 to-orange-600',
      beneficios: t('seccionOpciones.opciones.clases.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.clases.precio'),
      destacado: false,
      action: () => window.location.href = '/contacto'
    }
  ];

  const getGradientStyle = (color: string) => {
    const gradients: { [key: string]: string } = {
      'from-blue-500 to-purple-600': 'linear-gradient(135deg, #3b82f6, #9333ea)',
      'from-purple-600 to-pink-600': 'linear-gradient(135deg, #9333ea, #dc2626)',
      'from-green-500 to-teal-600': 'linear-gradient(135deg, #10b981, #0d9488)',
      'from-orange-500 to-red-600': 'linear-gradient(135deg, #f97316, #dc2626)',
      'from-indigo-500 to-purple-600': 'linear-gradient(135deg, #6366f1, #9333ea)',
      'from-yellow-500 to-orange-600': 'linear-gradient(135deg, #eab308, #ea580c)',
    };
    return gradients[color] || gradients['from-blue-500 to-purple-600'];
  };

  return (
    <>
      <section className="seccion-opciones" id="opciones" style={styles.seccionOpciones}>
        <div style={styles.contenedor}>
          {visible && (
            <div style={{ ...styles.headerSeccion, animation: 'flyIn 1s ease-out' }}>
              <div style={styles.badgeSeccion}>{t('seccionOpciones.badge')}</div>
              <h2 style={styles.tituloSeccion}>
                <Trans
                  i18nKey="seccionOpciones.titulo"
                  components={{
                    1: <span style={styles.textoDestacado} />,
                    2: <span style={styles.textoPrincipal} />
                  }}
                />
              </h2>
              <p style={styles.descripcionSeccion}>
                <Trans
                  i18nKey="seccionOpciones.descripcion"
                  components={{
                    1: <strong />,
                    2: <><br />🚀 </>,
                    3: <span style={styles.textoUrgencia} />
                  }}
                />
              </p>
            </div>
          )}

          <div className="grid-opciones" style={styles.gridOpciones}>
            {opciones.map((opcion, index) => (
              visible && (
                <div
                  key={index}
                  style={{
                    ...styles.tarjetaOpcion,
                    ...(opcion.destacado ? styles.destacada : {}),
                    animation: `scaleIn 0.8s ease-out ${0.2 + (index * 0.1)}s both`
                  }}
                  onClick={opcion.action}
                  onKeyDown={(e) => e.key === 'Enter' && opcion.action()}
                  role="button"
                  tabIndex={0}
                >
                  {opcion.destacado && (
                    <div style={styles.etiquetaDestacado}>
                      {opcion.etiqueta}
                    </div>
                  )}

                  <div style={styles.imagenContenedor}>
                    <img src={opcion.imagen} alt={opcion.titulo} style={styles.imagenOpcion} />
                    <div style={styles.overlayImagen}></div>
                    <div style={styles.iconoOpcion}>{opcion.icono}</div>
                    {opcion.destacado && (
                      <div style={styles.brilloDestacado}></div>
                    )}
                  </div>

                  <div style={styles.contenidoTarjeta}>
                    <div style={styles.headerTarjeta}>
                      <h3 style={styles.tituloOpcion}>{opcion.titulo}</h3>
                      <p style={styles.descripcionOpcion}>{opcion.descripcion}</p>
                    </div>

                    <div style={styles.beneficiosLista}>
                      {opcion.beneficios.map((beneficio, idx) => (
                        <div key={idx} style={styles.beneficioItem}>
                          <span style={styles.checkIcon}>✓</span>
                          {beneficio}
                        </div>
                      ))}
                    </div>

                    <div style={styles.footerTarjeta}>
                      <div style={{
                        ...styles.precioOpcion,
                        ...(opcion.destacado ? styles.precioDestacado : {})
                      }}>
                        {opcion.precio}
                      </div>
                      <button
                        style={{
                          ...styles.botonExplorar,
                          background: getGradientStyle(opcion.color),
                          ...(opcion.destacado ? styles.botonDestacado : {})
                        }}
                      >
                        {opcion.destacado ? t('seccionOpciones.boton.acceder') : t('seccionOpciones.boton.explorar')}
                        <span style={styles.flechaIcon}>→</span>
                      </button>
                    </div>
                  </div>

                  <div style={styles.efectoHover}></div>
                </div>
              )
            ))}
          </div>

          {visible && (
            <div style={{ ...styles.ctaAdicional, animation: 'flyIn 1s ease-out 1s both' }}>
              <div style={styles.ctaContenido}>
                <div style={styles.ctaIcono}>🎯</div>
                <h3 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 800 }}>{t('seccionOpciones.asesoria.titulo')}</h3>
                <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '2rem', maxWidth: '600px', margin: '0 auto 2rem auto' }}>
                  <Trans
                    i18nKey="seccionOpciones.asesoria.descripcion"
                    components={{ 1: <strong style={{ color: '#fbbf24' }} /> }}
                  />
                </p>
                <button style={styles.botonAsesoria} onClick={() => window.location.href = '/contacto'}>
                  {t('seccionOpciones.asesoria.boton')}
                </button>
                <div style={styles.garantiaTexto}>
                  <Trans
                    i18nKey="seccionOpciones.asesoria.garantia"
                    components={{
                      1: <strong style={{ color: '#e2e8f0' }} />,
                      3: <strong style={{ color: '#e2e8f0' }} />,
                      5: <strong style={{ color: '#e2e8f0' }} />
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <style>{`
        @keyframes flyIn {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
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

        @keyframes brilloDestacado {
          0%, 100% { box-shadow: 0 15px 40px rgba(251, 191, 36, 0.2); }
          50% { box-shadow: 0 20px 50px rgba(251, 191, 36, 0.4); }
        }

        @keyframes brillo {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes pulseButton {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .tarjeta-opcion:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
        }

        .tarjeta-opcion:hover .imagen-opcion {
          transform: scale(1.05);
        }

        .boton-explorar:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }

        .boton-explorar:hover .flecha-icon {
          transform: translateX(3px);
        }

        .boton-asesoria:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(251, 191, 36, 0.5);
        }

        /* === RESPONSIVE === */
        @media (max-width: 1100px) {
          .grid-opciones {
             grid-template-columns: repeat(2, 1fr) !important;
             gap: 1.5rem !important;
          }
        }

        @media (max-width: 768px) {
          .seccion-opciones {
            padding: 4rem 0 !important;
          }
          
          .grid-opciones {
             grid-template-columns: 1fr !important;
             gap: 2rem !important;
          }

          .titulo-seccion {
            font-size: 2.2rem !important;
          }
          
          .tarjeta-opcion {
            max-width: 400px;
            margin: 0 auto;
          }
        }
      `}</style>
    </>
  );
};

const styles = {
  seccionOpciones: {
    padding: '5rem 0',
    background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f1f5f9 100%)',
    position: 'relative' as const,
    overflow: 'hidden',
    scrollMarginTop: '100px',
  },
  contenedor: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '0 1rem',
    position: 'relative' as const,
    zIndex: 10,
  },
  headerSeccion: {
    textAlign: 'center' as const,
    marginBottom: '4rem',
  },
  badgeSeccion: {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    padding: '0.75rem 2rem',
    borderRadius: '50px',
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)',
    animation: 'pulseGlow 3s ease-in-out infinite',
  },
  tituloSeccion: {
    fontSize: 'clamp(2rem, 5vw, 3.5rem)',
    fontWeight: 900,
    color: '#1e293b',
    lineHeight: 1.2,
    marginBottom: '1.5rem',
  },
  textoDestacado: {
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    backgroundClip: 'text',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  textoPrincipal: {
    color: '#3b82f6',
  },
  descripcionSeccion: {
    fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
    color: '#64748b',
    lineHeight: 1.6,
    maxWidth: '800px',
    margin: '0 auto',
  },
  textoUrgencia: {
    color: '#dc2626',
    fontWeight: 700,
  },
  gridOpciones: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '2.5rem',
    marginBottom: '4rem',
  },
  tarjetaOpcion: {
    background: 'white',
    borderRadius: '20px',
    overflow: 'hidden',
    position: 'relative' as const,
    transition: 'all 0.4s ease',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    border: '2px solid transparent',
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
  },
  destacada: {
    border: '2px solid #fbbf24',
    boxShadow: '0 15px 40px rgba(251, 191, 36, 0.2)',
    position: 'relative' as const,
    animation: 'brilloDestacado 3s ease-in-out infinite',
  },
  etiquetaDestacado: {
    position: 'absolute' as const,
    top: '1rem',
    right: '1rem',
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 700,
    zIndex: 20,
    boxShadow: '0 4px 15px rgba(220, 38, 38, 0.3)',
  },
  imagenContenedor: {
    position: 'relative' as const,
    height: '200px',
    overflow: 'hidden',
  },
  imagenOpcion: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transition: 'transform 0.4s ease',
  },
  overlayImagen: {
    position: 'absolute' as const,
    inset: '0',
    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%)',
  },
  iconoOpcion: {
    position: 'absolute' as const,
    top: '1rem',
    left: '1rem',
    background: 'rgba(255, 255, 255, 0.9)',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
  },
  brilloDestacado: {
    position: 'absolute' as const,
    inset: '0',
    background: 'linear-gradient(45deg, transparent, rgba(251, 191, 36, 0.3), transparent)',
    animation: 'brillo 2s ease-in-out infinite',
  },
  contenidoTarjeta: {
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    flex: 1,
  },
  headerTarjeta: {
    marginBottom: '1.5rem',
    textAlign: 'center' as const,
  },
  tituloOpcion: {
    fontSize: '1.3rem',
    fontWeight: 700,
    color: '#1e293b',
    marginBottom: '0.5rem',
  },
  descripcionOpcion: {
    color: '#64748b',
    fontSize: '0.95rem',
    lineHeight: 1.5,
    textAlign: 'center' as const,
  },
  beneficiosLista: {
    marginBottom: '2rem',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  beneficioItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    fontSize: '0.9rem',
    color: '#374151',
  },
  checkIcon: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  footerTarjeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1.25rem',
    marginTop: 'auto',
  },
  precioOpcion: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#dc2626',
    textAlign: 'center' as const,
  },
  precioDestacado: {
    fontSize: '1.3rem',
    color: '#fbbf24',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
  },
  botonExplorar: {
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '25px',
    color: 'white',
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    whiteSpace: 'nowrap' as const,
  },
  botonDestacado: {
    padding: '1rem 2rem',
    fontSize: '1rem',
    fontWeight: 700,
    animation: 'pulseButton 2s ease-in-out infinite',
  },
  flechaIcon: {
    transition: 'transform 0.3s ease',
  },
  efectoHover: {},
  ctaAdicional: {
    background: 'linear-gradient(135deg, #1e293b, #334155)',
    borderRadius: '30px',
    padding: '3rem 2rem',
    textAlign: 'center' as const,
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
    position: 'relative' as const,
    overflow: 'hidden',
  },
  ctaContenido: {
    position: 'relative' as const,
    zIndex: 10,
  },
  ctaIcono: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  botonAsesoria: {
    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    color: '#1f2937',
    padding: '1.2rem 2.5rem',
    border: 'none',
    borderRadius: '25px',
    fontWeight: 700,
    fontSize: '1.1rem',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '1.5rem',
    boxShadow: '0 8px 25px rgba(251, 191, 36, 0.3)',
  },
  garantiaTexto: {
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
};

export default SeccionOpciones; 