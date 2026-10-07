/**
 * Curated word lists used by the scoring engine and the risk detector.
 * They are deliberately small and transparent — every flag the score raises
 * can be traced back to a line here.
 */

/** Everyday English words: owning one as a brand is hard (low distinctiveness, crowded search). */
export const COMMON_WORDS = new Set(
  (
    'apple orange table chair house home water fire earth light dark day night sun moon star sky cloud rain river ' +
    'stone rock tree leaf wood forest field garden flower rose bloom seed root green blue red black white gold silver ' +
    'money cash bank pay card shop store market trade deal sale buy sell price cost value coin fund loan save ' +
    'food cook chef meal snack bite taste fresh spice sugar salt tea coffee cake bread milk ' +
    'book page word story news media film music song sound voice video photo image art design style ' +
    'health care doctor clinic fit body mind heart soul life live love hope dream care kind ' +
    'learn school class teach study smart skill code data cloud tech net web site link click app soft ' +
    'work job team people group club hub base camp lab studio space place spot point line ' +
    'fast quick swift rapid easy simple clear clean pure true real best prime top first next new ' +
    'go get make do take give find seek move run fly ride drive walk jump play win ' +
    'one two three ten hundred world global local city town street road way path bridge gate door key ' +
    'bright spark glow shine flash wave tide ocean sea lake island mountain peak summit edge core ' +
    'brand name logo mark sign idea plan goal mission vision quest journey'
  ).split(/\s+/),
);

/** Evocative real words that make good brand names (bonus for memorability). */
export const EVOCATIVE_WORDS = new Set(
  (
    'ember atlas orbit harbor harbour pebble lumen kite compass lantern maple cedar juniper saffron indigo ' +
    'velvet canvas meadow willow sparrow falcon otter fable echo nimbus aurora zenith vertex prism ' +
    'quill anchor beacon ripple tandem wander mosaic tapestry marble cobalt amber onyx jade ' +
    'nectar honey clove cardamom tamarind mango monsoon lotus banyan peacock tiger chai masala'
  ).split(/\s+/),
);

/** Suffixes/prefixes that make a name feel generic in 2020s startup naming. */
export const GENERIC_AFFIXES = {
  suffixes: ['ly', 'ify', 'hub', 'labs', 'tech', 'soft', 'sys', 'ware', 'pro', 'app', 'solutions', 'global', 'world', 'online', 'digital', 'zone', 'mart'],
  prefixes: ['get', 'my', 'the', 'go', 'try', 'use', 'i', 'e'],
};

/**
 * Well-known brands — names one edit away invite confusion (and trademark trouble).
 * India-first list plus global giants.
 */
export const FAMOUS_BRANDS = (
  'google amazon apple meta facebook instagram whatsapp youtube netflix spotify uber airbnb tesla nike adidas ' +
  'microsoft openai anthropic nvidia intel samsung sony oracle stripe shopify canva notion slack zoom figma ' +
  'zomato swiggy flipkart paytm phonepe razorpay zerodha groww nykaa myntra meesho ola oyo byjus unacademy ' +
  'reliance jio tata infosys wipro airtel cred dunzo zepto blinkit lenskart boat mamaearth sugar urbanclap ' +
  'amul britannia haldiram dabur patanjali titan tanishq asian maruti mahindra bajaj hero'
).split(/\s+/);

/**
 * Words with negative, vulgar or unfortunate meanings in widely spoken languages.
 * Matched as whole words for short entries and as substrings for longer ones.
 * Lang codes: en, hi (Hindi/Hinglish), es, fr, de, pt, it, ar (transliterated).
 */
