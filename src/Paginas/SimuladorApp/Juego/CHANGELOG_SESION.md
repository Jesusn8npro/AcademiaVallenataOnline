# SimuladorApp · Modo Juego — Changelog de la sesión

Trabajo desde el commit `d667a5a` (fix botón COMENZAR de PantallaAprende).
Toda esta sesión se enfocó en hacer el **modo juego** del SimuladorApp competente
con dos métodos visuales (notas cayendo libre y boxed estilo Synthesia clásico),
sin tocar AcordeonProMax.

---

## 1. Bugs base arreglados

### Bug A — solo se marcaba el primer botón
`notasImpactadas` es un `Set` que se muta sin cambiar referencia → React no
detectaba la mutación en deps de `useMemo`. Agregué `notasImpactadasSize`
(`.size` del Set) como dep adicional para forzar recálculo cada vez que crece.

### Bug B — al pisar no alumbraba
El pseudo-elemento `::after` que añadí para el velo de objetivo tapaba el
gradiente que `nota-activa` aplica al pulsar. **Eliminé `::after`** y dejé
solo `border` + `box-shadow` para el highlight del objetivo. Ahora el press
visual (gradiente cian/rojo + scale + transform) se ve sin obstrucciones.

### Bug C — secciones no funcionaban
`config.seccionId` se elegía pero **nunca se llamaba** a
`hero.seleccionarSeccion()`. Agregué la llamada antes de `iniciarJuego`.
Replica el patrón de ProMax: lead-in de 3s, offset al `tickInicio`, y
`rangoTicks` filtran las notas correctamente.

### Bug D — pre-highlight muy temprano
Ventana de objetivo iba de `[-20, TICKS_VIAJE=384]` (toda la trayectoria).
Bajé a `[-5, 40]` ticks → solo se ilumina cuando la nota está **realmente**
cerca del pito.

### Bug del tono
La carga asíncrona de ajustes en la nube sobrescribía el tono de la canción.
Mi `useEffect` ahora **siempre** revierte a `cancion.tonalidad` si la nube
intenta cambiarlo (replicando ProMax: `seleccionarCancion` + `iniciarJuego`
ambos llaman a `setTonalidadSeleccionada`).

### Touch del cuero del fuelle
`.seccion-bajos-contenedor` no estaba en la whitelist `SELECTORES_INTERACTIVOS`
del touch handler global → se trababa en mobile. Añadido + nueva
`.juego-sim-fuelle-zona` (zona táctil invisible en modo juego para invertir
el fuelle al presionar/soltar en modo competitivo).

---

## 2. Pista de notas — Método 1: cayendo libre (Guitar Hero / Synthesia)

`PistaNotasVertical.tsx` reescrito para usar **posiciones reales del DOM**:
- `getBoundingClientRect()` del `.pito-boton[data-pos="X-Y"]` real
- Las notas caen exactamente sobre el botón correcto
- Sigue al pan horizontal del tren-deslizable automáticamente
- Caída vertical estilo Guitar Hero

Características:
- **Notas sólidas** con gradiente radial 3D estilo bola (no planas, no translúcidas)
- **Cola de sostenidos** estilo Guitar Hero — barra ancha vertical detrás de la
  cabeza que drena con el tiempo. Aparece cuando `duracion > 30 ticks`.
- **Hit feedback**: la nota se vuelve blanca, hace scale 1→1.9 con brightness
  burst + 6 partículas radiales que vuelan 34px y se desvanecen.
- **Notas ordenadas por progreso ASC** → la inminente queda encima en z-stack.
- **Notas lejanas se atenúan** a opacidad 0.35 cuando hay una inminente
  (progreso > 0.78), para que no tapen la vista.
- **Inminente con anillo blanco pulsante** + borde blanco — identificador
  inequívoco de "esta es la nota a pisar".
- Filtra notas de bajos (`-bajo` en el botonId) — no se renderizan en juego.

---

## 3. Pista de notas — Método 2: boxed (Synthesia clásico)

`PistaNotasBoxed.tsx` + `.css` (archivo nuevo, totalmente independiente):
- Contenedor fijo arriba de la pantalla, altura 25vh, fondo translúcido
  oscuro, borde inferior gris grueso (4px).
- Las notas caen DENTRO del contenedor.
- La nota inminente queda **medio cortada** en el borde inferior gracias
  a `overflow: hidden` + `transform: translate(-50%, -50%)`.
- **Aprovecha el motor `synthesia` de useLogicaProMax**: cuando se elige el
  modo boxed, fuerzo `setModoPractica('synthesia')`. El motor pausa
  `tickActual` en cada nota → el visual stop-and-wait sale solo.
- Notas ordenadas por progreso ASC → la inminente queda arriba en z-stack
  con anillo blanco pulsante + opacidad 1.
- Las demás (queue) bajan a opacidad 0.28 para que destaque solo la del
  fondo (la que toca pisar).
- Cada nota se posiciona en X via `getBoundingClientRect` del pito real
  → puedes trazar visualmente desde la cajita al pito abajo.

---

## 4. Selector de modo visual + persistencia

- **Switch real con dos opciones visibles** (`↓ Libre` / `☐ Synth`) en
  píldora amarilla, al lado del puntaje (right: 200px / 150px en mobile).
