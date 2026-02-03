# Documentación Técnica: Estadísticas de Acordeón

## Propósito
La tabla `estadisticas_acordeon` está diseñada para centralizar el rendimiento histórico de cada usuario dentro del simulador y el aprendizaje del instrumento. A diferencia de las "sesiones", que son registros puntuales, esta tabla mantiene los acumulados y récords personales.

## Estructura Actual (Supabase)

| Columna | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `uuid` | Identificador único de la estadística. |
| `usuario_id` | `uuid` | Relación con la tabla `perfiles`. |
| `total_sesiones` | `integer` | Número total de veces que el usuario ha usado el simulador. |
| `tiempo_total_minutos` | `integer` | Suma de todo el tiempo de práctica. |
| `precision_promedio` | `numeric` | Promedio general de aciertos en todas las sesiones. |
| `mejor_precision` | `numeric` | El récord (Highscore) de precisión del usuario. |
| `lecciones_completadas`| `integer` | Conteo de lecciones del curso aprobadas. |
| `canciones_dominadas` | `integer` | Conteo de canciones terminadas con alta precisión. |
| `desafios_completados` | `integer` | Contador de desafíos diarios superados. |
| `racha_actual_dias` | `integer` | Días consecutivos practicando (para retención). |
| `racha_maxima_dias` | `integer` | Récord histórico de días consecutivos. |
| `created_at` | `timestamp`| Fecha de creación del registro. |
| `updated_at` | `timestamp`| Última vez que se actualizaron los promedios. |

## Futura Implementación (Plan de Acción)
Para que esta tabla sea **totalmente funcional**, debemos implementar un `Trigger` o una `Edge Function` que se dispare cada vez que una fila se inserte en `sesiones_simulador_acordeon` (la nueva versión):

1.  **Actualización Automática**: El sistema debe sumar `duracion_minutos` al total.
2.  **Cálculo de Récords**: Si la precisión de la nueva sesión es mayor a `mejor_precision`, se actualiza.
3.  **Lógica de Racha**: Comparar `updated_at` con la fecha actual para incrementar o resetear la `racha_actual_dias`.

---

## Historial de Tablas Eliminadas (Respaldo para Futura Implementación)
*Estas tablas fueron eliminadas para limpiar el esquema, pero su estructura se documenta aquí para cuando se decida implementar el sistema de gamificación completo.*

### 💰 Monedas de Usuario (`monedas_usuario`)
Servía para el sistema de economía de la academia.
- `monedas_totales`, `monedas_gastadas`, `monedas_disponibles`.
- Desglose por origen: `monedas_logros`, `monedas_ranking`, `monedas_compradas`, `monedas_regaladas`.
- Seguimiento de transacciones: `transacciones_totales`, `ultima_ganancia`, `ultimo_gasto`.

### 🔔 Notificaciones Gaming (`notificaciones_gaming`)
Sistema de alertas dinámicas para feedback inmediato.
- `tipo`, `titulo`, `mensaje`, `icono`.
- `datos_notificacion` (JSONB) para contexto adicional.
- Control de lectura: `leida`, `mostrada`, `accion_realizada`.
- Estética: `prioridad`, `estilo_visual`.

### 🏆 Logros del Usuario (`logros_usuario`)
Relación entre alumnos y sus méritos desbloqueados.
- `perfil_id`, `logro_id`.
- `fecha_desbloqueo`, `recompensa_reclamada`.
- `metadatos_logro` (JSONB) para guardar el estado del logro en el momento de obtenerlo.

### 📚 Lecciones de Acordeón (`lecciones_acordeon`)
Estructura de las lecciones dentro del simulador.
- `titulo`, `descripcion`, `objetivo`, `categoria`.
- `nivel` (int), `dificultad` (text), `duracion_minutos`.
- `status` (borrador/publicado).
- `secuencia_notas` (ARRAY): El "mapa" de la canción o ejercicio para el motor de juego.

## Sistema de Logros Global (`logros_sistema`)
*Esta tabla se mantiene activa para definir qué logros existen en la plataforma.*
- Documentamos su estructura clave: `nombre`, `descripcion`, `categoria`, `dificultad`, `xp_recompensa`, `monedas_recompensa`, `condiciones` (JSONB).

