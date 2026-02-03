// @ts-nocheck
import CarrilAcordeon from './CarrilAcordeon.js';
import EfectosParticulas from './EfectosParticulas.js';
import { mapaBotonesPorId } from './notasAcordeonDiatonico.js';

// Verificar si estamos en el navegador
const isBrowser = typeof window !== 'undefined';

export default class MotorJuegoAcordeon {
  constructor(vm) {
    this.canvas = vm.canvas;
    this.ctx = vm.ctx;
    this.efectosCanvas = vm.efectosCanvas;
    this.efectosCtx = vm.efectosCtx;
    this.audio = vm.audio;
    this.vm = vm;

    // Tiempo del juego
    this.tiempoActual = 0;
    this.tiempoJuego = 0;
    this.inicioCancionEn = 0;
    this.cargando = false;
    this.pausado = true;
    this.iniciado = false;
    this.tiempoInicioJuego = null;
    this.tiempoPausado = null;

    // Datos de la canción
    this.arrayTiempos = []; // Array de notas de la canción
    this.indiceArrayTiempos = 0;

    // Control de teclas
    this.estadoTeclasPresionadas = {};
    this.notasMantenidas = {};
    this.timeoutsNotasMantenidas = {};

    // Configuración del juego
    this.lineaGolpeY = 0;
    this.velocidadNotasPxPorSeg = 0;
    this.direccionFuelle = 'halar';
    this.velocidadJuego = 1;
    this.velocidadNota = 1;

    // Resultados del juego
    this.resultado = {
      puntuacion: 0,
      porcentajeTotal: 0,
      notasGolpeadas: 0,
      combo: 0,
      comboMaximo: 0,
      marcas: { perfecto: 0, bueno: 0, desafinado: 0, fallo: 0 },
    };

    // Sistema de fiebre
    this.fiebre = { valor: 1, tiempo: 0, porcentaje: 0 };
    this.salud = 100;

    // Efectos
    this.efectosParticulas = new EfectosParticulas(vm);

    this.crearCarriles();
    this.registrarEntrada();
    this.destruido = false;
    this.actualizar();
  }

  crearCarriles() {
    this.carrilesAcordeon = [];
    
    // Crear carriles para cada botón del acordeón
    const botonesDisponibles = Object.keys(mapaBotonesPorId);
    
    botonesDisponibles.forEach(idBoton => {
      const datosBoton = mapaBotonesPorId[idBoton];
      if (datosBoton) {
        const carril = new CarrilAcordeon(this.vm, this, idBoton, datosBoton);
        this.carrilesAcordeon.push(carril);
      }
    });

    this.reposicionar();
  }

  async reposicionar() {
    if (this.vm.wrapper) {
      this.canvas.style.height = this.vm.alturaContenido ?? "100%";
      this.canvas.width = this.vm.wrapper.clientWidth;
      this.canvas.height = this.vm.wrapper.clientHeight;
    } else if (isBrowser) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    } else {
      // Valores por defecto si no estamos en el navegador
      this.canvas.width = 1200;
      this.canvas.height = 800;
    }

    this.efectosCanvas.style.height = this.canvas.style.height;
    this.efectosCanvas.width = this.canvas.width;
    this.efectosCanvas.height = this.canvas.height;

    // Configurar línea de golpe
    const esMobile = isBrowser ? window.innerWidth < 1000 : false;
    let proporcionLineaGolpe = esMobile ? 7.5 : 8.0; // Más arriba para mejor visibilidad
    
    this.lineaGolpeY = (this.canvas.height / 10) * proporcionLineaGolpe;
    this.velocidadNotasPxPorSeg = 200 * this.velocidadNota * this.velocidadJuego; // Más lento para mejor jugabilidad
    this.retrasoNota = (this.lineaGolpeY / this.velocidadNotasPxPorSeg); // Sin multiplicar por velocidadJuego
    
    console.log(`🎮 Configuración de juego:
      - Línea de golpe Y: ${this.lineaGolpeY}
      - Velocidad notas: ${this.velocidadNotasPxPorSeg} px/seg
      - Retraso nota: ${this.retrasoNota} segundos
      - Canvas: ${this.canvas.width}x${this.canvas.height}`);

    // Reposicionar carriles
    for (const carril of this.carrilesAcordeon) {
      carril.reposicionar();
    }

