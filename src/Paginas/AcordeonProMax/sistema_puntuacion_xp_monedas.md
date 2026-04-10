# Sistema de Puntuación, XP y Monedas
## Academia Vallenata Online — Acordeón Pro Max

> **Proyecto:** Academia Vallenata Online  
> **Supabase ID:** `tbijzvtyyewhtwgakgka`  
> **Stack:** React + TypeScript + Vite + Supabase  
> **Última actualización:** Abril 2026

---

## 1. Filosofía del Sistema

**XP = El ego del usuario.** Un solo número global que sube y baja según sus ejecuciones. Mide qué tan bueno es como músico.

**Monedas = Dinero virtual.** 1 moneda = $100 pesos colombianos. Se ganan siendo perfeccionista y se pueden gastar en tutoriales, canciones y accesorios de la plataforma.

**Regla de oro:** Las monedas solo se ganan por calidad, no por cantidad. El sistema obliga al estudiante a ser perfeccionista.

---

## 2. Tablas Creadas en Supabase

### `scores_hero`
Guarda el resultado de cada partida del juego.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `usuario_id` | UUID | Referencia a perfiles |
| `cancion_id` | UUID | Referencia a canciones_hero |
| `puntuacion` | INTEGER | Puntos obtenidos en la partida |
| `precision_porcentaje` | DECIMAL | % de precisión (0-100) |
| `notas_totales` | INTEGER | Total de notas en la canción |
| `notas_correctas` | INTEGER | Notas tocadas correctamente |
| `notas_falladas` | INTEGER | Notas falladas |
| `notas_perdidas` | INTEGER | Notas perdidas |
| `racha_maxima` | INTEGER | Racha máxima de notas perfectas |
| `multiplicador_maximo` | INTEGER | Multiplicador máximo alcanzado |
| `modo` | TEXT | 'competencia', 'libre', 'synthesia' |
| `tonalidad` | TEXT | Tonalidad en que se jugó |
| `duracion_ms` | INTEGER | Duración de la partida en ms |
| `es_mejor_personal` | BOOLEAN | Si superó su récord personal |
| `xp_ganado` | INTEGER | XP real ganado/perdido (corregido por trigger) |
| `xp_acumulado_cancion` | INTEGER | XP total acumulado en esa canción |
| `abandono` | BOOLEAN | Si el usuario abandonó antes de terminar |
| `porcentaje_completado` | DECIMAL | % de la canción que completó |
| `grabacion_id` | UUID | Referencia a grabacion completa (opcional) |
| `created_at` | TIMESTAMPTZ | Fecha de la partida |

**Índices:**
```sql
idx_scores_usuario_cancion ON scores_hero(usuario_id, cancion_id)
idx_scores_ranking ON scores_hero(cancion_id, puntuacion DESC)
```

---

### `xp_transacciones`
Historial completo de cada XP ganado o perdido.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `usuario_id` | UUID | Referencia a perfiles |
| `xp_ganado` | INTEGER | Cantidad (negativo si perdió) |
| `tipo` | TEXT | Tipo de evento |
| `referencia_id` | UUID | ID del elemento relacionado |
| `referencia_tipo` | TEXT | 'cancion', 'leccion', 'tutorial' |
| `fecha` | DATE | Fecha del evento |
| `created_at` | TIMESTAMPTZ | Timestamp exacto |

**Tipos válidos:** `cancion_completada`, `leccion_completada`, `tutorial_completado`, `comentario`, `publicacion`, `like_recibido`, `racha_diaria`, `logro`

---

### `xp_cancion_usuario`
Trackea el XP acumulado de cada usuario en cada canción específica.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `usuario_id` | UUID | Referencia a perfiles |
| `cancion_id` | UUID | Referencia a canciones_hero |
| `xp_acumulado` | INTEGER | XP total acumulado (techo 100, piso -50) |
| `updated_at` | TIMESTAMPTZ | Última actualización |

**Primary Key:** `(usuario_id, cancion_id)`

---

### `monedas_usuario`
Saldo actual de monedas por usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `usuario_id` | UUID | Primary key, referencia a perfiles |
| `saldo` | DECIMAL(10,1) | Saldo actual (mínimo 0) |
| `total_ganadas` | DECIMAL(10,1) | Total histórico ganado |
| `total_gastadas` | DECIMAL(10,1) | Total histórico gastado |
| `updated_at` | TIMESTAMPTZ | Última actualización |

---

