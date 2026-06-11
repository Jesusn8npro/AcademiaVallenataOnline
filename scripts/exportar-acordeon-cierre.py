# Export del ACORDEON COMPARTIDO v2 — correr INLINE con PACK-BAILES.blend ABIERTO
# (via MCP execute_blender_code o consola de Blender). NO guarda el .blend.
# Hornea por depsgraph 3 estados de "Abrir y Cerrar Fuelle" sobre el acordeon de Pelao:
#   basis  = f34 (AGARRE, frame_agarre de Ctrl_Bajos.001)
#   Cerrar = f58 (cerrado total, Cerrar=-1.4, la caja viaja ~8.76cm)
#   Abrir  = f1  (abierto total; reservado, el visor aun no lo usa)
# Nombres: ACC_<obj> y 'parrilla' (contrato del visor); materiales acc_* se conservan.
# Luego comprimir:
#   node scripts/comprimir-acordeon-personaje.mjs public/modelos3d/_export/acordeon-cierre-raw.glb public/modelos3d/acordeon-personaje-v2.glb
import bpy, os

F_AGARRE, F_CERRADO, F_ABIERTO = 34, 58, 1
sc = bpy.context.scene
f0 = sc.frame_current
col = bpy.data.collections["Acordeon - Pelao armature moreno"]

tmp = bpy.data.collections.get("_ACCV2_TMP")
if tmp:
    for o in list(tmp.objects): bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCV2_TMP")
    sc.collection.children.link(tmp)

mallas = [o for o in col.objects if o.type == 'MESH']

def snapshot(frame):
    sc.frame_set(frame)
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    out = {}
    for o in mallas:
        ev = o.evaluated_get(dg)
        me = bpy.data.meshes.new_from_object(ev)
        mw = ev.matrix_world.copy()
        out[o.name] = ([mw @ v.co for v in me.vertices], mw)
        bpy.data.meshes.remove(me)
    return out

sc.frame_set(F_AGARRE)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
base = {}
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    base[o.name] = (me, ev.matrix_world.copy())

snapC = snapshot(F_CERRADO)
snapA = snapshot(F_ABIERTO)

errores = []
for o in mallas:
    me34, mw34 = base[o.name]
    inv34 = mw34.inverted()
    nuevo = bpy.data.objects.new(("parrilla" if o.name.startswith("parrilla") else "ACC_" + o.name), me34)
    nuevo.matrix_world = mw34
    tmp.objects.link(nuevo)
    n = len(me34.vertices)
    for etiqueta, snap in (("Cerrar", snapC), ("Abrir", snapA)):
        vw, _ = snap[o.name]
        if len(vw) != n:
            errores.append(f"{o.name}: topologia {etiqueta}"); continue
        maxd = 0.0
        for i in range(0, n, max(1, n // 200)):
            d = (vw[i] - (mw34 @ me34.vertices[i].co)).length
            if d > maxd: maxd = d
        if maxd < 0.001: continue  # pieza quieta
        if not me34.shape_keys: nuevo.shape_key_add(name="Basis", from_mix=False)
        kb = nuevo.shape_key_add(name=etiqueta, from_mix=False)
        for i, v in enumerate(vw): kb.data[i].co = inv34 @ v
        kb.value = 0.0

for o in list(bpy.context.selected_objects): o.select_set(False)
for o in tmp.objects: o.select_set(True)
bpy.context.view_layer.objects.active = tmp.objects[0]
ruta = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-cierre-raw.glb"
os.makedirs(os.path.dirname(ruta), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=ruta, use_selection=True,
    export_animations=False, export_yup=True, export_apply=False,
    export_image_format='AUTO', export_morph=True)

# limpiar temporales (las mallas base quedan dentro de los objetos exportados -> se borran juntas)
datas = []
for o in list(tmp.objects):
    if o.data: datas.append(o.data)
    bpy.data.objects.remove(o, do_unlink=True)
bpy.data.collections.remove(tmp)
for d in datas:
    try: bpy.data.meshes.remove(d)
    except Exception: pass
sc.frame_set(f0)
result = {"glb_mb": round(os.path.getsize(ruta)/1e6, 2), "errores": errores}
