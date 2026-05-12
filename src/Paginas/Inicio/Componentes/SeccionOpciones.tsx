import React, { useState, useEffect } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import './SeccionOpciones.css';
import { opcionesStyles as styles } from './SeccionOpciones.styles';

// Import explícito de las imágenes desde src/assets — Vite las bundlea con hash en el build.
// Antes el componente usaba strings tipo "/images/Clusters .../Cursos-De-Acordeon.jpg" que
// apuntan a /public/, pero las imágenes nunca estuvieron en public/ → los <img> daban 404
// y se veía el placeholder gris de la card. Las imágenes viven en src/assets/images/.
import imgCursos from '../../../assets/images/Clusters (Por donde empezart)/Cursos-De-Acordeon.webp';
import imgTutoriales from '../../../assets/images/Clusters (Por donde empezart)/Tutoriales-De-Acordeon.webp';
import imgPaquetes from '../../../assets/images/Clusters (Por donde empezart)/Paquetes-de-tutoriales.webp';
import imgClases from '../../../assets/images/Clusters (Por donde empezart)/Clases-Personalizadas!.webp';

const GRADIENTS: Record<string, string> = {
  'from-blue-500 to-purple-600': 'linear-gradient(135deg, #3b82f6, #9333ea)',
  'from-purple-600 to-pink-600': 'linear-gradient(135deg, #9333ea, #dc2626)',
  'from-green-500 to-teal-600': 'linear-gradient(135deg, #10b981, #0d9488)',
  'from-orange-500 to-red-600': 'linear-gradient(135deg, #f97316, #dc2626)',
  'from-indigo-500 to-purple-600': 'linear-gradient(135deg, #6366f1, #9333ea)',
  'from-yellow-500 to-orange-600': 'linear-gradient(135deg, #eab308, #ea580c)',
};

const getGradientStyle = (color: string) =>
  GRADIENTS[color] || GRADIENTS['from-blue-500 to-purple-600'];

const SeccionOpciones: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setVisible(true);
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
      imagen: imgCursos,
      icono: '📚',
      color: 'from-blue-500 to-purple-600',
      beneficios: t('seccionOpciones.opciones.cursos.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.cursos.precio'),
      destacado: false,
      action: () => window.location.href = '/cursos'
    },
    {
      titulo: t('seccionOpciones.opciones.tutoriales.titulo'),
      descripcion: t('seccionOpciones.opciones.tutoriales.descripcion'),
      imagen: imgTutoriales,
      icono: '🎥',
      color: 'from-green-500 to-teal-600',
      beneficios: t('seccionOpciones.opciones.tutoriales.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.tutoriales.precio'),
      destacado: false,
      action: () => window.location.href = '/tutoriales'
    },
    {
      titulo: t('seccionOpciones.opciones.paquetes.titulo'),
      descripcion: t('seccionOpciones.opciones.paquetes.descripcion'),
      imagen: imgPaquetes,
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
      imagen: imgClases,
      icono: '👨‍🏫',
      color: 'from-yellow-500 to-orange-600',
      beneficios: t('seccionOpciones.opciones.clases.beneficios', { returnObjects: true }) as string[],
      precio: t('seccionOpciones.opciones.clases.precio'),
      destacado: false,
      action: () => window.location.href = '/contacto'
    }
  ];

  return (
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
                  2: <span><br />🚀 </span>,
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
                    {(opcion as any).etiqueta}
                  </div>
                )}

                <div style={styles.imagenContenedor}>
                  <img src={opcion.imagen} alt={opcion.titulo} style={styles.imagenOpcion} width="320" height="320" loading="lazy" decoding="async" />
                  <div style={styles.overlayImagen}></div>
                  <div style={styles.iconoOpcion}>{opcion.icono}</div>
                  {opcion.destacado && <div style={styles.brilloDestacado}></div>}
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
  );
};

export default SeccionOpciones;
