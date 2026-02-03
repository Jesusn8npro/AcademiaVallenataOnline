# Plataforma de Academia Vallenata - Documentación Técnica

## Descripción General

Esta plataforma educativa está diseñada para enseñar acordeón vallenato, con un simulador interactivo y una comunidad de apoyo. El sistema está construido con SvelteKit como frontend y Supabase como backend, utilizando PostgreSQL como base de datos.

## Estado Actual del Proyecto

El proyecto se encuentra en fase de desarrollo activo con las siguientes funcionalidades ya implementadas:

- **Panel de Administración**: Interfaz completa para gestión de cursos
- **Autenticación de Usuarios**: Sistema seguro de registro e inicio de sesión
- **Gestión de Cursos**: CRUD completo con editor avanzado
- **Almacenamiento de Imágenes**: Integración con Supabase Storage
- **Diseño Responsivo**: Interfaz adaptable a dispositivos móviles y desktop

## Tecnologías Implementadas

### Frontend
- **SvelteKit**: Framework principal para el desarrollo de la aplicación
- **TypeScript**: Tipado estático para mayor robustez del código
- **Tailwind CSS**: Framework de utilidades CSS para el diseño de la interfaz
- **Svelte Stores**: Gestión de estado de la aplicación
- **Svelte Transitions**: Animaciones fluidas entre estados

### Backend
- **Supabase**: Plataforma Backend-as-a-Service
  - **PostgreSQL**: Base de datos relacional
  - **Row Level Security (RLS)**: Políticas de seguridad a nivel de fila
  - **Autenticación**: Sistema integrado de autenticación y autorización
  - **Storage**: Almacenamiento de archivos e imágenes
  - **Funciones RPC**: Procedimientos remotos para lógica de negocio

### Herramientas de Desarrollo
- **Vite**: Servidor de desarrollo ultrarrápido
- **ESLint**: Análisis estático de código
- **Prettier**: Formateo consistente del código
- **PostCSS**: Procesamiento avanzado de CSS

## Estructura de la Base de Datos

### Autenticación y Usuarios

- **Perfiles (`profiles`)**: Tabla vinculada a `auth.users` que almacena la información del perfil de usuario.
  - Contiene datos como nombre, apellido, apodo, avatar, biografía, fecha de nacimiento, ciudad, país
  - Define roles de usuario: estudiante, profesor, admin
  - Incluye nivel de habilidad (principiante, intermedio, avanzado) e instrumento principal
  - Implementa políticas RLS para que los usuarios solo puedan editar su propio perfil

### Sistema de Cursos

- **Cursos (`cursos`)**: Catálogo de cursos disponibles
  - Atributos: título, descripción, imagen, nivel, precio, duración, requisitos, objetivos
  - Estados: borrador, publicado, archivado
  - Tipos de acceso: gratuito, pago, premium
  - Vinculado a un instructor (profesor)
  - Manejo de slugs para URLs amigables
  - Contador de estudiantes inscritos

- **Módulos (`modulos`)**: Secciones dentro de un curso
  - Organizados por orden secuencial dentro del curso
  - Cada módulo pertenece a un curso específico
  - Sistema de arrastrar y soltar para reordenamiento

- **Lecciones (`lecciones`)**: Contenido educativo dentro de los módulos
  - Tipos: video, texto, quiz, práctica, simulador
  - Atributos: título, descripción, duración, contenido o URL del contenido
  - Algunas lecciones pueden ser gratuitas como muestra
  - Organizadas por orden secuencial dentro del módulo

### Sistema de Progreso

- **Inscripciones (`inscripciones_curso`)**: Registro de estudiantes en cursos
  - Vincula usuarios con cursos
  - Estados: activo, completado, abandonado, pendiente
  - Seguimiento del porcentaje completado y fechas de actividad

- **Progreso de Lecciones (`progreso_lecciones`)**: Seguimiento detallado del avance
  - Registro por cada lección que el usuario completa
  - Estados: no_iniciada, en_progreso, completada
  - Almacena calificaciones para quiz/prácticas
  - Permite al usuario guardar notas personales

### Almacenamiento

