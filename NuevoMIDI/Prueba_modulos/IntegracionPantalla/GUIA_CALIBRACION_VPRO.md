# 🛠️ GUÍA DE CALIBRACIÓN V-PRO (PANTALLA & TOUCH)

Esta guía explica por qué los ejes se invierten y cómo solucionarlo en el futuro para cualquier proyecto con el ESP32-S3 y la ILI9341.

## 1. El Problema del "Espejo"
El chip de video (ILI9341) y el chip del touch (XPT2046) son componentes SEPARADOS y pegados físicamente. 
*   Cuando giras la pantalla por software (`setRotation`), el touch NO gira automáticamente.
*   El touch lee valores de voltaje (ADC) de 0 a 4095. Si el sensor está "boca abajo" respecto a la pantalla, verás el efecto espejo.

## 2. La Solución: Función `map()`
La clave está en cómo mapeamos los números crudos del sensor a los píxeles de la pantalla.

### Ejemplo Vertical (Tu Configuración Actual):
Si tocas a la **derecha** y el punto sale a la **izquierda**, invertimos el rango del mapa:
*   **MAL (Efecto Espejo):** `map(pt.x, 300, 3800, 0, 240)`
*   **BIEN (Corregido):** `map(pt.x, 3800, 300, 0, 240)`  <-- *Invertimos 3800 y 300*

## 3. Guía de Rotaciones
| Valor `setRotation()` | Orientación | Resolución |
| :--- | :--- | :--- |
| `0` | Vertical Estándar | 240 x 320 |
| `1` | Horizontal (Landscape) | 320 x 240 |
| `2` | **Vertical Invertido (V-PRO)** | 240 x 320 |
| `3` | Horizontal Invertido | 320 x 240 |

## 4. Fórmula Maestra V-PRO (Portrait Mode 2)
```cpp
int x = map(pt.x, 3800, 300, 0, 240); // Invierte Izquierda/Derecha
int y = map(pt.y, 3700, 200, 0, 320); // Invierte Arriba/Abajo
```

---
*Manual creado por Antigravity para Jesus Gonzalez - Academia Vallenata Online*
