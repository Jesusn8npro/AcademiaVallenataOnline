<script>
// @ts-nocheck
import { onMount, createEventDispatcher, onDestroy } from 'svelte';
import { sleep } from '$lib/components/SimuladorDefinitivo/SimuladorDeAcordeonJS/utilidadesSimulador.js';
import { mapaTeclas } from '$lib/components/SimuladorDefinitivo/SimuladorDeAcordeonJS/mapaTecladoYFrecuencias.js';
import {
  mapaTeclasBajos, disposicion, disposicionBajos, mapaBotonesPorId,
  filas, filasBajos, tonosFilas, cambiarFuelle, escalas
} from '$lib/components/SimuladorDefinitivo/SimuladorDeAcordeonJS/notasAcordeonDiatonico.js';

// Event dispatcher para comunicación con el padre
const dispatch = createEventDispatcher();

// Props exportadas
export let direccion = 'halar';
export let afinacion = 'FBE';
export let botonesActivos = {};

// Props para funcionalidades del editor
export let modoEditor = false;
export let grabando = false;
export let pausado = false;
export let reproduciendo = false;
export let onGrabarNota = null;
export let onFinalizarNota = null;
export let onCambiarFuelle = null;

// Props para modo guía (sin interacción)
export let deshabilitarInteraccion = false;

// 🎯 Prop para prefijo de ID de botones (para distinguir guía vs jugador)
export let prefijoIdBoton = '';

// 🎨 Prop para personalizar la imagen de fondo del acordeón
export let imagenFondo = '/Acordeon PRO MAX.png';

// ⏰ Prop para controlar la anticipación del acordeón guía
export let anticipacionAcordeonGuia = 2000;

// Variables de estado
let audio, gainNode;
let ultimasTeclasPulsadas = new Map();

// 🚀 Variables para efecto de botones voladores
let contenedorNotasVoladoras;
let funcionObtenerCoordenadasJugador = null; // Función para obtener coordenadas del acordeón del jugador
let funcionActivarNotaEnJugador = null; // Función para activar nota automáticamente en el acordeón del jugador

// 🎯 Variables para control de estado y prevención de notas pegadas
let estadoLimpio = true;
let intervalLimpieza = null;
let teclasFisicasPresionadas = new Set();
let mousePresionado = false;
let ultimoCambioFuelle = 0;

// 🎯 Función exportada para establecer coordenadas del acordeón del jugador
export function establecerCoordenadasAcordeonJugador(funcionCoordenadas) {
  funcionObtenerCoordenadasJugador = funcionCoordenadas;
  console.log('✅ Coordenadas del acordeón del jugador configuradas');
}

// 🎮 Función exportada para establecer callback de activación de nota en el jugador
export function establecerCallbackActivacionJugador(funcionCallback) {
  funcionActivarNotaEnJugador = funcionCallback;
  console.log('✅ Callback de activación en acordeón del jugador configurado');
}

// 🧹 NUEVAS FUNCIONES EXPORTADAS PARA CONTROL DEL ESTADO
// ======================================================

// Función para resetear completamente el estado del acordeón
export function resetearEstado() {
  console.log('🔄 RESETEAR ESTADO - Limpiando acordeón completamente');
  
  // Detener todos los sonidos
  detenerTodosLosSonidos();
  
  // Limpiar estado de botones
  botonesActivos = {};
  
  // Limpiar registros de teclas físicas
  teclasFisicasPresionadas.clear();
  mousePresionado = false;
  
  // Limpiar mapa de últimas teclas pulsadas
  ultimasTeclasPulsadas.clear();
  
  // Marcar como estado limpio
  estadoLimpio = true;
  
  console.log('✅ Estado del acordeón reseteado completamente');
}

// Función para detener todos los sonidos
export function detenerTodosLosSonidos() {
  console.log('🔊 DETENER TODOS LOS SONIDOS');
  
  // Detener todos los tonos activos
  Object.keys(botonesActivos).forEach(id => {
    detenerTono(id);
  });
  
  // Limpiar estado de botones activos
  botonesActivos = {};
  
  console.log('✅ Todos los sonidos detenidos');
}

// Función para limpiar botones activos (visual)
export function limpiarBotonesActivos() {
  console.log('🧹 LIMPIAR BOTONES ACTIVOS');
  botonesActivos = {};
}

// Función para cambiar dirección de fuelle de forma segura
export function cambiarDireccion(nuevaDireccion) {
  console.log(`🌬️ CAMBIAR DIRECCIÓN: ${direccion} → ${nuevaDireccion}`);
  
  // Solo proceder si realmente cambió
  if (direccion === nuevaDireccion) {
    return;
  }
  
  // Finalizar todas las notas activas antes del cambio
  const notasActivas = Object.keys(botonesActivos);
  if (notasActivas.length > 0) {
    console.log(`🔄 Finalizando ${notasActivas.length} notas activas antes del cambio`);
    detenerTodosLosSonidos();
  }
  
  // Cambiar dirección
  direccion = nuevaDireccion;
  ultimoCambioFuelle = Date.now();
  
  // Enviar evento de cambio de fuelle
  dispatch('cambioFuelle', { direccion: nuevaDireccion });
  
  // Limpiar estados
  teclasFisicasPresionadas.clear();
  mousePresionado = false;
  
  console.log(`✅ Dirección cambiada a: ${nuevaDireccion}`);
}

