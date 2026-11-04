"""Renders a version of the 1985 segment (21:27–23:44 of the episode master).

    python3 render.py a|b SOURCE.mp4 OUT.mp4 [--stills 1290,1330]

A cutaway is a full-frame visual that opens out of the studio's LED screen and folds back into it.
Overlays (lower thirds, pull quotes) sit on the studio picture. Archive photo inserts that the master
already cuts to are re-finished in place (hard cuts, as in the master).
"""
import argparse
import os
import subprocess
import sys
import time

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C  # noqa: E402

T0, T1 = 1286.5, 1424.5
OPEN, CLOSE = 0.95, 0.95       # portal durations (s)


class Cutaway:
    def __init__(self, t0, t1, fn, open_portal=True, close_portal=True):
        self.t0, self.t1, self.fn = t0, t1, fn
        self.op, self.cl = open_portal, close_portal

    def frame(self, t, src, i):
        vis = self.fn(t, src, i)
        k = 1.0
        if self.op and t < self.t0 + OPEN:
            k = C.prog(t, self.t0, self.t0 + OPEN)
        if self.cl and t > self.t1 - CLOSE:
            k = min(k, 1 - C.prog(t, self.t1 - CLOSE, self.t1))
        if k >= 1:
            return vis
        return C.portal(src, vis, k)


class Overlay:
    def __init__(self, t0, t1, fn):
        self.t0, self.t1, self.fn = t0, t1, fn


def build(version):
    if version == "a":
        import version_a as V
    else:
        import version_b as V
    return V.cutaways(Cutaway), V.overlays(Overlay)


def render_frame(src, t, i, cuts, ovs):
    out = src
    for c in cuts:
        if c.t0 <= t < c.t1:
            out = C.apply_bug(c.frame(t, src, i))
            break
    for o in ovs:
        if o.t0 <= t < o.t1:
            out = o.fn(out, t - o.t0, o.t1 - o.t0, i)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("version", choices=["a", "b"])
    ap.add_argument("source")
    ap.add_argument("out")
    ap.add_argument("--stills")
    ap.add_argument("--bed")
    a = ap.parse_args()
    cuts, ovs = build(a.version)
    if a.stills:
        from PIL import Image
        for s in [float(x) for x in a.stills.split(",")]:
            fr = next(iter(C.Reader(a.source, s, s + 0.1)))
            out = render_frame(fr, s, int(s * C.FPS), cuts, ovs)
            Image.fromarray(out).save(f"{a.out}_{s:07.2f}.png")
            print("still", s, flush=True)
        return
    tmp = a.out + ".v.mp4"
    w = C.Writer(tmp)
    t_wall = time.time()
    for i, fr in enumerate(C.Reader(a.source, T0, T1)):
        t = T0 + i / C.FPS
        w.write(render_frame(fr, t, i, cuts, ovs))
        if i % 240 == 0:
            print(f"{t:.1f}  {i / max(1e-6, time.time() - t_wall):.1f} fps", flush=True)
    w.close()
    C.mux(tmp, a.source, T0, T1, a.out, bed=a.bed, bed_gain=0.25)   # bed ≈ 22 dB under the voice
    os.remove(tmp)
    print("done", a.out)


if __name__ == "__main__":
    main()
