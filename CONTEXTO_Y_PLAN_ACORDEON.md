# 🪗 Proyecto: Academia Vallenata Pro - Contexto y Plan de Acción

Este documento resume el progreso actual, la limpieza realizada y la hoja de ruta para la fase de **"Acordeón Hero / Simulador de Acordeón Educativo"**.

---

## ✅ 1. Resumen de Trabajo Realizado (Limpieza y Mejoras)

En las sesiones anteriores, nos enfocamos en profesionalizar la administración y preparar el terreno:

*   **Tablero de Objetivos (Estilo Trello)**: Se implementó un sistema de gestión de tareas totalmente responsivo y visualmente "Premium" bajo la ruta `/administrador/objetivos`.
    *   Soporte para **Drag & Drop** (Mover tareas entre estados).
    *   Sistema de etiquetas con alertas de fecha límite (vencidos, por vencer).
    *   Colores de prioridad identificables de un vistazo.
*   **Limpieza de Código**:
    *   Se eliminaron componentes y hooks obsoletos del simulador anterior para evitar conflictos de lógica (`useMotorDeJuego`, carpetas duplicadas).
    *   Se refactorizaron las rutas en `App.tsx` para ser más organizadas.
*   **Seguridad y Optimización**:
    *   Se verificó que el archivo `.env` esté protegido y no se suba a GitHub.
    *   Se corrigieron errores de **Case Sensitivity** (mayúsculas/minúsculas) que bloqueaban el deploy en Linux (EasyPanel).
*   **Documentación**: Se inició el documento técnico de estadísticas para el simulador (`estadisticas_acordeon.md`).

---

## 🎯 2. Objetivos del Proyecto "Acordeón Hero"

El objetivo final es crear una plataforma donde cualquier persona pueda aprender acordeón vallenato de verdad, incluso sin tener el instrumento físico.

*   **Simulador Educativo**: Aprender canciones, teoría musical, armonía y ejercicios técnicos (escalas, octavas, terceras).
*   **Funcionalidad "Hero"**: Un motor de juego (estilo Guitar Hero) donde las notas bajan por una "autopista" y el alumno debe presionar la tecla correcta con el **sentido del fuelle correcto** (Abrir vs Cerrar).
*   **Fidelidad de Audio**: Sonidos reales grabados directamente de un acordeón profesional, no frecuencias sintéticas.
*   **Independencia de Aprendizaje**: Guiar al alumno paso a paso, desde los primeros pitos hasta tocar canciones completas.

---

## 🛠️ 3. Plan de Acción Propuesto (Siguientes Pasos)

### **Fase 1: Estructura Musical en Supabase**
Crear las tablas necesarias para soportar el sistema educativo y de juego:
*   `acordeon_muestras_audio`: Mapeo de cada botón con su respectivo archivo de audio real grabados abriendo y cerrando el fuelle.
*   `acordeon_partituras`: Secuencias de notas (JSON) alineadas con el tiempo (ms) para el juego.
*   `acordeon_lecciones`: Estructura pedagógica ligada al simulador.

### **Fase 2: El "Mastering Studio" (Admin)**
Desarrollar un módulo para el administrador (Jesús) que permita:
1.  Grabar nota por nota directamente desde el navegador.
2.  **Normalización Automática**: El sistema igualará los decibeles (volumen) de todas las notas para que suenen balanceadas.
3.  Sincronización automática con Supabase Storage.

### **Fase 3: Motor de Juego (Frontend)**
Refactorizar el componente `AcordeonSimulador.tsx` para transformarlo en un motor de juego:
*   Implementar **Tone.js** para latencia cero.
*   Crear la "autopista de notas" con indicadores de dirección de fuelle (**Rojo** abriendo, **Verde** cerrando).
*   Sistema de puntaje y detección de precisión (timing).

---

## 💡 Notas para el Siguiente Chat
*   **Tecnologías Clave**: React, Supabase, Web Audio API, Tone.js, Framer Motion (para animaciones del juego).
*   **Prioridad Inmediata**: Ajustar la base de datos y crear la herramienta de grabación para empezar a alimentar el sistema con sonidos reales.

---
*Documento generado por Antigravity para Jesús González.*
