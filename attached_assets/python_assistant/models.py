
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, func, Text
from sqlalchemy.orm import relationship
from database import Base

class Athlete(Base):
    __tablename__ = "athletes"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    belt = Column(String, default="white")
    goal = Column(String, nullable=True)
    bandwidth = Column(String, default="medium")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    tests = relationship("TestResult", back_populates="athlete", cascade="all, delete-orphan")
    calendar = relationship("CalendarEvent", back_populates="athlete", cascade="all, delete-orphan")

class TestResult(Base):
    __tablename__ = "test_results"
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False, index=True)
    test_type = Column(String, nullable=False)
    rsi_symmetry_pct = Column(Float, nullable=True)
    flight_contact_ratio_pct = Column(Float, nullable=True)
    linear_speed_mps = Column(Float, nullable=True)
    raw = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    athlete = relationship("Athlete", back_populates="tests")

class Program(Base):
    __tablename__ = "programs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    belt = Column(String, nullable=True)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id = Column(Integer, primary_key=True, index=True)
    athlete_id = Column(Integer, ForeignKey("athletes.id"), nullable=False)
    date = Column(String, nullable=False)
    session = Column(JSON, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    athlete = relationship("Athlete", back_populates="calendar")
