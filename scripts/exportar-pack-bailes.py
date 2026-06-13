# Export del pack de bailes como GLB solo-esqueleto — correr por CLI:
#   & "C:\Program Files\Blender Foundation\Blender 5.1\blender.exe" --background `
#     "C:\Users\acord\OneDrive\Desktop\Blender Personajes\PACK-BAILES.blend" `
#     --python scripts/exportar-pack-bailes.py
# Luego comprimir:
#   node scripts/comprimir-bailes.mjs public/modelos3d/_export/bailes-pack-raw.glb public/modelos3d/bailes-pack-v1.glb
#
# Detecta los bailes por FIRMA (no por nombre): acciones con curvas de pose.bones y SIN
# huesos Arm/Hand/Shoulder (los bailes del pack se importaron filtrando brazos para no
# soltar el acordeon). Eso excluye solas: el MASTER (tiene brazos), "Abrir y Cerrar Fuelle"
# (tiene mano), las acciones de objeto/shapekey del acordeon y las copias "[mixamorig9]".
# Cada baile va a su propio NLA track (export_animation_mode='NLA_TRACKS') para que el GLB
# salga con una animacion NOMBRADA por baile. NO guarda el blend.
import bpy, os, re, json

RUTA_GLB = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\bailes-pack-raw.glb"
RE_BRAZOS = re.compile(r'(Arm|Hand|Shoulder)')

arm = bpy.data.objects.get("AnimRig")
assert arm and arm.type == 'ARMATURE', "AnimRig no encontrado"
# AnimRig vive OCULTO en el pack (ojito) -> select_set falla en silencio y el export sale vacio.
# Des-ocultar aqui es inofensivo: el blend no se guarda.
arm.hide_viewport = False
arm.hide_set(False)
bpy.context.view_layer.update()

def rutas_de(act):
    rutas = set()
    for layer in act.layers:
        for strip in layer.strips:
            for cb in strip.channelbags:
                for fc in cb.fcurves:
                    rutas.add(fc.data_path)
    return rutas

def es_baile(act):
    if act.name.endswith(']'):
        return False
    rutas = rutas_de(act)
    if not any('pose.bones' in r for r in rutas):
        return False
    if any(RE_BRAZOS.search(r) for r in rutas):
        return False
    return True

bailes = sorted([a for a in bpy.data.actions if es_baile(a)], key=lambda a: a.name)
assert bailes, "ningun baile detectado"

ad = arm.animation_data or arm.animation_data_create()
ad.action = None
for tr in list(ad.nla_tracks):
    ad.nla_tracks.remove(tr)

fps = bpy.context.scene.render.fps
diag = {"fps": fps, "bailes": {}}
for act in bailes:
    tr = ad.nla_tracks.new()
    tr.name = act.name
    f0, f1 = act.frame_range
    strip = tr.strips.new(act.name, max(1, int(f0)), act)
    if hasattr(strip, 'action_slot') and len(act.slots):
        strip.action_slot = act.slots[0]
    diag["bailes"][act.name] = {"frames": int(f1 - f0), "seg": round((f1 - f0) / fps, 2)}

# El exporter glTF DESCARTA armatures sin malla skinneada (los huesos solo viajan via skin)
# -> malla dummy de 1 triangulo pegada a Hips para forzar el esqueleto + animaciones.
me = bpy.data.meshes.new("_DUMMY_SKIN")
me.from_pydata([(0, 0, 0), (0.01, 0, 0), (0, 0.01, 0)], [], [(0, 1, 2)])
dummy = bpy.data.objects.new("_DUMMY_SKIN", me)
bpy.context.scene.collection.objects.link(dummy)
dummy.parent = arm
vg = dummy.vertex_groups.new(name="mixamorig:Hips")
vg.add([0, 1, 2], 1.0, 'REPLACE')
mod = dummy.modifiers.new("Armature", 'ARMATURE')
mod.object = arm

for o in list(bpy.context.selected_objects):
    o.select_set(False)
arm.select_set(True)
dummy.select_set(True)
bpy.context.view_layer.objects.active = arm

os.makedirs(os.path.dirname(RUTA_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA_GLB, use_selection=True,
    export_animations=True, export_animation_mode='NLA_TRACKS',
    export_yup=True, export_apply=False, export_skins=True)
diag["glb_mb"] = round(os.path.getsize(RUTA_GLB) / 1e6, 2)
print("RESULT_JSON:" + json.dumps(diag, ensure_ascii=False))
