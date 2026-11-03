"""Renders the KAHAANI re-edit (or a section of it) from the original Sports Tak master.

Usage:
    python3 edit.py SOURCE.mp4 OUT.mp4 [--from 0] [--to 50]      # render a range (seconds)
    python3 edit.py SOURCE.mp4 OUTPREFIX --stills 13,18,30         # design-check stills (PNG)

The edit keeps the original programme timing and audio, so sponsor pre-rolls, L-bands and the
end card stay exactly where the sales team sold them; treatments only touch the picture.
"""
import argparse
import sys
import time

import numpy as np

import gfx
from edl import beats
from treatments import Ctx


def active(bs, t):
    return sorted([b for b in bs if b.start <= t < b.end], key=lambda b: b.layer)


def needs_segmenter(bs):
    return any(b.needs_mask for b in bs)


def render_frame(arr, t, idx, bs, ctx):
    ctx.new_frame(arr, idx)
    out = arr
    for b in active(bs, t):
        out = b.apply(out, t - b.start, ctx)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("out")
    ap.add_argument("--from", dest="t0", type=float, default=0.0)
    ap.add_argument("--to", dest="t1", type=float, default=None)
    ap.add_argument("--stills", default=None)
    a = ap.parse_args()

    bs = beats()
    seg = gfx.Segmenter() if needs_segmenter(bs) else None
    ctx = Ctx(seg)

    if a.stills:
        from PIL import Image
        for s in [float(x) for x in a.stills.split(",")]:
            # warm the matte's temporal filter with a few preceding frames
            t_start = max(0.0, s - 0.4)
            if seg:
                seg.reset()
            for i, arr in enumerate(gfx.Reader(a.source, t_start, s + 0.01)):
                t = t_start + i / gfx.FPS
                out = render_frame(arr, t, int(round(t * gfx.FPS)), bs, ctx)
            Image.fromarray(out).save(f"{a.out}_{s:07.2f}.png")
            print("still", s)
        return

    t1 = a.t1 if a.t1 is not None else gfx.probe_duration(a.source)
    w = gfx.Writer(a.out, a.source, a.t0, t1)
    t_wall = time.time()
    n = 0
    for i, arr in enumerate(gfx.Reader(a.source, a.t0, t1)):
        t = a.t0 + i / gfx.FPS
        w.write(render_frame(arr, t, int(round(t * gfx.FPS)), bs, ctx))
        n += 1
        if n % 250 == 0:
            el = time.time() - t_wall
            print(f"{t:7.1f}s  {n / el:4.1f} fps", file=sys.stderr, flush=True)
    w.close()
    print(f"done: {n} frames in {time.time() - t_wall:.0f}s")


if __name__ == "__main__":
    main()
