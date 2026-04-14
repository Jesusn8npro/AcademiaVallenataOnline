# 🎵 AcordeonProMax - Módulo Gaming Completo

Simulador interactivo estilo Guitar Hero/Synthesia para práctica de acordeón. Incluye 5 modos de juego, sistema de puntuación con XP, panel de administración y modo de práctica libre.

## 📁 Estructura

| Carpeta | Propósito |
|---------|-----------|
| `Pantallas/` | 4 componentes principales: simulador, home, lista de canciones, configuración |
| `Componentes/` | UI compartida: headers, menús, pantallas de resultados, puente de notas |
| `Hooks/` | Lógica central: scoring, sincronización de juego, posicionamiento |
| `Modos/` | 4 modos de juego (Competitivo, Libre, Synthesia, Maestro Solo) + barra de transporte |
| `Admin/` | Panel administrativo para gestionar canciones, grabaciones, conexiones ESP32 |
| `PracticaLibre/` | Subsistema completo: modo sin canción con backing tracks, grabación, preferencias |
| (raíz) | `TiposProMax.ts` - tipos centrales e interfaces |

## 🎮 Modos de Juego

1. **Competitivo** - Puntos, vidas, multiplicador de combo, game over
2. **Libre** - Sin penalizaciones, siempre llega a resultados
3. **Synthesia** - Pausa automática nota por nota, guía visual
4. **Maestro Solo** - Acordeón centrado, transporte completo, modo guiado
5. **Práctica Libre** - Sin canción, skins visuales, backing tracks, grabación

## 🔑 Tipos Principales

- `TiposProMax.ts` - Tipos de juego, interfaces de canción, interfaces de estadísticas

## 📡 Dependencias Externas

- `SimuladorDeAcordeon/` - Motor de audio, hooks de lógica, tipos base
- `SimuladorApp/` - ModalMetronomo compartido
- `SeguridadApp/` - Guard de autenticación `ProtegidoAcordeonProMax`

## ✅ Verificación

Total: 57 archivos, 0 muertos, 0 imports rotos, 5 modos funcionando
