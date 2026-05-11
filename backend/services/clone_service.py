import os
import uuid
import shutil
from database import SessionLocal, Voice
from typing import Optional

class CloneService:
    def __init__(self):
        # Determine paths relative to this file's location
        # backend/services/clone_service.py -> backend/
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.clones_dir = os.path.join(self.base_dir, "models", "clones")
        os.makedirs(self.clones_dir, exist_ok=True)

    def clone_voice(self, name: str, ref_audio_file, gender: str = "unknown", accent: str = "Northern") -> Optional[str]:
        """
        Register a new cloned voice using a reference audio file.
        In a real scenario, this would trigger model fine-tuning or embedding extraction.
        """
        voice_id = f"clone_{uuid.uuid4().hex[:8]}"
        ref_path = os.path.join(self.clones_dir, f"{voice_id}_ref.wav")
        
        # Save reference audio
        with open(ref_path, "wb") as buffer:
            shutil.copyfileobj(ref_audio_file, buffer)
            
        # Register in DB
        db = SessionLocal()
        try:
            new_voice = Voice(
                id=voice_id,
                name=name,
                gender=gender,
                accent=accent,
                is_cloned=True,
                ref_audio_path=ref_path
            )
            db.add(new_voice)
            db.commit()
            return voice_id
        except Exception as e:
            try:
                print(f"Clone Error: {e}")
            except:
                print("Clone Error: [Unicode Error]")
            return None
        finally:
            db.close()

clone_service = CloneService()
