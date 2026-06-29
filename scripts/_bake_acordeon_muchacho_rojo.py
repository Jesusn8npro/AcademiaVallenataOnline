import bpy, sys, json, math
from mathutils import Matrix, Vector

OUT_BLEND, REPORT_JSON, RENDER_DIR = sys.argv[-3], sys.argv[-2], sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando.blend"
SRC  = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\acordeon original.blend"
rep = {"steps": []}
def log(m): rep["steps"].append(m); print("STEP:", m)

# ---------------------------------------------------------------- 1. open dest, read target
bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()
def emat(n):
    o = bpy.data.objects.get(n); dg = bpy.context.evaluated_depsgraph_get()
    return o.evaluated_get(dg).matrix_world.copy() if o else None
T_parrilla = emat("Caja de parrilla, derecha.004")
assert T_parrilla
char = bpy.data.objects.get("Pelao de rojo"); SPINE = "mixamorig:Spine2"

# ---------------------------------------------------------------- 2. append rigged accordion (TEMP, full scale, correct rest form)
target = bpy.data.collections.get("Acordeon Definitivo Funcional con huesos")
if target is None:
    target = bpy.data.collections.new("Acordeon Definitivo Funcional con huesos")
    bpy.context.scene.collection.children.link(target)
tmpcol = bpy.data.collections.new("__tmp_rigged__")
bpy.context.scene.collection.children.link(tmpcol)
before = set(o.name for o in bpy.data.objects)
with bpy.data.libraries.load(SRC, link=False) as (s, d):
    d.collections = ["Acordeon total", "Fuelle Nuevo"]
for c in [c for c in d.collections if c]:
    tmpcol.children.link(c)
newobjs = [o for o in bpy.data.objects if o.name not in before]
bpy.context.view_layer.update()   # rig solves -> ORIGINAL correct compact/glued form
def one(p): return next(o for o in newobjs if o.name.startswith(p))
cp_src = one("Caja de parrilla"); cb_src = one("Caja de los bajos")
old_fuelle = one("fuelle.")
log("appended %d rigged objs (temp)" % len(newobjs))

# ---------------------------------------------------------------- 3. BAKE each mesh's deformed geometry into static meshes
baked_root = bpy.data.objects.new("Acordeon_Nuevo", None)   # empty, identity
target.objects.link(baked_root)
dg = bpy.context.evaluated_depsgraph_get()
baked_parrilla = None
nbake = 0
for obj in newobjs:
    if obj.type != 'MESH' or obj is old_fuelle:
        continue
    eobj = obj.evaluated_get(dg)
    me = bpy.data.meshes.new_from_object(eobj)
    nobj = bpy.data.objects.new(obj.name.split(".")[0] + "_def", me)
    target.objects.link(nobj)
    nobj.matrix_world = obj.matrix_world          # freeze deformed shape in place
    nobj.parent = baked_root                       # baked_root is identity -> parent_inverse identity
    nobj.matrix_parent_inverse = Matrix.Identity(4)
    if obj is cp_src: baked_parrilla = nobj
    nbake += 1
bpy.context.view_layer.update()
rep["baked_meshes"] = nbake

# ---------------------------------------------------------------- 4. delete the rigged temp objects + temp collections
for o in list(newobjs):
    try: bpy.data.objects.remove(o, do_unlink=True)
    except Exception: pass
def rm_col(c):
    for ch in list(c.children): rm_col(ch)
    try: bpy.data.collections.remove(c)
    except Exception: pass
rm_col(tmpcol)
log("deleted rigged temp")

# ---------------------------------------------------------------- 5. place baked rigidly: parrilla -> old .004
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
M = T_parrilla @ baked_parrilla.evaluated_get(dg).matrix_world.inverted()
baked_root.matrix_world = M @ baked_root.matrix_world
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
rep["parrilla_final"] = [round(c,5) for c in baked_parrilla.evaluated_get(dg).matrix_world.translation]
rep["parrilla_target"] = [round(c,5) for c in T_parrilla.translation]

# ---------------------------------------------------------------- 6. parent to Spine2 (keep world)
root_w = baked_root.matrix_world.copy()
baked_root.parent = char; baked_root.parent_type = 'BONE'; baked_root.parent_bone = SPINE
bpy.context.view_layer.update(); baked_root.matrix_world = root_w; bpy.context.view_layer.update()

# ---------------------------------------------------------------- 7. delete old accordion
oldcol = bpy.data.collections.get("Acordeon - Pelao de rojo"); ndel = 0
if oldcol:
    for o in list(oldcol.objects):
        bpy.data.objects.remove(o, do_unlink=True); ndel += 1
    try: bpy.data.collections.remove(oldcol)
    except Exception as e: rep["col_rm_err"] = str(e)
rep["deleted_old"] = ndel

# ---------------------------------------------------------------- 8. render
try:
    baked_names = set(o.name for o in target.objects)
    mc = bpy.data.collections.get("Muchacho de rojo")
    show = set(baked_names)
    for o in mc.objects: show.add(o.name)
    for o in bpy.data.objects: o.hide_render = (o.name not in show)
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'; scn.render.resolution_x = 950; scn.render.resolution_y = 800
    scn.display.shading.light = 'STUDIO'; scn.display.shading.show_cavity = True
    dg = bpy.context.evaluated_depsgraph_get()
    mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
    for n in baked_names:
        o = bpy.data.objects.get(n)
        if not o or o.type != 'MESH': continue
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c)
            for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
    mid = (mn+mx)/2; diag = (mx-mn).length
    cam = bpy.data.objects.new("VCam", bpy.data.cameras.new("VCam")); cam.data.lens = 55
    scn.collection.objects.link(cam); scn.camera = cam
    def shoot(n, az, el, r):
        a=math.radians(az); e=math.radians(el)
        d=Vector((math.cos(e)*math.cos(a), math.cos(e)*math.sin(a), math.sin(e)))
        cam.location = mid + d*r
        cam.rotation_euler = (mid-cam.location).to_track_quat('-Z','Y').to_euler()
        scn.render.filepath = RENDER_DIR + "\\" + n + ".png"; bpy.ops.render.render(write_still=True)
    # accordion-only (hide character) to inspect bellows form
    for o in bpy.data.objects:
        if o.name in set(x.name for x in mc.objects): o.hide_render = True
    shoot("acc_side", 90, 3, diag*1.2)
    shoot("acc_3q",   55, 18, diag*1.2)
    # with character
    for o in bpy.data.objects: o.hide_render = (o.name not in show)
    midc = (Vector(rep["parrilla_final"]) + Vector(rep["parrilla_final"]))/2
    cam.location = Vector(rep["parrilla_final"]) + Vector((math.cos(math.radians(250))*0.9, math.sin(math.radians(250))*0.9, 0.18))
    cam.rotation_euler = (Vector(rep["parrilla_final"]) - cam.location).to_track_quat('-Z','Y').to_euler()
    scn.render.filepath = RENDER_DIR + "\\char_3q.png"; bpy.ops.render.render(write_still=True)
    rep["rendered"] = True
except Exception:
    import traceback; rep["render_err"] = traceback.format_exc()

# ---------------------------------------------------------------- 9. save
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
with open(REPORT_JSON, "w", encoding="utf-8") as f: json.dump(rep, f, ensure_ascii=False, indent=1)
print("ALL DONE")
