import bpy, sys, json, math
from mathutils import Matrix, Vector

OUT_BLEND   = sys.argv[-3]
REPORT_JSON = sys.argv[-2]
RENDER_DIR  = sys.argv[-1]

DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando.blend"
SRC  = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\acordeon original.blend"

report = {"steps": []}
def log(m): report["steps"].append(m); print("STEP:", m)

# ============================================================ 0. read cap offsets from SOURCE
bpy.ops.wm.open_mainfile(filepath=SRC)
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
def W(n): return bpy.data.objects[n].evaluated_get(dg).matrix_world.copy()
p_src = W("Caja de parrilla, derecha"); b_src = W("Caja de los bajos, izquierda")
OFF_P = p_src.inverted() @ W("Aro 16.021")   # R00 cap relative to parrilla
OFF_B = b_src.inverted() @ W("Aro 16.013")   # R19 cap relative to bajos
log("read source cap offsets")

# ============================================================ 1. open DEST
bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()
def emat(name):
    o = bpy.data.objects.get(name)
    dg = bpy.context.evaluated_depsgraph_get()
    return o.evaluated_get(dg).matrix_world.copy() if o else None

T_parrilla = emat("Caja de parrilla, derecha.004")
T_bass     = emat("Caja de los bajos, izquierda.004")
assert T_parrilla and T_bass
report["sep_target"] = round((T_bass.translation - T_parrilla.translation).length, 5)
char = bpy.data.objects.get("Pelao de rojo"); SPINE = "mixamorig:Spine2"

# ============================================================ 2. append the 2 collections
target = bpy.data.collections.get("Acordeon Definitivo Funcional con huesos")
if target is None:
    target = bpy.data.collections.new("Acordeon Definitivo Funcional con huesos")
    bpy.context.scene.collection.children.link(target)
before = set(o.name for o in bpy.data.objects)
with bpy.data.libraries.load(SRC, link=False) as (s, d):
    d.collections = ["Acordeon total", "Fuelle Nuevo"]
for c in [c for c in d.collections if c]:
    target.children.link(c)
newobjs = [o for o in bpy.data.objects if o.name not in before]
def one(prefix):
    cs = [o for o in newobjs if o.name.startswith(prefix)]
    assert cs, "missing " + prefix
    return cs[0]
cp   = one("Caja de parrilla")
cb   = one("Caja de los bajos")
ctrl = one("Ctrl_Bajos")
curve= one("Curva_Fuelle_Real")
root = cp.parent
cap_p = one("Aro 16.187")   # R00 cap
cap_b = one("Aro 16.179")   # R19 cap
junk = [o for o in newobjs if o.parent is None and o is not root and o is not curve]
log("appended %d objs, root=%s" % (len(newobjs), root.name))

# ============================================================ 3. unify hierarchy under root (keep world)
for o in [curve] + junk:
    o.parent = root
    o.matrix_parent_inverse = root.matrix_world.inverted()
bpy.context.view_layer.update()

# read the GLUED bass position (topes ACTIVE, full original scale) before muting.
# This is where the bellows sits attached to both boxes in the original.
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
cb_glued = cb.evaluated_get(dg).matrix_world.copy()

# ============================================================ 4. mute the open/close "topes"
muted = []
for o in (cp, cb, ctrl):
    for c in list(o.constraints):
        if c.type.startswith("LIMIT"):
            c.mute = True; muted.append(o.name + "/" + c.name)
report["muted"] = muted

# ============================================================ 5. parent root to Spine2 (keep current world)
root_w = root.matrix_world.copy()
root.parent = char; root.parent_type = 'BONE'; root.parent_bone = SPINE
bpy.context.view_layer.update()
root.matrix_world = root_w
bpy.context.view_layer.update()

# ============================================================ 6. fit parrilla (rigid M on root)
dg = bpy.context.evaluated_depsgraph_get()
M = T_parrilla @ cp.evaluated_get(dg).matrix_world.inverted()
root.matrix_world = M @ root.matrix_world
bpy.context.view_layer.update()

# ============================================================ 7. place bass at the ORIGINAL's
# GLUED separation (scaled). Keeps the fuelle attached to BOTH boxes exactly as in the original.
# NOT the old 0.14 (that over-compresses and TEARS the pleats); this is the bellows' natural
# glued length, so it stays intact AND attached.
dg = bpy.context.evaluated_depsgraph_get()
target_cb = M @ cb_glued
cb_w   = cb.evaluated_get(dg).matrix_world.copy()
ctrl_w = ctrl.evaluated_get(dg).matrix_world.copy()
ctrl.matrix_world = target_cb @ cb_w.inverted() @ ctrl_w
bpy.context.view_layer.update()

