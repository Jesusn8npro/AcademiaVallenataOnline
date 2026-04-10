# Funcionamiento del Ranking de la Comunidad

## ¿Qué es el Ranking de la Comunidad?
El Ranking de la Comunidad es un sistema visual y dinámico que muestra a los usuarios más activos y destacados dentro de la plataforma. Su objetivo es incentivar la participación, la sana competencia y el sentido de logro entre los miembros.

---

## ¿Dónde se muestra?
- **Página de Publicaciones**: En la columna lateral derecha o izquierda.
- **Página de Comunidad**: En el panel lateral, siempre visible para motivar la interacción.
- **Otros lugares**: Puede ser reutilizado en cualquier sección donde se quiera resaltar la actividad de los usuarios.

---

## ¿Cómo funciona técnicamente?

### 1. **Componente principal**
El ranking está implementado en el componente Svelte:
```
$lib/components/Banners/RankingComunidad.svelte
```

### 2. **Obtención de datos**
- El componente consulta la base de datos (usualmente la tabla `perfiles` o una tabla de ranking/estadísticas) usando Supabase.
- Se obtienen los usuarios ordenados por un campo de "puntos" o "actividad" (ej: `puntos_comunidad`, `publicaciones`, `likes`, etc).
- Se limita el resultado a los 5 o 10 primeros puestos para mostrar solo a los más destacados.

### 3. **Visualización**
- Se muestra una tarjeta visual con fondo degradado oscuro y bordes dorados.
- Cada usuario del ranking aparece con:
  - Su posición (#1, #2, ...)
  - Avatar/foto de perfil
  - Nombre o alias
  - Puntos obtenidos
- El primer puesto suele estar resaltado con un color especial o un icono de trofeo.
- Hay un botón para ver más posiciones o abrir el ranking completo.

### 4. **Estilos y experiencia de usuario**
- El diseño utiliza gradientes, bordes dorados y sombras para destacar el bloque.
- Es responsivo y se adapta a diferentes tamaños de pantalla.
- El componente es autónomo: recibe props o consulta los datos automáticamente.

---

## Ejemplo de lógica de consulta en Svelte
```js
// Ejemplo simplificado
import { supabase } from '$lib/supabase/clienteSupabase';
let ranking = [];

onMount(async () => {
  const { data } = await supabase
    .from('perfiles')
    .select('id, nombre, url_foto_perfil, puntos_comunidad')
    .order('puntos_comunidad', { ascending: false })
    .limit(5);
  ranking = data || [];
});
```

---

## Personalización y expansión
- Puedes cambiar el criterio de ranking (por publicaciones, comentarios, logros, etc).
- Puedes mostrar más posiciones, filtrar por mes, semana, etc.
- El componente permite ser reutilizado en cualquier parte de la plataforma.

---

## Resumen visual
- **RankingComunidad.svelte** es el núcleo visual y funcional.
- Consulta Supabase para obtener los usuarios top.
- Presenta el ranking con estilos llamativos y experiencia de usuario motivadora.
- Es fácil de integrar y escalar.

---

¿Dudas o necesitas ejemplos de código más detallados? ¡Solo pídelo!