- **Buckets de Supabase Storage**:
  - `avatars`: Imágenes de perfil de usuarios
  - `cursos`: Imágenes y recursos para cursos
  - `imagenes`: Recursos generales para la plataforma
  - Políticas RLS específicas para cada bucket

## Seguridad y Permisos (RLS)

Las políticas de seguridad a nivel de fila (RLS) implementadas permiten:

1. **Visualización de Cursos**:
   - Cursos publicados visibles para todos los usuarios (incluso no registrados)
   - Cursos no publicados visibles para sus instructores y administradores
   - Estudiantes pueden ver cursos en los que están inscritos aunque no estén publicados

2. **Gestión de Contenido**:
   - Administradores pueden gestionar todos los cursos, módulos y lecciones
   - Instructores pueden gestionar solo sus propios cursos, módulos y lecciones
   - Estudiantes solo pueden visualizar contenido, no modificarlo

3. **Progreso y Perfil**:
   - Usuarios pueden ver y actualizar solo su propio perfil
   - Estudiantes pueden ver solo su propio progreso
   - Instructores pueden ver el progreso de los estudiantes en sus cursos
   - Automáticamente se actualiza la fecha de última actividad al interactuar con una lección

4. **Almacenamiento**:
   - Políticas para `avatars`: Usuario solo puede gestionar sus propias imágenes de perfil
   - Políticas para `cursos`: Instructores y admins pueden gestionar recursos de sus cursos
   - Políticas para `imagenes`: Acceso público para lectura, restricciones para escritura

## Características Implementadas

### Panel de Administración de Cursos

- **Editor de Cursos Avanzado**:
  - Tarjetas modernas y elegantes para visualización de cursos
  - Sistema completo de filtros (estado, nivel, búsqueda por texto)
  - Visualización de métricas (estudiantes, módulos, lecciones)
  - Manejo optimizado de imágenes con fallbacks automáticos
  - Animaciones y efectos hover para mejor experiencia de usuario
  - Diseño grid responsivo (3 columnas en desktop, 1-2 en móvil)
  - Botones de acción (editar, ver detalles)

- **Gestión de Almacenamiento**:
  - Interfaz para verificación y creación de buckets
  - Herramientas de diagnóstico para políticas de acceso
  - Sistema de prueba para carga de imágenes
  - Integración con permisos administrativos

### Autenticación y Perfiles

- **Sistema de Registro e Inicio de Sesión**:
  - Múltiples métodos de autenticación (email/password, OAuth)
  - Verificación de correo electrónico
  - Recuperación de contraseñas

- **Perfiles de Usuario**:
  - Edición de información personal
  - Carga de avatar con vista previa
  - Configuración de preferencias

### Editor de Contenido

- **Gestión de Módulos**:
  - Interfaz drag-and-drop para ordenar módulos
  - Creación, edición y eliminación

- **Gestión de Lecciones**:
  - Múltiples tipos de contenido
  - Editor rico para contenido textual
  - Carga de videos y recursos

## Características Técnicas

1. **Triggers Automáticos**:
   - Creación automática de perfil al registrarse un nuevo usuario
   - Actualización automática de campos `updated_at` al modificar registros
   - Actualización de la fecha de última actividad en inscripciones cuando se actualiza el progreso

2. **Storage para Contenido**:
   - Buckets específicos para diferentes tipos de contenido
   - Políticas RLS que permiten a usuarios gestionar solo sus propios recursos
   - Sistema de fallback para imágenes no disponibles
   - Validación de tipos de archivo y tamaños

3. **Mejoras de Rendimiento**:
   - Índices en campos clave como email en profiles
   - Carga lazy de imágenes
   - Restricciones de unicidad para evitar duplicados
   - Optimización de consultas a la base de datos

4. **Experiencia de Usuario**:
   - Animaciones de transición fluidas
   - Feedback visual para acciones del usuario
   - Manejo de estados de carga y error
   - Diseño accesible y responsivo

## Flujo de Usuario

1. **Registro e Inicio de Sesión**:
   - Usuarios pueden registrarse con email/contraseña o mediante proveedores OAuth
   - Al registrarse, se crea automáticamente un perfil con rol "estudiante"
   - Sistema de recuperación de contraseña

