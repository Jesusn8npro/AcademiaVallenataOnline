import { Link } from '@/compat/router';
import './privacidad.css'

export default function Privacidad() {
  const fechaActualizacion = '2 de enero de 2025'
  return (
    <>
      <title>Políticas de Privacidad - Academia Vallenata Online</title>
      <meta name="description" content="Políticas de privacidad y protección de datos de Academia Vallenata Online. Conoce cómo protegemos tu información personal." />
      <meta name="robots" content="index, follow" />

      <div className="politicas-container">
        <div className="politicas-content">
          <header className="politicas-header">
            <div className="breadcrumb">
              <Link href="/" className="breadcrumb-link">Inicio</Link>
              <span className="breadcrumb-separator">›</span>
              <span className="breadcrumb-current">Políticas de Privacidad</span>
            </div>
            <h1 className="politicas-titulo">Políticas de Privacidad</h1>
            <p className="politicas-fecha">Última actualización: {fechaActualizacion}</p>
          </header>

          <main className="politicas-main">
            <section className="politica-seccion">
              <h2>1. Introducción</h2>
              <p>
                En <strong>Academia Vallenata Online</strong> (en adelante "la Academia", "nosotros" o "nuestro"),
                nos comprometemos a proteger la privacidad y seguridad de los datos personales de nuestros usuarios.
                Esta Política de Privacidad describe cómo recopilamos, utilizamos, almacenamos y protegemos su
                información cuando utiliza nuestros servicios educativos de música vallenata y acordeón.
              </p>
              <p>
                Al utilizar nuestro sitio web <strong>academiavallenataonline.com</strong> y nuestros servicios,
                usted acepta las prácticas descritas en esta política.
              </p>
            </section>

            <section className="politica-seccion">
              <h2>2. Información que Recopilamos</h2>
              <h3>2.1 Información Personal Directa</h3>
              <ul>
                <li><strong>Datos de registro:</strong> Nombre completo, dirección de correo electrónico, número de WhatsApp</li>
                <li><strong>Información de perfil:</strong> Foto de perfil, nivel musical, preferencias de aprendizaje</li>
                <li><strong>Datos de contacto:</strong> País, ciudad, zona horaria para personalizar su experiencia</li>
                <li><strong>Información de pago:</strong> Datos de facturación para procesar suscripciones y compras</li>
              </ul>
              <h3>2.2 Información de Uso y Actividad</h3>
              <ul>
                <li><strong>Progreso académico:</strong> Lecciones completadas, tiempo de estudio, calificaciones</li>
                <li><strong>Actividad en la plataforma:</strong> Navegación, cursos visitados, interacciones sociales</li>
                <li><strong>Contenido generado:</strong> Comentarios, publicaciones en la comunidad, grabaciones de práctica</li>
                <li><strong>Datos técnicos:</strong> Dirección IP, tipo de dispositivo, navegador, sistema operativo</li>
              </ul>
              <h3>2.3 Cookies y Tecnologías Similares</h3>
              <p>
                Utilizamos cookies esenciales para el funcionamiento del sitio, cookies de análisis para mejorar
                nuestros servicios, y cookies de personalización para adaptar su experiencia de aprendizaje.
              </p>
            </section>

            <section className="politica-seccion">
              <h2>3. Cómo Utilizamos su Información</h2>
              <h3>3.1 Servicios Educativos</h3>
              <ul>
                <li>Proporcionar acceso a cursos de acordeón y música vallenata</li>
                <li>Personalizar el contenido según su nivel y progreso</li>
                <li>Realizar seguimiento de su avance académico</li>
                <li>Facilitar la interacción con instructores y otros estudiantes</li>
              </ul>
              <h3>3.2 Comunicación y Soporte</h3>
              <ul>
                <li>Enviar notificaciones sobre clases, eventos y actualizaciones</li>
                <li>Proporcionar soporte técnico y académico</li>
                <li>Responder a sus consultas y comentarios</li>
                <li>Compartir noticias y promociones relacionadas con la música vallenata</li>
              </ul>
              <h3>3.3 Mejora de Servicios</h3>
              <ul>
                <li>Analizar patrones de uso para mejorar nuestros cursos</li>
                <li>Desarrollar nuevos contenidos educativos</li>
                <li>Optimizar la experiencia del usuario</li>
                <li>Realizar investigación educativa y musical</li>
              </ul>
            </section>

            <section className="politica-seccion">
              <h2>4. Compartir Información</h2>
              <p><strong>No vendemos, alquilamos ni comercializamos su información personal.</strong> Podemos compartir su información únicamente en estas circunstancias:</p>
              <h3>4.1 Proveedores de Servicios</h3>
              <ul>
                <li><strong>Supabase:</strong> Para gestión de bases de datos y autenticación</li>
                <li><strong>Procesadores de pago:</strong> Para procesar transacciones de forma segura</li>
                <li><strong>Servicios de email:</strong> Para comunicaciones automatizadas</li>
                <li><strong>Analítica web:</strong> Google Analytics para métricas de uso</li>
              </ul>
              <h3>4.2 Comunidad Educativa</h3>
              <ul>
                <li>Información de perfil público (nombre, foto) en foros y rankings</li>
                <li>Progreso académico con instructores para seguimiento personalizado</li>
                <li>Comentarios y publicaciones en espacios comunitarios</li>
              </ul>
              <h3>4.3 Requerimientos Legales</h3>
              <p>
                Podemos divulgar información cuando sea requerido por ley, para proteger nuestros derechos
                o la seguridad de usuarios, o para cumplir con procesos legales válidos.
              </p>
            </section>

            <section className="politica-seccion">
              <h2>5. Seguridad de Datos</h2>
              <p>Implementamos múltiples capas de seguridad para proteger su información:</p>
              <ul>
                <li><strong>Encriptación:</strong> Todos los datos se transmiten mediante HTTPS/SSL</li>
                <li><strong>Autenticación segura:</strong> Sistemas de login robustos con verificación en dos pasos</li>
                <li><strong>Almacenamiento seguro:</strong> Bases de datos protegidas con acceso restringido</li>
                <li><strong>Monitoreo continuo:</strong> Sistemas de detección de amenazas 24/7</li>
                <li><strong>Respaldos regulares:</strong> Copias de seguridad automáticas y cifradas</li>
              </ul>
            </section>

            <section className="politica-seccion">
              <h2>6. Transferencias Internacionales</h2>
              <p>
                Sus datos pueden ser procesados en servidores ubicados en diferentes países,
                incluyendo Estados Unidos y Europa, donde nuestros proveedores de servicios mantienen
                sus infraestructuras. Garantizamos que todas las transferencias cumplen con
                estándares internacionales de protección de datos.
              </p>
            </section>

            <section className="politica-seccion">
              <h2>7. Retención de Datos</h2>
              <ul>
                <li><strong>Datos de cuenta:</strong> Se conservan mientras mantenga su cuenta activa</li>
                <li><strong>Progreso académico:</strong> Se mantiene indefinidamente para certificaciones</li>
                <li><strong>Datos de pago:</strong> Se conservan según requerimientos fiscales (5 años)</li>
                <li><strong>Datos técnicos:</strong> Se eliminan automáticamente después de 24 meses</li>
                <li><strong>Comunicaciones:</strong> Se conservan por 3 años para soporte y calidad</li>
              </ul>
            </section>

            <section className="politica-seccion">
              <h2>8. Sus Derechos</h2>
              <p>Usted tiene los siguientes derechos sobre sus datos personales:</p>
              <div className="derechos-grid">
                <div className="derecho-item">
                  <h4>🔍 Acceso</h4>
                  <p>Solicitar una copia de todos los datos que tenemos sobre usted</p>
                </div>
                <div className="derecho-item">
                  <h4>✏️ Rectificación</h4>
                  <p>Corregir información inexacta o incompleta</p>
                </div>
                <div className="derecho-item">
                  <h4>🗑️ Eliminación</h4>
                  <p>Solicitar la eliminación de sus datos personales</p>
                </div>
                <div className="derecho-item">
                  <h4>⏸️ Limitación</h4>
                  <p>Restringir el procesamiento de su información</p>
                </div>
                <div className="derecho-item">
                  <h4>📤 Portabilidad</h4>
                  <p>Obtener sus datos en formato estructurado</p>
                </div>
                <div className="derecho-item">
                  <h4>❌ Oposición</h4>
                  <p>Oponerse al procesamiento de sus datos</p>
                </div>
              </div>
              <p>
                Para ejercer cualquiera de estos derechos, contacte con nosotros en
                <a href="mailto:privacidad@academiavallenataonline.com">privacidad@academiavallenataonline.com</a>
              </p>
            </section>

            <section className="politica-seccion">
              <h2>9. Protección de Menores</h2>
              <p>
                Nuestros servicios están dirigidos a usuarios mayores de 13 años. Para estudiantes
                menores de 18 años, requerimos consentimiento parental verificable. No recopilamos
                conscientemente información personal de niños menores de 13 años sin consentimiento parental.
              </p>
            </section>

            <section className="politica-seccion">
              <h2>10. Actualizaciones de la Política</h2>
              <p>
                Esta política puede actualizarse ocasionalmente para reflejar cambios en nuestros
                servicios o requerimientos legales. Le notificaremos sobre cambios significativos
                por email y destacaremos las modificaciones en nuestro sitio web.
              </p>
            </section>

            <section className="politica-seccion">
              <h2>11. Información de Contacto</h2>
              <div className="contacto-info">
                <h3>Academia Vallenata Online</h3>
                <p><strong>Responsable de Datos:</strong> Jesús González</p>
                <p><strong>Email:</strong> <a href="mailto:privacidad@academiavallenataonline.com">privacidad@academiavallenataonline.com</a></p>
                <p><strong>Sitio web:</strong> <a href="https://academiavallenataonline.com">academiavallenataonline.com</a></p>
                <p><strong>Horario de atención:</strong> Lunes a Viernes, 9:00 AM - 6:00 PM (GMT-5)</p>
              </div>
            </section>
          </main>

          <aside className="enlaces-relacionados">
            <h3>Documentos Relacionados</h3>
            <div className="enlaces-grid">
              <Link href="/terminos" className="enlace-documento">
                <span className="enlace-icono">📋</span>
                <span className="enlace-texto">Términos y Condiciones</span>
              </Link>
              <Link href="/contacto" className="enlace-documento">
                <span className="enlace-icono">📞</span>
                <span className="enlace-texto">Contacto</span>
              </Link>
              <Link href="/" className="enlace-documento">
                <span className="enlace-icono">🏠</span>
                <span className="enlace-texto">Volver al Inicio</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </>
  )
}
