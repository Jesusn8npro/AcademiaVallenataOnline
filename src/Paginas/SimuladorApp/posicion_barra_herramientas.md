# 🛠️ POSICIONAMIENTO DE LA BARRA DE HERRAMIENTAS - REGLAS DE ORO

Este documento es la ley para el posicionamiento de la barra. NO SE TOCA.

## 📍 Ubicación Estructural
La barra debe vivir SIEMPRE dentro del contenedor `simulador-canvas` en `SimuladorApp.tsx`.

```tsx
<div className="simulador-canvas">
    <BarraHerramientas ... />
    <div className="diapason-marco">...</div>
</div>
```

## 🎨 Coordenadas Sagradas
- **Posición**: `position: absolute;`
- **Top**: `10px;` (Petición explícita del usuario).
- **Z-Index**: `800` o superior para que el fuelle no la tape.

## 🛡️ Interactividad
Debe tener estas propiedades para que siempre responda al toque:
- `touch-action: auto !important;`
- `pointer-events: auto !important;`

---
**NOTA**: Si la barra aparece en el centro o desaparece, es porque alguien la movió fuera del `simulador-canvas`. Regrésala ahí.
