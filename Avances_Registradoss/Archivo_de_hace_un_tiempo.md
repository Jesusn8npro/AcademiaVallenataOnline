# 🪗 ACORDEÓN HERO — DevLog Completo
> Documentación de todo lo construido. Fecha: 2026-03-27

---

## 📁 Estructura de Archivos Relevantes

```
src/
├── Paginas/
│   ├── AcordeonHero/                        ← JUEGO (Guitar Hero del acordeón)
│   │   ├── AcordeonHero.tsx                 ← Componente principal del juego
│   │   ├── AcordeonHero.css                 ← Estilos del juego
│   │   ├── useLogicaHero.ts                 ← Lógica de estados del juego
│   │   ├── usePosicionBotones.ts            ← Mapeado de posiciones en pantalla
│   │   ├── PuenteNotas.tsx                  ← SVG animado de notas viajando
│   │   ├── PantallaSeleccion.tsx            ← Lista de canciones para elegir
│   │   ├── PantallaResultados.tsx           ← Pantalla final con estrellas/score
│   │   └── tipos_AcordeonHero.ts            ← Tipos TypeScript del juego
│   │
│   └── SimuladorDeAcordeon/                 ← SIMULADOR (herramienta de grabación)
│       ├── AcordeonSimulador.tsx            ← Componente principal del simulador
│       ├── AcordeonSimulador.css            ← Estilos globales del simulador
│       ├── SimuladorGaming.tsx              ← Página /simulador-gaming
│       ├── AudioEnginePro.ts               ← Motor de audio pro
│       ├── Componentes/
│       │   ├── GestorPistasHero.tsx         ← ⭐ LÍNEA DE TIEMPO + MARCADOR DE BEAT
│       │   ├── ModalGuardarHero.tsx         ← Modal para guardar grabaciones
│       │   ├── ModalListaHero.tsx           ← Biblioteca de canciones grabadas
│       │   ├── BotonesControl.tsx           ← Botones flotantes del simulador
│       │   ├── CuerpoAcordeon.tsx           ← Renderizado del acordeón
│       │   └── ReproductorSecuencia.tsx     ← Controls de reproducción
│       ├── Hooks/
│       │   ├── useGrabadorHero.ts           ← Hook de grabación (tick-based)
│       │   ├── useReproductorHero.ts        ← Hook de reproducción
│       │   └── useLogicaAcordeon.ts         ← Lógica principal del acordeón
│       └── videojuego_acordeon/
│           ├── tipos_Hero.ts                ← ⭐ Tipos de datos (CancionHero, etc)
│           ├── GrabadorHero.tsx             ← UI del grabador (tabs, metronomo)
│           └── GrabadorHero.css             ← Estilos del grabador
```

---

## 🎮 SISTEMA 1: AcordeonHero (El Juego)

### ¿Qué es?
Un Guitar Hero / Synthesia para el acordeón vallenato colombiano.
- El **Maestro** (izquierda) toca la canción automáticamente
- El **Alumno** (derecha, tú) responde con el teclado del PC
- Las notas viajan en curvas bezier de un acordeón al otro
- Sistema de puntuación, combo, estrellas y game over

### Layout del juego
```
┌─────────────────────────────────────────┐
│  HUD superior (controles, puntuación)   │
├───────────────────────┬─────────────────┤
│  Maestro (izquierda)  │  Alumno (dcha)  │
│  AcordeonJugador.png  │  AcordeonPROMAX │
└───────────────────────┴─────────────────┘
   SVG Puente de notas (overlay fixed)
   Efectos de golpe (overlay)
   Cuenta regresiva (overlay)
```

### Archivos clave del juego

#### `AcordeonHero.tsx`
- Importa `CuerpoAcordeon` dos veces (maestro + alumno)
- Fuerza posición centrada de los acordeones:
  ```tsx
  const ajustesHero = React.useMemo(() => ({
    ...hero.logica.ajustes,
    tamano: 'min(74vh, 37vw)',
    x: '50%',   // ← IMPORTANTE: override de la posición guardada del usuario
    y: '50%',   // ← evita que el acordeón aparezca desplazado
  }), [hero.logica.ajustes]);
  ```
- **Beat Indicator**: Dots que pulsan al BPM para que el jugador sepa cuándo entrar
  ```tsx
  const [beatActual, setBeatActual] = React.useState(0);
  const [pulsando, setPulsando]     = React.useState(false);
  // setInterval basado en (60/bpm)*1000 ms
  // Arranca en estadoJuego === 'contando' y 'jugando'
  ```
