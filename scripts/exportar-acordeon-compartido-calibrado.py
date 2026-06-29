# Exporta el acordeon COMPARTIDO desde "acordeon original no modificar.blend" CALIBRADO para que
# calce EXACTO en los cuerpos (que estan en el marco del acordeon v1 = copia Muchacha).
# Metodo: importa TEMPORALMENTE el acordeon v1 (raw) dentro de este archivo, empareja piezas por nombre
# (cajas, botones, parrilla, broches... unicas), calcula la similitud (escala+rot+tras) Umeyama que mapea
# original -> v1, hornea el acordeon original aplicando esa transformacion y exporta. Luego BORRA lo
# importado y RESTAURA todo. NO guarda el .blend (respeta "no modificar"). try/finally => limpieza segura.
# Comprimir: node scripts/comprimir-pelao-fuelle.mjs <raw> public/modelos3d/acordeon-compartido-vN.glb
import bpy, os, sys, re, logging
import numpy as np
from mathutils import Vector, Matrix

V1_RAW = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-compartido-raw.glb"
OUT    = r"C:\PROGRAMACION\AcademiaNext\public\modelos3d\_export\acordeon-compartido-v3-raw.glb"
ANCHOR="parrilla"; CTRL="Ctrl_Bajos"; CAJA="Caja de los bajos, izquierda"
TARGET_X=-1.156
JUNK={"Cube","Fuelle20_BACKUP","fuelle","Fuelle (tela)",
      "Cuerpo del acordeon (teclado)","Tapa lado bajos"}  # mallas sueltas/viejas del original

for n in ("io_scene_gltf2","glTF","gltf"): logging.getLogger(n).setLevel(logging.ERROR)

anchor=bpy.data.objects[ANCHOR]; ctrl=bpy.data.objects[CTRL]; caja=bpy.data.objects[CAJA]
mw0=ctrl.matrix_world.copy()
muted=[]; imported=[]; tmp=None
def base(nm):
    nm=re.sub(r'^ACC_','',nm); nm=re.sub(r'\.\d+$','',nm); return nm.strip().lower()

