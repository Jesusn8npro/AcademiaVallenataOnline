# PracticaLibre - Subsistema Completo de Práctica Libre

Sistema independiente completo: acordeón libre sin canción, con backing tracks, grabación, preferencias del usuario y 6 paneles admin opcionales.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `EstudioPracticaLibre.tsx` | **Componente principal (40 KB)** - Orquestador del modo: monta acordeón, panel lateral, modales | `AcordeonProMaxSimulador.tsx` (estadoJuego = 'practica_libre') |
| `TiposPracticaLibre.ts` | Interfaces: PistaPracticaLibre, PreferenciasPracticaLibre, EfectosPracticaLibre, SeccionPanelPracticaLibre | Todos los componentes/hooks/servicios de la carpeta |

Tiene 4 subcarpetas: Componentes/, Datos/, Hooks/, Servicios/

## Arquitectura

```
EstudioPracticaLibre.tsx (orquestador)
├── BarraSuperiorPracticaLibre.tsx (tonalidad, timbre, volver)
├── BarraReproductorPracticaLibre.tsx (play/pause, BPM, slider)
├── PanelLateralPracticaLibre.tsx (11 secciones admin)
├── ModalGuardarPracticaLibre.tsx (guardar grabación)
│
├── Hooks: useEstudioPracticaLibre, useAudioFondoPracticaLibre
├── Servicios: servicioPistasPracticaLibre, servicioPreferenciasPracticaLibre
├── Datos: modelosVisualesAcordeon
└── CSS: EstudioPracticaLibre.css
```

## Dependencias Externas

- `CuerpoAcordeon`, `PanelAjustes`, `ModalCreadorAcordes`, `ModalListaAcordes`, `ModalGuardarHero` desde `SimuladorDeAcordeon/`
- `PuenteNotas` desde `Componentes/`
- Admin (6 paneles) desde `Admin/`
- `useLogicaAcordeon` desde `SimuladorDeAcordeon/`

## Bug Reparado (14 Abr 2026)

`BarraReproductorPracticaLibre.tsx` importaba `../EstudioPracticaLibre.css` incorrectamente.
Cambio: `../../Modos/BarraTransporte.css` (que es donde están todas las clases realmente)
