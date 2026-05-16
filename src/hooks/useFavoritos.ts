import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../servicios/clienteSupabase'
import { useUsuario } from '../contextos/UsuarioContext'

export function useFavoritos() {
  const { usuario } = useUsuario()
  const navigate = useNavigate()
  const [favoritos, setFavoritos] = useState<string[]>([])
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    if (!usuario) { setFavoritos([]); return }
    setCargando(true)
    supabase
      .from('favoritos')
      .select('contenido_id')
      .eq('usuario_id', usuario.id)
      .then(({ data }) => {
        setFavoritos(data ? data.map((f: { contenido_id: string }) => f.contenido_id) : [])
        setCargando(false)
      })
  }, [usuario?.id])

  const toggleFavorito = useCallback(async (id: string, tipo: 'curso' | 'tutorial') => {
    if (!usuario) { navigate('/login'); return }

    const yaEsFavorito = favoritos.includes(id)

    // Optimistic update
    setFavoritos(prev => yaEsFavorito ? prev.filter(f => f !== id) : [...prev, id])

    if (yaEsFavorito) {
      const { error } = await supabase
        .from('favoritos')
        .delete()
        .eq('usuario_id', usuario.id)
        .eq('contenido_id', id)
        .eq('tipo', tipo)
      if (error) setFavoritos(prev => [...prev, id])
    } else {
      const { error } = await supabase
        .from('favoritos')
        .insert({ usuario_id: usuario.id, contenido_id: id, tipo })
      if (error) setFavoritos(prev => prev.filter(f => f !== id))
    }
  }, [usuario, favoritos, navigate])

  const esFavorito = useCallback((id: string) => favoritos.includes(id), [favoritos])

  return { favoritos, toggleFavorito, esFavorito, cargando }
}
