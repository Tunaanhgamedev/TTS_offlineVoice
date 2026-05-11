import os
import subprocess
from typing import Optional

class TTSService:
    def __init__(self):
        # Determine paths relative to this file's location
        # This file is in backend/services/tts_service.py
        # Base dir should be 'backend/'
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.models_dir = os.path.join(self.base_dir, "models")
        self.outputs_dir = os.path.join(self.base_dir, "outputs")
        self.piper_path = os.path.join(self.base_dir, "piper", "piper", "piper.exe")
        
        os.makedirs(self.outputs_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)

    def get_voice_params(self, voice_id: str, gender: str = "male"):
        """
        Logic to determine voice transformation parameters based on gender.
        """
        params = {"pitch": 1.0, "formant": 1.0}
        
        # If it's a female voice (cloned or system), we shift pitch up
        if gender.lower() == "female" or "female" in voice_id.lower():
            params = {
                "pitch": 1.18,   # Higher pitch for female
                "formant": 1.12  # Feminine tone
            }
        return params

    def generate(self, text: str, voice_id: str, output_id: str, speed: float = 1.0, gender: str = "male") -> Optional[str]:
        """
        Generate audio using real Piper TTS with relative path detection.
        """
        model_path = os.path.join(self.models_dir, f"{voice_id}.onnx")
        
        # Fallback logic for cloned voices or missing models
        is_fallback = False
        if not os.path.exists(model_path):
            model_path = os.path.join(self.models_dir, "vi_VN-vais1000-medium.onnx")
            is_fallback = True
            if not os.path.exists(model_path):
                # Try to find ANY onnx file
                available = [f for f in os.listdir(self.models_dir) if f.endswith(".onnx") and os.path.getsize(os.path.join(self.models_dir, f)) > 1000]
                if available:
                    model_path = os.path.join(self.models_dir, available[0])
                else:
                    print(f"CRITICAL: No valid models found in {self.models_dir}")
                    return None

        config_path = model_path + ".json"
        temp_output = os.path.join(self.outputs_dir, f"raw_{output_id}.wav")
        final_output = os.path.join(self.outputs_dir, f"{output_id}.wav")
        
        # Ensure piper.exe exists
        if not os.path.exists(self.piper_path):
            print(f"CRITICAL: Piper binary not found at {self.piper_path}")
            # Try a fallback if possible or just log error
            return None

        length_scale = 1.0 / speed
        
        try:
            # 1. Run Piper
            process = subprocess.Popen(
                [self.piper_path, '--model', model_path, '--config', config_path, '--output_file', temp_output, '--length_scale', str(length_scale)],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding='utf-8'
            )
            stdout, stderr = process.communicate(input=text)
            
            if process.returncode != 0:
                print(f"Piper error: {stderr}")
                return None
                
            # 2. Apply Voice Conversion if needed
            voice_params = self.get_voice_params(voice_id, gender)
            
            if is_fallback and (voice_params["pitch"] != 1.0 or voice_params["formant"] != 1.0):
                pitch_val = voice_params["pitch"]
                cmd = [
                    'ffmpeg', '-y', '-i', temp_output,
                    '-af', f"asetrate=22050*{pitch_val},atempo=1/{pitch_val}",
                    final_output
                ]
                subprocess.run(cmd, check=True, capture_output=True)
                if os.path.exists(temp_output): os.remove(temp_output)
            else:
                if os.path.exists(final_output): os.remove(final_output)
                os.rename(temp_output, final_output)
                
            return final_output
        except Exception as e:
            print(f"TTS Error: {e}")
            return None

tts_service = TTSService()
