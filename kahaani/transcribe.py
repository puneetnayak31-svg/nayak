import sys, json, time
from faster_whisper import WhisperModel
wav, out = sys.argv[1], sys.argv[2]
m = WhisperModel("mobiuslabsgmbh/faster-whisper-large-v3-turbo", device="cpu", compute_type="int8", cpu_threads=4)
import wave, numpy as np
w=wave.open(wav); a=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(np.float32)/32768
segs, info = m.transcribe(a, language='hi', chunk_length=10, condition_on_previous_text=False, beam_size=5, vad_filter=True, word_timestamps=True)
print("lang", info.language, info.language_probability, flush=True)
res=[]
with open(out+".txt","w") as f:
    for s in segs:
        res.append({"start":s.start,"end":s.end,"text":s.text,"words":[{"s":w.start,"e":w.end,"w":w.word} for w in (s.words or [])]})
        line=f"[{s.start:7.2f}-{s.end:7.2f}] {s.text.strip()}"
        print(line, flush=True); f.write(line+"\n"); f.flush()
json.dump(res, open(out+".json","w"), ensure_ascii=False)
print("DONE", flush=True)