- Persistencia con `localStorage` (key `simulador_modo_visual`).
- **Toast efímero** al cambiar modo: explica brevemente cómo funciona cada uno
  ("Modo libre · las notas caen sobre los pitos" / "Modo Synthesia · la
  canción se pausa en cada nota"). Auto-desaparece a los 2.5s.
- Al activar boxed, se fuerza `synthesia`. Al activar libre, vuelve al modo
  original elegido en config.

---

## 5. Highlight del pito objetivo

Computado por `useMemo` en `JuegoSimuladorApp` que devuelve
`{ guia: Map<pos, fuelle>, sosteniendo: Set<pos> }`:

1. **Encuentra la nota más próxima** (no impactada, dentro de ventana
   `[-5, VENTANA_OBJETIVO=40]` ticks).
2. **Agrupa todas las notas dentro de UMBRAL_ACORDE=30 ticks** del minTick →
   soporta acordes (multiples botones encendidos a la vez).
3. **Sostenidos en curso**: notas ya impactadas cuya duración no terminó →
   permanecen en el set con flag `sosteniendo`.

Visual:
- **Borde de color fuerte** (azul para halar, rojo para empujar) +
  tinte interior sutil + halo casi nulo. Conserva el background original
  del pito.
- Sostenidos: animación `pito-sosteniendo-cargar` 0.6s ease-in-out infinite
  que pulsa el halo blanco simulando "energía acumulándose".

---

## 6. Marca de agua "Acordeón Pro Max"

Texto cursivo grande estilo Cassoto en el área negra superior, alpha 0.13,
detrás de la pista. En modo boxed se mueve a bottom: 38vh para no estorbar
la cajita.

---

## 7. Header del juego

- **Eliminado el botón X (salir)**. Toda la navegación va por el menú de pausa.
- Solo queda el botón de pausa, que abre `MenuPausaProMax` con: Reanudar,
  Reiniciar, Cambiar modo (Synthesia/Maestro/Libre), Salir.

---

## 8. Pantalla de resultados — `PantallaResultadosSimulador.tsx`

Nueva, totalmente independiente del de ProMax. Reutiliza el hook
`usePantallaResultados` para data + score saving (sin duplicar).

Layout horizontal landscape mobile-first:
- Header compacto (cerrar / título / autor / 3 estrellas)
- 4 columnas de stats con colores semánticos (Perfectas verde, Bien azul,
  Fallidas ámbar, Perdidas rojo)
- Línea meta: Precisión (rosa) · Racha máx · Puntos (ámbar grande)
- Botones: Salir / Siguiente sección (si aplica) / Otra vez (primario ámbar)
- Media query landscape `max-height: 540px` afina todo para no apretar.

---

## 9. Modal de configuración — `PantallaConfigCancion.tsx`

Rediseñado:
- **Cards compactas** (4 columnas siempre) en lugar de dropdown nativo
- Cada card: icono Lucide + título corto (sin descripción para no apretar)
- **Long-press / hover** sobre una card → tooltip flotante ámbar arriba
  + descripción dinámica debajo del grid
- Active = azul; previsualizando (long-press) = ámbar
- **Chips redondas** para selección de sección
- Toggle de "Guía de audio del maestro" mantenido
- Panel con sombra blanca exterior para que se distinga claramente

---

## 10. Switch de modo visual + zona táctil de fuelle

- Switch flotante para alternar Libre / Synth
- Zona táctil invisible (`.juego-sim-fuelle-zona`) entre el header y los
  pitos: presionar = `empujar`, soltar = `halar`. No tiene imagen ni colores
  (queda transparente sobre el fondo negro del root).

---

## Archivos creados

- `src/Paginas/SimuladorApp/Juego/PistaNotasBoxed.tsx`
- `src/Paginas/SimuladorApp/Juego/PistaNotasBoxed.css`
- `src/Paginas/SimuladorApp/Juego/PantallaResultadosSimulador.tsx`
- `src/Paginas/SimuladorApp/Juego/PantallaResultadosSimulador.css`
- `src/Paginas/SimuladorApp/Juego/CHANGELOG_SESION.md` (este archivo)

## Archivos modificados

- `src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.tsx`
- `src/Paginas/SimuladorApp/Juego/JuegoSimuladorApp.css`
- `src/Paginas/SimuladorApp/Juego/HeaderJuegoSimulador.tsx`
- `src/Paginas/SimuladorApp/Juego/PistaNotasVertical.tsx`
- `src/Paginas/SimuladorApp/Juego/PistaNotasVertical.css`
- `src/Paginas/SimuladorApp/Aprende/PantallaConfigCancion.tsx`
- `src/Paginas/SimuladorApp/Aprende/PantallaConfigCancion.css`
- `src/Paginas/SimuladorApp/Componentes/ContenedorBajos.tsx`
- `src/Paginas/SimuladorApp/Hooks/usePointerAcordeon.ts`
- `src/componentes/Menu/MenuPublico.css`

## Pendiente conocido

- **Bug del Synthesia "notas pasan derecho"** en algunas canciones: el
  `UMBRAL_ACORDE` del motor (`useLogicaProMax.ts:378`) es de 15 ticks. Si
  las notas de un acorde están más espaciadas, no se agrupan. Tocar en
  ProMax también — fuera de scope de SimuladorApp.
- Métodos 3 (carriles verticales) y 4 (flecha minimalista) — diseñados pero
  no implementados, decisión del usuario.
