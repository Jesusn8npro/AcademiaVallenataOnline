import bpy, sys, json, math
from mathutils import Matrix, Vector

OUT_BLEND, REPORT_JSON, RENDER_DIR = sys.argv[-3], sys.argv[-2], sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando.blend"
SRC  = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\acordeon original.blend"
rep = {"steps": []}
def log(m): rep["steps"].append(m); print("STEP:", m)

# 1. open dest, read target (Muchacho .004 = Pelao-Pose separation, norm 0.991)
bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()
def emat(n):
    o = bpy.data.objects.get(n); dg = bpy.context.evaluated_depsgraph_get()
    return o.evaluated_get(dg).matrix_world.copy() if o else None
T_parrilla = emat("Caja de parrilla, derecha.004")
T_bass     = emat("Caja de los bajos, izquierda.004")
char = bpy.data.objects.get("Pelao de rojo"); SPINE = "mixamorig:Spine2"
target_norm = (T_bass.translation - T_parrilla.translation).length / (sum(v.length for v in T_parrilla.to_3x3().col)/3)
rep["target_norm"] = round(target_norm, 4)

# 2. append rig (temp, full scale)
target = bpy.data.collections.get("Acordeon Definitivo Funcional con huesos")
if target is None:
    target = bpy.data.collections.new("Acordeon Definitivo Funcional con huesos")
    bpy.context.scene.collection.children.link(target)
tmpcol = bpy.data.collections.new("__tmp__"); bpy.context.scene.collection.children.link(tmpcol)
before = set(o.name for o in bpy.data.objects)
with bpy.data.libraries.load(SRC, link=False) as (s, d):
    d.collections = ["Acordeon total", "Fuelle Nuevo"]
for c in [c for c in d.collections if c]:
    tmpcol.children.link(c)
newobjs = [o for o in bpy.data.objects if o.name not in before]
def one(p): return next(o for o in newobjs if o.name.startswith(p))
cp_src = one("Caja de parrilla"); cb_src = one("Caja de los bajos")
ctrl = one("Ctrl_Bajos"); old_fuelle = one("fuelle.")
log("appended %d objs" % len(newobjs))

# 3. CLOSE to target_norm via Ctrl_Bajos.x (rig folds the fuelle cleanly at full scale)
def cur_norm():
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    pw = cp_src.evaluated_get(dg).matrix_world; bw = cb_src.evaluated_get(dg).matrix_world
    scl = sum(v.length for v in pw.to_3x3().col)/3
    return (bw.translation - pw.translation).length / scl
best_x, best_err = 0.435, 1e9
for i in range(0, 40):
    x = 0.40 + 0.004*i
    ctrl.location.x = x; n = cur_norm(); e = abs(n - target_norm)
    if e < best_err: best_err, best_x = e, x
ctrl.location.x = best_x; bpy.context.view_layer.update()
rep["close_x"] = round(best_x,4); rep["norm_after_close"] = round(cur_norm(),4)

# 4. BAKE deformed geometry into static meshes
baked_root = bpy.data.objects.new("Acordeon_Nuevo", None); target.objects.link(baked_root)
dg = bpy.context.evaluated_depsgraph_get()
baked_parrilla = None; nbake = 0
for obj in newobjs:
    if obj.type != 'MESH' or obj is old_fuelle: continue
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    nobj = bpy.data.objects.new(obj.name.split(".")[0] + "_def", me)
    target.objects.link(nobj)
    nobj.matrix_world = obj.matrix_world
    nobj.parent = baked_root; nobj.matrix_parent_inverse = Matrix.Identity(4)
    if obj is cp_src: baked_parrilla = nobj
    nbake += 1
bpy.context.view_layer.update(); rep["baked"] = nbake

# 5. delete temp rig
for o in list(newobjs):
    try: bpy.data.objects.remove(o, do_unlink=True)
    except Exception: pass
def rmcol(c):
    for ch in list(c.children): rmcol(ch)
    try: bpy.data.collections.remove(c)
    except Exception: pass
rmcol(tmpcol)

