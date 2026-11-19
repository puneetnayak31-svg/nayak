"""Assemble the 3C Chairman's Award video (~67s, 1920x1080, 25fps) with burned-in subtitles."""
import os, subprocess
from PIL import Image, ImageDraw, ImageFont

D = os.path.dirname(os.path.abspath(__file__))
SRC, IMG = f"{D}/src", "/tmp/claude-0/-home-user-nayak/d6d28f91-459d-5676-ab39-f1a1d6378662/images"
V2DIR = "/tmp/claude-0/-home-user-nayak/d6d28f91-459d-5676-ab39-f1a1d6378662/scratchpad/v2"
OUT = f"{D}/3C_Chairmans_Award_Video.mp4"
FONTS = os.path.expanduser("~/.fonts")
ANTON, POP_B, POP_R = f"{FONTS}/Anton-Regular.ttf", f"{FONTS}/Poppins-SemiBold.ttf", f"{FONTS}/Poppins-Regular.ttf"
RED, INK, WHITE = (211, 51, 43), (17, 17, 17), (255, 255, 255)
W, H = 1920, 1080

# ---------------- timeline (seconds) ----------------
K_END = 39.05                      # Kalli clip 0 -> 39.05
B1, B2, B3 = 16.64, 24.96, 30.76   # b-roll windows inside Kalli's audio
V3_IN, V3_OUT = 0.40, 14.60        # testimonial, trimmed of screen-recording jerks
T_V3 = K_END
T_MORPH = T_V3 + (V3_OUT - V3_IN)  # 53.25
MORPH_LEN = 9.6
T_END = T_MORPH + MORPH_LEN        # 62.85
END_LEN = 4.6
TOTAL = T_END + END_LEN


