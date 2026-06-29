import bpy, sys, json, math
from mathutils import Matrix, Vector

REPORT_JSON, RENDER_DIR = sys.argv[-2], sys.argv[-1]
DEST = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\PERSONAJES T-POSE\Personajes 6 posando_acordeon_FINAL.blend"
SRC  = r"C:\Users\acord\OneDrive\Desktop\Blender Personajes\acordeon original.blend"
rep = {"cleanup": {}, "chars": {}}

bpy.ops.wm.open_mainfile(filepath=DEST)
bpy.context.view_layer.update()

# ============================================================ 0. CLEAN the stray appended copy
# Collection "Acordeon" (level 0) = Fuelle Nuevo + Acordeon total.001 (+ .007 children),
# a leftover append not parented to any character. Delete its whole tree.
def collect_objs(c, acc):
    for o in c.objects: acc.add(o)
    for ch in c.children: collect_objs(ch, acc)

junk_col = bpy.data.collections.get("Acordeon")
n_obj_del = 0; n_col_del = 0
if junk_col:
    objs = set(); collect_objs(junk_col, objs)
    for o in list(objs):
        try: bpy.data.objects.remove(o, do_unlink=True); n_obj_del += 1
        except Exception: pass
    def rmcol(c):
        for ch in list(c.children): rmcol(ch)
        try: bpy.data.collections.remove(c);
        except Exception: pass
    # count then remove
    def count_cols(c, n=0):
        n += 1
        for ch in c.children: n = count_cols(ch, n)
        return n
    n_col_del = count_cols(junk_col)
    rmcol(junk_col)
# purge orphan datablocks left behind (meshes, armatures, curves of the junk)
bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
rep["cleanup"] = {"objs_deleted": n_obj_del, "cols_deleted": n_col_del}
bpy.context.view_layer.update()

# ============================================================ the 4 remaining characters
CHARS = [
    {"label":"Sudadera",        "old_col":"Acordeon - Armature sudadera", "armature":"Armature sudadera",  "char_col":"Sudadera"},
    {"label":"Cuerpo Muchacha", "old_col":"Acordeon - Cuerpo Muchacha",   "armature":"Cuerpo Muchacha",    "char_col":"Cuerpo Muchacha"},
    {"label":"Hembra Vacana",   "old_col":"Acordeon - Armature",          "armature":"Armature",           "char_col":"Hembra Vacana"},
    {"label":"Personaje Gris",  "old_col":"Acordeon - Persoanje Gris",    "armature":"Persoanje Gris",     "char_col":"Personaje Gris ojos verdes"},
]

