"""Story 02 "Paapad" (DI, September set 04), split into caption-sized lines.

Each line: (id, speaker, roman caption, Devanagari for the voice, speed, gap after in seconds, beat).
Speakers: K = Karun, J = Jyotsna, N = Narrator. Beats name the scene every style draws:
  open     Karun alone in the kitchen, chopping, calling for Jyotsna
  narr     narrator over the "how they cook" montage
  enter    Jyotsna storms in from the rainy balcony
  argue    the back-and-forth at the counter
  bread    the bread question, Karun heads to the fridge
  fridge   fridge door opens, the expiry date is read
  sunday   Jyotsna's "one-day divorce"
  paapad   Karun's paapad chaat peace offering, then "Karunnnn!!!"
"""

CAST = {
    "K": {"name": "Karun", "voice": "hm_omega"},
    "J": {"name": "Jyotsna", "voice": "hf_alpha"},
    "N": {"name": "Narrator", "voice": "hm_psi"},
}

LINES = [
    ("k01", "K", "Yaar! Dahi ke baad kya daalna tha?", "यार! दही के बाद क्या डालना था?", 1.1, 0.35, "open"),
    ("k02", "K", "Jyotsnaaa… Arey, Jyotsnaa… Sunooo…", "ज्योत्स्नाआ... अरे, ज्योत्स्नाआ... सुनोओ...", 1.04, 0.25, "open"),
    ("k03", "K", "Pata nahi kahan chali gayi hai.", "पता नहीं कहाँ चली गई है।", 1.16, 0.6, "open"),
    ("n01", "N", "Pyaar aur khaana, dono ek jaise hote hain.", "प्यार और खाना, दोनों एक जैसे होते हैं।", 0.97, 0.25, "narr"),
    ("n02", "N", "Ek galat decision… aur aapka saara mood kharab.", "एक गलत डिसीज़न... और आपका सारा मूड खराब।", 0.97, 0.4, "narr"),
    ("n03", "N", "Isiliye Karun, khaana banate waqt Jyotsna ki raai zaroor leta tha.", "इसीलिए करुण, खाना बनाते वक़्त ज्योत्स्ना की राय ज़रूर लेता था।", 1.0, 0.35, "narr"),
    ("n04", "N", "Starting mein toh Jyotsna ko achha lagta tha…", "स्टार्टिंग में तो ज्योत्स्ना को अच्छा लगता था...", 1.0, 0.15, "narr"),
    ("n05", "N", "ki Karun uski guidance mein khaana cook karta hai.", "कि करुण उसकी गाइडेंस में खाना कुक करता है।", 1.0, 0.3, "narr"),
    ("n06", "N", "Lekin dheere-dheere, use Karun ki ye aadat irritate karne lagi.", "लेकिन धीरे-धीरे, उसे करुण की ये आदत इरिटेट करने लगी।", 0.97, 0.6, "narr"),
    ("j01", "J", "Kya ho gaya??? Kyun chilla rahe ho?", "क्या हो गया? क्यों चिल्ला रहे हो?", 1.23, 0.2, "enter"),
    ("j02", "J", "Baarish aa rahi thi, toh balcony se kapde utaarne gayi thi.", "बारिश आ रही थी, तो बालकनी से कपड़े उतारने गई थी।", 1.23, 0.3, "enter"),
    ("k04", "K", "Main ye pooch raha tha… dahi ke baad kya daalna hai?", "मैं ये पूछ रहा था... दही के बाद क्या डालना है?", 1.1, 0.3, "argue"),
    ("j03", "J", "Karun, agar mujhe ye batana tha, toh main bana leti hoon na breakfast.", "करुण, अगर मुझे ये बताना था, तो मैं बना लेती हूँ ना ब्रेकफ़ास्ट।", 1.23, 0.15, "argue"),
    ("j04", "J", "Internet par sab padha hai, lekin nahi…", "इंटरनेट पर सब पढ़ा है, लेकिन नहीं...", 1.23, 0.1, "argue"),
    ("j05", "J", "Jyotsna ye bata do… Jyotsna ye kaisa hoga… Jyotsna…", "ज्योत्स्ना ये बता दो... ज्योत्स्ना ये कैसा होगा... ज्योत्स्ना...", 1.26, 0.35, "argue"),
    ("k05", "K", "Achha, Jyotsna ji maafi… chaubees ghante fight mode on rehta hai tumhara.", "अच्छा, ज्योत्स्ना जी माफ़ी... चौबीस घंटे फ़ाइट मोड ऑन रहता है तुम्हारा।", 1.1, 0.3, "argue"),
    ("j06", "J", "Trigger karne wale bhi toh tum hi ho.", "ट्रिगर करने वाले भी तो तुम ही हो।", 1.23, 0.3, "argue"),
    ("j07", "J", "Ye batao, Dahi ke Sholay bana rahe ho… bread rakhi hai?", "ये बताओ, दही के शोले बना रहे हो... ब्रेड रखी है?", 1.16, 0.3, "bread"),
    ("k06", "K", "Haan, fridge mein dekhi thi maine.", "हाँ, फ़्रिज में देखी थी मैंने।", 1.16, 0.3, "bread"),
    ("j08", "J", "FYI, use do mahine se bhi upar hone wala hai.", "एफ़ वाई आई, उसे दो महीने से भी ऊपर होने वाला है।", 1.21, 0.15, "bread"),
    ("j09", "J", "Ek baar expiry date dekh lena bas.", "एक बार एक्सपायरी डेट देख लेना बस।", 1.16, 1.6, "bread"),
    ("j10", "J", "Haanji??? Kya date hai expiry ki?", "हाँजी? क्या डेट है एक्सपायरी की?", 1.04, 0.6, "fridge"),
    ("k07", "K", "Mainnn… order kar leta hoon.", "मैं... ऑर्डर कर लेता हूँ।", 0.99, 0.6, "fridge"),
    ("j11", "J", "Logon ke liye Sunday sukoon ka din hota hoga…", "लोगों के लिए संडे सुकून का दिन होता होगा...", 1.1, 0.1, "sunday"),
    ("j12", "J", "mere liye jung ladne ka din.", "मेरे लिए जंग लड़ने का दिन।", 1.1, 0.3, "sunday"),
    ("j13", "J", "Mann kar raha hai tumhe ek din ka divorce de doon.", "मन कर रहा है तुम्हें एक दिन का डिवोर्स दे दूँ।", 1.1, 0.5, "sunday"),
    ("k08", "K", "Achha na baba, sorry… Dahi ke Sholay cancel.", "अच्छा ना बाबा, सॉरी... दही के शोले कैंसल।", 1.1, 0.2, "paapad"),
    ("k09", "K", "Main tumhare liye badhiya si Paapad Chaat bana ke laata hoon.", "मैं तुम्हारे लिए बढ़िया सी पापड़ चाट बना के लाता हूँ।", 1.1, 0.9, "paapad"),
    ("k10", "K", "Ahhh… waise, paapad kahan rakhe hain???", "आह... वैसे, पापड़ कहाँ रखे हैं?", 1.1, 0.25, "paapad"),
    ("j14", "J", "KARUNNNN!!!", "करुण!!", 0.94, 0.0, "paapad"),
]

# Lines with special voice treatment in the mix
FAR = {"k10"}      # Karun calling from another room
SHOUT = {"j14"}    # the final yell