# 6. place baked rigidly: parrilla -> T_parrilla
bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
M = T_parrilla @ baked_parrilla.evaluated_get(dg).matrix_world.inverted()
baked_root.matrix_world = M @ baked_root.matrix_world
bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
# find baked bass box to measure sep
bb = next((o for o in target.objects if o.name.startswith("Caja de los bajos")), None)
cp_f = baked_parrilla.evaluated_get(dg).matrix_world.translation
rep["parrilla_err"] = round((cp_f - T_parrilla.translation).length, 5)
if bb:
    cb_f = bb.evaluated_get(dg).matrix_world.translation
    rep["bajos_err_vs_004"] = round((cb_f - T_bass.translation).length, 5)
    rep["sep_final"] = round((cb_f - cp_f).length, 5)

# 6.5 CENTER the fuelle on the box midpoint (match Pelao Pose: fuelle center == box center)
dg = bpy.context.evaluated_depsgraph_get()
def ctr(o):
    cs = [o.evaluated_get(dg).matrix_world @ Vector(c) for c in o.evaluated_get(dg).bound_box]
    return sum(cs, Vector()) / 8
bbx = next((o for o in target.objects if o.name.startswith("Caja de los bajos")), None)
mid = (ctr(baked_parrilla) + ctr(bbx)) / 2
fmeshes = [o for o in target.objects if o.name.startswith("Fuelle20") or o.name.startswith("Aro 16")]
fc = sum([ctr(o) for o in fmeshes], Vector()) / len(fmeshes)
off = mid - fc
for o in fmeshes:
    o.matrix_world = Matrix.Translation(off) @ o.matrix_world
bpy.context.view_layer.update()
rep["centering_offset"] = [round(c, 4) for c in off]
dg = bpy.context.evaluated_depsgraph_get()
fc2 = sum([ctr(o) for o in fmeshes], Vector()) / len(fmeshes)
rep["fuelle_offset_after"] = round((fc2 - mid).length, 4)

# 7. parent to Spine2 (keep world)
root_w = baked_root.matrix_world.copy()
baked_root.parent = char; baked_root.parent_type = 'BONE'; baked_root.parent_bone = SPINE
bpy.context.view_layer.update(); baked_root.matrix_world = root_w; bpy.context.view_layer.update()

# 8. delete old accordion
oldcol = bpy.data.collections.get("Acordeon - Pelao de rojo"); ndel = 0
if oldcol:
    for o in list(oldcol.objects):
        bpy.data.objects.remove(o, do_unlink=True); ndel += 1
    try: bpy.data.collections.remove(oldcol)
    except Exception: pass
rep["deleted_old"] = ndel

# 9. render
try:
    baked_names = set(o.name for o in target.objects)
    mc = bpy.data.collections.get("Muchacho de rojo")
    show = set(baked_names) | set(o.name for o in mc.objects)
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'; scn.render.resolution_x = 950; scn.render.resolution_y = 800
    scn.display.shading.light = 'STUDIO'; scn.display.shading.show_cavity = True
    def fr(name, names, az, el):
        for o in bpy.data.objects: o.hide_render = (o.name not in names)
        dg2 = bpy.context.evaluated_depsgraph_get()
        mn=Vector((1e9,)*3); mx=Vector((-1e9,)*3)
        for n in names:
            o=bpy.data.objects.get(n)
            if not o or o.type!='MESH': continue
            for c in o.bound_box:
                w=o.evaluated_get(dg2).matrix_world@Vector(c)
                for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
        mid=(mn+mx)/2; diag=(mx-mn).length
        cam=bpy.data.objects.get("VC") or bpy.data.objects.new("VC", bpy.data.cameras.new("VC"))
        if "VC" not in [o.name for o in scn.collection.objects]: scn.collection.objects.link(cam)
        cam.data.lens=55; scn.camera=cam
        a=math.radians(az); e=math.radians(el)
        dd=Vector((math.cos(e)*math.cos(a), math.cos(e)*math.sin(a), math.sin(e)))
        cam.location=mid+dd*diag*1.15
        cam.rotation_euler=(mid-cam.location).to_track_quat('-Z','Y').to_euler()
        scn.render.filepath=RENDER_DIR+"\\"+name+".png"; bpy.ops.render.render(write_still=True)
    fr("acc_side", baked_names, 90, 4)
    fr("char_3q", show, 250, 12)
    rep["rendered"] = True
except Exception:
    import traceback; rep["render_err"] = traceback.format_exc()

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
with open(REPORT_JSON, "w", encoding="utf-8") as f: json.dump(rep, f, ensure_ascii=False, indent=1)
print("ALL DONE")
