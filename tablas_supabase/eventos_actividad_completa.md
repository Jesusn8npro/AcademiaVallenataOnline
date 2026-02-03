# 📋 TABLA: eventos_actividad

## 🎯 **PROPÓSITO**
Registro detallado de todos los eventos y acciones de usuarios para analytics y seguimiento.

---

## 📋 **ESTRUCTURA COMPLETA**

| **Columna** | **Tipo** | **Nulo** | **Defecto** | **Descripción** |
|-------------|----------|----------|-------------|-----------------|
| `id` | uuid | NO | gen_random_uuid() | ID único del evento |
| `usuario_id` | uuid | YES | null | FK → perfiles.id |
| `tipo_evento` | text | NO | null | **Tipo de evento** (navegacion, login, etc.) |
| `pagina` | text | YES | null | **Página donde ocurrió el evento** |
| `detalles` | jsonb | YES | null | **Información adicional del evento** |
| `timestamp_evento` | timestamptz | YES | now() | **Momento exacto del evento** |
| `duracion_minutos` | integer | YES | 1 | **Duración del evento en minutos** |

---

## 🔑 **TIPOS DE EVENTOS**

### **📊 NAVEGACIÓN:**
- `tipo_evento = 'navegacion'`
- `pagina` = Ruta visitada
- `detalles` = { dispositivo, timestamp, rol }

### **🔐 AUTENTICACIÓN:**
- `tipo_evento = 'login'` | `'logout'` | `'registro'`
- `pagina` = Página de origen/destino
- `detalles` = { metodo_auth, dispositivo }

### **🎓 ACTIVIDAD ACADÉMICA:**
- `tipo_evento = 'leccion_completada'` | `'curso_iniciado'` | `'simulador_usado'`
- `pagina` = Contexto del curso/lección
- `detalles` = { curso_id, progreso, puntuacion }

### **💬 INTERACCIONES:**
- `tipo_evento = 'comentario'` | `'like'` | `'mensaje'`
- `pagina` = Contexto de la interacción
- `detalles` = { contenido_id, tipo_interaccion }

---

## 🔧 **OPERACIONES PRINCIPALES**

### **📝 REGISTRAR EVENTO DE NAVEGACIÓN:**
```sql
INSERT INTO eventos_actividad (
    usuario_id,
    tipo_evento,
    pagina,
    detalles,
    duracion_minutos
) VALUES (
    'user-uuid',
    'navegacion',
    '/panel-estudiante',
    '{
        "timestamp": "2025-07-31T00:37:05.922Z",
        "dispositivo": "web",
        "rol": "estudiante"
    }',
    1
);
```

### **🔍 CONSULTAR ACTIVIDAD RECIENTE:**
```sql
SELECT 
    e.usuario_id,
    e.tipo_evento,
    e.pagina,
    e.timestamp_evento,
    e.duracion_minutos,
    p.nombre,
    p.apellido
FROM eventos_actividad e
JOIN perfiles p ON e.usuario_id = p.id
WHERE e.timestamp_evento >= NOW() - INTERVAL '1 hour'
    AND e.tipo_evento = 'navegacion'
ORDER BY e.timestamp_evento DESC;
```

### **📊 ESTADÍSTICAS DE USO:**
```sql
-- Páginas más visitadas
SELECT 
    pagina,
    COUNT(*) as visitas,
    COUNT(DISTINCT usuario_id) as usuarios_unicos
FROM eventos_actividad
WHERE tipo_evento = 'navegacion'
    AND timestamp_evento >= NOW() - INTERVAL '7 days'
GROUP BY pagina
ORDER BY visitas DESC;

-- Usuarios más activos
SELECT 
    usuario_id,
    COUNT(*) as total_eventos,
    COUNT(CASE WHEN tipo_evento = 'navegacion' THEN 1 END) as navegaciones,
    MAX(timestamp_evento) as ultima_actividad
FROM eventos_actividad
WHERE timestamp_evento >= NOW() - INTERVAL '24 hours'
GROUP BY usuario_id
ORDER BY total_eventos DESC;
```

