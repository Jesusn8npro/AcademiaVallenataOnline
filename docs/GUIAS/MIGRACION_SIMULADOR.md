# 🗺️ Hoja de Ruta: Migración del Simulador a React

## 🎯 Objetivo
Replicar la funcionalidad completa de "Guitar Hero Vallenato" en la aplicación React, permitiendo tanto la **creación de contenido** (grabar canciones) como el **juego** (estudiantes).

---

## 📋 Fase 1: Preparar el Terreno (Base de Datos)
Antes de programar, debemos verificar que Supabase tenga donde guardar la música.

- [ ] **Verificar Tablas**: Asegurar que existen `canciones_simulador_acordeon` y `partituras_simulador`.
- [ ] **Crear Tipos TypeScript**: Definir `Cancion`, `Partitura` en `src/types/simulador.ts`.

---

## 📋 Fase 2: El Creador de Contenido (Admin)
Necesitamos una interfaz simple para que tú puedas subir una canción y "jugarla" para grabar las notas. No haremos el Wizard complejo de 4 pasos de Svelte todavía, haremos algo más directo.

### Componente: `CreadorCanciones.tsx`
1.  **Input de Audio**: Un botón para subir el MP3.
2.  **Modo Grabación**:
    - Botón "REC".
    - Al presionar, inicia el audio.
    - Escucha el `AcordeonSimulador` y guarda cada tecla en un array `notasGrabadas`.
3.  **Guardado**:
    - Al terminar, sube el MP3 a Storage.
    - Guarda el JSON de notas en la tabla `partituras`.

---

## 📋 Fase 3: El Reproductor (Juego)
Conectar `SimuladorGaming.tsx` a la base de datos real.

1.  **Selector de Canciones**:
    - Una pantalla previa (`SeleccionCanciones.tsx`) que liste lo que hay en `canciones_simulador_acordeon`.
2.  **Carga de Datos**:
    - Al elegir canción, descargar el JSON de notas y pasárselo a `useMotorDeJuego`.
3.  **Sincronización de Audio**:
    - Usar un elemento `<audio>` oculto o `Howler.js` (como en el original) para reproducir la pista de fondo.
    - Sincronizar el "reloj" del juego con el `currentTime` del audio.

---

## 💡 Diferencias Clave Svelte vs React

| Concepto | Svelte (Original) | React (Nuevo) |
| :--- | :--- | :--- |
| **Estado Global** | `stores/editorStore.ts` (Svelte Stores) | `useContext` o Zustand (Recomendado) |
| **Manejo de Audio** | Web Audio API directo | Recomendamos `react-howler` o Hook personalizado |
| **Ciclo de Vida** | `onMount`, `onDestroy` | `useEffect` |
| **Reactividad** | `$: variable` (Automático) | `useEffect(() => {}, [dep])` (Explícito) |

## ⚠️ Recomendación Importante
No intentes copiar y pegar el código de `editor-interactivo` de Svelte directamente. La lógica de estado es muy diferente. Es mejor **reescribir la lógica** usando los Hooks de React (`useState`, `useRef`), guiándose por la funcionalidad que ya documentamos.

El motor matemático (`logicaJuego.ts` -> `useMotorDeJuego.ts`) ya está portado, esa era la parte más difícil. ¡Lo demás es UI y conexión a datos!