### `monedas_transacciones`
Historial de cada movimiento de monedas.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `usuario_id` | UUID | Referencia a perfiles |
| `cantidad` | DECIMAL(10,1) | Cantidad (negativo si perdió) |
| `tipo` | TEXT | 'ganada', 'gastada', 'penalizacion' |
| `concepto` | TEXT | Razón del movimiento |
| `referencia_id` | UUID | ID del elemento relacionado |
| `referencia_tipo` | TEXT | Tipo del elemento |
| `created_at` | TIMESTAMPTZ | Timestamp exacto |

**Conceptos válidos:** `precision_primer_intento`, `precision_multiples_intentos`, `cancion_dominada`, `compartir_grabacion`, `publicacion_eliminada`, `like_recibido`, `tutorial_completado`, `tutorial_validado_profesor`, `racha_semanal`, `ranking_top`, `compra_tutorial`, `compra_cancion`, `compra_skin`

---

### `monedas_cancion_usuario`
Techo de monedas por canción por usuario.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `usuario_id` | UUID | Referencia a perfiles |
| `cancion_id` | UUID | Referencia a canciones_hero |
| `monedas_acumuladas` | DECIMAL(10,1) | Monedas ganadas en esta canción |
| `cancion_dominada` | BOOLEAN | Si llegó al techo de XP |
| `updated_at` | TIMESTAMPTZ | Última actualización |

**Techo por canción: 10 monedas**

---

### `validaciones_tutorial`
Sistema de validación de ejecuciones físicas por profesor.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `usuario_id` | UUID | Alumno que subió el video |
| `tutorial_id` | UUID | Tutorial que está completando |
| `video_url` | TEXT | URL de YouTube o Google Drive |
| `estado` | TEXT | 'pendiente', 'aprobado', 'rechazado' |
| `monedas_fase1` | DECIMAL | Monedas por subir el video (5) |
| `monedas_fase2` | DECIMAL | Monedas por aprobación del profesor (5) |
| `fase1_otorgada` | BOOLEAN | Si ya se otorgaron las monedas fase 1 |
| `fase2_otorgada` | BOOLEAN | Si ya se otorgaron las monedas fase 2 |
| `comentario_profesor` | TEXT | Feedback del profesor |
| `profesor_id` | UUID | Profesor que evaluó |
| `created_at` | TIMESTAMPTZ | Fecha de envío |
| `updated_at` | TIMESTAMPTZ | Última actualización |

---

## 3. Reglas de XP

### Por ejecución en el juego

| Precisión | XP que gana/pierde | Notas |
|-----------|-------------------|-------|
| **100% exacto** | +100 XP | Llega al techo de una sola partida |
| **90 - 99%** | +50 XP | Excelente ejecución |
| **70 - 89%** | +20 XP | Buena ejecución |
| **50 - 69%** | +5 XP | Ejecución regular |
| **30 - 49%** | -5 XP | Penalización leve |
| **Menos del 30%** | -15 XP | Penalización fuerte |
| **Abandona +70% canción** | 0 XP | No penaliza si completó más del 70% |
| **Abandona -70% canción** | -10 XP | Penalización por abandonar temprano |

### Techo y piso por canción

```
Techo máximo: 100 XP por canción
Piso mínimo: -50 XP por canción
```

Una vez llegado al techo (100 XP), esa canción no suma más XP aunque se juegue mil veces. El alumno debe explorar canciones nuevas para seguir acumulando.

### Por otras actividades

| Actividad | XP | Cap diario |
|-----------|-----|-----------|
| Completar lección | +50 XP | 5 lecciones/día |
| Completar tutorial | +150 XP | 3 tutoriales/día |
| Comentar en comunidad | +5 XP | 10 comentarios/día |
| Publicar en comunidad | +10 XP | 3 publicaciones/día |
| Recibir like | +2 XP | 50 likes/día |

### Niveles de XP

Cada 1000 XP = 1 nivel. Al subir de nivel se manda notificación automática.

| Nivel | XP requerido |
|-------|-------------|
| 1 | 0 XP |
| 2 | 1,000 XP |
| 3 | 2,000 XP |
| 4 | 3,000 XP |
| 5 | 4,000 XP |
| ... | +1,000 por nivel |

---

## 4. Reglas de Monedas

### Cómo se ganan