2. **Exploración de Cursos**:
   - Catálogo de cursos disponibles con filtros avanzados
   - Vista previa de lecciones gratuitas
   - Información detallada de cada curso (instructor, nivel, duración)

3. **Inscripción y Aprendizaje**:
   - Usuarios pueden inscribirse en cursos (gratis o mediante pago)
   - Progreso secuencial a través de módulos y lecciones
   - Seguimiento automático del avance

4. **Panel de Administración** (para instructores y admins):
   - Creación y gestión de cursos
   - Análisis de participación de estudiantes
   - Herramientas de configuración avanzada

## Roadmap de Desarrollo

- [x] Sistema de autenticación completo
- [x] Panel de administración de cursos
- [x] Editor de cursos con gestión de imágenes
- [x] Sistema de almacenamiento con políticas de seguridad
- [ ] Implementación del simulador interactivo de acordeón
- [ ] Sistema de pagos para cursos premium
- [ ] Foros y comunidad para estudiantes
- [ ] Sistema de mensajería entre estudiantes e instructores
- [ ] Analíticas avanzadas y reportes de progreso
- [ ] Aplicación móvil complementaria

## Despliegue y Configuración

### Requisitos

- Node.js 16+
- Cuenta en Supabase
- Variables de entorno configuradas:
  - `VITE_SUPABASE_URL`: URL de tu proyecto Supabase
  - `VITE_SUPABASE_ANON_KEY`: Clave anónima para cliente
  - `VITE_SUPABASE_SERVICE_KEY`: Clave de servicio para operaciones administrativas

### Desarrollo Local

1. Clonar el repositorio
2. Instalar dependencias:
   ```
   npm install
   ```
3. Configurar archivo `.env` con las credenciales de Supabase
4. Iniciar servidor de desarrollo:
   ```
   npm run dev
   ```

### Despliegue en Producción

1. Construir la aplicación:
   ```
   npm run build
   ```
2. Desplegar en Vercel, Netlify o similar
3. Configurar variables de entorno en plataforma de despliegue

## Convenciones de Desarrollo

- **Nomenclatura**: camelCase para variables y funciones, PascalCase para componentes
- **Estructura de Archivos**: Organización por funcionalidad
- **Componentes**: Diseño modular con componentes reutilizables
- **Estilos**: Tailwind CSS con extensiones personalizadas cuando sea necesario
- **TypeScript**: Uso de interfaces y tipos para mejor mantenibilidad
- **Comentarios**: Documentación clara para funciones complejas

## Contacto y Contribuciones

El proyecto está siendo desarrollado activamente. Para contribuciones o consultas, por favor contactar al equipo de desarrollo.

---

*Última actualización: Abril 2025*

## Actualización del esquema de base de datos

Para aplicar los últimos cambios al esquema de base de datos en Supabase, ejecuta:

```bash
# Instalar dependencias si no están instaladas
npm install

# Ejecutar script de actualización
node scripts/updates/update_supabase_schema.js
```

### Cambios recientes en el esquema

- **Fecha expiración de ofertas**: Se agregó el campo `fecha_expiracion` (tipo TIMESTAMPTZ) a la tabla `cursos` para controlar cuándo expiran las ofertas especiales.
- **Contador de estudiantes**: Se agregó el campo `estudiantes_inscritos` a la tabla `cursos` para mostrar la cantidad de estudiantes en un curso.

## Características principales

- **Cursos completos** con módulos y lecciones organizados
- **Plantillas visuales** diferentes para la presentación de cursos
- **Sistema de inscripción** a cursos gratuitos y de pago
- **Seguimiento de progreso** del estudiante
- **Perfiles de usuario** con preferencias personalizadas

## Cómo ejecutar el proyecto

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar build de producción
npm run preview
```

## Estructura de directorios

- **src/lib/components**: Componentes reutilizables
- **src/lib/plantillas**: Plantillas visuales para cursos
- **src/lib/services**: Servicios de API y lógica de negocio
- **src/routes**: Páginas y rutas de la aplicación
- **static**: Archivos estáticos (imágenes, etc.)

## Tecnologías utilizadas

- SvelteKit
- TailwindCSS
- Supabase (Auth, Database, Storage)
- TypeScript
