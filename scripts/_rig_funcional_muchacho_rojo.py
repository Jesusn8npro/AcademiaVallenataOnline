import bpy, sys, json, math
from mathutils import Matrix, Vector

OUT_BLEND, REPORT_JSON, RENDER_DIR = sys.argv[-3], sys.argv[-2], sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando.blend"
SRC  = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\acordeon original.blend"
rep = {"steps": []}
def log(m): rep["steps"].append(m); print("STEP:", m)

# 1. open dest, read target (old Muchacho .004 = Pelao-Pose-like sep, norm 0.991)
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

# 2. append rig
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
def one(p): return next(o for o in newobjs if o.name.startswith(p))
cp = one("Caja de parrilla"); cb = one("Caja de los bajos"); ctrl = one("Ctrl_Bajos")
curve = one("Curva_Fuelle_Real"); arm = one("Esqueleto_Fuelle_Real")
root = cp.parent
junk = [o for o in newobjs if o.parent is None and o not in (root, curve)]
log("appended %d objs, root=%s" % (len(newobjs), root.name))

# 3. unify roots under root
for o in [curve] + junk:
    o.parent = root; o.matrix_parent_inverse = root.matrix_world.inverted()
bpy.context.view_layer.update()

# 4. enable use_scale on the end-cap Child Of (R00/R19) so the rings scale with the boxes
for bn in ("R00", "R19"):
    pb = arm.pose.bones.get(bn)
    if pb:
        for c in pb.constraints:
            if c.type == 'CHILD_OF':
                c.use_scale_x = c.use_scale_y = c.use_scale_z = True

# 5. CLOSE the bellows at full scale to target_norm via Ctrl_Bajos.x (rig's intended control, topes ACTIVE)
def cur_norm():
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    pw = cp.evaluated_get(dg).matrix_world; bw = cb.evaluated_get(dg).matrix_world
    scl = sum(v.length for v in pw.to_3x3().col)/3
    return (bw.translation - pw.translation).length / scl
# fine search x in [0.30, 0.47] for closest norm to target
best_x, best_err = None, 1e9
xs = [0.30 + 0.005*i for i in range(0, 35)]   # 0.30 .. 0.47
trace = []
for x in xs:
    ctrl.location.x = x
    n = cur_norm()
    trace.append((round(x,3), round(n,3)))
    e = abs(n - target_norm)
    if e < best_err: best_err, best_x = e, x
ctrl.location.x = best_x
rep["chosen_x"] = round(best_x, 4); rep["norm_after_close"] = round(cur_norm(), 4)
rep["trace_sample"] = trace[::4]
bpy.context.view_layer.update()

# 6. compute placement transform. Then MUTE the open/close "topes": LIMIT_LOCATION is WORLD-space
# and pins the accordion (and freezes Ctrl_Bajos) once relocated to the character; LIMIT_DISTANCE
# absolute distance also breaks at 1/100 scale. They are only open/close limits -- the core
# function (Spline IK: move bajos -> fuelle folds) does NOT need them. Closing was already done
# (step 5) via Ctrl_Bajos with them active, so the folded state is preserved after muting.
dg = bpy.context.evaluated_depsgraph_get()
cp_full = cp.evaluated_get(dg).matrix_world.copy()
M = T_parrilla @ cp_full.inverted()
sf = M.to_scale()[0]
rep["sf"] = round(sf, 6)
for o in (cb, ctrl):
    for c in o.constraints:
        if c.type.startswith("LIMIT"): c.mute = True

# 6b. at full scale (caps are correctly placed by bone-parent here), object-parent the end-cap
# rings to their boxes keeping world, so they scale WITH the box under M (bone-parent doesn't scale).
cap_p = next((o for o in newobjs if o.parent == arm and o.parent_type == 'BONE' and o.parent_bone == "R00"), None)
cap_b = next((o for o in newobjs if o.parent == arm and o.parent_type == 'BONE' and o.parent_bone == "R19"), None)
rep["cap_p"] = cap_p.name if cap_p else None; rep["cap_b"] = cap_b.name if cap_b else None
bpy.context.view_layer.update()
for ring, box in ((cap_p, cp), (cap_b, cb)):
    if ring is None: continue
    w = ring.matrix_world.copy()
    ring.parent = box; ring.parent_type = 'OBJECT'; ring.parent_bone = ''
    ring.matrix_parent_inverse = box.matrix_world.inverted()   # reset stale bone-parent inverse
    bpy.context.view_layer.update()
    ring.matrix_world = w
