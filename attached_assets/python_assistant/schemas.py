
from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class AthleteCreate(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    belt: Optional[str] = None
    goal: Optional[str] = None
    bandwidth: Optional[str] = "medium"
    notes: Optional[str] = None

class AthleteOut(BaseModel):
    id: int
    first_name: str
    last_name: str
    email: Optional[str] = None
    belt: str
    goal: Optional[str] = None
    bandwidth: Optional[str] = None
    class Config:
        from_attributes = True

class ProgramCreate(BaseModel):
    name: str
    belt: Optional[str] = None
    content: Dict[str, Any]

class ProgramOut(BaseModel):
    id: int
    name: str
    belt: Optional[str] = None
    content: Dict[str, Any]
    class Config:
        from_attributes = True

class CalendarCreate(BaseModel):
    athlete_id: int
    date: str
    session: Dict[str, Any]
    notes: Optional[str] = None

class CalendarOut(BaseModel):
    id: int
    athlete_id: int
    date: str
    session: Dict[str, Any]
    notes: Optional[str] = None
    class Config:
        from_attributes = True

class BuildWeekIn(BaseModel):
    athlete_id: int
    active_milestones: List[str]
    override_bandwidth: Optional[str] = None

class BuildWeekOut(BaseModel):
    week: Dict[str, Any]
