# Acordeon COMPARTIDO Pro Max v12: horneado desde el PELAO (.007 / Empty.002), NO desde la Muchacha.
# Por que: las instancias del acordeon difieren ~3 unidades de mundo en los botones de bajos respecto
# a la parrilla. Las manos del Pelao se posaron contra el acordeon del PELAO, asi que el acordeon
# compartido debe ser la instancia del Pelao para que AMBAS manos calcen (igual que el test page).
# Usa los 3 PUNTOS DE REFERENCIA del usuario (scripts/fuelle_puntos.json), que se capturaron en el Pelao:
#   AGARRE  -> base (morph 0)   CERRADO -> morph 'Cerrar'   ABIERTO -> morph 'Abrir'
# Mueve caja.location (el fuelle Spline IK sigue). NO destructivo. Contrato visor: nodo 'parrilla' +
# ACC_<obj> + morphs 'Cerrar'/'Abrir'.
# Comprimir: node scripts/comprimir-acordeon-personaje.mjs <raw> public/modelos3d/acordeon-personaje-v12.glb
import bpy, os
from mathutils import Vector

ACC_ROOT = "Empty.002"                              # raiz del acordeon del Pelao
CTRL = "Ctrl_Bajos.007"
CAJA = "Caja de los bajos, izquierda.007"
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-personaje-v12-raw.glb"

AGARRE  = Vector((-0.250545, -0.321913, 1.37156))
CERRADO = Vector((-0.382521, -0.321987, 1.37598))
ABIERTO = Vector((-0.084248, -0.316395, 1.349512))

sc = bpy.context.scene
root = bpy.data.objects[ACC_ROOT]
ctrl = bpy.data.objects[CTRL]
caja = bpy.data.objects[CAJA]

def descendientes(o):
    out = []
    for c in o.children:
        out.append(c); out.extend(descendientes(c))
    return out
mallas = [o for o in descendientes(root) if o.type == 'MESH' and len(o.data.vertices) > 0]

_subsurf = []
for o in mallas:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            _subsurf.append((m, m.levels)); m.levels = 1

muted = []
for o in (ctrl, caja):
    for c in o.constraints:
        if c.type in ('LIMIT_LOCATION', 'LIMIT_DISTANCE') and not c.mute:
            c.mute = True; muted.append(c)
bpy.context.view_layer.update()

caja_orig = caja.location.copy()
def set_caja(v):
    caja.location = v; bpy.context.view_layer.update()
def snapshot():
    dg = bpy.context.evaluated_depsgraph_get(); out = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        out[o.name] = [mw @ v.co for v in me.vertices]
        bpy.data.meshes.remove(me)
    return out

set_caja(AGARRE)
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())
snapC = (set_caja(CERRADO), snapshot())[1]
snapA = (set_caja(ABIERTO), snapshot())[1]

set_caja(caja_orig)
for m_, lv in _subsurf: m_.levels = lv
for c in muted: c.mute = False
bpy.context.view_layer.update()

tmp = bpy.data.collections.get("_ACCV12_TMP")
if tmp:
    for o in list(tmp.objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCV12_TMP"); sc.collection.children.link(tmp)

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
    if not vwC or len(vwC) != n: continue
    step = max(1, n // 200)
    maxdC = max((vwC[i] - (mw0 @ me0.vertices[i].co)).length for i in range(0, n, step))
    maxdA = max((vwA[i] - (mw0 @ me0.vertices[i].co)).length for i in range(0, n, step)) if vwA and len(vwA)==n else 0
    if maxdC < 0.001 and maxdA < 0.001: continue
    if not me0.shape_keys: nuevo.shape_key_add(name="Basis", from_mix=False)
    kb = nuevo.shape_key_add(name="Cerrar", from_mix=False)
    for i, v in enumerate(vwC): kb.data[i].co = inv0 @ v
    kb.value = 0.0
    if vwA and len(vwA) == n:
        ka = nuevo.shape_key_add(name="Abrir", from_mix=False)
        for i, v in enumerate(vwA): ka.data[i].co = inv0 @ v
        ka.value = 0.0
    con_morph += 1

for o in list(bpy.context.selected_objects): o.select_set(False)
for o in tmp.objects: o.select_set(True)
bpy.context.view_layer.objects.active = tmp.objects[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
import sys; _old = sys.stdout
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
result = {"glb_mb": mb, "mallas": len(mallas), "con_morph": con_morph,
          "caja_restaurada": [round(x, 4) for x in caja.location]}
print("RESULT:", result)
