"""One-shot orchestrator: submit 3 image-to-3D jobs in parallel, wait, fetch.
Runs in background so the agent isn't blocked.
Writes a manifest at refs/_pipeline_manifest.json with task_ids and result paths.
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

JOBS = [
    ("pig_head", REFS / "Cabeza de puerco.png"),
    ("pig_body", REFS / "Cuerpo.png"),
    ("top_hat", REFS / "Sombrero.png"),
]

# Load the client module (filename starts with a digit -> use importlib)
spec = importlib.util.spec_from_file_location(
    "client_mod",
    r"C:/Users/acord/.claude/skills/3d-ai-studio-api/scripts/3d_api_client.py",
)
client_mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(client_mod)
ThreeDAPIClient = client_mod.ThreeDAPIClient


def log(msg: str):
    line = f"[{time.strftime('%H:%M:%S')}] {msg}"
    print(line, flush=True)
    with open(LOGFILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def write_manifest(data: dict):
    MANIFEST.write_text(json.dumps(data, indent=2), encoding="utf-8")


def main():
    open(LOGFILE, "w").close()  # truncate log
    client = ThreeDAPIClient()

    state = {name: {"image": str(path), "task_id": None, "status": "pending", "files": []}
             for name, path in JOBS}
    write_manifest(state)

    # 1) Submit 3 jobs sequentially (avoid 429 due to burst). Each submission is sub-second.
    log("Submitting 3 image-to-3D jobs (tripo p1, PBR enabled)...")
    for name, path in JOBS:
        tid = client.start_image_to_3d(image_path=str(path), provider="tripo", tier="p1", enable_pbr=True)
        state[name]["task_id"] = tid
        state[name]["status"] = "submitted"
        log(f"  {name} -> task_id={tid}")
        write_manifest(state)
        time.sleep(13)  # stay below 5/min rate limit (12s + buffer between requests)

    # 2) Wait for all in parallel (independent threads, polling each)
    def wait_one(name: str):
        tid = state[name]["task_id"]
        try:
            final = client.wait_for_completion(tid, max_attempts=180, poll_interval=8)
            return name, "FINISHED", final
        except Exception as e:
            return name, "FAILED", {"error": str(e)}

    log("Waiting for all 3 jobs to finish...")
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = [ex.submit(wait_one, n) for n, _ in JOBS]
        for fut in as_completed(futures):
            name, status, info = fut.result()
            state[name]["status"] = status
            log(f"  {name}: {status}")
            write_manifest(state)

    # 3) Fetch results (sequential to keep things simple; adds wait if asset URL is null)
    log("Fetching results...")
    for name, _ in JOBS:
        if state[name]["status"] != "FINISHED":
            continue
        tid = state[name]["task_id"]
        try:
            saved = client.fetch_result(tid, output_dir=str(OUT))
            # Tag the files with the role name for easier discovery
            tagged = []
            for src in saved:
                src_p = Path(src)
                # Keep extension; rename so the role appears in the filename
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
        write_manifest(state)

    log("DONE")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log(f"FATAL: {e}")
        sys.exit(1)
