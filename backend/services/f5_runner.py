import sys
import os
import soundfile as sf
import traceback

def log(msg):
    with open("runner_log.txt", "a", encoding="utf-8") as f:
        f.write(msg + "\n")
    print(msg, flush=True)

def generate_clone(ref_audio, ref_text, gen_text, output_path):
    try:
        # Lazy load heavy AI modules to prevent FastAPI from hanging on startup
        # and to avoid CUDA/multiprocessing context conflicts on Windows
        log("Importing F5-TTS and PyTorch modules (lazy load)...")
        from importlib.resources import files
        from omegaconf import OmegaConf
        from hydra.utils import get_class
        from cached_path import cached_path
        import torch
        from f5_tts.infer.utils_infer import (
            load_model, load_vocoder, preprocess_ref_audio_text, infer_process
        )
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        log(f"Starting F5-TTS Generation on {device}")
        
        # Load vocoder
        log("Loading vocoder...")
        vocoder = load_vocoder(vocoder_name="vocos", is_local=False, device=device)
        
        # Load model
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
        
        log("Preprocessing audio (this may download Whisper if ref_text is empty)...")
        # Process
        ref_audio_proc, ref_text_proc = preprocess_ref_audio_text(ref_audio, ref_text)
        
        log("Inferring audio...")
        audio_segment, final_sample_rate, spectrogram = infer_process(
            ref_audio_proc, ref_text_proc, gen_text, ema_model, vocoder, mel_spec_type="vocos", device=device
        )
        
        if audio_segment is not None and len(audio_segment) > 0:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            sf.write(output_path, audio_segment, final_sample_rate)
            log(f"SUCCESS: Saved to {output_path}")
            return True
        else:
            log("FAILED: No audio generated")
            return False
            
    except Exception as e:
        import traceback
        log(f"FATAL EXCEPTION: {e}")
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--ref_audio", required=True)
    parser.add_argument("--ref_text", default="")
    parser.add_argument("--gen_text", required=True)
    parser.add_argument("--output_path", required=True)
    args = parser.parse_args()
    
    with open("runner_log.txt", "w", encoding="utf-8") as f:
        f.write("=== RUNNER STARTED ===\n")
    generate_clone(args.ref_audio, args.ref_text, args.gen_text, args.output_path)