// Función para forzar liberación de todas las teclas
export function forzarLiberacionTeclas() {
  console.log('🚨 FORZAR LIBERACIÓN DE TODAS LAS TECLAS');
  
  // Liberar todas las teclas activas
  Object.keys(botonesActivos).forEach(id => {
    actualizarBotonActivo(id, 'remove');
  });
  
  // Limpiar registros
  teclasFisicasPresionadas.clear();
  mousePresionado = false;
  
  console.log('✅ Todas las teclas liberadas forzosamente');
}

// Función para verificar y limpiar notas colgadas
export function verificarNotasColgadas() {
  const ahora = Date.now();
  const tiempoMaximo = 5000; // 5 segundos máximo
  
  const notasColgadas = Object.entries(botonesActivos).filter(([id, nota]) => {
    return nota.tiempoActivacion && (ahora - nota.tiempoActivacion) > tiempoMaximo;
  });
  
  if (notasColgadas.length > 0) {
    console.log(`🧹 Limpiando ${notasColgadas.length} notas colgadas`);
    notasColgadas.forEach(([id]) => {
      actualizarBotonActivo(id, 'remove');
    });
  }
  
  return notasColgadas.length;
}

// Función para iniciar limpieza automática
export function iniciarLimpiezaAutomatica() {
  if (intervalLimpieza) {
    clearInterval(intervalLimpieza);
  }
  
  intervalLimpieza = setInterval(() => {
    if (modoEditor && grabando) {
      verificarNotasColgadas();
    }
  }, 1000); // Cada segundo
  
  console.log('✅ Limpieza automática iniciada');
}

// Función para detener limpieza automática
export function detenerLimpiezaAutomatica() {
  if (intervalLimpieza) {
    clearInterval(intervalLimpieza);
    intervalLimpieza = null;
  }
  
  console.log('✅ Limpieza automática detenida');
}

// Función para obtener el botón específico por ID
export function detenerTono(id) {
  const botonActivo = botonesActivos[id];
  if (!botonActivo?.oscillator) return;
  
  try {
    if (Array.isArray(botonActivo.oscillator)) {
      botonActivo.oscillator.forEach(osc => {
        if (osc && osc.stop) {
          osc.stop();
        }
      });
    } else {
      if (botonActivo.oscillator && botonActivo.oscillator.stop) {
        botonActivo.oscillator.stop();
      }
    }
  } catch (error) {
    console.warn(`⚠️ Error al detener tono ${id}:`, error);
  }
}

// Mapeo de clases CSS
const getFilaClase = (filaNombre) => ({
  'primeraFila': 'tres',
  'segundaFila': 'dos', 
  'terceraFila': 'uno'
}[filaNombre] || filaNombre);

onMount(() => {
  audio = new (window.AudioContext || window.webkitAudioContext)();
  gainNode = audio.createGain();
  gainNode.gain.value = 0.1;
  gainNode.connect(audio.destination);
  
  // Iniciar limpieza automática si está en modo editor
  if (modoEditor) {
    iniciarLimpiezaAutomatica();
  }
  
  // Agregar event listeners para eventos de teclado globales
  if (typeof window !== 'undefined') {
    window.addEventListener('keyup', manejarTeclaGlobalLiberada);
    window.addEventListener('mouseup', manejarMouseGlobalLiberado);
    window.addEventListener('blur', manejarPerdidaFoco);
  }
});

// Limpiar recursos al desmontar
onDestroy(() => {
  detenerLimpiezaAutomatica();
  
  if (typeof window !== 'undefined') {
    window.removeEventListener('keyup', manejarTeclaGlobalLiberada);
    window.removeEventListener('mouseup', manejarMouseGlobalLiberado);
    window.removeEventListener('blur', manejarPerdidaFoco);
  }
});

// Manejadores de eventos globales para liberar teclas
function manejarTeclaGlobalLiberada(event) {
  if (!modoEditor || !grabando) return;
  
  // Liberar todas las teclas si se presiona Escape
  if (event.key === 'Escape') {
    forzarLiberacionTeclas();
  }
}

function manejarMouseGlobalLiberado(event) {
  if (!modoEditor || !grabando) return;
  
  mousePresionado = false;
  
  // Si el mouse se libera fuera del acordeón, liberar todas las notas
  const acordeonElement = document.querySelector('.disposicion-acordeon');
  if (acordeonElement && !acordeonElement.contains(event.target)) {
    forzarLiberacionTeclas();
  }
}

function manejarPerdidaFoco(event) {
  if (!modoEditor || !grabando) return;
  
  console.log('🔍 Pérdida de foco detectada - Liberando teclas');
  forzarLiberacionTeclas();
}

// Funciones de audio
function reproducirTono(id) {
  if (!audio || !mapaBotonesPorId[id]) return { oscillator: null };
  
  const { frecuencia } = mapaBotonesPorId[id];
  let oscillator;

  if (Array.isArray(frecuencia)) {
    oscillator = frecuencia.map(hz => {
      const osc = audio.createOscillator();
      osc.type = 'sawtooth';
      osc.connect(gainNode);
      osc.frequency.value = hz;
      osc.start();
      return osc;
    });
  } else {
    oscillator = audio.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.connect(gainNode);
    oscillator.frequency.value = frecuencia;
    oscillator.start();
  }
  
  return { oscillator };
}

