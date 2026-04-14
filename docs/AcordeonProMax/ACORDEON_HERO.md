# ACORDEÓN HERO — Diario de Desarrollo
**Fecha:** 2026-03-28
**Sesión:** Modos de Práctica + Práctica Libre + Modo Guiado

---

## Resumen ejecutivo

En esta sesión implementamos el sistema completo de **Modos de Práctica** para Acordeón Hero, corregimos bugs críticos en el motor de reproducción y agregamos una nueva sección de **Práctica Libre** accesible sin necesidad de seleccionar una canción.

---

## 1. Bug corregido — Pause/Resume del reproductor

### Problema
El loop de `requestAnimationFrame` en `useReproductorHero` se **detenía completamente** cuando el juego se pausaba. El loop hacía un `return` sin reprogramar el siguiente frame, lo que dejaba el reproductor congelado para siempre. Al intentar reanudar, no había ningún frame pendiente que pudiera retomar la ejecución.

Esto afectaba:
- El botón de Pausa/Reanudar en el HUD (nunca había sido probado correctamente)
- El modo Synthesia (que necesita pausar y reanudar nota a nota)
- El modo Maestro Guiado

### Causa técnica
```typescript
// ANTES — El loop terminaba al pausar (sin reprogramar)
const loop = () => {
  if (pausadoRef.current) return; // ← cadena de rAF muerta
  // ... trabajo ...
  animFrameRef.current = requestAnimationFrame(loop);
};
```

### Solución
```typescript
// DESPUÉS — El loop sigue vivo aunque no haga trabajo
const loop = () => {
  if (pausadoRef.current) {
    animFrameRef.current = requestAnimationFrame(loop); // ← sigue vivo
    return;
  }
  // ... trabajo normal ...
  animFrameRef.current = requestAnimationFrame(loop);
};
```

**Archivo:** `src/Paginas/SimuladorDeAcordeon/Hooks/useReproductorHero.ts`

---

## 2. Bug corregido — Synthesia no avanzaba al tocar el botón

### Problema
El modo Synthesia detectaba correctamente la nota pero al presionar el botón correcto, el reproductor **no se reanudaba**. La nota siguiente nunca aparecía.

### Causa técnica
`procesarGolpeAlumno` usa `deps=[]` (nunca se recrea) para no destruir los listeners de teclado en cada render. Sin embargo, capturaba `reproductor.alternarPausa` en el momento del montaje, cuando `reproduciendo = false`. Al llamarla, el guard `if (!reproduciendo) return` se disparaba y no hacía nada.

```typescript
// PROBLEMA: alternarPausa capturada en el cierre inicial con reproduciendo=false
const procesarGolpeAlumno = useCallback(() => {
  reproductor.alternarPausa(); // ← versión stale, siempre retorna inmediato
}, []); // deps=[] → cierre congelado
```

### Solución — Ref estable para acciones del reproductor
```typescript
// _reproductoActionsRef siempre tiene la versión más reciente
const _reproductoActionsRef = useRef({ alternarPausa: () => {}, buscarTick: (_t: number) => {} });

useEffect(() => {
  _reproductoActionsRef.current.alternarPausa = reproductor.alternarPausa;
  _reproductoActionsRef.current.buscarTick    = reproductor.buscarTick;
}, [reproductor.alternarPausa, reproductor.buscarTick]);

// En procesarGolpeAlumno — siempre llama la versión más reciente
_reproductoActionsRef.current.alternarPausa(); // ✅ funciona
```

**Archivo:** `src/Paginas/AcordeonHero/useLogicaHero.ts`

---

## 3. Sistema de Modos de Práctica

### Nuevo tipo `ModoPractica`
```typescript
export type ModoPractica = 'ninguno' | 'libre' | 'synthesia' | 'maestro_solo';
```

**Archivo:** `src/Paginas/AcordeonHero/tipos_AcordeonHero.ts`