export const RISKY_WORDS: Array<{ word: string; lang: string; meaning: string; substring?: boolean }> = [
  { word: 'gift', lang: 'de', meaning: 'poison (German)' },
  { word: 'mist', lang: 'de', meaning: 'dung / rubbish (German)' },
  { word: 'kot', lang: 'de', meaning: 'excrement (German)' },
  { word: 'lodu', lang: 'hi', meaning: 'vulgar slang (Hindi)', substring: true },
  { word: 'loda', lang: 'hi', meaning: 'vulgar slang (Hindi)', substring: true },
  { word: 'lavda', lang: 'hi', meaning: 'vulgar (Hindi)', substring: true },
  { word: 'chod', lang: 'hi', meaning: 'vulgar (Hindi)', substring: true },
  { word: 'gandu', lang: 'hi', meaning: 'vulgar slur (Hindi)', substring: true },
  { word: 'tatti', lang: 'hi', meaning: 'excrement (Hindi)', substring: true },
  { word: 'harami', lang: 'hi', meaning: 'slur (Hindi)', substring: true },
  { word: 'kamina', lang: 'hi', meaning: 'insult (Hindi)', substring: true },
  { word: 'saala', lang: 'hi', meaning: 'mild insult (Hindi)' },
  { word: 'bewakoof', lang: 'hi', meaning: 'fool (Hindi)', substring: true },
  { word: 'fuk', lang: 'en', meaning: 'reads as vulgar (English)', substring: true },
  { word: 'fux', lang: 'en', meaning: 'reads as vulgar (English)', substring: true },
  { word: 'fuc', lang: 'en', meaning: 'reads as vulgar (English)', substring: true },
  { word: 'cum', lang: 'en', meaning: 'vulgar reading (English)' },
  { word: 'poo', lang: 'en', meaning: 'excrement (English)' },
  { word: 'pee', lang: 'en', meaning: 'urine (English)' },
  { word: 'butt', lang: 'en', meaning: 'unfortunate reading (English)', substring: true },
  { word: 'puta', lang: 'es', meaning: 'vulgar slur (Spanish/Portuguese)', substring: true },
  { word: 'mierda', lang: 'es', meaning: 'vulgar (Spanish)', substring: true },
  { word: 'caca', lang: 'es', meaning: 'excrement (Spanish/French)' },
  { word: 'merde', lang: 'fr', meaning: 'vulgar (French)', substring: true },
  { word: 'con', lang: 'fr', meaning: 'idiot (French slang)' },
  { word: 'nova', lang: 'es', meaning: '"no va" — "doesn\'t go" (Spanish folk reading)' },
  { word: 'chut', lang: 'hi', meaning: 'vulgar (Hindi)', substring: true },
  { word: 'gaand', lang: 'hi', meaning: 'vulgar (Hindi)', substring: true },
  { word: 'lund', lang: 'hi', meaning: 'vulgar (Hindi)', substring: true },
  { word: 'bhosd', lang: 'hi', meaning: 'vulgar (Hindi)', substring: true },
  { word: 'randi', lang: 'hi', meaning: 'slur (Hindi)', substring: true },
  { word: 'kutta', lang: 'hi', meaning: 'dog — used as an insult (Hindi)' },
  { word: 'ullu', lang: 'hi', meaning: 'owl — slang for fool (Hindi)' },
  { word: 'gadha', lang: 'hi', meaning: 'donkey — slang for fool (Hindi)' },
  { word: 'chor', lang: 'hi', meaning: 'thief (Hindi)' },
  { word: 'bakwas', lang: 'hi', meaning: 'nonsense (Hindi)' },
  { word: 'pagal', lang: 'hi', meaning: 'crazy (Hindi)' },
  { word: 'maut', lang: 'hi', meaning: 'death (Hindi)' },
  { word: 'kaala', lang: 'hi', meaning: 'black — can read as colourist (Hindi)' },
  { word: 'jhoot', lang: 'hi', meaning: 'lie (Hindi)' },
  { word: 'fuck', lang: 'en', meaning: 'vulgar (English)', substring: true },
  { word: 'shit', lang: 'en', meaning: 'vulgar (English)', substring: true },
  { word: 'cunt', lang: 'en', meaning: 'vulgar (English)', substring: true },
  { word: 'dick', lang: 'en', meaning: 'vulgar (English)', substring: true },
  { word: 'cock', lang: 'en', meaning: 'vulgar (English)', substring: true },
  { word: 'anal', lang: 'en', meaning: 'unfortunate reading (English)', substring: true },
  { word: 'rape', lang: 'en', meaning: 'violent meaning (English)', substring: true },
  { word: 'nazi', lang: 'en', meaning: 'hate association', substring: true },
  { word: 'dead', lang: 'en', meaning: 'death association (English)' },
  { word: 'kill', lang: 'en', meaning: 'violent association (English)', substring: true },
  { word: 'scam', lang: 'en', meaning: 'fraud association (English)', substring: true },
  { word: 'fake', lang: 'en', meaning: 'trust risk (English)', substring: true },
  { word: 'crap', lang: 'en', meaning: 'vulgar (English)', substring: true },
  { word: 'kus', lang: 'ar', meaning: 'vulgar (Arabic)' },
  { word: 'shaitan', lang: 'ar', meaning: 'devil (Arabic/Hindi)', substring: true },
  { word: 'cazzo', lang: 'it', meaning: 'vulgar (Italian)', substring: true },
  { word: 'porra', lang: 'pt', meaning: 'vulgar (Portuguese)', substring: true },
  { word: 'pene', lang: 'es', meaning: 'anatomical (Spanish)' },
  { word: 'shi', lang: 'zh', meaning: 'sounds like "death" (si) in some contexts — check' },
  { word: 'shini', lang: 'ja', meaning: '"death" (Japanese)', substring: true },
];

