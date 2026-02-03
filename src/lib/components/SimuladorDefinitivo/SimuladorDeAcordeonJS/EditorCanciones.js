// @ts-nocheck
import { sistemaCanciones } from './SistemaCanciones.js';
import { mapaBotonesPorId } from './notasAcordeonDiatonico.js';

/**
 * Editor de canciones para grabar secuencias
 * Permite crear, editar y exportar canciones del simulador
 */
export class EditorCanciones {
  constructor() {
    this.grabando = false;
    this.pausado = false;
    this.tiempoInicioGrabacion = 0;
    this.tiempoActual = 0;
    this.notasGrabadas = [];
    this.cancionActual = null;
    this.metronomo = null;
    this.tempoActual = 120;
    this.historialAcciones = [];
    this.indiceHistorial = -1;
    this.configuracion = {
      cuantizacion: 0.125, // 1/8 de nota
      velocidadPorDefecto: 1.0,
      duracionMinima: 0.1,
      duracionMaxima: 4.0,
      autoGuardado: true,
      mostrarMetronomo: true,
      modoMagnetico: true // Ajusta automáticamente al tempo
    };
    this.callbacks = {
      onGrabacionIniciada: null,
      onGrabacionPausada: null,
      onGrabacionDetenida: null,
      onNotaGrabada: null,
      onCancionGuardada: null,
      onEstadoCambiado: null
    };
  }

  // Inicializar el editor
  inicializar() {
    this.crearMetronomo();
    this.inicializarEventos();
  }

  // Crear metrónomo
  crearMetronomo() {
    this.metronomo = {
      activo: false,
      intervalo: null,
      contador: 0,
      tiempoPorPulso: 60000 / this.tempoActual, // ms por pulso
      sonido: null,
      ultimoPulso: 0
    };
  }

