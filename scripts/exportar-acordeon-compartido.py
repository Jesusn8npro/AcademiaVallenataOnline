# Exporta UN acordeon COMPARTIDO para todos los personajes (pestaña Personaje / mundo).
# Idea: como TODOS los cuerpos estan posados igual gripando el acordeon en la MISMA pose, el acordeon
# se relaciona IDENTICO con cada cuerpo en el marco del ANCLA (parrilla). Verificado: caja de bajos en
# marco-ancla = [-1.156,...] en los 5 personajes. Entonces 1 solo acordeon, anclado, pega en todos.
#   -> exportamos el acordeon en el marco del ANCLA (parrilla -> origen), pose COMPACTA (reposo).
#   -> los cuerpos se exportan aparte tambien en marco-ancla (exportar-cuerpo-solo.py).
#   -> en la web: cuerpo (anclado) + ESTE acordeon (anclado) en el mismo grupo => mano pegada.
# Actualizas el acordeon (textura/forma) -> re-exportas SOLO este archivo -> global para todos.
# Fuente: acordeon de la Muchacha (.001), identico a los demas, ya en la pose -1.156. SIN skins, estatico.
# Comprimir: node scripts/comprimir-acordeon-personaje.mjs <raw> public/modelos3d/acordeon-compartido-v1.glb
import bpy, os
from mathutils import Matrix

BODY_ARM = "Cuerpo Muchacha"          # de quien tomamos la copia del acordeon (da igual cual, son identicos)
ANCHOR   = "parrilla.001"             # ancla = parrilla de esa copia
RUTA = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-compartido-raw.glb"

sc = bpy.context.scene
body_arm = bpy.data.objects[BODY_ARM]
anchor = bpy.data.objects[ANCHOR]

def descendientes(o):
    out = []
    for c in o.children:
        out.append(c); out.extend(descendientes(c))
    return out
todos = descendientes(body_arm)
# acordeon = mallas que NO estan skinned al armature del cuerpo
def es_cuerpo(o):
    return any(m.type == 'ARMATURE' and m.object == body_arm for m in o.modifiers)
mallas = [o for o in todos if o.type == 'MESH' and len(o.data.vertices) > 0 and not es_cuerpo(o)]

# Subsurf -> 1 (aros pesados)
_subsurf = []
for o in mallas:
    for m in o.modifiers:
        if m.type == 'SUBSURF':
            _subsurf.append((m, m.levels)); m.levels = 1
bpy.context.view_layer.update()

Ainv = anchor.matrix_world.inverted()   # marco del ancla

tmp = bpy.data.collections.get("_ACCSHARE_TMP")
if tmp:
    for o in list(tmp.objects):
        bpy.data.objects.remove(o, do_unlink=True)
else:
    tmp = bpy.data.collections.new("_ACCSHARE_TMP")
    sc.collection.children.link(tmp)

dg = bpy.context.evaluated_depsgraph_get()
objs = []
for o in mallas:
    ev = o.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(ev, preserve_all_data_layers=True, depsgraph=dg)
    M = Ainv @ ev.matrix_world          # verts a marco-ancla
    me.transform(M)
    if o.name.lower().startswith("parrilla"):
        nombre = "parrilla"
    else:
        nombre = "ACC_" + o.name
    me.name = nombre
    nuevo = bpy.data.objects.new(nombre, me)
    tmp.objects.link(nuevo); objs.append(nuevo)

# ancla en origen (referencia)
ancla = bpy.data.objects.new("AnclaAcordeon", None)
tmp.objects.link(ancla)

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

# restaurar subsurf + limpiar tmp
for m, lv in _subsurf:
    m.levels = lv
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
result = {"glb_mb": mb, "mallas": len(mallas)}
print("RESULT:", result)
