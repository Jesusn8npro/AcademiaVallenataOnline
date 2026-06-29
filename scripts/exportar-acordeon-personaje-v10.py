# Acordeon COMPARTIDO Pro Max v10: desde la Muchacha .001 (donde agarran los 5 personajes: caja en
# parrilla-local -1.156 = la misma postura del test page). Contrato del visor: nodo 'parrilla'
# (matrix_world real, NO horneado a origen) + ACC_<obj> + morph 'Cerrar'. El morph 'Cerrar' mueve la
# caja por D_LOCAL_CIERRE = EXACTAMENTE lo que mueve la mano la accion 'Cierre' del cuerpo (v5) =>
# fuelle y mano cierran sincronizados, mano pegada. NO destructivo (restaura ctrl/topes/subsurf).
# Comprimir: node scripts/comprimir-acordeon-personaje.mjs <raw> public/modelos3d/acordeon-personaje-v10.glb
import bpy, os
from mathutils import Vector, Matrix

BODY_ARM = "Cuerpo Muchacha"
CTRL = "Ctrl_Bajos.001"
CAJA = "Caja de los bajos, izquierda.001"
PARR = "parrilla.001"
D_LOCAL_CIERRE = Vector((-0.5984, -0.0017, -0.0016))  # mismo que el cuerpo (v5) -> sincroniza
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-personaje-v10-raw.glb"

sc = bpy.context.scene
body_arm = bpy.data.objects[BODY_ARM]
ctrl = bpy.data.objects[CTRL]
caja = bpy.data.objects[CAJA]
parr = bpy.data.objects[PARR]

def descendientes(o):
    out = []
    for c in o.children:
        out.append(c); out.extend(descendientes(c))
    return out
def es_cuerpo(o):
    return any(m.type == 'ARMATURE' and m.object == body_arm for m in o.modifiers)
mallas = [o for o in descendientes(body_arm)
          if o.type == 'MESH' and len(o.data.vertices) > 0 and not es_cuerpo(o)]

_subsurf = []
for o in mallas:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            _subsurf.append((m, m.levels)); m.levels = 1
bpy.context.view_layer.update()

muted = []
for o in (ctrl, caja):
    for c in o.constraints:
        if c.type in ('LIMIT_LOCATION', 'LIMIT_DISTANCE') and not c.mute:
            c.mute = True; muted.append(c)
bpy.context.view_layer.update()

mw0_ctrl = ctrl.matrix_world.copy()
d_world = caja.matrix_world.to_3x3() @ D_LOCAL_CIERRE

# BASIS = reposo (agarre, caja en -1.156)
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

# CERRADO = caja movida por +d_world (igual que la mano de bajos)
def snap_at(delta):
    m = mw0_ctrl.copy(); m.translation = mw0_ctrl.translation + delta
    ctrl.matrix_world = m
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    out = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        out[o.name] = [mw @ v.co for v in me.vertices]
        bpy.data.meshes.remove(me)
    return out
snapC = snap_at(d_world)    # Cerrar (cerrado)
snapA = snap_at(-d_world)   # Abrir (abierto, direccion opuesta)

# restaurar
ctrl.matrix_world = mw0_ctrl
for m_, lv in _subsurf:
    m_.levels = lv
for c in muted:
    c.mute = False
bpy.context.view_layer.update()

tmp = bpy.data.collections.get("_ACCV10_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCV10_TMP"); sc.collection.children.link(tmp)

con_morph = 0
for o in mallas:
    me0, mw0 = base[o.name]
    inv0 = mw0.inverted()
    nombre = "parrilla" if o.name.lower().startswith("parrilla") else "ACC_" + o.name
    me0.name = nombre
    nuevo = bpy.data.objects.new(nombre, me0)
    nuevo.matrix_world = mw0
    tmp.objects.link(nuevo)
    n = len(me0.vertices)
    vwC = snapC.get(o.name); vwA = snapA.get(o.name)
    if not vwC or len(vwC) != n:
        continue
    maxd = 0.0
    for i in range(0, n, max(1, n // 200)):
        d = (vwC[i] - (mw0 @ me0.vertices[i].co)).length
        if d > maxd:
            maxd = d
    if maxd < 0.001:
        continue
    if not me0.shape_keys:
        nuevo.shape_key_add(name="Basis", from_mix=False)
    kb = nuevo.shape_key_add(name="Cerrar", from_mix=False)
    for i, v in enumerate(vwC):
        kb.data[i].co = inv0 @ v
    kb.value = 0.0
    if vwA and len(vwA) == n:
        ka = nuevo.shape_key_add(name="Abrir", from_mix=False)
        for i, v in enumerate(vwA):
            ka.data[i].co = inv0 @ v
        ka.value = 0.0
    con_morph += 1

for o in list(bpy.context.selected_objects): o.select_set(False)
for o in tmp.objects: o.select_set(True)
bpy.context.view_layer.objects.active = tmp.objects[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
import sys
_old = sys.stdout
try:
    sys.stdout = open(os.devnull, "w")
    bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
        export_animations=False, export_yup=True, export_apply=False,
        export_image_format='AUTO', export_morph=True, export_skins=False)
finally:
    sys.stdout = _old
mb = round(os.path.getsize(RUTA) / 1e6, 2)
datas = []
for o in list(tmp.objects):
    if o.data: datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
bpy.context.view_layer.update()
result = {"glb_mb": mb, "mallas": len(mallas), "con_morph": con_morph}
print("RESULT:", result)
