# Modos - 4 Modos de Juego + Transporte

Los 4 componentes principales de modo de juego, más la barra de transporte compartida y CSS base.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `ModoCompetitivo.tsx` | Modo Competitivo: puntos, vidas, multiplicador de combo (x1→x4), efecto visual de golpe, game over | `AcordeonProMaxSimulador.tsx` (cuando estadoJuego = 'ninguno') |
| `ModoLibre.tsx` | Modo Libre: sin penalizaciones, layout dual (maestro izq + alumno der), siempre llega a resultados | `AcordeonProMaxSimulador.tsx` (cuando estadoJuego = 'libre') |
| `ModoSynthesia.tsx` | Modo Synthesia: pausa automática en cada nota hasta que la toques, indicador pulsante, guía visual | `AcordeonProMaxSimulador.tsx` (cuando estadoJuego = 'synthesia') |
| `ModoMaestroSolo.tsx` | Modo Maestro Solo: acordeón único centrado, barra de transporte COMPLETA (loop A-B, BPM, rewind), Modo Guiado toggle | `AcordeonProMaxSimulador.tsx` (cuando estadoJuego = 'maestro_solo') |
| `BarraTransporte.tsx` | Barra de reproducción: play/pause/stop, slider, loop A-B, control BPM, time display | `ModoMaestroSolo.tsx`, `PanelAdminRec.tsx` |
| `_BaseSimulador.css` | CSS base compartido para contenedor del simulador | `AcordeonProMaxSimulador.tsx` |

## Estructura de estados

```ts
estadoJuego = 'ninguno' → ModoCompetitivo
estadoJuego = 'libre' → ModoLibre
estadoJuego = 'synthesia' → ModoSynthesia
estadoJuego = 'maestro_solo' → ModoMaestroSolo
estadoJuego = 'practica_libre' → EstudioPracticaLibre (en PracticaLibre/)
```

Cada modo tiene su propio archivo CSS.

## Importaciones Comunes

Todos los modos importan:
- `CuerpoAcordeon` de `SimuladorDeAcordeon/Componentes/`
- `PuenteNotas` de `Componentes/`
- `useLogicaProMax` de `Hooks/`
- `usePosicionProMax` de `Hooks/`
