/**
 * 🎮 LÓGICA DE JUEGO - ACADEMIA VALLENATA ONLINE
 * ==========================================
 * Servicio principal para manejar la lógica del juego de acordeón
 * Inspirado en Guitar Hero con adaptación para acordeón vallenato
 * ==========================================
 */

// Interfaces principales
export interface NotaJuego {
  id: string;
  nota_id: string;
  tiempo_ms: number;
  duracion_ms: number;
  fuelle: string;
  nombre: string;
  procesada: boolean;
  tocadaPorUsuario: boolean;
  tiempoTocada?: number;
  precision?: number;
  puntuacion?: TipoPuntuacion;
}

export interface EstadoJuego {
  puntuacion: number;
  combo: number;
  comboMaximo: number;
  salud: number;
  precision: number;
  notasTocadas: number;
  notasCorrectas: number;
  marcas: {
    perfect: number;
    good: number;
    offbeat: number;
    miss: number;
  };
  tiempoJuego: number;
  juegoTerminado: boolean;
  juegoIniciado: boolean;
}

export type TipoPuntuacion = 'Perfect' | 'Good' | 'Offbeat' | 'Miss';

// Configuración del juego
export const CONFIG_JUEGO = {
  // Ventanas de tiempo para puntuación (en milisegundos)
  VENTANA_PERFECT: 50,    // ±50ms = Perfecto
  VENTANA_GOOD: 100,      // ±100ms = Bueno
  VENTANA_OFFBEAT: 150,   // ±150ms = Destiempo
  VENTANA_MISS: 200,      // ±200ms = Fallo
  
  // Puntuación
  PUNTOS_PERFECT: 300,
  PUNTOS_GOOD: 200,
  PUNTOS_OFFBEAT: 100,
  PUNTOS_MISS: 0,
  
  // Multiplicador de combo
  MULTIPLICADOR_COMBO: 1.1,
  
  // Salud
  SALUD_INICIAL: 100,
  SALUD_GANADA_PERFECT: 2,
  SALUD_GANADA_GOOD: 1,
  SALUD_PERDIDA_OFFBEAT: 5,
  SALUD_PERDIDA_MISS: 10,
  
  // Precisión
  PRECISION_PERFECT: 100,
  PRECISION_GOOD: 85,
  PRECISION_OFFBEAT: 60,
  PRECISION_MISS: 0,
  
  // Margen de búsqueda de notas (ms)
  MARGEN_BUSQUEDA: 300,
};

export class LogicaJuego {
  private estado: EstadoJuego;
  private notasJuego: NotaJuego[] = [];
  private notasPendientes: NotaJuego[] = [];
  private callbacks: {
    onPuntuacion?: (puntuacion: TipoPuntuacion, combo: number) => void;
    onEstadoActualizado?: (estado: EstadoJuego) => void;
    onNotaProcesada?: (nota: NotaJuego) => void;
  } = {};
  
  constructor() {
    this.estado = this.crearEstadoInicial();
  }
  
  private crearEstadoInicial(): EstadoJuego {
    return {
      puntuacion: 0,
      combo: 0,
      comboMaximo: 0,
      salud: CONFIG_JUEGO.SALUD_INICIAL,
      precision: 100,
      notasTocadas: 0,
      notasCorrectas: 0,
      marcas: {
        perfect: 0,
        good: 0,
        offbeat: 0,
        miss: 0
      },
      tiempoJuego: 0,
      juegoTerminado: false,
      juegoIniciado: false
    };
  }
  
  // Configurar callbacks
  public configurarCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  // Inicializar juego con notas
  public inicializarJuego(notas: any[]): void {
    this.estado = this.crearEstadoInicial();
    this.notasJuego = this.procesarNotasParaJuego(notas);
    this.notasPendientes = [...this.notasJuego];
    this.estado.juegoIniciado = true;
    
    console.log('🎮 Juego inicializado con', this.notasJuego.length, 'notas');
    this.notificarEstadoActualizado();
  }
  
  private procesarNotasParaJuego(notas: any[]): NotaJuego[] {
    return notas.map((nota, index) => ({
      id: `nota-${index}`,
      nota_id: nota.nota_id || nota.idBoton || `nota-${index}`,
      tiempo_ms: nota.timestamp_ms || nota.tiempo_ms || (nota.tiempo || 0) * 1000,
      duracion_ms: nota.duracion_ms || (nota.duracion || 0.2) * 1000,
      fuelle: nota.fuelle || nota.direccion || 'halar',
      nombre: nota.nombre || nota.nota_id || 'Nota',
      procesada: false,
      tocadaPorUsuario: false
    })).sort((a, b) => a.tiempo_ms - b.tiempo_ms);
  }
  
  // Actualizar tiempo de juego
  public actualizarTiempo(tiempoActual: number): void {
    this.estado.tiempoJuego = tiempoActual;
    this.verificarNotasPerdidas();
  }
  
