import React, { useState } from 'react'
import './GestorEstructuraContenido.css'

interface Modulo { titulo: string; descripcion: string; orden: number; lecciones: Leccion[] }
interface Leccion { titulo: string; descripcion: string; video_url?: string; tipo_contenido?: string; contenido?: string; orden: number }
interface Parte { titulo: string; descripcion: string; tipo_parte?: string; video_url?: string; tipo_contenido?: string; contenido?: string; orden: number; visible?: boolean }

interface Props{
  tipo: 'curso'|'tutorial'
  datosGenerales: any
  estructura: any[]
  onContinuar: (estructura: any[])=>void
}

export default function GestorEstructuraContenido({ tipo, estructura, onContinuar }: Props){
  const [modulos, setModulos] = useState<Modulo[]>(tipo==='curso' ? (estructura.length?estructura:[{ titulo:'', descripcion:'', orden:1, lecciones:[] }]) : [])
  const [partes, setPartes] = useState<Parte[]>(tipo==='tutorial' ? (estructura.length?estructura:[{ titulo:'', descripcion:'', tipo_parte:'', video_url:'', orden:1 }]) : [])

  function agregarModulo(){ setModulos([...modulos, { titulo:'', descripcion:'', orden: modulos.length+1, lecciones:[] }]) }
  function agregarParte(){ setPartes([...partes, { titulo:'', descripcion:'', tipo_parte:'', video_url:'', orden: partes.length+1 }]) }
  function agregarLeccion(i:number){ const list=[...modulos]; const lecs=list[i].lecciones||[]; lecs.push({ titulo:'', descripcion:'', video_url:'', tipo_contenido:'', orden: lecs.length+1 }); list[i].lecciones=lecs; setModulos(list) }

  function moverModulo(from:number,to:number){ const list=[...modulos]; const m=list.splice(from,1)[0]; list.splice(to,0,m); setModulos(list.map((mod,i)=>({ ...mod, orden: i+1 }))) }
  function moverLeccion(idxModulo:number, from:number, to:number){ const list=[...modulos]; const lecs=[...(list[idxModulo].lecciones||[])]; if(from===to||from<0||to<0||from>=lecs.length||to>=lecs.length) return; const [mv]=lecs.splice(from,1); lecs.splice(to,0,mv); list[idxModulo].lecciones=lecs.map((l,i)=>({ ...l, orden: i+1 })); setModulos(list) }
  function moverParte(from:number,to:number){ const list=[...partes]; const p=list.splice(from,1)[0]; list.splice(to,0,p); setPartes(list.map((par,i)=>({ ...par, orden: i+1 }))) }

  function continuar(){ onContinuar(tipo==='curso'?modulos:partes) }

  if (tipo==='curso'){
    return (
      <div className="estructura-curso">
        <h2>Módulos y lecciones</h2>
        {modulos.map((modulo, idxModulo) => (
          <div key={idxModulo} className="modulo">
            <div className="modulo-header"><span className="drag">☰</span>
              <input type="text" value={modulo.titulo} onChange={e=>{ const list=[...modulos]; list[idxModulo].titulo=e.target.value; setModulos(list) }} placeholder="Título del módulo" />
              <input type="text" value={modulo.descripcion} onChange={e=>{ const list=[...modulos]; list[idxModulo].descripcion=e.target.value; setModulos(list) }} placeholder="Descripción" />
              <button onClick={()=>agregarLeccion(idxModulo)}>+ Lección</button>
              {modulos.length>1 && (<button onClick={()=>{ const list=[...modulos]; list.splice(idxModulo,1); setModulos(list) }}>Eliminar módulo</button>)}
            </div>
            <div className="lecciones">
              {(modulo.lecciones||[]).map((leccion, idxLeccion) => (
                <div key={idxLeccion} className="leccion">
                  <span className="drag">⋮</span>
                  <input type="text" value={leccion.titulo} onChange={e=>{ const list=[...modulos]; list[idxModulo].lecciones[idxLeccion].titulo=e.target.value; setModulos(list) }} placeholder="Título de la lección" />
                  <input type="text" value={leccion.descripcion} onChange={e=>{ const list=[...modulos]; list[idxModulo].lecciones[idxLeccion].descripcion=e.target.value; setModulos(list) }} placeholder="Descripción" />
                  {leccion.tipo_contenido==='video' && (<input type="text" value={leccion.video_url||''} onChange={e=>{ const list=[...modulos]; list[idxModulo].lecciones[idxLeccion].video_url=e.target.value; setModulos(list) }} placeholder="URL de video" className="input-video-url" />)}
                  {leccion.tipo_contenido==='texto' && (<textarea value={leccion.contenido||''} onChange={e=>{ const list=[...modulos]; list[idxModulo].lecciones[idxLeccion].contenido=e.target.value; setModulos(list) }} placeholder="Escribe el contenido de la lección" rows={2} className="textarea-contenido"></textarea>)}
                  <select value={leccion.tipo_contenido||''} onChange={e=>{ const list=[...modulos]; list[idxModulo].lecciones[idxLeccion].tipo_contenido=e.target.value; setModulos(list) }} className="select-tipo-contenido"><option value="">Tipo de contenido</option><option value="video">Video</option><option value="quiz">Quiz</option><option value="texto">Texto</option></select>
                  {(modulo.lecciones||[]).length>1 && (<button onClick={()=>{ const list=[...modulos]; list[idxModulo].lecciones.splice(idxLeccion,1); setModulos(list) }}>Eliminar lección</button>)}
                  {idxLeccion>0 && (<button onClick={()=>moverLeccion(idxModulo, idxLeccion, idxLeccion-1)}>↑</button>)}
                  {idxLeccion<(modulo.lecciones||[]).length-1 && (<button onClick={()=>moverLeccion(idxModulo, idxLeccion, idxLeccion+1)}>↓</button>)}
                </div>
              ))}
            </div>
            <div className="modulo-mover">
              {idxModulo>0 && (<button onClick={()=>moverModulo(idxModulo, idxModulo-1)}>↑ Módulo</button>)}
              {idxModulo<modulos.length-1 && (<button onClick={()=>moverModulo(idxModulo, idxModulo+1)}>↓ Módulo</button>)}
            </div>
          </div>
        ))}
        <button className="agregar" onClick={agregarModulo}>+ Módulo</button>
        <button className="continuar" onClick={continuar}>Continuar</button>
      </div>
    )
  }

  return (
    <div className="estructura-tutorial">
      <h2>Partes del tutorial</h2>
      {partes.map((parte, idxParte) => (
        <div key={idxParte} className="parte">
          <span className="drag">☰</span>
          <input type="text" value={parte.titulo} onChange={e=>{ const list=[...partes]; list[idxParte].titulo=e.target.value; setPartes(list) }} placeholder="Título de la parte" className="input-parte" aria-label="Título de la parte" />
          <input type="text" value={parte.descripcion} onChange={e=>{ const list=[...partes]; list[idxParte].descripcion=e.target.value; setPartes(list) }} placeholder="Descripción corta (opcional)" className="input-parte" aria-label="Descripción corta" />
          <input type="number" value={parte.orden} onChange={e=>{ const list=[...partes]; list[idxParte].orden=Number(e.target.value); setPartes(list) }} min={1} placeholder="Orden" style={{ width: 90 }} className="input-parte" aria-label="Orden de la parte" />
          <label className="label-visible" style={{ display:'flex', alignItems:'center', gap:4 }}><input type="checkbox" checked={parte.visible||false} onChange={e=>{ const list=[...partes]; list[idxParte].visible=e.target.checked; setPartes(list) }} aria-label="Parte visible" /> Visible</label>
          <select value={parte.tipo_parte||''} onChange={e=>{ const list=[...partes]; list[idxParte].tipo_parte=e.target.value; setPartes(list) }} className="select-tipo-parte" required aria-label="Tipo de parte" title="Selecciona el tipo lógico de la parte"><option value="" disabled>Tipo de parte</option><option value="introduccion">Introducción</option><option value="pase_intermedio">Pase intermedio</option><option value="pase_final">Pase final</option><option value="acompanamiento">Acompañamiento</option><option value="extra">Extra</option></select>
          <select value={parte.tipo_contenido||''} onChange={e=>{ const list=[...partes]; list[idxParte].tipo_contenido=e.target.value; setPartes(list) }} className="select-tipo-contenido" required aria-label="Tipo de contenido" title="Selecciona el formato del contenido"><option value="" disabled>Tipo de contenido</option><option value="video">Video</option><option value="texto">Texto</option><option value="pdf">PDF</option></select>
          {parte.tipo_contenido==='video' && (<input type="text" value={parte.video_url||''} onChange={e=>{ const list=[...partes]; list[idxParte].video_url=e.target.value; setPartes(list) }} placeholder="URL de video" required />)}
          {(parte.tipo_contenido==='texto'||parte.tipo_contenido==='pdf') && (<textarea value={parte.contenido||''} onChange={e=>{ const list=[...partes]; list[idxParte].contenido=e.target.value; setPartes(list) }} placeholder="Contenido principal (HTML o Markdown)"></textarea>)}
          {partes.length>1 && (<button className="btn-eliminar" onClick={()=>{ const list=[...partes]; list.splice(idxParte,1); setPartes(list) }} aria-label="Eliminar parte" title="Eliminar parte">🗑️</button>)}
          {idxParte>0 && (<button className="btn-mover" onClick={()=>moverParte(idxParte, idxParte-1)} aria-label="Mover arriba" title="Mover arriba">↑</button>)}
          {idxParte<partes.length-1 && (<button className="btn-mover" onClick={()=>moverParte(idxParte, idxParte+1)} aria-label="Mover abajo" title="Mover abajo">↓</button>)}
        </div>
      ))}
      <button className="agregar" onClick={agregarParte}>+ Parte</button>
      <button className="continuar" onClick={continuar}>Continuar</button>
    </div>
  )
}
