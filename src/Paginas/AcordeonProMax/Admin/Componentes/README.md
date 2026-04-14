# Admin/Componentes - 6 Paneles de Administración

Seis paneles independientes reutilizados en `PanelLateralPracticaLibre.tsx` como pestañas.

| Archivo | Función | Dependencias |
|---------|---------|--------------|
| `PanelAdminRec.tsx` | Grabación de audio: grabar, parar, punch-in, subir | `BarraTransporte` (Modos/) |
| `PanelAdminGestor.tsx` | Ajustes avanzados: wrappea `PestanaDiseno` + `PestanaSonido` de SimuladorDeAcordeon | SimuladorDeAcordeon |
| `PanelAdminGestorAcordes.tsx` | Gestión de acordes: botones "Crear Nuevo" y "Ver Todos" | Interno |
| `PanelAdminListaAcordes.tsx` | Lista completa de acordes desde Supabase: búsqueda, filtros, reproducción | Supabase |
| `PanelAdminLibreria.tsx` | Librería de samples/pistas de audio | Supabase (probablemente) |
| `PanelAdminUSB.tsx` | Conexión ESP32/hardware vía WebSerial USB | WebSerial API |

Todos tienen su archivo CSS correspondiente.

## Patrón

- Cada panel es un componente aislado
- No tienen dependencias cruzadas entre ellos
- Se montan todos en `PanelLateralPracticaLibre` como condicionales:

```tsx
{esAdmin && seccionActiva === 'rec' && <PanelAdminRec ... />}
{esAdmin && seccionActiva === 'gestor' && <PanelAdminGestor ... />}
// ... etc
```

## Notas Históricas

- `PanelAdminListaAcordes.tsx` fue renombrado desde `PanelListaAcordesAdmin.tsx` (14 Abr 2026) para seguir convención `PanelAdmin*`
- Había un `ReproductorRec.tsx` que fue eliminado porque nunca se migró completamente en `PanelAdminRec`
