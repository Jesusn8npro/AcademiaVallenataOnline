import React, { useState, useEffect } from 'react';
import FotoMaestro from '../../../assets/images/Foto maestro oficial JESUS GONZALEZ.jpg';
import './SeccionInstructor.css';
import { instructorStyles as styles } from './SeccionInstructor.styles';

const SeccionInstructor: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) setVisible(true);
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
    <section className="seccion-instructor" id="instructor" style={styles.seccionInstructor}>
      <div style={styles.fondoAtmosferico}>
        <div style={styles.patronMusical}></div>
        <div style={styles.gradienteOverlay}></div>
      </div>

      <div style={styles.contenedor}>
        {visible && (
          <div style={{ ...styles.headerEmocional, animation: 'flyIn 1.2s ease-out' }}>
            <div style={styles.badgeQuestion}>🎵 TU MENTOR MUSICAL</div>
            <h2 style={styles.tituloEmocional}>
              <span style={styles.preguntaClave}>¿Quién Estará A Tu Lado</span>
              <span style={styles.respuestaDorada}>En Cada Nota?</span>
            </h2>
          </div>
        )}

        <div className="contenido-split" style={styles.contenidoSplit}>
          {visible && (
            <div className="lado-izquierdo" style={{ ...styles.ladoIzquierdo, animation: 'scaleIn 1s ease-out 0.3s both' }}>
              <div className="collage-maestro" style={styles.collageMaestro}>
                <div className="foto-principal" style={styles.fotoPrincipal}>
                  <img
                    src={FotoMaestro}
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
  );
};

export default SeccionInstructor;
