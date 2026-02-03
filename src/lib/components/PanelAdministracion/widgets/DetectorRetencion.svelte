<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabase/clienteSupabase';
  
  interface UsuarioEnRiesgo {
    id: string;
    nombre: string;
    apellido: string;
    correo_electronico: string;
    suscripcion: string;
    puntuacionRiesgo: number;
    motivos: string[];
    ultimaActividad: string;
    diasInactivo: number;
    cursosCompletados: number;
    progresoPromedio: number;
    url_foto_perfil?: string;
  }

  let usuariosEnRiesgo: UsuarioEnRiesgo[] = [];
  let cargando = false;
  let mostrarDetalle = false;
  let estadisticas = {
    totalEnRiesgo: 0,
    riesgoAlto: 0,
    riesgoMedio: 0,
    riesgoBajo: 0
  };

  onMount(() => {
    detectarUsuariosEnRiesgo();
  });

  async function detectarUsuariosEnRiesgo() {
    try {
      cargando = true;
      console.log('🎯 [RETENCIÓN] Iniciando análisis de riesgo...');
      
      // 1️⃣ OBTENER DATOS BASE DE USUARIOS
      const { data: usuarios } = await supabase
        .from('perfiles')
        .select(`
          id, nombre, apellido, correo_electronico, suscripcion, 
          url_foto_perfil, created_at
        `)
        .eq('rol', 'estudiante')
        .eq('eliminado', false);

      if (!usuarios) return;

      // 2️⃣ OBTENER DATOS DE ACTIVIDAD Y PROGRESO
      const usuariosConRiesgo: UsuarioEnRiesgo[] = [];
      
      for (const usuario of usuarios) {
        const riesgoData = await calcularRiesgoUsuario(usuario);
        if (riesgoData.puntuacionRiesgo >= 30) { // Solo usuarios con riesgo significativo
          usuariosConRiesgo.push(riesgoData);
        }
      }

      // 3️⃣ ORDENAR POR PUNTUACIÓN DE RIESGO
      usuariosEnRiesgo = usuariosConRiesgo
        .sort((a, b) => b.puntuacionRiesgo - a.puntuacionRiesgo)
        .slice(0, 20); // Top 20 usuarios en riesgo

      // 4️⃣ CALCULAR ESTADÍSTICAS
      calcularEstadisticas();
      
      console.log(`✅ [RETENCIÓN] ${usuariosEnRiesgo.length} usuarios en riesgo detectados`);
      
    } catch (error) {
      console.error('❌ [RETENCIÓN] Error:', error);
    } finally {
      cargando = false;
    }
  }

  async function calcularRiesgoUsuario(usuario: any): Promise<UsuarioEnRiesgo> {
    let puntuacionRiesgo = 0;
    const motivos: string[] = [];
    
    // 📅 ACTIVIDAD RECIENTE
    const { data: sesionReciente } = await supabase
      .from('sesiones_usuario')
      .select('ultima_actividad, tiempo_total_minutos, sesiones_totales')
      .eq('usuario_id', usuario.id)
      .order('ultima_actividad', { ascending: false })
      .limit(1)
      .single();

    let ultimaActividad = sesionReciente?.ultima_actividad || usuario.created_at;
    let diasInactivo = Math.floor((Date.now() - new Date(ultimaActividad).getTime()) / (1000 * 60 * 60 * 24));
    
    // 🚨 FACTORES DE RIESGO

    // 1. Inactividad prolongada
    if (diasInactivo > 14) {
      puntuacionRiesgo += 40;
      motivos.push(`${diasInactivo} días sin actividad`);
    } else if (diasInactivo > 7) {
      puntuacionRiesgo += 25;
      motivos.push(`${diasInactivo} días inactivo`);
    } else if (diasInactivo > 3) {
      puntuacionRiesgo += 15;
      motivos.push(`${diasInactivo} días sin entrar`);
    }

    // 2. Bajo tiempo total de uso
    const tiempoTotal = sesionReciente?.tiempo_total_minutos || 0;
    if (tiempoTotal < 30) {
      puntuacionRiesgo += 25;
      motivos.push('Muy poco tiempo en plataforma');
    } else if (tiempoTotal < 120) {
      puntuacionRiesgo += 15;
      motivos.push('Bajo tiempo de uso');
    }

    // 3. Progreso en cursos
    const { data: inscripciones } = await supabase
      .from('inscripciones')
      .select('porcentaje_completado, completado')
      .eq('usuario_id', usuario.id);

    let cursosCompletados = 0;
    let progresoPromedio = 0;
    
    if (inscripciones && inscripciones.length > 0) {
      cursosCompletados = inscripciones.filter(i => i.completado).length;
      progresoPromedio = Math.round(
        inscripciones.reduce((sum, i) => sum + (i.porcentaje_completado || 0), 0) / inscripciones.length
      );
      
      if (cursosCompletados === 0 && inscripciones.length > 0) {
        puntuacionRiesgo += 20;
        motivos.push('No ha completado ningún curso');
      }
      
      if (progresoPromedio < 10) {
        puntuacionRiesgo += 15;
        motivos.push('Progreso muy bajo en cursos');
      }
    } else {
      puntuacionRiesgo += 30;
      motivos.push('No está inscrito en ningún curso');
    }

    // 4. Usuario nuevo sin engagement
    const diasRegistrado = Math.floor((Date.now() - new Date(usuario.created_at).getTime()) / (1000 * 60 * 60 * 24));
    if (diasRegistrado < 7 && (sesionReciente?.sesiones_totales || 0) <= 1) {
      puntuacionRiesgo += 20;
      motivos.push('Usuario nuevo sin engagement');
    }

    // 5. Suscripción y valor
    if (usuario.suscripcion === 'premium' && puntuacionRiesgo > 20) {
      puntuacionRiesgo += 10; // Mayor riesgo si es premium
      motivos.push('Cliente premium en riesgo');
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo_electronico: usuario.correo_electronico,
      suscripcion: usuario.suscripcion,
      puntuacionRiesgo: Math.min(puntuacionRiesgo, 100), // Máximo 100
      motivos,
      ultimaActividad,
      diasInactivo,
      cursosCompletados,
      progresoPromedio,
      url_foto_perfil: usuario.url_foto_perfil
    };
  }

  function calcularEstadisticas() {
    estadisticas.totalEnRiesgo = usuariosEnRiesgo.length;
    estadisticas.riesgoAlto = usuariosEnRiesgo.filter(u => u.puntuacionRiesgo >= 70).length;
    estadisticas.riesgoMedio = usuariosEnRiesgo.filter(u => u.puntuacionRiesgo >= 50 && u.puntuacionRiesgo < 70).length;
    estadisticas.riesgoBajo = usuariosEnRiesgo.filter(u => u.puntuacionRiesgo < 50).length;
  }

  function obtenerColorRiesgo(puntuacion: number): string {
    if (puntuacion >= 70) return '#ef4444'; // Rojo
    if (puntuacion >= 50) return '#f59e0b'; // Amarillo
    return '#6b7280'; // Gris
  }

  function obtenerNivelRiesgo(puntuacion: number): string {
    if (puntuacion >= 70) return 'ALTO';
    if (puntuacion >= 50) return 'MEDIO';
    return 'BAJO';
  }

  function toggleDetalle() {
    mostrarDetalle = !mostrarDetalle;
  }

  function contactarUsuario(usuario: UsuarioEnRiesgo) {
    // Preparar mensaje personalizado
    const mensaje = `Hola ${usuario.nombre}, hemos notado que llevas ${usuario.diasInactivo} días sin conectarte. ¿Te podemos ayudar con algo?`;
    
    // Abrir WhatsApp o email
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
    
    console.log('📞 [CONTACTO] Usuario contactado:', usuario.nombre);
  }

  function verPerfilCompleto(usuarioId: string) {
    // Navegar a perfil completo
    window.open(`/administrador/usuarios?usuario=${usuarioId}&pestana=actividad`, '_blank');
  }
