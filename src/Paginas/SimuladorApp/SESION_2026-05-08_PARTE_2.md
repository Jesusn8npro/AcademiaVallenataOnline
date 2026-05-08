# SimuladorApp · Sesión 2026-05-08 (Parte 2)

Continuación de [`SESION_2026-05-08.md`](./SESION_2026-05-08.md). Foco
del día (parte 2): rediseño visual completo de la barra de herramientas,
modo foco con diferenciación premium/free, banner del ecosistema HERO,
galería de modelos visuales del acordeón.

---

## 1. Banner Ecosistema HERO (carrusel rotativo)

**Antes:** ad estático de 3rd-party "Acordeón Piano Cassotto" con botón
INSTALAR que apuntaba a una app externa.

**Ahora:** [`BannerEcosistemaHero.tsx`](./Componentes/BannerEcosistemaHero.tsx)
+ `.css`. Carrusel rotativo (5s) con 6 gatillos de venta del ecosistema
propio:

| # | Mensaje | Ruta | Acento |
|---|---|---|---|
| 1 | 🎮 Acordeón HERO — Juega notas en cascada · gana XP y monedas | `/acordeon-pro-max` | morado→cyan |
| 2 | 👑 Hazte Plus — Todas las canciones · sin anuncios · soporte 24/7 | `/paquetes` | dorado |
| 3 | 🎓 Aprende desde cero — Tutoriales paso a paso | `/tutoriales-de-acordeon` | verde |
| 4 | 🏆 Compite en el Ranking — Sube posiciones tocando canciones | `/ranking` | naranja |
| 5 | 👥 +5,000 acordeoneros activos — Comunidad | `/comunidad` | rosa |
| 6 | 📲 Agrégalo a tu pantalla (PWA) — solo mobile NO instalado | popup iOS/Android | azul |

**Comportamiento inteligente:**
- Hover pausa la rotación (UX: si el usuario lee, no le cambias el mensaje)
- Mensaje #6 aparece SOLO en mobile (`/iPhone|iPad|iPod|Android|Mobi/` o
  touch + width<1024) Y solo si la PWA NO está instalada (`display-mode:
  standalone`)
- Click navega a la ruta o abre popup contextual (iOS vs Android)
- Dots indicadores en la esquina inferior derecha

---

## 2. Rediseño barra de herramientas (videojuego serio + maduro)

**Cambio de paleta y look-and-feel** de "industrial gris + 4 acentos" a
"DAW pro slate + acento cyan único".

