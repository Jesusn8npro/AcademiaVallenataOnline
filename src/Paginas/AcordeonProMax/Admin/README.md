# Admin - Panel Administrativo

Módulo con patrón barrel export. Contiene 6 paneles de administración y tipos.

| Archivo | Función |
|---------|---------|
| `index.ts` | **Barrel export** - Re-exporta todos los 6 componentes + tipos |
| `TiposAdmin.ts` | Interfaces mínimas para el admin |
| `Componentes/` | Ver README en subcarpeta |

## Uso

Solo `PanelLateralPracticaLibre.tsx` importa de `Admin/index.ts`:
```ts
import { PanelAdminRec, PanelAdminGestor, PanelAdminGestorAcordes, PanelAdminLibreria, PanelAdminUSB, PanelAdminListaAcordes } from '../../Admin';
```

Los 6 paneles están disponibles como pestañas dentro de `PanelLateralPracticaLibre`.

## Dependencia Externa

- `PanelAdminRec.tsx` importa `BarraTransporte` de `Modos/`
- Los otros 5 paneles son independientes

## Notas

Originalmente había intención de migrar `BarraTransporte` por `ReproductorRec`, pero esa migración nunca se completó. `ReproductorRec` fue eliminado en la limpieza anterior (nunca fue importado).
