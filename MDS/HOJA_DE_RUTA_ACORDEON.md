# 🪗 Visión del Futuro: El Simulador de Acordeón Real
Este documento detalla los hitos alcanzados y la hoja de ruta estratégica para convertir el simulador en una plataforma educativa de vanguardia.

---

## ✅ LOGROS ACTUALES (Estatus del Proyecto)
**El simulador ya es funcional y profesional en sus cimientos:**

1.  **Motor Multi-Instrumento Maestro 🎷🎸**:
    *   Integración total de **Saxo Vallenato** y **Guitarra Acústica** con samples reales de alta fidelidad.
    *   **Sampler Inteligente:** Algoritmo que genera escalas completas (Octavas 3-7) a partir de grabaciones base, eliminando silencios.
    *   **Protección Anti-Mezcla:** Bloqueo absoluto de sonidos de acordeón cuando se usan otros instrumentos.

2.  **Lógica Musical Profesional 🎼**:
    *   **Sincronización Transversal:** Todas las tonalidades (GCF, CFB, ADG, etc.) heredan la misma lógica de arpegios vallenatos corregida.
    *   **Afinación de Pitos:** Corrección de los botones 7, 8, 9 y 10 para seguir la escala natural del acordeón diatónico.
    *   **Detección de Altura Real:** El sistema ahora distingue octavas por frecuencia real, no por posición fija.

3.  **Integración Cloud y Persistencia ☁️**:
    *   Sincronización en tiempo real con **Supabase** para ajustes de usuario, instrumentos y bases de datos de sonidos.
    *   Respeto total al **Mapeo Personalizado**: El simulador usa tus configuraciones manuales como "partitura" para todos los instrumentos.

4.  **Audio Engine Pro 🔊**:
    *   Baja latencia con Web Audio API.
    *   Fundidos naturales (Fade-out) para un sonido limpio sin chasquidos digitales.

---

## 🎭 1. El "Fuelle Vivo" (Experiencia Sensorial)
**Objetivo:** Eliminar la sensación de "imagen estática" y convertir el simulador en un instrumento que respira.
- **Animación Dinámica:** Al presionar teclas o cambiar con `Q` (fuelle), el cuerpo del acordeón debe expandirse o contraerse ligeramente mediante CSS/Framer Motion.
- **Respuesta Visual Pro:** Efectos de iluminación (glow) en los botones según la presión o la velocidad, creando una conexión visual inmediata.

## 📼 2. Sistema de Grabación y "Máquina del Tiempo"
**Objetivo:** Permitir que el alumno aprenda por repetición visual y auditiva exacta.
- **Grabación de Secuencias (MIDI-Style):** Capturar no solo el audio, sino el ID de los botones y el tiempo.
- **Función Rebobinado 10s:** Un botón para retroceder instantáneamente los últimos 10 segundos de la ejecución y ver cuáles botones se iluminaron.
- **Pista de Referencia:** Posibilidad de grabar la secuencia del profesor sobre la pista original (pases famosos: 10k litros, Pase Celestial, etc.).

## 🎮 3. Gamificación: "Vallenato Hero"
**Objetivo:** Convertir el estudio del acordeón en un reto adictivo.
- **Modo Notas Cayendo:** Integración de una interfaz estilo *Guitar Hero* donde las notas bajan hacia el acordeón virtual.
- **Sistema de Evaluación:** El motor compara la ejecución del usuario con la secuencia grabada en tiempo real. 
- **Aprobación de Niveles:** Si la sincronía es >90%, el nivel se marca como aprobado.
- **Tokens y Economía Social:** 
    - Ganancia de 50 tokens al completar pases.
    - Bonus de tokens al compartir el logro en redes sociales con etiqueta oficial.

## 🎙️ 4. DAW Online: El Estudio de Producción Vallenata
**Objetivo:** Un entorno de grabación completo dentro del navegador.
- **Grabación Multipista:** Soporte para Acordeón, Bajo, Guitarra, Piano y Voz.
- **Consola de Mezcla:** Controles individuales de **Volumen** y **Panoramización (L/R)**.
- **Motor de FX Pro:** Inserción de Reverb, Delay y Ecualización (EQ) por pista.
- **Piano Roll Visual:** Editor para corregir notas grabadas de forma manual.
- **Sincronización:** Metrónomo integrado y Zoom en el Timeline.
- **Exportación y Nube:**
    - Exportar mezcla final a **WAV/MP3**.
    - Guardar proyectos directamente en **Supabase** para continuar después.

---

## 🛠️ Próximos Pasos Técnicos
1.  **Implementar Motor de Grabación de Eventos:** Empezar a capturar `timestamp` + `idBoton` + `direccion` en un array.
2.  **Desarrollar Visualizador de Playback:** Hacer que el simulador "toque solo" basándose en el array capturado.
3.  **Animación de Fuelle:** Configurar el primer prototipo de expansión/contracción.

---
*Este documento es la brújula para el desarrollo de la Academia Vallenata Online 2026.* 🚀
