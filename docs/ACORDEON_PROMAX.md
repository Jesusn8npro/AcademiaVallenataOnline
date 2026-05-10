# Acordeón Pro Max — Documentación técnica

> **Fecha de consolidación:** 2026-05-10
> **Fuentes consolidadas:**
> - `docs/AcordeonProMax/ACORDEON_HERO.md`
> - `docs/AcordeonProMax/MODO_PRACTICA.md`
> - `docs/AcordeonProMax/AcordeonProMax_plan.md`
> - `docs/AcordeonProMax/sistema_puntuacion_xp_monedas.md`
> - `docs/AcordeonProMax/plan_practicalibre.md`
> - `docs/AcordeonProMax/Admin_ESTRUCTURA_ESTILOS.md`
> - `docs/AcordeonProMax/Admin_GUIA_INTEGRACION_REPRODUCTOR.md`
> - `src/Paginas/AcordeonProMax/SESION_2026-04-27.md`
> - 11 READMEs en `src/Paginas/AcordeonProMax/**/`
> - `MDS/Acordeon3d/ACORDEOON30_blender.md`
> - `MDS/Acordeon3d/PLAN_TECNICO_INTEGRACION.md`
> - `MDS/Acordeon3d/Archivo_En_drive.md`
> - `MDS/Acordeon3d/SKILL_3daistudio.md`
> - `MDS/Acordeon3d/frelancer.md`

---

## 1. Visión general

Acordeón Pro Max es la suite avanzada del simulador. Engloba:

- **AcordeonHero / Juego** — Guitar Hero del acordeón vallenato.
- **Práctica Libre estudiante** — estudio personalizado con preferencias persistidas.
- **EstudioAdmin** — grabador de canciones para el catálogo `canciones_hero`.
- **Sistema XP + Monedas + Validaciones** — gamificación profunda.

### Estructura de carpetas
```
src/Paginas/AcordeonProMax/
├── HomeProMax.tsx                      ← entry, redirige a /acordeon-pro-max/acordeon
├── AcordeonProMaxSimulador.tsx         ← simulador shared (carga canción + delega al modo)
├── Modos/
│   ├── ModoPracticaLibre.tsx           ← shell que renderiza EstudioPracticaLibre
│   └── ModoLibre.tsx                   ← modo libre con canción/pista
├── Componentes/
│   ├── PantallaPreJuegoProMax.tsx
│   └── PantallaResultados.tsx
├── Hooks/
│   ├── useLogicaProMax.ts              ← orquesta partidas (iniciar, detectar abandono, gameOver)
│   ├── useGrabacionProMax.ts           ← graba con snapshot del estudio
│   └── _tiposGrabacionProMax.ts        ← incluye 'cancion_hero' para admin
├── Pantallas/                          ← pantallas full-screen
├── PracticaLibre/                      ← submódulo (ver sección 4)
└── Admin/                              ← submódulo (ver sección 5)
```

---

## 2. Acordeón Hero (Juego)

Carpeta canónica: `src/Paginas/SimuladorDeAcordeon/` y la versión nueva mobile `src/Paginas/SimuladorApp/Juego/`.

### Modos de juego
Tipo `ModoPractica = 'ninguno' | 'libre' | 'synthesia' | 'maestro_solo'`. Detalles en [`SIMULADOR.md`](./SIMULADOR.md) sección 5.

### Layout dual (Maestro + Alumno)
- Izquierda: Maestro (toca solo, `AcordeonJugador.png`).
- Derecha: Alumno (responde con teclado, `AcordeonPROMAX.png`).
- SVG puente de notas (overlay fixed) con curvas bezier conectando ambos.
- HUD superior: vida, combo, puntuación, BPM slider, toggle Maestro Suena.
- Beat indicator dots pulsando al BPM.