- Render de dots de beat:
  ```tsx
  {Array.from({ length: compas }, (_, i) => (
    <div className={`hero-beat-punto
      ${beatActual === i+1 ? 'activo' : ''}
      ${i === 0 ? 'primer-beat' : ''}`} />
  ))}
  ```

#### `AcordeonHero.css` — Clases importantes
```css
.hero-escenario {
  justify-content: center;   /* ← fix: era space-between, separaba los acordeones */
  padding-top: 48px;
}
.hero-acordeon-wrap { width: 44%; }  /* ← era 50%, dejaba poco espacio */

.hero-beat-indicador { /* barra de dots en la parte superior */ }
.hero-beat-punto { width:12px; height:12px; border-radius:50%; }
.hero-beat-punto.activo { transform: scale(1.5); }
.hero-beat-punto.primer-beat.activo { background: #f59e0b; } /* amarillo = beat 1 */
```

---

## 🎛️ SISTEMA 2: Grabador Hero (Simulador Gaming)

### ¿Qué es?
La herramienta para que el **Maestro Jesús González** grabe canciones, ejercicios y secuencias que luego los estudiantes juegan en AcordeonHero.

### Ruta: `/simulador-gaming`

---

## 📊 BASE DE DATOS SUPABASE

### Tabla: `canciones_hero`
```sql
-- Columnas principales
id              UUID PRIMARY KEY
titulo          TEXT
autor           TEXT  DEFAULT 'Jesus Gonzalez'
bpm             INTEGER
resolucion      INTEGER DEFAULT 192
secuencia_json  JSONB           -- Array de NotaHero[]
tipo            TEXT            -- 'ejercicio' | 'secuencia' | 'cancion'
dificultad      TEXT            -- 'basico' | 'intermedio' | 'profesional'
usoMetronomo    BOOLEAN
audio_fondo_url TEXT            -- URL en Supabase Storage
tonalidad       TEXT DEFAULT 'ADG'
compas          INTEGER DEFAULT 4
intro_compases  INTEGER DEFAULT 2
creado_en       TIMESTAMPTZ

-- Constraint aplicado:
CONSTRAINT check_tipo_hero CHECK (tipo IN ('ejercicio','secuencia','cancion'))
```

### Migración aplicada (proyecto tbijzvtyyewhtwgakgka)
```sql
-- 1. Corregir filas antiguas (tenían tipo='tutorial')
UPDATE canciones_hero SET tipo = 'cancion' WHERE tipo = 'tutorial';

-- 2. Eliminar constraint viejo
ALTER TABLE canciones_hero DROP CONSTRAINT IF EXISTS check_tipo_hero;

-- 3. Agregar nuevas columnas
ALTER TABLE canciones_hero ADD COLUMN tonalidad TEXT DEFAULT 'ADG';
ALTER TABLE canciones_hero ADD COLUMN compas INTEGER DEFAULT 4;
ALTER TABLE canciones_hero ADD COLUMN intro_compases INTEGER DEFAULT 2;

-- 4. Nuevo constraint correcto
ALTER TABLE canciones_hero
  ADD CONSTRAINT check_tipo_hero
  CHECK (tipo IN ('ejercicio','secuencia','cancion'));
```

### Storage: `pistas_hero`
- Bucket público en Supabase Storage
- Guarda los archivos MP3/WAV de las pistas de fondo
- Nombre de archivo: `${Date.now()}_${archivo.name}`

---

## 🎵 TIPOS DE CONTENIDO

### `tipos_Hero.ts` — Interfaces principales
```typescript
export type DireccionFuelle = 'abriendo' | 'cerrando';

export interface NotaHero {
  tick:     number;          // Posición temporal (192 ticks = 1 beat)
  botonId:  string;          // Ej: "H1-3-halar"
  duracion: number;          // En ticks
  fuelle:   DireccionFuelle; // 'abriendo' | 'cerrando'
}

export interface CancionHero {
  id?:              string;
  titulo:           string;
  autor:            string;
  bpm:              number;
  resolucion:       number;   // siempre 192
  secuencia:        NotaHero[];
  tipo:             'ejercicio' | 'secuencia' | 'cancion';
  dificultad:       'basico' | 'intermedio' | 'profesional';
  tonalidad?:       string;   // Ej: 'ADG', 'BEA', 'CFBb'
  compas?:          number;   // 3=vals, 4=porro/cumbia (default 4)
  intro_compases?:  number;   // Compases de cuenta regresiva antes del inicio
  audio_fondo_url?: string;
  usoMetronomo?:    boolean;
}
```