  // Verificar notas que se perdieron por timeout
  private verificarNotasPerdidas(): void {
    const notasAProcesar = this.notasPendientes.filter(nota => {
      const tiempoLimite = nota.tiempo_ms + CONFIG_JUEGO.VENTANA_MISS;
      return !nota.procesada && this.estado.tiempoJuego > tiempoLimite;
    });
    
    notasAProcesar.forEach(nota => {
      this.procesarNotaPerdida(nota);
    });
  }
  
  private procesarNotaPerdida(nota: NotaJuego): void {
    nota.procesada = true;
    nota.puntuacion = 'Miss';
    
    this.actualizarPuntuacion('Miss', 0);
    this.callbacks.onNotaProcesada?.(nota);
    
    // Remover de pendientes
    this.notasPendientes = this.notasPendientes.filter(n => n.id !== nota.id);
    
    console.log('❌ Nota perdida:', nota.nombre, 'en tiempo', nota.tiempo_ms);
  }
  
  // Procesar entrada del usuario
  public procesarEntradaUsuario(notaId: string, tiempoTocada: number): TipoPuntuacion | null {
    if (!this.estado.juegoIniciado || this.estado.juegoTerminado) {
      return null;
    }
    
    // Buscar la nota más cercana en tiempo que coincida con el ID
    const notaCorrecta = this.encontrarNotaCorrecta(notaId, tiempoTocada);
    
    if (notaCorrecta) {
      return this.procesarNotaCorrecta(notaCorrecta, tiempoTocada);
    } else {
      // No hay nota correcta, penalizar
      return this.procesarNotaIncorrecta(tiempoTocada);
    }
  }
  
  private encontrarNotaCorrecta(notaId: string, tiempoTocada: number): NotaJuego | null {
    // Buscar en un rango de tiempo alrededor del tiempo actual
    const notasCandidatas = this.notasPendientes.filter(nota => {
      const distanciaTiempo = Math.abs(nota.tiempo_ms - tiempoTocada);
      return !nota.procesada && 
             nota.nota_id === notaId && 
             distanciaTiempo <= CONFIG_JUEGO.MARGEN_BUSQUEDA;
    });
    
    if (notasCandidatas.length === 0) {
      return null;
    }
    
    // Devolver la nota más cercana en tiempo
    return notasCandidatas.reduce((closest, current) => {
      const distanciaClosest = Math.abs(closest.tiempo_ms - tiempoTocada);
      const distanciaCurrent = Math.abs(current.tiempo_ms - tiempoTocada);
      return distanciaCurrent < distanciaClosest ? current : closest;
    });
  }
  
  private procesarNotaCorrecta(nota: NotaJuego, tiempoTocada: number): TipoPuntuacion {
    const distanciaTiempo = Math.abs(nota.tiempo_ms - tiempoTocada);
    const puntuacion = this.calcularPuntuacion(distanciaTiempo);
    
    // Actualizar nota
    nota.procesada = true;
    nota.tocadaPorUsuario = true;
    nota.tiempoTocada = tiempoTocada;
    nota.precision = this.calcularPrecision(distanciaTiempo);
    nota.puntuacion = puntuacion;
    
    // Actualizar estado del juego
    this.actualizarPuntuacion(puntuacion, distanciaTiempo);
    
    // Remover de pendientes
    this.notasPendientes = this.notasPendientes.filter(n => n.id !== nota.id);
    
    // Notificar
    this.callbacks.onNotaProcesada?.(nota);
    
    console.log('✅ Nota correcta:', nota.nombre, 'Puntuación:', puntuacion, 'Distancia:', distanciaTiempo + 'ms');
    
    return puntuacion;
  }
  
  private procesarNotaIncorrecta(tiempoTocada: number): TipoPuntuacion {
    // Penalizar por nota incorrecta
    this.actualizarPuntuacion('Miss', CONFIG_JUEGO.VENTANA_MISS);
    
    console.log('❌ Nota incorrecta en tiempo:', tiempoTocada);
    
    return 'Miss';
  }
  
  private calcularPuntuacion(distanciaTiempo: number): TipoPuntuacion {
    if (distanciaTiempo <= CONFIG_JUEGO.VENTANA_PERFECT) {
      return 'Perfect';
    } else if (distanciaTiempo <= CONFIG_JUEGO.VENTANA_GOOD) {
      return 'Good';
    } else if (distanciaTiempo <= CONFIG_JUEGO.VENTANA_OFFBEAT) {
      return 'Offbeat';
    } else {
      return 'Miss';
    }
  }
  
  private calcularPrecision(distanciaTiempo: number): number {
    if (distanciaTiempo <= CONFIG_JUEGO.VENTANA_PERFECT) {
      return CONFIG_JUEGO.PRECISION_PERFECT;
    } else if (distanciaTiempo <= CONFIG_JUEGO.VENTANA_GOOD) {
      return CONFIG_JUEGO.PRECISION_GOOD;
    } else if (distanciaTiempo <= CONFIG_JUEGO.VENTANA_OFFBEAT) {
      return CONFIG_JUEGO.PRECISION_OFFBEAT;
    } else {
      return CONFIG_JUEGO.PRECISION_MISS;
    }
  }
  