| Acción | Monedas | Condición |
|--------|---------|-----------|
| Precisión 95%+ — primer intento | **+4 monedas** | Max 1 vez por canción por día |
| Precisión 95%+ — múltiples intentos | **+2 monedas** | Max 1 vez por canción por día |
| Dominar canción (llegar a 100 XP) | **+10 monedas** | Solo 1 vez por canción para siempre |
| Compartir grabación en comunidad | **+2 monedas** | Por grabación publicada |
| Recibir like en publicación | **+0.1 monedas** | Sin límite |
| Subir video de validación tutorial | **+5 monedas** | Fase 1 — automático |
| Profesor aprueba validación | **+5 monedas** | Fase 2 — requiere aprobación |
| Completar curso completo | **+80 monedas** | Solo 1 vez por curso |
| Racha 7 días consecutivos | **+15 monedas** | Semanal |
| Top 1 ranking semanal | **+50 monedas** | Semanal |
| Top 2-3 ranking semanal | **+20 monedas** | Semanal |

### Cómo se pierden

| Acción | Monedas |
|--------|---------|
| Eliminar publicación compartida | -2 monedas |

**Saldo mínimo global: 0** (nunca queda negativo)

### Equivalencia en pesos

```
1 moneda = $100 pesos colombianos
10 monedas = $1,000 COP
100 monedas = $10,000 COP
400 monedas = $40,000 COP (un tutorial individual)
```

### Precios en la tienda

| Producto | Monedas | Precio COP |
|----------|---------|-----------|
| Tutorial $15,000 | 150 monedas | $15,000 |
| Tutorial $30,000 | 300 monedas | $30,000 |
| Tutorial $40,000 | 400 monedas | $40,000 |
| Pack canciones Hero | 200 monedas | $20,000 |
| Skin acordeón visual | 100 monedas | $10,000 |
| 1 mes Plan Simulador | 250 monedas | $25,000 |

### Cuánto tarda un estudiante dedicado en ganar 400 monedas

```
Dominar 10 canciones nuevas (x10 monedas)  → 100 monedas
20 días con precisión 95%+ (x2 monedas)    → 40 monedas
Completar 5 tutoriales validados (x10)     → 50 monedas
Compartir 20 grabaciones (x2)              → 40 monedas
Racha 4 semanas (x15)                      → 60 monedas
Top 3 ranking x2 semanas (x20)             → 40 monedas
Likes recibidos (~700 likes x0.1)          → 70 monedas
─────────────────────────────────────────────────────
Total estimado                             → 400 monedas
Tiempo estimado                            → 2-3 meses
```

---

## 5. Triggers Automáticos en Supabase

Todos los cálculos ocurren automáticamente en Supabase. El frontend **solo hace el INSERT** en `scores_hero` y los triggers hacen todo lo demás.

### `after_score_hero_insert` — El trigger principal
**Tabla:** `scores_hero` | **Evento:** INSERT

Hace todo al terminar una partida:
1. Lee XP actual de `xp_cancion_usuario`
2. Calcula delta XP según precisión
3. Respeta techo (100) y piso (-50)
4. Actualiza `xp_cancion_usuario`
5. Actualiza XP global en `experiencia_usuario` y `perfiles`
6. Verifica si subió de nivel → notificación
7. Da monedas si precisión >= 95% en competencia
8. Da 10 monedas si dominó la canción por primera vez
9. Actualiza `scores_hero` con valores reales
10. Actualiza `estadisticas_usuario`

### `after_leccion_completada`
**Tabla:** `progreso_lecciones` | **Evento:** INSERT/UPDATE

Al cambiar estado a 'completada' → +50 XP cursos + notificación

### `after_tutorial_completado`
**Tabla:** `progreso_tutorial` | **Evento:** INSERT/UPDATE

Al cambiar `completado` a true → +150 XP cursos + notificación

### `after_comentario_comunidad`
**Tabla:** `comunidad_comentarios` | **Evento:** INSERT

Al comentar → +5 XP comunidad (cap 10/día)

### `after_publicacion_comunidad`
**Tabla:** `comunidad_publicaciones` | **Evento:** INSERT

Al publicar → +10 XP comunidad (cap 3/día)

### `after_like_publicacion`
**Tabla:** `comunidad_publicaciones_likes` | **Evento:** INSERT

Al recibir like → +2 XP comunidad al autor (cap 50/día)

### `after_like_monedas`
**Tabla:** `comunidad_publicaciones_likes` | **Evento:** INSERT

Al recibir like → +0.1 monedas al autor

### `after_grabacion_compartida`
**Tabla:** `grabaciones_estudiantes_hero` | **Evento:** UPDATE

Al publicar grabación → +2 monedas
Al eliminar publicación → -2 monedas

### `after_validacion_tutorial`
**Tabla:** `validaciones_tutorial` | **Evento:** INSERT/UPDATE

