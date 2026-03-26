# PLAN TÉCNICO DE INTEGRACIÓN: ACORDEÓN 3D (R3F)

## 1. INTRODUCCIÓN
Este documento define la arquitectura técnica para integrar el modelo 3D desarrollado en Blender dentro de la aplicación **React** de la Academia Vallenata, utilizando **React Three Fiber (R3F)**.

---

## 2. FLUJO DE DATOS (REACCIONES EN TIEMPO REAL)

El modelo 3D debe reaccionar instantáneamente a los eventos del simulador existente:

| Evento de Entrada | Componente 3D Afectado | Tipo de Animación |
|-------------------|------------------------|-------------------|
| `Nota ON` | Mesh del Botón (Pitos) | Traslación en el eje local (presión) |
| `Nota OFF` | Mesh del Botón (Pitos) | Retorno a posición original |
| `Fuelle (Abrir)` | Bones del Fuelle | Animación por Huesos (Armature Action) |
| `Fuelle (Cerrar)` | Bones del Fuelle | Animación por Huesos (Armature Action) |
| `Cambio Tonalidad`| Material Body | Cambio de Textura/Color (Propiedades PBR) |
| `Digitación Avatar`| Armadura Personaje | Aplicación de Pose/Clip de Animación |

---

## 3. REQUISITOS PARA EL EXPORTABLE (.GLB)

Para que la integración sea fluida, el desarrollador 3D debe seguir estas convenciones:

### 3.1 Naming Convention (Nomenclatura)
*   **Botones Pitos:** `Btn_Row1_1`, `Btn_Row1_2`... `Btn_Row3_10` etc.
*   **Botones Bajos:** `Bass_1`, `Bass_2`...
*   **Cuerpo:** `Body_Left`, `Body_Right`, `Bellows_Mesh`.
*   **Armature:** `Accordion_Rig`.

### 3.2 Estructura de Animación (Shape Keys vs Bones)
*   **Fuelle:** Se recomienda el uso de **Bones (Huesos)** con un sistema de pesos (Weight Painting) suave para que el fuelle se estire de forma real.
*   **Botones:** Animaciones simples de posición o uso de `instancedMesh` si se busca optimización extrema, aunque para 31 botones picos y 12 bajos, meshes individuales son aceptables.

---

## 4. IMPLEMENTACIÓN EN REACT (R3F)

### 4.1 Carga del Modelo
Utilizaremos `useGLTF` de `@react-three/drei` para cargar y pre-procesar el modelo.

```tsx
const Model = () => {
  const { nodes, materials, animations } = useGLTF('/modelos/acordeon_vpro.glb');
  const { actions } = useAnimations(animations);
  
  // Referencia a los botones activos desde el Store o Hook Global
  const { botonesActivos } = useLogicaAcordeon();

  // Ejemplo de reacción de un botón
  useEffect(() => {
    if (botonesActivos.includes('boton_id')) {
      // lógica para mover el mesh nodes.Btn_Row1_1
    }
  }, [botonesActivos]);
}
```

### 4.2 Control del Fuelle
El fuelle será controlado por un valor flotante (0 a 1) que mapea el estado de apertura. Se puede usar un `Interpolation` de la acción de Blender.

---

## 5. OPTIMIZACIÓN WEB

1.  **Texturas:** No exceder 2K. Usar formato WebP o KTX2.
2.  **Geometría:** El modelo completo (acordeón + avatar) no debe superar los 100k - 150k polígonos.
3.  **Compresión:** Usar `gltf-pipeline` con compresión **Draco**.

---

## 6. PRÓXIMOS HITOS
1.  Validar el modelo base en Blender.
2.  Probar exportación a GLB y visualización en [gltf.report](https://gltf.report/).
3.  Crear componente `<Acordeon3DScene />` en React.
