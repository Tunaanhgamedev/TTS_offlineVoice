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

    VOICE_PROFILES = {
        "manh_dung": {"pitch": 0.92, "formant": 0.95, "desc": "Trầm ấm, nam tính (Vbee style)"},
        "thao_chi": {"pitch": 1.25, "formant": 1.15, "desc": "Trong trẻo, cao vút (Vbee style)"},
        "hoai_nam": {"pitch": 1.05, "formant": 1.02, "desc": "Truyền cảm, trung tính (Vbee style)"},
        "kim_chi": {"pitch": 1.18, "formant": 1.10, "desc": "Nhẹ nhàng, miền Nam"},
        "female_default": {"pitch": 1.18, "formant": 1.12, "desc": "Giọng nữ tiêu chuẩn"},
        "male_default": {"pitch": 1.0, "formant": 1.0, "desc": "Giọng nam tiêu chuẩn"}
    }

    def get_voice_params(self, voice_id: str, voice_name: str = "", gender: str = "male"):
        """
        Determines voice transformation parameters based on voice profiles or gender.
        """
        name_lower = voice_name.lower()
        
        # 1. Check for specific famous profiles in name
        for key, profile in self.VOICE_PROFILES.items():
            if key in name_lower.replace(" ", "_"):
                return profile
        
        # 2. Fallback to gender-based defaults
        if gender.lower() == "female" or "female" in voice_id.lower():
            return self.VOICE_PROFILES["female_default"]
            
        return self.VOICE_PROFILES["male_default"]

    def generate(self, text: str, voice_id: str, output_id: str, speed: float = 1.0, gender: str = "male", voice_name: str = "") -> Optional[str]:
        """
        Generate audio using real Piper TTS with relative path detection and voice morphing.
        """
        model_path = os.path.join(self.models_dir, f"{voice_id}.onnx")
        
        # Fallback logic
        is_fallback = False
        if not os.path.exists(model_path):
            model_path = os.path.join(self.models_dir, "vi_VN-vais1000-medium.onnx")
            is_fallback = True
            if not os.path.exists(model_path):
                available = [f for f in os.listdir(self.models_dir) if f.endswith(".onnx") and os.path.getsize(os.path.join(self.models_dir, f)) > 1000]
                if available:
                    model_path = os.path.join(self.models_dir, available[0])
                else:
                    return None

        config_path = model_path + ".json"
        temp_output = os.path.join(self.outputs_dir, f"raw_{output_id}.wav")
        final_output = os.path.join(self.outputs_dir, f"{output_id}.wav")
        
        if not os.path.exists(self.piper_path):
            return None

        length_scale = 1.0 / speed
        
        try:
            # 1. Run Piper
            process = subprocess.Popen(
                [self.piper_path, '--model', model_path, '--config', config_path, '--output_file', temp_output, '--length_scale', str(length_scale)],
                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8'
            )
            process.communicate(input=text)
            
            if process.returncode != 0: return None
                
            # 2. Apply Voice Conversion
            # We apply conversion for ALL cloned voices or if is_fallback is true
            voice_params = self.get_voice_params(voice_id, voice_name, gender)
            
            if voice_params["pitch"] != 1.0 or voice_params["formant"] != 1.0:
                print(f"Morphing voice to profile: {voice_name} (Pitch: {voice_params['pitch']})")
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