function actualizarBotonActivo(id, accion = 'add') {
  // Si está deshabilitada la interacción, no hacer nada
  if (deshabilitarInteraccion) return;
  
  const ahora = Date.now();
  
  if (accion === 'add') {
    // Validar que no haya un cambio de fuelle muy reciente
    if (ahora - ultimoCambioFuelle < 100) {
      console.log(`🚫 Ignorando activación muy cerca del cambio de fuelle: ${id}`);
      return;
    }
    
    // Si ya existe una nota activa para este botón, IGNORAR
    if (botonesActivos[id]) {
      console.log(`🚫 Nota ya activa ignorada: ${id}`);
      return;
    }
    
    // Finalizar nota previa si existe y está en modo editor
    if (botonesActivos[id] && modoEditor) {
      console.log(`🔄 Finalizando nota previa: ${id}`);
      dispatch('notaLiberada', { idBoton: id, nombre: obtenerNombreBoton(id) });
      if (onFinalizarNota) onFinalizarNota(id);
      detenerTono(id);
    }
    
    // Crear nueva nota
    const { oscillator } = reproducirTono(id);
    
    // Determinar color según dirección del fuelle
    const colorFuelle = direccion === 'empujar' ? 'verde' : 'rojo';
    
    botonesActivos[id] = { 
      oscillator, 
      ...mapaBotonesPorId[id],
      colorFuelle: colorFuelle,
      direccionFuelle: direccion,
      tiempoActivacion: ahora
    };
    
    // Marcar mouse como presionado
    mousePresionado = true;
    
    // Enviar evento para Editor Max
    dispatch('notaPresionada', { idBoton: id, nombre: obtenerNombreBoton(id) });
    
    if (modoEditor && onGrabarNota) {
      onGrabarNota(id, 'mouse');
    }
    
    console.log(`✅ Nota activada: ${id} - Dirección: ${direccion}`);
    
  } else if (accion === 'remove' && botonesActivos[id]) {
    // Enviar evento para Editor Max
    dispatch('notaLiberada', { idBoton: id, nombre: obtenerNombreBoton(id) });
    
    if (modoEditor && onFinalizarNota) {
      onFinalizarNota(id);
    }
    
    detenerTono(id);
    
    // Eliminar del estado
    const nuevoMap = { ...botonesActivos };
    delete nuevoMap[id];
    botonesActivos = nuevoMap;
    
    console.log(`✅ Nota liberada: ${id}`);
  }
}

// Función helper para obtener nombre del botón
function obtenerNombreBoton(id) {
  return mapaBotonesPorId[id]?.nombre || id;
}

// ===========================================
// 🎵 MÉTODOS PÚBLICOS PARA SIMULACIÓN EXTERNA
// ===========================================

// Simular activación de nota desde el exterior (para acordeón guía)
export function simularActivacionNota(notaId, fuelleDireccion, duracionMs = 400) {
  // Forzar duración corta para evitar acumulación
  duracionMs = Math.min(duracionMs || 400, 800);
  
  console.log('🎮 ACTIVANDO NOTA:', notaId, fuelleDireccion, 'Duración:', duracionMs, 'ms');
  
  // 🧹 LIMPIAR CUALQUIER NOTA ANTERIOR DE ESTE MISMO ID
  simularDesactivacionNota(notaId);
  
  // Cambiar fuelle si es necesario
  if (fuelleDireccion && fuelleDireccion !== direccion) {
    direccion = fuelleDireccion;
  }
  
  // Generar ID completo de la nota
  const notaCompleta = encontrarNotaCompleta(notaId, fuelleDireccion);
  if (!notaCompleta) {
    console.warn('⚠️ No se encontró nota completa para:', notaId, fuelleDireccion);
    return;
  }
  
  // Determinar color según dirección del fuelle
  const colorFuelle = fuelleDireccion === 'empujar' ? 'verde' : 'rojo';
  
  // Solo activar sonido si la interacción NO está deshabilitada
  let oscillator = null;
  if (!deshabilitarInteraccion) {
    const resultado = reproducirTono(notaCompleta);
    oscillator = resultado.oscillator;
    console.log('🔊 Sonido activado para:', notaCompleta);
  } else {
    console.log('🔇 Solo visual para:', notaCompleta);
  }
  
  // 🎯 Activar la nota en el estado
  botonesActivos[notaCompleta] = { 
    oscillator, 
    ...mapaBotonesPorId[notaCompleta],
    colorFuelle: colorFuelle,
    direccionFuelle: fuelleDireccion,
    duracionMs: duracionMs,
    tiempoActivacion: Date.now()
  };
  
  console.log('✅ Nota activada correctamente:', notaCompleta, 'Color:', colorFuelle);
  
  // 🚀 EFECTO BOTÓN VOLADOR (solo si está configurado)
  if (deshabilitarInteraccion) {
    crearBotonVolador(notaCompleta, colorFuelle, fuelleDireccion, duracionMs, anticipacionAcordeonGuia);
  }
  
  // ⏰ PROGRAMAR DESACTIVACIÓN AUTOMÁTICA (solo para acordeón del jugador)
  if (!deshabilitarInteraccion) {
    setTimeout(() => {
      console.log('⏰ Auto-desactivando nota:', notaCompleta);
      simularDesactivacionNota(notaId);
    }, duracionMs);
  }
}

