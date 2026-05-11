import os
import datetime

class SubtitleService:
    def __init__(self, outputs_dir: str = "outputs"):
        self.outputs_dir = outputs_dir
        os.makedirs(self.outputs_dir, exist_ok=True)

    def format_srt_time(self, seconds: float) -> str:
        """Convert seconds to SRT time format: HH:MM:SS,mmm"""
        td = datetime.timedelta(seconds=seconds)
        total_seconds = int(td.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        millis = int(td.microseconds / 1000)
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    def generate_srt(self, text: str, output_id: str, speed: float = 1.0) -> str:
        """
        Generate a real SRT file based on text length and speech speed.
        Heuristic: Average reading speed is ~150 words per minute (2.5 words/sec).
        """
        words = text.split()
        if not words:
            return ""

        # Adjust words per second based on speed parameter
        # Piper vais1000 is roughly 2.5 - 3.0 words per second at speed 1.0
        base_wps = 2.7 
        wps = base_wps * speed
        
        chunk_size = 8 # words per subtitle line
        chunks = [words[i:i + chunk_size] for i in range(0, len(words), chunk_size)]
        
        srt_content = ""
        current_time = 0.0
        
        for i, chunk in enumerate(chunks):
            chunk_text = " ".join(chunk)
            # Duration is based on word count
            duration = len(chunk) / wps
            # Minimum duration for readability
            duration = max(duration, 1.5) 
            
            start_time = current_time
            end_time = current_time + duration
            
            srt_content += f"{i + 1}\n"
            srt_content += f"{self.format_srt_time(start_time)} --> {self.format_srt_time(end_time)}\n"
            srt_content += f"{chunk_text}\n\n"
            
            current_time = end_time + 0.1 # slight gap between lines

        srt_filename = f"{output_id}.srt"
        srt_path = os.path.join(self.outputs_dir, srt_filename)
        
        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)
            
        return srt_path

subtitle_service = SubtitleService()
