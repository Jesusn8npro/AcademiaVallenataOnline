# Re-hornea el PELAO para /test-personaje-3d con el fuelle COMPACTO por default (como los otros 5
# personajes) y que ABRA/estire al apretar Q. Usa las DOS poses guardadas del panel Fuelle (exacto):
#   BASIS (default, apertura 0) = "Fuelle cerrado"  -> look COMPACTO (mide 22.44 por origen, pero VISUAL compacto)
#   Q-end (apertura 1)          = "Fuelle normal"   -> look ESTIRADO  (mide 7.56)
# OJO: los origenes de las cajas MIENTEN -> la distancia numerica esta invertida vs lo visual; por eso
# se usan las poses guardadas (no numeros). Mueve Ctrl+caja interpolando ambas poses; brazo sigue por IK,
# fuelle por Spline IK -> se hornean como morphs Cerrar_1..N. SIN skins. NO destructivo (restaura todo).
# Comprimir: node scripts/comprimir-pelao-fuelle.mjs <raw> public/modelos3d/pelao-grip-v4.glb
import bpy, os, json
from mathutils import Vector, Euler

MESH_NAME = "Pelao"
CTRL = "Ctrl_Bajos.007"
CAJA = "Caja de los bajos, izquierda.007"
PARR = "parrilla.007"
COL_ACC = "Acordeon - Pelao moreno"
REF_BASIS = "Fuelle cerrado"   # compacto (default)
REF_END   = "Fuelle normal"    # estirado (Q)
NMORPH = 3
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\pelao-grip-raw.glb"

sc = bpy.context.scene
f0 = sc.frame_current
ctrl = bpy.data.objects[CTRL]
caja = bpy.data.objects[CAJA]
parr = bpy.data.objects[PARR]
col = bpy.data.collections[COL_ACC]
body = bpy.data.objects[MESH_NAME]
mallas = [body] + [o for o in col.objects if o.type == 'MESH']

refs = {r["name"]: r for r in json.loads(sc.get("fuelle_refs", "[]"))}
rb, re = refs[REF_BASIS], refs[REF_END]
cb, ce = Vector(rb["caja_loc"]), Vector(re["caja_loc"])
crb, cre = Vector(rb["caja_rot_euler"]), Vector(re["caja_rot_euler"])
ctb = Vector(rb["ctrl_loc"]) if rb.get("ctrl_loc") else None
cte = Vector(re["ctrl_loc"]) if re.get("ctrl_loc") else None

# estado original (para restaurar) + neutralizar accion del ctrl
ctrl_loc0 = ctrl.location.copy()
caja_loc0 = caja.location.copy(); caja_rot0 = caja.rotation_euler.copy()
_act0 = None
if ctrl.animation_data and ctrl.animation_data.action:
    _act0 = ctrl.animation_data.action; ctrl.animation_data.action = None

# mutear topes
_muted = []
for o in (ctrl, caja):
    for c in o.constraints:
        if c.type in ('LIMIT_LOCATION', 'LIMIT_DISTANCE') and not c.mute:
            c.mute = True; _muted.append(c)
bpy.context.view_layer.update()

tmp = bpy.data.collections.get("_PELAOFUELLE_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_PELAOFUELLE_TMP")
    sc.collection.children.link(tmp)

_subsurf = []
for _o in mallas:
    for _m in _o.modifiers:
        if _m.type == 'SUBSURF':
            _subsurf.append((_m, _m.levels)); _m.levels = 1
bpy.context.view_layer.update()

def _pose_at(t):  # t=0 -> Fuelle cerrado (compacto), t=1 -> Fuelle normal (estirado)
    caja.location = cb.lerp(ce, t)
    caja.rotation_euler = Euler(crb.lerp(cre, t))
    if ctb is not None and cte is not None:
        ctrl.location = ctb.lerp(cte, t)
    bpy.context.view_layer.update()

# BASIS = compacto
_pose_at(0.0)
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

snaps = []
for i in range(1, NMORPH + 1):
    _pose_at(i / NMORPH)
    dg = bpy.context.evaluated_depsgraph_get()
    snap = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        snap[o.name] = [mw @ v.co for v in me.vertices]
        bpy.data.meshes.remove(me)
    snaps.append(snap)

# restaurar caja/ctrl + subsurf
ctrl.location = ctrl_loc0
caja.location = caja_loc0; caja.rotation_euler = caja_rot0
for _m, _lv in _subsurf:
    _m.levels = _lv
bpy.context.view_layer.update()

objs = []; errores = []; con_morph = 0
for o in mallas:
    me0, mw0 = base[o.name]
    inv0 = mw0.inverted()
    if o is body:
        nombre = "Pelao"
    elif o.name.startswith("parrilla"):
        nombre = "parrilla"
    else:
        nombre = "ACC_" + o.name
    me0.name = nombre
    nuevo = bpy.data.objects.new(nombre, me0)
    nuevo.matrix_world = mw0
    tmp.objects.link(nuevo); objs.append(nuevo)
    n = len(me0.vertices)
    vwL = snaps[-1].get(o.name)
    if not vwL or len(vwL) != n:
        if vwL is not None and len(vwL) != n:
            errores.append(o.name + ":topo")
        continue
    maxd = 0.0
    for k in range(0, n, max(1, n // 200)):
        d = (vwL[k] - (mw0 @ me0.vertices[k].co)).length
        if d > maxd:
            maxd = d
    if maxd < 0.0005:
        continue
    if not me0.shape_keys:
        nuevo.shape_key_add(name="Basis", from_mix=False)
    for i in range(1, NMORPH + 1):
        vw = snaps[i - 1][o.name]
        kb = nuevo.shape_key_add(name="Cerrar_%d" % i, from_mix=False)
        for k, wc in enumerate(vw):
            kb.data[k].co = inv0 @ wc
        kb.value = 0.0
    con_morph += 1

ancla = bpy.data.objects.new("AnclaAcordeon", None)
tmp.objects.link(ancla)
ancla.matrix_world = parr.matrix_world.copy()

for o in list(bpy.context.selected_objects):
    o.select_set(False)
for o in tmp.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
    export_animations=False, export_morph=True, export_skins=False,
    export_yup=True, export_apply=False, export_image_format='AUTO')
mb = round(os.path.getsize(RUTA) / 1e6, 2)

# RESTAURAR TODO
ctrl.location = ctrl_loc0
caja.location = caja_loc0; caja.rotation_euler = caja_rot0
for c in _muted:
    c.mute = False
if _act0 is not None:
    ctrl.animation_data.action = _act0
datas = []
for o in list(tmp.objects):
    if o.data and o.type == 'MESH':
        datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
sc.frame_set(f0)
bpy.context.view_layer.update()
result = {"glb_mb": mb, "mallas": len(mallas), "con_morph": con_morph,
          "nmorph": NMORPH, "errores": errores[:8]}
print("RESULT:", result)
