import os
import re
import subprocess
from services.tts_service import tts_service

class DubbingService:
    def __init__(self, outputs_dir: str = "outputs", temp_dir: str = "temp_dub"):
        self.outputs_dir = outputs_dir
        self.temp_dir = temp_dir
        os.makedirs(self.outputs_dir, exist_ok=True)
        os.makedirs(self.temp_dir, exist_ok=True)

    def parse_srt(self, srt_content: str):
        """Simple SRT parser to extract text and timestamps"""
        segments = []
        # Split by empty lines
        entries = re.split(r'\n\s*\n', srt_content.strip())
        
        for entry in entries:
            lines = entry.split('\n')
            if len(lines) >= 3:
                # Line 0: Index, Line 1: Time, Line 2+: Text
                time_line = lines[1]
                text = " ".join(lines[2:])
                
                # Match times like 00:00:00,000 --> 00:00:05,000
                match = re.match(r'(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)', time_line)
                if match:
                    segments.append({
                        'start': match.group(1),
                        'end': match.group(2),
                        'text': text
                    })
        return segments

    def process_srt(self, srt_content: str, voice_id: str, task_id: str, speed: float = 1.0) -> str:
        """
        Processes SRT: Generates audio for each line and merges them.
        """
        segments = self.parse_srt(srt_content)
        if not segments:
            print("No segments found in SRT")
            return ""

        task_temp_dir = os.path.join(self.temp_dir, task_id)
        os.makedirs(task_temp_dir, exist_ok=True)
        
        segment_files = []
        
        for i, seg in enumerate(segments):
            seg_id = f"{task_id}_seg_{i}"
            # Generate individual segment
            audio_path = tts_service.generate(seg['text'], voice_id, seg_id, speed)
            if audio_path:
                segment_files.append(audio_path)

        if not segment_files:
            return ""

        # Create a list file for FFmpeg concat
        list_file_path = os.path.join(task_temp_dir, "list.txt")
        with open(list_file_path, "w", encoding="utf-8") as f:
            for fpath in segment_files:
                # FFmpeg concat requires absolute paths or paths relative to the list file
                # Use absolute path to be safe
                abs_path = os.path.abspath(fpath).replace("\\", "/")
                f.write(f"file '{abs_path}'\n")

        output_filename = f"{task_id}.wav"
        output_path = os.path.join(self.outputs_dir, output_filename)
        
        # Use FFmpeg to concatenate
        # -f concat: use concat demuxer
        # -safe 0: allow absolute paths
        try:
            subprocess.run([
                'ffmpeg', '-y', '-f', 'concat', '-safe', '0', 
                '-i', list_file_path, '-c', 'copy', output_path
            ], check=True, capture_output=True)
            
            # Cleanup temp segment files (optional, but good for disk space)
            # for fpath in segment_files:
            #    try: os.remove(fpath)
            #    except: pass
                
            return output_path
        except Exception as e:
            print(f"FFmpeg Error: {e}")
            return ""

dubbing_service = DubbingService()