```tsx
const ajustesHero = React.useMemo(() => ({
  ...hero.logica.ajustes,
  tamano: 'min(74vh, 37vw)',
  x: '50%',  // override de posición guardada del usuario
  y: '50%',  // evita acordeón desplazado
}), [hero.logica.ajustes]);
```

### Pantalla de selección y configuración
- `PantallaSeleccion` lista canciones de `canciones_hero`.
- `PantallaConfiguracion` permite elegir modo (4 cards), velocidad (40-120% BPM), toggle Maestro Suena.
- Botón flotante "🎹 Práctica Libre" abajo accede al modo sin canción.

### Pantalla resultados
- Estrellas 1–3 según precisión.
- Inserta en `scores_hero` (el frontend hace el INSERT, los triggers calculan XP/monedas).
- Lee de vuelta el score para mostrar XP real ganado y `xp_acumulado_cancion`.

### Práctica Libre desde Acordeón Hero (estado `'practica_libre'`)
Acceso directo desde la pantalla de selección. Sin canción ni motor de scoring.
- Toggle Brillante / Armonizado.
- Grid de tonalidades: F-Bb-Eb · Gb-B-E · GCF · ADG_FLAT · ADG · BES · BEA · CFB · DGB · GDC · ELR · EAD.
- Modos de vista: Teclas / 123 / ♪ / ABC.
- Tecla `Q` invierte fuelle.

---

## 3. useLogicaProMax (orquestación)

Archivo: `src/Paginas/AcordeonProMax/Hooks/useLogicaProMax.ts`.

### Responsabilidades
- Inicia partida en `iniciarJuego()` (línea ~468).
- Cierra en pantalla de resultados (línea ~746) y gameOver (línea ~726).
- Detecta abandono con `beforeunload`.
- Reset estado en partidas repetidas.
- Calcula resultado del golpe (línea ~314): `Perfecto | Bien | Fallada` según ventana ms.

### Captura de notas para grabación
- Hoy solo escucha `onNotaPresionada` (línea ~155).
- **Pendiente**: pasar también `onNotaLiberada` para reconstruir duraciones limpias.

### Conexiones
| Evento | Llama |
|---|---|
| Iniciar reproducción competencia | `useGrabacionProMax.iniciarGrabacion()` |
| Terminar canción | `useGrabacionProMax.detenerGrabacion()` |
| GameOver | `useGrabacionProMax.detenerGrabacion()` |
| Botón Grabar Práctica Libre | `useGrabacionProMax.iniciarGrabacion()` |

### Snapshot de estudio en grabación
La grabación guarda metadata extendida:
```json
{
  "origen": "pro_max",
  "vista": "teclas",
  "timbre": "Brillante",
  "instrumento_id": "uuid",
  "modelo_visual_id": "modelo_1",
  "pista_id": "uuid",
  "capas_activas": ["bajo", "guacharaca"],
  "efectos": {
    "reverb": { "activo": true, "mezcla": 0.18 },
    "ecualizador": { "graves": 1, "medios": 0, "agudos": 2 }
  }
}
```

`ModalReplayGrabacionHero` recupera `instrumento`, `timbre` y `modelo_visual` desde metadata.

---

## 4. PracticaLibre (estudiante)

Submódulo dedicado: `src/Paginas/AcordeonProMax/PracticaLibre/`.

