import React from 'react'
import TarjetaCurso from './TarjetaCurso'

interface Props {
  inscripciones: any[]
  isLoading: boolean
  error: string | null
}

export default function GridMisCursos({ inscripciones, isLoading, error }: Props) {
  if (isLoading) {
    return (
      <div className="estado-carga" style={styles.estado}>
        <div style={styles.spinner} />
        <p style={styles.estadoTexto}>Cargando tus cursos...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="estado-error" style={styles.estado}>
        <h3 style={{ margin: 0 }}>Oops! Algo salió mal</h3>
        <p style={styles.estadoTexto}>{error}</p>
        <button style={styles.btnReintentar} onClick={()=> window.location.reload()}>Reintentar</button>
      </div>
    )
  }
  if (!inscripciones.length) {
    return (
      <div className="estado-vacio" style={styles.estado}>
        <h3 style={{ margin: 0 }}>¡Aún no tienes cursos!</h3>
        <p style={styles.estadoTexto}>Explora nuestro catálogo y encuentra el curso perfecto para ti</p>
        <a href="/cursos" style={styles.btnExplorar}>Explorar Cursos →</a>
      </div>
    )
  }
  return (
    <div className="grid-cursos" style={styles.grid}>
      {inscripciones.map((ins: any) => (
        <TarjetaCurso key={ins.id} inscripcion={ins} />
      ))}
    </div>
  )
}

const styles = {
  grid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:24, width:'100%' },
  estado: { display:'flex', flexDirection:'column' as const, alignItems:'center', justifyContent:'center', padding:'4rem 2rem', textAlign:'center' as const, gap:'1.5rem' },
  spinner: { width:48, height:48, border:'4px solid #e5e7eb', borderTopColor:'#2563eb', borderRadius:'50%', animation:'spin 1s linear infinite' },
  estadoTexto: { color:'#6b7280', fontSize:'1rem' },
  btnReintentar: { background:'#ef4444', color:'#fff', border:'none', padding:'12px 24px', borderRadius:12, fontWeight:600, cursor:'pointer' },
  btnExplorar: { background:'#2563eb', color:'#fff', textDecoration:'none', padding:'12px 24px', borderRadius:12, fontWeight:600 }
}