# ============================================================ 8. glue end-cap rings to their boxes
dg = bpy.context.evaluated_depsgraph_get()
for ring, box, off in ((cap_p, cp, OFF_P), (cap_b, cb, OFF_B)):
    ring.parent = box; ring.parent_type = 'OBJECT'; ring.parent_bone = ''
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ring.matrix_world = box.evaluated_get(dg).matrix_world @ off
bpy.context.view_layer.update()

# ============================================================ 9. hide old cloth fuelle
fv = one("fuelle.")
fv.hide_viewport = True; fv.hide_render = True

# ============================================================ 10. VERIFY
dg = bpy.context.evaluated_depsgraph_get()
cp_f = cp.evaluated_get(dg).matrix_world.translation
cb_f = cb.evaluated_get(dg).matrix_world.translation
report["parrilla_final"] = [round(c,5) for c in cp_f]
report["bajos_final"]    = [round(c,5) for c in cb_f]
report["parrilla_target"]= [round(c,5) for c in T_parrilla.translation]
report["bajos_target"]   = [round(c,5) for c in T_bass.translation]
report["sep_final"]      = round((cb_f - cp_f).length, 5)
report["err_parrilla"]   = round((cp_f - T_parrilla.translation).length, 6)
report["err_bajos"]      = round((cb_f - T_bass.translation).length, 6)
# straggler scan
strag = []
for o in newobjs:
    if o.name == fv.name: continue
    ow = o.evaluated_get(dg).matrix_world
    s = sum(v.length for v in ow.to_3x3().col)/3.0
    if s > 1.0 or (ow.translation - Vector(cp_f)).length > 1.0:
        strag.append(o.name)
report["stragglers"] = strag

# ============================================================ 11. delete old accordion
oldcol = bpy.data.collections.get("Acordeon - Pelao de rojo")
ndel = 0
if oldcol:
    for o in list(oldcol.objects):
        bpy.data.objects.remove(o, do_unlink=True); ndel += 1
    try: bpy.data.collections.remove(oldcol)
    except Exception as e: report["col_rm_err"] = str(e)
report["deleted_old"] = ndel

# ============================================================ 12. render
try:
    show = set(o.name for o in newobjs)
    mc = bpy.data.collections.get("Muchacho de rojo")
    for o in mc.objects: show.add(o.name)
    for o in bpy.data.objects: o.hide_render = (o.name not in show)
    fv.hide_render = True
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'
    scn.render.resolution_x = 900; scn.render.resolution_y = 900
    scn.display.shading.light = 'STUDIO'; scn.display.shading.show_cavity = True
    mid = (Vector(cp_f) + Vector(cb_f)) / 2.0
    cam = bpy.data.objects.new("VCam", bpy.data.cameras.new("VCam")); cam.data.lens = 58
    scn.collection.objects.link(cam); scn.camera = cam
    def shoot(n, az, el, r):
        a=math.radians(az); e=math.radians(el)
        d=Vector((math.cos(e)*math.cos(a), math.cos(e)*math.sin(a), math.sin(e)))
        cam.location = mid + d*r
        cam.rotation_euler = (mid-cam.location).to_track_quat('-Z','Y').to_euler()
        scn.render.filepath = RENDER_DIR + "\\" + n + ".png"
        bpy.ops.render.render(write_still=True)
    shoot("a_front", 200, 8, 0.9)
    shoot("b_3q",    250, 12, 0.9)
    shoot("c_bass",   20, 8, 0.85)
    shoot("d_wide",  205, 5, 2.2)
    # accordion ONLY (hide character) to inspect the bellows is intact
    mr_names = set(o.name for o in mc.objects)
    for o in bpy.data.objects:
        if o.name in mr_names: o.hide_render = True
    fv.hide_render = True
    shoot("e_acc_only_3q", 250, 12, 0.55)
    shoot("f_acc_only_top", 250, 80, 0.6)
    report["rendered"] = True
except Exception:
    import traceback; report["render_err"] = traceback.format_exc()

# ============================================================ 13. save
bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
with open(REPORT_JSON, "w", encoding="utf-8") as f:
    json.dump(report, f, ensure_ascii=False, indent=1)
print("ALL DONE")
