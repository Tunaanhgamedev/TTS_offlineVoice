import os
import time
from database import SessionLocal, Generation, Voice
from services.tts_service import tts_service
from utils.text_norm import normalize_vietnamese_text

from services.subtitle_service import subtitle_service
from services.dubbing_service import dubbing_service

def generate_voice_task(task_id: str, text: str, voice_id: str, speed: float):
    db = SessionLocal()
    generation = None
    try:
        generation = db.query(Generation).filter(Generation.id == task_id).first()
        if not generation:
            return
        
        generation.status = "processing"
        db.commit()

        # 1. Normalize Text
        norm_text = normalize_vietnamese_text(text)

        # 2. Generate Audio (TTS)
        # Fetch voice metadata to apply correct conversion
        voice_info = db.query(Voice).filter(Voice.id == voice_id).first()
        
        # If voice_id is missing from DB, we still try to generate
        gender = voice_info.gender if voice_info else "male"
        voice_name = voice_info.name if voice_info else ""
        audio_path = tts_service.generate(norm_text, voice_id, task_id, speed, gender=gender, voice_name=voice_name)
        
        if not audio_path:
            raise Exception("Failed to generate audio with Piper TTS")
        
        generation.audio_path = audio_path
        db.commit()

        # 3. Generate Subtitles (Real implementation)
        srt_path = subtitle_service.generate_srt(text, task_id, speed)
        
        generation.srt_path = srt_path
        generation.status = "completed"
        db.commit()
    except Exception as e:
        print(f"Worker Error: {e}")
        if generation:
            generation.status = "failed"
            generation.error_message = str(e)
            db.commit()
    finally:
        db.close()

def dub_srt_task(task_id: str, srt_content: str, voice_id: str, speed: float):
    db = SessionLocal()
    generation = None
    try:
        generation = db.query(Generation).filter(Generation.id == task_id).first()
        if not generation: return
        
        generation.status = "processing"
        db.commit()

        # Fetch voice metadata
        voice_info = db.query(Voice).filter(Voice.id == voice_id).first()
        gender = voice_info.gender if voice_info else "male"
        voice_name = voice_info.name if voice_info else ""

        # 2. Process SRT and generate real audio using dubbing_service
        audio_path = dubbing_service.process_srt(srt_content, voice_id, task_id, speed, gender=gender, voice_name=voice_name)
        
        if not audio_path:
            raise Exception("Failed to process SRT dubbing")
        
        srt_path = os.path.join("outputs", f"{task_id}.srt")
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)
        
        generation.audio_path = audio_path
        generation.srt_path = srt_path
        generation.status = "completed"
        db.commit()
    except Exception as e:
        print(f"Dubbing Worker Error: {e}")
        if generation:
            generation.status = "failed"
            generation.error_message = str(e)
            db.commit()
    finally:
        db.close()
