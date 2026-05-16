-- Sistema de cupones de descuento
CREATE TABLE IF NOT EXISTS cupones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('porcentaje', 'fijo')),
  valor NUMERIC NOT NULL CHECK (valor > 0),
  valor_minimo NUMERIC DEFAULT 0,
  usos_maximos INTEGER,
  usos_actuales INTEGER DEFAULT 0,
  fecha_expiracion TIMESTAMPTZ,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar cupones
CREATE POLICY "admin_cupones_full" ON cupones
  USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));

-- Service role puede validar y actualizar usos (desde edge function)
CREATE POLICY "service_cupones_update" ON cupones
  FOR UPDATE USING (auth.role() = 'service_role');

-- Registro de usos para trazabilidad
CREATE TABLE IF NOT EXISTS cupones_uso (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cupon_id UUID REFERENCES cupones(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES perfiles(id) ON DELETE SET NULL,
  descuento_aplicado NUMERIC NOT NULL,
  referencia TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cupones_uso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_cupones_uso" ON cupones_uso
  USING (EXISTS (SELECT 1 FROM perfiles WHERE id = auth.uid() AND rol = 'admin'));
