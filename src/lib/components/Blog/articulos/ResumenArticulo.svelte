<script lang="ts">
  export let resumen = '';
  export let titulo = '';

  // Constante para la longitud del resumen, para fácil mantenimiento
  const LONGITUD_TRUNCADO = 150;

  // Estados para el resumen colapsable
  let resumenExpandido = false;
  let mostrandoBotonLeer = false;

  // Funciones para manejar el resumen
  function expandirResumen() {
    resumenExpandido = true;
    setTimeout(() => (mostrandoBotonLeer = true), 800);
  }

  function colapsarResumen() {
    resumenExpandido = false;
    mostrandoBotonLeer = false;
  }

  function scrollAlArticulo() {
    // Selector corregido para apuntar al contenedor del contenido del artículo
    const articuloElemento = document.getElementById('contenido-articulo') || document.querySelector('.contenido-articulo-blog');
    if (articuloElemento) {
      articuloElemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
</script>

{#if resumen}
  <div class="seccion-resumen">
    {#if !resumenExpandido}
      <!-- Vista previa del resumen -->
      <div class="resumen-preview">
        <p class="resumen-truncado">
          {resumen.length > LONGITUD_TRUNCADO ? resumen.substring(0, LONGITUD_TRUNCADO) + '...' : resumen}
        </p>
        <button class="boton-expandir-resumen" on:click={expandirResumen}>
          <span class="icono-resumen">📖</span>
          <span class="texto-boton">Ver Resumen Completo</span>
          <span class="flecha-expandir">▼</span>
        </button>
      </div>
    {:else}
      <!-- Resumen completo expandido -->
      <div class="resumen-expandido">
        <div class="resumen-header">
          <h3>📋 Resumen Completo del Artículo</h3>
          <button class="boton-colapsar" on:click={colapsarResumen}>
            <span>✕</span>
          </button>
        </div>
        <p class="resumen-completo">{resumen}</p>
        {#if mostrandoBotonLeer}
          <div class="cta-leer-articulo">
            <button class="boton-leer-articulo" on:click={scrollAlArticulo}>
              <span class="icono-leer">🎵</span>
              <span class="texto-leer">¡Leer Artículo Completo!</span>
              <span class="brillo-efecto"></span>
            </button>
            <p class="mensaje-intriga">{titulo}</p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
/* === SECCIÓN RESUMEN COLAPSABLE === */
.seccion-resumen {
  margin-bottom: 18px;
}

.resumen-preview {
  background: linear-gradient(135deg, #f3fbe9, #e8f5e8);
  border-radius: 16px;
  padding: 20px;
  border: 2px solid #ff6b35;
  box-shadow: 0 8px 32px rgba(255, 107, 53, 0.15);
  position: relative;
  overflow: hidden;
}

.resumen-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #ff6b35, #f7931e, #ffd700);
}

.resumen-truncado {
  font-size: 1.1rem;
  color: #2d5a3d;
  margin-bottom: 15px;
  line-height: 1.6;
  font-weight: 500;
}

.boton-expandir-resumen {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: white;
  border: none;
  border-radius: 25px;
  padding: 12px 24px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 15px rgba(255, 107, 53, 0.3);
  position: relative;
  overflow: hidden;
}

.boton-expandir-resumen::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s ease;
}

.boton-expandir-resumen:hover::before {
  left: 100%;
}

.boton-expandir-resumen:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
}

.flecha-expandir {
  transition: transform 0.3s ease;
  font-size: 0.8rem;
}

.boton-expandir-resumen:hover .flecha-expandir {
  transform: translateY(2px);
}

/* === RESUMEN EXPANDIDO === */
.resumen-expandido {
  background: linear-gradient(135deg, #f8fafc, #e8f4f8);
  border-radius: 20px;
  padding: 0;
  border: 3px solid #ff6b35;
  box-shadow: 0 12px 40px rgba(255, 107, 53, 0.2);
  animation: expandirResumen 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  position: relative;
}

@keyframes expandirResumen {
  0% {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
    max-height: 0;
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
    max-height: 1000px;
  }
}

.resumen-header {
  background: linear-gradient(135deg, #ff6b35, #f7931e);
  color: white;
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.resumen-header h3 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: white !important;
}

.boton-colapsar {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 35px;
  height: 35px;
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.boton-colapsar:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.resumen-completo {
  padding: 25px;
  font-size: 1.1rem;
  color: #2c3e50;
  line-height: 1.7;
  margin: 0;
}

/* === CTA LEER ARTÍCULO === */
.cta-leer-articulo {
  padding: 25px;
  text-align: center;
  background: linear-gradient(135deg, #2d5a3d, #1e3a2e);
  border-top: 2px solid rgba(255, 255, 255, 0.1);
  animation: aparecerCta 0.6s ease-out 0.2s both;
}

@keyframes aparecerCta {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.boton-leer-articulo {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #2d5a3d;
  border: none;
  border-radius: 50px;
  padding: 18px 35px;
  font-size: 1.2rem;
  font-weight: 800;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 8px 30px rgba(255, 215, 0, 0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.boton-leer-articulo:hover {
  transform: translateY(-5px) scale(1.08);
  box-shadow: 0 15px 40px rgba(255, 215, 0, 0.6);
}

.brillo-efecto {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  animation: brillar 2s infinite;
}

@keyframes brillar {
  0% { left: -100%; }
  50% { left: 100%; }
  100% { left: 100%; }
}

.mensaje-intriga {
  color: rgba(255, 255, 255, 0.9);
  margin: 15px 0 0 0;
  font-size: 1rem;
  font-style: italic;
}

/* === RESPONSIVE MOBILE === */
@media (max-width: 700px) {
  .resumen-preview {
    padding: 15px;
    border-radius: 12px;
  }

  .boton-expandir-resumen {
    padding: 10px 20px;
    font-size: 0.9rem;
  }

  .resumen-expandido {
    border-radius: 15px;
  }

  .resumen-header {
    padding: 15px 20px;
  }

  .resumen-header h3 {
    font-size: 1.1rem;
  }

  .resumen-completo {
    padding: 20px;
    font-size: 1rem;
  }

  .boton-leer-articulo {
    padding: 15px 25px;
    font-size: 1rem;
  }
}
</style> 