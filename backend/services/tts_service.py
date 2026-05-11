import os
import subprocess
from typing import Optional

class TTSService:
    def __init__(self, models_dir: str = "models", outputs_dir: str = "outputs"):
        self.models_dir = models_dir
        self.outputs_dir = outputs_dir
        # Piper binary path for Windows
        self.piper_path = os.path.join(os.getcwd(), "piper", "piper", "piper.exe")
        
        os.makedirs(self.outputs_dir, exist_ok=True)
        os.makedirs(self.models_dir, exist_ok=True)

    def generate(self, text: str, voice_id: str, output_id: str, speed: float = 1.0) -> Optional[str]:
        """
        Generate audio using real Piper TTS.
        Supports fallback for cloned voices.
        """
        model_path = os.path.join(self.models_dir, f"{voice_id}.onnx")
        
        # Fallback logic for cloned voices or missing models
        if not os.path.exists(model_path):
            print(f"Requested model not found: {model_path}. Searching for fallback...")
            # Try to find any available Vietnamese model
            available_models = [f for f in os.listdir(self.models_dir) if f.endswith(".onnx")]
            if available_models:
                # Prioritize vais1000 if available
                if "vi_VN-vais1000-medium.onnx" in available_models:
                    model_path = os.path.join(self.models_dir, "vi_VN-vais1000-medium.onnx")
                else:
                    model_path = os.path.join(self.models_dir, available_models[0])
                print(f"Using fallback model: {model_path}")
            else:
                print("No models available at all.")
                return None

        config_path = model_path + ".json"
        
        if not os.path.exists(self.piper_path):
            print(f"Piper binary not found: {self.piper_path}")
            executable = "piper"
        else:
            executable = self.piper_path

        output_filename = f"{output_id}.wav"
        output_path = os.path.join(self.outputs_dir, output_filename)
        
        length_scale = 1.0 / speed
        
        try:
            process = subprocess.Popen(
                [executable, '--model', model_path, '--config', config_path, '--output_file', output_path, '--length_scale', str(length_scale)],
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
                
            return output_path
        except Exception as e:
            print(f"TTS Error: {e}")
            return None

tts_service = TTSService()
