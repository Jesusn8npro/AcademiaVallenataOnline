# 🪗 ESPECIFICACIONES TÉCNICAS PARA EL ACORDEÓN (Fase 1)

¡Hola! Para que este proyecto funcione a la primera en mi plataforma web (**React + Three.js**), necesito que sigas estas instrucciones técnicas.

---

### IMPORTANTE: MODELADO REALISTA
El acordeón debe ser modelado **siguiendo estrictamente las fotos de referencia** que encontrarás en esta carpeta del Drive. Necesito que captures el detalle del modelo Corona III, pues el objetivo es que el usuario sienta que tiene un instrumento real frente a él.

### EL PROYECTO SE DIVIDE EN 2 FASES (Pagos independientes):
1.  **Fase 1 (Este trabajo):** Modelado del acordeon realista, Todas las piezas sueltas y animación del fuell como se muestra en el mp4 del drive.
2.  **Fase 2 (Siguiente paso):** Creación e integración del avatar sobre el acordeón que ya creaste. **Esta fase se negociará y pagará como un trabajo aparte** una vez la Fase 1 esté funcionando en mi web. Claramente no subir mucho el precio para que3 la misma persona realice las dos fases y sigamos trabajando juntos.

---

### 1. JERARQUÍA Y NOMBRES (Vital para el código)
Mi código busca los objetos por su nombre. Por favor, sé consistente par el modelado del instrumento :
*   **Pitos (Botones Derecha):** `Boton_D_01`, `Boton_D_02`, etc.
*   **Bajos (Botones Izquierda):** `Boton_I_01`, `Boton_I_02`, etc.
*   **Fuelle:** Divide el objeto en `Fuelle_Pliegues` y `Fuelle_Cintas`.
*   **Cuerpo:** `Cuerpo_Derecho`, `Cuerpo_Izquierdo`, `Diapason`.
*   **Parrilla:** `Parrilla_Metal` y `Parrilla_Tela`.

### 2. POSICIÓN Y PIVOTES (Para el hundimiento de notas)
*   **Pivotes de los Botones:** El punto de origen (pivote) de cada botón debe estar en su base, NO en el centro. Esto es vital para que cuando mi código le diga al botón "bájate 1cm", se hunda correctamente en el diapasón, es decir se hunda el boton correctament y realista.
*   **Escala y Rotación (MEDIDAS REALES):** Aplica todas las transformaciones en Blender (`Ctrl+A`). El acordeón debe tener el tamaño real de un Hohner Corona III. Para que tengas de referencia, **estas son las medidas aproximadas en escala real (Meters en Blender):**
    *   **Alto:** ~31 cm (0.31 m)
    *   **Ancho:** ~32 cm (0.32 m)
    *   **Profundidad:** ~19 cm (0.19 m)

### 3. MATERIALES Y TEXTURAS (Personalización)
*   **Librería de Variantes (Texture Pack):** No necesito que hagas 10 modelos diferentes. Necesito UN solo modelo, pero que me entregues una carpeta con las diferentes opciones de imágenes (JPG/PNG) para:
    *   **Botones:** Diferentes texturas de Nácar/Perla (Blanco, Negro, Azul, Rojo, Dorado).
    *   **Fuelle:** Diferentes diseños (Blanco con rombos, patrones floreados, colores sólidos).
    *   **Cuerpo:** Texturas de celuloide brillante de diferentes colores.
*   **IMPORTANTE:** El modelo debe tener un "UV Mapping" profesional para que yo, desde mi código de React, solo tenga que cambiar la imagen de la textura y el acordeón cambie de look al instante.
*   **Logo o nombre del acordeon:** El nombre debe ser un objeto independiente para poder cambiarlo.

### 4. ANIMACIÓN Y RIGGING (Fuelle Funcional)
*   **No es solo modelar:** El fuelle debe ser **totalmente funcional**. Necesito que esté riggeado (con huesos o shape keys) para que la animación de abrir y cerrar sea fluida, natural y **exactamente igual a como se muestra en los videos de referencia del Drive.**
*   **Clips de Animación:** El archivo `.glb` debe incluir al menos un clip de animación llamado `Cerrar_Abrir` donde se vea el movimiento completo del fuelle sin que la geometría se rompa.
*   **Nota Técnica:** Asegúrate de que las texturas del fuelle no se estiren de forma extraña al abrirlo; los pliegues deben comportarse como tela/cartón real.

---

### RESUMEN DEL FLUJO
1. Tú modelas el acordeón basado en las fotos y haces la animación del fuelle.
2. Me entregas el **.blend** y el **.glb**.
3. Validación de Fase 1 -> **Pago de Fase 1**.
4. Inicio de Fase 2 (Avatar) -> **Pago de Fase 2**.

**¡De la programación me encargo yo! Si eres un teso con el realismo en Blender, ¡vamos a darle con toda!** ibras! 🪗🔥