def do_char(cfg):
    r = {}
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    oldc = bpy.data.collections.get(cfg["old_col"])
    parr_obj = next(o for o in oldc.objects if o.name.startswith("Caja de parrilla"))
    root_obj = next(o for o in oldc.objects if o.parent_type == 'BONE')
    bone = root_obj.parent_bone
    char = bpy.data.objects[cfg["armature"]]
    T_parr = parr_obj.evaluated_get(dg).matrix_world.copy()
    r["bone"] = bone

    bcol = bpy.data.collections.new("Acordeon Nuevo - " + cfg["label"])
    bpy.context.scene.collection.children.link(bcol)
    tmp = bpy.data.collections.new("__t_" + cfg["label"]); bpy.context.scene.collection.children.link(tmp)
    before = set(o.name for o in bpy.data.objects)
    with bpy.data.libraries.load(SRC, link=False) as (s, d): d.collections = ["Acordeon total", "Fuelle Nuevo"]
    for c in [c for c in d.collections if c]: tmp.children.link(c)
    newobjs = [o for o in bpy.data.objects if o.name not in before]
    cp_src = next(o for o in newobjs if o.name.startswith("Caja de parrilla"))
    old_fuelle = next(o for o in newobjs if o.name.startswith("fuelle."))

    # bake the rig-resolved natural shape (rest, glued, no compress)
    broot = bpy.data.objects.new("Acordeon_Nuevo_" + cfg["label"], None); bcol.objects.link(broot)
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    baked_parr = None; nb = 0
    for obj in newobjs:
        if obj.type != 'MESH' or obj is old_fuelle: continue
        me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
        no = bpy.data.objects.new(obj.name.split(".")[0] + "_def", me); bcol.objects.link(no)
        no.matrix_world = obj.matrix_world; no.parent = broot; no.matrix_parent_inverse = Matrix.Identity(4)
        if obj is cp_src: baked_parr = no
        nb += 1
    bpy.context.view_layer.update()
    r["baked"] = nb

    # delete temp rig copy
    for o in list(newobjs):
        try: bpy.data.objects.remove(o, do_unlink=True)
        except Exception: pass
    def rmcol(c):
        for ch in list(c.children): rmcol(ch)
        try: bpy.data.collections.remove(c)
        except Exception: pass
    rmcol(tmp)

    # place: baked parrilla -> old parrilla world (rigid M on root)
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    M = T_parr @ baked_parr.evaluated_get(dg).matrix_world.inverted()
    broot.matrix_world = M @ broot.matrix_world
    bpy.context.view_layer.update(); dg = bpy.context.evaluated_depsgraph_get()
    r["parrilla_err"] = round((baked_parr.evaluated_get(dg).matrix_world.translation - T_parr.translation).length, 5)

    # parent to spine bone (keep world)
    rw = broot.matrix_world.copy()
    broot.parent = char; broot.parent_type = 'BONE'; broot.parent_bone = bone
    bpy.context.view_layer.update(); broot.matrix_world = rw; bpy.context.view_layer.update()

    # delete old accordion
    nd = 0
    for o in list(oldc.objects): bpy.data.objects.remove(o, do_unlink=True); nd += 1
    try: bpy.data.collections.remove(oldc)
    except Exception: pass
    r["deleted_old"] = nd
    return r, bcol

baked_cols = []
for cfg in CHARS:
    try:
        res, bcol = do_char(cfg)
        rep["chars"][cfg["label"]] = res
        baked_cols.append((cfg, bcol))
    except Exception:
        import traceback
        rep["chars"][cfg["label"]] = {"error": traceback.format_exc()}

# ============================================================ render the 4 new ones (3/4 view)
try:
    scn = bpy.context.scene
    scn.render.engine = 'BLENDER_WORKBENCH'; scn.render.resolution_x = 900; scn.render.resolution_y = 800
    scn.display.shading.light = 'STUDIO'; scn.display.shading.show_cavity = True
    cam = bpy.data.objects.new("VC", bpy.data.cameras.new("VC")); scn.collection.objects.link(cam); cam.data.lens = 55; scn.camera = cam
    for cfg, bcol in baked_cols:
        names = set(o.name for o in bcol.objects)
        mc = bpy.data.collections.get(cfg["char_col"])
        if mc: names |= set(o.name for o in mc.objects)
        for o in bpy.data.objects: o.hide_render = (o.name not in names)
        dg2 = bpy.context.evaluated_depsgraph_get(); mn = Vector((1e9,)*3); mx = Vector((-1e9,)*3)
        for n in names:
            o = bpy.data.objects.get(n)
            if not o or o.type != 'MESH': continue
            for c in o.bound_box:
                w = o.evaluated_get(dg2).matrix_world @ Vector(c)
                for i in range(3): mn[i] = min(mn[i], w[i]); mx[i] = max(mx[i], w[i])
        mid = (mn + mx)/2; diag = (mx - mn).length
        a = math.radians(250); e = math.radians(12)
        dd = Vector((math.cos(e)*math.cos(a), math.cos(e)*math.sin(a), math.sin(e)))
        cam.location = mid + dd*diag*0.62; cam.rotation_euler = (mid - cam.location).to_track_quat('-Z', 'Y').to_euler()
        scn.render.filepath = RENDER_DIR + "\\" + cfg["label"].replace(" ", "_") + ".png"; bpy.ops.render.render(write_still=True)
    rep["rendered"] = True
except Exception:
    import traceback; rep["render_err"] = traceback.format_exc()

# ============================================================ save over FINAL
bpy.ops.wm.save_as_mainfile(filepath=DEST)
rep["saved"] = DEST
with open(REPORT_JSON, "w", encoding="utf-8") as f: json.dump(rep, f, ensure_ascii=False, indent=1)
print("ALL DONE")
