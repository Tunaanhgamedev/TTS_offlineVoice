from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import uuid
from typing import List, Optional
from database import get_db, init_db, Generation, Voice
from worker import generate_voice_task

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="VietVoiceAI API")

# Serve outputs
os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# Initialize DB on startup
@app.on_event("startup")
def startup_event():
    init_db()

# CORS configuration - More permissive for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class GenerateRequest(BaseModel):
    text: str
    voice: str = "vi_VN-hoai_bao-medium"
    speed: float = 1.0
    pitch: float = 1.0

class GenerationResponse(BaseModel):
    id: str
    status: str
    audio_url: Optional[str] = None
    srt_url: Optional[str] = None
    error_message: Optional[str] = None

# Routes
@app.get("/")
async def root():
    return {"message": "VietVoiceAI API is running"}

@app.post("/generate", response_model=GenerationResponse)
async def generate_voice(request: GenerateRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    task_id = str(uuid.uuid4())
    
    new_gen = Generation(
        id=task_id,
        text=request.text,
        voice_id=request.voice,
        speed=request.speed,
        status="queued"
    )
    db.add(new_gen)
    db.commit()

    background_tasks.add_task(generate_voice_task, task_id, request.text, request.voice, request.speed)
    return GenerationResponse(id=task_id, status="queued")

@app.get("/task/{task_id}", response_model=GenerationResponse)
async def get_task_status(task_id: str, db: Session = Depends(get_db)):
    gen = db.query(Generation).filter(Generation.id == task_id).first()
    if not gen:
        raise HTTPException(status_code=404, detail="Task not found")
    
    audio_url = None
    if gen.status == "completed":
        audio_url = f"http://localhost:8000/outputs/{gen.id}.wav"
        
    srt_url = None
    if gen.srt_path:
        srt_url = f"http://localhost:8000/outputs/{gen.id}.srt"

    return GenerationResponse(
        id=gen.id,
        status=gen.status,
        audio_url=audio_url,
        srt_url=srt_url,
        error_message=gen.error_message
    )

from services.clone_service import clone_service

@app.post("/clone-voice")
async def clone_voice(
    name: str = Form(...),
    gender: str = Form(...),
    accent: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        voice_id = clone_service.clone_voice(name, file.file, gender, accent)
        if not voice_id:
            raise HTTPException(status_code=500, detail="Failed to clone voice")
        return {"id": voice_id, "name": name}
    except Exception as e:
        try:
            print(f"Error cloning: {e}")
        except:
            print("Error cloning: [Unicode Error in Exception Message]")
        raise HTTPException(status_code=500, detail="Internal Server Error")

@app.get("/voices")
async def get_voices(db: Session = Depends(get_db)):
    try:
        voices = db.query(Voice).all()
        return [
            {
                "id": v.id,
                "name": v.name,
                "gender": v.gender,
                "accent": v.accent,
                "is_cloned": v.is_cloned
            } for v in voices
        ]
    except Exception as e:
        print(f"Error fetching voices: {e}")
        return [
            {"id": "vi_VN-hoai_bao-medium", "name": "Hoài Bảo", "gender": "male", "accent": "Miền Bắc", "is_cloned": False},
            {"id": "vi_VN-nam_minh-medium", "name": "Nam Minh", "gender": "male", "accent": "Miền Bắc", "is_cloned": False}
        ]

@app.post("/dub-srt", response_model=GenerationResponse)
async def dub_srt(
    background_tasks: BackgroundTasks,
    voice: str = Form("vi_VN-hoai_bao-medium"),
    speed: float = Form(1.0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    task_id = str(uuid.uuid4())
    content = await file.read()
    try:
        srt_text = content.decode("utf-8")
    except:
        srt_text = content.decode("latin-1", errors="replace")
    
    new_gen = Generation(
        id=task_id,
        text="[DUBBING FROM SRT]",
        voice_id=voice,
        speed=speed,
        status="queued"
    )
    db.add(new_gen)
    db.commit()

    from worker import dub_srt_task
    background_tasks.add_task(dub_srt_task, task_id, srt_text, voice, speed)
    return GenerationResponse(id=task_id, status="queued")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