// Simular desactivación de nota desde el exterior
export function simularDesactivacionNota(notaId) {
  console.log('🔇 DESACTIVANDO NOTA:', notaId);
  
  // 🎯 Buscar la nota exacta primero
  let notasADesactivar = [];
  
  // 1. Buscar primero por ID exacto
  if (botonesActivos[notaId]) {
    notasADesactivar.push(notaId);
  }
  
  // 2. Si no se encuentra exacta, buscar variantes
  if (notasADesactivar.length === 0) {
    notasADesactivar = Object.keys(botonesActivos).filter(id => {
      // Buscar por coincidencia parcial solo si no hay coincidencia exacta
      const notaBase = notaId.replace(/-empujar|-halar/g, '');
      const idBase = id.replace(/-empujar|-halar/g, '');
      return idBase === notaBase;
    });
  }
  
  console.log('🎯 Notas encontradas para desactivar:', notasADesactivar);
  
  // 3. Desactivar cada nota encontrada
  for (const notaCompleta of notasADesactivar) {
    console.log('🔇 Desactivando nota específica:', notaCompleta);
    
    // Detener sonido si está habilitado
    if (!deshabilitarInteraccion && botonesActivos[notaCompleta]) {
      detenerTono(notaCompleta);
      console.log('🔊 Sonido detenido para:', notaCompleta);
    }
    
    // Eliminar del estado
    const nuevoMap = { ...botonesActivos };
    delete nuevoMap[notaCompleta];
    botonesActivos = nuevoMap;
    
    console.log('✅ Nota desactivada completamente:', notaCompleta);
  }
  
  // 4. Verificar que se desactivó correctamente
  const notasRestantes = Object.keys(botonesActivos);
  console.log('📊 Notas aún activas:', notasRestantes.length, notasRestantes);
  
  return notasADesactivar.length;
}

// 🚀 FUNCIÓN PARA CREAR EFECTO BOTÓN VOLADOR REAL
// ===========================================

function crearBotonVolador(notaCompleta, colorFuelle, fuelleDireccion, duracionMs = 300, anticipacionGuia = 2000) {
  // Verificar que el contenedor existe
  if (!contenedorNotasVoladoras) {
    console.warn('⚠️ Contenedor de notas voladoras no encontrado');
    return;
  }
  
  try {
    // 📍 1. Localizar el botón DOM original en el acordeón guía
    const idBusqueda = prefijoIdBoton ? `${prefijoIdBoton}-${notaCompleta}` : notaCompleta;
    const botonOriginal = document.getElementById(idBusqueda);
    if (!botonOriginal) {
      console.warn('⚠️ Botón original no encontrado:', idBusqueda);
      return;
    }
    
    // 📍 2. Calcular posición inicial del botón (coordenadas exactas)
    const rectBoton = botonOriginal.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // 📍 3. Crear clon del botón
    const botonClon = botonOriginal.cloneNode(true);
    
    // 📍 4. Configurar estilos del botón volador
    botonClon.style.position = 'fixed';
    botonClon.style.left = `${rectBoton.left}px`;
    botonClon.style.top = `${rectBoton.top}px`;
    botonClon.style.width = `${rectBoton.width}px`;
    botonClon.style.height = `${rectBoton.height}px`;
    botonClon.style.zIndex = '9999';
    botonClon.style.pointerEvents = 'none';
    botonClon.style.transform = 'scale(1)';
    botonClon.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
    botonClon.style.border = `3px solid ${colorFuelle === 'verde' ? '#4ade80' : '#ef4444'}`;
    botonClon.style.backgroundColor = colorFuelle === 'verde' ? '#22c55e' : '#dc2626';
    botonClon.style.transition = 'all 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    // 📍 5. Agregar al contenedor
    contenedorNotasVoladoras.appendChild(botonClon);
    
    // 📍 6. Calcular posición final (acordeón del jugador - coordenadas dinámicas)
    let posicionFinal = {
      left: window.innerWidth - 200, // Fallback si no hay coordenadas
      top: rectBoton.top
    };
    
    // 🎯 Usar coordenadas dinámicas del acordeón del jugador si está disponible
    if (funcionObtenerCoordenadasJugador) {
      const coordenadasJugador = funcionObtenerCoordenadasJugador(notaCompleta);
      if (coordenadasJugador) {
        posicionFinal = {
          left: coordenadasJugador.centerX - (rectBoton.width / 2), // Centrar en el botón del jugador
          top: coordenadasJugador.centerY - (rectBoton.height / 2)
        };
        console.log('🎯 Usando coordenadas dinámicas del jugador:', coordenadasJugador);
      } else {
        console.warn('⚠️ No se pudieron obtener coordenadas del botón del jugador para:', notaCompleta);
      }
    }
    
    // 📍 7. Iniciar animación inmediatamente
    requestAnimationFrame(() => {
      botonClon.style.left = `${posicionFinal.left}px`;
      botonClon.style.top = `${posicionFinal.top}px`;
      botonClon.style.transform = 'scale(0.8)';
      botonClon.style.opacity = '0.8';
    });
    
    // 🎯 TIMING CORRECTO: Calcular cuándo debe activarse la nota del jugador
    // El objetivo es que la nota se active exactamente cuando debe sonar en la pista original
    
    const tiempoAnimacion = 1500; // Tiempo fijo de la animación
    const retrasoCorrector = anticipacionGuia - tiempoAnimacion; // Diferencia entre anticipación y animación
    
    console.log('🎯 TIMING CALCULADO:', {
      tiempoAnimacion,
      anticipacionGuia,
      retrasoCorrector,
      notaCompleta,
      mensaje: retrasoCorrector > 0 ? 'Se retrasará la activación' : 'Se adelantará la activación'
    });
    
    // 📍 8. Activar la nota en el acordeón del jugador CON TIMING CORRECTO
    setTimeout(() => {
      // 🎵 EJECUTAR CALLBACK PARA ACTIVAR NOTA EN EL ACORDEÓN DEL JUGADOR
      if (funcionActivarNotaEnJugador) {
        console.log('🎮 Ejecutando callback SINCRONIZADO para activar nota en el jugador:', notaCompleta, 'Duración:', duracionMs, 'ms');
        funcionActivarNotaEnJugador(notaCompleta, fuelleDireccion, duracionMs);
      }
      
      // Eliminar el botón volador después de activar la nota
      if (botonClon && botonClon.parentNode) {
        botonClon.parentNode.removeChild(botonClon);
      }
    }, tiempoAnimacion + retrasoCorrector); // Tiempo animación + retraso corrector
    
  } catch (error) {
    console.error('💥 Error creando botón volador real:', error);
  }
}

