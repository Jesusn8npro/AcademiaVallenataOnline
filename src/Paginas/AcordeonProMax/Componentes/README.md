# Componentes - UI Compartida

Componentes de interfaz reutilizados en múltiples modos y pantallas.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `HeaderHero.tsx` | HUD durante el juego: puntos, vida, combo, BPM, metrónomo, selector de vistas | `AcordeonProMaxSimulador.tsx` (todos los modos) |
| `NavbarProMax.tsx` | Barra de navegación superior: Home, Lista, Configuración | `HomeProMax.tsx`, `ListaCancionesProMax.tsx`, `ConfiguracionProMax.tsx` |
| `FondoEspacialProMax.tsx` | Fondo animado con estrellas/partículas espaciales | `HomeProMax.tsx`, `ListaCancionesProMax.tsx`, `AcordeonProMaxSimulador.tsx` |
| `MenuPausaProMax.tsx` | Menú de pausa en pantalla (ESC/Espacio): cambiar modo, settings rápidos, salir | `AcordeonProMaxSimulador.tsx` |
| `PantallaPreJuegoProMax.tsx` | Pantalla antes de jugar: seleccionar modo, BPM, toggle Maestro suena | `AcordeonProMaxSimulador.tsx` |
| `PantallaResultados.tsx` | Resultados post-partida: precisión, estrellas, XP ganada, historial | `AcordeonProMaxSimulador.tsx` |
| `PantallaGameOverProMax.tsx` | Pantalla de Game Over (cuando vida = 0 en Competitivo) | `AcordeonProMaxSimulador.tsx` |
| `PuenteNotas.tsx` | SVG overlay: puente visual de notas viajando de maestro a alumno | `ModoLibre.tsx`, `ModoCompetitivo.tsx`, `ModoSynthesia.tsx`, `EstudioPracticaLibre.tsx` |
| `DetalleCancionProMax.tsx` | Panel lateral con info de canción seleccionada | `ListaCancionesProMax.tsx` |
| `ModalHistorialHero.tsx` | Modal con historial de partidas de una canción | `PantallaResultados.tsx` |

Todos los componentes tienen su archivo CSS correspondiente.