### Estructura
```
PracticaLibre/
├── EstudioPracticaLibre.tsx            ← shell principal
├── TiposPracticaLibre.ts
├── Componentes/
│   ├── BarraSuperiorPracticaLibre.tsx  ← Modelo / Tono / Timbre / Instrumento / Pistas / Teoría / FX / Grabar
│   ├── PanelLateralPracticaLibre.tsx   ← UN SOLO panel reutilizable, cambia tab
│   ├── SeccionPLSonido.tsx             ← tab sonido
│   ├── SeccionPLModelos.tsx            ← tab modelos visuales
│   ├── SeccionPLPistas.tsx             ← tab pistas
│   ├── SeccionPLTeoria.tsx             ← tab teoría (acordes mayores/menores)
│   ├── SeccionPLEfectos.tsx            ← tab FX
│   ├── ModalGuardarPracticaLibre.tsx
│   ├── PanelLateralEstudiante.tsx      ← usa PanelEfectosAudio compartido
│   └── ReproductorCancionHero.tsx      ← reproductor inline flotante (con bug sincronía)
├── Hooks/
│   └── useEstudioPracticaLibre.ts      ← persistencia preferencias por tonalidad
├── Datos/
│   └── modelosVisualesAcordeon.ts      ← /Modelo 1.png, /Modelo 2.png, /Modelo 3.png, /Acordeon PRO MAX.png, /Acordeon Jugador.png
└── Servicios/
    ├── servicioPracticaLibre.ts
    ├── servicioPreferenciasPracticaLibre.ts
    └── servicioPistasPracticaLibre.ts  ← intenta sim_pistas_practica_libre, fallback canciones_hero.audio_fondo_url
```

### Separación de conceptos (crítica)
- **modelo visual** = imagen del acordeón (`/Modelo 1.png`)
- **instrumento** = banco/sonido del acordeón
- **timbre** = brillante o armonizado
- **pista** = acompañamiento completo (paseo vallenato, son, etc.)
- **capas de pista** = guacharaca, caja, bajo, piano, conga (futuro)
- **efectos** = reverb, ecualizador

### Flujo funcional
1. Usuario entra → carga preferencias guardadas.
2. Ve acordeón con último modelo visual.
3. Desde barra superior abre `PanelLateralPracticaLibre`.
4. Cambia tono / timbre / instrumento / modelo / pista / teoría / efectos.
5. Si graba → snapshot completo (sección 3).
6. Al volver, todo aparece igual.

### Persistencia
Tabla `sim_ajustes_usuario` agregada columna `preferencias_practica_libre` jsonb:
```json
{
  "modelo_visual_id": "modelo_1",
  "instrumento_id": "uuid",
  "timbre": "Brillante",
  "tonalidad": "ADG",
  "pista_id": "uuid_o_null",
  "capas_activas": ["bajo", "caja"],
  "efectos": {
    "reverb": { "activo": true, "mezcla": 0.18 },
    "ecualizador": { "graves": 0, "medios": 0, "agudos": 0 }
  }
}
```

### Servicios sugeridos (futuros)
- `servicioPracticaLibre.ts` — preferencias estudio.
- `servicioPistasPracticaLibre.ts` — pistas, capas, favoritos.
- `servicioAccesoProMax.ts` — decide si modelo/instrumento/pista es premium (consume sistema actual de membresías).

### Pendientes
- Conectar reverb/ecualizador al motor real de audio (hoy se guardan en metadata pero no se aplican).
- Crear tablas `sim_pistas_practica_libre` y `sim_pistas_practica_libre_capas` en Supabase.
- Premium gating limpio (no ensuciar `useLogicaAcordeon`).

### Estado del header
Cuando el estudiante está en Práctica Libre, el header global se oculta y solo se ven Vista, Ayuda y Volver. Metrónomo agregado para practicar solo con metrónomo grabado.

---

## 5. Admin / EstudioAdmin (grabador de canciones)

Carpeta: `src/Paginas/AcordeonProMax/Admin/`.

### Responsabilidad
Permite al admin grabar canciones que se inyectan en `canciones_hero` para que los estudiantes las jueguen.

### Componentes nuevos sesión 2026-04-27
- **`BarraTimelineProMax.tsx`** — reemplaza `BarraReproductorPracticaLibre` (eliminado) y `BarraTransporte` en contexto admin.
- **`PanelAdminRec.tsx`** — panel de grabación (REC, punch-in/out, BPM control).
- **`ReproductorRec.tsx`** + `ReproductorRec.css` — reproductor independiente y limpio (reemplazó al `BarraTransporte` con errores).
- **`PanelAdminLibreria.tsx`** — gestor de canciones grabadas.
- **`PanelAdminListaAcordes.tsx`** — selector de acordes mayor/menor (referencia teórica).
- **`PanelAdminGestorAcordes.tsx`**.