try:
    # 1) mute topes (para poder posar la caja luego)
    for o in (ctrl,caja):
        for c in o.constraints:
            if c.type in ('LIMIT_LOCATION','LIMIT_DISTANCE') and not c.mute:
                c.mute=True; muted.append(c)
    bpy.context.view_layer.update()

    # 2) importar v1 raw (acordeon que ya funciona) a este archivo, temporal
    before=set(bpy.data.objects)
    _old=sys.stdout
    try:
        sys.stdout=open(os.devnull,"w")
        bpy.ops.import_scene.gltf(filepath=V1_RAW)
    finally:
        sys.stdout=_old
    imported=[o for o in bpy.data.objects if o not in before]

    dg=bpy.context.evaluated_depsgraph_get()
    def centroid(o):
        ev=o.evaluated_get(dg); me=ev.to_mesh()
        if not me.vertices: ev.to_mesh_clear(); return None
        acc=Vector((0,0,0))
        for v in me.vertices: acc+=ev.matrix_world@v.co
        acc/=len(me.vertices); ev.to_mesh_clear(); return acc

    imp={}
    for o in imported:
        if o.type=='MESH': imp.setdefault(base(o.name),[]).append(o)
    orig_meshes=[o for o in bpy.data.objects if o.type=='MESH' and o not in imported
                 and o.name not in JUNK and len(o.data.vertices)>0
                 and not o.name.lower().startswith("aro 16")]  # aros no siguen el repose -> fuera
    orgm={}
    for o in orig_meshes:
        orgm.setdefault(base(o.name),[]).append(o)

    # Solo piezas RIGIDAS del lado PARRILLA (no se mueven con el fuelle/pose) -> correspondencia exacta.
    # Solo piezas ESTRUCTURALES UNICAS (sin numeracion ambigua; los botones estan renumerados entre copias)
    PARR_OK={"parrilla","borde_parrilla","broche superior","broche inferior",
             "diapason acrden","caja de parrilla, derecha","rejilla","cuerpo del acordeon (teclado)"}
    def es_parrilla(b):
        return b in PARR_OK
    pairs=[]
    for b,os_ in orgm.items():
        if not es_parrilla(b): continue
        io=imp.get(b)
        if len(os_)==1 and io and len(io)==1:
            co=centroid(os_[0]); ci=centroid(io[0])
            if co and ci: pairs.append((co,ci))
    if len(pairs)<4:
        raise RuntimeError("muy pocas correspondencias: %d" % len(pairs))

    X=np.array([[p[0].x,p[0].y,p[0].z] for p in pairs])  # original
    Y=np.array([[p[1].x,p[1].y,p[1].z] for p in pairs])  # v1
    # ajuste AFIN (captura escala no-uniforme): Y = [X 1] @ W,  W es 4x3
    Ain=np.hstack([X,np.ones((len(X),1))])
    W,_,_,_=np.linalg.lstsq(Ain,Y,rcond=None)
    pred=Ain@W
    resid=float(np.sqrt(((pred-Y)**2).sum(1)).mean())
    c=float(np.cbrt(abs(np.linalg.det(W[:3,:3]))))  # escala media (informativo)

    M=Matrix.Identity(4)
    for k in range(3):
        for j in range(3): M[k][j]=float(W[j][k])
        M[k][3]=float(W[3][k])

    # igualar la caja de bajos a la del v1 con transform COMPLETO (pos+rot) -> los botones I siguen bien
    v1box=imp.get("caja de los bajos, izquierda")
    if not v1box: raise RuntimeError("no hay caja de bajos en el v1 importado")
    W_v1=v1box[0].matrix_world.copy()
    box_local=ctrl.matrix_world.inverted()@caja.matrix_world   # caja relativa al Ctrl (constante)
    natural_box_x=round(float((M@caja.matrix_world.translation).x),3)
    ctrl.matrix_world=M.inverted()@W_v1@box_local.inverted()   # => M@caja_world = W_v1
    bpy.context.view_layer.update()
    dg=bpy.context.evaluated_depsgraph_get()

    # rechazar piezas SUELTAS/VIEJAS del original (lejos del acordeon ensamblado, en marco calibrado)
    cc=[]
    for o in orig_meshes:
        cn=centroid(o)
        if cn: cc.append((o, M@cn))
    pp=np.array([[p.x,p.y,p.z] for _,p in cc])
    med=np.median(pp,0)
    dd=np.sqrt(((pp-med)**2).sum(1))
    orig_meshes=[cc[i][0] for i in range(len(cc)) if dd[i]<2.5]

    # 3) hornear acordeon original x M, exportar yup
    tmp=bpy.data.collections.new("_CAL_TMP"); bpy.context.scene.collection.children.link(tmp)
    objs=[]
    for o in orig_meshes:
        ev=o.evaluated_get(dg)
        me=bpy.data.meshes.new_from_object(ev,preserve_all_data_layers=True,depsgraph=dg)
        me.transform(M@ev.matrix_world)
        nombre="parrilla" if o.name.lower().startswith("parrilla") else "ACC_"+o.name
        me.name=nombre; nu=bpy.data.objects.new(nombre,me); tmp.objects.link(nu); objs.append(nu)
    for o in list(bpy.context.selected_objects): o.select_set(False)
    for o in tmp.objects: o.select_set(True)
    bpy.context.view_layer.objects.active=objs[0]
    _old=sys.stdout
    try:
        sys.stdout=open(os.devnull,"w")
        bpy.ops.export_scene.gltf(filepath=OUT,use_selection=True,export_animations=False,
            export_morph=False,export_skins=False,export_yup=True,export_apply=False,export_image_format='AUTO')
    finally:
        sys.stdout=_old
    mb=round(os.path.getsize(OUT)/1e6,2)
    result={"glb_mb":mb,"pairs":len(pairs),"scale":round(c,4),"resid_world":round(resid,4),
            "mallas":len(orig_meshes),"natural_box_x":natural_box_x}
    print("RESULT:",result)
finally:
    # LIMPIEZA SEGURA (siempre): tmp + imported + restaurar ctrl/topes
    if tmp is not None:
        ds=[]
        for o in list(tmp.objects):
            if o.data and o.type=='MESH': ds.append(o.data)
            bpy.data.objects.remove(o,do_unlink=True)
        try: bpy.data.collections.remove(tmp)
        except Exception: pass
        for d in ds:
            try: bpy.data.meshes.remove(d)
            except Exception: pass
    ds=[]
    for o in list(imported):
        try:
            if o.data and o.type=='MESH': ds.append(o.data)
            bpy.data.objects.remove(o,do_unlink=True)
        except Exception: pass
    for d in ds:
        try: bpy.data.meshes.remove(d)
        except Exception: pass
    ctrl.matrix_world=mw0
    for c2 in muted: c2.mute=False
    bpy.context.view_layer.update()