/** Category concepts — used by the offline generator and for keyword relevance. */
export const CONCEPTS: Record<string, string[]> = {
  ai: ['mind', 'neur', 'synth', 'logic', 'cogn', 'sense', 'lumen', 'axon', 'cortex', 'mesh', 'signal', 'vector', 'prism', 'nova', 'think'],
  saas: ['flow', 'stack', 'loop', 'grid', 'sync', 'base', 'deck', 'desk', 'pilot', 'craft', 'works', 'beam', 'rally', 'relay'],
  fintech: ['ledg', 'coin', 'vault', 'mint', 'fund', 'rupee', 'paisa', 'credit', 'trust', 'wealth', 'nidhi', 'kosh', 'abacus', 'tally'],
  fashion: ['thread', 'loom', 'weave', 'stitch', 'drape', 'silk', 'khadi', 'hem', 'muse', 'vogue', 'cotton', 'indigo', 'velvet'],
  media: ['echo', 'story', 'frame', 'reel', 'cast', 'signal', 'canvas', 'lens', 'pulse', 'wave', 'kahani', 'awaaz'],
  food: ['bite', 'spice', 'tadka', 'masala', 'chai', 'thali', 'crumb', 'zest', 'ghee', 'saffron', 'tiffin', 'harvest', 'mango'],
  healthcare: ['care', 'vita', 'pulse', 'cura', 'heal', 'arogya', 'prana', 'well', 'balm', 'kind', 'nurse', 'aayu'],
  education: ['learn', 'gyan', 'vidya', 'mentor', 'quill', 'scholar', 'spark', 'path', 'guru', 'bloom', 'atlas', 'shiksha'],
  creator: ['studio', 'reel', 'muse', 'canvas', 'echo', 'clip', 'creat', 'spark', 'stage', 'tribe', 'loop'],
  consumer: ['joy', 'home', 'daily', 'kind', 'nest', 'glow', 'hearth', 'ghar', 'bloom', 'pebble', 'cozy'],
  'e-commerce': ['cart', 'bazaar', 'haat', 'mandi', 'parcel', 'shelf', 'crate', 'souk', 'basket', 'store'],
  consulting: ['north', 'compass', 'atlas', 'counsel', 'summit', 'bridge', 'insight', 'meridian', 'anchor', 'sage'],
  candle: ['glow', 'wick', 'ember', 'lume', 'flicker', 'haze', 'diya', 'jyoti', 'ember', 'wax'],
  sustainable: ['leaf', 'terra', 'verde', 'root', 'bloom', 'prithvi', 'green', 'grove', 'moss', 'seed'],
  travel: ['yatra', 'roam', 'wander', 'nomad', 'atlas', 'compass', 'safar', 'trail', 'voyage'],
  fitness: ['pulse', 'stride', 'flex', 'core', 'prana', 'tempo', 'kinetic', 'surge', 'vigor'],
  pets: ['paw', 'wag', 'purr', 'fetch', 'tail', 'whisker', 'bark'],
  beauty: ['glow', 'dew', 'bloom', 'rasa', 'ubtan', 'velvet', 'lumi', 'petal', 'kesar'],
  support: ['reply', 'helpdesk', 'assist', 'answer', 'ticket', 'sahay', 'saathi', 'mitra'],
  freelance: ['solo', 'gig', 'craft', 'free', 'indie', 'swift', 'invoice'],
};

