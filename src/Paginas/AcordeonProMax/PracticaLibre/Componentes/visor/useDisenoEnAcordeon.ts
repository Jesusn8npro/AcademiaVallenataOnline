import * as React from 'react'
import * as THREE from 'three'
import { construirResolutorMateriales } from '../VisorAcordeon3D'
import { useUsuario } from '../../../../../contextos/UsuarioContext'
import { listarPresets, leerPresetsLocal, type PresetAcordeon } from '../../Servicios/servicioPresetsAcordeon'
import { leerMaterialesLocal, cargarMaterialesDB, type MaterialesAcordeon } from '../../Servicios/servicioMaterialesAcordeon'

// Aplica al acordeón del personaje (pestaña Personaje + Mundo 3D) el MISMO diseño que el usuario pintó en
// la pestaña Acordeón → se ve IDÉNTICO en todos lados (igual que el Competitivo, que ya lee ese diseño).
// Fuente del diseño según el "modelo" elegido (skin):
//   • 'original'    → diseño EN VIVO del usuario (perfiles.acordeon_materiales). Es SU acordeón editado.
//   • 'preset:<id>' → ese diseño guardado.
//   • '1'..'7'      → piel normal, NO se toca (la pinta usePielesAcordeon).
// El color se aplica por GRUPO (grupoDePieza) → calza aunque el GLB del personaje tenga otros nombres de
// malla (prefijo ACC_), porque las claves del diseño pintado "por grupo" son canónicas. Solo el jugador
// LOCAL (activo); el color se MULTIPLICA sobre la textura baked (recolor sutil que conserva el grano).
// Piel EFECTIVA del acordeón del personaje: la textura de base a cargar (usePielesAcordeon). Para una
// piel de fábrica ('1'..'7'/'original') es la piel misma; para un PRESET guardado SOBRE una piel
// (materiales._piel) es esa piel; para todo lo demás, 'original' (baked). Así un diseño piel-based
// muestra la piel de base + lo pintado encima (igual que el tab).
export function usePielEfectiva(activo: boolean, skin: string): string {
  const { usuario } = useUsuario()
  const [piel, setPiel] = React.useState<string>('original')
  React.useEffect(() => {
    if (/^[1-7]$/.test(skin) || skin === 'original') { setPiel(skin); return }
    if (!activo || !skin || !skin.startsWith('preset:')) { setPiel('original'); return }
    const id = skin.slice('preset:'.length)
    const pielDe = (p?: PresetAcordeon) => ((p?.materiales as any)?._piel?.tinta as string | undefined) || 'original'
    // Caché local primero → la piel se resuelve AL INSTANTE (sin esperar la DB) → carga inmediata.
    const local = leerPresetsLocal()?.find((x) => x.id === id)
    if (local) setPiel(pielDe(local))
    const uid = usuario?.id
    if (!uid) { if (!local) setPiel('original'); return }
    let vivo = true
    listarPresets(uid).then((ps) => { if (vivo) setPiel(pielDe(ps.find((x) => x.id === id))) })
    return () => { vivo = false }
  }, [skin, activo, usuario?.id])
  return piel
}

