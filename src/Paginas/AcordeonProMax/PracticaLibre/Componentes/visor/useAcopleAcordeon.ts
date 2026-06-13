import * as React from 'react'
import * as THREE from 'three'

// Acoplar el acordeón compartido al personaje. La pieza 'parrilla' del acordeón se hace coincidir
// EXACTAMENTE con el marco 'AnclaAcordeon' (matriz mundial de la parrilla en la pose de agarre,
// exportada desde Blender). Pero el acordeón NO se cuelga del ancla estática: se cuelga del HUESO
// del pecho 'mixamorig:Spine2' — igual que en Blender, donde el Empty del acordeón está
// bone-parented a Spine2. Así, en CUALQUIER animación (baile, inclinación del torso), el acordeón
// rueda con el pecho junto al brazo de bajos → la mano nunca se despega de la caja.
export function useAcopleAcordeon(
  scene: THREE.Object3D,
  acordeon: THREE.Object3D,
  mixer: THREE.AnimationMixer | undefined,
  clipBrazos: THREE.AnimationClip | null,
  clipCuerpo: THREE.AnimationClip | null,
) {
  React.useLayoutEffect(() => {
    const ancla = scene.getObjectByName('AnclaAcordeon')
    const parrilla = acordeon.getObjectByName('parrilla')
    if (!ancla || !parrilla) return
    let spine2: THREE.Object3D | null = null
    scene.traverse((o: any) => { if (!spine2 && o.isBone && /Spine2$/.test(o.name || '')) spine2 = o })

    // El GLB no carga en la pose de agarre: la acción 'Cierre' (frame 0 = agarre) la aplica el
    // mixer. Hay que posar el esqueleto al agarre ANTES de muestrear Spine2, o el offset que pega
    // el acordeón al pecho se calcula contra la pose equivocada (el acordeón quedaría corrido).
    // Se posa con las DOS capas (brazos + cuerpo) = la pose completa del clip original.
    if (mixer && clipBrazos && clipCuerpo) {
      for (const c of [clipBrazos, clipCuerpo]) {
        // root explícito: el mixer de drei nace sin root (sus actions llevan root aparte)
        const a = mixer.clipAction(c, scene)
        a.reset(); a.play(); a.paused = true; a.time = 0
      }
      mixer.update(0)
    }
    scene.updateMatrixWorld(true)
    acordeon.position.set(0, 0, 0)
    acordeon.quaternion.identity()
    acordeon.scale.set(1, 1, 1)
    acordeon.updateMatrixWorld(true)
    // Mundo deseado del acordeón en reposo: que su 'parrilla' caiga sobre el marco del ancla.
    // (con el acordeón en identidad, parrilla.matrixWorld = marco local de la parrilla).
    const mundoDeseado = ancla.matrixWorld.clone().multiply(parrilla.matrixWorld.clone().invert())

    // Padre = el hueso del pecho si existe; si no (acordeón sin rig de personaje), cae al ancla.
    const padre: THREE.Object3D = spine2 ?? ancla
    // Local respecto al padre = inv(padreMundo) · mundoDeseado. Matriz directa (NO decompose): la
    // inversa de un marco con escala no uniforme tiene shear que position/quaternion/scale no
    // representan (~2cm de error si se descompone).
    const local = padre.matrixWorld.clone().invert().multiply(mundoDeseado)
    padre.add(acordeon)
    acordeon.matrixAutoUpdate = false
    acordeon.matrix.copy(local)
    acordeon.matrixWorldNeedsUpdate = true
    return () => { padre.remove(acordeon); acordeon.matrixAutoUpdate = true }
  }, [scene, acordeon, clipBrazos, clipCuerpo, mixer])
}
