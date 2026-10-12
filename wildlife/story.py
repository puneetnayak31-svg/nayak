"""The jackal reel: voiceover lines, captions and scene plan (Hindi and English).

Each scene owns a run of voiceover lines. vo.py speaks every line, lays them end to end
with short pauses and writes the timings that render.py and music.py follow, so the
captions and the scene cuts always land on the voice.

Line format: (spoken text, caption text). In captions, *word* is drawn in Signal Lime.
The spoken text is what the TTS reads; it drops dashes and ellipses that some voices
read out loud.
"""

SLUG = "jackal"
TRACK_ID = "EIW-014"

# Photos (assets/photos), all shot near Sarapduli Forest Rest House, Dhikala Zone, Corbett.
#   jackal-01: lying down, looking right       jackal-02: side profile, facing left
#   jackal-03: close, staring into the lens     jackal-04: wide, camouflaged, staring at us
PHOTOS = ["jackal-01", "jackal-02", "jackal-03", "jackal-04"]

# Scene order; each name is drawn by render.s_<name>.
SCENES = ["hook", "lock", "location", "stare", "howl", "hunter", "cleaner", "loyal", "salute", "cta"]

VOICES = {
    "hi": dict(voice="hm_omega", lang="hi", speed=1.15),
    "en": dict(voice="bm_george", lang="en-gb", speed=1.05),
}

# HOWL_GAP leaves the synthesised howl alone in the mix after "a long cry echoes".
HOWL_GAP = 1.9

# Lines per scene. A third element overrides the pause after that line (seconds).
LINES = {
    "hi": {
        "hook": [
            ("ध्यान से देखिए.", "ध्यान से देखिए…"),
            ("इन झाड़ियों में कोई छिपा बैठा है.", "इन झाड़ियों में कोई *छिपा* बैठा है"),
        ],
        "lock": [
            ("कोई इसे सियार कहता है, कोई गीदड़.", "कोई इसे *सियार* कहता है, कोई *गीदड़*"),
            ("और अंग्रेज़ी में, गोल्डन जैकल.", "और अंग्रेज़ी में — *गोल्डन जैकल*"),
        ],
        "location": [
            ("ये तस्वीरें कॉर्बेट के ढिकाला ज़ोन से हैं,", "ये तस्वीरें कॉर्बेट के *ढिकाला ज़ोन* से हैं"),
            ("सरपदुली फ़ॉरेस्ट रेस्ट हाउस के पास.", "सरपदुली फ़ॉरेस्ट रेस्ट हाउस के पास"),
        ],
        "stare": [
            ("झाड़ियों में छिपकर, ये हमें एकटक देख रहा था.", "झाड़ियों में छिपकर, ये हमें *एकटक* देख रहा था"),
        ],
        "howl": [
            ("जब दिन और रात मिलते हैं,", "जब *दिन* और *रात* मिलते हैं"),
            ("तो जंगल में एक लंबी चीख गूँजती है.", "तो जंगल में एक लंबी *चीख* गूँजती है", HOWL_GAP),
            ("ये आवाज़ इसी की होती है.", "ये आवाज़ *इसी* की होती है"),
        ],
        "hunter": [
            ("टाइगर जैसी इज़्ज़त, इसे कभी नहीं मिली.", "टाइगर जैसी इज़्ज़त इसे कभी नहीं मिली"),
            ("पर सच ये है, कि ये एक कुशल शिकारी है.", "पर सच ये है — ये एक *कुशल शिकारी* है"),
            ("चूहे, पक्षी, फल, और झुंड में हो, तो चीतल का बच्चा भी.",
             "चूहे, पक्षी, फल… और झुंड में हो, तो *चीतल* का बच्चा भी"),
        ],
        "cleaner": [
            ("अक्सर ये टाइगर का पीछा करते हैं,", "अक्सर ये *टाइगर* का पीछा करते हैं"),
            ("उसके छोड़े शिकार में से अपना हिस्सा लेने.", "उसके छोड़े शिकार में से अपना *हिस्सा* लेने"),
            ("बचा कुचा साफ़ करने वाले, जंगल के असली सफ़ाईकर्मी.", "बचा-कुचा साफ़ करने वाले — जंगल के असली *सफ़ाईकर्मी*"),
        ],
        "loyal": [
            ("और वफ़ादारी में, कोई जवाब नहीं.", "और *वफ़ादारी* में कोई जवाब नहीं"),
            ("जोड़ा अक्सर उम्र भर साथ रहता है,", "जोड़ा अक्सर *उम्र भर* साथ रहता है"),
            ("और पिछले साल के बच्चे, नए बच्चों को पालने में मदद करते हैं.",
             "और पिछले साल के बच्चे, नए बच्चों को *पालने* में मदद करते हैं"),
        ],
        "salute": [
            ("जंगल के इस वफ़ादार सफ़ाईकर्मी को, हमारा सलाम.", "जंगल के इस वफ़ादार सफ़ाईकर्मी को — हमारा *सलाम*"),
        ],
        "cta": [
            ("ऐसी और कहानियों के लिए, सब्सक्राइब और फ़ॉलो करें,", "ऐसी और कहानियों के लिए — *सब्सक्राइब* और *फ़ॉलो* करें"),
            ("एक्सप्लोर इंडियन वाइल्डलाइफ़.", "*एक्सप्लोर इंडियन वाइल्डलाइफ़*"),
        ],
    },
    "en": {
        "hook": [
            ("Look closely.", "Look closely…"),
            ("Someone is hiding in these bushes.", "Someone is *hiding* in these bushes"),
        ],
        "lock": [
            ("Some call him see-yaar. Some call him gee-dud.", "Some call him *siyaar*, some call him *geedad*"),
            ("Meet the golden jackal.", "Meet the *golden jackal*"),
        ],
        "location": [
            ("We found him in the Dhikala zone of Corbett,", "We found him in Corbett's *Dhikala Zone*"),
            ("near the Sarapduli forest rest house.", "near Sarapduli Forest Rest House"),
        ],
        "stare": [
            ("Perfectly camouflaged, he never took his eyes off us.", "Perfectly camouflaged, he never took his *eyes* off us"),
        ],
        "howl": [
            ("When day meets night,", "When *day* meets *night*"),
            ("a long, eerie cry rises from the forest.", "a long, eerie *cry* rises from the forest", HOWL_GAP),
            ("That's the jackal calling.", "That's the *jackal* calling"),
        ],
        "hunter": [
            ("Never as respected as the tiger,", "Never as respected as the tiger"),
            ("but he's a skilled hunter.", "but he's a *skilled hunter*"),
            ("Rodents, birds, fruit, and in a pack, even a chital fawn.",
             "Rodents, birds, fruit… and in a pack, even a *chital* fawn"),
        ],
        "cleaner": [
            ("Jackals often trail the tiger,", "Jackals often trail the *tiger*"),
            ("waiting for a share of its kill.", "waiting for a *share* of its kill"),
            ("Clearing what's left behind, they're the forest's clean-up crew.", "Clearing what's left — the forest's *clean-up crew*"),
        ],
        "loyal": [
            ("And when it comes to loyalty, few come close.", "And when it comes to *loyalty*, few come close"),
            ("A pair often stays together for life,", "A pair often stays together *for life*"),
            ("and last year's pups help raise the new litter.", "and last year's pups help *raise* the new litter"),
        ],
        "salute": [
            ("To the forest's most loyal cleaner, our salute.", "To the forest's most loyal cleaner — our *salute*"),
        ],
        "cta": [
            ("For more stories from the wild, subscribe and follow.", "For more stories from the wild — *subscribe* & *follow*"),
            ("Explore Indian Wildlife.", "*Explore Indian Wildlife*"),
        ],
    },
}