### Los 3 tipos de contenido
| Tipo | Descripción | ¿Tiene pista? | ¿Tiene BPM estricto? |
|------|-------------|---------------|---------------------|
| `ejercicio` | Patrón libre para practicar | No | No necesario |
| `secuencia` | Patrón rítmico repetitivo | No | Sí (metrónomo) |
| `cancion` | Tema completo | Sí (MP3/WAV) | Sí (sincronizado) |

---

## ⏱️ SISTEMA DE TIMING (Tick-Based)

### Resolución: 192 ticks por beat
```
1 beat      = 192 ticks
1 compás 4/4 = 768 ticks
1 compás 3/4 = 576 ticks
```

### Fórmula de conversión
```javascript
// Segundos → Ticks
ticks = segundos * (bpm / 60) * 192

// Ticks → Segundos
segundos = ticks / ((bpm / 60) * 192)
```

### `useGrabadorHero.ts` — Hook de grabación
```typescript
// El reloj de grabación usa motorAudioPro.tiempoActual (Web Audio API)
// para coincidir EXACTAMENTE con el metrónomo

const obtenerTickActual = () => {
  const ahora = motorAudioPro.tiempoActual;
  const deltaSeg = ahora - checkpointTimeRef.current;
  return checkpointTicksRef.current + deltaSeg * (bpmRef.current / 60) * 192;
};

// Compensador de latencia: cuando el audio arranca (tarda unos ms)
// se llama window.sincronizarRelojConPista() para ajustar el tick 0
```

---

## 🎧 GESTOR DE PISTAS + LÍNEA DE TIEMPO

### Archivo: `GestorPistasHero.tsx`
El componente más complejo del sistema de grabación.

### Funcionalidades
1. **Cargar MP3/WAV** → botón de subida
2. **Play/Pause independiente** → escucha la canción sin grabar
3. **Waveform (forma de onda)** → decodifica el audio con Web Audio API y dibuja 300 peaks en canvas
4. **Tap Tempo (tecla P)** → mientras la canción suena, tapeas al ritmo → detecta BPM
5. **Marcador de Beat 1 (tecla M)** → marca la posición exacta del primer beat en el audio
6. **Grid de beats** → líneas amarillas (beat 1 de cada compás) y moradas (beats internos) dibujadas sobre la waveform
7. **Preview del conteo** → escuchas los clicks de entrada + la canción, perfectamente sincronizados
8. **Aplicar sincronización** → manda BPM + intro_compases al simulador

### Teclas de teclado
| Tecla | Función |
|-------|---------|
| `P` | Tap Tempo (agregar un tap al ritmo) |
| `M` | Marcar Beat 1 en la posición actual del cursor |

### Canvas — Lo que se dibuja
```
┌──────────────────────────────────────────┐
│  █ █  ████  ██ ████  █  ███  ██  waveform│
│  │    │         │             │  beat grid│
│  ▲                            │  cursor  │
│ BEAT 1  (marcador amarillo)              │
└──────────────────────────────────────────┘
  0:00          click para scrub      3:45
```

- **Barras moradas** = forma de onda del audio
- **Líneas amarillas gruesas** = beat 1 de cada compás (con número de compás)
- **Líneas moradas tenues** = beats 2, 3, 4
- **Triángulo + texto amarillo** = marcador "BEAT 1" colocado por el usuario
- **Línea blanca** = cursor de reproducción actual (se mueve en tiempo real)

### Algoritmo de decodificación de waveform
```typescript
// 1. fetch(url) → ArrayBuffer
// 2. AudioContext.decodeAudioData(buffer) → AudioBuffer
// 3. Extraer canal 0: getChannelData(0)
// 4. Dividir en 300 bloques, tomar el máximo absoluto de cada bloque (peak)
// 5. Guardar array de 300 valores [0..1]
// 6. requestAnimationFrame dibuja las barras × su valor × altura del canvas
```