### Selector de modo en pantalla de configuración
Antes de iniciar cada canción, el jugador elige entre 4 modos visuales en un grid de cards:

| Ícono | Modo | Descripción |
|-------|------|-------------|
| 🎮 | Competitivo | Puntos, vida y combo |
| 🎵 | Libre | Sin penalización |
| ⏸ | Synthesia | Pausa en cada nota |
| 🎹 | Maestro Solo | Rebobina y practica |

### Comportamiento por modo

#### Modo Competitivo (`'ninguno'`)
- Barra de vida: fallas restan vida (-2 activas, -1 pasivas)
- Game Over si vida llega a 0
- Multiplicador de combo hasta ×4
- Cuenta regresiva 3-2-1 antes de iniciar
- Vignette roja en los bordes al recibir daño

#### Modo Libre (`'libre'`)
- **Sin daño de vida** — siempre se mantiene en 100
- **Sin Game Over** — siempre termina en pantalla de resultados
- Las estadísticas (perfectas, bien, falladas) siguen contando
- Layout dual: Maestro izquierda + Alumno derecha
- **Sin countdown** — arranque inmediato

#### Modo Synthesia (`'synthesia'`)
- El reproductor **pausa automáticamente** cuando una nota llega a su tick
- El botón de la nota queda **iluminado en el Maestro**
- Aparece un **indicador pulsante** con el número de botón y dirección del fuelle
- El alumno presiona el botón correcto → la nota avanza, suena, continúa
- Si presiona incorrecto → feedback visual sin penalización
- **Sin countdown** — arranque inmediato

#### Modo Maestro Solo (`'maestro_solo'`)
- **Un único acordeón centrado** — sin puente de notas
- El Maestro ilumina botones en el acordeón central
- El alumno toca directamente sobre el mismo acordeón
- **Barra de transporte inferior:**
  - ⏮ Ir al inicio
  - ⏸/▶ Pausar/Reanudar
  - Slider de posición (seeks en tiempo real)
  - Indicador `Beat X / Y`
  - 🎓 Toggle **Modo Guiado**
- **Sin scoring** — el teclado suena pero no procesa hits
- **Sin countdown** — arranque inmediato

---

## 4. Modo Guiado (sub-opción de Maestro Solo)

Toggle activable desde la barra de transporte del Maestro Solo.

**Flujo pedagógico recomendado:**
1. Iniciar en Maestro Solo → **observar** la ejecución completa
2. Rebobinar con ⏮
3. Activar 🎓 **Modo Guiado ON**
4. El reproductor pausa en cada nota → el alumno la toca
5. Nota a nota, con el acordeón grande y el slider para volver a cualquier punto

**Técnica:** Cuando `modoGuiado=true`, el effect de notas pendientes detecta `tickActual >= nota.tick` y llama `_reproductoActionsRef.current.alternarPausa()` — el mismo mecanismo que Synthesia pero en el layout de acordeón único.

**Ref de control:**
```typescript
const modoGuiadoRef = useRef(false);
// Se actualiza con useEffect cuando cambia modoGuiado
```

---

## 5. Sin Countdown en Modos Práctica

En todos los modos de práctica (`libre`, `synthesia`, `maestro_solo`), el juego arranca **inmediatamente** al confirmar la configuración, sin el conteo 3-2-1.

```typescript
// En iniciarJuego():
if (modoPracticaRef.current !== 'ninguno') {
  setCuenta(null);
  _arrancarReproduccion(); // arranque directo
  return;
}
// Solo en modo competitivo:
setCuenta(3);
setEstadoJuego('contando');
// ... intervalos del conteo
```

---

## 6. Práctica Libre — Acordeón sin canción

Nueva sección accesible directamente desde la pantalla de selección de canciones.

### Acceso
Botón flotante `🎹 Práctica Libre` en la parte inferior de la pantalla de canciones.

### Funcionalidades

