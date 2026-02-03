<script lang="ts">
  // Props basadas en la estructura real de Supabase
  export let titulo: string = '';
  export let imagen_url: string = '';
  export let categoria: string = '';
  export let nivel: string = '';
  export let duracion_estimada: number = 0;
  export let descripcion: string = '';
  export let descripcion_corta: string = '';
  export let objetivos: string[] | string = [];
  export let requisitos: string[] | string = [];
  export let tipo: 'curso' | 'tutorial' = 'curso';
  
  // Props específicos para tutoriales
  export let artista: string = '';
  export let acordeonista: string = '';
  export let tonalidad: string = '';
  
  // Props específicos para cursos
  export let conteo_lecciones: number = 0;
  export let estudiantes_inscritos: number = 0;

  // Sistema de puntuación (simulado por ahora)
  const puntuacion = Math.floor(Math.random() * 2) + 4; // Entre 4-5 estrellas
  const totalReseñas = Math.floor(Math.random() * 500) + 50; // Entre 50-550 reseñas

  // Mapeo de categorías a iconos
  const iconosCategoria: Record<string, string> = {
    'vallenato': '🎵',
    'cumbia': '🪗',
    'salsa': '💃',
    'merengue': '🕺',
    'bachata': '❤️',
    'acordeón': '🪗',
    'música': '🎼',
    'básico': '📚',
    'default': '🎓'
  };

  // Mapeo de niveles a iconos y colores
  const nivelesConfig: Record<string, { icon: string, color: string }> = {
    'principiante': { icon: '🟢', color: '#10b981' },
    'básico': { icon: '🟢', color: '#10b981' },
    'intermedio': { icon: '🟡', color: '#f59e0b' },
    'avanzado': { icon: '🔴', color: '#ef4444' },
    'experto': { icon: '🟣', color: '#8b5cf6' },
    'default': { icon: '🔵', color: '#3b82f6' }
  };

  // Función para formatear duración
  function formatearDuracion(mins: number): string {
    if (!mins || mins <= 0) return '';
    if (mins < 60) return `${mins} min`;
    const horas = Math.floor(mins / 60);
    const minutosRestantes = mins % 60;
    return minutosRestantes > 0 ? `${horas}h ${minutosRestantes}min` : `${horas}h`;
  }

  // Función para procesar objetivos/requisitos
  function procesarLista(lista: string[] | string): string[] {
    if (!lista) return [];
    if (typeof lista === 'string') {
      try {
        if (lista.startsWith('[') || lista.startsWith('{')) {
          return JSON.parse(lista);
        }
        return lista.split(/[,\n•\-\*]/).map(item => item.trim()).filter(item => item.length > 0);
      } catch {
        return [lista];
      }
    }
    return Array.isArray(lista) ? lista : [];
  }

  // Función para generar estrellas
  function generarEstrellas(rating: number): string {
    const estrellasCompletas = Math.floor(rating);
    const tieneMediaEstrella = rating % 1 !== 0;
    let estrellas = '⭐'.repeat(estrellasCompletas);
    if (tieneMediaEstrella) estrellas += '⭐';
    return estrellas;
  }

  $: objetivosLista = procesarLista(objetivos);
  $: requisitosLista = procesarLista(requisitos);
  $: duracionTexto = formatearDuracion(duracion_estimada);
  $: iconoCategoria = iconosCategoria[categoria?.toLowerCase()] || iconosCategoria.default;
  $: nivelConfig = nivelesConfig[nivel?.toLowerCase()] || nivelesConfig.default;
  $: estrellasTexto = generarEstrellas(puntuacion);
</script>

