import bpy, sys, json, math
from mathutils import Matrix, Vector

OUT_BLEND, REPORT_JSON, RENDER_DIR = sys.argv[-3], sys.argv[-2], sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando.blend"
SRC  = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\acordeon original.blend"
rep = {}

bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()
def emat(n):
    o=bpy.data.objects.get(n); dg=bpy.context.evaluated_depsgraph_get()
    return o.evaluated_get(dg).matrix_world.copy() if o else None
T_parrilla = emat("Caja de parrilla, derecha.004")
T_bass     = emat("Caja de los bajos, izquierda.004")
char = bpy.data.objects.get("Pelao de rojo"); SPINE="mixamorig:Spine2"

# append rig at REST (even bellows)
target = bpy.data.collections.get("Acordeon Definitivo Funcional con huesos")
if target is None:
    target = bpy.data.collections.new("Acordeon Definitivo Funcional con huesos"); bpy.context.scene.collection.children.link(target)
tmp = bpy.data.collections.new("__t__"); bpy.context.scene.collection.children.link(tmp)
before=set(o.name for o in bpy.data.objects)
with bpy.data.libraries.load(SRC, link=False) as (s,d): d.collections=["Acordeon total","Fuelle Nuevo"]
for c in [c for c in d.collections if c]: tmp.children.link(c)
newobjs=[o for o in bpy.data.objects if o.name not in before]
def one(p): return next(o for o in newobjs if o.name.startswith(p))
cp_src=one("Caja de parrilla"); cb_src=one("Caja de los bajos"); old_fuelle=one("fuelle.")

def is_bass(o):
    p=o
    while p:
        if p.name.startswith("Ctrl_Bajos") or p.name.startswith("Caja de los bajos"): return True
        p=p.parent
    return False

# BAKE meshes, classify: fuelle / bass / parrilla
baked_root=bpy.data.objects.new("Acordeon_Nuevo",None); target.objects.link(baked_root)
dg=bpy.context.evaluated_depsgraph_get()
groups={"fuelle":[], "bass":[], "parr":[]}
baked_parrilla=None; baked_bass=None
for obj in newobjs:
    if obj.type!='MESH' or obj is old_fuelle: continue
    me=bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    nobj=bpy.data.objects.new(obj.name.split(".")[0]+"_def", me); target.objects.link(nobj)
    nobj.matrix_world=obj.matrix_world; nobj.parent=baked_root; nobj.matrix_parent_inverse=Matrix.Identity(4)
    if obj.name.startswith("Fuelle20") or obj.name.startswith("Aro 16"): groups["fuelle"].append(nobj)
    elif is_bass(obj): groups["bass"].append(nobj)
    else: groups["parr"].append(nobj)
    if obj is cp_src: baked_parrilla=nobj
    if obj is cb_src: baked_bass=nobj
bpy.context.view_layer.update()
rep["counts"]={k:len(v) for k,v in groups.items()}

# delete temp rig
for o in list(newobjs):
    try: bpy.data.objects.remove(o, do_unlink=True)
    except Exception: pass
def rmcol(c):
    for ch in list(c.children): rmcol(ch)
    try: bpy.data.collections.remove(c)
    except Exception: pass
rmcol(tmp)

# place rigid: parrilla -> T_parrilla
bpy.context.view_layer.update(); dg=bpy.context.evaluated_depsgraph_get()
M = T_parrilla @ baked_parrilla.evaluated_get(dg).matrix_world.inverted()
baked_root.matrix_world = M @ baked_root.matrix_world
bpy.context.view_layer.update(); dg=bpy.context.evaluated_depsgraph_get()

def ctr(o):
    cs=[o.evaluated_get(dg).matrix_world@Vector(c) for c in o.evaluated_get(dg).bound_box]; return sum(cs,Vector())/8
# use ORIGINS consistently so boxes + fuelle stay glued
P = baked_parrilla.matrix_world.translation.copy()       # == T_parrilla after M
B_rest = baked_bass.matrix_world.translation.copy()
Tb = Vector(T_bass.translation)
axis = (B_rest - P).normalized()
f = (Tb - P).length / (B_rest - P).length
rep["rest_sep"]=round((B_rest-P).length,4); rep["target_sep"]=round((Tb-P).length,4); rep["f"]=round(f,4)