### `BarraTimelineProMax` features
| Feature | Detalle |
|---|---|
| Timeline visual | Bandas de color por sección, zona verde para extensión de notas |
| Seek bar | Input range invisible superpuesto al visual (drag) |
| Playhead cursor | Línea blanca brillante que sigue posición |
| Marcadores IN/OUT | Línea ámbar (IN) y roja (OUT) sobre la barra |
| Dropdown secciones | Botón muestra sección activa; click salta a esa sección |
| Transport | Reset, ⏪ 10s, Play/Pause, ⏩ 10s |
| Control BPM | +/- de 5, slider 30–300, % vs BPM original, reset |
| Tiempo MP3 | Solo si `duracionAudio > 0`: `🎵 actual/total` |

### Arquitectura Portal — Modal proyecta transport al footer
El modal editor tiene su propio motor (RAF + audio element propio). El transport se renderiza **dentro del árbol del modal** pero se proyecta físicamente al footer con `ReactDOM.createPortal`. El slot vivirá donde antes estaba el reproductor:

```tsx
{rec.cancionEnModalEditor && (
  <div id="barra-timeline-slot" className="estudio-practica-libre-transport-fixed" />
)}
```

### Dos modos de sincronización del slider
- **Modal (sliderRef pasado):** el RAF interno del modal actualiza `sliderRef.current.value` directamente (muy performante).
- **Hero (sin sliderRef):** `useEffect` sobre `tickLocal` actualiza el value cuando la prop cambia.

### Bug fix sesión 2026-04-27 — Audio silencioso en "Revisando"
Archivo `tiposEditor.ts:125`. El 6º arg de `actualizarBotonActivo` estaba en `true` (silencioso). Notas iluminaban pero no sonaban.
```ts
// Después
idsNuevos.forEach(id => {
  if (!notasAnteriores.has(id))
    logica.actualizarBotonActivo(id, 'add', null, false, undefined, false);
});
```

### Estilos por convención
| Componente | CSS | Prefijo de clase |
|---|---|---|
| `EstudioPracticaLibre.tsx` | `EstudioPracticaLibre.css` | `.estudio-practica-libre-*` |
| `PanelAdminRec.tsx` | `AdminRec.css` | `.admin-rec-*` |
| `ReproductorRec.tsx` | `ReproductorRec.css` | `.reproductor-rec-*` |

Importar siempre el `.css` al lado del `.tsx`. Si los botones se ven sin estilos, verificar imports en DevTools.

### Paleta admin
- Primario `#3b82f6` azul, Secundario `#8b5cf6` púrpura.
- Éxito `#10b981`, Peligro `#ef4444`, Advertencia `#fbbf24`.
- Fondos: `rgba(15, 23, 42, 0.95)` / `rgba(30, 41, 59, 0.9)`.

---

## 6. Sistema de XP y Monedas

> **Filosofía:**
> - **XP = el ego del usuario.** Un solo número global.
> - **Monedas = dinero virtual.** 1 moneda = $100 COP.
> - **Regla de oro:** monedas solo por calidad, no por cantidad. El sistema obliga a ser perfeccionista.

### Tablas de Supabase

#### `scores_hero`
Resultado de cada partida. Frontend solo hace INSERT; los triggers calculan todo.
- `usuario_id`, `cancion_id`, `puntuacion`, `precision_porcentaje`, `notas_totales`, `notas_correctas`, `notas_falladas`, `notas_perdidas`
- `racha_maxima`, `multiplicador_maximo`, `modo` (`competencia|libre|synthesia`), `tonalidad`, `duracion_ms`
- `es_mejor_personal`, `xp_ganado` (corregido por trigger), `xp_acumulado_cancion`
- `abandono`, `porcentaje_completado`, `grabacion_id` (FK opcional)
- Índices: `(usuario_id, cancion_id)`, `(cancion_id, puntuacion DESC)` para ranking.

