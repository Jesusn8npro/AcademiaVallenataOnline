import { useState } from 'react'
import { supabase } from '../servicios/clienteSupabase'

interface ResultadoCupon {
  valido: boolean
  descuento: number
  precio_final: number
  tipo: 'porcentaje' | 'fijo'
  valor: number
  descripcion: string
  mensaje: string
}

export function useCupon() {
  const [codigo, setCodigo] = useState('')
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoCupon | null>(null)
  const [error, setError] = useState('')

  const validarCupon = async (monto: number, usuario_id?: string): Promise<ResultadoCupon | null> => {
    if (!codigo.trim()) { setError('Ingresa un código de cupón'); return null }
    setValidando(true)
    setError('')
    setResultado(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/validar-cupon`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ codigo, monto, usuario_id })
      })
      const data: ResultadoCupon = await res.json()
      if (data.valido) { setResultado(data); return data }
      setError(data.mensaje)
      return null
    } catch {
      setError('Error al validar el cupón')
      return null
    } finally {
      setValidando(false)
    }
  }

  const limpiarCupon = () => { setCodigo(''); setResultado(null); setError('') }

  return { codigo, setCodigo, validando, resultado, error, validarCupon, limpiarCupon }
}