| Control | Función |
|---------|---------|
| ← Volver | Regresa a la pantalla de canciones |
| ✨ Brillante | Cambia el timbre del acordeón a pitos brillantes |
| 🎻 Armonizado | Cambia el timbre a pitos armonizados |
| Grid de tonalidades | Selecciona entre todas las tonalidades disponibles (ADG, BEA, CFB, etc.) |
| Teclas/123/♪/ABC | Modo de vista en los botones |
| Acordeón interactivo | Teclado del PC → notas del acordeón |
| Q | Cambiar fuelle (Abriendo ↔ Cerrando) |

### Tonalidades disponibles
```
F-Bb-Eb · Gb-B-E · GCF · ADG_FLAT · ADG · BES · BEA · CFB · DGB · GDC · ELR · EAD
```

### Estado
Nuevo valor `'practica_libre'` en el tipo `EstadoJuego`. No involucra al reproductor ni al motor de scoring.

---

## 7. Archivos modificados

| Archivo | Tipo de cambio |
|---------|---------------|
| `tipos_AcordeonHero.ts` | Nuevo tipo `ModoPractica`, `'practica_libre'` en `EstadoJuego` |
| `useReproductorHero.ts` | Fix del loop pause/resume |
| `useLogicaHero.ts` | `_reproductoActionsRef`, `modoGuiado`, `iniciarPracticaLibre`, skip countdown, lógica de 3 modos |
| `AcordeonHero.tsx` | Selector de modo, layouts condicionales, Práctica Libre, Modo Guiado toggle |
| `AcordeonHero.css` | Todos los estilos nuevos de los modos y Práctica Libre |
| `MODO_PRACTICA.md` | Documento técnico detallado de los modos |
| `ACORDEON_HERO.md` | Este documento |

---

## 8. Patrones técnicos usados

### Ref estable para callbacks síncronos
Patrón usado en todo el proyecto para evitar closures stale en callbacks con `deps=[]`:
```typescript
const _accionRef = useRef(accion);
useEffect(() => { _accionRef.current = accion; }, [accion]);
// En el callback:
_accionRef.current(); // siempre la versión más reciente
```

### Ref de estado para acceso en callbacks síncronos
```typescript
const estadoJuegoRef = useRef(estadoJuego);
useEffect(() => { estadoJuegoRef.current = estadoJuego; }, [estadoJuego]);
// Permite leer el estado actual dentro de useCallback([]) sin stale
```

### rAF loop siempre vivo
El loop de `requestAnimationFrame` nunca termina mientras el reproductor esté activo. Solo se detiene via `cancelAnimationFrame` en `detenerReproduccion`. Cuando está pausado, reschedula pero no ejecuta lógica de ticks.

---

## 9. Flujo completo de la aplicación

```
/acordeon-hero
    │
    ├── Pantalla de Selección (estado: 'seleccion')
    │       │
    │       ├── [Click canción] → Pantalla de Configuración ('configurando')
    │       │       │
    │       │       ├── Elegir modo: 🎮 Libre ⏸ 🎹
    │       │       ├── Ajustar velocidad (40–120% BPM)
    │       │       ├── Toggle Maestro Suena
    │       │       └── [Empezar]
    │       │               │
    │       │               ├── Modo competitivo → Countdown 3-2-1 → Jugando
    │       │               └── Modos práctica  → Jugando directo
    │       │
    │       └── [🎹 Práctica Libre] → Estado 'practica_libre'
    │               Acordeón interactivo + tonalidad + timbre
    │               Sin canción, sin scoring, sin maestro
    │
    └── Durante el juego:
            ├── Competitivo: puntos, vida, combo, game over, resultados
            ├── Libre:       puntos, sin vida, siempre resultados
            ├── Synthesia:   pausa en cada nota, indicador pulsante
            └── Maestro Solo: acordeón único, barra de transporte, Modo Guiado toggle
```

---

*Documentado el 2026-03-28*
