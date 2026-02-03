<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';

  interface CampañaComunicacion {
    id: string;
    titulo: string;
    tipo: 'email' | 'whatsapp' | 'notificacion';
    estado: 'borrador' | 'programada' | 'enviada';
    destinatarios: number;
    fecha_creacion: string;
    fecha_programada?: string;
    fecha_enviada?: string;
    tasa_apertura?: number;
    tasa_respuesta?: number;
  }

  let campañas: CampañaComunicacion[] = [];
  let usuariosDisponibles: any[] = [];
  let cargando = false;
  let modalNuevaCampaña = false;

  // Formulario nueva campaña
  let nuevaCampaña = {
    titulo: '',
    tipo: 'email' as 'email' | 'whatsapp' | 'notificacion',
    mensaje: '',
    asunto: '',
    destinatarios: [] as string[],
    filtroDestinatarios: 'todos' as 'todos' | 'activos' | 'inactivos' | 'nuevos' | 'personalizado',
    fechaProgramada: '',
    horaEnvio: '09:00'
  };

  let estadisticasComunicacion = {
    totalCampañas: 0,
    emailsEnviados: 0,
    whatsappsEnviados: 0,
    notificacionesEnviadas: 0,
    tasaAperturaPromedio: 0,
    tasaRespuestaPromedio: 0
  };

  // Plantillas predefinidas
  const plantillasEmail = [
    {
      nombre: 'Bienvenida',
      asunto: '¡Bienvenido a Academia Vallenata Online! 🎵',
      contenido: `¡Hola [NOMBRE]!

¡Bienvenido a nuestra academia! Estamos emocionados de tenerte con nosotros.

🎵 **¿Qué puedes hacer ahora?**
• Explora nuestros cursos de acordeón
• Prueba el simulador interactivo
• Únete a nuestra comunidad

¡Empecemos tu viaje musical!

Saludos,
Equipo Academia Vallenata`
    },
    {
      nombre: 'Recordatorio Curso',
      asunto: '¡No olvides continuar tu curso! 📚',
      contenido: `¡Hola [NOMBRE]!

Notamos que no has visitado tu curso en unos días.

🎯 **Tu progreso:**
• Curso: [CURSO]
• Progreso: [PROGRESO]%
• Última lección: [LECCION]

¡Continúa aprendiendo y no pierdas el ritmo!

[ENLACE_CURSO]`
    },
    {
      nombre: 'Nuevo Contenido',
      asunto: '🎉 Nuevo contenido disponible en tu curso',
      contenido: `¡Hola [NOMBRE]!

¡Tenemos nuevo contenido para ti!

🆕 **Novedades:**
• [NUEVO_CONTENIDO]
• Ejercicios prácticos
• Partituras descargables

¡No te lo pierdas!

Ver ahora: [ENLACE]`
    }
  ];

  const plantillasWhatsApp = [
    {
      nombre: 'Recordatorio Amigable',
      contenido: `¡Hola [NOMBRE]! 👋

¿Cómo vas con el acordeón? Recuerda que tienes contenido nuevo esperándote en la academia.

¡Sigue practicando! 🎵`
    },
    {
      nombre: 'Motivacional',
      contenido: `¡[NOMBRE], no te rindas! 💪

Cada gran acordeonista empezó como principiante. Tu constancia es la clave del éxito.

¡Vamos, continúa con tu siguiente lección! 🎶`
    }
  ];

  onMount(() => {
    cargarDatosComunicacion();
  });

  async function cargarDatosComunicacion() {
    try {
      cargando = true;
      
      await Promise.all([
        cargarUsuariosDisponibles(),
        cargarCampañasExistentes(),
        calcularEstadisticas()
      ]);

    } catch (error) {
      console.error('❌ [COMUNICACIÓN] Error:', error);
    } finally {
      cargando = false;
    }
  }

  async function cargarUsuariosDisponibles() {
    const { data: usuarios } = await supabase
      .from('perfiles')
      .select(`
        id, nombre, apellido, correo_electronico, whatsapp, rol, created_at,
        sesiones_usuario!left(ultima_actividad, esta_activo)
      `)
      .eq('eliminado', false)
      .eq('rol', 'estudiante');

    usuariosDisponibles = usuarios?.map(u => ({
      ...u,
      nombre_completo: `${u.nombre} ${u.apellido}`,
      estado: u.sesiones_usuario?.[0]?.esta_activo ? 'activo' : 'inactivo',
      dias_registro: Math.floor((Date.now() - new Date(u.created_at).getTime()) / (1000 * 60 * 60 * 24))
    })) || [];
  }

  async function cargarCampañasExistentes() {
    // Simular campañas existentes (en implementación real vendría de BD)
    campañas = [
      {
        id: '1',
        titulo: 'Bienvenida Nuevos Estudiantes',
        tipo: 'email',
        estado: 'enviada',
        destinatarios: 45,
        fecha_creacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_enviada: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        tasa_apertura: 78.5,
        tasa_respuesta: 12.3
      },
      {
        id: '2',
        titulo: 'Recordatorio Práctica Semanal',
        tipo: 'whatsapp',
        estado: 'programada',
        destinatarios: 89,
        fecha_creacion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fecha_programada: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        titulo: 'Nuevo Curso Disponible',
        tipo: 'notificacion',
        estado: 'borrador',
        destinatarios: 156,
        fecha_creacion: new Date().toISOString()
      }
    ];
  }

  async function calcularEstadisticas() {
    estadisticasComunicacion = {
      totalCampañas: campañas.length,
      emailsEnviados: campañas.filter(c => c.tipo === 'email' && c.estado === 'enviada').reduce((sum, c) => sum + c.destinatarios, 0),
      whatsappsEnviados: campañas.filter(c => c.tipo === 'whatsapp' && c.estado === 'enviada').reduce((sum, c) => sum + c.destinatarios, 0),
      notificacionesEnviadas: campañas.filter(c => c.tipo === 'notificacion' && c.estado === 'enviada').reduce((sum, c) => sum + c.destinatarios, 0),
      tasaAperturaPromedio: campañas.filter(c => c.tasa_apertura).reduce((sum, c) => sum + (c.tasa_apertura || 0), 0) / campañas.filter(c => c.tasa_apertura).length || 0,
      tasaRespuestaPromedio: campañas.filter(c => c.tasa_respuesta).reduce((sum, c) => sum + (c.tasa_respuesta || 0), 0) / campañas.filter(c => c.tasa_respuesta).length || 0
    };
  }

  function filtrarUsuarios() {
    switch (nuevaCampaña.filtroDestinatarios) {
      case 'activos':
        return usuariosDisponibles.filter(u => u.estado === 'activo');
      case 'inactivos':
        return usuariosDisponibles.filter(u => u.estado === 'inactivo');
      case 'nuevos':
        return usuariosDisponibles.filter(u => u.dias_registro <= 7);
      case 'personalizado':
        return usuariosDisponibles.filter(u => nuevaCampaña.destinatarios.includes(u.id));
      default:
        return usuariosDisponibles;
    }
  }

  function aplicarPlantilla(plantilla: any) {
    if (nuevaCampaña.tipo === 'email') {
      nuevaCampaña.asunto = plantilla.asunto;
      nuevaCampaña.mensaje = plantilla.contenido;
    } else {
      nuevaCampaña.mensaje = plantilla.contenido;
    }
  }

  async function enviarCampaña() {
    try {
      const destinatariosFiltrados = filtrarUsuarios();
      
      if (destinatariosFiltrados.length === 0) {
        alert('❌ No hay destinatarios válidos para esta campaña');
        return;
      }

      // Validaciones
      if (!nuevaCampaña.titulo.trim()) {
        alert('❌ El título es obligatorio');
        return;
      }

      if (!nuevaCampaña.mensaje.trim()) {
        alert('❌ El mensaje es obligatorio');
        return;
      }

      if (nuevaCampaña.tipo === 'email' && !nuevaCampaña.asunto.trim()) {
        alert('❌ El asunto es obligatorio para emails');
        return;
      }

      // Simular envío
      console.log('📧 [COMUNICACIÓN] Enviando campaña...', {
        titulo: nuevaCampaña.titulo,
        tipo: nuevaCampaña.tipo,
        destinatarios: destinatariosFiltrados.length,
        programada: nuevaCampaña.fechaProgramada ? true : false
      });

      // Crear nueva campaña
      const nuevaCampañaObj: CampañaComunicacion = {
        id: Date.now().toString(),
        titulo: nuevaCampaña.titulo,
        tipo: nuevaCampaña.tipo,
        estado: nuevaCampaña.fechaProgramada ? 'programada' : 'enviada',
        destinatarios: destinatariosFiltrados.length,
        fecha_creacion: new Date().toISOString(),
        fecha_programada: nuevaCampaña.fechaProgramada ? new Date(nuevaCampaña.fechaProgramada + 'T' + nuevaCampaña.horaEnvio).toISOString() : undefined,
        fecha_enviada: !nuevaCampaña.fechaProgramada ? new Date().toISOString() : undefined,
        tasa_apertura: !nuevaCampaña.fechaProgramada ? Math.random() * 30 + 60 : undefined, // Simulado
        tasa_respuesta: !nuevaCampaña.fechaProgramada ? Math.random() * 20 + 5 : undefined // Simulado
      };

      campañas = [nuevaCampañaObj, ...campañas];
      
      // Resetear formulario
      nuevaCampaña = {
        titulo: '',
        tipo: 'email',
        mensaje: '',
        asunto: '',
        destinatarios: [],
        filtroDestinatarios: 'todos',
        fechaProgramada: '',
        horaEnvio: '09:00'
      };

      modalNuevaCampaña = false;
      
      await calcularEstadisticas();

      alert(`✅ Campaña ${nuevaCampañaObj.estado === 'programada' ? 'programada' : 'enviada'} exitosamente a ${destinatariosFiltrados.length} usuarios`);

    } catch (error) {
      console.error('❌ [COMUNICACIÓN] Error enviando campaña:', error);
      alert('❌ Error al enviar la campaña');
    }
  }

  function obtenerIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'email': return '📧';
      case 'whatsapp': return '💬';
      case 'notificacion': return '🔔';
      default: return '📨';
    }
  }

  function obtenerColorEstado(estado: string): string {
    switch (estado) {
      case 'enviada': return '#10b981';
      case 'programada': return '#f59e0b';
      case 'borrador': return '#6b7280';
      default: return '#6b7280';
    }
  }

  function formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function exportarListaUsuarios() {
    const usuariosFiltrados = filtrarUsuarios();
    const csv = ['Nombre,Email,WhatsApp,Estado,Días Registro']
      .concat(usuariosFiltrados.map(u => 
        `"${u.nombre_completo}","${u.correo_electronico}","${u.whatsapp || 'N/A'}","${u.estado}",${u.dias_registro}`
      ))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_comunicacion_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
</script>

<div class="pestaña-comunicaciones">
  <div class="encabezado-pestaña">
    <div class="header-content">
      <div class="header-text">
        <h2>📢 Comunicaciones</h2>
        <p>Gestiona emails, WhatsApp y notificaciones para tus estudiantes</p>
      </div>
      <button class="btn-nueva-campaña" on:click={() => modalNuevaCampaña = true}>
        <i class="fas fa-plus"></i>
        Nueva Campaña
      </button>
    </div>
  </div>

  <!-- ESTADÍSTICAS DE COMUNICACIÓN -->
  <div class="estadisticas-comunicacion">
    <div class="stat-card">
      <div class="stat-icono">📈</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasComunicacion.totalCampañas}</div>
        <div class="stat-label">Total Campañas</div>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-icono">📧</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasComunicacion.emailsEnviados}</div>
        <div class="stat-label">Emails Enviados</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icono">💬</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasComunicacion.whatsappsEnviados}</div>
        <div class="stat-label">WhatsApps Enviados</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icono">🔔</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasComunicacion.notificacionesEnviadas}</div>
        <div class="stat-label">Notificaciones</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icono">👁️</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasComunicacion.tasaAperturaPromedio.toFixed(1)}%</div>
        <div class="stat-label">Tasa Apertura</div>
      </div>
    </div>

    <div class="stat-card">
      <div class="stat-icono">💬</div>
      <div class="stat-info">
        <div class="stat-numero">{estadisticasComunicacion.tasaRespuestaPromedio.toFixed(1)}%</div>
        <div class="stat-label">Tasa Respuesta</div>
      </div>
    </div>
  </div>

  <div class="contenido-comunicaciones">
    <!-- LISTA DE CAMPAÑAS -->
    <div class="seccion-campañas">
      <div class="campañas-header">
        <h3>📋 Campañas Recientes</h3>
        <button class="btn-actualizar" on:click={cargarDatosComunicacion} disabled={cargando}>
          <i class="fas fa-sync-alt" class:girando={cargando}></i>
          Actualizar
        </button>
      </div>

      {#if cargando}
        <div class="loading-campañas">
          <div class="spinner"></div>
          <p>Cargando campañas...</p>
        </div>
      {:else if campañas.length === 0}
        <div class="sin-campañas">
          📢 No hay campañas aún. ¡Crea tu primera campaña!
        </div>
      {:else}
        <div class="lista-campañas">
          {#each campañas as campaña}
            <div class="campaña-card">
              <div class="campaña-header">
                <div class="campaña-titulo">
                  {obtenerIconoTipo(campaña.tipo)} {campaña.titulo}
                </div>
                <div class="campaña-estado" style="background-color: {obtenerColorEstado(campaña.estado)}20; color: {obtenerColorEstado(campaña.estado)}">
                  {campaña.estado}
                </div>
              </div>
              
              <div class="campaña-info">
                <div class="info-item">
                  <span class="info-label">Destinatarios:</span>
                  <span class="info-valor">{campaña.destinatarios}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Creada:</span>
                  <span class="info-valor">{formatearFecha(campaña.fecha_creacion)}</span>
                </div>
                {#if campaña.fecha_enviada}
                  <div class="info-item">
                    <span class="info-label">Enviada:</span>
                    <span class="info-valor">{formatearFecha(campaña.fecha_enviada)}</span>
                  </div>
                {/if}
                {#if campaña.fecha_programada}
                  <div class="info-item">
                    <span class="info-label">Programada:</span>
                    <span class="info-valor">{formatearFecha(campaña.fecha_programada)}</span>
                  </div>
                {/if}
              </div>

              {#if campaña.tasa_apertura || campaña.tasa_respuesta}
                <div class="campaña-metricas">
                  {#if campaña.tasa_apertura}
                    <div class="metrica-item">
                      <span class="metrica-valor">{campaña.tasa_apertura.toFixed(1)}%</span>
                      <span class="metrica-label">Apertura</span>
                    </div>
                  {/if}
                  {#if campaña.tasa_respuesta}
                    <div class="metrica-item">
                      <span class="metrica-valor">{campaña.tasa_respuesta.toFixed(1)}%</span>
                      <span class="metrica-label">Respuesta</span>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- ACCIONES RÁPIDAS -->
    <div class="seccion-acciones-rapidas">
      <h3>⚡ Acciones Rápidas</h3>
      
      <div class="acciones-lista">
        <button class="accion-card" on:click={() => modalNuevaCampaña = true}>
          <div class="accion-icono">📧</div>
          <div class="accion-info">
            <div class="accion-titulo">Email Masivo</div>
            <div class="accion-descripcion">Enviar email a todos los estudiantes</div>
          </div>
        </button>

        <button class="accion-card" on:click={() => { nuevaCampaña.tipo = 'whatsapp'; modalNuevaCampaña = true; }}>
          <div class="accion-icono">💬</div>
          <div class="accion-info">
            <div class="accion-titulo">WhatsApp Masivo</div>
            <div class="accion-descripcion">Enviar mensaje por WhatsApp</div>
          </div>
        </button>

        <button class="accion-card" on:click={() => { nuevaCampaña.filtroDestinatarios = 'inactivos'; modalNuevaCampaña = true; }}>
          <div class="accion-icono">🎯</div>
          <div class="accion-info">
            <div class="accion-titulo">Reactivar Inactivos</div>
            <div class="accion-descripcion">Contactar usuarios inactivos</div>
          </div>
        </button>

        <button class="accion-card" on:click={exportarListaUsuarios}>
          <div class="accion-icono">📊</div>
          <div class="accion-info">
            <div class="accion-titulo">Exportar Contactos</div>
            <div class="accion-descripcion">Descargar lista de usuarios</div>
          </div>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- MODAL NUEVA CAMPAÑA -->
{#if modalNuevaCampaña}
  <div class="modal-overlay" on:click={() => modalNuevaCampaña = false}>
    <div class="modal-nueva-campaña" on:click|stopPropagation>
      <div class="modal-header">
        <h3>📢 Nueva Campaña de Comunicación</h3>
        <button class="btn-cerrar" on:click={() => modalNuevaCampaña = false}>
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="modal-contenido">
        <!-- CONFIGURACIÓN BÁSICA -->
        <div class="seccion-formulario">
          <h4>📋 Configuración Básica</h4>
          
          <div class="campo-formulario">
            <label for="titulo">Título de la Campaña</label>
            <input id="titulo" type="text" bind:value={nuevaCampaña.titulo} placeholder="Ej: Bienvenida nuevos estudiantes">
          </div>

          <div class="campo-formulario">
            <label for="tipo">Tipo de Comunicación</label>
            <select id="tipo" bind:value={nuevaCampaña.tipo}>
              <option value="email">📧 Email</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="notificacion">🔔 Notificación</option>
            </select>
          </div>

          {#if nuevaCampaña.tipo === 'email'}
            <div class="campo-formulario">
              <label for="asunto">Asunto del Email</label>
              <input id="asunto" type="text" bind:value={nuevaCampaña.asunto} placeholder="Ej: ¡Bienvenido a Academia Vallenata!">
            </div>
          {/if}
        </div>

        <!-- DESTINATARIOS -->
        <div class="seccion-formulario">
          <h4>👥 Destinatarios ({filtrarUsuarios().length} usuarios)</h4>
          
          <div class="campo-formulario">
            <label for="filtro">Filtrar Destinatarios</label>
            <select id="filtro" bind:value={nuevaCampaña.filtroDestinatarios}>
              <option value="todos">Todos los usuarios ({usuariosDisponibles.length})</option>
              <option value="activos">Solo usuarios activos ({usuariosDisponibles.filter(u => u.estado === 'activo').length})</option>
              <option value="inactivos">Solo usuarios inactivos ({usuariosDisponibles.filter(u => u.estado === 'inactivo').length})</option>
              <option value="nuevos">Usuarios nuevos (últimos 7 días) ({usuariosDisponibles.filter(u => u.dias_registro <= 7).length})</option>
            </select>
          </div>
        </div>

        <!-- PLANTILLAS -->
        <div class="seccion-formulario">
          <h4>📝 Plantillas Rápidas</h4>
          <div class="plantillas-lista">
            {#if nuevaCampaña.tipo === 'email'}
              {#each plantillasEmail as plantilla}
                <button class="btn-plantilla" on:click={() => aplicarPlantilla(plantilla)}>
                  {plantilla.nombre}
                </button>
              {/each}
            {:else if nuevaCampaña.tipo === 'whatsapp'}
              {#each plantillasWhatsApp as plantilla}
                <button class="btn-plantilla" on:click={() => aplicarPlantilla(plantilla)}>
                  {plantilla.nombre}
                </button>
              {/each}
            {/if}
          </div>
        </div>

        <!-- MENSAJE -->
        <div class="seccion-formulario">
          <h4>✍️ Contenido del Mensaje</h4>
          <div class="campo-formulario">
            <label for="mensaje">Mensaje</label>
            <textarea 
              id="mensaje" 
              bind:value={nuevaCampaña.mensaje} 
              rows="8"
              placeholder="Escribe tu mensaje aquí... Puedes usar [NOMBRE] para personalizar"
            ></textarea>
            <small>Variables disponibles: [NOMBRE], [CURSO], [PROGRESO], [LECCION]</small>
          </div>
        </div>

        <!-- PROGRAMACIÓN -->
        <div class="seccion-formulario">
          <h4>⏰ Programación (Opcional)</h4>
          <div class="campos-programacion">
            <div class="campo-formulario">
              <label for="fecha">Fecha de Envío</label>
              <input id="fecha" type="date" bind:value={nuevaCampaña.fechaProgramada}>
            </div>
            <div class="campo-formulario">
              <label for="hora">Hora de Envío</label>
              <input id="hora" type="time" bind:value={nuevaCampaña.horaEnvio}>
            </div>
          </div>
          <small>Déjalo vacío para enviar inmediatamente</small>
        </div>
      </div>

      <div class="modal-acciones">
        <button class="btn-cancelar" on:click={() => modalNuevaCampaña = false}>
          Cancelar
        </button>
        <button class="btn-enviar" on:click={enviarCampaña}>
          {nuevaCampaña.fechaProgramada ? '⏰ Programar' : '🚀 Enviar Ahora'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .pestaña-comunicaciones {
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

  .header-text h2 {
    margin: 0 0 0.5rem 0;
    color: white;
    font-size: 1.5rem;
    font-weight: 600;
  }

  .header-text p {
    margin: 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .btn-nueva-campaña {
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

  .btn-nueva-campaña:hover {
    background: rgba(34, 197, 94, 0.3);
    border-color: rgba(34, 197, 94, 0.5);
    transform: translateY(-1px);
  }

  /* ESTADÍSTICAS */
  .estadisticas-comunicacion {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.2s ease;
  }

  .stat-card:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
  }

  .stat-icono {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .stat-numero {
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    margin-bottom: 0.25rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    font-weight: 500;
  }

  /* CONTENIDO */
  .contenido-comunicaciones {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 2rem;
  }

  /* CAMPAÑAS */
  .seccion-campañas {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .campañas-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .campañas-header h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }

  .btn-actualizar {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .btn-actualizar:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .btn-actualizar:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .girando {
    animation: girar 1s linear infinite;
  }

  .lista-campañas {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-height: 500px;
    overflow-y: auto;
  }

  .campaña-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.2s ease;
  }

  .campaña-card:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }

  .campaña-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .campaña-titulo {
    color: white;
    font-weight: 600;
    font-size: 1rem;
  }

  .campaña-estado {
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  .campaña-info {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
  }

  .info-label {
    color: rgba(255, 255, 255, 0.7);
  }

  .info-valor {
    color: white;
    font-weight: 500;
  }

  .campaña-metricas {
    display: flex;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .metrica-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .metrica-valor {
    color: #10b981;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .metrica-label {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.75rem;
  }

  /* ACCIONES RÁPIDAS */
  .seccion-acciones-rapidas h3 {
    margin: 0 0 1.5rem 0;
    color: white;
    font-size: 1.1rem;
  }

  .acciones-lista {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .accion-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 1rem;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
  }

  .accion-card:hover {
    background: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  .accion-icono {
    font-size: 1.5rem;
    opacity: 0.8;
  }

  .accion-titulo {
    font-weight: 600;
    color: white;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }

  .accion-descripcion {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
  }

  /* MODAL */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal-nueva-campaña {
    background: rgba(15, 23, 42, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    backdrop-filter: blur(20px);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .modal-header h3 {
    margin: 0;
    color: white;
    font-size: 1.2rem;
  }

  .btn-cerrar {
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .btn-cerrar:hover {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .modal-contenido {
    padding: 1.5rem;
  }

  .seccion-formulario {
    margin-bottom: 2rem;
  }

  .seccion-formulario h4 {
    margin: 0 0 1rem 0;
    color: white;
    font-size: 1rem;
    font-weight: 600;
  }

  .campo-formulario {
    margin-bottom: 1rem;
  }

  .campo-formulario label {
    display: block;
    color: white;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
  }

  .campo-formulario input,
  .campo-formulario select,
  .campo-formulario textarea {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 0.75rem;
    color: white;
    font-size: 0.85rem;
    resize: vertical;
  }

  .campo-formulario input:focus,
  .campo-formulario select:focus,
  .campo-formulario textarea:focus {
    outline: none;
    border-color: #8b5cf6;
    background: rgba(255, 255, 255, 0.15);
  }

  .campo-formulario input::placeholder,
  .campo-formulario textarea::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .campo-formulario small {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    margin-top: 0.25rem;
    display: block;
  }

  .campos-programacion {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .plantillas-lista {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn-plantilla {
    background: rgba(139, 92, 246, 0.2);
    color: #a78bfa;
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.8rem;
  }

  .btn-plantilla:hover {
    background: rgba(139, 92, 246, 0.3);
  }

  .modal-acciones {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    padding: 1.5rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-cancelar,
  .btn-enviar {
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .btn-cancelar {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .btn-cancelar:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .btn-enviar {
    background: rgba(34, 197, 94, 0.2);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }

  .btn-enviar:hover {
    background: rgba(34, 197, 94, 0.3);
  }

  .loading-campañas {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.7);
  }

  .sin-campañas {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.5);
    font-size: 1rem;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.1);
    border-top: 3px solid #8b5cf6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
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

  @keyframes girar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* RESPONSIVE */
  @media (max-width: 1400px) {
    .estadisticas-comunicacion {
      grid-template-columns: repeat(3, 1fr);
    }

    .contenido-comunicaciones {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }
  }

  @media (max-width: 900px) {
    .estadisticas-comunicacion {
      grid-template-columns: repeat(2, 1fr);
    }

    .header-content {
      flex-direction: column;
      gap: 1rem;
    }

    .modal-nueva-campaña {
      width: 95%;
      margin: 1rem;
    }

    .campos-programacion {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 600px) {
    .estadisticas-comunicacion {
      grid-template-columns: 1fr;
    }

    .campaña-info {
      grid-template-columns: 1fr;
    }

    .modal-acciones {
      flex-direction: column;
    }
  }
</style> 