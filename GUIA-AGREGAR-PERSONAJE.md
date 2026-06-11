# Cómo agregar un personaje al visor 3D

El visor (`src/Paginas/AcordeonProMax/PracticaLibre/Componentes/VisorPersonaje3D.tsx`) tiene
**selector de personajes con foto** y usa la arquitectura **"acordeón compartido"**: los
personajes son GLBs livianos (~0.5 MB) SIN acordeón; el visor carga UNA sola vez
`acordeon-fino-v1.glb` (el mismo de la pestaña "Acordeón 3D") y lo acopla a cada personaje.
Para sumar uno solo hay que producir el GLB del cuerpo, su miniatura, y una línea en
`personajes.ts`. No hay que tocar código del visor.

## 1. El "contrato" del GLB del personaje (obligatorio)

| Cosa | Nombre exacto |
|---|---|
| Huesos | prefijo común `mixamorig:` (ej. `mixamorig:LeftHand`) — renombrar si el FBX vino con `mixamorig7:` etc. |
| Dedos | `mixamorig:{Right\|Left}Hand{Index\|Middle\|Ring\|Pinky\|Thumb}{1,2,3}` (+ `4` como punta si existe) |
| Acción de cierre | UNA acción (frame 1 = pose de agarre, frame 31 = mano izquierda siguiendo la tapa 22.5 cm) |
| Ancla del acordeón | empty `AnclaAcordeon` con la matriz mundial de la **parrilla** de SU acordeón posado |

> El acordeón compartido ya trae: morph `Cerrar` (22 piezas), botones `Boton_D_01..31` /
> `Boton_I_01..12`, y los materiales de pieles (`cuerpo`, `botones`, `fuelle`, `pack`,
> `parte botones`). Nada de eso viaja en el personaje.

## 2. Receta en Blender (Personajes Modelados 6.blend)

1. **Posar el personaje nuevo** con el clonador 1-clic ("Clonar posado de Pelao") — queda con
   su acordeón en su colección, pose blindada.
2. **Exportar**: `scripts/exportar-personajes-v2.py` (correr con
   `blender --background "Personajes Modelados 6.blend" --python scripts/exportar-personajes-v2.py`
   — duplica armature+mallas, **copia el pose EVALUADO al duplicado** (¡clave! el original
   v1 hacía `animation_data_clear()` y el duplicado caía al pose-state rancio → pose
   distorsionada 20-45° en los GLBs), renombra huesos y vertex groups a `mixamorig:`,
   hornea la acción de cierre con IK temporal en `LeftForeArm` (chain 2) siguiendo el vector
   de la caja de bajos, crea `AnclaAcordeon` = matriz mundial de su `parrilla.00X`, exporta
   selección con `export_animation_mode='ACTIVE_ACTIONS'`, limpia los duplicados y
   auto-verifica la pose (diag `pose_f1_vs_canon_deg` debe ser ~0).
   **No guarda el .blend** — todo en memoria. Para un personaje nuevo: agregar su línea al
   `LOTE` del script.
3. **Miniatura**: render EEVEE 512×640 con fondo transparente (cámara 3/4 auto-encuadrada al
   bbox de la colección) → webp 256×320 con `scripts/webp-miniaturas.mjs` → `public/personajes/`.

## 3. Optimizar

```
node scripts/comprimir-personaje-mixamo.mjs <raw.glb> public/modelos3d/personaje-<id>.glb
# NO decima (todo es skinneado); texturas → webp 512; Draco. Resultado ~0.5 MB.
```

Verificá antes de publicar:
```
node scripts/inspect-glb.mjs public/modelos3d/personaje-<id>.glb  # skin, anim, nodo AnclaAcordeon
```

## 4. Registrar en la web

```ts
// src/Paginas/AcordeonProMax/PracticaLibre/personajes.ts
export const PERSONAJES: PersonajeDef[] = [
  // ...
  { id: 'maria', nombre: 'María', archivo: '/modelos3d/personaje-maria.glb', foto: '/personajes/maria.webp' },
]
```

Listo: aparece como tarjeta con foto en el selector del visor.

## Cómo funciona el acople (por si hay que depurar)

- El GLB fino y las copias de acordeón del blend comparten geometría local idéntica.
- En runtime el visor hace coincidir el marco de la pieza `parrilla` del GLB fino con el
  nodo `AnclaAcordeon` del personaje: `acordeon.matrix = inversa(matrixWorld de parrilla)`
  colgado del ancla. **Matriz directa, sin decompose** (la escala no uniforme de la parrilla
  genera shear que `position/quaternion/scale` no representan → ~2 cm de error).
- GLTFLoader de three.js **elimina los `:`** de los nombres (`mixamorig:LeftHand` →
  `mixamorigLeftHand`) — el visor matchea con `mixamorig:?`.
- La caja de bajos del fino desliza por MORPH (los nodos no se mueven): el visor corrige el
  blanco de los dedos de bajos con `SLIDE_LOCAL_CAJA × q`.
