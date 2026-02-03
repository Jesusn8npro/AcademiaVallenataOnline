<script lang="ts">
  import BlogAdminManager from '$lib/components/Blog/BlogAdminManager.svelte';
</script>

<div class="pestaña-blog">
  <div class="encabezado-pestaña">
    <h2>📝 Blog & Contenido</h2>
    <p>Gestión completa de artículos del blog</p>
  </div>

  <!-- GESTOR COMPLETO DE BLOG -->
  <div class="contenido-blog">
    <BlogAdminManager />
  </div>
</div>

<style>
  .pestaña-blog {
    width: 100%;
    animation: fadeIn 0.3s ease;
  }

  .encabezado-pestaña {
    margin-bottom: 2rem;
    text-align: center;
  }

  .encabezado-pestaña h2 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .encabezado-pestaña p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .contenido-blog {
    width: 100%;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .encabezado-pestaña h2 {
      font-size: 1.25rem;
    }

    .encabezado-pestaña p {
      font-size: 0.85rem;
    }
  }
</style> 