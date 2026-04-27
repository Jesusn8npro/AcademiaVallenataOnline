import React, { useState, useEffect } from 'react';
import './SeccionStats.css';
import { statsStyles as styles } from './SeccionStats.styles';

const SeccionStats: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [contadorIniciado, setContadorIniciado] = useState(false);
  const [estudiantesCount, setEstudiantesCount] = useState(0);
  const [reseniasCount, setReseniasCount] = useState(0);
  const [experienciaCount, setExperienciaCount] = useState(0);

  const animarNumero = (objetivo: number, duracion: number, callback: (valor: number) => void) => {
    const inicio = performance.now();
    const actualizar = (tiempoActual: number) => {
      const progreso = Math.min((tiempoActual - inicio) / duracion, 1);
      const easeOut = 1 - Math.pow(1 - progreso, 4);
      callback(Math.floor(objetivo * easeOut));
      if (progreso < 1) requestAnimationFrame(actualizar);
      else callback(objetivo);
    };
    requestAnimationFrame(actualizar);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !contadorIniciado) {
          setVisible(true);
          setContadorIniciado(true);
          setTimeout(() => {
            animarNumero(1247, 2000, setEstudiantesCount);
            animarNumero(312, 1800, setReseniasCount);
            animarNumero(10, 1200, setExperienciaCount);
          }, 500);
        }
      });
    });

    const section = document.querySelector('.seccion-stats');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, [contadorIniciado]);

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
    <section className="seccion-stats" style={styles.seccionStats}>
      <div style={styles.contenedor}>

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
  );
};

export default SeccionStats;
