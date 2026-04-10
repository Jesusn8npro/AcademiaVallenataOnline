# 🎮 Guía de Funcionamiento: Simulador y Sistema de Grabación (Legacy Svelte)

## 📌 Introducción
Este documento explica en detalle cómo funcionaba el ecosistema "Simulador Gaming" en el proyecto original de Svelte. El objetivo no era solo "jugar", sino permitir a los profesores o usuarios avanzados **CREAR** el contenido (las canciones) que luego los estudiantes jugarían.

El sistema se dividía en dos grandes mundos:
1.  **El Editor Interactivo** (Donde se crean las canciones).
2.  **El Modo Juego** (Donde el estudiante juega).

---

## 1. 🛠️ El Editor Interactivo (Donde nace la canción)
Ubicación original: `src/routes/simulador-gaming/editor-interactivo`

El proceso de creación de una canción seguía un flujo de 4 pasos estrictos (Wizard):

### Paso 1: Subir Audio (`PasoSubirAudio.svelte`)
- El creador arrastra un archivo MP3 (la canción vallenata real).
- El sistema analiza la duración y valida el formato.
- Se llenan metadatos: Título, Artista, BPM, Dificultad.

### Paso 2: Grabar Notas - "Modo Grabación" (`PasoGrabarNotas.svelte`)
- **Aquí ocurre la magia**.
- El sistema reproduce el MP3 que se subió en el paso 1.
- Al mismo tiempo, muestra el Acordeón Virtual.
- El creador (profesor) **TOCA** el acordeón al ritmo de la música.
- **Técnicamente:** El sistema captura cada evento `onNotaPresionada` y guarda:
    ```json
    {
      "nota_id": "1-3-cerrando",
      "timestamp_ms": 12500, // ¿En qué milisegundo sde la canción ocurrió?
      "duracion_ms": 500
    }
    ```
- El resultado es una "Partitura Digital" (JSON) sincronizada perfectamente con el audio.

### Paso 3: Vista Previa (`PasoVistaPrevia.svelte`)
- Un control de calidad.
- El sistema reproduce el audio y lanza las "Notas Voladoras" basadas en lo que se grabó en el Paso 2.
- Permite verificar si la sincronización quedó bien.

### Paso 4: Publicación (`PasoPublicar.svelte`)
- Sube el MP3 a Supabase Storage.
- Guarda el JSON de notas en la tabla `partituras_simulador`.
- Crea el registro en `canciones_simulador_acordeon`.
- Genera recompensas (XP) por crear contenido.

---

## 2. 🎸 El Modo Juego (Lo que ve el estudiante)
Ubicación original: `src/routes/simulador-gaming/juego`

Una vez la canción existe en la base de datos, el estudiante entra aquí.

### Flujo Técnico:
1.   **Carga**: Se descarga el JSON de notas (`partituras_simulador`) y el MP3.
2.  **Motor (`logicaJuego.ts`)**: Se inicializa el motor con esas notas.
3.  **Ejecución**:
    - El audio suena de fondo.
    - Las notas caen visualmente (anticipación de ~2 segundos).
    - Cuando el usuario toca una tecla, el motor compara el tiempo actual con el tiempo de la nota.
    - **Veredicto**: `Perfect`, `Good`, `Miss`.

---

## 3. 🗄️ Tablas de Base de Datos (Supabase)

Para que esto funcione en nuestra nueva App React, necesitamos asegurar que estas tablas existan o tengan equivalentes:

1.  **`canciones_simulador_acordeon`**: Catálogo de canciones disponibles.
    *   `id`, `titulo`, `artista`, `url_audio`, `nivel`, `bpm`.
2.  **`partituras_simulador`**: La "data" de las notas.
    *   `cancion_id`, `secuencia_notas` (JSONB - Aquí vive el array de notas grabado).
3.  **`estadisticas_simulador`**: Historial de partidas.
    *   `usuario_id`, `cancion_id`, `puntaje`, `precision`, `max_combo`.

---

## 4. 🚀 Estado Actual en React (Tu Proyecto)

### Lo que ya tenemos:
*   ✅ **Simulador Visual**: El acordeón se ve y suena (`AcordeonSimulador.tsx`).
*   ✅ **Motor de Juego**: Acabamos de crear `useMotorDeJuego.ts` (El cerebro matemático).
*   ✅ **UI de Puntos**: `TableroPuntos.tsx`.

### Lo que FALTA (El Gap):
*   ❌ **No tenemos Editor**: No hay forma de crear nuevas canciones (grabar la secuencia) desde la App React.
*   ❌ **Conexión a BD**: El simulador actual usa datos "Mock" (falsos), no descarga canciones reales de Supabase.

### Plan de Acción (Siguiente Paso):
Necesitamos crear una versión simplificada del **"Paso 2: Grabar Notas"** en React para que tú (como admin) puedas crear las canciones y guardarlas en Supabase.
