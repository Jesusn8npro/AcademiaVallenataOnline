import React, { useState } from 'react';
import './contacto.css';

const Contacto: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    ciudad: '',
    nivel: '',
    objetivo: '',
    mensaje: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number>(-1);

  const metodos = [
    { t: 'WhatsApp', d: '¡Respuesta inmediata!', i: '📱', l: 'https://wa.me/573212587616', c: '#25D366' },
    { t: 'Email', d: 'Te respondemos en minutos', i: '📧', l: 'mailto:info@academiavallenataonline.com', c: '#ff6600' },
    { t: 'Llamada', d: 'Habla con un asesor', i: '📞', l: 'tel:+573212587616', c: '#1a73e8' },
    { t: 'Video Llamada', d: 'Solicita demo en vivo', i: '📹', l: '#', c: '#8b5cf6' }
  ];

  const faqs = [
    { p: '¿Cuánto tiempo toma aprender acordeón?', r: 'En 3 meses tocas tus primeras canciones. En 6 meses, nivel intermedio.' },
    { p: '¿Necesito tener un acordeón físico?', r: 'No al inicio. Puedes usar nuestro simulador y luego te guiamos para comprar.' },
    { p: '¿Las clases son en vivo?', r: 'Hay contenido grabado 24/7, clases en vivo semanales y sesiones personalizadas.' },
    { p: '¿Qué incluye la suscripción?', r: 'Simulador, todos los cursos, clases en vivo, comunidad y soporte.' }
  ];

  const toggleFaq = (i: number) => {
    setActiveFaq(activeFaq === i ? -1 : i);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const enviarFormulario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setFormData({ nombre: '', email: '', telefono: '', ciudad: '', nivel: '', objetivo: '', mensaje: '' });
      }, 2000);
    }, 1500);
  };

  return (
    <>
      {/* HERO VENDEDOR Y MÉTODOS DE CONTACTO */}
      <section className="contacto-hero">
        <h1>¡Da el primer paso para tocar acordeón como siempre soñaste!</h1>
        <p className="sub">
          Resuelve tus dudas, recibe asesoría personalizada y accede a la mejor comunidad de acordeoneros. <b>¡Contáctanos ahora y transforma tu vida musical!</b>
        </p>
        <div className="metodos-hero-grid">
          {metodos.map((m, index) => (
            <a
              key={index}
              href={m.l}
              className="m-btn-grid"
              style={{ '--c': m.c } as React.CSSProperties}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="m-ico">{m.i}</span>
              <span className="m-info">
                <b>{m.t}</b>
                <small>{m.d}</small>
              </span>
            </a>
          ))}
        </div>
      </section>

      {/* FORMULARIO */}
      <section className="contacto-formulario">
        <form className="contacto-form" onSubmit={enviarFormulario}>
          <div className="form-row">
            <input
              name="nombre"
              placeholder="Nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
            <input
              name="telefono"
              placeholder="Teléfono / WhatsApp"
              value={formData.telefono}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <input
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              name="ciudad"
              placeholder="Ciudad"
              value={formData.ciudad}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-row">
            <select
              name="nivel"
              value={formData.nivel}
              onChange={handleInputChange}
              required
            >
              <option value="">Nivel actual</option>
              <option>Principiante</option>
              <option>Básico</option>
              <option>Intermedio</option>
              <option>Avanzado</option>
            </select>
            <select
              name="objetivo"
              value={formData.objetivo}
              onChange={handleInputChange}
              required
            >
              <option value="">¿Qué quieres lograr?</option>
              <option>Hobby</option>
              <option>Profesional</option>
              <option>Canciones específicas</option>
              <option>Mejorar técnica</option>
            </select>
          </div>
          <textarea
            name="mensaje"
            placeholder="Cuéntanos tus metas o dudas"
            value={formData.mensaje}
            onChange={handleInputChange}
          ></textarea>
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <><span className="spin"></span>Enviando...</>
            ) : showSuccess ? (
              '✓ ¡Enviado!'
            ) : (
              'Recibir Plan Personalizado'
            )}
          </button>
          <div className="beneficios">
            <span>✓ Evaluación gratuita</span>
            <span>✓ Plan personalizado</span>
            <span>✓ Acceso simulador 7 días</span>
            <span>✓ Sesión de prueba</span>
            <span className="garantia">🛡️ Garantía 100% satisfacción</span>
          </div>
        </form>
      </section>

      {/* PREGUNTAS FRECUENTES */}
      <section className="faq-section">
        <h2>Preguntas Frecuentes</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div key={i} className={`faq-card ${activeFaq === i ? 'open' : ''}`}>
              <button type="button" className="faq-q" onClick={() => toggleFaq(i)}>
                <span className="faq-icon">❓</span>
                <span className="faq-text">{f.p}</span>
                <span className={`faq-arrow ${activeFaq === i ? 'rot' : ''}`}>▶</span>
              </button>
              <div className="faq-a" style={{ maxHeight: activeFaq === i ? '200px' : '0' }}>
                <p>{f.r}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default Contacto;
