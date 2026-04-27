import React, { useState, useEffect } from 'react';
import './SeccionCTAFinal.css';
import { ctaFinalStyles as styles } from './SeccionCTAFinal.styles';

const SeccionCTAFinal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [mensajeSimulador, setMensajeSimulador] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setVisible(true);
      });
    });

    const section = document.querySelector('.seccion-cta-final');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, []);

  const irAlCursoEstrella = () => {
    window.location.href = '/curso-acordeon-desde-cero';
  };

  const mostrarMensajeSimulador = () => {
    setMensajeSimulador('¡Simulador gaming próximo a lanzar! Será la experiencia más innovadora para aprender acordeón.');
  };

  const beneficiosFinales = [
    'Primera canción en 7 días garantizado',
    'Simulador gaming (lanzamiento próximos días)',
    'Comunidad de 5,000+ estudiantes',
    'Método del Maestro Jesús González',
    'Garantía de satisfacción 30 días'
  ];

  return (
    <section className="seccion-cta-final" style={styles.seccionCtaFinal}>
      <div style={styles.contenedor}>

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

        {visible && (
          <div style={{ ...styles.accionPrincipal, animation: 'scaleIn 1s ease-out 0.6s both' }}>
            <button style={styles.botonMegaCta} onClick={irAlCursoEstrella}>
              <span style={styles.iconoBoton}>🚀</span>
              <div style={styles.textoBoton}>
                <span style={styles.textoPrincipal}>¡EMPEZAR AHORA!</span>
                <span style={styles.textoSecundario}>Curso desde cero</span>
              </div>
            </button>

            <button style={styles.botonSimulador} onClick={mostrarMensajeSimulador}>
              🎮 Simulador (Próximamente)
            </button>
            {mensajeSimulador && (
              <p style={{ color: '#fbbf24', marginTop: '0.75rem', fontSize: '0.95rem' }}>
                {mensajeSimulador}
              </p>
            )}
          </div>
        )}

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
  );
};

export default SeccionCTAFinal;
