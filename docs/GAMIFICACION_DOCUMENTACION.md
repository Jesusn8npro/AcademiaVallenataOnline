# Documentación de Gamificación y Simulador

Este documento describe la arquitectura del sistema de gamificación y su integración con el Simulador de Acordeón, basado en el análisis del proyecto original Svelte y el estado actual del proyecto React.

## 1. Concepto General
La plataforma utiliza un sistema de gamificación profundo para incentivar el aprendizaje:
- **XP (Experiencia)**: Se gana por casi cualquier acción (lecciones, simulador, comunidad).
- **Niveles**: Basados en XP acumulado (Curva exponencial).
- **Ranking**: Competitivo, con ligas (General, Simulador, Constancia).
- **Logros**: Medallas desbloqueables por hitos específicos.
- **Monedas**: Economía virtual (planeada).

## 2. Arquitectura del Sistema

### A. Servicios Core
1.  **`gamificacionServicio.ts`** (React):
    *   Maneja XP, Niveles y Ranking.
    *   *Estado actual*: Implementado cálculo de nivel y ranking.
    *   *Faltante*: Lógica de `verificarLogros` (Sistema de logros automáticos).

2.  **`logicaJuego.ts`** (Svelte - Pendiente de Portar):
    *   Es el "Motor Guitar Hero".
    *   Recibe las notas de una canción (JSON) y las compara con los inputs del usuario en `AcordeonSimulador`.
    *   Calcula: `Perfect` (±50ms), `Good` (±100ms), `Miss`.
    *   Gestiona: Racha, Multiplicador, Salud.

### B. Flujo de Datos del Simulador Gaming
1.  **Selección de Canción**: El usuario elige un track.
2.  **Inicialización**: Se instancia `LogicaJuego` con las notas del track.
3.  **Ejecución**:
    *   `AcordeonSimulador` emite eventos `onNotaPresionada`.
    *   `LogicaJuego` procesa el evento y devuelve Puntuación/Feedback.
4.  **Finalización**:
    *   Se envía el reporte de sesión a `gamificacionServicio.agregarXP`.
    *   `gamificacionServicio` actualiza Stats y Base de Datos.

## 3. Sistema de Ranking
El ranking es "Híbrido":
1.  **RPC Supabase (`obtener_ranking_hibrido_completo`)**:
    *   Calcula en tiempo real o usa caché de base de datos.
    *   Cruza datos de `experiencia_usuario`, `perfiles` y `estadisticas_usuario`.
2.  **Frontend (`ranking/index.tsx`)**:
    *   Muestra tarjetas con Avatar, Nivel y Puntos.
    *   Scroll infinito.

## 4. Estado de la Migración (Gap Analysis)

| Característica | Estado en React | Acción Recomendada |
| :--- | :--- | :--- |
| **Servicio Base XP** | ✅ Completo | Listo para usar. |
| **Ranking UI** | ⚠️ Parcial | Falta implementar la página de Ranking completa. |
| **Motor de Juego** | ❌ Faltante | Se debe portar `logicaJuego.ts`. |
| **Sistema Logros** | ❌ Faltante | Falta `verificarLogros` en el servicio. |
| **Ranking Backend** | ✅ Completo | Supabase ya tiene las funciones RPC. |

## 5. Recomendación
**NO ELIMINAR AÚN** la carpeta `EjemplosMigraciones`. Contiene la lógica crítica de `logicaJuego.ts` y los algoritmos de verificación de logros que aún no han sido migrados al proyecto React.

## 6. Referencias de Código (Svelte Original)
- `src/lib/services/logicaJuego.ts` (Motor de juego)
- `src/lib/services/gamificacionService.ts` (Servicio completo)
- `src/routes/ranking/+page.svelte` (UI Ranking)
