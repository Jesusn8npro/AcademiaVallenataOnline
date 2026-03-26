# CONVOCATORIA: Artista 3D para Instrumento Musical Interactivo (Acordeón Vallenato)

## 1. RESUMEN DEL PROYECTO
Buscamos un artista 3D especializado en modelado, rigging y animación en **Blender** para desarrollar un **Acordeón Vallenato Profesional** y un **Avatar** integrado. Este activo será el núcleo de una plataforma educativa interactiva desarrollada en **React + Three.js**.

## 2. ESPECIFICACIONES TÉCNICAS (CRÍTICAS)
Para asegurar la integración técnica con nuestro motor de software, el entregable debe cumplir:

*   **Formato:** `.blend` (fuente) y `.glb` (exportado con compresión Draco).
*   **Optimización:** Máximo 120k polígonos (Acordeón + Avatar). Texturas PBR (Metallic/Roughness) en 2K (formato optimizado).
*   **Jerarquía de Nodos:**
    *   Los 31 botones de la mano derecha (pitos) y los 12 de la izquierda (bajos) deben ser objetos independientes con nombres lógicos (`Btn_Row1_01`, etc.).
    *   El fuelle debe estar riggeado con **huesos (Bones)** para permitir una deformación realista y fluida al abrir/cerrar.
*   **Animaciones:**
    *   `Bellows_Open` / `Bellows_Close` (Loopable y controlable por timeline).
    *   3 variaciones de movimiento natural del instrumento (`Idle_Play`).
    *   Avatar con rig completo (dedos independientes) posicionado para tocar el instrumento.

## 3. REQUISITOS DEL MODELADO
*   **Acordeón:** Basado en referencias de modelos "Corona III" o similares. Acabados nacarados, rejilla metálica detallada y correas de cuero.
*   **Avatar:** Estilo estilizado/carismático (referencias proporcionadas). Debe sostener el acordeón de forma ergonómica y natural.
*   **Personalización:** El modelo debe estar configurado para que podamos cambiar los colores del cuerpo y del fuelle mediante código (Material swap).

## 4. ENTREGABLES
1.  Archivo `.blend` organizado por colecciones.
2.  Archivo `.glb` listo para web (verificado en gltf-viewer).
3.  Carpeta de texturas (Bakeadas si es necesario).

## 5. PRESUPUESTO Y CONTACTO
*   **Presupuesto:** 100 USD - 150 USD (Negociable según portafolio).
*   **Bonus:** Si tienes experiencia previa con **React Three Fiber**, menciónalo.

---
*Si estás interesado, por favor envía tu portafolio con ejemplos de modelos optimizados para web y animaciones de personajes.*
