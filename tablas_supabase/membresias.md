# Tabla: membresias

## Estructura de la tabla

```sql
CREATE TABLE IF NOT EXISTS membresias (
    id TEXT PRIMARY KEY DEFAULT 'basico' || '_' || extract(epoch from now())::text,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_mensual INTEGER NOT NULL, -- En pesos colombianos (centavos)
    precio_anual INTEGER, -- Precio anual (con descuento)
    precio_usd_mensual DECIMAL(10,2), -- Para pagos internacionales
    precio_usd_anual DECIMAL(10,2),
    caracteristicas JSONB DEFAULT '[]'::jsonb,
    activa BOOLEAN DEFAULT true,
    popular BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    limite_cursos INTEGER, -- NULL = ilimitado
    limite_tutoriales INTEGER, -- NULL = ilimitado
    soporte_prioritario BOOLEAN DEFAULT false,
    mentoria_incluida BOOLEAN DEFAULT false,
    clases_en_vivo INTEGER DEFAULT 0, -- Clases en vivo por mes
    certificados_avanzados BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Datos de ejemplo para insertar

```sql
-- Limpiar datos existentes (opcional)
DELETE FROM membresias;

-- Insertar planes de membresía
INSERT INTO membresias (
    id, 
    nombre, 
    descripcion, 
    precio_mensual, 
    precio_anual, 
    caracteristicas, 
    activa, 
    popular, 
    orden,
    limite_cursos,
    limite_tutoriales,
    soporte_prioritario,
    mentoria_incluida,
    clases_en_vivo,
    certificados_avanzados
) VALUES 
(
    'basico',
    'Plan Básico',
    'Perfecto para empezar tu journey musical',
    29900, -- $29.900 COP
    299000, -- $299.000 COP anual (ahorro de ~$59.800)
    '[
        "Acceso a 5 cursos básicos",
        "20 tutoriales exclusivos",
        "Soporte por chat",
        "Comunidad de estudiantes",
        "Certificados de finalización"
    ]'::jsonb,
    true,
    false,
    1,
    5, -- Límite de 5 cursos
    20, -- Límite de 20 tutoriales
    false,
    false,
    0, -- Sin clases en vivo
    false
),
(
    'intermedio',
    'Plan Intermedio',
    'La opción más elegida por nuestros estudiantes',
    49900, -- $49.900 COP
    499000, -- $499.000 COP anual (ahorro de ~$99.800)
    '[
        "Acceso a TODOS los cursos",
        "+100 tutoriales exclusivos",
        "Soporte prioritario 24/7",
        "Comunidad VIP",
        "Certificados avanzados",
        "2 clases en vivo al mes",
        "Simulador gaming premium"
    ]'::jsonb,
    true,
    true, -- Plan más popular
    2,
    NULL, -- Ilimitado
    NULL, -- Ilimitado
    true,
    false,
    2, -- 2 clases en vivo por mes
    true
),
(
    'premium',
    'Plan Premium',
    'Para músicos serios que quieren dominar completamente',
    79900, -- $79.900 COP
    799000, -- $799.000 COP anual (ahorro de ~$159.800)
    '[
        "TODO del Plan Intermedio",
        "Mentoría 1:1 con Jesús González",
        "Clases privadas mensuales",
        "Acceso anticipado a contenido",
        "Análisis personalizado de progreso",
        "Grabaciones exclusivas",
        "Feedback directo en tus videos",
        "Certificación profesional"
    ]'::jsonb,
    true,
    false,
    3,
    NULL, -- Ilimitado
    NULL, -- Ilimitado
    true,
    true, -- Incluye mentoría
    4, -- 4 clases en vivo por mes
    true
);
```

## Índices recomendados

```sql
-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_membresias_activa ON membresias(activa);
CREATE INDEX IF NOT EXISTS idx_membresias_popular ON membresias(popular);
CREATE INDEX IF NOT EXISTS idx_membresias_orden ON membresias(orden);
```

## Políticas RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE membresias ENABLE ROW LEVEL SECURITY;

-- Política para lectura pública (cualquiera puede ver membresías activas)
CREATE POLICY "Membresías públicas para lectura" ON membresias
    FOR SELECT USING (activa = true);

-- Política para administradores (pueden hacer todo)
CREATE POLICY "Administradores pueden gestionar membresías" ON membresias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol = 'administrador'
        )
    );
```

## Tabla relacionada: suscripciones_membresias

```sql
CREATE TABLE IF NOT EXISTS suscripciones_membresias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    membresia_id TEXT NOT NULL REFERENCES membresias(id),
    estado TEXT NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'cancelada', 'expirada')),
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_fin TIMESTAMP WITH TIME ZONE,
    fecha_proximo_pago TIMESTAMP WITH TIME ZONE,
    es_anual BOOLEAN DEFAULT false,
    precio_pagado INTEGER NOT NULL,
    metodo_pago TEXT,
    ref_pago TEXT, -- Referencia del pago (ePayco, etc.)
    renovacion_automatica BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario ON suscripciones_membresias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON suscripciones_membresias(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_membresia ON suscripciones_membresias(membresia_id);

-- RLS para suscripciones
ALTER TABLE suscripciones_membresias ENABLE ROW LEVEL SECURITY;

-- Los usuarios solo pueden ver sus propias suscripciones
CREATE POLICY "Usuarios ven sus suscripciones" ON suscripciones_membresias
    FOR SELECT USING (usuario_id = auth.uid());

-- Los administradores pueden ver todas
CREATE POLICY "Administradores ven todas las suscripciones" ON suscripciones_membresias
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM usuarios 
            WHERE usuarios.id = auth.uid() 
            AND usuarios.rol = 'administrador'
        )
    );
```

## Funciones útiles

```sql
-- Función para obtener la membresía activa de un usuario
CREATE OR REPLACE FUNCTION obtener_membresia_activa(usuario_uuid UUID)
RETURNS TABLE (
    membresia_id TEXT,
    nombre TEXT,
    estado TEXT,
    fecha_fin TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sm.membresia_id,
        m.nombre,
        sm.estado,
        sm.fecha_fin
    FROM suscripciones_membresias sm
    JOIN membresias m ON sm.membresia_id = m.id
    WHERE sm.usuario_id = usuario_uuid 
    AND sm.estado = 'activa'
    AND (sm.fecha_fin IS NULL OR sm.fecha_fin > NOW())
    ORDER BY sm.created_at DESC
    LIMIT 1;
END;
$$;
```

## Notas importantes

1. **Precios**: Los precios están en pesos colombianos (enteros, sin decimales)
2. **Características**: Se almacenan como JSONB para flexibilidad
3. **RLS**: Las políticas aseguran que solo administradores puedan modificar
4. **Suscripciones**: Tabla separada para manejar el estado de cada usuario
5. **Renovación**: Sistema preparado para renovación automática