Resumen de optimizaciones — Plan Ockham
Separación física Admin / Estudiante
Antes	Después
Un solo EstudioPracticaLibre.tsx con guardia if (esAdmin)	Dos páginas independientes en rutas distintas
Email hardcodeado shalom@gmail.com como guardia	ProteccionAdmin en el router
Hooks de admin viviendo en PracticaLibre/Hooks/	Movidos a Admin/Hooks/
Archivos eliminados: useMetronomoYBPM, useGrabacionRecPro, useReproductorAcordesAdmin, useCancionLibreria, PanelLateralPracticaLibre (todos de PracticaLibre/)

Archivos creados:

Admin/Paginas/EstudioAdmin.tsx — página admin completa
Admin/Componentes/BarraSuperiorAdmin.tsx — header con 15 mensajes aleatorios y botón "Ver como Estudiante"
Admin/Paginas/EstudioAdmin.css — identidad visual cyan/neon bajo .estudio-admin
Admin/Hooks/useEditorSecuenciaAdmin.ts, useCancionLibreria.ts, useReproductorAcordesAdmin.ts
Core/hooks/useMetronomoGlobal.ts
PracticaLibre/Componentes/PanelLateralEstudiante.tsx — solo 5 secciones de estudiante
Core/constantes/modosVista.ts — fuente única de verdad
Tres correcciones CLAUDE.md
1. Agrupación de props — PanelLateralAdmin.tsx

80 props planas → 16 props agrupadas (logica, estudio, rec, libreria, hero, acordes)
El site call en EstudioAdmin bajó de ~120 líneas a ~35
2. Limpieza de JSX — EstudioAdmin.tsx

Handler onGuardar de 23 líneas inline dentro de ModalGuardarHero → extraído como onGuardarHero useCallback arriba del return
3. Unificación de constantes — modosVista.ts

MODOS_VISTA estaba duplicado en AcordeonProMaxSimulador.tsx y EstudioAdmin.tsx
Ahora ambos importan de Core/constantes/modosVista
Estado del build

✓ 4725 modules transformed — built in 15.03s
Zero TypeScript errors
El único warning (chunk >2000kB) es preexistente e independiente de estos cambios.