#### `xp_transacciones`
Historial de cada XP ganado/perdido.
- Tipos válidos: `cancion_completada`, `leccion_completada`, `tutorial_completado`, `comentario`, `publicacion`, `like_recibido`, `racha_diaria`, `logro`.

#### `xp_cancion_usuario` (PK `(usuario_id, cancion_id)`)
- `xp_acumulado` con techo **+100** y piso **−50**.

#### `monedas_usuario`
- `saldo` (mínimo 0), `total_ganadas`, `total_gastadas`.

#### `monedas_transacciones`
- Tipos: `ganada`, `gastada`, `penalizacion`.
- Conceptos: `precision_primer_intento`, `precision_multiples_intentos`, `cancion_dominada`, `compartir_grabacion`, `publicacion_eliminada`, `like_recibido`, `tutorial_completado`, `tutorial_validado_profesor`, `racha_semanal`, `ranking_top`, `compra_tutorial`, `compra_cancion`, `compra_skin`.

#### `monedas_cancion_usuario`
- Techo **10 monedas** por canción.
- `cancion_dominada` boolean.

#### `validaciones_tutorial`
Sistema de aprobación de videos físicos del alumno por el profesor.
- `estado`: `pendiente`, `aprobado`, `rechazado`.
- `monedas_fase1` (5 al subir video), `monedas_fase2` (5 al aprobar).

### Reglas de XP por ejecución

| Precisión | XP |
|---|---|
| 100% | +100 (techo) |
| 90–99% | +50 |
| 70–89% | +20 |
| 50–69% | +5 |
| 30–49% | −5 |
| <30% | −15 |
| Abandona +70% canción | 0 |
| Abandona −70% canción | −10 |

**Techo +100** y **piso −50** por canción. Una vez al techo, no suma más aunque se juegue mil veces.

### XP por otras actividades
| Actividad | XP | Cap diario |
|---|---|---|
| Lección completada | +50 | 5/día |
| Tutorial completado | +150 | 3/día |
| Comentario comunidad | +5 | 10/día |
| Publicación comunidad | +10 | 3/día |
| Like recibido | +2 | 50/día |

### Niveles
1000 XP = 1 nivel. Notificación automática al subir.

### Reglas de monedas

| Acción | Monedas | Condición |
|---|---|---|
| Precisión 95%+ primer intento | +4 | Max 1/canción/día |
| Precisión 95%+ múltiples intentos | +2 | Max 1/canción/día |
| Dominar canción (100 XP) | +10 | 1 vez en la vida por canción |
| Compartir grabación | +2 | Por grabación publicada |
| Like recibido | +0.1 | Sin límite |
| Subir video validación | +5 | Fase 1 automático |
| Profesor aprueba | +5 | Fase 2 |
| Curso completo | +80 | 1 vez por curso |
| Racha 7 días | +15 | Semanal |
| Top 1 ranking semanal | +50 | Semanal |
| Top 2-3 ranking semanal | +20 | Semanal |
| Eliminar publicación | −2 | — |

**Saldo mínimo: 0.** Equivalencia: 1 moneda = $100 COP. Tutorial $40,000 = 400 monedas.

### Estimación: 400 monedas en 2-3 meses
```
Dominar 10 canciones (×10)            → 100
20 días con 95%+ (×2)                 → 40
Completar 5 tutoriales validados (×10)→ 50
Compartir 20 grabaciones (×2)         → 40
Racha 4 semanas (×15)                 → 60
Top 3 ranking ×2 semanas (×20)        → 40
~700 likes recibidos (×0.1)           → 70
                                      = 400 monedas
```