def tag_img(text, size, pad=(34, 14), skew=0.22, rot=-3):
    """Slanted red tag (parallelogram) with white Anton text, like the 3C logo."""
    f = ImageFont.truetype(ANTON, size)
    tw, th = f.getbbox(text)[2], f.getbbox(text)[3]
    w, h = tw + 2 * pad[0], int(size * 1.0) + 2 * pad[1]
    off = int(h * skew)
    im = Image.new("RGBA", (w + off, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    d.polygon([(off, 0), (w + off, 0), (w, h), (0, h)], fill=RED)
    d.text((pad[0] + off // 2, pad[1] - int(size * 0.12)), text, font=f, fill=WHITE)
    return im.rotate(-rot, expand=True, resample=Image.BICUBIC)


def canvas():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def save(im, name):
    p = f"{D}/ov_{name}.png"; im.save(p); return p


# ---- overlay 1: Kalli lower third ----
c = canvas(); d = ImageDraw.Draw(c)
t = tag_img("KALLI PURIE", 52); c.alpha_composite(t, (90, 700))
box_y = 700 + t.height + 6
f1, f2 = ImageFont.truetype(POP_B, 30), ImageFont.truetype(POP_R, 24)
l1, l2 = "Vice Chairperson, India Today Group", "World Economic Forum Annual Meeting"
bw = max(f1.getbbox(l1)[2], f2.getbbox(l2)[2]) + 50
d.rectangle([100, box_y, 100 + bw, box_y + 96], fill=(17, 17, 17, 225))
d.text((125, box_y + 10), l1, font=f1, fill=WHITE); d.text((125, box_y + 52), l2, font=f2, fill=(205, 205, 205))
OV_KALLI = save(c, "kalli")

# ---- overlay 2: the "whole unit" tag ----
c = canvas(); c.alpha_composite(tag_img("THE WHOLE UNIT: TWO PEOPLE.", 46), (90, 90))
OV_UNIT = save(c, "unit")

# ---- overlay 3: testimonial lower third ----
c = canvas(); c.alpha_composite(tag_img("3C PARTICIPANT", 40), (90, 760))
OV_PART = save(c, "participant")

# ---- overlay 4: small 3C watermark (white-lettered logo) ----
c = canvas(); lg = Image.open(f"{V2DIR}/logo_white.png").convert("RGBA")
lg = lg.resize((230, int(230 * lg.height / lg.width)), Image.LANCZOS)
c.alpha_composite(lg, (W - 230 - 60, 50)); OV_WM = save(c, "wm")

# ---- end card on the 3C paper background ----
subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", "8.55", "-i", f"{SRC}/v2.mp4", "-frames:v", "1",
                "-vf", f"scale={W}:{H}", f"{D}/paper.png"], check=True)
c = Image.open(f"{D}/paper.png").convert("RGBA")
lg = Image.open(f"{V2DIR}/logo.png").convert("RGBA"); lw = 700
lg = lg.resize((lw, int(lw * lg.height / lg.width)), Image.LANCZOS)
c.alpha_composite(lg, ((W - lw) // 2, 150))
t = tag_img("THE WHOLE UNIT", 60); c.alpha_composite(t, ((W - t.width) // 2, 560))
d = ImageDraw.Draw(c)
for txt, f, col, y in [("Poulomi Saha   ·   Puneet Nayak", ImageFont.truetype(POP_B, 54), INK, 700),
                       ("Vice-Chairperson's Office, India Today Group", ImageFont.truetype(POP_R, 32), (80, 80, 80), 790),
                       ("with the support of teams across ITG", ImageFont.truetype(POP_R, 32), (80, 80, 80), 840)]:
    d.text(((W - f.getbbox(txt)[2]) // 2, y), txt, font=f, fill=col)
END_PNG = f"{D}/endcard.png"; c.convert("RGB").save(END_PNG)

# ---------------- subtitles (ASS) ----------------
kalli = [(0.00, 2.16, "So one of the things that we are working on,"),
         (2.48, 6.94, "and I think that it's nascent and it has had a good impact,"),
         (7.74, 13.06, "is to go back to creating Candid Constructive Conversations."),
         (13.42, 16.46, "We've actually set up a whole unit just to do that — Triple C,"),
         (16.64, 21.42, "where you get people from different communities who don't agree with each other"),
         (21.42, 24.76, "to talk to each other, and take out the experts,"),
         (24.96, 27.60, "the journalists, the politicians out of that conversation,"),
         (27.60, 30.76, "and then let them sort things out themselves"),
         (30.76, 34.08, "and come to at least see each other's point of view —"),
         (34.28, 37.10, "not maybe resolve something, but see each other's point of view,"),
         (37.10, 39.00, "as a way to build a little bit more trust.")]
part = [(0.54, 3.80, "I think all of us started in very opposite directions."),
        (4.08, 7.14, "We started with different views, but in the end we got to one point,"),
        (7.14, 9.98, "and that is the beauty of India — a multicultural society."),
        (10.16, 12.08, "It was very nice, very democratic."),
        (12.36, 14.10, "Very democratic — you allowed different ideas.")]
subs = kalli + [(T_V3 + s - V3_IN, T_V3 + e - V3_IN, x) for s, e, x in part]


def ts(t):
    h, m = int(t // 3600), int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {W}
PlayResY: {H}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Poppins SemiBold,46,&H00FFFFFF,&H00FFFFFF,&H00111111,&H96000000,0,0,0,0,100,100,0,0,3,14,0,2,260,260,48,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
for s, e, x in subs:
    ass += f"Dialogue: 0,{ts(s)},{ts(min(e + 0.15, K_END - 0.05) if s < K_END else e + 0.15)},Sub,,0,0,0,,{x}\n"
open(f"{D}/subs.ass", "w").write(ass)

# ---------------- ffmpeg graph ----------------
NORM = f"scale={W}:{H}:force_original_aspect_ratio=increase:flags=lanczos,crop={W}:{H},fps=25,setsar=1,format=yuv420p"
inputs = ["-i", f"{SRC}/v1.mp4", "-i", f"{SRC}/v2.mp4", "-i", f"{SRC}/v3.mp4",
          "-loop", "1", "-t", "6", "-i", f"{IMG}/5_c.jpg",
          "-loop", "1", "-t", "6", "-i", f"{IMG}/9_c.jpg",
          "-loop", "1", "-t", f"{END_LEN}", "-i", END_PNG]
for p in (OV_KALLI, OV_UNIT, OV_PART, OV_WM):
    inputs += ["-loop", "1", "-t", f"{TOTAL}", "-i", p]


def pan(idx, dur, label):
    # scale to 1080 tall, slow horizontal pan across the extra width
    return (f"[{idx}:v]scale=-2:{H}:flags=lanczos,fps=25,trim=duration={dur},setpts=PTS-STARTPTS,"
            f"crop={W}:{H}:x='(iw-{W})*t/{dur}':y=0,setsar=1,format=yuv420p[{label}]")


fc = [
    f"[0:v]trim=0:{B1},setpts=PTS-STARTPTS,{NORM}[ka]",
    pan(3, (B2 - B1) / 2, "st5"),
    pan(4, (B2 - B1) / 2, "st9"),
    f"[0:v]trim={B2}:{B3},setpts=PTS-STARTPTS,{NORM}[kb]",
    f"[1:v]trim=12.30:{12.30 + K_END - B3},setpts=PTS-STARTPTS,{NORM}[eps]",
    "[ka][st5][st9][kb][eps]concat=n=5:v=1:a=0[kvid]",
    f"[0:a]atrim=0:{K_END},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,"
    f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.3[kaud]",
    f"[2:v]trim={V3_IN}:{V3_OUT},setpts=PTS-STARTPTS,crop=1340:754:40:0,{NORM}[v3v]",
    f"[2:a]atrim={V3_IN}:{V3_OUT},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,"
    f"loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=in:d=0.08,afade=t=out:st={V3_OUT - V3_IN - 0.25}:d=0.25[v3a]",
    f"[1:v]trim=0:{MORPH_LEN},setpts=PTS-STARTPTS,{NORM}[mv]",
    f"[5:v]fps=25,{NORM},fade=t=in:st=0:d=0.5,fade=t=out:st={END_LEN - 0.8}:d=0.8[endv]",
    f"[1:a]atrim=0:{MORPH_LEN + END_LEN},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,"
    f"loudnorm=I=-18:TP=-1.5:LRA=11,afade=t=out:st={MORPH_LEN + END_LEN - 1.6}:d=1.6[ma]",
    "[kvid][kaud][v3v][v3a]concat=n=2:v=1:a=1[pv][pa]",
    "[mv][endv]concat=n=2:v=1:a=0[mv2]",
    "[pv][pa][mv2][ma]concat=n=2:v=1:a=1[cv][ca]",
    "[cv]fade=t=in:st=0:d=0.4[c0]",
    f"[c0][6:v]overlay=0:0:enable='between(t,0.6,6.2)'[c1]",
    f"[c1][7:v]overlay=0:0:enable='between(t,13.9,17.6)'[c2]",
    f"[c2][8:v]overlay=0:0:enable='between(t,{T_V3 + 0.3},{T_V3 + 4.5})'[c3]",
    f"[c3][9:v]overlay=0:0:enable='between(t,0,{B3})+between(t,{T_V3},{T_MORPH})'[c4]",
    f"[c4]ass={D}/subs.ass[outv]",
]
cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", "[outv]", "-map", "[ca]",
       "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", "25",
       "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-t", f"{TOTAL}", OUT]
subprocess.run(cmd, check=True)
print("wrote", OUT, "expected", round(TOTAL, 2), "s")