// 🚀 FUNCIÓN PARA CREAR ELEMENTO VOLADOR DESDE BOTÓN REAL
// =======================================================

function crearElementoVoladorDesdeBotonReal(botonOriginal, notaId, colorFuelle, fuelleDireccion) {
  // Crear clon profundo del botón original
  const botonClon = botonOriginal.cloneNode(true);
  
  // Establecer ID único para evitar conflictos
  botonClon.id = `nota-voladora-${notaId}-${Date.now()}`;
  
  // Aplicar clase específica para nota voladora real
  botonClon.className = `boton nota-voladora-real activo color-${colorFuelle} fuelle-${fuelleDireccion}`;
  
  // Establecer atributos de datos
  botonClon.setAttribute('data-nota-id', notaId);
  botonClon.setAttribute('data-direccion-fuelle', fuelleDireccion);
  botonClon.setAttribute('data-color-fuelle', colorFuelle);
  
  // Preservar estilos computados del botón original
  const estilosComputados = window.getComputedStyle(botonOriginal);
  
  // Aplicar estilos críticos
  botonClon.style.backgroundImage = estilosComputados.backgroundImage;
  botonClon.style.backgroundSize = estilosComputados.backgroundSize;
  botonClon.style.backgroundPosition = estilosComputados.backgroundPosition;
  botonClon.style.borderRadius = estilosComputados.borderRadius;
  botonClon.style.fontSize = estilosComputados.fontSize;
  botonClon.style.fontWeight = estilosComputados.fontWeight;
  botonClon.style.color = estilosComputados.color;
  botonClon.style.textAlign = estilosComputados.textAlign;
  botonClon.style.display = estilosComputados.display;
  botonClon.style.alignItems = estilosComputados.alignItems;
  botonClon.style.justifyContent = estilosComputados.justifyContent;
  
  // Aplicar estilo específico según el color del fuelle
  if (colorFuelle === 'verde') {
    botonClon.style.background = 'rgba(34, 139, 34, 0.9)';
    botonClon.style.border = '2px solid rgba(34, 139, 34, 1)';
    botonClon.style.boxShadow = '0 0 20px rgba(34, 139, 34, 0.8)';
  } else if (colorFuelle === 'rojo') {
    botonClon.style.background = 'rgba(220, 20, 60, 0.9)';
    botonClon.style.border = '2px solid rgba(220, 20, 60, 1)';
    botonClon.style.boxShadow = '0 0 20px rgba(220, 20, 60, 0.8)';
  }
  
  // Aplicar transformación inicial (botón presionado)
  botonClon.style.transform = 'translateY(4px)';
  
  console.log('✅ Elemento volador creado desde botón real:', {
    original: botonOriginal.id,
    clon: botonClon.id,
    texto: botonClon.textContent,
    colorFuelle
  });
  
  return botonClon;
}

// Encontrar el ID completo de una nota basado en su nombre y dirección del fuelle
function encontrarNotaCompleta(notaId, fuelleDireccion) {
  // Buscar en el mapa de botones por ID
  const posiblesIds = Object.keys(mapaBotonesPorId).filter(id => 
    id.includes(notaId) && id.includes(fuelleDireccion)
  );
  
  if (posiblesIds.length > 0) {
    return posiblesIds[0];
  }
  
  // Si no se encuentra, buscar sin dirección específica
  const idsSinDireccion = Object.keys(mapaBotonesPorId).filter(id => 
    id.includes(notaId)
  );
  
  return idsSinDireccion[0] || null;
}

