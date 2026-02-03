<script lang="ts">
  import { onMount } from 'svelte';
  let banners = [
  {
    titulo: '¡Nueva funcionalidad!',
    descripcion: 'Ahora puedes compartir videos y audios directamente en tus publicaciones. ¡Pruébalo en la comunidad!',
    link: '/comunidad'
  },
  {
    titulo: 'Novedad: Ranking actualizado',
    descripcion: 'El ranking de la comunidad ahora se actualiza en tiempo real con tus logros y participaciones.',
    link: '/comunidad/ranking'
  },
  {
    titulo: 'Evento especial de junio',
    descripcion: 'Participa en el reto musical de junio y gana una mentoría exclusiva. Más info en la sección de eventos.',
    link: '/eventos'
  }
];
  let actual = 0;
  let intervalo: any;

  onMount(() => {
    intervalo = setInterval(() => {
      actual = (actual + 1) % banners.length;
    }, 5000);
    return () => clearInterval(intervalo);
  });

  function irA(idx: number) {
    actual = idx;
  }
</script>

<div class="banner-slider">
  <div class="banner-contenido fade-in">
    <div class="banner-texto solo-texto">
      <h3>{banners[actual].titulo}</h3>
      <p>{banners[actual].descripcion}</p>
      {#if banners[actual].link}
        <a class="banner-btn" href={banners[actual].link}>Ver más</a>
      {/if}
    </div>
  </div>
  <div class="banner-dots">
    {#each banners as _, idx}
      <button class:dots-active={idx === actual} on:click={() => irA(idx)} aria-label={`Banner ${idx+1}`}></button>
    {/each}
  </div>
</div>

<style>
.banner-slider {
  width: 100%;
  max-width: 100%;
  margin: 0;
  background: linear-gradient(135deg, #23234b 70%, #ffd700 100%);
  border-radius: 18px;
  box-shadow: 0 4px 18px 0 #00000022;
  overflow: hidden;
  position: relative;
  min-height: 180px;
  min-width: 0; /* Permite que el elemento se encoja */
  box-sizing: border-box;
}
.banner-contenido {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 1.2rem;
}
.banner-texto {
  flex: 1;
  text-align: center;
}
.banner-texto.solo-texto {
  margin: 0 auto;
  max-width: 100%;
}
.banner-texto h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
  color: #ffd700;
  font-family: 'Orbitron', Arial, sans-serif;
  font-weight: 900;
  line-height: 1.2;
}
.banner-texto p {
  margin: 0 0 0.8rem 0;
  color: #fff;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.3;
}
.banner-btn {
  background: #ffd700;
  color: #23234e;
  font-weight: bold;
  border: none;
  border-radius: 7px;
  padding: 0.37rem 1.2rem;
  text-decoration: none;
  font-size: 1em;
  box-shadow: 0 1px 6px #ffd70033;
  transition: background 0.15s, color 0.15s;
}
.banner-btn:hover {
  background: #23234b;
  color: #ffd700;
}
.banner-dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
  margin: 0.5rem 0 0.7rem 0;
}
.banner-dots button {
  width: 13px;
  height: 13px;
  border-radius: 50%;
  border: none;
  background: #fff5;
  cursor: pointer;
  transition: background 0.18s, transform 0.13s;
}
.banner-dots button.dots-active {
  background: #ffd700;
  transform: scale(1.18);
  box-shadow: 0 0 6px #ffd70099;
}
.fade-in {
  animation: fadeIn 0.6s;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: none; }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .banner-slider {
    min-height: 160px;
  }
  
  .banner-texto h3 {
    font-size: 1rem;
  }
  
  .banner-texto p {
    font-size: 0.85rem;
  }
  
  .banner-btn {
    font-size: 0.9rem;
    padding: 0.3rem 1rem;
  }
}

@media (max-width: 480px) {
  .banner-slider {
    min-height: 140px;
  }
  
  .banner-contenido {
    padding: 0.8rem 1rem;
  }
  
  .banner-texto h3 {
    font-size: 0.95rem;
  }
  
  .banner-texto p {
    font-size: 0.8rem;
  }
}
</style>