  private actualizarPuntuacion(tipoPuntuacion: TipoPuntuacion, distanciaTiempo: number): void {
    // Actualizar marcas
    this.estado.marcas[tipoPuntuacion.toLowerCase() as keyof typeof this.estado.marcas]++;
    this.estado.notasTocadas++;
    
    // Actualizar combo
    if (tipoPuntuacion === 'Miss') {
      this.estado.combo = 0;
    } else {
      this.estado.combo++;
      this.estado.notasCorrectas++;
      if (this.estado.combo > this.estado.comboMaximo) {
        this.estado.comboMaximo = this.estado.combo;
      }
    }
    
    // Calcular puntos
    let puntos = 0;
    switch (tipoPuntuacion) {
      case 'Perfect': puntos = CONFIG_JUEGO.PUNTOS_PERFECT; break;
      case 'Good': puntos = CONFIG_JUEGO.PUNTOS_GOOD; break;
      case 'Offbeat': puntos = CONFIG_JUEGO.PUNTOS_OFFBEAT; break;
      case 'Miss': puntos = CONFIG_JUEGO.PUNTOS_MISS; break;
    }
    
    // Aplicar multiplicador de combo
    const multiplicador = 1 + (this.estado.combo * 0.1);
    puntos = Math.floor(puntos * multiplicador);
    
    this.estado.puntuacion += puntos;
    
    // Actualizar salud
    this.actualizarSalud(tipoPuntuacion);
    
    // Actualizar precisión
    this.actualizarPrecision();
    
    // Notificar callbacks
    this.callbacks.onPuntuacion?.(tipoPuntuacion, this.estado.combo);
    this.notificarEstadoActualizado();
  }
  
  private actualizarSalud(tipoPuntuacion: TipoPuntuacion): void {
    switch (tipoPuntuacion) {
      case 'Perfect':
        this.estado.salud = Math.min(100, this.estado.salud + CONFIG_JUEGO.SALUD_GANADA_PERFECT);
        break;
      case 'Good':
        this.estado.salud = Math.min(100, this.estado.salud + CONFIG_JUEGO.SALUD_GANADA_GOOD);
        break;
      case 'Offbeat':
        this.estado.salud = Math.max(0, this.estado.salud - CONFIG_JUEGO.SALUD_PERDIDA_OFFBEAT);
        break;
      case 'Miss':
        this.estado.salud = Math.max(0, this.estado.salud - CONFIG_JUEGO.SALUD_PERDIDA_MISS);
        break;
    }
    
    // Verificar si el juego terminó por salud
    if (this.estado.salud <= 0) {
      this.terminarJuego();
    }
  }
  
  private actualizarPrecision(): void {
    if (this.estado.notasTocadas === 0) {
      this.estado.precision = 100;
      return;
    }
    
    const totalPrecision = (
      this.estado.marcas.perfect * CONFIG_JUEGO.PRECISION_PERFECT +
      this.estado.marcas.good * CONFIG_JUEGO.PRECISION_GOOD +
      this.estado.marcas.offbeat * CONFIG_JUEGO.PRECISION_OFFBEAT +
      this.estado.marcas.miss * CONFIG_JUEGO.PRECISION_MISS
    );
    
    this.estado.precision = totalPrecision / this.estado.notasTocadas;
  }
  
  private terminarJuego(): void {
    this.estado.juegoTerminado = true;
    this.estado.juegoIniciado = false;
    
    console.log('🎮 Juego terminado. Puntuación final:', this.estado.puntuacion);
    this.notificarEstadoActualizado();
  }
  
  private notificarEstadoActualizado(): void {
    this.callbacks.onEstadoActualizado?.(this.estado);
  }
  
  // Getters públicos
  public obtenerEstado(): EstadoJuego {
    return { ...this.estado };
  }
  
  public obtenerProgreso(): number {
    if (this.notasJuego.length === 0) return 0;
    const notasProcesadas = this.notasJuego.filter(n => n.procesada).length;
    return (notasProcesadas / this.notasJuego.length) * 100;
  }
  
  public obtenerNotasPendientes(): NotaJuego[] {
    return [...this.notasPendientes];
  }
  
  public obtenerNotasEnVentana(tiempoActual: number, ventana: number = 1000): NotaJuego[] {
    return this.notasPendientes.filter(nota => {
      const distancia = nota.tiempo_ms - tiempoActual;
      return distancia >= 0 && distancia <= ventana;
    });
  }
  
  // Reiniciar juego
  public reiniciarJuego(): void {
    this.estado = this.crearEstadoInicial();
    this.notasPendientes = [...this.notasJuego];
    this.notasJuego.forEach(nota => {
      nota.procesada = false;
      nota.tocadaPorUsuario = false;
      delete nota.tiempoTocada;
      delete nota.precision;
      delete nota.puntuacion;
    });
    
    this.estado.juegoIniciado = true;
    this.notificarEstadoActualizado();
  }
  
  // Pausar/Reanudar juego
  public pausarJuego(): void {
    this.estado.juegoIniciado = false;
    this.notificarEstadoActualizado();
  }
  
  public reanudarJuego(): void {
    this.estado.juegoIniciado = true;
    this.notificarEstadoActualizado();
  }
} 