function manejarCambioFuelle(nuevaDireccion) {
  if (direccion === nuevaDireccion) return;
  
  // Si está deshabilitada la interacción, solo cambiar la dirección sin sonidos
  if (deshabilitarInteraccion) {
    direccion = nuevaDireccion;
    return;
  }
  
  direccion = nuevaDireccion;
  const nuevosBotonesActivos = {};
  
  for (const [keyId, keyValues] of Object.entries(botonesActivos)) {
    if (modoEditor && grabando && !pausado) {
      onFinalizarNota?.(keyId);
    }
    
    if (Array.isArray(keyValues.oscillator)) {
      keyValues.oscillator.forEach(hz => { try { hz?.stop(); } catch (e) {} });
    } else {
      try { keyValues.oscillator?.stop(); } catch (e) {}
    }
    
    const [fila, columna] = keyId.split('-');
    const esBajo = keyId.includes('-bajo');
    const nuevoKeyId = `${fila}-${columna}-${nuevaDireccion}${esBajo ? '-bajo' : ''}`;
    
    if (mapaBotonesPorId[nuevoKeyId]) {
      const { oscillator } = reproducirTono(nuevoKeyId);
      nuevosBotonesActivos[nuevoKeyId] = { oscillator, ...mapaBotonesPorId[nuevoKeyId] };
      
      if (modoEditor && grabando && !pausado) {
        onGrabarNota?.(nuevoKeyId, 'fuelle');
      }
    }
  }
  
  botonesActivos = nuevosBotonesActivos;
  
  // Enviar evento para Editor Max
  dispatch('cambioFuelle', { 
    direccion: nuevaDireccion, 
    botonesActivos: nuevosBotonesActivos 
  });
  
  onCambiarFuelle?.(nuevaDireccion, nuevosBotonesActivos);
}

function manejarEventoTeclado(e, esPresionada) {
  // Si está deshabilitada la interacción, no hacer nada
  if (deshabilitarInteraccion) return;
  
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
  
  const tecla = e.key.toLowerCase();
  
  if (tecla === cambiarFuelle) {
    manejarCambioFuelle(esPresionada ? 'empujar' : 'halar');
    return;
  }
  
  const datoBoton = mapaTeclas[tecla] || mapaTeclasBajos[tecla];
  if (!datoBoton) return;
  
  const { fila, columna } = datoBoton;
  const esBajo = mapaTeclasBajos[tecla];
  const id = `${fila}-${columna}-${direccion}${esBajo ? '-bajo' : ''}`;
  
  if (modoEditor && esPresionada) {
    const ahora = Date.now();
    const ultimaTecla = ultimasTeclasPulsadas.get(tecla);
    if (ultimaTecla && (ahora - ultimaTecla) < 20) return;
    ultimasTeclasPulsadas.set(tecla, ahora);
    
    if (botonesActivos[id]) {
      onFinalizarNota?.(id);
      detenerTono(id);
    }
    
    const { oscillator } = reproducirTono(id);
    botonesActivos = {
      ...botonesActivos,
      [id]: { oscillator, ...mapaBotonesPorId[id] }
    };
    
    // Enviar evento para Editor Max
    dispatch('notaPresionada', { id, tipo: 'teclado' });
    
    onGrabarNota?.(id, 'teclado');
    e.preventDefault();
  } else {
    // Para teclas normales (no en modo editor)
    if (esPresionada) {
      dispatch('notaPresionada', { id, tipo: 'teclado' });
    } else {
      dispatch('notaLiberada', { id, tipo: 'teclado' });
    }
    
    actualizarBotonActivo(id, esPresionada ? 'add' : 'remove');
  }
}

function limpiarTodasLasNotas() {
  // Si está deshabilitada la interacción, no limpiar (controlado externamente)
  if (deshabilitarInteraccion) return;
  
  Object.values(botonesActivos).forEach(keyValues => {
    if (Array.isArray(keyValues.oscillator)) {
      keyValues.oscillator.forEach(hz => hz?.stop());
    } else {
      keyValues.oscillator?.stop();
    }
  });
  botonesActivos = {};
}

// Exponer funciones al componente padre
export { actualizarBotonActivo, manejarEventoTeclado, limpiarTodasLasNotas, reproducirTono };
</script>

<svelte:body
  on:keypress={e => manejarEventoTeclado(e, true)}
  on:keyup={e => manejarEventoTeclado(e, false)}
  on:mouseup={limpiarTodasLasNotas} />

