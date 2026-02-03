// import { UtilidadesCursor } from './utilidadesCursor';

interface ConfiguracionGestor {
  onMovimiento: (x: number, y: number) => void;
  onCambioContexto: (contexto: string, elemento?: HTMLElement) => void;
  onClick: (x: number, y: number, elemento?: HTMLElement) => void;
  onHover: (entrando: boolean, elemento?: HTMLElement) => void;
}

export class GestorEfectosCursor {
  private configuracion: ConfiguracionGestor;
  private ultimoElementoHover: HTMLElement | null = null;
  private contextoActual: string = 'normal';
  private animacionFrame: number = 0;
  private ultimaActualizacion: number = 0;
  
  // Throttling para performance
  private readonly INTERVALO_THROTTLE = 16; // ~60fps
  
  // Selectores para detección contextual
  private readonly SELECTORES_ELEMENTOS = {
    interactivos: [
      'button',
      'a[href]',
      'input',
      'textarea',
      'select',
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])',
      '.boton',
      '.btn',
      '.enlace',
      '.link',
      // ✅ MENÚ INFERIOR RESPONSIVO
      '.menu-item',
      '.menu-container button',
      // ✅ VISUALIZADOR DE CURSOS
      '.leccion-item',
      '.modulo-header',
      '.tab-btn',
      '.cerrar-sidebar',
      // ✅ ELEMENTOS ESPECÍFICOS DE LA ACADEMIA
      '.tarjeta-curso',
      '.tarjeta-tutorial',
      '.tarjeta-evento',
      '.pestana',
      '.tab',
      '.acceso-rapido'
    ].join(', '),
    
    texto: [
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="search"]',
      'textarea',
      '[contenteditable="true"]',
      '.editor',
      '.input-texto'
    ].join(', '),
    
    arrastrables: [
      '[draggable="true"]',
      '.arrastrable',
      '.draggable',
      '.sortable-item',
      '.dnd-item'
    ].join(', '),
    
    especiales: [
      '.cursor-hover',
      '.cursor-pointer',
      '.cursor-grab',
      '.efecto-magnetico',
      '.hover-especial',
      // ✅ CLASES ESPECIALES ACADEMIA VALLENATA
      '.menu-item',
      '.leccion-item',
      '.modulo-header',
      '.tab-btn',
      '.boton-hover-especial'
    ].join(', ')
  };

  constructor(configuracion: ConfiguracionGestor) {
    this.configuracion = configuracion;
  }

  /**
   * Iniciar el seguimiento del cursor
   */
  iniciar(): void {
    this.agregarEventListeners();
    console.log('🎯 Gestor de efectos del cursor iniciado');
  }

  /**
   * Destruir y limpiar recursos
   */
  destruir(): void {
    this.removerEventListeners();
    if (this.animacionFrame) {
      cancelAnimationFrame(this.animacionFrame);
    }
    console.log('🎯 Gestor de efectos del cursor destruido');
  }

  /**
   * Agregar todos los event listeners necesarios
   */
  private agregarEventListeners(): void {
    // Seguimiento del movimiento del mouse (throttled)
    document.addEventListener('mousemove', this.manejarMovimientoMouse);
    
    // Eventos de clic
    document.addEventListener('mousedown', this.manejarMouseDown);
    document.addEventListener('mouseup', this.manejarMouseUp);
    document.addEventListener('click', this.manejarClick);
    
    // Eventos de hover para detección contextual
    document.addEventListener('mouseover', this.manejarMouseOver);
    document.addEventListener('mouseout', this.manejarMouseOut);
    
    // Eventos especiales
    document.addEventListener('dragstart', this.manejarDragStart);
    document.addEventListener('dragend', this.manejarDragEnd);
    document.addEventListener('contextmenu', this.manejarContextMenu);
  }

  /**
   * Remover todos los event listeners
   */
  private removerEventListeners(): void {
    document.removeEventListener('mousemove', this.manejarMovimientoMouse);
    document.removeEventListener('mousedown', this.manejarMouseDown);
    document.removeEventListener('mouseup', this.manejarMouseUp);
    document.removeEventListener('click', this.manejarClick);
    document.removeEventListener('mouseover', this.manejarMouseOver);
    document.removeEventListener('mouseout', this.manejarMouseOut);
    document.removeEventListener('dragstart', this.manejarDragStart);
    document.removeEventListener('dragend', this.manejarDragEnd);
    document.removeEventListener('contextmenu', this.manejarContextMenu);
  }

  /**
   * Manejar movimiento del mouse con throttling
   */
  private manejarMovimientoMouse = (evento: MouseEvent): void => {
    const ahora = performance.now();
    if (ahora - this.ultimaActualizacion < this.INTERVALO_THROTTLE) {
      return;
    }
    
    this.ultimaActualizacion = ahora;
    this.configuracion.onMovimiento(evento.clientX, evento.clientY);
  };

  /**
   * Detectar contexto del elemento bajo el cursor
   */
  private detectarContextoElemento(elemento: HTMLElement): string {
    if (!elemento) return 'normal';

    // Verificar si es un elemento de texto
    if (elemento.matches(this.SELECTORES_ELEMENTOS.texto)) {
      return 'texto';
    }

    // Verificar si es arrastrable
    if (elemento.matches(this.SELECTORES_ELEMENTOS.arrastrables)) {
      return 'arrastrar';
    }

    // Verificar si es interactivo (botones, enlaces, etc.)
    if (elemento.matches(this.SELECTORES_ELEMENTOS.interactivos)) {
      return 'hover';
    }

    // Verificar elementos con clases especiales
    if (elemento.matches(this.SELECTORES_ELEMENTOS.especiales)) {
      return 'hover';
    }

    // Verificar elementos padre si el elemento actual no coincide
    let elementoPadre = elemento.parentElement;
    while (elementoPadre && elementoPadre !== document.body) {
      if (elementoPadre.matches(this.SELECTORES_ELEMENTOS.interactivos)) {
        return 'hover';
      }
      elementoPadre = elementoPadre.parentElement;
    }

    return 'normal';
  }

  /**
   * Manejar eventos de mouse over
   */
  private manejarMouseOver = (evento: MouseEvent): void => {
    const elemento = evento.target as HTMLElement;
    if (!elemento) return;

    // Buscar el elemento interactivo principal
    const elementoPrincipal = this.encontrarElementoInteractivoPadre(elemento) || elemento;

    // Detectar nuevo contexto basado en el elemento principal
    const nuevoContexto = this.detectarContextoElemento(elementoPrincipal);
    
    // Si cambió el contexto, notificar
    if (nuevoContexto !== this.contextoActual) {
      this.contextoActual = nuevoContexto;
      this.configuracion.onCambioContexto(nuevoContexto, elementoPrincipal);
    }

    // Si es un elemento interactivo principal y diferente al anterior
    if (elementoPrincipal !== this.ultimoElementoHover) {
      // Solo reproducir sonido si realmente es un elemento diferente
      if (nuevoContexto === 'hover' || nuevoContexto === 'texto') {
        this.configuracion.onHover(true, elementoPrincipal);
      }
      this.ultimoElementoHover = elementoPrincipal;
    }
  };

  /**
   * Manejar eventos de mouse out
   */
  private manejarMouseOut = (evento: MouseEvent): void => {
    const elemento = evento.target as HTMLElement;
    if (!elemento) return;

    // Buscar el elemento interactivo principal
    const elementoPrincipal = this.encontrarElementoInteractivoPadre(elemento) || elemento;

    // Solo procesar si realmente salimos del elemento principal
    const elementoDestino = evento.relatedTarget as HTMLElement;
    if (elementoDestino && elementoPrincipal.contains(elementoDestino)) {
      return;
    }

    // Verificar si salimos del elemento interactivo principal
    if (elementoPrincipal === this.ultimoElementoHover) {
      this.configuracion.onHover(false, elementoPrincipal);
      this.ultimoElementoHover = null;
      
      // Restaurar contexto normal
      if (this.contextoActual !== 'normal') {
        this.contextoActual = 'normal';
        this.configuracion.onCambioContexto('normal');
      }
    }
  };

  /**
   * Manejar eventos de clic
   */
  private manejarClick = (evento: MouseEvent): void => {
    const elemento = evento.target as HTMLElement;
    this.configuracion.onClick(evento.clientX, evento.clientY, elemento);
  };

  /**
   * Manejar mouse down para efectos de presión
   */
  private manejarMouseDown = (evento: MouseEvent): void => {
    // Efecto de presión (reducir escala del anillo temporalmente)
    const elemento = evento.target as HTMLElement;
    if (elemento?.matches(this.SELECTORES_ELEMENTOS.interactivos)) {
      this.configuracion.onCambioContexto('presionado', elemento);
    }
  };

  /**
   * Manejar mouse up para restaurar estado
   */
  private manejarMouseUp = (evento: MouseEvent): void => {
    // Restaurar estado después de la presión
    const elemento = evento.target as HTMLElement;
    if (elemento?.matches(this.SELECTORES_ELEMENTOS.interactivos)) {
      this.configuracion.onCambioContexto('hover', elemento);
    }
  };

  /**
   * Manejar inicio de arrastrar
   */
  private manejarDragStart = (evento: DragEvent): void => {
    this.contextoActual = 'arrastrar';
    this.configuracion.onCambioContexto('arrastrar', evento.target as HTMLElement);
  };

  /**
   * Manejar fin de arrastrar
   */
  private manejarDragEnd = (evento: DragEvent): void => {
    this.contextoActual = 'normal';
    this.configuracion.onCambioContexto('normal', evento.target as HTMLElement);
  };

  /**
   * Manejar menú contextual (clic derecho)
   */
  private manejarContextMenu = (evento: MouseEvent): void => {
    // Efecto especial para clic derecho
    const elemento = evento.target as HTMLElement;
    this.configuracion.onClick(evento.clientX, evento.clientY, elemento);
  };

  /**
   * Obtener información del contexto actual
   */
  obtenerContextoActual(): { contexto: string; elemento: HTMLElement | null } {
    return {
      contexto: this.contextoActual,
      elemento: this.ultimoElementoHover
    };
  }

  /**
   * Forzar cambio de contexto (útil para casos especiales)
   */
  forzarContexto(contexto: string, elemento?: HTMLElement): void {
    this.contextoActual = contexto;
    this.configuracion.onCambioContexto(contexto, elemento);
  }

  /**
   * Encontrar el elemento interactivo padre más cercano
   */
  private encontrarElementoInteractivoPadre(elemento: HTMLElement): HTMLElement | null {
    let elementoActual: HTMLElement | null = elemento;
    
    while (elementoActual && elementoActual !== document.body) {
      // Verificar si es un elemento interactivo
      if (
        elementoActual.tagName === 'BUTTON' ||
        elementoActual.tagName === 'A' ||
        (elementoActual.hasAttribute('role') && elementoActual.getAttribute('role') === 'button') ||
        elementoActual.classList.contains('boton') ||
        elementoActual.classList.contains('btn') ||
        elementoActual.classList.contains('enlace') ||
        elementoActual.classList.contains('clickeable') ||
        elementoActual.hasAttribute('tabindex')
      ) {
        return elementoActual;
      }
      elementoActual = elementoActual.parentElement;
    }
    
    return null;
  }
} 