<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';

  let proximosEventos: any[] = [];
  let cargandoEventos = true;

  onMount(() => {
    cargarProximosEventos();
  });

  async function cargarProximosEventos() {
    try {
      cargandoEventos = true;
      
      // Datos de ejemplo hasta que se cree la tabla eventos
      proximosEventos = [
        {
          id: 1,
          titulo: 'Masterclass de Acordeón',
          fecha_inicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          tipo: 'masterclass',
          estado: 'programado'
        },
        {
          id: 2,
          titulo: 'Taller de Ritmos Vallenatos',
          fecha_inicio: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          tipo: 'taller',
          estado: 'programado'
        }
      ];

    } catch (error) {
      proximosEventos = [];
    } finally {
      cargandoEventos = false;
    }
  }

  // Formatear fecha para mostrar
  function formatearFecha(fecha: string): string {
    const fechaEvento = new Date(fecha);
    const ahora = new Date();
    const diferenciaMs = fechaEvento.getTime() - ahora.getTime();
    const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diasRestantes === 0) return 'Hoy';
    if (diasRestantes === 1) return 'Mañana';
    if (diasRestantes <= 7) return `En ${diasRestantes} días`;
    
    return fechaEvento.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Formatear hora
  function formatearHora(fecha: string): string {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Obtener icono según tipo de evento
  function obtenerIconoEvento(tipo: string): string {
    switch (tipo) {
      case 'masterclass': return 'fas fa-chalkboard-teacher';
      case 'concierto': return 'fas fa-music';
      case 'taller': return 'fas fa-tools';
      case 'competencia': return 'fas fa-trophy';
      default: return 'fas fa-calendar';
    }
  }

  // Obtener color según tipo de evento
  function obtenerColorEvento(tipo: string): string {
    switch (tipo) {
      case 'masterclass': return '#3b82f6';
      case 'concierto': return '#8b5cf6';
      case 'taller': return '#10b981';
      case 'competencia': return '#f59e0b';
      default: return '#6b7280';
    }
  }

  // Obtener estado del evento
  function obtenerEstadoEvento(fechaInicio: string, estado: string): 'proximo' | 'hoy' | 'pronto' {
    const fecha = new Date(fechaInicio);
    const ahora = new Date();
    const diferenciaHoras = (fecha.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diferenciaHoras <= 24) return 'hoy';
    if (diferenciaHoras <= 72) return 'pronto';
    return 'proximo';
  }
</script>

<div class="contenedor-eventos">
  
  <!-- 🎯 ENCABEZADO -->
  <div class="encabezado-seccion">
    <div class="titulo-con-accion">
      <h3>📅 Próximos Eventos</h3>
      <button class="boton-crear" title="Crear nuevo evento">
        <i class="fas fa-plus"></i>
      </button>
    </div>
    <p>Calendario de actividades de la academia</p>
  </div>

  <!-- 📊 LISTA DE EVENTOS -->
  <div class="lista-eventos">
    {#if cargandoEventos}
      <!-- 💫 ESTADO DE CARGA -->
      <div class="cargando-eventos">
        <div class="spinner"></div>
        <p>Cargando eventos...</p>
      </div>
      
    {:else if proximosEventos.length > 0}
      {#each proximosEventos as evento}
        {@const estadoEvento = obtenerEstadoEvento(evento.fecha_inicio, evento.estado)}
        
        <div class="item-evento" class:urgente={estadoEvento === 'hoy'} class:proximo={estadoEvento === 'pronto'}>
          
          <!-- 🎨 ICONO DEL EVENTO -->
          <div 
            class="icono-evento"
            style="background-color: {obtenerColorEvento(evento.tipo_evento)}20; color: {obtenerColorEvento(evento.tipo_evento)}"
          >
            <i class="{obtenerIconoEvento(evento.tipo_evento)}"></i>
          </div>

          <!-- 📋 INFORMACIÓN DEL EVENTO -->
          <div class="info-evento">
            <div class="titulo-evento">
              {evento.titulo}
            </div>
            <div class="detalles-evento">
              <span class="tipo-evento" style="color: {obtenerColorEvento(evento.tipo_evento)}">
                {evento.tipo_evento}
              </span>
              <span class="separador">•</span>
              <span class="modalidad">
                {evento.modalidad === 'online' ? '🌐 Virtual' : '📍 Presencial'}
              </span>
            </div>
            {#if evento.instructor_nombre}
              <div class="instructor">
                <i class="fas fa-user"></i>
                {evento.instructor_nombre}
              </div>
            {/if}
          </div>

          <!-- ⏰ FECHA Y HORA -->
          <div class="fecha-evento">
            <div class="fecha-principal">
              {formatearFecha(evento.fecha_inicio)}
            </div>
            <div class="hora-evento">
              {formatearHora(evento.fecha_inicio)}
            </div>
            {#if estadoEvento === 'hoy'}
              <div class="badge-urgente">
                <i class="fas fa-clock"></i>
                Hoy
              </div>
            {:else if estadoEvento === 'pronto'}
              <div class="badge-proximo">
                <i class="fas fa-calendar"></i>
                Pronto
              </div>
            {/if}
          </div>

          <!-- ⚡ ACCIONES RÁPIDAS -->
          <div class="acciones-evento">
            <button class="accion-btn editar" title="Editar evento">
              <i class="fas fa-edit"></i>
            </button>
            <button class="accion-btn ver" title="Ver detalles">
              <i class="fas fa-eye"></i>
            </button>
            <button class="accion-btn participantes" title="Ver participantes">
              <i class="fas fa-users"></i>
            </button>
          </div>

        </div>
      {/each}
    {:else}
      <!-- 😴 SIN EVENTOS -->
      <div class="sin-eventos">
        <div class="icono-sin-eventos">
          <i class="fas fa-calendar-times"></i>
        </div>
        <h4>No hay eventos próximos</h4>
        <p>No hay actividades programadas para los próximos días</p>
        <button class="boton-crear-evento">
          <i class="fas fa-plus"></i>
          Crear primer evento
        </button>
      </div>
    {/if}
  </div>

  <!-- 🔗 PIE DE SECCIÓN -->
  <div class="pie-seccion">
    <button class="boton-ver-calendario">
      <i class="fas fa-calendar-alt"></i>
      Ver calendario completo
    </button>
  </div>

</div>

<style>
  /* 📊 CONTENEDOR PRINCIPAL */
  .contenedor-eventos {
    background: rgba(15, 23, 42, 0.8);
    border-radius: 20px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(20px);
    height: fit-content;
  }

  /* 🎯 ENCABEZADO */
  .encabezado-seccion {
    margin-bottom: 1.5rem;
  }

  .titulo-con-accion {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .titulo-con-accion h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: white;
  }

  .boton-crear {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    border: none;
    border-radius: 8px;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.3);
  }

  .boton-crear:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }

  .encabezado-seccion p {
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    font-size: 0.875rem;
  }

  /* 📋 LISTA DE EVENTOS */
  .lista-eventos {
    max-height: 450px;
    overflow-y: auto;
    padding-right: 0.5rem;
  }

  /* Scrollbar */
  .lista-eventos::-webkit-scrollbar {
    width: 4px;
  }

  .lista-eventos::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
  }

  .lista-eventos::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }

  /* 💫 ESTADO DE CARGA */
  .cargando-eventos {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #6366f1;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 📅 ITEMS DE EVENTOS */
  .item-evento {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    transition: all 0.3s ease;
  }

  .item-evento:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  .item-evento.urgente {
    background: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.3);
  }

  .item-evento.proximo {
    background: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.3);
  }

  /* 🎨 ICONO DEL EVENTO */
  .icono-evento {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  /* 📋 INFORMACIÓN DEL EVENTO */
  .info-evento {
    flex: 1;
  }

  .titulo-evento {
    font-weight: 600;
    color: white;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
    line-height: 1.3;
  }

  .detalles-evento {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .tipo-evento {
    font-weight: 500;
    text-transform: capitalize;
  }

  .separador {
    color: rgba(255, 255, 255, 0.3);
  }

  .modalidad {
    color: rgba(255, 255, 255, 0.6);
  }

  .instructor {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
  }

  /* ⏰ FECHA Y HORA */
  .fecha-evento {
    text-align: center;
    min-width: 80px;
  }

  .fecha-principal {
    font-weight: 600;
    color: white;
    font-size: 0.875rem;
    margin-bottom: 0.25rem;
  }

  .hora-evento {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 0.25rem;
  }

  .badge-urgente {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-content: center;
  }

  .badge-proximo {
    background: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
    padding: 0.125rem 0.5rem;
    border-radius: 4px;
    font-size: 0.625rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
    justify-content: center;
  }

  /* ⚡ ACCIONES */
  .acciones-evento {
    display: flex;
    gap: 0.25rem;
  }

  .accion-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    transition: all 0.3s ease;
  }

  .accion-btn:hover {
    background: rgba(99, 102, 241, 0.2);
    border-color: rgba(99, 102, 241, 0.4);
    color: #a5b4fc;
  }

  /* 😴 SIN EVENTOS */
  .sin-eventos {
    text-align: center;
    padding: 2rem 1rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .icono-sin-eventos {
    font-size: 2.5rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }

  .sin-eventos h4 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: rgba(255, 255, 255, 0.8);
  }

  .sin-eventos p {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
  }

  .boton-crear-evento {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .boton-crear-evento:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
  }

  /* 🔗 PIE DE SECCIÓN */
  .pie-seccion {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .boton-ver-calendario {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.75rem;
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.3s ease;
    justify-content: center;
  }

  .boton-ver-calendario:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .contenedor-eventos {
      padding: 1rem;
    }

    .item-evento {
      gap: 0.75rem;
      padding: 0.75rem;
    }

    .icono-evento {
      width: 40px;
      height: 40px;
      font-size: 1rem;
    }

    .acciones-evento {
      flex-direction: column;
      gap: 0.25rem;
    }

    .accion-btn {
      width: 24px;
      height: 24px;
    }

    .fecha-evento {
      min-width: 70px;
    }
  }
</style> 