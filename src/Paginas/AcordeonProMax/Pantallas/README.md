# Pantallas - Componentes Principales

4 páginas principales accesibles desde App.tsx. Cada pantalla tiene su propio CSS.

| Archivo | Función | Importado por |
|---------|---------|---------------|
| `AcordeonProMaxSimulador.tsx` | Orquestador principal: elige qué modo renderizar, sincroniza YouTube, gestiona estados del juego | `App.tsx` (2 rutas con/sin slug) |
| `HomeProMax.tsx` | Pantalla de bienvenida con música de fondo, botones "Empezar" y "Práctica Libre" | `App.tsx` (/acordeon-pro-max) |
| `ListaCancionesProMax.tsx` | Catálogo de canciones con filtros, previsualización, rating, loading de Supabase | `App.tsx` (/acordeon-pro-max/lista) |
| `ConfiguracionProMax.tsx` | Configuración de cuenta del usuario (perfil, integración con terceros) | `App.tsx` (/acordeon-pro-max/configuracion) |

## Estructura de rutas

```
/acordeon-pro-max → HomeProMax
/acordeon-pro-max/lista → ListaCancionesProMax
/acordeon-pro-max/acordeon → AcordeonProMaxSimulador (modo práctica libre)
/acordeon-pro-max/acordeon/:slug → AcordeonProMaxSimulador (con canción)
```

Todas las rutas están envueltas en `<ProtegidoAcordeonProMax>` para autenticación.