### Triggers automáticos
| Trigger | Tabla | Acción |
|---|---|---|
| `after_score_hero_insert` | `scores_hero` | Calcula XP, respeta techo/piso, actualiza global, monedas si 95%+, ascenso de nivel, estadísticas |
| `after_leccion_completada` | `progreso_lecciones` | +50 XP cursos + notificación |
| `after_tutorial_completado` | `progreso_tutorial` | +150 XP cursos + notificación |
| `after_comentario_comunidad` | `comunidad_comentarios` | +5 XP (cap 10/día) |
| `after_publicacion_comunidad` | `comunidad_publicaciones` | +10 XP (cap 3/día) |
| `after_like_publicacion` | `comunidad_publicaciones_likes` | +2 XP autor (cap 50/día) |
| `after_like_monedas` | `comunidad_publicaciones_likes` | +0.1 monedas autor |
| `after_grabacion_compartida` | `grabaciones_estudiantes_hero` | UPDATE: +2 al publicar, −2 al eliminar |
| `after_validacion_tutorial` | `validaciones_tutorial` | INSERT/UPDATE: +5 fase 1, +5 fase 2 + notif |

### Funciones centrales
- `sumar_xp_usuario(usuario_id, xp, tipo, ref_id, ref_tipo)`
- `mover_monedas(usuario_id, cantidad, tipo, concepto, ref_id, ref_tipo)` (respeta piso 0)

### Reglas anti-farmeo
- XP por canción cap 100.
- Monedas por canción 1 vez/día con 95%+.
- Penalización por abandono <70% (−10 XP).
- Penalización por mala ejecución (−5 a −15).
- Cap diario de comentarios, publicaciones, likes.

### Componentes frontend
| Componente | Archivo | Función |
|---|---|---|
| `PantallaResultados` | `Componentes/` | XP ganado, barra canción, monedas |
| `ModalHistorialHero` | recharts + tabla | Gráfica de partidas |
| `ExperienciaPerfil` | Widget perfil | XP total, niveles, 4 categorías |
| `MonedasPerfil` | Widget perfil | Saldo, historial, COP |
| `MisValidaciones` | Alumno sube videos | — |
| `ValidacionesAdmin` | Profesor aprueba/rechaza | — |
| `scoresHeroService.ts` | Servicio | INSERT scores_hero, historial, XP |

### Pendientes
- Pantalla resultados muestra XP calculado en frontend, no lee valor real del trigger después del INSERT.
- Algunos modales se salen de pantalla en resoluciones pequeñas.
- Desincronización al reiniciar partida sin recargar.

---

## 7. Acordeón 3D (Three.js / R3F) — Plan técnico

### Carpetas
- `src/Paginas/Ejemplos3d1/` — pruebas iniciales (R3F + Rapier + MeshLine).
- `Pruebas3D/AcordeonDiapason3D/` — modelo final integrado.
- Ruta: `/acordeon-3d-test`.

### Flujo de datos en tiempo real

| Evento | Componente 3D | Animación |
|---|---|---|
| `Nota ON` | Mesh del botón | Traslación eje local (presión) |
| `Nota OFF` | Mesh del botón | Retorno posición original |
| `Fuelle Abrir` | Bones del fuelle | Armature Action |
| `Fuelle Cerrar` | Bones del fuelle | Armature Action |
| `Cambio Tonalidad` | Material body | Cambio textura/color (PBR) |
| `Digitación Avatar` | Armature personaje | Pose / clip animación |

### Entregables 3D (freelancer Blender)
- **Formato:** `.blend` (fuente) + `.glb` (Draco compressed).
- **Optimización:** ≤120k polígonos (acordeón + avatar). Texturas PBR 2K.
- **Naming convention:**
  - Botones pitos: `Btn_Row1_01`...`Btn_Row3_10`
  - Botones bajos: `Bass_1`...`Bass_12`
  - Cuerpo: `Body_Left`, `Body_Right`, `Bellows_Mesh`
  - Armature: `Accordion_Rig`
