from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import re # System-wide re import
import uuid
from typing import List, Optional
from database import get_db, init_db, Generation, Voice
from worker import generate_voice_task

# --- SYSTEM CONFIGURATION ---
# Route heavy AI model downloads to the I: drive to save C: drive space
HF_DIR = r"I:\AppData_Backup\.cache\huggingface"
TORCH_DIR = r"I:\AppData_Backup\.cache\torch"
os.environ["HF_HOME"] = HF_DIR
os.environ["TORCH_HOME"] = TORCH_DIR

# Ensure these directories actually exist before F5-TTS tries to use them
os.makedirs(HF_DIR, exist_ok=True)
os.makedirs(TORCH_DIR, exist_ok=True)

from fastapi.staticfiles import StaticFiles

app = FastAPI(title="VietVoiceAI API")

# Serve outputs
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")
os.makedirs(OUTPUTS_DIR, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=OUTPUTS_DIR), name="outputs")

# Initialize DB on startup and seed standard voices
@app.on_event("startup")
def startup_event():
    init_db()
    db = next(get_db())
    try:
        # Standard voices to seed
        standard_voices = [
            {"id": "vi_VN-hoai_bao-medium", "name": "Hoài Bảo (Bắc)", "gender": "male", "accent": "Miền Bắc"},
            {"id": "ngoc_huyen", "name": "Ngọc Huyền (Bắc)", "gender": "female", "accent": "Miền Bắc"},
            {"id": "manh_dung", "name": "Mạnh Dũng (Bắc)", "gender": "male", "accent": "Miền Bắc"},
            {"id": "thao_chi", "name": "Thảo Chi (Bắc)", "gender": "female", "accent": "Miền Bắc"},
            {"id": "vi_VN-vivos-17k-low", "name": "Vivos Nữ (Nam)", "gender": "female", "accent": "Miền Nam"},
        ]
        
        for v_data in standard_voices:
            exists = db.query(Voice).filter(Voice.id == v_data["id"]).first()
            if not exists:
                new_voice = Voice(
                    id=v_data["id"],
                    name=v_data["name"],
                    gender=v_data["gender"],
                    accent=v_data["accent"],
                    model_path=f"{v_data['id']}.onnx",
                    is_cloned=False
                )
                db.add(new_voice)
        db.commit()
        print("Standard voice profiles seeded successfully.")
    except Exception as e:
        print(f"Error seeding voices: {e}")
    finally:
        db.close()

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
    pitch: Optional[float] = None
    formant: Optional[float] = None

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

    background_tasks.add_task(generate_voice_task, task_id, request.text, request.voice, request.speed, request.pitch, request.formant)
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
@app.delete("/voice/all")
async def delete_all_cloned_voices(db: Session = Depends(get_db)):
    try:
        voices = db.query(Voice).filter(Voice.is_cloned == True).all()
        for voice in voices:
            # Delete physical reference audio if it exists
            if getattr(voice, "ref_audio_path", None) and os.path.exists(voice.ref_audio_path):
                try:
                    os.remove(voice.ref_audio_path)
                    print(f"Deleted physical ref audio: {voice.ref_audio_path}")
                except Exception as e:
                    print(f"Could not delete physical ref audio: {e}")
            db.delete(voice)
        db.commit()
        return {"message": "All cloned voices deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
@app.delete("/voice/{voice_id}")
async def delete_voice(voice_id: str, db: Session = Depends(get_db)):
    voice = db.query(Voice).filter(Voice.id == voice_id).first()
    if not voice:
        raise HTTPException(status_code=404, detail="Voice not found")
    
    if not voice.is_cloned:
        raise HTTPException(status_code=403, detail="Cannot delete system voices")

    try:
        # Delete physical reference audio if it exists
        if getattr(voice, "ref_audio_path", None) and os.path.exists(voice.ref_audio_path):
            try:
                os.remove(voice.ref_audio_path)
                print(f"Deleted physical ref audio: {voice.ref_audio_path}")
            except Exception as e:
                print(f"Could not delete physical ref audio: {e}")
                
        db.delete(voice)
        db.commit()
        return {"message": "Voice deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dub-srt", response_model=GenerationResponse)
async def dub_srt(
    background_tasks: BackgroundTasks,
    voice: str = Form("vi_VN-hoai_bao-medium"),
    speed: float = Form(1.0),
    pitch: Optional[float] = Form(None),
    formant: Optional[float] = Form(None),
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
    background_tasks.add_task(dub_srt_task, task_id, srt_text, voice, speed, pitch, formant)
    return GenerationResponse(id=task_id, status="queued")

@app.get("/generations")
async def get_generations(db: Session = Depends(get_db)):
    gens = db.query(Generation).order_by(Generation.created_at.desc()).all()
    return [
        {
            "id": g.id,
            "text": g.text,
            "voice_id": g.voice_id,
            "status": g.status,
            "created_at": g.created_at,
            "audio_url": f"http://localhost:8000/outputs/{g.id}.wav" if g.status == "completed" else None,
            "srt_url": f"http://localhost:8000/outputs/{g.id}.srt" if g.srt_path else None
        } for g in gens
    ]

@app.get("/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_gens = db.query(Generation).count()
    completed_gens = db.query(Generation).filter(Generation.status == "completed").count()
    total_voices = db.query(Voice).count()
    
    # Calculate total characters processed
    all_gens = db.query(Generation).all()
    total_chars = sum(len(g.text) for g in all_gens if g.text)
    
    return {
        "total_generations": total_gens,
        "completed_generations": completed_gens,
        "total_voices": total_voices,
        "total_characters": total_chars
    }

@app.delete("/task/all")
async def delete_all_tasks(db: Session = Depends(get_db)):
    print("--- ATTEMPTING DELETE ALL TASKS ---")
    try:
        gens = db.query(Generation).all()
        outputs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
        
        for gen in gens:
            for ext in [".wav", ".srt"]:
                file_path = os.path.join(outputs_dir, f"{gen.id}{ext}")
                if os.path.exists(file_path):
                    try:
                        os.remove(file_path)
                    except Exception as e:
                        print(f"Could not delete physical file {file_path}: {e}")
                        
            db.delete(gen)
            
        db.commit()
        print("SUCCESS: All tasks deleted from database.")
        return {"message": "All tasks deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"DATABASE ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/task/{task_id}")
async def delete_task(task_id: str, db: Session = Depends(get_db)):
    print(f"--- ATTEMPTING DELETE: {task_id} ---")
    gen = db.query(Generation).filter(Generation.id == task_id).first()
    if not gen:
        print(f"ERROR: Task {task_id} not found in database.")
        raise HTTPException(status_code=404, detail="Task not found in database")
    
    # 1. Delete physical files
    # Use absolute path to avoid any confusion
    outputs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "outputs")
    
    for ext in [".wav", ".srt"]:
        file_path = os.path.join(outputs_dir, f"{task_id}{ext}")
        if os.path.exists(file_path):
            try:
                print(f"Deleting file: {file_path}")
                os.remove(file_path)
            except Exception as e:
                print(f"Could not delete physical file {file_path}: {e}")
                # We continue anyway to delete the DB record
                
    # 2. Delete from DB
    try:
        db.delete(gen)
        db.commit()
        print(f"SUCCESS: Task {task_id} deleted from database.")
        return {"message": "Task deleted successfully"}
    except Exception as e:
        db.rollback()
        print(f"DATABASE ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
