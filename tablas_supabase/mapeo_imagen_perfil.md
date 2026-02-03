# 🖼️ Mapeo de Imagen de Perfil - FeedPublicaciones

## Campos de la tabla `perfiles`

Para mostrar correctamente la imagen de perfil del usuario en `FeedPublicaciones.svelte`, usa estos campos:

```sql
-- Tabla: perfiles
SELECT 
  id,
  nombre_completo,
  nombre_usuario,
  url_foto_perfil,    -- ✅ CAMPO PRINCIPAL para imagen de perfil
  correo_electronico
FROM perfiles;
```

## Uso en FeedPublicaciones.svelte

El componente acepta estos props para la imagen de perfil:

```svelte
<FeedPublicaciones
  usuario_id={publicacion.usuario_id}
  usuario_nombre={publicacion.usuario_nombre}
  usuario_avatar={publicacion.usuario_avatar}     <!-- Fallback legacy -->
  url_foto_perfil={publicacion.url_foto_perfil}   <!-- ✅ CAMPO PRINCIPAL -->
  <!-- otros props... -->
/>
```

## Prioridad de imágenes

El componente usa esta prioridad:

1. **`url_foto_perfil`** - Campo principal de la tabla `perfiles`
2. **`usuario_avatar`** - Fallback para compatibilidad
3. **UI Avatars** - Fallback automático con iniciales del usuario

## Query recomendada

```sql
-- Para obtener publicaciones con imagen de perfil correcta:
SELECT 
  cp.*,
  p.url_foto_perfil,
  p.nombre_completo as usuario_nombre,
  p.nombre_usuario
FROM comunidad_publicaciones cp
LEFT JOIN perfiles p ON cp.usuario_id = p.id
ORDER BY cp.fecha_creacion DESC;
```

## Manejo de errores

El componente incluye:
- ✅ Fallback automático si la imagen falla
- ✅ Loading lazy para mejor rendimiento  
- ✅ Logging para debug (se puede remover en producción)

## Ejemplo completo

```javascript
// En el componente padre:
const { data: publicaciones } = await supabase
  .from('comunidad_publicaciones')
  .select(`
    *,
    perfiles!usuario_id (
      url_foto_perfil,
      nombre_completo,
      nombre_usuario
    )
  `)
  .order('fecha_creacion', { ascending: false });

// Mapear datos:
const publicacionesMapeadas = publicaciones.map(pub => ({
  ...pub,
  usuario_nombre: pub.perfiles?.nombre_completo || pub.usuario_nombre,
  url_foto_perfil: pub.perfiles?.url_foto_perfil,
  usuario_slug: pub.perfiles?.nombre_usuario
}));
``` 