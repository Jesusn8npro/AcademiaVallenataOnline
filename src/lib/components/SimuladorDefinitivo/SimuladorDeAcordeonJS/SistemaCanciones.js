// @ts-nocheck
import { mapaBotonesPorId } from './notasAcordeonDiatonico.js';

/**
 * Sistema de canciones para el simulador de acordeón
 * Basado en el Rhythm-Plus-Music-Game-master
 */

export class SistemaCanciones {
  constructor() {
    this.canciones = new Map();
    this.lecciones = new Map();
    this.cancionActual = null;
    this.progreso = new Map();
    this.estadisticas = new Map();
    this.inicializarCancionesPorDefecto();
    // cargarCancionesPersonalizadas se debe llamar por separado ya que ahora es async
  }

  inicializarCancionesPorDefecto() {
    // Canciones de aprendizaje básico
    this.agregarCancion(this.crearCancionBasica());
    this.agregarCancion(this.crearCancionVallenato());
    this.agregarCancion(this.crearCancionCumbia());
    this.agregarCancion(this.crearCancionMerengue());
    this.agregarCancion(this.crearCancionPorro());
    
    // Lecciones de aprendizaje
    this.agregarLeccion(this.crearLeccionBasica());
    this.agregarLeccion(this.crearLeccionRitmo());
    this.agregarLeccion(this.crearLeccionMelodia());
  }

