"""Generates the Hindi narration clips (Microsoft neural voice hi-IN-SwaraNeural) into assets/voice/.

    python3 voice.py            # only missing clips
    python3 voice.py --force    # regenerate everything

Needs network access to speech.platform.bing.com and `pip install edge-tts`.
The generated mp3s are committed, so rendering does not need the network.
"""
import asyncio
import os
import sys

import edge_tts

from script import clips

HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = "hi-IN-SwaraNeural"
RATE = "-5%"  # medium-slow, unhurried devotional pace


async def main(force):
    os.makedirs(os.path.join(HERE, "assets", "voice"), exist_ok=True)
    for key, text in clips().items():
        path = os.path.join(HERE, "assets", "voice", key + ".mp3")
        if os.path.exists(path) and not force:
            continue
        print(key, text)
        com = edge_tts.Communicate(text, VOICE, rate=RATE, proxy=os.environ.get("HTTPS_PROXY"))
        await com.save(path)


if __name__ == "__main__":
    asyncio.run(main("--force" in sys.argv))
