<script lang="ts">
  let emailSuscripcion = '';
  let mensajeSuscripcion = '';
  
  async function manejarSuscripcion() {
    mensajeSuscripcion = !emailSuscripcion.includes('@') 
      ? 'Por favor ingresa un email válido' 
      : '¡Gracias por suscribirte! 🎵';
    if (mensajeSuscripcion.includes('Gracias')) emailSuscripcion = '';
    setTimeout(() => mensajeSuscripcion = '', 3000);
  }
</script>

<!-- Se eliminó el contenedor extra. El <aside> ahora maneja su propia posición. -->
<aside class="sidebar-academia">
  <!-- Suscripción Newsletter -->
  <div class="seccion">
    <div class="icono-newsletter">📧</div>
    <h4>Tips Exclusivos Semanales</h4>
    <p>Recibe técnicas avanzadas, tabs exclusivas y descuentos especiales</p>
    
    <form on:submit|preventDefault={manejarSuscripcion} class="formulario-suscripcion">
      <input type="email" placeholder="tu@email.com" bind:value={emailSuscripcion} />
      <button type="submit">Suscribirme</button>
    </form>
    
    {#if mensajeSuscripcion}
      <div class="mensaje-suscripcion" class:exito={mensajeSuscripcion.includes('Gracias')}>
        {mensajeSuscripcion}
      </div>
    {/if}
    
    <div class="beneficios-suscripcion">
      <div class="beneficio"><span>🎼</span> Tabs exclusivas semanales</div>
      <div class="beneficio"><span>💰</span> Descuentos especiales</div>
      <div class="beneficio"><span>🏆</span> Tips de profesionales</div>
    </div>
  </div>

  <!-- Cursos Destacados -->
  <div class="seccion">
    <h4>🏆 Cursos Más Populares</h4>
    
    <div class="curso-mini">
      <img src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=200&q=80" alt="Curso Básico" />
      <div class="curso-info">
        <h5>Acordeón Básico</h5>
        <div class="rating">⭐⭐⭐⭐⭐ 4.9</div>
        <div class="precio-curso">
          <span class="precio-rebajado">$79</span>
          <span class="precio-original">$159</span>
        </div>
      </div>
    </div>

    <div class="curso-mini">
      <img src="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=200&q=80" alt="Curso Avanzado" />
      <div class="curso-info">
        <h5>Técnicas Avanzadas</h5>
        <div class="rating">⭐⭐⭐⭐⭐ 4.8</div>
        <div class="precio-curso">
          <span class="precio-rebajado">$99</span>
          <span class="precio-original">$199</span>
        </div>
      </div>
    </div>

    <button class="boton-ver-todos">Ver Todos los Cursos</button>
  </div>

  <!-- Testimonios -->
  <div class="seccion">
    <h4>💬 Lo que Dicen Nuestros Estudiantes</h4>
    
    <div class="testimonio">
      <p>"Jesús es un excelente maestro. Sus explicaciones son claras y he mejorado muchísimo mi técnica."</p>
      <div class="autor-testimonio">
        <div class="avatar-testimonio">MC</div>
        <div class="info-autor">
          <span>María Carmen</span>
          <span class="ubicacion">Valledupar</span>
        </div>
      </div>
    </div>

    <div class="testimonio">
      <p>"Los tutoriales son increíbles. Pude aprender mis canciones favoritas rápidamente."</p>
      <div class="autor-testimonio">
        <div class="avatar-testimonio">AR</div>
        <div class="info-autor">
          <span>Andrés Rodríguez</span>
          <span class="ubicacion">Barranquilla</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Redes Sociales -->
  <div class="seccion">
    <h4>🌟 Síguenos</h4>
    <div class="redes-container">
      <a href="#" class="red-social">
        <span>📸</span><span>Instagram</span><span class="seguidores">12K</span>
      </a>
      <a href="#" class="red-social">
        <span>🎥</span><span>YouTube</span><span class="seguidores">8.5K</span>
      </a>
      <a href="#" class="red-social">
        <span>👥</span><span>Facebook</span><span class="seguidores">15K</span>
      </a>
    </div>
  </div>
</aside>

<style>
  :root {
    --color-primario: #3b82f6;
    --color-acento: #10b981;
    --color-exito: #059669;
    --color-fondo: #ffffff;
    --color-fondo-suave: #f8fafc;
    --color-texto: #1e293b;
    --color-texto-suave: #64748b;
    --color-borde: #e2e8f0;
    --sombra-suave: 0 4px 15px rgba(0, 0, 0, 0.05);
    --sombra-pegado: 0 8px 32px rgba(0, 0, 0, 0.12);
  }

  .contenedor-sidebar {
    position: relative;
    width: 320px;
    max-width: 100%;
    height: fit-content;
  }

  .sidebar-academia {
    /* --- LA MAGIA DEL STICKY (SIMPLE Y EFECTIVO) --- */
    position: sticky;
    top: 80px; /* Se pega a 80px de la parte superior */
    align-self: start; /* Se alinea al inicio para que el sticky funcione bien en el grid */
    /* --- FIN DE LA MAGIA --- */

    width: 100%;
    background: var(--color-fondo);
    border: 1px solid var(--color-borde);
    border-radius: 16px;
    padding: 1rem;
    box-shadow: var(--sombra-suave);
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    transition: none; /* Se elimina la transición para evitar conflictos */
  }

  .seccion {
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-borde);
  }
  .seccion:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  .seccion h4 {
    font-size: 1.1rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
  }

  /* === Suscripción === */
  .seccion:first-child { text-align: center; }
  .icono-newsletter { font-size: 2.5rem; margin-bottom: 0.5rem; }
  .formulario-suscripcion { display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0; }
  .formulario-suscripcion input { padding: 0.8rem; border: 1px solid var(--color-borde); border-radius: 8px; }
  .formulario-suscripcion button { background: var(--color-acento); color: white; border: none; padding: 0.8rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
  .mensaje-suscripcion { font-size: 0.85rem; padding: 0.5rem; border-radius: 6px; background: #fee2e2; color: #dc2626; }
  .mensaje-suscripcion.exito { background: #d1fae5; color: var(--color-exito); }
  .beneficios-suscripcion { display: flex; flex-direction: column; gap: 0.5rem; text-align: left; margin-top: 1rem; }
  .beneficio { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--color-texto-suave); }

  /* === Cursos Destacados === */
  .curso-mini { display: flex; gap: 0.8rem; align-items: center; }
  .curso-mini + .curso-mini { margin-top: 1rem; }
  .curso-mini img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
  .curso-info h5 { font-size: 0.9rem; font-weight: 600; margin: 0; }
  .rating { font-size: 0.8rem; color: var(--color-texto-suave); }
  .precio-rebajado { font-weight: 700; color: var(--color-acento); font-size: 0.9rem; }
  .precio-original { font-size: 0.8rem; text-decoration: line-through; color: var(--color-texto-suave); }
  .boton-ver-todos { width: 100%; background: var(--color-fondo-suave); border: 1px solid var(--color-borde); color: var(--color-primario); padding: 0.8rem; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 1.5rem; }

  /* === Testimonios === */
  .testimonio { background: var(--color-fondo-suave); border-radius: 12px; border-left: 3px solid var(--color-primario); padding: 1rem; }
  .testimonio + .testimonio { margin-top: 1rem; }
  .testimonio p { font-size: 0.9rem; line-height: 1.4; margin: 0 0 1rem 0; font-style: italic; }
  .autor-testimonio { display: flex; align-items: center; gap: 0.8rem; }
  .avatar-testimonio { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primario); color: white; display: grid; place-items: center; font-size: 0.8rem; font-weight: 600; }
  .info-autor { font-size: 0.85rem; }
  .info-autor span:first-child { font-weight: 600; display: block; }
  .info-autor .ubicacion { color: var(--color-texto-suave); }

  /* === Redes Sociales === */
  .redes-container { display: flex; flex-direction: column; gap: 0.5rem; }
  .red-social { display: flex; align-items: center; padding: 0.5rem; background: var(--color-fondo-suave); border-radius: 8px; text-decoration: none; color: var(--color-texto); transition: all 0.2s ease; }
  .red-social:hover { transform: translateX(4px); background: var(--color-borde); }
  .red-social span:nth-child(2) {
    flex-grow: 1;
    margin: 0 0.5rem;
    font-weight: 500;
  }
  .seguidores {
    font-size: 0.8rem;
    color: var(--color-texto-suave);
  }

  /* === Responsive === */
  @media (max-width: 1200px) {
    /* No se necesita ancho específico aquí, lo hereda del contenedor grid */
  }

  @media (max-width: 900px) {
    .sidebar-academia {
      position: static; /* Desactivamos el sticky en móvil/tablet */
      width: 100%;
      margin-top: 2rem;
    }
  }
</style>
