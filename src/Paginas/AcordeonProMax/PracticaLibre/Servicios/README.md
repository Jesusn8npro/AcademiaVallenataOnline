# PracticaLibre/Servicios - Servicios Supabase

2 servicios que manejan la persistencia en Supabase para el modo práctica libre.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `servicioPistasPracticaLibre.ts` | Carga pistas de backing tracks del catálogo en Supabase | `useEstudioPracticaLibre.ts` |
| `servicioPreferenciasPracticaLibre.ts` | Guarda y recupera preferencias del usuario (tonalidad, timbre, modelo visual, etc.) | `useEstudioPracticaLibre.ts`, `Hooks/useLogicaProMax.ts` (external) |

## Notas

- `servicioPreferenciasPracticaLibre.ts` es importado también por el hook maestro `useLogicaProMax` para obtener snapshot de metadatos
- Ambos servicios dialogan con Supabase para persistencia de datos del usuario
