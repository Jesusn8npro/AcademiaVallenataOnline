# Export del acordeon del Pelao moreno PRESERVANDO JERARQUIA + SKINS (para el solver de huesos web).
# Correr INLINE con Pelao_segmentos_web.blend ABIERTO (via MCP). NO DESTRUCTIVO (solo baja Subsurf a 1
# temporalmente y lo restaura). NO hornea nada: exporta los objetos TAL CUAL, con sus grupos y el
# fuelle skinned, para que en la web la caja de bajos sea UN nodo (no se separa) y los huesos del
# Esqueleto_Fuelle_Real deformen Fuelle20. El Spline IK / hooks / curva NO se exportan (glTF no los
# lleva) -> eso se resuelve en la web moviendo el nodo de la caja y manejando los huesos por curva.
import bpy, os

COL = "Acordeon - Pelao moreno"
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-rig-jerarquia-raw.glb"

sc = bpy.context.scene
col = bpy.data.collections[COL]

# Subsurf -> 1 (los aros traen Subsurf alto; se restaura al final)
subs = []
for o in col.objects:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            subs.append((m, m.levels)); m.levels = 1
bpy.context.view_layer.update()

for o in list(bpy.context.selected_objects):
    o.select_set(False)
objs = list(col.objects)
for o in objs:
    o.select_set(True)
arm = bpy.data.objects.get("Esqueleto_Fuelle_Real.006")
bpy.context.view_layer.objects.active = arm if arm else objs[0]

os.makedirs(os.path.dirname(RUTA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
    export_animations=False, export_morph=False, export_skins=True,
    export_yup=True, export_apply=False, export_image_format='AUTO',
    export_extras=True)
mb = round(os.path.getsize(RUTA) / 1e6, 2)

# restaurar Subsurf
for m, l in subs:
    m.levels = l
bpy.context.view_layer.update()

# diagnostico de la jerarquia de la caja de bajos
caja = bpy.data.objects.get("Caja de los bajos, izquierda.007")
hijos = [o.name for o in bpy.data.objects if o.parent == caja]
result = {"glb_mb": mb, "objs": len(objs), "caja_bajos_hijos": len(hijos)}
print("RESULT:", result)