/**
 * Indian-language roots that travel well. Each carries its meaning so the
 * generator can explain itself.
 */
export const INDIAN_ROOTS: Array<{ root: string; meaning: string; lang: string }> = [
  { root: 'tara', meaning: 'star', lang: 'Sanskrit' },
  { root: 'veda', meaning: 'knowledge', lang: 'Sanskrit' },
  { root: 'nidhi', meaning: 'treasure', lang: 'Sanskrit' },
  { root: 'prana', meaning: 'life force', lang: 'Sanskrit' },
  { root: 'sutra', meaning: 'thread / formula', lang: 'Sanskrit' },
  { root: 'dhara', meaning: 'stream', lang: 'Sanskrit' },
  { root: 'jyoti', meaning: 'light', lang: 'Sanskrit' },
  { root: 'kala', meaning: 'art', lang: 'Sanskrit' },
  { root: 'rasa', meaning: 'essence / flavour', lang: 'Sanskrit' },
  { root: 'mitra', meaning: 'friend', lang: 'Sanskrit' },
  { root: 'yatra', meaning: 'journey', lang: 'Hindi' },
  { root: 'neev', meaning: 'foundation', lang: 'Hindi' },
  { root: 'ankur', meaning: 'sprout', lang: 'Sanskrit' },
  { root: 'disha', meaning: 'direction', lang: 'Hindi' },
  { root: 'akash', meaning: 'sky', lang: 'Sanskrit' },
  { root: 'agni', meaning: 'fire', lang: 'Sanskrit' },
  { root: 'vayu', meaning: 'wind', lang: 'Sanskrit' },
  { root: 'saathi', meaning: 'companion', lang: 'Hindi' },
  { root: 'kosh', meaning: 'treasury', lang: 'Sanskrit' },
  { root: 'shakti', meaning: 'power', lang: 'Sanskrit' },
  { root: 'kiran', meaning: 'ray of light', lang: 'Sanskrit' },
  { root: 'zara', meaning: 'a little', lang: 'Hindi/Urdu' },
  { root: 'naya', meaning: 'new', lang: 'Hindi' },
  { root: 'tez', meaning: 'swift', lang: 'Hindi' },
  { root: 'saral', meaning: 'simple', lang: 'Hindi' },
  { root: 'rangi', meaning: 'colourful', lang: 'Hindi' },
  { root: 'mela', meaning: 'fair / gathering', lang: 'Hindi' },
  { root: 'dhun', meaning: 'tune', lang: 'Hindi' },
  { root: 'chhaya', meaning: 'shade', lang: 'Sanskrit' },
  { root: 'aarambh', meaning: 'beginning', lang: 'Sanskrit' },
  { root: 'udaan', meaning: 'flight', lang: 'Hindi' },
  { root: 'sona', meaning: 'gold', lang: 'Hindi' },
  { root: 'chakra', meaning: 'wheel', lang: 'Sanskrit' },
  { root: 'manthan', meaning: 'churning of ideas', lang: 'Sanskrit' },
  { root: 'kavya', meaning: 'poetry', lang: 'Sanskrit' },
  { root: 'ira', meaning: 'earth', lang: 'Sanskrit' },
];