### Preview del conteo — cómo funciona
```
Audio:     [====intro silence====][======CANCIÓN SUENA======]
Clicks:          CLIC CLIC CLIC CLIC CLIC (n compases × n beats)
                 ↑
           beatOffset - (introCompases × segsPerCompas)

Ejemplo con beatOffset=4.5s, introCompases=2, compas=4/4, BPM=120:
  segsPerBeat  = 60/120 = 0.5s
  segsPerCompas = 0.5 × 4 = 2s
  Audio empieza en: 4.5 - (2×2) = 0.5s
  Clicks: en 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0 (8 clicks)
  Canción suena: desde 0.5s del archivo de audio
```

### Flujo completo para el Maestro
```
1. Cargar MP3  →  waveform aparece instantáneamente
2. Play ▶      →  escuchar la canción
3. Tecla P × N →  tap al ritmo → detecta BPM (aparece el beat grid)
4. Seek        →  click en waveform para ir al primer tiempo fuerte
5. Tecla M     →  marcador amarillo queda fijo = Beat 1
6. Intro       →  elegir 0/1/2/4 compases de conteo previo
7. Preview ▶   →  escuchar clicks + canción sincronizados
8. ✓ Aplicar   →  BPM + intro pasan al simulador principal
9. Grabar      →  tocar el acordeón → se graba perfectamente en tiempo
```

---

## 🔊 WEB AUDIO API — Clicks del Metrónomo

### Función de click audible
```typescript
function programarClick(ctx: AudioContext, esPrimero: boolean, cuando: number) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.frequency.value = esPrimero ? 1200 : 800; // Beat 1 = agudo, resto = grave
  gain.gain.setValueAtTime(esPrimero ? 0.9 : 0.5, cuando);
  gain.gain.exponentialRampToValueAtTime(0.001, cuando + 0.07); // fade out rápido

  osc.start(cuando);
  osc.stop(cuando + 0.07);
}
```

### Por qué Web Audio API y no setTimeout
- `setTimeout` tiene una imprecisión de ±15-50ms (muy perceptible al ritmo)
- `AudioContext.currentTime` es el reloj de la tarjeta de sonido → precisión de microsegundos
- Se pre-programan TODOS los clicks a la vez:
  ```typescript
  const ahora = ctx.currentTime + 0.05; // 50ms de buffer inicial
  for (let i = 0; i < totalBeats; i++) {
    programarClick(ctx, i % compas === 0, ahora + i * segsPerBeat);
  }
  ```

---

## 📱 MODAL GUARDAR HERO

### Archivo: `ModalGuardarHero.tsx`
Se abre automáticamente cuando el Maestro detiene la grabación.

### Props que recibe
```typescript
interface ModalGuardarHeroProps {
  visible:        boolean;
  onCerrar:       () => void;
  onGuardar:      (datos) => void;
  bpm:            number;        // BPM de la grabación
  totalNotas:     number;        // Cuántas notas se grabaron
  sugerenciaTipo: 'secuencia' | 'cancion' | 'ejercicio'; // auto-detectado
  introCompases?: number;        // Pre-llenado desde el sincronizador de pista
}
```

### Auto-detección del tipo sugerido (en AcordeonSimulador.tsx)
```typescript
if (pistaUrl)              setTipoSugerido('cancion');
else if (usoMetronomo)     setTipoSugerido('secuencia');
else                       setTipoSugerido('ejercicio');
```

### Lo que se guarda en Supabase
```typescript
const nuevaCancion = {
  titulo, autor: 'Jesus Gonzalez',
  bpm:           bpmRef.current,
  resolucion:    192,
  secuencia_json: secuencia,   // Array de NotaHero[]
  tipo, dificultad,
  usoMetronomo,
  audio_fondo_url: pistaUrlFinal,  // null si no hay pista
  intro_compases:  datos.intro_compases ?? 0,
};
```

---

## 🐛 BUGS RESUELTOS

### Bug 1: Acordeones separados en AcordeonHero
**Síntoma:** Los dos acordeones aparecían pegados a los bordes de la pantalla, con todo el espacio en el centro.
**Causa:** `justify-content: space-between` en `.hero-escenario`
**Fix:** Cambiar a `justify-content: center` + `width: 44%` por acordeón