# move bass-side meshes so the bass box origin lands exactly on T_bass (glued to fuelle end)
disp = Tb - B_rest
for o in groups["bass"]:
    o.matrix_world = Matrix.Translation(disp) @ o.matrix_world

# compress fuelle along axis by f, pivot at P (parrilla end stays, bass end moves in evenly)
a=axis
oa=Matrix(((a.x*a.x,a.x*a.y,a.x*a.z),(a.y*a.x,a.y*a.y,a.y*a.z),(a.z*a.x,a.z*a.y,a.z*a.z)))
L=Matrix.Identity(3) + (f-1.0)*oa
t = -( (L - Matrix.Identity(3)) @ P )
S=Matrix.Identity(4)
for i in range(3):
    for j in range(3): S[i][j]=L[i][j]
    S[i][3]=t[i]
for o in groups["fuelle"]:
    o.matrix_world = S @ o.matrix_world
bpy.context.view_layer.update(); dg=bpy.context.evaluated_depsgraph_get()
rep["bass_err"]=round((ctr(baked_bass)-Vector(T_bass.translation)).length,4)
rep["sep_after"]=round((ctr(baked_bass)-ctr(baked_parrilla)).length,4)

# parent to Spine2
root_w=baked_root.matrix_world.copy()
baked_root.parent=char; baked_root.parent_type='BONE'; baked_root.parent_bone=SPINE
bpy.context.view_layer.update(); baked_root.matrix_world=root_w; bpy.context.view_layer.update()

# delete old
oc=bpy.data.collections.get("Acordeon - Pelao de rojo"); nd=0
if oc:
    for o in list(oc.objects): bpy.data.objects.remove(o, do_unlink=True); nd+=1
    try: bpy.data.collections.remove(oc)
    except Exception: pass
rep["deleted_old"]=nd

# render
try:
    bn=set(o.name for o in target.objects); mc=bpy.data.collections.get("Muchacho de rojo")
    show=bn|set(o.name for o in mc.objects); scn=bpy.context.scene
    scn.render.engine='BLENDER_WORKBENCH'; scn.render.resolution_x=900; scn.render.resolution_y=750
    scn.display.shading.light='STUDIO'; scn.display.shading.show_cavity=True
    def fr(name,names,az,el):
        for o in bpy.data.objects: o.hide_render=(o.name not in names)
        d2=bpy.context.evaluated_depsgraph_get(); mn=Vector((1e9,)*3);mx=Vector((-1e9,)*3)
        for n in names:
            o=bpy.data.objects.get(n)
            if not o or o.type!='MESH':continue
            for c in o.bound_box:
                w=o.evaluated_get(d2).matrix_world@Vector(c)
                for i in range(3):mn[i]=min(mn[i],w[i]);mx[i]=max(mx[i],w[i])
        mid=(mn+mx)/2;diag=(mx-mn).length
        cam=bpy.data.objects.get("VC") or bpy.data.objects.new("VC",bpy.data.cameras.new("VC"))
        if "VC" not in [o.name for o in scn.collection.objects]: scn.collection.objects.link(cam)
        cam.data.lens=55; scn.camera=cam
        a2=math.radians(az);e2=math.radians(el)
        dd=Vector((math.cos(e2)*math.cos(a2),math.cos(e2)*math.sin(a2),math.sin(e2)))
        cam.location=mid+dd*diag*1.15; cam.rotation_euler=(mid-cam.location).to_track_quat('-Z','Y').to_euler()
        scn.render.filepath=RENDER_DIR+"\\"+name+".png"; bpy.ops.render.render(write_still=True)
    fr("acc_side", bn, 90, 4)
    fr("char_3q", show, 250, 12)
    rep["rendered"]=True
except Exception:
    import traceback; rep["render_err"]=traceback.format_exc()

bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
with open(REPORT_JSON,"w",encoding="utf-8") as f: json.dump(rep,f,ensure_ascii=False,indent=1)
print("ALL DONE")