---

## 🎯 **EJEMPLOS DE DETALLES (JSONB)**

### **📱 NAVEGACIÓN:**
```json
{
    "timestamp": "2025-07-31T00:37:05.922Z",
    "dispositivo": "web",
    "rol": "estudiante",
    "referrer": "/cursos",
    "user_agent": "Mozilla/5.0..."
}
```

### **🎓 CURSO COMPLETADO:**
```json
{
    "curso_id": "uuid-del-curso",
    "progreso_anterior": 85,
    "progreso_nuevo": 100,
    "puntuacion": 95,
    "tiempo_total": 45
}
```

### **🎮 SIMULADOR USADO:**
```json
{
    "simulador_tipo": "acordeon",
    "cancion_id": "uuid-cancion",
    "puntuacion": 850,
    "nivel_dificultad": "intermedio",
    "errores": 3
}
```

---

## 🔗 **RELACIONES**

### **FOREIGN KEYS:**
- `usuario_id` → `perfiles.id`

### **ÍNDICES SUGERIDOS:**
```sql
CREATE INDEX idx_eventos_usuario_timestamp 
ON eventos_actividad(usuario_id, timestamp_evento DESC);

CREATE INDEX idx_eventos_tipo_timestamp 
ON eventos_actividad(tipo_evento, timestamp_evento DESC);

CREATE INDEX idx_eventos_pagina 
ON eventos_actividad(pagina, timestamp_evento DESC);

-- Índice para consultas JSONB
CREATE INDEX idx_eventos_detalles_gin 
ON eventos_actividad USING GIN (detalles);
```

---

## 🚀 **USO EN PANEL ADMINISTRACIÓN**

### **✅ FEED DE ACTIVIDAD:**
1. Consulta eventos recientes por `timestamp_evento`
2. Filtra por `tipo_evento = 'navegacion'`
3. Join con `perfiles` para datos del usuario
4. Muestra actividad en tiempo real

### **✅ ANALYTICS:**
1. Páginas más visitadas
2. Patrones de navegación
3. Tiempo promedio por página
4. Usuarios más activos

### **✅ DEBUGGING:**
1. Rastrear errores por usuario
2. Secuencia de eventos antes de errores
3. Patrones de uso problemáticos

---

## 📊 **CONSULTAS ÚTILES**

### **🔍 ACTIVIDAD POR USUARIO:**
```sql
SELECT 
    DATE(timestamp_evento) as fecha,
    COUNT(*) as eventos_totales,
    COUNT(DISTINCT pagina) as paginas_visitadas,
    SUM(duracion_minutos) as tiempo_total
FROM eventos_actividad
WHERE usuario_id = 'user-uuid'
    AND timestamp_evento >= NOW() - INTERVAL '30 days'
GROUP BY DATE(timestamp_evento)
ORDER BY fecha DESC;
```

### **📈 TENDENCIAS DE USO:**
```sql
SELECT 
    DATE_TRUNC('hour', timestamp_evento) as hora,
    COUNT(*) as eventos,
    COUNT(DISTINCT usuario_id) as usuarios_activos
FROM eventos_actividad
WHERE timestamp_evento >= NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', timestamp_evento)
ORDER BY hora;
```

---

## 📝 **NOTAS IMPORTANTES**

✅ **JSONB FLEXIBLE:** `detalles` permite almacenar cualquier información adicional
🔍 **ÍNDICES GIN:** Para consultas eficientes en campos JSONB
📊 **ANALYTICS:** Base para dashboard de métricas y estadísticas
🎯 **TIEMPO REAL:** `timestamp_evento` con timezone para tracking preciso
🔄 **ESCALABLE:** Diseñado para manejar gran volumen de eventos
⚡ **PERFORMANCE:** Índices optimizados para consultas frecuentes 