import sys
import os
import wave
import numpy as np

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from faster_whisper import WhisperModel
from server.audio.preprocessing import resample_audio

def run():
    wf = wave.open(os.path.join(PROJECT_ROOT, "test_hindi_aap_kaise_hain.wav"), 'rb')
    raw = wf.readframes(wf.getnframes())
    arr = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
    arr16 = resample_audio(arr, wf.getframerate(), 16000)
    
    model = WhisperModel("base", device="cpu", compute_type="int8")
    
    prompts = [
        "नमस्ते",
        "नमस्ते।",
        "नमस्ते, आप कैसे हैं?",
        "यह हिन्दी में है।"
    ]
    
    print("Total Hindi duration:", len(arr16)/16000)
    for p in prompts:
        print(f"\n--- Testing Prompt: '{p}' ---")
        for dur in [0.5, 0.8, 1.2, 1.6, 2.0, 2.5]:
            slice_samples = int(dur * 16000)
            segs, _ = model.transcribe(
                arr16[:slice_samples],
                language="hi",
                task="transcribe",
                initial_prompt=p,
                condition_on_previous_text=False,
                temperature=0.0,
                beam_size=1,
                repetition_penalty=1.2,
                vad_filter=False
            )
            texts = [s.text.strip() for s in segs if s.text.strip()]
            print(f"  {dur:3.1f}s interim (beam=1): {texts}")
        
        fin_segs, _ = model.transcribe(
            arr16,
            language="hi",
            task="transcribe",
            initial_prompt=p,
            condition_on_previous_text=False,
            temperature=0.0,
            beam_size=5,
            repetition_penalty=1.2,
            vad_filter=False
        )
        fin_texts = [s.text.strip() for s in fin_segs if s.text.strip()]
        print(f"  Final (beam=5): {fin_texts}")

if __name__ == "__main__":
    run()