Al subir video → +5 monedas fase 1
Al aprobar profesor → +5 monedas fase 2 + notificación al alumno

---

## 6. Funciones de Supabase

### `sumar_xp_usuario(usuario_id, xp, tipo, referencia_id, referencia_tipo)`
Función central que suma XP a un usuario. Actualiza `xp_transacciones`, `experiencia_usuario`, `perfiles` y verifica cambio de nivel.

### `mover_monedas(usuario_id, cantidad, tipo, concepto, referencia_id, referencia_tipo)`
Función central que mueve monedas. Respeta el piso de 0, actualiza `monedas_usuario` y registra en `monedas_transacciones`.

---

## 7. Componentes Frontend Implementados

| Componente | Archivo | Descripción |
|-----------|---------|-------------|
| Servicio de scores | `scoresHeroService.ts` | INSERT en scores_hero, historial, XP |
| Pantalla resultados | `PantallaResultados.tsx` | Muestra XP, monedas, barra de canción |
| Modal historial | `ModalHistorialHero.tsx` | Gráfica recharts + tabla partidas |
| Widget XP perfil | `ExperienciaPerfil.tsx` | XP total, niveles, 4 categorías |
| Widget monedas | `MonedasPerfil.tsx` | Saldo, historial, equivalente COP |
| Mis validaciones | `MisValidaciones.tsx` | Alumno sube videos de ejecución |
| Panel profesor | `ValidacionesAdmin.tsx` | Aprobar/rechazar validaciones |
| Lógica juego | `useLogicaProMax.ts` | Detector abandono, reset estado |

---

## 8. Flujo Completo de una Partida

```
USUARIO TERMINA CANCIÓN
        │
        ▼
Frontend: INSERT en scores_hero
(xp_ganado = calculado según precisión)
        │
        ▼
Trigger after_score_hero_insert
        │
        ├── Calcula XP real respetando techo/piso
        ├── Actualiza xp_cancion_usuario
        ├── Actualiza experiencia_usuario + perfiles
        ├── ¿Subió de nivel? → notificación
        ├── ¿Precisión 95%+ competencia? → monedas
        ├── ¿Primera vez dominando canción? → +10 monedas
        ├── Actualiza scores_hero con valores reales
        └── Actualiza estadisticas_usuario
        │
        ▼
Frontend: SELECT scores_hero WHERE id = nuevo_id
(lee xp_ganado y xp_acumulado_cancion reales)
        │
        ▼
Frontend: Lee monedas_usuario para diferencia
        │
        ▼
PantallaResultados muestra:
- XP ganado/perdido con animación
- Barra de progreso canción X/100 XP
- Monedas ganadas en dorado
- Badge canción dominada si llegó a 100
```

---

## 9. Reglas Anti-Farmeo

Para evitar que los usuarios acumulen XP o monedas de forma abusiva:

- **XP por canción:** Techo de 100 XP — nunca suma más
- **Monedas por canción:** Solo 1 vez por día por canción con precisión 95%+
- **Penalización por abandono:** -10 XP si abandona antes del 70%
- **Penalización por mala ejecución:** -5 a -15 XP según precisión
- **Cap diario comentarios:** Máximo 10 XP por comentarios/día
- **Cap diario publicaciones:** Máximo 3 publicaciones con XP/día
- **Likes con cap:** Máximo 50 likes con XP por día
- **Monedas por dominar canción:** Solo 1 vez en la vida por canción

---

## 10. Estado Actual del Sistema (Abril 2026)

### ✅ Funcionando
- INSERT en scores_hero guarda partidas correctamente
- Trigger calcula XP real y actualiza acumulado por canción
- Techo 100 XP y piso -50 XP funcionando
- Penalización por mala ejecución activa
- 100% de precisión da 100 XP de una sola partida
- Monedas por primer intento (+4) y múltiples intentos (+2)
- Monedas por dominar canción (+10 solo 1 vez)
- Historial con gráfica recharts funcionando
- Widget XP en perfil con Realtime
- Billetera con saldo y equivalente COP
- Panel de validaciones para profesor y alumno
- Detector de abandono con beforeunload

### ⚠️ Pendiente
- Pantalla resultados muestra XP calculado en frontend en vez de leer valor real del trigger después del INSERT
- Responsive global — algunos modales se salen de pantalla en resoluciones pequeñas
- Desincronización al reiniciar partida sin recargar página

---

*Documento generado para referencia técnica del sistema de puntuación de Academia Vallenata Online.*