import React, { useState } from 'react'
import './GestorLista.css'

interface Props{
  titulo: string
  placeholder: string
  items: string[]
  onUpdate: (items: string[])=>void
}

export default function GestorLista({ titulo, placeholder, items, onUpdate }: Props){
  const [nuevoItem, setNuevoItem] = useState('')

  function agregarItem(){
    const val = nuevoItem.trim()
    if (!val || items.includes(val)){ setNuevoItem(''); return }
    onUpdate([ ...items, val ])
    setNuevoItem('')
  }
  function eliminarItem(index:number){
    const next = items.filter((_,i)=>i!==index)
    onUpdate(next)
  }
  function handleKeydown(e: React.KeyboardEvent<HTMLInputElement>){
    if (e.key==='Enter'){ e.preventDefault(); agregarItem() }
  }

  return (
    <div className="gestor-lista-contenedor">
      <label className="etiqueta-campo">{titulo}</label>
      <div className="input-agregar">
        <input type="text" value={nuevoItem} onChange={e=>setNuevoItem(e.target.value)} className="input-moderno" placeholder={placeholder} onKeyDown={handleKeydown}/>
        <button type="button" onClick={agregarItem} className="boton-agregar" title="Agregar item">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        </button>
      </div>
      <ul className="lista-items">
        {items.map((item, index)=> (
          <li key={item} className="item">
            <span className="texto-item">{item}</span>
            <button type="button" onClick={()=>eliminarItem(index)} className="boton-eliminar" title="Eliminar item">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