<div class="curso-card">
  <!-- Header con imagen y info principal -->
  <div class="header-section">
    <div class="imagen-container">
      {#if imagen_url}
        <img src={imagen_url} alt={titulo} class="imagen" />
      {:else}
        <div class="imagen-placeholder">
          {tipo === 'curso' ? '📚' : '🎵'}
        </div>
      {/if}
      <div class="tipo-badge">{tipo === 'curso' ? '📚 Curso' : '🎵 Tutorial'}</div>
    </div>

    <div class="info-principal">
      <h2 class="titulo">{titulo}</h2>
      
      <!-- Rating y estadísticas -->
      <div class="rating-section">
        <div class="estrellas">
          <span class="estrellas-icons">{estrellasTexto}</span>
          <span class="rating-numero">{puntuacion}</span>
          <span class="total-reviews">({totalReseñas} estudiantes)</span>
        </div>
      </div>

      <!-- Tags dinámicos horizontales -->
      <div class="tags-horizontales">
        {#if categoria}
          <div class="tag-item categoria">
            <span class="tag-icon">{iconoCategoria}</span>
            <span class="tag-text">{categoria}</span>
          </div>
        {/if}
        
        {#if nivel}
          <div class="tag-item nivel" style="--nivel-color: {nivelConfig.color}">
            <span class="tag-icon">{nivelConfig.icon}</span>
            <span class="tag-text">{nivel}</span>
          </div>
        {/if}
        
        {#if duracionTexto}
          <div class="tag-item duracion">
            <span class="tag-icon">⏱️</span>
            <span class="tag-text">{duracionTexto}</span>
          </div>
        {/if}

        <!-- Stats específicos por tipo -->
        {#if tipo === 'curso' && conteo_lecciones > 0}
          <div class="tag-item lecciones">
            <span class="tag-icon">📝</span>
            <span class="tag-text">{conteo_lecciones} lecciones</span>
          </div>
        {/if}

        {#if estudiantes_inscritos > 0}
          <div class="tag-item estudiantes">
            <span class="tag-icon">👥</span>
            <span class="tag-text">{estudiantes_inscritos} estudiantes</span>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Info específica de tutoriales -->
  {#if tipo === 'tutorial' && (artista || acordeonista || tonalidad)}
    <div class="tutorial-info">
      {#if artista}
        <div class="info-item">
          <span class="info-icon">🎤</span>
          <span class="info-label">Artista:</span>
          <span class="info-value">{artista}</span>
        </div>
      {/if}
      {#if acordeonista}
        <div class="info-item">
          <span class="info-icon">🪗</span>
          <span class="info-label">Acordeonista:</span>
          <span class="info-value">{acordeonista}</span>
        </div>
      {/if}
      {#if tonalidad}
        <div class="info-item">
          <span class="info-icon">🎼</span>
          <span class="info-label">Tonalidad:</span>
          <span class="info-value">{tonalidad}</span>
        </div>
      {/if}
    </div>
  {/if}

  <!-- Descripción -->
  {#if descripcion_corta || descripcion}
    <div class="descripcion-section">
      <div class="seccion-titulo">
        <span class="titulo-icon">📝</span>
        <h3>Descripción</h3>
      </div>
      <div class="descripcion-texto">{@html descripcion_corta || descripcion}</div>
    </div>
  {/if}

  <!-- Objetivos y Requisitos lado a lado -->
  {#if objetivosLista.length > 0 || requisitosLista.length > 0}
    <div class="objetivos-requisitos-container">
      <!-- Objetivos (50%) -->
      {#if objetivosLista.length > 0}
        <div class="objetivos-columna">
          <div class="seccion-titulo">
            <span class="titulo-icon">🎯</span>
            <h3>Objetivos de Aprendizaje</h3>
            <span class="contador">({objetivosLista.length})</span>
          </div>
          <div class="lista-vertical">
            {#each objetivosLista.slice(0, 3) as objetivo}
              <div class="objetivo-item">
                <span class="check-icon">✅</span>
                <span class="objetivo-texto">{objetivo}</span>
              </div>
            {/each}
            {#if objetivosLista.length > 3}
              <div class="mas-items">+{objetivosLista.length - 3} más...</div>
            {/if}
          </div>
        </div>
      {/if}

      <!-- Requisitos (50%) -->
      {#if requisitosLista.length > 0}
        <div class="requisitos-columna">
          <div class="seccion-titulo">
            <span class="titulo-icon">📋</span>
            <h3>Requisitos</h3>
            <span class="contador">({requisitosLista.length})</span>
          </div>
          <div class="lista-vertical">
            {#each requisitosLista.slice(0, 3) as requisito}
              <div class="requisito-item">
                <span class="check-icon">📌</span>
                <span class="requisito-texto">{requisito}</span>
              </div>
            {/each}
            {#if requisitosLista.length > 3}
              <div class="mas-items">+{requisitosLista.length - 3} más...</div>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
/* Contenedor principal */
.curso-card {
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 20px;
  padding: 0;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  margin-bottom: 2rem;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.curso-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

/* Header horizontal */
.header-section {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);
  border-bottom: 1px solid #f1f5f9;
}

.imagen-container {
  position: relative;
  flex-shrink: 0;
}

.imagen {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  object-fit: cover;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 3px solid #fff;
  transition: transform 0.3s ease;
}

.imagen:hover {
  transform: scale(1.05);
}

.imagen-placeholder {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  border: 3px solid #fff;
}

.tipo-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.info-principal {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.titulo {
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
  line-height: 1.2;
  background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Sistema de estrellas */
.rating-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.estrellas {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.estrellas-icons {
  font-size: 1.2rem;
  line-height: 1;
}

.rating-numero {
  font-weight: 700;
  font-size: 1.1rem;
  color: #f59e0b;
}

.total-reviews {
  color: #64748b;
  font-size: 0.9rem;
}

/* Tags horizontales dinámicos */
.tags-horizontales {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.tag-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 25px;
  font-size: 0.875rem;
  font-weight: 600;
  background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
  color: #475569;
  border: 1px solid #cbd5e1;
  transition: all 0.3s ease;
  cursor: default;
}

.tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tag-item.categoria {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-color: #dc2626;
}

.tag-item.nivel {
  background: var(--nivel-color);
  color: white;
  border-color: var(--nivel-color);
}

.tag-item.duracion {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-color: #059669;
}

.tag-item.lecciones {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #2563eb;
}

.tag-item.estudiantes {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border-color: #7c3aed;
}

.tag-icon {
  font-size: 1rem;
  line-height: 1;
}

.tag-text {
  white-space: nowrap;
}

/* Info específica de tutoriales */
.tutorial-info {
  display: flex;
  gap: 2rem;
  padding: 1.5rem 2rem;
  background: linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%);
  border-bottom: 1px solid #e9d5ff;
  flex-wrap: wrap;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.info-icon {
  font-size: 1.1rem;
}

.info-label {
  font-weight: 600;
  color: #6b21a8;
}

.info-value {
  color: #1e293b;
  font-weight: 500;
}

/* Descripción */
.descripcion-section {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.seccion-titulo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.titulo-icon {
  font-size: 1.2rem;
}

.seccion-titulo h3 {
  font-size: 1.2rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.contador {
  font-size: 0.8rem;
  color: #64748b;
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 600;
}

.descripcion-texto {
  color: #475569;
  line-height: 1.6;
  font-size: 0.95rem;
}

/* Container objetivos y requisitos lado a lado */
.objetivos-requisitos-container {
  display: flex;
  gap: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-top: 1px solid #e2e8f0;
}

.objetivos-columna,
.requisitos-columna {
  flex: 1;
  min-width: 0; /* Permite que el contenido se ajuste */
}

.lista-vertical {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: stretch;
}

.objetivo-item, .requisito-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  width: 100%;
  transition: all 0.3s ease;
}

.objetivo-item:hover, .requisito-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.check-icon {
  font-size: 1rem;
  line-height: 1;
  margin-top: 0.1rem;
  flex-shrink: 0;
}

.objetivo-texto, .requisito-texto {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #374151;
}

.mas-items {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.mas-items:hover {
  transform: scale(1.05);
}

/* Responsive */
@media (max-width: 1024px) {
  .header-section {
    gap: 1.5rem;
    padding: 1.5rem;
  }
  
  .tags-horizontales {
    gap: 0.5rem;
  }
  
  .tutorial-info {
    gap: 1rem;
  }
  
  .objetivos-requisitos-container {
    gap: 1.5rem;
    padding: 1.5rem;
  }
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    text-align: center;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
  }
  
  .imagen, .imagen-placeholder {
    width: 100px;
    height: 100px;
  }
  
  .titulo {
    font-size: 1.5rem;
  }
  
  .tags-horizontales {
    justify-content: center;
    gap: 0.5rem;
  }
  
  .tutorial-info {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
  
  .objetivos-requisitos-container {
    flex-direction: column;
    gap: 1.5rem;
    padding: 1.5rem 1rem;
  }
  
  .descripcion-section {
    padding: 1rem;
  }
}

@media (max-width: 480px) {
  .curso-card {
    margin-bottom: 1rem;
  }
  
  .header-section {
    padding: 1rem 0.75rem;
  }
  
  .titulo {
    font-size: 1.25rem;
  }
  
  .tag-item {
    font-size: 0.8rem;
    padding: 0.4rem 0.8rem;
  }
  
  .estrellas-icons {
    font-size: 1rem;
  }
  
  .objetivos-requisitos-container {
    padding: 1rem 0.75rem;
    gap: 1rem;
  }
  
  .seccion-titulo h3 {
    font-size: 1rem;
  }
  
  .objetivo-texto, .requisito-texto {
    font-size: 0.85rem;
  }
}
</style> 