import bpy, sys, json, math
from mathutils import Matrix, Vector

OUT, REPORT, RENDER_DIR = sys.argv[-3], sys.argv[-2], sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando_acordeon_FINAL.blend"
SRC  = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\acordeon original.blend"
X_CLOSED, X_OPEN = 0.298, 0.55
rep = {}

bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()
PELAO_ARM, SPINE = "Pelao armature moreno", "mixamorig9:Spine2"

# if a previous hybrid exists, remove it; we rebuild from the baked Pelao as target
baked_col = bpy.data.collections.get("Acordeon Nuevo - Pelao Pose")
if baked_col is None:
    # maybe file already has functional; restore not possible -> abort
    raise SystemExit("no baked Pelao to use as target; restore FINAL backup first")
baked_parr = next(o for o in baked_col.objects if o.name.startswith("Caja de parrilla"))
dg = bpy.context.evaluated_depsgraph_get()
T_target = baked_parr.evaluated_get(dg).matrix_world.copy()

# clean any leftover functional collection
old_fun = bpy.data.collections.get("Acordeon Funcional - Pelao Pose")
if old_fun:
    for o in list(old_fun.objects):
        try: bpy.data.objects.remove(o, do_unlink=True)
        except Exception: pass
    try: bpy.data.collections.remove(old_fun)
    except Exception: pass

# append full rig keeping hierarchy
funcol = bpy.data.collections.new("Acordeon Funcional - Pelao Pose")
bpy.context.scene.collection.children.link(funcol)
tmp = bpy.data.collections.new("__t"); bpy.context.scene.collection.children.link(tmp)
before = set(o.name for o in bpy.data.objects)
with bpy.data.libraries.load(SRC, link=False) as (s, d): d.collections = ["Acordeon total", "Fuelle Nuevo"]
for c in [c for c in d.collections if c]: tmp.children.link(c)
newobjs = [o for o in bpy.data.objects if o.name not in before]
newset = set(o.name for o in newobjs)
for o in newobjs:
    for c in list(o.users_collection): c.objects.unlink(o)
    funcol.objects.link(o)
def rmcol(c):
    for ch in list(c.children): rmcol(ch)
    try: bpy.data.collections.remove(c)
    except Exception: pass
rmcol(tmp)

ctrl = next(o for o in newobjs if o.name.startswith("Ctrl_Bajos"))
cb   = next(o for o in newobjs if o.name.startswith("Caja de los bajos"))
cp   = next(o for o in newobjs if o.name.startswith("Caja de parrilla"))
farm = next(o for o in newobjs if o.name.startswith("Esqueleto_Fuelle_Real"))
curve= next((o for o in newobjs if o.name.startswith("Curva_Fuelle_Real")), None)
old_cloth = next((o for o in newobjs if o.name.startswith("fuelle.")), None)
cb_name, cp_name, ctrl_name = cb.name, cp.name, ctrl.name

for o in (ctrl, cb):
    for c in o.constraints:
        if c.type.startswith("LIMIT"): c.mute = True

fuelle_meshes = [o for o in newobjs if o.type == 'MESH' and o.parent is farm]
fuelle_names = [o.name for o in fuelle_meshes]
rep["fuelle_meshes"] = len(fuelle_meshes)

def capture(x):
    ctrl.location.x = x; bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    out = {}
    for o in fuelle_meshes:
        ev = o.evaluated_get(dg); me = ev.to_mesh()
        co = [0.0]*(len(me.vertices)*3); me.vertices.foreach_get("co", co)
        out[o.name] = (co, o.matrix_world.copy())
        ev.to_mesh_clear()
    return out
closed = capture(X_CLOSED); opened = capture(X_OPEN)
ctrl.location.x = X_CLOSED; bpy.context.view_layer.update()

# build morph fuelle meshes parented to cp (static treble box)
EPS = 1e-3; made = []
for o in fuelle_meshes:
    cco, Wc = closed[o.name]; oco, Wo = opened[o.name]
    nv = len(cco)//3
    src_me = o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
    verts = [(cco[i*3],cco[i*3+1],cco[i*3+2]) for i in range(nv)]
    faces = [tuple(p.vertices) for p in src_me.polygons]
    me = bpy.data.meshes.new(o.data.name + "_morph")
    me.from_pydata(verts, [], faces); me.update()
    o.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh_clear()
    no = bpy.data.objects.new(o.name.split(".")[0] + "_fx", me); funcol.objects.link(no)
    no.matrix_world = Wc; no.parent = cp; no.matrix_parent_inverse = cp.matrix_world.inverted()
    T = Wc.inverted() @ Wo
    abrir = [0.0]*(nv*3); moving = False
    for i in range(nv):
        w = T @ Vector((oco[i*3], oco[i*3+1], oco[i*3+2]))
        abrir[i*3],abrir[i*3+1],abrir[i*3+2] = w.x,w.y,w.z
        if not moving:
            dx=abrir[i*3]-cco[i*3]; dy=abrir[i*3+1]-cco[i*3+1]; dz=abrir[i*3+2]-cco[i*3+2]
            if dx*dx+dy*dy+dz*dz > EPS*EPS: moving = True
    if moving:
        no.shape_key_add(name="Basis")
        kb = no.shape_key_add(name="Abrir"); kb.data.foreach_set("co", abrir)
        kb.slider_min=0.0; kb.slider_max=1.0
        made.append(no.name)
rep["morph_built"] = len(made)

# delete the spline-ik fuelle rig + originals
for o in [farm, curve, old_cloth] + fuelle_meshes:
    if o:
        try: bpy.data.objects.remove(o, do_unlink=True)
        except Exception: pass

