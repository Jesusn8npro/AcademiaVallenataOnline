<script lang="ts">
  import { goto } from '$app/navigation';
  import GestionPaquetes from '$lib/components/PanelAdministracion/GestionPaquetes.svelte';

  // Función para crear paquete - igual que la original
  function irACrearPaquete() {
    goto('/administrador/paquetes/crear');
  }
</script>

<div class="pestaña-paquetes">
  <div class="encabezado-pestaña">
    <div class="header-content">
      <div class="header-text">
        <h2>📦 Gestión de Paquetes</h2>
        <p>Administración de paquetes de tutoriales y cursos</p>
      </div>
      <button class="btn-crear-paquete" on:click={irACrearPaquete}>
        <i class="fas fa-plus"></i>
        Crear Paquete
      </button>
    </div>
  </div>

  <div class="contenido-paquetes">
    <GestionPaquetes />
  </div>
</div>

<style>
  .pestaña-paquetes {
    width: 100%;
    animation: fadeIn 0.3s ease;
  }

  .encabezado-pestaña {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 2rem;
  }

  .header-text {
    text-align: center;
    flex: 1;
  }

  .btn-crear-paquete {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .btn-crear-paquete:hover {
    background: rgba(34, 197, 94, 0.3);
    border-color: rgba(34, 197, 94, 0.5);
    transform: translateY(-1px);
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

  .contenido-paquetes {
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
    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .encabezado-pestaña h2 {
      font-size: 1.25rem;
    }

    .encabezado-pestaña p {
      font-size: 0.85rem;
    }

    .btn-crear-paquete {
      padding: 0.6rem 1.2rem;
      font-size: 0.9rem;
    }
  }
</style> 