    await this.actualizarTiempoActual();
    this.reposicionarNotas();
  }

  registrarEntrada() {
    this.eventoReposicion = () => {
      this.reposicionar();
    };

    this.eventoTeclaPresionada = (evento) => {
      const key = evento.key.toLowerCase();
      this.alPresionarTecla(key);
      
      // Teclas especiales
      if (evento.keyCode === 27) { // ESC
        if (this.pausado) {
          this.vm.reanudarJuego?.();
        } else {
          this.vm.pausarJuego?.();
        }
      }
    };

    this.eventoTeclaLiberada = (evento) => {
      const key = evento.key.toLowerCase();
      this.alLiberarTecla(key);
    };

    if (isBrowser) {
      window.addEventListener("resize", this.eventoReposicion);
      window.addEventListener("orientationchange", this.eventoReposicion, false);
      document.addEventListener("keydown", this.eventoTeclaPresionada, false);
      document.addEventListener("keyup", this.eventoTeclaLiberada, false);
    }
  }

  async alPresionarTecla(key) {
    if (this.estadoTeclasPresionadas[key]) return;
    this.estadoTeclasPresionadas[key] = true;

    // Registro de tecla presionada para todos los carriles
    for (const carril of this.carrilesAcordeon) {
      carril.teclaPresionada(key);
    }
  }

  async alLiberarTecla(key) {
    this.estadoTeclasPresionadas[key] = false;
    
    if (this.notasMantenidas[key]) {
      await this.actualizarTiempoActual();
      this.notasMantenidas[key] = null;
    }
    
    for (const carril of this.carrilesAcordeon) {
      carril.teclaLiberada(key);
    }
  }

  limpiarNotas() {
    console.log('🧹 Limpiando todas las notas de todos los carriles');
    for (const carril of this.carrilesAcordeon) {
      if (carril.limpiarTodasLasNotas) {
        carril.limpiarTodasLasNotas();
      } else {
        carril.arrayNotas = [];
      }
    }
  }

  limpiarNotasPasadas() {
    // Limpiar notas que ya pasaron hace más de 10 segundos
    const tiempoLimite = this.tiempoJuego - 10;
    
    for (const carril of this.carrilesAcordeon) {
      const notasOriginales = carril.arrayNotas.length;
      carril.arrayNotas = carril.arrayNotas.filter(nota => {
        return nota.objetoTecla.tiempo > tiempoLimite;
      });
      
      const notasEliminadas = notasOriginales - carril.arrayNotas.length;
      if (notasEliminadas > 0) {
        console.log(`🧹 Eliminadas ${notasEliminadas} notas pasadas del carril ${carril.idBoton}`);
      }
    }
  }

  reposicionarNotas() {
    // NO crear notas aquí - solo reposicionar las existentes
    for (const carril of this.carrilesAcordeon) {
      // Solo reposicionar notas existentes, no crear nuevas
      for (const nota of carril.arrayNotas) {
        nota.reposicionar();
      }
    }
  }

  estaDentroDelTiempo(nota) {
    const margen = 10; // segundos
    return (
      nota.tiempo <= this.tiempoJuego + margen &&
      nota.tiempo >= this.tiempoJuego - margen
    );
  }

  actualizar() {
    if (this.destruido) return;
    requestAnimationFrame(this.actualizar.bind(this));
    
    this.actualizarTiempoActual();
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.efectosCtx.clearRect(0, 0, this.efectosCanvas.width, this.efectosCanvas.height);

    // Dibujar fondo del juego
    this.dibujarFondo();

    // Actualizar carriles
    for (const carril of this.carrilesAcordeon) {
      carril.actualizar();
    }

    // Bucle de timing del juego
    if (!this.pausado) {
      this.bucleTimingJuego();
    }

    // Actualizar efectos
    this.efectosParticulas.actualizar();

    // Dibujar HUD
    this.dibujarHUD();
  }

  dibujarFondo() {
    // Fondo degradado
    const gradiente = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradiente.addColorStop(0, '#1a1a2e');
    gradiente.addColorStop(1, '#16213e');
    this.ctx.fillStyle = gradiente;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  dibujarHUD() {
    this.ctx.fillStyle = 'white';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'left';
    
    // Puntuación
    this.ctx.fillText(`Puntuación: ${Math.floor(this.resultado.puntuacion)}`, 20, 40);
    
    // Combo
    if (this.resultado.combo > 0) {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.font = '32px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`Combo: ${this.resultado.combo}`, this.canvas.width / 2, 80);
    }
    
    // Fiebre
    if (this.fiebre.valor > 1) {
      this.ctx.fillStyle = '#FF6B6B';
      this.ctx.font = '28px Arial';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(`Fiebre x${this.fiebre.valor}`, this.canvas.width - 20, 40);
    }
    
    // Debug info
    this.ctx.fillStyle = 'yellow';
    this.ctx.font = '14px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Tiempo: ${this.tiempoJuego.toFixed(2)}s`, 20, 80);
    this.ctx.fillText(`Notas procesadas: ${this.indiceArrayTiempos}/${this.arrayTiempos.length}`, 20, 100);
    
    // Contar notas activas
    let notasActivas = 0;
    for (const carril of this.carrilesAcordeon) {
      notasActivas += carril.arrayNotas.length;
    }
    this.ctx.fillText(`Notas activas: ${notasActivas}`, 20, 120);
  }

  async bucleTimingJuego() {
    const tiempoActual = this.tiempoJuego;
    const tiempoAnticipacion = this.retrasoNota;
    
    // Procesar múltiples notas en un solo frame si es necesario
    while (this.indiceArrayTiempos < this.arrayTiempos.length) {
      const notaActual = this.arrayTiempos[this.indiceArrayTiempos];
      
      // Si la nota aún no debe aparecer, salir del bucle
      if (tiempoActual < (notaActual.tiempo - tiempoAnticipacion)) {
        break;
      }
      
      // Buscar el carril correcto para esta nota
      const carril = this.carrilesAcordeon.find(c => c.idBoton === notaActual.idBoton);
      if (carril) {
        // Verificar que la nota no exista ya en el carril
        const yaExiste = carril.arrayNotas.some(nota => 
          nota.objetoTecla.tiempo === notaActual.tiempo && 
          nota.objetoTecla.idBoton === notaActual.idBoton
        );
        
        if (!yaExiste) {
          carril.agregarNota(notaActual);
          console.log(`🎵 Nota agregada: ${notaActual.idBoton} en tiempo ${notaActual.tiempo}s`);
        }
      } else {
        console.warn(`⚠️ No se encontró carril para la nota: ${notaActual.idBoton}`);
      }
      
      this.indiceArrayTiempos++;
    }
    
    // Limpiar notas que ya pasaron hace mucho tiempo
    this.limpiarNotasPasadas();
  }

  async actualizarTiempoActual() {
    if (this.vm.audio && this.vm.audio.playing) {
      this.tiempoActual = this.vm.audio.seek() || 0;
    } else if (this.iniciado && !this.pausado) {
      // Usar cronómetro interno cuando no hay audio
      if (!this.tiempoInicioJuego) {
        this.tiempoInicioJuego = Date.now();
      }
      this.tiempoActual = (Date.now() - this.tiempoInicioJuego) / 1000;
    }
    this.tiempoJuego = this.tiempoActual + Number(this.retrasoNota);
  }

  cargarCancion(datosCancion) {
    console.log('🎵 Cargando canción:', datosCancion.titulo);
    
    // LIMPIAR COMPLETAMENTE ANTES DE CARGAR LA NUEVA CANCIÓN
    this.limpiarNotas();
    this.limpiarResultados();
    
    // Resetear índices y tiempo
    this.indiceArrayTiempos = 0;
    this.tiempoActual = 0;
    this.tiempoJuego = 0;
    this.tiempoInicioJuego = null;
    this.pausado = true;
    this.iniciado = false;
    
    // Cargar datos de la canción
    this.arrayTiempos = datosCancion.notas || [];
    this.cancionActual = datosCancion;
    
    console.log('🎵 Canción cargada con', this.arrayTiempos.length, 'notas');
    
    // Mostrar las primeras 5 notas para debug
    if (this.arrayTiempos.length > 0) {
      console.log('🎵 Primeras notas:', this.arrayTiempos.slice(0, 5));
    }
  }

  limpiarResultados() {
    this.resultado = {
      puntuacion: 0,
      porcentajeTotal: 0,
      notasGolpeadas: 0,
      combo: 0,
      comboMaximo: 0,
      marcas: { perfecto: 0, bueno: 0, desafinado: 0, fallo: 0 },
    };
    this.fiebre = { valor: 1, tiempo: 0, porcentaje: 0 };
    this.salud = 100;
    this.tiempoInicioJuego = null;
    this.tiempoPausado = null;
    this.tiempoActual = 0;
  }

  iniciarCancion() {
    console.log('🎵 Iniciando canción...');
    
    // Limpiar notas residuales antes de iniciar
    this.limpiarNotas();
    
    this.pausado = false;
    this.iniciado = true;
    this.tiempoActual = 0;
    this.tiempoJuego = 0;
    this.indiceArrayTiempos = 0;
    this.tiempoInicioJuego = Date.now();
    
    console.log('🎵 Canción iniciada, procesando', this.arrayTiempos.length, 'notas');
  }

  pausarJuego() {
    this.pausado = true;
    // Guardar el tiempo pausado para el cronómetro interno
    if (this.tiempoInicioJuego) {
      this.tiempoPausado = Date.now();
    }
  }

  reanudarJuego() {
    this.pausado = false;
    // Ajustar el tiempo de inicio para el cronómetro interno
    if (this.tiempoInicioJuego && this.tiempoPausado) {
      const tiempoPausadoTotal = Date.now() - this.tiempoPausado;
      this.tiempoInicioJuego += tiempoPausadoTotal;
      this.tiempoPausado = null;
    }
  }

  destruirInstancia() {
    this.destruido = true;
    if (isBrowser) {
      window.removeEventListener("resize", this.eventoReposicion);
      window.removeEventListener("orientationchange", this.eventoReposicion);
      document.removeEventListener("keydown", this.eventoTeclaPresionada);
      document.removeEventListener("keyup", this.eventoTeclaLiberada);
    }
  }
} 