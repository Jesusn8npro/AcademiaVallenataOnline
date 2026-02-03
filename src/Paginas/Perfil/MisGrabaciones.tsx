import React from 'react'
import './MisGrabaciones.css'

export default function MisGrabaciones() {
    return (
        <div className="contenedor-grabaciones">
            <div className="encabezado-seccion">
                <div className="icono-seccion">🎥</div>
                <div className="info-seccion">
                    <h1>Mis Grabaciones</h1>
                    <p>Videos grabados desde el simulador de acordeón</p>
                </div>
                <button className="btn-nueva-grabacion">
                    ➕ Nueva Grabación
                </button>
            </div>

            <div className="contenido-grabaciones">
                <div className="estado-vacio">
                    <div className="icono-vacio">🎬</div>
                    <h3>Aún no tienes grabaciones</h3>
                    <p>Usa el simulador de acordeón para grabar y compartir tus interpretaciones. ¡Muestra tu talento!</p>

                    <div className="acciones-vacio">
                        <a href="/simulador-gaming" className="btn-ir-simulador">
                            🎹 Ir al Simulador
                        </a>
                        <button
                            className="btn-subir-video"
                            onClick={() => alert('Función de subir video próximamente')}
                        >
                            📁 Subir Video
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
