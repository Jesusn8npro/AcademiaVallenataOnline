# PracticaLibre/Componentes - UI del Modo Práctica Libre

4 componentes que conforman la interfaz del modo de práctica libre.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `BarraSuperiorPracticaLibre.tsx` | Controles superiores: selector de tonalidad, timbre (Brillante/Armonizado), botón volver | `EstudioPracticaLibre.tsx` |
| `BarraReproductorPracticaLibre.tsx` | Barra de reproducción: play/pause, slider de posición, control BPM (40-240), rewind/forward | `EstudioPracticaLibre.tsx` |
| `PanelLateralPracticaLibre.tsx` | **Panel grande (26.9 KB)** - 11 secciones: sonido, modelos, pistas, teoría, efectos, rec, gestor, gestor_acordes, lista_acordes, libreria, usb | `EstudioPracticaLibre.tsx` |
| `ModalGuardarPracticaLibre.tsx` | Modal para guardar una grabación con nombre | `EstudioPracticaLibre.tsx` |

## Notas

- `BarraReproductorPracticaLibre.tsx` tiene un bug de CSS (REPARADO 14 Abr 2026):
  - Importaba `../EstudioPracticaLibre.css` pero usaba clases de `BarraTransporte.css`
  - Fix: cambiar a `../../Modos/BarraTransporte.css`

- `PanelLateralPracticaLibre.tsx` es el ÚNICO consumidor de todos los paneles Admin
  - Si ese archivo se mueve o refactoriza, los 6 paneles quedan sin usar

Todos tienen su CSS correspondiente.
