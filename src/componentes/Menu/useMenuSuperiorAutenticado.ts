import { useState, useEffect, useRef } from 'react'
import { useUsuario } from '../../contextos/UsuarioContext'
import { notificacionesService } from '../../servicios/notificacionesService'

interface Props {
  onCerrarSesion?: () => Promise<void>
}

export function useMenuSuperiorAutenticado({ onCerrarSesion }: Props) {
  const { usuario } = useUsuario()
  const [nombre, setNombre] = useState('')
  const [mostrarMenu, setMostrarMenu] = useState(false)
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false)
  const [conteoNotificaciones, setConteoNotificaciones] = useState(0)
  const [mostrarModalBusqueda, setMostrarModalBusqueda] = useState(false)
  const [mostrarMenuLateral, setMostrarMenuLateral] = useState(false)
  const [cerrandoSesion, setCerrandoSesion] = useState(false)
  const menuUsuarioRef = useRef<HTMLDivElement>(null)
  const notificacionesRef = useRef<HTMLButtonElement>(null)
  const notificacionesMobileRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!usuario) return
    setNombre(usuario.nombre || '')
    // suscribirseAContador ya carga el conteo inicial y se actualiza en realtime
    const unsubscribe = notificacionesService.suscribirseAContador(setConteoNotificaciones)
    return () => { unsubscribe() }
  }, [usuario])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuUsuarioRef.current && !menuUsuarioRef.current.contains(event.target as Node)) {
        setMostrarMenu(false)
      }
      const clicEnBotonNotif =
        (notificacionesRef.current && notificacionesRef.current.contains(event.target as Node)) ||
        (notificacionesMobileRef.current && notificacionesMobileRef.current.contains(event.target as Node))
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && !clicEnBotonNotif) {
        setMostrarNotificaciones(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cerrarSesion = async () => {
    setCerrandoSesion(true)
    if (onCerrarSesion) await onCerrarSesion()
    setCerrandoSesion(false)
  }

  const abrirModalBusqueda = () => setMostrarModalBusqueda(true)
  const cerrarModalBusqueda = () => setMostrarModalBusqueda(false)
  const toggleMenuLateral = () => setMostrarMenuLateral(v => !v)
  const cerrarMenuLateral = () => setMostrarMenuLateral(false)
  const cerrarMenuUsuario = () => setMostrarMenu(false)
  const esAdmin = usuario?.rol === 'admin'

  return {
    usuario, nombre, esAdmin,
    mostrarMenu, setMostrarMenu,
    mostrarNotificaciones, setMostrarNotificaciones,
    conteoNotificaciones, setConteoNotificaciones,
    mostrarModalBusqueda, mostrarMenuLateral,
    cerrandoSesion,
    menuUsuarioRef, notificacionesRef, notificacionesMobileRef, dropdownRef,
    cerrarSesion, abrirModalBusqueda, cerrarModalBusqueda,
    toggleMenuLateral, cerrarMenuLateral, cerrarMenuUsuario
  }
}
