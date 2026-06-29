# Exporta SOLO el cuerpo de un personaje (sin acordeon) en el marco del ANCLA (parrilla -> origen),
# para usarlo con el acordeon COMPARTIDO (exportar-acordeon-compartido.py). La mano queda pegada porque
# el cuerpo ya esta posado para esa pose y el acordeon compartido cae en el mismo marco-ancla.
#   - mallas del cuerpo = skinned al armature del cuerpo. Horneadas estaticas (SIN skins), pose actual.
#   - REPOSE opcional (para el Pelao, que esta posado distinto): mueve su Ctrl hasta que la caja de bajos
#     caiga en x=-1.156 en marco-ancla (el grip estandar de los otros 5); el brazo sigue por IK.
# Inyectar PERS_OVERRIDE en el namespace antes de exec().
# Comprimir: node scripts/comprimir-pelao-fuelle.mjs <raw> public/modelos3d/<slug>-cuerpo-v1.glb
import bpy, os
from mathutils import Vector, Matrix

PERS = globals().get("PERS_OVERRIDE") or {
    "slug": "muchacha", "BODY_ARM": "Cuerpo Muchacha", "ANCHOR": "parrilla.001",
}
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\%s-cuerpo-raw.glb" % PERS["slug"]
REPOSE = PERS.get("REPOSE")   # opcional: {"CTRL":..,"CAJA":..,"CAJA_PARR":..,"target_x":-1.156}

sc = bpy.context.scene
body_arm = bpy.data.objects[PERS["BODY_ARM"]]
anchor = bpy.data.objects[PERS["ANCHOR"]]

# mallas del cuerpo = skinned a este armature
def descendientes(o):
    out = []
    for c in o.children:
        out.append(c); out.extend(descendientes(c))
    return out
todos = [body_arm] + descendientes(body_arm)
mallas = [o for o in todos if o.type == 'MESH' and len(o.data.vertices) > 0
          and any(m.type == 'ARMATURE' and m.object == body_arm for m in o.modifiers)]

# --- REPOSE opcional (Pelao) ---
_restore = None
if REPOSE:
    ctrl = bpy.data.objects[REPOSE["CTRL"]]
    caja = bpy.data.objects[REPOSE["CAJA"]]
    cajap = bpy.data.objects[REPOSE["CAJA_PARR"]]
    muted = []
    for o in (ctrl, caja):
        for c in o.constraints:
            if c.type in ('LIMIT_LOCATION', 'LIMIT_DISTANCE') and not c.mute:
                c.mute = True; muted.append(c)
    mw0 = ctrl.matrix_world.copy()
    def box_x():
        bpy.context.view_layer.update()
        return (anchor.matrix_world.inverted() @ caja.matrix_world.translation).x
    # direccion de cierre en mundo (de bajos hacia parrilla)
    bpy.context.view_layer.update()
    d = (cajap.matrix_world.translation - caja.matrix_world.translation).normalized()
    tgt = REPOSE.get("target_x", -1.156)
    # busqueda lineal del desplazamiento que da box_x = target
    best = None
    for s in [i * 0.1 for i in range(-120, 121)]:
        m = mw0.copy(); m.translation = mw0.translation + d * s
        ctrl.matrix_world = m
        bx = box_x()
        if best is None or abs(bx - tgt) < abs(best[1] - tgt):
            best = (s, bx)
    m = mw0.copy(); m.translation = mw0.translation + d * best[0]
    ctrl.matrix_world = m
    bpy.context.view_layer.update()
    _restore = (ctrl, mw0, muted, best)

# Subsurf -> 1 (por si el cuerpo tiene)
_subsurf = []
for o in mallas:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            _subsurf.append((m, m.levels)); m.levels = 1
bpy.context.view_layer.update()

Ainv = anchor.matrix_world.inverted()
tmp = bpy.data.collections.get("_CUERPO_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_CUERPO_TMP")
    sc.collection.children.link(tmp)

dg = bpy.context.evaluated_depsgraph_get()
objs = []
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    me.transform(Ainv @ ev.matrix_world)
    me.name = o.name
    nuevo = bpy.data.objects.new(o.name, me)
    tmp.objects.link(nuevo); objs.append(nuevo)

for o in list(bpy.context.selected_objects):
    o.select_set(False)
for o in tmp.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
os.makedirs(os.path.dirname(RUTA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=RUTA, use_selection=True,
    export_animations=False, export_morph=False, export_skins=False,
    export_yup=True, export_apply=False, export_image_format='AUTO')
mb = round(os.path.getsize(RUTA) / 1e6, 2)

# restaurar
for m, lv in _subsurf:
    m.levels = lv
if _restore:
    ctrl, mw0, muted, best = _restore
    ctrl.matrix_world = mw0
    for c in muted: c.mute = False
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
result = {"slug": PERS["slug"], "glb_mb": mb, "mallas": len(mallas),
          "repose_x": (_restore[3][1] if _restore else None)}
print("RESULT:", result)
