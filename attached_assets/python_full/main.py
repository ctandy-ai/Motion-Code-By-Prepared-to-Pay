
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import select
from database import Base, engine, SessionLocal
from models import Athlete, TestResult, Program, CalendarEvent
from schemas import AthleteCreate, AthleteOut, ProgramCreate, ProgramOut, CalendarCreate, CalendarOut, BuildWeekIn, BuildWeekOut
from services import build_week
import json, os

APP_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(APP_DIR, "data")

def load_json(name: str):
    with open(os.path.join(DATA_DIR, name), "r") as f:
        return json.load(f)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Stride/P2P Training API", version="0.3.0")

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

@app.get("/api/health")
def health():
    return {"status":"ok"}
