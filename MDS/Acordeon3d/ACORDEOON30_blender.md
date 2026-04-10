# DOCUMENTO DE VISIÓN Y ARQUITECTURA

## Sistema de Acordeón 3D Interactivo + Avatar Educativo

---

# 1. VISIÓN DEL PROYECTO

El objetivo de este proyecto es crear un **ecosistema digital completo alrededor del acordeón**, donde un mismo sistema 3D sirva simultáneamente para:

• Simulador educativo de acordeón
• Plataforma de aprendizaje musical
• Visualización interactiva del instrumento
• Configurador de acordeones para usuarios
• Integración con hardware real del acordeón digital

La idea central es que **el instrumento no sea solo visual**, sino que responda a la interacción del usuario en tiempo real.

El usuario podrá:

• tocar notas
• ver los botones que se presionan
• ver el fuelle moverse
• observar cómo un avatar toca el acordeón
• personalizar el instrumento visualmente

Esto crea una experiencia mucho más clara para el aprendizaje del acordeón.

---

# 2. PRINCIPIO DEL SISTEMA

El sistema se basa en tres conceptos fundamentales:

1. **Modelo 3D realista del acordeón**
2. **Interacción en tiempo real**
3. **Simulación visual de ejecución musical**

El instrumento 3D será el **núcleo visual del sistema**, usado tanto en la academia como en la configuración del instrumento.

---

# 3. ARQUITECTURA GENERAL

El sistema funcionará de la siguiente forma:

Usuario toca una nota
↓
El sistema detecta la nota
↓
Se identifica el botón correspondiente
↓
Se anima el botón del acordeón
↓
El fuelle responde al movimiento
↓
El avatar ejecuta la posición de manos correspondiente

Esto permite una simulación visual clara del instrumento.

---

# 4. FASE 1

## MODELADO DEL ACORDEÓN 3D REALISTA

La primera fase consiste en crear un **modelo 3D completo y realista del acordeón** que pueda utilizarse en la plataforma web.

Este modelo será el activo principal del sistema.

---

## 4.1 OBJETIVO DEL MODELO

El acordeón debe verse **lo más real posible**, pero optimizado para funcionar en una aplicación web.

Se utilizarán referencias reales:

• fotografías del instrumento
• videos desde todos los ángulos
• detalles de botones
• detalles del fuelle
• texturas nacaradas

El objetivo es capturar la estética real del instrumento.

---

## 4.2 SOFTWARE DE MODELADO

El modelo se desarrollará utilizando:

Blender (modelado y animación)

Posteriormente será exportado para uso web.

---

## 4.3 ESTRUCTURA MODULAR DEL MODELO

El acordeón se dividirá en partes independientes para permitir animación y personalización.

Estructura sugerida:

Acordeon
• Body (cuerpo principal)
• Bellows (fuelle)
• Right Buttons (botones principales)
• Bass Buttons (bajos)
• Grille (rejilla)
• Decorations (detalles visuales)
• Straps (correas)

Cada elemento será independiente.

Esto permitirá:

• animar partes específicas
• modificar materiales
• personalizar el instrumento

---

## 4.4 ANIMACIONES BÁSICAS

El acordeón tendrá animaciones básicas integradas.

Animaciones necesarias:

Bellows_Open
Animación de apertura del fuelle.

Bellows_Close
Animación de cierre del fuelle.

Play_Idle
Movimiento natural del instrumento mientras se ejecuta.

Estas animaciones permitirán simular el comportamiento del instrumento.

---

## 4.5 BOTONES INTERACTIVOS

Los botones del acordeón deben ser objetos independientes.

Esto permitirá que cuando el usuario toque una nota:

• el botón correspondiente se presione
• el botón vuelva a su posición original

Esta interacción será controlada desde la plataforma web.

---

## 4.6 SISTEMA DE PERSONALIZACIÓN

El modelo debe permitir cambiar materiales.

Materiales editables:

material_body
material_bellows
material_buttons
material_decorations

Esto permitirá modificar:

• colores del acordeón
• acabados nacarados
• estilos del fuelle
• combinaciones visuales

Esto es importante porque el mismo sistema se utilizará en la plataforma educativa.

Los estudiantes podrán configurar el instrumento visualmente mientras aprenden.

---

# 5. FASE 2

## SISTEMA DE AVATAR INTERACTIVO

La segunda fase consiste en crear un **avatar que toque el acordeón de forma visual**.

Este avatar funcionará como representación del músico dentro del simulador.

---

## 5.1 OBJETIVO DEL AVATAR

El avatar mostrará visualmente cómo se ejecuta el acordeón.

Esto ayudará a que los estudiantes entiendan:

• posiciones de manos
• digitación
• ejecución del instrumento

El avatar debe sostener el acordeón de forma natural.

---

## 5.2 RIG DEL PERSONAJE

El avatar debe incluir un sistema de huesos para animación.

Estructura básica:

• torso
• brazos
• manos
• dedos

Los dedos deben poder moverse individualmente.

Esto permitirá animar la digitación.

---

## 5.3 INTERACCIÓN CON EL ACORDEÓN

El avatar no decide qué tocar.

El simulador envía los datos.

El sistema funciona así:

Nota detectada
↓
Botón correspondiente
↓
Dedo asignado
↓
Animación del dedo

Esto permite que el avatar reproduzca visualmente la ejecución.

---

## 5.4 MODOS DE VISUALIZACIÓN

La plataforma tendrá dos modos:

Modo 1
Visualización del acordeón únicamente.

Modo 2
Avatar tocando el acordeón.

Esto permite al usuario elegir cómo desea visualizar el aprendizaje.

---

# 6. USO DENTRO DE LA PLATAFORMA

El sistema 3D será utilizado en diferentes partes de la plataforma.

Simulador de acordeón
Visualización del instrumento
Configuración visual del acordeón
Material educativo interactivo

Todo funcionará con el mismo modelo base.

---

# 7. INTEGRACIÓN TECNOLÓGICA

El modelo será utilizado en una plataforma web desarrollada con:

React

El renderizado 3D se realizará mediante:

Three.js / React Three Fiber

Formato del modelo:

GLB / GLTF

Esto permite que funcione directamente en el navegador.

---

# 8. OBJETIVO FINAL

Construir el primer sistema educativo de acordeón que combine:

• instrumento interactivo
• simulación visual
• aprendizaje guiado
• representación realista del instrumento

Este sistema permitirá que el estudiante no solo escuche el acordeón, sino que **vea exactamente cómo se ejecuta**.

El resultado será una experiencia de aprendizaje más clara, moderna e inmersiva para el estudio del acordeón.
