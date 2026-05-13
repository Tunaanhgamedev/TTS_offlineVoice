import os
import uuid
import shutil
import json
import sys
import subprocess
from database import SessionLocal, Voice, Generation
from typing import Optional

class CloneService:
    def __init__(self):
        # Determine paths relative to this file's location
        # backend/services/clone_service.py -> backend/
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.clones_dir = os.path.join(self.base_dir, "models", "clones")
        os.makedirs(self.clones_dir, exist_ok=True)

    def clone_voice(self, name: str, ref_audio_file, gender: str = "female", accent: str = "Miền Bắc", ref_text: str = "") -> Optional[str]:
        """
        Register a new cloned voice using a reference audio file.
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
                ref_audio_path=ref_path,
                ref_text=ref_text
            )
            db.add(new_voice)
            db.commit()
            return voice_id
        except Exception as e:
            print(f"DB Error: {e}")
            return None
        finally:
            db.close()

    def generate_zero_shot(self, text: str, ref_audio_path: str, output_path: str, task_id: str = None, ref_text: str = "") -> bool:
        """
        True Zero-Shot Voice Cloning using F5-TTS.
        This completely bypasses Piper and uses the reference audio directly.
        """
        import subprocess
        import sys
        
        # We MUST run F5-TTS in a separate subprocess because it has native C-extension
        # bugs on Windows with Python 3.13 that cause hard silent crashes (Exit code 1).
        runner_path = os.path.join(self.base_dir, "services", "f5_runner.py")
        cmd = [
            sys.executable,
            "-u", # Unbuffered to catch any potential stdout
            runner_path,
            "--ref_audio", os.path.abspath(ref_audio_path),
            "--ref_text", ref_text,
            "--gen_text", text,
            "--output_path", os.path.abspath(output_path)
        ]
        
        try:
            print(f"[ZERO-SHOT CLONING] Running subprocess: {' '.join(cmd)}")
            
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT, # Merge stderr into stdout to avoid pipe deadlocks
                text=True,
                encoding="utf-8",
                bufsize=1,
                env=os.environ 
            )
            
            db = SessionLocal()
            try:
                for line in process.stdout:
                    line = line.strip()
                    print(f"  [F5-TTS] {line}")
                    
                    # Update status in DB if task_id is provided
                    if task_id and "PROGRESS:" in line:
                        status_detail = line.split("PROGRESS:")[1].split()[0]
                        # Map internal progress to user-friendly messages
                        status_map = {
                            "LOADING_LIBS": "processing: Khởi tạo thư viện AI...",
                            "LOADING_VOCODER": "processing: Nạp bộ giải mã âm thanh...",
                            "LOADING_MODEL": "processing: Đang tải mô hình F5-TTS...",
                            "PREPROCESSING": "processing: Đang phân tích mẫu giọng nói (Whisper)...",
                            "INFERRING": "processing: Đang tiến hành nhân bản giọng nói...",
                            "SAVING": "processing: Đang lưu kết quả..."
                        }
                        
                        friendly_status = status_map.get(status_detail, f"processing: {status_detail}")
                        db.query(Generation).filter(Generation.id == task_id).update({"status": friendly_status})
                        db.commit()
                
                process.wait()
                
                if process.returncode != 0:
                    # Note: Since stderr was merged into stdout, the final errors might be at the end of stdout
                    # But we've already been reading from it in the loop.
                    print(f"[ZERO-SHOT CLONING] Subprocess failed with code {process.returncode}")
                    with open("subprocess_error.txt", "w", encoding="utf-8") as f:
                        f.write(f"RETURN CODE: {process.returncode}\n")
                        f.write(f"Check runner_log.txt or backend terminal for detailed error traceback.\n")
                    return False
                    
                if os.path.exists(output_path):
                    print(f"[ZERO-SHOT CLONING] Success! Saved to {output_path}")
                    return True
                else:
                    return False
            finally:
                db.close()
                
        except Exception as e:
            print(f"[ZERO-SHOT ERROR] {e}")
            return False

clone_service = CloneService()