  // Crear una canción básica de aprendizaje
  crearCancionBasica() {
    const notas = [
      // Introducción simple
      { tiempo: 2.0, idBoton: '1-4-empujar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.5, idBoton: '1-5-empujar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.0, idBoton: '1-6-empujar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.5, idBoton: '1-7-empujar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 4.0, idBoton: '1-8-empujar', duracion: 1.0, velocidad: 1.0, tipo: 'normal' },
      
      // Cambio de dirección
      { tiempo: 5.5, idBoton: '1-8-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 6.0, idBoton: '1-7-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 6.5, idBoton: '1-6-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 7.0, idBoton: '1-5-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 7.5, idBoton: '1-4-halar', duracion: 1.0, velocidad: 1.0, tipo: 'normal' },
      
      // Agregar bajos
      { tiempo: 9.0, idBoton: '1-1-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 9.5, idBoton: '1-2-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 10.0, idBoton: '1-3-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 10.5, idBoton: '1-4-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      
      // Final con combinación
      { tiempo: 12.0, idBoton: '1-4-empujar', duracion: 2.0, velocidad: 1.0, tipo: 'mantenida' },
      { tiempo: 12.0, idBoton: '1-1-empujar-bajo', duracion: 2.0, velocidad: 1.0, tipo: 'mantenida' },
    ];

    return {
      id: 'basica-aprendizaje',
      titulo: 'Primeros Pasos',
      artista: 'Lección Básica',
      duracion: 15,
      tempo: 100,
      dificultad: 'Principiante',
      genero: 'Educativa',
      descripcion: 'Aprende los movimientos básicos del acordeón',
      imagen: '/static/lecciones/basica.png',
      notas: notas,
      metadatos: {
        creador: 'Sistema',
        fechaCreacion: new Date().toISOString(),
        version: '1.0',
        tags: ['principiante', 'básico', 'educativa'],
        puntuacionMinima: 80,
        velocidadRecomendada: 0.8
      },
      configuracion: {
        velocidadJuego: 1.0,
        velocidadNotas: 1.0,
        modoFiebre: false,
        modoSalud: false,
        permitirFallos: true,
        mostrarLineaAyuda: true
      }
    };
  }

  // Crear canción de vallenato
  crearCancionVallenato() {
    const notas = [
      // Patrón básico de vallenato
      { tiempo: 1.0, idBoton: '1-1-empujar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.25, idBoton: '1-2-empujar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.5, idBoton: '1-3-halar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.75, idBoton: '1-4-halar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      
      // Melodía principal
      { tiempo: 2.0, idBoton: '1-5-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.5, idBoton: '1-6-empujar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.0, idBoton: '1-7-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.5, idBoton: '1-8-empujar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      
      // Patrón rítmico complejo
      { tiempo: 4.0, idBoton: '2-4-empujar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 4.25, idBoton: '2-5-halar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 4.5, idBoton: '2-6-empujar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 4.75, idBoton: '2-7-halar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      
      // Continuación con bajos
      { tiempo: 5.0, idBoton: '1-1-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 5.5, idBoton: '2-3-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 6.0, idBoton: '1-4-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 6.5, idBoton: '2-1-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      
      // Final con acorde
      { tiempo: 8.0, idBoton: '1-4-empujar', duracion: 2.0, velocidad: 1.0, tipo: 'mantenida' },
      { tiempo: 8.0, idBoton: '1-6-empujar', duracion: 2.0, velocidad: 1.0, tipo: 'mantenida' },
      { tiempo: 8.0, idBoton: '1-8-empujar', duracion: 2.0, velocidad: 1.0, tipo: 'mantenida' },
    ];

    return {
      id: 'vallenato-tradicional',
      titulo: 'Vallenato Tradicional',
      artista: 'Folklore Colombiano',
      duracion: 12,
      tempo: 130,
      dificultad: 'Intermedio',
      genero: 'Vallenato',
      descripcion: 'Patrón tradicional del vallenato con melodía y bajos',
      imagen: '/static/lecciones/vallenato.png',
      notas: notas,
      metadatos: {
        creador: 'Sistema',
        fechaCreacion: new Date().toISOString(),
        version: '1.0',
        tags: ['vallenato', 'tradicional', 'intermedio'],
        puntuacionMinima: 85,
        velocidadRecomendada: 1.0
      },
      configuracion: {
        velocidadJuego: 1.0,
        velocidadNotas: 1.0,
        modoFiebre: true,
        modoSalud: true,
        permitirFallos: true,
        mostrarLineaAyuda: false
      }
    };
  }

  // Crear canción de cumbia
  crearCancionCumbia() {
    const notas = [
      // Patrón típico de cumbia
      { tiempo: 1.0, idBoton: '1-1-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.5, idBoton: '1-3-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.0, idBoton: '2-1-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.5, idBoton: '2-3-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      
      // Melodía característica
      { tiempo: 3.0, idBoton: '3-3-halar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.25, idBoton: '3-4-empujar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.5, idBoton: '3-5-halar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.75, idBoton: '3-6-empujar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 4.0, idBoton: '3-7-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      
      // Variaciones y adornos
      { tiempo: 5.0, idBoton: '2-8-empujar', duracion: 0.3, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 5.3, idBoton: '2-9-halar', duracion: 0.3, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 5.6, idBoton: '2-10-empujar', duracion: 0.4, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 6.0, idBoton: '2-11-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
    ];

    return {
      id: 'cumbia-tradicional',
      titulo: 'Cumbia Tradicional',
      artista: 'Folklore Colombiano',
      duracion: 10,
      tempo: 110,
      dificultad: 'Avanzado',
      genero: 'Cumbia',
      descripcion: 'Ritmo tradicional de cumbia con patrones complejos',
      imagen: '/static/lecciones/cumbia.png',
      notas: notas,
      metadatos: {
        creador: 'Sistema',
        fechaCreacion: new Date().toISOString(),
        version: '1.0',
        tags: ['cumbia', 'tradicional', 'avanzado'],
        puntuacionMinima: 90,
        velocidadRecomendada: 1.0
      },
      configuracion: {
        velocidadJuego: 1.0,
        velocidadNotas: 1.2,
        modoFiebre: true,
        modoSalud: true,
        permitirFallos: false,
        mostrarLineaAyuda: false
      }
    };
  }

  // Crear canción de merengue
  crearCancionMerengue() {
    const notas = [
      // Patrón típico de merengue
      { tiempo: 1.0, idBoton: '1-1-empujar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.25, idBoton: '1-2-empujar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.5, idBoton: '1-1-empujar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.75, idBoton: '1-3-halar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      
      // Melodía rápida
      { tiempo: 2.0, idBoton: '2-5-halar', duracion: 0.2, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.2, idBoton: '2-6-empujar', duracion: 0.2, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.4, idBoton: '2-7-halar', duracion: 0.2, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.6, idBoton: '2-8-empujar', duracion: 0.2, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.8, idBoton: '2-9-halar', duracion: 0.2, velocidad: 1.0, tipo: 'normal' },
      
      // Continuación del patrón
      { tiempo: 3.0, idBoton: '1-2-empujar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.25, idBoton: '1-4-halar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.5, idBoton: '1-1-empujar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.75, idBoton: '1-3-halar-bajo', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
    ];

    return {
      id: 'merengue-tipico',
      titulo: 'Merengue Típico',
      artista: 'Música Caribeña',
      duracion: 8,
      tempo: 150,
      dificultad: 'Intermedio',
      genero: 'Merengue',
      descripción: 'Ritmo alegre y rápido del merengue caribeño',
      imagen: '/static/lecciones/merengue.png',
      notas: notas,
      metadatos: {
        creador: 'Sistema',
        fechaCreacion: new Date().toISOString(),
        version: '1.0',
        tags: ['merengue', 'caribeño', 'rápido'],
        puntuacionMinima: 85,
        velocidadRecomendada: 1.1
      },
      configuracion: {
        velocidadJuego: 1.1,
        velocidadNotas: 1.0,
        modoFiebre: true,
        modoSalud: true,
        permitirFallos: true,
        mostrarLineaAyuda: false
      }
    };
  }

  // Crear canción de porro
  crearCancionPorro() {
    const notas = [
      // Patrón típico del porro
      { tiempo: 1.0, idBoton: '1-1-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 1.5, idBoton: '1-2-empujar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.0, idBoton: '1-3-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 2.5, idBoton: '1-4-halar-bajo', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      
      // Melodía festiva
      { tiempo: 3.0, idBoton: '1-8-empujar', duracion: 0.3, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.3, idBoton: '1-9-halar', duracion: 0.3, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 3.6, idBoton: '1-10-empujar', duracion: 0.4, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 4.0, idBoton: '2-8-empujar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 4.5, idBoton: '2-9-halar', duracion: 0.5, velocidad: 1.0, tipo: 'normal' },
      
      // Variaciones
      { tiempo: 5.0, idBoton: '3-6-empujar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 5.25, idBoton: '3-7-halar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 5.5, idBoton: '3-8-empujar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 5.75, idBoton: '3-9-halar', duracion: 0.25, velocidad: 1.0, tipo: 'normal' },
      { tiempo: 6.0, idBoton: '3-10-empujar', duracion: 1.0, velocidad: 1.0, tipo: 'normal' },
    ];

    return {
      id: 'porro-sabanero',
      titulo: 'Porro Sabanero',
      artista: 'Música Costeña',
      duracion: 9,
      tempo: 140,
      dificultad: 'Intermedio',
      genero: 'Porro',
      descripción: 'Ritmo festivo del porro de la costa atlántica',
      imagen: '/static/lecciones/porro.png',
      notas: notas,
      metadatos: {
        creador: 'Sistema',
        fechaCreacion: new Date().toISOString(),
        version: '1.0',
        tags: ['porro', 'festivo', 'costeño'],
        puntuacionMinima: 85,
        velocidadRecomendada: 1.0
      },
      configuracion: {
        velocidadJuego: 1.0,
        velocidadNotas: 1.0,
        modoFiebre: true,
        modoSalud: true,
        permitirFallos: true,
        mostrarLineaAyuda: false
      }
    };
  }

  // Crear lección básica
  crearLeccionBasica() {
    return {
      id: 'leccion-basica',
      titulo: 'Fundamentos del Acordeón',
      descripcion: 'Aprende los movimientos básicos y la posición correcta',
      dificultad: 'Principiante',
      duracionEstimada: 10, // minutos
      objetivos: [
        'Aprender la posición correcta del acordeón',
        'Dominar los movimientos básicos de empujar y halar',
        'Reconocer las notas básicas del acordeón',
        'Practicar la coordinación entre melodía y bajos'
      ],
      pasos: [
        {
          titulo: 'Posición del Acordeón',
          descripcion: 'Coloca el acordeón correctamente en tu cuerpo',
          tipo: 'explicacion',
          duracion: 2
        },
        {
          titulo: 'Movimiento de Empujar',
          descripcion: 'Practica el movimiento básico de empujar el fuelle',
          tipo: 'practica',
          cancionId: 'ejercicio-empujar',
          duracion: 3
        },
        {
          titulo: 'Movimiento de Halar',
          descripcion: 'Practica el movimiento básico de halar el fuelle',
          tipo: 'practica',
          cancionId: 'ejercicio-halar',
          duracion: 3
        },
        {
          titulo: 'Combinación de Movimientos',
          descripcion: 'Alterna entre empujar y halar fluidamente',
          tipo: 'practica',
          cancionId: 'basica-aprendizaje',
          duracion: 2
        }
      ],
      recompensas: {
        puntos: 100,
        insignias: ['primer-paso', 'movimiento-basico'],
        desbloqueables: ['leccion-ritmo']
      }
    };
  }

  // Crear lección de ritmo
  crearLeccionRitmo() {
    return {
      id: 'leccion-ritmo',
      titulo: 'Ritmos Básicos',
      descripcion: 'Aprende los patrones rítmicos fundamentales',
      dificultad: 'Intermedio',
      duracionEstimada: 15,
      prerequisitos: ['leccion-basica'],
      objetivos: [
        'Dominar el patrón rítmico del vallenato',
        'Practicar la coordinación rítmica',
        'Aprender a mantener el tempo',
        'Desarrollar la musicalidad'
      ],
      pasos: [
        {
          titulo: 'Patrón de Vallenato',
          descripcion: 'Aprende el patrón básico del vallenato',
          tipo: 'practica',
          cancionId: 'vallenato-tradicional',
          duracion: 5
        },
        {
          titulo: 'Coordinación de Bajos',
          descripcion: 'Practica la coordinación entre melodía y bajos',
          tipo: 'practica',
          cancionId: 'ejercicio-coordinacion',
          duracion: 5
        },
        {
          titulo: 'Tempo y Ritmo',
          descripcion: 'Mantén el tempo constante durante la canción',
          tipo: 'practica',
          cancionId: 'ejercicio-tempo',
          duracion: 5
        }
      ],
      recompensas: {
        puntos: 200,
        insignias: ['maestro-ritmo', 'vallenato-basico'],
        desbloqueables: ['leccion-melodia']
      }
    };
  }

  // Crear lección de melodía
  crearLeccionMelodia() {
    return {
      id: 'leccion-melodia',
      titulo: 'Melodías y Armonías',
      descripcion: 'Aprende a crear melodías hermosas y armonías',
      dificultad: 'Avanzado',
      duracionEstimada: 20,
      prerequisitos: ['leccion-ritmo'],
      objetivos: [
        'Crear melodías fluidas',
        'Dominar las armonías básicas',
        'Combinar melodía y ritmo',
        'Desarrollar expresión musical'
      ],
      pasos: [
        {
          titulo: 'Escalas Básicas',
          descripcion: 'Practica las escalas fundamentales',
          tipo: 'practica',
          cancionId: 'ejercicio-escalas',
          duracion: 7
        },
        {
          titulo: 'Armonías Simples',
          descripcion: 'Aprende a crear armonías con acordes básicos',
          tipo: 'practica',
          cancionId: 'ejercicio-armonias',
          duracion: 8
        },
        {
          titulo: 'Melodía Completa',
          descripcion: 'Toca una melodía completa con armonía',
          tipo: 'practica',
          cancionId: 'cumbia-tradicional',
          duracion: 5
        }
      ],
      recompensas: {
        puntos: 300,
        insignias: ['melodia-maestra', 'armonias-basicas'],
        desbloqueables: ['modo-libre']
      }
    };
  }

  // Métodos del sistema
  agregarCancion(cancion) {
    console.log(`🎵 Agregando canción: ${cancion.titulo} (ID: ${cancion.id})`);
    console.log(`📊 Metadatos:`, cancion.metadatos);
    
    this.canciones.set(cancion.id, cancion);
    console.log(`✅ Canción agregada al Map. Total canciones: ${this.canciones.size}`);
    
    // Verificar que se agregó correctamente
    const cancionVerificada = this.canciones.get(cancion.id);
    if (cancionVerificada) {
      console.log(`✅ Canción verificada en Map: ${cancionVerificada.titulo}`);
    } else {
      console.error(`❌ Error: Canción no encontrada en Map después de agregar`);
    }
    
    this.guardarCancionesPersonalizadas();
  }

  agregarLeccion(leccion) {
    this.lecciones.set(leccion.id, leccion);
  }

  obtenerCancion(id) {
    return this.canciones.get(id);
  }

  obtenerLeccion(id) {
    return this.lecciones.get(id);
  }

  obtenerCancionesPorDificultad(dificultad) {
    return Array.from(this.canciones.values()).filter(c => c.dificultad === dificultad);
  }

  obtenerCancionesPorGenero(genero) {
    return Array.from(this.canciones.values()).filter(c => c.genero === genero);
  }

  obtenerTodasLasCanciones() {
    return Array.from(this.canciones.values());
  }

  obtenerTodasLasLecciones() {
    return Array.from(this.lecciones.values());
  }

  // Validar si una canción tiene la estructura correcta
  validarCancion(cancion) {
    const camposRequeridos = ['id', 'titulo', 'artista', 'duracion', 'notas'];
    const camposOpcionales = ['tempo', 'dificultad', 'genero', 'descripcion', 'imagen', 'metadatos', 'configuracion'];
    
    // Verificar campos requeridos
    for (const campo of camposRequeridos) {
      if (!cancion[campo]) {
        return { valida: false, error: `Campo requerido faltante: ${campo}` };
      }
    }
    
    // Verificar estructura de notas
    if (!Array.isArray(cancion.notas)) {
      return { valida: false, error: 'Las notas deben ser un array' };
    }
    
    for (const nota of cancion.notas) {
      if (!nota.tiempo || !nota.idBoton || !nota.duracion) {
        return { valida: false, error: 'Cada nota debe tener tiempo, idBoton y duracion' };
      }
      
      if (!mapaBotonesPorId[nota.idBoton]) {
        return { valida: false, error: `ID de botón inválido: ${nota.idBoton}` };
      }
    }
    
    return { valida: true };
  }

  // Guardar progreso del usuario
  guardarProgreso(cancionId, resultado) {
    if (!this.progreso.has(cancionId)) {
      this.progreso.set(cancionId, []);
    }
    
    this.progreso.get(cancionId).push({
      fecha: new Date().toISOString(),
      puntuacion: resultado.puntuacion,
      precision: resultado.precision,
      combo: resultado.comboMaximo,
      completado: resultado.completado
    });
    
    // Guardar en localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('progreso-acordeon', JSON.stringify(Array.from(this.progreso.entries())));
    }
  }

  // Cargar progreso del usuario
  cargarProgreso() {
    if (typeof localStorage !== 'undefined') {
      const progreso = localStorage.getItem('progreso-acordeon');
      if (progreso) {
        this.progreso = new Map(JSON.parse(progreso));
      }
    }
  }

  // Guardar canciones personalizadas en localStorage
  guardarCancionesPersonalizadas() {
    if (typeof localStorage !== 'undefined') {
      const todasLasCanciones = Array.from(this.canciones.values());
      console.log(`🔍 Total canciones en memoria: ${todasLasCanciones.length}`);
      
      const cancionesPersonalizadas = todasLasCanciones.filter(cancion => {
        const esPersonalizada = cancion.metadatos?.creador === 'Editor' || 
                               cancion.metadatos?.creador === 'Usuario' ||
                               cancion.metadatos?.esPersonalizada === true ||
                               cancion.id.includes('cancion_'); // IDs generados por el editor
        
        if (esPersonalizada) {
          console.log(`📝 Canción personalizada detectada: ${cancion.titulo} (ID: ${cancion.id})`);
        }
        
        return esPersonalizada;
      });
      
      localStorage.setItem('cancionesPersonalizadas', JSON.stringify(cancionesPersonalizadas));
      console.log(`💾 Guardadas ${cancionesPersonalizadas.length} canciones personalizadas en localStorage`);
      
      // Verificar que se guardó correctamente
      const verificacion = localStorage.getItem('cancionesPersonalizadas');
      if (verificacion) {
        const cancionesVerificadas = JSON.parse(verificacion);
        console.log(`✅ Verificación: ${cancionesVerificadas.length} canciones en localStorage`);
      }
    } else {
      console.error('❌ localStorage no está disponible');
    }
  }

  // Cargar canciones personalizadas desde localStorage
  async cargarCancionesPersonalizadas() {
    if (typeof localStorage !== 'undefined') {
      const cancionesGuardadas = localStorage.getItem('cancionesPersonalizadas');
      if (cancionesGuardadas) {
        const canciones = JSON.parse(cancionesGuardadas);
        canciones.forEach(cancion => {
          // Solo agregar si no existe ya (evitar duplicados)
          if (!this.canciones.has(cancion.id)) {
            this.canciones.set(cancion.id, cancion);
          }
        });
        console.log(`📁 Cargadas ${canciones.length} canciones personalizadas desde localStorage`);
      }
    }
    
    // También cargar desde Supabase si está disponible
    await this.cargarCancionesDesdeSupabase();
  }

  // Cargar canciones desde Supabase
  async cargarCancionesDesdeSupabase() {
    try {
      // Importar dinámicamente para evitar errores en el servidor
      const { supabase } = await import('$lib/supabase/clienteSupabase');
      const { default: CancionesService } = await import('$lib/services/cancionesService');
      
      console.log('🔍 Cargando canciones desde Supabase...');
      
      // Obtener canciones activas
      const canciones = await CancionesService.obtenerCancionesActivas();
      
      if (canciones && canciones.length > 0) {
        console.log(`📥 Encontradas ${canciones.length} canciones en Supabase`);
        
        for (const cancionSupabase of canciones) {
          // Convertir formato de Supabase al formato del sistema
          const cancionConvertida = await this.convertirCancionSupabaseAFormato(cancionSupabase);
          
          if (cancionConvertida) {
            // Solo agregar si no existe ya (evitar duplicados)
            if (!this.canciones.has(cancionConvertida.id)) {
              this.canciones.set(cancionConvertida.id, cancionConvertida);
              console.log(`✅ Canción cargada: ${cancionConvertida.titulo}`);
            }
          }
        }
        
        console.log(`🎵 Total canciones cargadas desde Supabase: ${canciones.length}`);
      } else {
        console.log('📭 No se encontraron canciones en Supabase');
      }
      
    } catch (error) {
      console.error('❌ Error cargando canciones desde Supabase:', error);
      // No lanzar error, continuar con canciones locales
    }
  }

  // Convertir canción de Supabase al formato del sistema
  async convertirCancionSupabaseAFormato(cancionSupabase) {
    try {
      console.log('🔍 CONVIRTIENDO CANCIÓN DE SUPABASE:');
      console.log('🎵 Canción:', cancionSupabase.titulo);
      console.log('🎵 ID:', cancionSupabase.id);
      
      // Obtener secuencias de la canción
      const { default: CancionesService } = await import('$lib/services/cancionesService');
      const secuencias = await CancionesService.obtenerSecuenciasCancion(cancionSupabase.id);
      
      console.log('🎵 Secuencias encontradas:', secuencias ? secuencias.length : 0);
      
      if (!secuencias || secuencias.length === 0) {
        console.warn(`⚠️ No se encontraron secuencias para la canción: ${cancionSupabase.titulo}`);
        return null;
      }
      
      // Usar la secuencia principal
      const secuenciaPrincipal = secuencias.find(s => s.es_secuencia_principal) || secuencias[0];
      console.log('🎵 Secuencia principal:', {
        id: secuenciaPrincipal.id,
        nombre: secuenciaPrincipal.nombre_secuencia,
        notasCount: secuenciaPrincipal.notas_secuencia ? secuenciaPrincipal.notas_secuencia.length : 0
      });
      
      // Convertir notas al formato del sistema
      const notasConvertidas = this.convertirNotasSupabaseAFormato(secuenciaPrincipal.notas_secuencia);
      
      console.log('🎵 Notas convertidas para canción:', notasConvertidas.length);
      
      const cancionConvertida = {
        id: `supabase-${cancionSupabase.id}`,
        titulo: cancionSupabase.titulo,
        artista: cancionSupabase.artista,
        duracion: cancionSupabase.duracion_segundos,
        tempo: cancionSupabase.bpm || 120,
        dificultad: this.mapearDificultad(cancionSupabase.dificultad_tecnica),
        genero: cancionSupabase.genero || 'Vallenato',
        descripcion: cancionSupabase.descripcion || 'Canción creada en Editor Max',
        imagen: '/static/lecciones/custom.png',
        notas: notasConvertidas,
        audio_url: cancionSupabase.url_audio, // URL del audio en Supabase
        metadatos: {
          creador: 'Editor Max',
          fechaCreacion: cancionSupabase.created_at,
          version: '1.0',
          tags: cancionSupabase.tags || ['editor-max', 'personalizada'],
          puntuacionMinima: cancionSupabase.precision_minima_requerida || 75,
          velocidadRecomendada: 1.0,
          esPersonalizada: true,
          supabaseId: cancionSupabase.id
        },
        configuracion: {
          velocidadJuego: 1.0,
          velocidadNotas: 1.0,
          modoFiebre: true,
          modoSalud: true,
          permitirFallos: true,
          mostrarLineaAyuda: cancionSupabase.dificultad_tecnica === 'principiante'
        }
      };
      
      console.log('✅ Canción convertida exitosamente:', {
        id: cancionConvertida.id,
        titulo: cancionConvertida.titulo,
        notasCount: cancionConvertida.notas.length,
        tieneAudio: !!cancionConvertida.audio_url
      });
      
      return cancionConvertida;
      
    } catch (error) {
      console.error(`❌ Error convirtiendo canción ${cancionSupabase.titulo}:`, error);
      return null;
    }
  }

  // Convertir notas de Supabase al formato del sistema
  convertirNotasSupabaseAFormato(notasSupabase) {
    if (!notasSupabase || !Array.isArray(notasSupabase)) {
      console.warn('⚠️ notasSupabase no es un array válido:', notasSupabase);
      return [];
    }
    
    console.log('🔍 CONVIRTIENDO NOTAS DE SUPABASE:');
    console.log('🎵 Notas recibidas:', notasSupabase.length);
    console.log('🎵 Estructura primera nota original:', notasSupabase[0]);
    
    const notasConvertidas = notasSupabase.map(nota => {
      // Formato corregido para el sistema de carriles
      const notaConvertida = {
        // Formato original para compatibilidad con el sistema actual
        tiempo: (nota.timestamp_ms || 0) / 1000, // Convertir ms a segundos para el sistema
        idBoton: nota.nota_id || 'desconocida',
        duracion: (nota.duracion_ms || 200) / 1000, // Convertir ms a segundos para el sistema
        velocidad: 1.0,
        tipo: nota.duracion_ms > 800 ? 'mantenida' : 'normal',
        direccion: nota.fuelle_direccion || 'halar',
        
        // Formato nuevo para el sistema de carriles
        tiempo_ms: nota.timestamp_ms || 0,
        duracion_ms: nota.duracion_ms || 200,
        nota_id: nota.nota_id || 'desconocida',
        fuelle: nota.fuelle_direccion || 'halar',
        nombre: nota.nota_nombre || 'Nota',
        
        // Mantener datos originales para debug
        timestamp_ms: nota.timestamp_ms,
        nota_nombre: nota.nota_nombre
      };
      
      return notaConvertida;
    }).filter(nota => {
      const esValida = nota.idBoton !== 'desconocida' && nota.nota_id !== 'desconocida';
      if (!esValida) {
        console.warn('⚠️ Nota descartada:', nota);
      }
      return esValida;
    });
    
    console.log('🎵 Notas convertidas exitosamente:', notasConvertidas.length);
    console.log('🎵 Estructura primera nota convertida:', notasConvertidas[0]);
    
    if (notasConvertidas.length === 0) {
      console.error('❌ NO SE CONVIRTIERON NOTAS DE SUPABASE - REVISAR ESTRUCTURA');
    }
    
    return notasConvertidas;
  }

  // Mapear dificultad de Supabase al formato del sistema
  mapearDificultad(dificultadSupabase) {
    const mapeo = {
      'principiante': 'Principiante',
      'intermedio': 'Intermedio',
      'avanzado': 'Avanzado',
      'experto': 'Experto'
    };
    
    return mapeo[dificultadSupabase] || 'Intermedio';
  }

  // Eliminar una canción específica
  eliminarCancion(id) {
    const eliminada = this.canciones.delete(id);
    if (eliminada) {
      this.guardarCancionesPersonalizadas();
      console.log(`🗑️ Canción eliminada: ${id}`);
    }
    return eliminada;
  }

  // Obtener estadísticas del usuario
  obtenerEstadisticas() {
    const stats = {
      cancionesJugadas: this.progreso.size,
      puntuacionPromedio: 0,
      precisionPromedio: 0,
      comboMaximo: 0,
      tiempoTotal: 0,
      cancionesMaestras: 0
    };
    
    let totalPuntuacion = 0;
    let totalPrecision = 0;
    let totalJuegos = 0;
    
    for (const [cancionId, historial] of this.progreso) {
      const cancion = this.obtenerCancion(cancionId);
      if (cancion) {
        stats.tiempoTotal += cancion.duracion * historial.length;
      }
      
      for (const juego of historial) {
        totalPuntuacion += juego.puntuacion;
        totalPrecision += juego.precision;
        totalJuegos++;
        
        if (juego.combo > stats.comboMaximo) {
          stats.comboMaximo = juego.combo;
        }
        
        if (juego.puntuacion >= (cancion?.metadatos?.puntuacionMinima || 90)) {
          stats.cancionesMaestras++;
        }
      }
    }
    
    if (totalJuegos > 0) {
      stats.puntuacionPromedio = totalPuntuacion / totalJuegos;
      stats.precisionPromedio = totalPrecision / totalJuegos;
    }
    
    return stats;
  }

  // Generar canción aleatoria para práctica
  generarCancionAleatoria(duracion = 30, dificultad = 'Intermedio') {
    const botonesDisponibles = Object.keys(mapaBotonesPorId);
    const botonesBasicos = botonesDisponibles.filter(id => 
      id.includes('1-') && !id.includes('bajo') && (id.includes('4') || id.includes('5') || id.includes('6') || id.includes('7') || id.includes('8'))
    );
    
    const bajosBasicos = botonesDisponibles.filter(id => 
      id.includes('bajo') && (id.includes('1-') || id.includes('2-'))
    );
    
    const notas = [];
    const intervalo = dificultad === 'Principiante' ? 1.0 : dificultad === 'Intermedio' ? 0.5 : 0.25;
    
    for (let tiempo = 2.0; tiempo < duracion; tiempo += intervalo * (0.5 + Math.random())) {
      const esBotonBajo = Math.random() < 0.3; // 30% chance de ser bajo
      const botonesAUsar = esBotonBajo ? bajosBasicos : botonesBasicos;
      const botonAleatorio = botonesAUsar[Math.floor(Math.random() * botonesAUsar.length)];
      
      const duracionNota = Math.random() > 0.8 ? 1.0 : Math.random() > 0.5 ? 0.5 : 0.25;
      const tipoNota = duracionNota >= 1.0 ? 'mantenida' : 'normal';
      
      notas.push({
        tiempo: tiempo,
        idBoton: botonAleatorio,
        duracion: duracionNota,
        velocidad: 1.0,
        tipo: tipoNota
      });
    }
    
    return {
      id: 'cancion-aleatoria-' + Date.now(),
      titulo: 'Práctica Aleatoria',
      artista: 'Generador Automático',
      duracion: duracion,
      tempo: dificultad === 'Principiante' ? 90 : dificultad === 'Intermedio' ? 120 : 150,
      dificultad: dificultad,
      genero: 'Práctica',
      descripcion: `Canción generada automáticamente para práctica de nivel ${dificultad}`,
      notas: notas,
      metadatos: {
        creador: 'Sistema',
        fechaCreacion: new Date().toISOString(),
        version: '1.0',
        tags: ['práctica', 'aleatoria', dificultad.toLowerCase()],
        puntuacionMinima: 70,
        velocidadRecomendada: 1.0
      },
      configuracion: {
        velocidadJuego: 1.0,
        velocidadNotas: 1.0,
        modoFiebre: dificultad !== 'Principiante',
        modoSalud: dificultad === 'Avanzado',
        permitirFallos: true,
        mostrarLineaAyuda: dificultad === 'Principiante'
      }
    };
  }
}

// Instancia global del sistema
export const sistemaCanciones = new SistemaCanciones(); 