  // Inicializar eventos del teclado
  inicializarEventos() {
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this.manejarTeclaPresionada.bind(this));
      document.addEventListener('keyup', this.manejarTeclaLiberada.bind(this));
    }
  }

  // Manejar tecla presionada
  manejarTeclaPresionada(evento) {
    if (!this.grabando) return;

    const tecla = evento.key.toLowerCase();
    const ahora = Date.now();
    
    // Buscar botón asociado a la tecla
    const botonId = this.buscarBotonPorTecla(tecla);
    if (botonId) {
      const tiempoRelativo = (ahora - this.tiempoInicioGrabacion) / 1000;
      const tiempoCuantizado = this.cuantizarTiempo(tiempoRelativo);
      
      // Crear nota
      const nota = {
        tiempo: tiempoCuantizado,
        idBoton: botonId,
        duracion: this.configuracion.duracionMinima,
        velocidad: this.configuracion.velocidadPorDefecto,
        tipo: 'normal',
        inicioPulsacion: ahora,
        teclaPulsada: tecla
      };
      
      // Agregar a notas grabadas
      this.notasGrabadas.push(nota);
      
      // Callback
      if (this.callbacks.onNotaGrabada) {
        this.callbacks.onNotaGrabada(nota);
      }
      
      // Prevenir repetición
      evento.preventDefault();
    }
  }

  // Manejar tecla liberada
  manejarTeclaLiberada(evento) {
    if (!this.grabando) return;

    const tecla = evento.key.toLowerCase();
    const ahora = Date.now();
    
    // Buscar la nota correspondiente y actualizar duración
    const notaActiva = this.notasGrabadas.find(n => 
      n.teclaPulsada === tecla && n.inicioPulsacion && !n.duracionFinal
    );
    
    if (notaActiva) {
      const duracionTotal = (ahora - notaActiva.inicioPulsacion) / 1000;
      notaActiva.duracion = Math.max(
        this.configuracion.duracionMinima,
        Math.min(this.configuracion.duracionMaxima, duracionTotal)
      );
      notaActiva.duracionFinal = true;
      
      // Determinar tipo de nota
      if (notaActiva.duracion >= 1.0) {
        notaActiva.tipo = 'mantenida';
      }
      
      delete notaActiva.inicioPulsacion;
      delete notaActiva.teclaPulsada;
    }
  }

  // Buscar botón por tecla
  buscarBotonPorTecla(tecla) {
    const mapeoTeclas = {
      // Primera fila melodía
      'z': '1-1-empujar', 'x': '1-2-empujar', 'c': '1-3-empujar', 'v': '1-4-empujar', 'b': '1-5-empujar',
      'n': '1-6-empujar', 'm': '1-7-empujar', ',': '1-8-empujar', '.': '1-9-empujar', '/': '1-10-empujar',
      
      // Segunda fila melodía
      'a': '2-1-empujar', 's': '2-2-empujar', 'd': '2-3-empujar', 'f': '2-4-empujar', 'g': '2-5-empujar',
      'h': '2-6-empujar', 'j': '2-7-empujar', 'k': '2-8-empujar', 'l': '2-9-empujar', 'ñ': '2-10-empujar',
      
      // Tercera fila melodía
      'q': '3-1-empujar', 'w': '3-2-empujar', 'e': '3-3-empujar', 'r': '3-4-empujar', 't': '3-5-empujar',
      'y': '3-6-empujar', 'u': '3-7-empujar', 'i': '3-8-empujar', 'o': '3-9-empujar', 'p': '3-10-empujar',
      
      // Bajos
      '1': '1-1-empujar-bajo', '2': '1-2-empujar-bajo', '3': '1-3-empujar-bajo', '4': '1-4-empujar-bajo',
      '5': '1-5-empujar-bajo', '6': '1-6-empujar-bajo', '7': '2-1-empujar-bajo', '8': '2-2-empujar-bajo',
      '9': '2-3-empujar-bajo', '0': '2-4-empujar-bajo'
    };
    
    // Determinar dirección del fuelle (shift para halar)
    const direccion = 'empujar'; // Por simplicidad, siempre empujar por ahora
    let botonId = mapeoTeclas[tecla];
    
    if (botonId) {
      // Alternar entre empujar y halar basado en el contexto
      if (this.configuracion.modoMagnetico) {
        botonId = this.ajustarDireccionFuelle(botonId);
      }
    }
    
    return botonId;
  }

  // Ajustar dirección del fuelle automáticamente
  ajustarDireccionFuelle(botonIdBase) {
    // Lógica simple: alternar entre empujar y halar
    const ultimaNota = this.notasGrabadas[this.notasGrabadas.length - 1];
    if (ultimaNota && ultimaNota.idBoton.includes('empujar')) {
      return botonIdBase.replace('empujar', 'halar');
    }
    return botonIdBase;
  }

  // Cuantizar tiempo según la configuración
  cuantizarTiempo(tiempo) {
    if (this.configuracion.cuantizacion === 0) return tiempo;
    
    const tiempoPorPulso = 60 / this.tempoActual;
    const subdivisionTiempo = tiempoPorPulso * this.configuracion.cuantizacion;
    
    return Math.round(tiempo / subdivisionTiempo) * subdivisionTiempo;
  }

  // Iniciar grabación
  iniciarGrabacion() {
    this.grabando = true;
    this.pausado = false;
    this.tiempoInicioGrabacion = Date.now();
    this.notasGrabadas = [];
    
    if (this.configuracion.mostrarMetronomo) {
      this.iniciarMetronomo();
    }
    
    this.guardarEnHistorial('iniciar_grabacion');
    
    if (this.callbacks.onGrabacionIniciada) {
      this.callbacks.onGrabacionIniciada();
    }
    
    this.notificarCambioEstado();
  }

  // Pausar grabación
  pausarGrabacion() {
    this.pausado = !this.pausado;
    
    if (this.pausado) {
      this.detenerMetronomo();
    } else {
      this.tiempoInicioGrabacion = Date.now() - (this.tiempoActual * 1000);
      if (this.configuracion.mostrarMetronomo) {
        this.iniciarMetronomo();
      }
    }
    
    this.guardarEnHistorial('pausar_grabacion');
    
    if (this.callbacks.onGrabacionPausada) {
      this.callbacks.onGrabacionPausada(this.pausado);
    }
    
    this.notificarCambioEstado();
  }

  // Detener grabación
  detenerGrabacion() {
    this.grabando = false;
    this.pausado = false;
    this.detenerMetronomo();
    
    // Limpiar notas que no se completaron
    this.notasGrabadas = this.notasGrabadas.filter(n => n.duracionFinal !== false);
    
    // Ordenar notas por tiempo
    this.notasGrabadas.sort((a, b) => a.tiempo - b.tiempo);
    
    this.guardarEnHistorial('detener_grabacion');
    
    if (this.callbacks.onGrabacionDetenida) {
      this.callbacks.onGrabacionDetenida(this.notasGrabadas);
    }
    
    this.notificarCambioEstado();
  }

  // Iniciar metrónomo
  iniciarMetronomo() {
    this.metronomo.activo = true;
    this.metronomo.contador = 0;
    this.metronomo.ultimoPulso = Date.now();
    
    this.metronomo.intervalo = setInterval(() => {
      this.pulsarMetronomo();
    }, this.metronomo.tiempoPorPulso);
  }

  // Detener metrónomo
  detenerMetronomo() {
    this.metronomo.activo = false;
    if (this.metronomo.intervalo) {
      clearInterval(this.metronomo.intervalo);
      this.metronomo.intervalo = null;
    }
  }

  // Pulsar metrónomo
  pulsarMetronomo() {
    this.metronomo.contador++;
    
    // Reproducir sonido del metrónomo
    if (this.metronomo.sonido) {
      this.metronomo.sonido.play();
    }
    
    // Actualizar tiempo actual
    this.tiempoActual = (Date.now() - this.tiempoInicioGrabacion) / 1000;
  }

  // Cambiar tempo
  cambiarTempo(nuevoTempo) {
    this.tempoActual = Math.max(60, Math.min(200, nuevoTempo));
    this.metronomo.tiempoPorPulso = 60000 / this.tempoActual;
    
    if (this.metronomo.activo) {
      this.detenerMetronomo();
      this.iniciarMetronomo();
    }
    
    this.notificarCambioEstado();
  }

  // Crear nueva canción
  crearNuevaCancion(metadatos = {}) {
    this.cancionActual = {
      id: `cancion-${Date.now()}`,
      titulo: metadatos.titulo || 'Nueva Canción',
      artista: metadatos.artista || 'Artista Desconocido',
      duracion: 0,
      tempo: this.tempoActual,
      dificultad: metadatos.dificultad || 'Personalizada',
      genero: metadatos.genero || 'Personalizada',
      descripcion: metadatos.descripcion || 'Canción creada con el editor',
      notas: [],
      metadatos: {
        creador: 'Editor',
        fechaCreacion: new Date().toISOString(),
        version: '1.0',
        tags: ['personalizada', 'editor'],
        puntuacionMinima: 80,
        velocidadRecomendada: 1.0,
        ...metadatos
      },
      configuracion: {
        velocidadJuego: 1.0,
        velocidadNotas: 1.0,
        modoFiebre: true,
        modoSalud: false,
        permitirFallos: true,
        mostrarLineaAyuda: false,
        ...metadatos.configuracion
      }
    };
    
    this.notificarCambioEstado();
  }

  // Guardar canción
  guardarCancion() {
    if (!this.cancionActual) {
      this.crearNuevaCancion();
    }
    
    // Actualizar notas y duración
    this.cancionActual.notas = [...this.notasGrabadas];
    this.cancionActual.duracion = this.calcularDuracionCancion();
    this.cancionActual.tempo = this.tempoActual;
    
    // Validar canción
    const validacion = sistemaCanciones.validarCancion(this.cancionActual);
    if (!validacion.valida) {
      throw new Error(`Error de validación: ${validacion.error}`);
    }
    
    // Agregar al sistema de canciones
    sistemaCanciones.agregarCancion(this.cancionActual);
    
    // Guardar en localStorage
    this.guardarEnLocalStorage();
    
    this.guardarEnHistorial('guardar_cancion');
    
    if (this.callbacks.onCancionGuardada) {
      this.callbacks.onCancionGuardada(this.cancionActual);
    }
    
    this.notificarCambioEstado();
  }

  // Calcular duración de la canción
  calcularDuracionCancion() {
    if (this.notasGrabadas.length === 0) return 0;
    
    const ultimaNota = this.notasGrabadas[this.notasGrabadas.length - 1];
    return ultimaNota.tiempo + ultimaNota.duracion + 2; // 2 segundos extra
  }

  // Cargar canción
  cargarCancion(cancionId) {
    const cancion = sistemaCanciones.obtenerCancion(cancionId);
    if (!cancion) {
      throw new Error(`Canción no encontrada: ${cancionId}`);
    }
    
    this.cancionActual = { ...cancion };
    this.notasGrabadas = [...cancion.notas];
    this.tempoActual = cancion.tempo || 120;
    
    this.guardarEnHistorial('cargar_cancion', { cancionId });
    this.notificarCambioEstado();
  }

  // Exportar canción
  exportarCancion(formato = 'json') {
    if (!this.cancionActual) {
      throw new Error('No hay canción para exportar');
    }
    
    switch (formato) {
      case 'json':
        return JSON.stringify(this.cancionActual, null, 2);
      
      case 'acordeon':
        return this.exportarFormatoAcordeon();
      
      case 'midi':
        return this.exportarFormatoMidi();
      
      default:
        throw new Error(`Formato no soportado: ${formato}`);
    }
  }

  // Exportar en formato específico del acordeón
  exportarFormatoAcordeon() {
    const datos = {
      version: '1.0',
      acordeon: {
        tipo: 'diatonico',
        afinacion: 'FBE',
        botones: 31
      },
      cancion: this.cancionActual,
      configuracion: {
        editor: 'SimuladorAcordeon',
        fechaExportacion: new Date().toISOString()
      }
    };
    
    return JSON.stringify(datos, null, 2);
  }

  // Exportar a MIDI (simulado)
  exportarFormatoMidi() {
    // Simulación de exportación MIDI
    const midiData = {
      format: 'midi',
      tracks: [
        {
          name: this.cancionActual.titulo,
          tempo: this.cancionActual.tempo,
          events: this.notasGrabadas.map(nota => ({
            time: nota.tiempo,
            type: 'note_on',
            note: this.convertirANotaMidi(nota.idBoton),
            velocity: Math.round(nota.velocidad * 127),
            duration: nota.duracion
          }))
        }
      ]
    };
    
    return JSON.stringify(midiData, null, 2);
  }

  // Convertir ID de botón a nota MIDI
  convertirANotaMidi(idBoton) {
    const boton = mapaBotonesPorId[idBoton];
    if (!boton) return 60; // Do central por defecto
    
    // Conversión simplificada de frecuencia a nota MIDI
    const frecuencia = Array.isArray(boton.frecuencia) ? boton.frecuencia[0] : boton.frecuencia;
    const notaMidi = Math.round(12 * Math.log2(frecuencia / 440) + 69);
    
    return Math.max(0, Math.min(127, notaMidi));
  }

  // Importar canción
  importarCancion(datos, formato = 'json') {
    try {
      let cancion;
      
      switch (formato) {
        case 'json':
          cancion = JSON.parse(datos);
          break;
        
        case 'acordeon':
          const datosAcordeon = JSON.parse(datos);
          cancion = datosAcordeon.cancion;
          break;
        
        default:
          throw new Error(`Formato de importación no soportado: ${formato}`);
      }
      
      // Validar canción importada
      const validacion = sistemaCanciones.validarCancion(cancion);
      if (!validacion.valida) {
        throw new Error(`Error de validación: ${validacion.error}`);
      }
      
      // Cargar canción
      this.cancionActual = cancion;
      this.notasGrabadas = [...cancion.notas];
      this.tempoActual = cancion.tempo || 120;
      
      this.guardarEnHistorial('importar_cancion');
      this.notificarCambioEstado();
      
      return cancion;
    } catch (error) {
      throw new Error(`Error al importar canción: ${error.message}`);
    }
  }

  // Deshacer acción
  deshacer() {
    if (this.indiceHistorial > 0) {
      this.indiceHistorial--;
      const accion = this.historialAcciones[this.indiceHistorial];
      this.restaurarEstado(accion.estadoAnterior);
      this.notificarCambioEstado();
    }
  }

  // Rehacer acción
  rehacer() {
    if (this.indiceHistorial < this.historialAcciones.length - 1) {
      this.indiceHistorial++;
      const accion = this.historialAcciones[this.indiceHistorial];
      this.restaurarEstado(accion.estadoPosterior);
      this.notificarCambioEstado();
    }
  }

  // Guardar en historial
  guardarEnHistorial(tipo, datos = {}) {
    const estado = {
      notasGrabadas: [...this.notasGrabadas],
      cancionActual: this.cancionActual ? { ...this.cancionActual } : null,
      tempoActual: this.tempoActual,
      configuracion: { ...this.configuracion }
    };
    
    const accion = {
      tipo,
      datos,
      estadoAnterior: this.historialAcciones[this.indiceHistorial]?.estadoPosterior || estado,
      estadoPosterior: estado,
      timestamp: Date.now()
    };
    
    // Limitar historial a 50 acciones
    if (this.historialAcciones.length >= 50) {
      this.historialAcciones.shift();
    } else {
      this.indiceHistorial++;
    }
    
    this.historialAcciones[this.indiceHistorial] = accion;
    
    // Eliminar acciones futuras si estamos en el medio del historial
    this.historialAcciones = this.historialAcciones.slice(0, this.indiceHistorial + 1);
  }

  // Restaurar estado
  restaurarEstado(estado) {
    this.notasGrabadas = [...estado.notasGrabadas];
    this.cancionActual = estado.cancionActual ? { ...estado.cancionActual } : null;
    this.tempoActual = estado.tempoActual;
    this.configuracion = { ...estado.configuracion };
  }

  // Guardar en localStorage
  guardarEnLocalStorage() {
    if (typeof localStorage !== 'undefined') {
      const datos = {
        cancionActual: this.cancionActual,
        notasGrabadas: this.notasGrabadas,
        tempoActual: this.tempoActual,
        configuracion: this.configuracion
      };
      
      localStorage.setItem('editor-acordeon', JSON.stringify(datos));
    }
  }

  // Cargar desde localStorage
  cargarDesdeLocalStorage() {
    if (typeof localStorage !== 'undefined') {
      const datos = localStorage.getItem('editor-acordeon');
      if (datos) {
        try {
          const estado = JSON.parse(datos);
          this.cancionActual = estado.cancionActual;
          this.notasGrabadas = estado.notasGrabadas || [];
          this.tempoActual = estado.tempoActual || 120;
          this.configuracion = { ...this.configuracion, ...estado.configuracion };
          
          this.notificarCambioEstado();
        } catch (error) {
          console.error('Error al cargar desde localStorage:', error);
        }
      }
    }
  }

  // Limpiar editor
  limpiar() {
    this.cancionActual = null;
    this.notasGrabadas = [];
    this.tempoActual = 120;
    this.historialAcciones = [];
    this.indiceHistorial = -1;
    
    this.guardarEnHistorial('limpiar_editor');
    this.notificarCambioEstado();
  }

  // Obtener estadísticas del editor
  obtenerEstadisticas() {
    return {
      notasGrabadas: this.notasGrabadas.length,
      duracionCancion: this.calcularDuracionCancion(),
      tempoActual: this.tempoActual,
      tiempoGrabacion: this.tiempoActual,
      accionesEnHistorial: this.historialAcciones.length,
      cancionCargada: !!this.cancionActual
    };
  }

  // Notificar cambio de estado
  notificarCambioEstado() {
    if (this.callbacks.onEstadoCambiado) {
      this.callbacks.onEstadoCambiado(this.obtenerEstadoCompleto());
    }
  }

  // Obtener estado completo
  obtenerEstadoCompleto() {
    return {
      grabando: this.grabando,
      pausado: this.pausado,
      cancionActual: this.cancionActual,
      notasGrabadas: this.notasGrabadas,
      tempoActual: this.tempoActual,
      metronomo: this.metronomo,
      configuracion: this.configuracion,
      estadisticas: this.obtenerEstadisticas()
    };
  }

  // Configurar callback
  configurarCallback(nombre, callback) {
    if (this.callbacks.hasOwnProperty(nombre)) {
      this.callbacks[nombre] = callback;
    }
  }

  // Destruir editor
  destruir() {
    this.detenerGrabacion();
    this.detenerMetronomo();
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this.manejarTeclaPresionada);
      document.removeEventListener('keyup', this.manejarTeclaLiberada);
    }
  }
}

// Instancia global del editor
export const editorCanciones = new EditorCanciones(); 