<div class="disposicion-acordeon" style="--imagen-fondo-acordeon: url('{imagenFondo}')">
  <!-- Teclado lado derecho (melodía) -->
  <div class="lado-teclas">
    {#each filas as filaNombre}
      <div class={`fila ${getFilaClase(filaNombre)}`}>
        {#each disposicion[filaNombre] as boton}
          {@const esActivo = botonesActivos[boton.id]}
          {@const direccionBoton = esActivo?.direccionFuelle || direccion}
          {@const colorFuelle = esActivo?.colorFuelle || (direccionBoton === 'empujar' ? 'verde' : 'rojo')}
          {#if boton.id.includes(direccion)}
            <div
              class={`boton ${esActivo ? 'activo' : ''} ${direccionBoton} color-${colorFuelle}`}
              class:no-interaccion={deshabilitarInteraccion}
              class:fuelle-empujar={direccionBoton === 'empujar'}
              class:fuelle-halar={direccionBoton === 'halar'}
              id={prefijoIdBoton ? `${prefijoIdBoton}-${boton.id}` : boton.id}
              on:mousedown={() => !deshabilitarInteraccion && actualizarBotonActivo(boton.id, 'add')}
              on:mouseup={() => !deshabilitarInteraccion && modoEditor ? actualizarBotonActivo(boton.id, 'remove') : null}
              role="button"
              tabindex={deshabilitarInteraccion ? -1 : 0}
              aria-pressed={esActivo ? 'true' : 'false'}
              aria-label={`Nota: ${boton.nombre} - ${direccionBoton} - ${colorFuelle}`}
            >
              {boton.nombre}
            </div>
          {/if}
        {/each}
        <h4>{tonosFilas[afinacion][filaNombre]}<br />{filaNombre}</h4>
      </div>
    {/each}
  </div>
  
  <!-- Bajos lado izquierdo -->
  <div class="lado-bajos">
    {#each filasBajos as filaBajoNombre}
      <div class={`fila ${filaBajoNombre}`}>
        {#each disposicionBajos[filaBajoNombre] as botonBajo}
          {@const esActivoBajo = botonesActivos[botonBajo.id]}
          {@const direccionBotonBajo = esActivoBajo?.direccionFuelle || direccion}
          {@const colorFuelleBajo = esActivoBajo?.colorFuelle || (direccionBotonBajo === 'empujar' ? 'verde' : 'rojo')}
          {#if botonBajo.id.includes(direccion)}
            <div
              class={`boton ${esActivoBajo ? 'activo' : ''} ${direccionBotonBajo} color-${colorFuelleBajo}`}
              class:no-interaccion={deshabilitarInteraccion}
              class:fuelle-empujar={direccionBotonBajo === 'empujar'}
              class:fuelle-halar={direccionBotonBajo === 'halar'}
              id={prefijoIdBoton ? `${prefijoIdBoton}-${botonBajo.id}` : botonBajo.id}
              on:mousedown={() => !deshabilitarInteraccion && actualizarBotonActivo(botonBajo.id, 'add')}
              on:mouseup={() => !deshabilitarInteraccion && modoEditor ? actualizarBotonActivo(botonBajo.id, 'remove') : null}
              role="button"
              tabindex={deshabilitarInteraccion ? -1 : 0}
              aria-pressed={esActivoBajo ? 'true' : 'false'}
              aria-label={`Bajo: ${botonBajo.nombre} - ${direccionBotonBajo}`}
            >
              {botonBajo.nombre}
            </div>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>

<!-- 🚀 CONTENEDOR PARA NOTAS VOLADORAS -->
<div bind:this={contenedorNotasVoladoras} class="notas-voladoras-container"></div>

<style>
  .disposicion-acordeon {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    background: var(--imagen-fondo-acordeon) no-repeat center center;
    background-size: contain;
    width: 95vh;
    height: 95vh;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .lado-teclas {
    position: absolute;
    left: 5.05%;
    top: 14%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 3.4%;
    z-index: 10;
  }

  .lado-bajos {
    position: absolute;
    left: 82.5%;
    top: 31%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    width: 3.4%;
    z-index: 10;
  }

  .lado-bajos .fila.uno { margin-right: 0.3vh; }
  .lado-bajos .fila.dos { margin-top: 0; }

  .fila {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 8vh;
  }

  .boton {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    height: 5.1vh;
    width: 5.1vh;
    margin-bottom: 1vh;
    margin-right: 0.5vh;
    background-image: url('https://acordeonvirtual.com/wp-content/uploads/acordium-prod-av-nov-24/img/blanca.JPG');
    background-size: cover;
    background-position: center;
    box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.6), 0px 6px rgba(0, 0, 0, 0.3);
    color: #222;
    font-weight: 600;
    font-size: 1.8vh;
    cursor: pointer;
    transition: all 0.2s ease-in-out;
  }

  .boton:hover {
    filter: brightness(1.1);
    transform: scale(1.05);
  }
  
  .boton.no-interaccion {
    cursor: default;
    user-select: none;
  }
  
  .boton.no-interaccion:hover {
    filter: none;
    transform: none;
  }

  .boton.activo {
    transform: translateY(4px);
    box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.6), 0px 2px rgba(0, 0, 0, 0.3);
    background-image: url('https://acordeonvirtual.com/wp-content/uploads/acordium-prod-av-nov-24/img/blanca-activa.JPG');
    color: #ffffff;
  }

  /* 🎨 Colores por dirección de fuelle */
  .boton.halar.activo, .boton.color-rojo.activo {
    background: rgba(220, 20, 60, 0.8) !important;
    border: 2px solid rgba(220, 20, 60, 0.9) !important;
    box-shadow: 0px 6px 15px rgba(220, 20, 60, 0.5) !important;
    color: #ffffff !important;
  }

  .boton.empujar.activo, .boton.color-verde.activo {
    background: rgba(34, 139, 34, 0.8) !important;
    border: 2px solid rgba(34, 139, 34, 0.9) !important;
    box-shadow: 0px 6px 15px rgba(34, 139, 34, 0.5) !important;
    color: #ffffff !important;
  }

  /* 🎵 Efectos hover para fuelle */
  .boton.fuelle-empujar:not(.activo):hover {
    background: rgba(34, 139, 34, 0.2);
    border: 1px solid rgba(34, 139, 34, 0.3);
  }

  .boton.fuelle-halar:not(.activo):hover {
    background: rgba(220, 20, 60, 0.2);
    border: 1px solid rgba(220, 20, 60, 0.3);
  }

  /* 🎮 Estilos para acordeón guía */
  .boton.no-interaccion.activo {
    animation: pulsoGuia 0.5s ease-in-out;
    transform: translateY(4px) scale(1.1);
  }

  @keyframes pulsoGuia {
    0% { transform: translateY(4px) scale(1.0); }
    50% { transform: translateY(4px) scale(1.15); }
    100% { transform: translateY(4px) scale(1.1); }
  }

  .lado-teclas .fila.tres { margin-top: 3vh; }
  .lado-teclas .fila.dos { margin-top: 0; }
  .lado-teclas .fila.uno { margin-top: 3vh; }

  .fila .boton { margin-bottom: 1vh; }

  .fila h4 {
    margin-top: 0.4vh;
    font-size: 1.2vh;
    text-align: center;
    color: #efeaea;
  }

  @media (max-width: 1200px) {
    .disposicion-acordeon {
      width: 90vh;
      height: 90vh;
    }
  }

  @media (max-width: 992px) {
    .disposicion-acordeon {
      width: 85vh;
      height: 85vh;
    }
    .boton {
      height: 5vh;
      width: 5vh;
      font-size: 1.6vh;
    }
  }

  /* 🚀 ESTILOS PARA EFECTO BOTÓN VOLADOR REAL */
  /* =========================================== */
  
  .notas-voladoras-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  }
  
  .nota-voladora-real {
    position: absolute !important;
    z-index: 9999 !important;
    pointer-events: none !important;
    transition: transform 1.5s ease-out, opacity 1.5s linear !important;
    
    /* Preservar apariencia de botón real */
    border-radius: 50% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-weight: 600 !important;
    cursor: default !important;
    user-select: none !important;
    
    /* Efecto glow y pulso más intenso */
    filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
  }
  
  /* 🟢 Estilos para fuelle empujar (verde) */
  .nota-voladora-real.color-verde {
    background: rgba(34, 139, 34, 0.95) !important;
    border: 3px solid rgba(34, 139, 34, 1) !important;
    box-shadow: 
      0 0 25px rgba(34, 139, 34, 0.9),
      inset 2px 2px 5px rgba(255, 255, 255, 0.3) !important;
    color: #ffffff !important;
    animation: pulsoVoladorVerde 0.8s ease-in-out infinite alternate;
  }
  
  /* 🔴 Estilos para fuelle halar (rojo) */
  .nota-voladora-real.color-rojo {
    background: rgba(220, 20, 60, 0.95) !important;
    border: 3px solid rgba(220, 20, 60, 1) !important;
    box-shadow: 
      0 0 25px rgba(220, 20, 60, 0.9),
      inset 2px 2px 5px rgba(255, 255, 255, 0.3) !important;
    color: #ffffff !important;
    animation: pulsoVoladorRojo 0.8s ease-in-out infinite alternate;
  }
  
  /* 🎯 Animaciones de pulso mejoradas */
  @keyframes pulsoVoladorVerde {
    0% { 
      box-shadow: 
        0 0 25px rgba(34, 139, 34, 0.9),
        inset 2px 2px 5px rgba(255, 255, 255, 0.3);
      filter: drop-shadow(0 0 15px rgba(34, 139, 34, 0.8));
      transform: translateY(4px) scale(1.0);
    }
    100% { 
      box-shadow: 
        0 0 35px rgba(34, 139, 34, 1),
        inset 2px 2px 5px rgba(255, 255, 255, 0.5);
      filter: drop-shadow(0 0 20px rgba(34, 139, 34, 1));
      transform: translateY(4px) scale(1.05);
    }
  }
  
  @keyframes pulsoVoladorRojo {
    0% { 
      box-shadow: 
        0 0 25px rgba(220, 20, 60, 0.9),
        inset 2px 2px 5px rgba(255, 255, 255, 0.3);
      filter: drop-shadow(0 0 15px rgba(220, 20, 60, 0.8));
      transform: translateY(4px) scale(1.0);
    }
    100% { 
      box-shadow: 
        0 0 35px rgba(220, 20, 60, 1),
        inset 2px 2px 5px rgba(255, 255, 255, 0.5);
      filter: drop-shadow(0 0 20px rgba(220, 20, 60, 1));
      transform: translateY(4px) scale(1.05);
    }
  }
  
  /* 🎨 Efecto de destello para notas voladoras */
  .nota-voladora-real::before {
    content: '';
    position: absolute;
    top: -3px;
    left: -3px;
    right: -3px;
    bottom: -3px;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    border-radius: 50%;
    animation: destelloVolador 2s linear infinite;
    z-index: -1;
  }
  
  @keyframes destelloVolador {
    0% { transform: rotate(0deg); opacity: 0.3; }
    50% { opacity: 0.8; }
    100% { transform: rotate(360deg); opacity: 0.3; }
  }
</style> 