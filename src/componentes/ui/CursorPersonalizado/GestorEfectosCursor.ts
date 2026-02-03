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
            'button', 'a[href]', 'input', 'textarea', 'select', '[role="button"]',
            '[tabindex]:not([tabindex="-1"])', '.boton', '.btn', '.enlace', '.link',
            '.menu-item', '.menu-container button', '.leccion-item', '.modulo-header',
            '.tab-btn', '.cerrar-sidebar', '.tarjeta-curso', '.tarjeta-tutorial',
            '.tarjeta-evento', '.pestana', '.tab', '.acceso-rapido'
        ].join(', '),

        texto: [
            'input[type="text"]', 'input[type="email"]', 'input[type="password"]',
            'input[type="search"]', 'textarea', '[contenteditable="true"]',
            '.editor', '.input-texto'
        ].join(', '),

        arrastrables: [
            '[draggable="true"]', '.arrastrable', '.draggable',
            '.sortable-item', '.dnd-item'
        ].join(', '),

        especiales: [
            '.cursor-hover', '.cursor-pointer', '.cursor-grab',
            '.efecto-magnetico', '.hover-especial', '.menu-item',
            '.leccion-item', '.modulo-header', '.tab-btn', '.boton-hover-especial'
        ].join(', ')
    };

    constructor(configuracion: ConfiguracionGestor) {
        this.configuracion = configuracion;
        // Binds
        this.manejarMovimientoMouse = this.manejarMovimientoMouse.bind(this);
        this.manejarMouseDown = this.manejarMouseDown.bind(this);
        this.manejarMouseUp = this.manejarMouseUp.bind(this);
        this.manejarClick = this.manejarClick.bind(this);
        this.manejarMouseOver = this.manejarMouseOver.bind(this);
        this.manejarMouseOut = this.manejarMouseOut.bind(this);
        this.manejarDragStart = this.manejarDragStart.bind(this);
        this.manejarDragEnd = this.manejarDragEnd.bind(this);
        this.manejarContextMenu = this.manejarContextMenu.bind(this);
    }

    iniciar(): void {
        if (typeof document === 'undefined') return;
        this.agregarEventListeners();
    }

    destruir(): void {
        if (typeof document === 'undefined') return;
        this.removerEventListeners();
        if (this.animacionFrame) {
            cancelAnimationFrame(this.animacionFrame);
        }
    }

    private agregarEventListeners(): void {
        document.addEventListener('mousemove', this.manejarMovimientoMouse);
        document.addEventListener('mousedown', this.manejarMouseDown);
        document.addEventListener('mouseup', this.manejarMouseUp);
        document.addEventListener('click', this.manejarClick);
        document.addEventListener('mouseover', this.manejarMouseOver);
        document.addEventListener('mouseout', this.manejarMouseOut);
        document.addEventListener('dragstart', this.manejarDragStart as any);
        document.addEventListener('dragend', this.manejarDragEnd as any);
        document.addEventListener('contextmenu', this.manejarContextMenu);
    }

    private removerEventListeners(): void {
        document.removeEventListener('mousemove', this.manejarMovimientoMouse);
        document.removeEventListener('mousedown', this.manejarMouseDown);
        document.removeEventListener('mouseup', this.manejarMouseUp);
        document.removeEventListener('click', this.manejarClick);
        document.removeEventListener('mouseover', this.manejarMouseOver);
        document.removeEventListener('mouseout', this.manejarMouseOut);
        document.removeEventListener('dragstart', this.manejarDragStart as any);
        document.removeEventListener('dragend', this.manejarDragEnd as any);
        document.removeEventListener('contextmenu', this.manejarContextMenu);
    }

    private manejarMovimientoMouse(evento: MouseEvent): void {
        const ahora = performance.now();
        if (ahora - this.ultimaActualizacion < this.INTERVALO_THROTTLE) {
            return;
        }

        this.ultimaActualizacion = ahora;
        this.configuracion.onMovimiento(evento.clientX, evento.clientY);
    }

    private detectarContextoElemento(elemento: HTMLElement): string {
        if (!elemento) return 'normal';
        if (elemento.matches(this.SELECTORES_ELEMENTOS.texto)) return 'texto';
        if (elemento.matches(this.SELECTORES_ELEMENTOS.arrastrables)) return 'arrastrar';
        if (elemento.matches(this.SELECTORES_ELEMENTOS.interactivos)) return 'hover';
        if (elemento.matches(this.SELECTORES_ELEMENTOS.especiales)) return 'hover';

        let elementoPadre = elemento.parentElement;
        while (elementoPadre && elementoPadre !== document.body) {
            if (elementoPadre.matches && elementoPadre.matches(this.SELECTORES_ELEMENTOS.interactivos)) {
                return 'hover';
            }
            elementoPadre = elementoPadre.parentElement;
        }
        return 'normal';
    }

    private encontrarElementoInteractivoPadre(elemento: HTMLElement): HTMLElement | null {
        let elementoActual: HTMLElement | null = elemento;

        while (elementoActual && elementoActual !== document.body) {
            // Verificar si es un elemento interactivo usando algunas clases clave o tags
            if (
                elementoActual.tagName === 'BUTTON' ||
                elementoActual.tagName === 'A' ||
                (elementoActual.hasAttribute('role') && elementoActual.getAttribute('role') === 'button') ||
                elementoActual.classList.contains('boton') ||
                elementoActual.classList.contains('btn') ||
                elementoActual.classList.contains('menu-item')
            ) {
                return elementoActual;
            }
            elementoActual = elementoActual.parentElement;
        }

        return null;
    }

    private manejarMouseOver(evento: MouseEvent): void {
        const elemento = evento.target as HTMLElement;
        if (!elemento) return;

        const elementoPrincipal = this.encontrarElementoInteractivoPadre(elemento) || elemento;
        const nuevoContexto = this.detectarContextoElemento(elementoPrincipal);

        if (nuevoContexto !== this.contextoActual) {
            this.contextoActual = nuevoContexto;
            this.configuracion.onCambioContexto(nuevoContexto, elementoPrincipal);
        }

        if (elementoPrincipal !== this.ultimoElementoHover) {
            if (nuevoContexto === 'hover' || nuevoContexto === 'texto') {
                this.configuracion.onHover(true, elementoPrincipal);
            }
            this.ultimoElementoHover = elementoPrincipal;
        }
    }

    private manejarMouseOut(evento: MouseEvent): void {
        const elemento = evento.target as HTMLElement;
        if (!elemento) return;

        const elementoPrincipal = this.encontrarElementoInteractivoPadre(elemento) || elemento;
        const elementoDestino = evento.relatedTarget as HTMLElement;

        if (elementoDestino && elementoPrincipal.contains(elementoDestino)) {
            return;
        }

        if (elementoPrincipal === this.ultimoElementoHover) {
            this.configuracion.onHover(false, elementoPrincipal);
            this.ultimoElementoHover = null;

            if (this.contextoActual !== 'normal') {
                this.contextoActual = 'normal';
                this.configuracion.onCambioContexto('normal');
            }
        }
    }

    private manejarClick(evento: MouseEvent): void {
        const elemento = evento.target as HTMLElement;
        this.configuracion.onClick(evento.clientX, evento.clientY, elemento);
    }

    private manejarMouseDown(evento: MouseEvent): void {
        const elemento = evento.target as HTMLElement;
        if (elemento?.matches && elemento.matches(this.SELECTORES_ELEMENTOS.interactivos)) {
            this.configuracion.onCambioContexto('presionado', elemento);
        }
    }

    private manejarMouseUp(evento: MouseEvent): void {
        const elemento = evento.target as HTMLElement;
        if (elemento?.matches && elemento.matches(this.SELECTORES_ELEMENTOS.interactivos)) {
            this.configuracion.onCambioContexto('hover', elemento);
        }
    }

    private manejarDragStart(evento: DragEvent): void {
        this.contextoActual = 'arrastrar';
        this.configuracion.onCambioContexto('arrastrar', evento.target as HTMLElement);
    }

    private manejarDragEnd(evento: DragEvent): void {
        this.contextoActual = 'normal';
        this.configuracion.onCambioContexto('normal', evento.target as HTMLElement);
    }

    private manejarContextMenu(evento: MouseEvent): void {
        const elemento = evento.target as HTMLElement;
        this.configuracion.onClick(evento.clientX, evento.clientY, elemento);
    }
}
