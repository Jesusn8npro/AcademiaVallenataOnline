import { supabase } from '../servicios/supabaseCliente'

export interface DatosGeolocalizacion{
  ip: string
  pais: string
  pais_codigo: string
  region: string
  ciudad: string
  latitud: number
  longitud: number
  zona_horaria: string
  isp: string
  organizacion: string
  tipo_conexion: string
  es_movil: boolean
  es_proxy: boolean
  es_vpn: boolean
  bandera_url: string
  fecha_registro: string
}

export async function obtenerIPPublica(): Promise<string>{
  try{
    const res = await fetch('https://api.ipify.org?format=json')
    const json = await res.json()
    return json.ip as string
  }catch{ return '0.0.0.0' }
}

export async function obtenerDatosGeolocalizacion(ip?: string): Promise<DatosGeolocalizacion>{
  const ipUse = ip || await obtenerIPPublica()
  const resp = await fetch(`http://ip-api.com/json/${ipUse}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query,mobile,proxy,hosting`, { headers:{ 'Accept':'application/json' }})
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const data = await resp.json()
  if (data.status === 'fail') throw new Error(data.message || 'Error en geolocalización')
  const bandera = `https://flagcdn.com/48x36/${String(data.countryCode||'').toLowerCase()}.png`
  return {
    ip: String(data.query||ipUse),
    pais: String(data.country||''),
    pais_codigo: String(data.countryCode||''),
    region: String(data.regionName||data.region||''),
    ciudad: String(data.city||''),
    latitud: Number(data.lat||0),
    longitud: Number(data.lon||0),
    zona_horaria: String(data.timezone||''),
    isp: String(data.isp||''),
    organizacion: String(data.org||''),
    tipo_conexion: data.mobile ? 'movil' : 'fija',
    es_movil: Boolean(data.mobile),
    es_proxy: Boolean(data.proxy),
    es_vpn: Boolean(data.hosting),
    bandera_url: bandera,
    fecha_registro: new Date().toISOString()
  }
}

export async function guardarGeolocalizacionUsuario(usuarioId: string, datos: DatosGeolocalizacion){
  const { data: existente } = await supabase
    .from('geolocalizacion_usuarios')
    .select('id, visitas_totales')
    .eq('usuario_id', usuarioId)
    .eq('ip', datos.ip)
    .single()
  if (existente){
    const visitas = (existente.visitas_totales ?? 0) + 1
    await supabase.from('geolocalizacion_usuarios').update({ ultima_visita: new Date().toISOString(), visitas_totales: visitas }).eq('id', existente.id)
    return true
  }
  const insert = {
    usuario_id: usuarioId,
    ip: datos.ip,
    pais: datos.pais,
    ciudad: datos.ciudad,
    region: datos.region,
    latitud: datos.latitud,
    longitud: datos.longitud,
    zona_horaria: datos.zona_horaria,
    isp: datos.isp,
    organizacion: datos.organizacion,
    tipo_conexion: datos.tipo_conexion,
    es_movil: datos.es_movil,
    es_proxy: datos.es_proxy,
    es_vpn: datos.es_vpn,
    bandera_url: datos.bandera_url,
    primera_visita: new Date().toISOString(),
    ultima_visita: new Date().toISOString(),
    visitas_totales: 1
  }
  const { error } = await supabase.from('geolocalizacion_usuarios').insert(insert)
  if (error) throw error
  return true
}

export async function obtenerHistorialUsuario(usuarioId: string, limite = 10){
  const { data, error } = await supabase
    .from('geolocalizacion_usuarios')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('ultima_visita', { ascending: false })
    .limit(limite)
  if (error) throw error
  return data || []
}

export async function obtenerEstadisticasUsuario(usuarioId: string){
  const { data, error } = await supabase
    .from('geolocalizacion_usuarios')
    .select('usuario_id, pais, visitas_totales')
    .eq('usuario_id', usuarioId)
  if (error) throw error
  const totalRegistros = (data||[]).length
  const visitas = (data||[]).reduce((acc: number, r: any)=> acc + (r.visitas_totales||0), 0)
  const paisesUnicos = Array.from(new Set((data||[]).map((r:any)=> r.pais))).filter(Boolean).length
  return { totalRegistros, visitas, paisesUnicos }
}

export function detectarRiesgo(d: any): 'ALTO'|'MEDIO'|'BAJO'{
  if (d.es_proxy || d.es_vpn) return 'ALTO'
  if (d.es_movil) return 'MEDIO'
  return 'BAJO'
}

export function colorRiesgo(nivel: 'ALTO'|'MEDIO'|'BAJO'){
  return nivel==='ALTO' ? '#ef4444' : nivel==='MEDIO' ? '#f59e0b' : '#10b981'
}
