# README Comunidad

## Índice
1. [Introducción](#introducción)
2. [Estructura general y lógica](#estructura-general-y-lógica)
3. [Publicaciones: lógica y flujo](#publicaciones-lógica-y-flujo)
4. [Comentarios: lógica y flujo](#comentarios-lógica-y-flujo)
5. [Conexión con Supabase](#conexión-con-supabase)
6. [Tipos de datos y tablas](#tipos-de-datos-y-tablas)
7. [UX y mejoras implementadas](#ux-y-mejoras-implementadas)
8. [Notas y próximos pasos](#notas-y-próximos-pasos)

---

## Introducción
Este documento explica en detalle cómo funciona la lógica de la sección de comunidad de la plataforma, especialmente la página de publicaciones y comentarios, la integración con Supabase, la estructura de los datos y las mejoras de experiencia de usuario implementadas.

---

## Estructura general y lógica
- **Componentes principales:**
  - `FeedPublicaciones.svelte`: Muestra cada publicación, sus botones de interacción y la caja de comentarios.
  - `ComunidadComentarios.svelte`: Gestiona la visualización y lógica de los comentarios por publicación.
  - `+page.svelte` (en rutas `/publicaciones` y `/comunidad`): Orquestan la obtención y despliegue de publicaciones usando los componentes anteriores.
- **Estado:**
  - Cada publicación tiene su propio estado de likes, comentarios y compartidos.
  - El estado de mostrar/ocultar comentarios es local a cada publicación.

---

## Publicaciones: lógica y flujo
- **Carga de publicaciones:**
  - Se obtienen desde la tabla `comunidad_publicaciones` en Supabase.
  - Cada publicación muestra: usuario, fecha, contenido, imagen/video/gif (si aplica), likes, número de comentarios y compartidos.
- **Likes:**
  - Se almacena un array de IDs de usuario que dieron like. El usuario puede dar/quitar like y la UI se actualiza de forma optimista.
- **Contador de comentarios:**
  - Siempre muestra el número real de comentarios consultando Supabase, no solo los del usuario actual.
- **Botones de acción:**
  - Me gusta, Comentar (abre comentarios y enfoca el input), Compartir.

---

## Comentarios: lógica y flujo
- **Carga y visualización:**
  - Los comentarios se obtienen de la tabla `comunidad_comentarios` filtrando por el ID de la publicación.
  - Se muestran en orden cronológico.
  - Al hacer clic en "Comentar" o "Ver comentarios", se carga la lista actualizada desde Supabase.
- **Agregar comentario:**
  - El usuario escribe y envía un comentario. Se inserta en Supabase y se recarga la lista.
  - El input se limpia tras enviar y se mantiene enfocado para seguir escribiendo si el usuario desea.
- **Likes en comentarios:**
  - Cada comentario puede recibir likes, almacenados en la tabla `comunidad_comentarios_likes`.
  - Se muestra el conteo y si el usuario actual ya dio like.

---

## Conexión con Supabase
- **Cliente:**
  - Se utiliza el cliente oficial de Supabase para Svelte/JS.
- **Operaciones principales:**
  - `select`: Para obtener publicaciones y comentarios.
  - `insert`: Para agregar nuevos comentarios y likes.
  - `update`: Para actualizar likes en publicaciones.
  - `delete`: Para quitar likes de comentarios.
- **Consultas reactivas:**
  - El contador de comentarios y la lista se actualizan cada vez que el usuario interactúa o abre la sección de comentarios.

---

## Tipos de datos y tablas
- **comunidad_publicaciones**
  - `id`: string
  - `usuario_id`: string
  - `usuario_nombre`: string
  - `usuario_avatar`: string
  - `contenido`: string
  - `url_imagen`, `url_video`, `url_gif`: string (opcional)
  - `me_gusta`: array de strings (IDs de usuario)
  - `fecha_creacion`: timestamp
- **comunidad_comentarios**
  - `id`: string
  - `publicacion_id`: string
  - `usuario_id`: string
  - `usuario_nombre`: string
  - `usuario_avatar`: string
  - `comentario`: string
  - `fecha_creacion`: timestamp
- **comunidad_comentarios_likes**
  - `comentario_id`: string
  - `usuario_id`: string

---

## UX y mejoras implementadas
- **Autoenfoque del input de comentario:**
  - Al hacer clic en "Comentar", el campo para escribir comentario se enfoca automáticamente.
- **Recarga reactiva de comentarios:**
  - Cada vez que se abre la sección de comentarios, se consulta Supabase para mostrar la lista más actual.
- **Contador de comentarios en tiempo real:**
  - Siempre refleja el número real de comentarios en la base de datos.
- **Optimización visual:**
  - Los botones muestran estados activos, deshabilitados y animaciones sutiles para mejor feedback.

---

## Notas y próximos pasos
- **Lints y tipos:**
  - Hay algunos warnings menores de tipos y estilos no usados, que pueden corregirse para mayor limpieza del código.
- **Escalabilidad:**
  - El sistema está preparado para agregar más funcionalidades como respuestas a comentarios, notificaciones, etc.
- **Seguridad:**
  - Se recomienda validar en backend los permisos de usuario antes de permitir acciones sensibles.

---

**Este documento se irá actualizando conforme se agreguen nuevas funcionalidades o se realicen cambios importantes en la lógica de la comunidad.**

---

*Última actualización: 17 de junio de 2025*
