# Exporta el acordeon COMPARTIDO desde el archivo MASTER "acordeon original no modificar.blend".
# Hace de ese archivo la FUENTE UNICA del acordeon web: editas forma/texturas alli -> corres esto ->
# 1 GLB -> global para los 6 personajes. NO destructivo: mueve Ctrl + mutea topes y RESTAURA. NO guarda.
# La pose se ajusta al GRIP ESTANDAR (caja de bajos en x=-1.156 en marco-ancla) para que pegue en todos.
# Comprimir: node scripts/comprimir-pelao-fuelle.mjs <raw> public/modelos3d/acordeon-compartido-vN.glb
import bpy, os
from mathutils import Vector

ANCHOR = "parrilla"
CTRL   = "Ctrl_Bajos"
CAJA   = "Caja de los bajos, izquierda"
TARGET_X = -1.156
JUNK = {"Cube", "Fuelle20_BACKUP", "fuelle", "Fuelle (tela)"}  # fuelles viejos/duplicados
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-compartido-v2-raw.glb"

sc = bpy.context.scene
anchor = bpy.data.objects[ANCHOR]
ctrl = bpy.data.objects[CTRL]
caja = bpy.data.objects[CAJA]

# mutear topes
muted = []
for o in (ctrl, caja):
    for c in o.constraints:
        if c.type in ('LIMIT_LOCATION', 'LIMIT_DISTANCE') and not c.mute:
            c.mute = True; muted.append(c)
bpy.context.view_layer.update()

mw0 = ctrl.matrix_world.copy()
# colocacion DIRECTA: poner la caja de bajos en x=TARGET_X dentro del marco-ancla (conserva y,z)
bpy.context.view_layer.update()
Ainv0 = anchor.matrix_world.inverted()
cur = Ainv0 @ caja.matrix_world.translation
target_world = anchor.matrix_world @ Vector((TARGET_X, cur.y, cur.z))
delta = target_world - caja.matrix_world.translation
m = mw0.copy(); m.translation = mw0.translation + delta  # mover Ctrl => la caja (hija) sigue
ctrl.matrix_world = m
bpy.context.view_layer.update()
best = (0.0, round((anchor.matrix_world.inverted() @ caja.matrix_world.translation).x, 3))

# mallas del acordeon = todas menos junk / vacias
mallas = [o for o in bpy.data.objects if o.type == 'MESH' and o.name not in JUNK and len(o.data.vertices) > 0]

_subsurf = []
for o in mallas:
    for mod in o.modifiers:
        if mod.type == 'SUBSURF':
            _subsurf.append((mod, mod.levels)); mod.levels = 1
bpy.context.view_layer.update()

Ainv = anchor.matrix_world.inverted()
tmp = bpy.data.collections.get("_ACCSHAREORIG_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCSHAREORIG_TMP")
    sc.collection.children.link(tmp)

dg = bpy.context.evaluated_depsgraph_get()
objs = []
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    me.transform(Ainv @ ev.matrix_world)
    nombre = "parrilla" if o.name.lower().startswith("parrilla") else ("ACC_" + o.name)
    me.name = nombre
    nuevo = bpy.data.objects.new(nombre, me)
    tmp.objects.link(nuevo); objs.append(nuevo)
ancla = bpy.data.objects.new("AnclaAcordeon", None)
tmp.objects.link(ancla)

for o in list(bpy.context.selected_objects):
    o.select_set(False)
for o in tmp.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
import sys
_old = sys.stdout
try:
    sys.stdout = open(os.devnull, "w")
    bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
        export_animations=False, export_morph=False, export_skins=False,
        export_yup=True, export_apply=False, export_image_format='AUTO')
finally:
    sys.stdout = _old
mb = round(os.path.getsize(RUTA) / 1e6, 2)

# RESTAURAR TODO (no modificar)
ctrl.matrix_world = mw0
for c in muted:
    c.mute = False
for mod, lv in _subsurf:
    mod.levels = lv
datas = []
for o in list(tmp.objects):
    if o.data and o.type == 'MESH':
        datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
bpy.context.view_layer.update()
result = {"glb_mb": mb, "mallas": len(mallas), "box_x_logrado": round(best[1], 3),
          "target_x": TARGET_X}
print("RESULT:", result)
