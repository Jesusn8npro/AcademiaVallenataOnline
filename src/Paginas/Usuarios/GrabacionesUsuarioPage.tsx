import './grabaciones-usuario.css'

export default function GrabacionesUsuarioPage() {
  return (
    <div className="contenedor-grabaciones">
      <div className="encabezado-seccion"><div className="icono-seccion">🎥</div><div className="info-seccion"><h1>Grabaciones de Acordeón</h1><p>Videos grabados con el simulador de acordeón</p></div></div>
      <div className="contenido-grabaciones">
        <div className="estado-vacio"><div className="icono-vacio">🎬</div><h3>No hay grabaciones disponibles</h3><p>Este usuario aún no ha subido grabaciones de acordeón desde el simulador.</p><div className="accion-vacio"><a href="/simulador-gaming" className="btn-probar-simulador">🎹 Probar el Simulador</a></div></div>
      </div>
    </div>
  )
}

