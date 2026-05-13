import sys
import os
import soundfile as sf
import traceback
import subprocess
from services.linguistic_processor import VietnameseProcessor

# CRITICAL: Restore original stdout/stderr to bypass wandb console capture bugs
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__

# Disable wandb entirely
os.environ["WANDB_MODE"] = "disabled"
os.environ["WANDB_SILENT"] = "true"
os.environ["WANDB_CONSOLE"] = "off"

def log(msg):
    try:
        log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "runner_log.txt")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(msg + "\n")
        # Use sys.stdout.write with a newline and flush to be more robust than print()
        sys.stdout.write(msg + "\n")
        sys.stdout.flush()
    except:
        pass # Never let logging crash the process

def generate_clone(ref_audio, ref_text, gen_text, output_path):
    try:
        # Lazy load heavy AI modules to prevent FastAPI from hanging on startup
        # and to avoid CUDA/multiprocessing context conflicts on Windows
        log("PROGRESS:LOADING_LIBS")
        log("Importing F5-TTS and PyTorch modules (lazy load)...")
        from importlib.resources import files
        from omegaconf import OmegaConf
        from hydra.utils import get_class
        from cached_path import cached_path
        import torch
        import soundfile as sf
        import torchaudio
        
        # MONKEY-PATCH: Force torchaudio to use soundfile backend because torchcodec is broken on Windows
        def patched_load(filepath, **kwargs):
            import numpy as np
            data, samplerate = sf.read(filepath)
            # Ensure mono
            if len(data.shape) > 1:
                data = np.mean(data, axis=1)
            
            tensor = torch.from_numpy(data).float()
            # F5-TTS expects [1, samples]
            tensor = tensor.unsqueeze(0)
            return tensor, samplerate
        
        torchaudio.load = patched_load
        
        from f5_tts.infer.utils_infer import (
            load_model, load_vocoder, preprocess_ref_audio_text, infer_process
        )
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        log(f"Starting F5-TTS Generation on {device}")
        
        # Load vocoder
        log("PROGRESS:LOADING_VOCODER")
        log("Loading vocoder...")
        vocoder = load_vocoder(vocoder_name="vocos", is_local=False, device=device)
        
        # Load model
        log("PROGRESS:LOADING_MODEL")
        log("Loading model...")
        model_cfg = OmegaConf.load(str(files("f5_tts").joinpath("configs/F5TTS_v1_Base.yaml")))
        model_cls = get_class(f"f5_tts.model.{model_cfg.model.backbone}")
        
        ckpt_file = str(cached_path("hf://SWivid/F5-TTS/F5TTS_v1_Base/model_1250000.safetensors"))
        vocab_file = str(cached_path("hf://SWivid/F5-TTS/F5TTS_v1_Base/vocab.txt"))
        
        log(f"Vocab file: {vocab_file}")
        log(f"Ckpt file: {ckpt_file}")
        
        ema_model = load_model(
            model_cls, model_cfg.model.arch, ckpt_file, mel_spec_type="vocos", vocab_file=vocab_file, device=device
        )
        
        log("PROGRESS:PREPROCESSING")
        log("Preprocessing audio (this may download Whisper if ref_text is empty)...")
        # Normalize text for better prosody
        gen_text = VietnameseProcessor.normalize(gen_text)
        log(f"Normalized Target Text: {gen_text}")
        
        # Process
        ref_audio_proc, ref_text_proc = preprocess_ref_audio_text(ref_audio, ref_text)
        
        log("PROGRESS:INFERRING")
        log("Inferring audio (50 steps for better quality)...")
        audio_segment, final_sample_rate, spectrogram = infer_process(
            ref_audio_proc, ref_text_proc, gen_text, ema_model, vocoder, 
            mel_spec_type="vocos", 
            device=device,
            nfe_step=32, # Standard steps for F5-TTS
            cfg_strength=2.0,
            sway_sampling_coef=-1.0
        )
        
        if audio_segment is not None and len(audio_segment) > 0:
            # Normalize to avoid clipping
            import numpy as np
            max_val = np.abs(audio_segment).max()
            if max_val > 1.0:
                audio_segment = audio_segment / max_val
            audio_segment = audio_segment * 0.95
            
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            sf.write(output_path, audio_segment, final_sample_rate)
            log("PROGRESS:SAVING")
            # --- STUDIO POLISH POST-PROCESSING ---
            log("Applying Studio Polish (EQ + Compression + Limiting)...")
            polish_output = output_path.replace(".wav", "_polished.wav")
            
            # Filter chain: 
            # 1. highpass: remove low-end mud
            # 2. equalizer: boost presence (3kHz) and shimmer (8kHz)
            # 3. compand: tighten the vocal dynamics
            # 4. loudnorm: normalize to broadcast standards (-16 LUFS)
            filters = (
                "highpass=f=80,"
                "equalizer=f=3000:width_type=h:w=1000:g=2,"
                "equalizer=f=8000:width_type=h:w=2000:g=3,"
                "compand=0.3|0.3:1|1:-90/-60|-60/-40|-40/-30|-20/-20:6:0:-90:0.1,"
                "loudnorm=I=-16:TP=-1.5:LRA=11"
            )
            
            cmd = ['ffmpeg', '-y', '-i', output_path, '-af', filters, polish_output]
            subprocess.run(cmd, capture_output=True)
            
            if os.path.exists(polish_output):
                os.remove(output_path)
                os.rename(polish_output, output_path)
                log("Audio Mastering Complete.")

            log(f"SUCCESS: Saved to {output_path}")
            return True
        else:
            log("FAILED: No audio generated")
            return False
            
    except Exception as e:
        import traceback
        error_msg = traceback.format_exc()
        log(f"FATAL EXCEPTION:\n{error_msg}")
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--ref_audio", required=True)
    parser.add_argument("--ref_text", default="")
    parser.add_argument("--gen_text", required=True)
    parser.add_argument("--output_path", required=True)
    args = parser.parse_args()
    
    # Ensure output_path is absolute to avoid Errno 22 on some Windows environments
    args.output_path = os.path.abspath(args.output_path)
    
    log_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "runner_log.txt")
    with open(log_path, "w", encoding="utf-8") as f:
        f.write("=== RUNNER STARTED ===\n")
    generate_clone(args.ref_audio, args.ref_text, args.gen_text, args.output_path)
