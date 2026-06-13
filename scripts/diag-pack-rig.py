import bpy, json
arm = bpy.data.objects.get("AnimRig")
d = {
    "existe": bool(arm),
    "hide_viewport": arm.hide_viewport if arm else None,
    "hide_get": arm.hide_get() if arm else None,
    "visible_get": arm.visible_get() if arm else None,
    "colecciones": [c.name for c in arm.users_collection] if arm else [],
    "en_view_layer": arm.name in bpy.context.view_layer.objects if arm else None,
}
if arm:
    arm.select_set(True)
    d["quedo_seleccionado"] = arm in list(bpy.context.selected_objects)
print("RESULT_JSON:" + json.dumps(d, ensure_ascii=False))
