# 🪗 CAMINO AL ÉXITO: ACORDEÓN DIGITAL V-PRO STANDALONE

Este documento es el mapa de ruta definitivo para transformar el prototipo actual en un instrumento profesional autónomo, capaz de sonar con alta fidelidad sin necesidad de una computadora.

---

## 📍 PUNTO DE PARTIDA (ESTADO ACTUAL)
- **Cerebro:** ESP32-S3 (Dual Core, 240MHz).
- **Interfaz Humana:** 48 botones operativos vía 3 Multiplexores (MUX 16 canales).
- **Lógica de Fuelle:** Sensor ultrasónico (detectando alejamiento/acercamiento).
- **Software Web:** Simulador React con motor de audio Pro totalmente sincronizado vía Serial.
- **Hardware Físico:** Prototipo funcional en placa de puntos pero con cableado denso ("mierdero de cables").

---

## 🚀 EL SALTO AL INSTRUMENTO PROFESIONAL (STANDALONE)
El objetivo es meter toda la potencia del simulador web dentro de la caja de madera de un acordeón real.

### 🍱 LA NUEVA ARQUITECTURA (HARDWARE ADQUIRIDO)
1.  **Audio Pro (DAC PCM5102A):** Sustituirá el audio del computador para dar salida directa de 24 bits.
2.  **Motor de Samples (Micro SD):** Carga de sonidos .WAV reales grabados de acordeones profesionales.
3.  **Fuelle Real (Sensor BMP280):** Medición de presión barométrica interna. El fuelle de tela/cartón mandará presión según el esfuerzo físico del músico.
4.  **Sistema de Energía (UPS 12V + 18650):** Autonomía completa para tocar sin cables.
5.  **Potencia de Salida (Amplificador 80W + Bocinas):** Audio estéreo integrado en los muebles del acordeón.
6.  **Panel de Control (TFT 2.8" Touch):** Cambio de tonalidad (Cinco Letras, Rey Vallenato, etc.) y ajustes de brillo/volumen.ILI9341

---

## 🛠️ CRONOGRAMA DE ACCIÓN INMEDIATA

### Fase 1: Transición Sensorial (El "Feeling" Real)
- [ ] **Muerte al Ultrasonido:** Implementar el sensor BMP280 dentro de una caja sellada para testear la respuesta a la presión.
- [ ] **Curva de Expresión:** Programar que el volumen del audio dependa 100% de la presión del aire detectada.

### Fase 2: Integración Standalone (Cero Cables Externos)
- [ ] **Conexión I2S (DAC):** Cablear el PCM5102A al ESP32-S3 para sacar el primer "pitazo" independiente.
- [ ] **Lector SD:** Desarrollar el sistema de carga de samples desde la tarjeta.
- [ ] **Amplificación:** Conectar las bocinas al amplificador de 80W y probar la pegada del bajo vallenato.

### Fase 3: Producto Final (Marketing y Venta)
- [ ] **Diseño de PCB Profesional:** Limpiar todo el cableado y crear una tarjeta única que se atornille al mueble.
- [ ] **Carpintería y Estética:** Montaje en muebles de madera con parrilla metálica y correas de cuero.
- [ ] **Lanzamiento Academia Vallenata:** Integración total con las lecciones de la plataforma.

---

## 💰 VISIÓN DE NEGOCIO
Este instrumento se venderá como **"El Acordeón de Práctica Pro"**. 
- **Mercado:** Alumnos de la Academia, músicos que viajan, amantes del vallenato.
- **Diferenciador:** Suena igual que un acordeón de 10 millones, pesa la mitad, tiene audífonos para practicar de noche y cuesta una fracción.

---

> **"No estamos haciendo un juguete, estamos fabricando el futuro del vallenato digital."**
