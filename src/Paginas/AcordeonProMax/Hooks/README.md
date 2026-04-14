# Hooks - Lógica del Juego

Hooks personalizados que centralizan la lógica de negocio del simulador.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `useLogicaProMax.ts` | **HOOK MAESTRO (59 KB)** - Motor central: scoring, estados de juego, Synthesia, grabaciones, XP/monedas, carga de canciones desde Supabase, effectos visuales. Contiene exports internos como `useCancionesProMax` | `AcordeonProMaxSimulador.tsx` |
| `usePosicionProMax.ts` | Calcula posiciones DOM de botones del acordeón para trayectorias del PuenteNotas y cálculo de hits | `ModoCompetitivo.tsx`, `ModoLibre.tsx`, `ModoSynthesia.tsx`, `EstudioPracticaLibre.tsx`, `PuenteNotas.tsx` (type) |

## Notas Arquitectónicas

- `useLogicaProMax.ts` es el corazón del módulo. Contiene:
  - Estados de scoring (puntos, vida, multiplicador, XP)
  - Lógica de modos (Synthesia auto-pause, etc.)
  - Sincronización con YouTube
  - Manejo de grabaciones
  - Gestión de canciones desde Supabase
  - Cálculo de precisión y estadísticas

**Deuda técnica:** Podría dividirse en 4 hooks especializados:
- `useEstadoJuego.ts` - estados (pausa, game over, fases)
- `useScoringProMax.ts` - puntos y vida
- `useSynchroProMax.ts` - sincronización ticks/BPM
- `useCancionesProMax.ts` - carga desde Supabase

Esta división requeriría pruebas exhaustivas de los 5 modos.
