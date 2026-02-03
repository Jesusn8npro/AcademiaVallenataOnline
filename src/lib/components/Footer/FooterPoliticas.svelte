<script>
  import { page } from '$app/stores';
  
  // Lista de rutas donde NO mostrar el footer
  const rutasExcluidas = [
    '/panel-administracion',
    '/panel-estudiante',
    '/administrador',
    '/simulador-gaming',
    '/juego'
  ];
  
  $: mostrarFooter = !rutasExcluidas.some(ruta => $page.url.pathname.startsWith(ruta));
</script>

{#if mostrarFooter}
  <footer class="footer-politicas">
    <div class="footer-container">
      
      <!-- 📋 ENLACES LEGALES -->
      <div class="enlaces-legales">
        <a href="/privacidad" class="enlace-legal">
          <span class="enlace-icono">🔒</span>
          <span class="enlace-texto">Políticas de Privacidad</span>
        </a>
        
        <span class="separador">•</span>
        
        <a href="/terminos" class="enlace-legal">
          <span class="enlace-icono">📋</span>
          <span class="enlace-texto">Términos y Condiciones</span>
        </a>
        
        <span class="separador">•</span>
        
        <a href="/contacto" class="enlace-legal">
          <span class="enlace-icono">📞</span>
          <span class="enlace-texto">Contacto</span>
        </a>
      </div>

      <!-- 🏛️ INFORMACIÓN CORPORATIVA -->
      <div class="info-corporativa">
        <p class="copyright">
          © 2025 <strong>Academia Vallenata Online</strong>. Todos los derechos reservados.
        </p>
        <p class="descripcion">
          Plataforma educativa especializada en acordeón y música vallenata. 
          <span class="highlight">🎵 Aprende con la comunidad #1 de acordeonistas online</span>
        </p>
      </div>

      <!-- 🌟 BADGE DE CONFIANZA -->
      <div class="badge-confianza">
        <div class="certificacion">
          <span class="certificacion-icono">✅</span>
          <span class="certificacion-texto">Plataforma Verificada</span>
        </div>
        <div class="ssl-info">
          <span class="ssl-icono">🔐</span>
          <span class="ssl-texto">Conexión Segura SSL</span>
        </div>
      </div>

    </div>
  </footer>
{/if}

<style>
  /* 🏛️ FOOTER PRINCIPAL */
  .footer-politicas {
    background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
    color: white;
    padding: 30px 20px 20px;
    margin-top: 0;
    border-top: 3px solid #f59e0b;
  }

  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    text-align: center;
  }

  /* 🔗 ENLACES LEGALES */
  .enlaces-legales {
    display: flex;
    align-items: center;
    gap: 15px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .enlace-legal {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #e2e8f0;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 8px;
    transition: all 0.3s ease;
    border: 1px solid transparent;
  }

  .enlace-legal:hover {
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
    transform: translateY(-1px);
  }

  .enlace-icono {
    font-size: 1rem;
  }

  .enlace-texto {
    white-space: nowrap;
  }

  .separador {
    color: #64748b;
    font-weight: bold;
    user-select: none;
  }

  /* 🏛️ INFORMACIÓN CORPORATIVA */
  .info-corporativa {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-width: 600px;
  }

  .copyright {
    color: #e2e8f0;
    font-size: 0.9rem;
    margin: 0;
    font-weight: 500;
  }

  .copyright strong {
    color: #f59e0b;
    font-weight: 700;
  }

  .descripcion {
    color: #94a3b8;
    font-size: 0.8rem;
    margin: 0;
    line-height: 1.4;
  }

  .highlight {
    color: #fbbf24;
    font-weight: 600;
  }

  /* 🌟 BADGE DE CONFIANZA */
  .badge-confianza {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
  }

  .certificacion,
  .ssl-info {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 20px;
    padding: 6px 12px;
    font-size: 0.8rem;
    color: #e2e8f0;
  }

  .certificacion-icono,
  .ssl-icono {
    font-size: 0.9rem;
  }

  .certificacion-texto,
  .ssl-texto {
    font-weight: 500;
    white-space: nowrap;
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .footer-politicas {
      padding: 25px 15px 15px;
    }

    .footer-container {
      gap: 15px;
    }

    .enlaces-legales {
      gap: 10px;
    }

    .enlace-legal {
      font-size: 0.85rem;
      padding: 6px 10px;
    }

    .enlace-texto {
      display: none;
    }

    .enlace-icono {
      font-size: 1.1rem;
    }

    .separador {
      display: none;
    }

    .info-corporativa {
      gap: 6px;
    }

    .copyright {
      font-size: 0.85rem;
    }

    .descripcion {
      font-size: 0.75rem;
    }

    .badge-confianza {
      gap: 15px;
    }

    .certificacion,
    .ssl-info {
      padding: 5px 10px;
      font-size: 0.75rem;
    }
  }

  @media (max-width: 480px) {
    .footer-politicas {
      padding: 20px 10px;
    }

    .enlaces-legales {
      gap: 8px;
    }

    .enlace-legal {
      padding: 8px;
    }

    .info-corporativa {
      max-width: 100%;
    }

    .badge-confianza {
      flex-direction: column;
      gap: 10px;
    }
  }
</style> 