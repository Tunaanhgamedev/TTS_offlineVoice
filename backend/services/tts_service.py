import os
import subprocess
import re
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
        "manh_dung": {
            "pitch": 0.92, "formant": 0.95, "noise_scale": 0.667, "noise_w": 0.8,
            "eq": "aresample=44100,equalizer=f=250:width_type=h:w=100:g=3,compand=0.3|0.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.2", 
            "desc": "Trầm ấm, nam tính (Vbee style)"
        },
        "thao_chi": {
            "pitch": 1.32, "formant": 1.15, "noise_scale": 0.75, "noise_w": 0.85,
            "eq": "aresample=44100,equalizer=f=4000:width_type=h:w=1000:g=4,treble=g=3:f=8000", 
            "desc": "Trong trẻo, cao vút (Vbee style)"
        },
        "ngoc_huyen": {
            "pitch": 1.35, 
            "formant": 1.15,
            "noise_scale": 0.4,
            "noise_w": 0.7,
            "default_speed": 1.15,
            "eq": "equalizer=f=3500:width_type=h:w=1500:g=2", # Clean vocal focus, NO ECHO
            "desc": "Ngọt ngào, nguyên bản, Studio Clean V6 (Bắc)"
        },
        "hoai_nam": {"pitch": 1.05, "formant": 1.02, "eq": "aresample=44100,equalizer=f=1000:width_type=h:w=500:g=2", "desc": "Truyền cảm, trung tính (Vbee style)"},
        "kim_chi": {"pitch": 1.18, "formant": 1.10, "eq": "aresample=44100,equalizer=f=3000:width_type=h:w=1000:g=3", "desc": "Nhẹ nhàng, miền Nam"},
        "female_default": {"pitch": 1.20, "formant": 1.12, "eq": "aresample=44100,equalizer=f=3000:width_type=h:w=1000:g=2", "desc": "Giọng nữ tiêu chuẩn"},
        "male_default": {"pitch": 1.0, "formant": 1.0, "eq": "aresample=44100", "desc": "Giọng nam tiêu chuẩn"}
    }

    def normalize_text(self, text: str) -> str:
        """
        Cleans text and applies a pronunciation dictionary for better naturalness.
        """
        import re
        # 1. Simple SSML tag removal/conversion
        # Convert <break time="..."/> to a comma or ellipsis for natural pausing
        text = re.sub(r'<break[^>]*>', '...', text)
        text = re.sub(r'<[^>]*>', '', text) # Remove other tags
        
        # 2. Pronunciation Dictionary (Common terms/Acronyms)
        dictionary = {
            "AI": "ây ai",
            "TTS": "tê tê ét",
            "Vbee": "vê bi",
            "VN": "Việt Nam",
            "HN": "Hà Nội",
            "TP.HCM": "Thành phố Hồ Chí Minh",
            "USD": "đô la mỹ",
            "VND": "việt nam đồng"
        }
        
        for key, val in dictionary.items():
            # Use regex to match whole words only
            pattern = r'\b' + re.escape(key) + r'\b'
            text = re.sub(pattern, val, text, flags=re.IGNORECASE)
            
        return text

    def get_voice_params(self, voice_id: str, voice_name: str = "", gender: str = "male") -> dict:
        """
        Determines voice transformation parameters based on voice profiles or gender.
        """
        name_lower = voice_name.lower()
        
        # Helper to normalize for matching
        def normalize(s):
            import unicodedata
            s = s.lower().replace(" ", "_")
            # Remove accents
            s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
            return s.replace('đ', 'd')

        norm_name = normalize(voice_name)
        
        # 1. Direct key match (Highest priority)
        if voice_id in self.VOICE_PROFILES:
            return self.VOICE_PROFILES[voice_id]
            
        # 2. Check for specific famous profiles in name
        for key, profile in self.VOICE_PROFILES.items():
            if key in norm_name or key in voice_id.lower():
                return profile
        
        # 3. Fallback to gender-based defaults
        if gender.lower() == "female" or "female" in voice_id.lower():
            return self.VOICE_PROFILES["female_default"]
            
        return self.VOICE_PROFILES["male_default"]

    def generate(self, text: str, voice_id: str, output_id: str, speed: float = 1.0, gender: str = "male", voice_name: str = "", pitch_override: float = None, formant_override: float = None) -> Optional[str]:
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
        # 2. Apply Dictionary / Text Normalization
        text = self.normalize_text(text)
        
        # 3. Determine Speed (Profile Default vs Manual)
        voice_params = self.get_voice_params(voice_id, voice_name, gender)
        effective_speed = speed
        if speed == 1.0 and "default_speed" in voice_params:
            effective_speed = voice_params["default_speed"]
            
        length_scale = 1.0 / effective_speed
        
        try:
            # 4. Fetch voice metadata to apply correct parameters
            noise_scale = voice_params.get("noise_scale", 0.667)
            noise_w = voice_params.get("noise_w", 0.8)
            
            # Apply dynamic overrides ONLY if they are NOT 1.0 (to avoid overriding optimized profiles by accident)
            pitch_val = voice_params.get("pitch", 1.0)
            if pitch_override is not None and pitch_override != 1.0:
                pitch_val = pitch_override
                
            formant_val = voice_params.get("formant", 1.0)
            if formant_override is not None and formant_override != 1.0:
                formant_val = formant_override
            
            # Log for debugging (Versioned for restart verification)
            print(f"DEBUG V5.2 [DYNAMIC OVERRIDE]: id={voice_id}, pitch={pitch_val}, formant={formant_val}")
            
            # 5. Run Piper
            piper_cmd = [
                self.piper_path, 
                '--model', model_path, 
                '--config', config_path, 
                '--output_file', temp_output, 
                '--length_scale', str(length_scale),
                '--noise_scale', str(noise_scale),
                '--noise_w', str(noise_w)
            ]
            
            process = subprocess.Popen(
                piper_cmd,
                stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, encoding='utf-8'
            )
            process.communicate(input=text)
            
            if process.returncode != 0: return None
                
            # 3. Apply Voice Conversion
            # We apply conversion for ALL cloned voices or if is_fallback is true
            if pitch_val != 1.0 or voice_params["eq"]:
                # Safe logging without unicode issues
                eq_filter = voice_params.get("eq", "")
                
                # Hybrid Morphing Engine (Resampling + Time Stretching)
                # This provides a much sharper and cleaner pitch shift than FFT-based methods
                target_rate = int(44100 * pitch_val)
                
                filter_chain = (
                    f"aresample=44100,asetrate={target_rate},atempo={1/pitch_val},"
                    "firequalizer=gain='if(gt(f,10000), 4, 0)'," # Subtle shimmer only
                    "compand=0.3|0.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.1" 
                )
                
                if eq_filter:
                    clean_eq = eq_filter.replace("aresample=44100,", "").replace(",aresample=44100", "")
                    filter_chain += f",{clean_eq}"
                
                filter_chain += ",aresample=44100,loudnorm=I=-16:TP=-1.5:LRA=11"
                
                cmd = [
                    'ffmpeg', '-y', '-i', temp_output,
                    '-af', filter_chain,
                    final_output
                ]
                print(f"DEBUG: Running FFmpeg with filters: {filter_chain}")
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
