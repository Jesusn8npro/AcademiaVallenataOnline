# Gestor de Pistas — Sistema de Ritmo y Conteo
> GestorPistasHero.tsx — última versión funcional

---

## ¿Qué hace este componente?

Permite al Maestro cargar un MP3, detectar su BPM tapeando al ritmo, y generar un conteo de entrada (clicks) que queda sincronizado con la canción. El estudiante escuchará esos clicks antes de que entre la música.

---

## Archivo

```
src/Paginas/SimuladorDeAcordeon/Componentes/GestorPistasHero.tsx
```

---

## Props

```typescript
interface GestorPistasHeroProps {
    pistaActualUrl:  string | null;
    onPistaChange:   (url: string | null, archivo: File | null) => void;
    reproduciendo:   boolean;           // viene del reproductor de secuencia
    bpmSecuencia:    number;
    bpmGrabacion:    number;
    enGrabacion:     boolean;
    tickActual:      number;
    onBpmSincronizado?: (bpm: number, introCompases: number) => void;  // manda BPM al simulador
    onIniciarGrabacionConConteo?: () => void;  // dispara grabación cuando termina el conteo
}
```

---

## Flujo de uso (paso a paso)

```
1. Cargar MP3/WAV  →  aparece el reproductor
2. Dale Play  →  escucha la canción
3. Tapea P al ritmo (mínimo 3 taps)  →  detecta BPM + captura la fase
4. Elige clicks: 4 / 8 / 12
5. "▶ Escuchar"  →  preview: audio retrocede + clicks suenan sincronizados
6. "✓ Aplicar BPM"  →  manda BPM al simulador principal
7. "⏺ Grabar con N clicks"  →  conteo → grabación arranca automáticamente
```

---

## Cómo funciona la detección de BPM

Cada tap registra DOS cosas simultáneamente:

```typescript
const ahora      = Date.now();                        // reloj del sistema → calcula BPM
const audioAhora = audioRef.current?.currentTime;     // posición del audio → captura la FASE
```

El BPM se calcula promediando los intervalos entre taps del reloj del sistema:
```typescript
const intervalos = tapTiempos.slice(1).map((t, i) => t - tapTiempos[i]);
const promedio   = intervalos.reduce((a, b) => a + b, 0) / intervalos.length;
const bpm        = Math.round(60000 / promedio);
```

La **fase** (`faseAudio`) = el `currentTime` del audio en el último tap.
Esto nos dice: *"en el segundo X del audio cayó un beat"*.

Con esa info el sistema puede:
- Colocar clicks hacia atrás desde ese punto
- Hacer que el preview retroceda exactamente N beats antes

**Tecla:** `P` mientras la canción suena. Mínimo 3 taps para que sea confiable, 6-8 taps para máxima precisión.

Se reinicia automáticamente si pasan más de 3 segundos sin tocar.

---

## Cómo funciona el conteo hacia atrás

```
faseAudio = 8.0s  (el maestro tapeó aquí)
BPM = 120         (beat cada 0.5s)
numClicks = 8

audioStart = 8.0 - (8 × 0.5) = 4.0s  ← audio hace seek aquí

Timeline:
4.0s  4.5s  5.0s  5.5s  6.0s  6.5s  7.0s  7.5s  [8.0s → canción]
 🟡    🟣    🟣    🟣    🟡    🟣    🟣    🟣     ▶ ENTRA
```

- 🟡 = beat 1 de cada grupo de 4 (click agudo 1200 Hz)
- 🟣 = beats 2, 3, 4 (click grave 800 Hz)

Los clicks se pre-programan todos a la vez con `AudioContext.currentTime` para que no haya drift (no usan setInterval para sonar, solo para animar visualmente).

---

## Preview — algoritmo exacto

```typescript
const sPB            = 60 / bpmDetectado;
const totalSegConteo = numClicks * sPB;
const audioStart     = Math.max(0, faseAudio - totalSegConteo);

// Si faseAudio < totalSegConteo (beat muy cerca del inicio del audio),
// se ajusta automáticamente para no ir a tiempo negativo.
const clicksQueEntran = Math.min(numClicks, Math.floor(faseAudio / sPB));

// Seek del audio
audioRef.current.currentTime = audioStart;

// Clicks programados en AudioContext
const base = ctx.currentTime + 0.08; // 80ms buffer
for (let i = 0; i < clicksQueEntran; i++) {
    sonarClick(ctx, i % 4 === 0, base + offsetPrimerClick + i * sPB);
}

// Audio arranca con el mismo buffer → sincronía perfecta
setTimeout(() => audioRef.current.play(), 80);
```

---

## Grabar con conteo

Botón: **"⏺ Grabar con N clicks de entrada"**

1. Audio hace seek a `max(0, faseAudio - numClicks × sPB)`
2. Clicks suenan (pre-programados con AudioContext)
3. Audio arranca simultáneamente
4. Al último click: llama `onIniciarGrabacionConConteo()` → `grabador.iniciarGrabacion()`
5. El Maestro empieza a tocar el acordeón
6. Todo queda grabado con el timing correcto

---

## Click audible (Web Audio API)

```typescript
function sonarClick(ctx: AudioContext, fuerte: boolean, cuando: number) {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = fuerte ? 1200 : 800;  // agudo = beat 1, grave = resto
    gain.gain.setValueAtTime(fuerte ? 0.8 : 0.4, cuando);
    gain.gain.exponentialRampToValueAtTime(0.001, cuando + 0.06);
    osc.start(cuando);
    osc.stop(cuando + 0.08);
}
```

**Por qué AudioContext y no setInterval para sonar:**
- `setInterval` tiene ±15-50ms de imprecisión (se nota al ritmo)
- `AudioContext.currentTime` es el reloj de la tarjeta de sonido → microsegundos de precisión
- Todos los clicks se programan de golpe antes de que suene el primero

---

## Pendiente para mañana

- [ ] Verificar que el preview suena correctamente sincronizado en el teléfono
- [ ] Guardar `faseAudio` y `bpmDetectado` en Supabase junto a la canción (columna `beat_offset_seconds`)
- [ ] En AcordeonHero (playback del estudiante): usar `beat_offset_seconds` para arrancar el audio en el punto correcto después del conteo
- [ ] Decidir: ¿el botón "Grabar con conteo" reemplaza el botón rojo de grabación existente, o conviven los dos?

---

## Conexión con AcordeonSimulador.tsx

```tsx
<GestorPistasHero
    pistaActualUrl={pistaUrl}
    onPistaChange={handlePistaChange}
    reproduciendo={reproductor.reproduciendo && !reproductor.pausado}
    bpmSecuencia={bpm}
    bpmGrabacion={bpmGrabacion}
    enGrabacion={grabador.grabando}
    tickActual={reproductor.tickActual || 0}
    onBpmSincronizado={(nuevoBpm, introCompases) => {
        setBpm(nuevoBpm);
        setBpmGrabacion(nuevoBpm);
        setIntroCompasesSincronizados(introCompases);
    }}
    onIniciarGrabacionConConteo={() => {
        grabador.iniciarGrabacion();
    }}
/>
```

---

*Última actualización: 2026-03-28*