# On-screen display type (Space Grotesk / Mukta). Kept short; captions carry the story.
TEXT = {
    "hi": {
        "hook": ["क्या आपको", "*दिखा?*"],
        "scan": "SCANNING",
        "species_local": "सियार · गीदड़",
        "hunter": ["*कुशल*", "शिकारी"],
        "diet": ["चूहे", "पक्षी", "फल", "चीतल का बच्चा"],
        "cleaner": ["जंगल के", "*सफ़ाईकर्मी*"],
        "loyal_rows": [("जोड़ा", "उम्र भर साथ"), ("पिछले साल के बच्चे", "नए बच्चों को पालते हैं")],
        "salute": ["*सलाम*"],
        "salute_sub": "जंगल के सबसे वफ़ादार सफ़ाईकर्मी को",
        "subscribe": "सब्सक्राइब",
        "follow": "फ़ॉलो",
    },
    "en": {
        "hook": ["Can you", "*spot him?*"],
        "scan": "SCANNING",
        "species_local": "siyaar · geedad",
        "hunter": ["*Skilled*", "hunter"],
        "diet": ["Rodents", "Birds", "Fruit", "Chital fawn"],
        "cleaner": ["Forest's", "*clean-up crew*"],
        "loyal_rows": [("Pair bond", "often for life"), ("Last year's pups", "help raise the litter")],
        "salute": ["*Salute.*"],
        "salute_sub": "to the forest's most loyal cleaner",
        "subscribe": "SUBSCRIBE",
        "follow": "FOLLOW",
    },
}

# Pause after each line, extra gap at a scene change, lead-in before the first word,
# and how long the end card holds after the last word.
PAUSE, SCENE_GAP, LEAD_IN, TAIL = 0.18, 0.28, 0.30, 2.6
