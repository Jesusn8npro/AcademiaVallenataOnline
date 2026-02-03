<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, scale } from 'svelte/transition';
  import { quintOut, elasticOut } from 'svelte/easing';
  import { goto } from '$app/navigation';

  let visible = false;

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          visible = true;
        }
      });
    });

    const section = document.querySelector('.seccion-instructor');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  });

  function irAlCurso() {
    goto('/curso-acordeon-desde-cero');
  }


</script>

<section class="seccion-instructor" id="instructor">
  <!-- Fondo atmosférico -->
  <div class="fondo-atmosferico">
    <div class="patron-musical"></div>
    <div class="gradiente-overlay"></div>
  </div>

  <div class="contenedor">
    
    <!-- Header emocional -->
    {#if visible}
      <div in:fly="{{ y: 60, duration: 1200, easing: quintOut }}" class="header-emocional">
        <div class="badge-question">🎵 TU MENTOR MUSICAL</div>
        <h2 class="titulo-emocional">
          <span class="pregunta-clave">¿Quién Estará A Tu Lado</span>
          <span class="respuesta-dorada">En Cada Nota?</span>
        </h2>
      </div>
    {/if}

    <!-- Contenido principal split -->
    <div class="contenido-split">
      
      <!-- Lado izquierdo - Foto y credenciales -->
      {#if visible}
        <div in:scale="{{ start: 0.7, duration: 1000, delay: 300, easing: elasticOut }}" class="lado-izquierdo">
          
          <!-- Collage de fotos profesionales -->
          <div class="collage-maestro">
            <div class="foto-principal">
                            <img 
                 src="/images/Foto maestro oficial JESUS GONZALEZ.jpg" 
                 alt="Maestro Jesús González"
                 class="img-maestro"
               />
              <div class="overlay-profesional"></div>
            </div>
            
                         <div class="badge-experiencia">
               <span class="numero-anos">10+</span>
               <span class="texto-anos">Años de Experiencia</span>
             </div>
          </div>

          
        </div>
      {/if}

      <!-- Lado derecho - Historia personal -->
      {#if visible}
        <div in:fly="{{ x: 50, duration: 1000, delay: 500, easing: quintOut }}" class="lado-derecho">
          
          <div class="presentacion-personal">
            <h3 class="saludo-personal">Hola, soy Jesús González</h3>
            <p class="subtitulo-personal">Tu mentor en el acordeón vallenato</p>
            
                         <div class="historia-emotiva">
               <p class="parrafo-principal">
                 Con más de <strong>10 años de experiencia profesional</strong>, he tenido el honor de 
                 compartir escena con <strong>Poncho Zuleta</strong> en más de 15 conciertos, 
                 grabar junto a <strong>Felipe Peláez</strong> y <strong>Orlando Acosta</strong>, 
                 y llevar nuestra hermosa música vallenata por toda Europa.
               </p>
               
               <p class="parrafo-garantia">
                 <strong>Te garantizo algo que nadie más puede:</strong> Mi método probado te llevará 
                 de <strong>cero absoluto a tu primera canción en solo 7 días</strong>. No es magia, 
                 es el mismo sistema que ha transformado a más de <strong>5,000 estudiantes</strong> 
                 en acordeonistas exitosos.
               </p>
               
               <p class="parrafo-diferencia">
                 A diferencia de otros maestros, yo <strong>NO te abandono después de vender el curso</strong>. 
                 Te acompaño paso a paso hasta que toques tu primera canción completa. Mi misión es simple: 
                 <strong>hacer realidad tu sueño musical</strong>, sin frustración, sin vueltas, 
                 <strong>directo al éxito</strong>.
               </p>

               <p class="parrafo-urgencia">
                 Miles ya están viviendo su sueño musical conmigo. <strong>¿Vas a seguir esperando</strong> 
                 o te unes hoy mismo a la academia que <strong>SÍ cumple lo que promete?</strong>
               </p>
             </div>

             <!-- CTA principal -->
             <div class="cta-maestro">
               <button class="cta-principal" on:click={irAlCurso}>
                 🚀 APRENDER CON JESÚS
                 <span class="cta-subtitle">Curso desde cero - Primera canción en 7 días</span>
               </button>
             </div>
          </div>
        </div>
      {/if}
    </div>

    

  </div>
</section>

<style>
  .seccion-instructor {
    position: relative;
    padding: 8rem 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #374151 100%);
    color: white;
    overflow: hidden;
  }

  .fondo-atmosferico {
    position: absolute;
    inset: 0;
    z-index: 1;
  }

  .patron-musical {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(251, 191, 36, 0.1) 2px, transparent 2px),
      radial-gradient(circle at 75% 75%, rgba(124, 58, 237, 0.1) 2px, transparent 2px);
    background-size: 60px 60px;
    animation: floatPattern 20s linear infinite;
  }

  @keyframes floatPattern {
    0% { transform: translateY(0) rotate(0deg); }
    100% { transform: translateY(-60px) rotate(360deg); }
  }

  .gradiente-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, transparent 30%, rgba(15, 23, 42, 0.8) 100%);
  }

  .contenedor {
    position: relative;
    z-index: 10;
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 2rem;
  }

  /* Header emocional */
  .header-emocional {
    text-align: center;
    margin-bottom: 6rem;
  }

  .badge-question {
    display: inline-block;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    color: #1f2937;
    padding: 0.8rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    font-size: 0.9rem;
    margin-bottom: 2rem;
    box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
    animation: pulseGlow 3s ease-in-out infinite;
  }

  .titulo-emocional {
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 900;
    line-height: 1.1;
    margin: 0;
  }

  .pregunta-clave {
    display: block;
    color: #e2e8f0;
    margin-bottom: 0.5rem;
  }

  .respuesta-dorada {
    display: block;
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  /* Contenido split */
  .contenido-split {
    display: grid;
    grid-template-columns: 1fr 1.2fr;
    gap: 5rem;
    align-items: start;
  }

  /* Lado izquierdo */
  .collage-maestro {
    position: relative;
    margin-bottom: 3rem;
  }

  .foto-principal {
    position: relative;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  }

     .img-maestro {
     width: 100%;
     height: auto;
     object-fit: contain;
     transition: transform 0.3s ease;
     max-height: none;
   }

  .overlay-profesional {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(124, 58, 237, 0.1) 100%);
  }

  .badge-experiencia {
    position: absolute;
    top: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    padding: 1rem;
    border-radius: 15px;
    text-align: center;
    border: 2px solid rgba(251, 191, 36, 0.3);
  }

  .numero-anos {
    display: block;
    font-size: 2rem;
    font-weight: 900;
    background: linear-gradient(135deg, #fbbf24, #f59e0b);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .texto-anos {
    display: block;
    font-size: 0.8rem;
    font-weight: 600;
    color: #cbd5e1;
  }

  

  /* Lado derecho */
  .presentacion-personal {
    height: 100%;
  }

  .saludo-personal {
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    color: #fbbf24;
    margin-bottom: 0.5rem;
    line-height: 1.2;
  }

  .subtitulo-personal {
    font-size: 1.3rem;
    color: #94a3b8;
    margin-bottom: 3rem;
    font-weight: 600;
  }

  .historia-emotiva {
    margin-bottom: 3rem;
  }

     .parrafo-principal {
     font-size: 1.1rem;
     line-height: 1.8;
     color: #e2e8f0;
     margin-bottom: 1.5rem;
   }

   .parrafo-garantia {
     font-size: 1.15rem;
     line-height: 1.8;
     color: #e2e8f0;
     margin-bottom: 1.5rem;
     background: rgba(251, 191, 36, 0.1);
     padding: 1.5rem;
     border-radius: 12px;
     border-left: 4px solid #fbbf24;
   }

   .parrafo-diferencia {
     font-size: 1.1rem;
     line-height: 1.8;
     color: #e2e8f0;
     margin-bottom: 1.5rem;
   }

   .parrafo-urgencia {
     font-size: 1.1rem;
     line-height: 1.8;
     color: #e2e8f0;
     margin-bottom: 2rem;
     text-align: center;
     background: rgba(220, 38, 38, 0.1);
     padding: 1.5rem;
     border-radius: 12px;
     border: 2px solid rgba(220, 38, 38, 0.3);
   }

   .parrafo-principal strong,
   .parrafo-garantia strong,
   .parrafo-diferencia strong,
   .parrafo-urgencia strong {
     color: #fbbf24;
     font-weight: 700;
   }

   .parrafo-urgencia strong {
     color: #fbbf24;
     font-weight: 800;
   }

     /* CTA del maestro */
   .cta-maestro {
     margin-top: 2rem;
   }

   .cta-principal {
     width: 100%;
     padding: 2rem;
     border-radius: 15px;
     border: none;
     cursor: pointer;
     font-weight: 800;
     font-size: 1.2rem;
     transition: all 0.3s ease;
     display: flex;
     flex-direction: column;
     align-items: center;
     text-transform: uppercase;
     letter-spacing: 0.5px;
     background: linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%);
     color: white;
     box-shadow: 0 15px 40px rgba(220, 38, 38, 0.4);
   }

   .cta-principal:hover {
     transform: translateY(-8px) scale(1.03);
     box-shadow: 0 25px 60px rgba(220, 38, 38, 0.6);
   }

   .cta-subtitle {
     font-size: 0.9rem;
     font-weight: 400;
     opacity: 0.95;
     text-transform: none;
     letter-spacing: normal;
     margin-top: 0.5rem;
     line-height: 1.4;
   }

  

  /* Responsive */
  @media (max-width: 1024px) {
    .contenido-split {
      grid-template-columns: 1fr;
      gap: 4rem;
    }

    .seccion-instructor {
      padding: 6rem 0;
    }
  }

     @media (max-width: 768px) {
     .contenedor {
       padding: 0 1rem;
     }

     .header-emocional {
       margin-bottom: 4rem;
     }

     .cta-principal {
       font-size: 1.1rem;
       padding: 1.8rem;
     }

     .cta-subtitle {
       font-size: 0.85rem;
     }

     .badge-experiencia {
       padding: 0.8rem;
     }

     .numero-anos {
       font-size: 1.5rem;
     }

     .texto-anos {
       font-size: 0.7rem;
     }

     .parrafo-garantia {
       font-size: 1rem;
       padding: 1.2rem;
     }

     .parrafo-urgencia {
       font-size: 1rem;
       padding: 1.2rem;
     }
   }

  @keyframes pulseGlow {
    0%, 100% { 
      transform: scale(1);
      box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
    }
    50% { 
      transform: scale(1.02);
      box-shadow: 0 12px 35px rgba(251, 191, 36, 0.5);
    }
  }
</style> 