- **Animaciones:** `Bellows_Open` (loopable), `Bellows_Close` (loopable), 3 variaciones `Idle_Play`.
- **Avatar:** rig completo con dedos independientes.
- **Material swap:** `material_body`, `material_bellows`, `material_buttons`, `material_decorations` para personalización runtime.

### Implementación R3F
```tsx
const Model = () => {
  const { nodes, materials, animations } = useGLTF('/modelos/acordeon_vpro.glb');
  const { actions } = useAnimations(animations);
  const { botonesActivos } = useLogicaAcordeon();

  useEffect(() => {
    if (botonesActivos.includes('Btn_Row1_01')) {
      // mover mesh nodes.Btn_Row1_01
    }
  }, [botonesActivos]);
};
```

### Carga + optimización
- `useGLTF` de `@react-three/drei`.
- Fuelle como **bones** (no shape keys) con weight painting suave.
- `instancedMesh` posible para 31 + 12 botones (preferible meshes individuales para naming claro).
- Compresión `gltf-pipeline` con Draco.
- Validar en [gltf.report](https://gltf.report/).

### Servicios MCP / IA usados
- **3D AI Studio API** (skill instalado): generación de miniatures + 3D generic.
  - `python scripts/3d_api_client.py start-miniature --description "..." --style realistic --output-format gltf`
  - Auth: Bearer token desde `.env` (`3D_AI_STUDIO_API_KEY`).
- **Blender MCP oficial** (Blender 5.1+) para automatizaciones: limpieza de escenas, geometry nodes, baking de normal/AO maps, generación de LODs.
- **Claude Desktop / Code** con conector Blender oficial.

### Convocatoria 3D (referencia)
- Presupuesto $100-150 USD (negociable).
- Bonus: experiencia previa con React Three Fiber.
- Referencias: modelo Corona III, acabados nacarados, rejilla metálica detallada, correas de cuero.
- Avatar estilizado/carismático, debe sostener acordeón ergonómico.

---

## 8. Pendientes generales Pro Max

### Críticos
- ❌ **Sincronía notas↔MP3** en `ReproductorCancionHero` y `EstudioAdmin`. Ver [`SIMULADOR.md`](./SIMULADOR.md) sección 9.

### Mejoras
1. Pasar `onNotaLiberada` a `useLogicaProMax` para reconstruir duraciones limpias en grabación.
2. Conectar reverb/ecualizador al motor real (hoy en metadata pero sin efecto).
3. Crear tablas Supabase `sim_pistas_practica_libre` + `sim_pistas_practica_libre_capas`.
4. Membresías + bloqueos de modelos/instrumentos/pistas premium.
5. Modal de admin "Guardar como Mi Grabación / Canción para Alumnos" — corregir incompatibilidad firma posicional vs objeto en `onGuardarPersonal`.
6. F2 Editor de colores en vivo en GaleriaAcordeones.
7. F3 Premium gating de modelos visuales.
8. F4 Marca de agua en cuerpo del acordeón.
9. Punch-in/out con timeline visual para re-grabar secciones (`mezclarPunchIn` ya existe en servicio).
10. Liberar acordeón embebido en clases al resto de roles cuando termine prueba admin.

### Próximas fases (PracticaLibre)
- F1 ✅ Estudio reorganizado.
- F2 ✅ Conectar sonido real (tonalidad, timbre, instrumento, persistencia).
- F3 ✅ Modelos visuales del acordeón.
- F4 🟡 Pistas completas desde Supabase (catálogo + capas).
- F5 ✅ Snapshot completo en grabaciones + replay.
- F6 ❌ Capas por instrumento dentro de pistas.
- F7 ❌ Premium y bloqueos.
- F8 ❌ Efectos avanzados de reverb/ecualizador funcionando.