# lock the bass box so user can only TRANSLATE it (no accidental rotate/scale)
cb.lock_rotation = (True, True, True); cb.lock_scale = (True, True, True)

# container scale: parent remaining roots, place parrilla on target
cont = bpy.data.objects.new("ContenedorAcordeon", None); cont.empty_display_type='PLAIN_AXES'; cont.empty_display_size=0.3
funcol.objects.link(cont); bpy.context.view_layer.update()
remaining = [bpy.data.objects[n] for n in newset if n in bpy.data.objects]
roots = [o for o in remaining if (o.parent is None) or (o.parent.name not in newset)]
roots = [o for o in roots if o is not cont]
for o in roots:
    o.parent = cont; o.matrix_parent_inverse = cont.matrix_world.inverted()
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
cp = bpy.data.objects[cp_name]; cb = bpy.data.objects[cb_name]; ctrl = bpy.data.objects[ctrl_name]
M = T_target @ cp.evaluated_get(dg).matrix_world.inverted()
cont.matrix_world = M @ cont.matrix_world
bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
rep["parrilla_err"] = round((cp.evaluated_get(dg).matrix_world.translation - T_target.translation).length, 6)
rep["block_scale"] = round(M.to_3x3().col[0].length, 5)

# bone-parent container to Pelao Spine2 (keep world)
arm = bpy.data.objects[PELAO_ARM]
rw = cont.matrix_world.copy()
cont.parent = arm; cont.parent_type='BONE'; cont.parent_bone = SPINE
bpy.context.view_layer.update(); cont.matrix_world = rw; bpy.context.view_layer.update()

# measure distance(cb,cp) at closed and open -> driver thresholds (world, final scale)
def dist_at(x):
    ctrl.location.x = x; bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    a = cb.evaluated_get(dg).matrix_world.translation
    b = cp.evaluated_get(dg).matrix_world.translation
    return (a-b).length
d0 = dist_at(X_CLOSED); d1 = dist_at(X_OPEN)
ctrl.location.x = X_CLOSED; bpy.context.view_layer.update()
rep["d_closed"] = round(d0,5); rep["d_open"] = round(d1,5)
rng = d1 - d0 if abs(d1-d0) > 1e-9 else 1e-9

# DISTANCE drivers: fuelle Abrir follows how far the bass box is from the treble box
for nm in made:
    no = bpy.data.objects[nm]
    fc = no.data.shape_keys.driver_add('key_blocks["Abrir"].value')
    drv = fc.driver; drv.type='SCRIPTED'
    var = drv.variables.new(); var.name="d"; var.type='LOC_DIFF'
    var.targets[0].id = cb; var.targets[1].id = cp
    drv.expression = "max(0.0, min(1.0, (d - %f)/%f))" % (d0, rng)
rep["drivers"] = len(made)

# delete old baked Pelao
nd=0
for o in list(baked_col.objects): bpy.data.objects.remove(o, do_unlink=True); nd+=1
try: bpy.data.collections.remove(baked_col)
except Exception: pass
rep["deleted_old_baked"]=nd

# VERIFY by simulating the USER grabbing the bass box and dragging it (not Ctrl_Bajos)
try:
    keep = set(o.name for o in funcol.objects)
    pc = bpy.data.collections.get("Pelao Pose")
    if pc: keep |= set(o.name for o in pc.objects)
    scn = bpy.context.scene
    scn.render.engine='BLENDER_WORKBENCH'; scn.render.resolution_x=750; scn.render.resolution_y=950
    scn.display.shading.light='STUDIO'; scn.display.shading.show_cavity=True
    cam = bpy.data.objects.new("VC", bpy.data.cameras.new("VC")); scn.collection.objects.link(cam); cam.data.lens=50; scn.camera=cam
    for o in bpy.data.objects: o.hide_render=(o.name not in keep)
    def shot(tag):
        bpy.context.view_layer.update()
        dg = bpy.context.evaluated_depsgraph_get(); mn=Vector((1e9,)*3); mx=Vector((-1e9,)*3)
        for n in keep:
            o=bpy.data.objects.get(n)
            if not o or o.type!='MESH' or o.hide_render: continue
            for c in o.bound_box:
                w=o.evaluated_get(dg).matrix_world@Vector(c)
                for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
        mid=(mn+mx)/2; diag=(mx-mn).length
        a=math.radians(235); e=math.radians(8)
        dd=Vector((math.cos(e)*math.cos(a),math.cos(e)*math.sin(a),math.sin(e)))
        cam.location=mid+dd*diag*1.05; cam.rotation_euler=(mid-cam.location).to_track_quat('-Z','Y').to_euler()
        scn.render.filepath=RENDER_DIR+"\\hb_"+tag+".png"; bpy.ops.render.render(write_still=True)
    # closed (default)
    shot("1_closed")
    # simulate user grabbing the BOX and pulling it open: move cb.location.x directly
    cb.location.x += (X_OPEN - X_CLOSED)
    shot("2_box_pulled")
    cb.location.x -= (X_OPEN - X_CLOSED)
    # also via Ctrl_Bajos for completeness
    ctrl.location.x = X_OPEN; shot("3_ctrl_open"); ctrl.location.x = X_CLOSED
    bpy.context.view_layer.update()
    rep["rendered"]=True
except Exception:
    import traceback; rep["render_err"]=traceback.format_exc()

bpy.ops.wm.save_as_mainfile(filepath=OUT); rep["saved"]=OUT
with open(REPORT,"w",encoding="utf-8") as f: json.dump(rep,f,ensure_ascii=False,indent=1)
print("HYBRID2 DONE")