### Bug 2: Posición del acordeón desplazada en AcordeonHero
**Síntoma:** El acordeón aparecía descentrado verticalmente y horizontalmente en la pantalla del juego.
**Causa:** `CuerpoAcordeon` usa `position: absolute` con `left: var(--sim-x)` y `top: var(--sim-y)`. Estas variables venían de la configuración guardada del Maestro en Supabase (que había movido el acordeón a otra posición en el simulador).
**Fix:** Override forzado en `ajustesHero`:
```typescript
const ajustesHero = React.useMemo(() => ({
  ...hero.logica.ajustes,
  tamano: 'min(74vh, 37vw)',
  x: '50%',   // siempre centrado, ignore saved position
  y: '50%',
}), [hero.logica.ajustes]);
```

### Bug 3: Migración de Supabase fallida por constraint
**Síntoma:** `ERROR: violates check constraint "check_tipo_hero"`
**Causa 1:** Había filas con `tipo = 'tutorial'` que violaban el nuevo constraint `('ejercicio','secuencia','cancion')`
**Causa 2:** El constraint `check_tipo_hero` ya existía con los valores viejos y no se podía recrear
**Fix:**
```sql
UPDATE canciones_hero SET tipo = 'cancion' WHERE tipo = 'tutorial';
ALTER TABLE canciones_hero DROP CONSTRAINT IF EXISTS check_tipo_hero;
-- luego agregar columnas y recrear constraint
```

### Bug 4: Código duplicado de Tap Tempo
**Síntoma:** Había dos implementaciones de tap tempo: una en `AcordeonSimulador.tsx` y otra en `GestorPistasHero.tsx`
**Fix:** Eliminada la versión de `AcordeonSimulador.tsx` (era código muerto)

---

## 🔧 PENDIENTE / PRÓXIMOS PASOS

### Para el Grabador
- [ ] Auto-detectar BPM desde el audio (como Moises.ia) — requiere análisis de onset detection
- [ ] Guardar `beatOffset` en la base de datos para reproducción perfectamente sincronizada
- [ ] Campo `beat_offset_seconds` en tabla `canciones_hero`

### Para el Juego (AcordeonHero)
- [ ] Implementar bajos en el juego (Fase 2)
- [ ] Tabla `scores_hero` en Supabase para guardar puntuaciones
- [ ] Modo multijugador (dos acordeones físicos vía ESP32)
- [ ] Animaciones de partículas en golpes perfectos

### Para la Pista de Audio
- [ ] Guardar `beat_offset_seconds` junto con la canción para que al reproducirse en el juego, el audio arranque en el momento exacto sincronizado con los ticks

---

## 🗺️ Rutas de la app

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/simulador` | AcordeonSimulador | Simulador básico |
| `/simulador-gaming` | SimuladorGaming | Simulador con herramientas de grabación Pro |
| `/acordeon-hero` | AcordeonHero | El juego |

---

## 💡 Conceptos Clave para Entender el Sistema

### ¿Qué es un "tick"?
La unidad mínima de tiempo en el sistema. 192 ticks = 1 beat (1 golpe de metrónomo). A 120 BPM, 1 tick = 1/192 × 0.5s ≈ 2.6ms.

### ¿Qué es `intro_compases`?
La cantidad de compases de metrónomo/click que suenan ANTES de que empiece la canción. Sirven como cuenta regresiva para que el músico sepa cuándo entrar. Ej: 2 compases de intro a 4/4 = escuchas 8 clicks antes de empezar a tocar.

### ¿Qué es `beatOffset`?
El momento exacto (en segundos) dentro del archivo de audio donde cae el Beat 1 del primer compás musical real. Necesario para que el beat grid quede perfectamente alineado con la canción y el metrónomo suene en el momento exacto.

### ¿Qué es la `tonalidad`?
El acorde/tonalidad del acordeón. En los acordeones diatónicos vallenatos, la tonalidad define qué notas produce cada botón. Las tonalidades disponibles son: `ADG`, `BEA`, `CFBb`, etc. Si una canción fue grabada en `BEA`, el juego automáticamente pone el acordeón del estudiante en `BEA`.

### ¿Cómo viaja una nota de Maestro a Alumno?
```
1. useReproductorHero procesa la secuencia tick por tick
2. Cuando un tick llega, activa actualizarBotonActivo() en el Maestro
3. PuenteNotas.tsx recibe las posiciones de los botones activos
4. Dibuja una curva bezier SVG animada de Maestro → Alumno
5. Cuando la nota llega, el sistema espera input del Alumno
```

---

*Documentación generada por Claude Code — 2026-03-27*
