import React from 'react';
import './Footer.css';

const Footer: React.FC = () => {
  const anioActual = new Date().getFullYear();

  return (
    <footer className="avo-footer">
      <div className="avo-footer-content">
        {/* Sección Superior: Logo y Frase */}
        <div className="avo-footer-branding">
          <div className="avo-footer-logo">
            <img src="/logo academia vallenata.webp" alt="Academia Vallenata Online Logo" width="300" height="194" loading="lazy" decoding="async" />
          </div>
          <p className="avo-footer-phrase">
            "Aprende desde cualquier lugar, conecta con la música de tus raíces 🇨🇴"
          </p>
        </div>

        {/* Sección Central: Enlaces Rápidos y Redes */}
        <div className="avo-footer-links-grid">
          <div className="avo-footer-column">
            <h4>Legales</h4>
            <ul>
              <li><a href="/privacidad">Política de Privacidad</a></li>
              <li><a href="/terminos">Términos de Servicio</a></li>
            </ul>
          </div>
          
          <div className="avo-footer-column">
            <h4>Nuestra Academia</h4>
            <ul>
              <li><a href="/nuestra-academia">Sobre Nosotros</a></li>
              <li><a href="/contacto">Contacto</a></li>
              <li><a href="/cursos">Cursos</a></li>
            </ul>
          </div>

          <div className="avo-footer-column">
            <h4>Síguenos</h4>
            <div className="avo-footer-socials">
              <a href="https://www.instagram.com/academiavallenataonline/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <rect width="18" height="18" x="3" y="3" rx="5" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17" cy="7" r="1.5" fill="currentColor" />
                </svg>
              </a>
              <a href="https://wa.me/573212587616" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.531 3.488" />
                </svg>
              </a>
              <a href="https://www.youtube.com/@AcademiaVallenataONLINE" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Sección Inferior: Copyright */}
      <div className="avo-footer-bottom">
        <div className="avo-footer-bottom-content">
          <p>© {anioActual} Academia Vallenata Online. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
