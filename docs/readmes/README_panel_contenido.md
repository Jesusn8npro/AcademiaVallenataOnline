# Documentación: Panel de Contenido y Crear Contenido (Administrador)

## Índice
- [Descripción General](#descripción-general)
- [Estructura de la Solución](#estructura-de-la-solución)
- [Panel de Contenido (`/administrador/panel-contenido`)](#panel-de-contenido-administradorpanel-contenido)
- [Página Crear Contenido (`/administrador/crear-contenido`)](#página-crear-contenido-administradorcrear-contenido)
- [Actualizaciones Recientes](#actualizaciones-recientes)
- [Cómo Escalar el Sistema](#cómo-escalar-el-sistema)
- [Mejoras Sugeridas](#mejoras-sugeridas)

---

## Descripción General
El sistema de administración de contenido permite a los administradores crear, editar y organizar partes de tutoriales de manera flexible y moderna. Está construido con SvelteKit en el frontend y Supabase como backend (base de datos y autenticación).

---

## Estructura de la Solución
- **Frontend:** SvelteKit
- **Backend:** Supabase (PostgreSQL)
- **Carpetas clave:**
  - `src/routes/administrador/panel-contenido` — Panel principal de gestión.
  - `src/routes/administrador/crear-contenido` — Página para crear y editar tutoriales y sus partes.
  - `src/lib/components/CrearContenido/` — Componentes reutilizables para el flujo de creación/edición.
  - `tablas_supabase/` — Definiciones y documentación de tablas de la base de datos.

---

## Panel de Contenido (`/administrador/panel-contenido`)
- **Funcionalidad:**
  - Muestra la lista de tutoriales existentes.
  - Permite buscar, filtrar, editar o eliminar tutoriales.
  - Acceso directo para crear un nuevo tutorial.
  - Visualización del estado (visible/no visible) y orden de los tutoriales.
- **Escalabilidad:**
  - Soporta paginación y filtros avanzados.
  - Preparado para integrar métricas de uso y estadísticas.

---

## Página Crear Contenido (`/administrador/crear-contenido`)
- **Funcionalidad:**
  - Permite crear y editar tutoriales, incluyendo sus partes (secciones).
  - Cada parte tiene:
    - `tipo_parte`: tipo lógico de sección (introducción, pase_intermedio, pase_final, acompañamiento, extra).
    - `tipo_contenido`: formato del contenido (video, texto, pdf).
    - `titulo`, `descripcion`, `orden`, `visible`.
    - Según el `tipo_contenido`, se muestra y guarda en el campo adecuado:
      - Si es video: se usa `video_url`.
      - Si es texto/pdf: se usa `contenido` (HTML o markdown).
  - Permite reordenar partes, eliminarlas y editarlas de forma rápida.
- **Validaciones:**
  - Solo se permiten valores válidos en los selectores (evita errores de constraint en la base de datos).
  - Se valida que los campos requeridos estén completos antes de guardar.

---

## Actualizaciones Recientes
- Se eliminó el campo `recursos_adicionales` y cualquier mapeo relacionado.
- Se eliminó el campo `duracion`.
- Se agregó el campo `tipo_contenido` con opciones: `video`, `texto`, `pdf`.
- El formulario ahora es más claro, moderno y fácil de usar.
- Los datos se guardan correctamente según el tipo de contenido.

---

## Cómo Escalar el Sistema
- **Agregar más tipos de contenido:**
  - Solo agrega nuevas opciones al campo `tipo_contenido` y ajusta el formulario si es necesario.
- **Soporte para otros formatos:**
  - Puedes agregar campos nuevos (por ejemplo, para audio, imágenes, links externos) siguiendo la misma lógica.
- **Roles y permisos:**
  - Implementa diferentes vistas y permisos según el rol del usuario (admin, editor, etc.).
- **Internacionalización (i18n):**
  - Prepara los textos y campos para soportar varios idiomas.
- **Métricas y analítica:**
  - Integra paneles de estadísticas de uso y progreso de los usuarios.

---

## Mejoras Sugeridas
- **Editor visual para contenido:**
  - Implementar un editor WYSIWYG para el campo `contenido` (soportando HTML/Markdown).
- **Vista previa en vivo:**
  - Permitir previsualizar cómo se verá el contenido antes de guardar.
- **Gestión de archivos avanzada:**
  - Integrar subida y gestión de archivos multimedia directamente desde el panel.
- **Automatización de tests:**
  - Añadir tests automáticos para asegurar la calidad del flujo de creación y edición.
- **Documentación técnica y de usuario:**
  - Mantener este README actualizado y crear manuales para usuarios finales.

---

## ¿Qué hace falta para mejorarlo?
- Mejorar la experiencia de usuario con feedback visual y validaciones en tiempo real.
- Permitir edición colaborativa o historial de cambios.
- Integrar notificaciones para los administradores.
- Optimizar el rendimiento para grandes volúmenes de tutoriales y partes.

---

**¡Con estos pasos tienes una base sólida, moderna y escalable para la gestión de contenido educativo!**