export function useDisenoEnAcordeon(acordeon: THREE.Object3D, activo: boolean, skin: string, pielEfectiva?: string) {
  const { usuario } = useUsuario()
  // Presets desde el caché local primero (instantáneo) → el diseño guardado se aplica YA; la DB confirma.
  const [presets, setPresets] = React.useState<PresetAcordeon[]>(() => leerPresetsLocal() ?? [])
  // Diseño en vivo del usuario (el que pinta en la pestaña Acordeón). Local primero (instantáneo), DB confirma.
  const [diseno, setDiseno] = React.useState<MaterialesAcordeon | null>(() => leerMaterialesLocal())

  // Contador para forzar re-lectura de la DB (presets + diseño) cuando el usuario pulsa "Actualizar",
  // guarda/borra un preset, o edita el diseño en OTRA pestaña del navegador.
  const [tic, setTic] = React.useState(0)
  React.useEffect(() => {
    const uid = usuario?.id
    if (!uid || !activo) return
    let vivo = true
    listarPresets(uid).then((p) => { if (vivo) setPresets(p) })
    cargarMaterialesDB(uid).then((m) => { if (vivo && m && Object.keys(m).length) setDiseno(m) })
    return () => { vivo = false }
  }, [usuario?.id, activo, tic])

  // Sincronización GLOBAL del diseño: al editar/guardar el acordeón en la pestaña Acordeón, esto se entera
  // y re-aplica → el mismo acordeón se ve igual acá. Edits en vivo (mismo navegador) = instantáneo por
  // localStorage; guardar preset o "Actualizar" o editar en otra pestaña = re-lee la DB.
  React.useEffect(() => {
    if (!activo) return
    const refrescarLocal = () => setDiseno(leerMaterialesLocal())
    const refrescarDB = () => { setDiseno(leerMaterialesLocal()); setTic((n) => n + 1) }
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith('acordeon3d:')) refrescarDB() }
    window.addEventListener('acordeon-diseno-cambio', refrescarLocal)
    window.addEventListener('acordeon-presets-cambio', refrescarDB)
    window.addEventListener('acordeon-actualizar', refrescarDB)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener('acordeon-diseno-cambio', refrescarLocal)
      window.removeEventListener('acordeon-presets-cambio', refrescarDB)
      window.removeEventListener('acordeon-actualizar', refrescarDB)
      window.removeEventListener('storage', onStorage)
    }
  }, [activo])

  React.useEffect(() => {
    if (!activo || !acordeon) return
    // Pieles '1'..'7' → las gobierna usePielesAcordeon; no tintamos encima.
    if (/^[1-7]$/.test(skin)) return
    // Fuente del diseño: un preset seleccionado, o el diseño EN VIVO del usuario ('original').
    let materiales: MaterialesAcordeon | null = diseno
    if (skin && skin.startsWith('preset:')) {
      const id = skin.slice('preset:'.length)
      materiales = presets.find((p) => p.id === id)?.materiales ?? null
    }
    if (!materiales) return
    // Si el diseño se guardó SOBRE una piel (_piel), la piel es la base: solo pintamos ENCIMA las partes
    // con override; las demás quedan con la textura de la piel (que carga usePielesAcordeon con la piel
    // efectiva). Sin piel, las partes sin pintar caen a 'todos' (igual que el tab).
    const hasPiel = !!(materiales as any)._piel
    // Resolvedor COMPARTIDO con el tab (VisorAcordeon3D) → el mismo diseño se ve IDÉNTICO acá y allá.
    // Normaliza el prefijo ACC_ y el sufijo de versión (.006/.007/.008) → robusto entre los dos GLB.
    const resolver = construirResolutorMateriales(materiales, { sinTodos: hasPiel })
    acordeon.traverse((o: any) => {
      if (!o.isMesh) return
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const mat of mats) {
        if (!mat || !mat.isMeshStandardMaterial) continue
        const cfg = resolver(o.name, mat.name)
        if (!cfg) continue // con piel: parte no pintada → la deja la piel de base
        // MISMA lógica que VisorAcordeon3D: con textura (usarTexturaOriginal !== false) tintamos sobre el
        // mapa baked; en "custom" (false) QUITAMOS el albedo (map = null) y dejamos que el color mande. Esto
        // es CLAVE para las partes metálicas: con un albedo oscuro, el metal refleja oscuro → se ve negro;
        // sin albedo, el color elegido tiñe el reflejo del entorno → metal con el color correcto.
        const conTextura = cfg.usarTexturaOriginal !== false
        mat.map = conTextura ? (mat.userData.orig?.map ?? mat.map) : null
        mat.color.set(cfg.tinta ?? '#ffffff')
        if (typeof cfg.roughness === 'number') mat.roughness = cfg.roughness
        if (typeof cfg.metalness === 'number') mat.metalness = cfg.metalness
        mat.needsUpdate = true
      }
    })
    // `pielEfectiva` en deps: cuando la piel de base TERMINA de cargar (async), re-aplicamos los colores
    // ENCIMA → evita la carrera donde la piel pisaba lo pintado (se veía "roto" hasta recargar).
  }, [acordeon, activo, skin, presets, diseno, pielEfectiva])
}