</script>

<div class="detector-retencion">
  <div class="detector-header">
    <div class="header-info">
      <h3>🎯 Detector de Retención</h3>
      <p>Usuarios en riesgo de abandono</p>
    </div>
    <div class="header-actions">
      <button class="btn-refresh" on:click={detectarUsuariosEnRiesgo} disabled={cargando}>
        <i class="fas fa-sync-alt" class:girando={cargando}></i>
      </button>
      <button class="btn-toggle-detalle" on:click={toggleDetalle}>
        <i class="fas fa-{mostrarDetalle ? 'eye-slash' : 'eye'}"></i>
        {mostrarDetalle ? 'Ocultar' : 'Ver Todos'}
      </button>
    </div>
  </div>

  <!-- 📊 ESTADÍSTICAS RÁPIDAS -->
  <div class="estadisticas-riesgo">
    <div class="stat-riesgo total">
      <span class="stat-numero">{estadisticas.totalEnRiesgo}</span>
      <span class="stat-label">Total en Riesgo</span>
    </div>
    <div class="stat-riesgo alto">
      <span class="stat-numero">{estadisticas.riesgoAlto}</span>
      <span class="stat-label">Riesgo Alto</span>
    </div>
    <div class="stat-riesgo medio">
      <span class="stat-numero">{estadisticas.riesgoMedio}</span>
      <span class="stat-label">Riesgo Medio</span>
    </div>
    <div class="stat-riesgo bajo">
      <span class="stat-numero">{estadisticas.riesgoBajo}</span>
      <span class="stat-label">Riesgo Bajo</span>
    </div>
  </div>

  {#if cargando}
    <div class="loading-detectando">
      <div class="spinner"></div>
      <p>Analizando patrones de riesgo...</p>
    </div>
  {:else if usuariosEnRiesgo.length === 0}
    <div class="sin-riesgo">
      ✅ ¡Excelente! No se detectaron usuarios en riesgo alto
    </div>
  {:else}
    
    <!-- 🔴 VISTA COMPACTA (primeros 5) -->
    {#if !mostrarDetalle}
      <div class="usuarios-compactos">
        {#each usuariosEnRiesgo.slice(0, 5) as usuario}
          <div class="usuario-compacto" style="border-left-color: {obtenerColorRiesgo(usuario.puntuacionRiesgo)}">
            <div class="usuario-info-compacto">
              <div class="foto-y-nombre">
                {#if usuario.url_foto_perfil}
                  <img src={usuario.url_foto_perfil} alt={usuario.nombre} class="foto-mini" />
                {:else}
                  <div class="avatar-mini">
                    <i class="fas fa-user"></i>
                  </div>
                {/if}
                <div>
                  <strong>{usuario.nombre} {usuario.apellido}</strong>
                  <div class="nivel-riesgo" style="color: {obtenerColorRiesgo(usuario.puntuacionRiesgo)}">
                    {obtenerNivelRiesgo(usuario.puntuacionRiesgo)} ({usuario.puntuacionRiesgo}%)
                  </div>
                </div>
              </div>
              <div class="acciones-rapidas">
                <button class="btn-accion-mini" on:click={() => contactarUsuario(usuario)}>
                  <i class="fas fa-comment"></i>
                </button>
                <button class="btn-accion-mini" on:click={() => verPerfilCompleto(usuario.id)}>
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <div class="motivos-mini">
              {usuario.motivos[0]} {usuario.motivos.length > 1 ? `+${usuario.motivos.length - 1} más` : ''}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      
      <!-- 📋 VISTA DETALLADA -->
      <div class="usuarios-detalle">
        {#each usuariosEnRiesgo as usuario}
          <div class="usuario-detalle">
            <div class="usuario-header">
              <div class="usuario-foto-info">
                {#if usuario.url_foto_perfil}
                  <img src={usuario.url_foto_perfil} alt={usuario.nombre} class="foto-perfil" />
                {:else}
                  <div class="avatar-default">
                    <i class="fas fa-user"></i>
                  </div>
                {/if}
                <div class="usuario-datos">
                  <h4>{usuario.nombre} {usuario.apellido}</h4>
                  <p class="email">{usuario.correo_electronico}</p>
                  <div class="badges">
                    <span class="badge-suscripcion {usuario.suscripcion}">
                      {usuario.suscripcion?.toUpperCase()}
                    </span>
                    <span 
                      class="badge-riesgo" 
                      style="background-color: {obtenerColorRiesgo(usuario.puntuacionRiesgo)}20; color: {obtenerColorRiesgo(usuario.puntuacionRiesgo)}"
                    >
                      {obtenerNivelRiesgo(usuario.puntuacionRiesgo)} {usuario.puntuacionRiesgo}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="usuario-acciones">
                <button class="btn-contactar" on:click={() => contactarUsuario(usuario)}>
                  <i class="fas fa-comment-dots"></i>
                  Contactar
                </button>
                <button class="btn-ver-perfil" on:click={() => verPerfilCompleto(usuario.id)}>
                  <i class="fas fa-user-circle"></i>
                  Ver Perfil
                </button>
              </div>
            </div>

            <div class="usuario-metricas">
              <div class="metrica">
                <span class="metrica-label">Días Inactivo:</span>
                <span class="metrica-valor">{usuario.diasInactivo}</span>
              </div>
              <div class="metrica">
                <span class="metrica-label">Cursos Completados:</span>
                <span class="metrica-valor">{usuario.cursosCompletados}</span>
              </div>
              <div class="metrica">
                <span class="metrica-label">Progreso Promedio:</span>
                <span class="metrica-valor">{usuario.progresoPromedio}%</span>
              </div>
            </div>

            <div class="motivos-riesgo">
              <strong>Motivos de riesgo:</strong>
              <ul>
                {#each usuario.motivos as motivo}
                  <li>{motivo}</li>
                {/each}
              </ul>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .detector-retencion {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .detector-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }

  .header-info h3 {
    margin: 0;
    color: white;
    font-size: 1.1rem;
  }

  .header-info p {
    margin: 0.25rem 0 0 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.85rem;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .btn-refresh, .btn-toggle-detalle {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    padding: 0.5rem 1rem;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.85rem;
  }

  .btn-refresh:hover, .btn-toggle-detalle:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .girando {
    animation: girar 1s linear infinite;
  }

  .estadisticas-riesgo {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .stat-riesgo {
    text-align: center;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  .stat-riesgo.total { border-left: 4px solid #8b5cf6; }
  .stat-riesgo.alto { border-left: 4px solid #ef4444; }
  .stat-riesgo.medio { border-left: 4px solid #f59e0b; }
  .stat-riesgo.bajo { border-left: 4px solid #6b7280; }

  .stat-numero {
    display: block;
    font-size: 1.5rem;
    font-weight: 600;
    color: white;
  }

  .stat-label {
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .loading-detectando {
    text-align: center;
    padding: 3rem;
    color: rgba(255, 255, 255, 0.7);
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

  .sin-riesgo {
    text-align: center;
    padding: 2rem;
    color: #10b981;
    font-size: 1rem;
  }

  /* VISTA COMPACTA */
  .usuarios-compactos {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .usuario-compacto {
    border-left: 4px solid;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    padding: 1rem;
  }

  .usuario-info-compacto {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .foto-y-nombre {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .foto-mini, .avatar-mini {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .avatar-mini {
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
  }

  .nivel-riesgo {
    font-size: 0.75rem;
    font-weight: 500;
  }

  .acciones-rapidas {
    display: flex;
    gap: 0.5rem;
  }

  .btn-accion-mini {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 6px;
    width: 32px;
    height: 32px;
    color: white;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-accion-mini:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .motivos-mini {
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.7);
  }

  /* VISTA DETALLADA */
  .usuarios-detalle {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .usuario-detalle {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    padding: 1.5rem;
  }

  .usuario-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .usuario-foto-info {
    display: flex;
    gap: 1rem;
  }

  .foto-perfil, .avatar-default {
    width: 50px;
    height: 50px;
    border-radius: 50%;
  }

  .avatar-default {
    background: rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
  }

  .usuario-datos h4 {
    margin: 0;
    color: white;
    font-size: 1rem;
  }

  .email {
    margin: 0.25rem 0;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.85rem;
  }

  .badges {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .badge-suscripcion, .badge-riesgo {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 500;
  }

  .badge-suscripcion.premium {
    background: rgba(139, 92, 246, 0.2);
    color: #8b5cf6;
  }

  .badge-suscripcion.free {
    background: rgba(107, 114, 128, 0.2);
    color: #9ca3af;
  }

  .usuario-acciones {
    display: flex;
    gap: 0.75rem;
  }

  .btn-contactar, .btn-ver-perfil {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .btn-contactar {
    background: #10b981;
    color: white;
  }

  .btn-contactar:hover {
    background: #059669;
  }

  .btn-ver-perfil {
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }

  .btn-ver-perfil:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .usuario-metricas {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .metrica {
    text-align: center;
  }

  .metrica-label {
    display: block;
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.6);
  }

  .metrica-valor {
    display: block;
    font-size: 1.1rem;
    font-weight: 600;
    color: white;
    margin-top: 0.25rem;
  }

  .motivos-riesgo {
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
  }

  .motivos-riesgo ul {
    margin: 0.5rem 0 0 0;
    padding-left: 1.5rem;
  }

  .motivos-riesgo li {
    margin-bottom: 0.25rem;
    color: rgba(255, 255, 255, 0.7);
  }

  @keyframes girar {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* 📱 RESPONSIVE */
  @media (max-width: 768px) {
    .estadisticas-riesgo {
      grid-template-columns: repeat(2, 1fr);
    }
    
    .usuario-header {
      flex-direction: column;
      gap: 1rem;
    }
    
    .usuario-metricas {
      grid-template-columns: 1fr;
    }
  }
</style> 