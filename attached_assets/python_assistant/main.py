
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import Base, engine, SessionLocal
from models import Athlete, TestResult, Program, CalendarEvent
from schemas import AthleteCreate, AthleteOut, ProgramCreate, ProgramOut, CalendarCreate, CalendarOut, BuildWeekIn, BuildWeekOut
from services import build_week
import json, os, re

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")

def load_json(name: str):
    with open(os.path.join(DATA_DIR, name), "r") as f:
        return json.load(f)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stride/P2P Training API", version="0.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/", StaticFiles(directory=os.path.join(APP_DIR, "static"), html=True), name="static")

@app.post("/api/athletes", response_model=AthleteOut)
def create_athlete(payload: AthleteCreate):
    with SessionLocal() as db:
        a = Athlete(first_name=payload.first_name, last_name=payload.last_name, email=payload.email,
                    belt=payload.belt or "white", goal=payload.goal, bandwidth=payload.bandwidth or "medium",
                    notes=payload.notes or "")
        db.add(a); db.commit(); db.refresh(a)
        return a

@app.get("/api/athletes", response_model=list[AthleteOut])
def list_athletes():
    with SessionLocal() as db:
        rows = db.execute(select(Athlete)).scalars().all()
        return rows

@app.post("/api/programs", response_model=ProgramOut)
def create_program(payload: ProgramCreate):
    with SessionLocal() as db:
        p = Program(name=payload.name, belt=payload.belt, content=payload.content)
        db.add(p); db.commit(); db.refresh(p)
        return p

@app.get("/api/programs", response_model=list[ProgramOut])
def list_programs():
    with SessionLocal() as db:
        rows = db.execute(select(Program)).scalars().all()
        return rows

@app.post("/api/calendar", response_model=CalendarOut)
def add_calendar_event(payload: CalendarCreate):
    with SessionLocal() as db:
        a = db.get(Athlete, payload.athlete_id)
        if not a: raise HTTPException(404, "Athlete not found")
        ce = CalendarEvent(athlete_id=a.id, date=payload.date, session=payload.session, notes=payload.notes or "")
        db.add(ce); db.commit(); db.refresh(ce)
        return ce

@app.get("/api/calendar/{athlete_id}", response_model=list[CalendarOut])
def get_calendar(athlete_id: int):
    with SessionLocal() as db:
        rows = db.execute(select(CalendarEvent).where(CalendarEvent.athlete_id==athlete_id)).scalars().all()
        return rows

@app.post("/api/build-week", response_model=BuildWeekOut)
def build_week_endpoint(req: BuildWeekIn):
    with SessionLocal() as db:
        a = db.get(Athlete, req.athlete_id)
        if not a: raise HTTPException(404, "Athlete not found")
        belt = a.belt or "white"
        bandwidth = req.override_bandwidth or a.bandwidth or "medium"
        week = build_week(belt, bandwidth, req.active_milestones, a.goal)
        return {"week": week}

@app.get("/api/library/exercises")
def lib_exercises():
    return load_json("exercises_from_docs.json")

@app.get("/api/library/mbs")
def lib_mbs():
    return load_json("mbs_exercises_from_docs.json")

@app.get("/api/milestones")
def milestones():
    return load_json("program_templates_milestone.json")["milestones"]

def parse_coach_intent(text: str):
    t = text.lower()
    intents = {"set_goal": None, "set_bandwidth": None, "add_milestones": [], "remove_milestones": [], "notes": None}
    m_goal = re.search(r"(goal|training for|prep for)[:= ]+([a-z0-9 \-]+)", t)
    if m_goal:
        intents["set_goal"] = m_goal.group(2).strip()
    else:
        for g in ["marathon","5k","10k","half marathon","preseason","speed block","strength block","afl"]:
            if g in t: intents["set_goal"] = g; break
    m_bw = re.search(r"(bandwidth|time|availability)[:= ]+(low|medium|high)", t)
    if m_bw: intents["set_bandwidth"] = m_bw.group(2)
    adds = re.findall(r"add\s+(MS_[A-Z0-9_]+)", t)
    rems = re.findall(r"(?:remove|drop)\s+(MS_[A-Z0-9_]+)", t)
    intents["add_milestones"] = list(dict.fromkeys(adds))
    intents["remove_milestones"] = list(dict.fromkeys(rems))
    if "note" in t: intents["notes"] = text
    return intents

@app.post("/api/coach-assist")
def coach_assist(athlete_id: int = Body(...), message: str = Body(...)):
    with SessionLocal() as db:
        a = db.get(Athlete, athlete_id)
        if not a: raise HTTPException(404, "Athlete not found")
        intents = parse_coach_intent(message)

        changes = []
        if intents["set_goal"]:
            a.goal = intents["set_goal"]; changes.append(f"Set goal -> {a.goal}")
        if intents["set_bandwidth"]:
            a.bandwidth = intents["set_bandwidth"]; changes.append(f"Set bandwidth -> {a.bandwidth}")
        db.commit(); db.refresh(a)

        ms = load_json("program_templates_milestone.json")["milestones"]
        ms_ids = [m["id"] for m in ms]
        suggested = []
        if a.goal and "marathon" in a.goal.lower():
            for key in ["MS_ST_UNILAT_SYM","MS_SQ_VMAX_BASE"]:
                if key in ms_ids: suggested.append(key)
        else:
            for key in ["MS_COD_DECEL","MS_SQ_VMAX_BASE"]:
                if key in ms_ids: suggested.append(key)
        for add in intents["add_milestones"]:
            if add in ms_ids and add not in suggested: suggested.append(add)
        for rem in intents["remove_milestones"]:
            if rem in suggested: suggested.remove(rem)

        return {
            "assistant_readback": {
                "applied_changes": changes,
                "current_profile": {"belt": a.belt, "goal": a.goal, "bandwidth": a.bandwidth},
                "suggested_milestones": suggested
            },
            "next_step": {
                "build_week_body": {"athlete_id": a.id, "active_milestones": suggested, "override_bandwidth": a.bandwidth}
            }
        }

@app.get("/api/health")
def health():
    return {"status":"ok"}
