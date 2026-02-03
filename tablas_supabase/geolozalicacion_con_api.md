-- 🌍 INSTALACIÓN LIMPIA DEL SISTEMA IPAPI.CO
-- ===============================================
-- Ejecutar TODO este script en Supabase SQL Editor

-- PASO 1: LIMPIAR TODO LO EXISTENTE
-- ===================================

-- Eliminar funciones existentes si existen
DROP FUNCTION IF EXISTS obtener_estadisticas_geograficas() CASCADE;
DROP FUNCTION IF EXISTS upsert_geolocalizacion_usuario(UUID, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS limpiar_geolocalizacion_antigua(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Eliminar triggers
DROP TRIGGER IF EXISTS update_geolocalizacion_updated_at ON geolocalizacion_usuarios CASCADE;

-- Eliminar tabla si existe
DROP TABLE IF EXISTS geolocalizacion_usuarios CASCADE;

-- PASO 2: CREAR SISTEMA NUEVO
-- ============================

-- 1. CREAR TABLA OPTIMIZADA
CREATE TABLE geolocalizacion_usuarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ip INET NOT NULL,
  pais VARCHAR(100) NOT NULL,
  ciudad VARCHAR(100) NOT NULL,
  region VARCHAR(100),
  codigo_postal VARCHAR(20),
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  timezone VARCHAR(50),
  moneda VARCHAR(10),
  idiomas VARCHAR(200),
  proveedor TEXT,
  primera_visita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ultima_visita TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visitas_totales INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. CREAR ÍNDICES
CREATE INDEX idx_geolocalizacion_usuario_id ON geolocalizacion_usuarios(usuario_id);
CREATE INDEX idx_geolocalizacion_ip ON geolocalizacion_usuarios(ip);
CREATE INDEX idx_geolocalizacion_pais ON geolocalizacion_usuarios(pais);
CREATE INDEX idx_geolocalizacion_ciudad ON geolocalizacion_usuarios(ciudad);
CREATE INDEX idx_geolocalizacion_ultima_visita ON geolocalizacion_usuarios(ultima_visita DESC);

-- 3. HABILITAR SEGURIDAD
ALTER TABLE geolocalizacion_usuarios ENABLE ROW LEVEL SECURITY;

-- 4. POLÍTICAS DE SEGURIDAD
CREATE POLICY "Usuarios pueden ver su propia geolocalización"
  ON geolocalizacion_usuarios FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Solo admins pueden ver toda la geolocalización"
  ON geolocalizacion_usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfiles 
      WHERE id = auth.uid() 
      AND (rol = 'admin' OR rol = 'superadmin')
    )
  );

CREATE POLICY "Permitir inserción de geolocalización"
  ON geolocalizacion_usuarios FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Permitir actualización de geolocalización"
  ON geolocalizacion_usuarios FOR UPDATE
  USING (auth.uid() = usuario_id);

-- 5. FUNCIÓN PARA UPSERT
CREATE OR REPLACE FUNCTION upsert_geolocalizacion_usuario(
  p_usuario_id UUID,
  p_ip TEXT,
  p_pais TEXT,
  p_ciudad TEXT,
  p_region TEXT DEFAULT NULL,
  p_latitud DECIMAL DEFAULT NULL,
  p_longitud DECIMAL DEFAULT NULL,
  p_timezone TEXT DEFAULT NULL,
  p_proveedor TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  visitas_count INTEGER;
BEGIN
  -- Intentar actualizar registro existente
  UPDATE geolocalizacion_usuarios 
  SET 
    ip = p_ip::INET,
    pais = p_pais,
    ciudad = p_ciudad,
    region = COALESCE(p_region, region),
    latitud = COALESCE(p_latitud, latitud),
    longitud = COALESCE(p_longitud, longitud),
    timezone = COALESCE(p_timezone, timezone),
    proveedor = COALESCE(p_proveedor, proveedor),
    ultima_visita = NOW(),
    visitas_totales = visitas_totales + 1,
    updated_at = NOW()
  WHERE usuario_id = p_usuario_id;

  -- Si no existe, crear nuevo registro
  IF NOT FOUND THEN
    INSERT INTO geolocalizacion_usuarios (
      usuario_id, ip, pais, ciudad, region, 
      latitud, longitud, timezone, proveedor,
      primera_visita, ultima_visita, visitas_totales
    ) VALUES (
      p_usuario_id, p_ip::INET, p_pais, p_ciudad, p_region,
      p_latitud, p_longitud, p_timezone, p_proveedor,
      NOW(), NOW(), 1
    );
    visitas_count := 1;
  ELSE
    -- Obtener el número actualizado de visitas
    SELECT visitas_totales INTO visitas_count 
    FROM geolocalizacion_usuarios 
    WHERE usuario_id = p_usuario_id;
  END IF;

  RETURN visitas_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNCIÓN PARA ESTADÍSTICAS
CREATE OR REPLACE FUNCTION obtener_estadisticas_geograficas()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_usuarios', COUNT(DISTINCT usuario_id),
    'paises_unicos', COUNT(DISTINCT pais),
    'ciudades_unicas', COUNT(DISTINCT ciudad),
    'total_visitas', SUM(visitas_totales),
    'paises_mas_visitados', (
      SELECT json_agg(json_build_object('nombre', pais, 'count', total_usuarios))
      FROM (
        SELECT pais, COUNT(*) as total_usuarios
        FROM geolocalizacion_usuarios
        GROUP BY pais
        ORDER BY total_usuarios DESC
        LIMIT 10
      ) paises_top
    ),
    'ciudades_mas_visitadas', (
      SELECT json_agg(json_build_object('nombre', ciudad, 'count', total_usuarios))
      FROM (
        SELECT ciudad, COUNT(*) as total_usuarios
        FROM geolocalizacion_usuarios
        GROUP BY ciudad
        ORDER BY total_usuarios DESC
        LIMIT 10
      ) ciudades_top
    )
  ) INTO result
  FROM geolocalizacion_usuarios;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. TRIGGER PARA UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_geolocalizacion_updated_at
  BEFORE UPDATE ON geolocalizacion_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- PASO 3: VERIFICAR INSTALACIÓN
-- ==============================

-- Insertar dato de prueba
INSERT INTO geolocalizacion_usuarios (
  usuario_id, ip, pais, ciudad, region, latitud, longitud, timezone, proveedor
) VALUES (
  auth.uid(), '8.8.8.8', 'Colombia', 'Bogotá', 'Bogotá D.C.', 4.7110, -74.0721, 'America/Bogota', 'Google LLC'
);

-- Verificar que todo funciona
SELECT 'Tabla creada exitosamente' as paso_1;
SELECT obtener_estadisticas_geograficas() as paso_2;
SELECT COUNT(*) as registros_totales FROM geolocalizacion_usuarios as paso_3;

-- ✅ INSTALACIÓN COMPLETADA
SELECT '🎉 Sistema de geolocalización con ipapi.co instalado exitosamente' AS resultado; 