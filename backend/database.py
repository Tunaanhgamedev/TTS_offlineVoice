from sqlalchemy import create_engine, Column, String, Float, DateTime, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Voice(Base):
    __tablename__ = "voices"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    gender = Column(String)
    accent = Column(String)
    model_path = Column(String)
    preview_audio = Column(String, nullable=True)
    is_cloned = Column(Boolean, default=False)
    ref_audio_path = Column(String, nullable=True)

class Generation(Base):
    __tablename__ = "generations"

    id = Column(String, primary_key=True, index=True)
    text = Column(Text)
    voice_id = Column(String) # Changed from voice
    speed = Column(Float, default=1.0)
    pitch = Column(Float, default=1.0)
    audio_path = Column(String, nullable=True)
    srt_path = Column(String, nullable=True)
    status = Column(String, default="queued") # queued, processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
