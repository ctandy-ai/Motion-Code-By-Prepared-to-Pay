
import os, json, random

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")

def load_json(name: str):
    with open(os.path.join(DATA_DIR, name), "r") as f:
        return json.load(f)

def pick_exercises(pool, tags, count=1):
    selected = []
    for p in pool:
        if any(t in p.get("tags", []) for t in tags):
            selected.append(p)
    random.shuffle(selected)
    return selected[:count]

def adjust_for_goal(session, goal):
    # Rule-of-thumb marathon overlay: reduce plyo contacts, add MAS & long run
    if not goal:
        return session
    s = json.loads(json.dumps(session))
    if str(goal).lower() == "marathon":
        for item in s.get("plyo", []):
            if "contacts" in item.get("details", {}):
                try:
                    val = int("".join([c for c in str(item["details"]["contacts"]) if c.isdigit()]))
                    item["details"]["contacts"] = max(20, int(val * 0.7))
                except Exception:
                    pass
        s.setdefault("running", [])
        s["running"].append({"name":"MAS Intervals", "description":"4-6 x 3min @ MAS w/ 2min easy"})
        s["running"].append({"name":"Long Run", "description":"60-90min conversational"})
    return s

def build_week(belt, bandwidth, milestones, goal):
    lib = load_json("exercises_from_docs.json")
    mbs_lib = load_json("mbs_exercises_from_docs.json")
    ms = load_json("program_templates_milestone.json")

    week = {"speed": [], "plyo": [], "strength": [], "mbs": [], "running": []}

    ms_map = {m["id"]: m for m in ms["milestones"]}
    for m in milestones:
        node = ms_map.get(m)
        if not node: 
            continue
        arch = node.get("session_archetypes", {})
        for sp in arch.get("speed", []):
            week["running"].append({"name": sp.get("name"), "details": sp})
        for pl in arch.get("plyo", []):
            picks = pick_exercises(lib, tags=["Coordination","MBS","COD","Running"], count=1)
            week["plyo"].append({"name": pl.get("name"), "details": pl, "alt": [p["name"] for p in picks]})
        for st in arch.get("strength", []):
            week["strength"].append({"name": st.get("name"), "scheme": st.get("scheme","")})
        for mb in arch.get("mbs", []):
            mbs_pick = pick_exercises(mbs_lib, tags=["MBS","COD","Stepping"], count=1)
            week["mbs"].append({"name": mb.get("name"), "scheme": mb.get("scheme",""), "alt": [p["name"] for p in mbs_pick]})
    if bandwidth == "low":
        week["strength"] = week["strength"][:2]
        week["plyo"] = week["plyo"][:1]
    elif bandwidth == "high":
        if week["running"]: week["running"].append(week["running"][0])
        if week["plyo"]: week["plyo"].append(week["plyo"][0])

    week = adjust_for_goal(week, goal)
    return week
