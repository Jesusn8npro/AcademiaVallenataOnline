import { useState } from 'react'
import { supabase } from '../../servicios/supabaseCliente'

interface Usuario {
  id?: string
  nombre?: string | null
  apellido?: string | null
  nombre_completo?: string | null
  correo_electronico?: string | null
  rol?: string | null
  suscripcion?: string | null
  ciudad?: string | null
  pais?: string | null
}

interface Props {
  onCerrar: () => void
  onUsuarioCreado: (u: Usuario) => void
}

export default function CrearUsuario({ onCerrar, onUsuarioCreado }: Props){
  const [form, setForm] = useState<Usuario>({ nombre: '', apellido: '', correo_electronico: '', rol: 'estudiante', suscripcion: 'free', ciudad: '', pais: '' })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  function cambiar(campo: keyof Usuario, valor: any){ setForm(prev => ({ ...prev, [campo]: valor })) }

  async function crear(){
    setCargando(true); setError('')
    try {
      const nombre_completo = `${form.nombre || ''} ${form.apellido || ''}`.trim()
      const { data, error } = await supabase
        .from('perfiles')
        .insert({
          nombre: form.nombre || null,
          apellido: form.apellido || null,
          nombre_completo: nombre_completo || null,
          correo_electronico: form.correo_electronico || null,
          rol: form.rol || null,
          suscripcion: form.suscripcion || null,
          ciudad: form.ciudad || null,
          pais: form.pais || null,
        })
        .select('*')
        .single()
      if (error) throw error
      onUsuarioCreado(data as Usuario)
    } catch(e: any){ setError(e.message) } finally { setCargando(false) }
  }

  return (
    <div className="crear-usuario">
      <div className="crear-header">
        <h2>Crear Usuario</h2>
        <button className="btn-cerrar" onClick={onCerrar}>✖</button>
      </div>
      {error && <div className="crear-error">{error}</div>}
      <div className="crear-form">
        <div className="campo"><label>Nombre</label><input value={form.nombre || ''} onChange={e=>cambiar('nombre', e.target.value)} /></div>
        <div className="campo"><label>Apellido</label><input value={form.apellido || ''} onChange={e=>cambiar('apellido', e.target.value)} /></div>
        <div className="campo"><label>Correo</label><input type="email" value={form.correo_electronico || ''} onChange={e=>cambiar('correo_electronico', e.target.value)} /></div>
        <div className="campo"><label>Rol</label><select value={form.rol || ''} onChange={e=>cambiar('rol', e.target.value)}><option value="estudiante">Estudiante</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></div>
        <div className="campo"><label>Suscripción</label><select value={form.suscripcion || ''} onChange={e=>cambiar('suscripcion', e.target.value)}><option value="free">Gratuita</option><option value="basic">Básica</option><option value="premium">Premium</option><option value="pro">Profesional</option></select></div>
        <div className="campo"><label>Ciudad</label><input value={form.ciudad || ''} onChange={e=>cambiar('ciudad', e.target.value)} /></div>
        <div className="campo"><label>País</label><input value={form.pais || ''} onChange={e=>cambiar('pais', e.target.value)} /></div>
      </div>
      <div className="crear-acciones">
        <button className="btn-primario" onClick={crear} disabled={cargando}>Crear</button>
      </div>
    </div>
  )
}