### Sistema visual nuevo
- CSS vars de tema: `--bh-acento` (#22d3ee cyan), `--bh-aprende` (dorado),
  `--bh-rec`, `--bh-loop`. Centralizadas en `.barra-herramientas-contenedor`.
- Barra: gradiente slate (#1e293b → #0f172a) con `backdrop-filter: blur(10px)`
  y ambient cyan tenue (rgba 0.05). Border 1px suave en lugar de 2px duro.
- Border-radius 12px (era 8). Sombra exterior + inset highlight superior.

### Botones tipo "botón físico de acordeón"
- **Estado normal (saliente)**: gradiente claro arriba → oscuro abajo +
  inset highlight 1px en el borde superior + drop shadow inferior.
- **Hover**: brillo + border cyan tenue, label se aclara a #cbd5e1.
- **Press**: `translateY(1px)` + sombra exterior reducida → "se hunde".
- **Activo (modal abierto)**: gradiente INVERTIDO + inset shadow profunda
  + ring cyan 1px + glow cyan tenue.
  - **NO usa `transform`** — la flecha indicadora se ancla por
    `getBoundingClientRect()` y un transform ofuscaría su cálculo.

### Flecha indicadora del activo
- Cyan (`#22d3ee`) por default + drop-shadow cyan glow + sombra dura
- Variante dorada cuando el activo es el botón TUTORIALES (acento ámbar)
- Animación de aparición con cubic-bezier "elástico" suave

---

## 3. Renombres semánticos + reordenado estratégico

**Renombres:**
| Antes | Ahora | Por qué |
|---|---|---|
| APRENDE | **TUTORIALES** | Más claro, refleja el contenido real |
| LOOPS | **PISTAS** | Lenguaje del acordeonero vallenato |

**Ícono de TUTORIALES**: `BookOpen` (libro genérico) → `GraduationCap`
(gorro graduación → evoca tutor/profesor).

**Orden estratégico — IZQUIERDA (flujo natural del alumno):**
```
Antes:  APRENDE / LOOPS / Instrumento / Tono / FX
Ahora:  TUTORIALES / Instrumento / Tono / PISTAS / FX
```
Lógica: aprender → con qué timbre → en qué tono → con qué fondo musical
→ con qué efecto.

**Orden estratégico — DERECHA (controles del simulador):**
```
Antes:  🛒 / BOTONES / Vista / Tamaño / Metrónomo / ⋮
Ahora:  BOTONES / Vista / Tamaño / Metrónomo / 🛒 / ⋮
```
Lógica: lo que se usa al tocar primero, lo secundario (oferta) cerca
del menú.

---

## 4. Modo Foco (diferenciación premium / free)

**Botón flotante "FOCO"** en la esquina superior izquierda — pestaña
vertical slim pegada al borde con flecha indicadora apuntando a la barra.

### Estados visuales
- **Inactivo**: cyan, ícono `Eye`, texto "FOCO" rotado 90° (`writing-mode:
  vertical-rl`)
- **Activo**: ámbar, ícono `EyeOff`, **solo el ícono** (sin texto —
  minimalismo total mientras se toca)

### Comportamiento por rol
| Rol | Foco activo | Resultado |
|---|---|---|
| 👑 Premium / Admin | Toda la barra desaparece | Acordeón puro, pantalla limpia |
| 🎓 Free / Estudiante | Botones laterales colapsan, **banner Hero queda** | Gatillo de venta del Plus se mantiene |

**Detección premium:** `esAdmin || usuario?.plan_activo === true` (cuando
se agregue el campo `plan_activo` en `perfiles`, ya está soportado).

### Timer free + toast Premium
- Free: useEffect setTimeout 60s al activar foco. Al expirar:
  `setModoFoco(false)` + `setToastUpgradeVisible(true)`.
- Premium: timer no aplica — uso ilimitado.
- Toast `.toast-upgrade-premium`: card dorada arriba con icono Crown,
  mensaje "Modo Foco gratuito terminó — Hazte Plus y disfrútalo sin
  límites", botón "Ver Plus" → `/paquetes`, botón X cerrar.
- Auto-cierre 8s.

### Animaciones de lujo
- Easing: `cubic-bezier(0.76, 0, 0.24, 1)` (easeInOutQuart) — sensación
  premium, no estándar.
- Duración 0.55s (más percibible y suave que 0.25s anterior).
- Coordinadas: barra colapsa con `max-height` + `opacity` + `margin` +
  `transform`, mientras canvas se contrae a la misma cadencia.

### Cómo se encoge el canvas SIN crecer los pitos

**Causa raíz del bug:** `.simulador-canvas` tenía `height: calc(... +
62px + ...)` hardcoded para reservar espacio a la barra. Al colapsar
la barra esos 62px quedaban → `.diapason-marco` (`flex: 1`) los
absorbía haciendo crecer los pitos.

**Solución**:
1. Variable CSS `--espacio-barra` (default `62px`) reemplaza el literal.
2. Clase `.modo-foco` en simulador-canvas: `--espacio-barra: 0px`.
3. Barra colapsa con `max-height: 0` + `opacity: 0` (no `display: none`
   para preservar la animación).

Resultado: canvas se encoge exactos 62px, diapason-marco no tiene espacio
extra que llenar, los pitos NO crecen (están en vh, no en flex).

### Botón anclado al canvas
- `position: fixed` → `position: absolute` dentro del simulador-canvas
- Cuando el canvas se encoge en modo foco, el botón **baja con él**
  manteniendo siempre la esquina superior izquierda

### Botón no dispara pitos detrás
- Su rect siempre está en `obtenerRectsBloqueadores` de SimuladorApp
- `usePointerAcordeon.enRectBloqueador()` ignora hits sobre él

---

## 5. Banner Hero compactado para que la barra quepa

| Propiedad | Antes | Ahora |
|---|---|---|
| max-width | 360px | **210px** |
| min-width | 240px | **130px** |
| Icono | 32×32 | 26×26 |
| Título | 12px | 11px |
| Desc | 10px | 9px |
| Padding | 6×10 | 4×7 |

`.bloque-anuncio-centro`: `flex: 1` → `flex: 0 1 auto` con max-width
220→200px y margin lateral 6→4px. Gap entre botones en `.seccion-barra`:
4→3px.

Resultado: TUTORIALES + 🪗 + TONO + PISTAS + FX + banner + BOTONES +
Vista + TAMAÑO + BPM + 🛒 + ⋮ — **los 12 elementos visibles** en mobile
landscape sin scroll.

---

## 6. Galería de Modelos Visuales del Acordeón

### Estructura preparada para escalar
```
public/acordeones/
  pro-max/
    diapason.jpg     # fondo del cuerpo del simulador
    bajos.jpg        # imagen de los bajos
    preview.png      # thumbnail para la galería
  rojo/
    diapason.jpg
    bajos.jpg
    preview.png
  verde/
    diapason.jpg
    bajos.jpg
    preview.png
```

**Para agregar un modelo nuevo SIN tocar código:**
1. Crear `public/acordeones/<nuevo-id>/` con esos 3 archivos
2. Agregar la entrada en
   [`Datos/temasAcordeon.ts`](./Datos/temasAcordeon.ts)
3. Aparece automáticamente en la galería

### Datos del catálogo
[`temasAcordeon.ts`](./Datos/temasAcordeon.ts):
- 3 modelos iniciales: **Pro MAX** (default), **Rojo Clásico**, **Verde
  Vallenato**
- Categorías: `'pro_max' | 'originales' | 'personalizados'`
- Soporte `premiumOnly` listo (gating en F3)
- Soporte `colores` opcional (campo `{cuerpo, botones, fuelle}`) listo
  para editor F2
- Helpers `leerTemaGuardado()` / `guardarTemaElegido()` con localStorage

### UI: GaleriaAcordeones
[`GaleriaAcordeones.tsx`](./Componentes/GaleriaAcordeones.tsx) +
[`.css`](./Componentes/GaleriaAcordeones.css):
- Modal "de lujo" con tabs **Todos / Pro MAX / Originales / Personalizados**
- Tarjetas con preview, nombre, descripción + badge "EN USO" en la activa
- Badge "PLUS" preparado para premium gating
- Placeholder amigable cuando "Personalizados" está vacío (F2)
- Hover sutil + elevación de la card activa con borde cyan
- Mobile-first: grid 2 cols <640px, stack en <480px

### Wiring al simulador
- Estado `temaAcordeonId` en SimuladorApp con `useState(() =>
  leerTemaGuardado())`
- CSS variable `--imagen-diapason` aplicada inline al `.simulador-canvas`
- `ContenedorBajos` recibe `imagenBajosUrl` como prop opcional (cae al
  asset original si no se pasa)
- Acceso desde menú ⋮ → "Galería de Acordeones" (primera opción, con
  icono `Sparkles` cyan)

### Estado actual de las imágenes
Los 3 modelos comparten las mismas imágenes (placeholder). Cada uno
tiene preview distinto (Modelo 1/2/3.png). Para diferenciarlos en el
simulador real, hay que reemplazar `diapason.jpg` y `bajos.jpg` en cada
carpeta — **no requiere tocar código**.

---

## Bugs corregidos durante la sesión

| Bug | Causa | Solución |
|---|---|---|
| Pitos detrás del panel FX se activaban al deslizar | Cache de rects no sabía que el panel los ocluía | `obtenerRectsBloqueadores` + `enRectBloqueador()` en `usePointerAcordeon` |
| Botón FOCO disparaba pito tapado | Mismo problema del panel FX | Botón FOCO siempre en lista de bloqueadores |
| Modal admin: teclado virtual tapaba inputs | input aparecía pero teclado lo cubría | `onFocus` con `scrollIntoView({block:'center'})` + 300ms delay + max-height: 92dvh |
| Metrónomo siempre se guardaba como `usoMetronomo: false` | Se leía un ref que se ponía null antes del modal | Leer de `grabacionPendiente.metadata.metronomo` que sí persiste |
| Admin no podía guardar como "Mi grabación personal" | Incompatibilidad firma posicional vs objeto | Alineado el contrato de `onGuardarPersonal` a posicional |
| Foco "acercaba" el acordeón | Canvas tenía 62px hardcoded → flex llenaba el espacio | Variable `--espacio-barra` que cambia a 0 en foco |
| Barra cortada por banner Hero grande | Banner sin flex-shrink + max-width 360px | Banner reducido a 210px max + flex 0 1 auto |

---

## Archivos creados / modificados

### Nuevos
- `public/acordeones/pro-max/{diapason.jpg, bajos.jpg, preview.png}`
- `public/acordeones/rojo/{diapason.jpg, bajos.jpg, preview.png}`
- `public/acordeones/verde/{diapason.jpg, bajos.jpg, preview.png}`
- `src/Paginas/SimuladorApp/Datos/temasAcordeon.ts`
- `src/Paginas/SimuladorApp/Componentes/BannerEcosistemaHero.tsx` + `.css`
- `src/Paginas/SimuladorApp/Componentes/GaleriaAcordeones.tsx` + `.css`
- `src/Paginas/SimuladorApp/SESION_2026-05-08_PARTE_2.md` (este archivo)

### Modificados
- `src/Paginas/SimuladorApp/SimuladorApp.tsx` — modo foco, galería,
  temas, esPremium, timer free, toast, fix metrónomo, fix admin guardar,
  obtenerRectsBloqueadores con botón FOCO incluido
- `src/Paginas/SimuladorApp/SimuladorApp.css` — variable `--espacio-barra`,
  clase `.modo-foco`, transición `cubic-bezier(0.76, 0, 0.24, 1)`,
  `--imagen-diapason` para fondo dinámico
- `src/Paginas/SimuladorApp/Componentes/BarraHerramientas/BarraHerramientas.tsx`
  — TUTORIALES/PISTAS, GraduationCap, reordenado, modoFoco/esPremium props
- `src/Paginas/SimuladorApp/Componentes/BarraHerramientas/BarraHerramientas.css`
  — paleta cyan/slate, botón saliente/hundido, flecha indicadora, modo foco,
  toast upgrade premium
- `src/Paginas/SimuladorApp/Componentes/BarraHerramientas/MenuOpciones.tsx`
  — opción "Galería de Acordeones" como primer item con icono Sparkles
- `src/Paginas/SimuladorApp/Componentes/ContenedorBajos.tsx` — prop
  `imagenBajosUrl` opcional con fallback al asset original
- `src/Paginas/SimuladorApp/Hooks/usePointerAcordeon.ts` — fix bloqueador
  desde sesión anterior (mantenido)
- `src/Paginas/AcordeonProMax/Hooks/useGrabacionProMax.ts` — `guardarComoCancionHero`
- `src/Paginas/AcordeonProMax/Hooks/_tiposGrabacionProMax.ts` — `'cancion_hero'`
  agregado al tipo

---

## Commits relevantes (rama `main`, en orden)

| Hash | Descripción |
|---|---|
| `fd33ccd` | feat(simulador): banner ecosistema HERO con gatillos de venta rotativos |
| `43bf6f5` | feat(simulador): rediseño barra herramientas — videojuego serio + botón acordeón |
| `4721769` | feat(simulador): rediseño barra — TUTORIALES/PISTAS + orden estratégico |
| `5073304` | feat(simulador): modo foco con diferenciación premium/free |
| `4dfab34` | feat(simulador): modo foco rediseñado — pestaña vertical slim + timer free |
| `1412461` | fix(simulador): foco no contrae espacio + banner más compacto + flecha indicadora |
| `498d3f0` | fix(simulador): foco encoge el canvas SIN crecer los pitos + botón ancla al canvas |
| `564b940` | fix(simulador): foco con animación de lujo + botón no dispara pitos detrás + barra cabe completa |
| `3414e95` | feat(simulador): galería de modelos visuales del acordeón con 3 temas |

---

## Pendiente / Fases siguientes

### F2 — Editor de colores en vivo
- Tab "Crear" en la galería con 3 color pickers (cuerpo / botones / fuelle)
- Preview en vivo usando `mix-blend-mode: multiply` sobre imágenes grayscale
- Guardar tema personalizado en `temas_acordeon_usuario` (Supabase) o
  localStorage
- **Terreno listo**: campo `colores?` en `TemaAcordeon`, placeholder
  vacío en tab "Personalizados"

### F3 — Premium gating de modelos
- Marcar modelos `premiumOnly: true` (ej. variantes especiales)
- Click en bloqueado → no aplica el tema, redirige a `/paquetes`
- Badge "PLUS" ya implementado, callback `onIntentoPremium` listo

### F4 — Marca de agua
- Logo "Pro MAX" sutil en el cuerpo o fuelle del acordeón
- Overlay con `position: absolute; pointer-events: none`
- Visible en todos los temas (no removible) → branding consistente

### Otros pendientes que arrastra de sesiones anteriores
1. **Punch-in con timeline visual** para re-grabar secciones específicas
   (`mezclarPunchIn` ya existe en el servicio)
2. **EQ 5 bandas reales** (hoy mapea a 3 internas)
3. **Sample preview por tonalidad** (hoy IDs hardcoded)
4. **Práctica Libre — previews completos en su sidebar**
5. **Liberar el botón de acordeón en clases al resto de roles**
6. **Sincronía MP3↔notas** — ver
   [`Problema sincronizacion.md`](../../../Problema%20sincronizacion.md)
7. **PWA real**: manifest.json + service worker para offline + splash
   screen al abrir desde icon
8. **Detectar actividad real en Modo Foco**: si toca pitos durante los
   60s, reiniciar el timer (uso ilimitado de facto para los que practican)

---

## Cómo retomar

1. **Levantar dev**: `npm run dev`
2. **Login como admin** o forzar localmente:
   ```js
   const u = JSON.parse(localStorage.getItem('usuario_actual'));
   u.rol = 'admin'; localStorage.setItem('usuario_actual', JSON.stringify(u));
   location.reload();
   ```
3. **Ir a** `/simulador-app`
4. **Probar flujos clave**:
   - Modo foco (botón cyan FOCO arriba izquierda) → la barra desaparece
     suavemente, el acordeón se queda igual
   - Galería de acordeones (menú ⋮ → "Galería de Acordeones") → cambiar
     entre los 3 modelos
   - Banner Hero rotando cada 5s con 5-6 mensajes (depende si es
     mobile/PWA)
   - Modal admin de grabación al detener REC con opción "Canción para
     alumnos" + subir MP3
   - Panel FX con eco/distorsión funcionales y 22+18 presets

---

## Notas para el lanzamiento

Cosas que se conversaron al final de la sesión y quedan como referencia:

### PWA vs App nativa
**Ventajas de PWA** (lo que tienen):
- Cero comisión App Store/Play Store
- Update instantáneo (sin review de Apple)
- Acceso por link → entrar en 2s sin descarga
- SEO orgánico (Google indexa)
- Funciona en cualquier dispositivo

**Lo que falta para PWA "tipo nativa"**:
- Banner "Agregar a pantalla" (ya está en mensaje #6 del banner Hero)
- Splash screen al abrir desde icon (manifest.json a refinar)
- Service Worker para offline (cachear samples del acordeón)

### Checklist mínimo para lanzamiento
- [ ] Probar TODO en mobile real (no solo desktop)
- [ ] Verificar pagos end-to-end con tarjeta de prueba
- [ ] Configurar Plausible / Google Analytics para medir conversión
- [ ] Llenar `canciones_hero` con 10-20 canciones vallenatas reales
  (ahora el admin puede grabar desde mobile)
- [ ] Tomar 1 video de 30s del simulador en acción para redes

### Personalización premium de acordeones
- Tabla `temas_acordeon` (Supabase) o localStorage
- Marca de agua sutil para no perder branding
- Versión free inicial (1-2 temas) + premium

### Contenido que vende
- Antes/después del alumno (1 mes / 3 meses)
- Riffs conocidos en el simulador → transición a "sin instrumento"
- Tutoriales de 60s
- Lives + clips virales
- Retos/challenges con etiqueta y premio (mes Plus gratis)
