import { useState } from 'react'
import { supabase } from '../../servicios/supabaseCliente'

interface Usuario {
  id: string
  nombre?: string | null
  apellido?: string | null
  nombre_completo?: string | null
  correo_electronico?: string | null
  rol?: string | null
  suscripcion?: string | null
  fecha_creacion?: string | null
  url_foto_perfil?: string | null
  ciudad?: string | null
  pais?: string | null
  biografia?: string | null
}

interface Props {
  usuario: Usuario
  onCerrar: () => void
  onUsuarioActualizado: (u: Usuario) => void
  onUsuarioEliminado: (id: string) => void
}

export default function DetalleUsuario({ usuario, onCerrar, onUsuarioActualizado, onUsuarioEliminado }: Props){
  const [form, setForm] = useState<Usuario>(usuario)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  function cambiar(campo: keyof Usuario, valor: any){ setForm(prev => ({ ...prev, [campo]: valor })) }

  async function guardar(){
    setCargando(true); setError('')
    try {
      const { error } = await supabase.from('perfiles').update({
        nombre: form.nombre || null,
        apellido: form.apellido || null,
        nombre_completo: form.nombre_completo || null,
        correo_electronico: form.correo_electronico || null,
        rol: form.rol || null,
        suscripcion: form.suscripcion || null,
        ciudad: form.ciudad || null,
        pais: form.pais || null,
        biografia: form.biografia || null,
      }).eq('id', usuario.id)
      if (error) throw error
      onUsuarioActualizado({ ...usuario, ...form })
    } catch(e: any){ setError(e.message) } finally { setCargando(false) }
  }

  async function eliminar(){
    if (!confirm('¿Eliminar este usuario?')) return
    setCargando(true)
    try {
      const { error } = await supabase.from('perfiles').delete().eq('id', usuario.id)
      if (error) throw error
      onUsuarioEliminado(usuario.id)
    } catch(e: any){ setError(e.message) } finally { setCargando(false) }
  }

  return (
    <div className="detalle-usuario">
      <div className="detalle-header">
        <h2>Detalle de Usuario</h2>
        <button className="btn-cerrar" onClick={onCerrar}>✖</button>
      </div>
      {error && <div className="detalle-error">{error}</div>}
      <div className="detalle-form">
        <div className="campo"><label>Nombre</label><input value={form.nombre || ''} onChange={e=>cambiar('nombre', e.target.value)} /></div>
        <div className="campo"><label>Apellido</label><input value={form.apellido || ''} onChange={e=>cambiar('apellido', e.target.value)} /></div>
        <div className="campo"><label>Correo</label><input value={form.correo_electronico || ''} onChange={e=>cambiar('correo_electronico', e.target.value)} /></div>
        <div className="campo"><label>Rol</label><select value={form.rol || ''} onChange={e=>cambiar('rol', e.target.value)}><option value="">Selecciona</option><option value="estudiante">Estudiante</option><option value="instructor">Instructor</option><option value="admin">Admin</option></select></div>
        <div className="campo"><label>Suscripción</label><select value={form.suscripcion || ''} onChange={e=>cambiar('suscripcion', e.target.value)}><option value="">Selecciona</option><option value="free">Gratuita</option><option value="basic">Básica</option><option value="premium">Premium</option><option value="pro">Profesional</option></select></div>
        <div className="campo"><label>Ciudad</label><input value={form.ciudad || ''} onChange={e=>cambiar('ciudad', e.target.value)} /></div>
        <div className="campo"><label>País</label><input value={form.pais || ''} onChange={e=>cambiar('pais', e.target.value)} /></div>
        <div className="campo"><label>Biografía</label><textarea value={form.biografia || ''} onChange={e=>cambiar('biografia', e.target.value)} /></div>
      </div>
      <div className="detalle-acciones">
        <button className="btn-primario" onClick={guardar} disabled={cargando}>Guardar cambios</button>
        <button className="btn-peligro" onClick={eliminar} disabled={cargando}>Eliminar</button>
      </div>
    </div>
  )
}

