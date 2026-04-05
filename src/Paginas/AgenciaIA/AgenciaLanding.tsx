import React from 'react';
import Spline from '@splinetool/react-spline';
import { Check, ArrowRight, Zap, Trophy, Users } from 'lucide-react';
import './AgenciaLanding.css';

const AgenciaLanding = () => {
  return (
    <div className="agencia-contenedor">
      {/* HEADER / NAV */}
      <header className="agencia-header">
        <div className="logo-agencia">
          <Zap className="logo-icon" fill="currentColor" size={24} />
          V-PRO.AI
        </div>
        <nav className="nav-links">
          <a href="#inicio">Inicio</a>
          <a href="#testimonios">Testimonios</a>
          <a href="#planes">Planes</a>
          <a href="#faq">Ayuda</a>
        </nav>
        <button className="btn-contacto">Contactar Agente</button>
      </header>

      {/* HERO SECTION */}
      <section id="inicio" className="hero-section">
        <div className="hero-col-text">
          <div className="badge-revolucion">Revolucionando el Aprendizaje</div>
          <h1 className="hero-titulo">
            TU MAESTRO <br />
            <span className="text-gradient">AUTÓNOMO y</span> <br />
            DIGITAL.
          </h1>
          <p className="hero-descripcion">
            Desarrollamos el primer Agente de Inteligencia Artificial especializado en Acordeón Vallenato. 
            Aprende 24/7 con un asistente 3D hiperrealista que corrige cada nota que tocas.
          </p>
          <div className="hero-btns">
            <button className="btn-principal">Ver Planes</button>
            <button className="btn-secundario">Probar Demo</button>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <h3>98%</h3>
              <p>Precisión</p>
            </div>
            <div className="stat-item">
              <h3>+500</h3>
              <p>Alumnos Activos</p>
            </div>
          </div>
        </div>

        <div className="hero-col-3d">
          <div className="spline-container">
            <iframe 
              src="https://my.spline.design/genkubgreetingrobot-CHtkGCVxfALQ0vLBsZPjzRJI/" 
              frameBorder="0" 
              width="100%" 
              height="100%"
              style={{ borderRadius: '20px' }}
              title="V-PRO AI Robot"
            ></iframe>
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section id="testimonios" className="seccion-padding">
        <h2 className="titulo-seccion">Lo que dicen los <span className="text-gradient">Acordeonistas</span></h2>
        <div className="testimonios-grid">
          <div className="testimonio-card">
            <p>"El asistente me corrigió el fuelle en solo 5 minutos. Es como tener a un maestro en la sala de mi casa a las 2 de la mañana."</p>
            <div className="testimonio-autor">
              <div className="autor-info">
                <h4>Juan V.</h4>
                <span>Alumno Oro</span>
              </div>
            </div>
          </div>
          <div className="testimonio-card">
            <p>"La tecnología 3D hace que aprender escalas sea un juego. No te aburres nunca y el robot siempre está de buen humor."</p>
            <div className="testimonio-autor">
              <div className="autor-info">
                <h4>Carlos M.</h4>
                <span>Productor Musical</span>
              </div>
            </div>
          </div>
          <div className="testimonio-card">
            <p>"Nunca pensé que una IA supiera tanto de pitos y bajos. La precisión al detectar las notas es simplemente de locos."</p>
            <div className="testimonio-autor">
              <div className="autor-info">
                <h4>Andrés R.</h4>
                <span>Acordeonista Juvenil</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANES DE PRECIO */}
      <section id="planes" className="seccion-padding">
        <h2 className="titulo-seccion">Elige tu <span className="text-gradient">Camino al Éxito</span></h2>
        <div className="pricing-grid">
          <div className="pricing-card">
            <h4>Básico</h4>
            <div className="price">$29<span>/mes</span></div>
            <ul className="pricing-features">
              <li><Check className="check-icon" size={18} /> Asistente 3D Limitado</li>
              <li><Check className="check-icon" size={18} /> 10 Canciones al mes</li>
              <li><Check className="check-icon" size={18} /> Soporte por Chat</li>
            </ul>
            <button className="btn-secundario">Empezar Ahora</button>
          </div>
          <div className="pricing-card popular">
            <h4>V-PRO ELITE</h4>
            <div className="price">$49<span>/mes</span></div>
            <ul className="pricing-features">
              <li><Check className="check-icon" size={18} /> Asistente 3D Ilimitado</li>
              <li><Check className="check-icon" size={18} /> Acceso a Todas las Canciones</li>
              <li><Check className="check-icon" size={18} /> Corrección de Fuelle en Tiempo Real</li>
              <li><Check className="check-icon" size={18} /> Actualizaciones de Software OTA</li>
            </ul>
            <button className="btn-principal">Convertirme en Pro</button>
          </div>
          <div className="pricing-card">
            <h4>Institucional</h4>
            <div className="price">Consultar</div>
            <ul className="pricing-features">
              <li><Check className="check-icon" size={18} /> Licencias para Escuelas</li>
              <li><Check className="check-icon" size={18} /> Panel de Control de Maestro</li>
              <li><Check className="check-icon" size={18} /> Soporte Personalizado 24/7</li>
            </ul>
            <button className="btn-secundario">Hablar con Ventas</button>
          </div>
        </div>
      </section>

      {/* SECCIÓN TIPOGRAFÍA 3D DISTORSIONADA - ANCHO COMPLETO SIN OVERLAY */}
      <section className="seccion-3d-typography-full">
        <div className="typography-container-full">
          <iframe 
            src="https://my.spline.design/distortingtypography-xB8Rlpjq4t6ilfAFNwmqjrBD/" 
            frameBorder="0" 
            width="100%" 
            height="100%"
            title="V-PRO Typography 3D"
          ></iframe>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="seccion-padding footer-cta">
        <h2 className="hero-titulo">¿Listo para ser el próximo <br /><span className="text-gradient">Rey Vallenato?</span></h2>
        <p className="hero-descripcion" style={{ margin: '0 auto 3rem' }}>Únete a la comunidad más avanzada de acordeonistas digitales del mundo.</p>
        <button className="btn-principal" style={{ padding: '1.5rem 4rem' }}>RESERVAR MI V-PRO</button>
      </section>

      {/* FAQ */}
      <section id="faq" className="seccion-padding">
        <h2 className="titulo-seccion">Preguntas <span className="text-gradient">Frecuentes</span></h2>
        <div className="faq-contenedor">
          <div className="faq-item">
            <div className="faq-pregunta">¿Necesito el acordeón físico para usar la IA? <span>+</span></div>
          </div>
          <div className="faq-item">
            <div className="faq-pregunta">¿Funciona en Mac y Windows? <span>+</span></div>
          </div>
          <div className="faq-item">
            <div className="faq-pregunta">¿Cómo se actualiza el robot? <span>+</span></div>
          </div>
        </div>
      </section>

      <footer style={{ padding: '4rem 5%', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', color: '#555' }}>
        <p>© 2026 Academia Vallenata Online V-PRO. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default AgenciaLanding;
