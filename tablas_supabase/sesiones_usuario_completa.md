# 📊 TABLA: sesiones_usuario

## 🎯 **PROPÓSITO**
Registro completo de sesiones activas y tracking de actividad de usuarios en tiempo real.

---

## 📋 **ESTRUCTURA COMPLETA**

| **Columna** | **Tipo** | **Nulo** | **Defecto** | **Descripción** |
|-------------|----------|----------|-------------|-----------------|
| `id` | uuid | NO | gen_random_uuid() | ID único de la sesión |
| `usuario_id` | uuid | YES | null | FK → perfiles.id |
| `fecha` | date | YES | CURRENT_DATE | Fecha de la sesión |
| `tiempo_total_minutos` | integer | YES | 0 | Tiempo total acumulado |
| `sesiones_totales` | integer | YES | 0 | Contador de sesiones |
| `ultima_actividad` | timestamptz | YES | now() | **Último timestamp de actividad** |
| `pagina_actual` | text | YES | null | **Página donde está el usuario** |
| `esta_activo` | boolean | YES | true | **Estado activo/inactivo** |
| `tiempo_sesion_actual` | integer | YES | 0 | Minutos de sesión actual |
| `created_at` | timestamptz | YES | now() | Fecha de creación |
| `updated_at` | timestamptz | YES | now() | Última actualización |

---

## 🔑 **COLUMNAS CLAVE PARA PANEL ADMIN**

### **🎯 TRACKING EN TIEMPO REAL:**
- **`ultima_actividad`** → Detectar usuarios activos
- **`pagina_actual`** → Saber en qué página está
- **`esta_activo`** → Estado booleano de actividad
- **`tiempo_sesion_actual`** → Duración sesión actual

### **📊 MÉTRICAS ACUMULADAS:**
- **`tiempo_total_minutos`** → Tiempo total en plataforma
- **`sesiones_totales`** → Número de sesiones
- **`fecha`** → Agrupación por día

---

## 🔧 **OPERACIONES PRINCIPALES**

### **📝 CREAR/ACTUALIZAR SESIÓN (UPSERT):**
```sql
INSERT INTO sesiones_usuario (
    usuario_id,
    fecha,
    ultima_actividad,
    pagina_actual,
    esta_activo,
    tiempo_sesion_actual,
    tiempo_total_minutos,
    sesiones_totales,
    updated_at
) VALUES (
    'user-uuid',
    CURRENT_DATE,
    NOW(),
    '/panel-estudiante',
    true,
    1,
    0,
    1,
    NOW()
) ON CONFLICT (usuario_id, fecha) 
DO UPDATE SET
    ultima_actividad = EXCLUDED.ultima_actividad,
    pagina_actual = EXCLUDED.pagina_actual,
    esta_activo = EXCLUDED.esta_activo,
    updated_at = EXCLUDED.updated_at;
```

### **🔍 CONSULTAR USUARIOS ACTIVOS:**
```sql
SELECT 
    s.usuario_id,
    s.ultima_actividad,
    s.pagina_actual,
    s.esta_activo,
    s.tiempo_sesion_actual,
    s.tiempo_total_minutos,
    p.nombre,
    p.apellido,
    p.url_foto_perfil
FROM sesiones_usuario s
JOIN perfiles p ON s.usuario_id = p.id
WHERE s.esta_activo = true
    AND s.ultima_actividad >= NOW() - INTERVAL '2 hours'
ORDER BY s.ultima_actividad DESC;
```

### **📊 TOP ALUMNOS ACTIVOS:**
```sql
SELECT 
    s.usuario_id,
    s.ultima_actividad,
    s.tiempo_total_minutos,
    s.sesiones_totales,
    p.nombre,
    p.apellido,
    COUNT(i.id) as cursos_inscritos
FROM sesiones_usuario s
JOIN perfiles p ON s.usuario_id = p.id
LEFT JOIN inscripciones i ON s.usuario_id = i.usuario_id
WHERE p.rol = 'estudiante'
    AND s.ultima_actividad >= NOW() - INTERVAL '24 hours'
GROUP BY s.usuario_id, s.ultima_actividad, s.tiempo_total_minutos, s.sesiones_totales, p.nombre, p.apellido
ORDER BY s.esta_activo DESC, s.tiempo_total_minutos DESC;
```

---

## 🎯 **ESTADO DE USUARIOS**

### **🟢 ACTIVO (En línea):**
- `esta_activo = true`
- `ultima_actividad` < 5 minutos

### **🟡 RECIENTE:**
- `esta_activo = true`
- `ultima_actividad` < 30 minutos

### **🔴 INACTIVO:**
- `esta_activo = false` 
- `ultima_actividad` > 30 minutos

---

## 🔗 **RELACIONES**

### **FOREIGN KEYS:**
- `usuario_id` → `perfiles.id`

### **ÍNDICES SUGERIDOS:**
```sql
CREATE INDEX idx_sesiones_usuario_activos 
ON sesiones_usuario(esta_activo, ultima_actividad DESC);

CREATE INDEX idx_sesiones_usuario_fecha 
ON sesiones_usuario(usuario_id, fecha);

CREATE INDEX idx_sesiones_tiempo_real 
ON sesiones_usuario(ultima_actividad DESC, esta_activo);
```

---

## 🚀 **USO EN PANEL ADMINISTRACIÓN**

### **✅ ACTIVIDAD EN TIEMPO REAL:**
1. Consulta `sesiones_usuario` con `esta_activo = true`
2. Join con `perfiles` para datos del usuario
3. Muestra `pagina_actual` formateada
4. Ordena por `ultima_actividad` DESC

### **✅ ALUMNOS MÁS ACTIVOS:**
1. Consulta `sesiones_usuario` últimas 24h
2. Join con `perfiles` y `inscripciones`
3. Calcula métricas de progreso
4. Ordena por actividad + progreso

### **✅ AUTO-ACTUALIZACIÓN:**
- **Cada navegación** → Actualiza `ultima_actividad` y `pagina_actual`
- **Al login** → Crea/actualiza sesión con `esta_activo = true`
- **Tracking continuo** → Mantiene sesión viva

---

## 📝 **NOTAS IMPORTANTES**

⚠️ **CONSTRAINT ÚNICO:** `(usuario_id, fecha)` - Una sesión por usuario por día
✅ **UPSERT SEGURO:** Usa `ON CONFLICT` para evitar duplicados
🔄 **UPDATE AUTOMÁTICO:** `updated_at` se actualiza en cada operación
📊 **MÉTRICAS REALES:** `tiempo_total_minutos` acumula tiempo real
🎯 **TIEMPO REAL:** `ultima_actividad` es clave para tracking live 