"""Continuation: sombrero already submitted. Submit head + body, wait for all 3, fetch.
Manifest at refs/_pipeline_manifest.json. Log at refs/_pipeline_log.txt.
"""
import json
import sys
import time
import importlib.util
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

REFS = Path(r"C:/PROGRAMACION/Academia/public/modelos3d/generados/refs")
OUT = Path(r"C:/PROGRAMACION/Academia/public/modelos3d/generados")
MANIFEST = REFS / "_pipeline_manifest.json"
LOGFILE = REFS / "_pipeline_log.txt"

# Pre-existing submission
state = {
    "top_hat":  {"image": str(REFS / "Sombrero.png"),         "task_id": "07cae654-ade1-4403-b5b6-4a0cba4628b7", "status": "submitted", "files": []},
    "pig_head": {"image": str(REFS / "Cabeza de puerco.png"), "task_id": None, "status": "pending", "files": []},
    "pig_body": {"image": str(REFS / "Cuerpo.png"),           "task_id": None, "status": "pending", "files": []},
}

spec = importlib.util.spec_from_file_location("client_mod",
    r"C:/Users/acord/.claude/skills/3d-ai-studio-api/scripts/3d_api_client.py")
client_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(client_mod)

def log(msg):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOGFILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def write_manifest():
    MANIFEST.write_text(json.dumps(state, indent=2), encoding="utf-8")

def main():
    open(LOGFILE, "w").close()
    client = client_mod.ThreeDAPIClient()
    write_manifest()

    # Submit remaining 2 with spacing
    remaining = [("pig_head", REFS / "Cabeza de puerco.png"),
                 ("pig_body", REFS / "Cuerpo.png")]
    log("Resuming pipeline. top_hat already submitted as " + state["top_hat"]["task_id"])
    for name, path in remaining:
        log(f"Submitting {name}...")
        tid = client.start_image_to_3d(image_path=str(path), provider="tripo", tier="p1", enable_pbr=True)
        state[name]["task_id"] = tid
        state[name]["status"] = "submitted"
        log(f"  {name} -> {tid}")
        write_manifest()
        time.sleep(15)  # respect 5/min limit

    # Wait for all in parallel
    def wait_one(name):
        tid = state[name]["task_id"]
        try:
            final = client.wait_for_completion(tid, max_attempts=180, poll_interval=8)
            return name, "FINISHED", final
        except Exception as e:
            return name, "FAILED", {"error": str(e)}

    log("Waiting for all 3 jobs to finish (parallel polling)...")
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = [ex.submit(wait_one, n) for n in state.keys()]
        for fut in as_completed(futures):
            name, status, info = fut.result()
            state[name]["status"] = status
            log(f"  {name}: {status}")
            write_manifest()

    # Fetch results
    log("Fetching results...")
    for name in state.keys():
        if state[name]["status"] != "FINISHED":
            continue
        tid = state[name]["task_id"]
        try:
            saved = client.fetch_result(tid, output_dir=str(OUT))
            tagged = []
            for src in saved:
                src_p = Path(src)
                target = OUT / f"{name}_{src_p.name}"
                if src_p.exists():
                    src_p.rename(target)
                    tagged.append(str(target))
            state[name]["files"] = tagged
            log(f"  {name}: saved {len(tagged)} file(s)")
        except Exception as e:
            state[name]["status"] = "FETCH_FAILED"
            state[name]["error"] = str(e)
            log(f"  {name}: fetch failed: {e}")
        write_manifest()

    log("DONE")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"FATAL: {e}")
        sys.exit(1)