bpy.context.view_layer.update()
# hide old cloth fuelle
fv = one("fuelle."); fv.hide_viewport = True; fv.hide_render = True

# 7. place rigid: parrilla -> T_parrilla (uniform scale via root)
root.matrix_world = M @ root.matrix_world
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
cp_f = cp.evaluated_get(dg).matrix_world.translation
cb_f = cb.evaluated_get(dg).matrix_world.translation
rep["parrilla_err"] = round((cp_f - T_parrilla.translation).length, 5)
rep["bajos_err_vs_004"] = round((cb_f - T_bass.translation).length, 5)
rep["sep_final"] = round((cb_f - cp_f).length, 5)
rep["sep_final_norm"] = round((cb_f-cp_f).length / (sum(v.length for v in cp.evaluated_get(dg).matrix_world.to_3x3().col)/3), 4)

# 8. verify rig still FUNCTIONS: nudge Ctrl_Bajos.x both ways, check bass moves, then restore
x_keep = ctrl.location.x
moves = {}
for dx in (-0.05, +0.05):
    ctrl.location.x = x_keep + dx; bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    moves[str(dx)] = round((cb.evaluated_get(dg).matrix_world.translation - Vector(cb_f)).length, 5)
ctrl.location.x = x_keep; bpy.context.view_layer.update()
rep["rig_functional_bass_moves"] = moves

# 9. parent root to Spine2 (keep world)
dg = bpy.context.evaluated_depsgraph_get()
root_w = root.matrix_world.copy()
root.parent = char; root.parent_type = 'BONE'; root.parent_bone = SPINE
bpy.context.view_layer.update(); root.matrix_world = root_w; bpy.context.view_layer.update()

# 10. delete old accordion
oldcol = bpy.data.collections.get("Acordeon - Pelao de rojo"); ndel = 0
if oldcol:
    for o in list(oldcol.objects):
        bpy.data.objects.remove(o, do_unlink=True); ndel += 1
    try: bpy.data.collections.remove(oldcol)
    except Exception as e: rep["col_rm_err"] = str(e)
rep["deleted_old"] = ndel

# 11. straggler scan
dg = bpy.context.evaluated_depsgraph_get()
strag = []
for o in newobjs:
    if o.name not in bpy.data.objects: continue
    ow = o.evaluated_get(dg).matrix_world
    s = sum(v.length for v in ow.to_3x3().col)/3
    if s > 1.0 or (ow.translation - Vector(cp_f)).length > 1.0:
        strag.append(o.name)
rep["stragglers"] = strag

# 12. render
try:
    baked_names = set(o.name for o in newobjs if o.name in bpy.data.objects)
    mc = bpy.data.collections.get("Muchacho de rojo")
    show = set(baked_names) | set(o.name for o in mc.objects)
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'; scn.render.resolution_x = 900; scn.render.resolution_y = 800
    scn.display.shading.light = 'STUDIO'; scn.display.shading.show_cavity = True
    def frame_render(name, names, az, el, pad=1.15):
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
        cam=bpy.data.objects.get("VCam") or bpy.data.objects.new("VCam", bpy.data.cameras.new("VCam"))
        if "VCam" not in [o.name for o in scn.collection.objects]: scn.collection.objects.link(cam)
        cam.data.lens=55; scn.camera=cam
        a=math.radians(az); e=math.radians(el)
        dd=Vector((math.cos(e)*math.cos(a), math.cos(e)*math.sin(a), math.sin(e)))
        cam.location=mid+dd*diag*pad
        cam.rotation_euler=(mid-cam.location).to_track_quat('-Z','Y').to_euler()
        scn.render.filepath=RENDER_DIR+"\\"+name+".png"; bpy.ops.render.render(write_still=True)
    frame_render("acc_side", baked_names, 90, 4)
    frame_render("acc_3q",   baked_names, 50, 18)
    frame_render("char_3q",  show, 250, 12)
    rep["rendered"] = True
except Exception:
    import traceback; rep["render_err"] = traceback.format_exc()

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
with open(REPORT_JSON, "w", encoding="utf-8") as f: json.dump(rep, f, ensure_ascii=False, indent=1)
print("ALL DONE")
