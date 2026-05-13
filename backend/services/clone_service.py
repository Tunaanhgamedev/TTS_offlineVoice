import os
import uuid
import shutil
import json
from services.f5_runner import generate_clone
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

    def generate_zero_shot(self, text: str, ref_audio_path: str, output_path: str) -> bool:
        """
        True Zero-Shot Voice Cloning using F5-TTS.
        This completely bypasses Piper and uses the reference audio directly.
        """
        import subprocess
        import sys
        print(f"\n[ZERO-SHOT CLONING] Initiating neural cloning for text: {text[:30]}...")
        print(f"[ZERO-SHOT CLONING] Reference audio: {ref_audio_path}")
        
        # Call the programmatic generation directly in the current process
        # This completely avoids Windows subprocess PyTorch initialization crashes
        try:
            success = generate_clone(
                ref_audio=ref_audio_path,
                ref_text="",  # Whisper will auto-transcribe
                gen_text=text,
                output_path=output_path
            )
            return success
        except Exception as e:
            print(f"[ZERO-SHOT ERROR] Python exception during generation: {e}")
            return False
                
        except FileNotFoundError:
            print("[ZERO-SHOT FATAL] 'f5-tts_infer-cli' command not found.")
            print("To enable True Voice Cloning, you must install F5-TTS:")
            print("pip install git+https://github.com/SWivid/F5-TTS.git")
            return False
        except Exception as e:
            print(f"[ZERO-SHOT ERROR] {e}")
            return False

clone_service = CloneService()
