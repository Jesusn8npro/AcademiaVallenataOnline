# PracticaLibre/Hooks - Lógica del Modo Práctica Libre

2 hooks especializados para el subsistema de práctica libre.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `useEstudioPracticaLibre.ts` | Hook de estado completo: grabación, pistas, preferencias, BPM, modelos visuales | `EstudioPracticaLibre.tsx` |
| `useAudioFondoPracticaLibre.ts` | Hook para reproducir backing tracks (pistas de audio de fondo) | `EstudioPracticaLibre.tsx` |

## Dependencias

- `useEstudioPracticaLibre.ts` importa:
  - `servicioPistasPracticaLibre` (cargar pistas del catálogo)
  - `servicioPreferenciasPracticaLibre` (guardar/recuperar preferencias)
  - Tipos de `TiposPracticaLibre`
